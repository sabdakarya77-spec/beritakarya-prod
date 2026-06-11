'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  MessageSquare, 
  Check, 
  Trash2, 
  Clock, 
  FileText, 
  AlertCircle,
  Filter,
  Search,
  ChevronRight,
  Shield
} from 'lucide-react';
import { api } from '../../../../lib/api';
import Skeleton from '../../../../components/ui/Skeleton';
import { cn } from '../../../../lib/utils';

interface Comment {
  id: string;
  content: string;
  authorName?: string;
  authorEmail?: string;
  status: string;
  createdAt: string;
  article: { title: string; id: string };
  user?: { name: string };
}

export default function ModerationPage() {
  const { site } = useParams() as { site: string };
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('pending');

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/comments/moderation', {
        params: { search, status }
      });
      setComments(data.data);
    } catch (err) {
      console.error('Failed to fetch moderation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQueue();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, status]);

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await api.patch(`/comments/${id}/approve`);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to approve:', err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus/menolak komentar ini?')) return;
    setProcessingId(id);
    try {
      await api.patch(`/comments/${id}/reject`);
      setComments(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error('Failed to reject:', err);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Moderasi Komentar</h1>
          <p className="text-xs text-gray-400 mt-1">
            Kelola diskusi pembaca untuk menjaga kualitas konten di <strong className="text-brand-red uppercase">{site}</strong>
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg overflow-hidden">
            <button 
              onClick={() => setStatus('pending')}
              className={cn("px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-colors", status === 'pending' ? "bg-brand-red text-white" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5")}
            >Pending</button>
            <button 
              onClick={() => setStatus('approved')}
              className={cn("px-3 py-2 text-[10px] font-black uppercase tracking-widest border-l border-gray-100 dark:border-white/10 transition-colors", status === 'approved' ? "bg-emerald-600 text-white" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5")}
            >Disetujui</button>
            <button 
              onClick={() => setStatus('spam')}
              className={cn("px-3 py-2 text-[10px] font-black uppercase tracking-widest border-l border-gray-100 dark:border-white/10 transition-colors", status === 'spam' ? "bg-red-600 text-white" : "text-gray-500 hover:bg-gray-50 dark:hover:bg-white/5")}
            >Spam/Ditolak</button>
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari komentar..."
              className="pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-lg text-xs outline-none focus:border-brand-red/30 transition-all w-48 md:w-64"
            />
          </div>
        </div>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="dash-card p-5 bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-900/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">Menunggu Review</p>
            <AlertCircle size={14} className="text-violet-500" />
          </div>
          <p className="text-3xl font-black text-brand-black dark:text-white">{comments.length}</p>
        </div>
        <div className="dash-card p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Disetujui Hari Ini</p>
          <p className="text-3xl font-black text-brand-black dark:text-white">0</p>
        </div>
        <div className="dash-card p-5">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2">Total Diskusi</p>
          <p className="text-3xl font-black text-brand-black dark:text-white">0</p>
        </div>
      </div>

      {/* List Section */}
      <div className="dash-card overflow-hidden">
        <div className="dash-card-header border-b border-gray-50 dark:border-white/5">
          <div className="flex items-center gap-2">
            <MessageSquare size={16} className="text-brand-red" />
            <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Antrian Moderasi</h3>
          </div>
        </div>

        <div className="dash-card-body p-0">
          {loading ? (
            <div className="p-12 space-y-4">
              {[1, 2, 3].map(i => <Skeleton key={i} variant="text" className="h-24 w-full rounded-xl" />)}
            </div>
          ) : comments.length === 0 ? (
            <div className="py-24 flex flex-col items-center gap-4 text-gray-200 dark:text-white/10">
              <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center">
                <Check size={32} />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-brand-black dark:text-white uppercase tracking-widest">Antrian Bersih</p>
                <p className="text-xs text-gray-400 mt-1 uppercase tracking-widest">Tidak ada komentar yang menunggu moderasi.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-white/5">
              {comments.map((c) => (
                <div key={c.id} className={cn(
                  "p-6 flex flex-col md:flex-row gap-6 transition-all",
                  processingId === c.id ? "opacity-50 pointer-events-none" : "hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                )}>
                  {/* User Info */}
                  <div className="w-48 shrink-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-red/10 flex items-center justify-center text-brand-red font-black text-xs">
                        {(c.user?.name || c.authorName || 'P')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[11px] font-black text-brand-black dark:text-white uppercase tracking-wider truncate">
                          {c.user?.name || c.authorName}
                        </p>
                        <p className="text-[9px] text-gray-400 truncate">{c.authorEmail || 'User Terdaftar'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-gray-400 mb-2">
                      <Clock size={10} />
                      <span className="text-[9px] font-bold uppercase tracking-widest">
                        {new Date(c.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short' })}
                      </span>
                    </div>
                  </div>

                  {/* Comment Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3 bg-gray-100 dark:bg-white/5 px-3 py-1.5 rounded-lg w-fit">
                      <FileText size={10} className="text-brand-red" />
                      <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">Pada Post:</span>
                      <p className="text-[10px] font-black text-brand-red uppercase truncate max-w-[200px]">{c.article.title}</p>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-serif antialiased bg-white dark:bg-slate-900/50 p-4 rounded-xl border border-gray-100 dark:border-white/10 shadow-inner">
                      {c.content}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-row md:flex-col justify-end gap-2 shrink-0">
                    <button 
                      onClick={() => handleApprove(c.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-black uppercase tracking-widest rounded-lg transition-all shadow-lg shadow-emerald-500/20"
                    >
                      <Check size={14} /> Setujui
                    </button>
                    <button 
                      onClick={() => handleReject(c.id)}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-white/5 border border-red-100 dark:border-red-900/20 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
                    >
                      <Trash2 size={14} /> Tolak/Spam
                    </button>
                    <button className="flex items-center justify-center p-2 text-gray-300 hover:text-brand-black dark:hover:text-white transition-all">
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Guidelines */}
      <div className="dash-card p-6 border-brand-red/10 bg-brand-red/[0.01]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-brand-red/10 flex items-center justify-center text-brand-red shrink-0">
            <Shield size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-black text-brand-black dark:text-white uppercase tracking-widest mb-2">Panduan Moderasi Redaksi</h4>
            <p className="text-[10px] text-gray-400 leading-relaxed max-w-2xl">
              Pastikan setiap komentar mematuhi etika berdiskusi. Tolak komentar yang mengandung SARA, ujaran kebencian, spam link, atau konten eksplisit. Moderasi Anda menjaga integritas jurnalisme di <strong className="text-brand-red italic">BeritaKarya</strong>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}