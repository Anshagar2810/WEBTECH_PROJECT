// Example API Endpoints for AWS S3 & SMS Integration
// Add these to your existing route files

// ============================================
// EXAMPLE: In /routes/alert.routes.js
// ============================================

import express from 'express';
import { 
  archivePatientCriticalDataToS3, 
  archiveAllCriticalPatientsToS3, 
  exportPatientHistoryToS3 
} from '../services/backup.service.js';
import { sendCriticalPatientSMS } from '../services/sms.service.js';

const router = express.Router();

// Archive specific patient's critical data
router.post('/archive/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const success = await archivePatientCriticalDataToS3(patientId);
    
    res.status(success ? 200 : 500).json({
      success,
      message: success 
        ? `Patient ${patientId} data archived to S3`
        : 'Failed to archive patient data'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Archive all critical patients
router.post('/archive-all', async (req, res) => {
  try {
    const result = await archiveAllCriticalPatientsToS3();
    
    res.json({
      message: 'Archive completed',
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export patient history to S3
router.post('/export/:patientId', async (req, res) => {
  try {
    const { patientId } = req.params;
    const success = await exportPatientHistoryToS3(patientId);
    
    res.status(success ? 200 : 500).json({
      success,
      message: success 
        ? `Patient ${patientId} history exported to S3`
        : 'Failed to export patient history'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXAMPLE: In /routes/patient.routes.js
// ============================================

// Send SMS alert to patient
router.post('/:patientId/send-sms', async (req, res) => {
  try {
    const { patientId } = req.params;
    const { message } = req.body; // Custom message (optional)
    
    const patient = await Patient.findOne({ patientId });
    if (!patient) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    if (!patient.phone || !patient.phone.startsWith('+')) {
      return res.status(400).json({ error: 'Invalid patient phone number' });
    }

    // If custom message provided, send it
    if (message) {
      const { sendCriticalPatientSMS } = await import('../services/sms.service.js');
      const success = await sendCriticalPatientSMS(patient.phone, message, {}, {}, []);
      
      return res.json({
        success,
        message: 'SMS sent'
      });
    }

    // Otherwise, get latest vitals and send formatted alert
    const vitals = await Vitals.findOne({ patientId }).sort({ createdAt: -1 });
    if (!vitals) {
      return res.status(404).json({ error: 'No vitals found for patient' });
    }

    const { calculateRiskScore } = await import('../services/riskScore.service.js');
    const risk = calculateRiskScore(vitals);
    
    const alerts = await Alert.find({ patientId }).sort({ createdAt: -1 }).limit(3);
    const alertMessages = alerts.map(a => a.message || a.type);

    const { sendCriticalPatientSMS } = await import('../services/sms.service.js');
    const success = await sendCriticalPatientSMS(
      patient.phone,
      patient.name,
      vitals,
      risk,
      alertMessages
    );

    res.json({
      success,
      message: success ? 'SMS alert sent to patient' : 'Failed to send SMS'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// EXAMPLE: In /routes/device.routes.js or /routes/vitals.routes.js
// ============================================

import { saveCriticalPatientDataToS3 } from '../services/config/aws.js';

// When receiving new vitals from device
router.post('/receive-vitals', async (req, res) => {
  try {
    const { patientId, heartRate, spo2, temperature } = req.body;

    // ... existing vitals save logic ...

    // Calculate risk
    const { calculateRiskScore } = await import('../services/riskScore.service.js');
    const risk = calculateRiskScore({ heartRate, spo2, temperature });

    // If HIGH RISK, save to S3
    if (risk.riskLevel === 'HIGH') {
      const patient = await Patient.findOne({ patientId });
      if (patient) {
        const alerts = await Alert.find({ patientId }).sort({ createdAt: -1 }).limit(5);
        const alertMessages = alerts.map(a => a.message || a.type);

        await saveCriticalPatientDataToS3(patient, 
          { heartRate, spo2, temperature }, 
          risk, 
          alertMessages
        );
      }
    }

    res.json({ success: true, riskLevel: risk.riskLevel });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================
// API USAGE EXAMPLES
// ============================================

/*

1. ARCHIVE SINGLE PATIENT
   POST /api/alerts/archive/PAT001
   Response: { success: true, message: "Patient PAT001 data archived to S3" }

2. ARCHIVE ALL CRITICAL PATIENTS
   POST /api/alerts/archive-all
   Response: { message: "Archive completed", successCount: 5, failureCount: 0 }

3. EXPORT PATIENT HISTORY
   POST /api/alerts/export/PAT001
   Response: { success: true, message: "Patient PAT001 history exported to S3" }

4. SEND SMS TO PATIENT (WITH VITALS)
   POST /api/patients/PAT001/send-sms
   Response: { success: true, message: "SMS alert sent to patient" }

5. SEND SMS WITH CUSTOM MESSAGE
   POST /api/patients/PAT001/send-sms
   Body: { message: "Please check your vitals immediately" }
   Response: { success: true, message: "SMS sent" }

*/

export default router;
