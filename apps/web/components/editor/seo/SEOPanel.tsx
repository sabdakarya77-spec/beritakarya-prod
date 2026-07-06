'use client'

import { useState, useEffect } from 'react'
import { useEditorStore } from '../../../store/editorStore'
import { AlertCircle, CheckCircle, Eye, Smartphone, Monitor } from 'lucide-react'
import { cn } from '../../../lib/utils'

export function SEOPanel() {
  const { 
    metaTitle, 
    metaDescription, 
    title,
    updateArticleData 
  } = useEditorStore()

  const [localTitle, setLocalTitle] = useState(metaTitle)
  const [localDesc, setLocalDesc] = useState(metaDescription)
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('mobile')

  // Sync dengan store (manual only — no fallback to article title)
  useEffect(() => {
    setLocalTitle(metaTitle)
  }, [metaTitle])

  useEffect(() => {
    setLocalDesc(metaDescription)
  }, [metaDescription])

  // Debounced update
  useEffect(() => {
    const timer = setTimeout(() => {
      updateArticleData({ metaTitle: localTitle })
    }, 500)
    return () => clearTimeout(timer)
  }, [localTitle, updateArticleData])

  useEffect(() => {
    const timer = setTimeout(() => {
      updateArticleData({ metaDescription: localDesc })
    }, 500)
    return () => clearTimeout(timer)
  }, [localDesc, updateArticleData])

  // Validation lengths
  const titleLength = localTitle?.length || 0
  const descLength = localDesc?.length || 0
  const titleValid = titleLength >= 40 && titleLength <= 60
  const descValid = descLength >= 120 && descLength <= 160

  // Calculate dynamic SEO Score
  const getSeoScore = () => {
    let score = 0
    if (titleLength >= 40 && titleLength <= 60) score += 30
    else if (titleLength > 0) score += 15
    
    if (descLength >= 120 && descLength <= 160) score += 40
    else if (descLength > 0) score += 20
    
    if (titleLength > 0) score += 15
    if (descLength > 0 && descLength < 200) score += 15
    
    return score
  }
  const seoScore = getSeoScore()

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header SEO Audit & Score */}
      <div className="p-4 bg-panel-surface border border-panel-border rounded-xl flex items-center justify-between gap-3">
        <div className="space-y-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">SEO Score</span>
          <p className="text-xs text-panel-text-secondary">Optimalisasi artikel Anda</p>
        </div>
        <div className="relative flex items-center justify-center">
          <svg className="w-14 h-14 transform -rotate-90">
            <circle
              cx="28"
              cy="28"
              r="24"
              className="stroke-panel-elevated fill-none"
              strokeWidth="4"
            />
            <circle
              cx="28"
              cy="28"
              r="24"
              className={cn(
                "fill-none stroke-current transition-all duration-500 ease-out",
                seoScore >= 80 ? "text-emerald-500" : seoScore >= 50 ? "text-amber-500" : "text-red-500"
              )}
              strokeWidth="4"
              strokeDasharray={`${2 * Math.PI * 24}`}
              strokeDashoffset={`${2 * Math.PI * 24 * (1 - seoScore / 100)}`}
            />
          </svg>
          <span className="absolute text-xs font-black text-panel-text-primary">{seoScore}%</span>
        </div>
      </div>

      {/* Meta Title Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
            Meta Title
          </label>
          <span className={cn(
            "text-[10px] font-bold transition-colors",
            titleLength > 60 ? 'text-red-500' : titleValid ? 'text-emerald-500' : 'text-panel-text-muted'
          )}>
            {titleLength}/60
          </span>
        </div>
        <div className="relative">
          <input
            type="text"
            value={localTitle || ''}
            onChange={(e) => setLocalTitle(e.target.value)}
            placeholder={title || 'Judul meta search engine...'}
            className={cn(
              "w-full px-3 py-2 rounded-lg border text-xs font-medium bg-panel-surface text-panel-text-primary focus:outline-none focus:border-panel-accent transition-all placeholder-panel-text-muted",
              titleLength > 60 ? 'border-red-500/50' : titleValid ? 'border-emerald-500/40' : 'border-panel-border'
            )}
          />
        </div>
        
        {/* Title Feedback */}
        {titleLength === 0 ? (
          <p className="text-[10px] text-panel-text-muted">Target 50-60 karakter untuk hasil penelusuran optimal.</p>
        ) : titleValid ? (
          <p className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
            <CheckCircle className="w-3 h-3 shrink-0" />
            Panjang judul sangat optimal.
          </p>
        ) : titleLength > 60 ? (
          <p className="flex items-center gap-1 text-[10px] text-red-500 font-medium animate-pulse">
            <AlertCircle className="w-3 h-3 shrink-0" />
            Terlalu panjang ({titleLength - 60} karakter berlebih).
          </p>
        ) : (
          <p className="text-[10px] text-amber-500 font-medium">
            Judul agak pendek ({titleLength} karakter). Rekomendasi min 40.
          </p>
        )}
      </div>

      {/* Meta Description Input */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
            Meta Description
          </label>
          <span className={cn(
            "text-[10px] font-bold transition-colors",
            descLength > 160 ? 'text-red-500' : descValid ? 'text-emerald-500' : 'text-panel-text-muted'
          )}>
            {descLength}/160
          </span>
        </div>
        <textarea
          value={localDesc || ''}
          onChange={(e) => setLocalDesc(e.target.value)}
          placeholder="Tulis rangkuman artikel singkat yang menarik pembaca Google..."
          rows={3}
          className={cn(
            "w-full px-3 py-2 rounded-lg border text-xs font-medium bg-panel-surface text-panel-text-primary focus:outline-none focus:border-panel-accent transition-all resize-none placeholder-panel-text-muted",
            descLength > 160 ? 'border-red-500/50' : descValid ? 'border-emerald-500/40' : 'border-panel-border'
          )}
        />
        
        {/* Description Feedback */}
        {descLength === 0 ? (
          <p className="text-[10px] text-panel-text-muted">Target 120-160 karakter agar snippet deskripsi tidak terpotong.</p>
        ) : descValid ? (
          <p className="flex items-center gap-1 text-[10px] text-emerald-500 font-medium">
            <CheckCircle className="w-3 h-3 shrink-0" />
            Deskripsi sudah optimal.
          </p>
        ) : descLength > 160 ? (
          <p className="flex items-center gap-1 text-[10px] text-red-500 font-medium animate-pulse">
            <AlertCircle className="w-3 h-3 shrink-0" />
            Terlalu panjang ({descLength - 160} karakter berlebih).
          </p>
        ) : (
          <p className="text-[10px] text-amber-500 font-medium">
            Deskripsi agak pendek ({descLength} karakter). Rekomendasi min 120.
          </p>
        )}
      </div>

      {/* Google Preview Snippet Mockup */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
            <Eye className="w-3 h-3" />
            Preview Hasil Pencarian
          </label>
          <div className="flex bg-panel-surface border border-panel-border rounded-lg p-0.5">
            <button
              onClick={() => setPreviewDevice('mobile')}
              className={cn(
                "p-1 rounded transition-colors",
                previewDevice === 'mobile' ? "bg-panel-bg text-panel-accent" : "text-panel-text-muted"
              )}
            >
              <Smartphone size={12} />
            </button>
            <button
              onClick={() => setPreviewDevice('desktop')}
              className={cn(
                "p-1 rounded transition-colors",
                previewDevice === 'desktop' ? "bg-panel-bg text-panel-accent" : "text-panel-text-muted"
              )}
            >
              <Monitor size={12} />
            </button>
          </div>
        </div>

        {/* Browser Mockup */}
        <div className={cn(
          "p-4 bg-white dark:bg-[#1e1e1e] rounded-xl border border-panel-border select-none transition-all duration-300 font-sans",
          previewDevice === 'mobile' ? 'max-w-[280px] mx-auto shadow-sm' : 'w-full shadow-sm'
        )}>
          {/* Mockup Content */}
          <div className="space-y-1 text-left">
            {/* Breadcrumb URL */}
            <div className="flex items-center gap-1 text-[11px] text-[#202124] dark:text-[#bdc1c6] truncate">
              <span>https://{typeof window !== 'undefined' ? window.location.hostname : 'beritakarya.co'}</span>
              <span className="text-[9px] opacity-60">›</span>
              <span className="truncate">artikel</span>
            </div>
            {/* Meta Title */}
            <div className="text-[#1a0dab] dark:text-[#8ab4f8] text-[15px] font-medium leading-tight hover:underline cursor-pointer break-words line-clamp-2">
              {localTitle || 'Silakan Isi Meta Title Artikel...'}
            </div>
            {/* Snippet Description */}
            <div className="text-[#4d5156] dark:text-[#bdc1c6] text-[12px] leading-snug break-words line-clamp-3">
              {localDesc || 'Tulis deskripsi snippet menarik di sini agar memicu ketertarikan pembaca di pencarian Google...'}
            </div>
          </div>
        </div>
      </div>

      {/* Dynamic Checklist Audit */}
      <div className="p-3.5 bg-panel-surface border border-panel-border rounded-xl space-y-3">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">Daftar Audit SEO</span>
        </div>
        <ul className="text-[10px] space-y-2 text-panel-text-secondary">
          <li className="flex items-center gap-2">
            <span className={cn("text-[12px] font-bold", titleValid ? "text-emerald-500" : "text-panel-text-muted")}>
              {titleValid ? '✓' : '○'}
            </span>
            <span className={titleValid ? "opacity-60 line-through" : "text-panel-text-primary"}>
              Panjang Meta Title optimal (40-60 karakter)
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className={cn("text-[12px] font-bold", descValid ? "text-emerald-500" : "text-panel-text-muted")}>
              {descValid ? '✓' : '○'}
            </span>
            <span className={descValid ? "opacity-60 line-through" : "text-panel-text-primary"}>
              Panjang Meta Description optimal (120-160 karakter)
            </span>
          </li>
          <li className="flex items-center gap-2">
            <span className={cn("text-[12px] font-bold", titleLength > 0 ? "text-emerald-500" : "text-panel-text-muted")}>
              {titleLength > 0 ? '✓' : '○'}
            </span>
            <span className={titleLength > 0 ? "opacity-60 line-through" : "text-panel-text-primary"}>
              Isi Meta Title khusus search engine
            </span>
          </li>
        </ul>
      </div>
    </div>
  )
}

export default SEOPanel