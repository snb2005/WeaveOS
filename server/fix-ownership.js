const mongoose = require('mongoose');
const File = require('./models/File');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weave';

async function fixDirectoryOwnership() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Get the current user ID (the one being used by the API)
    const currentUserId = new mongoose.Types.ObjectId('68975b3eef9cd58831e3efec');
    const oldUserId = new mongoose.Types.ObjectId('689661f83fb44b529633297d');
    
    console.log('🔧 Fixing directory ownership...');
    console.log(`Current user ID: ${currentUserId}`);
    console.log(`Old user ID: ${oldUserId}`);
    
    // Update all files/directories to have the correct owner
    const result = await File.updateMany(
      { owner: oldUserId },
      { $set: { owner: currentUserId } }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} files/directories`);
    
    // List all files to verify
    const allFiles = await File.find({ 
      isDeleted: false,
      owner: currentUserId 
    }).sort({ path: 1, filename: 1 });
    
    console.log('\n📂 All files/directories after fix:');
    allFiles.forEach(file => {
      const fullPath = file.path === '/' ? `/${file.filename}` : `${file.path}/${file.filename}`;
      const type = file.isDirectory ? 'folder' : 'file';
      console.log(`  ${fullPath} (${type})`);
    });
    
    // Specifically check root directory
    const rootFiles = await File.find({ 
      path: '/', 
      isDeleted: false,
      owner: currentUserId 
    }).sort({ filename: 1 });
    
    console.log('\n📁 Root directory contents:');
    rootFiles.forEach(file => {
      console.log(`  ${file.filename} (${file.isDirectory ? 'folder' : 'file'})`);
    });
    
  } catch (error) {
    console.error('❌ Error fixing ownership:', error);
  } finally {
    mongoose.connection.close();
  }
}

fixDirectoryOwnership();
