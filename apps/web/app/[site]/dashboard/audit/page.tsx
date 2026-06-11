'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Shield, FileText, User, Settings, Search,
  ChevronLeft, ChevronRight, RefreshCw,
  BarChart3, Activity, Eye, X, Download
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { cn } from '../../../../lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';

// ─── Types ───────────────────────────────────────────────────────
interface AuditLog {
  id: string;
  action: string;
  entityType: string | null;
  entityId: string | null;
  oldValue: any;
  newValue: any;
  ipAddress: string | null;
  createdAt: string;
  user: { id: string; name: string; role: string; email: string };
}

interface AuditStats {
  total: number;
  last7d: number;
  byAction: { action: string; count: number }[];
}

// ─── Action Config ────────────────────────────────────────────────
const ACTION_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  'post.create': { label: 'Post Dibuat',     icon: FileText, color: 'text-blue-600',   bg: 'bg-blue-50 dark:bg-blue-900/20' },
  'post.update': { label: 'Post Diubah',     icon: FileText, color: 'text-amber-600',  bg: 'bg-amber-50 dark:bg-amber-900/20' },
  'post.publish': { label: 'Post Terbit',    icon: FileText, color: 'text-green-600',  bg: 'bg-green-50 dark:bg-green-900/20' },
  'post.delete': { label: 'Post Dihapus',    icon: FileText, color: 'text-red-600',    bg: 'bg-red-50 dark:bg-red-900/20' },
  'user.create':  { label: 'User Dibuat',       icon: User,     color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  'user.update':  { label: 'User Diubah',       icon: User,     color: 'text-violet-600', bg: 'bg-violet-50 dark:bg-violet-900/20' },
  'settings.update':{ label: 'Situs Diubah',  icon: Settings, color: 'text-slate-600',  bg: 'bg-slate-50 dark:bg-slate-800/50' },
};

const getActionConfig = (action: string) =>
  ACTION_CONFIG[action] ?? { label: action, icon: Activity, color: 'text-gray-500', bg: 'bg-gray-50 dark:bg-white/5' };

// ─── Detail Modal ────────────────────────────────────────────────
function DetailModal({ log, onClose }: { log: AuditLog; onClose: () => void }) {
  const cfg = getActionConfig(log.action);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className={cn('p-6 flex items-center justify-between border-b border-gray-100 dark:border-white/5', cfg.bg)}>
          <div className="flex items-center gap-3">
            <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', cfg.bg)}>
              <cfg.icon size={18} className={cfg.color} />
            </div>
            <div>
              <h3 className="text-sm font-black text-brand-black dark:text-white">{cfg.label}</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                {format(new Date(log.createdAt), "dd MMM yyyy • HH:mm:ss", { locale: id })}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/40 rounded-lg text-gray-400 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: 'Pengguna', value: log.user.name },
              { label: 'Role', value: log.user.role },
              { label: 'Entity Type', value: log.entityType || '—' },
              { label: 'Entity ID', value: log.entityId ? log.entityId.slice(0, 8) + '...' : '—' },
              { label: 'IP Address', value: log.ipAddress || '—' },
              { label: 'Aksi', value: log.action },
            ].map(({ label, value }) => (
              <div key={label} className="bg-gray-50 dark:bg-white/5 rounded-xl p-4">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 mb-1">{label}</p>
                <p className="text-xs font-bold text-brand-black dark:text-white truncate">{value}</p>
              </div>
            ))}
          </div>

          {(log.oldValue || log.newValue) && (
            <div className="space-y-4">
              {log.oldValue && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-red-500 mb-2">State Sebelumnya</p>
                  <pre className="text-[10px] bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300 rounded-xl p-4 overflow-auto max-h-40 font-mono leading-relaxed">
                    {JSON.stringify(typeof log.oldValue === 'object' ? 
                      { title: log.oldValue.title, status: log.oldValue.status } : log.oldValue, null, 2)}
                  </pre>
                </div>
              )}
              {log.newValue && (
                <div>
                  <p className="text-[9px] font-black uppercase tracking-[0.2em] text-green-500 mb-2">State Sesudahnya</p>
                  <pre className="text-[10px] bg-green-50 dark:bg-green-900/10 text-green-800 dark:text-green-300 rounded-xl p-4 overflow-auto max-h-40 font-mono leading-relaxed">
                    {JSON.stringify(typeof log.newValue === 'object' ? 
                      { title: log.newValue.title, status: log.newValue.status } : log.newValue, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────
export default function AuditLogPage() {
  const { site } = useParams<{ site: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  // Filters
  const [searchAction, setSearchAction] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');

  // Auth guard — audit log hanya untuk superadmin
  useEffect(() => {
    if (user && user.role !== 'superadmin') {
      router.replace(`/${site}/dashboard`);
    }
  }, [user, site, router]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: '25',
        ...(searchAction && { action: searchAction }),
        ...(filterEntityType && { entityType: filterEntityType }),
      });

      // Fetch logs (required)
      const logsRes = await api.get(`/audit?${params}`);
      const d = logsRes.data.data;
      setLogs(d.items);
      setTotal(d.total);
      setTotalPages(d.totalPages);

      // Fetch stats (optional - graceful fallback if endpoint doesn't exist)
      if (stats === null) {
        try {
          const statsRes = await api.get('/audit/stats');
          setStats(statsRes.data.data);
        } catch (statsErr) {
          console.warn('[audit] Stats endpoint not available, using defaults');
          setStats({});
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [page, searchAction, filterEntityType]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const LIMIT = 25;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white/10 flex items-center justify-center shadow-lg">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Audit Log</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Riwayat Aktivitas Editorial
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              try {
                const response = await api.get('/audit/export', { responseType: 'blob' });
                const url = window.URL.createObjectURL(new Blob([response.data]));
                const link = document.createElement('a');
                link.href = url;
                link.setAttribute('download', `audit-log-${site}-${new Date().toISOString().split('T')[0]}.csv`);
                document.body.appendChild(link);
                link.click();
                link.remove();
              } catch (e) {
                console.error('Export failed', e);
                alert('Gagal mengekspor data');
              }
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20"
          >
            <Download size={14} /> Ekspor CSV
          </button>
          <button
            onClick={fetchLogs}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all border border-gray-100 dark:border-white/5"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="dash-card p-5">
            <p className="dash-label mb-1">Total Aktivitas</p>
            <p className="text-3xl font-black text-brand-black dark:text-white">{stats.total.toLocaleString('id-ID')}</p>
          </div>
          <div className="dash-card p-5">
            <p className="dash-label mb-1">7 Hari Terakhir</p>
            <p className="text-3xl font-black text-brand-red">{stats.last7d.toLocaleString('id-ID')}</p>
          </div>
          {stats.byAction.slice(0, 2).map(a => {
            const cfg = getActionConfig(a.action);
            return (
              <div key={a.action} className="dash-card p-5">
                <p className="dash-label mb-1 truncate">{cfg.label}</p>
                <p className={cn('text-3xl font-black', cfg.color)}>{a.count}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Top Actions Bar */}
      {stats && stats.byAction.length > 0 && (
        <div className="dash-card p-6">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 size={14} className="text-brand-red" />
            <h3 className="dash-label">Aksi Terbanyak</h3>
          </div>
          <div className="space-y-3">
            {stats.byAction.map((a, i) => {
              const cfg = getActionConfig(a.action);
              const pct = Math.round((a.count / (stats.byAction[0]?.count || 1)) * 100);
              return (
                <div key={a.action} className="flex items-center gap-4">
                  <span className="text-[9px] font-black text-gray-400 w-4">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-[10px] font-bold text-brand-black dark:text-white">{cfg.label}</span>
                      <span className={cn('text-[10px] font-black', cfg.color)}>{a.count}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 dark:bg-white/10 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-red rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Filter aksi (misal: post.publish)..."
            value={searchAction}
            onChange={e => { setSearchAction(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
          />
        </div>
        <select
          value={filterEntityType}
          onChange={e => { setFilterEntityType(e.target.value); setPage(1); }}
          className="px-4 py-3 bg-white dark:bg-slate-900 border border-gray-200 dark:border-white/10 rounded-xl text-xs outline-none focus:border-brand-red transition-all appearance-none min-w-[160px]"
        >
          <option value="">Semua Entitas</option>
          <option value="post">Post</option>
          <option value="user">Pengguna</option>
          <option value="site">Situs</option>
          <option value="category">Kategori</option>
        </select>
      </div>

      {/* Log Table */}
      <div className="dash-card overflow-hidden">
        <div className="dash-card-header">
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-brand-red" />
            <h3 className="dash-label">Log Aktivitas</h3>
          </div>
          <span className="text-[10px] font-bold text-gray-400">{total} entri ditemukan</span>
        </div>

        {loading ? (
          <div className="p-16 flex flex-col items-center gap-4 text-gray-400">
            <RefreshCw size={24} className="animate-spin text-brand-red" />
            <p className="text-xs font-bold uppercase tracking-widest">Memuat data...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="p-16 flex flex-col items-center gap-4 text-gray-400">
            <Shield size={32} className="opacity-20" />
            <p className="text-xs font-bold uppercase tracking-widest">Belum ada aktivitas tercatat</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-gray-50 dark:border-white/5">
                    {['Waktu', 'Pengguna', 'Aksi', 'Entitas', 'IP', ''].map(h => (
                      <th key={h} className="px-6 py-4 text-[9px] font-black uppercase tracking-[0.2em] text-gray-400">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                  {logs.map(log => {
                    const cfg = getActionConfig(log.action);
                    return (
                      <motion.tr
                        key={log.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors group"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-[11px] font-bold text-brand-black dark:text-white whitespace-nowrap">
                              {format(new Date(log.createdAt), 'dd MMM • HH:mm', { locale: id })}
                            </p>
                            <p className="text-[9px] text-gray-400 font-medium">
                              {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: id })}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-[11px] font-black text-slate-600 dark:text-gray-300">
                              {log.user.name[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[11px] font-bold text-brand-black dark:text-white">{log.user.name}</p>
                              <p className="text-[9px] text-gray-400 capitalize">{log.user.role}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn('inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest', cfg.bg, cfg.color)}>
                            <cfg.icon size={10} />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          {log.entityType ? (
                            <div>
                              <p className="text-[10px] font-bold text-brand-black dark:text-white capitalize">{log.entityType}</p>
                              {log.entityId && <p className="text-[9px] text-gray-400 font-mono">{log.entityId.slice(0, 8)}…</p>}
                            </div>
                          ) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-[10px] text-gray-400 font-mono">{log.ipAddress || '—'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedLog(log)}
                            className="opacity-0 group-hover:opacity-100 p-2 hover:bg-brand-red/10 text-gray-400 hover:text-brand-red rounded-lg transition-all"
                          >
                            <Eye size={14} />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-50 dark:divide-white/5">
              {logs.map(log => {
                const cfg = getActionConfig(log.action);
                return (
                  <button
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className="w-full flex items-start gap-4 p-4 text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                  >
                    <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5', cfg.bg)}>
                      <cfg.icon size={14} className={cfg.color} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[11px] font-black text-brand-black dark:text-white">{cfg.label}</p>
                        <p className="text-[9px] text-gray-400 shrink-0">
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: id })}
                        </p>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-0.5">{log.user.name} • {log.user.role}</p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="p-6 border-t border-gray-50 dark:border-white/5 flex items-center justify-between">
                <p className="text-[10px] text-gray-400 font-bold">
                  Menampilkan {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} dari {total}
                </p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page <= 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:border-brand-red hover:text-brand-red transition-all"
                  >
                    <ChevronLeft size={14} />
                  </button>
                  <span className="text-[11px] font-black text-brand-black dark:text-white px-2">
                    {page} / {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page >= totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-white/10 disabled:opacity-30 hover:border-brand-red hover:text-brand-red transition-all"
                  >
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedLog && (
          <DetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}