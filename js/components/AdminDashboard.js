window.AdminDashboard = ({ user, onLogout, doctors, setDoctors, pendingDoctors, setPendingDoctors, adminAccount, patients = [], setPatients }) => {
    const { useState } = React;
    const { UserPlus, UserCheck, Table, Trash, XMark, Logout, Activity, Eye, EyeOff, Menu, FileText, Check, ChevronLeft, ChevronRight } = window.Icons;
    const { MEDICAL_SPECIALTIES, generatePatientDetails } = window;

    // View State
    const [currentView, setCurrentView] = useState('dashboard'); // 'dashboard' | 'approvals' | 'doctors' | 'patients-list' | 'assign-patient' | 'doctor-dashboard' | 'patient-dashboard'
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const [expandedMenu, setExpandedMenu] = useState({ doctors: false, patients: false });

    // Form States
    const [newDoc, setNewDoc] = useState({ name: '', id: '', field: '', email: '', phone: '', password: '' });
    const [assignData, setAssignData] = useState({ docId: '', patientName: '' });
    const [newPatient, setNewPatient] = useState({ name: '', age: '', phone: '' });
    const [selectedDashboardDoctor, setSelectedDashboardDoctor] = useState('');
    const [selectedDashboardPatient, setSelectedDashboardPatient] = useState('');
    
    // Patient Dashboard Monitor State
    const [selectedMetric, setSelectedMetric] = useState(null);
    const [history, setHistory] = useState({ spo2: [], heartRate: [], temp: [] });

    // Live Data Effect
    React.useEffect(() => {
        if (currentView !== 'patient-dashboard' || !selectedDashboardPatient) return;
        
        const patient = (patients || []).find(p => (p._id || p.id) === selectedDashboardPatient);
        if (!patient || !patient.isOnline) return;

        const id = setInterval(() => {
             setHistory(prev => {
                const clamp = (val, min, max) => Math.min(Math.max(val, min), max);
                const lastSpo2 = prev.spo2.length ? prev.spo2[prev.spo2.length - 1] : patient.vitals.spo2;
                const lastHr = prev.heartRate.length ? prev.heartRate[prev.heartRate.length - 1] : patient.vitals.heartRate;
                const lastTemp = prev.temp.length ? prev.temp[prev.temp.length - 1] : parseFloat(patient.vitals.temp);
                
                const nextSpo2 = clamp(lastSpo2 + (Math.random() * 2 - 1), 88, 100);
                const nextHr = clamp(lastHr + (Math.random() * 6 - 3), 50, 140);
                const nextTemp = clamp(lastTemp + (Math.random() * 0.3 - 0.15), 96, 100.5);
                
                return {
                    spo2: [...prev.spo2.slice(-49), Math.round(nextSpo2)],
                    heartRate: [...prev.heartRate.slice(-49), Math.round(nextHr)],
                    temp: [...prev.temp.slice(-49), parseFloat(nextTemp.toFixed(1))]
                };
            });
        }, 1000);
        return () => clearInterval(id);
    }, [currentView, selectedDashboardPatient, patients]);

    // Reset history when patient changes
    React.useEffect(() => {
        if (selectedDashboardPatient) {
             const patient = (patients || []).find(p => (p._id || p.id) === selectedDashboardPatient);
             if (patient) {
                 setHistory({
                    spo2: [patient.vitals.spo2],
                    heartRate: [patient.vitals.heartRate],
                    temp: [parseFloat(patient.vitals.temp)]
                 });
             }
        }
    }, [selectedDashboardPatient]);
    
    // Password Visibility State
    const [visiblePasswords, setVisiblePasswords] = useState({});
    const [showAdminPassword, setShowAdminPassword] = useState(false);
    
    // Change Password State
    const [passwordModal, setPasswordModal] = useState({
        isOpen: false,
        docId: '',
        newPassword: ''
    });

    // Confirmation Modal State
    const [confirmation, setConfirmation] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: null
    });

    const closeConfirmation = () => {
        setConfirmation({ ...confirmation, isOpen: false });
    };

    const getStatusColor = (status) => {
        switch(status) {
            case 'Critical': return 'bg-red-100 text-red-700 border-red-200';
            case 'Warning': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            default: return 'bg-green-100 text-green-700 border-green-200';
        }
    };

    // Helper to safely open Base64 PDFs
    const openPdf = (base64Data) => {
        if (!base64Data) return;
        setConfirmation({
            isOpen: true,
            title: 'Open External Document',
            message: 'This file is provided from the website. Do you want to open it?',
            onConfirm: () => {
                try {
                    if (base64Data.startsWith('data:application/pdf')) {
                        const byteCharacters = atob(base64Data.split(',')[1]);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                            byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/pdf' });
                        const url = URL.createObjectURL(blob);
                        const win = window.open(url, '_blank');
                        if (!win) {
                            alert('Please allow popups to view the certificate.');
                        }
                    } else {
                        alert('Invalid certificate format.');
                    }
                } catch (e) {
                    alert('Could not open the PDF.');
                } finally {
                    closeConfirmation();
                }
            }
        });
    };

    const togglePassword = (docId) => {
        setVisiblePasswords(prev => ({
            ...prev,
            [docId]: !prev[docId]
        }));
    };

    const handleAddDoctor = (e) => {
        e.preventDefault();
        // Always generate ID automatically
        const finalID = window.getNextDoctorId(doctors);
        
        const finalName = newDoc.name.startsWith('Dr. ') ? newDoc.name : `Dr. ${newDoc.name}`;
        const doctorToAdd = {
            ...newDoc,
            id: finalID,
            name: finalName,
            patients: []
        };
        // Remove temporary fields if any
        delete doctorToAdd.idNumber;
        
        setConfirmation({
            isOpen: true,
            title: 'Confirm Add Doctor',
            message: 'Add this doctor to the database?',
            onConfirm: () => {
                setDoctors([...doctors, doctorToAdd]);
                setNewDoc({ name: '', idNumber: '', field: '', email: '', phone: '', password: '' });
                closeConfirmation();
                alert('Doctor added successfully!');
            }
        });
    };
    
    const handleAddPatient = (e) => {
        e.preventDefault();
        if (!newPatient.name || !newPatient.age || !newPatient.phone) {
            alert('Please fill patient name, age and phone'); return;
        }
        const patientId = window.getNextPatientId(patients);
        const deviceId = window.getNextDeviceId(patients);
        const gen = window.generatePatientDetails(newPatient.name, (patients || []).length);
        const finalPatient = {
            _id: `${Date.now()}`,
            patientId,
            name: newPatient.name,
            age: parseInt(newPatient.age, 10),
            phone: newPatient.phone,
            doctorId: '',
            deviceId,
            createdAt: new Date().toISOString(),
            vitals: gen.vitals,
            ewsScore: gen.ewsScore,
            status: gen.status,
            isOnline: true,
            address: gen.address
        };
        setConfirmation({
            isOpen: true,
            title: 'Confirm Add Patient',
            message: 'Add this patient to the database?',
            onConfirm: () => {
                setPatients([...(patients || []), finalPatient]);
                setNewPatient({ name: '', age: '', phone: '' });
                closeConfirmation();
                alert('Patient added successfully!');
            }
        });
    };

    const handleChangePassword = (docId) => {
        setPasswordModal({ isOpen: true, docId, newPassword: '' });
    };

    const submitPasswordChange = () => {
        if (!passwordModal.newPassword) {
            alert('Please enter a new password'); return;
        }
        setConfirmation({
            isOpen: true,
            title: 'Confirm Password Change',
            message: 'Update this doctor\'s password?',
            onConfirm: () => {
                setDoctors(doctors.map(d => 
                    d.id === passwordModal.docId ? { ...d, password: passwordModal.newPassword } : d
                ));
                setPasswordModal({ isOpen: false, docId: '', newPassword: '' });
                closeConfirmation();
                alert('Password updated successfully!');
            }
        });
    };

    const handleApproveDoctor = (doctor) => {
        if (doctors.some(d => d.email === doctor.email)) {
            alert('Doctor with this email already exists!'); return;
        }

        setConfirmation({
            isOpen: true,
            title: 'Approve Registration',
            message: `Are you sure you want to approve Dr. ${doctor.name}?`,
            onConfirm: () => {
                const newId = window.getNextDoctorId(doctors);
                const specialty = doctor.field || doctor.domain || '';
                const finalName = doctor.name.startsWith('Dr. ') ? doctor.name : `Dr. ${doctor.name}`;

                const approvedDoctor = {
                    ...doctor,
                    id: newId,
                    name: finalName,
                    field: specialty,
                    patients: [],
                    status: 'active'
                };

                setDoctors([...doctors, approvedDoctor]);
                setPendingDoctors(pendingDoctors.filter(d => d.id !== doctor.id));
                closeConfirmation();
            }
        });
    };

    const handleRejectDoctor = (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Reject Registration',
            message: 'Are you sure you want to reject this registration?',
            onConfirm: () => {
                setPendingDoctors(pendingDoctors.filter(d => d.id !== id));
                closeConfirmation();
            }
        });
    };

    const handleAssignPatient = (e) => {
        e.preventDefault();
        if (!assignData.docId) { alert('Please select a doctor.'); return; }
        const doc = doctors.find(d => d.id === assignData.docId);
        if (!doc) { alert('Doctor not found'); return; }
        const patientToAssign = (patients || []).find(p => p.name === assignData.patientName);
        if (!patientToAssign) { alert('Patient not found. Please add patient first.'); return; }
        setConfirmation({
            isOpen: true,
            title: 'Confirm Assignment',
            message: `Assign ${patientToAssign.name} to ${doc.name}?`,
            onConfirm: () => {
                const updatedPatients = (patients || []).map(p => 
                    p._id === patientToAssign._id ? { ...p, doctorId: doc.id } : p
                );
                setPatients(updatedPatients);
                setAssignData({ docId: '', patientName: '' });
                closeConfirmation();
                alert(`Assigned ${patientToAssign.name} to ${doc.name}`);
            }
        });
    };

    const handleDeleteDoctor = (id) => {
        setConfirmation({
            isOpen: true,
            title: 'Delete Doctor',
            message: 'Are you sure you want to permanently delete this doctor? This action cannot be undone.',
            onConfirm: () => {
                setDoctors(doctors.filter(d => d.id !== id));
                closeConfirmation();
            }
        });
    };

    const handleRemovePatient = (docId, patientId) => {
        setConfirmation({
            isOpen: true,
            title: 'Unassign Patient',
            message: 'Are you sure you want to remove this patient from the doctor\'s list? The patient will remain in the database.',
            onConfirm: () => {
                // Decoupled: Update global patient list to remove doctorId
                // We need the patient's unique ID or we can find by matching fields if we only have index.
                // But the table now uses filtered list so we should have access to the patient object.
                // The updated table render will pass patient._id or patient.id
                
                const updatedPatients = patients.map(p => 
                    (p.id === patientId || p._id === patientId) ? { ...p, doctorId: '' } : p
                );
                setPatients(updatedPatients);
                closeConfirmation();
            }
        });
    };
    
    const handleDeletePatient = (patientId) => {
         setConfirmation({
            isOpen: true,
            title: 'Delete Patient',
            message: 'Are you sure you want to permanently delete this patient? This will also remove them from any assigned doctor.',
            onConfirm: () => {
                setPatients(patients.filter(p => p._id !== patientId && p.id !== patientId));
                closeConfirmation();
            }
        });
    };

    return (
        <div className="flex h-screen bg-gray-100 overflow-hidden">
            {/* Sidebar */}
            <aside 
                className={`bg-white shadow-xl z-20 transition-all duration-300 flex flex-col ${isSidebarOpen ? 'w-64' : 'w-20'}`}
            >
                {/* Sidebar Header */}
                <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100">
                    {isSidebarOpen ? (
                        <div className="flex items-center space-x-2 text-blue-600">
                            <Activity />
                            <span className="font-bold text-lg">Smart Ward</span>
                        </div>
                    ) : (
                        <div className="mx-auto text-blue-600"><Activity /></div>
                    )}
                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1 rounded-full hover:bg-gray-100 text-gray-500">
                        {isSidebarOpen ? <ChevronLeft /> : <ChevronRight />}
                    </button>
                </div>

                {/* Sidebar Navigation */}
                <nav className="flex-1 py-6 space-y-2 overflow-y-auto">
                    <button 
                        onClick={() => setCurrentView('dashboard')}
                        className={`w-full flex items-center px-4 py-3 transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <div className="min-w-[2rem]"><Table /></div>
                        {isSidebarOpen && <span className="font-medium">Dashboard</span>}
                    </button>

                    {/* Doctors Group */}
                    <div className="space-y-1">
                        <button 
                            onClick={() => isSidebarOpen ? setExpandedMenu(p => ({...p, doctors: !p.doctors})) : setCurrentView('doctors')}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-gray-600 hover:bg-gray-50`}
                        >
                            <div className="flex items-center">
                                <div className="min-w-[2rem]"><UserPlus /></div>
                                {isSidebarOpen && <span className="font-medium">Doctors</span>}
                            </div>
                            {isSidebarOpen && (
                                <div className={`transform transition-transform ${expandedMenu.doctors ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} />
                                </div>
                            )}
                        </button>
                        {isSidebarOpen && expandedMenu.doctors && (
                            <div className="bg-gray-50 py-2 space-y-1">
                                <button 
                                    onClick={() => setCurrentView('doctors')}
                                    className={`w-full flex items-center pl-12 pr-4 py-2 text-sm transition-colors ${currentView === 'doctors' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Add Doctor
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {/* Patients Group */}
                    <div className="space-y-1">
                        <button 
                            onClick={() => isSidebarOpen ? setExpandedMenu(p => ({...p, patients: !p.patients})) : setCurrentView('patients-list')}
                            className={`w-full flex items-center justify-between px-4 py-3 transition-colors text-gray-600 hover:bg-gray-50`}
                        >
                            <div className="flex items-center">
                                <div className="min-w-[2rem]"><Table /></div>
                                {isSidebarOpen && <span className="font-medium">Patients</span>}
                            </div>
                            {isSidebarOpen && (
                                <div className={`transform transition-transform ${expandedMenu.patients ? 'rotate-90' : ''}`}>
                                    <ChevronRight size={16} />
                                </div>
                            )}
                        </button>
                        {isSidebarOpen && expandedMenu.patients && (
                            <div className="bg-gray-50 py-2 space-y-1">
                                <button 
                                    onClick={() => setCurrentView('patients-list')}
                                    className={`w-full flex items-center pl-12 pr-4 py-2 text-sm transition-colors ${currentView === 'patients-list' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Patient's List
                                </button>
                                <button 
                                    onClick={() => setCurrentView('add-patient')}
                                    className={`w-full flex items-center pl-12 pr-4 py-2 text-sm transition-colors ${currentView === 'add-patient' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Add Patient
                                </button>
                                <button 
                                    onClick={() => setCurrentView('assign-patient')}
                                    className={`w-full flex items-center pl-12 pr-4 py-2 text-sm transition-colors ${currentView === 'assign-patient' ? 'text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-800'}`}
                                >
                                    Assign Doctor
                                </button>
                            </div>
                        )}
                    </div>

                    <button 
                        onClick={() => setCurrentView('approvals')}
                        className={`w-full flex items-center px-4 py-3 transition-colors ${currentView === 'approvals' ? 'bg-blue-50 text-blue-600 border-r-4 border-blue-600' : 'text-gray-600 hover:bg-gray-50'}`}
                    >
                        <div className="min-w-[2rem] relative">
                            <UserCheck />
                            {pendingDoctors && pendingDoctors.length > 0 && (
                                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                                    {pendingDoctors.length}
                                </span>
                            )}
                        </div>
                        {isSidebarOpen && (
                            <div className="flex justify-between items-center w-full">
                                <span className="font-medium">Approvals</span>
                                {pendingDoctors && pendingDoctors.length > 0 && (
                                    <span className="bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs font-bold">
                                        {pendingDoctors.length}
                                    </span>
                                )}
                            </div>
                        )}
                    </button>
                </nav>

                {/* Sidebar Footer */}
                <div className="p-4 border-t border-gray-100">
                    {/* Admin Profile/Password View */}
                    {isSidebarOpen && adminAccount && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm">
                            <div className="font-semibold text-gray-700 mb-1">My Account</div>
                            <div className="text-gray-500 text-xs break-all">{adminAccount.email}</div>
                            <div className="mt-2 flex items-center justify-between bg-white px-2 py-1 rounded border border-gray-200">
                                <span className="font-mono text-xs">
                                    {showAdminPassword ? adminAccount.password : '••••••••'}
                                </span>
                                <button 
                                    onClick={() => setShowAdminPassword(!showAdminPassword)}
                                    className="text-gray-400 hover:text-blue-600"
                                >
                                    {showAdminPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                                </button>
                            </div>
                        </div>
                    )}

                    <button 
                        onClick={onLogout} 
                        className={`flex items-center w-full bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors rounded-lg p-3 font-medium border border-red-100 ${!isSidebarOpen && 'justify-center'}`}
                    >
                        <Logout />
                        {isSidebarOpen && <span className="ml-2">Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="bg-white shadow-sm z-10 h-16 flex items-center justify-between px-6">
                    <h2 className="text-xl font-bold text-gray-800">
                        {currentView === 'dashboard' ? 'Doctor Database' 
                            : currentView === 'doctors' ? 'Doctor Management' 
                            : currentView === 'patients-list' ? 'Patient Management' 
                            : currentView === 'add-patient' ? 'Add Patient'
                            : currentView === 'assign-patient' ? 'Assign Patient' 
                        : currentView === 'doctor-dashboard' ? 'Doctor Dashboard' 
                        : currentView === 'patient-dashboard' ? 'Patient Dashboard'
                        : 'Doctor Approvals'}
                    </h2>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600 text-sm">Admin: {user.name}</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                    {currentView === 'approvals' ? (
                        // Approvals View
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                                <h2 className="text-lg font-semibold text-gray-700">Pending Registrations</h2>
                            </div>
                            {pendingDoctors.length === 0 ? (
                                <div className="p-8 text-center text-gray-500">No pending doctor approvals.</div>
                            ) : (
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-3 font-medium">Doctor Name</th>
                                            <th className="px-6 py-3 font-medium">Email</th>
                                            <th className="px-6 py-3 font-medium">Phone</th>
                                            <th className="px-6 py-3 font-medium">Domain</th>
                                            <th className="px-6 py-3 font-medium">Certificate</th>
                                            <th className="px-6 py-3 font-medium">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {pendingDoctors.map(doctor => (
                                            <tr key={doctor.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-medium text-gray-800">{doctor.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{doctor.email}</td>
                                                <td className="px-6 py-4 text-gray-600">{doctor.phone || '-'}</td>
                                                <td className="px-6 py-4">
                                                    <span className="bg-blue-100 text-blue-700 py-1 px-3 rounded-full text-xs font-medium">
                                                        {doctor.domain || doctor.field}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {doctor.certificates ? (
                                                        <button 
                                                            onClick={() => openPdf(doctor.certificates)}
                                                            className="flex items-center text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-md transition-colors text-sm"
                                                        >
                                                            <FileText size={16} className="mr-2" />
                                                            View
                                                        </button>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-sm">No file</span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex space-x-2">
                                                        <button 
                                                            onClick={() => handleApproveDoctor(doctor)}
                                                            className="text-green-600 hover:bg-green-50 p-2 rounded-full transition-colors"
                                                            title="Approve"
                                                        >
                                                            <Check size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleRejectDoctor(doctor.id)}
                                                            className="text-red-600 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                            title="Reject"
                                                        >
                                                            <XMark size={18} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    ) : currentView === 'doctors' ? (
                        <div className="max-w-6xl mx-auto bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="bg-gray-50 px-8 py-6 border-b border-gray-200">
                                <div className="flex items-center space-x-3 text-blue-600 mb-2">
                                    <UserPlus size={24} />
                                    <h2 className="text-xl font-bold text-gray-800">Add New Doctor</h2>
                                </div>
                                <p className="text-gray-500 text-sm">Enter the doctor's information below to register them in the system.</p>
                            </div>
                            
                            <div className="p-8">
                                <form onSubmit={handleAddDoctor} className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name</label>
                                            <input 
                                                type="text" 
                                                placeholder="e.g. Dr. John Smith" 
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                value={newDoc.name}
                                                onChange={(e) => setNewDoc({...newDoc, name: e.target.value})}
                                                required
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                            <input 
                                                type="tel" 
                                                placeholder="e.g. 9876543210" 
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                value={newDoc.phone}
                                                onChange={(e) => setNewDoc({...newDoc, phone: e.target.value})}
                                                required
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Medical Field</label>
                                            <div className="relative">
                                                <select 
                                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none appearance-none bg-white transition-all"
                                                    value={newDoc.field}
                                                    onChange={(e) => setNewDoc({...newDoc, field: e.target.value})}
                                                    required
                                                >
                                                    <option value="">Select a specialty</option>
                                                    {MEDICAL_SPECIALTIES.map(specialty => (
                                                        <option key={specialty} value={specialty}>{specialty}</option>
                                                    ))}
                                                </select>
                                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-gray-500">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                                            <input 
                                                type="email" 
                                                placeholder="doctor@hospital.com" 
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                value={newDoc.email}
                                                onChange={(e) => setNewDoc({...newDoc, email: e.target.value})}
                                                required
                                            />
                                        </div>

                                        <div className="col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                            <input 
                                                type="password" 
                                                placeholder="Set a temporary password" 
                                                className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                                                value={newDoc.password}
                                                onChange={(e) => setNewDoc({...newDoc, password: e.target.value})}
                                                required
                                            />
                                        </div>
                                    </div>
                                    
                                    <div className="pt-4 flex justify-end space-x-3">
                                        <button 
                                            type="button"
                                            onClick={() => setCurrentView('dashboard')}
                                            className="px-6 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button 
                                            type="submit" 
                                            className="px-6 py-2.5 rounded-lg bg-teal-500 hover:bg-teal-600 text-white font-medium shadow-md shadow-teal-200 transition-all transform hover:-translate-y-0.5"
                                        >
                                            + Add Doctor
                                        </button>
                                    </div>
                                </form>
                            </div>
                            
                            <div className="bg-gray-50 px-8 py-6 border-t border-gray-200">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-lg font-semibold text-gray-700 flex items-center"><Table /> Doctor Database</h2>
                                </div>
                            </div>
                            
                            <div className="px-8 pb-8">
                                <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
                                    <table className="w-full text-left border-collapse">
                                        <thead>
                                            <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                                <th className="px-6 py-3 font-medium">Doctor</th>
                                                <th className="px-6 py-3 font-medium">Contact</th>
                                                <th className="px-6 py-3 font-medium">Specialty</th>
                                                <th className="px-6 py-3 font-medium">Password</th>
                                                <th className="px-6 py-3 font-medium text-center">Patients</th>
                                                <th className="px-6 py-3 font-medium">Assigned List</th>
                                                <th className="px-6 py-3 font-medium text-center">Action</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {doctors.length === 0 ? (
                                                <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No doctors found in database.</td></tr>
                                            ) : doctors.map(doc => (
                                                <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="font-medium text-gray-900">{doc.name}</div>
                                                        <div className="text-xs text-gray-500">{doc.id}</div>
                                                    </td>
                                                    <td className="px-6 py-4 text-sm text-gray-500">
                                                        <div>{doc.email}</div>
                                                        <div className="text-xs">{doc.phone}</div>
                                                    </td>
                                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{doc.field}</span></td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                                {visiblePasswords[doc.id] ? doc.password : '••••••'}
                                                            </span>
                                                            <button onClick={() => togglePassword(doc.id)} className="text-gray-400 hover:text-blue-600 focus:outline-none" title="Show/Hide">
                                                                {visiblePasswords[doc.id] ? <EyeOff /> : <Eye />}
                                                            </button>
                                                            <button onClick={() => handleChangePassword(doc.id)} className="text-gray-400 hover:text-blue-600 focus:outline-none" title="Change Password">
                                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                            </button>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center font-bold text-gray-700">
                                                        {(patients || []).filter(p => p.doctorId === doc.id).length}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(patients || []).filter(p => p.doctorId === doc.id).map((p, i) => (
                                                                <span key={i} className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                                                    {p.name}
                                                                    <button onClick={() => handleRemovePatient(doc.id, p._id || p.id)} className="ml-1 text-gray-400 hover:text-red-500"><XMark /></button>
                                                                </span>
                                                            ))}
                                                            {(patients || []).filter(p => p.doctorId === doc.id).length === 0 && <span className="text-gray-400 text-xs italic">None</span>}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-center">
                                                        <button onClick={() => handleDeleteDoctor(doc.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><Trash /></button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    ) : (
                        // Dashboard View
                        <>
                            {/* Stats Grid */}
                            {currentView === 'dashboard' && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                                    <h2 className="text-lg font-semibold text-gray-700 flex items-center">
                                        <Table /> Doctor Database
                                    </h2>
                                    <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">{doctors.length} Doctors</span>
                                </div>
                                <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                    <th className="px-6 py-3 font-medium">Doctor</th>
                                    <th className="px-6 py-3 font-medium">Contact</th>
                                    <th className="px-6 py-3 font-medium">Specialty</th>
                                    <th className="px-6 py-3 font-medium">Password</th>
                                    <th className="px-6 py-3 font-medium text-center">Patients</th>
                                    <th className="px-6 py-3 font-medium">Assigned List</th>
                                    <th className="px-6 py-3 font-medium text-center">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {doctors.length === 0 ? (
                                    <tr><td colSpan="7" className="px-6 py-8 text-center text-gray-400">No doctors found in database.</td></tr>
                                ) : doctors.map(doc => (
                                    <tr key={doc.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{doc.name}</div>
                                            <div className="text-xs text-gray-500">{doc.id}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div>{doc.email}</div>
                                            <div className="text-xs">{doc.phone}</div>
                                        </td>
                                        <td className="px-6 py-4"><span className="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs font-semibold">{doc.field}</span></td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center space-x-2">
                                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                                                    {visiblePasswords[doc.id] ? doc.password : '••••••'}
                                                </span>
                                                <button onClick={() => togglePassword(doc.id)} className="text-gray-400 hover:text-blue-600 focus:outline-none" title="Show/Hide">
                                                    {visiblePasswords[doc.id] ? <EyeOff /> : <Eye />}
                                                </button>
                                                <button onClick={() => handleChangePassword(doc.id)} className="text-gray-400 hover:text-blue-600 focus:outline-none" title="Change Password">
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-700">
                                            {(patients || []).filter(p => p.doctorId === doc.id).length}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-2">
                                                {(patients || []).filter(p => p.doctorId === doc.id).map((p, i) => (
                                                    <span key={i} className="inline-flex items-center bg-gray-100 px-2 py-1 rounded text-xs text-gray-700">
                                                        {p.name}
                                                        <button onClick={() => handleRemovePatient(doc.id, p._id || p.id)} className="ml-1 text-gray-400 hover:text-red-500"><XMark /></button>
                                                    </span>
                                                ))}
                                                {(patients || []).filter(p => p.doctorId === doc.id).length === 0 && <span className="text-gray-400 text-xs italic">None</span>}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button onClick={() => handleDeleteDoctor(doc.id)} className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"><Trash /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                                </div>
                                
                                {selectedDashboardPatient && (() => {
                                    const p = patients.find(pat => (pat._id || pat.id) === selectedDashboardPatient);
                                    if (!p) return null;
                                    return (
                                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setSelectedDashboardPatient(null)}>
                                            <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-lg w-full transform transition-all animate-fade-in" onClick={e => e.stopPropagation()}>
                                                <div className="flex justify-between items-start mb-6">
                                                    <div>
                                                        <h3 className="text-xl font-bold text-gray-900">{p.name}</h3>
                                                        <p className="text-sm text-gray-500 font-mono">ID: {p.patientId}</p>
                                                        <p className="text-xs text-gray-400 mt-1">Device: {p.deviceId}</p>
                                                    </div>
                                                    <button onClick={() => setSelectedDashboardPatient(null)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors">
                                                        <X size={24} />
                                                    </button>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-4">
                                                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Heart size={16} className="text-blue-500" />
                                                            <p className="text-sm text-blue-700 font-medium">Heart Rate</p>
                                                        </div>
                                                        <p className="text-2xl font-bold text-gray-900">{p.vitals?.heartRate || '--'} <span className="text-sm font-normal text-gray-500">bpm</span></p>
                                                    </div>
                                                    <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Wind size={16} className="text-purple-500" />
                                                            <p className="text-sm text-purple-700 font-medium">SPO2</p>
                                                        </div>
                                                        <p className="text-2xl font-bold text-gray-900">{p.vitals?.spo2 || '--'} <span className="text-sm font-normal text-gray-500">%</span></p>
                                                    </div>
                                                    <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Activity size={16} className="text-red-500" />
                                                            <p className="text-sm text-red-700 font-medium">Blood Pressure</p>
                                                        </div>
                                                        <p className="text-2xl font-bold text-gray-900">{p.vitals?.bpSys || '--'}/{p.vitals?.bpDia || '--'} <span className="text-sm font-normal text-gray-500">mmHg</span></p>
                                                    </div>
                                                    <div className="bg-green-50 p-4 rounded-xl border border-green-100">
                                                        <div className="flex items-center gap-2 mb-2">
                                                            <Activity size={16} className="text-green-500" />
                                                            <p className="text-sm text-green-700 font-medium">Status</p>
                                                        </div>
                                                        <span className={`inline-block px-2 py-1 rounded text-sm font-semibold ${p.isOnline ? 'bg-green-200 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                                                            {p.isOnline ? 'Active' : 'Offline'}
                                                        </span>
                                                    </div>
                                                </div>
                                                
                                                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                                                     <button onClick={() => setSelectedDashboardPatient(null)} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors">
                                                        Close
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })()}
                            </div>
                        )}

                {currentView === 'patients-list' && (
                    <div className="space-y-8 mt-8">
                        {/* Patient Database Table (Top) */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center justify-between">
                                <div className="flex items-center"><Table /> <span className="ml-2">Patient Database</span></div>
                                <span className="bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">{patients.length} Patients</span>
                            </h3>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider">
                                            <th className="px-6 py-3 font-medium">Patient ID</th>
                                            <th className="px-6 py-3 font-medium">Name</th>
                                            <th className="px-6 py-3 font-medium">Age</th>
                                            <th className="px-6 py-3 font-medium">Phone</th>
                                            <th className="px-6 py-3 font-medium">Assigned Doctor</th>
                                            <th className="px-6 py-3 font-medium">Device ID</th>
                                            <th className="px-6 py-3 font-medium">Created At</th>
                                            <th className="px-6 py-3 font-medium text-center">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {(patients || []).length === 0 ? (
                                            <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-400">No patients in database yet.</td></tr>
                                        ) : (patients || []).map(p => {
                                            const assigned = doctors.find(d => d.id === p.doctorId);
                                            return (
                                                <tr key={p._id || p.id} onClick={() => setSelectedDashboardPatient(p._id || p.id)} className="hover:bg-blue-50 transition-colors cursor-pointer">
                                                    <td className="px-6 py-3 text-sm font-mono text-gray-500">{p.patientId}</td>
                                                    <td className="px-6 py-3 font-medium text-gray-900">{p.name}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{p.age}</td>
                                                    <td className="px-6 py-3 text-sm text-gray-500">{p.phone}</td>
                                                    <td className="px-6 py-3">
                                                        {assigned ? (
                                                            <span className="px-2 py-1 bg-green-50 text-green-700 rounded text-xs font-semibold">
                                                                {assigned.name}
                                                            </span>
                                                        ) : (
                                                            <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs">Unassigned</span>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-3 text-sm font-mono text-gray-500">{p.deviceId}</td>
                                                    <td className="px-6 py-3 text-xs text-gray-400">
                                                        {new Date(p.createdAt).toLocaleDateString()}
                                                    </td>
                                                    <td className="px-6 py-3 text-center">
                                                        <button 
                                                            onClick={(e) => { e.stopPropagation(); handleDeletePatient(p._id || p.id); }} 
                                                            className="text-red-500 hover:bg-red-50 p-2 rounded-full transition-colors"
                                                            title="Delete Patient"
                                                        >
                                                            <Trash size={18} />
                                                        </button>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                
                {currentView === 'add-patient' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto w-full mt-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center"><UserPlus /> <span className="ml-2">Add Patient Details</span></h3>
                        <form onSubmit={handleAddPatient} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Patient Name</label>
                                <input type="text" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })} required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Age</label>
                                    <input type="number" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newPatient.age} onChange={e => setNewPatient({ ...newPatient, age: e.target.value })} required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-600 mb-1">Phone</label>
                                    <input type="tel" className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })} required placeholder="9XXXXXXXXX" />
                                </div>
                            </div>
                            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition-colors">Add Patient</button>
                        </form>
                    </div>
                )}
                
                {currentView === 'assign-patient' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-2xl mx-auto w-full mt-8">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4">Assign to Doctor</h3>
                        <form onSubmit={handleAssignPatient} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Select Doctor</label>
                                <select required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={assignData.docId} onChange={e => setAssignData({ ...assignData, docId: e.target.value })}>
                                    <option value="">-- Choose Doctor --</option>
                                    {doctors.map(d => <option key={d.id} value={d.id}>{d.name} ({d.field})</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-600 mb-1">Select Patient</label>
                                <select required className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 outline-none bg-white" value={assignData.patientName} onChange={e => setAssignData({ ...assignData, patientName: e.target.value })}>
                                    <option value="">-- Choose Patient --</option>
                                    {(patients || []).filter(p => !p.doctorId).map(p => (
                                        <option key={p._id || p.id} value={p.name}>{p.name} ({p.patientId})</option>
                                    ))}
                                </select>
                                <p className="text-xs text-gray-500 mt-1">Only unassigned patients are listed.</p>
                            </div>
                            <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded-lg transition-colors shadow-md mt-2">Assign Patient</button>
                        </form>
                    </div>
                )}
                
                {currentView === 'doctor-dashboard' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
                        <div className="flex items-center mb-4">
                            <label className="text-sm font-medium text-gray-600 mr-3">Select Doctor</label>
                            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white" value={selectedDashboardDoctor} onChange={e => setSelectedDashboardDoctor(e.target.value)}>
                                <option value="">-- Choose Doctor --</option>
                                {doctors.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                            </select>
                        </div>
                        {selectedDashboardDoctor ? (
                            <div className="border rounded-xl overflow-hidden">
                                {React.createElement(window.DoctorDashboard, { user: doctors.find(d => d.id === selectedDashboardDoctor), onLogout: () => setCurrentView('doctors'), doctors, patients })}
                            </div>
                        ) : (
                            <div className="text-gray-500">Select a doctor to view dashboard.</div>
                        )}
                    </div>
                )}

                {currentView === 'patient-dashboard' && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-8">
                        <div className="flex items-center mb-6">
                            <label className="text-sm font-medium text-gray-600 mr-3">Select Patient</label>
                            <select className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white min-w-[200px]" value={selectedDashboardPatient} onChange={e => setSelectedDashboardPatient(e.target.value)}>
                                <option value="">-- Choose Patient --</option>
                                {(patients || []).map(p => <option key={p._id || p.id} value={p._id || p.id}>{p.name} ({p.patientId})</option>)}
                            </select>
                        </div>
                        
                        {(() => {
                            const selectedPatient = (patients || []).find(p => (p._id || p.id) === selectedDashboardPatient);
                            if (!selectedPatient) return <div className="text-gray-500">Select a patient to view dashboard.</div>;
                            
                            return (
                                <div className="space-y-6">
                                    {/* Info Card */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                                        <div className="bg-blue-600 -mx-6 -mt-6 px-6 py-4 rounded-t-2xl mb-6">
                                            <h2 className="text-white font-bold text-lg">Patient Information</h2>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                            <div><p className="text-xs text-gray-400 uppercase font-semibold">Patient Name</p><p className="text-lg font-bold text-gray-800">{selectedPatient.name}</p></div>
                                            <div><p className="text-xs text-gray-400 uppercase font-semibold">Age</p><p className="text-lg font-bold text-gray-800">{selectedPatient.age} years</p></div>
                                            <div><p className="text-xs text-gray-400 uppercase font-semibold">Patient ID</p><p className="text-lg font-bold text-gray-800">{selectedPatient.patientId}</p></div>
                                            <div><p className="text-xs text-gray-400 uppercase font-semibold">Device ID</p><p className="text-lg font-bold text-gray-800">{selectedPatient.deviceId}</p></div>
                                            <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-semibold">Address</p><p className="text-base text-gray-700">{selectedPatient.address}</p></div>
                                            <div className="col-span-2"><p className="text-xs text-gray-400 uppercase font-semibold">Phone</p><p className="text-base text-gray-700">{selectedPatient.phone}</p></div>
                                        </div>
                                    </div>
                                    
                                    {/* Vitals */}
                                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                                        <div className="bg-green-600 px-6 py-4"><h2 className="text-white font-bold text-lg">Vital Signs</h2></div>
                                        <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-6">
                                            {/* SPO2 */}
                                            <div className="bg-orange-50 rounded-xl p-6 flex flex-col items-center justify-center border border-orange-100 hover:shadow-lg cursor-pointer transition-all" onClick={() => setSelectedMetric('spo2')}>
                                                <div className="text-orange-500 mb-2"><Activity /></div>
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">SpO₂</div>
                                                <div className="text-3xl font-bold text-gray-800">{selectedPatient.isOnline ? `${history.spo2[history.spo2.length-1] || selectedPatient.vitals.spo2}%` : '-'}</div>
                                            </div>
                                            {/* HR */}
                                            <div className="bg-green-50 rounded-xl p-6 flex flex-col items-center justify-center border border-green-100 hover:shadow-lg cursor-pointer transition-all" onClick={() => setSelectedMetric('heartRate')}>
                                                <div className="text-green-500 mb-2"><Activity /></div>
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Heart Rate</div>
                                                <div className="text-3xl font-bold text-gray-800">{selectedPatient.isOnline ? history.heartRate[history.heartRate.length-1] || selectedPatient.vitals.heartRate : '-'} <span className="text-lg text-gray-500 font-normal">bpm</span></div>
                                            </div>
                                            {/* Temp */}
                                            <div className="bg-blue-50 rounded-xl p-6 flex flex-col items-center justify-center border border-blue-100 hover:shadow-lg cursor-pointer transition-all" onClick={() => setSelectedMetric('temp')}>
                                                <div className="text-blue-500 mb-2"><Activity /></div>
                                                <div className="text-xs text-gray-500 uppercase font-bold mb-1">Temperature</div>
                                                <div className="text-3xl font-bold text-gray-800">{selectedPatient.isOnline ? `${history.temp[history.temp.length-1] || selectedPatient.vitals.temp}°F` : '-'}</div>
                                            </div>
                                        </div>
                                        
                                        {/* Chart */}
                                        {selectedMetric && (
                                            <div className="px-8 pb-8">
                                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                                    <div className="flex items-center justify-between mb-2">
                                                        <div className="text-sm font-semibold text-gray-700">Live {selectedMetric === 'spo2' ? 'SpO₂' : selectedMetric === 'heartRate' ? 'Heart Rate' : 'Temperature'}</div>
                                                        <button className="text-xs text-gray-500 hover:text-gray-700" onClick={() => setSelectedMetric(null)}>Close</button>
                                                    </div>
                                                    <svg width="100%" height="250" viewBox="0 0 600 250" className="bg-white">
                                                        {(() => {
                                                            const data = history[selectedMetric] || [];
                                                            if (data.length < 2) return (
                                                                <text x="300" y="125" textAnchor="middle" fill="#9ca3af" fontSize="14">Waiting for data...</text>
                                                            );
                                                            
                                                            const width = 600;
                                                            const height = 250;
                                                            const padding = 40;
                                                            const chartW = width - padding * 2;
                                                            const chartH = height - padding * 2;
                                                            
                                                            const maxVal = Math.max(...data, selectedMetric === 'spo2' ? 100 : selectedMetric === 'heartRate' ? 150 : 105);
                                                            const minVal = Math.min(...data, selectedMetric === 'spo2' ? 80 : selectedMetric === 'heartRate' ? 40 : 95);
                                                            const range = maxVal - minVal || 1;
                                                            
                                                            const getX = (i) => padding + (i / (data.length - 1)) * chartW;
                                                            const getY = (v) => height - padding - ((v - minVal) / range) * chartH;
                                                            
                                                            const points = data.map((v, i) => `${getX(i)},${getY(v)}`).join(' ');
                                                            
                                                            const gridLines = [];
                                                            for(let i=0; i<=5; i++) {
                                                                const y = height - padding - (i/5) * chartH;
                                                                gridLines.push(<line key={`h-${i}`} x1={padding} y1={y} x2={width-padding} y2={y} stroke="#e5e7eb" strokeWidth="1" strokeDasharray="4 4" />);
                                                                gridLines.push(<text key={`ht-${i}`} x={padding - 10} y={y + 4} textAnchor="end" fontSize="10" fill="#6b7280">{Math.round(minVal + (i/5)*range)}</text>);
                                                            }
                                                            
                                                            const dots = data.map((v, i) => (
                                                                <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill="#ef4444" stroke="#fff" strokeWidth="1" />
                                                            ));
                                                            
                                                            return (
                                                                <>
                                                                    {gridLines}
                                                                    <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#374151" strokeWidth="1" />
                                                                    <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#374151" strokeWidth="1" />
                                                                    <polyline points={points} fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                                    {dots}
                                                                    <text x={width/2} y={height - 10} textAnchor="middle" fontSize="12" fill="#374151">Time (seconds)</text>
                                                                    <text x="15" y={height/2} transform={`rotate(-90, 15, ${height/2})`} textAnchor="middle" fontSize="12" fill="#374151">Value</text>
                                                                </>
                                                            );
                                                        })()}
                                                    </svg>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    
                                    {/* EWS & Status */}
                                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                                        <div className="flex justify-between items-center mb-4">
                                            <div><p className="text-sm font-bold text-gray-400 uppercase">Early Warning Score (EWS)</p><p className="text-xl font-bold text-gray-800">Risk Assessment</p></div>
                                            <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${(selectedPatient.ewsScore || 0) >= 7 ? 'bg-red-100 text-red-700' : (selectedPatient.ewsScore || 0) >= 5 ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>Score: {selectedPatient.ewsScore || 0}</span>
                                        </div>
                                        <div className="flex justify-between items-center bg-gray-50 rounded-lg p-4">
                                            <div>
                                                <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Clinical Response</p>
                                                <div className={`text-sm font-medium px-2 py-1 rounded ${selectedPatient.isOnline ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {selectedPatient.isOnline ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                            <span className={`px-6 py-2 rounded-lg text-lg font-bold uppercase tracking-widest ${getStatusColor(selectedPatient.status)}`}>{selectedPatient.status}</span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })()}
                    </div>
                )}
                        </>
                    )}
            </main>
        </div>

            {/* Password Change Modal */}
            {passwordModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full overflow-hidden">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-4">Change Password</h3>
                            <input 
                                type="text" 
                                placeholder="New Password" 
                                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4 outline-none"
                                value={passwordModal.newPassword}
                                onChange={e => setPasswordModal({...passwordModal, newPassword: e.target.value})}
                            />
                            <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={() => setPasswordModal({ ...passwordModal, isOpen: false })}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={submitPasswordChange}
                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-md"
                                >
                                    Save
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmation.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 opacity-100">
                        <div className="p-6">
                            <h3 className="text-xl font-bold text-gray-900 mb-2">{confirmation.title}</h3>
                            <p className="text-gray-600 mb-6">{confirmation.message}</p>
                            <div className="flex justify-end space-x-3">
                                <button 
                                    onClick={closeConfirmation}
                                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={confirmation.onConfirm}
                                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors shadow-md shadow-red-500/30"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
    </div>
    );
};
