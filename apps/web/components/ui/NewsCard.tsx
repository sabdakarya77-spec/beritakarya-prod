'use client';

import React from 'react';
import { Clock, BookOpen, User } from 'lucide-react';
import Link from 'next/link';
import { SmartImage, prefetchImage } from './SmartImage';
import { cn } from '../../lib/utils';
import EditorialBadge from './EditorialBadge';
import { resolveArticleBadge } from '../../lib/resolveArticleBadge';
import { getCategoryColor } from '../../lib/constants';
import ArticleBookmarkButton from './ArticleBookmarkButton';

interface NewsCardBlock {
  type: string;
  content?: string;
  url?: string;
  embedType?: string;
  images?: Array<{ url?: string }>;
}

interface NewsCardArticle {
  id?: string;
  slug: string;
  title: string;
  featuredImage?: string | null;
  featuredImageBlur?: string | null;
  featuredImageColor?: string | null;
  readingTimeMin?: number | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  category?: { name?: string | null } | null;
  author?: { name?: string | null } | null;
  blocks?: NewsCardBlock[];
  isBreaking?: boolean;
  isExclusive?: boolean;
  isFeatured?: boolean;
  excerpt?: string | null;
  status?: string;
}

interface NewsCardProps {
  article: NewsCardArticle;
  variant?: 'large' | 'medium' | 'minimal' | 'horizontal';
  site?: string;
  priority?: boolean;
}

const NewsCard = React.memo(function NewsCard({ article, variant = 'medium', site = 'pusat', priority = false }: NewsCardProps) {
  if (!article) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-6 text-center dark:border-white/10 dark:bg-white/[0.02]">
        <p className="text-xs text-brand-text-muted">Artikel tidak tersedia</p>
      </div>
    );
  }

  const imageUrl = (() => {
    if (article.featuredImage) return article.featuredImage;

    if (Array.isArray(article.blocks)) {
      // 1. YouTube embed block thumbnail fallback
      const embedBlock = article.blocks.find((b) => b.type === 'embed' && b.embedType === 'youtube');
      if (embedBlock?.url) {
        const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
        const match = embedBlock.url.match(regExp);
        if (match && match[2].length === 11) {
          return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
        }
      }

      // 2. Gallery block fallback
      const galleryBlock = article.blocks.find((b) => b.type === 'gallery');
      if (galleryBlock?.images?.[0]?.url) {
        return galleryBlock.images[0].url;
      }

      // 3. Single image block fallback
      const imageBlock = article.blocks.find((b) => b.type === 'image');
      if (imageBlock?.url) {
        return imageBlock.url;
      }

      // 4. Image grid block fallback
      const gridBlock = article.blocks.find((b) => b.type === 'imageGrid');
      if (gridBlock?.images?.[0]?.url) {
        return gridBlock.images[0].url;
      }
    }

    return '/placeholder.jpg';
  })();
  // Prioritaskan field excerpt langsung dari API, fallback ke paragraf pertama dari blocks
  const excerptText =
    article.excerpt ||
    (Array.isArray(article.blocks) ? article.blocks : []).find((b) => b.type === 'paragraph')?.content ||
    '';
  const articleHref = `/${site}/artikel/${article.slug}`;
  const date = new Date(article.publishedAt || article.createdAt || '').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const readTime = article.readingTimeMin ? `${article.readingTimeMin} min baca` : "3 min baca";
  const badgeVariant = resolveArticleBadge(article);
  const authorName = article.author?.name || 'Redaksi';
  const categoryLabelClass = cn(
    "rounded-sm px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em]",
    getCategoryColor(article.category?.name ?? undefined)
  );
  const calmMetaClass = "flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-brand-text-muted";
  const defaultImageClass = 'object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.03]';
  const horizontalImageClass = 'object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.04]';
  const heroImageClass = 'object-cover object-[center_26%] opacity-75 transition-all duration-700 ease-out group-hover:scale-[1.03]';

  if (variant === 'large') {
    return (
      <div className="relative h-full">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-4 top-4 z-10 h-11 w-11 justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-sm hover:border-white/20 hover:text-white"
          activeClassName="absolute right-4 top-4 z-10 h-11 w-11 justify-center rounded-full border border-brand-red/40 bg-brand-red/20 text-white"
          idleClassName="absolute right-4 top-4 z-10 h-11 w-11 justify-center rounded-full border border-white/10 bg-black/45 text-white/80 hover:border-white/20 hover:text-white"
          iconSize={16}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)} className="h-full block">
          <article
            className="group relative h-full min-h-[340px] w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 shadow-xl transition-transform duration-300 ease-out hover:-translate-y-0.5"
          >
            <SmartImage 
              src={imageUrl} 
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="hero_lead"
              alt={article.title} 
              fill
              className={heroImageClass}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            
            <div className="absolute bottom-0 left-0 w-full max-w-3xl p-5 pb-12 md:p-6 md:pb-8">
              <div className="mb-3.5 flex items-center gap-2">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
                <span className="inline-block rounded-sm bg-brand-red px-2 py-0.5 text-[11px] font-black uppercase tracking-[0.12em] text-white shadow-sm">
                  {article.category?.name || 'UMUM'}
                </span>
              </div>
              <h2 className="mb-3.5 max-w-[20ch] text-balance font-sans text-lg font-extrabold leading-[1.15] tracking-tight text-white md:text-xl lg:text-[1.6rem]">
                {article.title}
              </h2>
              <p className="mb-5 max-w-2xl line-clamp-2 text-xs leading-relaxed text-gray-300 opacity-90 md:text-sm">
                {excerptText}
              </p>
              <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 border-t border-white/10 pt-4 text-[11px] font-semibold text-white/70">
                <div className="flex items-center gap-1.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-red text-[10px] font-black text-white">
                    {authorName[0] || 'R'}
                  </div>
                  <span>{authorName}</span>
                </div>
                <span className="flex items-center gap-1"><Clock size={12}/> {date}</span>
                <span className="flex items-center gap-1"><BookOpen size={12}/> {readTime}</span>
              </div>
            </div>
          </article>
        </Link>
      </div>
    );
  }

  if (variant === 'minimal') {
    return (
      <div className="relative">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-0 top-3 z-10 h-11 w-11 justify-center rounded-full border border-gray-200 bg-white dark:border-white/10 dark:bg-white/[0.03]"
          activeClassName="absolute right-0 top-3 z-10 h-11 w-11 justify-center rounded-full border border-brand-red/40 bg-brand-red/5 text-brand-red"
          idleClassName="absolute right-0 top-3 z-10 h-11 w-11 justify-center rounded-full border border-gray-200 bg-white text-brand-text-muted hover:text-brand-red hover:border-brand-red/40 dark:border-white/10 dark:bg-white/[0.03]"
          iconSize={15}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
          <div className="py-2 pr-12 border-b border-gray-100 dark:border-white/5 last:border-0 group cursor-pointer flex justify-between items-start gap-4">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
                <span className={categoryLabelClass}>
                  {article.category?.name || 'UMUM'}
                </span>
              </div>
              <h3 className="line-clamp-3 font-sans text-xs font-bold leading-[1.2] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-sm">
                {article.title}
              </h3>
              <div className={cn(calmMetaClass, "mt-2.5")}>
                <span>{authorName}</span>
                <span className="opacity-30">•</span>
                <span>{date}</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  if (variant === 'horizontal') {
    return (
      <div className="relative h-full flex flex-col">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-2 top-2 z-10 h-9 w-9 justify-center rounded-full border border-gray-200 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-black/20"
          activeClassName="absolute right-2 top-2 z-10 h-9 w-9 justify-center rounded-full border border-brand-red/40 bg-brand-red/10 text-brand-red"
          idleClassName="absolute right-2 top-2 z-10 h-9 w-9 justify-center rounded-full border border-gray-200 bg-white/90 text-brand-text-muted hover:text-brand-red hover:border-brand-red/40 dark:border-white/10 dark:bg-black/20"
          iconSize={14}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)} className="flex-1 flex">
          <article
            className="group flex flex-1 cursor-pointer gap-4 rounded-xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-red/20 hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-brand-red/20"
          >
            <div className="relative aspect-[4/3] w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 shadow-sm dark:bg-white/5 md:w-36">
              <SmartImage 
                src={imageUrl} 
                blur={article.featuredImageBlur}
                dominantColor={article.featuredImageColor}
                context="card_horizontal"
                alt={article.title} 
                fill
                className={horizontalImageClass}
                priority={priority}
              />
            </div>
            <div className="flex flex-1 flex-col justify-center gap-2 py-1 pr-10">
              <div className="flex items-center gap-2">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
                <span className={categoryLabelClass}>
                  {article.category?.name || 'UMUM'}
                </span>
              </div>
              <h3 className="line-clamp-2 font-sans text-sm font-bold leading-[1.3] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[15px]">
                {article.title}
              </h3>
              <p className="line-clamp-2 text-xs leading-relaxed text-brand-text-muted dark:text-brand-text-muted/80">
                {excerptText}
              </p>
              <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[11px] text-brand-text-muted">
                 <span className="flex min-w-0 items-center gap-1"><User size={11}/> <span className="truncate">{authorName}</span></span>
                 <span>{date}</span>
              </div>
            </div>
          </article>
        </Link>
      </div>
    );
  }

  return (
    <div className="relative">
      <ArticleBookmarkButton
        article={article}
        site={site}
        className="absolute right-3 top-3 z-10 h-11 w-11 justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm"
        activeClassName="absolute right-3 top-3 z-10 h-11 w-11 justify-center rounded-full border border-brand-red/40 bg-brand-red/20 text-white"
        idleClassName="absolute right-3 top-3 z-10 h-11 w-11 justify-center rounded-full border border-white/20 bg-black/45 text-white/85 hover:text-white hover:border-white/35"
        iconSize={15}
      />
      <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
        <article
          className="group relative flex cursor-pointer flex-col gap-2 transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01] md:gap-3"
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-xl bg-gray-100 shadow-sm dark:bg-white/5">
            <SmartImage 
              src={imageUrl} 
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="card"
              alt={article.title} 
              fill
              className={defaultImageClass}
              priority={priority}
            />
            <div className="absolute left-3.5 top-3.5 flex flex-col gap-1.5">
              {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center">
              <span className={categoryLabelClass}>
                {article.category?.name || 'UMUM'}
              </span>
            </div>
              <h3 className="line-clamp-2 font-sans text-sm font-extrabold leading-[1.2] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-base">
                {article.title}
              </h3>
              <div className="mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1.5 text-[11px] text-brand-text-muted">
               <div className="flex min-w-0 items-center gap-1">
                  <div className="flex h-4.5 w-4.5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-semibold dark:bg-white/10">
                    {authorName[0] || 'R'}
                  </div>
                 <span className="truncate">{authorName}</span>
               </div>
               <span className="opacity-30">•</span>
               <span>{date}</span>
               <span className="opacity-30">•</span>
               <span className="flex items-center gap-1"><BookOpen size={10}/> {readTime}</span>
            </div>
          </div>
        </article>
      </Link>
    </div>
  );
});
export default NewsCard;
