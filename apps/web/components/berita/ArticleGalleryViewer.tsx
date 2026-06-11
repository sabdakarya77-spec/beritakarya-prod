'use client'

import { useState, useEffect, useCallback } from 'react'
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Camera } from 'lucide-react'
import { cn } from '../../lib/utils'
import type { ImageItem } from '@beritakarya/types'

// Extended image type for gallery with credit support
interface GalleryImage extends ImageItem {
  credit?: string
}

interface ArticleGalleryViewerProps {
  images: GalleryImage[]
  isOpen: boolean
  onClose: () => void
  initialIndex?: number
}

export function ArticleGalleryViewer({ images, isOpen, onClose, initialIndex = 0 }: ArticleGalleryViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)
  const [isZoomed, setIsZoomed] = useState(false)
  
  // Reset state when opening
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex)
      setIsZoomed(false)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen, initialIndex])
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!isOpen) return
    
    switch (e.key) {
      case 'ArrowLeft':
        setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
        break
      case 'ArrowRight':
        setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
        break
      case 'Escape':
        onClose()
        break
    }
  }, [isOpen, images.length, onClose])
  
  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
  
  const goToPrevious = () => {
    setCurrentIndex(prev => prev > 0 ? prev - 1 : images.length - 1)
    setIsZoomed(false)
  }
  
  const goToNext = () => {
    setCurrentIndex(prev => prev < images.length - 1 ? prev + 1 : 0)
    setIsZoomed(false)
  }
  
  const currentImage = images[currentIndex]
  
  if (!isOpen || !currentImage) return null
  
  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-sm">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4 py-3 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-3">
          <Camera size={16} className="text-white/70" />
          <span className="text-xs text-white/70 font-medium">
            {currentIndex + 1} / {images.length}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Zoom toggle */}
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title={isZoomed ? 'Perkecil' : 'Perbesar'}
          >
            {isZoomed ? <ZoomOut size={18} /> : <ZoomIn size={18} />}
          </button>
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            title="Tutup (ESC)"
          >
            <X size={20} />
          </button>
        </div>
      </div>
      
      {/* Main Image Area */}
      <div 
        className="absolute inset-0 flex items-center justify-center cursor-pointer"
        onClick={goToNext}
      >
        <img
          src={currentImage.url}
          alt={currentImage.alt || `Foto ${currentIndex + 1}`}
          className={cn(
            "max-w-full max-h-full object-contain transition-transform duration-300",
            isZoomed && "scale-150 cursor-grab",
            isZoomed && "cursor-grab"
          )}
          onClick={(e) => {
            e.stopPropagation()
            if (!isZoomed) setIsZoomed(true)
          }}
        />
      </div>
      
      {/* Navigation Arrows */}
      {images.length > 1 && (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToPrevious()
            }}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            title="Sebelumnya"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation()
              goToNext()
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors backdrop-blur-sm"
            title="Selanjutnya"
          >
            <ChevronRight size={24} className="text-white" />
          </button>
        </>
      )}
      
      {/* Caption & Credit */}
  {((currentImage as GalleryImage).caption || (currentImage as GalleryImage).credit) && (
        <div className="absolute bottom-0 left-0 right-0 z-10 p-4 bg-gradient-to-t from-black/80 to-transparent">
          <div className="max-w-4xl mx-auto">
          {(currentImage as GalleryImage).caption && (
            <p className="text-sm text-white mb-1">{(currentImage as GalleryImage).caption}</p>
          )}
          {(currentImage as GalleryImage).credit && (
            <p className="text-xs text-white/60">Foto: {(currentImage as GalleryImage).credit}</p>
          )}
          </div>
        </div>
      )}
      
      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-16 left-0 right-0 z-10 overflow-x-auto">
          <div className="flex items-center justify-center gap-2 px-4 pb-2">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={(e) => {
                  e.stopPropagation()
                  setCurrentIndex(idx)
                  setIsZoomed(false)
                }}
                className={cn(
                  "relative flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all",
                  idx === currentIndex
                    ? "border-white scale-110"
                    : "border-white/30 hover:border-white/60 opacity-60 hover:opacity-100"
                )}
              >
                <img
                  src={img.url}
                  alt={img.alt || `Thumbnail ${idx + 1}`}
                  className="w-full h-full object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ArticleGalleryViewer