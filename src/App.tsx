import { ArrowLeft, CheckCircle2, X } from 'lucide-react';
import { useState } from 'react';
import { IssuesSection } from './components/IssuesSection';
import { KpiAndToolbar } from './components/KpiAndToolbar';
import { LineNetworkDiagram } from './components/LineNetworkDiagram';
import { PipelineStepper } from './components/PipelineStepper';
import { TargetDemandSpecs } from './components/TargetDemandSpecs';
import { TopNav } from './components/TopNav';
import {
  AddLineModal,
  AdminAuthModal,
  AlertNotificationModal,
  AuditHistoryModal,
  CenterManagementModal,
  ExportIssuesModal,
  IssueDetailModal,
} from './components/modals/GovernanceModals';
import { LineIssuesModal } from './components/modals/LineIssuesModal';
import { LineQuickReportModal } from './components/modals/LineQuickReportModal';
import {
  OperationFormModal,
  PurchasingReportModal,
  UploadDemandModal,
  VendorFieldReportModal,
} from './components/modals/OperationModals';
import {
  INITIAL_CENTERS,
  createInitialCenterData,
  downloadCsvFile,
  formatLineTimestamp,
  getDefaultLineCode,
  getLineFactory,
  getStatusHealthMeta,
} from './data/initialData';
import {
  AppScreen,
  AuditLogEntry,
  CenterAccentColor,
  isMassStopIssueStatus,
  IssueItem,
  IssueSeverity,
  LineHealthStatus,
  LineTransferHistoryEntry,
  OperationTab,
  PipelineItem,
  ProductionCenter,
  ProductionLine,
  ToastNotification,
} from './types/production';

function getNextIssueId(list: IssueItem[], offset = 0): string {
  const maxNum = list.reduce((max, item) => {
    const match = /^ISS-(\d+)$/.exec(item.id);
    return match ? Math.max(max, Number(match[1])) : max;
  }, 0);
  return `ISS-${String(maxNum + 1 + offset).padStart(3, '0')}`;
}

export default function App() {
  const [centers, setCenters] = useState<ProductionCenter[]>(INITIAL_CENTERS);
  const [activeCenterId, setActiveCenterId] = useState<string>(INITIAL_CENTERS[0].id);
  const activeCenter = centers.find((c) => c.id === activeCenterId) || centers[0];

  const { selectedProject, lines, pipelineItems, issues, auditLogs } = activeCenter;

  const updateActiveCenter = (updater: (center: ProductionCenter) => ProductionCenter) => {
    setCenters((prev) => prev.map((c) => (c.id === activeCenter.id ? updater(c) : c)));
  };

  const setSelectedProject = (proj: string) =>
    updateActiveCenter((c) => ({ ...c, selectedProject: proj }));

  const setLines = (
    updater: ProductionLine[] | ((prev: ProductionLine[]) => ProductionLine[])
  ) =>
    updateActiveCenter((c) => ({
      ...c,
      lines: typeof updater === 'function' ? updater(c.lines) : updater,
    }));

  const setPipelineItems = (
    updater: PipelineItem[] | ((prev: PipelineItem[]) => PipelineItem[])
  ) =>
    updateActiveCenter((c) => ({
      ...c,
      pipelineItems: typeof updater === 'function' ? updater(c.pipelineItems) : updater,
    }));

  const setIssues = (updater: IssueItem[] | ((prev: IssueItem[]) => IssueItem[])) =>
    updateActiveCenter((c) => ({
      ...c,
      issues: typeof updater === 'function' ? updater(c.issues) : updater,
    }));

  const setAuditLogs = (
    updater: AuditLogEntry[] | ((prev: AuditLogEntry[]) => AuditLogEntry[])
  ) =>
    updateActiveCenter((c) => ({
      ...c,
      auditLogs: typeof updater === 'function' ? updater(c.auditLogs) : updater,
    }));

  const [selectedLineFilter, setSelectedLineFilter] = useState('all');
  const [activeScreen, setActiveScreen] = useState<AppScreen>('overview');

  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminAuthIntent, setAdminAuthIntent] = useState<'demand' | 'line' | 'center'>('demand');
  const [lastAdminReason, setLastAdminReason] = useState('');

  // Modals state
  const [opModalOpen, setOpModalOpen] = useState(false);
  const [opModalTab, setOpModalTab] = useState<OperationTab>('po');
  const [uploadDemandOpen, setUploadDemandOpen] = useState(false);
  const [purchasingOpen, setPurchasingOpen] = useState(false);
  const [purchasingFocusItem, setPurchasingFocusItem] = useState<string | null>(null);
  const [vendorFieldOpen, setVendorFieldOpen] = useState(false);
  const [adminAuthOpen, setAdminAuthOpen] = useState(false);
  const [auditHistoryOpen, setAuditHistoryOpen] = useState(false);
  const [exportIssuesOpen, setExportIssuesOpen] = useState(false);
  const [alertModalOpen, setAlertModalOpen] = useState(false);
  const [addLineOpen, setAddLineOpen] = useState(false);
  const [centerManagerOpen, setCenterManagerOpen] = useState(false);
  const [editingIssueId, setEditingIssueId] = useState<string | null>(null);
  const [quickReportLineId, setQuickReportLineId] = useState<string | null>(null);
  const [inspectIssuesTarget, setInspectIssuesTarget] = useState<string | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const pushToast = (
    title: string,
    message: string,
    variant: ToastNotification['variant'] = 'emerald'
  ) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts((prev) => [...prev, { id, title, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const activeIssue = editingIssueId ? issues.find((i) => i.id === editingIssueId) ?? null : null;

  const handleSavePurchasingReport = (updatedItems: PipelineItem[]) => {
    setPipelineItems(updatedItems);
    // Auto-sync purchase issues into issues tracker
    setIssues((prevIssues) => {
      const next = [...prevIssues];
      updatedItems.forEach((item) => {
        const text = item.purchaseIssue.trim();
        if (!text) return;
        const existingIdx = next.findIndex(
          (iss) => iss.id === item.linkedIssueId || (iss.isSynced && iss.itemCode.startsWith(item.itemNo + ' '))
        );
        if (existingIdx >= 0) {
          next[existingIdx] = {
            ...next[existingIdx],
            title: text,
            description: `Cập nhật từ Form Mua Hàng (${item.itemNo} - ${item.name}): ${text}`,
          };
        } else {
          const newId = `ISS-${String(next.length + 101).padStart(3, '0')}`;
          next.unshift({
            id: newId,
            line: 'Form Mua Hàng',
            itemCode: `${item.itemNo} - ${item.name}`,
            title: text,
            description: `Tự động đồng bộ từ Form Mua Hàng: ${text}`,
            severity: 'high',
            assignee: 'Bộ Phận Mua Hàng',
            assigneeRole: 'Phụ trách PO',
            duration: 'Vừa xong',
            sinceTime: 'Hôm nay',
            statusText: 'Mới tiếp nhận',
            progress: 10,
            notes: text,
            isSynced: true,
          });
        }
      });
      return next;
    });
    pushToast(
      'Cập nhật Mua hàng (PO)',
      'Đã lưu báo cáo mua hàng và đồng bộ sự cố vào bảng giám sát.'
    );
  };

  const handleSaveVendorFieldReport = (updatedItems: PipelineItem[]) => {
    setPipelineItems(updatedItems);
    pushToast(
      'Đồng bộ Hiện trường Vendor',
      'Đã cập nhật dữ liệu 7 cột hiện trường vào chuỗi cung ứng.'
    );
  };

  const handleSaveTargetDemands = (updatedTargets: Record<string, number>) => {
    const diffs: string[] = [];
    setPipelineItems((prev) =>
      prev.map((it) => {
        const nextVal = updatedTargets[it.itemNo];
        if (nextVal !== undefined && nextVal !== it.targetDemand) {
          diffs.push(`${it.itemNo} (${it.targetDemand} -> ${nextVal})`);
          return { ...it, targetDemand: nextVal };
        }
        return it;
      })
    );

    if (diffs.length > 0) {
      const now = new Date();
      const timeStr = `Hôm nay, ${now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      setAuditLogs((prev) => [
        {
          version: `v1.${prev.length}`,
          isCurrent: true,
          timestamp: timeStr,
          author: `Admin_${activeCenter.code}`,
          reason: lastAdminReason || 'Điều chỉnh định mức Target Demand trực tiếp',
          changes: diffs.join(', '),
          tone: 'blue',
        },
        ...prev.map((entry) => ({ ...entry, isCurrent: false })),
      ]);
    }
    setIsAdminMode(false);
    pushToast(
      'Lưu định mức thành công',
      'Đã cập nhật Target Demand và ghi vào nhật ký kiểm toán (Audit Trail).'
    );
  };

  const handleCreateIssue = (payload: {
    line: string;
    severity: 'high' | 'medium' | 'low';
    title: string;
    description: string;
    assignee: string;
  }) => {
    const nowTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const newId = getNextIssueId(issues);
    const newIssue: IssueItem = {
      id: newId,
      line: payload.line,
      itemCode: 'A1 - ABC1',
      title: payload.title,
      description: payload.description,
      severity: payload.severity,
      assignee: payload.assignee,
      assigneeRole: 'Kỹ sư hiện trường',
      duration: '5m',
      sinceTime: `Hôm nay, ${nowTime}`,
      statusText: 'Đang kiểm tra',
      progress: 15,
      notes: payload.description,
      history: [
        {
          timestamp: `Hôm nay, ${nowTime}`,
          progress: 15,
          statusText: 'Đang kiểm tra',
          note: payload.description,
          author: payload.assignee,
        },
      ],
    };
    setIssues((prev) => [newIssue, ...prev]);
    setLines((prev) =>
      prev.map((l) =>
        l.name === payload.line
          ? { ...l, issueCount: l.issueCount + 1, updatedAt: formatLineTimestamp() }
          : l
      )
    );
    pushToast('Đã tạo báo cáo sự cố', `Sự cố ${newId} tại ${payload.line} đã được ghi nhận.`);
  };

  const handleSaveIssueProgress = (issueId: string, progress: number, notes: string) => {
    const targetIssue = issues.find((i) => i.id === issueId);
    if (!targetIssue) return;

    const nowTime = `Hôm nay, ${new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    const prevProgress = targetIssue.progress;
    const wasResolved = prevProgress >= 100;
    const isNowResolved = progress >= 100;
    const delta = !wasResolved && isNowResolved ? -1 : wasResolved && !isNowResolved ? 1 : 0;
    const nextStatusText =
      progress >= 100 ? 'Đã khắc phục (100%)' : progress >= 70 ? 'Sắp hoàn tất' : 'Đang xử lý';

    setIssues((prev) =>
      prev.map((iss) => {
        if (iss.id !== issueId) return iss;
        const baseHistory =
          iss.history && iss.history.length > 0
            ? iss.history
            : [
                {
                  timestamp: iss.sinceTime,
                  progress: iss.progress,
                  statusText: iss.statusText,
                  note: iss.notes,
                  author: iss.assignee,
                },
              ];
        return {
          ...iss,
          progress,
          notes,
          statusText: nextStatusText,
          resolvedAt: isNowResolved ? iss.resolvedAt || nowTime : undefined,
          history: [
            {
              timestamp: nowTime,
              progress,
              statusText: nextStatusText,
              note: notes,
              author: iss.assignee,
            },
            ...baseHistory,
          ],
        };
      })
    );

    setLines((prev) =>
      prev.map((l) =>
        l.name === targetIssue.line
          ? {
              ...l,
              issueCount: delta !== 0 ? Math.max(0, l.issueCount + delta) : l.issueCount,
              updatedAt: formatLineTimestamp(),
            }
          : l
      )
    );

    if (delta === -1) {
      pushToast(
        `Đã khắc phục 100% ${issueId} — Tự động trừ 1 Issue`,
        `${targetIssue.line} đã tự động giảm số Issue tồn đọng.`
      );
    } else if (delta === 1) {
      pushToast(
        `Mở lại sự cố ${issueId}`,
        `${targetIssue.line} đã cộng lại 1 Issue tồn đọng.`,
        'amber'
      );
    } else {
      pushToast('Cập nhật tiến độ', `Đã cập nhật tiến độ sự cố ${issueId} lên ${progress}%.`);
    }
  };

  const handleExportFullReport = () => {
    downloadCsvFile(
      `${activeCenter.code}_Bao_Cao_Tien_Do_${selectedProject}.csv`,
      [
        'Item No',
        'Tên Item',
        'Target Demand',
        'Cần mua',
        'Đã về kho',
        'Kho - Cải Tiến',
        'Kho - EDM',
        'Nhập Vendor',
        'Set lên Line',
        'Line Test',
        'Issue Mua Hàng',
      ],
      pipelineItems.map((it) => [
        it.itemNo,
        it.name,
        it.targetDemand,
        it.toBuy,
        it.inWarehouse,
        it.warehouseImprovement ?? 0,
        it.warehouseEdm ?? 0,
        it.vendorInbound,
        it.stagedOnLine,
        it.lineTested,
        it.purchaseIssue || 'Không có',
      ])
    );
    pushToast('Xuất báo cáo thành công', `Đã tải xuống báo cáo tổng hợp dự án ${selectedProject}.`);
  };

  const handleExportAllIssues = () => {
    downloadCsvFile(
      `${activeCenter.code}_Issues_Tracker.csv`,
      ['Mã SC', 'Dây Chuyền', 'Mã Item', 'Vấn Đề', 'Mức Độ', 'Phụ Trách', 'Tồn Đọng', 'Tiến Độ (%)'],
      issues.map((i) => [
        i.id,
        i.line,
        i.itemCode,
        i.title,
        i.severity,
        i.assignee,
        i.duration,
        `${i.progress}%`,
      ])
    );
    pushToast('Xuất Excel sự cố', `Đã tải xuống danh sách ${issues.length} sự cố dây chuyền.`);
  };

  const handleDownloadTemplate = (name: string) => {
    downloadCsvFile(
      name,
      ['Item No', 'Tên Item', 'Target Demand', 'Cần mua', 'Đã về kho', 'Kho - Cải Tiến', 'Kho - EDM', 'Issue tracker'],
      pipelineItems.map((it) => [
        it.itemNo,
        it.name,
        it.targetDemand,
        it.toBuy,
        it.inWarehouse,
        it.warehouseImprovement ?? 0,
        it.warehouseEdm ?? 0,
        it.purchaseIssue,
      ])
    );
    pushToast('Đã tải tệp mẫu', `Tệp ${name} đã được tải về máy.`);
  };

  const handleSaveLineQuickReport = (
    updatedLine: ProductionLine,
    newIssue?: {
      title: string;
      severity: 'high' | 'medium' | 'low';
      description: string;
    },
    adminEdited?: boolean,
    syncLeaderToIssues?: boolean
  ) => {
    const prevLine = lines.find((l) => l.id === updatedLine.id);
    setLines((prev) => prev.map((l) => (l.id === updatedLine.id ? updatedLine : l)));

    const nameChanged = Boolean(prevLine && prevLine.name !== updatedLine.name);
    const leaderSyncNeeded = Boolean(
      syncLeaderToIssues && prevLine && prevLine.leader !== updatedLine.leader
    );

    if (nameChanged || leaderSyncNeeded) {
      const matchLineName = prevLine?.name || updatedLine.name;
      setIssues((prev) =>
        prev.map((iss) => {
          if (iss.line !== matchLineName) return iss;
          const nextLineName = nameChanged ? updatedLine.name : iss.line;
          const nextAssignee =
            leaderSyncNeeded && iss.progress < 100 ? updatedLine.leader : iss.assignee;
          const nextRole =
            leaderSyncNeeded && iss.progress < 100
              ? `Line Leader ${updatedLine.name}`
              : iss.assigneeRole;
          return {
            ...iss,
            line: nextLineName,
            assignee: nextAssignee,
            assigneeRole: nextRole,
          };
        })
      );
      if (nameChanged && prevLine && selectedLineFilter === prevLine.name) {
        setSelectedLineFilter(updatedLine.name);
      }
    }

    if (adminEdited && prevLine) {
      const now = new Date();
      const timeStr = `Hôm nay, ${now.toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
      })}`;
      const charChanged = prevLine.characteristic !== updatedLine.characteristic;
      const charChangeText = charChanged
        ? `, Đặc tính: ${prevLine.characteristic === 'new' ? 'New' : 'Mass'} -> ${
            updatedLine.characteristic === 'new' ? 'New' : 'Mass'
          }`
        : '';
      setAuditLogs((prev) => [
        {
          version: `v1.${prev.length}`,
          isCurrent: true,
          timestamp: timeStr,
          author: `Admin_${activeCenter.code}`,
          reason:
            lastAdminReason ||
            (charChanged
              ? `Admin chuyển đổi đặc tính ${updatedLine.name} (${
                  prevLine.characteristic === 'new' ? 'New' : 'Mass'
                } -> ${updatedLine.characteristic === 'new' ? 'New' : 'Mass'})`
              : `Chỉnh sửa thông tin cấu hình ${updatedLine.name}`),
          changes: `${prevLine.name} (${prevLine.lineCode || prevLine.id}, ${prevLine.shortStage}, ${prevLine.leader}${charChangeText}) -> ${updatedLine.name} (${updatedLine.lineCode || updatedLine.id}, ${updatedLine.shortStage}, ${updatedLine.leader})`,
          tone: 'blue',
        },
        ...prev.map((entry) => ({ ...entry, isCurrent: false })),
      ]);
    }

    const prevWasMassStop = Boolean(
      prevLine &&
        prevLine.characteristic === 'mas' &&
        isMassStopIssueStatus(prevLine.statusLabel)
    );
    const nextIsMassStop =
      updatedLine.characteristic === 'mas' && isMassStopIssueStatus(updatedLine.statusLabel);
    const enteredMassStop =
      nextIsMassStop && (!prevWasMassStop || prevLine?.statusLabel !== updatedLine.statusLabel);

    const getStopSeverity = (status: ProductionLine['statusLabel']): IssueSeverity =>
      status === 'Dừng do Máy hỏng' ||
      status === 'Dừng do Lỗi thao tác' ||
      status === 'Dừng Chất lượng' ||
      status === 'Dừng do Sự cố điện'
        ? 'high'
        : 'medium';

    const nowTime = `Hôm nay, ${new Date().toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    const autoStopItems: IssueItem[] = [];
    if (enteredMassStop) {
      const stopId = getNextIssueId(issues, autoStopItems.length);
      const stopNote =
        newIssue?.description?.trim() ||
        updatedLine.lastNote?.trim() ||
        `Tự động tạo từ trạng thái dừng máy (${updatedLine.statusLabel}).`;
      autoStopItems.push({
        id: stopId,
        line: updatedLine.name,
        itemCode: 'Mass-Stop',
        title: newIssue?.title?.trim() || `Dừng máy: ${updatedLine.statusLabel}`,
        description:
          newIssue?.description?.trim() ||
          updatedLine.lastNote?.trim() ||
          `Line ${updatedLine.name} (Mass) chuyển sang trạng thái "${updatedLine.statusLabel}" — hệ thống tự động ghi nhận Issue dừng máy.`,
        severity: newIssue?.severity || getStopSeverity(updatedLine.statusLabel),
        assignee: updatedLine.leader,
        assigneeRole: `Line Leader ${updatedLine.name}`,
        duration: 'Vừa xong',
        sinceTime: nowTime,
        statusText: 'Đang xử lý dừng máy',
        progress: 10,
        notes: stopNote,
        isSynced: true,
        history: [
          {
            timestamp: nowTime,
            progress: 10,
            statusText: 'Đang xử lý dừng máy',
            note: stopNote,
            author: updatedLine.leader,
          },
        ],
      });
    } else if (newIssue) {
      const manualId = getNextIssueId(issues, autoStopItems.length);
      autoStopItems.unshift({
        id: manualId,
        line: updatedLine.name,
        itemCode: 'VT-Line',
        title: newIssue.title,
        description: newIssue.description,
        severity: newIssue.severity,
        assignee: updatedLine.leader,
        assigneeRole: `Line Leader ${updatedLine.name}`,
        duration: 'Vừa xong',
        sinceTime: nowTime,
        statusText: 'Mới tiếp nhận',
        progress: 10,
        notes: newIssue.description,
        isSynced: true,
        history: [
          {
            timestamp: nowTime,
            progress: 10,
            statusText: 'Mới tiếp nhận',
            note: newIssue.description,
            author: updatedLine.leader,
          },
        ],
      });
    }

    if (autoStopItems.length > 0) {
      setIssues((prev) => [...autoStopItems, ...prev]);
    }

    if (enteredMassStop) {
      pushToast(
        `Đã cập nhật ${updatedLine.name} & tự động +1 Issue`,
        `Dừng máy (${updatedLine.statusLabel}) đã được cộng vào Issue (${autoStopItems[0].id}).`,
        'amber'
      );
    } else if (newIssue) {
      pushToast(
        `Đã cập nhật ${updatedLine.name} & tạo ${autoStopItems[0].id}`,
        `VT: ${updatedLine.vtPercent}% · Issue: ${updatedLine.issueCount} · ${updatedLine.statusLabel}`
      );
    } else {
      pushToast(
        adminEdited ? `Admin đã cập nhật thông tin ${updatedLine.name}` : `Đã cập nhật ${updatedLine.name}`,
        `${updatedLine.stage} · VT: ${updatedLine.vtPercent}% · Issue: ${updatedLine.issueCount}`
      );
    }
  };

  const handleDeleteLine = (lineId: string) => {
    const target = lines.find((l) => l.id === lineId);
    if (!target || lines.length <= 1) return;
    setLines((prev) => prev.filter((l) => l.id !== lineId));
    if (selectedLineFilter === target.name) {
      setSelectedLineFilter('all');
    }
    const now = new Date();
    const timeStr = `Hôm nay, ${now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
    setAuditLogs((prev) => [
      {
        version: `v1.${prev.length}`,
        isCurrent: true,
        timestamp: timeStr,
        author: `Admin_${activeCenter.code}`,
        reason: lastAdminReason || `Gỡ bỏ dây chuyền ${target.name} khỏi hệ thống`,
        changes: `Xóa ${target.name} (${target.stage})`,
        tone: 'amber',
      },
      ...prev.map((entry) => ({ ...entry, isCurrent: false })),
    ]);
    pushToast(
      'Đã xóa dây chuyền',
      `${target.name} đã được gỡ bỏ khỏi sơ đồ ${activeCenter.code}.`,
      'amber'
    );
  };

  const handleTransferLineFactory = (
    lineSnapshot: ProductionLine,
    originalLineName: string,
    destination: {
      targetCenterId: string;
      toFactory: string;
      switchToTargetCenter?: boolean;
    },
    arrivalStatus: LineHealthStatus,
    transferNote?: string
  ): LineTransferHistoryEntry => {
    const sourceFactory = getLineFactory(lineSnapshot);
    const targetCenter =
      centers.find((c) => c.id === destination.targetCenterId) || activeCenter;
    const isCrossCenter = targetCenter.id !== activeCenter.id;

    const fromFactoryLabel = isCrossCenter
      ? `${activeCenter.code} · ${sourceFactory}`
      : sourceFactory;
    const toFactoryLabel = isCrossCenter
      ? `${targetCenter.code} · ${destination.toFactory}`
      : destination.toFactory;

    const meta = getStatusHealthMeta(arrivalStatus, lineSnapshot.issueCount);
    const nowTimestamp = formatLineTimestamp();

    const historyEntry: LineTransferHistoryEntry = {
      id: `TRF-${Date.now()}`,
      timestamp: nowTimestamp,
      fromFactory: fromFactoryLabel,
      toFactory: toFactoryLabel,
      performedBy: `Admin_${activeCenter.code}`,
      note: transferNote,
      preservedSnapshot: {
        lineCode: getDefaultLineCode(lineSnapshot),
        characteristic: lineSnapshot.characteristic,
        vtPercent: lineSnapshot.vtPercent,
        healthPercent: lineSnapshot.healthPercent,
        issueCount: lineSnapshot.issueCount,
        machinesCount: lineSnapshot.keyMachines?.length ?? 0,
        leader: lineSnapshot.leader,
      },
    };

    const transferredLine: ProductionLine = {
      ...lineSnapshot,
      factory: destination.toFactory,
      transferTarget: undefined,
      statusLabel: arrivalStatus,
      healthBadge: meta.healthBadge,
      healthTone: meta.healthTone,
      updatedAt: nowTimestamp,
      transferHistory: [historyEntry, ...(lineSnapshot.transferHistory || [])],
    };

    const now = new Date();
    const auditTime = `Hôm nay, ${now.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;

    if (isCrossCenter) {
      const movedIssues = activeCenter.issues
        .filter((iss) => iss.line === originalLineName || iss.line === lineSnapshot.name)
        .map((iss) => ({ ...iss, line: transferredLine.name }));
      const movedIssueIds = new Set(movedIssues.map((iss) => iss.id));

      setCenters((prev) =>
        prev.map((c) => {
          if (c.id === activeCenter.id) {
            return {
              ...c,
              lines: c.lines.filter((l) => l.id !== lineSnapshot.id),
              issues: c.issues.filter((iss) => !movedIssueIds.has(iss.id)),
              auditLogs: [
                {
                  version: `v1.${c.auditLogs.length}`,
                  isCurrent: true,
                  timestamp: auditTime,
                  author: `Admin_${activeCenter.code}`,
                  reason:
                    transferNote ||
                    lastAdminReason ||
                    `Điều chuyển ${lineSnapshot.name} sang Trung tâm ${targetCenter.code}`,
                  changes: `${lineSnapshot.name} (${getDefaultLineCode(lineSnapshot)}): ${fromFactoryLabel} -> ${toFactoryLabel} · Chuyển kèm ${movedIssues.length} hồ sơ sự cố, VT ${lineSnapshot.vtPercent}%, ${lineSnapshot.keyMachines?.length ?? 0} máy`,
                  tone: 'blue',
                },
                ...c.auditLogs.map((entry) => ({ ...entry, isCurrent: false })),
              ],
            };
          }
          if (c.id === targetCenter.id) {
            return {
              ...c,
              lines: [...c.lines, transferredLine],
              issues: [...movedIssues, ...c.issues],
              auditLogs: [
                {
                  version: `v1.${c.auditLogs.length}`,
                  isCurrent: true,
                  timestamp: auditTime,
                  author: `Admin_${activeCenter.code}`,
                  reason:
                    transferNote ||
                    `Tiếp nhận ${transferredLine.name} điều chuyển từ Trung tâm ${activeCenter.code}`,
                  changes: `Nhận ${transferredLine.name} (${getDefaultLineCode(transferredLine)}) vào ${destination.toFactory} · Bảo toàn VT ${transferredLine.vtPercent}%, ${movedIssues.length} sự cố, ${transferredLine.keyMachines?.length ?? 0} máy`,
                  tone: 'blue',
                },
                ...c.auditLogs.map((entry) => ({ ...entry, isCurrent: false })),
              ],
            };
          }
          return c;
        })
      );

      if (
        selectedLineFilter === originalLineName ||
        selectedLineFilter === lineSnapshot.name
      ) {
        setSelectedLineFilter('all');
      }
      setQuickReportLineId(null);
      setInspectIssuesTarget(null);
      setEditingIssueId(null);

      if (destination.switchToTargetCenter) {
        setActiveCenterId(targetCenter.id);
        setSelectedLineFilter('all');
      }

      pushToast(
        `Đã chuyển ${transferredLine.name} sang Trung tâm ${targetCenter.code}`,
        `Bảo toàn 100% thông số, ${transferredLine.keyMachines?.length ?? 0} máy chủ chốt & ${movedIssues.length} hồ sơ sự cố tại ${destination.toFactory}.`,
        'blue'
      );

      return historyEntry;
    }

    setLines((prev) =>
      prev.map((l) => (l.id === lineSnapshot.id ? transferredLine : l))
    );

    setAuditLogs((prev) => [
      {
        version: `v1.${prev.length}`,
        isCurrent: true,
        timestamp: auditTime,
        author: `Admin_${activeCenter.code}`,
        reason:
          transferNote ||
          lastAdminReason ||
          `Chuyển nhà máy cho ${lineSnapshot.name} (giữ nguyên thông số & lịch sử)`,
        changes: `${lineSnapshot.name} (${getDefaultLineCode(lineSnapshot)}): ${fromFactoryLabel} -> ${toFactoryLabel} · Bảo toàn VT ${lineSnapshot.vtPercent}%, ${lineSnapshot.issueCount} Issue, ${lineSnapshot.keyMachines?.length ?? 0} máy`,
        tone: 'blue',
      },
      ...prev.map((entry) => ({ ...entry, isCurrent: false })),
    ]);

    pushToast(
      `Đã chuyển ${lineSnapshot.name} sang ${destination.toFactory}`,
      `Giữ nguyên toàn bộ thông số, máy chủ chốt & lịch sử sự cố (${arrivalStatus}).`,
      'blue'
    );

    return historyEntry;
  };

  const handleSelectCenter = (centerId: string) => {
    const target = centers.find((c) => c.id === centerId);
    if (!target || target.id === activeCenter.id) return;
    setActiveCenterId(centerId);
    setSelectedLineFilter('all');
    setQuickReportLineId(null);
    setInspectIssuesTarget(null);
    setEditingIssueId(null);
    pushToast(
      `Chuyển sang Trung tâm ${target.code}`,
      `${target.name} (${target.lines.length} Line).`,
      'blue'
    );
  };

  const handleAddCenter = (payload: {
    code: string;
    name: string;
    subtitle: string;
    accentColor: CenterAccentColor;
    initialLineCount: number;
  }) => {
    const newCenter = createInitialCenterData(payload);
    setCenters((prev) => [...prev, newCenter]);
    setActiveCenterId(newCenter.id);
    setSelectedLineFilter('all');
    pushToast(
      `Đã mở Trung tâm ${newCenter.code}`,
      `${newCenter.name} đã sẵn sàng với ${newCenter.lines.length} dây chuyền.`,
      'emerald'
    );
  };

  const handleDeleteCenter = (centerId: string) => {
    if (centers.length <= 1) return;
    const target = centers.find((c) => c.id === centerId);
    if (!target) return;
    const remaining = centers.filter((c) => c.id !== centerId);
    setCenters(remaining);
    if (activeCenter.id === centerId && remaining[0]) {
      setActiveCenterId(remaining[0].id);
      setSelectedLineFilter('all');
      setQuickReportLineId(null);
      setInspectIssuesTarget(null);
      setEditingIssueId(null);
    }
    pushToast(
      `Đã xóa Trung tâm ${target.code}`,
      `${target.name} đã được gỡ bỏ khỏi hệ thống quản trị.`,
      'amber'
    );
  };

  const handleReorderLines = (fromLineId: string, toLineId: string) => {
    if (!fromLineId || !toLineId || fromLineId === toLineId) return;
    const fromLine = lines.find((l) => l.id === fromLineId);
    const toLine = lines.find((l) => l.id === toLineId);
    if (!fromLine || !toLine) return;

    setLines((prev) => {
      const fromIndex = prev.findIndex((l) => l.id === fromLineId);
      const toIndex = prev.findIndex((l) => l.id === toLineId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });

    pushToast(
      'Đã cập nhật vị trí Line',
      `Đã di chuyển ${fromLine.name} đến vị trí của ${toLine.name} tại ${activeCenter.code}.`,
      'blue'
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <TopNav
        centers={centers}
        activeCenter={activeCenter}
        activeScreen={activeScreen}
        isAdminMode={isAdminMode}
        selectedProject={selectedProject}
        onSelectCenter={handleSelectCenter}
        onSelectScreen={setActiveScreen}
        onOpenCenterManager={() => {
          if (isAdminMode) {
            setCenterManagerOpen(true);
          } else {
            setAdminAuthIntent('center');
            setAdminAuthOpen(true);
          }
        }}
        onSelectProject={(proj) => {
          setSelectedProject(proj);
          pushToast('Chuyển đổi dự án', `Đang hiển thị dữ liệu cho dự án ${proj}.`, 'blue');
        }}
        onExportReport={handleExportFullReport}
        onOpenAddLine={() => setAddLineOpen(true)}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeScreen === 'overview' ? (
          <>
            <KpiAndToolbar
              lines={lines}
              issues={issues}
              pipelineItems={pipelineItems}
              onOpenPurchasing={() => {
                setPurchasingFocusItem(null);
                setPurchasingOpen(true);
              }}
              onOpenOperationModal={(tab) => {
                setOpModalTab(tab);
                setOpModalOpen(true);
              }}
              onOpenVendorField={() => setVendorFieldOpen(true)}
              onDownloadTemplates={() =>
                handleDownloadTemplate(`Bo_Bieu_Mau_San_Xuat_${activeCenter.code}.csv`)
              }
              onOpenAlertModal={() => setAlertModalOpen(true)}
              onOpenSupplyChainScreen={() => setActiveScreen('supply-chain')}
            />

            <LineNetworkDiagram
              activeCenter={activeCenter}
              lines={lines}
              selectedLineFilter={selectedLineFilter}
              isAdminMode={isAdminMode}
              onQuickReportLine={(lineId) => setQuickReportLineId(lineId)}
              onInspectLineIssues={(target) => setInspectIssuesTarget(target)}
              onAdminEditLine={() => {
                if (isAdminMode) {
                  setQuickReportLineId(lines[0]?.id || null);
                } else {
                  setAdminAuthIntent('line');
                  setAdminAuthOpen(true);
                }
              }}
              onClearLineFilter={() => setSelectedLineFilter('all')}
              onOpenAddLine={() => setAddLineOpen(true)}
              onReorderLines={handleReorderLines}
            />

            <TargetDemandSpecs
              items={pipelineItems}
              isAdminMode={isAdminMode}
              onRequestAdminAuth={() => {
                setAdminAuthIntent('demand');
                setAdminAuthOpen(true);
              }}
              onExitAdminMode={() => setIsAdminMode(false)}
              onSaveDemands={handleSaveTargetDemands}
              onOpenAuditHistory={() => setAuditHistoryOpen(true)}
              onOpenUploadDemand={() => setUploadDemandOpen(true)}
              onDownloadTemplate={() => handleDownloadTemplate('Template_Target_Demand_Line.csv')}
              onExportSpecs={() =>
                downloadCsvFile(
                  `Target_Demand_Specs_${activeCenter.code}.csv`,
                  ['Item No', 'Tên Item', 'Target Demand'],
                  pipelineItems.map((it) => [it.itemNo, it.name, it.targetDemand])
                )
              }
            />

            <IssuesSection
              issues={issues}
              lines={lines}
              selectedLineFilter={selectedLineFilter}
              onChangeLineFilter={setSelectedLineFilter}
              onOpenIssueDetail={(issueId) => setEditingIssueId(issueId)}
              onOpenAddIssue={() => {
                setOpModalTab('issue');
                setOpModalOpen(true);
              }}
              onOpenExportIssues={() => setExportIssuesOpen(true)}
              onExportAllIssues={handleExportAllIssues}
              onOpenAlertModal={() => setAlertModalOpen(true)}
              onRefreshData={() =>
                pushToast(
                  'Làm mới dữ liệu',
                  `Đã đồng bộ dữ liệu từ ${lines.length} dây chuyền sản xuất.`,
                  'blue'
                )
              }
            />
          </>
        ) : (
          <>
            <div className="bg-white rounded-xl border border-slate-200 px-5 py-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  type="button"
                  onClick={() => setActiveScreen('overview')}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg transition cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Quay lại Sơ Đồ Dây Chuyền</span>
                </button>
                <div>
                  <h2 className="text-sm font-bold text-slate-900">
                    Màn Hình Tiến Độ Chuỗi Cung Ứng &amp; Lắp Ráp — Trung Tâm {activeCenter.code}
                  </h2>
                  <p className="text-xs text-slate-500">
                    {activeCenter.name} · Dự án {selectedProject} · Theo dõi 6 trạm từ Target Demand đến QA Line Test
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-semibold text-slate-600 tabular-nums flex-wrap">
                <span>
                  Tổng hạng mục:{' '}
                  <strong className="text-slate-900">{pipelineItems.length}</strong>
                </span>
                <span>
                  Đã về kho:{' '}
                  <strong className="text-blue-700">
                    {pipelineItems.reduce((sum, it) => sum + it.inWarehouse, 0)} /{' '}
                    {pipelineItems.reduce((sum, it) => sum + it.targetDemand, 0)}
                  </strong>
                </span>
                <span>
                  Cải Tiến:{' '}
                  <strong className="text-indigo-700">
                    {pipelineItems.reduce((sum, it) => sum + (it.warehouseImprovement ?? 0), 0)}
                  </strong>
                </span>
                <span>
                  EDM:{' '}
                  <strong className="text-amber-700">
                    {pipelineItems.reduce((sum, it) => sum + (it.warehouseEdm ?? 0), 0)}
                  </strong>
                </span>
                <span>
                  Đạt Line Test:{' '}
                  <strong className="text-emerald-700">
                    {pipelineItems.reduce((sum, it) => sum + it.lineTested, 0)} /{' '}
                    {pipelineItems.reduce((sum, it) => sum + it.targetDemand, 0)}
                  </strong>
                </span>
              </div>
            </div>

            <PipelineStepper
              items={pipelineItems}
              onOpenPurchasing={(itemNo) => {
                setPurchasingFocusItem(itemNo ?? null);
                setPurchasingOpen(true);
              }}
              onOpenVendorField={() => setVendorFieldOpen(true)}
              onOpenExportIssues={() => setExportIssuesOpen(true)}
              onOpenIssueDetail={(issueId) => setEditingIssueId(issueId)}
            />
          </>
        )}
      </main>

      <footer className="bg-white border-t border-slate-200 mt-10 py-4 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © 2026 {activeCenter.code} Production Management System. Bản quyền thuộc Bộ phận Kế hoạch &amp; Điều hành Sản xuất.
          </p>
          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <button
              type="button"
              onClick={() => setAuditHistoryOpen(true)}
              className="hover:text-blue-600 cursor-pointer"
            >
              Quy trình chuẩn ISO 9001
            </button>
            <button
              type="button"
              onClick={() => setAlertModalOpen(true)}
              className="hover:text-blue-600 cursor-pointer"
            >
              Cấu hình cảnh báo
            </button>
            <button
              type="button"
              onClick={() => {
                setOpModalTab('issue');
                setOpModalOpen(true);
              }}
              className="hover:text-blue-600 cursor-pointer"
            >
              Hỗ trợ kỹ thuật
            </button>
          </div>
        </div>
      </footer>

      <LineQuickReportModal
        isOpen={quickReportLineId !== null}
        centers={centers}
        activeCenter={activeCenter}
        lines={lines}
        initialLineId={quickReportLineId}
        isAdminMode={isAdminMode}
        onRequestAdminAuth={() => {
          setAdminAuthIntent('line');
          setAdminAuthOpen(true);
        }}
        onExitAdminMode={() => setIsAdminMode(false)}
        onClose={() => setQuickReportLineId(null)}
        onSaveLineReport={handleSaveLineQuickReport}
        onTransferLineFactory={handleTransferLineFactory}
        onDeleteLine={handleDeleteLine}
        onFilterLineIssues={(lineName) => {
          setSelectedLineFilter(lineName);
          const el = document.getElementById('line-issues-detail-tracker');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          pushToast('Lọc theo dây chuyền', `Đang hiển thị sự cố của ${lineName}.`, 'blue');
        }}
        onInspectLineIssues={(lineId) => setInspectIssuesTarget(lineId)}
      />

      <LineIssuesModal
        isOpen={inspectIssuesTarget !== null}
        centerCode={activeCenter.code}
        targetLine={
          inspectIssuesTarget && inspectIssuesTarget !== 'HUB'
            ? lines.find((l) => l.id === inspectIssuesTarget) ?? null
            : null
        }
        isHubMode={inspectIssuesTarget === 'HUB'}
        issues={issues}
        onClose={() => setInspectIssuesTarget(null)}
        onSelectIssueDetail={(issueId) => setEditingIssueId(issueId)}
        onOpenQuickReport={(lineId) => setQuickReportLineId(lineId)}
        onFilterInTable={(lineName) => {
          setSelectedLineFilter(lineName);
          const el = document.getElementById('line-issues-detail-tracker');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
          pushToast(
            'Lọc bảng sự cố',
            lineName === 'all'
              ? 'Đang hiển thị toàn bộ sự cố trên bảng theo dõi.'
              : `Đang lọc các sự cố của ${lineName}.`,
            'blue'
          );
        }}
      />

      {/* Modals */}
      <OperationFormModal
        isOpen={opModalOpen}
        activeTab={opModalTab}
        onChangeTab={setOpModalTab}
        onClose={() => setOpModalOpen(false)}
        onDownloadPoTemplate={() => handleDownloadTemplate('Template_Don_Dat_Hang_PO.csv')}
        onDownloadWarehouseTemplate={() => handleDownloadTemplate('Template_Phieu_Nhap_Kho_GRN.csv')}
        onSubmitGeneric={(msg) => pushToast('Lưu biểu mẫu thành công', msg)}
        onCreateIssue={handleCreateIssue}
      />

      <UploadDemandModal
        isOpen={uploadDemandOpen}
        items={pipelineItems}
        onClose={() => setUploadDemandOpen(false)}
        onDownloadTemplate={() => handleDownloadTemplate('Form_Upload_Demand_Admin_3Cot.csv')}
        onConfirmUpload={() =>
          pushToast('Nạp Demand thành công', 'Đã nạp dữ liệu Target Demand mới vào dây chuyền.')
        }
      />

      <PurchasingReportModal
        isOpen={purchasingOpen}
        focusItemNo={purchasingFocusItem}
        items={pipelineItems}
        onClose={() => setPurchasingOpen(false)}
        onSave={handleSavePurchasingReport}
        onDownloadTemplate={() => handleDownloadTemplate('Form_Bao_Cao_Nghiep_Vu_Mua_Hang.csv')}
      />

      <VendorFieldReportModal
        isOpen={vendorFieldOpen}
        items={pipelineItems}
        onClose={() => setVendorFieldOpen(false)}
        onSave={handleSaveVendorFieldReport}
        onDownloadTemplate={() => handleDownloadTemplate('2_Form_bao_cao_hien_truong_vendor.csv')}
        onLoadTestData={() =>
          pushToast('Đã nạp dữ liệu mẫu', 'Đã nạp bộ dữ liệu kiểm thử cho 11 Items A1-A11.', 'amber')
        }
      />

      <AdminAuthModal
        isOpen={adminAuthOpen}
        centerCode={activeCenter.code}
        onClose={() => setAdminAuthOpen(false)}
        onAuthenticate={(reason) => {
          setLastAdminReason(reason);
          setIsAdminMode(true);
          if (adminAuthIntent === 'line') {
            if (!quickReportLineId && lines[0]?.id) {
              setQuickReportLineId(lines[0].id);
            }
            pushToast(
              'Xác thực Admin thành công',
              'Đã mở khóa sửa thông tin Line, Line Leader phụ trách & định mức.',
              'blue'
            );
          } else if (adminAuthIntent === 'center') {
            setCenterManagerOpen(true);
            pushToast(
              'Xác thực Admin thành công',
              'Đã mở khóa chức năng thêm / bớt Trung tâm sản xuất.',
              'blue'
            );
          } else {
            pushToast('Xác thực Admin thành công', 'Đã mở khóa chỉnh sửa Target Demand.', 'blue');
          }
        }}
      />

      <CenterManagementModal
        isOpen={centerManagerOpen}
        centers={centers}
        activeCenterId={activeCenter.id}
        isAdminMode={isAdminMode}
        onRequestAdminAuth={() => {
          setAdminAuthIntent('center');
          setAdminAuthOpen(true);
        }}
        onSelectCenter={handleSelectCenter}
        onAddCenter={handleAddCenter}
        onDeleteCenter={handleDeleteCenter}
        onClose={() => setCenterManagerOpen(false)}
      />

      <AuditHistoryModal
        isOpen={auditHistoryOpen}
        logs={auditLogs}
        onClose={() => setAuditHistoryOpen(false)}
      />

      <ExportIssuesModal
        isOpen={exportIssuesOpen}
        items={pipelineItems}
        onClose={() => setExportIssuesOpen(false)}
        onExecuteDownload={(fmt) => {
          const issueItems = pipelineItems.filter((it) => Boolean(it.purchaseIssue.trim()));
          downloadCsvFile(
            `Bao_Cao_Nhanh_Item_Su_Co_Chuoi_Cung_Ung.${fmt === 'xlsx' ? 'csv' : 'csv'}`,
            ['Mã SC', 'Mã Item', 'Tên Item', 'Nội Dung Sự Cố', 'Cần mua', 'Đã về kho'],
            issueItems.map((it, idx) => [
              it.linkedIssueId || `ISS-01${idx + 1}`,
              it.itemNo,
              it.name,
              it.purchaseIssue,
              it.toBuy,
              it.inWarehouse,
            ])
          );
          pushToast('Xuất file thành công', 'Đã tải xuống Báo cáo nhanh Item sự cố.');
        }}
      />

      <AlertNotificationModal
        isOpen={alertModalOpen}
        onClose={() => setAlertModalOpen(false)}
        onDispatch={(channels) =>
          pushToast(
            'Đã gửi thông báo sự cố',
            `Đã phát cảnh báo qua ${channels.join(' & ')} tới 3 Quản lý ca trực.`
          )
        }
      />

      <IssueDetailModal
        issue={activeIssue}
        onClose={() => setEditingIssueId(null)}
        onSaveProgress={handleSaveIssueProgress}
      />

      <AddLineModal
        isOpen={addLineOpen}
        centerCode={activeCenter.code}
        nextLineNumber={lines.length + 1}
        onClose={() => setAddLineOpen(false)}
        onCreateLine={(newLine) => {
          setLines((prev) => [...prev, newLine]);
          if (newLine.characteristic === 'mas' && isMassStopIssueStatus(newLine.statusLabel)) {
            const stopId = getNextIssueId(issues);
            const stopNote = `Tự động tạo từ trạng thái dừng máy (${newLine.statusLabel}).`;
            setIssues((prev) => [
              {
                id: stopId,
                line: newLine.name,
                itemCode: 'Mass-Stop',
                title: `Dừng máy: ${newLine.statusLabel}`,
                description: `Khởi tạo ${newLine.name} (Mass) ở trạng thái dừng máy "${newLine.statusLabel}" — tự động ghi nhận Issue.`,
                severity:
                  newLine.statusLabel === 'Dừng do Máy hỏng' ||
                  newLine.statusLabel === 'Dừng do Lỗi thao tác' ||
                  newLine.statusLabel === 'Dừng Chất lượng' ||
                  newLine.statusLabel === 'Dừng do Sự cố điện'
                    ? 'high'
                    : 'medium',
                assignee: newLine.leader,
                assigneeRole: `Line Leader ${newLine.name}`,
                duration: 'Vừa xong',
                sinceTime: 'Vừa tạo',
                statusText: 'Đang xử lý dừng máy',
                progress: 10,
                notes: stopNote,
                isSynced: true,
                history: [
                  {
                    timestamp: 'Vừa tạo',
                    progress: 10,
                    statusText: 'Đang xử lý dừng máy',
                    note: stopNote,
                    author: newLine.leader,
                  },
                ],
              },
              ...prev,
            ]);
          }
          pushToast(
            'Khởi tạo dây chuyền mới',
            `Đã thêm ${newLine.name} (${newLine.stage}) vào Trung tâm ${activeCenter.code}.`
          );
        }}
      />

      {/* Toast Stack */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`px-4 py-3 rounded-xl shadow-xl border text-white flex items-start gap-3 text-xs ${
              toast.variant === 'blue'
                ? 'bg-blue-700 border-blue-500'
                : toast.variant === 'amber'
                ? 'bg-amber-600 border-amber-400'
                : 'bg-emerald-600 border-emerald-400'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-bold">{toast.title}</p>
              <p className="text-white/90 text-[11px] mt-0.5">{toast.message}</p>
            </div>
            <button
              type="button"
              onClick={() => setToasts((prev) => prev.filter((t) => t.id !== toast.id))}
              className="text-white/80 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
