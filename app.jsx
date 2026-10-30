import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- Khởi tạo cấu hình Firebase từ môi trường ---
const appId = typeof __app_id !== 'undefined' ? __app_id : 'cssd-env-tracker';
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {
    // Fallback config dummy nếu chạy ngoài môi trường chuẩn
    apiKey: "dummy", authDomain: "dummy", projectId: "dummy"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export default function App() {
    // State form nhập liệu
    const [location, setLocation] = useState('Phòng Xét Nghiệm');
    const [deviceId, setDeviceId] = useState('');
    const [temperature, setTemperature] = useState('');
    const [humidity, setHumidity] = useState('');
    const [technician, setTechnician] = useState(() => {
        return localStorage?.getItem?.('cssd_tech_name') || 'KTV. Nguyễn Văn A';
    });
    
    // State dữ liệu, bộ lọc & hệ thống
    const [filterLocation, setFilterLocation] = useState('Tất cả');
    const [logs, setLogs] = useState([]);
    const [authReady, setAuthReady] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [verifierName, setVerifierName] = useState('QLKT/NVAT');
    
    // State cho tính năng Quét QR mô phỏng
    const [isScanning, setIsScanning] = useState(false);

    // --- STATE MỚI CHO TAB & BOWIE-DICK ---
    const [activeTab, setActiveTab] = useState('environment'); // 'environment' | 'bowiedick'
    
    // State form Bowie-Dick
    const [bdAutoclave, setBdAutoclave] = useState('Máy Steam 01 (Cửa trước)');
    const [bdCycle, setBdCycle] = useState('1');
    const [bdResult, setBdResult] = useState('Đạt');
    const [bdNote, setBdNote] = useState('');
    const [bdLogs, setBdLogs] = useState([]);

    // Xác thực người dùng (Anonymous hoặc Token ngầm, không cần form login phức tạp)
    useEffect(() => {
        const initAuth = async () => {
            try {
                if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                    await signInWithCustomToken(auth, __initial_auth_token);
                } else {
                    await signInAnonymously(auth);
                }
                setAuthReady(true);
            } catch (error) {
                console.error("Lỗi xác thực:", error);
            }
        };
        initAuth();
    }, []);

    // Lấy dữ liệu từ Firestore (Listener realtime)
    useEffect(() => {
        if (!authReady) return;

        // Bắt buộc tuân thủ Rule 1: Đường dẫn lưu trữ cụ thể
        const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'environmental_logs');
        
        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            // Bắt buộc tuân thủ Rule 2: Sắp xếp ở memory (không dùng orderBy ở truy vấn)
            data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setLogs(data);
        }, (error) => {
            console.error("Lỗi khi tải dữ liệu:", error);
        });

        return () => unsubscribe();
    }, [authReady]);

    // Listener dữ liệu Bowie-Dick
    useEffect(() => {
        if (!authReady) return;
        const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'bowiedick_logs');
        const unsubscribe = onSnapshot(collectionRef, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
            setBdLogs(data);
        }, (error) => console.error("Lỗi khi tải dữ liệu BD:", error));
        return () => unsubscribe();
    }, [authReady]);

    // Hàm đánh giá cảnh báo động dựa trên chỉ số đang nhập
    const getWarningMessage = (loc, tempVal, humVal) => {
        if (!tempVal && !humVal) return null;
        
        let warnings = [];
        const t = parseFloat(tempVal);
        const h = parseFloat(humVal);

        if (!isNaN(t)) {
            if (loc === 'Phòng Xét Nghiệm' && (t < 21 || t > 26)) {
                warnings.push(`Nhiệt độ PXN ngoài giới hạn (21-26°C)`);
            }
            if (loc === 'Kho hóa chất' && t >= 30) {
                warnings.push(`Nhiệt độ Kho Hóa Chất quá cao (<30°C)`);
            }
        }
        
        if (!isNaN(h) && h >= 70) {
            warnings.push(`Độ ẩm vượt mức cho phép (<70%)`);
        }

        return warnings.length > 0 ? warnings.join(' | ') : null;
    };

    const currentWarning = getWarningMessage(location, temperature, humidity);

    // Xác định ca Sáng / Chiều
    const getShift = () => {
        const hours = new Date().getHours();
        return hours < 12 ? 'Sáng' : 'Chiều';
    };

    // Xử lý gửi biểu mẫu
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!authReady) return;
        
        setIsSubmitting(true);
        const now = new Date();
        
        // Lưu tên NV vào bộ nhớ đệm trình duyệt để lần sau mở lên là có sẵn
        try {
            localStorage.setItem('cssd_tech_name', technician);
        } catch (_) {}

        const newRecord = {
            location,
            deviceId: deviceId.trim().toUpperCase(),
            temperature: parseFloat(temperature),
            humidity: parseFloat(humidity),
            shift: getShift(),
            timestamp: now.toISOString(),
            displayDate: now.toLocaleDateString('vi-VN'),
            displayTime: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            hasWarning: !!currentWarning,
            warningNotes: currentWarning || 'Bình thường',
            recordedBy: technician, // Lưu họ tên người thực hiện thay vì UID khó đọc
            verified: false,
            verifiedBy: null,
            verifiedAt: null
        };

        try {
            const collectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'environmental_logs');
            await addDoc(collectionRef, newRecord);
            
            // Xóa form sau khi nhập thành công
            setTemperature('');
            setHumidity('');
        } catch (error) {
            console.error("Lỗi khi lưu:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Hàm duyệt dành cho NV kiểm tra / QLKT
    const handleVerify = async (id) => {
        if (!authReady) return;
        try {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'environmental_logs', id);
            await updateDoc(docRef, {
                verified: true,
                verifiedBy: verifierName,
                verifiedAt: new Date().toLocaleDateString('vi-VN')
            });
        } catch (error) {
            console.error("Lỗi khi xác nhận kiểm tra:", error);
        }
    };

    const handleDelete = async (id) => {
        if (!authReady) return;
        try {
            const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'environmental_logs', id);
            await deleteDoc(docRef);
        } catch (error) {
            console.error("Lỗi khi xóa:", error);
        }
    };

    // --- CÁC HÀM XỬ LÝ BOWIE-DICK ---
    const handleBdSubmit = async (e) => {
        e.preventDefault();
        if (!authReady) return;
        setIsSubmitting(true);
        const now = new Date();
        try { localStorage.setItem('cssd_tech_name', technician); } catch (_) {}

        const newRecord = {
            autoclave: bdAutoclave,
            cycle: bdCycle,
            result: bdResult,
            note: bdNote,
            timestamp: now.toISOString(),
            displayDate: now.toLocaleDateString('vi-VN'),
            displayTime: now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            recordedBy: technician,
            verified: false,
            verifiedBy: null,
            verifiedAt: null
        };
        try {
            await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'bowiedick_logs'), newRecord);
            setBdCycle((prev) => (parseInt(prev) || 0) + 1 + ""); // Tự động tăng số mẻ cho lần nhập sau
            setBdNote('');
            setBdResult('Đạt');
        } catch (error) {
            console.error("Lỗi lưu BD:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleBdVerify = async (id) => {
        if (!authReady) return;
        try {
            await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bowiedick_logs', id), {
                verified: true,
                verifiedBy: verifierName,
                verifiedAt: new Date().toLocaleDateString('vi-VN')
            });
        } catch (error) { console.error("Lỗi duyệt BD:", error); }
    };

    const handleBdDelete = async (id) => {
        if (!authReady) return;
        try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'bowiedick_logs', id)); } 
        catch (error) { console.error("Lỗi xóa BD:", error); }
    };

    // --- TÍNH NĂNG MỚI: Xuất file Excel (CSV) ---
    const handleExportCSV = () => {
        if (filteredLogs.length === 0) return;
        
        // Tiêu đề cột
        const headers = ['Ngay', 'Ca', 'Thoi gian', 'Vi tri', 'Ma thiet bi', 'Nhiet do (C)', 'Do am (%)', 'Trang thai', 'NV thuc hien', 'NV kiem tra'];
        
        // Dữ liệu dòng
        const rows = filteredLogs.map(log => [
            log.displayDate,
            log.shift,
            log.displayTime,
            log.location,
            log.deviceId,
            log.temperature,
            log.humidity,
            log.hasWarning ? 'Vuot nguong' : 'Binh thuong',
            log.recordedBy || 'NV do',
            log.verified ? log.verifiedBy : 'Chua duyet'
        ]);

        // Thêm BOM (\uFEFF) để Excel nhận diện đúng tiếng Việt UTF-8
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + [headers, ...rows].map(e => e.join(",")).join("\n");
        
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Bao_Cao_Nhiet_Am_${filterLocation === 'Tất cả' ? 'Tong_Hop' : filterLocation}_${new Date().getTime()}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // --- TÍNH NĂNG MỚI: Mô phỏng Quét QR ---
    const handleSimulateQRScan = () => {
        setIsScanning(true);
        // Giả lập thời gian máy ảnh lấy nét và quét mã (1.5s)
        setTimeout(() => {
            setLocation('Kho hóa chất');
            setDeviceId('NAK-KHC-09');
            setIsScanning(false);
        }, 1500);
    };

    // Lọc dữ liệu theo vị trí được chọn
    const filteredLogs = filterLocation === 'Tất cả' 
        ? logs 
        : logs.filter(log => log.location === filterLocation);

    // Tính toán số liệu cho Dashboard
    const statsTotal = filteredLogs.length;
    const statsWarnings = filteredLogs.filter(l => l.hasWarning).length;
    const statsPendingVerify = filteredLogs.filter(l => !l.verified).length;

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-4 md:p-6 selection:bg-teal-500/30">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header */}
                <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-teal-900/40 p-5 rounded-2xl border border-teal-800/50 shadow-lg">
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-500/20 text-teal-300 border border-teal-500/30">QTQL.35.02</span>
                            <h1 className="text-xl sm:text-2xl font-bold text-teal-200">Phiếu Theo Dõi Nhiệt Độ & Độ Ẩm</h1>
                        </div>
                        <p className="text-slate-400 text-sm mt-1">Hệ thống số hóa phiếu kiểm soát môi trường (CSSD / PXN)</p>
                    </div>
                    <div className="text-left sm:text-right flex items-center sm:block gap-4">
                        <div className="text-sm font-semibold text-teal-300">{new Date().toLocaleDateString('vi-VN')}</div>
                        <div className="text-xs px-2.5 py-1 rounded-lg bg-teal-950 border border-teal-800 text-teal-400 font-medium inline-block mt-1">
                            Khung giờ Ca {getShift()}
                        </div>
                    </div>
                </header>

                {/* --- MENU ĐIỀU HƯỚNG TABS --- */}
                <div className="flex gap-3 border-b border-slate-800 pb-px overflow-x-auto no-scrollbar">
                    <button 
                        onClick={() => setActiveTab('environment')}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'environment' ? 'bg-slate-900 text-teal-400 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                        </svg>
                        Theo dõi Nhiệt Ẩm
                    </button>
                    <button 
                        onClick={() => setActiveTab('bowiedick')}
                        className={`px-5 py-3 text-sm font-semibold rounded-t-xl transition-all whitespace-nowrap flex items-center gap-2 ${activeTab === 'bowiedick' ? 'bg-slate-900 text-amber-400 border-t border-l border-r border-slate-800' : 'text-slate-500 hover:text-slate-300 hover:bg-slate-900/50'}`}
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                        Kiểm tra Bowie-Dick
                    </button>
                </div>

                {/* Main Content Grid - NHIỆT ẨM */}
                <div className={`${activeTab === 'environment' ? 'grid' : 'hidden'} grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500`}>
                    
                    {/* Form Cột trái */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-5 relative z-10">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Ghi nhận số liệu
                                </h2>
                                <button 
                                    type="button"
                                    onClick={handleSimulateQRScan}
                                    className="text-xs bg-teal-950 text-teal-400 border border-teal-800 hover:bg-teal-900 hover:text-teal-300 px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                                >
                                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm14 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                    Quét QR
                                </button>
                            </div>

                            {/* Overlay Quét QR */}
                            {isScanning && (
                                <div className="absolute inset-0 bg-slate-950/90 z-50 flex flex-col items-center justify-center backdrop-blur-sm rounded-2xl">
                                    <div className="w-32 h-32 border-2 border-teal-500/50 rounded-xl relative flex items-center justify-center">
                                        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400 rounded-tl-lg"></div>
                                        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400 rounded-tr-lg"></div>
                                        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400 rounded-bl-lg"></div>
                                        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400 rounded-br-lg"></div>
                                        <div className="w-full h-0.5 bg-teal-400/80 animate-[ping_1.5s_ease-in-out_infinite]"></div>
                                    </div>
                                    <p className="mt-4 text-teal-400 font-medium text-sm animate-pulse">Đang định vị mã QR...</p>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4 relative z-10">
                                {/* Chọn nhân viên đo (Không cần login phức tạp) */}
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400 flex justify-between">
                                        <span>NV thực hiện</span>
                                        <span className="text-xs text-teal-400 font-normal">Tự động lưu tên</span>
                                    </label>
                                    <input 
                                        type="text"
                                        required
                                        placeholder="Nhập tên NV đo (VD: CN. Hương)"
                                        value={technician}
                                        onChange={(e) => setTechnician(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">Vị trí đo</label>
                                    <select 
                                        value={location}
                                        onChange={(e) => setLocation(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                                    >
                                        <option value="Phòng Xét Nghiệm">Phòng Xét Nghiệm (21-26°C)</option>
                                        <option value="Kho hóa chất">Kho hóa chất (&lt;30°C)</option>
                                        <option value="Phòng Lưu Trữ Vô Trùng">Phòng Lưu Trữ Vô Trùng</option>
                                        <option value="Khu Tiệt Khuẩn">Khu Tiệt Khuẩn</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">Mã số nhiệt ẩm kế</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="VD: NAK-01"
                                        value={deviceId}
                                        onChange={(e) => setDeviceId(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm uppercase"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-400">Nhiệt độ (°C)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            required
                                            placeholder="24.5"
                                            value={temperature}
                                            onChange={(e) => setTemperature(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-sm font-medium text-slate-400">Độ ẩm (%)</label>
                                        <input 
                                            type="number" 
                                            step="0.1"
                                            required
                                            placeholder="58"
                                            value={humidity}
                                            onChange={(e) => setHumidity(e.target.value)}
                                            className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition-all text-sm"
                                        />
                                    </div>
                                </div>

                                {/* Banner cảnh báo động */}
                                {currentWarning && (
                                    <div className="p-3 bg-rose-950/40 border border-rose-800/60 rounded-xl flex items-start gap-2.5 animate-pulse text-xs">
                                        <svg className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                        </svg>
                                        <div>
                                            <div className="text-rose-300 font-semibold">Cảnh báo vi phạm ngưỡng!</div>
                                            <div className="text-rose-200/90 mt-0.5">{currentWarning}</div>
                                            <div className="text-rose-300/70 mt-1 italic">Yêu cầu báo ngay NVAT/QLKT để xử lý.</div>
                                        </div>
                                    </div>
                                )}

                                <button 
                                    type="submit" 
                                    disabled={!authReady || isSubmitting}
                                    className="w-full mt-4 bg-teal-600 hover:bg-teal-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-teal-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? 'Đang ghi nhận...' : 'Lưu kết quả đo'}
                                    {!isSubmitting && (
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                        </svg>
                                    )}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Table Cột phải */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* --- TÍNH NĂNG MỚI: Dashboard Thống kê --- */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                                <div className="p-3 bg-blue-950/50 text-blue-400 rounded-xl border border-blue-900/50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Tổng lượt đo</div>
                                    <div className="text-2xl font-bold text-slate-200">{statsTotal}</div>
                                </div>
                            </div>
                            
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                                <div className="p-3 bg-rose-950/50 text-rose-400 rounded-xl border border-rose-900/50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Cảnh báo vi phạm</div>
                                    <div className="text-2xl font-bold text-rose-300">{statsWarnings}</div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                                <div className="p-3 bg-amber-950/50 text-amber-400 rounded-xl border border-amber-900/50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                    </svg>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Chờ ký duyệt</div>
                                    <div className="text-2xl font-bold text-amber-300">{statsPendingVerify}</div>
                                </div>
                            </div>
                        </div>

                        {/* Biểu đồ xu hướng (Recharts) */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl p-5">
                            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
                                    </svg>
                                    Đồ Thị Xu Hướng Môi Trường
                                </h2>
                                
                                {/* Bộ lọc vị trí cho biểu đồ */}
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-400">Lọc vị trí:</span>
                                    <select 
                                        value={filterLocation}
                                        onChange={(e) => setFilterLocation(e.target.value)}
                                        className="bg-slate-950 border border-slate-700 text-xs text-teal-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-teal-500"
                                    >
                                        <option value="Tất cả">Tất cả vị trí</option>
                                        <option value="Phòng Xét Nghiệm">Phòng Xét Nghiệm</option>
                                        <option value="Kho hóa chất">Kho hóa chất</option>
                                        <option value="Phòng Lưu Trữ Vô Trùng">Phòng Lưu Trữ Vô Trùng</option>
                                        <option value="Khu Tiệt Khuẩn">Khu Tiệt Khuẩn</option>
                                    </select>
                                </div>
                            </div>

                            <div className="h-[280px] w-full">
                                {filteredLogs.length === 0 ? (
                                    <div className="w-full h-full flex items-center justify-center text-slate-500 italic text-sm">
                                        Chưa có dữ liệu tương ứng cho vị trí này
                                    </div>
                                ) : (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart
                                            data={[...filteredLogs].reverse()}
                                            margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
                                        >
                                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                                            <XAxis 
                                                dataKey="displayTime" 
                                                stroke="#64748b" 
                                                fontSize={11} 
                                                tickLine={false} 
                                                axisLine={false} 
                                            />
                                            <YAxis 
                                                yAxisId="left" 
                                                stroke="#2dd4bf" 
                                                fontSize={11} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                domain={[18, 36]} 
                                            />
                                            <YAxis 
                                                yAxisId="right" 
                                                orientation="right" 
                                                stroke="#818cf8" 
                                                fontSize={11} 
                                                tickLine={false} 
                                                axisLine={false} 
                                                domain={[40, 90]} 
                                            />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#f8fafc' }}
                                                itemStyle={{ fontSize: '13px' }}
                                                labelStyle={{ color: '#94a3b8', marginBottom: '4px' }}
                                                labelFormatter={(label, payload) => {
                                                    if (payload && payload.length > 0) {
                                                        const p = payload[0].payload;
                                                        return `${p.displayDate} - ${label} (${p.location} - ${p.deviceId})`;
                                                    }
                                                    return label;
                                                }}
                                            />
                                            <Legend wrapperStyle={{ paddingTop: '8px', fontSize: '12px', color: '#cbd5e1' }} />
                                            <Line 
                                                yAxisId="left" 
                                                type="monotone" 
                                                dataKey="temperature" 
                                                name="Nhiệt độ (°C)" 
                                                stroke="#2dd4bf" 
                                                strokeWidth={2.5} 
                                                activeDot={{ r: 5, fill: '#2dd4bf', stroke: '#0f172a', strokeWidth: 2 }} 
                                            />
                                            <Line 
                                                yAxisId="right" 
                                                type="monotone" 
                                                dataKey="humidity" 
                                                name="Độ ẩm (%)" 
                                                stroke="#818cf8" 
                                                strokeWidth={2.5}
                                                activeDot={{ r: 5, fill: '#818cf8', stroke: '#0f172a', strokeWidth: 2 }} 
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                )}
                            </div>
                        </div>

                        {/* Bảng Nhật ký dữ liệu */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col flex-1">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                    </svg>
                                    Sổ Nhật Ký Đo & Xác Nhận (QTQL.35.02)
                                </h2>
                                <div className="flex items-center gap-4">
                                    <div className="text-xs text-slate-400 flex items-center gap-1.5">
                                        <span>Người duyệt:</span>
                                        <input 
                                            type="text" 
                                            value={verifierName} 
                                            onChange={(e) => setVerifierName(e.target.value)}
                                            className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-teal-300 w-24 text-xs focus:outline-none focus:border-teal-500"
                                            title="Nhập tên của NVAT / QLKT để ký duyệt"
                                        />
                                    </div>
                                    <button 
                                        onClick={handleExportCSV}
                                        disabled={filteredLogs.length === 0}
                                        className="text-xs bg-indigo-900/40 text-indigo-300 border border-indigo-700/50 hover:bg-indigo-800/60 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                        </svg>
                                        Xuất Excel
                                    </button>
                                </div>
                            </div>
                            <div className="overflow-x-auto p-4 pt-0 mt-2">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/70 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2.5 rounded-l-lg">Thời gian</th>
                                            <th className="px-3 py-2.5">Vị trí & Máy</th>
                                            <th className="px-3 py-2.5 text-center">Nhiệt độ</th>
                                            <th className="px-3 py-2.5 text-center">Độ ẩm</th>
                                            <th className="px-3 py-2.5">NV thực hiện</th>
                                            <th className="px-3 py-2.5 text-center">NV kiểm tra</th>
                                            <th className="px-3 py-2.5 rounded-r-lg text-right">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {filteredLogs.map(log => (
                                            <tr key={log.id} className={`hover:bg-slate-800/40 transition-colors ${log.hasWarning ? 'bg-rose-950/20' : ''}`}>
                                                <td className="px-3 py-2.5">
                                                    <div className="font-semibold text-slate-200">{log.displayTime}</div>
                                                    <div className="text-[10px] text-slate-400">{log.displayDate} (Ca {log.shift})</div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-teal-300 font-medium">{log.location}</div>
                                                    <div className="text-[10px] text-slate-400">Mã: {log.deviceId}</div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded font-bold ${log.hasWarning && log.warningNotes.includes('Nhiệt độ') ? 'bg-rose-900/50 text-rose-300 border border-rose-700' : 'bg-teal-900/30 text-teal-300'}`}>
                                                        {log.temperature} °C
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className={`inline-block px-2 py-0.5 rounded font-bold ${log.hasWarning && log.warningNotes.includes('Độ ẩm') ? 'bg-rose-900/50 text-rose-300 border border-rose-700' : 'bg-indigo-900/30 text-indigo-300'}`}>
                                                        {log.humidity} %
                                                    </span>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-slate-300 font-medium">{log.recordedBy || 'NV đo'}</div>
                                                    <div className="text-[10px] text-slate-500">Đã ký số</div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {log.verified ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">
                                                            ✓ {log.verifiedBy}
                                                        </span>
                                                    ) : (
                                                        <button 
                                                            onClick={() => handleVerify(log.id)}
                                                            className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 px-2 py-0.5 rounded transition-all"
                                                        >
                                                            Ký duyệt
                                                        </button>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <button 
                                                        onClick={() => handleDelete(log.id)}
                                                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors"
                                                        title="Xóa bản ghi"
                                                    >
                                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                        </svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                        {filteredLogs.length === 0 && (
                                            <tr>
                                                <td colSpan="7" className="px-4 py-8 text-center text-slate-500 italic">
                                                    Chưa có dữ liệu ghi nhận nào
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                    </div>
                </div>

                {/* Main Content Grid - BOWIE-DICK */}
                <div className={`${activeTab === 'bowiedick' ? 'grid' : 'hidden'} grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-500`}>
                    
                    {/* Form BD Cột trái */}
                    <div className="lg:col-span-1">
                        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-600/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>

                            <div className="flex justify-between items-center mb-5 relative z-10">
                                <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                    </svg>
                                    Chạy Test Bowie-Dick
                                </h2>
                            </div>

                            <form onSubmit={handleBdSubmit} className="space-y-4 relative z-10">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">NV thực hiện</label>
                                    <input 
                                        type="text" required
                                        value={technician} onChange={(e) => setTechnician(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all text-sm"
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">Máy Tiệt Khuẩn (Autoclave)</label>
                                    <select 
                                        value={bdAutoclave} onChange={(e) => setBdAutoclave(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-all text-sm"
                                    >
                                        <option value="Máy Steam 01 (Cửa trước)">Máy Steam 01 (Cửa trước)</option>
                                        <option value="Máy Steam 02 (Cửa sau)">Máy Steam 02 (Cửa sau)</option>
                                        <option value="Máy Steam 03 (Dự phòng)">Máy Steam 03 (Dự phòng)</option>
                                    </select>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">Mẻ test số</label>
                                    <input 
                                        type="number" required min="1"
                                        value={bdCycle} onChange={(e) => setBdCycle(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-all text-sm"
                                    />
                                </div>

                                <div className="space-y-2 pt-2">
                                    <label className="text-sm font-medium text-slate-400">Kết quả kiểm tra (Tờ test)</label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all ${bdResult === 'Đạt' ? 'bg-emerald-950/50 border-emerald-500 text-emerald-400 shadow-md shadow-emerald-900/20' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                            <input type="radio" name="bdResult" value="Đạt" checked={bdResult === 'Đạt'} onChange={() => setBdResult('Đạt')} className="hidden" />
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                                            <span className="text-sm font-semibold">ĐẠT (Đổi màu đều)</span>
                                        </label>
                                        <label className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border cursor-pointer transition-all ${bdResult === 'Không đạt' ? 'bg-rose-950/50 border-rose-500 text-rose-400 shadow-md shadow-rose-900/20' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}`}>
                                            <input type="radio" name="bdResult" value="Không đạt" checked={bdResult === 'Không đạt'} onChange={() => setBdResult('Không đạt')} className="hidden" />
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                            <span className="text-sm font-semibold">KHÔNG ĐẠT</span>
                                        </label>
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-slate-400">Ghi chú (Bắt buộc nếu lỗi)</label>
                                    <textarea 
                                        placeholder="Ví dụ: Còn bọt khí trung tâm..."
                                        value={bdNote} onChange={(e) => setBdNote(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 text-slate-200 rounded-xl px-4 py-2.5 focus:outline-none focus:border-amber-500 transition-all text-sm h-20 resize-none"
                                    />
                                </div>

                                <button 
                                    type="submit" disabled={!authReady || isSubmitting}
                                    className="w-full mt-4 bg-amber-600 hover:bg-amber-500 text-white font-medium py-3 px-4 rounded-xl shadow-lg shadow-amber-900/30 transition-all active:scale-[0.98] disabled:opacity-50 flex justify-center items-center gap-2"
                                >
                                    {isSubmitting ? 'Đang lưu...' : 'Lưu Kết Quả Bowie-Dick'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Table BD Cột phải */}
                    <div className="lg:col-span-2 flex flex-col gap-6">
                        
                        {/* Thống kê BD */}
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                                <div className="p-3 bg-blue-950/50 text-blue-400 rounded-xl border border-blue-900/50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Tổng số mẻ test</div>
                                    <div className="text-2xl font-bold text-slate-200">{bdLogs.length}</div>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                                <div className="p-3 bg-emerald-950/50 text-emerald-400 rounded-xl border border-emerald-900/50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Mẻ test ĐẠT</div>
                                    <div className="text-2xl font-bold text-emerald-400">{bdLogs.filter(l => l.result === 'Đạt').length}</div>
                                </div>
                            </div>
                            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center gap-4 shadow-lg">
                                <div className="p-3 bg-rose-950/50 text-rose-400 rounded-xl border border-rose-900/50">
                                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <div>
                                    <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">Mẻ test LỖI</div>
                                    <div className="text-2xl font-bold text-rose-400">{bdLogs.filter(l => l.result === 'Không đạt').length}</div>
                                </div>
                            </div>
                        </div>

                        {/* Bảng Nhật ký BD */}
                        <div className="bg-slate-900 rounded-2xl border border-slate-800 shadow-xl overflow-hidden flex flex-col flex-1">
                            <div className="p-4 border-b border-slate-800 flex justify-between items-center flex-wrap gap-2">
                                <h2 className="text-base font-semibold text-white flex items-center gap-2">
                                    <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                                    Sổ Nhật Ký Test Bowie-Dick (Máy Tiệt Khuẩn Steam)
                                </h2>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span>Người duyệt:</span>
                                    <input 
                                        type="text" value={verifierName} onChange={(e) => setVerifierName(e.target.value)}
                                        className="bg-slate-950 border border-slate-700 px-2 py-0.5 rounded text-amber-300 w-24 text-xs focus:outline-none focus:border-amber-500"
                                        title="Nhập tên NV duyệt"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto p-4 pt-0 mt-2">
                                <table className="w-full text-xs text-left">
                                    <thead className="text-[11px] text-slate-400 uppercase bg-slate-950/70 sticky top-0">
                                        <tr>
                                            <th className="px-3 py-2.5 rounded-l-lg">Thời gian</th>
                                            <th className="px-3 py-2.5">Máy Tiệt Khuẩn</th>
                                            <th className="px-3 py-2.5 text-center">Mẻ test</th>
                                            <th className="px-3 py-2.5 text-center">Kết quả</th>
                                            <th className="px-3 py-2.5">Thực hiện</th>
                                            <th className="px-3 py-2.5 text-center">Kiểm tra</th>
                                            <th className="px-3 py-2.5 rounded-r-lg text-right">Xóa</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800/40">
                                        {bdLogs.map(log => (
                                            <tr key={log.id} className={`hover:bg-slate-800/40 transition-colors ${log.result === 'Không đạt' ? 'bg-rose-950/20' : ''}`}>
                                                <td className="px-3 py-2.5">
                                                    <div className="font-semibold text-slate-200">{log.displayTime}</div>
                                                    <div className="text-[10px] text-slate-400">{log.displayDate}</div>
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-amber-300 font-medium">{log.autoclave}</div>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    <span className="inline-block px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-bold border border-slate-700">Mẻ {log.cycle}</span>
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {log.result === 'Đạt' ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded font-bold">✓ ĐẠT</span>
                                                    ) : (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-rose-400 bg-rose-950/40 border border-rose-800 px-2 py-0.5 rounded font-bold">✗ KHÔNG ĐẠT</span>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <div className="text-slate-300 font-medium">{log.recordedBy}</div>
                                                    {log.note && <div className="text-[10px] text-slate-400 italic mt-0.5 w-32 truncate" title={log.note}>{log.note}</div>}
                                                </td>
                                                <td className="px-3 py-2.5 text-center">
                                                    {log.verified ? (
                                                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-950/40 border border-emerald-800 px-2 py-0.5 rounded">✓ {log.verifiedBy}</span>
                                                    ) : (
                                                        <button onClick={() => handleBdVerify(log.id)} className="text-[11px] text-amber-400 hover:text-amber-300 bg-amber-950/40 hover:bg-amber-900/50 border border-amber-800/60 px-2 py-0.5 rounded transition-all">Ký duyệt</button>
                                                    )}
                                                </td>
                                                <td className="px-3 py-2.5 text-right">
                                                    <button onClick={() => handleBdDelete(log.id)} className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-400/10 rounded transition-colors"><svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                                                </td>
                                            </tr>
                                        ))}
                                        {bdLogs.length === 0 && (
                                            <tr><td colSpan="7" className="px-4 py-8 text-center text-slate-500 italic">Chưa có dữ liệu test Bowie-Dick nào</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
