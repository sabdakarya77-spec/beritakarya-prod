'use client';

import { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';

export function RealTimePulse() {
  const [count, setCount] = useState(0);
  const { user } = useAuthStore();
  
  useEffect(() => {
    // Jangan polling jika user belum login
    if (!user) return;

    const fetchCount = async () => {
      try {
        const { data } = await api.get('/analytics/active-readers');
        setCount(data.data.count || 0);
      } catch {
        // Silently ignore - user mungkin sudah logout
      }
    };

    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [user]);

  return (
    <div className="flex items-center gap-3 bg-brand-red/5 px-4 py-2 rounded-2xl border border-brand-red/10">
      <div className="relative">
        <div className={cn("w-2.5 h-2.5 rounded-full", count > 0 ? "bg-brand-red" : "bg-gray-300")} />
        {count > 0 && <div className="absolute inset-0 w-2.5 h-2.5 bg-brand-red rounded-full animate-ping opacity-75" />}
      </div>
      <div className="flex flex-col">
        <span className="text-[14px] font-black text-brand-black dark:text-white leading-none tabular-nums">{count}</span>
        <span className="text-[9px] font-black text-brand-red uppercase tracking-widest mt-0.5">Pembaca Aktif</span>
      </div>
    </div>
  );
}
