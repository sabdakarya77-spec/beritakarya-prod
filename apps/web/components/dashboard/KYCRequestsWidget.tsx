'use client';

import { ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface KYCRequestsWidgetProps {
  requests: any[];
  site: string;
}

export function KYCRequestsWidget({ requests, site }: KYCRequestsWidgetProps) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-red" />
          <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
            Antrean Verifikasi KYC Reporter/Kontributor ({requests.length})
          </h3>
        </div>
        <Link
          href={`/${site}/dashboard/review/kyc`}
          className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline"
        >
          Lihat Semua →
        </Link>
      </div>
      <div className="p-6 divide-y divide-gray-50 dark:divide-white/5">
        {requests.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Tidak ada pengajuan verifikasi KYC baru.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">{req.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{req.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                  {req.kycSubmittedAt ? new Date(req.kycSubmittedAt).toLocaleDateString('id-ID') : '-'}
                </span>
                <Link
                  href={`/${site}/dashboard/review/kyc/${req.id}`}
                  className="px-3 py-1.5 bg-brand-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-700 rounded transition-colors"
                >
                  Review
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
