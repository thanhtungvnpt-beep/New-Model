import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Download,
  FileSpreadsheet,
  Lightbulb,
  PlusCircle,
  Search,
  Sparkles,
  Trash2,
  TrendingUp,
  Upload,
  UserCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { formatLineTimestamp, getShortFactoryLabel, getLineFactory } from '../../data/initialData';
import {
  LineImprovementAttachment,
  LineImprovementPost,
  LineProcessTaskStatus,
  ProductionCenter,
  ProductionLine,
} from '../../types/production';

interface LineImprovementModalProps {
  isOpen: boolean;
  activeCenter: ProductionCenter;
  lines: ProductionLine[];
  initialLineId: string | null;
  onClose: () => void;
  onSaveLineImprovement: (
    lineId: string,
    posts: LineImprovementPost[],
    summaryStatus: LineProcessTaskStatus,
    latestNote?: string
  ) => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function deriveSummaryStatus(posts: LineImprovementPost[]): LineProcessTaskStatus {
  if (posts.length === 0) return 'Chưa phát sinh';
  return posts.some((p) => p.status === 'Đang thực hiện') ? 'Đang thực hiện' : 'Hoàn tất';
}

function downloadFallbackSummary(line: ProductionLine, post: LineImprovementPost) {
  const lines = [
    `BÁO CÁO CẢI TIẾN (KAIZEN) - ${line.name} (${post.pptAttachment?.fileName || post.id})`,
    `====================================================================`,
    `Tiêu đề        : ${post.title}`,
    `Line Leader    : ${post.author}`,
    `Thời gian đăng : ${post.createdAt}`,
    `Trạng thái     : ${post.status}`,
    ``,
    `1. TRƯỚC CẢI TIẾN (BEFORE):`,
    post.beforeText,
    ``,
    `2. SAU CẢI TIẾN (AFTER):`,
    post.afterText,
    ``,
    `3. HIỆU QUẢ (EFFECTIVENESS):`,
    post.effectiveness,
  ];
  const blob = new Blob(['\uFEFF' + lines.join('\r\n')], {
    type: 'text/plain;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const baseName = (post.pptAttachment?.fileName || post.title)
    .replace(/\.(pptx?|pdf)$/i, '')
    .replace(/[^a-zA-Z0-9_-]+/g, '_');
  link.href = url;
  link.download = `${baseName}_TomTat_Kaizen.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function LineImprovementModal({
  isOpen,
  activeCenter,
  lines,
  initialLineId,
  onClose,
  onSaveLineImprovement,
}: LineImprovementModalProps) {
  const [selectedLineId, setSelectedLineId] = useState<string>(initialLineId || lines[0]?.id || '');
  const [activeTab, setActiveTab] = useState<'history' | 'post'>('history');
  const [historyFilter, setHistoryFilter] = useState<'all' | 'Đang thực hiện' | 'Hoàn tất'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form state for Line Leader posting improvement
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<'Đang thực hiện' | 'Hoàn tất'>('Đang thực hiện');
  const [beforeText, setBeforeText] = useState('');
  const [afterText, setAfterText] = useState('');
  const [effectiveness, setEffectiveness] = useState('');
  const [attachment, setAttachment] = useState<LineImprovementAttachment | undefined>(undefined);
  const [fileError, setFileError] = useState('');
  const [formError, setFormError] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeLine = lines.find((l) => l.id === selectedLineId) || lines[0];

  const resetFormForLine = (line: ProductionLine | undefined) => {
    setTitle('');
    setAuthor(line?.leader || '');
    setStatus('Đang thực hiện');
    setBeforeText('');
    setAfterText('');
    setEffectiveness('');
    setAttachment(undefined);
    setFileError('');
    setFormError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  useEffect(() => {
    if (!isOpen) return;
    const target = lines.find((l) => l.id === (initialLineId || selectedLineId)) || lines[0];
    if (target) {
      setSelectedLineId(target.id);
      const existingPosts = target.improvement?.posts ?? [];
      setActiveTab(existingPosts.length > 0 ? 'history' : 'post');
      setHistoryFilter('all');
      setSearchQuery('');
      resetFormForLine(target);
    }
  }, [isOpen, initialLineId]);

  if (!isOpen || !activeLine) return null;

  const posts: LineImprovementPost[] = activeLine.improvement?.posts ?? [];
  const inProgressCount = posts.filter((p) => p.status === 'Đang thực hiện').length;
  const doneCount = posts.filter((p) => p.status === 'Hoàn tất').length;
  const pptCount = posts.filter((p) => Boolean(p.pptAttachment)).length;

  const filteredPosts = posts.filter((p) => {
    if (historyFilter !== 'all' && p.status !== historyFilter) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      p.title.toLowerCase().includes(q) ||
      p.beforeText.toLowerCase().includes(q) ||
      p.afterText.toLowerCase().includes(q) ||
      p.effectiveness.toLowerCase().includes(q) ||
      p.author.toLowerCase().includes(q) ||
      (p.pptAttachment?.fileName.toLowerCase().includes(q) ?? false)
    );
  });

  const handleSelectLine = (lineId: string) => {
    const target = lines.find((l) => l.id === lineId);
    if (!target) return;
    setSelectedLineId(target.id);
    const targetPosts = target.improvement?.posts ?? [];
    setActiveTab(targetPosts.length > 0 ? 'history' : 'post');
    setHistoryFilter('all');
    setSearchQuery('');
    resetFormForLine(target);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const isAllowed = /\.(ppt|pptx|pdf)$/i.test(file.name);
    if (!isAllowed) {
      setFileError('Vui lòng chọn tệp PowerPoint (.ppt, .pptx) hoặc tài liệu trình bày (.pdf).');
      return;
    }
    setFileError('');
    const objectUrl = URL.createObjectURL(file);
    setAttachment({
      fileName: file.name,
      fileSizeBytes: file.size,
      fileType: file.type,
      objectUrl,
      uploadedAt: formatLineTimestamp(),
    });
  };

  const handleSubmitPost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !beforeText.trim() || !afterText.trim() || !effectiveness.trim()) {
      setFormError('Vui lòng nhập đầy đủ Tiêu đề, Trước, Sau và Hiệu quả cải tiến.');
      return;
    }

    const nowTs = formatLineTimestamp();
    const newPost: LineImprovementPost = {
      id: `imp-${activeLine.id}-${Date.now()}`,
      title: title.trim(),
      beforeText: beforeText.trim(),
      afterText: afterText.trim(),
      effectiveness: effectiveness.trim(),
      author: author.trim() || activeLine.leader,
      status,
      createdAt: nowTs,
      pptAttachment: attachment,
    };

    const nextPosts = [newPost, ...posts];
    onSaveLineImprovement(
      activeLine.id,
      nextPosts,
      deriveSummaryStatus(nextPosts),
      newPost.title
    );
    resetFormForLine(activeLine);
    setActiveTab('history');
    setHistoryFilter('all');
  };

  const handleTogglePostStatus = (postId: string) => {
    const nextPosts = posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            status: (p.status === 'Hoàn tất' ? 'Đang thực hiện' : 'Hoàn tất') as
              | 'Đang thực hiện'
              | 'Hoàn tất',
          }
        : p
    );
    onSaveLineImprovement(
      activeLine.id,
      nextPosts,
      deriveSummaryStatus(nextPosts),
      nextPosts[0]?.title
    );
  };

  const handleDeletePost = (postId: string) => {
    const nextPosts = posts.filter((p) => p.id !== postId);
    onSaveLineImprovement(
      activeLine.id,
      nextPosts,
      deriveSummaryStatus(nextPosts),
      nextPosts[0]?.title
    );
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6">
      <div className="relative bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-indigo-700 via-blue-700 to-indigo-800 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20 shrink-0">
              <Lightbulb className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-white">
                  Cổng Cải Tiến (Kaizen) — {activeLine.name}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/25">
                  {activeCenter.code} · {getShortFactoryLabel(getLineFactory(activeLine))}
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-950/50 text-indigo-100 border border-white/20 inline-flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  <span>Leader: {activeLine.leader}</span>
                </span>
              </div>
              <p className="text-xs text-indigo-100 mt-0.5">
                Line Leader đăng bài cải tiến (Trước · Sau · Hiệu quả · File PowerPoint) &amp; tra cứu toàn bộ lịch sử cải tiến
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Line Switcher Strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto">
          {lines.map((line) => {
            const isActive = line.id === activeLine.id;
            const count = line.improvement?.posts?.length ?? line.improvement?.count ?? 0;
            return (
              <button
                key={line.id}
                type="button"
                onClick={() => handleSelectLine(line.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                }`}
              >
                <Wrench className="w-3 h-3" />
                <span>{line.name}</span>
                <span
                  className={`px-1.5 py-0.2 rounded text-[10px] tabular-nums ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : count > 0
                      ? 'bg-indigo-100 text-indigo-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Summary Stats & Mode Tabs */}
        <div className="px-6 py-3 bg-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-bold tabular-nums">
              Tổng bài: {posts.length}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-200 font-bold tabular-nums">
              Đang thực hiện: {inProgressCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold tabular-nums">
              Hoàn tất: {doneCount}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 font-bold tabular-nums">
              File PowerPoint: {pptCount}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Lịch sử cải tiến ({posts.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('post')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeTab === 'post'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-indigo-50 text-indigo-700 border border-indigo-300 hover:bg-indigo-600 hover:text-white'
              }`}
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Post Cải Tiến Mới</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4 text-xs bg-slate-50/50">
          {activeTab === 'post' ? (
            <form
              onSubmit={handleSubmitPost}
              className="bg-white rounded-2xl border border-indigo-200 p-5 space-y-4 shadow-xs"
            >
              <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100 flex-wrap">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600" />
                  <h4 className="text-sm font-bold text-slate-900">
                    Đăng Bài Cải Tiến Mới — {activeLine.name}
                  </h4>
                </div>
                <span className="text-[11px] text-slate-500">
                  Dành cho Line Leader ghi nhận Trước · Sau · Hiệu quả &amp; đính kèm PowerPoint
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <label className="sm:col-span-2 block">
                  <span className="font-bold text-slate-700 block mb-1">
                    Tiêu đề cải tiến <span className="text-rose-600">*</span>
                  </span>
                  <input
                    required
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="VD: Cải tiến đồ gá kẹp nhanh giảm thời gian chuyển đổi..."
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">
                    Line Leader đăng bài <span className="text-rose-600">*</span>
                  </span>
                  <input
                    required
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    placeholder="Tên Line Leader"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 font-medium text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </label>

                <label className="block">
                  <span className="font-bold text-slate-700 block mb-1">Trạng thái</span>
                  <select
                    value={status}
                    onChange={(e) =>
                      setStatus(e.target.value as 'Đang thực hiện' | 'Hoàn tất')
                    }
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 bg-white font-semibold text-slate-800"
                  >
                    <option value="Đang thực hiện">Đang thực hiện</option>
                    <option value="Hoàn tất">Hoàn tất</option>
                  </select>
                </label>
              </div>

              {/* Before & After Comparison Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <label className="block rounded-xl border border-rose-200 bg-rose-50/40 p-3.5">
                  <span className="font-extrabold text-rose-800 block mb-1.5 uppercase text-[11px]">
                    1. Trước cải tiến (Before) <span className="text-rose-600">*</span>
                  </span>
                  <textarea
                    required
                    rows={4}
                    value={beforeText}
                    onChange={(e) => {
                      setBeforeText(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Mô tả hiện trạng bất cập trước khi cải tiến (thao tác chậm, lỗi, tốn thời gian, bất tiện)..."
                    className="w-full rounded-lg border border-rose-200 bg-white p-2.5 text-slate-800 focus:ring-2 focus:ring-rose-400 focus:outline-none"
                  />
                </label>

                <label className="block rounded-xl border border-indigo-200 bg-indigo-50/40 p-3.5">
                  <span className="font-extrabold text-indigo-800 block mb-1.5 uppercase text-[11px]">
                    2. Sau cải tiến (After) <span className="text-indigo-600">*</span>
                  </span>
                  <textarea
                    required
                    rows={4}
                    value={afterText}
                    onChange={(e) => {
                      setAfterText(e.target.value);
                      if (formError) setFormError('');
                    }}
                    placeholder="Mô tả giải pháp đã áp dụng sau cải tiến (thay đổi JIG, công cụ, quy trình thao tác mới)..."
                    className="w-full rounded-lg border border-indigo-200 bg-white p-2.5 text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </label>
              </div>

              {/* Effectiveness Input */}
              <label className="block rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5">
                <span className="font-extrabold text-emerald-800 inline-flex items-center gap-1.5 mb-1.5 uppercase text-[11px]">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>
                    3. Hiệu quả mang lại (Effectiveness) <span className="text-rose-600">*</span>
                  </span>
                </span>
                <textarea
                  required
                  rows={2}
                  value={effectiveness}
                  onChange={(e) => {
                    setEffectiveness(e.target.value);
                    if (formError) setFormError('');
                  }}
                  placeholder="VD: Giảm 12% cycle time, tăng +20 sản phẩm/ca, loại bỏ lỗi kẹt JIG..."
                  className="w-full rounded-lg border border-emerald-200 bg-white p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </label>

              {/* PowerPoint Upload */}
              <div className="rounded-xl border-2 border-dashed border-amber-300 bg-amber-50/40 p-4 space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 inline-flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-amber-600" />
                      <span>4. Đính kèm báo cáo PowerPoint (.ppt / .pptx)</span>
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Tải lên slide báo cáo Trước - Sau để lưu trữ và xem/tải lại trong lịch sử cải tiến
                    </p>
                  </div>
                  <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold shadow-xs cursor-pointer shrink-0 transition">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{attachment ? 'Đổi file PowerPoint' : 'Upload PowerPoint'}</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".ppt,.pptx,.pdf,application/vnd.ms-powerpoint,application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>

                {attachment && (
                  <div className="flex items-center justify-between gap-3 bg-white border border-amber-200 rounded-lg px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-mono text-[10px] font-extrabold uppercase shrink-0">
                        PPT
                      </span>
                      <span className="font-bold text-slate-800 truncate">
                        {attachment.fileName}
                      </span>
                      <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                        ({formatFileSize(attachment.fileSizeBytes)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setAttachment(undefined);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="text-rose-600 hover:text-rose-800 font-semibold text-[11px] cursor-pointer shrink-0"
                    >
                      Gỡ file
                    </button>
                  </div>
                )}

                {fileError && <p className="text-[11px] font-bold text-rose-600">{fileError}</p>}
              </div>

              {formError && (
                <div className="rounded-lg border border-rose-300 bg-rose-50 px-3 py-2 font-bold text-rose-700">
                  {formError}
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 font-semibold hover:bg-slate-100 cursor-pointer"
                >
                  Xem lịch sử
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-sm inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Đăng Cải Tiến Lên {activeLine.name}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {/* Filter & Search Bar */}
              <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {(['all', 'Đang thực hiện', 'Hoàn tất'] as const).map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setHistoryFilter(st)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold border transition cursor-pointer ${
                        historyFilter === st
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st === 'all' ? `Tất cả (${posts.length})` : st}
                    </button>
                  ))}
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm tiêu đề, hiệu quả, PowerPoint..."
                    className="w-full rounded-lg border border-slate-300 pl-8 pr-3 py-1.5 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {filteredPosts.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 py-10 px-4 text-center space-y-2.5">
                  <Lightbulb className="w-8 h-8 text-indigo-400 mx-auto" />
                  <p className="text-sm font-bold text-slate-700">
                    {posts.length === 0
                      ? `Chưa có bài cải tiến nào trên ${activeLine.name}`
                      : 'Không tìm thấy bài cải tiến phù hợp với bộ lọc'}
                  </p>
                  <p className="text-xs text-slate-500">
                    Line Leader có thể nhấn nút &ldquo;Post Cải Tiến Mới&rdquo; để đăng Trước · Sau · Hiệu quả và đính kèm slide PowerPoint.
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveTab('post')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-xs cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    <span>Post Cải Tiến Đầu Tiên</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredPosts.map((post, idx) => (
                    <div
                      key={post.id}
                      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 pb-2.5 border-b border-slate-100">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono text-[10px] font-extrabold">
                              #{filteredPosts.length - idx}
                            </span>
                            <h5 className="text-sm font-bold text-slate-900">{post.title}</h5>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                post.status === 'Hoàn tất'
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                              }`}
                            >
                              {post.status}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500">
                            <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                              <UserCheck className="w-3 h-3 text-blue-600" />
                              <span>Line Leader: {post.author}</span>
                            </span>
                            <span className="inline-flex items-center gap-1 tabular-nums">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>{post.createdAt}</span>
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleTogglePostStatus(post.id)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition cursor-pointer inline-flex items-center gap-1 ${
                              post.status === 'Hoàn tất'
                                ? 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                : 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-600 hover:text-white'
                            }`}
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            <span>
                              {post.status === 'Hoàn tất' ? 'Mở lại' : 'Đánh dấu Hoàn tất'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeletePost(post.id)}
                            title="Xóa bài cải tiến này"
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-400 hover:text-rose-600 hover:border-rose-300 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Before -> After */}
                      <div className="grid grid-cols-1 md:grid-cols-11 gap-2.5 items-stretch">
                        <div className="md:col-span-5 rounded-xl border border-rose-200 bg-rose-50/45 p-3">
                          <span className="text-[10px] font-extrabold uppercase text-rose-700 block mb-1">
                            Trước cải tiến (Before)
                          </span>
                          <p className="text-xs text-slate-700 leading-relaxed">{post.beforeText}</p>
                        </div>
                        <div className="hidden md:flex md:col-span-1 items-center justify-center text-indigo-400">
                          <ArrowRight className="w-5 h-5" />
                        </div>
                        <div className="md:col-span-5 rounded-xl border border-indigo-200 bg-indigo-50/45 p-3">
                          <span className="text-[10px] font-extrabold uppercase text-indigo-700 block mb-1">
                            Sau cải tiến (After)
                          </span>
                          <p className="text-xs text-slate-800 leading-relaxed font-medium">
                            {post.afterText}
                          </p>
                        </div>
                      </div>

                      {/* Effectiveness */}
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 px-3.5 py-2.5 flex items-start gap-2">
                        <TrendingUp className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                        <div>
                          <span className="text-[10px] font-extrabold uppercase text-emerald-800 block">
                            Hiệu quả đạt được
                          </span>
                          <p className="text-xs font-bold text-emerald-950">{post.effectiveness}</p>
                        </div>
                      </div>

                      {/* PowerPoint Attachment */}
                      {post.pptAttachment && (
                        <div className="rounded-xl border border-amber-200 bg-amber-50/50 px-3.5 py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="px-2 py-0.5 rounded bg-amber-500 text-white font-mono text-[10px] font-extrabold shrink-0">
                              PPTX
                            </span>
                            <span className="font-bold text-slate-800 truncate">
                              {post.pptAttachment.fileName}
                            </span>
                            <span className="text-[11px] text-slate-500 tabular-nums shrink-0">
                              {formatFileSize(post.pptAttachment.fileSizeBytes)} · {post.pptAttachment.uploadedAt}
                            </span>
                          </div>
                          {post.pptAttachment.objectUrl ? (
                            <a
                              href={post.pptAttachment.objectUrl}
                              download={post.pptAttachment.fileName}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-500 text-amber-800 hover:text-white border border-amber-300 text-[11px] font-bold transition shrink-0"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải PowerPoint</span>
                            </a>
                          ) : (
                            <button
                              type="button"
                              onClick={() => downloadFallbackSummary(activeLine, post)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-amber-500 text-amber-800 hover:text-white border border-amber-300 text-[11px] font-bold transition shrink-0 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Tải hồ sơ Kaizen</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>
            Mọi bài cải tiến được đồng bộ trực tiếp lên thẻ {activeLine.name} &amp; lưu giữ khi điều chuyển nhà máy
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-white border border-slate-300 font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
