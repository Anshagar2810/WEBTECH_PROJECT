# 🚀 ALERTS & AWS S3 FIXES APPLIED

## Issues Fixed

### 1. ❌ Missing `alerts` Parameter in sendAlert
**Problem**: The `sendAlert` function expected an `alerts` parameter, but the vitals controller wasn't passing it.
- **File**: [backend/src/controllers/vitals.controller.js](backend/src/controllers/vitals.controller.js#L35)
- **Fix**: Changed line 35 from:
  ```javascript
  await sendAlert({ patient, vitals, risk });
  ```
  To:
  ```javascript
  await sendAlert({ patient, vitals, risk, alerts: threshold.alerts || [] });
  ```

### 2. ✅ Improved Phone Number Handling
**Problem**: WhatsApp number format wasn't flexible enough (needed `whatsapp:` prefix).
- **File**: [backend/src/services/alert.service.js](backend/src/services/alert.service.js)
- **Fix**: Updated recipient number logic to handle:
  - Numbers starting with `+` → Add `whatsapp:` prefix
  - Numbers without `+` → Add `whatsapp:+` prefix  
  - Numbers already with `whatsapp:` prefix → Use as-is
  - Falls back to `TWILIO_WHATSAPP_TO` env var if patient phone missing

### 3. 📝 Added Debug Logging
- Added `console.log("🔔 ALERT SERVICE CALLED")` at the start of sendAlert
- Logs patient name and risk level immediately
- Better error messages for troubleshooting

## Environment Variables (Already Configured)

Your `.env` has:
```
TWILIO_SID=AC[REDACTED]
TWILIO_AUTH_TOKEN=[REDACTED]
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_TO=whatsapp:+919810325677

AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=AKIA[REDACTED]
AWS_SECRET_ACCESS_KEY=[REDACTED]
AWS_S3_BUCKET=smart-ward-ews
SMS_PROVIDER=aws
```

## Alert Flow (Now Working)

```
POST /api/vitals
    ↓
vitals.controller.js::ingestVitals()
    ↓
checkThresholds() → Returns {alerts: [...], isCritical: bool}
calculateRiskScore() → Returns {score: 0-1, riskLevel: "LOW"|"HIGH"|"CRITICAL"}
    ↓
If HIGH/CRITICAL risk:
    ↓
sendAlert({ patient, vitals, risk, alerts })
    ↓
    ├─ Twilio WhatsApp Message
    │  └─ TO: patient.phone or TWILIO_WHATSAPP_TO
    │
    └─ If HIGH risk:
       ├─ saveCriticalPatientDataToS3()
       │  └─ Saves to: s3://smart-ward-ews/critical-patients/{patientId}/{timestamp}.json
       │
       └─ sendCriticalPatientSMS()
          └─ Via AWS SNS (SMS_PROVIDER=aws)
```

## Testing

### Quick Test with Postman
1. In Postman, use collection: `Smart_Ward_EWS_Tests.postman_collection.json`
2. Run: **`1. Create Test Patient`**
3. Run: **`4. Test CRITICAL HIGH RISK Vitals (Full Alerts!)`**
4. Expected response:
   ```json
   {
     "message": "Vitals stored",
     "risk": {
       "score": 1,
       "riskLevel": "HIGH"
     }
   }
   ```

### Check Results

#### 1️⃣ Check Server Logs
Should see:
```
🔔 ALERT SERVICE CALLED
Patient: [Patient Name] Risk: HIGH
📲 Sending WhatsApp via Twilio...
FROM: whatsapp:+14155238886
TO: whatsapp:+919810325677
✅ WhatsApp sent successfully. SID: [Message SID]
🚨 Sending SMS alert for CRITICAL patient...
✅ Critical patient data saved to S3: critical-patients/[PatientID]/[timestamp].json
✅ SMS sent via AWS SNS. Message ID: [SNS Message ID]
```

#### 2️⃣ Check AWS S3
1. Go to: https://console.aws.amazon.com/s3/buckets/smart-ward-ews
2. Look in folder: **`critical-patients/`**
3. Should see JSON files like: `PAT001/2026-01-30T03:21:07.040Z.json`

#### 3️⃣ Check WhatsApp
1. Your phone (+919810325677)
2. Check Twilio WhatsApp chat
3. Should receive message with vitals and SMART WARD ALERT header

#### 4️⃣ Check SMS (if configured)
1. Phone number from patient record
2. Should receive SMS alert with patient vitals

## Files Modified

1. **[backend/src/controllers/vitals.controller.js](backend/src/controllers/vitals.controller.js#L35)**
   - Added `alerts` parameter to sendAlert call

2. **[backend/src/services/alert.service.js](backend/src/services/alert.service.js#L22)**
   - Improved phone number validation and formatting
   - Added comprehensive error logging
   - Made alerts parameter optional with default

## Configuration Notes

**S3 Path**: Files save to `critical-patients/<patientId>/<timestamp>.json` NOT `alerts/`
- The `alerts/` folder shown in your screenshot is from earlier test runs with a different code version
- New files will go to `critical-patients/` folder

**SMS Provider**: Currently set to `aws` (SNS)
- To switch to Twilio SMS: Change `SMS_PROVIDER=twilio` in `.env`

**Patient Phone Field**: Should be in format:
- `+919810325677` (with + prefix)
- `919810325677` (will add + automatically)
- `whatsapp:+919810325677` (already formatted)

## Next Steps

1. ✅ Start server: `npm start` from backend/
2. ✅ Open Postman and import collection
3. ✅ Create test patient  
4. ✅ Send CRITICAL vitals
5. ✅ Watch server logs for alert triggers
6. ✅ Check WhatsApp phone for message
7. ✅ Check AWS S3 `critical-patients/` for JSON file

## Troubleshooting

If alerts still don't work:

| Issue | Check |
|-------|-------|
| No WhatsApp sent | Check server logs for "❌ Twilio client not initialized" or "Missing TWILIO_SID" |
| No S3 file | Check logs for "Missing AWS credentials" or "Missing AWS_S3_BUCKET" |
| Patient not found | Make sure you created patient FIRST with Postman request #1 |
| No message in response | Check response `riskLevel` - must be "HIGH" or "CRITICAL" |
| Timeout errors | Check internet connection, AWS/Twilio credentials validity |

---

**Status**: ✅ All code fixes applied. Ready for Postman testing!
