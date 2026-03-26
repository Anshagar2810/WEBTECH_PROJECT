import 'dotenv/config';
import mongoose from 'mongoose';

(async () => {
  console.log('\n🔎 Running MongoDB connectivity test');
  try {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      console.error('❌ MONGO_URI missing in .env');
      process.exit(2);
    }

    const conn = await mongoose.connect(uri, { dbName: 'smartward', serverSelectionTimeoutMS: 5000 });
    console.log('✅ Connected to MongoDB host:', conn.connection.host);
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ MongoDB connection test failed:');
    console.error(err && err.message ? err.message : err);
    if (err && err.reason) console.error('Reason:', err.reason);
    process.exit(1);
  }
})();
