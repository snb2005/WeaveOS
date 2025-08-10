const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Attempting to connect to MongoDB Atlas...');
    console.log('📋 Connection URI:', process.env.MONGODB_URI?.replace(/\/\/.*@/, '//***:***@'));
    
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // 5 second timeout
    });
    
    console.log('✅ Successfully connected to MongoDB Atlas!');
    console.log('📊 Database:', mongoose.connection.name);
    console.log('🔗 Host:', mongoose.connection.host);
    console.log('📡 Ready state:', mongoose.connection.readyState);
    
    // Test creating a simple document
    const TestSchema = new mongoose.Schema({
      message: String,
      timestamp: { type: Date, default: Date.now }
    });
    
    const TestModel = mongoose.model('ConnectionTest', TestSchema);
    
    const testDoc = new TestModel({
      message: 'Weave OS connection test successful!'
    });
    
    await testDoc.save();
    console.log('✅ Test document created successfully!');
    
    // Clean up test document
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('🧹 Test document cleaned up');
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('Error:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.error('🔑 Authentication issue - check your username and password');
    } else if (error.message.includes('ENOTFOUND')) {
      console.error('🌐 Network issue - check your cluster URL');
    } else if (error.message.includes('timeout')) {
      console.error('⏰ Connection timeout - check your network and cluster settings');
    }
    
    process.exit(1);
  }
}

testConnection();
