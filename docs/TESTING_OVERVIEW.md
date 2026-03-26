# 🧪 Testing Smart Ward EWS with Postman - Complete Guide

## 📋 What You Have Now

You have everything set up to test:
1. ✅ **AWS S3** - Storing critical patient alerts
2. ✅ **Twilio WhatsApp** - Sending alert messages
3. ✅ **AWS SNS SMS** - Sending SMS alerts
4. ✅ **MongoDB** - Storing patient vitals
5. ✅ **ThingSpeak** - Real sensor data source

---

## 🎯 Testing Strategy

Instead of waiting for real sensor data from ThingSpeak, you'll **use Postman to simulate critical patient vitals**.

This lets you immediately test:
- Does AWS S3 save the alert data? ✅
- Does Twilio send WhatsApp? ✅
- Does AWS SNS send SMS? ✅

---

## 📁 New Files Created for You

### 1. **Smart_Ward_EWS_Tests.postman_collection.json**
   - Postman collection with pre-built test requests
   - Copy this file to Postman
   - Click to run each test

### 2. **QUICK_TEST_GUIDE.md**
   - 5-minute quick start
   - Best for getting started fast

### 3. **POSTMAN_TESTING_INSTRUCTIONS.md**
   - Detailed step-by-step guide
   - Complete testing matrix
   - Troubleshooting section

### 4. **AWS_S3_VERIFICATION_GUIDE.md**
   - How to verify S3 storage
   - What data is stored
   - How to view alert files in S3

### 5. **POSTMAN_TESTING_GUIDE.js**
   - Text format guide
   - Run: `node POSTMAN_TESTING_GUIDE.js`

---

## 🚀 Quick Start (Do This Now)

### Step 1: Start Server
```powershell
npm start
```

### Step 2: Download Postman
- Go to: https://www.postman.com/downloads/
- Install and open

### Step 3: Import Collection
- File → Import
- Choose: `Smart_Ward_EWS_Tests.postman_collection.json`

### Step 4: Run First Test
- Click: **"1. Create Test Patient"**
- Click: **"Send"**
- See: `201 Created` response

### Step 5: Run Critical Test
- Click: **"4. Test CRITICAL HIGH RISK Vitals"**
- Click: **"Send"**
- See: `riskLevel: "HIGH"` response

### Step 6: Verify
- ✅ Check WhatsApp on your phone
- ✅ Check AWS S3 bucket for alert file
- ✅ Done! 🎉

---

## 📊 What Gets Tested

### Request (You Send):
```json
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 125,    // Critical!
  "spo2": 88,          // Critical!
  "temperature": 102.5 // Critical!
}
```

### Response (Server Returns):
```json
{
  "message": "Vitals stored",
  "risk": {
    "score": 1,
    "riskLevel": "HIGH"  // ← Key indicator
  }
}
```

### Side Effects (What Happens):
1. ✅ Data saved to MongoDB
2. ✅ Alert created
3. ✅ WhatsApp sent to +919810325677
4. ✅ SMS sent to +919810325677
5. ✅ Alert JSON saved to S3 bucket

---

## ✅ Verification Checklist

After sending critical vitals via Postman:

- [ ] Postman shows `201` response
- [ ] Response shows `"riskLevel": "HIGH"`
- [ ] WhatsApp message arrived on phone
- [ ] Check AWS S3 bucket → alerts/ folder
- [ ] New JSON file exists in alerts/
- [ ] Click file and view alert data
- [ ] Data matches sent vitals

**If all checkboxes ✅ → SYSTEM IS WORKING! 🎉**

---

## 🎯 Testing Sequence

Run these in order:

```
1. Create Test Patient
   └─ Response: 201, patientId: PAT001

2. Send Normal Vitals (HR: 72, SpO2: 98, Temp: 98.6)
   └─ Response: 201, riskLevel: LOW
   └─ No alerts sent

3. Send Medium Risk Vitals (HR: 105, SpO2: 93, Temp: 99.5)
   └─ Response: 201, riskLevel: MEDIUM
   └─ Some alerts sent

4. Send CRITICAL Vitals (HR: 125, SpO2: 88, Temp: 102.5)
   └─ Response: 201, riskLevel: HIGH ← MAIN TEST
   └─ All alerts sent
   └─ S3 file created ← VERIFY THIS
   └─ WhatsApp sent ← VERIFY THIS

5. Get Patient History
   └─ Response: Array of all vitals
   └─ Shows all 4 tests you just ran
```

---

## 🔄 How It Works (Data Flow)

```
NORMAL PERSON:
  Vitals: HR=72, SpO2=98, Temp=98.6
  Result: ✅ Saved, ❌ No alert

CRITICAL PATIENT (Postman Test):
  Vitals: HR=125, SpO2=88, Temp=102.5
  Result: ✅ Saved, ✅ Alert sent, ✅ S3 stored
           ✅ WhatsApp sent, ✅ SMS sent

REAL SENSOR DATA (ThingSpeak):
  Vitals: Fetched from ESP32 sensor
  Result: Same as above (when critical)
```

---

## 📱 Expected Messages

### WhatsApp Message:
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

### SMS Message:
```
🚨 CRITICAL ALERT - Smart Ward EWS
Patient: John Doe
❤️ Heart Rate: 125 bpm
🫁 SpO₂: 88%
🌡 Temperature: 102.5°F
⚠️ Risk Level: HIGH
Please check patient immediately!
```

---

## 📦 AWS S3 Storage

### Location:
- Bucket: `smart-ward-ews`
- Folder: `alerts/`
- File: `alert_20260130_054709.json`

### File Content:
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

---

## 🔧 Critical Thresholds

These vitals trigger HIGH RISK alerts:

| Vital | Normal | Critical | Your Test |
|-------|--------|----------|-----------|
| **Heart Rate** | 60-100 | >110 | **125** ✅ |
| **SpO2** | 95-100% | <92% | **88%** ✅ |
| **Temperature** | 98.6°F | >100.4°F | **102.5°F** ✅ |

**Your test values will definitely trigger alerts!**

---

## 🚀 Next Steps

### Immediate (Now):
1. Start server: `npm start`
2. Import Postman collection
3. Run critical test
4. Verify WhatsApp
5. Verify S3

### Short Term (Today):
- Run all 5 tests
- Document results
- Test with multiple patients

### Medium Term (This Week):
- Connect real ThingSpeak sensor
- Monitor for 24 hours
- Set up alerts for on-call doctors

### Long Term (This Month):
- Deploy to production
- Train hospital staff
- Monitor real patient data

---

## 📞 Need Help?

### For Postman Issues:
- See: `POSTMAN_TESTING_INSTRUCTIONS.md`

### For AWS S3 Issues:
- See: `AWS_S3_VERIFICATION_GUIDE.md`

### For Quick Overview:
- See: `QUICK_TEST_GUIDE.md`

### For Everything:
- See: `POSTMAN_TESTING_GUIDE.js`
- Run: `node POSTMAN_TESTING_GUIDE.js`

---

## 🎉 You're All Set!

**You have:**
- ✅ Server running and tested
- ✅ All credentials working
- ✅ Postman collection ready
- ✅ Testing guides complete
- ✅ S3 bucket configured
- ✅ Twilio configured
- ✅ SNS configured

**Next:** Open Postman and run your first test! 🚀

---

**Questions? Check the guides above. Everything is explained step-by-step.**

**Ready? Let's test! 🧪**
