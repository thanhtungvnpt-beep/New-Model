import {
  AlertTriangle,
  BellRing,
  CheckCircle2,
  ClipboardCheck,
  ClipboardList,
  Download,
  FileEdit,
  PackageCheck,
  ShoppingCart,
  TrendingUp,
} from 'lucide-react';
import { IssueItem, OperationTab, PipelineItem, ProductionLine } from '../types/production';

interface KpiAndToolbarProps {
  lines: ProductionLine[];
  issues: IssueItem[];
  pipelineItems: PipelineItem[];
  onOpenPurchasing: () => void;
  onOpenOperationModal: (tab: OperationTab) => void;
  onOpenVendorField: () => void;
  onDownloadTemplates: () => void;
  onOpenAlertModal: () => void;
  onOpenSupplyChainScreen?: () => void;
}

export function KpiAndToolbar({
  lines,
  issues,
  pipelineItems,
  onOpenPurchasing,
  onOpenOperationModal,
  onOpenVendorField,
  onDownloadTemplates,
  onOpenAlertModal,
  onOpenSupplyChainScreen,
}: KpiAndToolbarProps) {
  const avgProgress =
    lines.length > 0
      ? (lines.reduce((acc, l) => acc + l.vtPercent, 0) / lines.length).toFixed(1)
      : '76.4';
  const highCount = issues.filter((i) => i.severity === 'high').length;
  const totalTarget = pipelineItems.reduce((acc, item) => acc + item.targetDemand, 0);
  const totalTested = pipelineItems.reduce((acc, item) => acc + item.lineTested, 0);
  const outputPercent = totalTarget > 0 ? ((totalTested / totalTarget) * 100).toFixed(1) : '83.3';

  return (
    <>
      {/* Operation Forms Toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 flex items-center justify-center shrink-0">
            <FileEdit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-slate-900 leading-tight">
                Thao Tác Nghiệp Vụ Trực Tiếp (Business Operation Forms)
              </h2>
              <span className="text-xs font-medium text-emerald-700">· 6 Biểu Mẫu Chuẩn</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={onOpenPurchasing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Mua hàng (PO)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenOperationModal('warehouse')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 hover:bg-amber-500 text-amber-700 hover:text-white border border-amber-200 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PackageCheck className="w-3.5 h-3.5" />
            <span>Nhập kho &amp; Kiểm kê</span>
          </button>

          <button
            type="button"
            onClick={onOpenVendorField}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white border border-indigo-600 transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ClipboardCheck className="w-3.5 h-3.5" />
            <span>2, Form báo cáo nghiệp vụ hiện trường vendor (Field Staff)</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenOperationModal('issue')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Báo Sự cố</span>
          </button>

          <button
            type="button"
            onClick={onDownloadTemplates}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Tải Bộ Biểu Mẫu Mẫu (.xlsx)</span>
          </button>

          <button
            type="button"
            onClick={onOpenAlertModal}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-700 text-white border border-blue-700 transition shadow-sm whitespace-nowrap shrink-0 cursor-pointer"
          >
            <BellRing className="w-3.5 h-3.5 text-amber-300" />
            <span>Gửi thông báo Email / Zalo</span>
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Tổng tiến độ dự án</span>
            <span className="p-1.5 rounded-md bg-blue-50 text-blue-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">{avgProgress}%</span>
            <span className="text-xs font-semibold text-emerald-700">+4.2% so với tuần trước</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Number(avgProgress))}%` }}
            />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Dây chuyền đang chạy</span>
            <span className="p-1.5 rounded-md bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {lines.length} / {lines.length}{' '}
              <span className="text-xs font-normal text-slate-500">Lines</span>
            </span>
            <span className="text-xs font-medium text-slate-600">Hoạt động 100%</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">
            Line 1 - Line {lines.length} đang hoạt động đồng bộ
          </p>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Sự cố đang xử lý (Open Issues)</span>
            <span className="p-1.5 rounded-md bg-amber-50 text-amber-600">
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-amber-600 tabular-nums">
              {issues.length} <span className="text-xs font-normal text-slate-500">Issues</span>
            </span>
            <span className="text-xs font-semibold text-rose-600">{highCount} High Priority</span>
          </div>
          <p className="text-xs text-slate-500 mt-3">Tập trung nhiều nhất tại Line 3 &amp; Line 5</p>
        </div>

        {/* Card 4 */}
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500">Hoàn thành mục tiêu chặng</span>
            {onOpenSupplyChainScreen ? (
              <button
                type="button"
                onClick={onOpenSupplyChainScreen}
                className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
              >
                Mở màn hình Chuỗi cung ứng →
              </button>
            ) : (
              <span className="p-1.5 rounded-md bg-indigo-50 text-indigo-600">
                <ClipboardList className="w-4 h-4" />
              </span>
            )}
          </div>
          <div className="flex items-baseline justify-between gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {totalTested} / {totalTarget}
            </span>
            <span className="text-xs font-semibold text-emerald-700 tabular-nums">
              {outputPercent}% Output
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-3 overflow-hidden">
            <div
              className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Number(outputPercent))}%` }}
            />
          </div>
        </div>
      </section>
    </>
  );
}
