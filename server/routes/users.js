const express = require('express');
const User = require('../models/User');
const { requireAdmin } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/users/search
// @desc    Search for users (for sharing purposes)
// @access  Private
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || q.length < 2) {
      return res.status(400).json({
        error: 'Search query must be at least 2 characters long'
      });
    }

    const users = await User.find({
      $and: [
        { _id: { $ne: req.user._id } }, // Exclude current user
        { isActive: true },
        {
          $or: [
            { username: { $regex: q, $options: 'i' } },
            { firstName: { $regex: q, $options: 'i' } },
            { lastName: { $regex: q, $options: 'i' } },
            { email: { $regex: q, $options: 'i' } }
          ]
        }
      ]
    })
    .select('username firstName lastName email')
    .limit(parseInt(limit));

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        displayName: `${user.firstName} ${user.lastName} (${user.username})`
      }))
    });

  } catch (error) {
    console.error('User search error:', error);
    res.status(500).json({
      error: 'Internal server error while searching users'
    });
  }
});

// @route   GET /api/users/profile
// @desc    Get current user's profile
// @access  Private
router.get('/profile', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        role: user.role,
        storageQuota: user.storageQuota,
        storageUsed: user.storageUsed,
        storageUsagePercent: user.getStorageUsagePercent(),
        preferences: user.preferences,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching profile'
    });
  }
});

// @route   PUT /api/users/profile
// @desc    Update current user's profile
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const allowedUpdates = ['firstName', 'lastName', 'preferences'];
    const updates = {};

    for (const key of allowedUpdates) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        error: 'No valid fields to update'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    );

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        preferences: user.preferences
      }
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      error: 'Internal server error while updating profile'
    });
  }
});

// @route   GET /api/users/storage
// @desc    Get current user's storage information
// @access  Private
router.get('/storage', async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    res.json({
      storage: {
        used: user.storageUsed,
        quota: user.storageQuota,
        usagePercent: user.getStorageUsagePercent(),
        available: user.storageQuota - user.storageUsed,
        formattedUsed: formatBytes(user.storageUsed),
        formattedQuota: formatBytes(user.storageQuota),
        formattedAvailable: formatBytes(user.storageQuota - user.storageUsed)
      }
    });

  } catch (error) {
    console.error('Get storage info error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching storage information'
    });
  }
});

// Admin routes

// @route   GET /api/users/admin/all
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status } = req.query;

    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    // Status filter
    if (status === 'active') {
      query.isActive = true;
    } else if (status === 'inactive') {
      query.isActive = false;
    }

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const totalUsers = await User.countDocuments(query);

    res.json({
      users: users.map(user => ({
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isActive: user.isActive,
        storageUsed: user.storageUsed,
        storageQuota: user.storageQuota,
        storageUsagePercent: user.getStorageUsagePercent(),
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalUsers / limit),
        totalUsers,
        hasNextPage: page < Math.ceil(totalUsers / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching users'
    });
  }
});

// @route   PUT /api/users/admin/:id/status
// @desc    Update user status (Admin only)
// @access  Private/Admin
router.put('/admin/:id/status', requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      return res.status(400).json({
        error: 'isActive must be a boolean value'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      user: {
        id: user._id,
        username: user.username,
        isActive: user.isActive
      }
    });

  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      error: 'Internal server error while updating user status'
    });
  }
});

// @route   PUT /api/users/admin/:id/quota
// @desc    Update user storage quota (Admin only)
// @access  Private/Admin
router.put('/admin/:id/quota', requireAdmin, async (req, res) => {
  try {
    const { storageQuota } = req.body;

    if (!storageQuota || storageQuota < 0) {
      return res.status(400).json({
        error: 'Storage quota must be a positive number'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { storageQuota },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({
        error: 'User not found'
      });
    }

    res.json({
      message: 'Storage quota updated successfully',
      user: {
        id: user._id,
        username: user.username,
        storageQuota: user.storageQuota,
        storageUsed: user.storageUsed,
        storageUsagePercent: user.getStorageUsagePercent()
      }
    });

  } catch (error) {
    console.error('Update storage quota error:', error);
    res.status(500).json({
      error: 'Internal server error while updating storage quota'
    });
  }
});

// Utility function to format bytes
function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

module.exports = router;
