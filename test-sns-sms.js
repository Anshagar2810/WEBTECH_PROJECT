import { sendSMSViaSNS } from './src/services/sms.service.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSMS() {
  try {
    console.log('🔍 Testing AWS SNS SMS...\n');
    
    // Test with your phone number
    const phoneNumber = '+919810325677'; // Your WhatsApp number
    const message = 'Smart Ward EWS - Test SMS from AWS SNS';
    
    console.log(`Sending SMS to: ${phoneNumber}`);
    const result = await sendSMSViaSNS(phoneNumber, message);
    
    if (result) {
      console.log('✅ SMS Sent Successfully!');
      console.log('Check your phone for the test message');
    } else {
      console.log('❌ SMS Send Failed');
    }
  } catch (error) {
    console.log('❌ Test Failed:');
    console.log(`Error: ${error.message}`);
  }
}

testSMS();
