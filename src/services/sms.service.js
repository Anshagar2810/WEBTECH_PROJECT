import twilio from "twilio";
import { sendSMSViaSNS } from "../config/aws.js";

// Lazy load Twilio client
let twilioClient = null;

const getTwilioClient = () => {
  if (!twilioClient) {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error("❌ Missing TWILIO credentials in .env");
      return null;
    }
    twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return twilioClient;
};

// Send SMS via Twilio (traditional SMS)
export const sendSMSViaTwilio = async (phoneNumber, message) => {
  try {
    if (!process.env.TWILIO_PHONE_FROM || !phoneNumber) {
      console.error("❌ Missing TWILIO_PHONE_FROM or recipient phone number");
      return false;
    }

    const client = getTwilioClient();
    if (!client) return false;

    const response = await client.messages.create({
      from: process.env.TWILIO_PHONE_FROM,
      to: phoneNumber,
      body: message,
    });

    console.log(`✅ SMS sent via Twilio. SID: ${response.sid}`);
    return true;
  } catch (error) {
    console.error("❌ Twilio SMS Error:", error.message);
    return false;
  }
};

// Send SMS to critical patient (uses configured provider)
export const sendCriticalPatientSMS = async (phoneNumber, patientName, vitals, risk, alerts) => {
  try {
    if (!phoneNumber || !phoneNumber.startsWith("+")) {
      console.error("❌ Invalid phone number format. Must start with +");
      return false;
    }

    const message = `🚨 CRITICAL ALERT - Smart Ward EWS

Patient: ${patientName}

❤️ Heart Rate: ${vitals.heartRate} bpm
🫁 SpO₂: ${vitals.spo2}%
🌡 Temperature: ${vitals.temperature}°F

⚠️ Risk Level: ${risk.riskLevel}
📢 Issues: ${alerts.join(", ")}

Please check patient immediately!`;

    // Use AWS SNS if configured, otherwise fall back to Twilio
    const provider = process.env.SMS_PROVIDER || "twilio";

    if (provider === "aws" || provider === "sns") {
      console.log("📱 Sending SMS via AWS SNS...");
      return await sendSMSViaSNS(phoneNumber, message);
    } else {
      console.log("📱 Sending SMS via Twilio...");
      return await sendSMSViaTwilio(phoneNumber, message);
    }
  } catch (error) {
    console.error("❌ Send Critical Patient SMS Error:", error.message);
    return false;
  }
};

export default { sendSMSViaTwilio, sendCriticalPatientSMS, sendSMSViaSNS };
