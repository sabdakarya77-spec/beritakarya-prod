'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, X, TrendingUp, ArrowRight, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { API_URL } from '../../lib/api';

interface FullScreenSearchProps {
  isOpen: boolean;
  onClose: () => void;
  site?: string;
  trendingTopics?: string[];
}

export default function FullScreenSearch({
  isOpen,
  onClose,
  site = 'pusat',
  trendingTopics = ['Politik', 'Ekonomi', 'Investigasi', 'Teknologi', 'Gaya Hidup', 'Hiburan'],
}: FullScreenSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
      setQuery('');
      setResults([]);
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Fetch search results on input change
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_URL}/api/v1/articles/public?site=${site}&search=${encodeURIComponent(query)}&limit=5`);
        if (res.ok) {
          const json = await res.json();
          const items = json?.data?.articles || json?.data?.items || [];
          setResults(items);
        }
      } catch (e) {
        console.error('Search error:', e);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [query, site]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[100] bg-slate-950/95 backdrop-blur-2xl flex flex-col px-6 py-8 md:px-16 md:py-16"
        >
          {/* Header Controls */}
          <div className="flex justify-between items-center w-full max-w-5xl mx-auto mb-16">
            <span className="text-[11px] font-semibold uppercase tracking-wide text-brand-red flex items-center gap-2">
              <Zap size={14} className="fill-brand-red" /> Portal Search Center
            </span>
            <button
              onClick={onClose}
              className="p-3 bg-white/5 hover:bg-brand-red rounded-full text-white transition-all transform hover:rotate-90 duration-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-start w-full max-w-5xl mx-auto">
            {/* Main Search Input */}
            <div className="relative border-b-2 border-white/20 focus-within:border-brand-red transition-colors pb-4 mb-12">
              <Search className="absolute left-0 top-1/2 -translate-y-1/2 text-brand-text-muted" size={32} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ketik topik berita atau kata kunci..."
                className="w-full pl-12 bg-transparent text-white text-2xl md:text-5xl font-serif font-black focus:outline-none placeholder-gray-600 tracking-tight"
              />
              {loading && (
                <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <span className="w-2 h-2 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-brand-red rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Content Body: Autocomplete vs Trending */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
              {/* Left Column: Instant Autocomplete Results */}
              <div className="md:col-span-7 space-y-6">
                {query.trim() ? (
                  <>
                    <h4 className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-muted border-b border-white/10 pb-2">
                      Hasil Pencarian ({results.length})
                    </h4>
                    {results.length > 0 ? (
                      <div className="flex flex-col gap-4">
                        {results.map((art: any) => (
                          <Link
                            key={art.id}
                            href={`/${site}/artikel/${art.slug}`}
                            onClick={onClose}
                            className="p-4 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl transition-all flex items-start gap-4 group"
                          >
                            {art.featuredImage && (
                              <img
                                src={art.featuredImage}
                                alt={art.title}
                                className="w-20 h-14 object-cover rounded-lg bg-white/5 flex-shrink-0"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-semibold text-brand-red uppercase tracking-wide block mb-1">
                    {art.category?.name || 'Umum'}
                  </span>
                              <h5 className="text-white font-bold text-sm leading-snug group-hover:text-brand-red transition-colors line-clamp-2">
                                {art.title}
                              </h5>
                            </div>
                            <ArrowRight size={16} className="text-brand-text-muted group-hover:text-white transition-colors self-center flex-shrink-0" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      !loading && (
                        <p className="text-brand-text-muted text-sm italic">Tidak ada artikel yang cocok dengan pencarian Anda.</p>
                      )
                    )}
                  </>
                ) : (
                  <div className="flex flex-col justify-center items-center py-16 text-center text-brand-text-muted border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                    <Search size={48} className="text-white/10 mb-4" />
                    <p className="text-sm font-light">Mulai mengetik untuk menampilkan hasil pencarian real-time secara instan.</p>
                  </div>
                )}
              </div>

              {/* Right Column: Trending Topics */}
              <div className="md:col-span-5 space-y-6">
                <h4 className="text-[11px] font-semibold uppercase tracking-wide text-brand-text-muted border-b border-white/10 pb-2 flex items-center gap-2">
                  <TrendingUp size={14} className="text-brand-red" /> Topik Populer Hari Ini
                </h4>
                <div className="flex flex-wrap gap-3">
                  {trendingTopics.map((tag) => (
                    <Link
                      key={tag}
                      href={`/${site}?q=${encodeURIComponent(tag)}`}
                      onClick={onClose}
                      className="px-4 py-2 bg-white/5 hover:bg-brand-red hover:text-white border border-white/10 rounded-full text-xs font-bold text-gray-300 transition-all hover:scale-105"
                    >
                      #{tag}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
