const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const Joi = require('joi');
const File = require('../models/File');
const { checkFilePermission } = require('../middleware/auth');

const router = express.Router();

// GridFS setup using Mongoose connection
let gfsBucket;
mongoose.connection.once('open', () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: 'uploads'
  });
});

// Multer configuration for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // Add file type restrictions if needed
    cb(null, true);
  }
});

// Validation schemas
const createFolderSchema = Joi.object({
  name: Joi.string().min(1).max(255).required(),
  path: Joi.string().required()
});

const moveFileSchema = Joi.object({
  newPath: Joi.string().required()
});

const renameFileSchema = Joi.object({
  newName: Joi.string().min(1).max(255).required()
});

// @route   GET /api/files
// @desc    Get files and folders for the current user
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { path = '/', search, type, limit = 50, page = 1, sortBy = 'name', sortOrder = 'asc' } = req.query;
    
    // Build query
    let query = {
      isDeleted: false,
      $or: [
        { owner: req.user._id },
        { 'sharedWith.user': req.user._id }
      ]
    };

    // Filter by path - show files in the requested directory
    if (path !== '/') {
      // Clean the path - ensure it starts with / and doesn't end with /
      let cleanPath = path.startsWith('/') ? path : `/${path}`;
      if (cleanPath.endsWith('/') && cleanPath !== '/') {
        cleanPath = cleanPath.slice(0, -1);
      }
      
      // Query for files where the path field exactly matches the requested directory
      // This means we're looking for files that have this directory as their parent
      query.path = cleanPath;
    } else {
      // Show user's home directory root - files where path is "/"
      query.path = '/';
    }

    console.log(`🔍 Query for path "${path}":`, JSON.stringify(query, null, 2));

    // Search filter
    if (search) {
      query.$text = { $search: search };
    }

    // Type filter
    if (type === 'folder') {
      query.isDirectory = true;
    } else if (type === 'file') {
      query.isDirectory = false;
    }

    // Sort options
    const sortOptions = {};
    if (sortBy === 'name') {
      sortOptions.filename = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'date') {
      sortOptions.updatedAt = sortOrder === 'desc' ? -1 : 1;
    } else if (sortBy === 'size') {
      sortOptions.size = sortOrder === 'desc' ? -1 : 1;
    }

    // Always sort directories first
    sortOptions.isDirectory = -1;

    const files = await File.find(query)
      .populate('owner', 'username firstName lastName')
      .populate('sharedWith.user', 'username firstName lastName')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit);

    console.log(`📁 Found ${files.length} files for path "${path}"`);
    files.forEach(file => {
      console.log(`  - ${file.filename} (path: ${file.path}, isDirectory: ${file.isDirectory})`);
    });

    const totalFiles = await File.countDocuments(query);

    res.json({
      files: files.map(file => ({
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        isDirectory: file.isDirectory,
        owner: file.owner,
        permissions: file.permissions,
        sharedWith: file.sharedWith,
        tags: file.tags,
        metadata: file.metadata,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        hasReadPermission: file.hasPermission(req.user._id, 'read'),
        hasWritePermission: file.hasPermission(req.user._id, 'write'),
        hasDeletePermission: file.hasPermission(req.user._id, 'delete'),
        hasSharePermission: file.hasPermission(req.user._id, 'share')
      })),
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalFiles / limit),
        totalFiles,
        hasNextPage: page < Math.ceil(totalFiles / limit),
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    console.error('Get files error:', error);
    res.status(500).json({
      error: 'Internal server error while fetching files'
    });
  }
});

// @route   POST /api/files/upload
// @desc    Upload a file
// @access  Private
router.post('/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: 'No file provided'
      });
    }

    const { path = `/${req.user.username}`, overwrite = false } = req.body;

    console.log(`📤 Upload request - file: ${req.file.originalname}, path: ${path}, user: ${req.user.username}`);

    // Check storage quota
    if (!req.user.hasStorageSpace(req.file.size)) {
      return res.status(413).json({
        error: 'Storage quota exceeded',
        storageUsed: req.user.storageUsed,
        storageQuota: req.user.storageQuota
      });
    }

    // Check if file already exists
    const existingFile = await File.findOne({
      filename: req.file.originalname,
      path: path,
      owner: req.user._id,
      isDeleted: false
    });

    if (existingFile && !overwrite) {
      return res.status(409).json({
        error: 'File already exists',
        message: 'A file with this name already exists. Use overwrite=true to replace it.'
      });
    }

    try {
      // Use GridFS for all files to optimize storage and scale better
      let gridFSId = null;
      let fileContent = null; // Keep this null for GridFS files

      console.log(`💾 Storing file in GridFS - size: ${req.file.size} bytes`);
      
      // Upload file to GridFS
      const uploadStream = gfsBucket.openUploadStream(req.file.originalname, {
        metadata: {
          originalName: req.file.originalname,
          path: path,
          owner: req.user._id,
          mimeType: req.file.mimetype,
          uploadedAt: new Date()
        }
      });

      // Create a promise to handle the upload
      const uploadPromise = new Promise((resolve, reject) => {
        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
          gridFSId = uploadStream.id;
          console.log(`✅ File uploaded to GridFS with ID: ${gridFSId}`);
          resolve(gridFSId);
        });
      });

      // Write the buffer to GridFS
      uploadStream.end(req.file.buffer);
      
      // Wait for upload to complete
      await uploadPromise;

      // If overwriting, delete old file
      if (existingFile) {
        await existingFile.remove();
        await req.user.updateStorageUsage(-existingFile.size);
      }

      // Create file document
      const fileDoc = new File({
        filename: req.file.originalname,
        originalName: req.file.originalname,
        path: path,
        size: req.file.size,
        mimeType: req.file.mimetype,
        owner: req.user._id,
        gridFSId: gridFSId,
        isDirectory: false,
        // No content field - using GridFS
        metadata: {
          lastModifiedBy: req.user._id,
          encoding: req.file.encoding
        }
      });

      console.log(`📄 Creating file document - filename: ${fileDoc.filename}, gridFSId: ${gridFSId}`);

      await fileDoc.save();
      console.log(`💾 File saved - filename: ${fileDoc.filename}, path: ${fileDoc.path}, id: ${fileDoc._id}, gridFSId: ${gridFSId}`);
      await req.user.updateStorageUsage(req.file.size);

      res.status(201).json({
        message: 'File uploaded successfully',
        file: {
          id: fileDoc._id,
          filename: fileDoc.filename,
          originalName: fileDoc.originalName,
          path: fileDoc.path,
          size: fileDoc.size,
          mimeType: fileDoc.mimeType,
          isDirectory: fileDoc.isDirectory,
          createdAt: fileDoc.createdAt
        }
      });

    } catch (storageError) {
      console.error('File storage error:', storageError);
      res.status(500).json({
        error: 'Error storing file'
      });
    }

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      error: 'Internal server error during file upload'
    });
  }
});

// @route   GET /api/files/:id/content
// @desc    Get file content for editing (text files only)
// @access  Private
router.get('/:id/content', checkFilePermission('read'), async (req, res) => {
  try {
    const file = req.file;

    console.log(`📖 Content request for file: ${file.filename}, mimeType: ${file.mimeType}`);

    if (file.isDirectory) {
      return res.status(400).json({
        error: 'Cannot get content of a directory'
      });
    }

    // Check if it's a text file
    const isTextFile = file.mimeType.startsWith('text/') || 
                      file.mimeType === 'application/json' ||
                      file.mimeType === 'application/javascript' ||
                      file.mimeType === 'application/xml' ||
                      ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.xml', '.html', '.css', '.scss', '.py', '.java', '.cpp', '.c', '.php'].some(ext => 
                        file.filename.toLowerCase().endsWith(ext)
                      );

    if (!isTextFile) {
      return res.status(400).json({
        error: 'File is not a text file'
      });
    }

    // Get content from GridFS or database
    if (file.gridFSId) {
      console.log(`📤 Reading file content from GridFS: ${file.gridFSId}`);
      
      const downloadStream = gfsBucket.openDownloadStream(file.gridFSId);
      let content = '';

      downloadStream.on('data', (chunk) => {
        content += chunk.toString('utf8');
      });

      downloadStream.on('end', () => {
        res.json({
          content: content,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimeType: file.mimeType
        });
      });

      downloadStream.on('error', (error) => {
        console.error('Content stream error:', error);
        res.status(500).json({
          error: 'Error reading file content'
        });
      });
    } else if (file.content) {
      console.log(`📤 Reading file content from database (legacy)`);
      // Legacy support for files stored as base64 content
      const buffer = Buffer.from(file.content, 'base64');
      const content = buffer.toString('utf8');
      
      res.json({
        content: content,
        filename: file.filename,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType
      });
    } else {
      console.log(`❌ File content not found for file: ${file.filename}`);
      res.status(404).json({
        error: 'File content not found'
      });
    }

  } catch (error) {
    console.error('Get content error:', error);
    res.status(500).json({
      error: 'Internal server error while getting file content'
    });
  }
});

// @route   GET /api/files/:id/download
// @desc    Download a file
// @access  Private
router.get('/:id/download', checkFilePermission('read'), async (req, res) => {
  try {
    const file = req.file;

    console.log(`📥 Download request for file: ${file.filename}, isDirectory: ${file.isDirectory}, hasContent: ${!!file.content}, hasGridFSId: ${!!file.gridFSId}, mimeType: ${file.mimeType}`);

    if (file.isDirectory) {
      console.log(`❌ Cannot download directory: ${file.filename}`);
      return res.status(400).json({
        error: 'Cannot download a directory'
      });
    }

    // Set response headers
    res.set({
      'Content-Type': file.mimeType,
      'Content-Disposition': `attachment; filename="${file.originalName}"`,
      'Content-Length': file.size
    });

    // Check if file has GridFS ID
    if (file.gridFSId) {
      console.log(`📤 Streaming file from GridFS: ${file.gridFSId}`);
      // Create download stream from GridFS
      const downloadStream = gfsBucket.openDownloadStream(file.gridFSId);

      downloadStream.on('error', (error) => {
        console.error('Download stream error:', error);
        res.status(500).json({
          error: 'Error downloading file'
        });
      });

      downloadStream.pipe(res);
    } else if (file.content) {
      console.log(`📤 Sending file content directly from database (${file.content.length} chars) - Legacy support`);
      // Legacy support for files stored as base64 content
      const buffer = Buffer.from(file.content, 'base64');
      res.send(buffer);
    } else {
      console.log(`❌ File content not found - no content or gridFSId for file: ${file.filename}`);
      res.status(404).json({
        error: 'File content not found'
      });
    }

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({
      error: 'Internal server error during file download'
    });
  }
});

// @route   PUT /api/files/:id/content
// @desc    Update file content (text files only)
// @access  Private
router.put('/:id/content', checkFilePermission('write'), async (req, res) => {
  try {
    const file = req.file;
    const { content } = req.body;

    console.log(`✏️ Content update request for file: ${file.filename}`);

    if (file.isDirectory) {
      return res.status(400).json({
        error: 'Cannot update content of a directory'
      });
    }

    if (typeof content !== 'string') {
      return res.status(400).json({
        error: 'Content must be a string'
      });
    }

    // Check if it's a text file
    const isTextFile = file.mimeType.startsWith('text/') || 
                      file.mimeType === 'application/json' ||
                      file.mimeType === 'application/javascript' ||
                      file.mimeType === 'application/xml' ||
                      ['.txt', '.md', '.js', '.ts', '.jsx', '.tsx', '.json', '.xml', '.html', '.css', '.scss', '.py', '.java', '.cpp', '.c', '.php'].some(ext => 
                        file.filename.toLowerCase().endsWith(ext)
                      );

    if (!isTextFile) {
      return res.status(400).json({
        error: 'File is not a text file'
      });
    }

    try {
      // Delete old GridFS file if it exists
      if (file.gridFSId) {
        console.log(`🗑️ Deleting old file from GridFS: ${file.gridFSId}`);
        try {
          await gfsBucket.delete(file.gridFSId);
        } catch (deleteError) {
          console.log(`Note: Old file not found in GridFS: ${file.gridFSId}`);
        }
      }

      // Upload new content to GridFS
      const contentBuffer = Buffer.from(content, 'utf8');
      
      const uploadStream = gfsBucket.openUploadStream(file.filename, {
        metadata: {
          originalName: file.originalName,
          path: file.path,
          owner: file.owner,
          mimeType: file.mimeType,
          updatedAt: new Date()
        }
      });

      const uploadPromise = new Promise((resolve, reject) => {
        uploadStream.on('error', reject);
        uploadStream.on('finish', () => {
          console.log(`✅ Updated content uploaded to GridFS with ID: ${uploadStream.id}`);
          resolve(uploadStream.id);
        });
      });

      uploadStream.end(contentBuffer);
      const newGridFSId = await uploadPromise;

      // Update file document
      const oldSize = file.size;
      file.gridFSId = newGridFSId;
      file.size = contentBuffer.length;
      file.content = undefined; // Remove content field if it exists
      file.metadata.lastModifiedBy = req.user._id;
      file.updatedAt = new Date();
      await file.save();

      // Update user storage
      await req.user.updateStorageUsage(file.size - oldSize);

      console.log(`✅ File content updated: ${file.filename} - new size: ${file.size} bytes`);

      res.json({
        message: 'File content updated successfully',
        file: {
          id: file._id,
          filename: file.filename,
          path: file.path,
          size: file.size,
          mimeType: file.mimeType,
          updatedAt: file.updatedAt
        }
      });

    } catch (storageError) {
      console.error('File content update error:', storageError);
      res.status(500).json({
        error: 'Error updating file content'
      });
    }

  } catch (error) {
    console.error('Update content error:', error);
    res.status(500).json({
      error: 'Internal server error while updating file content'
    });
  }
});

// @route   POST /api/files/folder
// @desc    Create a new folder
// @access  Private
router.post('/folder', async (req, res) => {
  try {
    const { error, value } = createFolderSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }

    const { name, path } = value;
    const fullPath = `${path}/${name}`.replace(/\/+/g, '/');

    // Check if folder already exists
    const existingFolder = await File.findOne({
      filename: name,
      path: path,
      owner: req.user._id,
      isDirectory: true,
      isDeleted: false
    });

    if (existingFolder) {
      return res.status(409).json({
        error: 'Folder already exists'
      });
    }

    // Create folder document
    const folder = new File({
      filename: name,
      originalName: name,
      path: fullPath,
      size: 0,
      mimeType: 'application/x-directory',
      owner: req.user._id,
      gridFSId: new mongoose.Types.ObjectId(),
      isDirectory: true,
      metadata: {
        lastModifiedBy: req.user._id
      }
    });

    await folder.save();

    res.status(201).json({
      message: 'Folder created successfully',
      folder: {
        id: folder._id,
        filename: folder.filename,
        path: folder.path,
        isDirectory: folder.isDirectory,
        createdAt: folder.createdAt
      }
    });

  } catch (error) {
    console.error('Create folder error:', error);
    res.status(500).json({
      error: 'Internal server error while creating folder'
    });
  }
});

// @route   DELETE /api/files/:id
// @desc    Delete a file or folder
// @access  Private
router.delete('/:id', checkFilePermission('delete'), async (req, res) => {
  try {
    const file = req.file;
    const { permanent = false } = req.query;

    if (permanent) {
      // Permanent deletion
      if (!file.isDirectory && file.gridFSId) {
        // Delete from GridFS
        try {
          console.log(`🗑️ Deleting file from GridFS: ${file.gridFSId}`);
          await gfsBucket.delete(file.gridFSId);
          await req.user.updateStorageUsage(-file.size);
          console.log(`✅ File deleted from GridFS: ${file.gridFSId}`);
        } catch (error) {
          console.error('GridFS deletion error:', error);
        }
      } else if (file.isDirectory) {
        // For directories, recursively delete all contents
        const childFiles = await File.find({
          path: { $regex: `^${file.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
          owner: req.user._id
        });

        for (const childFile of childFiles) {
          if (!childFile.isDirectory && childFile.gridFSId) {
            try {
              console.log(`🗑️ Deleting child file from GridFS: ${childFile.gridFSId}`);
              await gfsBucket.delete(childFile.gridFSId);
              await req.user.updateStorageUsage(-childFile.size);
            } catch (error) {
              console.error('GridFS child deletion error:', error);
            }
          }
        }

        // Delete all child file documents
        await File.deleteMany({
          path: { $regex: `^${file.path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
          owner: req.user._id
        });
      }

      await File.findByIdAndDelete(file._id);

      res.json({
        message: 'File deleted permanently'
      });
    } else {
      // Soft deletion
      await file.softDelete(req.user._id);

      res.json({
        message: 'File moved to trash'
      });
    }

  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      error: 'Internal server error while deleting file'
    });
  }
});

// @route   PUT /api/files/:id/move
// @desc    Move a file or folder
// @access  Private
router.put('/:id/move', checkFilePermission('write'), async (req, res) => {
  try {
    const { error, value } = moveFileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }

    const file = req.file;
    const { newPath } = value;

    // Check if destination already exists
    const existingFile = await File.findOne({
      filename: file.filename,
      path: newPath,
      owner: req.user._id,
      isDeleted: false
    });

    if (existingFile) {
      return res.status(409).json({
        error: 'A file with this name already exists at the destination'
      });
    }

    // Update file path
    const oldPath = file.path;
    file.path = newPath;
    file.metadata.lastModifiedBy = req.user._id;
    await file.save();

    // If it's a directory, update all child paths
    if (file.isDirectory) {
      const childFiles = await File.find({
        path: { $regex: `^${oldPath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` },
        owner: req.user._id
      });

      for (const childFile of childFiles) {
        childFile.path = childFile.path.replace(oldPath, newPath);
        await childFile.save();
      }
    }

    res.json({
      message: 'File moved successfully',
      file: {
        id: file._id,
        filename: file.filename,
        oldPath: oldPath,
        newPath: file.path
      }
    });

  } catch (error) {
    console.error('Move file error:', error);
    res.status(500).json({
      error: 'Internal server error while moving file'
    });
  }
});

// @route   PUT /api/files/:id/rename
// @desc    Rename a file or folder
// @access  Private
router.put('/:id/rename', checkFilePermission('write'), async (req, res) => {
  try {
    const { error, value } = renameFileSchema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation Error',
        details: error.details.map(detail => detail.message)
      });
    }

    const file = req.file;
    const { newName } = value;

    // Check if file with new name already exists
    const existingFile = await File.findOne({
      filename: newName,
      path: file.path.substring(0, file.path.lastIndexOf('/')),
      owner: req.user._id,
      isDeleted: false
    });

    if (existingFile) {
      return res.status(409).json({
        error: 'A file with this name already exists'
      });
    }

    // Update filename
    const oldName = file.filename;
    file.filename = newName;
    file.originalName = newName;
    file.metadata.lastModifiedBy = req.user._id;
    await file.save();

    res.json({
      message: 'File renamed successfully',
      file: {
        id: file._id,
        oldName: oldName,
        newName: file.filename,
        path: file.path
      }
    });

  } catch (error) {
    console.error('Rename file error:', error);
    res.status(500).json({
      error: 'Internal server error while renaming file'
    });
  }
});

// @route   GET /api/files/:id/info
// @desc    Get detailed file information
// @access  Private
router.get('/:id/info', checkFilePermission('read'), async (req, res) => {
  try {
    const file = req.file;

    await file.populate('owner', 'username firstName lastName');
    await file.populate('sharedWith.user', 'username firstName lastName');
    await file.populate('metadata.lastModifiedBy', 'username firstName lastName');

    res.json({
      file: {
        id: file._id,
        filename: file.filename,
        originalName: file.originalName,
        path: file.path,
        size: file.size,
        mimeType: file.mimeType,
        isDirectory: file.isDirectory,
        owner: file.owner,
        permissions: file.permissions,
        sharedWith: file.sharedWith,
        tags: file.tags,
        metadata: file.metadata,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
        hasReadPermission: file.hasPermission(req.user._id, 'read'),
        hasWritePermission: file.hasPermission(req.user._id, 'write'),
        hasDeletePermission: file.hasPermission(req.user._id, 'delete'),
        hasSharePermission: file.hasPermission(req.user._id, 'share')
      }
    });

  } catch (error) {
    console.error('Get file info error:', error);
    res.status(500).json({
      error: 'Internal server error while getting file information'
    });
  }
});

module.exports = router;
