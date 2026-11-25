import { AlertTriangle, CheckCircle2, ClipboardEdit, Clock, Lock, LockOpen, PlusCircle, UserCheck } from 'lucide-react';
import {
  addDaysToIso,
  diffDaysIso,
  formatViDateShort,
  getTodayIsoDate,
  isLineCompleted,
} from '../data/initialData';
import { ProductionLine } from '../types/production';

interface LineNetworkDiagramProps {
  lines: ProductionLine[];
  selectedLineFilter: string;
  isAdminMode: boolean;
  onQuickReportLine: (lineId: string) => void;
  onInspectLineIssues: (target: string) => void;
  onAdminEditLine: () => void;
  onClearLineFilter: () => void;
  onOpenAddLine: () => void;
}

export function LineNetworkDiagram({
  lines,
  selectedLineFilter,
  isAdminMode,
  onQuickReportLine,
  onInspectLineIssues,
  onAdminEditLine,
  onClearLineFilter,
  onOpenAddLine,
}: LineNetworkDiagramProps) {
  const avgVtNum =
    lines.length > 0 ? lines.reduce((acc, l) => acc + l.vtPercent, 0) / lines.length : 76.4;
  const avgVt = avgVtNum.toFixed(1);
  const totalLineIssues = lines.reduce((acc, l) => acc + l.issueCount, 0);

  const firstRow = lines.slice(0, 5);
  const remainingRows = lines.slice(5);

  const getLineTheme = (line: ProductionLine) => {
    if (
      line.statusLabel === 'Dừng do Máy hỏng' ||
      line.statusLabel === 'Dừng do Lỗi thao tác' ||
      line.statusLabel === 'Dừng Chất lượng' ||
      line.statusLabel === 'Dừng do Sự cố điện' ||
      line.statusLabel === 'Tạm Hoãn' ||
      line.healthTone === 'rose'
    ) {
      return {
        cardFrame:
          'border-rose-500 bg-white shadow-[0_0_15px_rgba(244,63,94,0.35)] hover:shadow-[0_0_22px_rgba(244,63,94,0.55)] hover:border-rose-600',
        circleBg: 'from-rose-500 to-red-600 shadow-[0_0_12px_rgba(244,63,94,0.4)]',
        subtitleText: 'text-rose-100',
        statusColor: 'text-rose-700',
        dotColor: 'bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]',
      };
    }

    if (isLineCompleted(line)) {
      return {
        cardFrame:
          'border-emerald-400 bg-white shadow-[0_0_15px_rgba(16,185,129,0.32)] hover:shadow-[0_0_22px_rgba(16,185,129,0.52)] hover:border-emerald-500',
        circleBg: 'from-emerald-500 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
        subtitleText: 'text-emerald-100',
        statusColor: 'text-emerald-700',
        dotColor: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]',
      };
    }

    if (
      line.healthTone === 'amber' ||
      line.statusLabel === 'Dừng do Vật liệu' ||
      line.statusLabel === 'Dừng do Thiếu người' ||
      line.statusLabel === 'Dừng Bảo dưỡng' ||
      line.statusLabel === 'Dừng Vệ Sinh' ||
      line.statusLabel === 'Dừng do Lỗi khác' ||
      line.statusLabel === 'Dừng do Hết Plan' ||
      line.statusLabel === 'Chờ Vật Tư' ||
      line.statusLabel === 'Đang Lắp Ráp' ||
      line.statusLabel === 'Đang cài đặt' ||
      line.statusLabel === 'Test Lại'
    ) {
      return {
        cardFrame:
          'border-amber-400 bg-white shadow-[0_0_15px_rgba(245,158,11,0.34)] hover:shadow-[0_0_22px_rgba(245,158,11,0.55)] hover:border-amber-500',
        circleBg: 'from-amber-500 to-orange-500 shadow-[0_0_12px_rgba(245,158,11,0.4)]',
        subtitleText: 'text-amber-50',
        statusColor: 'text-amber-700',
        dotColor: 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.8)]',
      };
    }

    if (line.statusLabel === 'Chạy thử') {
      return {
        cardFrame:
          'border-cyan-400 bg-white shadow-[0_0_15px_rgba(6,182,212,0.32)] hover:shadow-[0_0_22px_rgba(6,182,212,0.52)] hover:border-cyan-500',
        circleBg: 'from-cyan-500 to-blue-600 shadow-[0_0_12px_rgba(6,182,212,0.4)]',
        subtitleText: 'text-cyan-100',
        statusColor: 'text-cyan-700',
        dotColor: 'bg-cyan-500 shadow-[0_0_6px_rgba(6,182,212,0.8)]',
      };
    }

    return {
      cardFrame:
        'border-emerald-400 bg-white shadow-[0_0_15px_rgba(16,185,129,0.32)] hover:shadow-[0_0_22px_rgba(16,185,129,0.52)] hover:border-emerald-500',
      circleBg: 'from-emerald-500 to-emerald-600 shadow-[0_0_12px_rgba(16,185,129,0.4)]',
      subtitleText: 'text-emerald-100',
      statusColor: 'text-emerald-700',
      dotColor: 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)]',
    };
  };

  const getVtBadgeTheme = (percent: number) => {
    if (percent >= 80) {
      return {
        box: 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-[0_0_8px_rgba(16,185,129,0.22)]',
        label: 'text-emerald-700',
        value: 'text-emerald-950',
      };
    }
    if (percent >= 50) {
      return {
        box: 'bg-amber-50 border-amber-500 text-amber-950 shadow-[0_0_8px_rgba(245,158,11,0.22)]',
        label: 'text-amber-700',
        value: 'text-amber-950',
      };
    }
    return {
      box: 'bg-rose-50 border-rose-500 text-rose-950 shadow-[0_0_8px_rgba(244,63,94,0.25)]',
      label: 'text-rose-700',
      value: 'text-rose-900',
    };
  };

  const getIssueBadgeTheme = (count: number, isHub = false) => {
    if (count === 0) {
      return {
        box: 'bg-slate-50 border-slate-300 text-slate-700',
        label: 'text-slate-500',
        value: 'text-slate-800',
      };
    }
    if ((!isHub && count === 1) || (isHub && count <= 4)) {
      return {
        box: 'bg-amber-100 border-amber-500 text-amber-950 shadow-[0_0_8px_rgba(245,158,11,0.25)]',
        label: 'text-amber-800',
        value: 'text-amber-950',
      };
    }
    return {
      box: 'bg-rose-600 border-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.45)]',
      label: 'text-rose-100',
      value: 'text-white',
    };
  };

  const hubVtTheme = getVtBadgeTheme(avgVtNum);
  const hubIssueTheme = getIssueBadgeTheme(totalLineIssues, true);

  const renderLineNode = (line: ProductionLine) => {
    const isSelected = selectedLineFilter === line.name;
    const theme = getLineTheme(line);
    const vtTheme = getVtBadgeTheme(line.vtPercent);
    const issueTheme = getIssueBadgeTheme(line.issueCount);

    return (
      <div
        key={line.id}
        role="button"
        tabIndex={0}
        onClick={() => onQuickReportLine(line.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onQuickReportLine(line.id);
          }
        }}
        className={`group relative z-10 flex flex-col items-center px-2.5 pt-7 pb-3 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 ${
          theme.cardFrame
        } ${
          isSelected
            ? 'ring-2 ring-blue-600 ring-offset-2 ring-offset-white scale-[1.03]'
            : 'hover:-translate-y-0.5'
        }`}
        title={`${line.stage} (${line.healthBadge}) — Nhấp thẻ để báo cáo nhanh, hoặc nhấp vào ô Issue để xem chi tiết vấn đề`}
      >
        <span
          title={
            line.characteristic === 'new'
              ? 'Đặc tính Line: New — Line đang test thử model mới'
              : 'Đặc tính Line: Mass — Đã đi vào sản xuất hàng loạt'
          }
          className={`absolute top-1.5 left-1.5 z-30 inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md border text-[9px] font-extrabold leading-none whitespace-nowrap shadow-xs ${
            line.characteristic === 'new'
              ? 'bg-violet-100 border-violet-300 text-violet-800'
              : 'bg-sky-100 border-sky-300 text-sky-800'
          }`}
        >
          <span
            className={`w-1.5 h-1.5 rounded-full ${
              line.characteristic === 'new' ? 'bg-violet-600' : 'bg-sky-600'
            }`}
          />
          <span className="uppercase tracking-wide">
            {line.characteristic === 'new' ? 'New · Test' : 'Mass'}
          </span>
        </span>
        <div className="flex items-center justify-center gap-1.5 h-9 -mb-1.5 z-20">
          <div
            className={`min-w-[48px] px-1.5 h-8 rounded-lg border-[1.5px] flex flex-col items-center justify-center gap-0.5 transition-colors ${vtTheme.box}`}
          >
            <span className={`text-[8px] font-bold leading-none whitespace-nowrap ${vtTheme.label}`}>
              Vật Tư
            </span>
            <span className={`text-[10px] font-extrabold leading-none tabular-nums ${vtTheme.value}`}>
              {line.vtPercent}%
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onInspectLineIssues(line.id);
            }}
            title={`Nhấp để xem chi tiết vấn đề của ${line.name} (${line.issueCount} Issue)`}
            className={`min-w-[44px] px-1.5 h-8 rounded-lg border-[1.5px] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer hover:scale-105 hover:ring-2 hover:ring-rose-400/70 focus-visible:outline-2 focus-visible:outline-rose-600 ${issueTheme.box}`}
          >
            <span className={`text-[8px] font-bold leading-none whitespace-nowrap ${issueTheme.label}`}>
              Issue
            </span>
            <span
              className={`text-[10px] font-extrabold leading-none tabular-nums ${issueTheme.value}`}
            >
              {line.issueCount}
            </span>
          </button>
        </div>
        <div
          className={`w-16 h-16 rounded-full bg-gradient-to-br text-white flex flex-col items-center justify-center border-2 border-white shrink-0 group-hover:scale-105 transition-all ${theme.circleBg}`}
        >
          <span className="text-xs font-bold leading-tight truncate max-w-[56px]">{line.name}</span>
          <span
            className={`text-[9px] font-medium px-1 text-center truncate max-w-[56px] ${theme.subtitleText}`}
          >
            {line.shortStage}
          </span>
        </div>
        <div className="mt-2 flex flex-col items-center text-center w-full">
          <span
            className={`inline-flex items-center gap-1.5 text-[10px] font-semibold whitespace-nowrap ${theme.statusColor}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${theme.dotColor}`} />
            <span>{line.statusLabel}</span>
          </span>
          <span
            className="mt-0.5 inline-flex items-center justify-center gap-1 text-[9.5px] font-medium text-slate-600 max-w-full"
            title={`Line Leader phụ trách: ${line.leader}`}
          >
            <UserCheck className="w-2.5 h-2.5 shrink-0 text-blue-600" />
            <span className="truncate">{line.leader}</span>
          </span>
          {(() => {
            const isMassLine = line.characteristic === 'mas';
            const isSetupDone = isMassLine || line.statusLabel === 'Mass Ready';
            const completed = isSetupDone || isLineCompleted(line);
            if (completed) {
              return (
                <div
                  className="mt-1.5 w-full rounded-lg bg-emerald-50 border border-emerald-300 px-2 py-1.5 text-[9.5px] leading-tight"
                  title={
                    isMassLine
                      ? 'Line đã chuyển sang Mass — Setup hoàn thành'
                      : isSetupDone
                      ? 'New model — Mass Ready (Setup hoàn thành)'
                      : 'Line đã hoàn thành'
                  }
                >
                  <div className="flex items-center justify-center gap-1 text-emerald-700 font-bold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span className="whitespace-nowrap">
                      {isSetupDone ? 'Setup hoàn thành' : 'Hoàn thành'}
                    </span>
                  </div>
                  <div className="mt-1 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.45)]" />
                </div>
              );
            }

            const today = getTodayIsoDate();
            const cur = line.setupTimeline?.currentDate || today;
            const target = line.setupTimeline?.targetDate || addDaysToIso(today, 3);
            const expected = line.setupTimeline?.expectedDate || addDaysToIso(today, 5);
            const delayDays = diffDaysIso(target, expected);
            const isLate = delayDays > 0;

            const toMs = (iso: string) => {
              const [y, m, d] = iso.split('-').map(Number);
              return Date.UTC(y || 2026, (m || 1) - 1, d || 1);
            };

            const rawNodes = [
              {
                key: 'cur' as const,
                order: 1,
                shortLabel: 'Nay',
                date: cur,
                ms: toMs(cur),
                textClass: 'text-blue-600',
                dotClass: 'bg-blue-600',
              },
              {
                key: 'target' as const,
                order: 2,
                shortLabel: 'Cần',
                date: target,
                ms: toMs(target),
                textClass: 'text-emerald-700',
                dotClass: 'bg-emerald-600',
              },
              {
                key: 'expected' as const,
                order: 3,
                shortLabel: 'Dự kiến',
                date: expected,
                ms: toMs(expected),
                textClass: isLate ? 'text-rose-600' : 'text-amber-600',
                dotClass: isLate ? 'bg-rose-600' : 'bg-amber-500',
              },
            ];

            const minMs = Math.min(...rawNodes.map((n) => n.ms));
            const maxMs = Math.max(...rawNodes.map((n) => n.ms));
            const spanMs = Math.max(maxMs - minMs, 86400000);

            const sortedNodes = [...rawNodes]
              .sort((a, b) => (a.ms !== b.ms ? a.ms - b.ms : a.order - b.order))
              .map((n, idx) => ({
                ...n,
                pct:
                  maxMs === minMs
                    ? 14 + idx * 36
                    : Math.min(92, Math.max(8, 10 + ((n.ms - minMs) / spanMs) * 80)),
              }));

            const curPct = sortedNodes.find((n) => n.key === 'cur')?.pct ?? 10;
            const tarPct = sortedNodes.find((n) => n.key === 'target')?.pct ?? 50;
            const expPct = sortedNodes.find((n) => n.key === 'expected')?.pct ?? 90;
            const onPlanEnd = isLate ? tarPct : expPct;
            const onPlanLeft = Math.min(curPct, onPlanEnd);
            const onPlanWidth = Math.abs(onPlanEnd - curPct);
            const lateLeft = Math.min(tarPct, expPct);
            const lateWidth = isLate ? Math.abs(expPct - tarPct) : 0;

            return (
              <div
                className={`mt-1.5 w-full rounded-lg border px-1.5 py-1.5 text-[8.5px] leading-tight ${
                  isLate
                    ? 'bg-rose-50/75 border-rose-300'
                    : 'bg-slate-50 border-slate-200'
                }`}
                title={`Hiện tại: ${formatViDateShort(cur)} · Cần HT: ${formatViDateShort(target)} · Dự kiến: ${formatViDateShort(expected)}${isLate ? ` (Cảnh báo trễ +${delayDays} ngày)` : ''}`}
              >
                {isLate && (
                  <div className="mb-1 flex items-center justify-center gap-1 rounded bg-rose-600 px-1.5 py-0.5 text-[8px] font-extrabold text-white shadow-xs">
                    <AlertTriangle className="w-2.5 h-2.5 shrink-0" />
                    <span className="whitespace-nowrap">Cảnh báo trễ +{delayDays} ngày</span>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-0.5 text-[7.5px] text-slate-500 font-medium text-center">
                  {sortedNodes.map((n) => (
                    <span key={n.key} className="whitespace-nowrap">
                      {n.shortLabel}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-0.5 font-bold tabular-nums mt-0.5 text-center">
                  {sortedNodes.map((n) => (
                    <span key={n.key} className={n.textClass}>
                      {formatViDateShort(n.date)}
                    </span>
                  ))}
                </div>
                <div className="mt-1 h-1.5 rounded-full bg-slate-200 relative">
                  <div
                    className="absolute inset-y-0 left-0 rounded-l-full bg-blue-500/80"
                    style={{ width: `${curPct}%` }}
                  />
                  {onPlanWidth > 0 && (
                    <div
                      className="absolute inset-y-0 bg-emerald-500/75"
                      style={{ left: `${onPlanLeft}%`, width: `${onPlanWidth}%` }}
                    />
                  )}
                  {isLate && lateWidth > 0 && (
                    <div
                      className="absolute inset-y-0 rounded-r-full bg-rose-500"
                      style={{ left: `${lateLeft}%`, width: `${lateWidth}%` }}
                    />
                  )}
                  {sortedNodes.map((n) => (
                    <span
                      key={n.key}
                      className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2 h-2 rounded-full border border-white ${n.dotClass}`}
                      style={{ left: `${n.pct}%` }}
                    />
                  ))}
                </div>
              </div>
            );
          })()}
          <span
            className="mt-1.5 inline-flex items-center justify-center gap-1 text-[9.5px] font-medium text-slate-500 tabular-nums whitespace-nowrap"
            title={`Cập nhật gần nhất: ${line.updatedAt || 'Chưa có'}`}
          >
            <Clock className="w-2.5 h-2.5 shrink-0 text-slate-400" />
            <span>Cập nhật: {line.updatedAt || '--:--'}</span>
          </span>
          <span className="text-[9.5px] text-slate-500 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity leading-none">
            {isAdminMode ? 'Sửa & Báo cáo' : 'Báo cáo nhanh'}
          </span>
        </div>
      </div>
    );
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between pb-5 border-b border-slate-100 gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Sơ Đồ Tiến Độ Dây Chuyền Sản Xuất (Line Progress &amp; Issues)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mô phỏng luồng điều phối từ Trung tâm Kế hoạch Vận hành (KHV) đến {lines.length} dây chuyền sản xuất chính · Viền neon &amp; màu sắc tự động đồng bộ theo tình trạng Line, % Vật Tư và Issue
          </p>
        </div>

        <div className="flex items-center gap-2.5 text-xs flex-wrap">
          {selectedLineFilter !== 'all' && (
            <button
              type="button"
              onClick={onClearLineFilter}
              className="px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg border border-slate-200 transition whitespace-nowrap cursor-pointer"
            >
              Đang lọc: {selectedLineFilter} (Xóa lọc)
            </button>
          )}
          <button
            type="button"
            onClick={() => onQuickReportLine(lines[0]?.id || 'line-1')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <ClipboardEdit className="w-3.5 h-3.5" />
            <span>Báo cáo nhanh Line</span>
          </button>
          <button
            type="button"
            onClick={onAdminEditLine}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg border transition whitespace-nowrap shrink-0 cursor-pointer ${
              isAdminMode
                ? 'bg-amber-500 hover:bg-amber-600 text-white border-amber-600 shadow-sm'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
            }`}
          >
            {isAdminMode ? <LockOpen className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
            <span>{isAdminMode ? 'Admin: Đang mở sửa Line' : 'Sửa thông tin Line (Admin)'}</span>
          </button>
          <button
            type="button"
            onClick={onOpenAddLine}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-600 hover:text-white border border-dashed border-blue-400 rounded-lg transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Thêm Dây Chuyền Mới (Admin)</span>
          </button>
          <div className="flex items-center gap-3 pl-1 flex-wrap">
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-[0_0_6px_rgba(16,185,129,0.75)]" />
              <span className="text-slate-600 font-medium">Tốt / Đủ VT</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block shadow-[0_0_6px_rgba(6,182,212,0.75)]" />
              <span className="text-slate-600 font-medium">Chạy thử</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block shadow-[0_0_6px_rgba(245,158,11,0.75)]" />
              <span className="text-slate-600 font-medium">Theo dõi / Chờ Vật Tư</span>
            </div>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-[0_0_6px_rgba(244,63,94,0.75)]" />
              <span className="text-slate-600 font-medium">Cảnh báo / Nhiều Issue</span>
            </div>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span className="px-1.5 py-0.5 rounded bg-violet-100 border border-violet-300 text-violet-800 text-[10px] font-bold">
                New · Test: Test model mới
              </span>
              <span className="px-1.5 py-0.5 rounded bg-sky-100 border border-sky-300 text-sky-800 text-[10px] font-bold">
                Mass: SX hàng loạt
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Network Diagram (White Background + Neon Framed Cards) */}
      <div className="relative mt-5 py-6 px-4 sm:px-5 bg-white rounded-2xl border border-slate-200/80">
        <div className="grid grid-cols-12 gap-6 items-center">
          {/* Central Hub KHV Frame */}
          <div className="col-span-12 lg:col-span-3 flex flex-col items-center justify-center relative">
            <div className="w-full max-w-[220px] rounded-2xl border-2 border-cyan-400 bg-white p-4 shadow-[0_0_18px_rgba(6,182,212,0.28)] flex flex-col items-center justify-center">
              <div className="flex items-center justify-center gap-2 h-10 -mb-1.5 z-20">
                <div
                  className={`min-w-[54px] px-2 h-8 rounded-lg border-[1.5px] flex flex-col items-center justify-center gap-0.5 transition-colors ${hubVtTheme.box}`}
                >
                  <span
                    className={`text-[8.5px] font-bold leading-none whitespace-nowrap ${hubVtTheme.label}`}
                  >
                    Vật Tư
                  </span>
                  <span
                    className={`text-[11px] font-extrabold leading-none tabular-nums ${hubVtTheme.value}`}
                  >
                    {avgVt}%
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onInspectLineIssues('HUB')}
                  title={`Nhấp để xem toàn bộ ${totalLineIssues} Issue trên hệ thống`}
                  className={`min-w-[48px] px-2 h-8 rounded-lg border-[1.5px] flex flex-col items-center justify-center gap-0.5 transition-all cursor-pointer hover:scale-105 hover:ring-2 hover:ring-rose-400/70 focus-visible:outline-2 focus-visible:outline-rose-600 ${hubIssueTheme.box}`}
                >
                  <span
                    className={`text-[8.5px] font-bold leading-none whitespace-nowrap ${hubIssueTheme.label}`}
                  >
                    Issue
                  </span>
                  <span
                    className={`text-[11px] font-extrabold leading-none tabular-nums ${hubIssueTheme.value}`}
                  >
                    {totalLineIssues}
                  </span>
                </button>
              </div>
              <button
                type="button"
                onClick={() => onQuickReportLine(lines[0]?.id || 'line-1')}
                className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 via-blue-600 to-indigo-700 text-white flex flex-col items-center justify-center shadow-[0_0_16px_rgba(37,99,235,0.4)] border-2 border-white pulse-ring shrink-0 hover:scale-105 transition-transform cursor-pointer"
                title="Nhấp để mở bảng báo cáo nhanh cho các dây chuyền"
              >
                <span className="text-[9px] uppercase tracking-wider text-cyan-100 font-semibold">
                  TRUNG TÂM
                </span>
                <span className="text-xl font-extrabold tracking-tight leading-none my-0.5">
                  KHV
                </span>
                <span className="text-[9px] text-blue-100">Hub Vận Hành</span>
              </button>
              <div className="mt-2.5 text-center">
                <span className="text-xs text-slate-600 font-semibold">{lines.length} line On3</span>
              </div>
            </div>

            {/* Dispatch Flow Connector to Right Grid on Desktop */}
            <div
              aria-hidden="true"
              className="hidden lg:flex items-center absolute -right-4 top-1/2 -translate-y-1/2 w-8 pointer-events-none"
            >
              <div className="w-full border-t-2 border-dashed border-cyan-400" />
              <div className="w-2 h-2 border-t-2 border-r-2 border-cyan-500 rotate-45 -ml-1.5" />
            </div>
          </div>

          {/* Lines Grid with Flow Bus */}
          <div className="col-span-12 lg:col-span-9 flex flex-col gap-4 relative lg:pl-5 lg:border-l-2 lg:border-dashed lg:border-cyan-300">
            <div className="relative">
              <div
                aria-hidden="true"
                className="hidden md:block absolute top-1/2 -translate-y-1/2 left-[8%] right-[8%] border-t-2 border-dashed border-cyan-300 pointer-events-none z-0"
              />
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 relative z-10">
                {firstRow.map(renderLineNode)}
              </div>
            </div>
            {remainingRows.length > 0 && (
              <div className="relative">
                <div
                  aria-hidden="true"
                  className="hidden md:block absolute top-1/2 -translate-y-1/2 left-[8%] right-[8%] border-t-2 border-dashed border-cyan-300 pointer-events-none z-0"
                />
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 relative z-10">
                  {remainingRows.map(renderLineNode)}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
