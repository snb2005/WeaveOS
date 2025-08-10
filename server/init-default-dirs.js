const mongoose = require('mongoose');
require('dotenv').config();

// Import the File model
const File = require('./models/File');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weave';

const defaultFolders = [
  { name: 'Desktop', path: '/', isDirectory: true },
  { name: 'Documents', path: '/', isDirectory: true },
  { name: 'Downloads', path: '/', isDirectory: true },
  { name: 'Pictures', path: '/', isDirectory: true },
  { name: 'Music', path: '/', isDirectory: true },
  { name: 'Videos', path: '/', isDirectory: true },
  { name: 'Projects', path: '/Documents', isDirectory: true },
  { name: 'Notes', path: '/Documents', isDirectory: true },
  { name: 'Scripts', path: '/Documents', isDirectory: true },
];

async function initializeDefaultDirectories() {
  try {
    console.log('🔧 Initializing default directories...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Find the user ID (use the first user)
    const users = await mongoose.connection.db.collection('users').find({}).toArray();
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      process.exit(1);
    }
    
    const userId = users[0]._id;
    console.log(`👤 Using user ID: ${userId}`);
    
    for (const folder of defaultFolders) {
      // Check if folder already exists
      const existingFolder = await File.findOne({
        filename: folder.name,
        path: folder.path,
        isDirectory: true,
        isDeleted: false,
        owner: userId
      });
      
      if (existingFolder) {
        console.log(`📁 Folder already exists: ${folder.path}/${folder.name}`);
        continue;
      }
      
      // Create the folder
      const newFolder = new File({
        filename: folder.name,
        originalName: folder.name,
        mimeType: 'application/x-directory',
        size: 0,
        path: folder.path,
        isDirectory: true,
        owner: userId,
        isDeleted: false,
        uploadDate: new Date(),
        lastModified: new Date()
      });
      
      await newFolder.save();
      console.log(`✅ Created folder: ${folder.path}/${folder.name}`);
    }
    
    console.log('🎉 Default directories initialized successfully!');
    
    // List all folders to verify
    const allFolders = await File.find({ 
      isDirectory: true, 
      isDeleted: false,
      owner: userId 
    }).sort({ path: 1, filename: 1 });
    
    console.log('\n📂 Current directory structure:');
    allFolders.forEach(folder => {
      const fullPath = folder.path === '/' ? `/${folder.filename}` : `${folder.path}/${folder.filename}`;
      console.log(`  ${fullPath}`);
    });
    
  } catch (error) {
    console.error('❌ Error initializing directories:', error);
  } finally {
    mongoose.connection.close();
  }
}

initializeDefaultDirectories();
