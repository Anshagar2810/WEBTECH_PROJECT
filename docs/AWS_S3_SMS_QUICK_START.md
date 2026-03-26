# AWS S3 & SMS Implementation Summary

## What Was Added

### 1. **AWS S3 Integration** (`/backend/src/config/aws.js`)
- Saves critical patient vital data to AWS S3
- Stores data in JSON format with timestamp
- Folder structure: `critical-patients/{patientId}/{timestamp}.json`

### 2. **SMS Service** (`/backend/src/services/sms.service.js`)
- Supports both **AWS SNS** and **Twilio** for SMS
- Switch providers via `SMS_PROVIDER` environment variable
- Sends formatted alerts with patient vitals and risk level

### 3. **Enhanced Alert System**
- When HIGH RISK is detected, the system now:
  1. Sends WhatsApp via Twilio (existing)
  2. **NEW:** Saves patient data to S3
  3. **NEW:** Sends SMS alert to patient phone

### 4. **Backup & Export Service** (`/backend/src/services/backup.service.js`)
- Archive critical patient data on demand
- Export complete patient history (all vitals & alerts)
- Batch archive all critical patients

## Quick Start

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Configure AWS
Get from AWS Console:
- Access Key ID
- Secret Access Key
- Region (e.g., us-east-1)
- S3 Bucket Name

### Step 3: Update `.env`
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET=your-bucket-name
SMS_PROVIDER=aws
```

### Step 4: Start Server
```bash
npm start
```

## How It Works

### When HIGH RISK Alert Triggers:
```
Patient Vitals (HIGH RISK detected)
    ↓
    ├─→ WhatsApp Alert (Twilio) ✓ Existing
    ├─→ Save to S3 ✓ New
    └─→ SMS Alert (AWS SNS/Twilio) ✓ New
```

### S3 Data Structure:
```
s3://bucket/critical-patients/PAT001/2026-01-30T10:30:45.123Z.json
{
  "patientId": "PAT001",
  "patientName": "John Doe",
  "timestamp": "2026-01-30T10:30:45.123Z",
  "vitals": { heartRate, spo2, temperature },
  "risk": { score, riskLevel },
  "alerts": ["High Heart Rate", "Low SpO2"]
}
```

## API Functions

### Send SMS to Patient
```javascript
import { sendCriticalPatientSMS } from './services/sms.service.js';

await sendCriticalPatientSMS(
  "+1234567890",           // Phone number
  "John Doe",              // Patient name
  vitals,                  // { heartRate, spo2, temperature }
  risk,                    // { score, riskLevel }
  alerts                   // Array of alert messages
);
```

### Archive Patient Data
```javascript
import { archivePatientCriticalDataToS3 } from './services/backup.service.js';

// Archive one patient
await archivePatientCriticalDataToS3("PAT001");

// Archive all critical patients
await archiveAllCriticalPatientsToS3();

// Export complete history
await exportPatientHistoryToS3("PAT001");
```

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `AWS_REGION` | AWS region | `us-east-1` |
| `AWS_ACCESS_KEY_ID` | AWS access key | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_S3_BUCKET` | S3 bucket name | `smart-ward-patients` |
| `SMS_PROVIDER` | SMS provider | `aws` or `twilio` |

## AWS Setup Checklist

- [ ] Create AWS Account
- [ ] Create S3 Bucket
- [ ] Create IAM User
- [ ] Attach S3 & SNS policies
- [ ] Create Access Keys
- [ ] Configure SNS for SMS
- [ ] Update `.env` file
- [ ] Run `npm install`
- [ ] Test connection

## Testing

### List S3 Objects
```bash
aws s3 ls s3://your-bucket-name/critical-patients/ --recursive
```

### View Patient Data
```bash
aws s3 cp s3://your-bucket-name/critical-patients/PAT001/timestamp.json - | jq
```

## Database Models

No database changes required. Uses existing:
- `Patient` model (name, phone, patientId)
- `Vitals` model (heartRate, spo2, temperature)
- `Alert` model (type, message, severity)

## Costs

| Service | Cost |
|---------|------|
| S3 Storage | $0.023/GB/month |
| SNS SMS | $0.00645/SMS (US) |

## Support

For issues, check [AWS_S3_SMS_SETUP.md](./AWS_S3_SMS_SETUP.md) for detailed troubleshooting.
