'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { motion } from 'framer-motion';
import { 
  Plus, Search, Eye, Edit3, Trash2, Calendar,
  FileText, Loader2, Send, ChevronLeft, ChevronRight,
  Globe
} from 'lucide-react';
import StatusBadge from '../../../../components/ui/StatusBadge';
import EditorialBadge from '../../../../components/ui/EditorialBadge';
import KanbanBoard from '../../../../components/dashboard/KanbanBoard';
import { cn } from '../../../../lib/utils';
import { LayoutGrid, List } from 'lucide-react';
import { STATUS_LABELS } from '@beritakarya/config';

interface Article {
  id: string;
  title: string;
  slug: string;
  status: string;
  category?: { name: string };
  author?: { name: string };
  createdAt: string;
  publishedAt?: string;
  viewCount?: number;
  wordCount?: number;
  isBreaking?: boolean;
  isExclusive?: boolean;
  isFeatured?: boolean;
}

const CAN_SUBMIT_ROLES = ['reporter', 'kontributor', 'wapimred', 'superadmin'];
const CAN_DELETE_ROLES = ['superadmin', 'wapimred', 'reporter', 'kontributor'];
const CAN_GOOGLE_INDEX_ROLES = ['superadmin'];
const getStatusFromQuery = (value: string | null) =>
  value && value in STATUS_LABELS ? value : '';
const getViewModeFromQuery = (value: string | null): 'list' | 'kanban' =>
  value === 'kanban' ? 'kanban' : 'list';

export default function ArticlesPage() {
  const router = useRouter();
  const { site } = useParams<{ site: string }>();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(getStatusFromQuery(searchParams.get('status')));
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>(getViewModeFromQuery(searchParams.get('view')));
  const [isCreating, setIsCreating] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [globalStats, setGlobalStats] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {
        site,
        search: searchQuery,
        page,
        limit: 10
      };
      if (filter) params.status = filter;

      // Fetch articles (required)
      const artRes = await api.get('/articles', { params });
      const items = artRes.data.data.articles || artRes.data.data.items || [];
      setArticles(items);
      setTotalPages(artRes.data.data.totalPages || 1);
      setTotalItems(artRes.data.data.total || 0);

      // Fetch stats (optional - graceful fallback if endpoint doesn't exist)
      try {
        const statsRes = await api.get('/articles/stats', { params: { site } });
        setGlobalStats(statsRes.data.data || {});
      } catch (statsErr) {
        console.warn('[articles] Stats endpoint not available, using defaults');
        setGlobalStats({});
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Debounce search agar tidak hit API setiap ketikan huruf
  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 500);
    return () => clearTimeout(timer);
  }, [site, filter, searchQuery, page]);

  // Reset page when filter/search changes
  useEffect(() => {
    setPage(1);
  }, [filter, searchQuery]);

  // Sinkronisasi state dari URL (hanya ketika searchParams benar-benar berubah dari navigasi eksternal)
  // PENTING: jangan tambahkan filter/searchQuery/viewMode ke deps — mereka adalah OUTPUT efek ini,
  // bukan input. Menambahkannya menyebabkan efek terpicu saat state berubah dari klik tab,
  // lalu membaca URL yang belum diperbarui dan me-revert state (flicker).
  useEffect(() => {
    setFilter(getStatusFromQuery(searchParams.get('status')));
    setSearchQuery(searchParams.get('search') || '');
    setViewMode(getViewModeFromQuery(searchParams.get('view')));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleNew = async () => {
    setIsCreating(true);
    try {
      // Redirect ke halaman post baru tanpa membuat draft di database
      // Draft akan dibuat hanya saat user benar-benar menyimpan (save/auto-save)
      router.push(`/${site}/dashboard/articles/new`);
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal membuat post baru');
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmitToReview = async (articleId: string) => {
    setActionLoading(articleId);
    try {
      await api.put(`/articles/${articleId}`, { status: 'submitted' });
      await load();
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal mengirim ke editor');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (article: Article) => {
    const perm = canDeleteArticleFor(article)
    if (!perm.allowed) {
      alert(perm.reason || 'Anda tidak memiliki izin untuk menghapus post ini.')
      return
    }

    // Konfirmasi bertahap: post published butuh alasan & peringatan ekstra
    const isPublished = article.status === 'published'
    if (!window.confirm(
      isPublished
        ? `PERINGATAN: Post "${article.title}" sudah TERBIT dan kemungkinan terindeks Google.\n\nHapus permanen? Tindakan ini tidak dapat dibatalkan.`
        : `Yakin ingin menghapus post "${article.title}"? Tindakan ini tidak dapat dibatalkan.`
    )) {
      return
    }

    // Untuk superadmin menghapus post published, minta alasan (audit trail)
    let reason: string | undefined
    if (isPublished && user?.role === 'superadmin') {
      const input = window.prompt('Alasan penghapusan (wajib, min. 5 karakter):')
      if (!input || input.trim().length < 5) {
        alert('Alasan penghapusan wajib diisi (minimal 5 karakter) untuk post terpublikasi.')
        return
      }
      reason = input.trim()
    }

    setActionLoading(article.id + 'del')
    try {
      await api.delete(`/articles/${article.id}`, {
        params: reason ? { reason } : undefined
      })
      await load()
    } catch (e: any) {
      alert(e.response?.data?.error?.message || 'Gagal menghapus post')
    } finally {
      setActionLoading(null)
    }
  };

  const handleGoogleIndex = async (articleId: string) => {
    setActionLoading(articleId + 'index');
    try {
      const { data } = await api.post(`/articles/${articleId}/index-google`);
      if (data.success) {
        alert('Sukses! Google Indexing API berhasil diping. Artikel akan segera dirayapi Googlebot!');
      } else {
        alert('Info: ' + (data.message || 'Respons dari API'));
      }
    } catch (e: any) {
      alert(e.response?.data?.error?.message || e.response?.data?.message || 'Gagal memanggil Google Indexing API. Pastikan kredensial di Pengaturan Situs sudah aktif & benar!');
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = articles; // Sekarang data sudah difilter di sisi Server

  // Count per status for tab badges using global stats from backend
  const countByStatus = (s: string) => {
    if (s === '') {
      return Object.values(globalStats).reduce((a, b) => a + b, 0);
    }
    return globalStats[s] || 0;
  };

  // Tabs to show based on role
  const visibleStatuses = (user?.role === 'reporter' || user?.role === 'kontributor')
    ? ['', 'draft', 'submitted', 'revision', 'published']
    : ['', 'draft', 'submitted', 'review', 'revision', 'approved', 'scheduled', 'published'];

  const canSubmitArticle = (article: Article) =>
    article.status === 'draft' && CAN_SUBMIT_ROLES.includes(user?.role || '');

  // Eye (Lihat): untuk published → URL publik; selain itu → halaman detail
  const canViewArticle = (article: Article) => article.status === 'published';

  // Globe (Google Index): hanya superadmin DAN post published
  const canGoogleIndex = (article: Article) =>
    CAN_GOOGLE_INDEX_ROLES.includes(user?.role || '') && article.status === 'published';

  // Trash (Hapus): bertingkat per-role & status
  // - superadmin: semua status
  // - wapimred: semua status KECUALI published
  // - reporter/kontributor: hanya DRAFT MILIK SENDIRI
  const canDeleteArticleFor = (article: Article) => {
    const role = user?.role
    if (!role || !CAN_DELETE_ROLES.includes(role)) {
      return { allowed: false, reason: 'Peran Anda tidak memiliki izin menghapus post.' }
    }
    if (role === 'superadmin') {
      return { allowed: true, reason: '' }
    }
    if (role === 'wapimred') {
      if (article.status === 'published') {
        return { allowed: false, reason: 'Wapimred tidak dapat menghapus post yang sudah diterbitkan. Hubungi Superadmin.' }
      }
      return { allowed: true, reason: '' }
    }
    // reporter / kontributor
    if (article.author?.name && user?.name && article.author.name !== user.name) {
      return { allowed: false, reason: 'Anda hanya dapat menghapus post milik sendiri.' }
    }
    if (article.status !== 'draft') {
      return { allowed: false, reason: 'Reporter/Kontributor hanya dapat menghapus post berstatus draft.' }
    }
    return { allowed: true, reason: '' }
  }

  const getPrimaryActionLabel = (article: Article) => {
    if (canSubmitArticle(article)) return 'Kirim ke Editor';
    if (article.status === 'revision') return 'Perbaiki';
    if (article.status === 'published') return 'Lihat Terbit';
    if (article.status === 'approved') return 'Buka Approved';
    if (article.status === 'scheduled') return 'Cek Jadwal';
    if (article.status === 'submitted' || article.status === 'review') return 'Pantau Status';
    return 'Buka Post';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Kelola Post</h1>
          <p className="text-xs text-gray-400 mt-1">
            Portal <strong className="text-brand-red uppercase">{site}</strong> — {articles.length} post total
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-gray-100 dark:bg-white/5 p-1 rounded-xl flex items-center gap-1">
            <button 
              onClick={() => setViewMode('list')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'list' ? "bg-white dark:bg-white/10 text-brand-red shadow-sm" : "text-gray-400 hover:text-brand-black")}
            >
              <List size={18} />
            </button>
            <button 
              onClick={() => setViewMode('kanban')}
              className={cn("p-2 rounded-lg transition-all", viewMode === 'kanban' ? "bg-white dark:bg-white/10 text-brand-red shadow-sm" : "text-gray-400 hover:text-brand-black")}
            >
              <LayoutGrid size={18} />
            </button>
          </div>
          <button 
            onClick={handleNew}
            disabled={isCreating}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-brand-red/20 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? <Loader2 className="animate-spin" size={14} /> : <Plus size={14} />}
            {isCreating ? 'Membuat...' : 'Post Berita'}
          </button>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="dash-card p-4 space-y-4">
        {(filter || searchQuery) && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-brand-red/10 bg-brand-red/5 px-3 py-2.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">
              Fokus Aktif
            </span>
            {filter && (
              <span className="rounded-full bg-white dark:bg-slate-900/70 px-2 py-1 text-[10px] font-black uppercase tracking-wide text-brand-black dark:text-white">
                Status: {STATUS_LABELS[filter]}
              </span>
            )}
            {searchQuery && (
              <span className="rounded-full bg-white dark:bg-slate-900/70 px-2 py-1 text-[10px] font-black text-brand-black dark:text-white">
                Cari: &quot;{searchQuery}&quot;
              </span>
            )}
          </div>
        )}

        {/* Search */}
        <div className="relative group">
          <Search size={15} className={cn(
            "absolute left-3.5 top-1/2 -translate-y-1/2 transition-colors",
            loading ? "text-brand-red animate-pulse" : "text-gray-300 group-focus-within:text-brand-red"
          )} />
          <input 
            type="text"
            placeholder="Cari judul post di seluruh database..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-red/30 focus:bg-white dark:focus:bg-white/[0.08] rounded-xl text-sm outline-none transition-all text-brand-black dark:text-white placeholder:text-gray-300 shadow-sm"
          />
          {loading && searchQuery && (
            <div className="absolute right-4 top-1/2 -translate-y-1/2">
              <Loader2 size={14} className="animate-spin text-brand-red opacity-50" />
            </div>
          )}
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
          {visibleStatuses.map(s => {
            const count = countByStatus(s);
            return (
              <button 
                key={s}
                onClick={() => {
                  // Langsung set state untuk feedback visual instan (tidak menunggu URL update)
                  setFilter(s);
                  setPage(1);
                  // Gunakan replace agar filter tidak menumpuk di browser history
                  const params = new URLSearchParams();
                  params.set('view', viewMode);
                  if (s) params.set('status', s);
                  if (searchQuery) params.set('search', searchQuery);
                  router.replace(`/${site}/dashboard/articles?${params.toString()}`);
                }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap',
                  filter === s
                    ? 'bg-brand-black dark:bg-white text-white dark:text-slate-900 border-brand-black dark:border-white'
                    : 'bg-transparent text-gray-400 border-gray-200 dark:border-white/10 hover:border-brand-red hover:text-brand-red'
                )}
              >
                {STATUS_LABELS[s]}
                {count > 0 && (
                  <span className={cn(
                    'text-[8px] font-black px-1.5 py-0.5 rounded-full',
                    filter === s ? 'bg-white/20 text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-400'
                  )}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content View (Table or Kanban) */}
      {loading ? (
        <div className="dash-card p-16 flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Memuat data...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        <div className="animate-fade-in">
          <KanbanBoard articles={filtered} site={site} />
        </div>
      ) : (
        <div className="dash-card overflow-hidden animate-fade-in">
          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[800px]">
              <thead className="bg-gray-50 dark:bg-white/[0.02] border-b border-gray-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-3.5 dash-label">Post</th>
                <th className="px-4 py-3.5 dash-label hidden md:table-cell">Penulis</th>
                <th className="px-4 py-3.5 dash-label hidden lg:table-cell">Tanggal</th>
                <th className="px-4 py-3.5 dash-label">Status</th>
                <th className="px-4 py-3.5 dash-label text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
              {filtered.filter(a => a?.id).map((article, idx) => (
                <motion.tr
                  key={article.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.03 }}
                  className="group hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* Title */}
                  <td className="px-6 py-4 max-w-xs">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {article.category?.name && (
                          <span className="text-[9px] font-black uppercase tracking-widest text-brand-red">
                            {article.category.name}
                          </span>
                        )}
                        {article.isBreaking && <EditorialBadge variant="breaking" />}
                        {article.isExclusive && <EditorialBadge variant="exclusive" />}
                        {article.isFeatured && <EditorialBadge variant="featured" />}
                      </div>
                      <Link
                        href={`/${site}/dashboard/articles/${article.id}`}
                        className="text-sm font-bold text-brand-black dark:text-white group-hover:text-brand-red transition-colors line-clamp-1 leading-snug"
                      >
                        {article.title}
                      </Link>
                      <div className="flex items-center gap-3 text-[10px] text-gray-400">
                        {article.viewCount !== undefined && (
                          <span className="flex items-center gap-1">
                            <Eye size={10} /> {(article.viewCount || 0).toLocaleString()}
                          </span>
                        )}
                        {article.wordCount && (
                          <span className="flex items-center gap-1">
                            <FileText size={10} /> {article.wordCount.toLocaleString()} kata
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Author */}
                  <td className="px-4 py-4 hidden md:table-cell">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-400">
                        {article.author?.name?.[0] || 'R'}
                      </div>
                      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate max-w-[100px]">
                        {article.author?.name || 'Redaksi'}
                      </span>
                    </div>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-4 hidden lg:table-cell">
                    <div className="flex items-center gap-1 text-[10px] text-gray-400">
                      <Calendar size={11} />
                      {new Date(article.publishedAt || article.createdAt).toLocaleDateString('id-ID', {
                        day:'numeric', month:'short', year:'numeric'
                      })}
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-4">
                    <StatusBadge status={article.status} />
                  </td>

                  {/* Actions — 4 ikon seragam: Eye, Pencil, Globe, Trash */}
                  <td className="px-4 py-4">
                    <div className="flex justify-end items-center gap-1.5 flex-wrap">
                      {/* 1) EYE — Lihat (publik untuk published, detail untuk non-published) */}
                      {canViewArticle(article) ? (
                        <Link
                          href={`/${site}/artikel/${article.slug}`}
                          target="_blank"
                          className="p-2.5 bg-emerald-600/10 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          title="Lihat Post di Portal Publik"
                        >
                          <Eye size={14} />
                        </Link>
                      ) : (
                        <Link
                          href={`/${site}/dashboard/articles/${article.id}`}
                          className="p-2.5 bg-emerald-600/10 text-emerald-600 rounded-lg hover:bg-emerald-600 hover:text-white transition-all"
                          title="Lihat Detail Post"
                        >
                          <Eye size={14} />
                        </Link>
                      )}

                      {/* 2) PENCIL — Edit (selalu tersedia untuk author sendiri atau editor) */}
                      {(() => {
                        const isOwn = !user?.name || !article.author?.name || article.author.name === user.name
                        const canEdit = user?.role === 'superadmin'
                          || user?.role === 'wapimred'
                          || isOwn
                        if (!canEdit) {
                          return (
                            <button
                              type="button"
                              disabled
                              title="Anda hanya dapat mengedit post milik sendiri"
                              className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 rounded-lg cursor-not-allowed opacity-50"
                            >
                              <Edit3 size={14} />
                            </button>
                          )
                        }
                        return (
                          <Link
                            href={`/${site}/dashboard/articles/${article.id}`}
                            className="p-2.5 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
                            title={getPrimaryActionLabel(article)}
                          >
                            <Edit3 size={14} />
                          </Link>
                        )
                      })()}

                      {/* Tombol Submit-To-Editor (khusus draft) — ekstra di samping Edit */}
                      {canSubmitArticle(article) && (
                        <button
                          onClick={() => handleSubmitToReview(article.id)}
                          disabled={actionLoading === article.id}
                          title="Kirim ke Editor"
                          className="p-2.5 bg-brand-red/10 text-brand-red rounded-lg hover:bg-brand-red hover:text-white transition-all disabled:opacity-50"
                        >
                          {actionLoading === article.id
                            ? <Loader2 size={14} className="animate-spin" />
                            : <Send size={14} />
                          }
                        </button>
                      )}

                      {/* 3) GLOBE — Google Index (hanya superadmin & post published) */}
                      <button
                        onClick={() => canGoogleIndex(article) && handleGoogleIndex(article.id)}
                        disabled={!canGoogleIndex(article) || actionLoading === article.id + 'index'}
                        title={
                          canGoogleIndex(article)
                            ? 'Kirim sinyal indeks Google'
                            : user?.role !== 'superadmin'
                              ? 'Pengindeksan Google hanya dapat dilakukan oleh Superadmin'
                              : 'Post belum terbit — tidak dapat diindeks'
                        }
                        className={`p-2.5 rounded-lg transition-all ${
                          canGoogleIndex(article)
                            ? 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-500/10 cursor-pointer'
                            : 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed opacity-50'
                        } disabled:opacity-50`}
                      >
                        {actionLoading === article.id + 'index' ? (
                          <Loader2 size={14} className="animate-spin text-emerald-500" />
                        ) : (
                          <Globe size={14} />
                        )}
                      </button>

                      {/* 4) TRASH — Hapus (bertingkat per-role & status) */}
                      {(() => {
                        const perm = canDeleteArticleFor(article)
                        const isDeleting = actionLoading === article.id + 'del'
                        return (
                          <button
                            onClick={() => perm.allowed && handleDelete(article)}
                            disabled={!perm.allowed || isDeleting}
                            title={perm.allowed ? 'Hapus Post' : perm.reason}
                            className={`p-2.5 rounded-lg transition-all ${
                              perm.allowed
                                ? 'bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-red-600 hover:bg-red-500/10 cursor-pointer'
                                : 'bg-gray-100 dark:bg-white/5 text-gray-300 dark:text-white/20 cursor-not-allowed opacity-50'
                            } disabled:opacity-50`}
                          >
                            {isDeleting ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Trash2 size={14} />
                            )}
                          </button>
                        )
                      })()}
                    </div>
                  </td>
                </motion.tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3 text-gray-300 dark:text-white/10">
                      <FileText size={48} strokeWidth={1} />
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">
                        {searchQuery ? `Tidak ada hasil untuk "${searchQuery}"` : 'Tidak ada post'}
                      </p>
                      {!searchQuery && (
                        <button
                          onClick={handleNew}
                          className="mt-2 flex items-center gap-2 px-4 py-2 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all"
                        >
                          <Plus size={12} /> Tulis Post Pertama
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-gray-50/30 dark:bg-white/[0.01] border-t border-gray-100 dark:border-white/5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Menampilkan {(page - 1) * 10 + 1} - {Math.min(page * 10, totalItems)} dari {totalItems} post
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 text-gray-400 hover:text-brand-red disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <div className="flex items-center gap-1">
                  {[...Array(totalPages)].map((_, i) => {
                    // Show current page, and few pages around it
                    if (totalPages > 5) {
                      if (i + 1 !== 1 && i + 1 !== totalPages && Math.abs(page - (i + 1)) > 1) {
                        if (Math.abs(page - (i + 1)) === 2) return <span key={i} className="text-gray-300">...</span>;
                        return null;
                      }
                    }
                    return (
                      <button
                        key={i}
                        onClick={() => setPage(i + 1)}
                        className={cn(
                          "w-8 h-8 rounded-lg text-[10px] font-black transition-all",
                          page === i + 1 ? "bg-brand-red text-white shadow-md shadow-brand-red/20" : "text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                      >
                        {i + 1}
                      </button>
                    )
                  })}
                </div>
                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 text-gray-400 hover:text-brand-red disabled:opacity-30 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
