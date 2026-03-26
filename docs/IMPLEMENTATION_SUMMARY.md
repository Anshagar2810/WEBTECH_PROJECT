# AWS S3 & SMS Integration - Implementation Complete ✅

## Summary
Your Smart Ward EWS application now supports:
1. ✅ AWS S3 storage for critical patient data
2. ✅ SMS alerts for critical patients via AWS SNS or Twilio
3. ✅ Patient data backup and archival
4. ✅ Complete patient history export

---

## Files Created/Modified

### New Files Created:
1. **`/backend/src/config/aws.js`**
   - AWS S3 and SNS client initialization
   - Functions to save data to S3
   - Functions to send SMS via SNS

2. **`/backend/src/services/sms.service.js`**
   - SMS service supporting Twilio and AWS SNS
   - Formatted critical patient alerts
   - Provider switching via environment variable

3. **`/backend/src/services/backup.service.js`**
   - Archive critical patient data
   - Export complete patient history
   - Batch archive all critical patients

4. **`AWS_S3_SMS_SETUP.md`**
   - Detailed setup and configuration guide
   - AWS IAM policy examples
   - Troubleshooting section

5. **`AWS_S3_SMS_QUICK_START.md`**
   - Quick implementation guide
   - API function examples
   - Environment variables reference

6. **`API_ENDPOINTS_EXAMPLES.js`**
   - Example Express routes
   - API endpoint usage examples
   - Integration patterns

7. **`/backend/.env.example`**
   - Template environment variables

### Modified Files:
1. **`/backend/package.json`**
   - Added `@aws-sdk/client-s3`
   - Added `@aws-sdk/client-sns`

2. **`/backend/src/services/alert.service.js`**
   - Enhanced to detect HIGH RISK alerts
   - Automatically saves to S3 for critical patients
   - Sends SMS alerts for critical patients

---

## Key Features

### 1. Automatic Critical Patient Handling
When a **HIGH RISK** alert is detected:
```
✓ WhatsApp notification sent (existing)
✓ Patient data saved to S3 (NEW)
✓ SMS alert sent to patient phone (NEW)
```

### 2. S3 Data Organization
```
s3://bucket/
├── critical-patients/
│   ├── PAT001/
│   │   ├── 2026-01-30T10:30:45.123Z.json
│   │   └── 2026-01-30T11:45:22.456Z.json
│   └── PAT002/
│       └── 2026-01-30T10:15:00.789Z.json
└── patient-exports/
    ├── PAT001/
    │   └── 2026-01-30T10-30-45-123-history.json
    └── PAT002/
        └── 2026-01-30T10-15-00-789-history.json
```

### 3. Flexible SMS Provider
Switch between providers via `SMS_PROVIDER`:
- `aws` → Use AWS SNS (lower latency in AWS regions)
- `twilio` → Use Twilio (wider coverage, WhatsApp support)

---

## Quick Setup (5 Steps)

### Step 1: Install Dependencies
```bash
cd backend
npm install
```

### Step 2: Create AWS Resources
- Create S3 bucket (e.g., `smart-ward-critical-patients`)
- Create IAM user with S3 & SNS permissions
- Generate Access Keys

### Step 3: Update `.env`
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_S3_BUCKET=your-bucket-name
SMS_PROVIDER=aws
```

### Step 4: Ensure Patient Phone Numbers
Make sure patient records have valid phone numbers:
```javascript
// Must be in E.164 format: +1234567890
patient.phone = "+1234567890"
```

### Step 5: Start Server
```bash
npm start
```

---

## Usage Examples

### Archive Patient Data
```javascript
import { archivePatientCriticalDataToS3 } from './services/backup.service.js';

// Archive one patient
await archivePatientCriticalDataToS3("PAT001");

// Archive all critical patients
await archiveAllCriticalPatientsToS3();
```

### Send SMS Alert
```javascript
import { sendCriticalPatientSMS } from './services/sms.service.js';

await sendCriticalPatientSMS(
  "+1234567890",
  "John Doe",
  { heartRate: 115, spo2: 90, temperature: 101.5 },
  { score: 1.0, riskLevel: "HIGH" },
  ["High Heart Rate", "Low SpO2"]
);
```

### Export Patient History
```javascript
import { exportPatientHistoryToS3 } from './services/backup.service.js';

// Exports all vitals and alerts to S3
await exportPatientHistoryToS3("PAT001");
```

---

## API Endpoints (Ready to Implement)

See `API_ENDPOINTS_EXAMPLES.js` for:
- `POST /api/alerts/archive/:patientId` - Archive patient data
- `POST /api/alerts/archive-all` - Archive all critical patients
- `POST /api/alerts/export/:patientId` - Export patient history
- `POST /api/patients/:patientId/send-sms` - Send SMS to patient

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `AWS_REGION` | Yes | AWS region (e.g., us-east-1) |
| `AWS_ACCESS_KEY_ID` | Yes | AWS IAM access key |
| `AWS_SECRET_ACCESS_KEY` | Yes | AWS IAM secret key |
| `AWS_S3_BUCKET` | Yes | S3 bucket name |
| `SMS_PROVIDER` | No | `aws` or `twilio` (default: twilio) |
| `TWILIO_SID` | Conditional | Required if SMS_PROVIDER=twilio |
| `TWILIO_AUTH_TOKEN` | Conditional | Required if SMS_PROVIDER=twilio |
| `TWILIO_PHONE_FROM` | Conditional | Required if SMS_PROVIDER=twilio |

---

## Data Structure in S3

Critical patient vitals are saved as JSON:
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

---

## Cost Estimation (Monthly)

| Service | Volume | Cost |
|---------|--------|------|
| S3 Storage | 1 GB critical data | $0.023 |
| SNS SMS | 100 SMS alerts | $0.65 |
| **Total** | | **~$0.70** |

(Varies by region and usage)

---

## Testing Checklist

- [ ] AWS credentials configured
- [ ] S3 bucket created and accessible
- [ ] SNS SMS enabled in AWS region
- [ ] Patient phone numbers in E.164 format
- [ ] Dependencies installed (`npm install`)
- [ ] Test with critical patient (heart rate > 110 or SpO2 < 92)
- [ ] Verify data saved in S3
- [ ] Verify SMS received on patient phone
- [ ] Verify WhatsApp still sent (existing feature)

---

## Troubleshooting

### SMS Not Sending?
1. Check phone number format: must be `+1234567890`
2. Verify SMS_PROVIDER in .env
3. Check AWS SNS spending limit
4. Verify IAM user has SNS permission

### Data Not Saving to S3?
1. Verify AWS credentials
2. Check S3 bucket name
3. Verify IAM user has S3 permissions
4. Check CloudWatch logs

### Patient Data Not Triggering Alert?
1. Verify risk calculation: HR > 110 OR SpO2 < 92
2. Check patient phone number is set
3. Check alert.service.js is imported

---

## Next Steps

1. **Test locally** with dummy patient data
2. **Configure AWS** (see AWS_S3_SMS_SETUP.md)
3. **Add API endpoints** (see API_ENDPOINTS_EXAMPLES.js)
4. **Deploy** to production
5. **Monitor** CloudWatch and S3

---

## Documentation Files

- 📘 **AWS_S3_SMS_SETUP.md** - Complete setup guide
- 📗 **AWS_S3_SMS_QUICK_START.md** - Quick reference
- 📙 **API_ENDPOINTS_EXAMPLES.js** - Code examples
- 📓 **This file** - Implementation summary

---

## Support

For issues or questions:
1. Check **AWS_S3_SMS_SETUP.md** troubleshooting section
2. Review **AWS_S3_SMS_QUICK_START.md** for quick reference
3. Check AWS CloudWatch logs
4. Verify all environment variables are set

---

**Implementation Date:** January 30, 2026  
**Status:** ✅ Complete and Ready for Testing
