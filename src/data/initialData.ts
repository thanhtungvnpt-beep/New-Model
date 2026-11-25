import { AuditLogEntry, IssueItem, PipelineItem, ProductionLine } from '../types/production';

export function getTodayIsoDate(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDaysToIso(baseIso: string, days: number): string {
  const [y, m, d] = baseIso.split('-').map(Number);
  const dt = new Date(Date.UTC(y || 2026, (m || 1) - 1, d || 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

export function diffDaysIso(fromIso: string, toIso: string): number {
  const [y1, m1, d1] = fromIso.split('-').map(Number);
  const [y2, m2, d2] = toIso.split('-').map(Number);
  const t1 = Date.UTC(y1 || 2026, (m1 || 1) - 1, d1 || 1);
  const t2 = Date.UTC(y2 || 2026, (m2 || 1) - 1, d2 || 1);
  return Math.round((t2 - t1) / 86400000);
}

export function formatViDateShort(iso: string): string {
  if (!iso || !iso.includes('-')) return iso || '--/--';
  const [, m, d] = iso.split('-');
  return `${d}/${m}`;
}

export function formatViDateFull(iso: string): string {
  if (!iso || !iso.includes('-')) return iso || '--/--/----';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function formatLineTimestamp(date = new Date()): string {
  const time = date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${time} · ${day}/${month}`;
}

export function isLineCompleted(line: Pick<ProductionLine, 'statusLabel' | 'vtPercent' | 'healthPercent' | 'issueCount'>): boolean {
  if (
    line.statusLabel === 'Dừng do Máy hỏng' ||
    line.statusLabel === 'Dừng do Vật liệu' ||
    line.statusLabel === 'Dừng do Lỗi thao tác' ||
    line.statusLabel === 'Dừng Chất lượng' ||
    line.statusLabel === 'Dừng do Sự cố điện' ||
    line.statusLabel === 'Dừng do Thiếu người' ||
    line.statusLabel === 'Dừng Bảo dưỡng' ||
    line.statusLabel === 'Dừng Vệ Sinh' ||
    line.statusLabel === 'Dừng do Lỗi khác' ||
    line.statusLabel === 'Dừng do Hết Plan' ||
    line.statusLabel === 'Tạm Hoãn'
  ) {
    return false;
  }
  return (
    line.statusLabel === 'Mass Ready' ||
    line.statusLabel === 'Dừng hoàn thành Plan' ||
    (line.statusLabel === 'Đang sản xuất' && line.vtPercent >= 100 && line.issueCount === 0)
  );
}

const TODAY_ISO = getTodayIsoDate();

export const INITIAL_LINES: ProductionLine[] = [
  {
    id: 'line-1',
    name: 'Line 1',
    stage: 'Line 1 - SMT Assembly',
    shortStage: 'CNC',
    characteristic: 'mas',
    vtPercent: 100,
    healthPercent: 85,
    issueCount: 0,
    statusLabel: 'Đang sản xuất',
    healthBadge: 'Ổn định',
    healthTone: 'emerald',
    leader: 'Lê Hoàng Đức',
    updatedAt: `08:40 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: TODAY_ISO,
      expectedDate: TODAY_ISO,
    },
  },
  {
    id: 'line-2',
    name: 'Line 2',
    stage: 'Line 2 - Wave Soldering',
    shortStage: 'CNC.',
    characteristic: 'mas',
    vtPercent: 100,
    healthPercent: 70,
    issueCount: 0,
    statusLabel: 'Đang sản xuất',
    healthBadge: 'Tối ưu',
    healthTone: 'emerald',
    leader: 'Phạm Minh Hoàng',
    updatedAt: `08:35 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: TODAY_ISO,
      expectedDate: TODAY_ISO,
    },
  },
  {
    id: 'line-3',
    name: 'Line 3',
    stage: 'Line 3 - Manual Assembly',
    shortStage: 'CNC',
    characteristic: 'new',
    vtPercent: 100,
    healthPercent: 60,
    issueCount: 0,
    statusLabel: 'Đang Lắp Ráp',
    healthBadge: 'Nút thắt cổ chai',
    healthTone: 'rose',
    leader: 'Nguyễn Văn Tuấn',
    updatedAt: `08:15 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 3),
      expectedDate: addDaysToIso(TODAY_ISO, 5),
    },
  },
  {
    id: 'line-4',
    name: 'Line 4',
    stage: 'Line 4 - Function Test',
    shortStage: 'CNC',
    characteristic: 'new',
    vtPercent: 90,
    healthPercent: 90,
    issueCount: 0,
    statusLabel: 'Chạy thử',
    healthBadge: 'Sắp hoàn thành',
    healthTone: 'emerald',
    leader: 'Đặng Quốc Bảo',
    updatedAt: `08:30 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 2),
      expectedDate: addDaysToIso(TODAY_ISO, 1),
    },
  },
  {
    id: 'line-5',
    name: 'Line 5',
    stage: 'Line 5 - Final Packing',
    shortStage: 'Block',
    characteristic: 'mas',
    vtPercent: 45,
    healthPercent: 45,
    issueCount: 3,
    statusLabel: 'Dừng do Máy hỏng',
    healthBadge: 'Nút thắt cổ chai',
    healthTone: 'rose',
    leader: 'Trần Thị Mai',
    updatedAt: `08:05 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 2),
      expectedDate: addDaysToIso(TODAY_ISO, 6),
    },
  },
  {
    id: 'line-6',
    name: 'Line 6',
    stage: 'Line 6 - Sub-assembly',
    shortStage: 'Block',
    characteristic: 'mas',
    vtPercent: 100,
    healthPercent: 90,
    issueCount: 1,
    statusLabel: 'Đang sản xuất',
    healthBadge: 'Ổn định',
    healthTone: 'emerald',
    leader: 'Trần Quốc Thắng',
    updatedAt: `08:20 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 4),
      expectedDate: addDaysToIso(TODAY_ISO, 4),
    },
  },
  {
    id: 'line-7',
    name: 'Line 7',
    stage: 'Line 7 - AOI Inspection',
    shortStage: 'Block',
    characteristic: 'mas',
    vtPercent: 100,
    healthPercent: 100,
    issueCount: 0,
    statusLabel: 'Dừng hoàn thành Plan',
    healthBadge: 'Ổn định',
    healthTone: 'emerald',
    leader: 'Vũ Đình Toàn',
    updatedAt: `08:10 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 1),
      expectedDate: addDaysToIso(TODAY_ISO, 1),
    },
  },
  {
    id: 'line-8',
    name: 'Line 8',
    stage: 'Line 8 - ICT Testing',
    shortStage: 'Burn-in',
    characteristic: 'new',
    vtPercent: 55,
    healthPercent: 55,
    issueCount: 2,
    statusLabel: 'Test Lại',
    healthBadge: 'Chờ kiểm tra',
    healthTone: 'amber',
    leader: 'Lê Văn Thành',
    updatedAt: `08:10 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 3),
      expectedDate: addDaysToIso(TODAY_ISO, 5),
    },
  },
  {
    id: 'line-9',
    name: 'Line 9',
    stage: 'Line 9 - Conformal Coating',
    shortStage: 'Block',
    characteristic: 'mas',
    vtPercent: 100,
    healthPercent: 90,
    issueCount: 1,
    statusLabel: 'Đang sản xuất',
    healthBadge: 'Ổn định',
    healthTone: 'emerald',
    leader: 'Nguyễn Văn Tuấn',
    updatedAt: `08:25 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 5),
      expectedDate: addDaysToIso(TODAY_ISO, 5),
    },
  },
  {
    id: 'line-10',
    name: 'Line 10',
    stage: 'Line 10 - Quality Audit',
    shortStage: 'Block',
    characteristic: 'mas',
    vtPercent: 40,
    healthPercent: 40,
    issueCount: 2,
    statusLabel: 'Dừng do Vật liệu',
    healthBadge: 'Cần bổ sung vật tư',
    healthTone: 'amber',
    leader: 'Lê Hoàng Đức',
    updatedAt: `08:05 · ${formatViDateShort(TODAY_ISO)}`,
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 2),
      expectedDate: addDaysToIso(TODAY_ISO, 4),
    },
  },
];

export const INITIAL_PIPELINE_ITEMS: PipelineItem[] = [
  {
    itemNo: 'A1',
    name: 'ABC1',
    badgeColor: 'blue',
    targetDemand: 10,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 10,
    stagedOnLine: 10,
    lineTested: 10,
    purchaseIssue: 'Hỏng 1 cái',
    vendorIssue: 'Bình thường (Đạt 100% test)',
    linkedIssueId: 'ISS-011',
  },
  {
    itemNo: 'A2',
    name: 'ABC2',
    badgeColor: 'blue',
    targetDemand: 11,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 11,
    stagedOnLine: 11,
    lineTested: 11,
    purchaseIssue: 'Đi cải tiến 1 cái',
    vendorIssue: 'Bình thường (Đã bàn giao chuyền)',
    linkedIssueId: 'ISS-012',
  },
  {
    itemNo: 'A3',
    name: 'ABC3',
    badgeColor: 'blue',
    targetDemand: 12,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 12,
    stagedOnLine: 12,
    lineTested: 12,
    purchaseIssue: '',
    vendorIssue: 'Bình thường',
  },
  {
    itemNo: 'A4',
    name: 'ABC4',
    badgeColor: 'indigo',
    targetDemand: 13,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 13,
    stagedOnLine: 13,
    lineTested: 10,
    purchaseIssue: '',
    vendorIssue: 'Lệch chân IC khi test (Cần chỉnh đầu JIG)',
  },
  {
    itemNo: 'A5',
    name: 'ABC5',
    badgeColor: 'indigo',
    targetDemand: 14,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 14,
    stagedOnLine: 12,
    lineTested: 8,
    purchaseIssue: '',
    vendorIssue: 'Thiếu gá JIG lắp ráp tạm thời 2 cái',
  },
  {
    itemNo: 'A6',
    name: 'ABC6',
    badgeColor: 'amber',
    targetDemand: 15,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 10,
    stagedOnLine: 6,
    lineTested: 4,
    purchaseIssue: '',
    vendorIssue: 'Vendor giao thiếu 5 linh kiện đợt 1',
  },
  {
    itemNo: 'A7',
    name: 'ABC7',
    badgeColor: 'amber',
    targetDemand: 16,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 8,
    stagedOnLine: 5,
    lineTested: 2,
    purchaseIssue: '',
    vendorIssue: 'Đã cấp gá tạm, chờ kiểm tra nhịp chuyền',
  },
  {
    itemNo: 'A8',
    name: 'ABC8',
    badgeColor: 'teal',
    targetDemand: 17,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 12,
    stagedOnLine: 6,
    lineTested: 0,
    purchaseIssue: '',
    vendorIssue: 'Cần hiệu chuẩn máy đo sóng trước khi test',
  },
  {
    itemNo: 'A9',
    name: 'ABC9',
    badgeColor: 'teal',
    targetDemand: 18,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 14,
    stagedOnLine: 8,
    lineTested: 0,
    purchaseIssue: '',
    vendorIssue: 'Bình thường (Đang chạy mẻ 2)',
  },
  {
    itemNo: 'A10',
    name: 'ABC10',
    badgeColor: 'rose',
    targetDemand: 19,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 0,
    stagedOnLine: 0,
    lineTested: 0,
    purchaseIssue: '',
    vendorIssue: 'Bao bì đạt chuẩn chống sốc',
  },
  {
    itemNo: 'A11',
    name: 'ABC11',
    badgeColor: 'rose',
    targetDemand: 20,
    toBuy: 8,
    inWarehouse: 2,
    vendorInbound: 0,
    stagedOnLine: 0,
    lineTested: 0,
    purchaseIssue: '',
    vendorIssue: 'Chờ nạp bản vá firmware mới',
  },
];

export const INITIAL_ISSUES: IssueItem[] = [
  {
    id: 'ISS-011',
    line: 'Form Mua Hàng',
    itemCode: 'A1 - ABC1',
    title: 'Hỏng 1 cái',
    description: 'Hỏng 1 cái linh kiện khi về kho, yêu cầu đổi trả NCC hoặc cấp bù gấp.',
    severity: 'high',
    assignee: 'Bộ Phận Mua Hàng',
    assigneeRole: 'Phụ trách PO',
    duration: '2h 15m',
    sinceTime: 'Từ 06:45',
    statusText: 'Chờ đổi trả NCC',
    progress: 20,
    notes: 'Đã gửi biên bản xác nhận hàng lỗi cho nhà cung cấp để cấp bù trong ca.',
    isSynced: true,
  },
  {
    id: 'ISS-012',
    line: 'Form Mua Hàng',
    itemCode: 'A2 - ABC2',
    title: 'Đi cải tiến 1 cái',
    description: 'Đi cải tiến 1 cái linh kiện cơ khí theo yêu cầu kỹ thuật.',
    severity: 'medium',
    assignee: 'BP Mua Hàng / Kỹ thuật',
    assigneeRole: 'Phụ trách điều phối',
    duration: '1h 40m',
    sinceTime: 'Từ 07:20',
    statusText: 'Đang hiệu chỉnh',
    progress: 45,
    notes: 'Xưởng cơ khí đang gia công hiệu chỉnh kích thước lỗ bắt vít theo bản vẽ rev 2.',
    isSynced: true,
  },
  {
    id: 'ISS-001',
    line: 'Line 3',
    itemCode: 'A6 - ABC6',
    title: 'Lệch chân hàn linh kiện IC SMD máy dán tự động',
    description: 'Đầu nozzle số 3 lệch áp suất làm rơi IC LQFP-100, gây gián đoạn khâu cấp linh kiện.',
    severity: 'high',
    assignee: 'Nguyễn Văn Tuấn',
    assigneeRole: 'Kỹ sư Line 3 (Bảo trì)',
    duration: '1h 45m',
    sinceTime: 'Từ 07:15',
    statusText: 'Đang thay Nozzle',
    progress: 65,
    notes: 'Đã tháo nozzle số 3, tiến hành thông khí nén và thay seal cao su mới. Dự kiến hoàn tất lúc 09:15.',
    highlightActionText: 'Xử lý ngay →',
  },
  {
    id: 'ISS-002',
    line: 'Line 5',
    itemCode: 'A10 - ABC10',
    title: 'Chậm giao lô bao bì chống sốc từ nhà cung cấp Vendor B',
    description: 'Nhà máy Tân Phát lùi lịch chuyển xe hàng do thiếu tem nhãn niêm phong QR code.',
    severity: 'medium',
    assignee: 'Trần Thị Mai',
    assigneeRole: 'Bộ phận Mua Hàng / Vendor',
    duration: '3h 10m',
    sinceTime: 'Từ 06:00',
    statusText: 'Xe đang di chuyển',
    progress: 80,
    notes: 'Xe tải 29C-784.12 đã rời kho Vendor B lúc 08:00, đang di chuyển đến cổng nhà máy.',
    highlightActionText: 'Thúc đẩy giao →',
  },
  {
    id: 'ISS-003',
    line: 'Line 1',
    itemCode: 'A1 - ABC1',
    title: 'Cần hiệu chuẩn máy đo sóng kiểm tra chức năng (Line Test)',
    description: 'Máy hiện sóng Rohde&Schwarz trôi điểm 0 sau 1000 chu kỳ thử nghiệm định kỳ.',
    severity: 'low',
    assignee: 'Lê Hoàng Đức',
    assigneeRole: 'Trưởng ban QA/QC',
    duration: '50m',
    sinceTime: 'Từ 08:10',
    statusText: 'Đang test chuẩn',
    progress: 90,
    notes: 'Kỹ sư QA đang nạp chuẩn tần số 50MHz, dự kiến bàn giao Line sau 15 phút.',
    highlightActionText: 'Xem lịch bảo trì →',
  },
  {
    id: 'ISS-004',
    line: 'Line 3',
    itemCode: 'A7 - ABC7',
    title: 'Thiếu đồ gá (JIG gắp linh kiện) trạm lắp ráp cơ cấu thủ công',
    description: 'Gá kẹp mòn ngàm giữ khiến công nhân phải căn chỉnh thủ công, giảm 40% nhịp chuyền.',
    severity: 'high',
    assignee: 'Vũ Đình Toàn',
    assigneeRole: 'Tổ Cơ điện JIG',
    duration: '2h 30m',
    sinceTime: 'Từ 06:30',
    statusText: 'Gia công ngàm phụ',
    progress: 50,
    notes: 'Tổ cơ điện đang phay bù ngàm Bakelite thay thế.',
  },
  {
    id: 'ISS-005',
    line: 'Line 3',
    itemCode: 'A5 - ABC5',
    title: 'Cảnh báo nhiệt độ súng bắn keo định vị vượt ngưỡng an toàn',
    description: 'Bộ điều khiển nhiệt PID chập chờn, keo hóa lỏng quá nhanh gây lem bề mặt mạch.',
    severity: 'high',
    assignee: 'Nguyễn Văn Tuấn',
    assigneeRole: 'Kỹ sư Line 3',
    duration: '1h 15m',
    sinceTime: 'Từ 07:45',
    statusText: 'Đang thay cảm biến',
    progress: 40,
    notes: 'Đang kiểm tra dây dò nhiệt Can K và thay rơ-le bán dẫn SSR.',
  },
  {
    id: 'ISS-006',
    line: 'Line 3',
    itemCode: 'A8 - ABC8',
    title: 'Tồn đọng phôi vỏ nhôm CNC chưa làm sạch bavia',
    description: 'Cần bố trí 2 kỹ thuật viên phụ trợ cạo bavia trước khi gá lên khung lắp hoàn thiện.',
    severity: 'medium',
    assignee: 'Phạm Minh Hoàng',
    assigneeRole: 'Trưởng ca Lắp ráp',
    duration: '45m',
    sinceTime: 'Từ 08:15',
    statusText: 'Đang xử lý',
    progress: 75,
    notes: 'Đã bổ sung 2 nhân sự phụ tá từ kho phôi sang hỗ trợ cạo bavia.',
  },
  {
    id: 'ISS-007',
    line: 'Line 4',
    itemCode: 'A4 - ABC4',
    title: 'Cập nhật Firmware v2.1.4 cho bộ bo mạch thử nghiệm chức năng',
    description: 'Phần mềm test tự động ICT cần nạp bản vá kiểm tra cổng giao tiếp CAN-Bus.',
    severity: 'low',
    assignee: 'Đặng Quốc Bảo',
    assigneeRole: 'Kỹ sư nhúng R&D',
    duration: '30m',
    sinceTime: 'Từ 08:30',
    statusText: 'Đang nạp file',
    progress: 90,
    notes: 'Đang chạy test nạp thử nghiệm trên 5 mẫu đầu tiên.',
  },
  {
    id: 'ISS-008',
    line: 'Line 5',
    itemCode: 'A11 - ABC11',
    title: 'Máy dán băng keo niêm phong thùng carton bị kẹt dao cắt tự động',
    description: 'Lưỡi dao cùn làm rách mép hộp đóng gói thành phẩm, dừng đóng gói 20 kiện.',
    severity: 'high',
    assignee: 'Lê Văn Thành',
    assigneeRole: 'Tổ Đóng gói Cuối',
    duration: '1h 05m',
    sinceTime: 'Từ 07:55',
    statusText: 'Thay lưỡi dao',
    progress: 70,
    notes: 'Đã thay mới bộ dao cắt hợp kim SKD11, đang test chạy liên tục 50 hộp.',
  },
  {
    id: 'ISS-009',
    line: 'Line 5',
    itemCode: 'A9 - ABC9',
    title: 'Tem mã vạch Serial Number in bị mờ nét, máy quét không nhận diện',
    description: 'Đầu in nhiệt của máy Zebra ZT410 bị bám bụi mực, cần vệ sinh cuộn ribbon.',
    severity: 'medium',
    assignee: 'Trần Thị Mai',
    assigneeRole: 'Kho thành phẩm',
    duration: '55m',
    sinceTime: 'Từ 08:05',
    statusText: 'Vệ sinh máy in',
    progress: 85,
    notes: 'Đã dùng cồn chuyên dụng vệ sinh đầu in, tem in lại đạt độ tương phản 100%.',
  },
  {
    id: 'ISS-010',
    line: 'Line 1',
    itemCode: 'A2 - ABC2',
    title: 'Hết cuộn giấy lau stencil máy in thiếc hàn SMT DEK',
    description: 'Cần lấy cuộn thay thế từ tủ vật tư tiêu hao phòng sạch, không dừng chuyền.',
    severity: 'low',
    assignee: 'Lê Hoàng Đức',
    assigneeRole: 'Kỹ thuật viên SMT',
    duration: '20m',
    sinceTime: 'Từ 08:40',
    statusText: 'Đã thay mới',
    progress: 100,
    notes: 'Đã nạp cuộn giấy lau mới và bơm cồn IPA rửa stencil, máy hoạt động bình thường.',
  },
  {
    id: 'ISS-013',
    line: 'Line 6',
    itemCode: 'A6 - ABC6',
    title: 'Thiếu 2 bộ gá giữ cụm cơ khí Sub-assembly ở trạm số 2',
    description: 'Bộ gá dự phòng đang chờ thay đệm cao su chống trầy vỏ nhôm.',
    severity: 'medium',
    assignee: 'Trần Quốc Thắng',
    assigneeRole: 'Kỹ sư Line 6',
    duration: '40m',
    sinceTime: 'Từ 08:20',
    statusText: 'Đang thay đệm gá',
    progress: 70,
    notes: 'Tổ JIG đang dán lại đệm silicone và kiểm tra độ đồng tâm trước khi lắp vào chuyền.',
  },
  {
    id: 'ISS-014',
    line: 'Line 8',
    itemCode: 'A8 - ABC8',
    title: 'Chân kim test bed ICT bị oxy hóa gây tiếp xúc chập chờn',
    description: 'Khi chạy test model mới trên Line 8, kênh đo nguồn phụ báo lỗi tiếp xúc tại chân pogo pin #14.',
    severity: 'high',
    assignee: 'Lê Văn Thành',
    assigneeRole: 'Kỹ sư Test Line 8',
    duration: '1h 20m',
    sinceTime: 'Từ 07:40',
    statusText: 'Thay pogo pin',
    progress: 55,
    notes: 'Đang thay 4 chân kim pogo mới và chạy lại test kiểm chứng trên 10 bo mạch mẫu.',
  },
  {
    id: 'ISS-015',
    line: 'Line 8',
    itemCode: 'A8 - ABC8',
    title: 'Chưa đồng bộ profile nhiệt lò Burn-in cho model thử nghiệm mới',
    description: 'Cần điều chỉnh đường cong gia nhiệt 65°C trong 30 phút theo thông số R&D mới ban hành.',
    severity: 'medium',
    assignee: 'Lê Văn Thành',
    assigneeRole: 'Kỹ sư Test Line 8',
    duration: '50m',
    sinceTime: 'Từ 08:10',
    statusText: 'Cập nhật profile',
    progress: 65,
    notes: 'Đã nạp profile mới vào bộ điều khiển nhiệt, đang theo dõi ổn định buồng test.',
  },
  {
    id: 'ISS-016',
    line: 'Line 9',
    itemCode: 'A9 - ABC9',
    title: 'Áp suất vòi phun keo phủ bảo vệ (Conformal Coating) giảm nhẹ',
    description: 'Lọc khí đầu vào có cặn ẩm làm độ dày lớp keo mỏng hơn tiêu chuẩn 5 micron.',
    severity: 'low',
    assignee: 'Nguyễn Văn Tuấn',
    assigneeRole: 'Kỹ sư Line 9',
    duration: '35m',
    sinceTime: 'Từ 08:25',
    statusText: 'Đang xả lọc khí',
    progress: 80,
    notes: 'Đã vệ sinh lọc tách nước và căn chỉnh lại áp suất phun về mức 2.4 bar.',
  },
  {
    id: 'ISS-017',
    line: 'Line 10',
    itemCode: 'A10 - ABC10',
    title: 'Thiếu tem kiểm định chất lượng đầu ra lô hàng chờ xuất',
    description: 'Cần bổ sung 200 tem QC Pass từ kho vật tư để hoàn tất niêm phong pallet.',
    severity: 'medium',
    assignee: 'Lê Hoàng Đức',
    assigneeRole: 'Trưởng ban QA/QC',
    duration: '1h 10m',
    sinceTime: 'Từ 07:50',
    statusText: 'Chờ cấp tem QC',
    progress: 45,
    notes: 'Kho đã xuất cuộn tem mới, đang chuyển xuống trạm Quality Audit.',
  },
  {
    id: 'ISS-018',
    line: 'Line 10',
    itemCode: 'A11 - ABC11',
    title: 'Cân điện tử kiểm tra trọng lượng thùng thành phẩm lệch sai số',
    description: 'Sai số +15g so với quả cân chuẩn 5kg, tạm dừng xác nhận xuất lô A11.',
    severity: 'high',
    assignee: 'Lê Hoàng Đức',
    assigneeRole: 'Trưởng ban QA/QC',
    duration: '55m',
    sinceTime: 'Từ 08:05',
    statusText: 'Đang hiệu chuẩn cân',
    progress: 50,
    notes: 'Đội bảo trì thiết bị đo đang hiệu chuẩn lại loadcell bằng quả cân chuẩn F1.',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    version: 'v1.2 (Hiện tại)',
    isCurrent: true,
    timestamp: 'Hôm nay, 08:30',
    author: 'Admin_KHV',
    reason: 'Tăng chỉ tiêu A1-A3 theo lệnh sản xuất #KHV-402',
    changes: 'A1 (8 -> 10), A2 (9 -> 11), A3 (10 -> 12)',
    tone: 'blue',
  },
  {
    version: 'v1.1',
    timestamp: '10/05/2025 14:15',
    author: 'Admin_KHV',
    reason: 'Điều chỉnh bù hao hụt linh kiện Line 1',
    changes: 'A4-A6 (+1 đơn vị bù hao)',
    tone: 'amber',
  },
  {
    version: 'v1.0',
    timestamp: '01/05/2025 08:00',
    author: 'System_Init',
    reason: 'Khởi tạo bảng Target Demand theo kế hoạch quý',
    changes: 'Khởi tạo 11 mã A1-A11',
    tone: 'slate',
  },
];

export function downloadCsvFile(filename: string, headers: string[], rows: (string | number)[][]) {
  const escapeCell = (cell: string | number) => {
    const str = String(cell ?? '').replace(/"/g, '""');
    return `"${str}"`;
  };
  const csvContent =
    '\uFEFF' +
    [headers.map(escapeCell).join(','), ...rows.map((r) => r.map(escapeCell).join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
