const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30,
    match: /^[a-zA-Z0-9_-]+$/
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  avatar: {
    type: String,
    default: null
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  storageQuota: {
    type: Number,
    default: 1024 * 1024 * 1024 // 1GB in bytes
  },
  storageUsed: {
    type: Number,
    default: 0
  },
  homeDirectoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'File',
    default: null
  },
  preferences: {
    theme: {
      type: String,
      enum: ['light', 'dark', 'auto'],
      default: 'dark'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    wallpaper: {
      type: String,
      default: 'default'
    }
  }
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Index for performance
userSchema.index({ username: 1 });
userSchema.index({ email: 1 });
userSchema.index({ isActive: 1 });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    this.password = await bcrypt.hash(this.password, rounds);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Get storage usage percentage
userSchema.methods.getStorageUsagePercent = function() {
  return Math.round((this.storageUsed / this.storageQuota) * 100);
};

// Check if user has storage space
userSchema.methods.hasStorageSpace = function(additionalBytes) {
  return (this.storageUsed + additionalBytes) <= this.storageQuota;
};

// Update storage usage
userSchema.methods.updateStorageUsage = async function(bytesChange) {
  this.storageUsed = Math.max(0, this.storageUsed + bytesChange);
  return this.save();
};

// Create user home directory structure
userSchema.methods.createHomeDirectory = async function() {
  const File = mongoose.model('File');
  
  try {
    // Create user root directory
    const homeDir = new File({
      filename: this.username,
      originalName: this.username,
      mimeType: 'directory',
      size: 0,
      owner: this._id,
      parent: null,
      isDirectory: true,
      path: `/users/${this.username}`,
      permissions: {
        read: [this._id],
        write: [this._id],
        delete: [this._id],
        share: [this._id]
      },
      isPublic: false
    });
    
    await homeDir.save();
    
    // Create default subdirectories
    const defaultFolders = [
      { name: 'Documents', path: `/users/${this.username}/Documents` },
      { name: 'Downloads', path: `/users/${this.username}/Downloads` },
      { name: 'Pictures', path: `/users/${this.username}/Pictures` },
      { name: 'Videos', path: `/users/${this.username}/Videos` },
      { name: 'Music', path: `/users/${this.username}/Music` },
      { name: 'Desktop', path: `/users/${this.username}/Desktop` }
    ];
    
    for (const folder of defaultFolders) {
      const subDir = new File({
        filename: folder.name,
        originalName: folder.name,
        mimeType: 'directory',
        size: 0,
        owner: this._id,
        parent: homeDir._id,
        isDirectory: true,
        path: folder.path,
        permissions: {
          read: [this._id],
          write: [this._id],
          delete: [this._id],
          share: [this._id]
        },
        isPublic: false
      });
      
      await subDir.save();
    }
    
    // Update user with home directory reference
    this.homeDirectoryId = homeDir._id;
    await this.save();
    
    return homeDir;
  } catch (error) {
    console.error('Error creating home directory:', error);
    throw error;
  }
};

module.exports = mongoose.model('User', userSchema);
