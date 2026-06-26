'use client';

import { useState } from 'react';
import { Megaphone, CheckCircle2, Loader2, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../../store/authStore';
import { cn } from '../../../lib/utils';

interface BecomeAdvertiserProps {
  site: string;
  onSuccess?: () => void;
}

export default function BecomeAdvertiser({ site, onSuccess }: BecomeAdvertiserProps) {
  const { user, upgradeToAdvertiser, isLoading, error } = useAuthStore();
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpgrade = async () => {
    try {
      await upgradeToAdvertiser();
      setIsSuccess(true);
      setTimeout(() => {
        onSuccess?.();
      }, 1500);
    } catch {
      // error is already set in store
    }
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-4">
          <CheckCircle2 size={32} className="text-emerald-500" />
        </div>
        <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">
          Selamat!
        </h2>
        <p className="text-xs text-gray-400 mt-2 max-w-sm">
          Anda telah menjadi Pengiklan. Mengarahkan ke dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-red/10 flex items-center justify-center mb-4">
        <Megaphone size={32} className="text-brand-red" />
      </div>

      <h2 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">
        Jadi Pengiklan
      </h2>
      <p className="text-xs text-gray-400 mt-2 max-w-sm">
        Daftarkan diri Anda sebagai pengiklan untuk mempromosikan produk atau layanan di jaringan BeritaKarya.
      </p>

      {/* Benefits */}
      <div className="mt-8 grid gap-3 w-full max-w-sm text-left">
        {[
          'Jangkau ribuan pembaca lokal setiap hari',
          'Slot iklan premium di homepage dan artikel',
          'Dashboard analitik impresi, klik, dan CTR',
          'Kelola kampanye secara mandiri',
        ].map((benefit, i) => (
          <div key={i} className="flex items-start gap-3">
            <CheckCircle2 size={14} className="text-emerald-500 mt-0.5 flex-shrink-0" />
            <span className="text-xs text-brand-text-muted">{benefit}</span>
          </div>
        ))}
      </div>

      {/* User info */}
      {user && (
        <div className="mt-6 px-4 py-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl border border-gray-100 dark:border-white/5 w-full max-w-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-1">Akun Anda</p>
          <p className="text-xs font-semibold text-brand-black dark:text-white">{user.name}</p>
          <p className="text-[10px] text-gray-400">{user.email}</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mt-4 flex items-center gap-2 text-red-500 text-xs">
          <AlertCircle size={14} />
          <span>{error}</span>
        </div>
      )}

      {/* CTA */}
      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className={cn(
          "mt-6 inline-flex items-center gap-2 px-6 py-3 bg-brand-red hover:bg-red-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        )}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" />
            Memproses...
          </>
        ) : (
          <>
            Daftar Sebagai Pengiklan
            <ArrowRight size={14} />
          </>
        )}
      </button>

      <p className="mt-3 text-[9px] text-gray-400 max-w-sm">
        Dengan mendaftar, Anda menyetujui{' '}
        <a href={`/${site}/p/ads`} className="text-brand-red hover:underline">
          syarat dan ketentuan
        </a>{' '}
        periklanan BeritaKarya.
      </p>
    </div>
  );
}
