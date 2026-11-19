import { Download, FolderKanban, Plus } from 'lucide-react';

interface TopNavProps {
  selectedProject: string;
  onSelectProject: (project: string) => void;
  onExportReport: () => void;
  onOpenAddLine: () => void;
}

export function TopNav({
  selectedProject,
  onSelectProject,
  onExportReport,
  onOpenAddLine,
}: TopNavProps) {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-bold text-base shadow-sm shrink-0">
              KHV
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                Hệ Thống Quản Lý &amp; Giám Sát Tiến Độ Dự Án Sản Xuất
              </h1>
              <p className="text-xs text-slate-500 truncate">
                KHV Manufacturing Operation &amp; Supply Chain Control
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="hidden lg:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
              <FolderKanban className="w-4 h-4 text-slate-500 shrink-0" />
              <select
                aria-label="Chọn dự án sản xuất"
                value={selectedProject}
                onChange={(e) => onSelectProject(e.target.value)}
                className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none pr-2 cursor-pointer"
              >
                <option value="KHV-2025">Dự án KHV-2025 (Line 1 - 10)</option>
                <option value="KHV-ALPHA">Dự án SmartLine Alpha (Q2)</option>
                <option value="KHV-EXPORT">Dự án OEM Export Line</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onExportReport}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4 text-slate-600" />
                <span>Xuất báo cáo</span>
              </button>
              <button
                type="button"
                onClick={onOpenAddLine}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm Line mới</span>
              </button>
            </div>

            <div className="flex items-center pl-3 border-l border-slate-200">
              <div
                title="Quản lý vận hành (QL)"
                className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs text-slate-700 shrink-0"
              >
                QL
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
