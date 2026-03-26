import http from 'http';
import { URL } from 'url';

// Simple HTTP request helper
async function request(method, urlStr, data = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(urlStr);
        const options = {
            hostname: url.hostname,
            port: url.port,
            path: url.pathname + url.search,
            method,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, data: JSON.parse(body) });
                } catch {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (data) req.write(JSON.stringify(data));
        req.end();
    });
}

async function testAlertsFlow() {
    console.log('\n📋 ===== ALERT FLOW TEST =====\n');

    try {
        // Test 1: Get existing patient
        console.log('1️⃣  Checking for existing patient...');
        const vitalsRes = await request('GET', 'http://localhost:5000/api/vitals/PAT_1769743349950');
        
        if (vitalsRes.status === 200 && vitalsRes.data && vitalsRes.data.length > 0) {
            console.log(`   ✅ Patient exists with ${vitalsRes.data.length} vitals records`);
        } else {
            console.log('   ⚠️  Patient might not exist, but trying POST anyway...');
        }

        // Test 2: Send CRITICAL vitals
        console.log('\n2️⃣  Sending CRITICAL vitals...');
        const criticalVitals = {
            patientId: "PAT_1769743349950",
            deviceId: "ESP32_1769743349950",
            heartRate: 125,    // Too high (>120)
            spo2: 88,          // Too low (<90)
            temperature: 101.5  // Too high (>100.4)
        };

        console.log('   Data:', JSON.stringify(criticalVitals, null, 2));
        console.log('   ⏳ Waiting for response...\n');

        const vitalRes = await request('POST', 'http://localhost:5000/api/vitals', criticalVitals);
        
        console.log(`   Response status: ${vitalRes.status}`);
        console.log(`   Response data:`, JSON.stringify(vitalRes.data, null, 2));

        if (vitalRes.status === 201 && vitalRes.data.risk && vitalRes.data.risk.riskLevel === 'HIGH') {
            console.log('\n   ✅ HIGH RISK vitals accepted!');
            console.log('   ⏳ Server should now be sending WhatsApp and S3 alerts (check server logs above)\n');
        } else {
            console.log('\n   ❌ Alert not triggered\n');
        }

        // Wait for async alerts
        console.log('3️⃣  Waiting 5 seconds for async alerts to process...');
        await new Promise(resolve => setTimeout(resolve, 5000));
        console.log('   ✅ Done!\n');

        console.log('📋 ===== CHECK THESE NOW =====');
        console.log('1. Server logs above should show:');
        console.log('   📲 Sending WhatsApp via Twilio...');
        console.log('   🚨 Sending SMS alert for CRITICAL patient...');
        console.log('   ✅ Critical patient data saved to S3');
        console.log('\n2. AWS S3 Console:');
        console.log('   Open: https://console.aws.amazon.com/s3/buckets/smart-ward-ews');
        console.log('   Look in: critical-patients/ folder');
        console.log('   Should see new JSON file with timestamp\n');
        console.log('3. Your WhatsApp phone (+919810325677):');
        console.log('   Should receive message from Twilio\n');

    } catch (err) {
        console.error('\n❌ Test failed:', err.message);
    }
}

testAlertsFlow();
