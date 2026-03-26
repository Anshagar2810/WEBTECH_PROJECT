import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      dbName: "smartward",
    });

    console.log(`✅ MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    console.warn("⚠️ Starting server without database connection - API will still run");
    // Don't exit - allow server to continue for development/testing
    // process.exit(1);
  }
};

export default connectDB;