'use client';

import { useState, useEffect } from 'react';
import { Megaphone, BarChart3, ArrowRight, MessageSquareMore } from 'lucide-react';
import Link from 'next/link';
import { api } from '../../lib/api';

interface AdvertiserDashboardOverviewProps {
  greeting: string;
  userName: string;
  site: string;
}

interface ActiveBooking {
  id: string;
  status: string;
  impressions: number;
  clicks: number;
  package?: { name: string } | null;
}

export function AdvertiserDashboardOverview({ greeting, userName, site }: AdvertiserDashboardOverviewProps) {
  const [bookings, setBookings] = useState<ActiveBooking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const fetch = async () => {
      try {
        const res = await api.get('/ads/bookings/my', { signal: controller.signal });
        const all: ActiveBooking[] = res.data?.data || [];
        setBookings(all.filter(b => b.status === 'ACTIVE'));
      } catch {
        // silent
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    fetch();
    return () => { controller.abort(); };
  }, []);

  const totalImpressions = bookings.reduce((acc, b) => acc + b.impressions, 0);

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

      {/* 2 CTA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link
          href={`/${site}/ads/order`}
          className="dash-card group p-6 bg-brand-red text-white border-brand-red hover:bg-red-700 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                <Megaphone size={22} />
              </div>
              <div>
                <p className="text-lg font-black tracking-tight">Pasang Iklan Baru</p>
                <p className="text-sm text-white/80 mt-1">Pilih paket & mulai kampanye iklan Anda</p>
              </div>
            </div>
            <ArrowRight size={18} className="text-white/60 group-hover:text-white transition-colors mt-1 flex-shrink-0" />
          </div>
        </Link>

        <Link
          href={`/${site}/ads`}
          className="dash-card group p-6 hover:border-brand-red/30 transition-all"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-brand-red/10 text-brand-red flex items-center justify-center flex-shrink-0">
                <BarChart3 size={22} />
              </div>
              <div>
                <p className="text-lg font-black text-brand-black dark:text-white tracking-tight">Iklan Saya</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {loading ? 'Memuat...' : bookings.length > 0 ? `${bookings.length} kampanye aktif` : 'Lihat performa & riwayat'}
                </p>
              </div>
            </div>
            <ArrowRight size={18} className="text-gray-300 group-hover:text-brand-red transition-colors mt-1 flex-shrink-0" />
          </div>
        </Link>
      </div>

      {/* Active Campaigns */}
      {!loading && bookings.length > 0 && (
        <div className="dash-card overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50 dark:border-white/5">
            <div className="flex items-center gap-2">
              <BarChart3 size={15} className="text-brand-red" />
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Kampanye Aktif</h3>
            </div>
            <Link
              href={`/${site}/ads/history`}
              className="text-[10px] font-bold text-brand-red uppercase tracking-widest hover:underline"
            >
              Lihat Semua →
            </Link>
          </div>
          <div className="divide-y divide-gray-50 dark:divide-white/5">
            {bookings.slice(0, 5).map((b) => (
              <div key={b.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-bold text-brand-black dark:text-white">
                    {b.package?.name || 'Kampanye'}
                  </span>
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-mono">
                  {b.impressions.toLocaleString()} imp
                </span>
              </div>
            ))}
          </div>
          <div className="px-6 py-3 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-50 dark:border-white/5">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Total: <strong className="text-brand-black dark:text-white">{totalImpressions.toLocaleString()}</strong> impresi dari {bookings.length} kampanye
            </p>
          </div>
        </div>
      )}

      {/* Help Card */}
      <div className="dash-card p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
        <div className="flex flex-col sm:flex-row items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600 flex-shrink-0">
            <MessageSquareMore size={20} />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-black text-blue-900 dark:text-blue-300 tracking-tight">Butuh Bantuan?</h4>
            <p className="text-xs text-blue-700/70 dark:text-blue-400/70 mt-1 leading-relaxed">
              Hubungi tim marketing untuk paket khusus, kerja sama tahunan, atau kendala booking.
            </p>
          </div>
          <a
            href="https://wa.me/628123456789"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0 px-5 py-2.5 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all flex items-center gap-2"
          >
            <MessageSquareMore size={13} />
            Chat WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
