'use client';

import { Search, User as UserIcon, Moon, Sun, Bookmark } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { SmartImage } from '../ui/SmartImage';
import { cn } from '../../lib/utils';
import { useRouter, usePathname } from 'next/navigation';
import { Container } from './Container';
import { NavbarTicker } from './NavbarTicker';

import { CategoryItem, type SiteConfig } from '../../lib/constants';
import { useSavedArticles } from '../../hooks/useSavedArticles';

interface NavbarProps {
  siteConfig: SiteConfig;
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
  const profileRef = useRef<HTMLDivElement>(null);

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
    setIsCollapsed(false);
    if (isArticlePage) return;

    const handleScroll = () => {
      setIsCollapsed(window.scrollY > 24);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => window.removeEventListener('scroll', handleScroll);
  }, [pathname, isArticlePage]);

  // Close profile menu on outside click
  useEffect(() => {
    if (!isProfileOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isProfileOpen]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const handleCategoryClick = (cat: string) => {
    setSelectedCategory(cat);
    router.push(`/${activeSite}?cat=${encodeURIComponent(cat)}`);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white/98 backdrop-blur-sm text-gray-900 shadow-sm dark:border-white/10 dark:bg-[#0a0f1a]/98 dark:text-white dark:shadow-[0_2px_20px_rgba(0,0,0,0.35)]">
      {isArticlePage ? (
        <Container className="relative flex items-center justify-between h-14 md:h-[4.25rem]">
          {/* Left: Menu Hamburger + Search Icon */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              onClick={onMenuClick}
              className="rounded-full p-2 text-gray-700 hover:bg-gray-100 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              aria-label="Menu"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
              </svg>
            </button>

            <button
              onClick={onSearchClick}
              className="rounded-full p-2.5 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
              aria-label="Cari berita"
            >
              <Search size={16} strokeWidth={1.8} />
            </button>
          </div>

          {/* Center: Brand Logo/Name (Absolute Centered) */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-auto">
            <Link href={`/${activeSite}`} className="flex flex-col items-center group">
              {siteConfig?.logoUrl ? (
                <div className="relative h-7 w-[6.5rem] sm:h-8 sm:w-[8rem]">
                  <SmartImage
                    src={siteConfig.logoUrl}
                    alt={siteConfig.name}
                    fill
                    context="logo"
                    className="object-contain dark:brightness-0 dark:invert"
                    priority
                  />
                </div>
              ) : (
                <h1 className="font-sans text-[1.15rem] font-extrabold leading-none tracking-[-0.045em] sm:text-[1.4rem]">
                  <span className="text-brand-red transition-colors">BERITA</span>
                  <span className="text-gray-900 dark:text-white">KARYA</span>
                </h1>
              )}
            </Link>
          </div>

          {/* Right: Theme Toggle & Login/Profile */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            <button
              className="rounded-full p-2.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={toggleTheme}
              aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
            >
              {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
            </button>

            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-haspopup="menu"
                  aria-expanded={isProfileOpen}
                  aria-label="Menu profil"
                  className="flex items-center gap-1.5 rounded-full p-1 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full object-cover shadow-sm" />
                  ) : (
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white shadow-sm">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="hidden max-w-[88px] truncate text-[11px] font-semibold md:inline">
                    {user.name.split(' ')[0]}
                  </span>
                </button>
                <div
                  role="menu"
                  aria-label="Menu profil"
                  className={cn(
                    'absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#111827] transition-all duration-150 origin-top-right',
                    isProfileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  )}
                >
                  <div className="border-b border-gray-100 p-4 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-900 truncate dark:text-white">{user!.name}</p>
                    <p className="text-[10px] text-gray-500 truncate dark:text-white/60">{user!.email}</p>
                  </div>
                  <div className="p-2" role="none">
                    {['superadmin', 'wapimred', 'reporter', 'kontributor'].includes(user!.role) && (
                      <Link
                        href={`/${activeSite}/dashboard`}
                        role="menuitem"
                        className="block rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-red dark:text-white/80 dark:hover:bg-white/10"
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
                </div>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full p-1.5 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
              >
                <UserIcon size={15} strokeWidth={1.5} />
                <span className="hidden text-[11px] font-semibold md:inline">Masuk</span>
              </Link>
            )}
          </div>
        </Container>
      ) : (
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
                      className="object-contain dark:brightness-0 dark:invert"
                      priority
                    />
                  </div>
                ) : (
                  <h1 className="font-sans text-[1.15rem] font-extrabold leading-none tracking-[-0.045em] sm:text-[1.4rem]">
                    <span className="text-brand-red transition-colors">BERITA</span>
                    <span className="text-gray-900 dark:text-white">KARYA</span>
                  </h1>
                )}
                <span className="hidden sm:block text-[9px] tracking-wide mt-0.5 text-gray-500 dark:text-white/60">
                  <span className="font-bold text-gray-700 dark:text-white/80 italic">Nusantara Berbicara</span>
                  <span className="text-brand-red mx-1.5 font-bold">•</span>
                  <span className="font-normal">{articleTopDate}</span>
                </span>
              </Link>
            </div>

            <form onSubmit={handleSearchSubmit} className="relative flex-1 max-w-xs xl:max-w-md mx-auto hidden md:block">
              <Search size={13} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white/60" />
              <input
                type="text"
                placeholder="Cari berita, topik, penulis..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-full border border-gray-200 bg-gray-100 py-2 pl-9 pr-4 text-[11px] text-gray-900 placeholder:text-gray-400 outline-none transition-all focus:border-brand-red/50 focus:bg-gray-50 focus:ring-1 focus:ring-brand-red/30 dark:border-white/10 dark:bg-white/5 dark:text-white dark:placeholder:text-white/60 dark:focus:bg-white/10"
              />
            </form>

            <div className="flex min-w-0 items-center justify-end gap-1 sm:gap-1.5 shrink-0">
              <button
                onClick={onSearchClick}
                className="md:hidden rounded-full p-3 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
                aria-label="Cari berita"
              >
                <Search size={18} strokeWidth={1.5} />
              </button>

              {!isArticlePage && (
                <Link
                  href={`/${activeSite}?cat=tersimpan`}
                  aria-label="Artikel tersimpan"
                  className="relative rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
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
                className="rounded-full p-3 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/60 dark:hover:bg-white/10 dark:hover:text-white"
                onClick={toggleTheme}
                aria-label={theme === 'light' ? 'Aktifkan mode gelap' : 'Aktifkan mode terang'}
              >
                {theme === 'light' ? <Moon size={16} strokeWidth={1.5} /> : <Sun size={16} strokeWidth={1.5} />}
              </button>

              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    aria-haspopup="menu"
                    aria-expanded={isProfileOpen}
                    aria-label="Menu profil"
                    className="flex items-center gap-1.5 rounded-full p-1 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                  >
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="h-6 w-6 rounded-full object-cover shadow-sm" />
                    ) : (
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-red text-[10px] font-bold text-white shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="hidden max-w-[88px] truncate text-[11px] font-semibold md:inline">
                      {user.name.split(' ')[0]}
                    </span>
                  </button>
                  <div
                  role="menu"
                  aria-label="Menu profil"
                  className={cn(
                    'absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl dark:border-white/10 dark:bg-[#111827] transition-all duration-150 origin-top-right',
                    isProfileOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 -translate-y-2 pointer-events-none'
                  )}
                >
                  <div className="border-b border-gray-100 p-4 dark:border-white/10">
                    <p className="text-xs font-bold text-gray-900 truncate dark:text-white">{user!.name}</p>
                    <p className="text-[10px] text-gray-500 truncate dark:text-white/60">{user!.email}</p>
                  </div>
                  <div className="p-2" role="none">
                    {['superadmin', 'wapimred', 'reporter', 'kontributor'].includes(user!.role) && (
                      <Link
                        href={`/${activeSite}/dashboard`}
                        role="menuitem"
                        className="block rounded-lg px-3 py-2 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-700 transition-colors hover:bg-gray-100 hover:text-brand-red dark:text-white/80 dark:hover:bg-white/10"
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
                </div>
                </div>
              ) : (
                <Link
                  href="/login"
                  className="flex items-center gap-1.5 rounded-full p-1.5 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <UserIcon size={15} strokeWidth={1.5} />
                  <span className="hidden text-[11px] font-semibold md:inline">Masuk</span>
                </Link>
              )}

              <button
                onClick={onMenuClick}
                className="md:hidden rounded-full p-1.5 text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-white/80 dark:hover:bg-white/10 dark:hover:text-white"
                aria-label="Menu"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                </svg>
              </button>
            </div>
          </Container>
        </div>
      )}
      {!isArticlePage && (
        <div className="hidden border-t border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-[#0a0f1a] md:block">
          {/* Info Pasar + Terkini Ticker */}
          <div className="border-b border-gray-200 dark:border-white/10">
            <Container className="flex h-7 items-center overflow-hidden">
              <NavbarTicker site={activeSite} />
            </Container>
          </div>
          <Container className={cn(
            "relative z-40 hidden items-center justify-center text-[10px] font-semibold uppercase tracking-widest text-gray-500 dark:text-white/60 md:flex lg:text-[11px]",
            isCollapsed
              ? "h-8 gap-3"
              : "h-10 gap-5"
          )}>
            {categories.map((cat) => {
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
                <button
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
                    "group relative flex items-center gap-1 transition-all hover:text-gray-900 dark:hover:text-white",
                    isActive ? "font-black text-gray-900 dark:text-white" : "text-gray-500 dark:text-white/60"
                  )}
                >
                  {cat.slug === 'tersimpan' && (
                    <Bookmark
                      size={11}
                      className={cn(
                        "transition-colors",
                        isActive ? "text-brand-red fill-brand-red/20" : "text-gray-400 group-hover:text-gray-900 dark:text-white/60 dark:group-hover:text-white"
                      )}
                    />
                  )}
                  <span>{cat.name}</span>
                  {cat.slug === 'tersimpan' && savedArticlesCount > 0 && (
                    <span className="inline-flex min-w-5 items-center justify-center rounded-full bg-brand-red px-1.5 py-0.5 text-[9px] font-black tracking-normal text-white">
                      {savedArticlesCount}
                    </span>
                  )}
                  <span className={cn(
                    "absolute -bottom-[0.67rem] left-0 h-0.5 bg-brand-red transition-all duration-200",
                    isActive ? "w-full" : "w-0 group-hover:w-full"
                  )} />
                </button>

                {/* Subcategory dropdown */}
                {(hoveredCategory === cat.name || keyboardExpanded === cat.name) && hasSub && (
                  <div
                    className="absolute left-1/2 top-full z-50 mt-1 flex min-w-[200px] -translate-x-1/2 flex-col gap-0.5 rounded-xl border border-gray-200 bg-white p-1.5 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-[#111827] transition-all duration-150 opacity-100 translate-y-0"
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
                              "group/sub flex items-center justify-between rounded-lg px-3 py-1.5 text-left text-[10px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-100 dark:hover:bg-white/10",
                              isSubActive ? "text-brand-red bg-brand-red/5" : "text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
                            )}
                          >
                            <span>{sub.name}</span>
                            <span className={cn(
                              "w-1 h-1 rounded-full bg-brand-red scale-0 transition-transform group-hover/sub:scale-100",
                              isSubActive ? "scale-100" : ""
                            )} />
                          </button>
                          {hasSubSub && (
                            <div className="ml-3 border-l border-gray-200 pl-2 py-0.5 dark:border-white/10">
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
                                      "group/subsub flex items-center justify-between rounded-md px-2.5 py-1 text-left text-[9px] font-bold uppercase tracking-wider transition-colors hover:bg-gray-100 dark:hover:bg-white/10 w-full",
                                      isSubSubActive ? "text-brand-red bg-brand-red/5" : "text-gray-500 hover:text-gray-900 dark:text-white/60 dark:hover:text-white"
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
                  </div>
                )}
              </div>
            );
            })}
          </Container>
        </div>
      )}

      {!isArticlePage && (
        <div className="border-t border-gray-200 md:hidden bg-white dark:border-white/10 dark:bg-[#0a0f1a]">
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
                    : "border-gray-200 text-gray-500 bg-gray-100 dark:border-white/10 dark:text-white/60 dark:bg-white/5"
                )}
              >
                {cat.slug === 'tersimpan' && (
                  <Bookmark
                    size={9}
                    className={isActive ? "text-brand-red fill-brand-red/20" : "text-gray-400 dark:text-white/60"}
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
      )}

      {!isArticlePage && (() => {
        const activeParent = categories.find(cat =>
          cat.slug === selectedCategory || cat.subCategories?.some(sub => sub.slug === selectedCategory)
        );
        if (activeParent && activeParent.subCategories && activeParent.subCategories.length > 0) {
          return (
            <div className={cn(
              "border-t border-gray-200 bg-white transition-all duration-300 md:hidden dark:border-white/10 dark:bg-[#0a0f1a]",
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
                            : "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-white/60 dark:border-white/10"
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
      {!isArticlePage && (() => {
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
              "border-t border-gray-200 bg-gray-50 transition-all duration-300 md:hidden dark:border-white/10 dark:bg-[#0a0f1a]/80",
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
                            : "bg-gray-100 text-gray-500 border border-gray-200 dark:bg-white/5 dark:text-white/60 dark:border-white/10"
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
