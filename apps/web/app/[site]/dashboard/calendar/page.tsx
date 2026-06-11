'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  ChevronLeft, ChevronRight, Calendar as CalendarIcon, 
  Clock
} from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, isToday, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import { api } from '../../../../lib/api';
import { cn } from '../../../../lib/utils';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  status: string;
  scheduledAt?: string;
  publishedAt?: string;
  category?: { name: string };
  author: { name: string };
}

export default function EditorialCalendar() {
  const { site } = useParams() as { site: string };
  const [currentDate, setCurrentDate] = useState(new Date());
  const [articles, setArticles] = useState<Article[]>([]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
  const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: startDate, end: endDate });

  useEffect(() => {
    const fetchArticles = async () => {
      try {
        // Fetch all articles for the current month range
        const { data } = await api.get('/articles', {
          params: { 
            limit: 100,
            // We'd ideally have a date range filter in the API, 
            // but for now we fetch recent/scheduled and filter client-side
          }
        });
        setArticles(data.data.articles || data.data.items || []);
      } catch (e) {
        console.error(e);
      }
    };
    fetchArticles();
  }, [site, monthStart.toISOString()]);

  const getArticlesForDay = (day: Date) => {
    return articles.filter(a => {
      const dateStr = a.scheduledAt || a.publishedAt;
      if (!dateStr) return false;
      return isSameDay(new Date(dateStr), day);
    });
  };

  const nextMonth = () => setCurrentDate(addDays(monthEnd, 1));
  const prevMonth = () => setCurrentDate(addDays(monthStart, -1));

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-red flex items-center justify-center shadow-lg shadow-brand-red/20">
            <CalendarIcon size={22} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">Kalender Editorial</h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Jadwal Penerbitan Konten</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => setCurrentDate(new Date())}
            className="px-4 py-2 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-brand-black dark:text-white hover:bg-gray-50 transition-all shadow-sm"
          >
            Hari Ini
          </button>
          
          <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-xl border border-gray-100 dark:border-white/5">
            <button 
              onClick={prevMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="px-4 text-xs font-black uppercase tracking-widest text-brand-black dark:text-white min-w-[140px] text-center">
              {format(currentDate, 'MMMM yyyy', { locale: id })}
            </div>
            <button 
              onClick={nextMonth}
              className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors text-gray-500"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="dash-card p-5">
          <p className="dash-label mb-1">Terbit Bulan Ini</p>
          <p className="text-3xl font-black text-brand-black dark:text-white">
            {articles.filter(a => {
              if (a.status !== 'published' || !a.publishedAt) return false;
              const date = new Date(a.publishedAt);
              return date >= monthStart && date <= monthEnd;
            }).length}
          </p>
        </div>
        <div className="dash-card p-5">
          <p className="dash-label mb-1">Dijadwalkan</p>
          <p className="text-3xl font-black text-brand-red">
            {articles.filter(a => a.status === 'scheduled').length}
          </p>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="dash-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/5">
          {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(day => (
            <div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 auto-rows-[140px]">
          {calendarDays.map((day) => {
            const dayArticles = getArticlesForDay(day);
            const isCurrentMonth = isSameDay(startOfMonth(day), monthStart);
            
            return (
              <div 
                key={day.toISOString()} 
                className={cn(
                  "border-r border-b border-gray-50 dark:border-white/[0.03] p-2 transition-colors",
                  !isCurrentMonth && "bg-gray-50/50 dark:bg-black/20 opacity-40",
                  isToday(day) && "bg-brand-red/[0.02]"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={cn(
                    "text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full",
                    isToday(day) ? "bg-brand-red text-white" : "text-gray-400"
                  )}>
                    {format(day, 'd')}
                  </span>
                  {dayArticles.length > 0 && (
                    <span className="text-[9px] font-bold text-gray-400">{dayArticles.length} Art</span>
                  )}
                </div>

                <div className="space-y-1 overflow-y-auto h-[90px] scrollbar-none">
                  {dayArticles.slice(0, 3).map(art => (
                    <Link
                      key={art.id}
                      href={`/${site}/dashboard/articles/${art.id}`}
                      className={cn(
                        "block px-2 py-1.5 rounded text-[9px] font-bold truncate transition-all border group/art",
                        art.status === 'scheduled' 
                          ? "bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40"
                          : "bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40"
                      )}
                    >
                      <div className="flex items-center gap-1">
                        <Clock size={8} className="opacity-50" />
                        <span>{format(new Date(art.scheduledAt || art.publishedAt!), 'HH:mm')}</span>
                        <span className="opacity-30">•</span>
                        <span className="truncate">{art.title}</span>
                      </div>
                    </Link>
                  ))}
                  {dayArticles.length > 3 && (
                    <div className="text-[9px] font-black text-gray-400 text-center py-1">
                      +{dayArticles.length - 3} lainnya
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend & Help */}
      <div className="flex items-center gap-6 p-4 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/5">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Dijadwalkan</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-emerald-400" />
          <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Sudah Terbit</span>
        </div>
      </div>
    </div>
  );
}
