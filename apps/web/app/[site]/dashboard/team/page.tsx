'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Users, FileText, Eye, 
  Search, Calendar, Award,
  MoreVertical
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { motion } from 'framer-motion';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: string;
  isOnline: boolean;
  publishedCount: number;
  totalViews: number;
  avgWords: number;
  createdAt: string;
}

export default function TeamMonitoring() {
  const { site } = useParams() as { site: string };
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

   useEffect(() => {
     const fetchTeam = async (isInitial = false) => {
       if (isInitial) setLoading(true);
       try {
         const { data } = await api.get('/users/stats');
         setTeam(data.data);
       } catch (e) {
         console.error(e);
       } finally {
         if (isInitial) setLoading(false);
       }
     };

     fetchTeam(true);

     // Refresh status every 30 seconds to keep online indicators accurate
     const interval = setInterval(() => fetchTeam(false), 30000);
     return () => clearInterval(interval);
   }, [site]);

  const filteredTeam = team.filter(m => 
    m.name.toLowerCase().includes(search.toLowerCase()) || 
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-900 dark:bg-white/10 flex items-center justify-center shadow-lg">
            <Users size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Monitor Tim Redaksi</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Produktivitas & Performa Reporter/Kontributor</p>
          </div>
        </div>

        <div className="relative w-full md:w-64">
          <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Cari nama reporter/kontributor..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-xl text-xs outline-none focus:border-brand-red transition-all"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          Array(6).fill(0).map((_, i) => (
            <div key={i} className="dash-card h-64 animate-pulse bg-gray-50 dark:bg-white/5" />
          ))
        ) : filteredTeam.length === 0 ? (
          <div className="col-span-full py-20 text-center text-gray-400">
            <Users size={48} className="mx-auto mb-4 opacity-10" />
            <p className="text-sm font-bold uppercase tracking-widest">Tidak ada reporter/kontributor ditemukan</p>
          </div>
        ) : (
          filteredTeam.map((member, i) => (
            <motion.div
              key={member.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="dash-card group overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-white/5 dark:to-white/10 flex items-center justify-center text-lg font-black text-slate-400 dark:text-gray-500">
                        {member.name[0].toUpperCase()}
                      </div>
                      {member.isOnline && (
                        <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-4 border-white dark:border-slate-900 rounded-full" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-brand-black dark:text-white group-hover:text-brand-red transition-colors">{member.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{member.role}</span>
                        {member.publishedCount > 10 && (
                          <Award size={10} className="text-amber-500" />
                        )}
                      </div>
                    </div>
                  </div>
                  <button className="p-2 text-gray-300 hover:text-brand-red transition-colors">
                    <MoreVertical size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <FileText size={12} className="text-brand-red" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Post</span>
                    </div>
                    <p className="text-lg font-black text-brand-black dark:text-white">{member.publishedCount}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-white/5 rounded-xl p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Eye size={12} className="text-blue-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">Views</span>
                    </div>
                    <p className="text-lg font-black text-brand-black dark:text-white">
                      {member.totalViews > 1000 ? (member.totalViews/1000).toFixed(1) + 'K' : member.totalViews}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">Rata-rata Kata</span>
                    <span className="text-brand-black dark:text-white">{member.avgWords} kata</span>
                  </div>
                  <div className="h-1 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-brand-red rounded-full" 
                      style={{ width: `${Math.min((member.avgWords/800)*100, 100)}%` }} 
                    />
                  </div>
                </div>
              </div>
              
              <div className="px-6 py-4 bg-gray-50/50 dark:bg-white/[0.02] border-t border-gray-100 dark:border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                  <Calendar size={12} /> Terdaftar {new Date(member.createdAt).toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
                </div>
                <button className="text-[9px] font-black text-brand-red uppercase tracking-widest hover:underline">
                  Profil Lengkap
                </button>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}