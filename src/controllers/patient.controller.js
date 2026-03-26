import Patient from "../models/patient.model.js";

export const createPatient = async (req, res) => {
  try {
    const { patientId, name, age, phone, deviceId, doctorId } = req.body;

    console.log("📝 Creating patient - Auth user:", req.user);

    // Validate required fields - doctorId is optional for unassigned patients
    if (!patientId || !name || !deviceId) {
      return res.status(400).json({ 
        error: "patientId, name, and deviceId are required",
        received: { patientId, name, deviceId }
      });
    }

    const patient = await Patient.create({
      patientId,
      name,
      age: age || 0,
      phone: phone || '',
      // Only include doctorId when provided (avoid sending empty string)
      ...(doctorId ? { doctorId } : {}),
      deviceId
    });

    console.log("✅ Patient created:", patient);
    res.status(201).json({ data: patient, message: "Patient created successfully" });
  } catch (err) {
    console.error("❌ Patient creation error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const getPatients = async (req, res) => {
  try {
    let patients;

    // Defensive: ensure req.user exists (protect middleware should set it)
    const role = (req.user && req.user.role) ? String(req.user.role).toUpperCase() : 'UNKNOWN';

    // Admin sees all patients, doctor/nurse sees only assigned
    if (role === "ADMIN") {
      patients = await Patient.find();
    } else if (role === "DOCTOR") {
      const identifier = (req.user && (req.user.userId || req.user.id)) || '';
      patients = await Patient.find({ doctorId: identifier });
    } else if (role === "NURSE") {
      const identifier = (req.user && (req.user.userId || req.user.id)) || '';
      patients = await Patient.find({ nurseId: identifier });
    } else {
      patients = [];
    }

    // Add default vitals to each patient
    // Ensure we gracefully handle any malformed documents
    const patientsWithDefaults = patients.map(p => {
      try {
        const obj = p && p.toObject ? p.toObject() : (p || {});
        if (!obj.vitals) {
          obj.vitals = {
            spo2: 95,
            heartRate: 70,
            temp: 36.5,
            bp: '120/80',
            timestamp: new Date()
          };
        }
        return obj;
      } catch (innerErr) {
        console.warn('⚠️ Skipping malformed patient record', innerErr && innerErr.message ? innerErr.message : innerErr);
        return null;
      }
    }).filter(Boolean);

    console.log(`✅ Fetched ${patientsWithDefaults.length} patients for ${role}`);
    res.json(patientsWithDefaults || []);
  } catch (err) {
    console.error("❌ Get patients error:", err && err.message ? err.message : err, err && err.stack ? err.stack : '');
    res.status(500).json({ error: (err && err.message) || 'Internal Server Error' });
  }
};

export const assignPatientToDoctor = async (req, res) => {
  try {
    const { patientId, doctorId } = req.body;

    console.log("📋 Assigning patient to doctor:", { patientId, doctorId });

    // Validate required fields
    if (!patientId || doctorId === undefined) {
      return res.status(400).json({ 
        error: "patientId and doctorId are required",
        received: { patientId, doctorId }
      });
    }

    // Find patient by _id or patientId
    const patient = await Patient.findOne({ 
      $or: [{ _id: patientId }, { patientId: patientId }] 
    });

    if (!patient) {
      return res.status(404).json({ error: "Patient not found" });
    }

    // Update doctorId
    patient.doctorId = doctorId || '';
    await patient.save();

    console.log("✅ Patient assigned to doctor:", patient);
    res.status(200).json({ data: patient, message: "Patient assigned successfully" });
  } catch (err) {
    console.error("❌ Assign patient error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

export const resetPatientsAssignment = async (req, res) => {
  try {
    console.log("🔄 Resetting all patient assignments...");
    
    // Clear doctorId for all patients
    const result = await Patient.updateMany({}, { doctorId: '' });
    
    console.log(`✅ Reset ${result.modifiedCount} patients`);
    res.status(200).json({ 
      message: "All patient assignments cleared",
      modifiedCount: result.modifiedCount
    });
  } catch (err) {
    console.error("❌ Reset error:", err.message);
    res.status(500).json({ error: err.message });
  }
};
