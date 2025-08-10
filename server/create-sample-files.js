const mongoose = require('mongoose');
const { GridFSBucket } = require('mongodb');
require('dotenv').config();

// Import the File model
const File = require('./models/File');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/weave';

const sampleFiles = [
  { 
    name: 'welcome.txt', 
    path: '/Desktop', 
    content: 'Welcome to Weave OS!\n\nThis is a virtual file system running on MongoDB GridFS.\nYou can use the terminal to navigate and manage files.\n\nTry these commands:\n- ls (list files)\n- cd (change directory)\n- cat (view file contents)\n- mkdir (create directory)\n- touch (create file)\n\nHave fun exploring!' 
  },
  { 
    name: 'readme.md', 
    path: '/Documents', 
    content: '# Weave OS Documentation\n\n## Overview\nWeave OS is a browser-based operating system with:\n- Virtual file system\n- Terminal emulation\n- Text editor\n- File manager\n\n## Features\n- GridFS file storage\n- Real-time file operations\n- Cross-component synchronization\n\n## Commands\n```bash\nls -la          # List files with details\ncd /Documents   # Change directory\ncat readme.md   # View file contents\ntree           # Show directory tree\n```' 
  },
  { 
    name: 'todo.txt', 
    path: '/Documents/Notes', 
    content: 'TODO List\n=========\n\n[x] Implement GridFS file storage\n[x] Create terminal emulation\n[x] Add file manager\n[x] Build text editor\n[ ] Add file permissions\n[ ] Implement file search\n[ ] Add syntax highlighting\n[ ] Create plugin system\n\nNotes:\n- GridFS working perfectly\n- Terminal integration complete\n- All file operations functional' 
  },
  { 
    name: 'hello.js', 
    path: '/Documents/Scripts', 
    content: '#!/usr/bin/env node\n\n// Hello World script for Weave OS\nconsole.log("Hello from Weave OS!");\nconsole.log("Current time:", new Date().toISOString());\nconsole.log("Platform: Browser-based OS");\nconsole.log("Storage: MongoDB GridFS");\n\n// Example function\nfunction greetUser(name) {\n    return `Welcome to Weave OS, ${name}!`;\n}\n\nconsole.log(greetUser("Developer"));' 
  }
];

async function createSampleFiles() {
  try {
    console.log('📝 Creating sample files...');
    
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
    
    // Set up GridFS
    const db = mongoose.connection.db;
    const bucket = new GridFSBucket(db, { bucketName: 'weave_files' });
    
    // Find the user ID (use the first user)
    const users = await db.collection('users').find({}).toArray();
    if (users.length === 0) {
      console.log('❌ No users found. Please create a user first.');
      process.exit(1);
    }
    
    const userId = users[0]._id;
    console.log(`👤 Using user ID: ${userId}`);
    
    for (const file of sampleFiles) {
      // Check if file already exists
      const existingFile = await File.findOne({
        filename: file.name,
        path: file.path,
        isDirectory: false,
        isDeleted: false,
        owner: userId
      });
      
      if (existingFile) {
        console.log(`📄 File already exists: ${file.path}/${file.name}`);
        continue;
      }
      
      // Upload content to GridFS
      const uploadStream = bucket.openUploadStream(file.name, {
        metadata: {
          originalName: file.name,
          mimeType: 'text/plain',
          uploadedBy: userId
        }
      });
      
      uploadStream.write(file.content);
      uploadStream.end();
      
      const gridFSId = await new Promise((resolve, reject) => {
        uploadStream.on('finish', () => resolve(uploadStream.id));
        uploadStream.on('error', reject);
      });
      
      // Create file document
      const newFile = new File({
        filename: file.name,
        originalName: file.name,
        mimeType: 'text/plain',
        size: file.content.length,
        path: file.path,
        isDirectory: false,
        gridFSId: gridFSId,
        owner: userId,
        isDeleted: false,
        uploadDate: new Date(),
        lastModified: new Date()
      });
      
      await newFile.save();
      console.log(`✅ Created file: ${file.path}/${file.name} (${file.content.length} bytes)`);
    }
    
    console.log('🎉 Sample files created successfully!');
    
    // List all files to verify
    const allFiles = await File.find({ 
      isDirectory: false, 
      isDeleted: false,
      owner: userId 
    }).sort({ path: 1, filename: 1 });
    
    console.log('\n📁 Current files:');
    allFiles.forEach(file => {
      const fullPath = file.path === '/' ? `/${file.filename}` : `${file.path}/${file.filename}`;
      console.log(`  ${fullPath} (${file.size} bytes)`);
    });
    
  } catch (error) {
    console.error('❌ Error creating sample files:', error);
  } finally {
    mongoose.connection.close();
  }
}

createSampleFiles();
