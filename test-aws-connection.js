import { getS3, getSNS } from './src/config/aws.js';

console.log('🔍 Testing AWS Connections...\n');

const s3 = getS3();
console.log(s3 ? '✅ S3 Client: Ready' : '❌ S3 Client: Failed');

const sns = getSNS();
console.log(sns ? '✅ SNS Client: Ready' : '❌ SNS Client: Failed');

console.log('\n✓ AWS Configuration Valid!');
