import 'dotenv/config';
import { saveCriticalPatientDataToS3 } from './src/config/aws.js';

(async () => {
  console.log('\n🔎 Running S3 connectivity test');
  try {
    const result = await saveCriticalPatientDataToS3(
      { patientId: 'PAT_TEST', name: 'Test Patient' },
      { heartRate: 123, spo2: 88, temperature: 100.5 },
      { score: 1, riskLevel: 'HIGH' },
      ['Test alert']
    );
    console.log('\n📦 saveCriticalPatientDataToS3 returned ->', result);
    process.exit(result ? 0 : 1);
  } catch (err) {
    console.error('\n❌ Test failed with error:');
    console.error(err);
    process.exit(2);
  }
})();
