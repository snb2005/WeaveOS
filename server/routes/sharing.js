const express = require('express');
const Joi = require('joi');
const File = require('../models/File');
const User = require('../models/User');
const { checkFilePermission } = require('../middleware/auth');

const router = express.Router();

// Validation schemas
const shareFileSchema = Joi.object({
  userId: Joi.string().required(),
  permissions: Joi.object({
    read: Joi.boolean().default(true),
    write: Joi.boolean().default(false),
    delete: Joi.boolean().default(false)
  }).required()
});

const shareByEmailSchema = Joi.object({
  email: Joi.string().email().required(),
  permissions: Joi.object({
    read: Joi.boolean().default(true),
    write: Joi.boolean().default(false),
    delete: Joi.boolean().default(false)
  }).required()
});

// @route   POST /api/sharing/:id/share
// @desc    Share a file with another user
// @access  Private
router.post('/:id/share', checkFilePermission('share'), async (req, res) => {
  try {
    const { error, value } = shareFileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }

    const file = req.file;
    const { userId, permissions } = value;

    // Check if target user exists
    const targetUser = await User.findById(userId);
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        error: 'User not found or inactive'
      });
    }

    // Don't allow sharing with self
    if (userId === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Cannot share file with yourself'
      });
    }

    // Share the file
    await file.shareWith(userId, permissions, req.user._id);

    res.json({
      message: 'File shared successfully',
      sharedWith: {
        user: {
          id: targetUser._id,
          username: targetUser.username,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName
        },
        permissions: permissions,
        sharedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Share file error:', error);
    res.status(500).json({
      error: 'Internal server error while sharing file'
    });
  }
});

// @route   POST /api/sharing/:id/share-by-email
// @desc    Share a file with another user by email
// @access  Private
router.post('/:id/share-by-email', checkFilePermission('share'), async (req, res) => {
  try {
    const { error, value } = shareByEmailSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }

    const file = req.file;
    const { email, permissions } = value;

    // Find user by email
    const targetUser = await User.findOne({ email: email.toLowerCase() });
    if (!targetUser || !targetUser.isActive) {
      return res.status(404).json({
        error: 'User with this email not found or inactive'
      });
    }

    // Don't allow sharing with self
    if (targetUser._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        error: 'Cannot share file with yourself'
      });
    }

    // Share the file
    await file.shareWith(targetUser._id, permissions, req.user._id);

    res.json({
      message: 'File shared successfully',
      sharedWith: {
        user: {
          id: targetUser._id,
          username: targetUser.username,
          email: targetUser.email,
          firstName: targetUser.firstName,
          lastName: targetUser.lastName
        },
        permissions: permissions,
        sharedAt: new Date()
      }
    });

  } catch (error) {
    console.error('Share file by email error:', error);
    res.status(500).json({
      error: 'Internal server error while sharing file'
    });
  }
});

// @route   DELETE /api/sharing/:id/revoke/:userId
// @desc    Revoke file sharing for a user
// @access  Private
router.delete('/:id/revoke/:userId', checkFilePermission('share'), async (req, res) => {
  try {
    const file = req.file;
    const { userId } = req.params;

    // Check if file is actually shared with this user
    const sharedPermission = file.sharedWith.find(
      share => share.user.toString() === userId
    );

    if (!sharedPermission) {
      return res.status(404).json({
        error: 'File is not shared with this user'
      });
    }

    // Revoke sharing
    await file.revokeShare(userId);

    res.json({
      message: 'File sharing revoked successfully'
    });

  } catch (error) {
    console.error('Revoke sharing error:', error);
    res.status(500).json({
      error: 'Internal server error while revoking file sharing'
    });
  }
});

// @route   PUT /api/sharing/:id/permissions/:userId
// @desc    Update sharing permissions for a user
// @access  Private
router.put('/:id/permissions/:userId', checkFilePermission('share'), async (req, res) => {
  try {
    const { error, value } = shareFileSchema.validate({
      userId: req.params.userId,
      permissions: req.body.permissions
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }

    const file = req.file;
    const { userId, permissions } = value;

    // Check if file is actually shared with this user
    const sharedPermissionIndex = file.sharedWith.findIndex(
      share => share.user.toString() === userId
    );

    if (sharedPermissionIndex === -1) {
      return res.status(404).json({
        error: 'File is not shared with this user'
      });
    }

    // Update permissions
    file.sharedWith[sharedPermissionIndex].permissions = permissions;
    await file.save();

    res.json({
      message: 'Sharing permissions updated successfully',
      permissions: permissions
    });

  } catch (error) {
    console.error('Update sharing permissions error:', error);
    res.status(500).json({
      error: 'Internal server error while updating sharing permissions'
    });
  }
});

// @route   GET /api/sharing/shared-with-me
// @desc    Get files shared with the current user
// @access  Private
router.get('/shared-with-me', async (req, res) => {
  try {
    const { limit = 50, page = 1, sortBy = 'sharedAt', sortOrder = 'desc' } = req.query;

    // Find files shared with the current user
    const files = await File.find({
      'sharedWith.user': req.user._id,
      isDeleted: false
    })
    .populate('owner', 'username firstName lastName')
    .populate('sharedWith.user', 'username firstName lastName')
    .populate('sharedWith.sharedBy', 'username firstName lastName')
    .sort({ 
      [`sharedWith.sharedAt`]: sortOrder === 'desc' ? -1 : 1 
    })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalFiles = await File.countDocuments({
      'sharedWith.user': req.user._id,
      isDeleted: false
    });

    // Extract sharing information for each file
    const sharedFiles = files.map(file => {
      const shareInfo = file.sharedWith.find(
        share => share.user._id.toString() === req.user._id.toString()
      );

      return {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        isDirectory: file.isDirectory,
        owner: file.owner,
        permissions: shareInfo.permissions,
        sharedAt: shareInfo.sharedAt,
        sharedBy: shareInfo.sharedBy,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        hasReadPermission: shareInfo.permissions.read,
        hasWritePermission: shareInfo.permissions.write,
        hasDeletePermission: shareInfo.permissions.delete,
        hasSharePermission: false // Shared users cannot share further by default
      };
    });

    res.json({
      files: sharedFiles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFiles / limit),
        totalFiles,
        hasNextPage: page < Math.ceil(totalFiles / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get shared files error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching shared files'
    });
  }
});

// @route   GET /api/sharing/shared-by-me
// @desc    Get files shared by the current user
// @access  Private
router.get('/shared-by-me', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;

    // Find files owned by current user that are shared with others
    const files = await File.find({
      owner: req.user._id,
      'sharedWith.0': { $exists: true }, // Has at least one share
      isDeleted: false
    })
    .populate('sharedWith.user', 'username firstName lastName')
    .sort({ updatedAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit);

    const totalFiles = await File.countDocuments({
      owner: req.user._id,
      'sharedWith.0': { $exists: true },
      isDeleted: false
    });

    const sharedFiles = files.map(file => ({
      id: file._id,
      filename: file.filename,
      originalName: file.originalName,
      path: file.path,
      size: file.size,
      mimeType: file.mimeType,
      isDirectory: file.isDirectory,
      sharedWith: file.sharedWith,
      createdAt: file.createdAt,
      updatedAt: file.updatedAt,
      shareCount: file.sharedWith.length
    }));

    res.json({
      files: sharedFiles,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFiles / limit),
        totalFiles,
        hasNextPage: page < Math.ceil(totalFiles / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get files shared by me error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching files shared by you'
    });
  }
});

// @route   GET /api/sharing/:id/shares
// @desc    Get all shares for a specific file
// @access  Private
router.get('/:id/shares', checkFilePermission('share'), async (req, res) => {
  try {
    const file = req.file;

    await file.populate('sharedWith.user', 'username firstName lastName email');
    await file.populate('sharedWith.sharedBy', 'username firstName lastName');

    res.json({
      file: {
        id: file._id,
        filename: file.filename,
        path: file.path
      },
      shares: file.sharedWith.map(share => ({
        user: share.user,
        permissions: share.permissions,
        sharedAt: share.sharedAt,
        sharedBy: share.sharedBy
      }))
    });

  } catch (error) {
    console.error('Get file shares error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching file shares'
    });
  }
});

module.exports = router;
