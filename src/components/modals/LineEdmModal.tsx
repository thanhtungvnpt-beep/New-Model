import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  Cpu,
  Lock,
  LockOpen,
  PlusCircle,
  Save,
  ShieldAlert,
  Trash2,
  UserCheck,
  Wrench,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createDefaultKeyMachines,
  formatLineTimestamp,
  getLineFactory,
  getShortFactoryLabel,
} from '../../data/initialData';
import {
  LineEdmWorstItem,
  LineEdmWorstPriority,
  LineEdmWorstStatus,
  LineProcessTaskStatus,
  ProductionCenter,
  ProductionLine,
} from '../../types/production';

interface LineEdmModalProps {
  isOpen: boolean;
  activeCenter: ProductionCenter;
  lines: ProductionLine[];
  initialLineId: string | null;
  isAdminMode: boolean;
  onRequestAdminAuth: () => void;
  onClose: () => void;
  onSaveLineEdm: (
    lineId: string,
    worstItems: LineEdmWorstItem[],
    summaryStatus: LineProcessTaskStatus,
    latestNote?: string
  ) => void;
}

const DEFAULT_WEEKS = [
  'Tuần 47 / 2026',
  'Tuần 48 / 2026',
  'Tuần 49 / 2026',
  'Tuần 50 / 2026',
];

function deriveEdmSummaryStatus(items: LineEdmWorstItem[]): LineProcessTaskStatus {
  if (items.length === 0) return 'Chưa phát sinh';
  return items.some((it) => it.status !== 'Đã hoàn tất đối sách') ? 'Đang thực hiện' : 'Hoàn tất';
}

export function LineEdmModal({
  isOpen,
  activeCenter,
  lines,
  initialLineId,
  isAdminMode,
  onRequestAdminAuth,
  onClose,
  onSaveLineEdm,
}: LineEdmModalProps) {
  const [selectedLineId, setSelectedLineId] = useState<string>(initialLineId || lines[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'list' | 'post-worst'>('list');
  const [weekFilter, setWeekFilter] = useState<string>('all');
  const [machineFilter, setMachineFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LineEdmWorstStatus>('all');

  // Admin Post Worst form state
  const [weekLabel, setWeekLabel] = useState('Tuần 48 / 2026');
  const [selectedMachineName, setSelectedMachineName] = useState('Máy A');
  const [customMachineName, setCustomMachineName] = useState('');
  const [priority, setPriority] = useState<LineEdmWorstPriority>('Cao (Top 1)');
  const [metricValue, setMetricValue] = useState('');
  const [worstTitle, setWorstTitle] = useState('');
  const [worstDetail, setWorstDetail] = useState('');
  const [adminFormError, setAdminFormError] = useState('');

  // Technician Countermeasure inline editor state
  const [editingCountermeasureId, setEditingCountermeasureId] = useState<string | null>(null);
  const [techName, setTechName] = useState('');
  const [techActionText, setTechActionText] = useState('');
  const [techResultNote, setTechResultNote] = useState('');
  const [techStatus, setTechStatus] = useState<LineEdmWorstStatus>('Đang triển khai đối sách');
  const [techError, setTechError] = useState('');

  const activeLine = lines.find((l) => l.id === selectedLineId) || lines[0];

  const getMachinesForLine = (line: ProductionLine | undefined) => {
    if (!line) return createDefaultKeyMachines('line', 1);
    return line.keyMachines && line.keyMachines.length > 0
      ? line.keyMachines
      : createDefaultKeyMachines(line.id, 1);
  };

  const resetFormsForLine = (line: ProductionLine | undefined) => {
    const machines = getMachinesForLine(line);
    setSelectedMachineName(machines[0]?.name || 'Máy A');
    setCustomMachineName('');
    setWeekLabel('Tuần 48 / 2026');
    setPriority('Cao (Top 1)');
    setMetricValue('');
    setWorstTitle('');
    setWorstDetail('');
    setAdminFormError('');
    setEditingCountermeasureId(null);
    setTechName('');
    setTechActionText('');
    setTechResultNote('');
    setTechStatus('Đang triển khai đối sách');
    setTechError('');
  };

  useEffect(() => {
    if (!isOpen) return;
    const target = lines.find((l) => l.id === (initialLineId || selectedLineId)) || lines[0];
    if (target) {
      setSelectedLineId(target.id);
      setActiveTab('list');
      setWeekFilter('all');
      setMachineFilter('all');
      setStatusFilter('all');
      resetFormsForLine(target);
    }
  }, [isOpen, initialLineId]);

  if (!isOpen || !activeLine) return null;

  const lineMachines = getMachinesForLine(activeLine);
  const worstItems: LineEdmWorstItem[] = activeLine.edm?.worstItems ?? [];

  const waitingCount = worstItems.filter((it) => it.status === 'Chờ đối sách').length;
  const inProgressCount = worstItems.filter(
    (it) => it.status === 'Đang triển khai đối sách'
  ).length;
  const resolvedCount = worstItems.filter((it) => it.status === 'Đã hoàn tất đối sách').length;

  const weekOptions = Array.from(new Set(worstItems.map((it) => it.weekLabel))).sort();
  const machineOptions = Array.from(
    new Set([...lineMachines.map((m) => m.name), ...worstItems.map((it) => it.machineName)])
  );

  const filteredItems = worstItems.filter((it) => {
    if (weekFilter !== 'all' && it.weekLabel !== weekFilter) return false;
    if (machineFilter !== 'all' && it.machineName !== machineFilter) return false;
    if (statusFilter !== 'all' && it.status !== statusFilter) return false;
    return true;
  });

  const handleSelectLine = (lineId: string) => {
    const target = lines.find((l) => l.id === lineId);
    if (!target) return;
    setSelectedLineId(target.id);
    setActiveTab('list');
    setWeekFilter('all');
    setMachineFilter('all');
    setStatusFilter('all');
    resetFormsForLine(target);
  };

  const handleAdminPostWorst = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminMode) {
      onRequestAdminAuth();
      return;
    }
    const resolvedMachine =
      selectedMachineName === '__custom__' ? customMachineName.trim() : selectedMachineName.trim();
    if (!weekLabel.trim() || !resolvedMachine || !worstTitle.trim() || !worstDetail.trim()) {
      setAdminFormError('Vui lòng nhập đầy đủ Tuần, Máy, Tiêu đề Worst và Mô tả chi tiết.');
      return;
    }

    const matchedMachine = lineMachines.find((m) => m.name === resolvedMachine);
    const newWorst: LineEdmWorstItem = {
      id: `edm-${activeLine.id}-${Date.now()}`,
      weekLabel: weekLabel.trim(),
      machineName: resolvedMachine,
      machineIp: matchedMachine?.ip,
      worstTitle: worstTitle.trim(),
      worstDetail: worstDetail.trim(),
      metricValue: metricValue.trim() || undefined,
      priority,
      postedByAdmin: `Admin_${activeCenter.code}`,
      createdAt: formatLineTimestamp(),
      status: 'Chờ đối sách',
    };

    const nextItems = [newWorst, ...worstItems];
    onSaveLineEdm(
      activeLine.id,
      nextItems,
      deriveEdmSummaryStatus(nextItems),
      `${newWorst.weekLabel} · ${newWorst.machineName}: ${newWorst.worstTitle}`
    );
    resetFormsForLine(activeLine);
    setActiveTab('list');
  };

  const openCountermeasureEditor = (item: LineEdmWorstItem) => {
    setEditingCountermeasureId(item.id);
    setTechName(item.countermeasure?.technicianName || '');
    setTechActionText(item.countermeasure?.actionText || '');
    setTechResultNote(item.countermeasure?.resultNote || '');
    setTechStatus(
      item.status === 'Chờ đối sách' ? 'Đang triển khai đối sách' : item.status
    );
    setTechError('');
  };

  const handleSaveCountermeasure = (itemId: string) => {
    if (!techName.trim() || !techActionText.trim()) {
      setTechError('Vui lòng nhập Tên Kỹ thuật viên và Nội dung đối sách.');
      return;
    }

    const nowTs = formatLineTimestamp();
    const nextItems = worstItems.map((it) =>
      it.id === itemId
        ? {
            ...it,
            status: techStatus,
            countermeasure: {
              technicianName: techName.trim(),
              actionText: techActionText.trim(),
              resultNote: techResultNote.trim() || undefined,
              updatedAt: nowTs,
            },
          }
        : it
    );

    const updatedTarget = nextItems.find((it) => it.id === itemId);
    onSaveLineEdm(
      activeLine.id,
      nextItems,
      deriveEdmSummaryStatus(nextItems),
      updatedTarget
        ? `${updatedTarget.machineName} (${updatedTarget.status}): ${updatedTarget.worstTitle}`
        : undefined
    );
    setEditingCountermeasureId(null);
    setTechError('');
  };

  const handleDeleteWorst = (itemId: string) => {
    const nextItems = worstItems.filter((it) => it.id !== itemId);
    onSaveLineEdm(
      activeLine.id,
      nextItems,
      deriveEdmSummaryStatus(nextItems),
      nextItems[0] ? `${nextItems[0].weekLabel} · ${nextItems[0].machineName}` : undefined
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <Zap className="w-5 h-5 text-yellow-200" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Quản Lý EDM (Worst Tuần Theo Máy &amp; Đối Sách KTV) — {activeLine.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/25">
                  {activeCenter.code} · {getShortFactoryLabel(getLineFactory(activeLine))}
                </span>
                {isAdminMode && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-900 text-amber-300 inline-flex items-center gap-1">
                    <LockOpen className="w-3 h-3" />
                    <span>Admin Mode</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-amber-50 mt-0.5">
                Admin đăng danh sách Worst theo từng tuần cho từng máy · Kỹ thuật viên (KTV) trực tiếp post đối sách xử lý
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

        {/* Line Switcher Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {lines.map((line) => {
            const isActive = line.id === activeLine.id;
            const count = line.edm?.worstItems ? line.edm.worstItems.length : line.edm?.count ?? 0;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => handleSelectLine(line.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Zap className="w-3 h-3" />
                <span>{line.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary & Tab Switcher */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold tabular-nums">
              Tổng Worst: {worstItems.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold tabular-nums">
              Chờ đối sách: {waitingCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold tabular-nums">
              Đang triển khai: {inProgressCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold tabular-nums">
              Hoàn tất: {resolvedCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('list')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'list'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Worst &amp; Đối Sách KTV ({worstItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('post-worst')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'post-worst'
                  ? 'bg-amber-600 text-white shadow-sm'
                  : 'bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-600 hover:text-white'
              }`}
            >
              {isAdminMode ? <PlusCircle className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
              <span>Admin Post Worst Tuần</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs bg-slate-50/50">
          {activeTab === 'post-worst' ? (
            !isAdminMode ? (
              <div className="bg-white rounded-2xl border-2 border-dashed border-amber-300 p-8 text-center space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h4 className="text-sm font-bold text-slate-900">
                  Xác Thực Quyền Admin Để Post Worst Theo Tuần Cho Máy
                </h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Chỉ Quản trị viên (Admin) mới có quyền đăng danh sách lỗi Worst theo từng tuần cho từng máy trên {activeLine.name}. Kỹ thuật viên sau đó có thể post đối sách trực tiếp ở danh sách bên ngoài.
                </p>
                <button
                  type="button"
                  onClick={onRequestAdminAuth}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-sm cursor-pointer"
                >
                  <Lock className="w-4 h-4" />
                  <span>Mở khóa quyền Admin</span>
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleAdminPostWorst}
                className="bg-white rounded-2xl border border-amber-200 p-5 space-y-4 shadow-xs"
              >
                <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <h4 className="text-sm font-bold text-slate-900">
                      Admin Post Worst Theo Tuần — {activeLine.name}
                    </h4>
                  </div>
                  <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold inline-flex items-center gap-1">
                    <LockOpen className="w-3 h-3" />
                    <span>Admin_{activeCenter.code} đang mở khóa</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <label className="block">
                    <span className="font-bold text-slate-700 block mb-1">
                      Tuần báo cáo <span className="text-rose-600">*</span>
                    </span>
                    <input
                      required
                      type="text"
                      list="edm-week-suggestions"
                      value={weekLabel}
                      onChange={(e) => {
                        setWeekLabel(e.target.value);
                        if (adminFormError) setAdminFormError('');
                      }}
                      placeholder="VD: Tuần 48 / 2026"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                    <datalist id="edm-week-suggestions">
                      {DEFAULT_WEEKS.map((w) => (
                        <option key={w} value={w} />
                      ))}
                    </datalist>
                  </label>

                  <div className="block">
                    <label className="font-bold text-slate-700 block mb-1">
                      Chọn Máy trên Line <span className="text-rose-600">*</span>
                    </label>
                    <select
                      value={selectedMachineName}
                      onChange={(e) => {
                        setSelectedMachineName(e.target.value);
                        if (adminFormError) setAdminFormError('');
                      }}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white font-semibold text-slate-800"
                    >
                      {lineMachines.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.ip})
                        </option>
                      ))}
                      <option value="__custom__">+ Nhập tên máy khác...</option>
                    </select>
                    {selectedMachineName === '__custom__' && (
                      <input
                        type="text"
                        value={customMachineName}
                        onChange={(e) => setCustomMachineName(e.target.value)}
                        placeholder="Nhập tên máy (VD: Máy D)"
                        className="mt-1.5 w-full rounded-lg border border-amber-300 px-2.5 py-1.5 text-xs"
                      />
                    )}
                  </div>

                  <label className="block">
                    <span className="font-bold text-slate-700 block mb-1">Mức độ Worst</span>
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as LineEdmWorstPriority)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white font-semibold text-slate-800"
                    >
                      <option value="Cao (Top 1)">Cao (Top 1)</option>
                      <option value="Trung bình">Trung bình</option>
                      <option value="Theo dõi">Theo dõi</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="font-bold text-slate-700 block mb-1">
                      Chỉ số / Tỷ lệ lỗi
                    </span>
                    <input
                      type="text"
                      value={metricValue}
                      onChange={(e) => setMetricValue(e.target.value)}
                      placeholder="VD: 4.5% NG, 8 lần dừng"
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 font-bold text-rose-700"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">
                    Tên lỗi Worst (Worst Issue) <span className="text-rose-600">*</span>
                  </span>
                  <input
                    required
                    type="text"
                    value={worstTitle}
                    onChange={(e) => {
                      setWorstTitle(e.target.value);
                      if (adminFormError) setAdminFormError('');
                    }}
                    placeholder="VD: Mòn điện cực khuôn dẫn hướng trên Máy B làm tăng ba-via..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">
                    Chi tiết hiện trạng &amp; yêu cầu đối sách <span className="text-rose-600">*</span>
                  </span>
                  <textarea
                    required
                    rows={3}
                    value={worstDetail}
                    onChange={(e) => {
                      setWorstDetail(e.target.value);
                      if (adminFormError) setAdminFormError('');
                    }}
                    placeholder="Mô tả chi tiết lỗi Worst phát sinh trong tuần để Kỹ thuật viên kiểm tra và lập đối sách..."
                    className="w-full rounded-lg border border-slate-300 p-2.5 text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </label>

                {adminFormError && (
                  <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 font-bold text-rose-700">
                    {adminFormError}
                  </div>
                )}

                <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('list')}
                    className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                  >
                    Quay lại danh sách
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Đăng Worst Tuần Cho Máy</span>
                  </button>
                </div>
              </form>
            )
          ) : (
            <div className="space-y-4">
              {/* Filter Bar: Week + Machine + Status */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <label className="block">
                  <span className="text-[10.5px] font-bold text-slate-500 block mb-1">
                    Lọc theo Tuần
                  </span>
                  <select
                    value={weekFilter}
                    onChange={(e) => setWeekFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="all">Tất cả các tuần ({worstItems.length})</option>
                    {weekOptions.map((w) => (
                      <option key={w} value={w}>
                        {w}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10.5px] font-bold text-slate-500 block mb-1">
                    Lọc theo Máy
                  </span>
                  <select
                    value={machineFilter}
                    onChange={(e) => setMachineFilter(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="all">Tất cả các máy</option>
                    {machineOptions.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10.5px] font-bold text-slate-500 block mb-1">
                    Trạng thái đối sách
                  </span>
                  <select
                    value={statusFilter}
                    onChange={(e) =>
                      setStatusFilter(e.target.value as 'all' | LineEdmWorstStatus)
                    }
                    className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-800"
                  >
                    <option value="all">Tất cả trạng thái</option>
                    <option value="Chờ đối sách">Chờ đối sách ({waitingCount})</option>
                    <option value="Đang triển khai đối sách">
                      Đang triển khai đối sách ({inProgressCount})
                    </option>
                    <option value="Đã hoàn tất đối sách">
                      Đã hoàn tất đối sách ({resolvedCount})
                    </option>
                  </select>
                </label>
              </div>

              {filteredItems.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-10 px-4 text-center space-y-2.5">
                  <Zap className="w-8 h-8 text-amber-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    {worstItems.length === 0
                      ? `Chưa có mục Worst nào được Admin đăng cho ${activeLine.name}`
                      : 'Không có mục Worst phù hợp với bộ lọc Tuần / Máy hiện tại'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Admin có thể chuyển sang tab &ldquo;Admin Post Worst Tuần&rdquo; để giao Worst cho từng máy trên {activeLine.name}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('post-worst')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Admin Post Worst Tuần</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredItems.map((item) => {
                    const isEditingCm = editingCountermeasureId === item.id;
                    const statusBadgeClass =
                      item.status === 'Đã hoàn tất đối sách'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                        : item.status === 'Đang triển khai đối sách'
                        ? 'bg-amber-100 text-amber-800 border-amber-200'
                        : 'bg-rose-100 text-rose-800 border-rose-200';
                    const priorityBadgeClass =
                      item.priority === 'Cao (Top 1)'
                        ? 'bg-rose-600 text-white'
                        : item.priority === 'Trung bình'
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-600 text-white';

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                      >
                        {/* Worst Header */}
                        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 text-[10px] font-extrabold">
                                <Calendar className="w-3 h-3" />
                                <span>{item.weekLabel}</span>
                              </span>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-extrabold">
                                <Cpu className="w-3 h-3 text-blue-600" />
                                <span>
                                  {item.machineName}
                                  {item.machineIp ? ` (${item.machineIp})` : ''}
                                </span>
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${priorityBadgeClass}`}
                              >
                                {item.priority}
                              </span>
                              {item.metricValue && (
                                <span className="px-2 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-extrabold tabular-nums">
                                  {item.metricValue}
                                </span>
                              )}
                            </div>
                            <h5 className="text-sm font-bold text-slate-900">{item.worstTitle}</h5>
                            <p className="text-xs text-slate-600">{item.worstDetail}</p>
                            <div className="flex items-center gap-3 text-[10.5px] text-slate-500 pt-0.5">
                              <span>
                                Đăng bởi: <strong className="text-slate-700">{item.postedByAdmin}</strong>
                              </span>
                              <span className="inline-flex items-center gap-1 tabular-nums">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{item.createdAt}</span>
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <span
                              className={`px-2.5 py-1 rounded-full border text-[10.5px] font-bold ${statusBadgeClass}`}
                            >
                              {item.status}
                            </span>
                            {isAdminMode && (
                              <button
                                type="button"
                                onClick={() => handleDeleteWorst(item.id)}
                                title="Xóa mục Worst này (Admin)"
                                className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Technician Countermeasure Section */}
                        {isEditingCm ? (
                          <div className="rounded-xl border-2 border-blue-300 bg-blue-50/50 p-3.5 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold text-blue-900 inline-flex items-center gap-1.5">
                                <Wrench className="w-3.5 h-3.5 text-blue-700" />
                                <span>Kỹ Thuật Viên Post Đối Sách Cho {item.machineName}</span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCountermeasureId(null);
                                  setTechError('');
                                }}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              <label className="block">
                                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                                  Tên Kỹ thuật viên (KTV) <span className="text-rose-600">*</span>
                                </span>
                                <input
                                  type="text"
                                  value={techName}
                                  onChange={(e) => {
                                    setTechName(e.target.value);
                                    if (techError) setTechError('');
                                  }}
                                  placeholder="VD: KTV Nguyễn Văn An"
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900"
                                />
                              </label>

                              <label className="block">
                                <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                                  Trạng thái xử lý
                                </span>
                                <select
                                  value={techStatus}
                                  onChange={(e) =>
                                    setTechStatus(e.target.value as LineEdmWorstStatus)
                                  }
                                  className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-800"
                                >
                                  <option value="Đang triển khai đối sách">
                                    Đang triển khai đối sách
                                  </option>
                                  <option value="Đã hoàn tất đối sách">
                                    Đã hoàn tất đối sách
                                  </option>
                                  <option value="Chờ đối sách">Chờ đối sách</option>
                                </select>
                              </label>
                            </div>

                            <label className="block">
                              <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                                Nội dung Đối sách kỹ thuật <span className="text-rose-600">*</span>
                              </span>
                              <textarea
                                rows={2}
                                value={techActionText}
                                onChange={(e) => {
                                  setTechActionText(e.target.value);
                                  if (techError) setTechError('');
                                }}
                                placeholder="Nhập biện pháp khắc phục trực tiếp trên máy (thay linh kiện, bắn sửa EDM, căn chỉnh thông số)..."
                                className="w-full rounded-lg border border-slate-300 bg-white p-2.5 text-xs text-slate-800"
                              />
                            </label>

                            <label className="block">
                              <span className="text-[11px] font-semibold text-slate-700 block mb-1">
                                Kết quả kiểm chứng sau đối sách (tùy chọn)
                              </span>
                              <input
                                type="text"
                                value={techResultNote}
                                onChange={(e) => setTechResultNote(e.target.value)}
                                placeholder="VD: Đã test 50 mẫu, tỷ lệ NG giảm về 0.2%"
                                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800"
                              />
                            </label>

                            {techError && (
                              <p className="text-[11px] font-bold text-rose-600">{techError}</p>
                            )}

                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingCountermeasureId(null);
                                  setTechError('');
                                }}
                                className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                              >
                                Hủy
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSaveCountermeasure(item.id)}
                                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1.5 cursor-pointer"
                              >
                                <Save className="w-3.5 h-3.5" />
                                <span>Lưu Đối Sách KTV</span>
                              </button>
                            </div>
                          </div>
                        ) : item.countermeasure ? (
                          <div
                            className={`rounded-xl border p-3.5 space-y-1.5 ${
                              item.status === 'Đã hoàn tất đối sách'
                                ? 'border-emerald-200 bg-emerald-50/50'
                                : 'border-amber-200 bg-amber-50/50'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <span className="inline-flex items-center gap-1.5 font-bold text-slate-900">
                                <UserCheck className="w-3.5 h-3.5 text-emerald-700" />
                                <span>Đối sách của {item.countermeasure.technicianName}</span>
                                <span className="text-[10.5px] font-normal text-slate-500 tabular-nums">
                                  ({item.countermeasure.updatedAt})
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => openCountermeasureEditor(item)}
                                className="px-2.5 py-1 rounded-lg bg-white hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-300 text-[11px] font-bold transition cursor-pointer"
                              >
                                Cập nhật đối sách
                              </button>
                            </div>
                            <p className="text-xs text-slate-800 font-medium">
                              {item.countermeasure.actionText}
                            </p>
                            {item.countermeasure.resultNote && (
                              <p className="text-[11px] font-bold text-emerald-800 inline-flex items-center gap-1 pt-0.5">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>Kết quả: {item.countermeasure.resultNote}</span>
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-xl border border-dashed border-rose-300 bg-rose-50/40 px-3.5 py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-xs font-semibold text-rose-800">
                              Chưa có đối sách từ Kỹ thuật viên cho {item.machineName} ({item.weekLabel})
                            </span>
                            <button
                              type="button"
                              onClick={() => openCountermeasureEditor(item)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-xs transition cursor-pointer shrink-0"
                            >
                              <Wrench className="w-3.5 h-3.5" />
                              <span>KTV: Post Đối Sách</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Worst theo tuần &amp; đối sách KTV được lưu theo từng máy trên {activeLine.name} và bảo toàn khi chuyển nhà máy
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
