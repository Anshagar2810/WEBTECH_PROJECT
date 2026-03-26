#!/usr/bin/env node

/**
 * POSTMAN TEST GUIDE FOR CRITICAL VITALS
 * 
 * This file explains how to use Postman to test AWS S3 and Twilio alerts
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         POSTMAN TESTING GUIDE - CRITICAL VITALS TEST          ║
╚════════════════════════════════════════════════════════════════╝

📋 STEP 1: START YOUR SERVER
──────────────────────────────
Open a terminal and run:
  npm start

Expected output:
  ✓ Server running on port 5000
  ✓ MongoDB connected


📋 STEP 2: CREATE A TEST PATIENT (If not exists)
──────────────────────────────────────────────────

If you haven't created a patient yet, create one first:

POST http://localhost:5000/api/patients
Content-Type: application/json

Body:
{
  "patientId": "PAT001",
  "name": "John Doe",
  "age": 45,
  "phone": "+919810325677",
  "deviceId": "ESP32_001"
}


📋 STEP 3: POST CRITICAL VITALS USING POSTMAN
──────────────────────────────────────────────

METHOD: POST
URL: http://localhost:5000/api/vitals

Headers:
  Content-Type: application/json

Body (CRITICAL VITALS - This will trigger alerts):
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 125,
  "spo2": 88,
  "temperature": 102.5
}

⚠️  Why these values are critical:
  ❌ Heart Rate: 125 (normal is 60-100, threshold >110)
  ❌ SpO2: 88 (normal is 95-100, threshold <92)
  ❌ Temperature: 102.5°F (normal is 98.6, threshold >100.4)


📋 STEP 4: WHAT HAPPENS AFTER YOU SEND
──────────────────────────────────────

✅ Server will:
  1. Save vitals to MongoDB
  2. Calculate risk score (will be HIGH)
  3. Send WhatsApp alert via Twilio (to +919810325677)
  4. Send SMS alert via AWS SNS (to +919810325677)
  5. Save alert data to AWS S3 bucket

Expected Response:
{
  "message": "Vitals stored",
  "vitals": {
    "_id": "...",
    "patientId": "...",
    "heartRate": 125,
    "spo2": 88,
    "temperature": 102.5,
    "createdAt": "2026-01-30T..."
  },
  "risk": {
    "score": 1,
    "riskLevel": "HIGH"
  }
}


📋 STEP 5: VERIFY AWS S3 STORAGE
────────────────────────────────

After posting critical vitals:

1. Go to AWS Console: https://console.aws.amazon.com/s3
2. Open your bucket: smart-ward-ews
3. Navigate to: alerts/
4. You should see JSON files with timestamps:
   - alert_20260130_054709.json
   - alert_20260130_055001.json
   - etc.

5. Click on a file and click "Open" to view the stored alert data


📋 STEP 6: VERIFY TWILIO WHATSAPP
─────────────────────────────────

1. Check your WhatsApp on phone: +919810325677
2. You should receive a message like:

🚨 SMART WARD ALERT

🧑 Patient: John Doe
🆔 Patient ID: PAT001

❤️ Heart Rate: 125
🫁 SpO₂: 88%
🌡 Temperature: 102.5°F

⚠️ Risk Level: HIGH
📢 Alerts: High Heart Rate, Low SpO2, High Temperature


📋 STEP 7: VERIFY AWS SNS SMS
──────────────────────────────

1. Check your actual SMS/phone
2. You should receive an SMS alert with similar information


═════════════════════════════════════════════════════════════════

📊 TEST SCENARIOS
═════════════════════════════════════════════════════════════════

SCENARIO 1: NORMAL VITALS (No alerts)
──────────────────────────────────────
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 72,
  "spo2": 98,
  "temperature": 98.6
}
Result: ✅ Saved to DB, ❌ No alert sent, ❌ Not saved to S3


SCENARIO 2: MEDIUM RISK (No critical alert)
───────────────────────────────────────────
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 100,
  "spo2": 94,
  "temperature": 99.5
}
Result: ✅ Saved to DB, ✅ Alert sent, ✅ Saved to S3


SCENARIO 3: HIGH RISK CRITICAL (Full alerts!)
──────────────────────────────────────────────
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 130,
  "spo2": 85,
  "temperature": 104.0
}
Result: ✅ Saved to DB, ✅ Alert sent, ✅ WhatsApp sent, ✅ SMS sent, ✅ S3 saved


═════════════════════════════════════════════════════════════════

🎯 RISK CALCULATION
═════════════════════════════════════════════════════════════════

CRITICAL THRESHOLDS:
  ❌ Heart Rate > 110 bpm        = +0.4 risk
  ❌ SpO2 < 92%                  = +0.4 risk
  ❌ Temperature > 100.4°F        = +0.2 risk

RISK LEVELS:
  score >= 0.7  → HIGH (Alert + WhatsApp + SMS + S3)
  score >= 0.4  → MEDIUM (Alert only)
  score < 0.4   → LOW (No alert)


═════════════════════════════════════════════════════════════════

💡 TESTING CHECKLIST
═════════════════════════════════════════════════════════════════

□ Server running on port 5000
□ Patient created with correct patientId
□ Posted critical vitals via Postman
□ Received 201 response with HIGH risk
□ WhatsApp message received
□ SMS message received (optional, check AWS SNS logs)
□ S3 bucket has new alert JSON files
□ Alert data contains correct vitals and timestamps


═════════════════════════════════════════════════════════════════

🔧 TROUBLESHOOTING
═════════════════════════════════════════════════════════════════

Problem: Response 404 - Patient not found
Solution: Create patient first with correct patientId

Problem: Response 500 - MongoDB error
Solution: Check MONGO_URI in .env file

Problem: Alert not sent
Solution: Check if risk.riskLevel === "HIGH"
          Check Twilio credentials in .env

Problem: S3 file not created
Solution: Check AWS credentials in .env
          Check AWS_S3_BUCKET name

Problem: No WhatsApp message
Solution: Check phone number format (+919810325677)
          Check Twilio account has WhatsApp approved


═════════════════════════════════════════════════════════════════

📞 QUICK POSTMAN TEMPLATE
═════════════════════════════════════════════════════════════════

Method: POST
URL: http://localhost:5000/api/vitals

Body:
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 125,
  "spo2": 88,
  "temperature": 102.5
}

Send and watch:
✅ Response - Check risk level
✅ WhatsApp - Should receive message
✅ S3 - Check for new alert file
✅ SMS - Should receive text (if configured)

═════════════════════════════════════════════════════════════════

That's it! You can now test both AWS and Twilio in action! 🚀

`);
