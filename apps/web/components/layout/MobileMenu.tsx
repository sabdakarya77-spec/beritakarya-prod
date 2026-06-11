'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Bookmark, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CategoryItem } from '../../lib/constants';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { useSavedArticles } from '../../hooks/useSavedArticles';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  siteConfig: any;
  selectedCategory: string;
  onCategoryClick: (slug: string) => void;
}

export default function MobileMenu({
  isOpen,
  onClose,
  categories,
  siteConfig,
  selectedCategory,
  onCategoryClick,
}: MobileMenuProps) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const activeSite = siteConfig?.id || pathname.split('/')[1] || 'pusat';
  const { count: savedArticlesCount } = useSavedArticles(activeSite);

  const handleCategoryClick = (slug: string) => {
    onCategoryClick(slug);
    router.push(`/${activeSite}?cat=${encodeURIComponent(slug)}`);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
          />

          {/* Menu Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 bottom-0 z-[101] flex w-[82%] max-w-sm flex-col bg-white shadow-2xl dark:bg-slate-950 md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3.5 dark:border-white/5">
              <Link href={`/${activeSite}`} onClick={onClose} className="flex flex-col">
                <h2 className="font-serif text-lg font-black tracking-tight text-brand-black dark:text-white">
                  <span className="text-brand-red">BERITA</span>KARYA
                </h2>
                <span className="mt-0.5 text-[9px] font-medium tracking-[0.05em] text-brand-text-muted">
                  Menu Navigasi
                </span>
              </Link>
              <button 
                onClick={onClose}
                className="rounded-full p-1.5 transition-colors hover:bg-gray-100 dark:hover:bg-white/5"
              >
                <X size={18} className="text-brand-text-muted" />
              </button>
            </div>

            {/* Content Scroll Area */}
            <div className="no-scrollbar flex-1 space-y-5 overflow-y-auto p-5">
              {/* Profile / Auth Section */}
              <section>
                <h3 className="mb-2.5 text-[9px] font-medium tracking-[0.06em] text-brand-text-muted">Akun Saya</h3>
                {user ? (
                  <div className="rounded-2xl bg-gray-50 p-3.5 dark:bg-white/5">
                    <div className="mb-3.5 flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-red text-base font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-[13px] font-semibold text-brand-black dark:text-white">{user.name}</p>
                        <p className="truncate text-[11px] text-brand-text-muted">{user.email}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {['superadmin', 'wapimred', 'reporter', 'kontributor'].includes(user.role) && (
                        <Link 
                          href={`/${activeSite}/dashboard`} 
                          onClick={onClose}
                          className="flex items-center justify-center gap-1.5 rounded-xl border border-gray-100 bg-white py-2 text-[9px] font-medium tracking-[0.04em] text-gray-600 dark:border-white/10 dark:bg-slate-900 dark:text-gray-300"
                        >
                          <User size={12} /> Dashboard
                        </Link>
                      )}
                      <button 
                        onClick={() => { logout(); onClose(); }}
                        className="flex items-center justify-center gap-1.5 rounded-xl border border-red-100 bg-red-50 py-2 text-[9px] font-medium tracking-[0.04em] text-brand-red dark:border-red-500/20 dark:bg-red-500/10"
                      >
                        <LogOut size={12} /> Keluar
                      </button>
                    </div>
                  </div>
                ) : (
                  <Link 
                    href="/login" 
                    onClick={onClose}
                    className="flex items-center justify-between rounded-2xl bg-brand-red p-3.5 text-white shadow-lg shadow-brand-red/20"
                  >
                    <div className="flex items-center gap-3">
                      <User size={16} />
                      <span className="text-[10px] font-medium tracking-[0.05em]">Masuk / Daftar</span>
                    </div>
                    <ChevronRight size={16} />
                  </Link>
                )}
              </section>

              {/* Categories Section */}
              <section>
                <h3 className="mb-2.5 text-[9px] font-medium tracking-[0.06em] text-brand-text-muted">Kategori Berita</h3>
                <div className="grid grid-cols-1 gap-1">
                  {categories.map((cat) => {
                    const isActive = selectedCategory === cat.slug;
                    return (
                      <button
                        key={cat.slug}
                        onClick={() => handleCategoryClick(cat.slug)}
                        className={cn(
                          "group flex items-center justify-between rounded-xl px-3 py-2 transition-all",
                          isActive 
                            ? "bg-brand-red/10 text-brand-red" 
                            : "hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-brand-text-muted"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          {cat.slug === 'tersimpan' ? <Bookmark size={14} /> : <div className={cn("h-1 w-1 rounded-full", isActive ? "bg-brand-red" : "bg-gray-300")} />}
                          <span className="text-[11px] font-medium tracking-[0.01em]">{cat.name}</span>
                          {cat.slug === 'tersimpan' && savedArticlesCount > 0 && (
                            <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[9px] font-black tracking-normal text-white">
                              {savedArticlesCount}
                            </span>
                          )}
                        </div>
                        <ChevronRight size={13} className={cn("transition-transform", isActive ? "rotate-90" : "group-hover:translate-x-1")} />
                      </button>
                    );
                  })}
                </div>
              </section>

            </div>

            {/* Footer */}
            <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3.5 dark:border-white/5 dark:bg-white/[0.02]">
              <p className="text-[8px] font-medium tracking-[0.05em] text-brand-text-muted">
                © {new Date().getFullYear()} BERITA KARYA.<br />
                Jernih Melihat Nusantara.
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
