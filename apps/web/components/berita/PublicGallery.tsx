'use client'
import { useState, useEffect } from 'react'
import { SmartImage } from '../ui/SmartImage'
import type { ImageItem } from '@beritakarya/types'

interface Props {
  images: ImageItem[]
}

/**
 * PublicGallery component for displaying image galleries to readers
 * Includes a lightbox with keyboard navigation and thumbnail strip
 */
export function PublicGallery({ images }: Props) {
  const [active, setActive] = useState<number | null>(null)

  // Handle keyboard navigation when lightbox is open
  useEffect(() => {
    if (active === null) return
    
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActive(i => Math.min((i ?? 0) + 1, images.length - 1))
      if (e.key === 'ArrowLeft')  setActive(i => Math.max((i ?? 0) - 1, 0))
      if (e.key === 'Escape')     setActive(null)
    }
    
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [active, images.length])

  // Prevent scrolling when lightbox is open
  useEffect(() => {
    if (active !== null) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => { document.body.style.overflow = 'unset' }
  }, [active])

  return (
    <>
      <figure className="my-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {images.map((img, i) => (
            <button 
              key={i} 
              onClick={() => setActive(i)} 
              className="focus:outline-none group relative overflow-hidden rounded-xl bg-gray-100"
            >
              <SmartImage
                src={img.url} 
                alt={img.alt || `Gallery image ${i + 1}`}
                fill={false}
                width={800}
                height={800}
                context="card"
                className="w-full aspect-square object-cover transition-transform duration-500 group-hover:scale-110 cursor-pointer"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
            </button>
          ))}
        </div>
      </figure>

      {/* Lightbox Modal */}
      {active !== null && (
        <div
          className="fixed inset-0 bg-black/95 z-[9999] flex flex-col items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setActive(null)}
        >
          {/* Main Image */}
          <div className="relative flex flex-col items-center max-w-5xl w-full">
            <SmartImage
              src={images[active]?.url} 
              alt={images[active]?.alt || `Gallery image ${active + 1}`}
              fill={false}
              width={1600}
              height={1200}
              context="gallery_full"
              className="max-h-[75vh] max-w-full object-contain rounded-lg shadow-2xl lightbox-image"
              onClick={e => e.stopPropagation()}
            />
            
            {images[active]?.caption && (
              <div className="bg-black/50 backdrop-blur-md px-4 py-2 rounded-full mt-4 max-w-prose">
                <p className="text-white/90 text-sm text-center">{images[active].caption}</p>
              </div>
            )}
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-12 mt-8">
            <button 
              onClick={e => { e.stopPropagation(); setActive(i => Math.max((i ?? 0) - 1, 0)) }}
              disabled={active === 0}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/20 disabled:opacity-10 transition-all"
            >‹</button>
            
            <div className="flex flex-col items-center">
              <span className="text-white font-medium">{active + 1} / {images.length}</span>
              <div className="h-1 w-12 bg-white/20 rounded-full mt-1">
                <div 
                  className="h-full bg-white rounded-full transition-all duration-300"
                  style={{ width: `${((active + 1) / images.length) * 100}%` }}
                />
              </div>
            </div>

            <button 
              onClick={e => { e.stopPropagation(); setActive(i => Math.min((i ?? 0) + 1, images.length - 1)) }}
              disabled={active === images.length - 1}
              className="w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white text-3xl hover:bg-white/20 disabled:opacity-10 transition-all"
            >›</button>
          </div>

          {/* Thumbnail Strip */}
          <div className="flex gap-2 mt-8 overflow-x-auto max-w-full px-4 no-scrollbar">
            {images.map((img, i) => (
              <div 
                key={i}
                className="shrink-0"
                onClick={e => { e.stopPropagation(); setActive(i) }}
              >
                <SmartImage 
                  src={img.url} 
                  alt={img.alt || `Gallery thumbnail ${i + 1}`}
                  fill={false}
                  width={56}
                  height={56}
                  context="gallery_thumb"
                  className={`w-14 h-14 object-cover rounded-lg cursor-pointer transition-all duration-300 ${
                    i === active 
                      ? 'ring-2 ring-white scale-110 opacity-100 shadow-lg' 
                      : 'opacity-40 hover:opacity-70 scale-100'
                  }`}
                />
              </div>
            ))}
          </div>

          {/* Close Button */}
          <button 
            onClick={() => setActive(null)}
            className="absolute top-6 right-6 w-12 h-12 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-red-500 transition-colors text-2xl"
          >×</button>
        </div>
      )}

      <style jsx>{`
        .lightbox-image {
          animation: zoomIn 0.3s ease-out;
        }
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}
