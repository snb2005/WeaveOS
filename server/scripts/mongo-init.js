// MongoDB initialization script for Weave OS

db = db.getSiblingDB('weave-os');

// Create collections
db.createCollection('users');
db.createCollection('files');

// Create indexes for better performance
db.users.createIndex({ "username": 1 }, { unique: true });
db.users.createIndex({ "email": 1 }, { unique: true });
db.files.createIndex({ "owner": 1 });
db.files.createIndex({ "parent": 1 });
db.files.createIndex({ "path": 1 });
db.files.createIndex({ "filename": 1 });
db.files.createIndex({ "gridFSId": 1 });

// Create text indexes for search
db.files.createIndex({ 
  "filename": "text", 
  "originalName": "text" 
});

print('✅ Weave OS database initialized successfully');
print('📊 Created collections: users, files');
print('🔍 Created indexes for optimal performance');
