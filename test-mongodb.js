import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function testConnection() {
  try {
    console.log('🔍 Testing MongoDB Connection...\n');
    
    await mongoose.connect(process.env.MONGO_URI);
    
    console.log('✅ MongoDB Connected Successfully!');
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Host: ${mongoose.connection.host}`);
    
    await mongoose.disconnect();
    console.log('\n✓ Connection test completed!');
  } catch (error) {
    console.log('❌ MongoDB Connection Failed:');
    console.log(`Error: ${error.message}`);
  }
}

testConnection();
