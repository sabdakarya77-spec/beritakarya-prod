'use client'

import { useState, useRef, useEffect, useMemo } from 'react'

interface YouTubeEmbedProps {
  url: string
  title?: string
  thumbnailQuality?: 'maxresdefault' | 'hqdefault' | 'sddefault'
}

/**
 * YouTubeEmbed — pemutar video YouTube berperforma tinggi.
 *
 * Fitur utama:
 * - Intersection Observer: thumbnail hanya dimuat saat mendekati viewport (300px sebelumnya)
 * - Click-to-Play: iframe YouTube tidak di-mount hingga pengguna mengklik tombol putar
 * - Multi-stage fallback thumbnail: maxresdefault → hqdefault → sddefault → fallback lokal
 * - Real skeleton loading: menggunakan event onLoad untuk menampilkan spinner selama download gambar
 * - Aksesibilitas (a11y): role="button", tabIndex, onKeyDown (Enter)
 * - YouTube-nocookie.com + parameter optimal: autoplay, rel=0, modestbranding, playsinline
 */
export function YouTubeEmbed({
  url,
  title,
  thumbnailQuality = 'maxresdefault',
}: YouTubeEmbedProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [shouldLoad, setShouldLoad] = useState(false)
  const [imgSrc, setImgSrc] = useState<string>('')
  const [hasError, setHasError] = useState(false)
  const [isImgLoading, setIsImgLoading] = useState(true)

  const containerRef = useRef<HTMLDivElement>(null)

  // Ekstrak Video ID dengan useMemo agar regex hanya dijalankan jika url berubah
  const videoId = useMemo(() => {
    const regExp =
      /^.*(youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/
    const match = url.match(regExp)
    return match && match[2].length === 11 ? match[2] : null
  }, [url])

  // Set thumbnail awal setiap kali videoId atau kualitas thumbnail berubah
  useEffect(() => {
    if (videoId) {
      setImgSrc(
        `https://img.youtube.com/vi/${videoId}/${thumbnailQuality}.jpg`
      )
      setHasError(false)
      setIsImgLoading(true)
    }
  }, [videoId, thumbnailQuality])

  // Intersection Observer — memicu load asset hanya saat mendekati viewport
  useEffect(() => {
    if (!containerRef.current || !videoId) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true)
          observer.disconnect()
        }
      },
      { rootMargin: '300px' }
    )

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [videoId])

  // Render error state jika URL tidak valid
  if (!videoId) {
    return (
      <div className="p-8 text-center bg-red-50 text-red-600 rounded-2xl text-sm font-medium">
        URL YouTube tidak valid
      </div>
    )
  }

  // Parameter optimal YouTube: privacy-enhanced mode, no related videos, autoplay, iOS-safe
  const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`

  // Fallback bertingkat: maxresdefault → hqdefault → sddefault → hasError
  const handleImageError = () => {
    if (imgSrc.includes('maxresdefault')) {
      setImgSrc(`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`)
      setIsImgLoading(true)
    } else if (imgSrc.includes('hqdefault')) {
      setImgSrc(`https://img.youtube.com/vi/${videoId}/sddefault.jpg`)
      setIsImgLoading(true)
    } else {
      // Semua resolusi gagal — tampilkan fallback lokal
      setHasError(true)
      setIsImgLoading(false)
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative aspect-video w-full rounded-2xl overflow-hidden shadow-lg bg-black group"
    >
      {!isPlaying ? (
        <div
          className="absolute inset-0 cursor-pointer"
          onClick={() => setIsPlaying(true)}
          role="button"
          tabIndex={0}
          aria-label={`Putar video: ${title || 'YouTube Video'}`}
          onKeyDown={(e) => e.key === 'Enter' && setIsPlaying(true)}
        >
          {/* 1. Skeleton loading — aktif selama gambar diunduh dari jaringan */}
          {shouldLoad && isImgLoading && !hasError && (
            <div className="absolute inset-0 bg-gray-950 animate-pulse flex items-center justify-center">
              <div className="w-12 h-12 border-4 border-gray-800 border-t-red-600 rounded-full animate-spin" />
            </div>
          )}

          {/* 2. Thumbnail — opacity transition mulus setelah gambar selesai dimuat */}
          {shouldLoad && imgSrc && !hasError && (
            <img
              src={imgSrc}
              alt={title || 'Thumbnail video'}
              className={`absolute inset-0 w-full h-full object-cover transition-all duration-500 group-hover:brightness-75 ${
                isImgLoading ? 'opacity-0' : 'opacity-100'
              }`}
              loading="lazy"
              onLoad={() => setIsImgLoading(false)}
              onError={handleImageError}
            />
          )}

          {/* 3. Fallback lokal estetik — tetap dapat diklik untuk memutar video */}
          {hasError && (
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <div className="text-center opacity-40 group-hover:opacity-60 transition-opacity duration-300">
                <div className="w-20 h-20 mx-auto mb-4 bg-gray-800 rounded-2xl flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M7 4v16M17 4v16M3 8h18M3 16h18"
                    />
                  </svg>
                </div>
                <p className="text-gray-400 text-xs tracking-wider uppercase font-bold">
                  Putar Video Eksklusif
                </p>
              </div>
            </div>
          )}

          {/* Overlay gradient agar teks terbaca di atas thumbnail */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Badge Eksklusif */}
          <div className="absolute top-4 left-4 bg-red-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md select-none z-10">
            EKSKLUSIF
          </div>

          {/* Tombol Play Premium */}
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl transition-all duration-300 group-hover:scale-110 group-active:scale-95">
              <svg
                className="w-10 h-10 text-red-600 ml-1"
                fill="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
          </div>

          {/* Judul video di bagian bawah */}
          {title && (
            <div className="absolute bottom-4 left-4 right-4 text-white text-sm line-clamp-2 font-medium z-10">
              {title}
            </div>
          )}
        </div>
      ) : (
        <iframe
          src={embedUrl}
          className="absolute inset-0 w-full h-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={title || 'Video Eksklusif'}
        />
      )}
    </div>
  )
}
