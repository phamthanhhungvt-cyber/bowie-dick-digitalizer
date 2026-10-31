import React, { useState } from 'react';
import { Thermometer, FileCheck, Camera, Upload, Download, AlertTriangle, CheckCircle, BarChart3, QrCode, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function App() {
  const [activeTab, setActiveTab] = useState('nhietam');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 font-sans">
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center bg-slate-800 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 text-teal-400 rounded-lg">
              <FileCheck size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">CỔNG THÔNG TIN SỐ HÓA CSSD</h1>
              <p className="text-sm text-slate-400">Quản lý chất lượng tiệt khuẩn tập trung</p>
            </div>
          </div>
          
          <div className="flex gap-2 mt-4 md:mt-0 bg-slate-900 p-1 rounded-lg">
            <button 
              onClick={() => setActiveTab('nhietam')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'nhietam' ? 'bg-teal-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Thermometer size={18} /> Theo dõi Nhiệt Ẩm
            </button>
            <button 
              onClick={() => setActiveTab('bowiedick')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'bowiedick' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <FileCheck size={18} /> Bowie-Dick Test
            </button>
          </div>
        </div>
      </div>
      <div className="max-w-7xl mx-auto">
        {activeTab === 'nhietam' ? <NhietAmModule /> : <BowieDickModule />}
      </div>
    </div>
  );
}

function NhietAmModule() {
  const [logs, setLogs] = useState([]);
  const [filterLocation, setFilterLocation] = useState('Tất cả');
  const [formData, setFormData] = useState({
    viTri: 'Phòng Xét Nghiệm',
    maThietBi: 'NAK-PXN-01',
    nhietDo: '',
    doAm: '',
    nhanVien: 'CN. Hương'
  });

  const buoi = new Date().getHours() < 12 ? 'Sáng (8h-9h)' : 'Chiều (15h-16h)';

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

  const handleSave = () => {
    if (!formData.nhietDo || !formData.doAm) return;
    const newLog = {
      id: Date.now(),
      ngayThang: new Date().toLocaleString('vi-VN'),
      buoi, viTri: formData.viTri, maThietBi: formData.maThietBi,
      nhietDo: parseFloat(formData.nhietDo), doAm: parseFloat(formData.doAm),
      nhanVien: formData.nhanVien,
      trangThai: isWarning ? 'Bất thường' : 'Bình thường'
    };
    setLogs([newLog, ...logs]);
    setFormData({ ...formData, nhietDo: '', doAm: '' });
  };

  const filteredLogs = filterLocation === 'Tất cả' ? logs : logs.filter(l => l.viTri === filterLocation);
  const chartData = [...filteredLogs].reverse();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 relative overflow-hidden">
          {isWarning && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}
          <h2 className="text-xl font-semibold mb-4 text-teal-400 flex items-center gap-2">
            <Thermometer /> Ghi nhận số liệu
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Vị trí</label>
              <select value={formData.viTri} onChange={(e) => setFormData({...formData, viTri: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white">
                <option value="Phòng Xét Nghiệm">Phòng Xét Nghiệm</option>
                <option value="Kho hóa chất">Kho hóa chất</option>
              </select>
            </div>
            <div>
               <label className="block text-sm text-slate-400 mb-1">Mã thiết bị</label>
               <input type="text" value={formData.maThietBi} onChange={(e) => setFormData({...formData, maThietBi: e.target.value})} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nhiệt độ (°C)</label>
                <input type="number" step="0.1" value={formData.nhietDo} onChange={(e) => setFormData({...formData, nhietDo: e.target.value})} className={`w-full bg-slate-900 border rounded-lg p-3 font-bold ${isWarning && formData.nhietDo ? 'border-red-500 text-red-400' : 'border-slate-700 text-white'}`} placeholder="VD: 24.5" />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Độ ẩm (%)</label>
                <input type="number" step="0.1" value={formData.doAm} onChange={(e) => setFormData({...formData, doAm: e.target.value})} className={`w-full bg-slate-900 border rounded-lg p-3 font-bold ${isWarning && formData.doAm ? 'border-red-500 text-red-400' : 'border-slate-700 text-white'}`} placeholder="VD: 60" />
              </div>
            </div>
            <button onClick={handleSave} className={`w-full py-3 rounded-lg font-bold text-white flex justify-center items-center gap-2 ${isWarning ? 'bg-red-600' : 'bg-teal-600'}`}>
              Lưu kết quả đo
            </button>
          </div>
        </div>
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h2 className="text-xl font-semibold text-white mb-6">Biểu đồ xu hướng</h2>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="ngayThang" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.split(' ')[1]} />
                  <YAxis yAxisId="left" stroke="#2dd4bf" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#818cf8" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="nhietDo" name="Nhiệt độ (°C)" stroke="#2dd4bf" strokeWidth={3} />
                  <Line yAxisId="right" type="monotone" dataKey="doAm" name="Độ ẩm (%)" stroke="#818cf8" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500">Chưa có dữ liệu</div>
            )}
          </div>
        </div>
        
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
           <h2 className="text-xl font-semibold text-white mb-4">Nhật ký đo lường</h2>
           <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-700">
                <tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Vị trí</th><th className="px-4 py-3">Nhiệt độ</th><th className="px-4 py-3">Độ ẩm</th><th className="px-4 py-3">Trạng thái</th></tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-slate-700">
                    <td className="px-4 py-3">{log.ngayThang}</td><td className="px-4 py-3">{log.viTri}</td><td className="px-4 py-3 text-teal-400">{log.nhietDo}°C</td><td className="px-4 py-3 text-indigo-400">{log.doAm}%</td>
                    <td className="px-4 py-3">{log.trangThai}</td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      </div>
    </div>
  );
}

function BowieDickModule() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4"><Camera size={18} /> 1. TẢI ẢNH TỔ HỢP TEST</h3>
          <div className="border-2 border-dashed border-slate-600 rounded-lg h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-900/50 mb-4">
            <Upload size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Chưa có ảnh chụp mẻ test</p>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4"><FileCheck size={18} /> 2. THÔNG TIN HỒ SƠ</h3>
          <div className="grid grid-cols-2 gap-4">
            <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" placeholder="Bệnh viện..." />
            <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" placeholder="Khoa..." />
            <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" placeholder="Mã máy..." />
            <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white" placeholder="Số mẻ..." />
          </div>
        </div>
      </div>
      <div className="lg:col-span-8 bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-400">Xem trước trang in Khổ Chuẩn A4</span>
          <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2"><Download size={16} /> Xuất PDF</button>
        </div>
        <div className="bg-white text-black flex-1 rounded shadow-lg p-8 mx-auto w-full max-w-[210mm] min-h-[297mm]">
          <h2 className="text-xl font-bold text-center mb-8 uppercase">Phiếu Kiểm Tra Lò Tiệt Khuẩn<br/><span className="text-sm font-normal">(Bowie-Dick Test Report)</span></h2>
          <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Thiết bị hấp</th><th className="border border-gray-300 p-2 text-left">Số mẻ</th><th className="border border-gray-300 p-2 text-left">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="border border-gray-300 p-2">---</td><td className="border border-gray-300 p-2">---</td><td className="border border-gray-300 p-2 font-bold text-emerald-600">ĐẠT (PASS)</td></tr>
            </tbody>
          </table>
          <div className="border border-gray-300 p-4 h-64 bg-gray-50 flex items-center justify-center text-gray-400">Ảnh minh chứng</div>
        </div>
      </div>
    </div>
  );
}
