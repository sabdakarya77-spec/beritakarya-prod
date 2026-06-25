'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  BarChart3,
  ArrowRight,
  Megaphone,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../../lib/api';
import { cn } from '../../../lib/utils';
import type { AdBooking } from './types';
import { AdPerformanceChart } from './AdPerformanceChart';

interface DataPoint {
  date: string;
  value: number;
}

interface AdStats {
  impressions: DataPoint[];
  clicks: DataPoint[];
  total: {
    impressions: number;
    clicks: number;
    ctr: number;
  };
}

interface Props {
  site: string;
  bookings: AdBooking[];
}

export function AdvertiserAdsView({ site, bookings }: Props) {
  const [statsMap, setStatsMap] = useState<Record<string, AdStats>>({});
  const [loadingStats, setLoadingStats] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(14);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  const activeBookings = bookings.filter(b => b.status === 'ACTIVE');

  // Fetch stats for active bookings
  useEffect(() => {
    if (activeBookings.length === 0) return;

    const fetchStats = async () => {
      setLoadingStats(true);
      try {
        const results: Record<string, AdStats> = {};
        await Promise.all(
          activeBookings.map(async (b) => {
            try {
              const res = await api.get(`/ads/bookings/${b.id}/stats`, {
                params: { days: selectedPeriod },
              });
              if (res.data?.success && res.data?.data) {
                results[b.id] = res.data.data;
              }
            } catch {
              // skip failed bookings
            }
          })
        );
        setStatsMap(results);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPeriod, activeBookings.length]);

  // Auto-select first active booking
  useEffect(() => {
    if (activeBookings.length > 0 && !selectedBookingId) {
      setSelectedBookingId(activeBookings[0].id);
    }
  }, [activeBookings, selectedBookingId]);

  const selectedStats = selectedBookingId ? statsMap[selectedBookingId] : null;
  const selectedBooking = selectedBookingId ? bookings.find(b => b.id === selectedBookingId) : null;

  return (
    <div className="space-y-8">
      {/* Stats Cards — 2 large */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="dash-card p-6 md:p-8 flex items-center gap-5">
          <div className="p-4 bg-emerald-500/10 text-emerald-500 rounded-xl"><CheckCircle2 size={24} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Iklan Aktif</p>
            <p className="text-3xl font-black text-brand-black dark:text-white mt-1">{bookings.filter(b => b.status === 'ACTIVE').length}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">kampanye sedang tayang</p>
          </div>
        </div>
        <div className="dash-card p-6 md:p-8 flex items-center gap-5">
          <div className="p-4 bg-blue-500/10 text-blue-500 rounded-xl"><BarChart3 size={24} /></div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Total Impresi</p>
            <p className="text-3xl font-black text-brand-black dark:text-white mt-1">{bookings.reduce((acc, b) => acc + b.impressions, 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 mt-0.5">tayangan keseluruhan</p>
          </div>
        </div>
      </div>

      {/* CTA: Order Baru */}
      <Link
        href={`/${site}/ads/order`}
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

      {/* Time-Series Performance Chart */}
      {activeBookings.length > 0 && (
        <div className="dash-card overflow-hidden">
          <div className="p-4 md:p-6 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <BarChart3 size={16} className="text-brand-red" />
              <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Performa Kampanye</h3>
              {loadingStats && <RefreshCw size={12} className="animate-spin text-gray-400" />}
            </div>
            <div className="flex items-center gap-2">
              {/* Period selector */}
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setSelectedPeriod(days)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all",
                    selectedPeriod === days
                      ? "bg-brand-red text-white"
                      : "bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-brand-black dark:hover:text-white"
                  )}
                >
                  {days} Hari
                </button>
              ))}
            </div>
          </div>

          {/* Booking selector (if multiple active) */}
          {activeBookings.length > 1 && (
            <div className="px-4 md:px-6 pt-4 flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {activeBookings.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setSelectedBookingId(b.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
                    selectedBookingId === b.id
                      ? "bg-brand-black dark:bg-white text-white dark:text-brand-black"
                      : "bg-gray-100 dark:bg-white/5 text-gray-400 hover:text-brand-black dark:hover:text-white"
                  )}
                >
                  {b.package?.name || 'Untitled'}
                </button>
              ))}
            </div>
          )}

          <div className="p-4 md:p-6">
            {selectedStats ? (
              <AdPerformanceChart
                stats={selectedStats}
                bookingName={selectedBooking?.package?.name}
              />
            ) : loadingStats ? (
              <div className="h-[250px] flex items-center justify-center">
                <RefreshCw size={24} className="animate-spin text-gray-300" />
              </div>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-gray-400 text-xs uppercase tracking-widest font-bold">
                Data tidak tersedia
              </div>
            )}
          </div>
        </div>
      )}

      {/* Existing Analytics Mini Chart (aggregate bar chart) */}
      {bookings.length > 0 && (() => {
        const totalImpressions = bookings.reduce((acc, b) => acc + b.impressions, 0);
        const totalClicks = bookings.reduce((acc, b) => acc + b.clicks, 0);
        const overallCtr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
        const maxImpressions = Math.max(...bookings.map(b => b.impressions), 1);

        return (
          <div className="dash-card overflow-hidden">
            <div className="p-4 md:p-6 border-b border-gray-50 dark:border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BarChart3 size={16} className="text-brand-red" />
                <h3 className="text-xs font-black uppercase tracking-widest text-brand-black dark:text-white">Perbandingan Kampanye</h3>
              </div>
              <div className="flex items-center gap-4 text-[9px] font-bold uppercase tracking-widest text-gray-400">
                <span>CTR Rata-rata: <strong className="text-brand-black dark:text-white">{overallCtr.toFixed(2)}%</strong></span>
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
    </div>
  );
}
