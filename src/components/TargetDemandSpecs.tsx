import {
  ChevronDown,
  ChevronUp,
  CloudUpload,
  Download,
  Edit3,
  Eye,
  History,
  Lock,
  LockOpen,
  ShieldCheck,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { PipelineItem } from '../types/production';

interface TargetDemandSpecsProps {
  items: PipelineItem[];
  isAdminMode: boolean;
  onRequestAdminAuth: () => void;
  onExitAdminMode: () => void;
  onSaveDemands: (updatedTargets: Record<string, number>) => void;
  onOpenAuditHistory: () => void;
  onOpenUploadDemand: () => void;
  onDownloadTemplate: () => void;
  onExportSpecs: () => void;
}

export function TargetDemandSpecs({
  items,
  isAdminMode,
  onRequestAdminAuth,
  onExitAdminMode,
  onSaveDemands,
  onOpenAuditHistory,
  onOpenUploadDemand,
  onDownloadTemplate,
  onExportSpecs,
}: TargetDemandSpecsProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftTargets, setDraftTargets] = useState<Record<string, number>>({});

  useEffect(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => {
      map[it.itemNo] = it.targetDemand;
    });
    setDraftTargets(map);
  }, [items]);

  const totalTarget = items.reduce((acc, it) => acc + it.targetDemand, 0);

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Accordion Header */}
      <div
        onClick={() => setIsExpanded((prev) => !prev)}
        className="p-5 cursor-pointer hover:bg-slate-50/80 transition select-none flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-bold text-slate-900 leading-tight">
                Tiêu chuẩn Line (Target Demand Specs)
              </h2>
              <span className="text-xs font-semibold text-blue-700">
                · 1, Form Upload demand cho admin
              </span>
              <span className="text-xs text-slate-500">
                · {isExpanded ? 'Đang mở rộng' : 'Mặc định thu gọn'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap tabular-nums">
              <span>Quy định định mức mục tiêu cho từng Item trên dây chuyền</span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-700">
                <strong className="text-blue-700">{items.length}</strong> Items (A1 - A{items.length})
              </span>
              <span className="text-slate-300">·</span>
              <span className="font-semibold text-slate-700">
                Tổng Target: <strong className="text-blue-700">{totalTarget}</strong> đơn vị
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDownloadTemplate();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white border border-emerald-200 transition whitespace-nowrap cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Tải file mẫu Excel (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded((prev) => !prev);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition whitespace-nowrap cursor-pointer"
          >
            <span>{isExpanded ? 'Thu gọn bảng' : 'Xem chi tiết định mức'}</span>
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Collapsible Content */}
      {isExpanded && (
        <div className="border-t border-slate-200 p-6 max-w-4xl mx-auto space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <ShieldCheck className="w-5 h-5 text-blue-700" />
                <h3 className="text-base font-bold text-slate-900">
                  Chi tiết phân bổ Target Demand theo ca
                </h3>
                <span className="text-xs font-semibold text-blue-700">· Bảng chuẩn ISO 9001</span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Quy định định mức mục tiêu cho từng Item trên dây chuyền sản xuất (Luân chuyển dữ liệu thực ca)
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-100 border border-slate-200 text-xs text-slate-700 font-semibold">
                <Eye className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  Chế độ:{' '}
                  <strong className={isAdminMode ? 'text-blue-700' : 'text-slate-800'}>
                    {isAdminMode ? 'Admin (Có quyền sửa)' : 'User (Chỉ xem)'}
                  </strong>
                </span>
              </div>

              <button
                type="button"
                onClick={onOpenAuditHistory}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition cursor-pointer"
              >
                <History className="w-3.5 h-3.5 text-slate-600" />
                <span>Lịch sử sửa đổi</span>
              </button>

              <button
                type="button"
                onClick={onExportSpecs}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel</span>
              </button>

              <button
                type="button"
                onClick={isAdminMode ? onExitAdminMode : onRequestAdminAuth}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg text-white shadow-sm transition cursor-pointer ${
                  isAdminMode
                    ? 'bg-amber-500 hover:bg-amber-600'
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isAdminMode ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                <span>{isAdminMode ? 'Thoát quyền Admin' : 'Chỉnh sửa tiêu chuẩn (Admin)'}</span>
              </button>
            </div>
          </div>

          {isAdminMode && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-800">
              <div>
                <span className="font-bold inline-flex items-center gap-1">
                  <LockOpen className="w-3.5 h-3.5 text-amber-600" />
                  <span>Chế độ Admin Đang Bật: Bạn có quyền điều chỉnh trực tiếp Target Demand.</span>
                </span>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Mọi chỉnh sửa đều được lưu vào sổ nhật ký kiểm toán (Audit Trail).
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => onSaveDemands(draftTargets)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg shadow-sm cursor-pointer"
                >
                  Lưu thay đổi
                </button>
                <button
                  type="button"
                  onClick={onExitAdminMode}
                  className="px-3 py-1.5 bg-white border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 cursor-pointer"
                >
                  Thoát quyền
                </button>
              </div>
            </div>
          )}

          {/* Target Demand Table */}
          <div className="bg-white border border-slate-300 rounded-lg overflow-hidden shadow-sm">
            <div className="bg-slate-50 px-6 py-2.5 border-b border-slate-300 flex items-center justify-between text-xs">
              <span className="font-bold text-slate-700 uppercase">
                Bảng Định Mức Demand Dây Chuyền
              </span>
              <span className="text-slate-500 inline-flex items-center gap-1">
                {isAdminMode ? (
                  <Edit3 className="w-3.5 h-3.5 text-amber-600" />
                ) : (
                  <Lock className="w-3.5 h-3.5 text-slate-400" />
                )}
                <span>
                  {isAdminMode
                    ? 'Trạng thái: Cho phép chỉnh sửa (Admin Authorized)'
                    : 'Trạng thái: Khóa chỉnh sửa (User view)'}
                </span>
              </span>
            </div>

            <table className="w-full text-left text-sm border-collapse">
              <thead className="bg-slate-50 border-b border-slate-300 text-slate-700 font-bold uppercase text-xs">
                <tr>
                  <th className="py-3 px-6 border-r border-slate-300 w-1/4">Item No</th>
                  <th className="py-3 px-6 border-r border-slate-300 w-2/4">Tên Item</th>
                  <th className="py-3 px-6 text-right w-1/4">Target Demand</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
                {items.map((item) => (
                  <tr key={item.itemNo} className="hover:bg-slate-50">
                    <td className="py-2.5 px-6 border-r border-slate-200 font-semibold font-mono">
                      {item.itemNo}
                    </td>
                    <td className="py-2.5 px-6 border-r border-slate-200 font-medium text-slate-800">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-6 text-right font-bold text-slate-900">
                      <input
                        type="number"
                        min={1}
                        disabled={!isAdminMode}
                        value={draftTargets[item.itemNo] ?? item.targetDemand}
                        onChange={(e) =>
                          setDraftTargets((prev) => ({
                            ...prev,
                            [item.itemNo]: Math.max(0, Number(e.target.value) || 0),
                          }))
                        }
                        className={`text-right w-24 py-1 px-2 rounded font-bold tabular-nums focus:outline-none ${
                          isAdminMode
                            ? 'border border-blue-300 bg-blue-50/50 focus:border-blue-500 focus:bg-white'
                            : 'border border-transparent bg-transparent'
                        }`}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 pt-2">
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Bảo mật: Yêu cầu mật khẩu Admin và lý do điều chỉnh khi cập nhật.</span>
            </span>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onOpenUploadDemand}
                className="font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <CloudUpload className="w-4 h-4" />
                <span>Tải file Excel Demand lên (Ghi đè định mức)</span>
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="font-semibold text-slate-500 hover:text-slate-800 hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <ChevronUp className="w-4 h-4" />
                <span>Thu gọn lại</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
