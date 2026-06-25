'use client'

import Link from 'next/link'
import { usePathname, useParams } from 'next/navigation'
import { useAuthStore } from '../../../store/authStore'
import {
  LayoutDashboard,
  LogOut,
  ExternalLink,
  ChevronRight,
  Menu,
  X,
  Moon,
  Sun,
  Megaphone,
  History,
  HelpCircle,
  ChevronLeft,
} from 'lucide-react'
import { ROLE_LABELS } from '../../../lib/constants'
import { useState, useEffect } from 'react'
import { cn } from '../../../lib/utils'
import { useRouter } from 'next/navigation'
import NotificationBell from '../../../components/dashboard/NotificationBell'
import { AIConsentModal } from '../../../components/editor/AIConsentModal'
import { StudioProvider } from '../../../components/dashboard/ads/studio/StudioContext'
import { StudioSidebar } from '../../../components/dashboard/ads/studio/StudioSidebar'

function StudioConditionalWrapper({ isAdStudio, children }: { isAdStudio: boolean; children: React.ReactNode }) {
  return isAdStudio ? <StudioProvider>{children}</StudioProvider> : <>{children}</>
}

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { site } = useParams() as { site: string }
  const { user, logout } = useAuthStore()
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('advertiser-sidebar-collapsed')
      return saved !== null ? saved === 'true' : true
    }
    return true
  })
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
      if (savedTheme) {
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      }
      // Auth guard: redirect non-advertiser away from ads
      if (user && user.role !== 'advertiser' && user.role !== 'superadmin' && user.role !== 'wapimred') {
        router.replace(`/${site}/dashboard`)
      }
    }
  }, [user, router, site])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('theme', newTheme)
    document.documentElement.classList.toggle('dark', newTheme === 'dark')
  }

  const toggleSidebar = () => {
    const next = !isSidebarCollapsed
    setIsSidebarCollapsed(next)
    localStorage.setItem('advertiser-sidebar-collapsed', String(next))
  }

  const isAdStudioRoute = pathname === `/${site}/ads/order`

  // Advertiser nav items
  const navItems = [
    { name: 'Beranda', href: `/${site}/ads`, icon: LayoutDashboard },
    { name: 'Iklan Saya', href: `/${site}/ads`, icon: Megaphone },
    { name: 'Riwayat', href: `/${site}/ads/history`, icon: History },
    { name: 'Bantuan', href: 'https://wa.me/628123456789', icon: HelpCircle, external: true },
  ]

  const activeItem = navItems
    .filter(item => pathname === item.href || (item.href !== `/${site}/ads` && pathname.startsWith(item.href + '/')))
    .sort((a, b) => b.href.length - a.href.length)[0]
  const activeHref = activeItem?.href

  const initials = user?.name
    ?.split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U'

  if (!user) return null

  return (
    <StudioConditionalWrapper isAdStudio={isAdStudioRoute}>
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0f1a] flex flex-col md:flex-row font-sans text-brand-black dark:text-white transition-colors duration-500">

      {/* Sidebar Desktop */}
      <aside className={cn(
        "bg-slate-900 dark:bg-[#050a15] text-white flex-shrink-0 flex-col hidden md:flex border-r border-white/5 transition-all duration-300 sticky top-0 h-screen",
        isAdStudioRoute ? "w-[320px]" : isSidebarCollapsed ? "w-[72px]" : "w-64"
      )}>
        {/* Logo Section — no "Admin Center", no "Portal Aktif" */}
        <div className="p-6 border-b border-white/5">
          <Link href={`/${site}/ads`} className="flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-red rounded-lg flex items-center justify-center shadow-lg shadow-brand-red/30">
              <span className="text-white text-sm font-black">BK</span>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col">
                <h2 className="text-sm font-black tracking-tight uppercase leading-none text-white">
                  Berita<span className="text-brand-red">Karya</span>
                </h2>
                <p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] font-bold mt-0.5">Portal Pengiklan</p>
              </div>
            )}
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 pt-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.href === activeHref
            const Icon = item.icon
            const isExternal = 'external' in item && item.external

            const navContent = (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-red-500 to-brand-red opacity-50 animate-pulse" />
                )}
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-wider relative z-10">{item.name}</span>
                    {isActive && !isExternal && <ChevronRight size={12} className="ml-auto opacity-60 relative z-10" />}
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
                : 'text-gray-400 hover:bg-white/5 hover:text-white'
            )

            if (isExternal) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={linkClasses}
                >
                  {navContent}
                </a>
              )
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                className={linkClasses}
              >
                {navContent}
              </Link>
            )
          })}
        </nav>

        {/* Studio Nav — only on ad order page */}
        {isAdStudioRoute && (
          <div className="flex-1 overflow-y-auto border-t border-white/5 px-3 py-3">
            <StudioSidebar />
          </div>
        )}

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-5 px-2">
            <div className="relative">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-xs font-black text-white shadow-lg flex-shrink-0">
                {initials}
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
            <div className="w-7 h-7 bg-brand-red rounded-md flex items-center justify-center">
              <span className="text-white text-[10px] font-black">BK</span>
            </div>
            <h2 className="text-sm font-black uppercase tracking-tight">Iklan</h2>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <button onClick={toggleTheme} className="p-2 text-gray-400 hover:text-white transition-colors">
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 bg-slate-900 dark:bg-[#0a0f1a] pt-20 px-4 overflow-y-auto pb-10">
          {navItems.map((item) => {
            const isActive = item.href === activeHref
            const Icon = item.icon
            const isExternal = 'external' in item && item.external
            return isExternal ? (
              <a
                key={item.name}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 py-2 px-3 rounded-lg mb-0.5",
                  "text-gray-400"
                )}
              >
                <Icon size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">{item.name}</span>
              </a>
            ) : (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 py-2 px-3 rounded-lg mb-0.5",
                  isActive ? "text-brand-red bg-brand-red/5" : "text-gray-400"
                )}
              >
                <Icon size={16} />
                <span className="text-[11px] font-black uppercase tracking-wider">{item.name}</span>
              </Link>
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
        {/* Content */}
        <div className={cn("flex-1 overflow-y-auto", isAdStudioRoute ? "p-0" : "p-6 md:p-8")}>
          <div className={cn(isAdStudioRoute ? "h-full" : "max-w-7xl mx-auto animate-fade-in")}>
            {children}
          </div>
        </div>
      </main>

      <AIConsentModal />
    </div>
    </StudioConditionalWrapper>
  )
}
