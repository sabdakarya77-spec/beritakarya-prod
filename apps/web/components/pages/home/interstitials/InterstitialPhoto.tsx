import Link from 'next/link'
import { Camera } from 'lucide-react'
import { SmartImage } from '../../../ui/SmartImage'
import { SectionEyebrow } from '../../../ui/Typography'
import type { HomeArticle } from '../utils/distribution'

interface InterstitialPhotoProps {
  articles: HomeArticle[]
  site: string
}

function getPhotoUrl(article: HomeArticle): string {
  if (article.featuredImage) return article.featuredImage
  if (Array.isArray(article.blocks)) {
    const gallery = article.blocks.find((b) => b.type === 'gallery')
    if (gallery?.images?.[0]?.url) return gallery.images[0].url
    const img = article.blocks.find((b) => b.type === 'image')
    if (img?.url) return img.url
    const grid = article.blocks.find((b) => b.type === 'imageGrid')
    if (grid?.images?.[0]?.url) return grid.images[0].url
  }
  return '/placeholder.jpg'
}

export function InterstitialPhoto({ articles, site }: InterstitialPhotoProps) {
  if (!articles || articles.length === 0) return null

  const photos = articles.slice(0, 4)

  return (
    <section>
      {/* Header — konsisten dengan zona lain */}
      <div className="mb-5 flex items-center gap-2">
        <Camera size={14} className="text-brand-red" />
        <SectionEyebrow as="h3" className="text-brand-black dark:text-white">
          Foto Jurnalistik
        </SectionEyebrow>
      </div>

      {/* Desktop: 4 kolom grid | Mobile: horizontal scroll 1 card full-width */}
      <div
        className="
          flex gap-4 overflow-x-auto pb-2
          snap-x snap-mandatory
          scrollbar-hide
          md:grid md:grid-cols-4 md:overflow-visible md:pb-0
        "
      >
        {photos.map((article) => {
          const imageUrl = getPhotoUrl(article)
          const categoryName =
            article.categories?.[0]?.category?.name ||
            article.category?.name ||
            'Foto'

          return (
            <Link
              key={article.id}
              href={`/${site}/artikel/${article.slug}`}
              className="
                group flex-none w-[85vw] snap-start
                md:w-auto md:flex-auto
                flex flex-col
              "
            >
              {/* Gambar 3:4 portrait — tanpa border/card wrapper */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                <SmartImage
                  src={imageUrl}
                  context="card"
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 85vw, 25vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                {/* Gradient overlay bawah */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              </div>

              {/* Caption — di luar gambar, tidak ada wrapper tambahan */}
              <div className="mt-3 space-y-1">
                <span className="block text-[9px] font-black uppercase tracking-[0.14em] text-brand-red">
                  {categoryName}
                </span>
                <h4 className="line-clamp-2 font-sans text-[13px] font-bold leading-snug tracking-tight text-brand-black transition-colors group-hover:text-brand-red dark:text-white">
                  {article.title}
                </h4>
                <div className="flex items-center gap-1.5 text-[10px] text-brand-text-muted dark:text-white/50">
                  <span className="truncate">{article.author?.name || 'Fotografer'}</span>
                </div>
              </div>
            </Link>
          )
        })}
      </div>
    </section>
  )
}
