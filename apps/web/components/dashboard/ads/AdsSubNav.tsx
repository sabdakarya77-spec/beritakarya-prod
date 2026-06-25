'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Target,
  Package,
  ClipboardList,
  History,
} from 'lucide-react';
import { cn } from '../../../lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  roles?: string[];
}

const NAV_ITEMS: NavItem[] = [
  // Shared
  { name: 'Overview', href: '/ads', icon: LayoutDashboard },
  // Superadmin/Wapimred only
  { name: 'Slot Iklan', href: '/ads/slots', icon: Target, roles: ['superadmin', 'wapimred'] },
  { name: 'Paket', href: '/ads/packages', icon: Package, roles: ['superadmin'] },
  { name: 'Booking', href: '/ads/bookings', icon: ClipboardList, roles: ['superadmin'] },
  // Advertiser only
  { name: 'Riwayat', href: '/ads/history', icon: History, roles: ['advertiser'] },
];

interface AdsSubNavProps {
  site: string;
  userRole: string;
}

export function AdsSubNav({ site, userRole }: AdsSubNavProps) {
  const pathname = usePathname();

  const visibleItems = NAV_ITEMS.filter(
    item => !item.roles || item.roles.includes(userRole)
  );

  const isActive = (href: string) => {
    const fullPath = `/${site}${href}`;
    if (href === '/ads') {
      return pathname === fullPath;
    }
    return pathname.startsWith(fullPath);
  };

  return (
    <nav className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mb-px">
      {visibleItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={`/${site}${item.href}`}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-[11px] font-black uppercase tracking-widest transition-all border-b-2 whitespace-nowrap",
              active
                ? "border-brand-red text-brand-red"
                : "border-transparent text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:border-gray-200 dark:hover:border-white/10"
            )}
          >
            <Icon size={14} />
            {item.name}
          </Link>
        );
      })}
    </nav>
  );
}
