export type LineHealthStatus =
  | 'Đang sản xuất'
  | 'Dừng do Máy hỏng'
  | 'Dừng do Vật liệu'
  | 'Dừng do Lỗi thao tác'
  | 'Dừng Chất lượng'
  | 'Dừng do Sự cố điện'
  | 'Dừng do Thiếu người'
  | 'Dừng Bảo dưỡng'
  | 'Dừng Vệ Sinh'
  | 'Dừng do Lỗi khác'
  | 'Dừng do Hết Plan'
  | 'Dừng hoàn thành Plan'
  | 'Đang tháo chuyển'
  | 'Đã chuyển'
  | 'Chờ Vật Tư'
  | 'Đủ Vật Tư'
  | 'Đang Lắp Ráp'
  | 'Đang cài đặt'
  | 'Chạy thử'
  | 'Test Lại'
  | 'Mass Ready'
  | 'Tạm Hoãn';

export const MASS_LINE_STATUSES: LineHealthStatus[] = [
  'Đang sản xuất',
  'Dừng do Máy hỏng',
  'Dừng do Vật liệu',
  'Dừng do Lỗi thao tác',
  'Dừng Chất lượng',
  'Dừng do Sự cố điện',
  'Dừng do Thiếu người',
  'Dừng Bảo dưỡng',
  'Dừng Vệ Sinh',
  'Dừng do Lỗi khác',
  'Dừng do Hết Plan',
  'Dừng hoàn thành Plan',
  'Đang tháo chuyển',
  'Đã chuyển',
];

export const MASS_STOP_ISSUE_STATUSES: LineHealthStatus[] = [
  'Dừng do Máy hỏng',
  'Dừng do Vật liệu',
  'Dừng do Lỗi thao tác',
  'Dừng Chất lượng',
  'Dừng do Sự cố điện',
  'Dừng do Thiếu người',
  'Dừng Bảo dưỡng',
  'Dừng Vệ Sinh',
  'Dừng do Lỗi khác',
  'Dừng do Hết Plan',
];

export function isMassStopIssueStatus(status: LineHealthStatus): boolean {
  return MASS_STOP_ISSUE_STATUSES.includes(status);
}

export const NEW_LINE_STATUSES: LineHealthStatus[] = [
  'Chờ Vật Tư',
  'Đủ Vật Tư',
  'Đang Lắp Ráp',
  'Đang cài đặt',
  'Chạy thử',
  'Test Lại',
  'Mass Ready',
  'Tạm Hoãn',
  'Đang tháo chuyển',
  'Đã chuyển',
];

export type LineCharacteristic = 'new' | 'mas';

export interface LineSetupTimeline {
  targetDate: string; // Ngày cần hoàn thành (YYYY-MM-DD)
  expectedDate: string; // Ngày dự kiến hoàn thành (YYYY-MM-DD)
  currentDate?: string; // Ngày hiện tại (YYYY-MM-DD), mặc định là hôm nay
}

export type KeyMachineStatus =
  | 'Hoạt động tốt'
  | 'Cần theo dõi'
  | 'Đang bảo trì'
  | 'Dừng lỗi';

export interface LineKeyMachine {
  id: string;
  name: string;
  ip: string;
  role?: string;
  status: KeyMachineStatus;
  note?: string;
}

export interface LineTransferHistoryEntry {
  id: string;
  timestamp: string;
  fromFactory: string;
  toFactory: string;
  performedBy: string;
  note?: string;
  preservedSnapshot: {
    lineCode: string;
    characteristic: LineCharacteristic;
    vtPercent: number;
    healthPercent: number;
    issueCount: number;
    machinesCount: number;
    leader: string;
  };
}

export type LineProcessTaskStatus = 'Chưa phát sinh' | 'Đang thực hiện' | 'Hoàn tất';

export interface LineImprovementAttachment {
  fileName: string;
  fileSizeBytes: number;
  fileType?: string;
  objectUrl?: string;
  uploadedAt: string;
}

export interface LineImprovementPost {
  id: string;
  title: string;
  beforeText: string;
  afterText: string;
  effectiveness: string;
  author: string;
  status: 'Đang thực hiện' | 'Hoàn tất';
  createdAt: string;
  pptAttachment?: LineImprovementAttachment;
}

export type LineEdmWorstStatus =
  | 'Chờ đối sách'
  | 'Đang triển khai đối sách'
  | 'Đã hoàn tất đối sách';

export type LineEdmWorstPriority = 'Cao (Top 1)' | 'Trung bình' | 'Theo dõi';

export interface LineEdmCountermeasure {
  technicianName: string;
  actionText: string;
  resultNote?: string;
  updatedAt: string;
}

export interface LineEdmWorstItem {
  id: string;
  weekLabel: string; // VD: Tuần 47 / 2026
  machineName: string; // VD: Máy A, Máy B, Máy C
  machineIp?: string;
  worstTitle: string;
  worstDetail: string;
  metricValue?: string; // VD: 4.2% NG hoặc 12 lần dừng
  priority: LineEdmWorstPriority;
  postedByAdmin: string;
  createdAt: string;
  status: LineEdmWorstStatus;
  countermeasure?: LineEdmCountermeasure;
}

export interface LineSubProcessTask {
  status: LineProcessTaskStatus;
  count: number;
  note?: string;
  updatedAt?: string;
  posts?: LineImprovementPost[];
  worstItems?: LineEdmWorstItem[];
}

export type LineQuickReportFocus = 'general' | 'improvement' | 'edm';

export interface ProductionLine {
  id: string;
  lineCode?: string;
  name: string;
  stage: string;
  shortStage: string;
  factory?: string;
  characteristic: LineCharacteristic;
  vtPercent: number;
  healthPercent: number;
  issueCount: number;
  statusLabel: LineHealthStatus;
  healthBadge: string;
  healthTone: 'emerald' | 'amber' | 'rose';
  leader: string;
  lastNote?: string;
  transferTarget?: string;
  transferHistory?: LineTransferHistoryEntry[];
  updatedAt?: string;
  keyMachines?: LineKeyMachine[];
  setupTimeline?: LineSetupTimeline;
  improvement?: LineSubProcessTask;
  edm?: LineSubProcessTask;
}

export interface PipelineItem {
  itemNo: string;
  name: string;
  badgeColor: 'blue' | 'indigo' | 'amber' | 'teal' | 'rose';
  targetDemand: number;
  toBuy: number;
  inWarehouse: number;
  warehouseImprovement?: number;
  warehouseEdm?: number;
  vendorInbound: number;
  stagedOnLine: number;
  lineTested: number;
  lineTestNote?: string;
  purchaseIssue: string;
  vendorIssue: string;
  linkedIssueId?: string;
}

export type IssueSeverity = 'high' | 'medium' | 'low';

export interface IssueHistoryEntry {
  timestamp: string;
  progress: number;
  statusText: string;
  note: string;
  author?: string;
}

export interface IssueItem {
  id: string;
  line: string;
  itemCode: string;
  title: string;
  description: string;
  severity: IssueSeverity;
  assignee: string;
  assigneeRole: string;
  duration: string;
  sinceTime: string;
  statusText: string;
  progress: number;
  notes: string;
  isSynced?: boolean;
  highlightActionText?: string;
  resolvedAt?: string;
  history?: IssueHistoryEntry[];
}

export interface AuditLogEntry {
  version: string;
  isCurrent?: boolean;
  timestamp: string;
  author: string;
  reason: string;
  changes: string;
  tone: 'blue' | 'amber' | 'slate';
}

export type OperationTab = 'po' | 'warehouse' | 'vendor' | 'staging' | 'qa' | 'issue';

export interface ToastNotification {
  id: string;
  title: string;
  message: string;
  variant: 'emerald' | 'blue' | 'amber';
}

export type CenterAccentColor = 'blue' | 'indigo' | 'emerald' | 'amber';

export interface ProductionCenter {
  id: string;
  code: string;
  name: string;
  subtitle: string;
  accentColor: CenterAccentColor;
  selectedProject: string;
  lines: ProductionLine[];
  pipelineItems: PipelineItem[];
  issues: IssueItem[];
  auditLogs: AuditLogEntry[];
}

export type AppScreen = 'overview' | 'supply-chain';
