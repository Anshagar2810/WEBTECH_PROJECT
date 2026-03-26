# AWS S3 & SMS Configuration Reference

## Overview
This file contains quick reference information for configuring AWS S3 and SMS integration.

---

## Environment Variables Reference

### AWS Configuration
```bash
# AWS Region (required)
AWS_REGION=us-east-1

# AWS Access Key ID (required)
AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE

# AWS Secret Access Key (required)
AWS_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY

# S3 Bucket Name (required)
AWS_S3_BUCKET=smart-ward-critical-patients
```

### SMS Configuration
```bash
# SMS Provider (optional, default: twilio)
# Options: 'aws' (SNS) or 'twilio'
SMS_PROVIDER=aws
```

### Twilio Configuration (if using SMS_PROVIDER=twilio)
```bash
TWILIO_SID=AC[REDACTED]
TWILIO_AUTH_TOKEN=auth_token_here
TWILIO_PHONE_FROM=+1234567890
TWILIO_WHATSAPP_FROM=whatsapp:+1234567890
TWILIO_WHATSAPP_TO=whatsapp:+1234567890
```

---

## AWS Regions

| Region Name | Region Code | Best For |
|------------|------------|----------|
| US East (N. Virginia) | us-east-1 | US, North America |
| US East (Ohio) | us-east-2 | US (East) |
| US West (N. California) | us-west-1 | US (West) |
| EU (Ireland) | eu-west-1 | Europe |
| EU (Frankfurt) | eu-central-1 | Central Europe |
| Asia Pacific (Singapore) | ap-southeast-1 | Asia |
| Asia Pacific (Mumbai) | ap-south-1 | India |

---

## S3 Bucket Naming Rules

- Minimum 3 characters, maximum 63 characters
- Can contain lowercase letters, numbers, hyphens
- Must start with a letter or number
- Cannot be formatted as IP address
- Must be unique globally

### Valid Examples:
- `smart-ward-critical-patients`
- `swl-patients-data-2026`
- `hospital-ews-backups`

### Invalid Examples:
- `Smart-Ward` (contains uppercase)
- `smart_ward` (contains underscore)
- `sw` (too short)
- `123.456.789.012` (IP address format)

---

## IAM Policy for S3 & SNS

### Minimal Permissions (Recommended)
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
      "Resource": [
        "arn:aws:sns:*:*:*"
      ]
    }
  ]
}
```

### Full Permissions (For Testing)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "s3:*",
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": "sns:*",
      "Resource": "*"
    }
  ]
}
```

---

## Phone Number Formats

### E.164 Format (REQUIRED for AWS SNS)
- Format: `+[country code][area code][number]`
- Examples:
  - United States: `+14155552671`
  - India: `+919876543210`
  - UK: `+441632960123`
  - Australia: `+61412345678`

### Invalid Formats (Will NOT work)
- `14155552671` (missing +)
- `(415) 555-2671` (spaces and parentheses)
- `415-555-2671` (hyphens)
- `4155552671` (no + or country code)

### How to Convert:
```javascript
// Remove all non-numeric characters except +
const raw = "(415) 555-2671";
const cleaned = raw.replace(/\D/g, '');  // "4155552671"
const formatted = `+1${cleaned}`;         // "+14155552671"
```

---

## AWS Services Pricing (as of Jan 2026)

### S3 Storage
```
Storage Class        | Price/GB/Month
Standard             | $0.023
Standard-IA          | $0.0125
Glacier Instant      | $0.004
Glacier Flexible     | $0.0036
```

### SNS SMS
```
Region              | Price per SMS
US/Canada           | $0.00645
Europe              | $0.00756
Asia Pacific        | $0.00776
Other regions       | $0.01260
```

### Example Monthly Costs
```
Scenario 1: 100 SMS/month, 1GB storage
SMS Cost:   100 × $0.00645 = $0.645
Storage:    1GB × $0.023  = $0.023
Total:      ~$0.67/month

Scenario 2: 1000 SMS/month, 10GB storage
SMS Cost:   1000 × $0.00645 = $6.45
Storage:    10GB × $0.023  = $0.23
Total:      ~$6.68/month
```

---

## Data File Locations in S3

### Critical Patient Alerts
```
s3://bucket/critical-patients/{patientId}/{timestamp}.json
```
**Size:** ~500 bytes per file  
**Frequency:** Only for HIGH RISK alerts  
**Retention:** Indefinite (archive to Glacier after 90 days for cost savings)

### Patient History Exports
```
s3://bucket/patient-exports/{patientId}/{timestamp}-history.json
```
**Size:** 10-100 KB depending on patient history  
**Frequency:** On-demand  
**Retention:** Indefinite

---

## Common AWS Commands

### List Bucket Contents
```bash
aws s3 ls s3://your-bucket-name/
aws s3 ls s3://your-bucket-name/ --recursive
aws s3 ls s3://your-bucket-name/critical-patients/PAT001/
```

### Copy File from S3
```bash
aws s3 cp s3://your-bucket-name/critical-patients/PAT001/timestamp.json ./local-file.json
```

### Upload File to S3
```bash
aws s3 cp ./local-file.json s3://your-bucket-name/backup/
```

### Delete File
```bash
aws s3 rm s3://your-bucket-name/critical-patients/PAT001/timestamp.json
```

### Sync Local Folder to S3
```bash
aws s3 sync ./local-folder s3://your-bucket-name/backup/
```

---

## Testing Commands

### Test S3 Connection
```bash
aws s3api head-bucket --bucket your-bucket-name
# Output: (nothing = success, error = connection failed)
```

### Test SNS Connection
```bash
aws sns publish \
  --topic-arn arn:aws:sns:us-east-1:123456789012:TestTopic \
  --message "Test message"
```

### Test SMS with AWS CLI
```bash
aws sns publish \
  --phone-number +14155552671 \
  --message "Hello from Smart Ward EWS"
```

---

## Troubleshooting Checklist

### AWS Access Denied
```
✓ Verify AWS_ACCESS_KEY_ID is correct
✓ Verify AWS_SECRET_ACCESS_KEY is correct
✓ Check IAM user has S3 and SNS permissions
✓ Check bucket policy isn't blocking access
```

### SMS Not Sending
```
✓ Phone number must start with +
✓ Phone number must include country code
✓ Check AWS region supports SMS (not all regions do)
✓ Check SMS spending limit hasn't been reached
✓ Verify SNS is enabled for SMS in your region
```

### S3 Bucket Not Found
```
✓ Verify bucket name in AWS_S3_BUCKET
✓ Check bucket exists in specified region
✓ Check bucket name is spelled correctly (case-sensitive)
✓ Verify IAM user has access to bucket
```

### High Costs
```
✓ Check S3 storage growth - move old data to Glacier
✓ Check SMS volume - may have accidental alerts
✓ Use S3 lifecycle policies for cost optimization
✓ Enable S3 request metrics for monitoring
```

---

## Best Practices

### Security
```
✓ Use IAM users instead of root credentials
✓ Enable MFA on AWS account
✓ Rotate access keys every 90 days
✓ Use least privilege IAM policies
✓ Never commit .env to version control
✓ Store secrets in AWS Secrets Manager for production
```

### Performance
```
✓ Use S3 Transfer Acceleration for large uploads
✓ Enable S3 caching headers (Cache-Control)
✓ Use CloudFront CDN for frequently accessed data
✓ Batch requests when possible
✓ Use S3 versioning for important data
```

### Cost Optimization
```
✓ Use S3 Standard-IA for infrequent access data
✓ Enable S3 Lifecycle policies to archive old data
✓ Monitor costs with CloudWatch and Budgets
✓ Use S3 storage classes intelligently
✓ Delete unnecessary old vitals after 30 days
```

### Data Protection
```
✓ Enable S3 server-side encryption
✓ Enable versioning on S3 bucket
✓ Use S3 bucket policies to restrict access
✓ Enable access logging
✓ Set up data retention policies
```

---

## Migration from Twilio to AWS SNS

### Step 1: Update .env
```bash
# From:
SMS_PROVIDER=twilio

# To:
SMS_PROVIDER=aws
```

### Step 2: Configure AWS Credentials
```bash
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
```

### Step 3: Test with Sample Patient
- Create test patient with phone number in E.164 format
- Trigger HIGH RISK alert
- Verify SMS received

### Step 4: Switch Production
- Update production .env
- Monitor CloudWatch logs
- Keep Twilio credentials for fallback (if needed)

---

## Reference Links

- [AWS S3 Documentation](https://docs.aws.amazon.com/s3/)
- [AWS SNS Documentation](https://docs.aws.amazon.com/sns/)
- [AWS SDK JavaScript](https://docs.aws.amazon.com/sdk-for-javascript/)
- [E.164 Phone Format](https://en.wikipedia.org/wiki/E.164)
- [AWS IAM Best Practices](https://docs.aws.amazon.com/IAM/latest/UserGuide/best-practices.html)

---

**Last Updated:** January 30, 2026  
**Version:** 1.0
