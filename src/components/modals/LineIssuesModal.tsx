import {
  AlertTriangle,
  CheckCircle2,
  ClipboardEdit,
  Clock,
  ExternalLink,
  Filter,
  History,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { IssueItem, ProductionLine } from '../../types/production';

interface LineIssuesModalProps {
  isOpen: boolean;
  centerCode?: string;
  targetLine: ProductionLine | null;
  isHubMode: boolean;
  issues: IssueItem[];
  onClose: () => void;
  onSelectIssueDetail: (issueId: string) => void;
  onOpenQuickReport: (lineId: string) => void;
  onFilterInTable: (lineName: string) => void;
}

type IssueHistoryFilter = 'all' | 'open' | 'resolved';

export function LineIssuesModal({
  isOpen,
  centerCode = 'KHV',
  targetLine,
  isHubMode,
  issues,
  onClose,
  onSelectIssueDetail,
  onOpenQuickReport,
  onFilterInTable,
}: LineIssuesModalProps) {
  const [historyFilter, setHistoryFilter] = useState<IssueHistoryFilter>('all');

  if (!isOpen) return null;

  const matchingIssues = isHubMode
    ? issues
    : targetLine
    ? issues.filter((iss) => iss.line === targetLine.name)
    : [];

  const openIssues = matchingIssues.filter((i) => i.progress < 100);
  const resolvedIssues = matchingIssues.filter((i) => i.progress >= 100);

  const visibleIssues =
    historyFilter === 'open'
      ? openIssues
      : historyFilter === 'resolved'
      ? resolvedIssues
      : [...openIssues, ...resolvedIssues];

  const highCount = openIssues.filter((i) => i.severity === 'high').length;
  const mediumCount = openIssues.filter((i) => i.severity === 'medium').length;
  const lowCount = openIssues.filter((i) => i.severity === 'low').length;

  const titleText = isHubMode
    ? `Lịch Sử & Chi Tiết Issue Toàn Trung Tâm (${centerCode})`
    : `Lịch Sử & Chi Tiết Issue — ${targetLine?.name || ''}`;

  const subText = isHubMode
    ? `Theo dõi ${openIssues.length} vấn đề tồn đọng và ${resolvedIssues.length} vấn đề đã khắc phục 100%`
    : `${targetLine?.stage || ''} · Leader: ${targetLine?.leader || ''}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-rose-700 via-rose-600 to-slate-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <History className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white truncate">{titleText}</h3>
                {!isHubMode && targetLine && (
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wide ${
                      targetLine.characteristic === 'new'
                        ? 'bg-violet-200 text-violet-950'
                        : 'bg-sky-200 text-sky-950'
                    }`}
                  >
                    {targetLine.characteristic === 'new'
                      ? 'New · Test model mới'
                      : 'Mass · SX hàng loạt'}
                  </span>
                )}
              </div>
              <p className="text-xs text-rose-100 mt-0.5 truncate">{subText}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center cursor-pointer shrink-0"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Summary & History Filter Strip */}
        <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 space-y-2.5 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-white p-1 rounded-lg border border-slate-200">
              <button
                type="button"
                onClick={() => setHistoryFilter('all')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer tabular-nums ${
                  historyFilter === 'all'
                    ? 'bg-slate-800 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Tất cả lịch sử ({matchingIssues.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('open')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer tabular-nums ${
                  historyFilter === 'open'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                }`}
              >
                Đang tồn đọng ({openIssues.length})
              </button>
              <button
                type="button"
                onClick={() => setHistoryFilter('resolved')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer tabular-nums ${
                  historyFilter === 'resolved'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                }`}
              >
                Đã khắc phục 100% ({resolvedIssues.length})
              </button>
            </div>

            {!isHubMode && targetLine && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuickReport(targetLine.id);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold transition cursor-pointer"
              >
                <ClipboardEdit className="w-3.5 h-3.5" />
                <span>Báo cáo / Thêm Issue {targetLine.name}</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] tabular-nums">
            <div className="flex items-center gap-2 flex-wrap">
              {!isHubMode && targetLine && (
                <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-semibold text-slate-700">
                  Issue hiển thị trên thẻ: <strong className="text-slate-900">{targetLine.issueCount}</strong>
                </span>
              )}
              {highCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-rose-100 text-rose-800 font-bold">
                  {highCount} Khẩn cấp
                </span>
              )}
              {mediumCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">
                  {mediumCount} Trung bình
                </span>
              )}
              {lowCount > 0 && (
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 font-bold">
                  {lowCount} Mức thấp
                </span>
              )}
            </div>
            <span className="text-emerald-700 font-semibold inline-flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Khắc phục 100% sẽ tự động trừ Issue trên thẻ Line</span>
            </span>
          </div>
        </div>

        {/* Issues History List */}
        <div className="p-6 overflow-y-auto flex-1 space-y-3 text-xs">
          {visibleIssues.length === 0 ? (
            <div className="py-10 px-4 text-center rounded-xl border-2 border-dashed border-emerald-200 bg-emerald-50/40">
              <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2.5" />
              <p className="text-sm font-bold text-slate-900">
                {historyFilter === 'resolved'
                  ? 'Chưa có Issue nào đã khắc phục 100% trong lịch sử'
                  : historyFilter === 'open'
                  ? 'Không còn Issue nào đang tồn đọng'
                  : targetLine
                  ? `${targetLine.name} hiện chưa ghi nhận lịch sử sự cố nào`
                  : 'Chưa có vấn đề nào được ghi nhận'}
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                {targetLine && targetLine.issueCount > 0 && matchingIssues.length === 0
                  ? `Thẻ đang hiển thị ${targetLine.issueCount} Issue nhưng chưa có hồ sơ chi tiết. Nhấp nút bên dưới để ghi nhận chi tiết vấn đề.`
                  : 'Mọi thay đổi tiến độ và lịch sử khắc phục sự cố sẽ được lưu tự động tại đây.'}
              </p>
              {targetLine && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenQuickReport(targetLine.id);
                  }}
                  className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition cursor-pointer"
                >
                  <ClipboardEdit className="w-3.5 h-3.5" />
                  <span>Ghi nhận chi tiết Issue cho {targetLine.name}</span>
                </button>
              )}
            </div>
          ) : (
            visibleIssues.map((issue) => {
              const isResolved = issue.progress >= 100;
              const sevBadge =
                issue.severity === 'high'
                  ? 'bg-rose-100 text-rose-800 border-rose-200'
                  : issue.severity === 'medium'
                  ? 'bg-amber-100 text-amber-800 border-amber-200'
                  : 'bg-blue-100 text-blue-800 border-blue-200';
              const sevLabel =
                issue.severity === 'high'
                  ? 'Khẩn cấp (High)'
                  : issue.severity === 'medium'
                  ? 'Trung bình'
                  : 'Mức thấp';
              const barColor = isResolved
                ? 'bg-emerald-500'
                : issue.progress >= 90
                ? 'bg-emerald-500'
                : issue.severity === 'high'
                ? 'bg-rose-500'
                : 'bg-amber-500';

              const timelineEntries =
                issue.history && issue.history.length > 0
                  ? issue.history
                  : [
                      {
                        timestamp: issue.sinceTime,
                        progress: issue.progress,
                        statusText: issue.statusText,
                        note: issue.notes,
                        author: issue.assignee,
                      },
                    ];

              return (
                <div
                  key={issue.id}
                  className={`rounded-xl border p-4 transition-all ${
                    isResolved
                      ? 'border-emerald-200 bg-emerald-50/30 hover:border-emerald-300'
                      : 'border-slate-200 bg-white shadow-xs hover:border-blue-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-1.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 font-mono font-bold text-blue-700">
                          {issue.id}
                        </span>
                        {isHubMode && (
                          <span className="px-2 py-0.5 rounded bg-slate-800 text-white font-bold text-[10px]">
                            {issue.line}
                          </span>
                        )}
                        {isResolved ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded border bg-emerald-100 border-emerald-300 text-emerald-800 font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              Đã khắc phục 100%{issue.resolvedAt ? ` · ${issue.resolvedAt}` : ''}
                            </span>
                          </span>
                        ) : (
                          <span
                            className={`px-2 py-0.5 rounded border font-bold text-[10px] ${sevBadge}`}
                          >
                            {sevLabel}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-50 border border-slate-200 font-mono font-semibold text-slate-700 text-[10px]">
                          {issue.itemCode}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 leading-snug">
                        {issue.title}
                      </h4>

                      <p className="text-slate-600 leading-relaxed">{issue.description}</p>
                    </div>

                    <div className="flex flex-row sm:flex-col items-stretch sm:items-end gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onSelectIssueDetail(issue.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 font-bold transition cursor-pointer whitespace-nowrap"
                      >
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Xem &amp; Cập nhật</span>
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  {/* Metadata & Progress */}
                  <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-3 items-center">
                    <div className="flex items-center gap-2 text-slate-700">
                      <UserCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-bold text-slate-900 block truncate">
                          {issue.assignee}
                        </span>
                        <span className="text-[10px] text-slate-400 block truncate">
                          {issue.assigneeRole}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-slate-700 tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <div>
                        <span className="font-bold text-slate-900">Tồn đọng: {issue.duration}</span>
                        <span className="text-[10px] text-slate-400 block">{issue.sinceTime}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1 tabular-nums">
                        <span className={isResolved ? 'text-emerald-700' : 'text-slate-700'}>
                          {issue.statusText}
                        </span>
                        <span className={isResolved ? 'text-emerald-700' : 'text-slate-900'}>
                          {issue.progress}%
                        </span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-100 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full transition-all ${barColor}`}
                          style={{ width: `${issue.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Issue History Log */}
                  <div className="mt-2.5 rounded-lg bg-slate-50 border border-slate-200/80 px-3 py-2 text-[11px] space-y-1">
                    <div className="font-bold text-slate-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-slate-500 shrink-0" />
                      <span>Lịch sử xử lý ({timelineEntries.length} mốc):</span>
                    </div>
                    <div className="space-y-1 pl-1 border-l-2 border-slate-200 ml-1">
                      {timelineEntries.slice(0, 3).map((entry, idx) => (
                        <div key={`${issue.id}-hist-${idx}`} className="pl-2 text-slate-600">
                          <span className="font-semibold text-slate-800 tabular-nums">
                            [{entry.timestamp}]
                          </span>{' '}
                          <span className="font-bold text-blue-700 tabular-nums">
                            {entry.progress}%
                          </span>{' '}
                          <span>({entry.statusText})</span>
                          {entry.note ? ` — ${entry.note}` : ''}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={() => {
              onFilterInTable(isHubMode ? 'all' : targetLine?.name || 'all');
              onClose();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
          >
            <Filter className="w-3.5 h-3.5" />
            <span>
              {isHubMode
                ? 'Đi tới Bảng Theo Dõi Sự Cố Chi Tiết'
                : `Lọc toàn bộ sự cố ${targetLine?.name || ''} ở bảng bên dưới`}
            </span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
