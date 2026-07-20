'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useAuthStore } from '../../../../store/authStore'
import {
  FileText,
  Tag,
  LayoutDashboard,
  Image as ImageIcon,
  Settings,
  LogOut,
  ExternalLink,
  ChevronRight,
  Users as UsersIcon,
  Menu,
  X,
  Search,
  Moon,
  Sun,
  ClipboardCheck,
  Shield,
  Activity,
  Calendar,
  MessageSquare,
  Mail,
  Lock,
  User,
  ChevronLeft,
} from 'lucide-react'
import BackButton from '../../../../components/ui/BackButton'
import { ROLE_LABELS } from '../../../../lib/constants'
import { useState, useEffect } from 'react'
import { cn } from '../../../../lib/utils'
import { useRouter } from 'next/navigation'
import NotificationBell from '../../../../components/dashboard/NotificationBell'
import { AIConsentModal } from '../../../../components/editor/AIConsentModal'
import { SiteSwitcher } from '../../../../components/dashboard/SiteSwitcher'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { site } = useParams() as { site: string }
  const { user, logout, lastActiveSite, setLastActiveSite } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [globalSearch, setGlobalSearch] = useState('')
  const [isMobile, setIsMobile] = useState(false)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const router = useRouter()

  const toggleExpandedMenu = (menuName: string) => {
    setExpandedMenus(prev =>
      prev.includes(menuName) ? prev.filter(m => m !== menuName) : [...prev, menuName]
    )
  }

  // Detect mobile/PWA for conditional navigation behavior
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
      if (savedTheme) {
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      }
      if (user) {
        if (
          user.role !== 'superadmin' &&
          user.siteId &&
          user.siteId !== site
        ) {
          router.replace(`/${user.siteId}/dashboard`)
          return
        }

        if (user.role === 'superadmin' && !lastActiveSite) {
          setLastActiveSite(site)
        }

        const allowedRoles = ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro', 'reporter', 'kontributor', 'advertiser']
        if (!allowedRoles.includes(user.role)) {
          router.push(`/${site}`)
          return
        }

        const isKycRequired = ['reporter', 'kontributor', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)
        const targetKycPath = `/${site}/dashboard/kyc`

        if (isKycRequired && !user.isVerified && pathname !== targetKycPath) {
          router.push(targetKycPath)
        }
      }
    }
  }, [user, router, site, pathname, lastActiveSite, setLastActiveSite])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      console.log(`%c[NAVIGASI] Pindah ke halaman: ${pathname}`, 'color: #10b981; font-weight: bold; font-size: 12px; padding: 4px; border: 1px solid #10b981; border-radius: 4px;');
    }
  }, [pathname])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev)
  }

  // Navigation for admin roles only (advertiser has its own layout)
  const navSections = [
    {
      label: 'Utama',
      items: [
        { name: 'Ringkasan', href: `/${site}/dashboard`, icon: LayoutDashboard, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro', 'reporter', 'kontributor'] },
        { name: 'Post', href: `/${site}/dashboard/articles`, icon: FileText, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro', 'reporter', 'kontributor'] },
        { name: 'Media', href: `/${site}/dashboard/media`, icon: ImageIcon, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro', 'reporter', 'kontributor'] },
        { name: 'Profil Saya', href: `/${site}/dashboard/profile`, icon: User, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro', 'reporter', 'kontributor'] },
        ...(user && !user.isVerified ? [{ name: 'Verifikasi KYC', href: `/${site}/dashboard/kyc`, icon: ClipboardCheck, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro', 'reporter', 'kontributor'] }] : []),
      ]
    },
    {
      label: 'Editorial',
      items: [
        { name: 'Antrian Review', href: `/${site}/dashboard/review`, icon: ClipboardCheck, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'] },
        { name: 'Antrian KYC', href: `/${site}/dashboard/review/kyc`, icon: Shield, roles: ['superadmin', 'wapimred', 'kabiro'] },
        { name: 'Kalender', href: `/${site}/dashboard/calendar`, icon: Calendar, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'] },
        { name: 'Kategori', href: `/${site}/dashboard/categories`, icon: Tag, roles: ['superadmin'] },
        { name: 'Iklan & Banner', href: `/${site}/dashboard/ads`, icon: ImageIcon, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'] },
        { name: 'Komentar', href: `/${site}/dashboard/comments`, icon: MessageSquare, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'] },
      ]
    },
    {
      label: 'Administrasi',
      items: [
        { name: 'Monitor Tim', href: `/${site}/dashboard/team`, icon: UsersIcon, roles: ['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro'] },
        { name: 'Pengguna', href: `/${site}/dashboard/users`, icon: UsersIcon, roles: ['superadmin', 'wapimred', 'kabiro'] },
        { name: 'Undangan', href: `/${site}/dashboard/invitations`, icon: Mail, roles: ['superadmin', 'wapimred', 'kabiro'] },
        { name: 'Pengaturan', href: `/${site}/dashboard/settings`, icon: Settings, roles: ['superadmin', 'wapimred'] },
      ]
    },
    ...(user?.role === 'superadmin' ? [{
      label: 'Superadmin',
      items: [
        { name: 'Manajemen Situs', href: `/${site}/dashboard/admin`, icon: Settings, roles: ['superadmin'] },
        {
          name: 'Hak Akses',
          href: `/${site}/dashboard/admin/permissions`,
          icon: Lock,
          roles: ['superadmin'],
          expandable: true,
          children: [
            { name: 'Wapimred', href: `/${site}/dashboard/admin/permissions/wapimred`, roles: ['superadmin'] },
            { name: 'Kaperwil', href: `/${site}/dashboard/admin/permissions/kaperwil`, roles: ['superadmin'] },
            { name: 'Korwil', href: `/${site}/dashboard/admin/permissions/korwil`, roles: ['superadmin'] },
            { name: 'Kabiro', href: `/${site}/dashboard/admin/permissions/kabiro`, roles: ['superadmin'] },
          ]
        },
        { name: 'AI Dashboard', href: `/${site}/dashboard/admin/ai-usage`, icon: Activity, roles: ['superadmin'] },
        { name: 'Setelan Iklan', href: `/${site}/dashboard/ads/payment-config`, icon: Settings, roles: ['superadmin'] },
      ]
    }] : [])
  ]

  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  const allNavItems = navSections.flatMap(s => s.items)
  const activeItem = allNavItems
    .filter(item => pathname === item.href || (item.href !== `/${site}/dashboard` && pathname.startsWith(item.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0]
  const activeHref = activeItem?.href
  const articleListHref = `/${site}/dashboard/articles`
  const articleEditorPrefix = `${articleListHref}/`
  const articleEditorSegment = pathname.startsWith(articleEditorPrefix)
    ? pathname.slice(articleEditorPrefix.length)
    : ''
  const isArticleEditorRoute = articleEditorSegment === 'new' || Boolean(articleEditorSegment && !articleEditorSegment.includes('/'))
  const editorTitle = articleEditorSegment === 'new' ? 'Tulis Post' : 'Editor Post'

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a] flex flex-col md:flex-row font-sans text-brand-black dark:text-white transition-colors duration-500">
      {isArticleEditorRoute ? (
        <>
          <aside className="hidden md:flex w-64 flex-shrink-0 flex-col border-r border-gray-200/80 bg-white/95 dark:border-white/5 dark:bg-[#050a15]">
            <div className="border-b border-gray-100 px-6 py-6 dark:border-white/5">
              <Link href={articleListHref} className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-red shadow-lg shadow-brand-red/30 overflow-hidden">
                  <img src="/logos/logo.png" alt="BeritaKarya" className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                    Ruang Editor
                  </p>
                  <h2 className="mt-1 text-sm font-black uppercase tracking-tight text-brand-black dark:text-white">
                    {editorTitle}
                  </h2>
                </div>
              </Link>
            </div>

            <div className="px-4 py-4">
              <BackButton
                fallbackHref={articleListHref}
                label="Kembali ke Daftar Post"
                className="flex items-center gap-3 rounded-2xl border border-gray-200/80 bg-gray-50/80 px-4 py-3 text-sm font-semibold text-brand-black transition-colors hover:border-brand-red/20 hover:text-brand-red dark:border-white/10 dark:bg-white/5 dark:text-white"
                iconSize={16}
              />
            </div>

            <div className="px-4">
              <div className="rounded-[24px] border border-gray-200/80 bg-white/90 p-4 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                  Portal Aktif
                </p>
                <p className="mt-2 text-sm font-semibold uppercase tracking-tight text-brand-black dark:text-white">
                  {site === 'pusat' ? 'Pusat (Nasional)' : site.charAt(0).toUpperCase() + site.slice(1)}
                </p>
                <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Mode menulis dipangkas agar fokus tetap pada judul, konten, dan workflow editorial.
                </p>
              </div>
            </div>

            <div className="mt-4 flex-1 px-4">
              <div className="rounded-[24px] border border-dashed border-gray-200 bg-white/80 p-4 dark:border-white/10 dark:bg-white/[0.02]">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500 dark:text-gray-400">
                  Akses Cepat
                </p>
                <div className="mt-3 space-y-2">
                  <Link
                    href={articleListHref}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-red dark:hover:bg-white/5"
                  >
                    <FileText size={14} />
                    Daftar Post
                  </Link>
                  <Link
                    href={`/${site}`}
                    target={isMobile ? undefined : '_blank'}
                    className="flex items-center gap-3 rounded-2xl px-3 py-3 text-xs font-black uppercase tracking-[0.18em] text-gray-500 transition-colors hover:bg-gray-50 hover:text-brand-red dark:hover:bg-white/5"
                  >
                    <ExternalLink size={14} />
                    Lihat Portal
                  </Link>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-100 p-4 dark:border-white/5">
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gray-50/80 px-3 py-3 dark:bg-white/5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-red to-red-900 text-xs font-black text-white shadow-lg overflow-hidden">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-xs font-black text-brand-black dark:text-white">{user?.name}</p>
                  <p className="mt-1 text-[8px] font-black uppercase tracking-[0.22em] text-brand-red">
                    {ROLE_LABELS[user?.role || ''] || user?.role}
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={toggleTheme}
                  className="flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-3 py-3 text-gray-500 transition-colors hover:text-brand-red dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                  title="Ganti tema"
                >
                  {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
                </button>
                <button
                  onClick={logout}
                  className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-3 text-[10px] font-black uppercase tracking-[0.18em] text-gray-500 transition-colors hover:border-red-200 hover:text-red-500 dark:border-white/10 dark:bg-white/5 dark:text-gray-300"
                >
                  <LogOut size={14} />
                  Keluar
                </button>
              </div>
            </div>
          </aside>

          <main className="flex-1 min-h-screen overflow-x-hidden">
            {children}
          </main>
        </>
      ) : (
        <>
      {/* Sidebar Desktop */}
      <aside className={cn(
        "bg-slate-900 dark:bg-[#050a15] text-white flex-shrink-0 flex-col hidden md:flex border-r border-white/5 transition-all duration-300 sticky top-0 h-screen",
        isSidebarCollapsed ? "w-[72px]" : "w-64"
      )}>
        {/* Logo Section */}
        <div className="p-6 border-b border-white/5">
          <Link href={`/${site}/dashboard`} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-brand-red/30 overflow-hidden">
              <img src="/logos/logo.png" alt="BeritaKarya" className="w-full h-full object-contain" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <h2 className="text-sm font-black tracking-tight uppercase leading-none text-white">
                  Berita<span className="text-brand-red">Karya</span>
                </h2>
                <p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-0.5">Admin Center</p>
              </div>
            )}
          </Link>
        </div>

        {/* Site Switcher */}
        <SiteSwitcher
          activeSiteId={site}
          isCollapsed={isSidebarCollapsed}
        />

        {/* Navigation Sections */}
        <nav className="flex-1 px-3 pt-4 space-y-6 overflow-y-auto">
          {navSections.map((section) => {
            const filteredItems = section.items.filter(item => user && item.roles.includes(user.role))
            if (filteredItems.length === 0) return null
            return (
              <div key={section.label}>
                {!isSidebarCollapsed && (
                  <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-2">{section.label}</p>
                )}
                <div className="space-y-0.5">
                  {filteredItems.map((item) => {
                    const isActive = item.href === activeHref
                    const isChildActive = item.children?.some((child: { href: string }) => pathname === child.href || pathname.startsWith(child.href + '/'))
                    const isExpanded = expandedMenus.includes(item.name) || isChildActive
                    const isKycRequired = user && ['reporter', 'kontributor', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)
                    const isLocked = isKycRequired && !user.isVerified && item.href !== `/${site}/dashboard/kyc`
                    const isExternal = item.href.startsWith('http')
                    const Icon = isLocked ? Lock : item.icon

                    // Expandable menu item
                    if (item.expandable && item.children) {
                      return (
                        <div key={item.name}>
                          <button
                            onClick={() => toggleExpandedMenu(item.name)}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden w-full text-left",
                              isChildActive
                                ? 'bg-brand-red/10 text-brand-red'
                                : 'text-gray-400 hover:bg-white/5 hover:text-white'
                            )}
                          >
                            <Icon size={17} strokeWidth={isChildActive ? 2.5 : 1.8} className="relative z-10 flex-shrink-0" />
                            {!isSidebarCollapsed && (
                              <>
                                <span className="text-[11px] font-black uppercase tracking-wider relative z-10 flex-1">{item.name}</span>
                                <ChevronRight
                                  size={12}
                                  className={cn(
                                    "relative z-10 transition-transform duration-200",
                                    isExpanded ? "rotate-90" : ""
                                  )}
                                />
                              </>
                            )}
                            {isSidebarCollapsed && (
                              <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                                {item.name}
                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                              </div>
                            )}
                          </button>

                          {/* Sub-items */}
                          {isExpanded && !isSidebarCollapsed && (
                            <div className="ml-6 mt-1 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-3">
                              {item.children.map((child: { name: string; href: string; roles: string[] }) => {
                                const isChildItemActive = pathname === child.href || pathname.startsWith(child.href + '/')
                                return (
                                  <Link
                                    key={child.name}
                                    href={child.href}
                                    className={cn(
                                      "flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200 text-[11px] font-bold uppercase tracking-wider",
                                      isChildItemActive
                                        ? 'bg-brand-red text-white'
                                        : 'text-gray-500 hover:text-white hover:bg-white/5'
                                    )}
                                  >
                                    {child.name}
                                  </Link>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    }

                    // Regular menu item
                    const navContent = (
                      <>
                        {isActive && !isLocked && (
                          <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-red-500 to-brand-red opacity-50 animate-pulse" />
                        )}
                        <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10 flex-shrink-0" />
                        {!isSidebarCollapsed && (
                          <>
                            <span className="text-[11px] font-black uppercase tracking-wider relative z-10">{item.name}</span>
                            {isActive && !isLocked && !isExternal && <ChevronRight size={12} className="ml-auto opacity-60 relative z-10" />}
                            {isLocked && <Lock size={12} className="ml-auto text-gray-500 relative z-10" />}
                            {isExternal && <ExternalLink size={10} className="ml-auto opacity-40 relative z-10" />}
                          </>
                        )}
                        {isSidebarCollapsed && (
                          <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase tracking-wider rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50 shadow-lg">
                            {item.name}
                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-800" />
                          </div>
                        )}
                      </>
                    )

                    const linkClasses = cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden",
                      isActive
                        ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white',
                      isLocked && "opacity-40 hover:bg-transparent cursor-not-allowed text-gray-500"
                    )

                    if (isExternal) {
                      return (
                        <a
                          key={item.name}
                          href={isLocked ? '#' : item.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => { if (isLocked) e.preventDefault() }}
                          className={linkClasses}
                        >
                          {navContent}
                        </a>
                      )
                    }

                    return (
                      <Link
                        key={item.name}
                        href={isLocked ? '#' : item.href}
                        onClick={(e) => { if (isLocked) e.preventDefault() }}
                        className={linkClasses}
                      >
                        {navContent}
                      </Link>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </nav>

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-5 px-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-xs font-black text-white shadow-lg flex-shrink-0 overflow-hidden">
                {user?.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black truncate text-white leading-tight tracking-tight">{user?.name}</span>
                <span className="text-[8px] text-brand-red font-black uppercase tracking-[0.2em] mt-1">
                  {ROLE_LABELS[user?.role || ''] || user?.role}
                </span>
              </div>
            )}
          </div>
          <div className="flex gap-2">
            <button
              onClick={logout}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-3 text-[9px] font-black uppercase tracking-[0.3em] text-gray-500 hover:text-white hover:bg-red-600 transition-all rounded-xl border border-white/5 hover:border-red-500 shadow-sm"
            >
              <LogOut size={14} />
              {!isSidebarCollapsed && 'Keluar'}
            </button>
            <button
              onClick={toggleSidebar}
              className="flex items-center justify-center px-3 py-3 text-gray-500 hover:text-white hover:bg-white/5 transition-all rounded-xl border border-white/5 shadow-sm"
              title={isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Navbar */}
      <div className="md:hidden bg-slate-900 dark:bg-[#050a15] text-white p-4 flex justify-between items-center sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-3">
          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
            {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-brand-red rounded-md flex items-center justify-center overflow-hidden">
              <img src="/logos/logo.png" alt="BeritaKarya" className="w-full h-full object-contain" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-tight">Admin</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white transition-colors">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
          <Link href={`/${site}`} target={isMobile ? undefined : '_blank'} className="p-2 text-brand-red hover:bg-brand-red/10 rounded-lg transition-colors">
            <ExternalLink size={18} />
          </Link>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 dark:bg-[#0a0f1a] pt-20 px-4 overflow-y-auto pb-10">
          {/* Mobile: Site Switcher */}
          <div className="mb-4 px-1">
            <SiteSwitcher
              activeSiteId={site}
              isCollapsed={false}
            />
          </div>
          {navSections.map((section) => {
            const filteredItems = section.items.filter(item => user && item.roles.includes(user.role))
            if (filteredItems.length === 0) return null
            return (
              <div key={section.label} className="mb-4">
                <p className="px-3 text-[9px] font-black text-gray-600 uppercase tracking-[0.2em] mb-1.5">{section.label}</p>
                {filteredItems.map((item) => {
                  const isActive = item.href === activeHref
                  const isChildActive = item.children?.some((child: { href: string }) => pathname === child.href || pathname.startsWith(child.href + '/'))
                  const isExpanded = expandedMenus.includes(item.name) || isChildActive
                  const isKycRequired = user && ['reporter', 'kontributor', 'wapimred', 'kaperwil', 'korwil', 'kabiro'].includes(user.role)
                  const isLocked = isKycRequired && !user.isVerified && item.href !== `/${site}/dashboard/kyc`
                  const Icon = isLocked ? Lock : item.icon

                  // Expandable menu item
                  if (item.expandable && item.children) {
                    return (
                      <div key={item.name}>
                        <button
                          onClick={() => toggleExpandedMenu(item.name)}
                          className={cn(
                            "flex items-center gap-3 py-2 px-3 rounded-lg mb-0.5 w-full text-left",
                            isChildActive ? "text-brand-red bg-brand-red/5" : "text-gray-400"
                          )}
                        >
                          <Icon size={16} />
                          <span className="text-[11px] font-black uppercase tracking-wider flex-1">{item.name}</span>
                          <ChevronRight
                            size={14}
                            className={cn(
                              "transition-transform duration-200",
                              isExpanded ? "rotate-90" : ""
                            )}
                          />
                        </button>

                        {/* Sub-items */}
                        {isExpanded && (
                          <div className="ml-6 border-l-2 border-gray-700 pl-3 mb-2">
                            {item.children.map((child: { name: string; href: string; roles: string[] }) => {
                              const isChildItemActive = pathname === child.href || pathname.startsWith(child.href + '/')
                              return (
                                <Link
                                  key={child.name}
                                  href={child.href}
                                  onClick={() => setIsMobileMenuOpen(false)}
                                  className={cn(
                                    "flex items-center gap-2 py-1.5 px-3 rounded-lg mb-0.5 text-[11px] font-bold uppercase tracking-wider",
                                    isChildItemActive ? "text-brand-red bg-brand-red/5" : "text-gray-500"
                                  )}
                                >
                                  {child.name}
                                </Link>
                              )
                            })}
                          </div>
                        )}
                      </div>
                    )
                  }

                  // Regular menu item
                  return (
                    <Link
                      key={item.name}
                      href={isLocked ? '#' : item.href}
                      onClick={(e) => {
                        if (isLocked) {
                          e.preventDefault()
                        } else {
                          setIsMobileMenuOpen(false)
                        }
                      }}
                      className={cn(
                        "flex items-center gap-3 py-2 px-3 rounded-lg mb-0.5",
                        isActive ? "text-brand-red bg-brand-red/5" : "text-gray-400",
                        isLocked && "opacity-40 cursor-not-allowed text-gray-600"
                      )}
                    >
                      <Icon size={16} />
                      <span className="text-[11px] font-black uppercase tracking-wider">{item.name}</span>
                    </Link>
                  )
                })}
              </div>
            )
          })}
          <div className="border-t border-white/5 pt-3 mt-3">
            <button onClick={logout} className="flex items-center gap-3 py-2 px-3 text-red-400 w-full">
              <LogOut size={16} />
              <span className="text-[11px] font-black uppercase tracking-wider">Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className="hidden md:flex h-16 bg-white dark:bg-slate-900/50 border-b border-gray-100 dark:border-white/5 items-center justify-between px-6 flex-shrink-0 backdrop-blur-sm relative z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="hidden md:flex p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-400"
            >
              <Menu size={18} />
            </button>
            <div className="relative hidden md:block">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300" />
              <input
                type="text"
                placeholder="Cari artikel..."
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && globalSearch) {
                    router.push(`/${site}/dashboard/articles?search=${encodeURIComponent(globalSearch)}`)
                    setGlobalSearch('')
                  }
                }}
                className="pl-9 pr-4 py-2 bg-gray-50 dark:bg-white/5 border border-transparent focus:border-brand-red/20 rounded-lg text-xs w-64 outline-none transition-all text-brand-black dark:text-white placeholder:text-gray-300"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="hidden md:flex p-2 text-gray-400 hover:text-brand-black dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
            </button>
            <NotificationBell />
            <div className="w-px h-6 bg-gray-100 dark:bg-white/5 mx-1 hidden md:block" />
            <Link
              href={`/${site}`}
              target={isMobile ? undefined : '_blank'}
              className="flex items-center gap-2 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all text-gray-400 hover:text-brand-red"
            >
              <ExternalLink size={12} /> <span className="hidden sm:inline">Portal</span>
            </Link>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in">
            {children}
          </div>
        </div>
      </main>
        </>
      )}

      <AIConsentModal />
    </div>
  )
}
