const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure Cloudinary storage for multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder based on file type
    let folder = 'weave-os/misc';
    if (file.mimetype.startsWith('image/')) {
      folder = 'weave-os/images';
    } else if (file.mimetype.startsWith('video/')) {
      folder = 'weave-os/videos';
    }

    // Generate unique filename
    const timestamp = Date.now();
    const originalName = file.originalname.split('.')[0];
    const publicId = `${req.user.id}_${originalName}_${timestamp}`;

    return {
      folder: folder,
      public_id: publicId,
      resource_type: file.mimetype.startsWith('video/') ? 'video' : 'auto',
      allowed_formats: file.mimetype.startsWith('image/') 
        ? ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg']
        : ['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'],
      transformation: file.mimetype.startsWith('image/')
        ? [
            { quality: 'auto:best' },
            { fetch_format: 'auto' }
          ]
        : [
            { quality: 'auto:best' },
            { video_codec: 'auto' }
          ]
    };
  },
});

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow images and videos only
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image and video files are allowed!'), false);
    }
  },
});

// Helper functions
const getOptimizedUrl = (publicId, options = {}) => {
  const defaultOptions = {
    quality: 'auto:best',
    fetch_format: 'auto',
  };
  
  return cloudinary.url(publicId, { ...defaultOptions, ...options });
};

const getThumbnailUrl = (publicId, isVideo = false) => {
  if (isVideo) {
    return cloudinary.url(publicId, {
      resource_type: 'video',
      transformation: [
        { width: 300, height: 200, crop: 'fill' },
        { quality: 'auto:low' },
        { format: 'jpg' }
      ]
    });
  } else {
    return cloudinary.url(publicId, {
      transformation: [
        { width: 300, height: 200, crop: 'fill' },
        { quality: 'auto:low' }
      ]
    });
  }
};

const deleteFromCloudinary = async (publicId, resourceType = 'auto') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    });
    return result;
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error);
    throw error;
  }
};

module.exports = {
  cloudinary,
  upload,
  getOptimizedUrl,
  getThumbnailUrl,
  deleteFromCloudinary
};
