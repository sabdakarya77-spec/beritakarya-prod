'use client';

const INITIAL_TIMESTAMP = Date.now();

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { useToastStore } from '../../../../store/toastStore';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertCircle, CheckCircle, XCircle, Clock, ChevronRight,
  FileText, User as UserIcon, Calendar, MessageSquare, Eye,
  Loader2, RefreshCw, Zap
} from 'lucide-react';
import StatusBadge from '../../../../components/ui/StatusBadge';
import { cn } from '../../../../lib/utils';

interface Article {
  id: string;
  title: string;
  status: string;
  category?: { name: string };
  author?: { name: string; role?: string };
  createdAt: string;
  updatedAt: string;
  wordCount?: number;
  readingTimeMin?: number;
  reviewNotes?: string;
  blocks?: any[];
  isBreaking?: boolean;
}

const EMPTY_STATES: Record<string, { icon: React.ElementType; msg: string }> = {
  submitted: { icon: CheckCircle, msg: 'Tidak ada post yang dikirim untuk review' },
  review:    { icon: AlertCircle, msg: 'Tidak ada post dalam proses review' },
  revision:  { icon: XCircle, msg: 'Tidak ada post yang perlu direvisi' },
  approved:  { icon: CheckCircle, msg: 'Tidak ada post yang sudah disetujui' },
};

type ReviewTab = 'submitted' | 'review' | 'revision' | 'approved';

const getReviewTabFromQuery = (value: string | null): ReviewTab => {
  if (value === 'review' || value === 'revision' || value === 'approved') {
    return value;
  }
  return 'submitted';
};

export default function ReviewQueuePage() {
  const router = useRouter();
  const { site } = useParams() as { site: string };
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const { addToast } = useToastStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<ReviewTab>(getReviewTabFromQuery(searchParams.get('tab')));
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [reviewModal, setReviewModal] = useState<Article | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');

   const load = async () => {
     setLoading(true);
     try {
       // Fetch articles (required)
       const artRes = await api.get('/articles', {
         params: {
           site,
           limit: 50,
           status: activeTab
         }
       });
       setArticles(artRes.data.data.articles || artRes.data.data.items || []);

       // Fetch stats (optional - graceful fallback if endpoint doesn't exist)
       try {
         const statsRes = await api.get('/articles/stats', { params: { site } });
         setStats(statsRes.data.data || {});
       } catch (_statsErr) {
         console.warn('[review] Stats endpoint not available, using defaults');
         setStats({});
       }
     } catch (e) {
       console.error(e);
     } finally {
       setLoading(false);
     }
   };

  useEffect(() => { load(); }, [site, activeTab]);

  // Sinkronisasi state dari URL — hanya depend pada searchParams, bukan activeTab
  // (activeTab adalah OUTPUT efek ini; memasukkannya ke deps menyebabkan flicker saat klik tab)
  useEffect(() => {
    setActiveTab(getReviewTabFromQuery(searchParams.get('tab')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const getQueueHours = (article: Article) => {
    const queueDate = new Date(article.updatedAt || article.createdAt).getTime();
    return Math.max(1, Math.floor((INITIAL_TIMESTAMP - queueDate) / (1000 * 60 * 60)));
  };

  const getQueueAgeLabel = (article: Article) => {
    const hours = getQueueHours(article);
    if (hours >= 48) return `${Math.floor(hours / 24)} hari antre`;
    if (hours >= 24) return '24+ jam antre';
    return `${hours} jam antre`;
  };

  const isLongQueue = (article: Article) => getQueueHours(article) >= 24;

  const tabArticles = [...articles].sort((a, b) => {
    if (Number(b.isBreaking) !== Number(a.isBreaking)) {
      return Number(b.isBreaking) - Number(a.isBreaking);
    }
    return getQueueHours(b) - getQueueHours(a);
  });

  const breakingCount = tabArticles.filter(article => article.isBreaking).length;
  const longQueueCount = tabArticles.filter(isLongQueue).length;

  const tabs = [
    { key: 'submitted', label: 'Menunggu Review', color: 'text-blue-500' },
    { key: 'review',    label: 'Sedang Direview', color: 'text-violet-500' },
    { key: 'revision',  label: 'Perlu Revisi',    color: 'text-orange-500' },
    { key: 'approved',  label: 'Disetujui',        color: 'text-emerald-500' },
  ] as const;

  const activeTabGuidance: Record<ReviewTab, string> = {
    submitted: 'Mulai dari post breaking, lalu lanjutkan ke artikel dengan antrean terlama.',
    review: 'Pastikan artikel yang sedang direview tidak tertahan tanpa keputusan berikutnya.',
    revision: 'Pantau artikel revisi untuk melihat apakah umpan balik editor sudah cukup jelas.',
    approved: 'Dorong artikel approved ke tahap terbit agar ritme publikasi tetap terjaga.',
  };

  const primaryActionHint: Record<ReviewTab, string> = {
    submitted: 'Keputusan utama: setujui jika naskah sudah layak terbit, atau kembalikan untuk revisi bila masih perlu perbaikan.',
    review: 'Keputusan utama: selesaikan review hari ini agar artikel tidak tertahan di meja editor.',
    revision: 'Aksi utama: buka detail artikel dan cek apakah catatan revisi sudah cukup jelas untuk penulis.',
    approved: 'Aksi utama: terbitkan artikel yang sudah lolos review agar ritme publikasi tetap berjalan.',
  };

  const handleAction = async (articleId: string, action: 'approve' | 'reject' | 'request_revision' | 'publish') => {
    setActionLoading(articleId + action);
    try {
      if (action === 'publish') {
        await api.post(`/articles/${articleId}/publish`, undefined, { params: { site } });
      } else {
        const newStatus = action === 'approve' ? 'approved' : action === 'reject' ? 'archived' : 'revision';
        await api.put(`/articles/${articleId}`, {
          status: newStatus,
          reviewNotes: reviewNotes || undefined,
          reviewedBy: user?.id,
        }, { params: { site } });
      }
      setReviewModal(null);
      setReviewNotes('');
      await load();
      addToast(`Berhasil memproses artikel`, 'success');
    } catch (e: any) {
      addToast(e.response?.data?.error?.message || 'Gagal memproses post', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const wordCount = (a: Article) => a.wordCount || (Array.isArray(a.blocks) ? a.blocks.length * 80 : 0);
  const getCardActionHint = (article: Article) => {
    if (activeTab === 'approved') {
      return 'Prioritaskan terbitkan artikel ini jika seluruh unsur publikasi sudah siap.';
    }
    if (activeTab === 'revision') {
      return article.reviewNotes
        ? 'Buka detail untuk memastikan catatan revisi sudah jelas dan bisa ditindaklanjuti penulis.'
        : 'Buka detail artikel untuk menambahkan atau meninjau arahan revisi editor.';
    }
    if (article.isBreaking) {
      return 'Prioritas tertinggi: ambil keputusan cepat karena artikel ini bertanda breaking.';
    }
    if (isLongQueue(article)) {
      return 'Prioritas tinggi: artikel ini sudah terlalu lama berada di antrean review.';
    }
    return 'Keputusan utama: setujui jika siap, atau kembalikan dengan revisi bila masih perlu perbaikan.';
  };

  const getPrimaryActionLabel = () => {
    switch (activeTab) {
      case 'approved':
        return 'Terbitkan';
      case 'revision':
        return 'Buka Detail';
      default:
        return 'Setujui';
    }
  };

  if (!user || !['superadmin', 'wapimred'].includes(user.role)) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-3">
          <AlertCircle size={40} className="text-red-400 mx-auto" />
          <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Akses Terbatas</p>
          <p className="text-xs text-gray-300">Halaman ini hanya untuk Wapimred dan Superadmin.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle size={14} className="text-violet-500" />
            <span className="text-[10px] font-black text-violet-500 uppercase tracking-widest">Meja Editor</span>
          </div>
          <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Antrian Review</h1>
          <p className="text-xs text-gray-400 mt-1">
            Kelola alur persetujuan post dari reporter dan kontributor ke publikasi.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-white/5 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
        >
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Workflow Flow */}
      <div className="dash-card p-4">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {[
            { label: 'Draft', color: 'bg-amber-100 text-amber-700', count: stats.draft || 0 },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Dikirim', color: 'bg-blue-100 text-blue-700', count: stats.submitted || 0 },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Review', color: 'bg-violet-100 text-violet-700', count: stats.review || 0 },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Revisi', color: 'bg-orange-100 text-orange-700', count: stats.revision || 0 },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Disetujui', color: 'bg-emerald-100 text-emerald-700', count: stats.approved || 0 },
            { label: '→', color: 'text-gray-300', count: null },
            { label: 'Terbit', color: 'bg-green-100 text-green-700', count: stats.published || 0 },
          ].map((step, i) => (
            step.label === '→'
              ? <ChevronRight key={i} size={16} className="text-gray-300 flex-shrink-0" />
              : (
                <div key={i} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-full flex-shrink-0', step.color)}>
                  <span className="text-[10px] font-black uppercase tracking-widest">{step.label}</span>
                  {step.count !== null && (
                    <span className="text-[10px] font-black opacity-70">({step.count})</span>
                  )}
                </div>
              )
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100 dark:border-white/5">
        <div className="flex gap-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => {
            const count = stats[tab.key] || 0;
            return (
              <button
                key={tab.key}
                onClick={() => {
                  setActiveTab(tab.key);
                  router.replace(`/${site}/dashboard/review?tab=${tab.key}`);
                }}
                className={cn(
                  'flex items-center gap-2 pb-3 text-xs font-black uppercase tracking-widest border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.key
                    ? `border-brand-red ${tab.color}`
                    : 'border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                )}
              >
                {tab.label}
                {count > 0 && (
                  <span className={cn(
                    'text-[10px] font-black px-1.5 py-0.5 rounded-full',
                    activeTab === tab.key ? 'bg-brand-red text-white' : 'bg-gray-100 dark:bg-white/5 text-gray-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="dash-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">
            Fokus Tab
          </span>
          <span className="rounded-full bg-brand-red/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-wide text-brand-red">
            {tabs.find((tab) => tab.key === activeTab)?.label}
          </span>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {activeTabGuidance[activeTab]}
          </p>
        </div>
      </div>

      {/* Article List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-brand-red" />
        </div>
      ) : tabArticles.length === 0 ? (
        <div className="dash-card p-16 flex flex-col items-center gap-4 text-gray-300 dark:text-white/10">
          {(() => { const E = EMPTY_STATES[activeTab]; return <E.icon size={44} strokeWidth={1} />; })()}
          <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{EMPTY_STATES[activeTab].msg}</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="dash-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sinyal Prioritas</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-900/20 text-[10px] font-black text-red-600 dark:text-red-400">
                <Zap size={11} /> {breakingCount} breaking
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-900/20 text-[10px] font-black text-amber-600 dark:text-amber-400">
                <Clock size={11} /> {longQueueCount} antre lama
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-[10px] font-black text-gray-500 dark:text-gray-300">
                <FileText size={11} /> Urutan otomatis: breaking lalu antre terlama
              </span>
            </div>
            <p className="mt-3 text-sm text-gray-600 dark:text-gray-300">
              {primaryActionHint[activeTab]}
            </p>
          </div>

          <AnimatePresence>
            {tabArticles.map((article, i) => (
              <motion.div
                key={article.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ delay: i * 0.05 }}
                className="dash-card p-5"
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <StatusBadge status={article.status} />
                      {article.isBreaking && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-red-600 px-2 py-0.5 bg-red-50 dark:bg-red-900/20 rounded-full">
                          <Zap size={10} /> Breaking
                        </span>
                      )}
                      {isLongQueue(article) && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 rounded-full">
                          <Clock size={10} /> Antre Lama
                        </span>
                      )}
                      {article.category?.name && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-red px-2 py-0.5 bg-brand-red/5 rounded">
                          {article.category.name}
                        </span>
                      )}
                      {wordCount(article) > 0 && (
                        <span className="text-[10px] text-gray-400 font-medium">
                          ≈ {wordCount(article).toLocaleString()} kata
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-brand-black dark:text-white leading-snug mb-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-4 text-[10px] text-gray-400 flex-wrap">
                      <span className="flex items-center gap-1">
                        <UserIcon size={11} /> {article.author?.name || 'Redaksi'}
                      </span>
                      {article.author?.role && (
                        <span className="px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-[10px] font-black uppercase tracking-wide text-gray-500 dark:text-gray-300">
                          {article.author.role}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {new Date(article.updatedAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} />
                        {getQueueAgeLabel(article)}
                      </span>
                      {article.readingTimeMin && (
                        <span className="flex items-center gap-1">
                          <FileText size={11} />
                          {article.readingTimeMin} menit baca
                        </span>
                      )}
                    </div>
                    {article.reviewNotes && (
                      <div className="mt-3 p-3 bg-orange-50 dark:bg-orange-900/10 border border-orange-100 dark:border-orange-500/10 rounded-lg">
                        <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">Catatan Editor:</p>
                        <p className="text-xs text-orange-700 dark:text-orange-300">{article.reviewNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="w-full md:w-[280px] shrink-0">
                    <div className="rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50/80 dark:bg-white/[0.03] p-3">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        Aksi Utama
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                        {getCardActionHint(article)}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(activeTab === 'submitted' || activeTab === 'review') && (
                          <>
                            <button
                              onClick={() => { setReviewModal(article); setReviewNotes(''); }}
                              disabled={!!actionLoading}
                              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-emerald-700 transition-all disabled:opacity-50 shadow-sm"
                            >
                              <CheckCircle size={12} /> {getPrimaryActionLabel()}
                            </button>
                            <button
                              onClick={() => handleAction(article.id, 'request_revision')}
                              disabled={!!actionLoading}
                              className="flex-1 min-w-[120px] flex items-center justify-center gap-1.5 px-3 py-2 bg-orange-50 dark:bg-orange-900/20 text-orange-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-orange-100 transition-all disabled:opacity-50"
                            >
                              {actionLoading === article.id + 'request_revision'
                                ? <Loader2 size={12} className="animate-spin" />
                                : <MessageSquare size={12} />
                              }
                              Revisi
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Apakah Anda yakin ingin menolak post ini? Post akan diarsipkan.')) {
                                  handleAction(article.id, 'reject');
                                }
                              }}
                              disabled={!!actionLoading}
                              className="flex items-center justify-center gap-1.5 px-3 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-100 transition-all disabled:opacity-50"
                            >
                              {actionLoading === article.id + 'reject'
                                ? <Loader2 size={12} className="animate-spin" />
                                : <XCircle size={12} />
                              }
                              Tolak
                            </button>
                          </>
                        )}
                        {activeTab === 'approved' && (
                          <button
                            onClick={() => handleAction(article.id, 'publish')}
                            disabled={!!actionLoading}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all disabled:opacity-50 shadow-sm"
                          >
                            {actionLoading === article.id + 'publish' ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={12} />}
                            {getPrimaryActionLabel()}
                          </button>
                        )}
                        {activeTab === 'revision' && (
                          <Link
                            href={`/${site}/dashboard/articles/${article.id}`}
                            className="flex-1 min-w-[140px] flex items-center justify-center gap-1.5 px-3.5 py-2.5 bg-brand-black dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-lg hover:opacity-90 transition-all shadow-sm"
                          >
                            <Eye size={12} /> {getPrimaryActionLabel()}
                          </Link>
                        )}
                        {(activeTab === 'submitted' || activeTab === 'review' || activeTab === 'approved') && (
                          <Link
                            href={`/${site}/dashboard/articles/${article.id}`}
                            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-white dark:bg-slate-900/80 border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all text-gray-600 dark:text-gray-300"
                          >
                            <Eye size={12} /> Buka Detail
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Approve Modal */}
      <AnimatePresence>
        {reviewModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setReviewModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-white dark:bg-slate-900 rounded-xl p-6 w-full max-w-md shadow-2xl"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/20 rounded-lg flex items-center justify-center">
                  <CheckCircle size={18} className="text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Setujui Post</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">Post akan masuk ke status Disetujui</p>
                </div>
              </div>
              <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-4 line-clamp-2 border-l-2 border-emerald-500 pl-3">
                {reviewModal.title}
              </p>
              <div className="mb-5">
                <label htmlFor="review-notes" className="dash-label block mb-2">Catatan untuk reporter/kontributor (opsional)</label>
                <textarea
                  id="review-notes"
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  rows={3}
                  placeholder="Tambah catatan jika diperlukan..."
                  className="w-full px-3 py-2.5 text-xs rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-brand-black dark:text-white outline-none focus:border-emerald-400 resize-none transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewModal(null)}
                  className="flex-1 py-2.5 rounded-lg border border-gray-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  Batal
                </button>
                <button
                  onClick={() => handleAction(reviewModal.id, 'approve')}
                  disabled={!!actionLoading}
                  className="flex-1 py-2.5 rounded-lg bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-emerald-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  Setujui
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
