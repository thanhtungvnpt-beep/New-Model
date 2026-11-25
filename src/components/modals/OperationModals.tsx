import {
  AlertTriangle,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  CloudUpload,
  Download,
  FileSpreadsheet,
  FolderOpen,
  Save,
  ShoppingCart,
  Table,
  Upload,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { OperationTab, PipelineItem } from '../../types/production';

interface OperationFormModalProps {
  isOpen: boolean;
  activeTab: OperationTab;
  onChangeTab: (tab: OperationTab) => void;
  onClose: () => void;
  onDownloadPoTemplate: () => void;
  onDownloadWarehouseTemplate: () => void;
  onSubmitGeneric: (label: string) => void;
  onCreateIssue: (payload: {
    line: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    assignee: string;
  }) => void;
}

export function OperationFormModal({
  isOpen,
  activeTab,
  onChangeTab,
  onClose,
  onDownloadPoTemplate,
  onDownloadWarehouseTemplate,
  onSubmitGeneric,
  onCreateIssue,
}: OperationFormModalProps) {
  const [issueLine, setIssueLine] = useState('Line 3');
  const [issueSeverity, setIssueSeverity] = useState<'high' | 'medium' | 'low'>('high');
  const [issueTitle, setIssueTitle] = useState('Lệch tọa độ hàn dán IC SMD máy dán tự động');
  const [issueDesc, setIssueDesc] = useState(
    'Đầu nozzle số 3 bị nghẹt áp suất hút làm rơi linh kiện LQFP-100. Yêu cầu kỹ sư bảo trì thay nozzle và cân chỉnh lại camera quang học trước 14:00.'
  );
  const [issueAssignee, setIssueAssignee] = useState('Nguyễn Văn Tuấn (Kỹ sư Line 3)');

  if (!isOpen) return null;

  const tabs: { id: OperationTab; label: string }[] = [
    { id: 'po', label: '1. Mua Hàng (PO)' },
    { id: 'warehouse', label: '2. Nhập Kho' },
    { id: 'vendor', label: '3. Nhập Cấp Vendor' },
    { id: 'staging', label: '4. Set Line (Staging)' },
    { id: 'qa', label: '5. Line Test & QA' },
    { id: 'issue', label: '6. Báo Cáo Sự Cố' },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <ClipboardList className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">
                Hệ Thống Biểu Mẫu Nhập Liệu Nghiệp Vụ Sản Xuất &amp; Chuỗi Cung Ứng
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Phần mềm điều phối sản xuất KHV Manufacturing Control
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Bar */}
        <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5 overflow-x-auto flex items-center gap-1.5 text-xs font-semibold">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`px-3 py-2 rounded-lg whitespace-nowrap transition cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Form Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'po' && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitGeneric('Đã lưu lệnh Mua Hàng PO-KHV-2025-088 thành công!');
                onClose();
              }}
            >
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between text-xs text-blue-800 font-medium flex-wrap gap-2">
                <div>
                  <span className="font-bold block">
                    Quy trình 1: Lập đơn mua hàng vật tư/linh kiện phục vụ dây chuyền
                  </span>
                  <span className="text-slate-600 text-[11px]">Mã gợi ý: PO-KHV-2025-088</span>
                </div>
                <button
                  type="button"
                  onClick={onDownloadPoTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 rounded-md transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu PO (.xlsx)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">Mã Đơn Hàng PO *</span>
                  <input
                    required
                    type="text"
                    defaultValue="PO-KHV-2025-088"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Nhà Cung Cấp (Vendor) *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white">
                    <option>Công ty Bách Khoa Semiconductor</option>
                    <option>Vendor Tân Phát Nhôm Định Hình</option>
                    <option>Công ty Điện tử Vĩnh Hưng Tech</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Linh Kiện / Thiết Bị *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white">
                    <option>Bo mạch chủ Mainboard PCB FR-4 (Loại A)</option>
                    <option>Vi điều khiển STM32F407 (Loại B)</option>
                    <option>Khung nhôm định hình máy CNC (Loại C)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Số Lượng Đặt Hàng *
                  </span>
                  <input
                    required
                    type="number"
                    defaultValue={100}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Đơn Giá Dự Kiến (VNĐ)
                  </span>
                  <input
                    type="text"
                    defaultValue="250.000 / Sheet"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Hạn Cam Kết Giao Hàng *
                  </span>
                  <input
                    type="date"
                    defaultValue="2025-04-15"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm cursor-pointer"
                >
                  Tạo Lệnh Mua Hàng PO
                </button>
              </div>
            </form>
          )}

          {activeTab === 'warehouse' && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitGeneric('Đã lập Phiếu Nhập Kho GRN-2025-054 thành công!');
                onClose();
              }}
            >
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-center justify-between text-xs text-amber-800 font-medium flex-wrap gap-2">
                <div>
                  <span className="font-bold block">
                    Quy trình 2: Tiếp nhận và xác nhận vật tư vào kho lưu trữ nội bộ
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    Kho Trung Tâm KHV · Mã GRN-2025-054
                  </span>
                </div>
                <button
                  type="button"
                  onClick={onDownloadWarehouseTemplate}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-white text-amber-800 hover:bg-amber-500 hover:text-white border border-amber-300 rounded-md transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Tải file mẫu Nhập Kho (.xlsx)</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">Mã Phiếu Nhập Kho *</span>
                  <input
                    type="text"
                    defaultValue="GRN-2025-054"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Vị Trí Lưu Kho (Kệ / Zone) *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white">
                    <option>Khu vực Kệ A2 - Khay IC chống tĩnh điện ESD</option>
                    <option>Khu vực Kệ B4 - Kho linh kiện Bo mạch PCB</option>
                    <option>Khu vực Kho Cơ Khí Nặng - Pallet C1</option>
                    <option>Khu vực Cải Tiến - Hiệu chỉnh linh kiện</option>
                    <option>Khu vực EDM - Gia công phóng điện</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Số Lượng Thực Nhận *
                  </span>
                  <input
                    type="number"
                    defaultValue={60}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Trạng Thái Kiểm Đếm *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 text-emerald-700 font-semibold bg-white">
                    <option>Đầy đủ &amp; Bao bì nguyên seal (Đạt tiêu chuẩn)</option>
                    <option>Thiếu số lượng so với packing list</option>
                    <option>Phát hiện móp méo / rách niêm phong</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Thủ Kho Tiếp Nhận *
                  </span>
                  <input
                    type="text"
                    defaultValue="Vũ Đình Toàn (Kho 01)"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Thời Gian Nhập Kho
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg border border-amber-200 bg-amber-50/50 p-3">
                  <label className="block">
                    <span className="text-amber-900 font-bold mb-1 block">
                      Mục nhỏ 1: Cải Tiến (SL)
                    </span>
                    <input
                      type="number"
                      min={0}
                      defaultValue={0}
                      className="w-full rounded-lg border border-amber-300 bg-white text-xs px-3 py-1.5 font-bold text-amber-800 tabular-nums"
                    />
                  </label>
                  <label className="block">
                    <span className="text-cyan-900 font-bold mb-1 block">
                      Mục nhỏ 2: EDM (SL)
                    </span>
                    <input
                      type="number"
                      min={0}
                      defaultValue={0}
                      className="w-full rounded-lg border border-cyan-300 bg-white text-xs px-3 py-1.5 font-bold text-cyan-800 tabular-nums"
                    />
                  </label>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 shadow-sm cursor-pointer"
                >
                  Xác Nhận Nhập Kho
                </button>
              </div>
            </form>
          )}

          {activeTab === 'vendor' && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitGeneric('Đã cập nhật bàn giao Vendor VDL-2025-019!');
                onClose();
              }}
            >
              <div className="bg-indigo-50 border border-indigo-200 p-3 rounded-lg flex items-center justify-between text-xs text-indigo-800 font-medium">
                <span>Quy trình 3: Điều phối và cấp phát vật tư/phôi cho đơn vị gia công Vendor</span>
                <span className="font-bold">Mã lô: VDL-2025-019</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Mã Lô Vận Chuyển *
                  </span>
                  <input
                    type="text"
                    defaultValue="VDL-2025-019"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Nhà Cung Cấp Vendor Nhận Hàng *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white">
                    <option>Vendor Tân Phát (Gia công CNC &amp; Anodizing)</option>
                    <option>Vendor Vĩnh Hưng (SMT Gia công ngoài)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Số Lượng Bàn Giao *
                  </span>
                  <input
                    type="number"
                    defaultValue={40}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Đơn Vị Vận Chuyển / Xe Giao
                  </span>
                  <input
                    type="text"
                    defaultValue="Xe tải nội bộ 29C-784.12"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Yêu Cầu Bảo Quản Đặc Biệt
                  </span>
                  <input
                    type="text"
                    defaultValue="Đóng gói chống va đập, bảo quản nhiệt độ dưới 30°C, độ ẩm < 60%"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-sm cursor-pointer"
                >
                  Cập Nhật Bàn Giao Vendor
                </button>
              </div>
            </form>
          )}

          {activeTab === 'staging' && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitGeneric('Cấp phát Staging Order #STG-042 lên Line thành công!');
                onClose();
              }}
            >
              <div className="bg-teal-50 border border-teal-200 p-3 rounded-lg flex items-center justify-between text-xs text-teal-800 font-medium">
                <span>Quy trình 4: Xuất kho staging cấp thẳng vào dây chuyền sản xuất</span>
                <span className="font-bold">Staging Order #STG-042</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Dây Chuyền Tiếp Nhận (Target Line) *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 font-semibold text-blue-700 bg-white">
                    <option>Line 1 - SMT Assembly</option>
                    <option>Line 2 - Wave Soldering</option>
                    <option>Line 3 - Manual Assembly</option>
                    <option>Line 4 - Function Test</option>
                    <option>Line 5 - Final Packing</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Linh Kiện / JIG Gá Kèm Theo *
                  </span>
                  <input
                    type="text"
                    defaultValue="PCB Mainboard + Bộ JIG Bakelite"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Số Lượng Cấp Sang Line *
                  </span>
                  <input
                    type="number"
                    defaultValue={25}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Trưởng Ca Line Tiếp Nhận *
                  </span>
                  <input
                    type="text"
                    defaultValue="Nguyễn Văn Tuấn (Kỹ sư trưởng)"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Hạn Định Setup Máy SMT / Chuẩn Bị
                  </span>
                  <input
                    type="text"
                    defaultValue="Hoàn thành căn chỉnh máy trước 13:30 ca chiều"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm cursor-pointer"
                >
                  Xác Nhận Đưa Lên Line
                </button>
              </div>
            </form>
          )}

          {activeTab === 'qa' && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onSubmitGeneric('Đã ghi nhận kết quả kiểm thử QA Line Test!');
                onClose();
              }}
            >
              <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center justify-between text-xs text-emerald-800 font-medium">
                <span>Quy trình 5: Nghiệm thu chất lượng sản phẩm &amp; QA Line Test</span>
                <span className="font-bold">Tiêu chuẩn QA/QC ISO</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Đợt Kiểm Thử Cho Line *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white">
                    <option>Line 1 - Test bo SMT mạ vàng</option>
                    <option>Line 4 - Function ICT Test hoàn chỉnh</option>
                    <option>Line 5 - Kiểm tra ngoại quan thành phẩm OQC</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Hạng Mục Kiểm Tra *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white">
                    <option>Test Chức Năng Điện Tử FCT (Functional Test)</option>
                    <option>Soi Quang Học Tự Động AOI Hàn Dán</option>
                    <option>Đo Kích Thước Ngoại Quan 3D Khung Vỏ</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Số Mẫu Thử Nghiệm *
                  </span>
                  <input
                    type="number"
                    defaultValue={20}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Số Lượng ĐẠT Chuẩn (Pass) *
                  </span>
                  <input
                    type="number"
                    defaultValue={20}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 text-emerald-700 font-bold tabular-nums"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Kết Luận Đánh Giá *
                  </span>
                  <select className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 font-bold text-emerald-700 bg-white">
                    <option>PASS 100% - Đủ điều kiện đóng gói xuất xưởng</option>
                    <option>CONDITIONAL PASS - Cho phép sửa đổi nhẹ</option>
                    <option>REJECT / FAIL - Trả về kiểm tra lại</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Kỹ Sư QA Phê Duyệt *
                  </span>
                  <input
                    type="text"
                    defaultValue="Lê Hoàng Đức (Trưởng ban QA/QC)"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-sm cursor-pointer"
                >
                  Ghi Nhận Kết Quả QA
                </button>
              </div>
            </form>
          )}

          {activeTab === 'issue' && (
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                onCreateIssue({
                  line: issueLine,
                  severity: issueSeverity,
                  title: issueTitle,
                  description: issueDesc,
                  assignee: issueAssignee,
                });
                onClose();
              }}
            >
              <div className="bg-rose-50 border border-rose-200 p-3 rounded-lg flex items-center justify-between text-xs text-rose-800 font-medium">
                <span>Quy trình 6: Báo cáo sự cố kỹ thuật hoặc đình trệ vật tư dây chuyền</span>
                <span className="font-bold text-rose-600">Khẩn Cấp (High Priority)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Line Sản Xuất Phát Sinh Sự Cố *
                  </span>
                  <select
                    value={issueLine}
                    onChange={(e) => setIssueLine(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white"
                  >
                    <option value="Line 3">Line 3 - Manual Assembly (Nghẽn nghiêm trọng)</option>
                    <option value="Line 1">Line 1 - SMT Assembly</option>
                    <option value="Line 2">Line 2 - Wave Soldering</option>
                    <option value="Line 4">Line 4 - Function Test</option>
                    <option value="Line 5">Line 5 - Final Packing (Thiếu bao bì)</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Mức Độ Nghiêm Trọng *
                  </span>
                  <select
                    value={issueSeverity}
                    onChange={(e) => setIssueSeverity(e.target.value as 'high' | 'medium' | 'low')}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 font-bold text-rose-700 bg-white"
                  >
                    <option value="high">Cao (High Priority - Dừng dây chuyền)</option>
                    <option value="medium">Trung bình (Medium - Chậm tiến độ)</option>
                    <option value="low">Thấp (Low - Khắc phục trong ca)</option>
                  </select>
                </label>
                <label className="block md:col-span-2">
                  <span className="text-slate-700 font-semibold mb-1 block">Tiêu Đề Sự Cố *</span>
                  <input
                    required
                    type="text"
                    value={issueTitle}
                    onChange={(e) => setIssueTitle(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 font-semibold"
                  />
                </label>
                <label className="block md:col-span-2">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Mô Tả Chi Tiết Vấn Đề &amp; Biện Pháp Đề Xuất
                  </span>
                  <textarea
                    rows={3}
                    value={issueDesc}
                    onChange={(e) => setIssueDesc(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Phân Công Xử Lý (Assignee)
                  </span>
                  <input
                    type="text"
                    value={issueAssignee}
                    onChange={(e) => setIssueAssignee(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
                <label className="block">
                  <span className="text-slate-700 font-semibold mb-1 block">
                    Hạn Chót Khắc Phục (Deadline)
                  </span>
                  <input
                    type="datetime-local"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 border border-slate-200 cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 shadow-sm cursor-pointer"
                >
                  Gửi Báo Cáo Sự Cố
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

interface UploadDemandModalProps {
  isOpen: boolean;
  items: PipelineItem[];
  onClose: () => void;
  onDownloadTemplate: () => void;
  onConfirmUpload: () => void;
}

export function UploadDemandModal({
  isOpen,
  items,
  onClose,
  onDownloadTemplate,
  onConfirmUpload,
}: UploadDemandModalProps) {
  const [selectedFileName, setSelectedFileName] = useState<string>('');

  if (!isOpen) return null;

  const totalTarget = items.reduce((acc, it) => acc + it.targetDemand, 0);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Upload className="w-5 h-5" />
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white">1, Form Upload demand cho admin</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                  Admin Portal
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Nhập biểu mẫu Target Demand định mức theo danh mục Item cho các dây chuyền sản xuất
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          <div className="border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl p-6 text-center">
            <input
              id="demand-file-input"
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFileName(file.name);
              }}
            />
            <label htmlFor="demand-file-input" className="cursor-pointer flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center mb-2">
                <CloudUpload className="w-6 h-6" />
              </div>
              <span className="text-sm font-bold text-slate-800">
                {selectedFileName
                  ? `Đã chọn tệp: ${selectedFileName}`
                  : 'Kéo và thả file Excel / CSV hoặc nhấp để chọn'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Hỗ trợ định dạng .xlsx, .xls, .csv (Khuôn mẫu gồm 3 cột chuẩn: <strong>Item No</strong>,{' '}
                <strong>Tên Item</strong> và <strong>Target Demand</strong>)
              </span>
              <div className="mt-4 flex items-center justify-center gap-3 flex-wrap">
                <span className="px-3.5 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-700 shadow-sm hover:bg-slate-50 inline-flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>Chọn file từ máy tính</span>
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDownloadTemplate();
                  }}
                  className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Tải template chuẩn (.xlsx / .csv)</span>
                </button>
              </div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Tổng số lượng Target Demand:</span>
              <span className="text-xl font-extrabold text-blue-700 tabular-nums">{totalTarget}</span>
              <span className="text-xs text-slate-500 ml-1">đơn vị</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Số mã phân loại Item:</span>
              <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                {items.length}
              </span>
              <span className="text-xs text-slate-500 ml-1">Items (A1 - A{items.length})</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Trạng thái thẩm định file:</span>
              <span className="text-sm font-bold text-emerald-700 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Sẵn sàng nạp vào Line</span>
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Bản xem trước dữ liệu trích xuất (Preview Table)
              </span>
              <span className="text-[11px] font-mono text-slate-500">{items.length} dòng hợp lệ</span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-[11px] sticky top-0 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5 pl-6 border-r border-slate-200 w-1/4">Item No</th>
                    <th className="p-2.5 px-4 border-r border-slate-200 w-2/4">Tên Item</th>
                    <th className="p-2.5 pr-6 text-right w-1/4">Target Demand</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono">
                  {items.map((it) => (
                    <tr key={it.itemNo} className="hover:bg-blue-50/50">
                      <td className="p-2.5 pl-6 font-bold text-slate-900 border-r border-slate-200">
                        {it.itemNo}
                      </td>
                      <td className="p-2.5 px-4 text-slate-800 font-semibold border-r border-slate-200">
                        {it.name}
                      </td>
                      <td className="p-2.5 pr-6 text-right font-extrabold text-blue-700 tabular-nums">
                        {it.targetDemand}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500">
            Đã xác thực chữ ký số Admin: <strong>Admin_KHV</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                onConfirmUpload();
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Xác nhận nạp Demand vào Line</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface PurchasingReportModalProps {
  isOpen: boolean;
  focusItemNo: string | null;
  items: PipelineItem[];
  onClose: () => void;
  onSave: (updated: PipelineItem[]) => void;
  onDownloadTemplate: () => void;
}

export function PurchasingReportModal({
  isOpen,
  focusItemNo,
  items,
  onClose,
  onSave,
  onDownloadTemplate,
}: PurchasingReportModalProps) {
  const [tab, setTab] = useState<'table' | 'paste' | 'upload'>('table');
  const [draftItems, setDraftItems] = useState<PipelineItem[]>(items);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    setDraftItems(items);
  }, [items, isOpen]);

  if (!isOpen) return null;

  const totalToBuy = draftItems.reduce((acc, it) => acc + it.toBuy, 0);
  const totalInStock = draftItems.reduce((acc, it) => acc + it.inWarehouse, 0);
  const totalImprovement = draftItems.reduce(
    (acc, it) => acc + (it.warehouseImprovement ?? 0),
    0
  );
  const totalEdm = draftItems.reduce((acc, it) => acc + (it.warehouseEdm ?? 0), 0);
  const ratio = totalToBuy > 0 ? ((totalInStock / totalToBuy) * 100).toFixed(1) : '0.0';

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split(/\r?\n/);
    const map = new Map<string, { toBuy?: number; inWarehouse?: number; purchaseIssue?: string }>();
    lines.forEach((line) => {
      const cols = line.split(/[\t,]/).map((c) => c.trim());
      if (cols[0]) {
        map.set(cols[0], {
          toBuy: cols[3] !== undefined && cols[3] !== '' ? Number(cols[3]) : undefined,
          inWarehouse: cols[4] !== undefined && cols[4] !== '' ? Number(cols[4]) : undefined,
          purchaseIssue: cols[5] !== undefined ? cols[5] : undefined,
        });
      }
    });
    setDraftItems((prev) =>
      prev.map((it) => {
        const patch = map.get(it.itemNo);
        if (!patch) return it;
        return {
          ...it,
          toBuy: patch.toBuy ?? it.toBuy,
          inWarehouse: patch.inWarehouse ?? it.inWarehouse,
          purchaseIssue: patch.purchaseIssue ?? it.purchaseIssue,
        };
      })
    );
    setTab('table');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShoppingCart className="w-5 h-5" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  2, Form báo cáo cho nghiệp vụ mua hàng
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                  PO Procurement
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Bảng theo dõi 6 cột chuẩn: <strong>Item No | Tên Item | Target Demand | Cần mua | Đã về kho | Issue tracker</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5 flex items-center justify-between text-xs font-semibold flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500">Phương thức nhập:</span>
            <button
              type="button"
              onClick={() => setTab('table')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                tab === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>1. Bảng dữ liệu trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('paste')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                tab === 'paste' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>2. Paste trực tiếp từ Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                tab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>3. Upload file Excel (.xlsx)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onDownloadTemplate}
            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file mẫu Excel (.xlsx)</span>
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === 'paste' && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900">
                  Dán dữ liệu sao chép từ Excel (Paste Tab-Separated Data)
                </span>
                <span className="text-[11px] text-slate-500">Hỗ trợ copy 6 cột từ Excel</span>
              </div>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'A1\tABC1\t10\t8\t2\tHỏng 1 cái\nA2\tABC2\t11\t8\t2\tĐi cải tiến 1 cái'}
                className="w-full rounded-lg border border-blue-300 text-xs font-mono p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">Phân tách tự động theo tab hoặc dấu phẩy</span>
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Áp dụng vào bảng
                </button>
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="bg-blue-50/50 border-2 border-dashed border-blue-200 rounded-xl p-6 text-center">
              <input
                id="purchase-upload-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={() => setTab('table')}
              />
              <label htmlFor="purchase-upload-input" className="cursor-pointer flex flex-col items-center">
                <CloudUpload className="w-8 h-8 text-blue-600 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  Chọn file Excel Báo Cáo Mua Hàng (.xlsx / .csv)
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Cấu trúc chuẩn: Item No, Tên Item, Target Demand, Cần mua, Đã về kho, Issue tracker
                </span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Tổng số lượng Cần mua:</span>
              <span className="text-xl font-extrabold text-blue-700 tabular-nums">{totalToBuy}</span>
              <span className="text-xs text-slate-500 ml-1">đơn vị</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Tổng số lượng Đã về kho:</span>
              <span className="text-xl font-extrabold text-emerald-600 tabular-nums">
                {totalInStock}
              </span>
              <span className="text-xs text-slate-500 ml-1">đơn vị</span>
              <div className="mt-1 flex items-center gap-2 text-[11px] font-bold tabular-nums">
                <span className="text-amber-700">Cải Tiến: {totalImprovement}</span>
                <span className="text-slate-300">·</span>
                <span className="text-cyan-700">EDM: {totalEdm}</span>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Tiến độ về kho / Cần mua:</span>
              <span className="text-sm font-bold text-amber-700 mt-1 inline-flex items-center gap-1 tabular-nums">
                <Zap className="w-4 h-4" />
                <span>{ratio}% (Đang giao hàng)</span>
              </span>
            </div>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-300 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 uppercase">
                Bảng Dữ Liệu Nghiệp Vụ Mua Hàng (Chuẩn 6 cột kèm Issue tracker)
              </span>
              <span className="text-[11px] text-slate-500 font-mono">{draftItems.length} Items</span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-[11px] sticky top-0">
                  <tr>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-16">Item No</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 w-24">Tên Item</th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-right w-24">
                      Target Demand
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-right w-24 text-blue-700">
                      Cần mua
                    </th>
                    <th className="py-2.5 px-3 border-r border-slate-300 text-right w-24 text-emerald-700">
                      Đã về kho
                    </th>
                    <th className="py-2.5 px-2.5 border-r border-slate-300 text-right w-20 text-amber-700 bg-amber-50/50">
                      Cải Tiến
                    </th>
                    <th className="py-2.5 px-2.5 border-r border-slate-300 text-right w-20 text-cyan-700 bg-cyan-50/50">
                      EDM
                    </th>
                    <th className="py-2.5 px-3 text-left min-w-[180px] text-rose-700 bg-rose-50/50">
                      Issue tracker
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-xs">
                  {draftItems.map((it, idx) => {
                    const isFocused = focusItemNo === it.itemNo;
                    return (
                      <tr
                        key={it.itemNo}
                        className={isFocused ? 'bg-blue-100/70' : 'hover:bg-blue-50/40'}
                      >
                        <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                          {it.itemNo}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold">
                          {it.name}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-medium tabular-nums">
                          {it.targetDemand}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            value={it.toBuy}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) => (rIdx === idx ? { ...row, toBuy: val } : row))
                              );
                            }}
                            className="w-16 text-right py-0.5 px-1.5 border border-slate-200 rounded text-xs font-bold text-blue-700 bg-white tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right">
                          <input
                            type="number"
                            value={it.inWarehouse}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, inWarehouse: val } : row
                                )
                              );
                            }}
                            className="w-16 text-right py-0.5 px-1.5 border border-slate-200 rounded text-xs font-bold text-emerald-700 bg-white tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-right bg-amber-50/20">
                          <input
                            type="number"
                            min={0}
                            aria-label={`Cải Tiến ${it.itemNo}`}
                            value={it.warehouseImprovement ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, warehouseImprovement: val } : row
                                )
                              );
                            }}
                            className="w-14 text-right py-0.5 px-1.5 border border-amber-200 rounded text-xs font-bold text-amber-800 bg-white tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-2.5 border-r border-slate-200 text-right bg-cyan-50/20">
                          <input
                            type="number"
                            min={0}
                            aria-label={`EDM ${it.itemNo}`}
                            value={it.warehouseEdm ?? 0}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, warehouseEdm: val } : row
                                )
                              );
                            }}
                            className="w-14 text-right py-0.5 px-1.5 border border-cyan-200 rounded text-xs font-bold text-cyan-800 bg-white tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={it.purchaseIssue}
                            placeholder="Ghi chú issue (nếu có)..."
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, purchaseIssue: val } : row
                                )
                              );
                            }}
                            className={`w-full py-0.5 px-2 border rounded text-xs font-sans ${
                              it.purchaseIssue.trim()
                                ? 'border-rose-300 bg-rose-50/40 text-rose-700 font-semibold'
                                : 'border-slate-200 bg-white text-slate-600'
                            }`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Đã khớp chuẩn định mức Target Demand</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
              <Zap className="w-3.5 h-3.5" />
              <span>Tự động đẩy issue vào Bảng Giám Sát Chung khi lưu</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draftItems);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu &amp; Cập nhật vào Chuỗi Cung Ứng</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface VendorFieldReportModalProps {
  isOpen: boolean;
  items: PipelineItem[];
  onClose: () => void;
  onSave: (updated: PipelineItem[]) => void;
  onDownloadTemplate: () => void;
  onLoadTestData: () => void;
}

export function VendorFieldReportModal({
  isOpen,
  items,
  onClose,
  onSave,
  onDownloadTemplate,
  onLoadTestData,
}: VendorFieldReportModalProps) {
  const [tab, setTab] = useState<'table' | 'paste' | 'upload'>('table');
  const [draftItems, setDraftItems] = useState<PipelineItem[]>(items);
  const [pasteText, setPasteText] = useState('');

  useEffect(() => {
    setDraftItems(items);
  }, [items, isOpen]);

  if (!isOpen) return null;

  const totalTarget = draftItems.reduce((acc, it) => acc + it.targetDemand, 0);
  const totalVendor = draftItems.reduce((acc, it) => acc + it.vendorInbound, 0);
  const totalStaged = draftItems.reduce((acc, it) => acc + it.stagedOnLine, 0);
  const totalTested = draftItems.reduce((acc, it) => acc + it.lineTested, 0);
  const stageRatio = totalVendor > 0 ? ((totalStaged / totalVendor) * 100).toFixed(1) : '0.0';

  const handleApplyPaste = () => {
    if (!pasteText.trim()) return;
    const lines = pasteText.trim().split(/\r?\n/);
    const map = new Map<
      string,
      { vendorInbound?: number; stagedOnLine?: number; lineTested?: number; vendorIssue?: string }
    >();
    lines.forEach((line) => {
      const cols = line.split(/[\t,]/).map((c) => c.trim());
      if (cols[0]) {
        map.set(cols[0], {
          vendorInbound: cols[3] !== undefined && cols[3] !== '' ? Number(cols[3]) : undefined,
          stagedOnLine: cols[4] !== undefined && cols[4] !== '' ? Number(cols[4]) : undefined,
          lineTested: cols[5] !== undefined && cols[5] !== '' ? Number(cols[5]) : undefined,
          vendorIssue: cols[6] !== undefined ? cols[6] : undefined,
        });
      }
    });
    setDraftItems((prev) =>
      prev.map((it) => {
        const patch = map.get(it.itemNo);
        if (!patch) return it;
        return {
          ...it,
          vendorInbound: patch.vendorInbound ?? it.vendorInbound,
          stagedOnLine: patch.stagedOnLine ?? it.stagedOnLine,
          lineTested: patch.lineTested ?? it.lineTested,
          vendorIssue: patch.vendorIssue ?? it.vendorIssue,
        };
      })
    );
    setTab('table');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-5xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <ClipboardCheck className="w-6 h-6 text-amber-300 shrink-0" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  2, Form báo cáo nghiệp vụ hiện trường vendor
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                  Dành riêng cho Nhân viên Hiện trường
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Theo dõi chuẩn 7 cột: <strong>Item No | Tên Item | Target Demand | Nhập Vendor | Set lên Line | Line test | Issue tracker</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="border-b border-slate-200 bg-slate-50 px-6 py-2.5 flex items-center justify-between text-xs font-semibold flex-wrap gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500">Chế độ nhập:</span>
            <button
              type="button"
              onClick={() => setTab('table')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                tab === 'table' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>1. Bảng trực tiếp</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('paste')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                tab === 'paste' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>2. Dán từ Excel</span>
            </button>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`px-3 py-1.5 rounded-lg inline-flex items-center gap-1 transition cursor-pointer ${
                tab === 'upload' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>3. Upload Excel</span>
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                onLoadTestData();
                setDraftItems((prev) =>
                  prev.map((it) => ({
                    ...it,
                    vendorInbound: it.targetDemand,
                    stagedOnLine: it.targetDemand,
                  }))
                );
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md bg-amber-500 hover:bg-amber-600 text-white transition cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Nạp Dữ Liệu Kiểm Thử Mẫu</span>
            </button>
            <button
              type="button"
              onClick={onDownloadTemplate}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold rounded-md bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Tải file mẫu Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {tab === 'paste' && (
            <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-indigo-900">
                  Dán dữ liệu sao chép từ file Excel hiện trường
                </span>
                <span className="text-[11px] text-slate-500">Hỗ trợ copy 7 cột từ Excel</span>
              </div>
              <textarea
                rows={4}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={'A1\tABC1\t10\t10\t10\t10\tBình thường'}
                className="w-full rounded-lg border border-indigo-300 text-xs font-mono p-3 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleApplyPaste}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs cursor-pointer"
                >
                  Áp dụng vào bảng hiện trường
                </button>
              </div>
            </div>
          )}

          {tab === 'upload' && (
            <div className="bg-blue-50/50 border-2 border-dashed border-indigo-200 rounded-xl p-6 text-center">
              <input
                id="vendor-upload-input"
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                onChange={() => setTab('table')}
              />
              <label htmlFor="vendor-upload-input" className="cursor-pointer flex flex-col items-center">
                <CloudUpload className="w-8 h-8 text-indigo-600 mb-2" />
                <span className="text-sm font-bold text-slate-800">
                  Chọn file Excel Báo Cáo Hiện Trường Vendor (.xlsx / .csv)
                </span>
              </label>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Tổng số lượng Target Demand:</span>
              <span className="text-xl font-extrabold text-blue-700 tabular-nums">
                {totalTarget}
              </span>
              <span className="text-xs text-slate-500 ml-1">đơn vị ({draftItems.length} items)</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Đã cấp lên Line / Nhập Vendor:</span>
              <span className="text-xl font-extrabold text-teal-700 tabular-nums">
                {totalStaged} / {totalVendor}
              </span>
              <span className="text-xs text-slate-500 ml-1">({stageRatio}%)</span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl">
              <span className="text-xs text-slate-500 block">Tiến độ Line Test:</span>
              <span className="text-sm font-bold text-emerald-700 mt-1 inline-flex items-center gap-1 tabular-nums">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>Đạt {totalTested} đơn vị</span>
              </span>
            </div>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="bg-slate-100 px-6 py-2.5 border-b border-slate-300 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-800 uppercase">
                Bảng Dữ Liệu 7 Cột: Báo Cáo Nghiệp Vụ Hiện Trường Vendor
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                {draftItems.length} Items: A1 - A{draftItems.length}
              </span>
            </div>

            <div className="max-h-72 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-100 border-b border-slate-300 text-slate-800 font-bold uppercase text-[11px] sticky top-0">
                  <tr>
                    <th className="py-3 px-3 border-r border-slate-300 w-16">Item No</th>
                    <th className="py-3 px-3 border-r border-slate-300 w-24">Tên Item</th>
                    <th className="py-3 px-3 border-r border-slate-300 text-right w-24">Target</th>
                    <th className="py-3 px-3 border-r border-slate-300 text-right text-indigo-700 bg-indigo-50/40 w-24">
                      Nhập Vendor
                    </th>
                    <th className="py-3 px-3 border-r border-slate-300 text-right text-teal-700 bg-teal-50/40 w-24">
                      Set lên Line
                    </th>
                    <th className="py-3 px-3 border-r border-slate-300 text-center w-28">
                      Line test
                    </th>
                    <th className="py-3 px-3 text-left min-w-[200px]">Issue tracker</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 font-mono text-xs">
                  {draftItems.map((it, idx) => {
                    const isPass = it.lineTested >= it.targetDemand;
                    return (
                      <tr key={it.itemNo} className="hover:bg-indigo-50/40">
                        <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-900">
                          {it.itemNo}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 font-semibold">
                          {it.name}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right font-bold text-blue-700 tabular-nums">
                          {it.targetDemand}
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right bg-indigo-50/20">
                          <input
                            type="number"
                            value={it.vendorInbound}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, vendorInbound: val } : row
                                )
                              );
                            }}
                            className="w-16 text-right py-0.5 px-1.5 border border-slate-300 rounded font-bold text-indigo-700 bg-white tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-right bg-teal-50/20">
                          <input
                            type="number"
                            value={it.stagedOnLine}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, stagedOnLine: val } : row
                                )
                              );
                            }}
                            className="w-16 text-right py-0.5 px-1.5 border border-slate-300 rounded font-bold text-teal-700 bg-white tabular-nums"
                          />
                        </td>
                        <td className="py-2 px-3 border-r border-slate-200 text-center">
                          <input
                            type="number"
                            value={it.lineTested}
                            onChange={(e) => {
                              const val = Math.max(0, Number(e.target.value) || 0);
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, lineTested: val } : row
                                )
                              );
                            }}
                            className={`w-16 text-center py-0.5 px-1.5 border rounded font-bold tabular-nums ${
                              isPass
                                ? 'border-emerald-300 bg-emerald-50 text-emerald-800'
                                : 'border-slate-300 bg-white text-slate-700'
                            }`}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={it.vendorIssue}
                            placeholder="Ghi chú issue hiện trường..."
                            onChange={(e) => {
                              const val = e.target.value;
                              setDraftItems((prev) =>
                                prev.map((row, rIdx) =>
                                  rIdx === idx ? { ...row, vendorIssue: val } : row
                                )
                              );
                            }}
                            className="w-full py-0.5 px-2 border border-slate-200 rounded text-xs font-sans text-slate-700 bg-white"
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500 inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Tự động đồng bộ vào Quy trình chuỗi cung ứng khi lưu</span>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Đóng
            </button>
            <button
              type="button"
              onClick={() => {
                onSave(draftItems);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu &amp; Đồng bộ dữ liệu hiện trường</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
