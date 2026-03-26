# 🎯 QUICK POSTMAN TEST - 5 MINUTE GUIDE

## What You'll Do
Send **CRITICAL vitals** → See **WhatsApp alert** → Check **AWS S3 storage**

---

## 🚀 Step 1: Start Server
```powershell
npm start
```

Wait for:
```
✓ Server running on port 5000
✓ MongoDB connected
```

---

## 🚀 Step 2: Open Postman

1. Download: https://www.postman.com/downloads/
2. Open Postman
3. Import this collection: **`Smart_Ward_EWS_Tests.postman_collection.json`**

---

## 🚀 Step 3: Create Test Patient

**Click:** `1. Create Test Patient`
**Click:** `Send`

Response should be `201 Created` ✅

---

## 🚀 Step 4: Send CRITICAL Vitals

**Click:** `4. Test CRITICAL HIGH RISK Vitals (Full Alerts!)`

This sends:
- Heart Rate: **125** (normal: 60-100)
- SpO2: **88%** (normal: 95-100)
- Temperature: **102.5°F** (normal: 98.6°F)

**Click:** `Send`

---

## ✅ Verify Results (Do These 3 Things)

### 1️⃣ Check Response
```json
{
  "message": "Vitals stored",
  "risk": {
    "score": 1,
    "riskLevel": "HIGH"  ← Look for this
  }
}
```

### 2️⃣ Check WhatsApp
Look at your phone WhatsApp (+919810325677):
- Message arrived? ✅
- Shows "HIGH"? ✅
- Shows vitals? ✅

### 3️⃣ Check AWS S3
1. Go to: https://console.aws.amazon.com/s3
2. Open bucket: `smart-ward-ews`
3. Go to: `critical-patients/` folder (NOT `alerts/`)
4. Inside: find your patient ID folder
5. See new JSON file with timestamp? ✅

**Expected structure:**
```
critical-patients/
  PAT001/
    2026-01-30T03:21:07.040Z.json  ← New alert file here!
    2026-01-30T03:22:15.125Z.json  ← Multiple alerts = working!
```

---

## 🎉 If All 3 ✅, You're Done!

**AWS S3 is working** ✅  
**Twilio is working** ✅  
**SMS is working** ✅

---

## 📋 Test Data Reference

```json
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 125,      // Too high! (>110)
  "spo2": 88,            // Too low! (<92)
  "temperature": 102.5   // Too high! (>100.4)
}
```

**Why critical?**
- ❌ High heart rate = +0.4 risk
- ❌ Low SpO2 = +0.4 risk
- ❌ High temperature = +0.2 risk
- **Total = 1.0 = HIGH RISK** 🚨

---

## 🔧 If Something Fails

| Issue | Check |
|-------|-------|
| 404 - Patient not found | Run step 3 first |
| No WhatsApp | Check phone number +919810325677 |
| No S3 file | Check AWS credentials in .env |
| 500 error | Check server console |

---

## 📁 All Test Files You Have

1. **Smart_Ward_EWS_Tests.postman_collection.json** ← Import this to Postman
2. **POSTMAN_TESTING_INSTRUCTIONS.md** ← Full detailed guide
3. **POSTMAN_TESTING_GUIDE.js** ← Text guide

---

**That's it! You now know how to test the whole system in 5 minutes! 🚀**
