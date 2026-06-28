'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Video,
  RefreshCw,
  Clock,
} from 'lucide-react';
import type { AdBooking } from '../types';
import { ProductionCard } from './ProductionCard';

interface Props {
  site: string;
  bookings: AdBooking[];
  onRefresh: () => void;
}

export function VideoProductionPage({ site, bookings, onRefresh }: Props) {
  const [processingId, setProcessingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href={`/${site}/dashboard/ads`} className="inline-flex items-center gap-2 text-[10px] font-bold text-brand-red uppercase tracking-widest hover:underline">
          <ArrowLeft size={14} /> Kembali
        </Link>
      </div>

      {/* Title */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-3 bg-brand-red/10 text-brand-red rounded-xl">
            <Video size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-brand-black dark:text-white uppercase tracking-tight">
              Produksi Video
            </h1>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Produksi video iklan untuk booking HOME TOP
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="dash-card p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-xl">
            <Clock size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Menunggu Produksi</p>
            <p className="text-2xl font-black text-brand-black dark:text-white mt-1">{bookings.length}</p>
          </div>
        </div>
      </div>

      {/* Production Cards */}
      {bookings.length === 0 ? (
        <div className="dash-card p-12 text-center">
          <Video size={48} className="text-gray-200 dark:text-white/10 mx-auto mb-4" />
          <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">
            Tidak Ada Booking Menunggu
          </h3>
          <p className="text-[11px] text-gray-400 max-w-md mx-auto">
            Semua booking HOME TOP sudah diproduksi. Booking baru akan muncul di sini setelah di-approve oleh admin.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {bookings.map(booking => (
            <ProductionCard
              key={booking.id}
              booking={booking}
              site={site}
              isProcessing={processingId === booking.id}
              setProcessingId={setProcessingId}
              onRefresh={onRefresh}
            />
          ))}
        </div>
      )}
    </div>
  );
}
