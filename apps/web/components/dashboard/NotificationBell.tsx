'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink, RefreshCw, MessageSquare, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';
import { useAuthStore } from '../../store/authStore';
import { useParams } from 'next/navigation';
import { cn } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { id } from 'date-fns/locale';
import Link from 'next/link';

interface Notification {
  id: string;
  type: 'article_submitted' | 'article_reviewed' | 'mention';
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuthStore();
  const { site } = useParams() as { site: string };
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.data.items);
      setUnreadCount(data.data.unreadCount);
    } catch (e) {
      console.error('Failed to fetch notifications:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchNotifications();

    // Polling setiap 30 detik — EventSource tidak bisa kirim httpOnly cookies
    const interval = setInterval(fetchNotifications, 30000);

    // Close on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      clearInterval(interval);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user, site]);

  const markRead = async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (e) {
      console.error(e);
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'article_submitted': return <AlertCircle size={14} className="text-violet-500" />;
      case 'article_reviewed': return <CheckCircle2 size={14} className="text-emerald-500" />;
      default: return <MessageSquare size={14} className="text-blue-500" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "relative p-2 text-gray-400 hover:text-brand-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-all",
          isOpen && "bg-gray-100 dark:bg-white/5 text-brand-black dark:text-white"
        )}
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-brand-red text-white text-[10px] font-black flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900 animate-in zoom-in duration-300">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-3 w-[280px] xs:w-80 sm:w-96 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/5 overflow-hidden z-50 backdrop-blur-xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between bg-gray-50/50 dark:bg-white/[0.02]">
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-brand-black dark:text-white">Notifikasi</h4>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">{unreadCount} Belum Dibaca</p>
              </div>
              {unreadCount > 0 && (
                <button 
                  onClick={markAllRead}
                  className="flex items-center gap-1.5 text-[10px] font-black text-brand-red uppercase tracking-widest hover:bg-brand-red/10 px-2 py-1.5 rounded-lg transition-all"
                >
                  <Check size={12} /> Tandai Semua
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[400px] overflow-y-auto">
              {loading ? (
                <div className="p-12 flex flex-col items-center gap-3 text-gray-400">
                  <RefreshCw size={20} className="animate-spin text-brand-red" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Memuat...</span>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-12 flex flex-col items-center gap-4 text-center">
                  <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center text-gray-200 dark:text-white/10">
                    <Bell size={24} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-relaxed">
                    Belum ada notifikasi<br/>untuk Anda saat ini.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/[0.03]">
                  {notifications.map((n) => (
                    <div 
                      key={n.id} 
                      className={cn(
                        "p-4 flex gap-3 transition-colors relative group",
                        !n.isRead && "bg-brand-red/[0.02]"
                      )}
                    >
                      <div className="mt-1 flex-shrink-0">
                        {getIcon(n.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <p className={cn(
                            "text-xs font-bold leading-tight",
                            n.isRead ? "text-brand-black dark:text-gray-300" : "text-brand-red dark:text-white"
                          )}>
                            {n.title}
                          </p>
                          {!n.isRead && (
                            <button 
                              onClick={() => markRead(n.id)}
                              className="p-1 text-gray-300 hover:text-brand-red transition-colors"
                              title="Tandai dibaca"
                            >
                              <Check size={12} />
                            </button>
                          )}
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                          {n.message}
                        </p>
                        <div className="flex items-center gap-3 mt-2">
                          <span className="text-[10px] text-gray-400 font-bold uppercase">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: id })}
                          </span>
                          {n.link && (
                            <Link 
                              href={n.link} 
                              onClick={() => { setIsOpen(false); markRead(n.id); }}
                              className="flex items-center gap-1 text-[10px] font-black text-brand-red uppercase tracking-widest hover:underline"
                            >
                              Detail <ExternalLink size={10} />
                            </Link>
                          )}
                        </div>
                      </div>
                      {!n.isRead && (
                         <div className="absolute left-0 top-0 bottom-0 w-1 bg-brand-red" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 text-center">
               <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                  Pusat Informasi Editorial BeritaKarya
               </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
