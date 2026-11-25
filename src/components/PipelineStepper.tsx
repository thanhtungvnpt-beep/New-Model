import { AlertTriangle, Check, ClipboardCheck, Download, PlusSquare, SlidersHorizontal } from 'lucide-react';
import { useState } from 'react';
import { PipelineItem } from '../types/production';

interface PipelineStepperProps {
  items: PipelineItem[];
  onOpenPurchasing: (itemNo?: string) => void;
  onOpenVendorField: (itemNo?: string) => void;
  onOpenExportIssues: () => void;
  onOpenIssueDetail: (issueId: string) => void;
}

type PipelineFilterMode = 'all' | 'incomplete' | 'complete' | 'issues';
type StationFilterMode = 'all' | 'station12' | 'station3' | 'station4' | 'station5' | 'station6';

function getItemStation(item: PipelineItem): StationFilterMode {
  if (item.vendorInbound === 0) return 'station12';
  if (item.stagedOnLine <= 6 && item.lineTested <= 4 && item.vendorInbound <= 10) return 'station3';
  if (item.lineTested === 0 && item.vendorInbound > 0) return 'station4';
  if (item.lineTested < item.targetDemand && item.stagedOnLine < item.targetDemand) return 'station5';
  return 'station6';
}

function getBadgeClasses(color: PipelineItem['badgeColor']) {
  switch (color) {
    case 'indigo':
      return 'bg-indigo-100 text-indigo-700';
    case 'amber':
      return 'bg-amber-100 text-amber-700';
    case 'teal':
      return 'bg-teal-100 text-teal-700';
    case 'rose':
      return 'bg-rose-100 text-rose-700';
    default:
      return 'bg-blue-100 text-blue-700';
  }
}

export function PipelineStepper({
  items,
  onOpenPurchasing,
  onOpenVendorField,
  onOpenExportIssues,
  onOpenIssueDetail,
}: PipelineStepperProps) {
  const [filterMode, setFilterMode] = useState<PipelineFilterMode>('all');
  const [stationFilter, setStationFilter] = useState<StationFilterMode>('all');

  const issueItemsCount = items.filter((it) => Boolean(it.purchaseIssue.trim())).length;

  const filteredItems = items.filter((item) => {
    const isComplete = item.lineTested >= item.targetDemand;
    const hasIssue = Boolean(item.purchaseIssue.trim());

    if (filterMode === 'incomplete' && isComplete) return false;
    if (filterMode === 'complete' && !isComplete) return false;
    if (filterMode === 'issues' && !hasIssue) return false;

    if (stationFilter !== 'all' && getItemStation(item) !== stationFilter) return false;
    return true;
  });

  const runningCount = filteredItems.filter((it) => it.lineTested < it.targetDemand).length;
  const completedCount = filteredItems.filter((it) => it.lineTested >= it.targetDemand).length;

  return (
    <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-white flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-slate-900">
            Quy Trình Tiến Độ Chuỗi Cung Ứng &amp; Lắp Ráp Theo Hạng Mục
          </h2>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onOpenPurchasing()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-700 transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <PlusSquare className="w-3.5 h-3.5" />
              <span>Mở Form Nhập Liệu</span>
            </button>
            <button
              type="button"
              onClick={() => onOpenVendorField()}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 text-white border border-indigo-700 shadow-sm hover:bg-indigo-700 transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              <span>2, Form báo cáo nghiệp vụ hiện trường vendor (Nhân viên hiện trường)</span>
            </button>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="pt-3 border-t border-slate-100 flex flex-col xl:flex-row xl:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-slate-500 font-medium inline-flex items-center gap-1">
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
              <span>Chế độ hiển thị:</span>
            </span>

            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold flex-wrap gap-0.5">
              <button
                type="button"
                onClick={() => {
                  setFilterMode('all');
                  setStationFilter('all');
                }}
                className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                  filterMode === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tất cả Items (All)
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('incomplete');
                  setStationFilter('all');
                }}
                className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer ${
                  filterMode === 'incomplete'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Ưu tiên chưa hoàn thành
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('complete');
                  setStationFilter('all');
                }}
                className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer inline-flex items-center gap-1 ${
                  filterMode === 'complete'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Check className="w-3 h-3" />
                <span>Đã đạt Test</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setFilterMode('issues');
                  setStationFilter('all');
                }}
                className={`px-2.5 py-1 rounded-md transition whitespace-nowrap cursor-pointer inline-flex items-center gap-1.5 ${
                  filterMode === 'issues'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-rose-700 hover:bg-rose-50 bg-white border border-rose-200'
                }`}
              >
                <AlertTriangle className="w-3 h-3" />
                <span>Chỉ có sự cố</span>
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold tabular-nums ${
                    filterMode === 'issues' ? 'bg-white text-rose-700' : 'bg-rose-600 text-white'
                  }`}
                >
                  {issueItemsCount}
                </span>
              </button>
            </div>

            <button
              type="button"
              onClick={onOpenExportIssues}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-300 font-bold transition inline-flex items-center gap-1 shadow-sm whitespace-nowrap cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Xuất Excel Item Sự Cố (.xlsx)</span>
            </button>

            <div className="flex items-center gap-1.5">
              <span className="text-slate-500 font-medium">Trạm dừng:</span>
              <select
                aria-label="Lọc theo trạm dừng"
                value={stationFilter}
                onChange={(e) => setStationFilter(e.target.value as StationFilterMode)}
                className="text-xs rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="all">Tất cả các trạm</option>
                <option value="station12">Chưa nhập kho (Trạm 1-2)</option>
                <option value="station3">Đang ở kho (Trạm 3)</option>
                <option value="station4">Tại Vendor (Trạm 4)</option>
                <option value="station5">Đang set lên Line (Trạm 5)</option>
                <option value="station6">Chờ Line Test (Trạm 6)</option>
              </select>
            </div>
          </div>

          <div className="text-xs font-medium text-slate-600 self-start xl:self-auto tabular-nums">
            Đang chạy: <strong className="text-amber-700">{runningCount} items</strong>
            <span className="mx-2 text-slate-300">·</span>
            Đã xong: <strong className="text-emerald-700">{completedCount} items</strong>
          </div>
        </div>
      </div>

      {/* 6-Stage Header Legend */}
      <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 grid grid-cols-12 gap-4 items-center">
        <div className="col-span-12 lg:col-span-3">Hạng Mục &amp; Phân Loại</div>
        <div className="col-span-12 lg:col-span-9 hidden lg:grid grid-cols-6 text-center text-slate-700">
          <div className="flex flex-col items-center">
            <span className="font-bold text-blue-900">1. Số Lượng cần</span>
            <span className="text-[10px] text-slate-400 font-normal">Target Demand</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-blue-900">2. Mua Hàng</span>
            <span className="text-[10px] text-slate-400 font-normal">PO Procurement</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-blue-900">3. Đã có kho</span>
            <span className="text-[10px] text-slate-400 font-normal">
              Kho · Cải Tiến &amp; EDM
            </span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-blue-900">4. Nhập Vendor</span>
            <span className="text-[10px] text-slate-400 font-normal">Vendor Inbound / Cấp</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-blue-900">5. Set lên Line</span>
            <span className="text-[10px] text-slate-400 font-normal">Staging on Line</span>
          </div>
          <div className="flex flex-col items-center">
            <span className="font-bold text-blue-900">6. Line test</span>
            <span className="text-[10px] text-slate-400 font-normal">QA Line Testing / Đạt test</span>
          </div>
        </div>
      </div>

      {/* Item Rows */}
      <div className="divide-y divide-slate-200 max-h-[820px] overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500">
            Không có hạng mục nào khớp với bộ lọc hiện tại.
          </div>
        ) : (
          filteredItems.map((item) => {
            const hasPurchaseIssue = Boolean(item.purchaseIssue.trim());
            const isTestDone = item.lineTested >= item.targetDemand;
            const isVendorComplete = item.vendorInbound >= item.targetDemand;
            const isStageComplete = item.stagedOnLine >= item.targetDemand;

            return (
              <div
                key={item.itemNo}
                onClick={() => onOpenPurchasing(item.itemNo)}
                className="p-4 hover:bg-slate-50/80 transition cursor-pointer group"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  {/* Item Info */}
                  <div className="col-span-12 lg:col-span-3">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 group-hover:scale-105 transition shadow-sm ${getBadgeClasses(
                          item.badgeColor
                        )}`}
                      >
                        {item.itemNo}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition">
                            Item {item.itemNo} - {item.name}
                          </h3>
                          <span className="text-[11px] font-medium text-blue-700 tabular-nums">
                            Mua: {item.toBuy} / Kho: {item.inWarehouse}
                          </span>
                          {hasPurchaseIssue && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (item.linkedIssueId) {
                                  onOpenIssueDetail(item.linkedIssueId);
                                }
                              }}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] bg-rose-100 text-rose-700 border border-rose-300 font-bold hover:bg-rose-600 hover:text-white transition cursor-pointer"
                            >
                              <AlertTriangle className="w-3 h-3" />
                              <span>1 Issue: {item.purchaseIssue}</span>
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Nhấp để xem/sửa biểu mẫu mua hàng
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* 6-stage Pipeline Nodes */}
                  <div className="col-span-12 lg:col-span-9">
                    <div className="grid grid-cols-6 gap-2 text-center relative">
                      <div
                        className="absolute top-5 -translate-y-1/2 z-0 flex items-center pointer-events-none"
                        style={{ left: '8.333%', right: '8.333%' }}
                      >
                        <div className="w-full border-t-2 border-dashed border-blue-300 relative h-0">
                          <div className="pipeline-light-wave absolute -top-[4px] w-10 h-2 rounded-full bg-gradient-to-r from-transparent via-blue-400 to-white shadow-sm -translate-x-1/2" />
                        </div>
                      </div>

                      {/* 1. Target */}
                      <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm tabular-nums">
                          {item.targetDemand}
                        </div>
                        <span className="text-[10px] text-blue-700 font-bold mt-1 tabular-nums">
                          Target {item.targetDemand}
                        </span>
                      </div>

                      {/* 2. Mua Hàng */}
                      <div className="flex flex-col items-center relative z-10">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-sm ring-2 ring-blue-200 tabular-nums">
                          {item.toBuy}
                        </div>
                        {item.itemNo === 'A1' && hasPurchaseIssue ? (
                          <span className="text-[10px] text-rose-600 font-bold mt-1">Issue!</span>
                        ) : (
                          <span className="text-[10px] text-blue-700 font-bold mt-1 tabular-nums">
                            Cần mua {item.toBuy}
                          </span>
                        )}
                      </div>

                      {/* 3. Đã có kho */}
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full text-white font-bold text-xs flex items-center justify-center shadow-sm tabular-nums ${
                            item.itemNo === 'A6' || item.itemNo === 'A7' || item.itemNo === 'A8'
                              ? 'bg-amber-500'
                              : 'bg-blue-600'
                          }`}
                        >
                          {item.inWarehouse}
                        </div>
                        <span
                          className={`text-[10px] font-semibold mt-1 tabular-nums ${
                            item.itemNo === 'A6' || item.itemNo === 'A7' || item.itemNo === 'A8'
                              ? 'text-amber-700'
                              : 'text-emerald-600'
                          }`}
                        >
                          Về kho {item.inWarehouse}
                        </span>
                        <div className="mt-1 flex items-center justify-center gap-1 flex-wrap">
                          <span
                            title="Số lượng đang xử lý Cải Tiến tại kho"
                            className="px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-[9px] font-bold text-amber-800 tabular-nums whitespace-nowrap"
                          >
                            Cải Tiến: {item.warehouseImprovement ?? 0}
                          </span>
                          <span
                            title="Số lượng đang gia công EDM tại kho"
                            className="px-1.5 py-0.5 rounded bg-cyan-50 border border-cyan-200 text-[9px] font-bold text-cyan-800 tabular-nums whitespace-nowrap"
                          >
                            EDM: {item.warehouseEdm ?? 0}
                          </span>
                        </div>
                      </div>

                      {/* 4. Nhập Vendor */}
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shadow-sm tabular-nums ${
                            item.vendorInbound === 0 || (item.itemNo === 'A7' && item.vendorInbound < 10)
                              ? 'bg-slate-200 text-slate-500'
                              : isVendorComplete && item.itemNo !== 'A5'
                              ? 'bg-blue-600 text-white'
                              : 'bg-amber-500 text-white'
                          }`}
                        >
                          {item.vendorInbound}
                        </div>
                        <span
                          className={`text-[10px] font-semibold mt-1 tabular-nums ${
                            item.vendorInbound === 0
                              ? 'text-slate-400'
                              : isVendorComplete && item.itemNo !== 'A5'
                              ? 'text-emerald-600'
                              : 'text-amber-700'
                          }`}
                        >
                          {item.vendorInbound === 0 ? 'Chưa cấp' : `Vendor ${item.vendorInbound}`}
                        </span>
                      </div>

                      {/* 5. Set lên Line */}
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shadow-sm tabular-nums ${
                            item.stagedOnLine === 0 || item.stagedOnLine < 10
                              ? 'bg-slate-200 text-slate-500'
                              : isStageComplete
                              ? 'bg-blue-600 text-white'
                              : 'bg-teal-600 text-white'
                          }`}
                        >
                          {item.stagedOnLine}
                        </div>
                        <span
                          className={`text-[10px] font-semibold mt-1 tabular-nums ${
                            item.stagedOnLine === 0
                              ? 'text-slate-400'
                              : item.stagedOnLine < 10
                              ? 'text-slate-500'
                              : 'text-teal-700'
                          }`}
                        >
                          {item.stagedOnLine === 0 ? 'Chờ Line' : `Line ${item.stagedOnLine}`}
                        </span>
                      </div>

                      {/* 6. Line Test */}
                      <div className="flex flex-col items-center relative z-10">
                        <div
                          className={`w-10 h-10 rounded-full font-bold text-xs flex items-center justify-center shadow-sm tabular-nums ${
                            isTestDone
                              ? 'bg-emerald-600 text-white ring-2 ring-emerald-500/20'
                              : item.itemNo === 'A4'
                              ? 'bg-teal-600 text-white ring-2 ring-teal-500/20'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {item.lineTested}
                        </div>
                        <span
                          className={`text-[10px] font-bold mt-1 tabular-nums ${
                            isTestDone
                              ? 'text-emerald-700'
                              : item.itemNo === 'A4'
                              ? 'text-teal-700'
                              : 'text-slate-400'
                          }`}
                        >
                          {item.lineTested === 0
                            ? item.vendorInbound === 0
                              ? 'Chưa test'
                              : 'Chờ test'
                            : isTestDone
                            ? `Test ${item.lineTested}`
                            : `Test ${item.lineTested}/${item.targetDemand}`}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}
