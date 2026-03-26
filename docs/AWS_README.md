# AWS S3 & SMS Integration README

## Overview

Smart Ward EWS now includes **AWS S3** and **SMS alert** capabilities for critical patients.

### What's New

When a patient's vital signs indicate **HIGH RISK** (heart rate > 110, SpO₂ < 92, or temperature outside 95-100.4°F):

1. **WhatsApp Alert** - Sent via Twilio (existing feature)
2. **AWS S3 Storage** - Patient data automatically saved ⭐ NEW
3. **SMS Alert** - Sent to patient phone via AWS SNS ⭐ NEW

---

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure AWS Credentials

Get these from AWS Console:
```bash
# .env file
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
SMS_PROVIDER=aws
```

### 3. Start Server
```bash
npm start
```

### 4. Test
- Create patient with phone number in format: `+1234567890`
- Trigger HIGH RISK alert (e.g., heart rate > 110)
- Check for SMS, WhatsApp, and S3 data

---

## Features

### 1. Automatic Critical Data Backup
Critical patient data is automatically saved to AWS S3:
```json
{
  "patientId": "PAT001",
  "patientName": "John Doe",
  "timestamp": "2026-01-30T10:30:45Z",
  "vitals": {
    "heartRate": 115,
    "spo2": 90,
    "temperature": 101.5
  },
  "risk": {
    "score": 1.0,
    "riskLevel": "HIGH"
  },
  "alerts": ["High Heart Rate", "Low SpO2"]
}
```

### 2. SMS Alerts to Patients
When critical, SMS is sent to patient:
```
🚨 CRITICAL ALERT - Smart Ward EWS
Patient: John Doe
❤️ Heart Rate: 115 bpm
🫁 SpO₂: 90%
🌡 Temperature: 101.5°F
⚠️ Risk Level: HIGH
Please check patient immediately!
```

### 3. Patient History Export
Export all vitals and alerts for a patient:
```bash
POST /api/alerts/export/PAT001
```

---

## Configuration

### Environment Variables
```bash
# Required
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=bucket-name

# Optional
SMS_PROVIDER=aws  # or 'twilio'
```

### Phone Number Format
Must be in E.164 format:
- ✅ `+14155552671` (correct)
- ❌ `14155552671` (missing +)
- ❌ `(415) 555-2671` (spaces)

---

## API Endpoints

### Archive Patient Data
```bash
POST /api/alerts/archive/:patientId
# Archives critical patient data to S3
```

### Archive All Critical Patients
```bash
POST /api/alerts/archive-all
# Archives all HIGH RISK patients
```

### Export Patient History
```bash
POST /api/alerts/export/:patientId
# Exports all vitals and alerts to S3
```

### Send SMS to Patient
```bash
POST /api/patients/:patientId/send-sms
Body: { message: "Custom message (optional)" }
```

See `API_ENDPOINTS_EXAMPLES.js` for complete code examples.

---

## AWS Setup

### 1. Create S3 Bucket
```bash
aws s3api create-bucket \
  --bucket smart-ward-critical-patients \
  --region us-east-1
```

### 2. Create IAM User
1. Go to AWS IAM → Users
2. Create user: `smart-ward-app`
3. Generate Access Keys
4. Attach policies:
   - `AmazonS3FullAccess`
   - `AmazonSNSFullAccess`

### 3. Enable SNS SMS
1. Go to AWS SNS Console
2. Check SMS messaging is enabled
3. Configure spending limit

---

## Costs

| Service | Price |
|---------|-------|
| S3 Storage | $0.023/GB/month |
| SNS SMS | $0.00645/SMS (US) |

Example: 100 SMS + 1GB storage = **~$0.67/month**

---

## Documentation

- 📘 [AWS_S3_SMS_SETUP.md](./AWS_S3_SMS_SETUP.md) - Complete setup guide
- 📗 [AWS_S3_SMS_QUICK_START.md](./AWS_S3_SMS_QUICK_START.md) - Quick reference
- 📙 [AWS_CONFIGURATION_REFERENCE.md](./AWS_CONFIGURATION_REFERENCE.md) - Detailed reference
- 📓 [API_ENDPOINTS_EXAMPLES.js](./API_ENDPOINTS_EXAMPLES.js) - Code examples
- ✅ [VERIFICATION_CHECKLIST.md](./VERIFICATION_CHECKLIST.md) - Testing checklist

---

## Troubleshooting

### SMS Not Sending?
- Check phone number format: `+1234567890`
- Verify AWS region supports SMS
- Check SNS spending limit

### S3 Not Saving?
- Verify AWS credentials
- Check S3 bucket name
- Check IAM permissions

### Server Won't Start?
- Run `npm install` again
- Check .env file exists
- Review console errors

See detailed troubleshooting in [AWS_S3_SMS_SETUP.md](./AWS_S3_SMS_SETUP.md).

---

## Files Added

```
/backend/
├── src/config/aws.js ................. AWS S3 & SNS client
├── src/services/sms.service.js ...... SMS service
├── src/services/backup.service.js ... Backup & export service
└── .env.example ..................... Environment template

/docs/
├── AWS_S3_SMS_SETUP.md .............. Complete guide
├── AWS_S3_SMS_QUICK_START.md ........ Quick start
├── AWS_CONFIGURATION_REFERENCE.md .. Reference
└── API_ENDPOINTS_EXAMPLES.js ........ Code examples
```

---

## Support

For setup issues, see:
👉 [AWS_S3_SMS_SETUP.md → Troubleshooting](./AWS_S3_SMS_SETUP.md)

For code examples:
👉 [API_ENDPOINTS_EXAMPLES.js](./API_ENDPOINTS_EXAMPLES.js)

---

**Status:** ✅ Production Ready  
**Last Updated:** January 30, 2026
