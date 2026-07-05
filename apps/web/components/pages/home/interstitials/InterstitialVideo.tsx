import Link from 'next/link'
import { Play, Zap } from 'lucide-react'
import { SmartImage } from '../../../ui/SmartImage'
import type { HomeArticle } from '../utils/distribution'

interface InterstitialVideoProps {
  articles: HomeArticle[]
  site: string
}

function getVideoThumbnail(article: HomeArticle): string {
  if (article.featuredImage) return article.featuredImage
  if (Array.isArray(article.blocks)) {
    const embedBlock = article.blocks.find((b) => b.type === 'embed' && b.embedType === 'youtube')
    if (embedBlock?.url) {
      const regExp = /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
      const match = embedBlock.url.match(regExp)
      if (match && match[2].length === 11) {
        return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`
      }
    }
  }
  return '/placeholder.jpg'
}

export function InterstitialVideo({ articles, site }: InterstitialVideoProps) {
  if (!articles || articles.length === 0) return null

  const videos = articles.slice(0, 3)

  return (
    <section className="my-8 rounded-2xl border border-gray-200 bg-white px-5 py-6 shadow-sm dark:border-white/5 dark:bg-white/[0.02] md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <Zap size={14} className="fill-brand-red text-brand-red" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.14em] text-brand-black dark:text-white">
          Laporan Video Eksklusif
        </h3>
      </div>

      {/* Grid: 3 kartu video */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {videos.map((article) => {
          const thumbnail = getVideoThumbnail(article)
          const categoryName =
            article.categories?.[0]?.category?.name ||
            article.category?.name ||
            'Video'

          return (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="group relative block overflow-hidden rounded-xl"
            >
              {/* Thumbnail + Play button */}
              <div className="relative aspect-video overflow-hidden rounded-xl bg-black">
                <SmartImage
                  src={thumbnail}
                  context="card"
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />

                {/* Play overlay */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 transition-colors group-hover:bg-black/40">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full border border-white/40 bg-white/20 backdrop-blur-md transition-transform group-hover:scale-110 group-hover:border-transparent group-hover:bg-brand-red">
                    <Play size={20} className="ml-0.5 fill-white text-white" />
                  </div>
                </div>

                {/* Gradient bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              </div>

              {/* Info */}
              <div className="mt-2.5">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.14em] text-brand-red">
                  {categoryName}
                </span>
                <h4 className="line-clamp-2 font-sans text-xs font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white md:text-[13px]">
                  {article.title}
                </h4>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-brand-text-muted">
                  <span className="truncate">{article.author?.name || 'Redaksi'}</span>
                  <span className="opacity-30">·</span>
                  <span>{article.readingTimeMin || 3} min</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
