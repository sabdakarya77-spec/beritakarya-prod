'use client';

import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Clock, Share2, Check } from 'lucide-react';
import Link from 'next/link';
import { SmartImage } from '../ui/SmartImage';
import EditorialBadge from '../ui/EditorialBadge';
import { resolveArticleBadge } from '../../lib/resolveArticleBadge';
import ArticleBookmarkButton from '../ui/ArticleBookmarkButton';

interface PremiumHeroProps {
  article: any;
  site: string;
}

export function PremiumHero({ article, site }: PremiumHeroProps) {
  const [shareState, setShareState] = useState<'idle' | 'copied' | 'shared'>('idle');
  
  const imageUrl = useMemo(() => {
    return article?.featuredImage || article?.blocks?.find((b: any) => b.type === 'image')?.url || '/placeholder.jpg';
  }, [article]);

  const excerpt = useMemo(() => {
    return article?.blocks?.find((b: any) => b.type === 'paragraph')?.content || '';
  }, [article]);

  const date = useMemo(() => {
    if (!article?.publishedAt && !article?.createdAt) return '';
    return new Date(article.publishedAt || article.createdAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  }, [article]);

  const badgeVariant = useMemo(() => {
    return article ? resolveArticleBadge(article) : null;
  }, [article]);

  const articleUrl = useMemo(() => {
    if (!article?.slug) return '';
    if (typeof window === 'undefined') return `/${site}/artikel/${article.slug}`;
    return `${window.location.origin}/${site}/artikel/${article.slug}`;
  }, [article, site]);

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: article.title,
          text: excerpt || article.title,
          url: articleUrl,
        });
        setShareState('shared');
      } else {
        await navigator.clipboard.writeText(articleUrl);
        setShareState('copied');
      }
    } catch (error: any) {
      if (error?.name !== 'AbortError') {
        await navigator.clipboard.writeText(articleUrl);
        setShareState('copied');
      }
    } finally {
      window.setTimeout(() => setShareState('idle'), 2000);
    }
  };

  if (!article) return null;

  return (
    <section className="relative w-full mb-24 overflow-hidden">
      <div className="max-w-[1600px] mx-auto px-4 lg:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0 items-center">
          
          {/* Text Content - Left (Span 5) */}
          <div className="lg:col-span-5 z-20 order-2 lg:order-1 pt-10 lg:pt-0 lg:-mr-20">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4">
                <span className="h-px w-12 bg-brand-red hidden md:block"></span>
                <span className="text-[11px] font-black uppercase tracking-[0.4em] text-brand-red">
                  {article.category?.name || 'LAPORAN UTAMA'}
                </span>
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="md" />}
              </div>

              <Link href={`/${site}/artikel/${article.slug}`}>
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-serif font-black text-brand-black dark:text-white leading-[0.95] tracking-tighter hover:text-brand-red transition-colors duration-500">
                  {article.title}
                </h1>
              </Link>

              <div className="max-w-md">
                <p className="text-lg md:text-xl text-brand-text-muted font-light leading-relaxed line-clamp-3 mb-8">
                  {excerpt}
                </p>

                <div className="flex items-center gap-8 pt-6 border-t border-gray-100 dark:border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-black dark:bg-white flex items-center justify-center text-white dark:text-brand-black text-xs font-black">
                      {article.author?.name?.[0] || 'B'}
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Penulis</p>
                      <p className="text-xs font-bold text-brand-black dark:text-white">{article.author?.name || 'Redaksi'}</p>
                    </div>
                  </div>
                  
                  <div className="flex flex-col">
                    <p className="text-[10px] font-black text-brand-text-muted uppercase tracking-widest">Waktu Baca</p>
                    <p className="text-xs font-bold text-brand-black dark:text-white flex items-center gap-1.5">
                      <Clock size={12} className="text-brand-red" /> {article.readingTimeMin || 5} mnt
                    </p>
                  </div>
                </div>

                <div className="mt-10 flex items-center gap-4">
                  <Link 
                    href={`/${site}/artikel/${article.slug}`}
                    className="group flex items-center gap-3 bg-brand-black dark:bg-white text-white dark:text-brand-black px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest hover:bg-brand-red dark:hover:bg-brand-red dark:hover:text-white transition-all shadow-xl shadow-brand-black/10"
                  >
                    Baca Selengkapnya
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </Link>
                  
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={handleShare}
                      aria-label={shareState === 'idle' ? 'Bagikan artikel utama' : shareState === 'shared' ? 'Artikel dibagikan' : 'Tautan artikel tersalin'}
                      title={shareState === 'idle' ? 'Bagikan artikel utama' : shareState === 'shared' ? 'Artikel dibagikan' : 'Tautan artikel tersalin'}
                      className={`p-4 transition-colors ${
                        shareState === 'idle' ? 'text-brand-text-muted hover:text-brand-red' : 'text-brand-red'
                      }`}
                    >
                      {shareState === 'idle' ? <Share2 size={18} /> : <Check size={18} />}
                    </button>
                    <ArticleBookmarkButton
                      article={article}
                      site={site}
                      className="p-4"
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Image - Right (Span 7) */}
          <div className="lg:col-span-7 relative order-1 lg:order-2">
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="relative aspect-[4/5] lg:aspect-[1.1/1] overflow-hidden rounded-3xl shadow-2xl"
            >
              <SmartImage
                src={imageUrl}
                blur={article.featuredImageBlur}
                dominantColor={article.featuredImageColor}
                context="hero_lead"
                alt={article.title}
                fill
                className="object-cover transition-transform duration-[3s] hover:scale-110"
                priority
              />
              {/* Overlay Decorator */}
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 dark:from-slate-900/40 to-transparent lg:hidden" />
              
              {/* Floating Tag */}
              <div className="absolute top-8 right-8 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md px-6 py-4 rounded-2xl shadow-2xl hidden md:block">
                <p className="text-[10px] font-black text-brand-red uppercase tracking-[0.3em] mb-1">Terbitan</p>
                <p className="text-sm font-bold text-brand-black dark:text-white">{date}</p>
              </div>
            </motion.div>

            {/* Background Accent */}
            <div className="absolute -top-10 -right-10 w-64 h-64 bg-brand-red/5 rounded-full blur-3xl -z-10" />
            <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-brand-red/5 rounded-full blur-3xl -z-10" />
          </div>

        </div>
      </div>
    </section>
  );
}