import twilio from "twilio";
import { saveCriticalPatientDataToS3 } from "../config/aws.js";
import { sendCriticalPatientSMS } from "./sms.service.js";

// Lazy load client to ensure env is ready
let client = null;

const getClient = () => {
  if (!client) {
    if (!process.env.TWILIO_SID || !process.env.TWILIO_AUTH_TOKEN) {
      console.error("❌ Missing TWILIO_SID or TWILIO_AUTH_TOKEN in .env");
      return null;
    }
    client = twilio(
      process.env.TWILIO_SID,
      process.env.TWILIO_AUTH_TOKEN
    );
  }
  return client;
};

export const sendAlert = async ({ patient, vitals, alerts = [], risk }) => {
  console.log("🔔 ALERT SERVICE CALLED");
  console.log("Patient:", patient?.name, "Risk:", risk?.riskLevel);
  
  try {
    // Ensure patient.phone exists and is properly formatted
    if (!patient || !patient.phone) {
      console.error("❌ Patient or patient.phone missing");
      return;
    }

    // Determine recipient: prefer patient's `phone` when it looks valid (starts with '+'),
    // otherwise fall back to globally-configured TWILIO_WHATSAPP_TO.
    let toNumber = process.env.TWILIO_WHATSAPP_TO;
    
    // Patient phone can be +919810325677 or whatsapp:+919810325677
    if (patient.phone) {
      if (patient.phone.startsWith('whatsapp:')) {
        toNumber = patient.phone;
      } else if (patient.phone.startsWith('+')) {
        toNumber = `whatsapp:${patient.phone}`;
      } else {
        // Try with + prefix
        toNumber = `whatsapp:+${patient.phone}`;
      }
    }

    if (!toNumber) {
      console.error("❌ Could not determine WhatsApp recipient number");
      return;
    }

    const alertsText = Array.isArray(alerts) && alerts.length > 0 ? alerts.join(", ") : "Abnormal vitals detected";

    const message = `
🚨 *SMART WARD ALERT*

🧑 Patient: ${patient.name}
🆔 Patient ID: ${patient.patientId}

❤️ Heart Rate: ${vitals.heartRate}
🫁 SpO₂: ${vitals.spo2} %
🌡 Temperature: ${vitals.temperature} °F

⚠️ Risk Level: ${risk.riskLevel}
📢 Alerts: ${alertsText}
`;

    console.log("📲 Sending WhatsApp via Twilio...");
    console.log("FROM:", process.env.TWILIO_WHATSAPP_FROM);
    console.log("TO:", toNumber);

    const twilioClient = getClient();
    if (!twilioClient) {
      console.error("❌ Twilio client not initialized");
      return;
    }

    try {
      const result = await twilioClient.messages.create({
        from: process.env.TWILIO_WHATSAPP_FROM,
        to: toNumber,
        body: message,
      });
      console.log("✅ WhatsApp sent successfully. SID:", result.sid);
    } catch (whatsappErr) {
      console.error("⚠️  WhatsApp Send Error (but continuing with S3):", whatsappErr.message);
    }
    
    // Send SMS and save to S3 if it's a CRITICAL alert
    // This runs REGARDLESS of WhatsApp success/failure
    if (risk.riskLevel === "HIGH" && patient.phone) {
      console.log("🚨 HIGH RISK detected - saving to S3 and sending SMS...");
      
      try {
        console.log("📦 Saving critical patient data to S3...");
        const s3Result = await saveCriticalPatientDataToS3(patient, vitals, risk, alerts);
        console.log("📦 S3 Save Result:", s3Result ? "✅ SUCCESS" : "❌ FAILED");
      } catch (s3Err) {
        console.error("❌ S3 Save Error:", s3Err.message);
      }
      
      try {
        console.log("📱 Sending SMS via configured provider...");
        const phoneNumber = patient.phone.startsWith("+") ? patient.phone : `+${patient.phone}`;
        await sendCriticalPatientSMS(phoneNumber, patient.name, vitals, risk, alerts);
      } catch (smsErr) {
        console.error("❌ SMS Error:", smsErr.message);
      }
    }
  } catch (err) {
    console.error("❌ Alert Service Error:", err.message);
    console.error(err);
  }
};