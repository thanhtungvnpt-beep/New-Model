export type LineHealthStatus =
  | 'Hoàn thành'
  | 'Chạy Tốt'
  | 'Đang Setup'
  | 'Gần xong'
  | 'Chờ Vật Tư'
  | 'Đang test'
  | 'Chờ xuất'
  | 'Đã kích hoạt';

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
