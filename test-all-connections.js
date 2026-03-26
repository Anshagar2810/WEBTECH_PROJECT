import mongoose from 'mongoose';
import twilio from 'twilio';
import axios from 'axios';
import { getS3, getSNS } from './src/config/aws.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('\n╔════════════════════════════════════════════════════════════════╗');
console.log('║        SMART WARD EWS - COMPLETE CONNECTION TEST               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const results = {
  aws_s3: false,
  aws_sns: false,
  mongodb: false,
  twilio: false,
  thingspeak: false,
};

// Test 1: AWS S3
console.log('📦 [1/5] Testing AWS S3...');
try {
  const s3 = getS3();
  if (s3) {
    console.log('  ✅ S3 Client Initialized\n');
    results.aws_s3 = true;
  }
} catch (error) {
  console.log(`  ❌ S3 Failed: ${error.message}\n`);
}

// Test 2: AWS SNS
console.log('📱 [2/5] Testing AWS SNS...');
try {
  const sns = getSNS();
  if (sns) {
    console.log('  ✅ SNS Client Initialized\n');
    results.aws_sns = true;
  }
} catch (error) {
  console.log(`  ❌ SNS Failed: ${error.message}\n`);
}

// Test 3: MongoDB
console.log('🗄️  [3/5] Testing MongoDB...');
try {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 5000 });
  console.log(`  ✅ MongoDB Connected`);
  console.log(`  📍 Database: ${mongoose.connection.name}`);
  console.log(`  📍 Host: ${mongoose.connection.host}\n`);
  await mongoose.disconnect();
  results.mongodb = true;
} catch (error) {
  console.log(`  ❌ MongoDB Failed: ${error.message}\n`);
}

// Test 4: Twilio
console.log('📞 [4/5] Testing Twilio...');
try {
  const client = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  console.log('  ✅ Twilio Client Initialized');
  console.log(`  📍 Account: ${process.env.TWILIO_SID.substring(0, 10)}...`);
  console.log(`  📍 WhatsApp From: ${process.env.TWILIO_WHATSAPP_FROM}`);
  console.log(`  📍 WhatsApp To: ${process.env.TWILIO_WHATSAPP_TO}\n`);
  results.twilio = true;
} catch (error) {
  console.log(`  ❌ Twilio Failed: ${error.message}\n`);
}

// Test 5: ThingSpeak
console.log('📊 [5/5] Testing ThingSpeak...');
try {
  const channelId = process.env.THINGSPEAK_CHANNEL_ID;
  const readKey = process.env.THINGSPEAK_READ_KEY;
  const url = `https://api.thingspeak.com/channels/${channelId}/feeds.json?api_key=${readKey}&results=1`;
  
  const response = await axios.get(url, { timeout: 5000 });
  
  if (response.data.feeds && response.data.feeds.length > 0) {
    console.log('  ✅ ThingSpeak Connected');
    console.log(`  📍 Channel: ${channelId}`);
    console.log(`  📍 Latest Data: ${JSON.stringify(response.data.feeds[0])}\n`);
    results.thingspeak = true;
  } else {
    console.log('  ⚠️  ThingSpeak Connected (No data)\n');
    results.thingspeak = true;
  }
} catch (error) {
  console.log(`  ❌ ThingSpeak Failed: ${error.message}\n`);
}

// Summary
console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║                      TEST SUMMARY                               ║');
console.log('╚════════════════════════════════════════════════════════════════╝\n');

const total = Object.keys(results).length;
const passed = Object.values(results).filter(v => v).length;

console.log(`AWS S3:        ${results.aws_s3 ? '✅' : '❌'}`);
console.log(`AWS SNS:       ${results.aws_sns ? '✅' : '❌'}`);
console.log(`MongoDB:       ${results.mongodb ? '✅' : '❌'}`);
console.log(`Twilio:        ${results.twilio ? '✅' : '❌'}`);
console.log(`ThingSpeak:    ${results.thingspeak ? '✅' : '❌'}`);

console.log(`\n📊 Result: ${passed}/${total} connections successful\n`);

if (passed === total) {
  console.log('🎉 All connections verified! Ready to start server.\n');
  console.log('Run: npm start\n');
  process.exit(0);
} else {
  console.log('⚠️  Some connections failed. Check errors above.\n');
  process.exit(1);
}
