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
          <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/20">
            <Layout size={20} />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black text-brand-black dark:text-white tracking-tight uppercase">
              {user.role === 'advertiser' ? 'Iklan Saya' : 'Portal Iklan & Monetisasi'}
            </h1>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              {user.role === 'advertiser'
                ? <>{site === 'pusat' ? 'Pusat' : site}</>
                : <>Cabang Regional: <strong className="text-brand-red">{site}</strong>
                  {user.role && <span className="ml-2 px-2.5 py-0.5 bg-brand-black dark:bg-white/10 text-brand-red rounded-full font-black text-[9px] uppercase tracking-wider">{user.role}</span>}
                </>
              }
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
