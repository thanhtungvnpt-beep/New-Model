import {
  AuditLogEntry,
  CenterAccentColor,
  IssueItem,
  LineHealthStatus,
  LineKeyMachine,
  PipelineItem,
  ProductionCenter,
  ProductionLine,
} from '../types/production';

export const DEFAULT_FACTORIES = [
  'Nhà máy 1 (NM1)',
  'Nhà máy 2 (NM2)',
  'Nhà máy 3 (NM3)',
] as const;

export function getLineFactory(line: Pick<ProductionLine, 'factory'>): string {
  return line.factory?.trim() || DEFAULT_FACTORIES[0];
}

export function getShortFactoryLabel(factory: string): string {
  const parenMatch = /\(([^)]+)\)/.exec(factory);
  if (parenMatch) return parenMatch[1].trim();
  const trimmed = factory.trim();
  return trimmed.length <= 12 ? trimmed : `${trimmed.slice(0, 11)}…`;
}

export function getStatusHealthMeta(
  status: LineHealthStatus,
  issueCount = 0
): { healthBadge: string; healthTone: 'emerald' | 'amber' | 'rose' } {
  if (
    status === 'Dừng do Máy hỏng' ||
    status === 'Dừng do Lỗi thao tác' ||
    status === 'Dừng Chất lượng' ||
    status === 'Dừng do Sự cố điện' ||
    status === 'Tạm Hoãn'
  ) {
    return { healthBadge: 'Nút thắt cổ chai', healthTone: 'rose' };
  }
  if (status === 'Dừng do Vật liệu' || status === 'Chờ Vật Tư') {
    return { healthBadge: 'Cần bổ sung vật tư', healthTone: 'amber' };
  }
  if (status === 'Dừng do Hết Plan') {
    return { healthBadge: 'Chờ kế hoạch', healthTone: 'amber' };
  }
  if (status === 'Đang tháo chuyển') {
    return { healthBadge: 'Đang di dời NM', healthTone: 'amber' };
  }
  if (status === 'Đã chuyển') {
    return { healthBadge: 'Đã chuyển NM', healthTone: 'emerald' };
  }
  if (
    status === 'Dừng do Thiếu người' ||
    status === 'Dừng Bảo dưỡng' ||
    status === 'Dừng Vệ Sinh' ||
    status === 'Dừng do Lỗi khác' ||
    status === 'Đang Lắp Ráp' ||
    status === 'Đang cài đặt' ||
    status === 'Test Lại'
  ) {
    return { healthBadge: 'Chờ kiểm tra', healthTone: 'amber' };
  }
  if (status === 'Chạy thử') {
    return { healthBadge: 'Sắp hoàn thành', healthTone: 'emerald' };
  }
  if (issueCount > 1) {
    return { healthBadge: 'Cần theo dõi', healthTone: 'amber' };
  }
  return { healthBadge: 'Ổn định', healthTone: 'emerald' };
}

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

export function createDefaultKeyMachines(prefix = 'line', lineSubnet = 1): LineKeyMachine[] {
  return [
    {
      id: `${prefix}-m-a`,
      name: 'Máy A',
      ip: `192.168.${lineSubnet}.11`,
      status: 'Hoạt động tốt',
    },
    {
      id: `${prefix}-m-b`,
      name: 'Máy B',
      ip: `192.168.${lineSubnet}.12`,
      status: 'Hoạt động tốt',
    },
    {
      id: `${prefix}-m-c`,
      name: 'Máy C',
      ip: `192.168.${lineSubnet}.13`,
      status: 'Hoạt động tốt',
    },
  ];
}

export function getDefaultLineCode(line: Pick<ProductionLine, 'id' | 'name' | 'lineCode'>): string {
  if (line.lineCode?.trim()) return line.lineCode.trim();
  const match = /(\d+)/.exec(line.name) || /(\d+)/.exec(line.id);
  const num = match ? Number(match[1]) : 1;
  return `LN-${String(num).padStart(2, '0')}`;
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
    line.statusLabel === 'Đang tháo chuyển' ||
    line.statusLabel === 'Đã chuyển' ||
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
    lineCode: 'LN-01',
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
    keyMachines: createDefaultKeyMachines('line-1', 1),
    improvement: {
      status: 'Đang thực hiện',
      count: 2,
      note: 'Cải tiến đồ gá kẹp phôi CNC giảm 8% cycle time',
      updatedAt: `08:30 · ${formatViDateShort(TODAY_ISO)}`,
      posts: [
        {
          id: 'imp-l1-2',
          title: 'Cải tiến đồ gá kẹp phôi CNC nhanh (Quick-Clamp)',
          beforeText:
            'Kẹp phôi thủ công bằng 4 bu-lông lục giác mất 42 giây/lần gá, dễ lệch tâm khi thay ca.',
          afterText:
            'Chuyển sang bộ kẹp cam khí nén định vị chốt chuẩn 2 điểm trên bàn máy CNC.',
          effectiveness:
            'Giảm 8% cycle time toàn chuyền (+14 sản phẩm/ca), loại bỏ 100% lỗi lệch gốc tọa độ.',
          author: 'Lê Hoàng Đức',
          status: 'Đang thực hiện',
          createdAt: `08:30 · ${formatViDateShort(TODAY_ISO)}`,
          pptAttachment: {
            fileName: 'Kaizen_Line1_QuickClamp_CNC.pptx',
            fileSizeBytes: 1843200,
            uploadedAt: `08:30 · ${formatViDateShort(TODAY_ISO)}`,
          },
        },
        {
          id: 'imp-l1-1',
          title: 'Bố trí khay cấp liệu nghiêng 15 độ tại trạm đầu vào',
          beforeText: 'Công nhân phải với tay lấy phôi từ thùng pallet đặt xa 80cm.',
          afterText: 'Lắp giá trượt con lăn nghiêng 15 độ ngay cạnh vùng thao tác Máy A.',
          effectiveness: 'Giảm 35% thao tác thừa, giảm mỏi cổ tay cho người vận hành.',
          author: 'Lê Hoàng Đức',
          status: 'Hoàn tất',
          createdAt: `14:20 · ${formatViDateShort(addDaysToIso(TODAY_ISO, -2))}`,
          pptAttachment: {
            fileName: 'Kaizen_Line1_Ergonomic_Tray.pptx',
            fileSizeBytes: 1126400,
            uploadedAt: `14:20 · ${formatViDateShort(addDaysToIso(TODAY_ISO, -2))}`,
          },
        },
      ],
    },
    edm: {
      status: 'Hoàn tất',
      count: 1,
      note: 'Máy A · Đã hoàn tất đối sách Worst Tuần 47',
      updatedAt: `08:15 · ${formatViDateShort(TODAY_ISO)}`,
      worstItems: [
        {
          id: 'edm-l1-w47-1',
          weekLabel: 'Tuần 47 / 2026',
          machineName: 'Máy A',
          machineIp: '192.168.1.11',
          worstTitle: 'Mòn điện cực khuôn #1 gây ba-via mép phôi',
          worstDetail: 'Phát hiện 14 mẫu ba-via vượt 0.05mm trên Máy A trong tuần 47.',
          metricValue: '2.8% NG',
          priority: 'Cao (Top 1)',
          postedByAdmin: 'Admin_KHV',
          createdAt: `08:00 · ${formatViDateShort(TODAY_ISO)}`,
          status: 'Đã hoàn tất đối sách',
          countermeasure: {
            technicianName: 'KTV Nguyễn Hữu Phước',
            actionText: 'Bắn sửa điện cực đồng-vonfram khuôn #1 và thiết lập ngưỡng thay sau 3.500 chu kỳ.',
            resultNote: 'Đo lại 100 mẫu đầu ca đạt chuẩn, tỷ lệ NG giảm về 0.1%.',
            updatedAt: `08:15 · ${formatViDateShort(TODAY_ISO)}`,
          },
        },
      ],
    },
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: TODAY_ISO,
      expectedDate: TODAY_ISO,
    },
  },
  {
    id: 'line-2',
    lineCode: 'LN-02',
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
    keyMachines: createDefaultKeyMachines('line-2', 2),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: TODAY_ISO,
      expectedDate: TODAY_ISO,
    },
  },
  {
    id: 'line-3',
    lineCode: 'LN-03',
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
    keyMachines: [
      { id: 'line-3-m-a', name: 'Máy A', ip: '192.168.3.11', status: 'Hoạt động tốt' },
      { id: 'line-3-m-b', name: 'Máy B', ip: '192.168.3.12', status: 'Cần theo dõi', note: 'Đang căn chỉnh JIG' },
      { id: 'line-3-m-c', name: 'Máy C', ip: '192.168.3.13', status: 'Hoạt động tốt' },
    ],
    improvement: {
      status: 'Đang thực hiện',
      count: 1,
      note: 'Hiệu chỉnh JIG định vị máy B',
      updatedAt: `08:10 · ${formatViDateShort(TODAY_ISO)}`,
      posts: [
        {
          id: 'imp-l3-1',
          title: 'Hiệu chỉnh JIG định vị chống rung cho Máy B',
          beforeText: 'JIG cũ độ rơ +0.08mm gây tỉ lệ test lại ở bước đầu ca là 3.2%.',
          afterText: 'Bổ sung chốt định vị côn và đệm chống rung cao su chịu nhiệt dưới đế JIG.',
          effectiveness: 'Giảm tỉ lệ test lại xuống dưới 0.4%, ổn định độ lặp lại trên Máy B.',
          author: 'Nguyễn Văn Tuấn',
          status: 'Đang thực hiện',
          createdAt: `08:10 · ${formatViDateShort(TODAY_ISO)}`,
          pptAttachment: {
            fileName: 'Kaizen_Line3_JIG_MayB.pptx',
            fileSizeBytes: 942080,
            uploadedAt: `08:10 · ${formatViDateShort(TODAY_ISO)}`,
          },
        },
      ],
    },
    edm: {
      status: 'Đang thực hiện',
      count: 2,
      note: 'Tuần 48: Máy B & Máy C cần đối sách Worst',
      updatedAt: `08:12 · ${formatViDateShort(TODAY_ISO)}`,
      worstItems: [
        {
          id: 'edm-l3-w48-1',
          weekLabel: 'Tuần 48 / 2026',
          machineName: 'Máy B',
          machineIp: '192.168.3.12',
          worstTitle: 'Lệch độ sâu khe tản nhiệt JIG lắp ráp (+0.12mm)',
          worstDetail: 'Top 1 Worst Tuần 48 trên Máy B làm tăng lực ép khi lắp vỏ.',
          metricValue: '4.5% NG',
          priority: 'Cao (Top 1)',
          postedByAdmin: 'Admin_KHV',
          createdAt: `08:05 · ${formatViDateShort(TODAY_ISO)}`,
          status: 'Chờ đối sách',
        },
        {
          id: 'edm-l3-w47-1',
          weekLabel: 'Tuần 47 / 2026',
          machineName: 'Máy C',
          machineIp: '192.168.3.13',
          worstTitle: 'Rỗ bề mặt hốc định vị sau gia công xung điện',
          worstDetail: 'Độ nhám Ra vượt ngưỡng 1.6µm khi chạy tinh cuối ca đêm.',
          metricValue: '1.9% NG',
          priority: 'Trung bình',
          postedByAdmin: 'Admin_KHV',
          createdAt: `14:30 · ${formatViDateShort(addDaysToIso(TODAY_ISO, -2))}`,
          status: 'Đang triển khai đối sách',
          countermeasure: {
            technicianName: 'KTV Lê Quang Minh',
            actionText: 'Giảm dòng xung bước tinh xuống 2.5A và thay lọc dầu điện môi máy EDM.',
            resultNote: 'Đang chạy kiểm chứng lô 30 sản phẩm đầu tiên.',
            updatedAt: `08:12 · ${formatViDateShort(TODAY_ISO)}`,
          },
        },
      ],
    },
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 3),
      expectedDate: addDaysToIso(TODAY_ISO, 5),
    },
  },
  {
    id: 'line-4',
    lineCode: 'LN-04',
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
    keyMachines: createDefaultKeyMachines('line-4', 4),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 2),
      expectedDate: addDaysToIso(TODAY_ISO, 1),
    },
  },
  {
    id: 'line-5',
    lineCode: 'LN-05',
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
    keyMachines: [
      { id: 'line-5-m-a', name: 'Máy A', ip: '192.168.5.11', status: 'Hoạt động tốt' },
      { id: 'line-5-m-b', name: 'Máy B', ip: '192.168.5.12', status: 'Dừng lỗi', note: 'Đang xử lý sự cố máy' },
      { id: 'line-5-m-c', name: 'Máy C', ip: '192.168.5.13', status: 'Cần theo dõi' },
    ],
    improvement: {
      status: 'Đang thực hiện',
      count: 1,
      note: 'Cải tiến cơ cấu dẫn hướng băng tải đầu ra',
      updatedAt: `08:05 · ${formatViDateShort(TODAY_ISO)}`,
      posts: [
        {
          id: 'imp-l5-1',
          title: 'Cải tiến thanh dẫn hướng băng tải chống kẹt khay',
          beforeText: 'Khay thành phẩm hay bị xô lệch ở góc cua băng tải cuối chuyền.',
          afterText: 'Thay thanh dẫn hướng nhựa POM bo tròn kết hợp cảm biến dừng mềm.',
          effectiveness: 'Giảm 100% tình trạng kẹt khay, tiết kiệm 15 phút xử lý dừng vặt mỗi ca.',
          author: 'Trần Thị Mai',
          status: 'Đang thực hiện',
          createdAt: `08:05 · ${formatViDateShort(TODAY_ISO)}`,
        },
      ],
    },
    edm: {
      status: 'Đang thực hiện',
      count: 1,
      note: 'Tuần 48: Máy B chờ đối sách chốt dẫn hướng',
      updatedAt: `08:05 · ${formatViDateShort(TODAY_ISO)}`,
      worstItems: [
        {
          id: 'edm-l5-w48-1',
          weekLabel: 'Tuần 48 / 2026',
          machineName: 'Máy B',
          machineIp: '192.168.5.12',
          worstTitle: 'Gãy chốt dẫn hướng đầu cấp khay trên Máy B',
          worstDetail: 'Dừng máy 3 lần trong tuần 48 do chốt cũ bị mỏi nhiệt tại góc uốn.',
          metricValue: '3 lần dừng/tuần',
          priority: 'Cao (Top 1)',
          postedByAdmin: 'Admin_KHV',
          createdAt: `08:05 · ${formatViDateShort(TODAY_ISO)}`,
          status: 'Chờ đối sách',
        },
      ],
    },
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 2),
      expectedDate: addDaysToIso(TODAY_ISO, 6),
    },
  },
  {
    id: 'line-6',
    lineCode: 'LN-06',
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
    keyMachines: createDefaultKeyMachines('line-6', 6),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 4),
      expectedDate: addDaysToIso(TODAY_ISO, 4),
    },
  },
  {
    id: 'line-7',
    lineCode: 'LN-07',
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
    keyMachines: createDefaultKeyMachines('line-7', 7),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 1),
      expectedDate: addDaysToIso(TODAY_ISO, 1),
    },
  },
  {
    id: 'line-8',
    lineCode: 'LN-08',
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
    keyMachines: [
      { id: 'line-8-m-a', name: 'Máy A', ip: '192.168.8.11', status: 'Cần theo dõi' },
      { id: 'line-8-m-b', name: 'Máy B', ip: '192.168.8.12', status: 'Hoạt động tốt' },
      { id: 'line-8-m-c', name: 'Máy C', ip: '192.168.8.13', status: 'Hoạt động tốt' },
    ],
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 3),
      expectedDate: addDaysToIso(TODAY_ISO, 5),
    },
  },
  {
    id: 'line-9',
    lineCode: 'LN-09',
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
    keyMachines: createDefaultKeyMachines('line-9', 9),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 5),
      expectedDate: addDaysToIso(TODAY_ISO, 5),
    },
  },
  {
    id: 'line-10',
    lineCode: 'LN-10',
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
    keyMachines: createDefaultKeyMachines('line-10', 10),
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
    warehouseImprovement: 1,
    warehouseEdm: 1,
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
    warehouseImprovement: 1,
    warehouseEdm: 0,
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
    warehouseImprovement: 0,
    warehouseEdm: 1,
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
    warehouseImprovement: 1,
    warehouseEdm: 1,
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
    warehouseImprovement: 0,
    warehouseEdm: 0,
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
    warehouseImprovement: 1,
    warehouseEdm: 0,
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
    warehouseImprovement: 0,
    warehouseEdm: 2,
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
    warehouseImprovement: 1,
    warehouseEdm: 1,
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
    warehouseImprovement: 0,
    warehouseEdm: 0,
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
    warehouseImprovement: 0,
    warehouseEdm: 1,
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
    warehouseImprovement: 1,
    warehouseEdm: 0,
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

export const DAALL_LINES: ProductionLine[] = [
  {
    id: 'daall-line-1',
    lineCode: 'DA-01',
    name: 'Line D1',
    stage: 'Line D1 - Auto Assembly',
    shortStage: 'Auto',
    factory: 'Nhà máy 1 (NM1)',
    characteristic: 'mas',
    vtPercent: 100,
    healthPercent: 92,
    issueCount: 0,
    statusLabel: 'Đang sản xuất',
    healthBadge: 'Ổn định',
    healthTone: 'emerald',
    leader: 'Phạm Minh Hoàng',
    updatedAt: `08:50 · ${formatViDateShort(TODAY_ISO)}`,
    keyMachines: createDefaultKeyMachines('daall-line-1', 21),
    improvement: {
      status: 'Đang thực hiện',
      count: 1,
      note: 'Tối ưu tốc độ cấp phôi trạm đầu vào DA-01',
      updatedAt: `08:45 · ${formatViDateShort(TODAY_ISO)}`,
      posts: [
        {
          id: 'imp-da1-1',
          title: 'Tối ưu cảm biến quang & tốc độ cấp phôi trạm đầu vào DA-01',
          beforeText: 'Cảm biến trễ 0.6s khiến tay gắp chờ phôi giữa các chu kỳ.',
          afterText: 'Chuyển cảm biến sợi quang phản xạ nhanh và đặt trước 1 khay đệm.',
          effectiveness: 'Tăng sản lượng trung bình +11% mỗi ca tại nhà máy NM1.',
          author: 'Phạm Minh Hoàng',
          status: 'Đang thực hiện',
          createdAt: `08:45 · ${formatViDateShort(TODAY_ISO)}`,
          pptAttachment: {
            fileName: 'DAALL_LineD1_Feeder_Kaizen.pptx',
            fileSizeBytes: 1480000,
            uploadedAt: `08:45 · ${formatViDateShort(TODAY_ISO)}`,
          },
        },
      ],
    },
    edm: {
      status: 'Hoàn tất',
      count: 1,
      note: 'Máy A · Đã hoàn tất đối sách Worst Tuần 47',
      updatedAt: `08:20 · ${formatViDateShort(TODAY_ISO)}`,
      worstItems: [
        {
          id: 'edm-da1-w47-1',
          weekLabel: 'Tuần 47 / 2026',
          machineName: 'Máy A',
          machineIp: '192.168.21.11',
          worstTitle: 'Kẹt phôi nhẹ tại rãnh khuôn kẹp DA-01',
          worstDetail: 'Gây gián đoạn cấp phôi 6 lần trong tuần 47 trên Máy A.',
          metricValue: '6 lần/tuần',
          priority: 'Trung bình',
          postedByAdmin: 'Admin_DAALL',
          createdAt: `07:50 · ${formatViDateShort(TODAY_ISO)}`,
          status: 'Đã hoàn tất đối sách',
          countermeasure: {
            technicianName: 'KTV Đỗ Minh Hải',
            actionText: 'Cắt EDM mở rộng góc thoát phôi thêm 0.15mm và đánh bóng gương rãnh trượt.',
            resultNote: 'Chạy liên tục 2 ca không phát sinh kẹt phôi.',
            updatedAt: `08:20 · ${formatViDateShort(TODAY_ISO)}`,
          },
        },
      ],
    },
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: TODAY_ISO,
      expectedDate: TODAY_ISO,
    },
  },
  {
    id: 'daall-line-2',
    lineCode: 'DA-02',
    name: 'Line D2',
    stage: 'Line D2 - AOI & Laser Marking',
    shortStage: 'AOI',
    factory: 'Nhà máy 1 (NM1)',
    characteristic: 'mas',
    vtPercent: 100,
    healthPercent: 86,
    issueCount: 0,
    statusLabel: 'Đang sản xuất',
    healthBadge: 'Tối ưu',
    healthTone: 'emerald',
    leader: 'Nguyễn Văn Tuấn',
    updatedAt: `08:42 · ${formatViDateShort(TODAY_ISO)}`,
    keyMachines: createDefaultKeyMachines('daall-line-2', 22),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: TODAY_ISO,
      expectedDate: TODAY_ISO,
    },
  },
  {
    id: 'daall-line-3',
    lineCode: 'DA-03',
    name: 'Line D3',
    stage: 'Line D3 - Function Calibration',
    shortStage: 'Calib',
    factory: 'Nhà máy 2 (NM2)',
    characteristic: 'new',
    vtPercent: 80,
    healthPercent: 72,
    issueCount: 1,
    statusLabel: 'Đang cài đặt',
    healthBadge: 'Chờ kiểm tra',
    healthTone: 'amber',
    leader: 'Trần Quốc Thắng',
    updatedAt: `08:25 · ${formatViDateShort(TODAY_ISO)}`,
    keyMachines: [
      { id: 'daall-line-3-m-a', name: 'Máy A', ip: '192.168.23.11', status: 'Hoạt động tốt' },
      { id: 'daall-line-3-m-b', name: 'Máy B', ip: '192.168.23.12', status: 'Cần theo dõi' },
      { id: 'daall-line-3-m-c', name: 'Máy C', ip: '192.168.23.13', status: 'Hoạt động tốt' },
    ],
    improvement: {
      status: 'Đang thực hiện',
      count: 2,
      note: 'Cải tiến JIG test cảm biến nhiệt độ',
      updatedAt: `08:22 · ${formatViDateShort(TODAY_ISO)}`,
      posts: [
        {
          id: 'imp-da3-2',
          title: 'Cải tiến JIG test đa điểm cảm biến nhiệt độ 4 kênh',
          beforeText: 'Test từng cảm biến đơn lẻ mất 28 giây/mẫu.',
          afterText: 'Thiết kế JIG 4 khe song song kết nối đồng bộ về Máy B.',
          effectiveness: 'Rút ngắn thời gian test 65%, tăng độ đồng đều hiệu chuẩn.',
          author: 'Trần Quốc Thắng',
          status: 'Đang thực hiện',
          createdAt: `08:22 · ${formatViDateShort(TODAY_ISO)}`,
          pptAttachment: {
            fileName: 'DAALL_LineD3_4Ch_TempJIG.pptx',
            fileSizeBytes: 2150400,
            uploadedAt: `08:22 · ${formatViDateShort(TODAY_ISO)}`,
          },
        },
        {
          id: 'imp-da3-1',
          title: 'Mã màu dây tín hiệu chống cắm nhầm trạm Calib',
          beforeText: 'Dây tín hiệu cùng màu đen dễ nhầm khi bảo trì thay đầu đo.',
          afterText: 'Bọc co nhiệt 4 màu tiêu chuẩn và dán nhãn số kênh tại đầu jack.',
          effectiveness: 'Giảm thời gian đấu nối bảo trì từ 12 phút xuống còn 2 phút.',
          author: 'Trần Quốc Thắng',
          status: 'Hoàn tất',
          createdAt: `16:10 · ${formatViDateShort(addDaysToIso(TODAY_ISO, -1))}`,
        },
      ],
    },
    edm: {
      status: 'Đang thực hiện',
      count: 1,
      note: 'Tuần 48: Máy B chờ đối sách điện cực đầu đo',
      updatedAt: `08:24 · ${formatViDateShort(TODAY_ISO)}`,
      worstItems: [
        {
          id: 'edm-da3-w48-1',
          weekLabel: 'Tuần 48 / 2026',
          machineName: 'Máy B',
          machineIp: '192.168.23.12',
          worstTitle: 'Oxy hóa bề mặt điện cực tiếp xúc đầu đo trên Máy B',
          worstDetail: 'Sai số tiếp xúc tăng +0.4 ohm ở các chu kỳ test nhiệt cao Tuần 48.',
          metricValue: '3.1% NG',
          priority: 'Cao (Top 1)',
          postedByAdmin: 'Admin_DAALL',
          createdAt: `08:24 · ${formatViDateShort(TODAY_ISO)}`,
          status: 'Chờ đối sách',
        },
      ],
    },
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 4),
      expectedDate: addDaysToIso(TODAY_ISO, 3),
    },
  },
  {
    id: 'daall-line-4',
    lineCode: 'DA-04',
    name: 'Line D4',
    stage: 'Line D4 - High-Speed Test',
    shortStage: 'Test',
    factory: 'Nhà máy 2 (NM2)',
    characteristic: 'new',
    vtPercent: 95,
    healthPercent: 88,
    issueCount: 0,
    statusLabel: 'Chạy thử',
    healthBadge: 'Sắp hoàn thành',
    healthTone: 'emerald',
    leader: 'Trần Thị Mai',
    updatedAt: `08:45 · ${formatViDateShort(TODAY_ISO)}`,
    keyMachines: createDefaultKeyMachines('daall-line-4', 24),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: addDaysToIso(TODAY_ISO, 2),
      expectedDate: addDaysToIso(TODAY_ISO, 1),
    },
  },
  {
    id: 'daall-line-5',
    lineCode: 'DA-05',
    name: 'Line D5',
    stage: 'Line D5 - Packing & Aging',
    shortStage: 'Pack',
    factory: 'Nhà máy 3 (NM3)',
    characteristic: 'mas',
    vtPercent: 65,
    healthPercent: 58,
    issueCount: 1,
    statusLabel: 'Dừng do Vật liệu',
    healthBadge: 'Cần bổ sung vật tư',
    healthTone: 'amber',
    leader: 'Vũ Đình Toàn',
    updatedAt: `08:10 · ${formatViDateShort(TODAY_ISO)}`,
    keyMachines: createDefaultKeyMachines('daall-line-5', 25),
    setupTimeline: {
      currentDate: TODAY_ISO,
      targetDate: TODAY_ISO,
      expectedDate: TODAY_ISO,
    },
  },
];

export const DAALL_PIPELINE_ITEMS: PipelineItem[] = [
  {
    itemNo: 'D1',
    name: 'Module DA-Core',
    badgeColor: 'indigo',
    targetDemand: 12,
    toBuy: 12,
    inWarehouse: 12,
    warehouseImprovement: 2,
    warehouseEdm: 1,
    vendorInbound: 12,
    stagedOnLine: 11,
    lineTested: 11,
    purchaseIssue: '',
    vendorIssue: '',
  },
  {
    itemNo: 'D2',
    name: 'Sensor Array X2',
    badgeColor: 'blue',
    targetDemand: 10,
    toBuy: 10,
    inWarehouse: 10,
    warehouseImprovement: 1,
    warehouseEdm: 1,
    vendorInbound: 9,
    stagedOnLine: 9,
    lineTested: 8,
    purchaseIssue: 'Chờ lô hiệu chuẩn Sensor từ Vendor K',
    vendorIssue: 'Đang kiểm định 1 kiện cuối tại cổng NM2',
  },
  {
    itemNo: 'D3',
    name: 'Housing Alu-Pro',
    badgeColor: 'amber',
    targetDemand: 14,
    toBuy: 14,
    inWarehouse: 11,
    warehouseImprovement: 1,
    warehouseEdm: 2,
    vendorInbound: 11,
    stagedOnLine: 9,
    lineTested: 9,
    purchaseIssue: 'Thiếu 3 bộ vỏ nhôm anodize cho Line D5',
    vendorIssue: '',
  },
  {
    itemNo: 'D4',
    name: 'Harness Cable Pro',
    badgeColor: 'teal',
    targetDemand: 16,
    toBuy: 16,
    inWarehouse: 16,
    warehouseImprovement: 0,
    warehouseEdm: 1,
    vendorInbound: 16,
    stagedOnLine: 15,
    lineTested: 14,
    purchaseIssue: '',
    vendorIssue: '',
  },
];

export const DAALL_ISSUES: IssueItem[] = [
  {
    id: 'ISS-201',
    line: 'Line D3',
    itemCode: 'D2 - Sensor Array X2',
    title: 'Chờ đồng bộ Firmware hiệu chuẩn trên Máy B (Line D3)',
    description: 'Cần nạp bản firmware v2.4 cho trạm hiệu chuẩn Máy B trước khi chạy thử nghiệm.',
    severity: 'medium',
    assignee: 'Trần Quốc Thắng',
    assigneeRole: 'Kỹ sư Line D3',
    duration: '45m',
    sinceTime: 'Từ 08:15',
    statusText: 'Đang nạp firmware',
    progress: 50,
    notes: 'Đã kết nối mạng LAN nội bộ 192.168.23.12, đang test 5 bo mạch chuẩn.',
  },
  {
    id: 'ISS-202',
    line: 'Line D5',
    itemCode: 'D3 - Housing Alu-Pro',
    title: 'Dừng tạm do thiếu 3 bộ vỏ nhôm Housing Alu-Pro',
    description: 'Kho trung tâm DAALL đang điều chuyển bổ sung 3 bộ vỏ từ kho dự phòng NM1.',
    severity: 'medium',
    assignee: 'Vũ Đình Toàn',
    assigneeRole: 'Line Leader Line D5',
    duration: '1h 05m',
    sinceTime: 'Từ 07:55',
    statusText: 'Chờ cấp vật tư bổ sung',
    progress: 35,
    notes: 'Phiếu xuất kho bổ sung đã duyệt, dự kiến giao xuống Line D5 trong 20 phút.',
  },
];

export const DAALL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    version: 'v1.1 (Hiện tại)',
    isCurrent: true,
    timestamp: 'Hôm nay, 08:40',
    author: 'Admin_DAALL',
    reason: 'Cập nhật định mức khởi chạy cụm dây chuyền DAALL Q2',
    changes: 'Khởi tạo D1-D4 và đồng bộ 5 dây chuyền Line D1 - D5',
    tone: 'blue',
  },
  {
    version: 'v1.0',
    timestamp: 'Hôm nay, 08:00',
    author: 'System_Init',
    reason: 'Kích hoạt Trung tâm Điều hành Sản xuất DAALL',
    changes: 'Tạo cấu trúc Trung tâm DAALL tương đương KHV',
    tone: 'slate',
  },
];

export function createInitialCenterData(payload: {
  code: string;
  name: string;
  subtitle?: string;
  accentColor: CenterAccentColor;
  initialLineCount: number;
}): ProductionCenter {
  const cleanCode = payload.code.trim().toUpperCase();
  const slug = cleanCode.toLowerCase().replace(/[^a-z0-9]+/g, '-') || `c-${Date.now()}`;
  const today = getTodayIsoDate();
  const count = Math.max(0, Math.min(10, payload.initialLineCount));
  const lines: ProductionLine[] = Array.from({ length: count }, (_, idx) => {
    const num = idx + 1;
    const isMass = idx === 0;
    const subnet = 40 + num;
    return {
      id: `${slug}-line-${num}-${Date.now()}`,
      lineCode: `${cleanCode.slice(0, 3)}-${String(num).padStart(2, '0')}`,
      name: `Line ${num}`,
      stage: `Line ${num} - Công đoạn ${num}`,
      shortStage: isMass ? 'Mass' : 'Setup',
      factory: DEFAULT_FACTORIES[0],
      characteristic: isMass ? 'mas' : 'new',
      vtPercent: isMass ? 100 : 80,
      healthPercent: isMass ? 90 : 75,
      issueCount: 0,
      statusLabel: isMass ? 'Đang sản xuất' : 'Đang Lắp Ráp',
      healthBadge: isMass ? 'Ổn định' : 'Chờ kiểm tra',
      healthTone: isMass ? 'emerald' : 'amber',
      leader: 'Kỹ sư phụ trách',
      updatedAt: formatLineTimestamp(),
      keyMachines: createDefaultKeyMachines(`${slug}-line-${num}`, subnet),
      improvement: { status: 'Chưa phát sinh', count: 0, posts: [] },
      edm: { status: 'Chưa phát sinh', count: 0, worstItems: [] },
      setupTimeline: {
        currentDate: today,
        targetDate: addDaysToIso(today, isMass ? 0 : 3),
        expectedDate: addDaysToIso(today, isMass ? 0 : 3),
      },
    };
  });

  const pipelineItems: PipelineItem[] = [
    {
      itemNo: 'M1',
      name: `${cleanCode}-Item 1`,
      badgeColor: 'blue',
      targetDemand: 10,
      toBuy: 10,
      inWarehouse: 10,
      warehouseImprovement: 1,
      warehouseEdm: 1,
      vendorInbound: 10,
      stagedOnLine: 8,
      lineTested: 8,
      purchaseIssue: '',
      vendorIssue: '',
    },
    {
      itemNo: 'M2',
      name: `${cleanCode}-Item 2`,
      badgeColor: 'indigo',
      targetDemand: 12,
      toBuy: 12,
      inWarehouse: 10,
      warehouseImprovement: 0,
      warehouseEdm: 1,
      vendorInbound: 9,
      stagedOnLine: 8,
      lineTested: 7,
      purchaseIssue: '',
      vendorIssue: '',
    },
  ];

  return {
    id: `center-${slug}-${Date.now()}`,
    code: cleanCode,
    name: payload.name.trim(),
    subtitle: payload.subtitle?.trim() || `Hub Vận Hành ${cleanCode}`,
    accentColor: payload.accentColor,
    selectedProject: `${cleanCode}-2025`,
    lines,
    pipelineItems,
    issues: [],
    auditLogs: [
      {
        version: 'v1.0 (Hiện tại)',
        isCurrent: true,
        timestamp: `Hôm nay, ${new Date().toLocaleTimeString('vi-VN', {
          hour: '2-digit',
          minute: '2-digit',
        })}`,
        author: `Admin_${cleanCode}`,
        reason: `Admin khởi tạo Trung tâm mới: ${payload.name.trim()}`,
        changes: `Tạo Trung tâm ${cleanCode} với ${count} dây chuyền ban đầu`,
        tone: 'blue',
      },
    ],
  };
}

export const INITIAL_CENTERS: ProductionCenter[] = [
  {
    id: 'center-khv',
    code: 'KHV',
    name: 'Trung tâm Kế hoạch Vận hành (KHV)',
    subtitle: 'Hub Vận Hành',
    accentColor: 'blue',
    selectedProject: 'KHV-2025',
    lines: INITIAL_LINES,
    pipelineItems: INITIAL_PIPELINE_ITEMS,
    issues: INITIAL_ISSUES,
    auditLogs: INITIAL_AUDIT_LOGS,
  },
  {
    id: 'center-daall',
    code: 'DAALL',
    name: 'Trung tâm Điều hành Sản xuất (DAALL)',
    subtitle: 'Hub Vận Hành DAALL',
    accentColor: 'indigo',
    selectedProject: 'DAALL-2025',
    lines: DAALL_LINES,
    pipelineItems: DAALL_PIPELINE_ITEMS,
    issues: DAALL_ISSUES,
    auditLogs: DAALL_AUDIT_LOGS,
  },
];

