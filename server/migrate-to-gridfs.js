const mongoose = require('mongoose');
const File = require('./models/File');
require('dotenv').config();

async function migrateFilesToGridFS() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Setup GridFS bucket
    const gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
      bucketName: 'uploads'
    });

    // Find files that have content but no gridFSId
    const filesToMigrate = await File.find({
      isDirectory: false,
      isDeleted: false,
      content: { $exists: true, $ne: null },
      $or: [
        { gridFSId: { $exists: false } },
        { gridFSId: null }
      ]
    });

    console.log(`Found ${filesToMigrate.length} files to migrate to GridFS`);

    for (const file of filesToMigrate) {
      try {
        console.log(`Migrating file: ${file.filename} (${file._id})`);
        
        // Decode base64 content
        const fileBuffer = Buffer.from(file.content, 'base64');
        
        // Upload to GridFS
        const uploadStream = gfsBucket.openUploadStream(file.filename, {
          metadata: {
            originalName: file.originalName || file.filename,
            path: file.path,
            owner: file.owner,
            mimeType: file.mimeType,
            migratedAt: new Date(),
            originalFileId: file._id
          }
        });

        const uploadPromise = new Promise((resolve, reject) => {
          uploadStream.on('error', reject);
          uploadStream.on('finish', () => {
            console.log(`✅ Uploaded to GridFS with ID: ${uploadStream.id}`);
            resolve(uploadStream.id);
          });
        });

        uploadStream.end(fileBuffer);
        const gridFSId = await uploadPromise;

        // Update file document
        file.gridFSId = gridFSId;
        file.content = undefined; // Remove content field
        await file.save();

        console.log(`✅ Migrated file: ${file.filename} - GridFS ID: ${gridFSId}`);
      } catch (error) {
        console.error(`❌ Failed to migrate file ${file.filename}:`, error);
      }
    }

    console.log('✅ Migration completed!');
    
    // Show storage summary
    const totalFiles = await File.countDocuments({ isDirectory: false, isDeleted: false });
    const gridFSFiles = await File.countDocuments({ 
      isDirectory: false, 
      isDeleted: false, 
      gridFSId: { $exists: true, $ne: null }
    });
    const contentFiles = await File.countDocuments({ 
      isDirectory: false, 
      isDeleted: false, 
      content: { $exists: true, $ne: null }
    });

    console.log(`\n📊 Storage Summary:`);
    console.log(`  Total files: ${totalFiles}`);
    console.log(`  Files in GridFS: ${gridFSFiles}`);
    console.log(`  Files with content field: ${contentFiles}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Migration error:', error);
    process.exit(1);
  }
}

migrateFilesToGridFS();
