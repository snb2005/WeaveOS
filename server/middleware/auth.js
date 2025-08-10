const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ 
        error: 'Access denied. No token provided.' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token.' 
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Access denied. Invalid token.' 
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Access denied. Token expired.' 
      });
    }
    
    console.error('Authentication error:', error);
    res.status(500).json({ 
      error: 'Internal server error during authentication.' 
    });
  }
};

const authenticateSession = (req, res, next) => {
  if (req.session && req.session.userId) {
    User.findById(req.session.userId)
      .select('-password')
      .then(user => {
        if (user && user.isActive) {
          req.user = user;
          next();
        } else {
          req.session.destroy();
          res.status(401).json({ 
            error: 'Session invalid. Please login again.' 
          });
        }
      })
      .catch(error => {
        console.error('Session authentication error:', error);
        res.status(500).json({ 
          error: 'Internal server error during session authentication.' 
        });
      });
  } else {
    res.status(401).json({ 
      error: 'No active session. Please login.' 
    });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ 
      error: 'Access denied. Admin privileges required.' 
    });
  }
};

const checkFilePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const File = require('../models/File');
      const fileId = req.params.id || req.params.fileId;
      
      console.log(`🔒 Permission check - fileId: ${fileId}, permission: ${permission}, user: ${req.user._id}`);
      
      if (!fileId) {
        console.log(`❌ No file ID provided`);
        return res.status(400).json({ 
          error: 'File ID is required.' 
        });
      }

      const file = await File.findById(fileId);
      console.log(`🔍 File lookup result:`, file ? `Found file: ${file.filename}, owner: ${file.owner}, isDeleted: ${file.isDeleted}` : 'File not found');
      
      if (!file || file.isDeleted) {
        console.log(`❌ File not found or deleted`);
        return res.status(404).json({ 
          error: 'File not found.' 
        });
      }

      const hasPermission = file.hasPermission(req.user._id, permission);
      console.log(`🔐 Permission check result: ${hasPermission}`);
      
      if (!hasPermission) {
        console.log(`❌ Permission denied - user ${req.user._id} lacks ${permission} permission for file ${file.filename}`);
        return res.status(403).json({ 
          error: `Access denied. ${permission} permission required.` 
        });
      }

      console.log(`✅ Permission granted for ${permission} on file ${file.filename}`);
      req.file = file;
      next();
    } catch (error) {
      console.error('Permission check error:', error);
      res.status(500).json({ 
        error: 'Internal server error during permission check.' 
      });
    }
  };
};

module.exports = {
  authenticateToken,
  authenticateSession,
  requireAdmin,
  checkFilePermission
};
