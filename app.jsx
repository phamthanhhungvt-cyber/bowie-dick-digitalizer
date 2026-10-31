import React, { useState, useEffect } from 'https://esm.sh/react@18';
import { createRoot } from 'https://esm.sh/react-dom@18/client';
import { Thermometer, FileCheck, Camera, Upload, Download, AlertTriangle, CheckCircle, BarChart3, QrCode, FileSpreadsheet } from 'https://esm.sh/lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'https://esm.sh/recharts';

function App() {
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
              <Thermometer size={18} />
              Theo dõi Nhiệt Ẩm
            </button>
            <button 
              onClick={() => setActiveTab('bowiedick')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${activeTab === 'bowiedick' ? 'bg-emerald-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <FileCheck size={18} />
              Bowie-Dick Test
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
  const [isScanning, setIsScanning] = useState(false);

  const currentHour = new Date().getHours();
  const buoi = currentHour < 12 ? 'Sáng (8h-9h)' : 'Chiều (15h-16h)';

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
    if (!formData.nhietDo || !formData.doAm || !formData.nhanVien) {
      alert('Vui lòng nhập đầy đủ nhiệt độ, độ ẩm và tên nhân viên!');
      return;
    }
    const newLog = {
      id: Date.now(),
      ngayThang: new Date().toLocaleString('vi-VN'),
      buoi: buoi,
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
    const approverName = prompt("Nhập tên người kiểm tra (QLKT/NVAT):", "QLKT.");
    if (approverName) {
      setLogs(logs.map(log => log.id === id ? { ...log, nguoiKiemTra: approverName } : log));
    }
  };

  const handleScanQR = () => {
    setIsScanning(true);
    setTimeout(() => {
      setFormData({
        ...formData,
        viTri: 'Kho hóa chất',
        maThietBi: 'NAK-KHC-09'
      });
      setIsScanning(false);
      alert('Đã quét thành công! Vị trí: Kho hóa chất');
    }, 1500);
  };

  const exportExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,\uFEFF";
    csvContent += "Ngày,Buổi,Vị trí,Mã thiết bị,Nhiệt độ (°C),Độ ẩm (%),Nhân viên đo,Trạng thái,Người kiểm tra\n";
    const exportData = filterLocation === 'Tất cả' ? logs : logs.filter(l => l.viTri === filterLocation);
    exportData.forEach(row => {
      csvContent += `${row.ngayThang},${row.buoi},${row.viTri},${row.maThietBi},${row.nhietDo},${row.doAm},${row.nhanVien},${row.trangThai},${row.nguoiKiemTra || 'Chưa duyệt'}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `NhatKy_NhietAm_${filterLocation}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = filterLocation === 'Tất cả' ? logs : logs.filter(l => l.viTri === filterLocation);
  const chartData = [...filteredLogs].reverse(); 
  const totalLogs = filteredLogs.length;
  const warningCount = filteredLogs.filter(l => l.trangThai === 'Bất thường').length;
  const pendingApprove = filteredLogs.filter(l => !l.nguoiKiemTra).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
          {isWarning && <div className="absolute top-0 left-0 w-full h-1 bg-red-500 animate-pulse"></div>}
          <h2 className="text-xl font-semibold mb-4 text-teal-400 flex items-center gap-2">
            <Thermometer /> Ghi nhận số liệu
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-slate-400 mb-1">Ca ghi nhận tự động</label>
              <input type="text" value={buoi} disabled className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-300" />
            </div>
            <div className="flex gap-2">
               <div className="flex-1">
                 <label className="block text-sm text-slate-400 mb-1">Vị trí / Khu vực</label>
                 <select 
                   value={formData.viTri}
                   onChange={(e) => setFormData({...formData, viTri: e.target.value})}
                   className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-teal-500 outline-none"
                 >
                   <option value="Phòng Xét Nghiệm">Phòng Xét Nghiệm</option>
                   <option value="Kho hóa chất">Kho hóa chất</option>
                 </select>
               </div>
               <button onClick={handleScanQR} className="mt-6 bg-slate-700 hover:bg-slate-600 p-2 rounded-lg text-teal-400 flex items-center justify-center transition-colors">
                 <QrCode size={20} />
               </button>
            </div>
            {isScanning && (
              <div className="h-32 border-2 border-teal-500 border-dashed rounded-lg flex flex-col items-center justify-center text-teal-400 animate-pulse bg-teal-900/20">
                <Camera size={32} className="mb-2" />
                <span>Đang quét mã QR...</span>
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Mã thiết bị</label>
              <input 
                type="text" 
                value={formData.maThietBi}
                onChange={(e) => setFormData({...formData, maThietBi: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white" 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-1">Nhiệt độ (°C)</label>
                <input 
                  type="number" step="0.1"
                  value={formData.nhietDo}
                  onChange={(e) => setFormData({...formData, nhietDo: e.target.value})}
                  className={`w-full bg-slate-900 border rounded-lg p-3 text-lg font-bold outline-none ${isWarning && formData.nhietDo ? 'border-red-500 text-red-400' : 'border-slate-700 text-white focus:border-teal-500'}`} 
                  placeholder="24.5" 
                />
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-1">Độ ẩm (%)</label>
                <input 
                  type="number" step="0.1"
                  value={formData.doAm}
                  onChange={(e) => setFormData({...formData, doAm: e.target.value})}
                  className={`w-full bg-slate-900 border rounded-lg p-3 text-lg font-bold outline-none ${isWarning && formData.doAm ? 'border-red-500 text-red-400' : 'border-slate-700 text-white focus:border-teal-500'}`} 
                  placeholder="60" 
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">NV Thực hiện</label>
              <input 
                type="text" 
                value={formData.nhanVien}
                onChange={(e) => setFormData({...formData, nhanVien: e.target.value})}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-white focus:border-teal-500 outline-none" 
              />
            </div>
            {isWarning && (
              <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-lg flex items-start gap-3">
                <AlertTriangle className="shrink-0 mt-0.5" size={18} />
                <div className="text-sm"><strong>Cảnh báo vượt ngưỡng!</strong> Báo ngay với NVAT/QLKT và khắc phục.</div>
              </div>
            )}
            <button 
              onClick={handleSave}
              className={`w-full py-3 rounded-lg font-bold text-white transition-colors flex justify-center items-center gap-2 ${isWarning ? 'bg-red-600 hover:bg-red-500' : 'bg-teal-600 hover:bg-teal-500'}`}
            >
              <CheckCircle size={20} /> Lưu kết quả đo
            </button>
          </div>
        </div>
      </div>
      <div className="lg:col-span-2 space-y-6">
        <div className="grid grid-cols-3 gap-4">
           <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
             <div className="text-slate-400 text-sm mb-1">Tổng lượt đo</div>
             <div className="text-2xl font-bold text-white">{totalLogs}</div>
           </div>
           <div className="bg-slate-800 p-4 rounded-xl border border-red-900/50">
             <div className="text-red-400 text-sm mb-1">Vượt ngưỡng</div>
             <div className="text-2xl font-bold text-red-500">{warningCount}</div>
           </div>
           <div className="bg-slate-800 p-4 rounded-xl border border-amber-900/50">
             <div className="text-amber-400 text-sm mb-1">Chờ ký duyệt</div>
             <div className="text-2xl font-bold text-amber-500">{pendingApprove}</div>
           </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-white flex items-center gap-2"><BarChart3 className="text-teal-400" /> Biểu đồ xu hướng</h2>
            <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)} className="bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-slate-300 outline-none focus:border-teal-500">
              <option value="Tất cả">Tất cả vị trí</option>
              <option value="Phòng Xét Nghiệm">Phòng Xét Nghiệm</option>
              <option value="Kho hóa chất">Kho hóa chất</option>
            </select>
          </div>
          <div className="h-72 w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                  <XAxis dataKey="ngayThang" stroke="#94a3b8" fontSize={12} tickFormatter={(val) => val.split(' ')[1]} />
                  <YAxis yAxisId="left" stroke="#2dd4bf" fontSize={12} domain={['dataMin - 2', 'dataMax + 2']} />
                  <YAxis yAxisId="right" orientation="right" stroke="#818cf8" fontSize={12} domain={['dataMin - 5', 'dataMax + 5']} />
                  <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', color: '#f8fafc', borderRadius: '8px' }} />
                  <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '10px' }}/>
                  {filterLocation === 'Phòng Xét Nghiệm' && (
                    <>
                      <ReferenceLine y={26} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" />
                      <ReferenceLine y={21} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" />
                    </>
                  )}
                  {filterLocation === 'Kho hóa chất' && (
                    <ReferenceLine y={30} yAxisId="left" stroke="#ef4444" strokeDasharray="3 3" />
                  )}
                  <ReferenceLine y={70} yAxisId="right" stroke="#ef4444" strokeDasharray="3 3" />
                  <Line yAxisId="left" type="monotone" dataKey="nhietDo" name="Nhiệt độ (°C)" stroke="#2dd4bf" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line yAxisId="right" type="monotone" dataKey="doAm" name="Độ ẩm (%)" stroke="#818cf8" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : <div className="h-full flex items-center justify-center text-slate-500">Chưa có dữ liệu biểu đồ</div>}
          </div>
        </div>
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg overflow-hidden">
          <div className="flex justify-between items-center mb-4">
             <h2 className="text-xl font-semibold text-white">Sổ nhật ký</h2>
             <button onClick={exportExcel} className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/40 px-3 py-1.5 rounded-lg text-sm transition-colors">
               <FileSpreadsheet size={16} /> Xuất Excel
             </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-400 uppercase bg-slate-900 border-b border-slate-700">
                <tr><th className="px-4 py-3">Thời gian</th><th className="px-4 py-3">Vị trí</th><th className="px-4 py-3">Nhiệt độ</th><th className="px-4 py-3">Độ ẩm</th><th className="px-4 py-3">Trạng thái</th><th className="px-4 py-3">Ký duyệt</th></tr>
              </thead>
              <tbody>
                {filteredLogs.length === 0 ? <tr><td colSpan="6" className="px-4 py-8 text-center text-slate-500">Chưa có bản ghi nào.</td></tr> : 
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="border-b border-slate-700 hover:bg-slate-700/50">
                      <td className="px-4 py-3"><div className="font-medium text-white">{log.ngayThang.split(' ')[1]}</div><div className="text-xs text-slate-400">{log.ngayThang.split(' ')[0]}</div></td>
                      <td className="px-4 py-3 text-slate-300">{log.viTri}</td>
                      <td className="px-4 py-3 font-bold text-teal-400">{log.nhietDo}°C</td>
                      <td className="px-4 py-3 font-bold text-indigo-400">{log.doAm}%</td>
                      <td className="px-4 py-3">{log.trangThai === 'Bình thường' ? <span className="bg-teal-500/20 text-teal-400 py-1 px-2 rounded text-xs">Bình thường</span> : <span className="bg-red-500/20 text-red-400 py-1 px-2 rounded text-xs">Bất thường</span>}</td>
                      <td className="px-4 py-3">
                        {log.nguoiKiemTra ? <span className="text-emerald-400 text-xs flex items-center gap-1"><CheckCircle size={12} /> {log.nguoiKiemTra}</span> : 
                          <button onClick={() => handleApprove(log.id)} className="bg-slate-600 hover:bg-slate-500 text-white text-xs py-1 px-3 rounded transition-colors">Duyệt</button>}
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

function BowieDickModule() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4"><Camera size={18} /> 1. CHỤP / TẢI ẢNH TỔ HỢP TEST</h3>
          <div className="border-2 border-dashed border-slate-600 rounded-lg h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-900/50 mb-4">
            <Upload size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Chưa có ảnh chụp mẻ test</p>
            <p className="text-xs opacity-70 mt-1">Chụp theo khung 4 phần: Tờ test, Nhãn LOT...</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><Camera size={16} /> Mở Camera</button>
            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2"><Upload size={16} /> Tải file lên</button>
          </div>
        </div>
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4"><FileCheck size={18} /> 2. THÔNG TIN HỒ SƠ KIỂM ĐỊNH</h3>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs text-slate-400 mb-1">Bệnh viện / Cơ sở</label><input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập tên..." /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Khoa / Bộ phận</label><input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="CSSD..." /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Mã / Số Máy Hấp</label><input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập số..." /></div>
            <div><label className="block text-xs text-slate-400 mb-1">Số Mẻ Hấp</label><input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập mẻ..." /></div>
          </div>
        </div>
      </div>
      <div className="lg:col-span-8 bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-400">Xem trước trang in Khổ Chuẩn A4</span>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"><Download size={16} /> Xuất PDF</button>
        </div>
        <div className="bg-white text-black flex-1 rounded shadow-lg p-8 mx-auto w-full max-w-[210mm] min-h-[297mm]">
          <div className="text-right text-xs mb-6"><p>MÃ BIỂU MẪU: BM-CSSD-BD01</p><p>Tiêu chuẩn: ISO 11140-5:2014 Type 2</p></div>
          <h2 className="text-xl font-bold text-center mb-8 uppercase">Phiếu Kiểm Tra Chất Lượng Lò Tiệt Khuẩn Hơi Nước<br/><span className="text-sm font-normal">(Bowie-Dick Test Report)</span></h2>
          <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
            <thead><tr className="bg-gray-100"><th className="border border-gray-300 p-2 text-left">Thiết bị hấp</th><th className="border border-gray-300 p-2 text-left">Số mẻ (Cycle)</th><th className="border border-gray-300 p-2 text-left">Ngày - Giờ</th><th className="border border-gray-300 p-2 text-left">Kết quả</th></tr></thead>
            <tbody><tr><td className="border border-gray-300 p-2">---</td><td className="border border-gray-300 p-2">---</td><td className="border border-gray-300 p-2">---</td><td className="border border-gray-300 p-2 font-bold text-emerald-600">ĐẠT (PASS)</td></tr></tbody>
          </table>
          <div className="border border-gray-300 p-4 h-64 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">Hình ảnh minh chứng thực tế sẽ xuất hiện tại đây</div>
        </div>
      </div>
    </div>
  );
}

const root = createRoot(document.getElementById('root'));
root.render(<App />);
