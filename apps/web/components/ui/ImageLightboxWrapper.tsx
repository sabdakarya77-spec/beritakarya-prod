'use client';

import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageLightboxWrapperProps {
  children: React.ReactNode;
}

export default function ImageLightboxWrapper({ children }: ImageLightboxWrapperProps) {
  const [activeImage, setActiveImage] = useState<{ src: string; alt: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const handleImageClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Check if clicked element is an image inside the article
      if (target.tagName === 'IMG' && target.closest('article')) {
        const img = target as HTMLImageElement;
        // Exclude avatars or small icons if any
        if (img.width > 120) {
          setActiveImage({
            src: img.src,
            alt: img.alt || 'Dokumentasi BeritaKarya',
          });
          setZoom(1);
          setRotation(0);
        }
      }
    };

    const container = document.querySelector('article');
    container?.addEventListener('click', handleImageClick);
    return () => {
      container?.removeEventListener('click', handleImageClick);
    };
  }, []);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setActiveImage(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      {children}

      <AnimatePresence>
        {activeImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-xl flex flex-col justify-between p-6 select-none"
          >
            {/* Header controls */}
            <div className="flex justify-between items-center w-full max-w-6xl mx-auto z-30">
              <span className="text-[11px] font-black uppercase tracking-[0.25em] text-white/50">
                Media Lightbox Viewer
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setZoom((prev) => Math.min(prev + 0.25, 3))}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                  title="Zoom In"
                >
                  <ZoomIn size={18} />
                </button>
                <button
                  onClick={() => setZoom((prev) => Math.max(prev - 0.25, 0.75))}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                  title="Zoom Out"
                >
                  <ZoomOut size={18} />
                </button>
                <button
                  onClick={() => setRotation((prev) => prev + 90)}
                  className="p-2.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition-colors"
                  title="Putar Gambar"
                >
                  <RotateCcw size={18} />
                </button>
                <button
                  onClick={() => setActiveImage(null)}
                  className="p-2.5 bg-brand-red rounded-full text-white transition-all transform hover:rotate-90"
                  title="Tutup"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Main image container */}
            <div
              className="flex-1 flex items-center justify-center relative overflow-hidden"
              onClick={() => setActiveImage(null)}
            >
              <motion.div
                key={activeImage.src}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                style={{
                  transform: `scale(${zoom}) rotate(${rotation}deg)`,
                }}
                className="max-h-[75vh] max-w-[90vw] md:max-h-[80vh] md:max-w-[80vw] object-contain rounded-lg shadow-2xl border border-white/10 cursor-zoom-out transition-transform duration-200"
                onClick={(e) => e.stopPropagation()}
              >
                <img
                  src={activeImage.src}
                  alt={activeImage.alt}
                  className="max-h-[75vh] max-w-[90vw] md:max-h-[80vh] md:max-w-[80vw] object-contain rounded-lg"
                />
              </motion.div>
            </div>

            {/* Footer caption */}
            <div className="w-full max-w-4xl mx-auto text-center z-30 pb-4">
              <p className="text-white text-sm md:text-base font-light italic leading-relaxed">
                {activeImage.alt}
              </p>
              <span className="text-[10px] font-black uppercase tracking-widest text-brand-red mt-2 block">
                BeritaKarya Editorial Photography
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
