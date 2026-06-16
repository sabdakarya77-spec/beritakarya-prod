'use client';

import { Search, User as UserIcon, Moon, Sun, Bookmark } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { SmartImage } from '../ui/SmartImage';
import DateTimeWeather from '../ui/DateTimeWeather';
import { cn } from '../../lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { Container } from './Container';

import { CategoryItem } from '../../lib/constants';
import { useSavedArticles } from '../../hooks/useSavedArticles';

interface NavbarProps {
  siteConfig: any;
  categories: CategoryItem[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

import { useAuthStore } from '../../store/authStore';

export default function Navbar({
  siteConfig,
  categories,
  selectedCategory,
  setSelectedCategory,
  onSearchClick,
  onMenuClick,
}: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
  const [keyboardExpanded, setKeyboardExpanded] = useState<string | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/${activeSite}?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const { user, logout } = useAuthStore();
  const activeSite = siteConfig?.id || pathname.split('/')[1] || 'pusat';
  const isArticlePage = pathname.includes('/artikel/');
  const { count: savedArticlesCount } = useSavedArticles(activeSite);
  const articleTopDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (!savedTheme) return;
    setTheme(savedTheme);
    document.documentElement.classList.toggle('dark', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    // Always start in expanded mode after refresh or route navigation.
    setIsCollapsed(false);

    const handleScroll = () => {
      setIsCollapsed(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    // Navigate to homepage with category param
    router.push(`/${activeSite}?cat=${encodeURIComponent(cat)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-brand-dark/60 bg-brand-dark/98 backdrop-blur-sm text-white shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
      <div className={cn(
        "transition-all duration-300 ease-out",
        isCollapsed
          ? "max-h-0 overflow-hidden opacity-0 pointer-events-none"
          : "max-h-28 overflow-visible opacity-100"
      )}>
        <Container className="flex items-center justify-between gap-3 md:gap-6 h-14 md:h-[4.25rem]">
          <div className="flex items-center shrink-0">
            <Link href={`/${activeSite}`} className="flex flex-col items-start group">
              {siteConfig?.logoUrl ? (
                <div className="relative h-7 w-[6.5rem] sm:h-8 sm:w-[8rem]">
                  <SmartImage 
                    src={siteConfig.logoUrl} 
                    alt={siteConfig.name} 
                    fill 
                    context="logo"
                    className="object-contain brightness-0 invert"
                    priority
                  />
                </div>
              ) : (
                <h1 className="font-sans text-[1.15rem] font-extrabold leading-none tracking-[-0.045em] sm:text-[1.4rem]">
                  <span className="text-brand-red transition-colors">BERITA</span>
                  <span className="text-white">KARYA</span>
                </h1>
              )}
              <span className="hidden sm:block text-[9px] tracking-wide mt-0.5 text-brand-text-muted">
                <span className="font-bold text-white/80 italic">Nusantara Berbicara</span>
                <span className="text-brand-red mx-1.5 font-bold">•</span>
                <span className="font-normal">{articleTopDate}</span>
              </span>
            </Link>
          </div>

          <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs xl:max-w-md mx-auto hidden md:block">
            <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-text-muted" />
            <input
              type="text"
              placeholder="Cari berita, topik, penulis..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-brand-dark/70 bg-brand-black/40 py-2 pl-9 pr-4 text-[11px] text-white placeholder:text-brand-text-muted outline-none transition-all focus:border-brand-red/50 focus:bg-brand-black/60 focus:ring-1 focus:ring-brand-red/30"
            />
          </form>

          <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5 shrink-0">
            <button
              onClick={onSearchClick}
              className="md:hidden rounded-full p-3 text-brand-text-muted hover:bg-brand-dark/70 hover:text-white transition-colors"
              aria-label="Cari berita"
            >
              <Search size={18} strokeWidth={1.5} />
            </button>

            {!isArticlePage && (
              <Link
                href={`/${activeSite}?cat=tersimpan`}
                aria-label="Artikel tersimpan"
                className="relative rounded-full p-2 text-brand-text-muted transition-colors hover:bg-brand-dark/70 hover:text-white"
              >
                <Bookmark size={15} strokeWidth={1.5} />
                {savedArticlesCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 inline-flex min-w-4 h-4 items-center justify-center rounded-full bg-brand-red px-1 text-[8px] font-bold text-white leading-none">
                    {savedArticlesCount}
                  </span>
                )}
              </Link>
            )}

            <button
              className="rounded-full p-3 text-brand-text-muted transition-colors hover:bg-brand-dark/70 hover:text-white"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
            >
              {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
            </button>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  aria-label="Menu profil"
                  className="flex items-center gap-1.5 rounded-full p-1 text-white/80 transition-colors hover:bg-brand-black hover:text-white"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white shadow-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden max-w-[88px] truncate text-[11px] font-semibold md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>

                <AnimatePresence>
                  {isProfileOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      role="menu"
                      aria-label="Menu profil"
                      className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-brand-dark bg-brand-black shadow-xl"
                    >
                      <div className="border-b border-brand-dark p-4">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[10px] text-brand-text-muted truncate">{user.email}</p>
                      </div>
                      <div className="p-2" role="none">
                        {['superadmin', 'wapimred', 'reporter', 'kontributor'].includes(user.role) && (
                          <Link
                            href={`/${activeSite}/dashboard`}
                            role="menuitem"
                            className="block rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-white/80 transition-colors hover:bg-brand-dark hover:text-brand-red"
                            onClick={() => setIsProfileOpen(false)}
                          >
                            Dashboard
                          </Link>
                        )}
                        <button
                          role="menuitem"
                          onClick={() => {
                            setIsProfileOpen(false);
                            logout();
                          }}
                          className="w-full text-left rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-brand-red transition-colors hover:bg-brand-red/10"
                        >
                          Keluar
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <Link 
                href="/login"
                className="flex items-center gap-1.5 rounded-full p-1.5 text-white/80 transition-colors hover:bg-brand-black hover:text-white"
              >
                <UserIcon size={15} strokeWidth={1.5} />
                <span className="hidden text-[11px] font-semibold md:inline">Masuk</span>
              </Link>
            )}

            <button
              onClick={onMenuClick}
              className="md:hidden rounded-full p-1.5 text-white/80 transition-colors hover:bg-brand-black hover:text-white"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>
          </div>
        </Container>
      </div>

      <div className="hidden border-t border-brand-dark/50 bg-brand-dark md:block">
        <Container className={cn(
          "relative z-40 hidden items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-brand-text-muted md:flex lg:text-[11px]",
          isCollapsed
            ? "h-8 gap-3"
            : "h-10 gap-5"
        )}>
          {categories.map((cat, index) => {
          const isActive = selectedCategory === cat.slug || cat.subCategories?.some(sub =>
            sub.slug === selectedCategory || sub.subCategories?.some(s => s.slug === selectedCategory)
          );
          const hasSub = cat.subCategories && cat.subCategories.length > 0;
          return (
            <div
              key={cat.slug}
              className="relative flex items-center py-2.5"
              onMouseEnter={() => { setHoveredCategory(cat.name); setKeyboardExpanded(null); }}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleCategoryClick(cat.slug)}
                onKeyDown={(e) => {
                  if (hasSub && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault();
                    setKeyboardExpanded(keyboardExpanded === cat.name ? null : cat.name);
                  }
                  if (e.key === 'Escape') {
                    setKeyboardExpanded(null);
                  }
                }}
                aria-haspopup={hasSub ? 'true' : undefined}
                aria-expanded={hasSub ? (hoveredCategory === cat.name || keyboardExpanded === cat.name) : undefined}
                className={cn(
                  "group relative flex items-center gap-1 transition-all hover:text-white",
                  isActive ? "font-black text-white" : "text-brand-text-muted"
                )}
              >
                {cat.slug === 'tersimpan' && (
                  <Bookmark 
                    size={11} 
                    className={cn(
                      "transition-colors",
                      isActive ? "text-brand-red fill-brand-red/20" : "text-brand-text-muted group-hover:text-white"
                    )} 
                  />
                )}
                <span>{cat.name}</span>
                {cat.slug === 'tersimpan' && savedArticlesCount > 0 && (
                  <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[9px] font-black tracking-normal text-white">
                    {savedArticlesCount}
                  </span>
                )}
                {isActive && (
                  <motion.span 
                    layoutId="activeCategoryLine"
                    className="absolute -bottom-[0.67rem] left-0 h-0.5 w-full bg-brand-red"
                    transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                  />
                )}
                {!isActive && (
                  <span className="absolute -bottom-[0.67rem] left-0 h-0.5 w-0 bg-brand-red transition-all duration-300 group-hover:w-full" />
                )}
              </motion.button>

              <AnimatePresence>
                {(hoveredCategory === cat.name || keyboardExpanded === cat.name) && hasSub && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.12, ease: "easeOut" }}
                    className="absolute left-1/2 top-full z-50 mt-1 flex min-w-[200px] -translate-x-1/2 flex-col gap-0.5 rounded-xl border border-brand-dark bg-brand-black p-1.5 shadow-xl backdrop-blur-md"
                  >
                    {cat.subCategories?.map((sub) => {
                      const isSubActive = selectedCategory === sub.slug;
                      const hasSubSub = sub.subCategories && sub.subCategories.length > 0;
                      return (
                        <div key={sub.slug}>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCategoryClick(sub.slug);
                              setHoveredCategory(null);
                              setKeyboardExpanded(null);
                            }}
                            className={cn(
                              "group/sub flex items-center justify-between rounded-lg px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-brand-dark",
                              isSubActive ? "text-brand-red bg-brand-red/5" : "text-brand-text-muted hover:text-white"
                            )}
                          >
                            <span>{sub.name}</span>
                            <span className={cn(
                              "w-1 h-1 rounded-full bg-brand-red scale-0 transition-transform group-hover/sub:scale-100",
                              isSubActive ? "scale-100" : ""
                            )} />
                          </button>
                          {hasSubSub && (
                            <div className="ml-3 border-l border-brand-dark pl-2 py-0.5">
                              {sub.subCategories!.map((subsub) => {
                                const isSubSubActive = selectedCategory === subsub.slug;
                                return (
                                  <button
                                    key={subsub.slug}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCategoryClick(subsub.slug);
                                      setHoveredCategory(null);
                                      setKeyboardExpanded(null);
                                    }}
                                    className={cn(
                                      "group/subsub flex items-center justify-between rounded-md px-2.5 py-1 text-left text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-brand-dark w-full",
                                      isSubSubActive ? "text-brand-red bg-brand-red/5" : "text-brand-text-muted hover:text-white"
                                    )}
                                  >
                                    <span>{subsub.name}</span>
                                    <span className={cn(
                                      "w-0.5 h-0.5 rounded-full bg-brand-red scale-0 transition-transform group-hover/subsub:scale-100",
                                      isSubSubActive ? "scale-100" : ""
                                    )} />
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
          })}
        </Container>
      </div>

      <div className="border-t border-brand-dark md:hidden bg-brand-dark">
        <Container className="md:hidden">
          <nav className={cn(
            "flex gap-1.5 overflow-x-auto no-scrollbar transition-all duration-300",
            isCollapsed ? "pb-1.5 pt-1.5" : "pb-2.5 pt-2"
          )}>
            {categories.map((cat) => {
          const isActive = selectedCategory === cat.slug || cat.subCategories?.some(sub =>
            sub.slug === selectedCategory || sub.subCategories?.some(s => s.slug === selectedCategory)
          );
          return (
            <button
              key={cat.slug}
              onClick={() => handleCategoryClick(cat.slug)}
              className={cn(
                "flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full border px-3 py-2 text-[11px] font-medium transition-all",
                        isCollapsed && "px-3 py-2 text-[10px]",
                isActive
                  ? "border-brand-red bg-brand-red/10 text-brand-red"
                  : "border-brand-dark text-brand-text-muted bg-brand-black/40"
              )}
            >
              {cat.slug === 'tersimpan' && (
                <Bookmark 
                  size={9} 
                  className={isActive ? "text-brand-red fill-brand-red/20" : "text-brand-text-muted"}
                />
              )}
              <span>{cat.name}</span>
              {cat.slug === 'tersimpan' && savedArticlesCount > 0 && (
                <span className="inline-flex min-w-4 items-center justify-center rounded-full bg-brand-red px-1 py-0.5 text-[9px] font-black tracking-normal text-white">
                  {savedArticlesCount}
                </span>
              )}
            </button>
          );
            })}
          </nav>
        </Container>
      </div>

      {(() => {
        const activeParent = categories.find(cat =>
          cat.slug === selectedCategory || cat.subCategories?.some(sub => sub.slug === selectedCategory)
        );
        if (activeParent && activeParent.subCategories && activeParent.subCategories.length > 0) {
          return (
            <div className={cn(
              "border-t border-brand-dark bg-brand-dark transition-all duration-300 md:hidden",
              isCollapsed && "border-transparent"
            )}>
              <Container className="md:hidden">
                <nav className={cn(
                  "flex gap-1.5 overflow-x-auto no-scrollbar transition-all duration-300",
                  isCollapsed ? "pb-1.5 pt-1" : "pb-2.5 pt-1.5"
                )}>
                  {activeParent.subCategories.map((sub) => {
                    const isSubActive = selectedCategory === sub.slug;
                    return (
                      <button
                        key={sub.slug}
                        onClick={() => handleCategoryClick(sub.slug)}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-[10px] font-medium transition-all",
                          isCollapsed && "px-3 py-2 text-[9px]",
                          isSubActive
                            ? "bg-brand-red text-white"
                            : "bg-brand-black text-brand-text-muted border border-brand-dark"
                        )}
                      >
                        {sub.name}
                      </button>
                    );
                  })}
                </nav>
              </Container>
            </div>
          );
        }
        return null;
      })()}

      {/* Mobile: 3rd level subcategory strip */}
      {(() => {
        const activeParent = categories.find(cat =>
          cat.subCategories?.some(sub =>
            sub.slug === selectedCategory || sub.subCategories?.some(s => s.slug === selectedCategory)
          )
        );
        const activeSub = activeParent?.subCategories?.find(sub =>
          sub.slug === selectedCategory || sub.subCategories?.some(s => s.slug === selectedCategory)
        );
        if (activeSub && activeSub.subCategories && activeSub.subCategories.length > 0) {
          return (
            <div className={cn(
              "border-t border-brand-dark/50 bg-brand-dark/80 transition-all duration-300 md:hidden",
              isCollapsed && "border-transparent"
            )}>
              <Container className="md:hidden">
                <nav className={cn(
                  "flex gap-1.5 overflow-x-auto no-scrollbar transition-all duration-300",
                  isCollapsed ? "pb-1 pt-0.5" : "pb-2 pt-1"
                )}>
                  {activeSub.subCategories.map((subsub) => {
                    const isSubSubActive = selectedCategory === subsub.slug;
                    return (
                      <button
                        key={subsub.slug}
                        onClick={() => handleCategoryClick(subsub.slug)}
                        className={cn(
                          "shrink-0 whitespace-nowrap rounded-lg px-3 py-2 text-[9px] font-medium transition-all",
                          isSubSubActive
                            ? "bg-brand-red/20 text-brand-red border border-brand-red/30"
                            : "bg-brand-black/50 text-brand-text-muted border border-brand-dark/50"
                        )}
                      >
                        {subsub.name}
                      </button>
                    );
                  })}
                </nav>
              </Container>
            </div>
          );
        }
        return null;
      })()}
    </header>
  );
}
