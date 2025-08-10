const mongoose = require('mongoose');
const File = require('./models/File');
require('dotenv').config();

async function fixFilesWithoutContent() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Find all files first
    const allFiles = await File.find({
      isDirectory: false,
      isDeleted: false
    });

    console.log(`Found ${allFiles.length} total files`);

    for (const file of allFiles) {
      console.log(`File: ${file.filename}`);
      console.log(`  - ID: ${file._id}`);
      console.log(`  - Has content: ${!!file.content}`);
      console.log(`  - Content length: ${file.content ? file.content.length : 0}`);
      console.log(`  - Has gridFSId: ${!!file.gridFSId}`);
      console.log(`  - Size: ${file.size}`);
      console.log(`  - MIME: ${file.mimeType}`);
      
      if (!file.content && !file.gridFSId) {
        console.log(`  ⚠️  This file needs fixing!`);
        
        // Create some sample content for the file based on its type
        let sampleContent;
        if (file.mimeType.startsWith('text/')) {
          sampleContent = `This is a sample content for ${file.filename}.\nCreated by WeaveOS fix script.\nFile ID: ${file._id}\n`;
        } else {
          sampleContent = `Sample content for ${file.filename}`;
        }
        
        // Convert to base64
        const base64Content = Buffer.from(sampleContent, 'utf8').toString('base64');
        
        // Update the file
        file.content = base64Content;
        file.size = sampleContent.length;
        await file.save();
        
        console.log(`  ✅ Fixed file: ${file.filename} - added ${sampleContent.length} bytes of content`);
      } else {
        console.log(`  ✅ File is OK`);
      }
      console.log('');
    }

    console.log('✅ All files processed!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing files:', error);
    process.exit(1);
  }
}

fixFilesWithoutContent();
