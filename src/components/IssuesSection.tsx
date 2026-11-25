import {
  AlertTriangle,
  ArrowDown,
  BellRing,
  CheckCircle2,
  ClipboardList,
  Download,
  Filter,
  Plus,
  RefreshCw,
  Search,
  Timer,
} from 'lucide-react';
import { useState } from 'react';
import { IssueItem, IssueSeverity, ProductionLine } from '../types/production';

interface IssuesSectionProps {
  issues: IssueItem[];
  lines: ProductionLine[];
  selectedLineFilter: string;
  onChangeLineFilter: (line: string) => void;
  onOpenIssueDetail: (issueId: string) => void;
  onOpenAddIssue: () => void;
  onOpenExportIssues: () => void;
  onExportAllIssues: () => void;
  onOpenAlertModal: () => void;
  onRefreshData: () => void;
}

export function IssuesSection({
  issues,
  lines,
  selectedLineFilter,
  onChangeLineFilter,
  onOpenIssueDetail,
  onOpenAddIssue,
  onOpenExportIssues,
  onExportAllIssues,
  onOpenAlertModal,
  onRefreshData,
}: IssuesSectionProps) {
  const [severityFilter, setSeverityFilter] = useState<'all' | IssueSeverity>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const highCount = issues.filter((i) => i.severity === 'high').length;
  const mediumCount = issues.filter((i) => i.severity === 'medium').length;
  const lowCount = issues.filter((i) => i.severity === 'low').length;

  const filteredIssues = issues.filter((issue) => {
    const matchesSeverity = severityFilter === 'all' || issue.severity === severityFilter;
    const matchesLine = selectedLineFilter === 'all' || issue.line === selectedLineFilter;
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      !q ||
      issue.id.toLowerCase().includes(q) ||
      issue.title.toLowerCase().includes(q) ||
      issue.description.toLowerCase().includes(q) ||
      issue.itemCode.toLowerCase().includes(q) ||
      issue.assignee.toLowerCase().includes(q);
    return matchesSeverity && matchesLine && matchesSearch;
  });

  const highlightIssues = issues.filter((i) => i.highlightActionText);

  const getLineBadgeClass = (line: string) => {
    if (line === 'Line 3') return 'bg-rose-100 text-rose-800 border-rose-200';
    if (line === 'Line 5' || line === 'Form Mua Hàng' || line === 'Form Hiện Trường')
      return 'bg-amber-100 text-amber-800 border-amber-300';
    return 'bg-blue-100 text-blue-800 border-blue-200';
  };

  const getSeverityBadge = (sev: IssueSeverity) => {
    if (sev === 'high') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-700 border border-rose-300 whitespace-nowrap">
          Khẩn cấp
        </span>
      );
    }
    if (sev === 'medium') {
      return (
        <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
          Trung bình
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-blue-100 text-blue-700 border border-blue-300 whitespace-nowrap">
        Thấp
      </span>
    );
  };

  return (
    <section className="space-y-6" id="issues-management-system">
      {/* Quick Overview Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Issues Quick Highlight */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-bold text-slate-900">
                  Danh Sách Sự Cố Trọng Điểm Đang Xử Lý (Active Issues)
                </h2>
                <span className="text-xs font-bold text-rose-700">· Cần can thiệp gấp</span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Các điểm nghẽn kỹ thuật và vật tư ảnh hưởng trực tiếp đến % tiến độ chuyền
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs font-semibold text-rose-700 tabular-nums">
                {issues.length} Sự cố mở
              </span>
              <a
                href="#line-issues-detail-tracker"
                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg border border-blue-200 inline-flex items-center gap-1 transition whitespace-nowrap"
              >
                <span>Xem Bảng Chi Tiết</span>
                <ArrowDown className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          <div className="divide-y divide-slate-100 mt-2">
            {highlightIssues.map((issue) => (
              <div key={issue.id} className="py-3.5 flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-0.5 px-2 py-0.5 text-xs font-bold rounded border whitespace-nowrap shrink-0 ${getLineBadgeClass(
                      issue.line
                    )}`}
                  >
                    {issue.line}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {issue.title} ({issue.id})
                    </p>
                    <div className="flex items-center gap-2.5 text-xs text-slate-500 mt-1 flex-wrap">
                      <span>
                        Phụ trách: <strong>{issue.assignee}</strong> ({issue.assigneeRole})
                      </span>
                      <span>·</span>
                      <span
                        className={`font-medium ${
                          issue.severity === 'high'
                            ? 'text-rose-600'
                            : issue.severity === 'medium'
                            ? 'text-amber-600'
                            : 'text-slate-600'
                        }`}
                      >
                        Mức độ:{' '}
                        {issue.severity === 'high'
                          ? 'Cao (High)'
                          : issue.severity === 'medium'
                          ? 'Trung bình'
                          : 'Thấp'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onOpenIssueDetail(issue.id)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline shrink-0 whitespace-nowrap cursor-pointer"
                >
                  {issue.highlightActionText}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Lines Health Column */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Tổng Quan Dây Chuyền (Lines Health)
            </h2>
            <p className="text-xs text-slate-500 mb-4">
              Tình trạng sẵn sàng vận hành của {lines.length} Line sản xuất
            </p>

            <div className="max-h-72 overflow-y-auto pr-1 space-y-3">
              {lines.map((line) => {
                const badgeClass =
                  line.statusLabel === 'Đang tháo chuyển'
                    ? 'bg-sky-100 text-sky-800 border border-dashed border-sky-400'
                    : line.statusLabel === 'Đã chuyển'
                    ? 'bg-slate-200 text-slate-700'
                    : line.healthTone === 'rose'
                    ? 'bg-rose-100 text-rose-800'
                    : line.healthTone === 'amber'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800';
                const barClass =
                  line.statusLabel === 'Đang tháo chuyển'
                    ? 'bg-sky-500'
                    : line.statusLabel === 'Đã chuyển'
                    ? 'bg-slate-400'
                    : line.healthTone === 'rose' || line.healthPercent < 65
                    ? 'bg-amber-500'
                    : 'bg-blue-600';

                return (
                  <div key={line.id} className="space-y-1">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <span className="font-medium text-slate-700 tabular-nums">
                        {line.name} ({line.healthPercent}% - {line.issueCount} Issue
                        {line.issueCount > 1 ? 's' : ''})
                      </span>
                      <span className={`px-2 py-0.5 rounded font-semibold text-[11px] ${badgeClass}`}>
                        {line.healthBadge}
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full transition-all duration-300 ${barClass}`}
                        style={{ width: `${line.healthPercent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">Cập nhật tự động: Vừa xong</span>
            <button
              type="button"
              onClick={onRefreshData}
              className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Làm mới</span>
            </button>
          </div>
        </div>
      </div>

      {/* Detailed Industrial Issues Tracker Table */}
      <div
        className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"
        id="line-issues-detail-tracker"
      >
        <div className="p-6 border-b border-slate-200 space-y-5 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base font-bold text-slate-900 leading-tight">
                    Bảng Quản Lý &amp; Giám Sát Chi Tiết Sự Cố Dây Chuyền (Line Issues Tracker)
                  </h2>
                  <span className="text-xs font-semibold text-blue-700">
                    · Chuẩn ISO 9001 / IATF 16949
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân hệ giám sát tức thời sự cố kỹ thuật, tình trạng cấp vật tư và tiến trình khắc phục trên các dây chuyền
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
              <button
                type="button"
                onClick={onExportAllIssues}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border border-emerald-200 transition whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={onOpenExportIssues}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-300 transition whitespace-nowrap cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel Item Sự Cố (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={onOpenAlertModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-indigo-50 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-300 transition whitespace-nowrap cursor-pointer"
              >
                <BellRing className="w-3.5 h-3.5 text-amber-500" />
                <span>Cấu hình &amp; Gửi thông báo Email / Zalo</span>
              </button>
              <button
                type="button"
                onClick={onOpenAddIssue}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-lg bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition whitespace-nowrap cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Báo Cáo Sự Cố Mới</span>
              </button>
            </div>
          </div>

          {/* Micro KPI Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-medium block">Tổng sự cố mở</span>
                <span className="text-xl font-extrabold text-slate-900 tabular-nums">
                  {issues.length}
                </span>
                <span className="text-[10px] text-slate-500 ml-1">trên {lines.length} Line</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-white border border-slate-200 flex items-center justify-center text-slate-600">
                <ClipboardList className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-rose-50/50 border border-rose-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-rose-700 font-medium block">
                  Khẩn cấp (Nghẽn/Dừng)
                </span>
                <span className="text-xl font-extrabold text-rose-700 tabular-nums">
                  {highCount}
                </span>
                <span className="text-[10px] text-rose-600 ml-1">High Priority</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-amber-700 font-medium block">
                  Thời gian xử lý TB (MTTR)
                </span>
                <span className="text-xl font-extrabold text-amber-800 tabular-nums">4.2h</span>
                <span className="text-[10px] text-amber-600 ml-1">chuẩn &lt; 6h</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center text-amber-800">
                <Timer className="w-4 h-4" />
              </div>
            </div>

            <div className="bg-emerald-50/50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[11px] text-emerald-700 font-medium block">
                  Khắc phục trong ca
                </span>
                <span className="text-xl font-extrabold text-emerald-700 tabular-nums">92%</span>
                <span className="text-[10px] text-emerald-600 ml-1">đạt KPI</span>
              </div>
              <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            </div>
          </div>

          {/* Interactive Filter Toolbar */}
          <div className="pt-3 border-t border-slate-100 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-slate-500 font-medium inline-flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                <span>Mức độ:</span>
              </span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setSeverityFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer tabular-nums ${
                    severityFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Tất cả ({issues.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('high')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer tabular-nums ${
                    severityFilter === 'high'
                      ? 'bg-rose-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-rose-700'
                  }`}
                >
                  Khẩn cấp ({highCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('medium')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer tabular-nums ${
                    severityFilter === 'medium'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-amber-700'
                  }`}
                >
                  Trung bình ({mediumCount})
                </button>
                <button
                  type="button"
                  onClick={() => setSeverityFilter('low')}
                  className={`px-2.5 py-1 rounded-md transition cursor-pointer tabular-nums ${
                    severityFilter === 'low'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 hover:text-blue-700'
                  }`}
                >
                  Thấp ({lowCount})
                </button>
              </div>

              <div className="flex items-center gap-1.5 ml-1">
                <span className="text-slate-500 font-medium">Dây chuyền:</span>
                <select
                  aria-label="Lọc sự cố theo dây chuyền"
                  value={selectedLineFilter}
                  onChange={(e) => onChangeLineFilter(e.target.value)}
                  className="text-xs rounded-lg border border-slate-300 py-1 px-2.5 bg-white text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="all">Tất cả các Line (1 - {lines.length})</option>
                  <option value="Form Mua Hàng">Form Mua Hàng</option>
                  <option value="Form Hiện Trường">Form Hiện Trường</option>
                  {lines.map((l) => (
                    <option key={l.id} value={l.name}>
                      {l.stage}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start lg:self-auto">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm mã hoặc nội dung..."
                  className="text-xs rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none w-52"
                />
              </div>
              <span className="text-xs font-semibold text-slate-700 tabular-nums whitespace-nowrap">
                Hiển thị: <strong>{filteredIssues.length}/{issues.length}</strong> sự cố
              </span>
            </div>
          </div>
        </div>

        {/* Auto-sync notice */}
        <div className="mx-6 my-4 p-3.5 bg-gradient-to-r from-amber-50 to-blue-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-slate-900">
                  Tự động đồng bộ Issue từ Biểu Mẫu (Auto-sync Enabled)
                </span>
                <span className="text-[11px] font-bold text-emerald-700">· Real-time Active</span>
              </div>
              <p className="text-slate-600 mt-0.5 text-[11px]">
                Mọi issue phát sinh trong Form Báo Cáo Mua Hàng (như Hỏng 1 cái ở A1, Đi cải tiến 1 cái ở A2) và Form Hiện Trường Vendor được tự động đẩy vào danh sách theo dõi sự cố.
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold text-amber-800 whitespace-nowrap shrink-0">
            Đã liên kết 2 Biểu mẫu
          </span>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-700 font-bold uppercase text-[11px]">
              <tr>
                <th className="py-3 px-4 border-r border-slate-200 w-24">Mã SC</th>
                <th className="py-3 px-3 border-r border-slate-200 w-28 text-center">Dây Chuyền</th>
                <th className="py-3 px-3 border-r border-slate-200 w-28">Mã Item</th>
                <th className="py-3 px-4 border-r border-slate-200 min-w-[260px]">
                  Tên &amp; Chi Tiết Vấn Đề Sự Cố
                </th>
                <th className="py-3 px-3 border-r border-slate-200 w-28 text-center">Mức Độ</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[160px]">
                  Người Phụ Trách
                </th>
                <th className="py-3 px-3 border-r border-slate-200 w-28 text-center">Tồn Đọng</th>
                <th className="py-3 px-3 border-r border-slate-200 min-w-[150px]">
                  Trạng Thái &amp; Tiến Độ
                </th>
                <th className="py-3 px-4 text-center w-36">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-800 font-medium">
              {filteredIssues.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500">
                    Không tìm thấy sự cố nào phù hợp với bộ lọc.
                  </td>
                </tr>
              ) : (
                filteredIssues.map((issue) => {
                  const barTone =
                    issue.progress >= 90
                      ? 'bg-emerald-500'
                      : issue.severity === 'high'
                      ? 'bg-rose-500'
                      : 'bg-amber-500';
                  const statusTone =
                    issue.progress >= 90
                      ? 'text-emerald-700'
                      : issue.severity === 'high'
                      ? 'text-rose-700'
                      : 'text-amber-700';

                  return (
                    <tr
                      key={issue.id}
                      id={`issue-row-${issue.id}`}
                      className={`transition ${
                        issue.isSynced ? 'bg-amber-50/20 hover:bg-amber-50/50' : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 px-4 border-r border-slate-200 font-bold font-mono text-blue-700 tabular-nums">
                        <div className="flex items-center gap-1.5">
                          <span>{issue.id}</span>
                          {issue.isSynced && (
                            <span className="px-1 py-0.5 rounded text-[9px] bg-amber-100 text-amber-800 font-bold">
                              Sync
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        <span
                          className={`px-2 py-0.5 rounded font-bold border whitespace-nowrap ${getLineBadgeClass(
                            issue.line
                          )}`}
                        >
                          {issue.line}
                        </span>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200">
                        <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200 font-mono whitespace-nowrap">
                          {issue.itemCode}
                        </span>
                      </td>
                      <td className="py-3 px-4 border-r border-slate-200">
                        <button
                          type="button"
                          onClick={() => onOpenIssueDetail(issue.id)}
                          className="text-left group cursor-pointer focus-visible:outline-2 focus-visible:outline-blue-600 rounded"
                          title="Nhấp để xem chi tiết vấn đề"
                        >
                          <div className="font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                            {issue.isSynced && (
                              <span className="text-amber-700 font-semibold text-[11px] mr-1.5">
                                [Tự động đẩy từ {issue.line}]
                              </span>
                            )}
                            <span>{issue.title}</span>
                          </div>
                          <div className="text-[11px] text-slate-500 mt-0.5">{issue.description}</div>
                        </button>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center">
                        {getSeverityBadge(issue.severity)}
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200">
                        <div className="font-semibold text-slate-900">{issue.assignee}</div>
                        <div className="text-[11px] text-slate-500">{issue.assigneeRole}</div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200 text-center tabular-nums">
                        <span
                          className={`font-bold ${
                            issue.severity === 'high'
                              ? 'text-rose-600'
                              : issue.severity === 'medium'
                              ? 'text-amber-700'
                              : 'text-slate-600'
                          }`}
                        >
                          {issue.duration}
                        </span>
                        <div className="text-[10px] text-slate-400">{issue.sinceTime}</div>
                      </td>
                      <td className="py-3 px-3 border-r border-slate-200">
                        <div
                          className={`flex items-center justify-between text-[11px] font-bold mb-1 tabular-nums ${statusTone}`}
                        >
                          <span>{issue.statusText}</span>
                          <span>{issue.progress}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${barTone}`}
                            style={{ width: `${issue.progress}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenIssueDetail(issue.id)}
                            className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white border border-blue-200 transition cursor-pointer"
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            onClick={() => onOpenIssueDetail(issue.id)}
                            className="px-2 py-1 text-xs font-semibold rounded bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition cursor-pointer"
                          >
                            Update
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-3 flex-wrap tabular-nums">
            <span className="font-medium text-slate-700">Tổng hợp phân loại:</span>
            <span className="font-semibold text-rose-700">{highCount} Khẩn cấp</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-amber-700">{mediumCount} Trung bình</span>
            <span className="text-slate-300">·</span>
            <span className="font-semibold text-blue-700">{lowCount} Mức thấp</span>
          </div>
          <div className="flex items-center gap-2">
            <span>
              Cập nhật hệ thống: <strong>Hôm nay, 09:00 AM</strong>
            </span>
            <button
              type="button"
              onClick={onRefreshData}
              className="px-3 py-1 bg-white border border-slate-200 rounded text-slate-700 font-semibold hover:bg-slate-100 transition cursor-pointer"
            >
              Làm mới bảng
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
