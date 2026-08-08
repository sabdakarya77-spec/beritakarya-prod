'use client';

import { Megaphone, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface AdvertiserDashboardOverviewProps {
  greeting: string;
  userName: string;
  site: string;
}

export function AdvertiserDashboardOverview({ greeting, userName, site }: AdvertiserDashboardOverviewProps) {
  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl md:text-3xl font-black text-brand-black dark:text-white tracking-tight">
          {greeting}, {userName} 👋
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Kelola iklan Anda di <strong className="text-brand-red">{site === 'pusat' ? 'Pusat' : site}</strong>
        </p>
      </div>

      {/* CTA Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/${site}/p/ads`}
          className="dash-card group p-6 bg-brand-red text-white border-brand-red hover:bg-red-700 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/10 rounded-xl">
              <Megaphone size={20} />
            </div>
            <div className="flex-1">
              <p className="text-xs font-black uppercase tracking-tight">Pasang Iklan</p>
              <p className="text-[10px] text-white/80 mt-0.5">Lihat slot & hubungi redaksi</p>
            </div>
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Info */}
      <div className="dash-card p-6">
        <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white mb-2">
          Alur Pemasangan Iklan
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          Kirim materi iklan (gambar + link tujuan) ke redaksi melalui halaman{' '}
          <Link href={`/${site}/p/ads`} className="text-brand-red font-bold hover:underline">
            Iklan
          </Link>
          . Tim kami akan memproses dan menayangkan iklan Anda di slot yang dipilih.
        </p>
      </div>
    </div>
  );
}