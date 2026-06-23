'use client';

import { useParams } from 'next/navigation';
import { useAuthStore } from '../../../../store/authStore';
import { Layout, RefreshCw } from 'lucide-react';
import { AdsSubNav } from '../../../../components/dashboard/ads/AdsSubNav';

export default function AdsLayout({ children }: { children: React.ReactNode }) {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/20">
            <Layout size={24} />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-black text-brand-black dark:text-white tracking-tight uppercase">Portal Iklan & Monetisasi</h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Cabang Regional: <strong className="text-brand-red">{site}</strong>
              {user.role && <span className="ml-2 px-2.5 py-0.5 bg-brand-black dark:bg-white/10 text-brand-red rounded-full font-black text-[9px] uppercase tracking-wider">{user.role}</span>}
            </p>
          </div>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="border-b border-gray-100 dark:border-white/5">
        <AdsSubNav site={site} userRole={user.role} />
      </div>

      {/* Content */}
      {children}
    </div>
  );
}
