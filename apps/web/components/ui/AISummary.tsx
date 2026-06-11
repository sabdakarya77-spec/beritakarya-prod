'use client';

import { motion } from 'framer-motion';
import { Sparkles, X } from 'lucide-react';
import { useState } from 'react';

interface AISummaryProps {
  title: string;
  content: string;
  isVisible?: boolean;
}

export default function AISummary({ title, content, isVisible = false }: AISummaryProps) {
  const [isOpen, setIsOpen] = useState(isVisible);

  // Hidden by default based on user request "disimpan kodenya (tapi disembunyikan)"
  if (!isOpen) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 max-w-sm w-full">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="bg-brand-black border border-white/10 p-6 rounded-xl shadow-2xl overflow-hidden relative"
      >
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-red via-purple-500 to-blue-500" />
        
        <button 
          onClick={() => setIsOpen(false)}
          className="absolute top-4 right-4 text-brand-text-muted hover:text-white transition-colors"
        >
          <X size={16} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={18} className="text-brand-red" />
          <span className="text-[11px] font-semibold uppercase tracking-wide text-white">AI Assistant Summary</span>
        </div>

        <h4 className="text-white font-serif text-lg font-bold mb-3 leading-tight">
          {title}
        </h4>
        
        <p className="text-brand-text-muted text-sm leading-relaxed mb-4 line-clamp-4">
          {content}
        </p>

        <button className="text-[11px] font-semibold text-brand-red hover:underline">
          Baca Selengkapnya
        </button>
      </motion.div>
    </div>
  );
}
