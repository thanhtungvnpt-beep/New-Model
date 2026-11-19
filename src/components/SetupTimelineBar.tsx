import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  Flag,
  Minus,
  PencilLine,
  Plus,
  RotateCcw,
} from 'lucide-react';
import { useRef } from 'react';
import {
  addDaysToIso,
  diffDaysIso,
  formatViDateFull,
  formatViDateShort,
  getTodayIsoDate,
} from '../data/initialData';
import { LineSetupTimeline } from '../types/production';

interface SetupTimelineBarProps {
  lineName?: string;
  stage?: string;
  currentDate?: string;
  targetDate: string;
  expectedDate: string;
  compact?: boolean;
  onUpdateTimeline?: (next: LineSetupTimeline) => void;
  onEdit?: () => void;
}

function toUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y || 2026, (m || 1) - 1, d || 1);
}

export function SetupTimelineBar({
  lineName,
  stage,
  currentDate,
  targetDate,
  expectedDate,
  compact = false,
  onUpdateTimeline,
  onEdit,
}: SetupTimelineBarProps) {
  const todayIso = getTodayIsoDate();
  const resolvedCurrent = currentDate || todayIso;
  const delayVsTarget = diffDaysIso(targetDate, expectedDate);
  const daysToTarget = diffDaysIso(resolvedCurrent, targetDate);
  const daysToExpected = diffDaysIso(resolvedCurrent, expectedDate);
  const isLate = delayVsTarget > 0;

  const currentInputRef = useRef<HTMLInputElement>(null);
  const targetInputRef = useRef<HTMLInputElement>(null);
  const expectedInputRef = useRef<HTMLInputElement>(null);

  const isInlineEditable = Boolean(onUpdateTimeline);

  const focusDateInput = (key: 'current' | 'target' | 'expected') => {
    const map = {
      current: currentInputRef.current,
      target: targetInputRef.current,
      expected: expectedInputRef.current,
    };
    const el = map[key];
    if (!el) return;
    el.focus();
    try {
      (el as HTMLInputElement & { showPicker?: () => void }).showPicker?.();
    } catch {
      // Fallback gracefully if browser blocks programmatic showPicker
    }
  };

  const emitUpdate = (patch: Partial<LineSetupTimeline>) => {
    if (!onUpdateTimeline) return;
    onUpdateTimeline({
      currentDate: patch.currentDate ?? resolvedCurrent,
      targetDate: patch.targetDate ?? targetDate,
      expectedDate: patch.expectedDate ?? expectedDate,
    });
  };

  const rawPoints = [
    {
      key: 'current' as const,
      orderWeight: 1,
      label: 'Ngày hiện tại',
      shortLabel: 'Hiện tại',
      date: resolvedCurrent,
      ms: toUtcMs(resolvedCurrent),
      dotClass: 'bg-blue-600 ring-4 ring-blue-100 border-white',
      pillClass: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100',
    },
    {
      key: 'target' as const,
      orderWeight: 2,
      label: 'Ngày cần hoàn thành',
      shortLabel: 'Cần HT',
      date: targetDate,
      ms: toUtcMs(targetDate),
      dotClass: 'bg-emerald-600 ring-4 ring-emerald-100 border-white',
      pillClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    },
    {
      key: 'expected' as const,
      orderWeight: 3,
      label: 'Ngày dự kiến',
      shortLabel: 'Dự kiến',
      date: expectedDate,
      ms: toUtcMs(expectedDate),
      dotClass: isLate
        ? 'bg-rose-600 ring-4 ring-rose-100 border-white'
        : 'bg-amber-500 ring-4 ring-amber-100 border-white',
      pillClass: isLate
        ? 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100',
    },
  ];

  const minMs = Math.min(...rawPoints.map((p) => p.ms));
  const maxMs = Math.max(...rawPoints.map((p) => p.ms));
  const spanMs = Math.max(maxMs - minMs, 86400000);

  const positioned = [...rawPoints]
    .sort((a, b) => (a.ms !== b.ms ? a.ms - b.ms : a.orderWeight - b.orderWeight))
    .map((pt, idx) => {
      const rawPct = maxMs === minMs ? 16 + idx * 34 : 10 + ((pt.ms - minMs) / spanMs) * 80;
      return {
        ...pt,
        pct: Math.min(92, Math.max(8, rawPct)),
        placement: idx % 2 === 0 ? ('top' as const) : ('bottom' as const),
      };
    });

  const currentPos = positioned.find((p) => p.key === 'current')?.pct ?? 10;
  const targetPos = positioned.find((p) => p.key === 'target')?.pct ?? 50;
  const expectedPos = positioned.find((p) => p.key === 'expected')?.pct ?? 90;

  const onTrackEnd = isLate ? targetPos : expectedPos;
  const onTrackLeft = Math.min(currentPos, onTrackEnd);
  const onTrackWidth = Math.abs(onTrackEnd - currentPos);

  const lateLeft = Math.min(targetPos, expectedPos);
  const lateWidth = isLate ? Math.abs(expectedPos - targetPos) : 0;

  const varianceBadge = isLate ? (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold bg-rose-600 text-white shadow-sm whitespace-nowrap animate-pulse">
      <AlertTriangle className="w-3 h-3" />
      <span>Cảnh báo trễ +{delayVsTarget} ngày</span>
    </span>
  ) : delayVsTarget === 0 ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" />
      <span>Đúng hạn mục tiêu</span>
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-cyan-50 text-cyan-700 border border-cyan-200 whitespace-nowrap">
      <CheckCircle2 className="w-3 h-3" />
      <span>Sớm hơn {Math.abs(delayVsTarget)} ngày</span>
    </span>
  );

  return (
    <div
      className={`rounded-xl border-2 bg-white transition-all ${
        isLate
          ? 'border-rose-400 shadow-[0_0_16px_rgba(244,63,94,0.22)]'
          : 'border-amber-300 shadow-[0_0_14px_rgba(245,158,11,0.16)]'
      } ${compact ? 'p-3.5' : 'p-4'}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-bold text-xs border ${
              isLate
                ? 'bg-rose-100 text-rose-900 border-rose-300'
                : 'bg-amber-100 text-amber-900 border-amber-300'
            }`}
          >
            <CalendarClock
              className={`w-3.5 h-3.5 ${isLate ? 'text-rose-700' : 'text-amber-700'}`}
            />
            <span>{lineName ? `${lineName} · Timeline` : 'Timeline Tiến Độ'}</span>
          </span>
          {stage && <span className="text-xs font-medium text-slate-600">{stage}</span>}
          {varianceBadge}
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {isInlineEditable && (
            <span className="text-[11px] text-slate-500 hidden md:inline">
              Nhấp vào mốc ngày hoặc ô bên dưới để chỉnh sửa trực tiếp
            </span>
          )}
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 transition cursor-pointer whitespace-nowrap"
            >
              <PencilLine className="w-3 h-3" />
              <span>Báo cáo chi tiết Line</span>
            </button>
          )}
        </div>
      </div>

      {/* Prominent Late Warning Banner when Expected > Target */}
      {isLate && (
        <div className="mt-3 rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 flex items-center justify-between gap-2 text-[11px] text-rose-800">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>
              <strong>Cảnh báo trễ tiến độ:</strong> Ngày dự kiến (
              <strong className="tabular-nums">{formatViDateFull(expectedDate)}</strong>) vượt quá
              ngày cần hoàn thành (
              <strong className="tabular-nums">{formatViDateFull(targetDate)}</strong>){' '}
              <strong>+{delayVsTarget} ngày</strong>.
            </span>
          </div>
          <span className="px-2 py-0.5 rounded bg-rose-600 text-white font-bold text-[10px] shrink-0">
            Trễ +{delayVsTarget}n
          </span>
        </div>
      )}

      {/* Visual Chronological Timeline Bar */}
      <div className="pt-9 pb-9 px-3 sm:px-6">
        <div className="relative h-2.5 rounded-full bg-slate-100 border border-slate-200">
          {/* Elapsed segment up to current date */}
          <div
            className="absolute top-0 bottom-0 left-0 rounded-l-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-200"
            style={{ width: `${currentPos}%` }}
          />
          {/* On-plan forecast segment (current -> target or expected if early/on-time) */}
          {onTrackWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-400 to-emerald-500 opacity-80 transition-all duration-200"
              style={{ left: `${onTrackLeft}%`, width: `${onTrackWidth}%` }}
            />
          )}
          {/* Overrun / Late segment (target -> expected when expected > target) */}
          {isLate && lateWidth > 0 && (
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-amber-500 to-rose-600 rounded-r-full transition-all duration-200"
              style={{ left: `${lateLeft}%`, width: `${lateWidth}%` }}
            />
          )}

          {/* 3 Chronologically Ordered Clickable Milestones */}
          {positioned.map((pt) => (
            <div
              key={pt.key}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 transition-all duration-200"
              style={{ left: `${pt.pct}%` }}
            >
              {isInlineEditable ? (
                <button
                  type="button"
                  onClick={() => focusDateInput(pt.key)}
                  title={`${pt.label}: ${formatViDateFull(pt.date)} — Nhấp để chỉnh sửa`}
                  className="group relative flex items-center justify-center cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 rounded-full"
                >
                  <div
                    className={`w-4 h-4 rounded-full border-2 shadow-sm group-hover:scale-125 transition-transform ${pt.dotClass}`}
                  />
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md border text-[10px] font-bold shadow-xs tabular-nums transition-colors ${
                      pt.pillClass
                    } ${pt.placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                  >
                    {pt.shortLabel}: {formatViDateShort(pt.date)}
                  </div>
                </button>
              ) : (
                <div className="relative flex items-center justify-center">
                  <div
                    className={`w-4 h-4 rounded-full border-2 shadow-sm ${pt.dotClass}`}
                    title={`${pt.label}: ${formatViDateFull(pt.date)}`}
                  />
                  <div
                    className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-0.5 rounded-md border text-[10px] font-bold shadow-xs tabular-nums ${
                      pt.pillClass
                    } ${pt.placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'}`}
                  >
                    {pt.shortLabel}: {formatViDateShort(pt.date)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 3 Milestone Detail / Inline Edit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-2 border-t border-slate-100 text-xs">
        {/* 1. Ngày hiện tại */}
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 px-3 py-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span>Ngày hiện tại</span>
            </span>
            <div className="flex items-center gap-1">
              {isInlineEditable && resolvedCurrent !== todayIso && (
                <button
                  type="button"
                  onClick={() => emitUpdate({ currentDate: todayIso })}
                  title="Đặt lại về hôm nay"
                  className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-blue-700 bg-white hover:bg-blue-100 px-1.5 py-0.5 rounded border border-blue-200 cursor-pointer"
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                  <span>Hôm nay</span>
                </button>
              )}
              {(!isInlineEditable || resolvedCurrent === todayIso) && (
                <span className="text-[10px] font-semibold text-blue-700 bg-white px-2 py-0.5 rounded border border-blue-200 whitespace-nowrap">
                  Hôm nay
                </span>
              )}
            </div>
          </div>

          {isInlineEditable ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => emitUpdate({ currentDate: addDaysToIso(resolvedCurrent, -1) })}
                title="Lùi 1 ngày"
                className="w-7 h-7 rounded-md border border-blue-200 bg-white hover:bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                ref={currentInputRef}
                type="date"
                value={resolvedCurrent}
                onChange={(e) => {
                  if (e.target.value) emitUpdate({ currentDate: e.target.value });
                }}
                aria-label="Ngày hiện tại"
                className="flex-1 min-w-0 rounded-md border border-blue-200 bg-white px-2 py-1 text-xs font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                type="button"
                onClick={() => emitUpdate({ currentDate: addDaysToIso(resolvedCurrent, 1) })}
                title="Tăng 1 ngày"
                className="w-7 h-7 rounded-md border border-blue-200 bg-white hover:bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-extrabold text-slate-900 tabular-nums">
              {formatViDateFull(resolvedCurrent)}
            </p>
          )}
        </div>

        {/* 2. Ngày cần hoàn thành */}
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 px-3 py-2 flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800">
              <Flag className="w-3 h-3 text-emerald-600" />
              <span>Ngày cần hoàn thành</span>
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-200 whitespace-nowrap tabular-nums">
              {daysToTarget === 0
                ? 'Đến hạn'
                : daysToTarget > 0
                ? `Còn ${daysToTarget} ngày`
                : `Quá ${Math.abs(daysToTarget)} ngày`}
            </span>
          </div>

          {isInlineEditable ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => emitUpdate({ targetDate: addDaysToIso(targetDate, -1) })}
                title="Lùi 1 ngày"
                className="w-7 h-7 rounded-md border border-emerald-200 bg-white hover:bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                ref={targetInputRef}
                type="date"
                value={targetDate}
                onChange={(e) => {
                  if (e.target.value) emitUpdate({ targetDate: e.target.value });
                }}
                aria-label="Ngày cần hoàn thành"
                className="flex-1 min-w-0 rounded-md border border-emerald-200 bg-white px-2 py-1 text-xs font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={() => emitUpdate({ targetDate: addDaysToIso(targetDate, 1) })}
                title="Tăng 1 ngày"
                className="w-7 h-7 rounded-md border border-emerald-200 bg-white hover:bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-extrabold text-slate-900 tabular-nums">
              {formatViDateFull(targetDate)}
            </p>
          )}
        </div>

        {/* 3. Ngày dự kiến */}
        <div
          className={`rounded-lg border px-3 py-2 flex flex-col gap-1.5 ${
            isLate ? 'border-rose-300 bg-rose-50/70' : 'border-amber-200 bg-amber-50/50'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span
              className={`inline-flex items-center gap-1.5 text-[11px] font-semibold ${
                isLate ? 'text-rose-800' : 'text-amber-800'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${isLate ? 'bg-rose-600' : 'bg-amber-500'}`}
              />
              <span>Ngày dự kiến</span>
            </span>
            <span
              className={`text-[10px] font-bold bg-white px-2 py-0.5 rounded border whitespace-nowrap tabular-nums ${
                isLate
                  ? 'text-rose-700 border-rose-300'
                  : 'text-amber-700 border-amber-200'
              }`}
            >
              {daysToExpected === 0
                ? 'Xong hôm nay'
                : daysToExpected > 0
                ? `+${daysToExpected} ngày nữa`
                : `Trước ${Math.abs(daysToExpected)} ngày`}
            </span>
          </div>

          {isInlineEditable ? (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => emitUpdate({ expectedDate: addDaysToIso(expectedDate, -1) })}
                title="Lùi 1 ngày"
                className={`w-7 h-7 rounded-md border bg-white flex items-center justify-center shrink-0 cursor-pointer ${
                  isLate
                    ? 'border-rose-200 hover:bg-rose-100 text-rose-700'
                    : 'border-amber-200 hover:bg-amber-100 text-amber-700'
                }`}
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <input
                ref={expectedInputRef}
                type="date"
                value={expectedDate}
                onChange={(e) => {
                  if (e.target.value) emitUpdate({ expectedDate: e.target.value });
                }}
                aria-label="Ngày dự kiến"
                className={`flex-1 min-w-0 rounded-md border bg-white px-2 py-1 text-xs font-extrabold text-slate-900 tabular-nums focus:outline-none focus:ring-2 ${
                  isLate
                    ? 'border-rose-300 focus:ring-rose-500'
                    : 'border-amber-200 focus:ring-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => emitUpdate({ expectedDate: addDaysToIso(expectedDate, 1) })}
                title="Tăng 1 ngày"
                className={`w-7 h-7 rounded-md border bg-white flex items-center justify-center shrink-0 cursor-pointer ${
                  isLate
                    ? 'border-rose-200 hover:bg-rose-100 text-rose-700'
                    : 'border-amber-200 hover:bg-amber-100 text-amber-700'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <p className="text-sm font-extrabold text-slate-900 tabular-nums">
              {formatViDateFull(expectedDate)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
