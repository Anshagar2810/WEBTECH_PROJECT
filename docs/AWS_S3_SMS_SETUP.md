# AWS S3 & SMS Integration Guide

## Overview
This guide explains how to integrate AWS S3 and AWS SNS with your Smart Ward EWS application for:
- Saving critical patient data to AWS S3
- Sending SMS alerts via AWS SNS
- Archiving and exporting patient history

## Prerequisites
- AWS Account with S3 and SNS enabled
- AWS IAM user with S3 and SNS permissions
- AWS Access Key ID and Secret Access Key

## Installation

### 1. Install AWS SDK Packages
The following packages have been added to `package.json`:
```bash
npm install @aws-sdk/client-s3 @aws-sdk/client-sns
```

### 2. Configure Environment Variables
Add the following to your `.env` file:

```bash
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_S3_BUCKET=your-bucket-name

# SMS Provider (use 'aws' for SNS, 'twilio' for Twilio)
SMS_PROVIDER=aws

# Twilio Configuration (optional, for SMS fallback)
TWILIO_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_FROM=+1234567890
```

## Files Created

### 1. `/backend/src/config/aws.js`
AWS configuration for S3 and SNS clients.

**Key Functions:**
- `saveCriticalPatientDataToS3(patient, vitals, risk, alerts)` - Saves critical patient data to S3
- `sendSMSViaSNS(phoneNumber, message)` - Sends SMS via AWS SNS

### 2. `/backend/src/services/sms.service.js`
SMS service supporting both Twilio and AWS SNS.

**Key Functions:**
- `sendSMSViaTwilio(phoneNumber, message)` - Sends SMS via Twilio
- `sendCriticalPatientSMS(phoneNumber, patientName, vitals, risk, alerts)` - Sends formatted SMS alert

### 3. `/backend/src/services/backup.service.js`
Backup and export service for patient data to S3.

**Key Functions:**
- `archivePatientCriticalDataToS3(patientId)` - Archive specific patient's critical data
- `archiveAllCriticalPatientsToS3()` - Archive all critical patients' data
- `exportPatientHistoryToS3(patientId)` - Export complete patient history (all vitals & alerts)

## Integration Points

### Alert Service (`/backend/src/services/alert.service.js`)
When a **HIGH RISK** alert is triggered:
1. WhatsApp alert is sent via Twilio (existing)
2. **NEW:** Critical patient data is saved to S3
3. **NEW:** SMS alert is sent to patient phone

### Data Structure in S3
Critical patient data is saved with the following structure:
```
s3://your-bucket/critical-patients/{patientId}/{timestamp}.json
```

Example JSON structure:
```json
{
  "patientId": "PAT001",
  "patientName": "John Doe",
  "timestamp": "2026-01-30T10:30:45.123Z",
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

## Usage Examples

### 1. Send SMS to Critical Patient
```javascript
import { sendCriticalPatientSMS } from "./services/sms.service.js";

await sendCriticalPatientSMS(
  "+1234567890",
  "John Doe",
  { heartRate: 115, spo2: 90, temperature: 101.5 },
  { score: 1.0, riskLevel: "HIGH" },
  ["High Heart Rate", "Low SpO2"]
);
```

### 2. Archive Patient Data
```javascript
import { archivePatientCriticalDataToS3 } from "./services/backup.service.js";

// Archive specific patient
await archivePatientCriticalDataToS3("PAT001");

// Archive all critical patients
await archiveAllCriticalPatientsToS3();
```

### 3. Export Patient History
```javascript
import { exportPatientHistoryToS3 } from "./services/backup.service.js";

await exportPatientHistoryToS3("PAT001");
// Creates: s3://bucket/patient-exports/PAT001/{timestamp}-history.json
```

## AWS Setup Guide

### Step 1: Create S3 Bucket
1. Go to AWS S3 Console
2. Click "Create bucket"
3. Enter bucket name (e.g., `smart-ward-critical-patients`)
4. Choose region
5. Leave default settings and create

### Step 2: Create IAM User
1. Go to AWS IAM → Users
2. Click "Create user"
3. Enter username (e.g., `smart-ward-app`)
4. Click "Create user"

### Step 3: Attach Policies
1. Click on the user
2. Go to "Permissions" tab
3. Click "Add permissions" → "Attach policies directly"
4. Search and select:
   - `AmazonS3FullAccess` (or create custom policy below)
   - `AmazonSNSFullAccess` (or create custom policy below)

### Step 4: Create Access Keys
1. Go to "Security credentials" tab
2. Click "Create access key"
3. Choose "Application running outside AWS"
4. Copy **Access Key ID** and **Secret Access Key**
5. Add to `.env` file

### Custom IAM Policy (Recommended)
For least privilege access, create this custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::your-bucket-name",
        "arn:aws:s3:::your-bucket-name/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "sns:Publish"
      ],
      "Resource": "arn:aws:sns:*:*:*"
    }
  ]
}
```

### Step 5: Setup SNS for SMS
1. Go to AWS SNS Console
2. Ensure SMS messaging is configured
3. Set appropriate spending limit
4. SMS will be sent to phone numbers in E.164 format (e.g., +1234567890)

## Phone Number Format
Phone numbers must be in E.164 format for SMS:
- Valid: `+14155552671`
- Invalid: `14155552671` or `(415) 555-2671`

Patient phone numbers are automatically converted if they don't start with `+`.

## Switching Between SMS Providers

### Use AWS SNS
```bash
SMS_PROVIDER=aws
```

### Use Twilio
```bash
SMS_PROVIDER=twilio
```

## Monitoring & Testing

### Test S3 Connection
```bash
node -e "import('./src/config/aws.js').then(m => console.log(m.getS3() ? 'S3 OK' : 'S3 FAILED'))"
```

### Test SNS Connection
```bash
node -e "import('./src/config/aws.js').then(m => console.log(m.getSNS() ? 'SNS OK' : 'SNS FAILED'))"
```

### View S3 Bucket Contents
1. Go to AWS S3 Console
2. Click bucket name
3. Navigate through folders to see saved data

## Troubleshooting

### "Missing AWS_S3_BUCKET in .env"
- Add `AWS_S3_BUCKET=your-bucket-name` to .env

### "Missing AWS credentials"
- Ensure AWS_REGION, AWS_ACCESS_KEY_ID, and AWS_SECRET_ACCESS_KEY are set

### SMS not sending via SNS
- Verify phone number is in E.164 format
- Check SNS spending limit hasn't been reached
- Verify SMS capability is enabled in your AWS region

### S3 permission denied
- Ensure IAM user has S3 permissions
- Check bucket policy isn't blocking access
- Verify credentials are correct

## Cost Considerations
- **S3**: $0.023 per GB stored (varies by region)
- **SNS SMS**: $0.00645 per SMS (US pricing)

## Security Best Practices
1. ✅ Use IAM user instead of root credentials
2. ✅ Rotate access keys regularly
3. ✅ Use custom IAM policy with minimal permissions
4. ✅ Enable S3 encryption at rest
5. ✅ Never commit `.env` file to version control
6. ✅ Use AWS Secrets Manager for production

## Additional Resources
- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [AWS SDK for JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
