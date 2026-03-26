# 🧪 POSTMAN Testing Guide - Test AWS S3 & Twilio Alerts

## Overview
This guide shows you how to use Postman to test critical patient vitals and verify that:
1. ✅ **AWS S3** is storing alert data
2. ✅ **Twilio WhatsApp** is sending alerts to the patient
3. ✅ **AWS SNS SMS** is sending SMS alerts (optional)

---

## 🚀 Quick Start (5 minutes)

### Step 1: Start Your Server
```powershell
cd backend
npm start
```

You should see:
```
✓ Server running on port 5000
✓ MongoDB connected
✓ AWS S3 ready
✓ AWS SNS ready
```

### Step 2: Download & Open Postman
1. Download Postman from: https://www.postman.com/downloads/
2. Open Postman
3. Import the collection: `Smart_Ward_EWS_Tests.postman_collection.json`

### Step 3: Run Test 1 - Create Patient
Click: **1. Create Test Patient**
- Click **Send**
- You should get **201 response**

### Step 4: Run Test 4 - Send Critical Vitals
Click: **4. Test CRITICAL HIGH RISK Vitals (Full Alerts!)**
- Click **Send**
- You should get **201 response** with `"riskLevel": "HIGH"`

### Step 5: Verify Results
✅ Check WhatsApp for alert message  
✅ Check AWS S3 for new alert file  
✅ Check SMS (if SNS is configured)

---

## 📋 Complete Testing Steps

### Setup Phase

#### Create a Test Patient
**First, you need to create a patient in the database.**

**Method:** `POST`  
**URL:** `http://localhost:5000/api/patients`  
**Headers:**
```json
Content-Type: application/json
```

**Body:**
```json
{
  "patientId": "PAT001",
  "name": "John Doe",
  "age": 45,
  "phone": "+919810325677",
  "deviceId": "ESP32_001"
}
```

**Expected Response:**
```json
{
  "_id": "...",
  "patientId": "PAT001",
  "name": "John Doe",
  "phone": "+919810325677",
  "deviceId": "ESP32_001"
}
```

---

### Testing Phase

#### Test 1: Normal Vitals (No Alerts)
This is a baseline test - normal vitals should NOT trigger alerts.

**Method:** `POST`  
**URL:** `http://localhost:5000/api/vitals`

**Body:**
```json
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 72,
  "spo2": 98,
  "temperature": 98.6
}
```

**What Happens:**
- ✅ Vitals saved to MongoDB
- ❌ NO alert sent
- ❌ NO S3 file created
- ❌ NO WhatsApp message
- ❌ NO SMS sent

**Expected Response:**
```json
{
  "message": "Vitals stored",
  "risk": {
    "score": 0,
    "riskLevel": "LOW"
  }
}
```

---

#### Test 2: Medium Risk Vitals (With Alert)
Vitals are slightly elevated but not critical.

**Method:** `POST`  
**URL:** `http://localhost:5000/api/vitals`

**Body:**
```json
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 105,
  "spo2": 93,
  "temperature": 99.5
}
```

**What Happens:**
- ✅ Vitals saved to MongoDB
- ✅ Alert sent
- ⚠️ May or may not create S3 file (depends on threshold)
- ⚠️ May or may not send WhatsApp

**Expected Response:**
```json
{
  "message": "Vitals stored",
  "risk": {
    "score": 0.4,
    "riskLevel": "MEDIUM"
  }
}
```

---

#### Test 3: HIGH RISK - CRITICAL VITALS ⚠️
**THIS IS THE MAIN TEST** - Critical vitals will trigger all alerts.

**Method:** `POST`  
**URL:** `http://localhost:5000/api/vitals`

**Body:**
```json
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 125,
  "spo2": 88,
  "temperature": 102.5
}
```

**Why These Values Are Critical:**
```
❌ Heart Rate: 125 bpm
   └─ Normal: 60-100
   └─ Threshold: > 110
   └─ Risk added: +0.4

❌ SpO2: 88%
   └─ Normal: 95-100
   └─ Threshold: < 92
   └─ Risk added: +0.4

❌ Temperature: 102.5°F
   └─ Normal: 98.6°F
   └─ Threshold: > 100.4°F
   └─ Risk added: +0.2

TOTAL RISK SCORE: 0.4 + 0.4 + 0.2 = 1.0
RISK LEVEL: HIGH ✅ (triggers full alert)
```

**Expected Response:**
```json
{
  "message": "Vitals stored",
  "risk": {
    "score": 1,
    "riskLevel": "HIGH"
  }
}
```

**What Happens:**
- ✅ Vitals saved to MongoDB
- ✅ Alert created
- ✅ **WhatsApp message sent via Twilio**
- ✅ **SMS sent via AWS SNS**
- ✅ **Alert data saved to AWS S3**

---

## ✅ Verification Checklist

### 1️⃣ Check Response
After sending critical vitals, check Postman response:
- [ ] Status code is `201`
- [ ] `riskLevel` is `"HIGH"`
- [ ] Message says `"Vitals stored"`

### 2️⃣ Check WhatsApp Message
Look at your phone's WhatsApp (number: +919810325677):
- [ ] Received alert message
- [ ] Message contains patient name
- [ ] Message shows Heart Rate (125)
- [ ] Message shows SpO2 (88%)
- [ ] Message shows Temperature (102.5°F)
- [ ] Message shows Risk Level (HIGH)

**Sample WhatsApp Message:**
```
🚨 SMART WARD ALERT

🧑 Patient: John Doe
🆔 Patient ID: PAT001

❤️ Heart Rate: 125
🫁 SpO₂: 88 %
🌡 Temperature: 102.5 °F

⚠️ Risk Level: HIGH
📢 Alerts: High Heart Rate, Low SpO2, High Temperature
```

### 3️⃣ Check AWS S3 Storage
Go to AWS S3 Console:
1. Login to: https://console.aws.amazon.com/s3
2. Open bucket: `smart-ward-ews`
3. Navigate to: `alerts/` folder
4. You should see new JSON files:
   - `alert_20260130_054709.json`
   - `alert_20260130_055001.json`
   - etc.

**Click on a file and view the stored data:**
```json
{
  "patientId": "PAT001",
  "patientName": "John Doe",
  "timestamp": "2026-01-30T10:30:45.123Z",
  "vitals": {
    "heartRate": 125,
    "spo2": 88,
    "temperature": 102.5
  },
  "risk": {
    "score": 1,
    "riskLevel": "HIGH"
  },
  "alerts": ["High Heart Rate", "Low SpO2", "High Temperature"]
}
```

### 4️⃣ Check SMS (Optional)
If you have SMS configured:
- [ ] Received SMS on your phone
- [ ] SMS contains critical alert info

---

## 📊 Testing Matrix

| Scenario | HR | SpO2 | Temp | Risk | S3 | WhatsApp | SMS |
|----------|----|----|------|------|----|----|-----|
| Normal | 72 | 98 | 98.6 | LOW | ❌ | ❌ | ❌ |
| Medium | 105 | 93 | 99.5 | MEDIUM | ⚠️ | ⚠️ | ⚠️ |
| **HIGH** | **125** | **88** | **102.5** | **HIGH** | **✅** | **✅** | **✅** |
| Extreme | 140 | 85 | 104 | HIGH | ✅ | ✅ | ✅ |

---

## 🔧 Troubleshooting

### Problem: Response 404 - Patient not found
**Solution:**
- Make sure you created the patient first
- Check patientId matches in vitals request
- Use `PAT001` exactly

### Problem: No WhatsApp message received
**Check:**
- [ ] Server is running (`npm start`)
- [ ] Twilio credentials in .env are correct
- [ ] Phone number is +919810325677 (or your configured number)
- [ ] Twilio account has WhatsApp enabled
- [ ] Risk level is "HIGH"

### Problem: S3 file not created
**Check:**
- [ ] AWS credentials in .env are correct
- [ ] AWS_S3_BUCKET name is correct
- [ ] AWS region is correct (us-east-1)
- [ ] IAM user has S3 permissions
- [ ] Risk level is "HIGH"

### Problem: Response 500 - Server error
**Check:**
- [ ] Server is running
- [ ] MongoDB is connected
- [ ] Check server console for error messages
- [ ] Check .env file for missing variables

---

## 🎯 Success Criteria

✅ **Full Test Success** when:
1. ✅ Postman response shows `201` and `riskLevel: "HIGH"`
2. ✅ WhatsApp message received
3. ✅ S3 bucket has new alert JSON file
4. ✅ SMS received (if configured)

---

## 🔄 How to Run Multiple Tests

### Test Sequence (Recommended):
```
1. Create Patient ─────────────┐
                                 │
                                 ▼
2. Send Normal Vitals ──────────┐
   (baseline test, no alerts)    │
                                 ▼
3. Send Medium Risk Vitals ────┐
   (some alerts)                 │
                                 ▼
4. Send CRITICAL Vitals ──────┐
   (FULL ALERTS - Main test)   │
                                 ▼
5. Send Extreme Vitals ───────┐
   (stress test)                 │
                                 ▼
6. Check History ───────────────┘
   (view all vitals)
```

### How to Run:
1. Open Postman
2. Click each test in order
3. Click "Send"
4. Wait for response
5. Verify results

---

## 💡 Key Testing Points

### ✅ You'll Know AWS S3 is Working When:
- S3 bucket shows new alert JSON files
- Files have timestamps in the name
- JSON content has patient vitals and risk info
- Files appear within seconds of sending critical vitals

### ✅ You'll Know Twilio is Working When:
- WhatsApp message arrives on your phone
- Message shows patient name and vitals
- Message shows "Risk Level: HIGH"
- Message arrives within 2-3 seconds of API call

### ✅ You'll Know SMS is Working When:
- SMS message arrives on your phone
- SMS contains alert information
- SMS arrives within 2-3 seconds of API call
- CloudWatch logs show successful SNS publish

---

## 📝 Test Log Template

Use this template to document your tests:

```
Test Date: ___________
Tester: ___________

Test 1: Create Patient
  Status: ✅ ❌
  Notes: ___________

Test 2: Normal Vitals
  Status: ✅ ❌
  WhatsApp Received: ✅ ❌
  Notes: ___________

Test 3: Medium Risk
  Status: ✅ ❌
  WhatsApp Received: ✅ ❌
  Notes: ___________

Test 4: CRITICAL VITALS (Main Test)
  Status: ✅ ❌
  WhatsApp Received: ✅ ❌
  S3 File Created: ✅ ❌
  SMS Received: ✅ ❌
  Notes: ___________

Test 5: Extreme Vitals
  Status: ✅ ❌
  Notes: ___________

OVERALL RESULT: ✅ PASS / ❌ FAIL
```

---

## 🚀 Next Steps After Testing

Once all tests pass:

1. **Deploy to Production** - Your system is ready
2. **Connect Real Sensors** - ThingSpeak will feed data automatically
3. **Monitor CloudWatch** - Track alert delivery
4. **Setup Cost Monitoring** - Monitor S3 and SNS costs
5. **Train Users** - Show doctors how to use the system

---

## 📞 Quick Reference

| Component | Endpoint | Method | Purpose |
|-----------|----------|--------|---------|
| Create Patient | `/api/patients` | POST | Create test patient |
| Send Vitals | `/api/vitals` | POST | Test critical alerts |
| Get History | `/api/vitals/:patientId` | GET | View all vitals |

---

**You're ready to test! 🎉**

1. Start server: `npm start`
2. Open Postman
3. Import collection
4. Run the CRITICAL test
5. Check WhatsApp & S3

That's it! 🚀
