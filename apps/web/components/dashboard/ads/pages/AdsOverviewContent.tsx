'use client';

import Link from 'next/link';
import {
  Wallet,
  CheckCircle2,
  BarChart3,
  Eye,
  ArrowRight,
  Target,
  Package,
  ClipboardList,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../../../lib/utils';
import type { AdBooking, AdPackage } from '../types';

interface AdsOverviewContentProps {
  basePath: string; // e.g. '/pusat/ads' or '/pusat/dashboard/ads'
  bookings: AdBooking[];
  packages: AdPackage[];
}

export default function AdsOverviewContent({ basePath, bookings, packages }: AdsOverviewContentProps) {
  const totalImpressions = bookings.reduce((acc, b) => acc + b.impressions, 0);
  const totalClicks = bookings.reduce((acc, b) => acc + b.clicks, 0);
  const activeBookings = bookings.filter(b => b.status === 'ACTIVE');
  const verifyingBookings = bookings.filter(b => b.paymentStatus === 'VERIFYING');

  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-brand-red">
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl"><Wallet size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Booking</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.length}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Iklan Aktif</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{activeBookings.length}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><BarChart3 size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Impresi</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{totalImpressions.toLocaleString()}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-amber-500">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl"><Eye size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Menunggu Verifikasi</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{verifyingBookings.length}</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href={`${basePath}/slots`}
          className="dash-card p-5 flex items-center gap-4 group hover:border-brand-red/30 transition-all"
        >
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl"><Target size={20} /></div>
          <div className="flex-1">
            <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Kelola Slot Iklan</p>
            <p className="text-[10px] text-gray-400 mt-0.5">Leaderboard, banner, dan slot aktif</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-red transition-colors" />
        </Link>
        <Link
          href={`${basePath}/packages`}
          className="dash-card p-5 flex items-center gap-4 group hover:border-brand-red/30 transition-all"
        >
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><Package size={20} /></div>
          <div className="flex-1">
            <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Katalog Paket</p>
            <p className="text-[10px] text-gray-400 mt-0.5">{packages.length} paket aktif</p>
          </div>
          <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-red transition-colors" />
        </Link>
        <Link
          href={`${basePath}/bookings`}
          className="dash-card p-5 flex items-center gap-4 group hover:border-brand-red/30 transition-all"
        >
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><ClipboardList size={20} /></div>
          <div className="flex-1">
            <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Validasi Booking</p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {verifyingBookings.length > 0
                ? `${verifyingBookings.length} menunggu verifikasi`
                : 'Semua sudah diproses'
              }
            </p>
          </div>
          {verifyingBookings.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-500 text-white text-[8px] font-black rounded-full animate-pulse">{verifyingBookings.length}</span>
          )}
          <ArrowRight size={16} className="text-gray-300 group-hover:text-brand-red transition-colors" />
        </Link>
      </div>

      {/* Recent Bookings */}
      {bookings.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Booking Terbaru</h3>
            <Link href={`${basePath}/bookings`} className="text-[10px] font-bold text-brand-red uppercase tracking-widest hover:underline">
              Lihat Semua →
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Pemesan</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Paket</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Site</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Impresi</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Klik</th>
                </tr>
              </thead>
              <tbody>
                {bookings.slice(0, 5).map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-semibold text-brand-black dark:text-white">{b.user?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{b.package?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{b.siteId}</td>
                    <td className="py-3 px-4">
                      <span className={cn(
                        "px-2 py-1 rounded-full text-[9px] font-bold uppercase",
                        b.paymentStatus === 'PAID' ? "bg-emerald-100 text-emerald-700" :
                        b.paymentStatus === 'VERIFYING' ? "bg-blue-100 text-blue-700" :
                        b.paymentStatus === 'REJECTED' ? "bg-red-100 text-red-700" :
                        "bg-amber-100 text-amber-700"
                      )}>{b.paymentStatus}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{b.impressions.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{b.clicks.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Guidelines */}
      <div className="dash-card p-6 bg-blue-50/50 dark:bg-blue-950/10 border-blue-100/50 dark:border-blue-900/10 rounded-3xl">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl text-blue-600"><AlertCircle size={22} /></div>
          <div>
            <h4 className="text-[11px] font-black text-blue-950 dark:text-blue-300 uppercase tracking-widest mb-1.5">Ketentuan Portal Iklan BeritaKarya</h4>
            <ul className="text-[10px] text-blue-800/80 dark:text-blue-400/80 space-y-2 list-disc pl-4 leading-relaxed font-bold uppercase tracking-wider">
              <li>Penyelarasan iklan regional berjalan otomatis setelah Superadmin Pusat menyetujui pengajuan kampanye pengiklan.</li>
              <li>Semua file spanduk iklan disarankan dikompresi ke format **WebP** dengan batas maksimum **200 KB**.</li>
              <li>Administrasi keuangan dikendalikan melalui sistem transfer satu pintu rekening terpusat.</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
