// Global Constants and Helpers
window.MEDICAL_SPECIALTIES = [
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Pediatrics',
    'General Surgery',
    'Internal Medicine',
    'Oncology',
    'Dermatology',
    'Gynecology',
    'Psychiatry',
    'Urology',
    'ENT',
    'Ophthalmology',
    'Anesthesiology',
    'Radiology',
    'Pathology',
    'Emergency Medicine',
    'Family Medicine',
    'Nephrology',
    'Pulmonology',
    'Gastroenterology',
    'Endocrinology',
    'Rheumatology',
    'Infectious Disease',
    'Hematology',
    'Neurosurgery',
    'Plastic Surgery'
];

window.calculateEWS = (vitals) => {
    let score = 0;
    
    // 1. Respiratory Rate (Simulated if not present)
    const rr = vitals.respiratoryRate || 18; 
    if (rr <= 8 || rr >= 25) score += 3;
    else if (rr >= 21) score += 2;
    else if (rr >= 9 && rr <= 11) score += 1;

    // 2. Oxygen Saturation
    const spo2 = vitals.spo2;
    if (spo2 <= 91) score += 3;
    else if (spo2 <= 93) score += 2;
    else if (spo2 <= 95) score += 1;

    // 3. Temperature
    const temp = parseFloat(vitals.temp);
    // Convert F to C for calculation
    const tempC = (temp - 32) * 5/9;
    if (tempC <= 35.0 || tempC >= 39.1) score += 3;
    else if (tempC >= 38.1 || tempC <= 36.0) score += 1;
    else if (tempC >= 36.1 && tempC <= 38.0) score += 0;

    // 4. Systolic BP
    const sysBp = parseInt(vitals.bp.split('/')[0]);
    if (sysBp <= 90 || sysBp >= 220) score += 3;
    else if (sysBp <= 100) score += 2;
    else if (sysBp <= 110) score += 1;

    // 5. Heart Rate
    const hr = vitals.heartRate;
    if (hr <= 40 || hr >= 131) score += 3;
    else if (hr >= 111) score += 2;
    else if (hr >= 91 || hr <= 50) score += 1;

    return score;
};

window.generatePatientDetails = (name, index) => {
    // Generate vitals first
    const vitals = {
        heartRate: 60 + Math.floor(Math.random() * 60), // 60-120 range extended
        bp: `${90 + Math.floor(Math.random() * 60)}/${60 + Math.floor(Math.random() * 30)}`,
        temp: (96 + Math.random() * 4).toFixed(1), // 96-100 range
        spo2: 88 + Math.floor(Math.random() * 12), // 88-100 range
        respiratoryRate: 12 + Math.floor(Math.random() * 12) // 12-24 range
    };

    // Calculate EWS Score
    const ewsScore = window.calculateEWS(vitals);
    
    // Determine status based on EWS
    let status = 'Stable';
    if (ewsScore >= 7) status = 'Critical';
    else if (ewsScore >= 5) status = 'Warning';
    else if (ewsScore >= 1) status = 'Stable'; // Low risk
    else status = 'Stable';

    return {
        name: name,
        id: `P-${1000 + index + Math.floor(Math.random() * 1000)}`,
        age: 20 + Math.floor(Math.random() * 60),
        status: status,
        isOnline: Math.random() > 0.3, // 70% chance of being online
        ewsScore: ewsScore,
        deviceId: `DEV-${100 + index}`,
        address: `${100 + Math.floor(Math.random() * 900)} Main St, Cityville`,
        phone: `555-${100 + Math.floor(Math.random() * 900)}-${1000 + Math.floor(Math.random() * 9000)}`,
        vitals: vitals,
        admissionDate: new Date().toISOString().split('T')[0],
        condition: ewsScore >= 7 ? 'Critical - Immediate Review' : (ewsScore >= 5 ? 'Urgent Review' : 'Stable - Routine Check')
    };
};

window.getNextDoctorId = (doctors) => {
    // Extract all numeric IDs from existing doctors (e.g., "DOC1" -> 1)
    const existingIds = doctors
        .map(d => parseInt(d.id.replace('DOC', ''), 10))
        .filter(id => !isNaN(id))
        .sort((a, b) => a - b);

    // Find the first missing number starting from 1
    let nextId = 1;
    for (const id of existingIds) {
        if (id === nextId) {
            nextId++;
        } else if (id > nextId) {
            // Found a gap
            break;
        }
    }
    
    return `DOC${nextId}`;
};

window.getNextPatientId = (patients) => {
    const existingIds = (patients || [])
        .map(p => {
            if (!p.patientId) return NaN;
            const num = parseInt(p.patientId.replace('PAT', ''), 10);
            return isNaN(num) ? NaN : num;
        })
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
    let next = 1;
    for (const id of existingIds) {
        if (id === next) next++;
        else if (id > next) break;
    }
    return `PAT${next}`;
};

window.getNextDeviceId = (patients) => {
    const existingNums = (patients || [])
        .map(p => {
            if (!p.deviceId) return NaN;
            const match = String(p.deviceId).match(/ESP32_(\d+)/);
            if (!match) return NaN;
            return parseInt(match[1], 10);
        })
        .filter(n => !isNaN(n))
        .sort((a, b) => a - b);
    const next = (existingNums.length ? existingNums[existingNums.length - 1] + 1 : 1);
    const padded = String(next).padStart(3, '0');
    return `ESP32_${padded}`;
};
window.App = () => {
    const { useState, useEffect } = React;
    const { AuthPage, AdminDashboard, DoctorDashboard, LandingPage } = window;

    // View State: 'landing' | 'auth' | 'dashboard'
    // If we have a session, we might want to skip landing, but for the "experience" let's show landing or go straight to dashboard if logged in.
    // User request: "have login button from this existing part starts" -> Suggests Landing -> Login.
    
    const [showLanding, setShowLanding] = useState(true);
    const [user, setUser] = useState(null); // { ...userData }
    const [userType, setUserType] = useState(null); // 'admin' | 'doctor'
    const [adminAccount, setAdminAccount] = useState(null);
    
    // Initial Mock Data with rich patient objects
    const [doctors, setDoctors] = useState([]);
    const [pendingDoctors, setPendingDoctors] = useState([]);
    const [patients, setPatients] = useState([]);

    const [nurses, setNurses] = useState(() => {
        const saved = localStorage.getItem('hospital_nurses_db');
        return saved ? JSON.parse(saved) : [];
    });

    useEffect(() => {
        localStorage.setItem('hospital_nurses_db', JSON.stringify(nurses));
    }, [nurses]);

    // Persist Doctors Data (Simulated Database)
    useEffect(() => {
        const savedDocs = localStorage.getItem('hospital_doctors_db');
        if (savedDocs) {
            setDoctors(JSON.parse(savedDocs));
        }
        
        const savedPending = localStorage.getItem('hospital_pending_doctors_db');
        if (savedPending) {
            setPendingDoctors(JSON.parse(savedPending));
        }

        const savedAdmin = localStorage.getItem('hospital_admin_account');
        if (savedAdmin) {
            setAdminAccount(JSON.parse(savedAdmin));
        }
        
        const savedPatients = localStorage.getItem('hospital_patients_db');
        if (savedPatients) {
            let loadedPatients = JSON.parse(savedPatients);
            // Patch missing isOnline property for existing data
            loadedPatients = loadedPatients.map(p => ({
                ...p,
                isOnline: p.isOnline !== undefined ? p.isOnline : (Math.random() > 0.3)
            }));
            setPatients(loadedPatients);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('hospital_doctors_db', JSON.stringify(doctors));
    }, [doctors]);

    useEffect(() => {
        localStorage.setItem('hospital_pending_doctors_db', JSON.stringify(pendingDoctors));
    }, [pendingDoctors]);

    useEffect(() => {
        if (adminAccount) {
            localStorage.setItem('hospital_admin_account', JSON.stringify(adminAccount));
        }
    }, [adminAccount]);
    
    useEffect(() => {
        localStorage.setItem('hospital_patients_db', JSON.stringify(patients));
    }, [patients]);

    // Check Session
    useEffect(() => {
        const session = localStorage.getItem('app_session');
        if (session) {
            const { user, type } = JSON.parse(session);
            setUser(user);
            setUserType(type);
            // If already logged in, we can optionally skip landing, but usually landing is for "visitors".
            // Let's keep landing visible on fresh load unless user explicitly logs out? 
            // Actually, for a web app, if I'm logged in, I usually go to dashboard.
            // But the user wants to "make this type of website first".
            // Let's stick to Landing -> Auth/Dashboard.
            // If logged in, clicking "Enter System" on landing will go straight to Dashboard.
        }
    }, []);

    const handleLogin = (userData, type) => {
        setUser(userData);
        setUserType(type);
        localStorage.setItem('app_session', JSON.stringify({ user: userData, type }));
    };

    const handleLogout = () => {
        setUser(null);
        setUserType(null);
        localStorage.removeItem('app_session');
        setShowLanding(true); // Go back to landing on logout
    };

    const handleEnterSystem = () => {
        setShowLanding(false);
    };

    const handleBackToLanding = () => {
        setShowLanding(true);
    };

    // Render Logic
    if (showLanding) {
        return <LandingPage onEnter={handleEnterSystem} />;
    }

    if (!user) {
        return <AuthPage onLogin={handleLogin} doctors={doctors} setDoctors={setDoctors} pendingDoctors={pendingDoctors} onBack={handleBackToLanding} setPendingDoctors={setPendingDoctors} adminAccount={adminAccount} setAdminAccount={setAdminAccount} nurses={nurses} setNurses={setNurses} />;
    }

    if (userType === 'admin') {
        return <AdminDashboard user={user} onLogout={handleLogout} doctors={doctors} setDoctors={setDoctors} pendingDoctors={pendingDoctors} setPendingDoctors={setPendingDoctors} adminAccount={adminAccount} patients={patients} setPatients={setPatients} />;
    } else if (userType === 'nurse') {
        return <NurseDashboard user={user} onLogout={handleLogout} patients={patients} doctors={doctors} />;
    } else {
        return <DoctorDashboard user={user} onLogout={handleLogout} doctors={doctors} patients={patients} />;
    }
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<window.App />);
