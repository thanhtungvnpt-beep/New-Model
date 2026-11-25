import { CheckCircle2, X } from 'lucide-react';
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
  INITIAL_AUDIT_LOGS,
  INITIAL_ISSUES,
  INITIAL_LINES,
  INITIAL_PIPELINE_ITEMS,
  downloadCsvFile,
  formatLineTimestamp,
} from './data/initialData';
import {
  AuditLogEntry,
  isMassStopIssueStatus,
  IssueItem,
  IssueSeverity,
  OperationTab,
  PipelineItem,
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
  const [selectedProject, setSelectedProject] = useState('KHV-2025');
  const [lines, setLines] = useState<ProductionLine[]>(INITIAL_LINES);
  const [pipelineItems, setPipelineItems] = useState<PipelineItem[]>(INITIAL_PIPELINE_ITEMS);
  const [issues, setIssues] = useState<IssueItem[]>(INITIAL_ISSUES);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(INITIAL_AUDIT_LOGS);
  const [selectedLineFilter, setSelectedLineFilter] = useState('all');

  const [isAdminMode, setIsAdminMode] = useState(false);
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
          author: 'Admin_KHV',
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
      `KHV_Bao_Cao_Tien_Do_${selectedProject}.csv`,
      ['Item No', 'Tên Item', 'Target Demand', 'Cần mua', 'Đã về kho', 'Nhập Vendor', 'Set lên Line', 'Line Test', 'Issue Mua Hàng'],
      pipelineItems.map((it) => [
        it.itemNo,
        it.name,
        it.targetDemand,
        it.toBuy,
        it.inWarehouse,
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
      'KHV_Issues_Tracker_Line1_to_10.csv',
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
      ['Item No', 'Tên Item', 'Target Demand', 'Cần mua', 'Đã về kho', 'Issue tracker'],
      pipelineItems.map((it) => [
        it.itemNo,
        it.name,
        it.targetDemand,
        it.toBuy,
        it.inWarehouse,
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
    adminEdited?: boolean
  ) => {
    const prevLine = lines.find((l) => l.id === updatedLine.id);
    setLines((prev) => prev.map((l) => (l.id === updatedLine.id ? updatedLine : l)));

    if (prevLine && prevLine.name !== updatedLine.name) {
      setIssues((prev) =>
        prev.map((iss) => (iss.line === prevLine.name ? { ...iss, line: updatedLine.name } : iss))
      );
      if (selectedLineFilter === prevLine.name) {
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
          author: 'Admin_KHV',
          reason:
            lastAdminReason ||
            (charChanged
              ? `Admin chuyển đổi đặc tính ${updatedLine.name} (${
                  prevLine.characteristic === 'new' ? 'New' : 'Mass'
                } -> ${updatedLine.characteristic === 'new' ? 'New' : 'Mass'})`
              : `Chỉnh sửa thông tin cấu hình ${updatedLine.name}`),
          changes: `${prevLine.name} (${prevLine.shortStage}, ${prevLine.leader}${charChangeText}) -> ${updatedLine.name} (${updatedLine.shortStage}, ${updatedLine.leader})`,
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
        author: 'Admin_KHV',
        reason: lastAdminReason || `Gỡ bỏ dây chuyền ${target.name} khỏi hệ thống`,
        changes: `Xóa ${target.name} (${target.stage})`,
        tone: 'amber',
      },
      ...prev.map((entry) => ({ ...entry, isCurrent: false })),
    ]);
    pushToast('Đã xóa dây chuyền', `${target.name} đã được gỡ bỏ khỏi sơ đồ KHV.`, 'amber');
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <TopNav
        selectedProject={selectedProject}
        onSelectProject={(proj) => {
          setSelectedProject(proj);
          pushToast('Chuyển đổi dự án', `Đang hiển thị dữ liệu cho dự án ${proj}.`, 'blue');
        }}
        onExportReport={handleExportFullReport}
        onOpenAddLine={() => setAddLineOpen(true)}
      />

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
          onDownloadTemplates={() => handleDownloadTemplate('Bo_Bieu_Mau_San_Xuat_KHV.csv')}
          onOpenAlertModal={() => setAlertModalOpen(true)}
        />

        <LineNetworkDiagram
          lines={lines}
          selectedLineFilter={selectedLineFilter}
          isAdminMode={isAdminMode}
          onQuickReportLine={(lineId) => setQuickReportLineId(lineId)}
          onInspectLineIssues={(target) => setInspectIssuesTarget(target)}
          onAdminEditLine={() => {
            if (isAdminMode) {
              setQuickReportLineId(lines[0]?.id || 'line-1');
            } else {
              setAdminAuthOpen(true);
            }
          }}
          onClearLineFilter={() => setSelectedLineFilter('all')}
          onOpenAddLine={() => setAddLineOpen(true)}
        />

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

        <TargetDemandSpecs
          items={pipelineItems}
          isAdminMode={isAdminMode}
          onRequestAdminAuth={() => setAdminAuthOpen(true)}
          onExitAdminMode={() => setIsAdminMode(false)}
          onSaveDemands={handleSaveTargetDemands}
          onOpenAuditHistory={() => setAuditHistoryOpen(true)}
          onOpenUploadDemand={() => setUploadDemandOpen(true)}
          onDownloadTemplate={() => handleDownloadTemplate('Template_Target_Demand_Line.csv')}
          onExportSpecs={() =>
            downloadCsvFile(
              'Target_Demand_Specs_KHV.csv',
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
            pushToast('Làm mới dữ liệu', `Đã đồng bộ dữ liệu từ ${lines.length} dây chuyền sản xuất.`, 'blue')
          }
        />
      </main>

      <footer className="bg-white border-t border-slate-200 mt-10 py-4 text-xs text-slate-500">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            © 2026 KHV Production Management System. Bản quyền thuộc Bộ phận Kế hoạch &amp; Điều hành Sản xuất.
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
        lines={lines}
        initialLineId={quickReportLineId}
        isAdminMode={isAdminMode}
        onRequestAdminAuth={() => setAdminAuthOpen(true)}
        onExitAdminMode={() => setIsAdminMode(false)}
        onClose={() => setQuickReportLineId(null)}
        onSaveLineReport={handleSaveLineQuickReport}
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
        targetLine={
          inspectIssuesTarget && inspectIssuesTarget !== 'HUB'
            ? lines.find((l) => l.id === inspectIssuesTarget) ?? null
            : null
        }
        isHubMode={inspectIssuesTarget === 'HUB'}
        issues={issues}
        onClose={() => setInspectIssuesTarget(null)}
        onSelectIssueDetail={(issueId) => setEditingIssueId(issueId)}
        onQuickResolveIssue={(issueId, currentNotes) =>
          handleSaveIssueProgress(
            issueId,
            100,
            currentNotes || 'Đã khắc phục hoàn toàn 100%.'
          )
        }
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
        onClose={() => setAdminAuthOpen(false)}
        onAuthenticate={(reason) => {
          setLastAdminReason(reason);
          setIsAdminMode(true);
          pushToast('Xác thực Admin thành công', 'Đã mở khóa chỉnh sửa Target Demand.', 'blue');
        }}
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
            `Đã thêm ${newLine.name} (${newLine.stage}) vào hệ thống KHV.`
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
