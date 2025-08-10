const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  gridFSId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // Made optional since we can store content directly
  },
  content: {
    type: String, // Base64 encoded content for small files
    required: false
  },
  isDirectory: {
    type: Boolean,
    default: false
  },
  parent: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  permissions: {
    owner: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: true },
      delete: { type: Boolean, default: true },
      share: { type: Boolean, default: true }
    },
    group: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    others: {
      read: { type: Boolean, default: false },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    }
  },
  sharedWith: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    permissions: {
      read: { type: Boolean, default: true },
      write: { type: Boolean, default: false },
      delete: { type: Boolean, default: false }
    },
    sharedAt: {
      type: Date,
      default: Date.now
    },
    sharedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    description: String,
    version: {
      type: Number,
      default: 1
    },
    lastModifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    checksum: String,
    encoding: String,
    thumbnail: String // Base64 encoded thumbnail for images
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date,
    default: null
  },
  deletedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Indexes for performance
fileSchema.index({ owner: 1, path: 1 });
fileSchema.index({ parent: 1 });
fileSchema.index({ 'sharedWith.user': 1 });
fileSchema.index({ isDeleted: 1 });
fileSchema.index({ createdAt: -1 });
fileSchema.index({ filename: 'text', originalName: 'text' });

// Virtual for full path
fileSchema.virtual('fullPath').get(function() {
  return this.path;
});

// Method to check if user has permission
fileSchema.methods.hasPermission = function(userId, permission) {
  // Owner has all permissions
  if (this.owner.toString() === userId.toString()) {
    return this.permissions.owner[permission] !== false;
  }
  
  // Check if file is shared with user
  const sharedPermission = this.sharedWith.find(
    share => share.user.toString() === userId.toString()
  );
  
  if (sharedPermission) {
    return sharedPermission.permissions[permission] === true;
  }
  
  // Check others permissions
  return this.permissions.others[permission] === true;
};

// Method to share file with user
fileSchema.methods.shareWith = function(userId, permissions, sharedBy) {
  // Remove existing share if any
  this.sharedWith = this.sharedWith.filter(
    share => share.user.toString() !== userId.toString()
  );
  
  // Add new share
  this.sharedWith.push({
    user: userId,
    permissions: permissions,
    sharedBy: sharedBy,
    sharedAt: new Date()
  });
  
  return this.save();
};

// Method to revoke sharing
fileSchema.methods.revokeShare = function(userId) {
  this.sharedWith = this.sharedWith.filter(
    share => share.user.toString() !== userId.toString()
  );
  return this.save();
};

// Method for soft delete
fileSchema.methods.softDelete = function(deletedBy) {
  this.isDeleted = true;
  this.deletedAt = new Date();
  this.deletedBy = deletedBy;
  return this.save();
};

// Method to restore from soft delete
fileSchema.methods.restore = function() {
  this.isDeleted = false;
  this.deletedAt = null;
  this.deletedBy = null;
  return this.save();
};

// Static method to get user's accessible files
fileSchema.statics.getAccessibleFiles = function(userId, path = '/', includeShared = true) {
  const query = {
    isDeleted: false,
    $or: [
      { owner: userId },
      ...(includeShared ? [{ 'sharedWith.user': userId }] : [])
    ]
  };
  
  if (path !== '/') {
    query.path = { $regex: `^${path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}` };
  }
  
  return this.find(query)
    .populate('owner', 'username firstName lastName')
    .populate('sharedWith.user', 'username firstName lastName')
    .sort({ isDirectory: -1, filename: 1 });
};

module.exports = mongoose.model('File', fileSchema);
