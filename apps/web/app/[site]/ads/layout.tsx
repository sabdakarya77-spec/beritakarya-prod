'use client'

import Link from 'next/link'
import { usePathname, useParams, useSearchParams } from 'next/navigation'
import { useAuthStore } from '../../../store/authStore'
import {
  LayoutDashboard,
  LogOut,
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Menu,
  X,
  Moon,
  Sun,
  Megaphone,
  History,
  HelpCircle,
  ChevronLeft,
  CreditCard,
  Package,
  FileText,
  Upload,
  Settings,
  User,
} from 'lucide-react'
import { ROLE_LABELS } from '../../../lib/constants'
import { useState, useEffect } from 'react'
import { cn } from '../../../lib/utils'
import { useRouter } from 'next/navigation'
import NotificationBell from '../../../components/dashboard/NotificationBell'
import { AIConsentModal } from '../../../components/editor/AIConsentModal'
import { StudioProvider } from '../../../components/dashboard/ads/studio/StudioContext'

function StudioConditionalWrapper({ isAdStudio, children }: { isAdStudio: boolean; children: React.ReactNode }) {
  return isAdStudio ? <StudioProvider>{children}</StudioProvider> : <>{children}</>
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  external?: boolean
  children?: { name: string; href: string; icon: React.ElementType }[]
}

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
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
  const [expandedDropdown, setExpandedDropdown] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark'
      if (savedTheme) {
        setTheme(savedTheme)
        document.documentElement.classList.toggle('dark', savedTheme === 'dark')
      }
      if (user && user.role !== 'advertiser' && user.role !== 'superadmin' && user.role !== 'wapimred') {
        router.replace(`/${site}/dashboard`)
      }
    }
  }, [user, router, site])

  // Auto-expand "Iklan Saya" if user is on a sub-page
  useEffect(() => {
    if (pathname === `/${site}/ads/order`) {
      setExpandedDropdown('iklan-saya')
    }
  }, [pathname, site])

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
  const navItems: NavItem[] = [
    { name: 'Beranda', href: `/${site}/ads`, icon: LayoutDashboard },
    {
      name: 'Iklan Saya',
      href: `/${site}/ads/order`,
      icon: Megaphone,
      children: [
        { name: 'Pilih Paket', href: `/${site}/ads/order?step=package`, icon: Package },
        { name: 'Detail Iklan', href: `/${site}/ads/order?step=campaign`, icon: FileText },
        { name: 'Upload Materi', href: `/${site}/ads/order?step=creative`, icon: Upload },
      ],
    },
    { name: 'Riwayat', href: `/${site}/ads/history`, icon: History },
    { name: 'Pembayaran', href: `/${site}/ads/bookings`, icon: CreditCard },
  ]

  // Check if a nav item or any of its children is active
  const isItemActive = (item: NavItem): boolean => {
    if (pathname === item.href) return true
    if (item.children) {
      return item.children.some(child => pathname === child.href || pathname.startsWith(child.href + '/'))
    }
    return false
  }

  const isChildActive = (href: string): boolean => {
    const url = new URL(href, 'http://localhost')
    const hrefPath = url.pathname
    const hrefStep = url.searchParams.get('step')
    const currentStep = searchParams.get('step')
    if (hrefStep) {
      return pathname === hrefPath && currentStep === hrefStep
    }
    return pathname === hrefPath || pathname.startsWith(hrefPath + '/')
  }

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
        {/* Logo Section */}
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
            const Icon = item.icon
            const isActive = isItemActive(item)
            const hasChildren = item.children && item.children.length > 0
            const isExpanded = expandedDropdown === 'iklan-saya' && item.name === 'Iklan Saya'

            // Dropdown parent
            if (hasChildren) {
              return (
                <div key={item.name}>
                  <button
                    onClick={() => {
                      if (isSidebarCollapsed) return
                      setExpandedDropdown(isExpanded ? null : 'iklan-saya')
                    }}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-300 group relative overflow-hidden w-full text-left",
                      isActive
                        ? 'bg-brand-red text-white shadow-lg shadow-brand-red/30'
                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                    )}
                  >
                    {isActive && (
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-red-500 to-brand-red opacity-50 animate-pulse" />
                    )}
                    <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10 flex-shrink-0" />
                    {!isSidebarCollapsed && (
                      <>
                        <span className="text-[11px] font-black uppercase tracking-wider relative z-10 flex-1">{item.name}</span>
                        <ChevronDown
                          size={12}
                          className={cn(
                            "relative z-10 transition-transform duration-200",
                            isExpanded ? "rotate-180" : ""
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
                  {!isSidebarCollapsed && isExpanded && (
                    <div className="ml-4 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon
                        const childActive = isChildActive(child.href)
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 text-[10px] font-bold uppercase tracking-wider",
                              childActive
                                ? 'text-brand-red bg-brand-red/10'
                                : 'text-gray-500 hover:text-white hover:bg-white/5'
                            )}
                          >
                            <ChildIcon size={14} strokeWidth={childActive ? 2.5 : 1.5} />
                            <span>{child.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            // Regular nav item
            const navContent = (
              <>
                {isActive && (
                  <div className="absolute inset-0 bg-gradient-to-r from-brand-red via-red-500 to-brand-red opacity-50 animate-pulse" />
                )}
                <Icon size={17} strokeWidth={isActive ? 2.5 : 1.8} className="relative z-10 flex-shrink-0" />
                {!isSidebarCollapsed && (
                  <>
                    <span className="text-[11px] font-black uppercase tracking-wider relative z-10">{item.name}</span>
                    {isActive && !item.external && <ChevronRight size={12} className="ml-auto opacity-60 relative z-10" />}
                    {item.external && <ExternalLink size={10} className="ml-auto opacity-40 relative z-10" />}
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

            if (item.external) {
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

        {/* User Footer */}
        <div className="p-4 border-t border-white/5 bg-black/40 backdrop-blur-md">
          {/* Bantuan — above profile */}
          <div className="mb-3">
            <a
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-500 hover:bg-white/5 hover:text-white transition-all duration-300 group"
            >
              <HelpCircle size={17} strokeWidth={1.8} className="flex-shrink-0" />
              {!isSidebarCollapsed && (
                <>
                  <span className="text-[11px] font-black uppercase tracking-wider">Bantuan</span>
                  <ExternalLink size={10} className="ml-auto opacity-40" />
                </>
              )}
            </a>
          </div>

          {/* Profile */}
          <div className="flex items-center gap-3 mb-3 px-2">
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
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="flex flex-col min-w-0 flex-1">
                  <span className="text-xs font-black truncate text-white leading-tight tracking-tight">{user?.name}</span>
                  <span className="text-[8px] text-brand-red font-black uppercase tracking-[0.2em] mt-1">
                    {ROLE_LABELS[user?.role || ''] || user?.role}
                  </span>
                </div>
                <Link
                  href={`/${site}/ads/settings`}
                  className="p-2 text-gray-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
                  title="Pengaturan"
                >
                  <Settings size={16} />
                </Link>
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
            const isActive = isItemActive(item)
            const Icon = item.icon
            const hasChildren = item.children && item.children.length > 0

            if (hasChildren) {
              return (
                <div key={item.name} className="mb-1">
                  <button
                    onClick={() => setExpandedDropdown(expandedDropdown === 'iklan-saya' ? null : 'iklan-saya')}
                    className={cn(
                      "flex items-center gap-3 py-2 px-3 rounded-lg w-full text-left",
                      isActive ? "text-brand-red bg-brand-red/5" : "text-gray-400"
                    )}
                  >
                    <Icon size={16} />
                    <span className="text-[11px] font-black uppercase tracking-wider flex-1">{item.name}</span>
                    <ChevronDown size={12} className={cn("transition-transform", expandedDropdown === 'iklan-saya' ? "rotate-180" : "")} />
                  </button>
                  {expandedDropdown === 'iklan-saya' && (
                    <div className="ml-6 mt-1 space-y-0.5 border-l border-white/10 pl-3">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon
                        const childActive = isChildActive(child.href)
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={cn(
                              "flex items-center gap-3 py-1.5 px-3 rounded-lg text-[10px] font-bold uppercase tracking-wider",
                              childActive ? "text-brand-red" : "text-gray-500"
                            )}
                          >
                            <ChildIcon size={14} />
                            <span>{child.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            if (item.external) {
              return (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg mb-0.5 text-gray-400"
                >
                  <Icon size={16} />
                  <span className="text-[11px] font-black uppercase tracking-wider">{item.name}</span>
                </a>
              )
            }

            return (
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

          {/* Mobile: Bantuan + Profile + Keluar */}
          <div className="border-t border-white/5 pt-3 mt-3 space-y-1">
            <a
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 text-gray-400"
            >
              <HelpCircle size={16} />
              <span className="text-[11px] font-black uppercase tracking-wider">Bantuan</span>
            </a>
            <Link
              href={`/${site}/ads/settings`}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-3 py-2 px-3 text-gray-400"
            >
              <Settings size={16} />
              <span className="text-[11px] font-black uppercase tracking-wider">Pengaturan</span>
            </Link>
            <button onClick={logout} className="flex items-center gap-3 py-2 px-3 text-red-400 w-full">
              <LogOut size={16} />
              <span className="text-[11px] font-black uppercase tracking-wider">Keluar</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
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
