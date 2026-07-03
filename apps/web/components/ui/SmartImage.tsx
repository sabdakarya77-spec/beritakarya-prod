'use client'

import React, { useState, useEffect } from 'react'
import Image, { ImageProps } from 'next/image'

/**
 * SIZES_MAP for responsive images
 * 
 * Optimized responsive breakpoints based on:
 * - Mobile: 640px and below
 * - Tablet: 641px to 1024px  
 * - Desktop: 1025px and above
 * 
 * Values are based on common container widths and content areas
 */
const SIZES_MAP = {
  // Hero images — mobile: max 640px (bukan 100vw yang bisa request 1080px+)
  hero_lead: '(max-width: 640px) 640px, (max-width: 1024px) 90vw, 800px',
  hero_side: '(max-width: 640px) 640px, (max-width: 1024px) 45vw, 400px',

  // Card images — mobile viewport biasanya ~360px, 480px cukup untuk 2x DPR
  card: '(max-width: 640px) 480px, (max-width: 768px) 384px, (max-width: 1024px) 340px, 400px',
  card_horizontal: '(max-width: 640px) 160px, 200px',

  // Article images
  article_cover: '(max-width: 640px) 640px, (max-width: 1024px) 85vw, 800px',
  article_block: '(max-width: 640px) 640px, (max-width: 1024px) 80vw, 600px',

  // Gallery
  gallery_thumb: '(max-width: 640px) 80px, 56px',
  gallery_full: '100vw',

  // Other
  media_text: '(max-width: 640px) 640px, (max-width: 768px) 50vw, 380px',
  logo: '200px',

  // Avatars & thumbnails — kecil, tidak perlu besar
  avatar: '(max-width: 640px) 48px, (max-width: 768px) 56px, 64px',
  thumbnail: '(max-width: 640px) 120px, (max-width: 768px) 160px, 200px',
}

/**
 * Quality settings per context. Tuned for visual fidelity vs bandwidth:
 * - Higher quality (85-95) for hero/cover/logo (largest visual impact)
 * - Mid quality (75-80) for cards/article blocks (balanced)
 * - Lower quality (65-75) for thumbs/small UI (bandwidth saver)
 */
const QUALITY_MAP: Record<SmartImageContext, number> = {
  hero_lead: 85,
  hero_side: 80,
  card: 75,
  card_horizontal: 75,
  article_cover: 85,
  article_block: 80,
  gallery_thumb: 70,
  gallery_full: 85,
  media_text: 80,
  logo: 95,
  avatar: 80,
  thumbnail: 75,
}

export type SmartImageContext = keyof typeof SIZES_MAP

interface SmartImageProps extends Omit<ImageProps, 'src' | 'blurDataURL'> {
  src?: string | null
  thumbUrl?: string | null
  blur?: string | null
  context?: SmartImageContext
  fallbackSrc?: string
  dominantColor?: string | null
  wrapperClassName?: string
  // Additional custom props that might be passed but not valid for <img>
  text?: unknown
  content?: string
  body?: unknown
}

const getThumbUrl = (url: string) => {
  if (url && url.includes('/api/v1/media/uploads/') && !url.includes('/thumbs/')) {
    const parts = url.split('/api/v1/media/uploads/')
    const base = parts[0]
    const file = parts[1]
    if (file) {
      const fileParts = file.split('.')
      const ext = fileParts.pop()
      const name = fileParts.join('.')
      return `${base}/api/v1/media/uploads/thumbs/${name}_thumb.${ext}`
    }
  }
  return url
}

export const prefetchImage = (url: string) => {
  if (typeof document === 'undefined' || !url) return
  const existing = document.querySelector(`link[href="${url}"]`)
  if (existing) return

  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = 'image'
  link.href = url
  document.head.appendChild(link)
}

const FALLBACK_IMAGE = '/placeholder.jpg'

export function SmartImage({
  src,
  thumbUrl,
  blur,
  context = 'card',
  fallbackSrc = FALLBACK_IMAGE,
  dominantColor,
  alt,
  className = '',
  wrapperClassName = '',
  priority = false,
  fill = true,
  quality,
  loading,
  ...props
}: SmartImageProps) {
  const [errorLevel, setErrorLevel] = useState(0) // 0: src, 1: thumb, 2: static, 3: fail
  const [isLoaded, setIsLoaded] = useState(false)
  const [isSlow, setIsSlow] = useState(false)
  const [userInteracted, setUserInteracted] = useState(false)

  // Filter out non-Image props that could cause React errors when spread onto <img>
  // These props are valid for custom usage but not valid DOM attributes for <img>
  const { text: _text, content: _content, body: _body, ...validImageProps } = props;

  useEffect(() => {
    type NetworkInformation = { effectiveType?: string; saveData?: boolean };
    const nav = navigator as Navigator & { connection?: NetworkInformation; mozConnection?: NetworkInformation; webkitConnection?: NetworkInformation };
    const conn = nav.connection ?? nav.mozConnection ?? nav.webkitConnection;
    if (conn) {
      if (conn.effectiveType === '2g' || conn.effectiveType === '3g' || conn.saveData) {
        setIsSlow(true)
      }
    }
  }, [])

  const rawSrc = src || fallbackSrc
  const thumb = thumbUrl || getThumbUrl(rawSrc)

  let finalSrc = rawSrc
  if (isSlow && !userInteracted && thumb) {
    finalSrc = thumb
  }

  // Derive current image source based on error level
  let imgSrc = finalSrc
  if (errorLevel === 1 && thumb) imgSrc = thumb
  else if (errorLevel === 2) imgSrc = fallbackSrc
  else if (errorLevel >= 3) imgSrc = ''

  useEffect(() => {
    setErrorLevel(0)
    setIsLoaded(false)
  }, [src, thumbUrl, fallbackSrc])

  const handleError = () => {
    setErrorLevel(prev => {
      // If we failed on src and have a thumbUrl, try thumbUrl
      if (prev === 0 && thumbUrl) return 1
      // If we failed on thumbUrl (or had none), try fallback
      if (prev === 0 || prev === 1) return 2
      // If fallback fails, show broken state
      return 3
    })
  }

  const hasFatalError = errorLevel >= 3

  // Determine placeholder strategy
  const isBase64 = imgSrc.startsWith('data:image')
  const shouldBlur = blur && !isBase64 && errorLevel === 0

  return (
    <div
      className={`overflow-hidden bg-slate-100 dark:bg-slate-800 ${fill ? 'absolute inset-0 w-full h-full' : 'relative'} ${wrapperClassName}`}
      style={dominantColor ? { backgroundColor: dominantColor } : undefined}
      onMouseEnter={() => setUserInteracted(true)}
      onTouchStart={() => setUserInteracted(true)}
    >
      {/* Loading Shimmer (Only visible while loading) */}
      {!isLoaded && !shouldBlur && (
        <div className="absolute inset-0 animate-pulse bg-slate-200 dark:bg-slate-700" />
      )}

      {hasFatalError || !imgSrc ? (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-100 dark:bg-slate-800">
          <svg className="w-12 h-12 text-slate-300 dark:text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      ) : (
        <Image
          {...validImageProps}
          src={imgSrc}
          alt={alt || 'Gambar BeritaKarya'}
          fill={fill}
          sizes={SIZES_MAP[context]}
          quality={quality ?? QUALITY_MAP[context]}
          priority={priority}
          loading={loading ?? (priority ? 'eager' : 'lazy')}
          placeholder={shouldBlur ? 'blur' : 'empty'}
          blurDataURL={shouldBlur ? blur! : undefined}
          onLoad={() => setIsLoaded(true)}
          onError={handleError}
          className={`
            transition-all duration-700 ease-in-out
            ${isLoaded ? 'opacity-100' : 'opacity-0'}
            ${fill ? 'absolute inset-0 w-full h-full' : ''}
            ${className}
          `}
        />
      )}
    </div>
  )
}