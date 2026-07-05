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
  category?: { name?: string | null } | null; // legacy
  categories?: Array<{ category?: { name?: string | null; slug?: string | null } | null }> | null;
  author?: { name?: string | null; avatarUrl?: string | null } | null;
  blocks?: NewsCardBlock[];
  isBreaking?: boolean;
  isExclusive?: boolean;
  isFeatured?: boolean;
  excerpt?: string | null;
  status?: string;
}

interface NewsCardProps {
  article: NewsCardArticle;
  variant?: 'large' | 'medium' | 'compact' | 'minimal' | 'horizontal';
  imagePosition?: 'top' | 'left' | 'right' | 'background' | 'none';
  site?: string;
  priority?: boolean;
}

const NewsCard = React.memo(function NewsCard({ article, variant = 'medium', imagePosition, site = 'pusat', priority = false }: NewsCardProps) {
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
  const authorAvatarUrl = article.author?.avatarUrl || null;
  // Primary category: dari categories[0] (baru) atau category (legacy)
  const primaryCategoryName = article.categories?.[0]?.category?.name || article.category?.name || null;
  const categoryLabelClass = cn(
    "rounded-sm px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em]",
    getCategoryColor(primaryCategoryName ?? undefined)
  );
  const calmMetaClass = "flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] font-medium text-brand-text-muted";
  const defaultImageClass = 'object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.03]';
  const horizontalImageClass = 'object-cover object-[center_30%] transition-transform duration-500 ease-out group-hover:scale-[1.04]';
  const heroImageClass = 'object-cover object-[center_26%] opacity-75 transition-all duration-700 ease-out group-hover:scale-[1.03]';

  if (variant === 'large') {
    return (
      <div className="group relative h-full transition-transform duration-300 ease-out hover:-translate-y-0.5">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-4 top-4 z-20 h-11 w-11 justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-sm hover:border-white/20 hover:text-white"
          activeClassName="absolute right-4 top-4 z-20 h-11 w-11 justify-center rounded-full border border-brand-red/40 bg-brand-red/20 text-white"
          idleClassName="absolute right-4 top-4 z-20 h-11 w-11 justify-center rounded-full border border-white/10 bg-black/45 text-white/80 hover:border-white/20 hover:text-white"
          iconSize={16}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)} className="h-full block">
          <article
            className="relative h-full min-h-[340px] w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 shadow-xl"
          >
            <SmartImage
              src={imageUrl}
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="hero_lead"
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
              className={heroImageClass}
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            
            <div className="absolute bottom-0 left-0 w-full max-w-3xl p-5 pb-12 md:p-6 md:pb-8">
              <div className="mb-3.5 flex flex-wrap items-center gap-1.5">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
                <span className="inline-block rounded-sm bg-brand-red px-2.5 py-0.5 text-[11px] font-black uppercase tracking-[0.14em] text-white shadow-sm">
                  {primaryCategoryName || 'UMUM'}
                </span>
              </div>
              <h2 className="max-w-[75%] line-clamp-2 font-sans text-lg font-extrabold leading-[1.15] tracking-tight text-white md:text-xl lg:text-[1.6rem]">
                {article.title}
              </h2>
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
                  {primaryCategoryName || 'UMUM'}
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
    const isRight = imagePosition === 'right';
    return (
      <article className="group relative h-full flex flex-col rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-brand-red/20 hover:shadow-md dark:border-white/5 dark:bg-white/[0.02] dark:hover:border-brand-red/20">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-2 top-2 z-10 h-9 w-9 justify-center rounded-full border border-gray-200 bg-white/90 backdrop-blur-sm dark:border-white/10 dark:bg-black/20"
          activeClassName="absolute right-2 top-2 z-10 h-9 w-9 justify-center rounded-full border border-brand-red/40 bg-brand-red/10 text-brand-red"
          idleClassName="absolute right-2 top-2 z-10 h-9 w-9 justify-center rounded-full border border-gray-200 bg-white/90 text-brand-text-muted hover:text-brand-red hover:border-brand-red/40 dark:border-white/10 dark:bg-black/20"
          iconSize={14}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)} className={`flex-1 flex gap-4 ${isRight ? 'flex-row-reverse' : ''}`}>
          <div className="relative aspect-[4/3] w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 shadow-sm dark:bg-white/5 md:w-36">
            <SmartImage
              src={imageUrl}
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="card_horizontal"
              alt={article.title}
              fill
              sizes="(max-width: 768px) 112px, 144px"
              className={horizontalImageClass}
              priority={priority}
            />
          </div>
          <div className={`flex flex-1 flex-col justify-center gap-2 py-1 min-w-0 ${isRight ? '' : 'pr-10'}`}>
            <div className="flex flex-wrap items-center gap-1.5">
              {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
              <span className={categoryLabelClass}>
                {primaryCategoryName || 'UMUM'}
              </span>
            </div>
            <h3 className="line-clamp-2 font-sans text-sm font-bold leading-[1.3] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[15px]">
              {article.title}
            </h3>
          </div>
        </Link>
      </article>
    );
  }

  // medium + background: full background image like large, tapi lebih pendek
  if (imagePosition === 'background') {
    return (
      <div className="group relative h-full transition-transform duration-300 ease-out hover:-translate-y-0.5">
        <ArticleBookmarkButton
          article={article}
          site={site}
          className="absolute right-3 top-3 z-20 h-10 w-10 justify-center rounded-full border border-white/10 bg-black/45 text-white backdrop-blur-sm"
          activeClassName="absolute right-3 top-3 z-20 h-10 w-10 justify-center rounded-full border border-brand-red/40 bg-brand-red/20 text-white"
          idleClassName="absolute right-3 top-3 z-20 h-10 w-10 justify-center rounded-full border border-white/10 bg-black/45 text-white/80 hover:text-white hover:border-white/20"
          iconSize={14}
        />
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)} className="h-full block">
          <article className="relative h-full min-h-[220px] w-full cursor-pointer overflow-hidden rounded-2xl bg-slate-900 shadow-xl">
            <SmartImage
              src={imageUrl}
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="card"
              alt={article.title}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={heroImageClass}
              priority={priority}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/55 to-transparent" />
            <div className="absolute bottom-0 left-0 w-full p-4 pb-6 md:p-5 md:pb-6">
              <div className="mb-2 flex flex-wrap items-center gap-1.5">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
                <span className="inline-block rounded-sm bg-brand-red px-2 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-white">
                  {primaryCategoryName || 'UMUM'}
                </span>
              </div>
              <h3 className="line-clamp-2 font-sans text-sm font-extrabold leading-[1.15] tracking-tight text-white md:text-base">
                {article.title}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-white/70">
                <span>{authorName}</span>
                <span className="opacity-30">•</span>
                <span>{date}</span>
              </div>
            </div>
          </article>
        </Link>
      </div>
    );
  }

  // compact: kartu kecil — image aspect-4/3, title line-clamp-1, no excerpt
  if (variant === 'compact') {
    return (
      <div className="group relative transition-transform duration-300 ease-out hover:-translate-y-0.5 hover:scale-[1.01]">
        <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
          <article className="relative flex cursor-pointer flex-col gap-1.5">
            <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-gray-100 shadow-sm dark:bg-white/5">
              <SmartImage
                src={imageUrl}
                blur={article.featuredImageBlur}
                dominantColor={article.featuredImageColor}
                context="card"
                alt={article.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className={defaultImageClass}
                priority={priority}
              />
              <div className="absolute left-2.5 top-2.5 flex flex-wrap gap-1">
                {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
              </div>
            </div>
            <div className="flex flex-col gap-1 px-0.5">
              <span className="text-[10px] font-black uppercase tracking-[0.12em] text-brand-red">
                {primaryCategoryName || 'UMUM'}
              </span>
              <h3 className="line-clamp-1 font-sans text-xs font-bold leading-tight tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white sm:text-sm">
                {article.title}
              </h3>
              <div className="flex items-center gap-1.5 text-[10px] text-brand-text-muted">
                <span className="truncate">{authorName}</span>
                <span className="opacity-30">·</span>
                <span>{readTime}</span>
              </div>
            </div>
          </article>
        </Link>
      </div>
    );
  }

  // default medium: image on top
  return (
    <div className="group relative transition-transform duration-300 ease-out hover:-translate-y-1 hover:scale-[1.01]">
      <ArticleBookmarkButton
        article={article}
        site={site}
        className="absolute right-3 top-3 z-20 h-11 w-11 justify-center rounded-full border border-white/20 bg-black/45 text-white backdrop-blur-sm"
        activeClassName="absolute right-3 top-3 z-20 h-11 w-11 justify-center rounded-full border border-brand-red/40 bg-brand-red/20 text-white"
        idleClassName="absolute right-3 top-3 z-20 h-11 w-11 justify-center rounded-full border border-white/20 bg-black/45 text-white/85 hover:text-white hover:border-white/35"
        iconSize={15}
      />
      <Link href={articleHref} onMouseEnter={() => prefetchImage(imageUrl)}>
        <article
          className="relative flex cursor-pointer flex-col gap-2 md:gap-3"
        >
          <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gray-100 shadow-sm dark:bg-white/5">
            <SmartImage
              src={imageUrl}
              blur={article.featuredImageBlur}
              dominantColor={article.featuredImageColor}
              context="card"
              alt={article.title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className={defaultImageClass}
              priority={priority}
            />
            <div className="absolute left-3.5 top-3.5 flex flex-wrap gap-1.5">
              {badgeVariant && <EditorialBadge variant={badgeVariant} size="sm" />}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={categoryLabelClass}>
                {primaryCategoryName || 'UMUM'}
              </span>
            </div>
              <h3 className="line-clamp-2 font-sans text-sm font-extrabold leading-[1.2] tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-base">
                {article.title}
              </h3>
          </div>
        </article>
      </Link>
    </div>
  );
});
export default NewsCard;
