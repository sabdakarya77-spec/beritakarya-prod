import Link from 'next/link'
import { Camera } from 'lucide-react'
import { SmartImage } from '../../../ui/SmartImage'
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

  const photos = articles.slice(0, 3)

  return (
    <section className="my-8 rounded-2xl bg-slate-900 px-5 py-6 md:px-6 md:py-8">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2">
        <Camera size={14} className="text-brand-red" />
        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-white">
          Foto Jurnalistik
        </h3>
      </div>

      {/* Grid: 3 kartu landscape */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
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
              className="group relative block overflow-hidden rounded-xl"
            >
              {/* Gambar landscape */}
              <div className="relative aspect-[3/2] w-full bg-slate-800">
                <SmartImage
                  src={imageUrl}
                  context="card"
                  alt={article.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              </div>

              {/* Caption + Photographer */}
              <div className="mt-2.5">
                <span className="mb-1 block text-[9px] font-black uppercase tracking-[0.14em] text-brand-red/80">
                  {categoryName}
                </span>
                <h4 className="line-clamp-2 font-sans text-xs font-bold leading-snug tracking-tight text-white/90 transition-colors group-hover:text-white md:text-[13px]">
                  {article.title}
                </h4>
                <div className="mt-1.5 flex items-center gap-1.5 text-[10px] text-white/50">
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
