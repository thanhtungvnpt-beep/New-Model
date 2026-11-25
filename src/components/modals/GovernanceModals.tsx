import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  Download,
  History,
  Lock,
  LockOpen,
  Mail,
  MessageSquare,
  PlusCircle,
  Save,
  Send,
  Shield,
  Table,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { formatLineTimestamp } from '../../data/initialData';
import {
  AuditLogEntry,
  isMassStopIssueStatus,
  IssueItem,
  LineCharacteristic,
  LineHealthStatus,
  MASS_LINE_STATUSES,
  NEW_LINE_STATUSES,
  PipelineItem,
  ProductionLine,
} from '../../types/production';

interface AdminAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticate: (reason: string) => void;
}

export function AdminAuthModal({ isOpen, onClose, onAuthenticate }: AdminAuthModalProps) {
  const [password, setPassword] = useState('');
  const [reasonSelect, setReasonSelect] = useState('Tăng công suất theo kế hoạch KHV mới');
  const [reasonDetail, setReasonDetail] = useState(
    'Điều chỉnh định mức theo chỉ thị vận hành số #KHV-402 ngày hôm nay.'
  );
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold text-white">
                Xác thực quyền Admin hệ thống KHV
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Phê duyệt chỉnh sửa thông tin Line &amp; định mức Target Demand
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          className="p-6 space-y-4 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            if (!password.trim()) {
              setErrorMsg('Vui lòng nhập mật khẩu Admin.');
              return;
            }
            setErrorMsg('');
            onAuthenticate(`${reasonSelect} — ${reasonDetail}`);
            setPassword('');
            onClose();
          }}
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800">
            <div className="flex items-center justify-between font-semibold">
              <span>
                Người thực hiện: <strong>Admin_KHV</strong>
              </span>
              <span className="text-[11px] text-blue-600">Ca trực sản xuất</span>
            </div>
            <span className="text-[11px] text-slate-500 block mt-1">
              Thời gian: {new Date().toLocaleDateString('vi-VN')}{' '}
              {new Date().toLocaleTimeString('vi-VN')}
            </span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Mật khẩu quản trị viên (Admin Password) *
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu (ví dụ: admin123)"
              className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            {errorMsg && <p className="text-rose-600 text-[11px] mt-1 font-semibold">{errorMsg}</p>}
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Lý do điều chỉnh / thay đổi cấu hình *
            </label>
            <select
              value={reasonSelect}
              onChange={(e) => setReasonSelect(e.target.value)}
              className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 mb-2 bg-white"
            >
              <option value="Cập nhật tên, công đoạn & phụ trách Line">
                Cập nhật tên, công đoạn &amp; phụ trách Line
              </option>
              <option value="Tăng công suất theo kế hoạch KHV mới">
                Tăng công suất theo kế hoạch KHV mới
              </option>
              <option value="Bổ sung đơn hàng gấp từ khách hàng">
                Bổ sung đơn hàng gấp từ khách hàng
              </option>
              <option value="Điều chỉnh bù hao hụt linh kiện Line 1">
                Điều chỉnh bù hao hụt linh kiện Line 1
              </option>
              <option value="Cân bằng chuyền theo định mức JIG mới">
                Cân bằng chuyền theo định mức JIG mới
              </option>
            </select>
            <textarea
              rows={2}
              value={reasonDetail}
              onChange={(e) => setReasonDetail(e.target.value)}
              className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 font-medium cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <LockOpen className="w-3.5 h-3.5" />
              <span>Xác nhận &amp; Mở khóa chỉnh sửa</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

interface AuditHistoryModalProps {
  isOpen: boolean;
  logs: AuditLogEntry[];
  onClose: () => void;
}

export function AuditHistoryModal({ isOpen, logs, onClose }: AuditHistoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <History className="w-5 h-5 text-blue-400" />
            <div>
              <h3 className="text-base font-bold text-white">
                Lịch Sử Sửa Đổi Tiêu Chuẩn Line (Audit Trail)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Nhật ký kiểm toán truy vết tất cả các phiên bản thay đổi của Target Demand
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[11px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Phiên bản</th>
                  <th className="py-2.5 px-4">Ngày giờ</th>
                  <th className="py-2.5 px-4">Người sửa</th>
                  <th className="py-2.5 px-4">Lý do sửa</th>
                  <th className="py-2.5 px-4 text-right">Chi tiết thay đổi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {logs.map((log, idx) => (
                  <tr key={`${log.version}-${idx}`} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold ${
                          log.tone === 'blue'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.version}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 tabular-nums">{log.timestamp}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">{log.author}</td>
                    <td className="py-3 px-4 text-slate-700">{log.reason}</td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700">
                      {log.changes}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Lưu trữ bất biến tuân thủ hệ thống ISO 9001</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-200 font-semibold hover:bg-slate-100 text-slate-700 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}

interface ExportIssuesModalProps {
  isOpen: boolean;
  items: PipelineItem[];
  onClose: () => void;
  onExecuteDownload: (format: 'csv' | 'xlsx') => void;
}

export function ExportIssuesModal({
  isOpen,
  items,
  onClose,
  onExecuteDownload,
}: ExportIssuesModalProps) {
  const [format, setFormat] = useState<'csv' | 'xlsx'>('csv');

  if (!isOpen) return null;

  const issueItems = items.filter((it) => Boolean(it.purchaseIssue.trim()));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-600 to-blue-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Table className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold text-white">
                Xuất Báo Cáo Nhanh Item Sự Cố (Excel Preview &amp; Export)
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Trích xuất dữ liệu danh sách Item có cảnh báo sự cố kỹ thuật và vật tư
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <span className="font-bold text-slate-900 block">
                  Phát hiện {issueItems.length} Item trọng điểm đang phát sinh sự cố trong chuỗi cung ứng
                </span>
                <span className="text-slate-600 text-[11px]">
                  Dữ liệu được cập nhật tự động đồng bộ từ Form Báo Cáo Nghiệp Vụ Mua Hàng
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-white text-rose-700 border border-rose-300 shrink-0 tabular-nums">
              {issueItems.length} Item sự cố
            </span>
          </div>

          <div className="border border-slate-300 rounded-xl overflow-hidden shadow-sm bg-white">
            <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-300 flex items-center justify-between text-xs font-bold text-slate-700">
              <span>Bản xem trước dữ liệu xuất Excel (Preview Columns)</span>
              <span className="text-[11px] font-mono text-slate-500">
                Bao_Cao_Nhanh_Item_Su_Co_Chuoi_Cung_Ung.{format}
              </span>
            </div>
            <div className="max-h-60 overflow-y-auto">
              <table className="w-full text-left text-xs border-collapse font-mono">
                <thead className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="py-2 px-3 border-r border-slate-300">Mã SC</th>
                    <th className="py-2 px-3 border-r border-slate-300">Mã Item</th>
                    <th className="py-2 px-3 border-r border-slate-300">Tên Item</th>
                    <th className="py-2 px-3 border-r border-slate-300">Nội dung Sự cố</th>
                    <th className="py-2 px-3 text-center">Cần mua / Kho</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800 text-[11px]">
                  {issueItems.map((it, idx) => (
                    <tr key={it.itemNo} className="bg-rose-50/20">
                      <td className="py-2 px-3 border-r border-slate-200 font-bold text-blue-700">
                        {it.linkedIssueId || `ISS-01${idx + 1}`}
                      </td>
                      <td className="py-2 px-3 border-r border-slate-200 font-bold">{it.itemNo}</td>
                      <td className="py-2 px-3 border-r border-slate-200 font-semibold">{it.name}</td>
                      <td className="py-2 px-3 border-r border-slate-200 text-rose-700 font-semibold">
                        {it.purchaseIssue}
                      </td>
                      <td className="py-2 px-3 text-center font-bold tabular-nums">
                        {it.toBuy} / {it.inWarehouse}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 font-semibold block">
                Định dạng xuất file:
              </span>
              <div className="flex items-center gap-4 mt-1.5">
                <label className="flex items-center gap-1.5 text-slate-800 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="export_format"
                    checked={format === 'csv'}
                    onChange={() => setFormat('csv')}
                  />
                  <span>Excel Comma (.csv UTF-8)</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-800 font-medium cursor-pointer">
                  <input
                    type="radio"
                    name="export_format"
                    checked={format === 'xlsx'}
                    onChange={() => setFormat('xlsx')}
                  />
                  <span>Excel Workbook (.xlsx)</span>
                </label>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[11px] text-slate-500 font-semibold block">
                Bộ mã ký tự tiếng Việt:
              </span>
              <span className="text-slate-800 font-bold mt-1.5 inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>UTF-8 with BOM (Hiển thị chuẩn trên Excel)</span>
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500">
            Tự động tải xuống ngay sau khi nhấn xác nhận
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => {
                onExecuteDownload(format);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Tải File Báo Cáo Xuống Máy</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AlertNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDispatch: (channels: string[]) => void;
}

export function AlertNotificationModal({
  isOpen,
  onClose,
  onDispatch,
}: AlertNotificationModalProps) {
  const [sendEmail, setSendEmail] = useState(true);
  const [sendZalo, setSendZalo] = useState(true);
  const [autoTrigger, setAutoTrigger] = useState(true);

  if (!isOpen) return null;

  const managers = [
    {
      role: 'Ca Trưởng Ca 1 (Tổng chỉ huy)',
      name: 'Nguyễn Văn Tuấn',
      email: 'tuannv@khv.vn',
      phone: '0988.452.190',
    },
    {
      role: 'Trưởng Bộ Phận Mua Hàng (PO)',
      name: 'Trần Thị Mai',
      email: 'maitt@khv.vn',
      phone: '0912.834.721',
    },
    {
      role: 'Kỹ Sư Trưởng Dây Chuyền / QA',
      name: 'Lê Hoàng Đức',
      email: 'duclh@khv.vn',
      phone: '0903.667.112',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20 shrink-0">
              <BellRing className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Hệ Thống Gửi Thông Báo Tự Động Cho Quản Lý Ca (Incident Alerts)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-900">
                  Auto Dispatcher
                </span>
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Phát thông báo tức thời qua Email &amp; Zalo ZNS khi phát sinh sự cố dây chuyền
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          <div className="bg-indigo-50/50 border border-indigo-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                Kênh Thông Báo Đang Kích Hoạt
              </span>
              <p className="text-slate-600 text-[11px] mt-0.5">
                Gửi đồng thời qua SMTP Doanh nghiệp và Zalo ZNS Template #KHV-INCIDENT-01
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                />
                <Mail className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-bold text-slate-700">Email (+ Excel)</span>
              </label>
              <label className="inline-flex items-center gap-2 cursor-pointer bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                <input
                  type="checkbox"
                  checked={sendZalo}
                  onChange={(e) => setSendZalo(e.target.checked)}
                />
                <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-bold text-slate-700">Zalo ZNS</span>
              </label>
            </div>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Vai Trò / Ca Trực</th>
                  <th className="py-2.5 px-4">Họ Và Tên</th>
                  <th className="py-2.5 px-4">Email Tiếp Nhận</th>
                  <th className="py-2.5 px-4">Số Điện Thoại Zalo</th>
                  <th className="py-2.5 px-4 text-center">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {managers.map((m) => (
                  <tr key={m.email} className="hover:bg-slate-50">
                    <td className="py-2.5 px-4 font-bold text-blue-700">{m.role}</td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">{m.name}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-600">{m.email}</td>
                    <td className="py-2.5 px-4 font-mono text-slate-800 font-bold tabular-nums">
                      {m.phone}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-100 text-emerald-700">
                        Đang trực
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-blue-700 inline-flex items-center gap-1.5">
                  <Mail className="w-4 h-4" />
                  <span>Mẫu Email Báo Cáo Kèm File</span>
                </span>
                <span className="text-[10px] font-mono text-slate-400">HTML Format</span>
              </div>
              <p className="text-[11px] text-rose-700 font-bold">
                [CẢNH BÁO CA TRỰC] Báo cáo 2 sự cố chuỗi cung ứng khẩn cấp (Item A1: Hỏng 1 cái; Item A2: Đi cải tiến 1 cái)
              </p>
              <p className="text-[11px] text-slate-600">
                Đính kèm tự động: <strong className="font-mono">Bao_Cao_Nhanh_Item_Su_Co.xlsx</strong>
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-300 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="font-bold text-blue-600 inline-flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4" />
                  <span>Mẫu Tin Nhắn Zalo ZNS</span>
                </span>
                <span className="text-[10px] font-mono text-blue-700 font-bold">Zalo OA Verified</span>
              </div>
              <p className="font-bold text-rose-700 text-[11px]">
                CẢNH BÁO SỰ CỐ DÂY CHUYỀN KHẨN CẤP
              </p>
              <p className="text-[11px] text-slate-600">
                Mã sự cố: ISS-011 (A1) &amp; ISS-012 (A2) · Ca 1 - Nguyễn Văn Tuấn tiếp nhận.
              </p>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between gap-3">
            <div>
              <span className="font-bold text-slate-900 block">
                Chế độ tự động hóa sự kiện (Real-time Event Trigger)
              </span>
              <p className="text-slate-600 text-[11px]">
                Tự động kích hoạt gửi thông báo khi phát hiện sự cố có mức độ Khẩn cấp (High Priority).
              </p>
            </div>
            <input
              type="checkbox"
              checked={autoTrigger}
              onChange={(e) => setAutoTrigger(e.target.checked)}
              className="w-4 h-4 accent-blue-600 cursor-pointer"
            />
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs text-slate-500 inline-flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Bảo mật theo quy chuẩn ISO 27001 &amp; Zalo ZNS API</span>
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
                const active: string[] = [];
                if (sendEmail) active.push('Email');
                if (sendZalo) active.push('Zalo ZNS');
                onDispatch(active.length > 0 ? active : ['Email']);
                onClose();
              }}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Gửi báo cáo ngay lập tức (Dispatch Now)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface IssueDetailModalProps {
  issue: IssueItem | null;
  onClose: () => void;
  onSaveProgress: (issueId: string, progress: number, notes: string) => void;
}

export function IssueDetailModal({ issue, onClose, onSaveProgress }: IssueDetailModalProps) {
  const [progress, setProgress] = useState(0);
  const [notes, setNotes] = useState('');
  const [notesError, setNotesError] = useState('');

  useEffect(() => {
    if (issue) {
      setProgress(issue.progress);
      setNotes('');
      setNotesError('');
    }
  }, [issue]);

  if (!issue) return null;

  const isNotesValid = notes.trim().length > 0;

  const handleSaveClick = () => {
    const trimmedNotes = notes.trim();
    if (!trimmedNotes) {
      setNotesError(
        'Vui lòng nhập Ghi chú tiến độ / Biện pháp xử lý tức thời trước khi lưu cập nhật sự cố.'
      );
      const el = document.getElementById('issue-detail-notes-input');
      el?.focus();
      return;
    }
    setNotesError('');
    onSaveProgress(issue.id, progress, trimmedNotes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[60] overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-rose-700 via-rose-600 to-rose-800 text-white flex items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Hồ Sơ Sự Cố: {issue.title}</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white font-mono">
                {issue.id}
              </span>
            </div>
            <p className="text-xs text-rose-100 mt-0.5">
              Phần mềm điều phối và giải tỏa sự cố dây chuyền sản xuất KHV
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                Dây Chuyền:
              </span>
              <span className="text-sm font-bold text-slate-800">{issue.line}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                Mã Linh Kiện:
              </span>
              <span className="text-sm font-bold text-blue-700">{issue.itemCode}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                Mức Độ:
              </span>
              <span className="text-sm font-bold text-rose-700">
                {issue.severity === 'high'
                  ? 'Khẩn cấp (High)'
                  : issue.severity === 'medium'
                  ? 'Trung bình'
                  : 'Thấp'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-semibold uppercase block">
                Thời Gian:
              </span>
              <span className="text-sm font-bold text-slate-800 tabular-nums">{issue.duration}</span>
            </div>
          </div>

          <div>
            <label className="font-bold text-slate-800 block mb-1">
              Tiêu Đề &amp; Hiện Trạng Sự Cố:
            </label>
            <p className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 leading-relaxed font-medium">
              {issue.description}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="font-bold text-slate-800 block mb-1">
                Kỹ Sư Tiếp Nhận Phụ Trách:
              </label>
              <div className="p-2.5 rounded-lg border border-slate-200 bg-white flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs shrink-0">
                  KT
                </div>
                <div>
                  <div className="font-bold text-slate-800">{issue.assignee}</div>
                  <div className="text-[10px] text-slate-400">{issue.assigneeRole}</div>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-800">
                  Cập Nhật Tiến Độ Khắc Phục (%):
                </label>
                {progress < 100 && (
                  <button
                    type="button"
                    onClick={() => setProgress(100)}
                    className="px-2 py-0.5 rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 text-[10px] font-bold transition cursor-pointer"
                  >
                    Đặt 100% (Tự trừ Issue)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={progress}
                  onChange={(e) => setProgress(Number(e.target.value))}
                  className="w-full accent-rose-600 cursor-pointer"
                />
                <span
                  className={`font-bold text-sm w-12 text-right tabular-nums ${
                    progress >= 100 ? 'text-emerald-700' : 'text-rose-700'
                  }`}
                >
                  {progress}%
                </span>
              </div>
              {progress >= 100 && issue.progress < 100 && (
                <p className="text-[10px] text-emerald-700 font-semibold mt-1">
                  Đạt 100%: Khi lưu sẽ tự động trừ 1 Issue trên thẻ {issue.line}.
                </p>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor="issue-detail-notes-input"
                className="font-bold text-slate-800 block"
              >
                Ghi Chú Tiến Độ / Biện Pháp Xử Lý Tức Thời:{' '}
                <span className="text-rose-600">*</span>
              </label>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isNotesValid
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-rose-100 text-rose-700'
                }`}
              >
                {isNotesValid ? 'Đã nhập ghi chú' : 'Bắt buộc nhập'}
              </span>
            </div>
            <textarea
              id="issue-detail-notes-input"
              required
              rows={3}
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                if (notesError && e.target.value.trim()) {
                  setNotesError('');
                }
              }}
              placeholder="Nhập ghi chú tiến độ mới hoặc biện pháp xử lý tức thời (bắt buộc trước khi lưu)..."
              className={`w-full rounded-lg border text-xs p-2.5 focus:ring-2 focus:outline-none ${
                notesError
                  ? 'border-rose-500 bg-rose-50/40 focus:ring-rose-500'
                  : 'border-slate-300 focus:ring-blue-500'
              }`}
            />
            {notesError ? (
              <p className="text-[11px] font-bold text-rose-600 mt-1">{notesError}</p>
            ) : !isNotesValid ? (
              <p className="text-[11px] text-amber-700 font-medium mt-1">
                Phải nhập nội dung vào ô Ghi chú tiến độ / Biện pháp xử lý tức thời mới cho phép lưu cập nhật sự cố.
              </p>
            ) : null}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
            <div className="font-bold text-slate-800 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5 text-blue-600" />
              <span>Lịch Sử Cập Nhật &amp; Khắc Phục Issue</span>
            </div>
            <div className="space-y-1.5 border-l-2 border-slate-300 pl-3 ml-1">
              {(issue.history && issue.history.length > 0
                ? issue.history
                : [
                    {
                      timestamp: issue.sinceTime,
                      progress: issue.progress,
                      statusText: issue.statusText,
                      note: issue.notes,
                      author: issue.assignee,
                    },
                  ]
              ).map((entry, idx) => (
                <div key={`detail-hist-${idx}`} className="text-[11px] text-slate-700">
                  <span className="font-bold text-slate-900 tabular-nums">[{entry.timestamp}]</span>{' '}
                  <span className="font-bold text-blue-700 tabular-nums">{entry.progress}%</span>{' '}
                  <span className="font-semibold text-slate-700">· {entry.statusText}</span>
                  {entry.note && <p className="text-slate-600 mt-0.5">{entry.note}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <span className="text-xs text-slate-500">
            Đồng bộ trực tiếp vào Lịch sử &amp; Sổ theo dõi sự cố
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
              aria-disabled={!isNotesValid}
              onClick={handleSaveClick}
              className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm inline-flex items-center gap-1.5 transition ${
                isNotesValid
                  ? 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
                  : 'text-slate-500 bg-slate-200 border border-slate-300 cursor-not-allowed'
              }`}
            >
              <Save className="w-4 h-4" />
              <span>Lưu Cập Nhật Sự Cố</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface AddLineModalProps {
  isOpen: boolean;
  nextLineNumber: number;
  onClose: () => void;
  onCreateLine: (line: ProductionLine) => void;
}

export function AddLineModal({
  isOpen,
  nextLineNumber,
  onClose,
  onCreateLine,
}: AddLineModalProps) {
  const [lineName, setLineName] = useState(`Line ${nextLineNumber}`);
  const [stage, setStage] = useState('Final Inspection & QA');
  const [characteristic, setCharacteristic] = useState<LineCharacteristic>('new');
  const [statusLabel, setStatusLabel] = useState<LineHealthStatus>('Đang Lắp Ráp');
  const [progress, setProgress] = useState(80);
  const [issueCount, setIssueCount] = useState(0);
  const [leader, setLeader] = useState(`Trần Quốc Thắng (Kỹ sư Line ${nextLineNumber})`);

  useEffect(() => {
    setLineName(`Line ${nextLineNumber}`);
    setLeader(`Trần Quốc Thắng (Kỹ sư Line ${nextLineNumber})`);
    setCharacteristic('new');
    setStatusLabel('Đang Lắp Ráp');
  }, [nextLineNumber, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5" />
            <div>
              <h3 className="text-base font-bold text-white">
                Khởi Tạo Dây Chuyền Sản Xuất Mới (Admin Line Provisioning)
              </h3>
              <p className="text-xs text-blue-100 mt-0.5">
                Thêm dây chuyền mới vào hệ thống điều phối Trung tâm KHV
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form
          className="p-6 space-y-4 text-xs"
          onSubmit={(e) => {
            e.preventDefault();
            const finalStatus: LineHealthStatus =
              characteristic === 'mas'
                ? MASS_LINE_STATUSES.includes(statusLabel)
                  ? statusLabel
                  : 'Đang sản xuất'
                : NEW_LINE_STATUSES.includes(statusLabel)
                ? statusLabel
                : 'Đang Lắp Ráp';
            const autoIssueForStop =
              characteristic === 'mas' && isMassStopIssueStatus(finalStatus);
            const finalIssueCount = autoIssueForStop ? Math.max(1, issueCount) : issueCount;
            onCreateLine({
              id: `line-${nextLineNumber}-${Date.now()}`,
              name: lineName,
              stage: `${lineName} - ${stage}`,
              shortStage: stage.split(' ')[0] || 'QA',
              characteristic,
              vtPercent:
                finalStatus === 'Mass Ready' ||
                finalStatus === 'Đủ Vật Tư' ||
                finalStatus === 'Dừng hoàn thành Plan'
                  ? 100
                  : progress,
              healthPercent: progress,
              issueCount: finalIssueCount,
              statusLabel: finalStatus,
              healthBadge:
                finalStatus === 'Dừng do Máy hỏng' ||
                finalStatus === 'Dừng do Lỗi thao tác' ||
                finalStatus === 'Dừng Chất lượng' ||
                finalStatus === 'Dừng do Sự cố điện' ||
                finalStatus === 'Tạm Hoãn'
                  ? 'Nút thắt cổ chai'
                  : finalStatus === 'Dừng do Vật liệu' || finalStatus === 'Chờ Vật Tư'
                  ? 'Cần bổ sung vật tư'
                  : finalStatus === 'Dừng do Hết Plan'
                  ? 'Chờ kế hoạch'
                  : finalStatus === 'Dừng do Thiếu người' ||
                    finalStatus === 'Dừng Bảo dưỡng' ||
                    finalStatus === 'Dừng Vệ Sinh' ||
                    finalStatus === 'Dừng do Lỗi khác' ||
                    finalStatus === 'Đang Lắp Ráp' ||
                    finalStatus === 'Đang cài đặt' ||
                    finalStatus === 'Test Lại'
                  ? 'Chờ kiểm tra'
                  : finalStatus === 'Chạy thử'
                  ? 'Sắp hoàn thành'
                  : issueCount > 0
                  ? 'Cần theo dõi'
                  : 'Ổn định',
              healthTone:
                finalStatus === 'Dừng do Máy hỏng' ||
                finalStatus === 'Dừng do Lỗi thao tác' ||
                finalStatus === 'Dừng Chất lượng' ||
                finalStatus === 'Dừng do Sự cố điện' ||
                finalStatus === 'Tạm Hoãn'
                  ? 'rose'
                  : finalStatus === 'Dừng do Vật liệu' ||
                    finalStatus === 'Dừng do Thiếu người' ||
                    finalStatus === 'Dừng Bảo dưỡng' ||
                    finalStatus === 'Dừng Vệ Sinh' ||
                    finalStatus === 'Dừng do Lỗi khác' ||
                    finalStatus === 'Dừng do Hết Plan' ||
                    finalStatus === 'Chờ Vật Tư' ||
                    finalStatus === 'Đang Lắp Ráp' ||
                    finalStatus === 'Đang cài đặt' ||
                    finalStatus === 'Test Lại' ||
                    issueCount > 1
                  ? 'amber'
                  : 'emerald',
              leader,
              updatedAt: formatLineTimestamp(),
            });
            onClose();
          }}
        >
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-blue-800 flex items-center justify-between">
            <div>
              <span className="font-bold block">
                Hệ thống tự động liên kết: Trung tâm KHV → {lineName}
              </span>
              <span className="text-[11px] text-slate-600">
                Được cấp quyền bởi quản trị viên hệ thống (Admin)
              </span>
            </div>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-600 text-white">
              {lineName}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tên Dây Chuyền *</label>
              <input
                required
                type="text"
                value={lineName}
                onChange={(e) => setLineName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Công đoạn / Quy trình *
              </label>
              <select
                value={stage}
                onChange={(e) => setStage(e.target.value)}
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white"
              >
                <option value="Final Inspection & QA">Final Inspection &amp; QA</option>
                <option value="Burn-in Test">Burn-in Test &amp; Lão Hóa</option>
                <option value="Coating & Potting">Phủ Keo Bảo Vệ (Coating)</option>
                <option value="Sub-assembly">Lắp ráp cụm phụ (Sub-assembly)</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tiến độ ban đầu (%)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={progress}
                onChange={(e) => setProgress(Math.min(100, Math.max(0, Number(e.target.value) || 0)))}
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 tabular-nums"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Số lượng Issue ban đầu
              </label>
              <input
                type="number"
                min={0}
                value={issueCount}
                onChange={(e) => setIssueCount(Math.max(0, Number(e.target.value) || 0))}
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 tabular-nums"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1.5">
                Đặc Tính Line *
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setCharacteristic('new');
                    if (!NEW_LINE_STATUSES.includes(statusLabel)) {
                      setStatusLabel('Đang Lắp Ráp');
                    }
                  }}
                  className={`px-3 py-2 rounded-lg border text-left cursor-pointer transition ${
                    characteristic === 'new'
                      ? 'border-violet-500 bg-violet-50 text-violet-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">New · Test model mới</span>
                  <span className="text-[10px] opacity-80">Line đang test thử model mới</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCharacteristic('mas');
                    if (!MASS_LINE_STATUSES.includes(statusLabel)) {
                      setStatusLabel(issueCount > 0 ? 'Dừng do Máy hỏng' : 'Đang sản xuất');
                    }
                  }}
                  className={`px-3 py-2 rounded-lg border text-left cursor-pointer transition ${
                    characteristic === 'mas'
                      ? 'border-sky-500 bg-sky-50 text-sky-950 font-bold'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <span className="block font-bold">Mass · SX hàng loạt</span>
                  <span className="text-[10px] opacity-80">Đã đi vào sản xuất hàng loạt</span>
                </button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Trạng thái vận hành *
              </label>
              <select
                value={statusLabel}
                onChange={(e) => {
                  const next = e.target.value as LineHealthStatus;
                  setStatusLabel(next);
                  if (characteristic === 'mas' && isMassStopIssueStatus(next) && issueCount === 0) {
                    setIssueCount(1);
                  }
                }}
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white font-semibold"
              >
                {(characteristic === 'mas' ? MASS_LINE_STATUSES : NEW_LINE_STATUSES).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              {characteristic === 'mas' && isMassStopIssueStatus(statusLabel) && (
                <p className="text-[10px] text-rose-700 font-semibold mt-1">
                  Trạng thái dừng máy trên Line Mass sẽ tự động ghi nhận vào Issue.
                </p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Kỹ sư / Line Leader phụ trách *
              </label>
              <input
                required
                type="text"
                value={leader}
                onChange={(e) => setLeader(e.target.value)}
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Lưu &amp; Khởi Tạo Dây Chuyền</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
