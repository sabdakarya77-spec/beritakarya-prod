'use client';

import Link from 'next/link';
import {
  Wallet,
  CheckCircle2,
  BarChart3,
  Eye,
  ArrowRight,
  RefreshCw,
  Megaphone,
} from 'lucide-react';
import { cn } from '../../../lib/utils';
import type { AdBooking } from './types';

interface Props {
  site: string;
  bookings: AdBooking[];
  onRefresh: () => void;
}

export function AdvertiserAdsView({ site, bookings, onRefresh }: Props) {
  return (
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-brand-red">
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl"><Wallet size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Kampanye</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.length}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-emerald-500">
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle2 size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Iklan Aktif</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.filter(b => b.status === 'ACTIVE').length}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-blue-500">
          <div className="p-3 bg-blue-500/10 text-blue-500 rounded-xl"><BarChart3 size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Impresi</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.reduce((acc, b) => acc + b.impressions, 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="dash-card p-6 flex items-center gap-4 border-l-4 border-l-violet-500">
          <div className="p-3 bg-violet-500/10 text-violet-500 rounded-xl"><Eye size={20} /></div>
          <div>
            <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Total Klik</p>
            <p className="text-xl font-black text-brand-black dark:text-white">{bookings.reduce((acc, b) => acc + b.clicks, 0).toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* CTA: Order Baru */}
      <Link
        href={`/${site}/dashboard/ads/order`}
        className="dash-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center gap-4 md:gap-6 group hover:border-brand-red/30 hover:shadow-lg transition-all"
      >
        <div className="p-4 bg-brand-red/10 text-brand-red rounded-2xl">
          <Megaphone size={28} />
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Pesan Iklan Regional Baru</h3>
          <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
            Pilih paket iklan, unggah materi kreatif (gambar/video), dan kirim bukti pembayaran dalam satu wizard lengkap.
          </p>
        </div>
        <div className="flex items-center gap-2 px-5 py-3 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-brand-black transition-colors">
          Mulai <ArrowRight size={14} />
        </div>
      </Link>

      {/* Analytics Mini Chart */}
      {bookings.length > 0 && (() => {
        const totalImpressions = bookings.reduce((acc, b) => acc + b.impressions, 0);
        const totalClicks = bookings.reduce((acc, b) => acc + b.clicks, 0);
        const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const maxImpressions = Math.max(...bookings.map(b => b.impressions), 1);
        const activeBookings = bookings.filter(b => b.status === 'ACTIVE');

        return (
          <div className="dash-card overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-brand-red" />
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Performa Kampanye</h3>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                <span>CTR Rata-rata: <strong className="text-brand-black dark:text-white">{overallCtr.toFixed(2)}%</strong></span>
                <span>Kampanye Aktif: <strong className="text-emerald-600 dark:text-emerald-400">{activeBookings.length}</strong></span>
              </div>
            </div>

            <div className="p-4 md:p-6 space-y-3">
              {bookings.slice(0, 8).map((b) => {
                const ctr = b.impressions > 0 ? (b.clicks / b.impressions) * 100 : 0;
                const impWidth = Math.max((b.impressions / maxImpressions) * 100, 2);
                const clickWidth = Math.max((b.clicks / maxImpressions) * 100, 2);

                return (
                  <div key={b.id} className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold text-brand-black dark:text-white truncate max-w-[200px]">
                        {b.package?.name || 'Untitled'}
                      </span>
                      <div className="flex items-center gap-3 text-[8px] font-mono text-gray-400">
                        <span>{b.impressions.toLocaleString()} imp</span>
                        <span>{b.clicks.toLocaleString()} click</span>
                        <span className={cn("font-bold", ctr >= 2 ? "text-emerald-500" : ctr >= 1 ? "text-amber-500" : "text-gray-400")}>
                          {ctr.toFixed(1)}% CTR
                        </span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400/60 dark:bg-blue-500/40 rounded-full transition-all duration-500"
                          style={{ width: `${impWidth}%` }}
                        />
                      </div>
                      <div className="h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-400/60 dark:bg-emerald-500/40 rounded-full transition-all duration-500"
                          style={{ width: `${clickWidth}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Legend */}
              <div className="flex items-center gap-4 pt-2 border-t border-gray-50 dark:border-white/5">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 bg-blue-400/60 dark:bg-blue-500/40 rounded-sm" />
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Impresi</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-2 bg-emerald-400/60 dark:bg-emerald-500/40 rounded-sm" />
                  <span className="text-[8px] font-bold text-gray-400 uppercase tracking-widest">Klik</span>
                </div>
                {bookings.length > 8 && (
                  <span className="text-[8px] text-gray-400 ml-auto">Menampilkan 8 dari {bookings.length} kampanye</span>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Riwayat Booking */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Riwayat Booking & Performa</h3>
          <button onClick={onRefresh} className="p-2 text-gray-400 hover:text-brand-red transition-colors"><RefreshCw size={14} /></button>
        </div>
        {bookings.length === 0 ? (
          <div className="py-16 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center">
              <BarChart3 size={28} className="text-gray-300 dark:text-gray-600" />
            </div>
            <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Belum Ada Riwayat Kampanye</p>
            <p className="text-[10px] text-gray-400 max-w-xs mx-auto mb-4">Mulai pasang iklan regional untuk menjangkau ribuan pembaca di portal BeritaKarya.</p>
            <Link
              href={`/${site}/dashboard/ads/order`}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-red text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-black transition-colors"
            >
              <Megaphone size={14} /> Pesan Iklan Pertama
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-white/5">
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Paket</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Slot</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Tanggal</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Status</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Impresi</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">Klik</th>
                  <th className="py-3 px-4 font-black uppercase tracking-widest text-gray-400">CTR</th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 dark:border-white/5 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]">
                    <td className="py-3 px-4 font-semibold text-brand-black dark:text-white">{b.package?.name || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{b.package?.slot || '-'}</td>
                    <td className="py-3 px-4 text-gray-500">{new Date(b.startDate).toLocaleDateString('id-ID')} — {new Date(b.endDate).toLocaleDateString('id-ID')}</td>
                    <td className="py-3 px-4">
                      <span className={cn("px-2 py-1 rounded-full text-[9px] font-bold uppercase", b.status === 'ACTIVE' ? "bg-emerald-100 text-emerald-700" : b.status === 'PENDING_REVIEW' ? "bg-amber-100 text-amber-700" : b.status === 'REJECTED' ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-500")}>{b.status}</span>
                    </td>
                    <td className="py-3 px-4 font-mono">{b.impressions.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{b.clicks.toLocaleString()}</td>
                    <td className="py-3 px-4 font-mono">{b.impressions > 0 ? ((b.clicks / b.impressions) * 100).toFixed(2) + '%' : '0%'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
