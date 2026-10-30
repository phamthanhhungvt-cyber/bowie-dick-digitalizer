import React, { useState, useEffect } from 'react';
import { 
  Thermometer, FileCheck, Camera, Upload, Download, 
  AlertTriangle, CheckCircle, BarChart3, QrCode, FileSpreadsheet 
} from 'lucide-react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine 
} from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState('nhietam');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 font-sans selection:bg-teal-500/30">
      {/* --- HEADER & TABS --- */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <FileCheck size={28} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CỔNG THÔNG TIN SỐ HÓA CSSD</h1>
              <p className="text-sm text-slate-400">Hệ thống quản lý chất lượng tiệt khuẩn</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0 bg-slate-900 p-1 rounded-lg border border-slate-700">
            <button 
              onClick={() => setActiveTab('nhietam')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all font-medium text-sm ${activeTab === 'nhietam' ? 'bg-teal-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Thermometer size={18} />
              Theo dõi Nhiệt Ẩm
            </button>
            <button 
              onClick={() => setActiveTab('bowiedick')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all font-medium text-sm ${activeTab === 'bowiedick' ? 'bg-emerald-600 text-white shadow-md' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <FileCheck size={18} />
              Bowie-Dick Test
            </button>
          </div>
        </div>
      </div>

      {/* --- MAIN CONTENT --- */}
      <div className="max-w-7xl mx-auto animate-in fade-in duration-500">
        {activeTab === 'nhietam' ? <NhietAmModule /> : <BowieDickModule />}
      </div>
    </div>
  );
}

// ==========================================
// MODULE 1: THEO DÕI NHIỆT ẨM
// ==========================================
function NhietAmModule() {
  const [logs, setLogs] = useState([
    { id: 1, ngayThang: '30/10/2026 08:30', buoi: 'Sáng', viTri: 'Phòng Xét Nghiệm', maThietBi: 'NAK-PXN-01', nhietDo: 24.5, doAm: 55, nhanVien: 'KTV. Hương', trangThai: 'Bình thường', nguoiKiemTra: 'QLKT. Hùng' },
    { id: 2, ngayThang: '30/10/2026 15:45', buoi: 'Chiều', viTri: 'Kho hóa chất', maThietBi: 'NAK-KHC-09', nhietDo: 28.0, doAm: 60, nhanVien: 'KTV. Hương', trangThai: 'Bình thường', nguoiKiemTra: null }
  ]);
  const [filterLocation, setFilterLocation] = useState('Tất cả');
  const [formData, setFormData] = useState({
    viTri: 'Phòng Xét Nghiệm',
    maThietBi: 'NAK-PXN-01',
    nhietDo: '',
    doAm: '',
    nhanVien: 'KTV. Hương'
  });
  const [isScanning, setIsScanning] = useState(false);

  // Cảnh báo động
  const checkWarning = (viTri, nhietDo, doAm) => {
    const nd = parseFloat(nhietDo);
    const da = parseFloat(doAm);
    if (isNaN(nd) || isNaN(da)) return false;
    
    let isNhietDoBad = false;
    if (viTri === 'Phòng Xét Nghiệm' && (nd < 21 || nd > 26)) isNhietDoBad = true;
    if (viTri === 'Kho hóa chất' && nd >= 30) isNhietDoBad = true;
    let isDoAmBad = da >= 70;

    return isNhietDoBad || isDoAmBad;
  };
  const isWarning = checkWarning(formData.viTri, formData.nhietDo, formData.doAm);
  const currentHour = new Date().getHours();
  const buoi = currentHour < 12 ? 'Sáng (8h-9h)' : 'Chiều (15h-16h)';

  const handleSave = () => {
    if (!formData.nhietDo || !formData.doAm || !formData.nhanVien) return alert('Nhập đủ thông tin!');
    const newLog = {
      id: Date.now(),
      ngayThang: new Date().toLocaleString('vi-VN'),
      buoi: currentHour < 12 ? 'Sáng' : 'Chiều',
      viTri: formData.viTri,
      maThietBi: formData.maThietBi,
      nhietDo: parseFloat(formData.nhietDo),
      doAm: parseFloat(formData.doAm),
      nhanVien: formData.nhanVien,
      trangThai: isWarning ? 'Bất thường' : 'Bình thường',
      nguoiKiemTra: null
    };
    setLogs([newLog, ...logs]);
    setFormData({ ...formData, nhietDo: '', doAm: '' });
  };

  const handleApprove = (id) => {
    setLogs(logs.map(log => log.id === id ? { ...log, nguoiKiemTra: 'Đã duyệt' } : log));
  };

  const handleScanQR = () => {
    setIsScanning(true);
    setTimeout(() => {
      setFormData({ ...formData, viTri: 'Kho hóa chất', maThietBi: 'NAK-KHC-09' });
      setIsScanning(false);
    }, 1000);
  };

  const filteredLogs = filterLocation === 'Tất cả' ? logs : logs.filter(l => l.viTri === filterLocation);
  const chartData = [...filteredLogs].reverse(); 

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Form Nhập Liệu */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          {isWarning && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-lg font-semibold text-teal-400 flex items-center gap-2">
              <Thermometer size={20} /> Ghi nhận số liệu
            </h2>
            <button onClick={handleScanQR} className="bg-slate-700 hover:bg-slate-600 text-teal-400 p-2 rounded-lg transition-colors" title="Quét QR">
              <QrCode size={18} />
            </button>
          </div>

          {isScanning && (
            <div className="h-24 border-2 border-teal-500 border-dashed rounded-lg flex flex-col items-center justify-center text-teal-400 animate-pulse bg-teal-900/20 mb-4">
              <span>Đang định vị mã QR...</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Vị trí / Khu vực</label>
              <select value={formData.viTri} onChange={(e) => setFormData({...formData, viTri: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white outline-none focus:border-teal-500 text-sm">
                <option value="Phòng Xét Nghiệm">Phòng Xét Nghiệm (21-26°C)</option>
                <option value="Kho hóa chất">Kho hóa chất (&lt;30°C)</option>
              </select>
            </div>
            
            <div className="space-y-1">
              <label className="text-sm text-slate-400">Mã thiết bị</label>
              <input type="text" value={formData.maThietBi} onChange={(e) => setFormData({...formData, maThietBi: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Nhiệt độ (°C)</label>
                <input type="number" step="0.1" value={formData.nhietDo} onChange={(e) => setFormData({...formData, nhietDo: e.target.value})} className={`w-full bg-slate-900 border rounded-lg p-2.5 font-bold outline-none text-sm ${isWarning && formData.nhietDo ? 'border-red-500 text-red-400' : 'border-slate-700 text-white focus:border-teal-500'}`} placeholder="24.5" />
              </div>
              <div className="space-y-1">
                <label className="text-sm text-slate-400">Độ ẩm (%)</label>
                <input type="number" step="0.1" value={formData.doAm} onChange={(e) => setFormData({...formData, doAm: e.target.value})} className={`w-full bg-slate-900 border rounded-lg p-2.5 font-bold outline-none text-sm ${isWarning && formData.doAm ? 'border-red-500 text-red-400' : 'border-slate-700 text-white focus:border-teal-500'}`} placeholder="60" />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm text-slate-400">NV Thực hiện</label>
              <input type="text" value={formData.nhanVien} onChange={(e) => setFormData({...formData, nhanVien: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-white text-sm" />
            </div>
            
            {isWarning && (
              <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-3 rounded-lg flex items-start gap-2 text-xs">
                <AlertTriangle className="shrink-0 mt-0.5" size={16} />
                <div>Cảnh báo vượt ngưỡng! Báo ngay NVAT/QLKT.</div>
              </div>
            )}

            <button onClick={handleSave} className={`w-full py-3 rounded-lg font-bold text-white transition-colors flex justify-center items-center gap-2 ${isWarning ? 'bg-red-600 hover:bg-red-500' : 'bg-teal-600 hover:bg-teal-500'}`}>
              <CheckCircle size={18} /> Lưu kết quả
            </button>
          </div>
        </div>
      </div>

      {/* Hiển thị dữ liệu */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Biểu đồ */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <BarChart3 className="text-teal-400" size={20}/> Biểu đồ xu hướng
            </h2>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-300 outline-none focus:border-teal-500">
              <option value="Tất cả">Tất cả vị trí</option>
              <option value="Phòng Xét Nghiệm">Phòng Xét Nghiệm</option>
              <option value="Kho hóa chất">Kho hóa chất</option>
            </select>
          </div>
          <div className="h-64 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="ngayThang" stroke="#94a3b8" fontSize={11} tickFormatter={(val) => val.split(' ')[1]} />
                  <YAxis yAxisId="left" stroke="#2dd4bf" fontSize={11} domain={[15, 35]} />
                  <YAxis yAxisId="right" orientation="right" stroke="#818cf8" fontSize={11} domain={[40, 90]} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '12px' }}/>
                  
                  {filterLocation === 'Phòng Xét Nghiệm' && (
                    <><ReferenceLine y={26} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" /><ReferenceLine y={21} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" /></>
                  )}
                  {filterLocation === 'Kho hóa chất' && <ReferenceLine y={30} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" />}
                  <ReferenceLine y={70} yAxisId="right" stroke="#ef4444" strokeDasharray="3 3" />

                  <Line yAxisId="left" type="monotone" dataKey="nhietDo" name="Nhiệt độ (°C)" stroke="#2dd4bf" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line yAxisId="right" type="monotone" dataKey="doAm" name="Độ ẩm (%)" stroke="#818cf8" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">Chưa có dữ liệu</div>
            )}
          </div>
        </div>

        {/* Bảng */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-lg font-semibold text-white">Sổ nhật ký</h2>
             <button className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-slate-300 px-3 py-1.5 rounded-lg text-xs transition-colors border border-slate-600">
               <FileSpreadsheet size={14} /> Xuất Excel
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-slate-400 uppercase bg-slate-900 border-b border-slate-700">
                <tr>
                  <th className="px-3 py-3 rounded-tl-lg">Thời gian</th>
                  <th className="px-3 py-3">Vị trí</th>
                  <th className="px-3 py-3">Nhiệt độ</th>
                  <th className="px-3 py-3">Độ ẩm</th>
                  <th className="px-3 py-3">Trạng thái</th>
                  <th className="px-3 py-3 rounded-tr-lg text-center">Ký duyệt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-700/30">
                    <td className="px-3 py-3">
                      <div className="font-medium text-white">{log.ngayThang.split(' ')[1]}</div>
                      <div className="text-[10px] text-slate-400">{log.ngayThang.split(' ')[0]}</div>
                    </td>
                    <td className="px-3 py-3 text-slate-300">{log.viTri}</td>
                    <td className="px-3 py-3 font-bold text-teal-400">{log.nhietDo}°C</td>
                    <td className="px-3 py-3 font-bold text-indigo-400">{log.doAm}%</td>
                    <td className="px-3 py-3">
                      <span className={`py-1 px-2 rounded-md text-[10px] font-semibold ${log.trangThai === 'Bình thường' ? 'bg-teal-500/20 text-teal-400' : 'bg-red-500/20 text-red-400'}`}>
                        {log.trangThai}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-center">
                      {log.nguoiKiemTra ? (
                        <span className="text-emerald-400 text-xs flex items-center justify-center gap-1"><CheckCircle size={12} /> Đã duyệt</span>
                      ) : (
                        <button onClick={() => handleApprove(log.id)} className="bg-amber-600/20 text-amber-400 border border-amber-600/50 hover:bg-amber-600/40 text-[10px] py-1 px-3 rounded transition-colors">
                          Duyệt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// MODULE 2: BOWIE-DICK DIGITALIZER
// ==========================================
function BowieDickModule() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      
      {/* --- BÊN TRÁI: FORM NHẬP --- */}
      <div className="lg:col-span-4 space-y-6">
        {/* Box Tải ảnh */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4 text-sm uppercase">
            <Camera size={16} /> 1. Chụp / Tải ảnh tổ hợp test
          </h3>
          <div className="border-2 border-dashed border-slate-600 rounded-lg h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-900/50 mb-4 hover:border-emerald-500/50 transition-colors cursor-pointer">
            <Upload size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Chưa có ảnh chụp mẻ test</p>
            <p className="text-xs opacity-70 mt-1">Chụp theo khung 4 phần: Tờ test, Nhãn LOT...</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-md">
              <Camera size={16} /> Mở Camera
            </button>
            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2.5 rounded-lg text-sm font-medium flex items-center justify-center gap-2 shadow-md">
              <Upload size={16} /> Chọn từ thiết bị
            </button>
          </div>
        </div>

        {/* Box Form thông tin */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4 text-sm uppercase">
            <FileCheck size={16} /> 2. Thông tin hồ sơ kiểm định
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Bệnh viện / Cơ sở CSSD</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập tên bệnh viện..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Khoa / Bộ phận</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập khoa/bộ phận..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Mã / Số Máy Hấp</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập số/mã máy..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Số Mẻ Hấp (Cycle No.)</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập số mẻ..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Ngày thực hiện test</label>
              <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-400 focus:border-emerald-500 outline-none" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Giờ chạy chu trình</label>
              <input type="time" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-400 focus:border-emerald-500 outline-none" />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Số Lô (LOT No.)</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập mã lô..." />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-xs text-slate-400 mb-1">Hạn Dùng Test Pack (EXP)</label>
              <input type="date" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-sm text-slate-400 focus:border-emerald-500 outline-none" />
            </div>
          </div>
        </div>
      </div>

      {/* --- BÊN PHẢI: PREVIEW A4 --- */}
      <div className="lg:col-span-8 bg-slate-800 p-5 rounded-xl border border-slate-700 shadow-lg flex flex-col items-center">
        <div className="w-full flex justify-between items-center mb-4">
          <span className="text-sm text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Xem trước trang in Khổ Chuẩn A4 (210mm x 297mm)
          </span>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-lg text-sm font-medium flex items-center gap-2 shadow-md">
            <Download size={16} /> Xuất PDF Báo Cáo
          </button>
        </div>
        
        {/* Bản Preview A4 */}
        <div className="bg-white text-slate-800 rounded-md shadow-2xl p-10 w-full max-w-[210mm] min-h-[297mm] relative scale-[0.85] sm:scale-100 transform origin-top border border-slate-300">
          
          {/* Header A4 */}
          <div className="flex justify-between items-start mb-8 border-b-2 border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-emerald-700 text-white rounded-lg flex items-center justify-center font-bold text-xl">
                CSSD
              </div>
              <div>
                <div className="border-b border-dotted border-slate-400 w-48 mb-1"></div>
                <div className="text-xs text-slate-500">Khoa / Bộ phận Tiệt Trùng</div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">MÃ BIỂU MẪU: BM-CSSD-BD01</p>
              <p className="text-xs text-slate-500 mb-1">Tiêu chuẩn: ISO 11140-5:2014 Type 2</p>
              <p className="text-xs text-slate-500">Lập phiếu: 30/10/2026 14:14</p>
            </div>
          </div>
          
          {/* Title A4 */}
          <h2 className="text-xl font-extrabold text-center mb-1 uppercase tracking-wide">Phiếu Kiểm Tra Chất Lượng Lò Tiệt Khuẩn Hơi Nước</h2>
          <p className="text-sm text-center mb-8 font-medium text-slate-600">(BOWIE-DICK TEST REPORT)</p>
          
          {/* Table A4 */}
          <table className="w-full text-sm border-collapse border border-slate-300 mb-8 shadow-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="border border-slate-300 p-3 text-left font-semibold w-1/4">Thiết bị hấp</th>
                <th className="border border-slate-300 p-3 text-left font-semibold w-1/4">Số mẻ (Cycle)</th>
                <th className="border border-slate-300 p-3 text-left font-semibold w-1/4">Ngày - Giờ test</th>
                <th className="border border-slate-300 p-3 text-left font-semibold w-1/4">Loại gói thử</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-slate-300 p-3 text-slate-500">---</td>
                <td className="border border-slate-300 p-3 text-slate-500">---</td>
                <td className="border border-slate-300 p-3 text-slate-500">---</td>
                <td className="border border-slate-300 p-3 font-medium">3M™ Comply™ 1233LF</td>
              </tr>
              <tr className="bg-slate-50">
                <td className="border border-slate-300 p-3 font-semibold">Số Lô (LOT)</td>
                <td className="border border-slate-300 p-3 font-semibold">Hạn dùng (EXP)</td>
                <td className="border border-slate-300 p-3 font-semibold">Chương trình</td>
                <td className="border border-slate-300 p-3 font-semibold text-emerald-700">Kết quả đánh giá</td>
              </tr>
              <tr>
                <td className="border border-slate-300 p-3 text-slate-500">---</td>
                <td className="border border-slate-300 p-3 text-slate-500">---</td>
                <td className="border border-slate-300 p-3 text-xs">5: Bowie-Dick 134°C</td>
                <td className="border border-slate-300 p-3">
                  <span className="border border-emerald-500 text-emerald-600 bg-emerald-50 px-2 py-1 rounded text-xs font-bold">✓ ĐẠT (PASS)</span>
                </td>
              </tr>
            </tbody>
          </table>
          
          {/* Image Placeholder A4 */}
          <div className="border rounded-lg border-slate-300 overflow-hidden relative h-72">
             <div className="bg-slate-100 p-2 border-b border-slate-300 text-xs font-semibold text-slate-600 flex justify-between">
               <span>ẢNH CHỤP MINH CHỨNG THỰC TẾ (BOWIE-DICK SHEET + BILL + LOT)</span>
               <span className="text-slate-400 font-normal">Ảnh gốc không qua chỉnh sửa</span>
             </div>
             <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-400 text-sm">
                Hình ảnh kiểm định sẽ xuất hiện tại đây
             </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
