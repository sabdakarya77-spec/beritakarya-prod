'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, User, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import Button from './Button';

interface Comment {
  id: string;
  content: string;
  authorName?: string;
  authorEmail?: string;
  status: string;
  createdAt: string;
  user?: { name: string; avatarUrl?: string | null };
  replies?: Comment[];
}

export default function CommentSection({ articleId }: { articleId: string }) {
  const { user } = useAuthStore();
  const pathname = usePathname();
  const [content, setContent] = useState('');
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const returnPath = pathname ? `${pathname}#comments` : '#comments';
  const loginHref = `/login?next=${encodeURIComponent(returnPath)}`;
  const registerHref = `/register?next=${encodeURIComponent(returnPath)}`;

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = '0px';
    textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
  }, [content]);

  const fetchComments = async () => {
    try {
      const { data } = await api.get(`/comments/article/${articleId}`);
      setComments(data.data);
    } catch (err) {
      console.error('Failed to fetch comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchComments depends only on articleId (tracked)
  }, [articleId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    if (!user) {
      setMessage({ type: 'error', text: 'Silakan masuk atau daftar terlebih dahulu untuk ikut berdiskusi.' });
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      await api.post(`/comments/article/${articleId}`, { content: content.trim() });

      setContent('');
      setMessage({
        type: 'success',
        text: 'Komentar Anda telah dikirim dan menunggu moderasi redaksi.'
      });
      fetchComments();
    } catch {
      setMessage({ type: 'error', text: 'Gagal mengirim komentar. Silakan coba lagi.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="mt-8 pt-6 md:mt-10 md:pt-8">
      <div className="mb-7 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-red text-white shadow-lg shadow-brand-red/20">
            <MessageSquare size={18} />
          </div>
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-brand-black dark:text-white">Komentar</h3>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
              {isLoading ? 'Memuat...' : `${comments.length} komentar pembaca terdaftar`}
            </p>
          </div>
        </div>
      </div>

      {user ? (
        <div className="mb-8 rounded-[1.75rem] border border-gray-100 bg-gray-50/75 p-4 shadow-[0_18px_50px_rgba(15,23,42,0.05)] dark:border-white/5 dark:bg-white/[0.02] dark:shadow-[0_18px_50px_rgba(0,0,0,0.2)] md:p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-3">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="h-10 w-10 shrink-0 rounded-full object-cover shadow-sm" />
              ) : (
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-brand-text-muted shadow-sm dark:bg-white/5">
                  <span className="font-black text-sm text-brand-red">{user.name[0]}</span>
                </div>
              )}
              <div className="flex-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm transition-all focus-within:border-brand-red/30 dark:border-white/10 dark:bg-slate-900">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => {
                    setContent(e.target.value);
                    if (message?.type === 'error') setMessage(null);
                  }}
                  placeholder="Bagikan pendapat Anda tentang berita ini..."
                  className="min-h-[44px] w-full resize-none overflow-y-auto bg-transparent text-sm leading-relaxed outline-none placeholder:text-brand-text-muted"
                />
                <div className="mt-3 flex items-center justify-between gap-3 border-t border-gray-100 pt-3 dark:border-white/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-brand-text-muted">
                    Komentar ditinjau redaksi sebelum tayang
                  </p>
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSubmitting}
                    disabled={!content.trim()}
                  >
                    {isSubmitting ? 'Mengirim...' : 'Kirim'} <Send size={13} />
                  </Button>
                </div>
              </div>
            </div>
          </form>

          {message && (
            <div
              className={cn(
                'mt-4 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-bold',
                message.type === 'success'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
              )}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}
        </div>
      ) : (
        <div className="mb-6 rounded-2xl border border-gray-100 bg-gray-50/50 p-4 shadow-[0_8px_30px_rgba(15,23,42,0.03)] dark:border-white/5 dark:bg-white/[0.015] dark:shadow-none">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-brand-text-muted shadow-sm dark:bg-white/5">
                <User size={14} />
              </div>
              <p className="text-xs text-brand-text-muted">
                Untuk ikut berdiskusi, silakan <Link href={loginHref} rel="nofollow" className="font-bold text-brand-red hover:underline">Masuk</Link> atau <Link href={registerHref} rel="nofollow" className="font-bold text-brand-red hover:underline">Daftar</Link> terlebih dahulu.
              </p>
            </div>
            <div className="text-[9px] font-bold uppercase tracking-[0.16em] text-brand-text-muted sm:text-right">
              Hanya akun terdaftar yang dapat mengirim komentar
            </div>
          </div>

          {message && (
            <div
              className={cn(
                'mt-3 flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-bold',
                message.type === 'success'
                  ? 'border-emerald-100 bg-emerald-50 text-emerald-600 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-400'
                  : 'border-red-100 bg-red-50 text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400'
              )}
            >
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}
        </div>
      )}

      <div className="space-y-6">
        {isLoading ? (
          <div className="py-16 text-center">
            <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-brand-red/20 border-t-brand-red" />
            <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-brand-text-muted">Memuat komentar...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white/[0.01] px-6 py-7 text-center dark:border-white/10 dark:bg-white/[0.005] md:py-8">
            <MessageSquare size={24} className="mx-auto mb-2.5 text-gray-300 dark:text-gray-600" />
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-text-muted">Belum ada komentar.</p>
            <p className="mt-1.5 text-xs text-brand-text-muted">
              Jadilah yang pertama berdiskusi setelah masuk ke akun Anda.
            </p>
          </div>
        ) : (
          comments.map((c) => (
            <article key={c.id} className="border-b border-gray-100 pb-6 last:border-b-0 dark:border-white/5">
              <div className="flex gap-3">
                {c.user?.avatarUrl ? (
                  <img src={c.user.avatarUrl} alt={c.user?.name || c.authorName || 'P'} className="h-10 w-10 shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-black text-brand-red dark:bg-white/5">
                    {c.user?.name?.[0] || c.authorName?.[0] || 'P'}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-black dark:text-white">
                      {c.user?.name || c.authorName || 'Pembaca'}
                    </h4>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-brand-text-muted">
                      <Clock size={10} />
                      {new Date(c.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-3 text-[15px] leading-7 text-gray-700 dark:text-gray-300">
                    {c.content}
                  </p>
                </div>
              </div>
            </article>
          ))
        )}
      </div>

    </section>
  );
}
