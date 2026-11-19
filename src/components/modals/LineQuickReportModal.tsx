import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardEdit,
  Filter,
  Lock,
  LockOpen,
  Minus,
  PackageCheck,
  Plus,
  Save,
  Settings2,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { addDaysToIso, getTodayIsoDate, isLineCompleted } from '../../data/initialData';
import { IssueSeverity, LineHealthStatus, ProductionLine } from '../../types/production';
import { SetupTimelineBar } from '../SetupTimelineBar';

interface LineQuickReportModalProps {
  isOpen: boolean;
  lines: ProductionLine[];
  initialLineId: string | null;
  isAdminMode: boolean;
  onRequestAdminAuth: () => void;
  onExitAdminMode: () => void;
  onClose: () => void;
  onSaveLineReport: (
    updatedLine: ProductionLine,
    newIssue?: {
      title: string;
      severity: IssueSeverity;
      description: string;
    },
    adminEdited?: boolean
  ) => void;
  onDeleteLine: (lineId: string) => void;
  onFilterLineIssues: (lineName: string) => void;
}

const STATUS_OPTIONS: LineHealthStatus[] = [
  'Hoàn thành',
  'Chạy Tốt',
  'Đang Setup',
  'Gần xong',
  'Chờ Vật Tư',
  'Đang test',
  'Chờ xuất',
  'Đã kích hoạt',
];

const HEALTH_BADGE_OPTIONS: { label: string; tone: 'emerald' | 'amber' | 'rose' }[] = [
  { label: 'Ổn định', tone: 'emerald' },
  { label: 'Tối ưu', tone: 'emerald' },
  { label: 'Sắp hoàn thành', tone: 'emerald' },
  { label: 'Gần hoàn thành', tone: 'emerald' },
  { label: 'Cần bổ sung vật tư', tone: 'amber' },
  { label: 'Chờ kiểm tra', tone: 'amber' },
  { label: 'Nút thắt cổ chai', tone: 'rose' },
];

export function LineQuickReportModal({
  isOpen,
  lines,
  initialLineId,
  isAdminMode,
  onRequestAdminAuth,
  onExitAdminMode,
  onClose,
  onSaveLineReport,
  onDeleteLine,
  onFilterLineIssues,
}: LineQuickReportModalProps) {
  const [selectedId, setSelectedId] = useState<string>(initialLineId || lines[0]?.id || '');

  // Admin-editable Line info fields
  const [lineName, setLineName] = useState('');
  const [stage, setStage] = useState('');
  const [shortStage, setShortStage] = useState('');
  const [leader, setLeader] = useState('');

  // Operational progress & status fields
  const [vtPercent, setVtPercent] = useState(100);
  const [healthPercent, setHealthPercent] = useState(85);
  const [issueCount, setIssueCount] = useState(0);
  const [statusLabel, setStatusLabel] = useState<LineHealthStatus>('Chạy Tốt');
  const [healthBadge, setHealthBadge] = useState('Ổn định');
  const [healthTone, setHealthTone] = useState<'emerald' | 'amber' | 'rose'>('emerald');
  const [note, setNote] = useState('');

  // Setup Timeline 3 milestones (when statusLabel === 'Đang Setup')
  const [setupCurrentDate, setSetupCurrentDate] = useState(getTodayIsoDate());
  const [setupTargetDate, setSetupTargetDate] = useState(addDaysToIso(getTodayIsoDate(), 3));
  const [setupExpectedDate, setSetupExpectedDate] = useState(addDaysToIso(getTodayIsoDate(), 5));

  // Quick Issue Creation toggle
  const [addNewIssue, setAddNewIssue] = useState(false);
  const [newIssueTitle, setNewIssueTitle] = useState('');
  const [newIssueSeverity, setNewIssueSeverity] = useState<IssueSeverity>('medium');
  const [newIssueDesc, setNewIssueDesc] = useState('');

  // 2-step delete confirm
  const [confirmDelete, setConfirmDelete] = useState(false);

  const loadLineIntoState = (target: ProductionLine) => {
    const today = getTodayIsoDate();
    setSelectedId(target.id);
    setLineName(target.name);
    setStage(target.stage);
    setShortStage(target.shortStage);
    setLeader(target.leader);
    setVtPercent(target.vtPercent);
    setHealthPercent(target.healthPercent);
    setIssueCount(target.issueCount);
    setStatusLabel(target.statusLabel);
    setHealthBadge(target.healthBadge);
    setHealthTone(target.healthTone);
    setNote(target.lastNote || '');
    setSetupCurrentDate(target.setupTimeline?.currentDate || today);
    setSetupTargetDate(target.setupTimeline?.targetDate || addDaysToIso(today, 3));
    setSetupExpectedDate(target.setupTimeline?.expectedDate || addDaysToIso(today, 5));
    setAddNewIssue(false);
    setNewIssueTitle('');
    setNewIssueDesc('');
    setConfirmDelete(false);
  };

  useEffect(() => {
    if (!isOpen) return;
    const target = lines.find((l) => l.id === (initialLineId || selectedId)) || lines[0];
    if (target) loadLineIntoState(target);
  }, [isOpen, initialLineId]);

  const handleSwitchLine = (lineId: string) => {
    const target = lines.find((l) => l.id === lineId);
    if (target) loadLineIntoState(target);
  };

  if (!isOpen) return null;

  const activeLine = lines.find((l) => l.id === selectedId) || lines[0];
  if (!activeLine) return null;

  const hasStructuralChanges =
    lineName.trim() !== activeLine.name ||
    stage.trim() !== activeLine.stage ||
    shortStage.trim() !== activeLine.shortStage ||
    leader.trim() !== activeLine.leader;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const shouldCreateIssue = addNewIssue && newIssueTitle.trim().length > 0;
    const finalIssueCount = shouldCreateIssue ? issueCount + 1 : issueCount;

    const updatedLine: ProductionLine = {
      ...activeLine,
      name: isAdminMode && lineName.trim() ? lineName.trim() : activeLine.name,
      stage: isAdminMode && stage.trim() ? stage.trim() : activeLine.stage,
      shortStage: isAdminMode && shortStage.trim() ? shortStage.trim() : activeLine.shortStage,
      leader: isAdminMode && leader.trim() ? leader.trim() : activeLine.leader,
      vtPercent,
      healthPercent,
      issueCount: finalIssueCount,
      statusLabel,
      healthBadge,
      healthTone,
      lastNote: note.trim() || undefined,
      updatedAt: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      setupTimeline: {
        currentDate: setupCurrentDate || getTodayIsoDate(),
        targetDate: setupTargetDate || addDaysToIso(getTodayIsoDate(), 3),
        expectedDate: setupExpectedDate || addDaysToIso(getTodayIsoDate(), 5),
      },
    };

    onSaveLineReport(
      updatedLine,
      shouldCreateIssue
        ? {
            title: newIssueTitle.trim(),
            severity: newIssueSeverity,
            description:
              newIssueDesc.trim() ||
              `Báo cáo nhanh từ sơ đồ điều phối ${updatedLine.name} (${updatedLine.stage}).`,
          }
        : undefined,
      isAdminMode && hasStructuralChanges
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <ClipboardEdit className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Quản Lý &amp; Báo Cáo Nhanh Line ({activeLine.name})
                </h3>
                {isAdminMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-slate-900">
                    Admin Mode
                  </span>
                )}
              </div>
              <p className="text-xs text-blue-100 mt-0.5">
                Cập nhật tiến độ vật tư, Issue, tình trạng tổng quan &amp; cấu hình thông tin Line
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

        {/* Quick Line Switcher Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {lines.map((line) => {
            const isActive = line.id === activeLine.id;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => handleSwitchLine(line.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <span>{line.name}</span>
                {line.issueCount > 0 && (
                  <span
                    className={`px-1.5 py-0.2 rounded text-[10px] tabular-nums ${
                      isActive ? 'bg-amber-400 text-slate-900' : 'bg-rose-100 text-rose-700'
                    }`}
                  >
                    {line.issueCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Top Summary Preview */}
          {(() => {
            const effectiveIssues =
              addNewIssue && newIssueTitle.trim() ? issueCount + 1 : issueCount;
            const vtCardClass =
              vtPercent >= 80
                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-700'
                : vtPercent >= 50
                ? 'bg-amber-50/80 border-amber-300 text-amber-700'
                : 'bg-rose-50/80 border-rose-300 text-rose-700';
            const issueCardClass =
              effectiveIssues === 0
                ? 'bg-slate-50 border-slate-200 text-slate-700'
                : effectiveIssues === 1
                ? 'bg-amber-50/80 border-amber-300 text-amber-700'
                : 'bg-rose-50/80 border-rose-300 text-rose-700';
            const statusCardClass =
              healthTone === 'rose'
                ? 'bg-rose-50/80 border-rose-300'
                : healthTone === 'amber' ||
                  statusLabel === 'Chờ Vật Tư' ||
                  statusLabel === 'Đang Setup' ||
                  statusLabel === 'Đang test' ||
                  statusLabel === 'Chờ xuất'
                ? 'bg-amber-50/80 border-amber-300'
                : statusLabel === 'Gần xong'
                ? 'bg-blue-50/80 border-blue-300'
                : 'bg-emerald-50/80 border-emerald-300';

            return (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className={`border rounded-xl p-3 flex items-center justify-between ${vtCardClass}`}>
                  <div>
                    <span className="text-[11px] text-slate-600 font-medium block">
                      Tiến độ Vật Tư
                    </span>
                    <span className="text-xl font-extrabold tabular-nums">
                      {vtPercent}%
                    </span>
                  </div>
                  <PackageCheck className="w-5 h-5" />
                </div>

                <div className={`border rounded-xl p-3 flex items-center justify-between ${issueCardClass}`}>
                  <div>
                    <span className="text-[11px] text-slate-600 font-medium block">
                      Số Issue trên Line
                    </span>
                    <span className="text-xl font-extrabold tabular-nums">
                      {effectiveIssues}
                    </span>
                  </div>
                  <AlertTriangle className="w-5 h-5" />
                </div>

                <div className={`border rounded-xl p-3 flex items-center justify-between ${statusCardClass}`}>
                  <div>
                    <span className="text-[11px] text-slate-600 font-medium block">
                      Tình trạng tổng quan
                    </span>
                    <span className="text-sm font-bold text-slate-900 block mt-0.5">
                      {statusLabel} · {healthBadge}
                    </span>
                  </div>
                  <CheckCircle2
                    className={`w-5 h-5 ${
                      healthTone === 'rose'
                        ? 'text-rose-600'
                        : healthTone === 'amber' ||
                          statusLabel === 'Chờ Vật Tư' ||
                          statusLabel === 'Đang Setup' ||
                          statusLabel === 'Đang test' ||
                          statusLabel === 'Chờ xuất'
                        ? 'text-amber-600'
                        : statusLabel === 'Gần xong'
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                    }`}
                  />
                </div>
              </div>
            );
          })()}

          {/* Admin Line Configuration Block */}
          <div
            className={`rounded-xl border p-4 space-y-3 ${
              isAdminMode
                ? 'border-amber-300 bg-amber-50/40'
                : 'border-slate-200 bg-slate-50/60'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
              <div className="flex items-center gap-2">
                <Settings2 className={`w-4 h-4 ${isAdminMode ? 'text-amber-600' : 'text-slate-500'}`} />
                <span className="font-bold text-slate-900">
                  Thông Tin Cấu Hình Dây Chuyền (Quyền Admin)
                </span>
              </div>

              <div className="flex items-center gap-2">
                {isAdminMode ? (
                  <>
                    <span className="text-[11px] font-bold text-emerald-700 inline-flex items-center gap-1">
                      <LockOpen className="w-3.5 h-3.5" />
                      <span>Đã mở khóa sửa thông tin Line</span>
                    </span>
                    <button
                      type="button"
                      onClick={onExitAdminMode}
                      className="px-2.5 py-1 rounded-md bg-white border border-amber-300 text-amber-800 hover:bg-amber-100 font-semibold cursor-pointer"
                    >
                      Khóa lại
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={onRequestAdminAuth}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm transition cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Mở khóa Admin để sửa thông tin Line</span>
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tên Line *</label>
                <input
                  required
                  type="text"
                  disabled={!isAdminMode}
                  value={lineName}
                  onChange={(e) => setLineName(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-1.5 font-bold ${
                    isAdminMode
                      ? 'border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                      : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nhãn ngắn trên Node *
                </label>
                <input
                  required
                  type="text"
                  maxLength={14}
                  disabled={!isAdminMode}
                  value={shortStage}
                  onChange={(e) => setShortStage(e.target.value)}
                  placeholder="VD: CNC, SMT, Burn-in"
                  className={`w-full rounded-lg border px-3 py-1.5 font-semibold ${
                    isAdminMode
                      ? 'border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                      : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tên công đoạn / Quy trình đầy đủ *
                </label>
                <input
                  required
                  type="text"
                  disabled={!isAdminMode}
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  placeholder="VD: Line 1 - SMT Assembly"
                  className={`w-full rounded-lg border px-3 py-1.5 font-medium ${
                    isAdminMode
                      ? 'border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                      : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              <div className="sm:col-span-2 lg:col-span-3">
                <label className="block font-semibold text-slate-700 mb-1 inline-flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>Kỹ sư / Line Leader phụ trách *</span>
                </label>
                <input
                  required
                  type="text"
                  disabled={!isAdminMode}
                  value={leader}
                  onChange={(e) => setLeader(e.target.value)}
                  className={`w-full rounded-lg border px-3 py-1.5 font-medium ${
                    isAdminMode
                      ? 'border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                      : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                  }`}
                />
              </div>

              {isAdminMode && lines.length > 1 && (
                <div className="flex items-end justify-end">
                  {!confirmDelete ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(true)}
                      className="w-full py-1.5 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white font-semibold inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Xóa Line này</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5 w-full">
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteLine(activeLine.id);
                          onClose();
                        }}
                        className="flex-1 py-1.5 px-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer"
                      >
                        Xác nhận xóa
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDelete(false)}
                        className="py-1.5 px-2 rounded-lg bg-white border border-slate-300 text-slate-600 cursor-pointer"
                      >
                        Hủy
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 1. Material Progress & Line Health */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  1. Tiến Độ Vật Tư Cấp Cho Line (% VT)
                </label>
                <span className="font-mono font-bold text-blue-700 tabular-nums">{vtPercent}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={vtPercent}
                onChange={(e) => setVtPercent(Number(e.target.value))}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setVtPercent(preset)}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border cursor-pointer tabular-nums ${
                        vtPercent === preset
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={vtPercent}
                  onChange={(e) =>
                    setVtPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-16 text-right px-2 py-1 border border-slate-300 rounded font-bold tabular-nums"
                />
              </div>
            </div>

            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <label className="font-bold text-slate-800">
                  2. Mức Sẵn Sàng Vận Hành (Lines Health %)
                </label>
                <span className="font-mono font-bold text-emerald-700 tabular-nums">
                  {healthPercent}%
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={healthPercent}
                onChange={(e) => setHealthPercent(Number(e.target.value))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] text-slate-500">
                  Cập nhật trực tiếp vào bảng Lines Health
                </span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={healthPercent}
                  onChange={(e) =>
                    setHealthPercent(Math.min(100, Math.max(0, Number(e.target.value) || 0)))
                  }
                  className="w-16 text-right px-2 py-1 border border-slate-300 rounded font-bold tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* 2. Overall Line Status & Issue Count */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Trạng thái vận hành trên sơ đồ
              </label>
              <select
                value={statusLabel}
                onChange={(e) => {
                  const nextStatus = e.target.value as LineHealthStatus;
                  setStatusLabel(nextStatus);
                  if (
                    nextStatus === 'Hoàn thành' ||
                    nextStatus === 'Chạy Tốt' ||
                    nextStatus === 'Đã kích hoạt'
                  ) {
                    setHealthTone('emerald');
                    setHealthBadge('Ổn định');
                  } else if (nextStatus === 'Gần xong') {
                    setHealthTone('emerald');
                    setHealthBadge('Sắp hoàn thành');
                  } else if (nextStatus === 'Chờ Vật Tư') {
                    setHealthTone('amber');
                    setHealthBadge('Cần bổ sung vật tư');
                  } else if (nextStatus === 'Đang test' || nextStatus === 'Chờ xuất') {
                    setHealthTone('amber');
                    setHealthBadge('Chờ kiểm tra');
                  } else if (nextStatus === 'Đang Setup' && healthTone === 'emerald') {
                    setHealthTone('amber');
                    setHealthBadge('Chờ kiểm tra');
                  }
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white font-semibold text-slate-800"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Đánh giá tổng quan Line
              </label>
              <select
                value={healthBadge}
                onChange={(e) => {
                  const chosen = HEALTH_BADGE_OPTIONS.find((o) => o.label === e.target.value);
                  setHealthBadge(e.target.value);
                  if (chosen) setHealthTone(chosen.tone);
                }}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white font-semibold text-slate-800"
              >
                {HEALTH_BADGE_OPTIONS.map((opt) => (
                  <option key={opt.label} value={opt.label}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Số lượng Issue hiện tại (IS)
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIssueCount((c) => Math.max(0, c - 1))}
                  className="w-9 h-9 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <Minus className="w-4 h-4 text-slate-700" />
                </button>
                <input
                  type="number"
                  min={0}
                  value={issueCount}
                  onChange={(e) => setIssueCount(Math.max(0, Number(e.target.value) || 0))}
                  className="flex-1 text-center py-2 border border-slate-300 rounded-lg font-extrabold text-slate-900 tabular-nums"
                />
                <button
                  type="button"
                  onClick={() => setIssueCount((c) => c + 1)}
                  className="w-9 h-9 rounded-lg border border-slate-300 bg-slate-50 hover:bg-slate-100 flex items-center justify-center cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-slate-700" />
                </button>
              </div>
            </div>
          </div>

          {/* 2b. Timeline Section for All Lines */}
          {(() => {
            const completed = isLineCompleted({
              statusLabel,
              vtPercent,
              healthPercent,
              issueCount,
            });

            if (completed) {
              return (
                <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50/70 p-4 space-y-2.5 shadow-[0_0_12px_rgba(16,185,129,0.16)]">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-xs">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{lineName || activeLine.name} · Hoàn thành</span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      Tự động chuyển màu xanh hoàn thành (100% tiến độ đạt chuẩn)
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.45)]" />
                </div>
              );
            }

            return (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                    <CalendarClock className="w-4 h-4 text-amber-600" />
                    <span>Thanh Timeline Tiến Độ (3 Mốc Ngày)</span>
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Chỉnh sửa trực tiếp mốc ngày trên thanh Timeline bên dưới
                  </span>
                </div>

                <SetupTimelineBar
                  lineName={lineName || activeLine.name}
                  stage={stage || activeLine.stage}
                  currentDate={setupCurrentDate}
                  targetDate={setupTargetDate}
                  expectedDate={setupExpectedDate}
                  compact
                  onUpdateTimeline={(next) => {
                    if (next.currentDate) setSetupCurrentDate(next.currentDate);
                    setSetupTargetDate(next.targetDate);
                    setSetupExpectedDate(next.expectedDate);
                  }}
                />
              </div>
            );
          })()}

          {/* 3. Quick Shift Note */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Ghi chú nhanh tình trạng ca trực
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="VD: Đủ vật tư ca sáng, đang chạy ổn định..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800"
            />
          </div>

          {/* 4. Optional Quick Issue Log */}
          <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="font-bold text-slate-900 inline-flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                <span>Ghi nhận thêm Issue mới vào Bảng Theo Dõi Sự Cố</span>
              </span>
              <input
                type="checkbox"
                checked={addNewIssue}
                onChange={(e) => setAddNewIssue(e.target.checked)}
                className="w-4 h-4 accent-rose-600 cursor-pointer"
              />
            </label>

            {addNewIssue && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tiêu đề sự cố phát sinh *
                  </label>
                  <input
                    required
                    type="text"
                    value={newIssueTitle}
                    onChange={(e) => setNewIssueTitle(e.target.value)}
                    placeholder={`VD: Thiếu vật tư tại ${lineName || activeLine.name}...`}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Mức độ</label>
                  <select
                    value={newIssueSeverity}
                    onChange={(e) => setNewIssueSeverity(e.target.value as IssueSeverity)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white font-semibold"
                  >
                    <option value="high">Khẩn cấp (High)</option>
                    <option value="medium">Trung bình (Medium)</option>
                    <option value="low">Thấp (Low)</option>
                  </select>
                </div>
                <div className="sm:col-span-3">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Mô tả &amp; đề xuất xử lý
                  </label>
                  <textarea
                    rows={2}
                    value={newIssueDesc}
                    onChange={(e) => setNewIssueDesc(e.target.value)}
                    placeholder="Chi tiết ảnh hưởng đến tiến độ dây chuyền..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onFilterLineIssues(activeLine.name);
                onClose();
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 hover:text-blue-900 hover:underline cursor-pointer"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Xem &amp; lọc toàn bộ sự cố của {activeLine.name}</span>
            </button>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                Hủy bỏ
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Lưu &amp; Cập nhật {lineName || activeLine.name}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
