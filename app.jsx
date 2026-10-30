import React, { useState } from 'react';
import { Thermometer, FileCheck, Camera, Upload, Download } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('bowiedick');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 font-sans">
      {/* Header & Navigation */}
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

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto">
        {activeTab === 'nhietam' ? <NhietAmModule /> : <BowieDickModule />}
      </div>
    </div>
  );
}

// ==========================================
// MODULE 1: THEO DÕI NHIỆT ẨM (GIẢN LƯỢC)
// ==========================================
function NhietAmModule() {
  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
      <h2 className="text-lg font-bold text-teal-400 mb-4">Biểu mẫu QTQL.35.02 - Theo dõi nhiệt độ độ ẩm</h2>
      <p className="text-slate-400">Giao diện theo dõi nhiệt độ, độ ẩm sẽ được tích hợp đầy đủ tại đây.</p>
      {/* Đưa toàn bộ code form Nhiệt Ẩm cũ vào khu vực này */}
    </div>
  );
}

// ==========================================
// MODULE 2: BOWIE-DICK DIGITALIZER
// ==========================================
function BowieDickModule() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Cột trái: Form nhập liệu */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Khung tải ảnh */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4">
            <Camera size={18} />
            1. CHỤP / TẢI ẢNH TỔ HỢP TEST
          </h3>
          <div className="border-2 border-dashed border-slate-600 rounded-lg h-48 flex flex-col items-center justify-center text-slate-400 bg-slate-900/50 mb-4">
            <Upload size={32} className="mb-2 opacity-50" />
            <p className="text-sm font-medium">Chưa có ảnh chụp mẻ test</p>
            <p className="text-xs opacity-70 mt-1">Chụp theo khung 4 phần: Tờ test, Nhãn LOT...</p>
          </div>
          <div className="flex gap-2">
            <button className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <Camera size={16} /> Mở Camera
            </button>
            <button className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg text-sm font-medium flex items-center justify-center gap-2">
              <Upload size={16} /> Tải file lên
            </button>
          </div>
        </div>

        {/* Khung thông tin */}
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <h3 className="flex items-center gap-2 font-semibold text-emerald-400 border-b border-slate-700 pb-3 mb-4">
            <FileCheck size={18} />
            2. THÔNG TIN HỒ SƠ KIỂM ĐỊNH
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">Bệnh viện / Cơ sở</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập tên..." />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Khoa / Bộ phận</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="CSSD..." />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Mã / Số Máy Hấp</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập số..." />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">Số Mẻ Hấp</label>
              <input type="text" className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white focus:border-emerald-500 outline-none" placeholder="Nhập mẻ..." />
            </div>
          </div>
        </div>
      </div>

      {/* Cột phải: Preview A4 */}
      <div className="lg:col-span-8 bg-slate-800 p-5 rounded-xl border border-slate-700 flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <span className="text-sm text-slate-400">Xem trước trang in Khổ Chuẩn A4</span>
          <button className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2">
            <Download size={16} /> Xuất PDF
          </button>
        </div>
        
        {/* Bản Preview A4 */}
        <div className="bg-white text-black flex-1 rounded shadow-lg p-8 mx-auto w-full max-w-[210mm] min-h-[297mm]">
          <div className="text-right text-xs mb-6">
            <p>MÃ BIỂU MẪU: BM-CSSD-BD01</p>
            <p>Tiêu chuẩn: ISO 11140-5:2014 Type 2</p>
          </div>
          <h2 className="text-xl font-bold text-center mb-8 uppercase">Phiếu Kiểm Tra Chất Lượng Lò Tiệt Khuẩn Hơi Nước<br/><span className="text-sm font-normal">(Bowie-Dick Test Report)</span></h2>
          
          <table className="w-full text-sm border-collapse border border-gray-300 mb-6">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left">Thiết bị hấp</th>
                <th className="border border-gray-300 p-2 text-left">Số mẻ (Cycle)</th>
                <th className="border border-gray-300 p-2 text-left">Ngày - Giờ</th>
                <th className="border border-gray-300 p-2 text-left">Kết quả</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 p-2">---</td>
                <td className="border border-gray-300 p-2">---</td>
                <td className="border border-gray-300 p-2">---</td>
                <td className="border border-gray-300 p-2 font-bold text-emerald-600">ĐẠT (PASS)</td>
              </tr>
            </tbody>
          </table>
          
          <div className="border border-gray-300 p-4 h-64 bg-gray-50 flex items-center justify-center text-gray-400 text-sm">
            Hình ảnh minh chứng thực tế sẽ xuất hiện tại đây
          </div>
        </div>
      </div>
    </div>
  );
}
