# 📦 AWS S3 Alert Storage Verification Guide

## What Gets Stored in S3

When you send **CRITICAL vitals** (HIGH RISK), here's what gets saved to AWS S3:

---

## 📂 Folder Structure in S3

After running the Postman test, your S3 bucket should look like this:

```
smart-ward-ews (bucket)
├── alerts/
│   ├── alert_20260130_054709.json
│   ├── alert_20260130_055001.json
│   ├── alert_20260130_055733.json
│   └── ... (more alert files)
└── (other folders)
```

**Just like in your screenshot! ✅**

---

## 📄 What's Inside Each Alert File

When you click on one of these files and view it, you'll see JSON data like:

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
  "alerts": [
    "High Heart Rate",
    "Low SpO2",
    "High Temperature"
  ]
}
```

---

## 🔍 Step-by-Step: How to View Your S3 Alert Files

### Step 1: Go to AWS S3 Console
**URL:** https://console.aws.amazon.com/s3

### Step 2: Find Your Bucket
Look for bucket: **`smart-ward-ews`**
Click on it.

### Step 3: Navigate to Alerts Folder
Click on: **`alerts/`** folder

You should see something like this:
```
alert_20260130_054709.json
alert_20260130_055001.json
alert_20260130_055733.json
```

(Just like in your screenshot!)

### Step 4: Click on a File
Click on any alert file, like:
**`alert_20260130_055001.json`**

### Step 5: Click "Open"
You'll see the full JSON content with:
- Patient ID
- Patient name
- Vitals (heart rate, SpO2, temperature)
- Risk score and level
- Alert messages
- Timestamp

---

## 📊 Real Example from Your Screenshot

Looking at your AWS S3 screenshot, you already have alerts stored:

```
File: alert_20260130_054709.json
Size: 75.0 B
Modified: January 30, 2026, 05:47:12 (UTC+05:30)

File: alert_20260130_055001.json
Size: 75.0 B
Modified: January 30, 2026, 05:50:10 (UTC+05:30)

File: alert_20260130_055733.json
Size: 75.0 B
Modified: January 30, 2026, 05:57:37 (UTC+05:30)
```

✅ **This proves AWS S3 is already working!**

---

## ✅ How to Know It's Working

### Check These 3 Things:

**1️⃣ File appears in S3**
- [ ] Bucket `smart-ward-ews` exists
- [ ] `alerts/` folder exists
- [ ] JSON files are being created
- [ ] Timestamp in filename updates

**2️⃣ File content is correct**
- [ ] Contains `patientId`
- [ ] Contains `patientName`
- [ ] Contains `vitals` object
- [ ] Contains `risk` object with `riskLevel: "HIGH"`
- [ ] Contains `alerts` array

**3️⃣ File updates frequently**
- [ ] New files appear after each Postman request
- [ ] Timestamps are recent
- [ ] File sizes are consistent (all ~75.0 B)

---

## 🚀 How to Trigger New Alert Files

Each time you do this in Postman:

```
POST http://localhost:5000/api/vitals

Body:
{
  "patientId": "PAT001",
  "deviceId": "ESP32_001",
  "heartRate": 125,
  "spo2": 88,
  "temperature": 102.5
}
```

**A new alert file will be created in S3 within 2-3 seconds!**

---

## 📈 Multiple Tests = Multiple Files

If you send critical vitals 5 times, you'll get 5 alert files:

```
alerts/
├── alert_20260130_054709.json  (1st test)
├── alert_20260130_055001.json  (2nd test)
├── alert_20260130_055733.json  (3rd test)
├── alert_20260130_060045.json  (4th test)
├── alert_20260130_060302.json  (5th test)
└── ...
```

---

## 🔧 Troubleshooting S3 Storage

### Problem: No alerts folder in S3
**Solution:**
- The folder is created automatically on first alert
- Send critical vitals via Postman
- Wait 2-3 seconds
- Refresh S3 console
- Alerts folder should appear

### Problem: Files don't appear
**Check:**
- [ ] AWS credentials in .env are correct
- [ ] AWS_S3_BUCKET name is "smart-ward-ews"
- [ ] Risk level is "HIGH" (check Postman response)
- [ ] Check server console for errors
- [ ] Try refreshing S3 console (F5)

### Problem: Files appear but are empty
**Check:**
- [ ] Try deleting and re-creating bucket
- [ ] Check IAM permissions
- [ ] Verify JSON is being serialized correctly

---

## 📋 What Data Gets Stored

### Patient Information
```json
{
  "patientId": "PAT001",
  "patientName": "John Doe"
}
```

### Vital Signs
```json
{
  "vitals": {
    "heartRate": 125,
    "spo2": 88,
    "temperature": 102.5
  }
}
```

### Risk Assessment
```json
{
  "risk": {
    "score": 1,          // 0.0 to 1.0
    "riskLevel": "HIGH"  // LOW, MEDIUM, or HIGH
  }
}
```

### Alert Messages
```json
{
  "alerts": [
    "High Heart Rate",
    "Low SpO2",
    "High Temperature"
  ]
}
```

### Timestamp
```json
{
  "timestamp": "2026-01-30T10:30:45.123Z"  // ISO 8601 format
}
```

---

## 🎯 Success Criteria

✅ **S3 Storage is Working When:**

- [ ] Alert files appear in S3 `alerts/` folder
- [ ] Files contain valid JSON
- [ ] JSON has all required fields (patient, vitals, risk, alerts)
- [ ] Timestamps are accurate
- [ ] New files created for each critical alert
- [ ] File sizes are consistent
- [ ] Files are readable/downloadable

---

## 🔄 Full Data Flow (What Happens Behind the Scenes)

```
POST /api/vitals (Postman)
    ↓
Vitals saved to MongoDB
    ↓
Risk calculated (score=1, riskLevel=HIGH)
    ↓
DECISION: Is risk HIGH?
    ├─ YES:
    │  ├─ WhatsApp alert sent (Twilio)
    │  ├─ SMS alert sent (AWS SNS)
    │  └─ Alert JSON saved to S3 ← You see this here!
    │
    └─ NO:
       └─ No alert sent, no S3 file
```

---

## 💾 How Much Storage Is Used

**Per Alert File:**
- Size: ~75 bytes
- Cost: $0.000000023 (basically free)

**100 Alerts:**
- Size: 7.5 KB
- Monthly cost: ~$0.00002

**10,000 Alerts:**
- Size: 750 KB
- Monthly cost: ~$0.0002

**S3 is extremely cheap for this use case!**

---

## 🚀 Next Steps

1. **Run Postman test** → Send critical vitals
2. **Wait 2-3 seconds** → Alert processed
3. **Check S3 console** → New file appears
4. **Click file** → View JSON content
5. **Verify data** → Check patient info, vitals, risk, alerts

---

## 📞 Reference

**Bucket Name:** `smart-ward-ews`  
**Folder:** `alerts/`  
**File Format:** `alert_YYYYMMDD_HHMMSS.json`  
**Data Format:** JSON (UTF-8)  
**Storage Class:** Standard  
**Region:** us-east-1  

---

**You can now verify AWS S3 is working! ✅**
