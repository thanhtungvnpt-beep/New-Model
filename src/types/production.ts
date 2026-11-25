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
];

export type LineCharacteristic = 'new' | 'mas';

export interface LineSetupTimeline {
  targetDate: string; // Ngày cần hoàn thành (YYYY-MM-DD)
  expectedDate: string; // Ngày dự kiến hoàn thành (YYYY-MM-DD)
  currentDate?: string; // Ngày hiện tại (YYYY-MM-DD), mặc định là hôm nay
}

export interface ProductionLine {
  id: string;
  name: string;
  stage: string;
  shortStage: string;
  characteristic: LineCharacteristic;
  vtPercent: number;
  healthPercent: number;
  issueCount: number;
  statusLabel: LineHealthStatus;
  healthBadge: string;
  healthTone: 'emerald' | 'amber' | 'rose';
  leader: string;
  lastNote?: string;
  updatedAt?: string;
  setupTimeline?: LineSetupTimeline;
}

export interface PipelineItem {
  itemNo: string;
  name: string;
  badgeColor: 'blue' | 'indigo' | 'amber' | 'teal' | 'rose';
  targetDemand: number;
  toBuy: number;
  inWarehouse: number;
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
