'use client';

import { motion } from 'framer-motion';
import { Eye, FileText, Plus } from 'lucide-react';
import Link from 'next/link';

interface Article {
  id: string;
  title: string;
  status: string;
  author?: { name: string };
  category?: { name: string };
  categories?: Array<{ category?: { name?: string; slug?: string } | null }> | null;
  viewCount?: number;
}

interface KanbanBoardProps {
  articles: Article[];
  site: string;
}

const COLUMNS = [
  { id: 'draft', label: 'Ide / Draft', color: 'bg-amber-500' },
  { id: 'review', label: 'Dalam Review', color: 'bg-violet-500' },
  { id: 'revision', label: 'Perlu Revisi', color: 'bg-orange-500' },
  { id: 'published', label: 'Terbit', color: 'bg-green-500' },
];

export default function KanbanBoard({ articles, site }: KanbanBoardProps) {
  const getArticlesByStatus = (status: string) => {
    if (status === 'review') {
      return articles.filter(a => a.status === 'review' || a.status === 'submitted');
    }
    return articles.filter(a => a.status === status);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-start">
      {COLUMNS.map(col => {
        const colArticles = getArticlesByStatus(col.id);
        return (
          <div key={col.id} className="flex flex-col gap-4 min-h-[500px]">
            {/* Column Header */}
            <div className="flex items-center justify-between px-2 mb-2">
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-6 ${col.color} rounded-full`} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-brand-black dark:text-white">
                  {col.label}
                </h3>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-white/5 rounded-full text-[10px] font-bold text-gray-400">
                  {colArticles.length}
                </span>
              </div>
              <button className="p-1 text-gray-400 hover:text-brand-red transition-colors">
                <Plus size={14} />
              </button>
            </div>

            {/* Column Body */}
            <div className="flex flex-col gap-3">
              {colArticles.map((article, idx) => (
                <motion.div
                  key={article.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="group"
                >
                  <Link href={`/${site}/dashboard/articles/${article.id}`}>
                    <div className="p-4 bg-white dark:bg-slate-900 border border-gray-100 dark:border-white/5 rounded-xl shadow-sm hover:shadow-md hover:border-brand-red/20 transition-all cursor-pointer">
                      {(article.categories?.[0]?.category?.name || article.category?.name) && (
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-red mb-2 block">
                          {article.categories?.[0]?.category?.name || article.category.name}
                        </span>
                      )}
                      <h4 className="text-sm font-bold text-brand-black dark:text-white leading-snug mb-4 group-hover:text-brand-red transition-colors line-clamp-2">
                        {article.title}
                      </h4>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-50 dark:border-white/5">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-gray-500">
                            {article.author?.name?.[0] || 'R'}
                          </div>
                          <span className="text-[10px] font-medium text-gray-400 truncate max-w-[80px]">
                            {article.author?.name || 'Redaksi'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400">
                           <span className="flex items-center gap-1"><Eye size={10} /> {article.viewCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
              
              {colArticles.length === 0 && (
                <div className="py-12 border-2 border-dashed border-gray-100 dark:border-white/5 rounded-2xl flex flex-col items-center justify-center gap-2 text-gray-300 opacity-50">
                   <FileText size={24} strokeWidth={1} />
                   <span className="text-[10px] font-bold uppercase tracking-widest">Kosong</span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
