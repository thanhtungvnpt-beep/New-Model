import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardEdit,
  Filter,
  KeyRound,
  Lock,
  LockOpen,
  PackageCheck,
  Save,
  Settings2,
  ShieldAlert,
  Trash2,
  UserCheck,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { addDaysToIso, formatLineTimestamp, getTodayIsoDate, isLineCompleted } from '../../data/initialData';
import {
  isMassStopIssueStatus,
  IssueSeverity,
  LineCharacteristic,
  LineHealthStatus,
  MASS_LINE_STATUSES,
  NEW_LINE_STATUSES,
  ProductionLine,
} from '../../types/production';
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
    adminEdited?: boolean,
    syncLeaderToIssues?: boolean
  ) => void;
  onDeleteLine: (lineId: string) => void;
  onFilterLineIssues: (lineName: string) => void;
  onInspectLineIssues: (lineId: string) => void;
}

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
  onInspectLineIssues,
}: LineQuickReportModalProps) {
  const [selectedId, setSelectedId] = useState<string>(initialLineId || lines[0]?.id || '');

  // Admin-editable Line info fields
  const [lineName, setLineName] = useState('');
  const [stage, setStage] = useState('');
  const [shortStage, setShortStage] = useState('');
  const [leader, setLeader] = useState('');

  // Operational progress & status fields
  const [characteristic, setCharacteristic] = useState<LineCharacteristic>('mas');
  const [vtPercent, setVtPercent] = useState(100);
  const [healthPercent, setHealthPercent] = useState(85);
  const [issueCount, setIssueCount] = useState(0);
  const [statusLabel, setStatusLabel] = useState<LineHealthStatus>('Đủ Vật Tư');
  const [healthBadge, setHealthBadge] = useState('Ổn định');
  const [healthTone, setHealthTone] = useState<'emerald' | 'amber' | 'rose'>('emerald');
  const [note, setNote] = useState('');

  // Setup Timeline 3 milestones (when New line has not reached Mass Ready)
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

  // Characteristic transition guards (New -> Mass requires password; Mass -> New requires Admin)
  const [pendingMassPassPrompt, setPendingMassPassPrompt] = useState(false);
  const [massPassInput, setMassPassInput] = useState('');
  const [massPassError, setMassPassError] = useState('');
  const [reverseBlockWarning, setReverseBlockWarning] = useState(false);
  const [autoStopIssueApplied, setAutoStopIssueApplied] = useState(false);
  const [vtValidationError, setVtValidationError] = useState('');
  const [issueValidationError, setIssueValidationError] = useState('');
  const [syncLeaderToIssues, setSyncLeaderToIssues] = useState(true);

  const loadLineIntoState = (target: ProductionLine) => {
    const today = getTodayIsoDate();
    const char: LineCharacteristic = target.characteristic || 'mas';
    const validStatus: LineHealthStatus =
      char === 'mas'
        ? MASS_LINE_STATUSES.includes(target.statusLabel)
          ? target.statusLabel
          : target.healthTone === 'rose'
          ? 'Dừng do Máy hỏng'
          : target.vtPercent < 60
          ? 'Dừng do Vật liệu'
          : 'Đang sản xuất'
        : NEW_LINE_STATUSES.includes(target.statusLabel)
        ? target.statusLabel
        : 'Đang Lắp Ráp';

    setSelectedId(target.id);
    setLineName(target.name);
    setStage(target.stage);
    setShortStage(target.shortStage);
    setLeader(target.leader);
    setCharacteristic(char);
    setVtPercent(target.vtPercent);
    setHealthPercent(target.healthPercent);
    setIssueCount(target.issueCount);
    setStatusLabel(validStatus);
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
    setPendingMassPassPrompt(false);
    setMassPassInput('');
    setMassPassError('');
    setReverseBlockWarning(false);
    setAutoStopIssueApplied(false);
    setVtValidationError('');
    setIssueValidationError('');
    setSyncLeaderToIssues(true);
  };

  const getMassStopSeverity = (status: LineHealthStatus): IssueSeverity =>
    status === 'Dừng do Máy hỏng' ||
    status === 'Dừng do Lỗi thao tác' ||
    status === 'Dừng Chất lượng' ||
    status === 'Dừng do Sự cố điện'
      ? 'high'
      : 'medium';

  const syncAutoStopIssue = (
    nextChar: LineCharacteristic,
    nextStatus: LineHealthStatus,
    savedIsMassStop: boolean,
    savedStatus: LineHealthStatus
  ) => {
    const isNextMassStop = nextChar === 'mas' && isMassStopIssueStatus(nextStatus);
    const shouldHaveAutoPlusOne =
      isNextMassStop && (!savedIsMassStop || nextStatus !== savedStatus);

    if (shouldHaveAutoPlusOne) {
      setNewIssueTitle(`Dừng máy: ${nextStatus}`);
      setNewIssueSeverity(getMassStopSeverity(nextStatus));
      setNewIssueDesc('');
      setIssueValidationError('');
      if (!autoStopIssueApplied) {
        setIssueCount((c) => c + 1);
        setAutoStopIssueApplied(true);
      }
    } else {
      if (nextChar === 'mas') {
        setNewIssueTitle('');
        setNewIssueDesc('');
      }
      setIssueValidationError('');
      if (autoStopIssueApplied) {
        setIssueCount((c) => Math.max(0, c - 1));
        setAutoStopIssueApplied(false);
      }
    }
  };

  const applyCharacteristicSwitch = (
    nextChar: LineCharacteristic,
    savedIsMassStop: boolean,
    savedStatus: LineHealthStatus
  ) => {
    setCharacteristic(nextChar);
    setPendingMassPassPrompt(false);
    setMassPassInput('');
    setMassPassError('');
    setReverseBlockWarning(false);

    let resolvedStatus = statusLabel;
    if (nextChar === 'mas') {
      if (!MASS_LINE_STATUSES.includes(statusLabel)) {
        if (statusLabel === 'Tạm Hoãn' || healthTone === 'rose') {
          resolvedStatus = 'Dừng do Máy hỏng';
          setStatusLabel(resolvedStatus);
          setHealthTone('rose');
          setHealthBadge('Nút thắt cổ chai');
        } else if (statusLabel === 'Chờ Vật Tư') {
          resolvedStatus = 'Dừng do Vật liệu';
          setStatusLabel(resolvedStatus);
          setHealthTone('amber');
          setHealthBadge('Cần bổ sung vật tư');
        } else {
          resolvedStatus = 'Đang sản xuất';
          setStatusLabel(resolvedStatus);
          setHealthTone('emerald');
          setHealthBadge('Ổn định');
        }
      }
    } else if (!NEW_LINE_STATUSES.includes(statusLabel)) {
      if (
        statusLabel === 'Dừng do Máy hỏng' ||
        statusLabel === 'Dừng do Lỗi thao tác' ||
        statusLabel === 'Dừng Chất lượng' ||
        statusLabel === 'Dừng do Sự cố điện'
      ) {
        resolvedStatus = 'Tạm Hoãn';
        setStatusLabel(resolvedStatus);
        setHealthTone('rose');
        setHealthBadge('Nút thắt cổ chai');
      } else if (statusLabel === 'Dừng do Vật liệu') {
        resolvedStatus = 'Chờ Vật Tư';
        setStatusLabel(resolvedStatus);
        setHealthTone('amber');
        setHealthBadge('Cần bổ sung vật tư');
      } else if (
        statusLabel === 'Dừng do Thiếu người' ||
        statusLabel === 'Dừng Bảo dưỡng' ||
        statusLabel === 'Dừng Vệ Sinh' ||
        statusLabel === 'Dừng do Lỗi khác' ||
        statusLabel === 'Dừng do Hết Plan'
      ) {
        resolvedStatus = 'Test Lại';
        setStatusLabel(resolvedStatus);
        setHealthTone('amber');
        setHealthBadge('Chờ kiểm tra');
      } else if (statusLabel === 'Dừng hoàn thành Plan') {
        resolvedStatus = 'Mass Ready';
        setStatusLabel(resolvedStatus);
        setHealthTone('emerald');
        setHealthBadge('Ổn định');
      } else {
        resolvedStatus = 'Chạy thử';
        setStatusLabel(resolvedStatus);
        setHealthTone('emerald');
        setHealthBadge('Sắp hoàn thành');
      }
    }
    if (nextChar === 'mas') {
      setVtPercent(100);
      setVtValidationError('');
    }
    syncAutoStopIssue(nextChar, resolvedStatus, savedIsMassStop, savedStatus);
  };

  useEffect(() => {
    if (!isOpen) return;
    const target = lines.find((l) => l.id === (initialLineId || selectedId)) || lines[0];
    if (target) loadLineIntoState(target);
  }, [isOpen, initialLineId]);

  useEffect(() => {
    if (isAdminMode) {
      setReverseBlockWarning(false);
    }
  }, [isAdminMode]);

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
    leader.trim() !== activeLine.leader ||
    characteristic !== activeLine.characteristic;

  const isSavedMassLocked = activeLine.characteristic === 'mas' && !isAdminMode;
  const wasInitiallyMassStop =
    activeLine.characteristic === 'mas' && isMassStopIssueStatus(activeLine.statusLabel);

  const handleClickNewButton = () => {
    if (characteristic === 'new') return;
    if (activeLine.characteristic === 'mas' && !isAdminMode) {
      setReverseBlockWarning(true);
      setPendingMassPassPrompt(false);
      return;
    }
    applyCharacteristicSwitch('new', wasInitiallyMassStop, activeLine.statusLabel);
  };

  const handleClickMassButton = () => {
    if (characteristic === 'mas') return;
    setReverseBlockWarning(false);
    setPendingMassPassPrompt(true);
    setMassPassInput('');
    setMassPassError('');
  };

  const handleConfirmMassPassword = () => {
    if (!massPassInput.trim()) {
      setMassPassError('Vui lòng nhập mật khẩu xác nhận để chuyển từ Test thử sang Mass.');
      return;
    }
    applyCharacteristicSwitch('mas', wasInitiallyMassStop, activeLine.statusLabel);
  };

  const requiresFullMaterial =
    statusLabel === 'Mass Ready' ||
    statusLabel === 'Đủ Vật Tư' ||
    statusLabel === 'Dừng hoàn thành Plan';

  const isAutoMassStopIssue =
    characteristic === 'mas' && autoStopIssueApplied && isMassStopIssueStatus(statusLabel);
  const requiresIssueDeclaration =
    isAutoMassStopIssue || (characteristic === 'new' && addNewIssue);
  const isIssueDeclarationComplete =
    !requiresIssueDeclaration ||
    (newIssueTitle.trim().length > 0 && newIssueDesc.trim().length > 0);
  const canSubmitReport =
    (!requiresFullMaterial || vtPercent >= 100) && isIssueDeclarationComplete;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (requiresFullMaterial && vtPercent < 100) {
      setVtValidationError(
        `Trạng thái "${statusLabel}" yêu cầu Tiến độ Vật Tư đạt 100% (hiện tại đang là ${vtPercent}%). Vui lòng cập nhật Vật Tư lên 100% hoặc đổi sang trạng thái phù hợp.`
      );
      return;
    }
    setVtValidationError('');

    if (requiresIssueDeclaration && !isIssueDeclarationComplete) {
      setIssueValidationError(
        'Khi đã khai báo dừng máy (có Issue), bắt buộc phải nhập đầy đủ Tiêu đề và Mô tả chi tiết Issue mới được lưu.'
      );
      if (!newIssueTitle.trim()) {
        document.getElementById('quick-report-issue-title')?.focus();
      } else {
        document.getElementById('quick-report-issue-desc')?.focus();
      }
      return;
    }
    setIssueValidationError('');

    const safeCharacteristic: LineCharacteristic =
      activeLine.characteristic === 'mas' && !isAdminMode ? 'mas' : characteristic;
    const isFinalAutoMassStopIssue =
      safeCharacteristic === 'mas' && autoStopIssueApplied && isMassStopIssueStatus(statusLabel);
    const shouldCreateManualIssue =
      safeCharacteristic === 'new' && addNewIssue && newIssueTitle.trim().length > 0;
    const finalIssueCount = shouldCreateManualIssue ? issueCount + 1 : issueCount;

    const updatedLine: ProductionLine = {
      ...activeLine,
      name: isAdminMode && lineName.trim() ? lineName.trim() : activeLine.name,
      stage: isAdminMode && stage.trim() ? stage.trim() : activeLine.stage,
      shortStage: isAdminMode && shortStage.trim() ? shortStage.trim() : activeLine.shortStage,
      leader: isAdminMode && leader.trim() ? leader.trim() : activeLine.leader,
      characteristic: safeCharacteristic,
      vtPercent,
      healthPercent,
      issueCount: finalIssueCount,
      statusLabel,
      healthBadge,
      healthTone,
      lastNote: note.trim() || undefined,
      updatedAt: formatLineTimestamp(),
      setupTimeline: {
        currentDate: setupCurrentDate || getTodayIsoDate(),
        targetDate: setupTargetDate || addDaysToIso(getTodayIsoDate(), 3),
        expectedDate: setupExpectedDate || addDaysToIso(getTodayIsoDate(), 5),
      },
    };

    const issuePayload = isFinalAutoMassStopIssue
      ? {
          title: newIssueTitle.trim(),
          severity: newIssueSeverity,
          description: newIssueDesc.trim(),
        }
      : shouldCreateManualIssue
      ? {
          title: newIssueTitle.trim(),
          severity: newIssueSeverity,
          description: newIssueDesc.trim(),
        }
      : undefined;

    onSaveLineReport(
      updatedLine,
      issuePayload,
      isAdminMode && hasStructuralChanges,
      isAdminMode && syncLeaderToIssues
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
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                    characteristic === 'new'
                      ? 'bg-violet-200 text-violet-950'
                      : 'bg-sky-200 text-sky-950'
                  }`}
                >
                  {characteristic === 'new' ? 'New · Test model mới' : 'Mass · SX hàng loạt'}
                </span>
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

        <form noValidate onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
          {/* Top Summary Preview */}
          {(() => {
            const effectiveIssues =
              characteristic === 'new' && addNewIssue && newIssueTitle.trim()
                ? issueCount + 1
                : issueCount;
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
              statusLabel === 'Dừng do Máy hỏng' ||
              statusLabel === 'Dừng do Lỗi thao tác' ||
              statusLabel === 'Dừng Chất lượng' ||
              statusLabel === 'Dừng do Sự cố điện' ||
              statusLabel === 'Tạm Hoãn' ||
              healthTone === 'rose'
                ? 'bg-rose-50/80 border-rose-300'
                : healthTone === 'amber' ||
                  statusLabel === 'Dừng do Vật liệu' ||
                  statusLabel === 'Dừng do Thiếu người' ||
                  statusLabel === 'Dừng Bảo dưỡng' ||
                  statusLabel === 'Dừng Vệ Sinh' ||
                  statusLabel === 'Dừng do Lỗi khác' ||
                  statusLabel === 'Dừng do Hết Plan' ||
                  statusLabel === 'Chờ Vật Tư' ||
                  statusLabel === 'Đang Lắp Ráp' ||
                  statusLabel === 'Đang cài đặt' ||
                  statusLabel === 'Test Lại'
                ? 'bg-amber-50/80 border-amber-300'
                : statusLabel === 'Chạy thử'
                ? 'bg-cyan-50/80 border-cyan-300'
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

                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onInspectLineIssues(activeLine.id);
                  }}
                  title="Nhấp để xem chi tiết vấn đề của Line này"
                  className={`border rounded-xl p-3 flex items-center justify-between text-left transition hover:ring-2 hover:ring-rose-300 cursor-pointer ${issueCardClass}`}
                >
                  <div>
                    <span className="text-[11px] text-slate-600 font-medium block">
                      Số Issue trên Line (Nhấp xem)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-xl font-extrabold tabular-nums">
                        {effectiveIssues}
                      </span>
                      {autoStopIssueApplied && (
                        <span className="text-[10px] font-bold text-rose-700">
                          (+1 chờ lưu)
                        </span>
                      )}
                    </div>
                  </div>
                  <AlertTriangle className="w-5 h-5" />
                </button>

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
                      statusLabel === 'Dừng do Máy hỏng' ||
                      statusLabel === 'Dừng do Lỗi thao tác' ||
                      statusLabel === 'Dừng Chất lượng' ||
                      statusLabel === 'Dừng do Sự cố điện' ||
                      statusLabel === 'Tạm Hoãn' ||
                      healthTone === 'rose'
                        ? 'text-rose-600'
                        : healthTone === 'amber' ||
                          statusLabel === 'Dừng do Vật liệu' ||
                          statusLabel === 'Dừng do Thiếu người' ||
                          statusLabel === 'Dừng Bảo dưỡng' ||
                          statusLabel === 'Dừng Vệ Sinh' ||
                          statusLabel === 'Dừng do Lỗi khác' ||
                          statusLabel === 'Dừng do Hết Plan' ||
                          statusLabel === 'Chờ Vật Tư' ||
                          statusLabel === 'Đang Lắp Ráp' ||
                          statusLabel === 'Đang cài đặt' ||
                          statusLabel === 'Test Lại'
                        ? 'text-amber-600'
                        : statusLabel === 'Chạy thử'
                        ? 'text-cyan-600'
                        : 'text-emerald-600'
                    }`}
                  />
                </div>
              </div>
            );
          })()}

          {/* Line Characteristic Selector (New -> Mass one-way, Mass -> New requires Admin) */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-bold text-slate-900">
                Đặc Tính Line (New / Mass)
              </span>
              <span className="text-[11px] text-slate-500">
                Chỉ chuyển 1 chiều <strong className="text-slate-700">New → Mass</strong> (cần mật khẩu) · Chuyển ngược cần quyền Admin
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleClickNewButton}
                title={
                  isSavedMassLocked
                    ? 'Không có chiều chuyển ngược từ Mass về New — Chỉ Admin mới được chuyển ngược'
                    : 'Chọn chế độ New — Test thử model mới'
                }
                className={`p-3 rounded-xl border-2 text-left transition flex items-start justify-between gap-2 ${
                  characteristic === 'new'
                    ? 'border-violet-500 bg-violet-50/80 shadow-xs cursor-pointer'
                    : isSavedMassLocked
                    ? 'border-slate-200 bg-slate-100/80 opacity-75 cursor-not-allowed'
                    : 'border-slate-200 bg-slate-50/50 hover:border-violet-300 cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-violet-600 text-white text-[10px] font-extrabold uppercase">
                      New
                    </span>
                    <span className="font-bold text-slate-900">Test thử model mới</span>
                    {isSavedMassLocked && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-100 border border-amber-300 text-amber-800 text-[10px] font-bold">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Chỉ Admin</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Line đang chạy thử nghiệm, kiểm tra và hiệu chỉnh cho model sản phẩm mới.
                  </p>
                </div>
                <span
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${
                    characteristic === 'new'
                      ? 'border-violet-600 bg-violet-600 shadow-[inset_0_0_0_3px_white]'
                      : 'border-slate-300 bg-white'
                  }`}
                />
              </button>

              <button
                type="button"
                onClick={handleClickMassButton}
                title={
                  characteristic === 'new'
                    ? 'Nhấp để chuyển từ Test thử (New) sang Mass (yêu cầu nhập mật khẩu)'
                    : 'Đang ở chế độ sản xuất hàng loạt (Mass)'
                }
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer flex items-start justify-between gap-2 ${
                  characteristic === 'mas'
                    ? 'border-sky-500 bg-sky-50/80 shadow-xs'
                    : pendingMassPassPrompt
                    ? 'border-sky-400 bg-sky-50/50 ring-2 ring-sky-200'
                    : 'border-slate-200 bg-slate-50/50 hover:border-sky-300'
                }`}
              >
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded bg-sky-600 text-white text-[10px] font-extrabold uppercase">
                      Mass
                    </span>
                    <span className="font-bold text-slate-900">Sản xuất hàng loạt</span>
                    {characteristic === 'new' && (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-sky-100 border border-sky-300 text-sky-800 text-[10px] font-bold">
                        <KeyRound className="w-2.5 h-2.5" />
                        <span>Cần Pass</span>
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-600 mt-1">
                    Line đã chuẩn hóa quy trình và đi vào vận hành sản xuất hàng loạt (Mass Production).
                  </p>
                </div>
                <span
                  className={`w-4 h-4 rounded-full border-2 mt-0.5 shrink-0 ${
                    characteristic === 'mas'
                      ? 'border-sky-600 bg-sky-600 shadow-[inset_0_0_0_3px_white]'
                      : 'border-slate-300 bg-white'
                  }`}
                />
              </button>
            </div>

            {pendingMassPassPrompt && (
              <div className="rounded-xl border-2 border-sky-300 bg-sky-50/80 p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 text-sky-900 font-bold">
                    <KeyRound className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Nhập mật khẩu xác nhận chuyển từ Test thử (New) → Mass</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingMassPassPrompt(false);
                      setMassPassInput('');
                      setMassPassError('');
                    }}
                    className="text-slate-400 hover:text-slate-700 cursor-pointer"
                    aria-label="Đóng khung nhập mật khẩu"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-slate-600">
                  Lưu ý: Sau khi lưu sang <strong>Mass</strong>, thao tác chuyển ngược về <strong>New</strong> sẽ bị khóa và chỉ Admin mới có quyền đổi lại.
                </p>
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="password"
                    autoFocus
                    value={massPassInput}
                    onChange={(e) => {
                      setMassPassInput(e.target.value);
                      if (massPassError) setMassPassError('');
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleConfirmMassPassword();
                      }
                    }}
                    placeholder="Nhập mật khẩu xác nhận (VD: admin123)"
                    className="flex-1 rounded-lg border border-sky-300 bg-white px-3 py-1.5 text-xs focus:ring-2 focus:ring-sky-500 focus:outline-none"
                  />
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setPendingMassPassPrompt(false);
                        setMassPassInput('');
                        setMassPassError('');
                      }}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmMassPassword}
                      className="px-3.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-700 text-white font-bold shadow-xs cursor-pointer whitespace-nowrap"
                    >
                      Xác nhận chuyển Mass
                    </button>
                  </div>
                </div>
                {massPassError && (
                  <p className="text-[11px] font-semibold text-rose-600">{massPassError}</p>
                )}
              </div>
            )}

            {reverseBlockWarning && (
              <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-start gap-2 text-amber-900">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block">
                      Không thể chuyển ngược từ Mass về Test thử (New)
                    </span>
                    <span className="text-[11px] text-amber-800">
                      Chỉ chuyển 1 chiều New → Mass. Muốn đổi ngược từ Mass về New phải xác thực quyền Admin.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onRequestAdminAuth}
                  className="shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>Mở khóa Admin</span>
                </button>
              </div>
            )}
          </div>

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

              <div className="sm:col-span-2 lg:col-span-3 space-y-1.5">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <label
                    htmlFor="quick-report-line-leader"
                    className="font-semibold text-slate-700 inline-flex items-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kỹ sư / Line Leader phụ trách *</span>
                  </label>
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                      isAdminMode
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {isAdminMode ? 'Admin đang mở chỉnh' : 'Chỉ Admin chỉnh'}
                  </span>
                </div>
                {(() => {
                  const leaderOptions = Array.from(
                    new Set(
                      [
                        'Lê Hoàng Đức',
                        'Phạm Minh Hoàng',
                        'Nguyễn Văn Tuấn',
                        'Đặng Quốc Bảo',
                        'Trần Thị Mai',
                        'Trần Quốc Thắng',
                        'Vũ Đình Toàn',
                        'Lê Văn Thành',
                        ...lines.map((l) => l.leader),
                      ].filter(Boolean)
                    )
                  );
                  return (
                    <>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          id="quick-report-line-leader"
                          required
                          type="text"
                          list="line-leader-suggestions"
                          disabled={!isAdminMode}
                          value={leader}
                          onChange={(e) => setLeader(e.target.value)}
                          placeholder="Nhập tên Line Leader phụ trách..."
                          className={`flex-1 rounded-lg border px-3 py-1.5 font-medium ${
                            isAdminMode
                              ? 'border-blue-300 bg-white text-slate-900 focus:ring-2 focus:ring-blue-500 focus:outline-none'
                              : 'border-slate-200 bg-slate-100 text-slate-500 cursor-not-allowed'
                          }`}
                        />
                        {isAdminMode && (
                          <select
                            aria-label="Chọn nhanh Line Leader có sẵn"
                            value={leaderOptions.includes(leader) ? leader : ''}
                            onChange={(e) => {
                              if (e.target.value) setLeader(e.target.value);
                            }}
                            className="sm:w-48 rounded-lg border border-blue-300 bg-white px-2.5 py-1.5 font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 focus:outline-none cursor-pointer"
                          >
                            <option value="">-- Chọn nhanh Leader --</option>
                            {leaderOptions.map((name) => (
                              <option key={name} value={name}>
                                {name}
                              </option>
                            ))}
                          </select>
                        )}
                      </div>
                      <datalist id="line-leader-suggestions">
                        {leaderOptions.map((name) => (
                          <option key={name} value={name} />
                        ))}
                      </datalist>
                    </>
                  );
                })()}
                {isAdminMode && leader.trim() && leader.trim() !== activeLine.leader && (
                  <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-800 cursor-pointer pt-0.5">
                    <input
                      type="checkbox"
                      checked={syncLeaderToIssues}
                      onChange={(e) => setSyncLeaderToIssues(e.target.checked)}
                      className="w-3.5 h-3.5 accent-blue-600 cursor-pointer"
                    />
                    <span>
                      Cập nhật luôn người phụ trách mới ({leader.trim()}) cho các Issue đang mở của {activeLine.name}
                    </span>
                  </label>
                )}
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
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setVtPercent(val);
                  if (val >= 100) setVtValidationError('');
                }}
                className="w-full accent-blue-600 cursor-pointer"
              />
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  {[25, 50, 75, 100].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => {
                        setVtPercent(preset);
                        if (preset >= 100) setVtValidationError('');
                      }}
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
                  onChange={(e) => {
                    const val = Math.min(100, Math.max(0, Number(e.target.value) || 0));
                    setVtPercent(val);
                    if (val >= 100) setVtValidationError('');
                  }}
                  className="w-16 text-right px-2 py-1 border border-slate-300 rounded font-bold tabular-nums"
                />
              </div>
              {requiresFullMaterial && vtPercent < 100 && (
                <p className="text-[11px] font-bold text-rose-600">
                  Trạng thái &ldquo;{statusLabel}&rdquo; yêu cầu Vật Tư đạt 100% mới hợp lệ.
                </p>
              )}
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

          {/* 2. Overall Line Status */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">
              Trạng thái vận hành trên sơ đồ
            </label>
            <select
              value={statusLabel}
              onChange={(e) => {
                const nextStatus = e.target.value as LineHealthStatus;
                setStatusLabel(nextStatus);
                syncAutoStopIssue(
                  characteristic,
                  nextStatus,
                  wasInitiallyMassStop,
                  activeLine.statusLabel
                );
                if (
                  nextStatus === 'Mass Ready' ||
                  nextStatus === 'Đủ Vật Tư' ||
                  nextStatus === 'Dừng hoàn thành Plan'
                ) {
                  setVtPercent(100);
                  setVtValidationError('');
                } else if (nextStatus === 'Đang sản xuất' && vtPercent < 100) {
                  setVtPercent(100);
                  setVtValidationError('');
                }
                if (
                  nextStatus === 'Đang sản xuất' ||
                  nextStatus === 'Dừng hoàn thành Plan' ||
                  nextStatus === 'Mass Ready' ||
                  nextStatus === 'Đủ Vật Tư'
                ) {
                  setHealthTone('emerald');
                  setHealthBadge('Ổn định');
                } else if (
                  nextStatus === 'Dừng do Máy hỏng' ||
                  nextStatus === 'Dừng do Lỗi thao tác' ||
                  nextStatus === 'Dừng Chất lượng' ||
                  nextStatus === 'Dừng do Sự cố điện' ||
                  nextStatus === 'Tạm Hoãn'
                ) {
                  setHealthTone('rose');
                  setHealthBadge('Nút thắt cổ chai');
                } else if (nextStatus === 'Dừng do Vật liệu' || nextStatus === 'Chờ Vật Tư') {
                  setHealthTone('amber');
                  setHealthBadge('Cần bổ sung vật tư');
                } else if (nextStatus === 'Dừng do Hết Plan') {
                  setHealthTone('amber');
                  setHealthBadge('Chờ kế hoạch');
                } else if (
                  nextStatus === 'Dừng do Thiếu người' ||
                  nextStatus === 'Dừng Bảo dưỡng' ||
                  nextStatus === 'Dừng Vệ Sinh' ||
                  nextStatus === 'Dừng do Lỗi khác' ||
                  nextStatus === 'Đang Lắp Ráp' ||
                  nextStatus === 'Đang cài đặt' ||
                  nextStatus === 'Test Lại'
                ) {
                  setHealthTone('amber');
                  setHealthBadge('Chờ kiểm tra');
                } else if (nextStatus === 'Chạy thử') {
                  setHealthTone('emerald');
                  setHealthBadge('Sắp hoàn thành');
                }
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white font-semibold text-slate-800"
            >
              {(characteristic === 'mas' ? MASS_LINE_STATUSES : NEW_LINE_STATUSES).map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            {characteristic === 'mas' && (
              <div className="mt-1.5 space-y-1">
                <p className="text-[10px] text-sky-700 font-medium">
                  Line Mass: mọi trạng thái dừng máy (trừ Dừng hoàn thành Plan) tự động tính +1 Issue.
                </p>
                {autoStopIssueApplied && isMassStopIssueStatus(statusLabel) && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 border border-rose-200 text-rose-800 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3 shrink-0" />
                    <span>Đã tự động +1 Issue ({statusLabel}) — Bấm Lưu để cập nhật</span>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* 2b. Timeline Section for All Lines */}
          {(() => {
            const isMassLine = characteristic === 'mas';
            const isSetupDone = isMassLine || statusLabel === 'Mass Ready';
            const completed =
              isSetupDone ||
              isLineCompleted({
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
                      <span>
                        {lineName || activeLine.name} ·{' '}
                        {isSetupDone ? 'Setup hoàn thành' : 'Hoàn thành'}
                      </span>
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700">
                      {isMassLine
                        ? 'Line đã chuyển sang Mass — thanh timeline tự động chuyển thành Setup hoàn thành'
                        : isSetupDone
                        ? 'New model đã chọn Mass Ready — thanh timeline chuyển sang Setup hoàn thành'
                        : 'Tự động chuyển màu xanh hoàn thành (100% tiến độ đạt chuẩn)'}
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

          {/* 4. Quick Issue Log (Auto-generated for Mass Stop, Manual for New) */}
          {characteristic === 'mas' ? (
            <div
              className={`border rounded-xl p-4 space-y-3 ${
                autoStopIssueApplied && isMassStopIssueStatus(statusLabel)
                  ? 'border-rose-300 bg-rose-50/60'
                  : 'border-slate-200 bg-slate-50/70'
              }`}
            >
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-bold text-slate-900 inline-flex items-center gap-2">
                  <AlertTriangle
                    className={`w-4 h-4 ${
                      isMassStopIssueStatus(statusLabel) ? 'text-rose-600' : 'text-slate-500'
                    }`}
                  />
                  <span>Ghi nhận Issue mới vào Bảng Theo Dõi Sự Cố (Tự động cho Line Mass)</span>
                </span>
                {autoStopIssueApplied && isMassStopIssueStatus(statusLabel) ? (
                  <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">
                    Tự động sinh +1 Issue
                  </span>
                ) : isMassStopIssueStatus(statusLabel) ? (
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-bold">
                    Đã ghi nhận trạng thái dừng hiện tại
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    Không phát sinh Issue
                  </span>
                )}
              </div>

              {autoStopIssueApplied && isMassStopIssueStatus(statusLabel) ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-rose-200">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="quick-report-issue-title"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Tiêu đề sự cố tự động sinh <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="quick-report-issue-title"
                      type="text"
                      value={newIssueTitle}
                      onChange={(e) => {
                        setNewIssueTitle(e.target.value);
                        if (issueValidationError && e.target.value.trim() && newIssueDesc.trim()) {
                          setIssueValidationError('');
                        }
                      }}
                      placeholder={`VD: ${statusLabel} — Nêu ngắn gọn sự cố...`}
                      className={`w-full rounded-lg border px-3 py-2 bg-white font-semibold focus:outline-none focus:ring-2 ${
                        issueValidationError && !newIssueTitle.trim()
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-rose-300 focus:ring-rose-400'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Mức độ</label>
                    <select
                      value={newIssueSeverity}
                      onChange={(e) => setNewIssueSeverity(e.target.value as IssueSeverity)}
                      className="w-full rounded-lg border border-rose-300 px-3 py-2 bg-white font-semibold"
                    >
                      <option value="high">Khẩn cấp (High)</option>
                      <option value="medium">Trung bình (Medium)</option>
                      <option value="low">Thấp (Low)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-3">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <label
                        htmlFor="quick-report-issue-desc"
                        className="block font-semibold text-slate-700"
                      >
                        Mô tả &amp; chi tiết sự cố dừng máy <span className="text-rose-600">*</span>
                      </label>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          newIssueDesc.trim()
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {newIssueDesc.trim() ? 'Đã khai báo Issue' : 'Bắt buộc khai báo'}
                      </span>
                    </div>
                    <textarea
                      id="quick-report-issue-desc"
                      rows={2}
                      value={newIssueDesc}
                      onChange={(e) => {
                        setNewIssueDesc(e.target.value);
                        if (issueValidationError && e.target.value.trim() && newIssueTitle.trim()) {
                          setIssueValidationError('');
                        }
                      }}
                      placeholder="Bắt buộc nhập chi tiết nguyên nhân dừng máy & hướng xử lý trước khi lưu..."
                      className={`w-full rounded-lg border px-3 py-2 bg-white focus:outline-none focus:ring-2 ${
                        issueValidationError && !newIssueDesc.trim()
                          ? 'border-rose-500 focus:ring-rose-500'
                          : 'border-rose-300 focus:ring-rose-400'
                      }`}
                    />
                  </div>
                </div>
              ) : isMassStopIssueStatus(statusLabel) ? (
                <p className="text-[11px] text-slate-600">
                  Trạng thái <strong>{statusLabel}</strong> của {lineName || activeLine.name} đã có hồ sơ Issue. Đổi sang trạng thái dừng khác để tự động sinh Issue mới.
                </p>
              ) : (
                <p className="text-[11px] text-slate-600">
                  Với Line chạy <strong>Mass</strong>, mục này sẽ tự động sinh ra khi khai báo các trạng thái dừng ở mục trên (trừ <strong>Dừng hoàn thành Plan</strong>).
                </p>
              )}
            </div>
          ) : (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3">
              <label className="flex items-center justify-between cursor-pointer">
                <span className="font-bold text-slate-900 inline-flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>Ghi nhận thêm Issue mới vào Bảng Theo Dõi Sự Cố</span>
                </span>
                <input
                  type="checkbox"
                  checked={addNewIssue}
                  onChange={(e) => {
                    setAddNewIssue(e.target.checked);
                    setIssueValidationError('');
                  }}
                  className="w-4 h-4 accent-rose-600 cursor-pointer"
                />
              </label>

              {addNewIssue && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-200">
                  <div className="sm:col-span-2">
                    <label
                      htmlFor="quick-report-issue-title"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Tiêu đề sự cố phát sinh <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="quick-report-issue-title"
                      type="text"
                      value={newIssueTitle}
                      onChange={(e) => {
                        setNewIssueTitle(e.target.value);
                        if (issueValidationError && e.target.value.trim() && newIssueDesc.trim()) {
                          setIssueValidationError('');
                        }
                      }}
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
                    <label
                      htmlFor="quick-report-issue-desc"
                      className="block font-semibold text-slate-700 mb-1"
                    >
                      Mô tả &amp; đề xuất xử lý <span className="text-rose-600">*</span>
                    </label>
                    <textarea
                      id="quick-report-issue-desc"
                      rows={2}
                      value={newIssueDesc}
                      onChange={(e) => {
                        setNewIssueDesc(e.target.value);
                        if (issueValidationError && e.target.value.trim() && newIssueTitle.trim()) {
                          setIssueValidationError('');
                        }
                      }}
                      placeholder="Bắt buộc nhập chi tiết ảnh hưởng đến tiến độ dây chuyền..."
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {issueValidationError && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700">
              {issueValidationError}
            </div>
          )}

          {vtValidationError && (
            <div className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs font-bold text-rose-700 flex items-center justify-between gap-2">
              <span>{vtValidationError}</span>
              <button
                type="button"
                onClick={() => {
                  setVtPercent(100);
                  setVtValidationError('');
                }}
                className="shrink-0 px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold cursor-pointer"
              >
                Đặt VT 100%
              </button>
            </div>
          )}

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
                aria-disabled={!canSubmitReport}
                className={`px-4 py-2 text-xs font-bold rounded-lg shadow-sm inline-flex items-center gap-1.5 transition ${
                  canSubmitReport
                    ? 'text-white bg-blue-600 hover:bg-blue-700 cursor-pointer'
                    : 'text-slate-500 bg-slate-200 border border-slate-300 cursor-not-allowed'
                }`}
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
