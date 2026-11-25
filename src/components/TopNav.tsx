import { Activity, Download, FolderKanban, Layers, Plus, Settings2, Workflow } from 'lucide-react';
import { AppScreen, CenterAccentColor, ProductionCenter } from '../types/production';

interface TopNavProps {
  centers: ProductionCenter[];
  activeCenter: ProductionCenter;
  activeScreen: AppScreen;
  isAdminMode: boolean;
  selectedProject: string;
  onSelectCenter: (centerId: string) => void;
  onSelectScreen: (screen: AppScreen) => void;
  onOpenCenterManager: () => void;
  onSelectProject: (project: string) => void;
  onExportReport: () => void;
  onOpenAddLine: () => void;
}

const ACCENT_BADGE: Record<CenterAccentColor, string> = {
  blue: 'bg-blue-700',
  indigo: 'bg-indigo-700',
  emerald: 'bg-emerald-700',
  amber: 'bg-amber-600',
};

const ACCENT_TAB_ACTIVE: Record<CenterAccentColor, string> = {
  blue: 'bg-blue-600 text-white border-blue-600 shadow-xs',
  indigo: 'bg-indigo-600 text-white border-indigo-600 shadow-xs',
  emerald: 'bg-emerald-600 text-white border-emerald-600 shadow-xs',
  amber: 'bg-amber-600 text-white border-amber-600 shadow-xs',
};

const ACCENT_DOT: Record<CenterAccentColor, string> = {
  blue: 'bg-blue-500',
  indigo: 'bg-indigo-500',
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
};

export function TopNav({
  centers,
  activeCenter,
  activeScreen,
  isAdminMode,
  selectedProject,
  onSelectCenter,
  onSelectScreen,
  onOpenCenterManager,
  onSelectProject,
  onExportReport,
  onOpenAddLine,
}: TopNavProps) {
  const openLineIssuesCount = activeCenter.issues.filter((i) => i.progress < 100).length;
  const supplyChainIssuesCount = activeCenter.pipelineItems.filter((it) =>
    Boolean(it.purchaseIssue.trim())
  ).length;

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`min-w-[44px] h-10 px-2 rounded-xl flex items-center justify-center text-white font-extrabold text-sm tracking-tight shadow-sm shrink-0 ${
                ACCENT_BADGE[activeCenter.accentColor]
              }`}
            >
              {activeCenter.code}
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight truncate">
                Hệ Thống Quản Lý &amp; Giám Sát Tiến Độ Dự Án Sản Xuất
              </h1>
              <p className="text-xs text-slate-500 truncate">
                {activeCenter.name} · {activeCenter.code} Operation &amp; Supply Chain Control
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
                <option value={`${activeCenter.code}-2025`}>
                  Dự án {activeCenter.code}-2025 ({activeCenter.lines.length} Line)
                </option>
                <option value={`${activeCenter.code}-ALPHA`}>
                  Dự án SmartLine Alpha ({activeCenter.code} Q2)
                </option>
                <option value={`${activeCenter.code}-EXPORT`}>
                  Dự án OEM Export Line ({activeCenter.code})
                </option>
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
                title={`Quản lý vận hành (${activeCenter.code})`}
                className="w-9 h-9 rounded-full bg-slate-200 border-2 border-white shadow-sm flex items-center justify-center font-bold text-xs text-slate-700 shrink-0"
              >
                QL
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Center Switcher Bar */}
        <div className="py-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-500 mr-1">
              <Layers className="w-3.5 h-3.5 text-slate-500" />
              <span>Trung tâm vận hành:</span>
            </span>
            {centers.map((center) => {
              const isActive = center.id === activeCenter.id;
              const openIssueCount = center.issues.filter((i) => i.progress < 100).length;
              return (
                <button
                  key={center.id}
                  type="button"
                  onClick={() => onSelectCenter(center.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                    isActive
                      ? ACCENT_TAB_ACTIVE[center.accentColor]
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isActive ? 'bg-white' : ACCENT_DOT[center.accentColor]
                    }`}
                  />
                  <span>Trung tâm {center.code}</span>
                  <span
                    className={`text-[10px] font-semibold px-1.5 py-0.2 rounded tabular-nums ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-200/80 text-slate-600'
                    }`}
                  >
                    {center.lines.length} Line
                  </span>
                  {openIssueCount > 0 && (
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.2 rounded tabular-nums ${
                        isActive
                          ? 'bg-amber-400 text-slate-900'
                          : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {openIssueCount} SC
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={onOpenCenterManager}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer shrink-0 ${
              isAdminMode
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-300'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>Thêm / Bớt Trung Tâm (Admin)</span>
          </button>
        </div>

        {/* Screen Navigation Tabs */}
        <div className="py-2 border-t border-slate-100 flex items-center justify-between gap-3 flex-wrap">
          <nav aria-label="Chuyển đổi màn hình" className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => onSelectScreen('overview')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                activeScreen === 'overview'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Màn hình chính: Sơ Đồ Dây Chuyền &amp; Sự Cố</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded tabular-nums ${
                  activeScreen === 'overview'
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {activeCenter.lines.length} Line · {openLineIssuesCount} SC
              </span>
            </button>

            <button
              type="button"
              onClick={() => onSelectScreen('supply-chain')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                activeScreen === 'supply-chain'
                  ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
              }`}
            >
              <Workflow className="w-3.5 h-3.5" />
              <span>Quy Trình Tiến Độ Chuỗi Cung Ứng &amp; Lắp Ráp</span>
              <span
                className={`text-[10px] font-semibold px-1.5 py-0.2 rounded tabular-nums ${
                  activeScreen === 'supply-chain'
                    ? 'bg-white/20 text-white'
                    : 'bg-blue-50 text-blue-700'
                }`}
              >
                {activeCenter.pipelineItems.length} Hạng mục
              </span>
              {supplyChainIssuesCount > 0 && (
                <span
                  className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded tabular-nums ${
                    activeScreen === 'supply-chain'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-rose-100 text-rose-700'
                  }`}
                >
                  {supplyChainIssuesCount} Sự cố
                </span>
              )}
            </button>
          </nav>

          <span className="hidden md:inline-flex items-center text-[11px] font-medium text-slate-500">
            {activeScreen === 'overview'
              ? `Đang xem sơ đồ Line & sự cố tại Trung tâm ${activeCenter.code}`
              : `Đang xem quy trình chuỗi cung ứng & lắp ráp tại Trung tâm ${activeCenter.code}`}
          </span>
        </div>
      </div>
    </header>
  );
}
