'use client';

import React, { useState, useEffect, useRef } from 'react';
import { X, ChevronRight, Bookmark, User, LogOut } from 'lucide-react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { CategoryItem, type SiteConfig } from '../../lib/constants';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { useSavedArticles } from '../../hooks/useSavedArticles';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  categories: CategoryItem[];
  siteConfig: SiteConfig;
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

  const [expandedSlug, setExpandedSlug] = useState<string | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  // Handle open/close with CSS transition
  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      requestAnimationFrame(() => setIsAnimating(true));
    } else {
      setIsAnimating(false);
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleLeafClick = (slug: string) => {
    onCategoryClick(slug);
    router.push(`/${activeSite}?cat=${encodeURIComponent(slug)}`);
    onClose();
  };

  const handleParentClick = (slug: string) => {
    setExpandedSlug((prev) => (prev === slug ? null : slug));
  };

  if (!isVisible) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className={cn(
          'fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm transition-opacity duration-300',
          isAnimating ? 'opacity-100' : 'opacity-0'
        )}
      />

      {/* Menu Content */}
      <div
        ref={panelRef}
        className={cn(
          'fixed top-0 left-0 bottom-0 z-[101] flex w-[82%] max-w-sm flex-col bg-white shadow-2xl dark:bg-slate-950 transition-transform duration-300 ease-out',
          isAnimating ? 'translate-x-0' : '-translate-x-full'
        )}
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
            aria-label="Tutup menu"
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
            <div className="flex flex-col gap-0.5">
              {categories.map((cat) => {
                const hasSubCats = cat.subCategories && cat.subCategories.length > 0;
                const isExpanded = expandedSlug === cat.slug;
                const isActive = selectedCategory === cat.slug;

                return (
                  <div key={cat.slug}>
                    {/* Parent category row */}
                    <button
                      onClick={() => {
                        if (hasSubCats) {
                          handleParentClick(cat.slug);
                        } else {
                          handleLeafClick(cat.slug);
                        }
                      }}
                      className={cn(
                        'group flex w-full items-center justify-between rounded-xl px-3 py-2.5 transition-all',
                        isActive && !hasSubCats
                          ? 'bg-brand-red/10 text-brand-red'
                          : isExpanded
                          ? 'bg-gray-100 text-brand-black dark:bg-slate-800 dark:text-white'
                          : 'text-gray-600 hover:bg-gray-50 dark:text-brand-text-muted dark:hover:bg-white/5',
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {cat.slug === 'tersimpan' ? (
                          <Bookmark size={14} />
                        ) : (
                          <div
                              className={cn(
                              'h-1 w-1 rounded-full',
                              isActive && !hasSubCats ? 'bg-brand-red' : isExpanded ? 'bg-gray-800 dark:bg-white' : 'bg-gray-300 dark:bg-gray-600',
                            )}
                          />
                        )}
                        <span className="text-[11px] font-medium tracking-[0.01em]">{cat.name}</span>
                        {cat.slug === 'tersimpan' && savedArticlesCount > 0 && (
                          <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[9px] font-black tracking-normal text-white">
                            {savedArticlesCount}
                          </span>
                        )}
                      </div>
                      <ChevronRight
                        size={13}
                        className={cn(
                          'flex-shrink-0 transition-transform duration-200',
                          isExpanded ? 'rotate-90 text-brand-red' : 'group-hover:translate-x-0.5',
                        )}
                      />
                    </button>

                    {/* Inline subcategory list */}
                    {hasSubCats && (
                      <div
                        className={cn(
                          'overflow-hidden transition-all duration-200 ease-in-out',
                          isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                        )}
                      >
                        <div className="ml-5 mt-0.5 flex flex-col gap-0.5 border-l-2 border-gray-100 pl-3 pb-1 dark:border-white/5">
                          <button
                            onClick={() => handleLeafClick(cat.slug)}
                            className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[10px] font-semibold tracking-[0.04em] text-brand-red hover:bg-brand-red/5 transition-colors"
                          >
                            <span>Semua {cat.name}</span>
                            <ChevronRight size={11} />
                          </button>
                          {cat.subCategories!.map((sub) => {
                            const isSubActive = selectedCategory === sub.slug;
                            return (
                              <button
                                key={sub.slug}
                                onClick={() => handleLeafClick(sub.slug)}
                                className={cn(
                                  'flex w-full items-center justify-between rounded-lg px-2 py-1.5 text-left transition-colors',
                                  isSubActive
                                    ? 'bg-brand-red/10 text-brand-red'
                                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10',
                                )}
                              >
                                <span className="text-[10.5px] font-medium">{sub.name}</span>
                                {isSubActive && (
                                  <div className="h-1.5 w-1.5 rounded-full bg-brand-red" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50/50 px-5 py-3.5 dark:border-white/5 dark:bg-white/[0.02]">
          <p suppressHydrationWarning className="text-[8px] font-medium tracking-[0.05em] text-brand-text-muted">
            © {new Date().getFullYear()} BERITA KARYA.<br />
            Nusantara Bersuara.
          </p>
        </div>
      </div>
    </>
  );
}
