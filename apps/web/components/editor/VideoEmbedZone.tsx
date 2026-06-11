'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { Video, Link, X, Play, AlertCircle } from 'lucide-react'
import { useEditorStore } from '../../store/editorStore'
import { cn } from '../../lib/utils'

interface VideoEmbedZoneProps {
  onVideoChange?: (embedUrl: string, embedType: 'youtube' | 'vimeo' | 'other') => void
}

export function VideoEmbedZone({ onVideoChange }: VideoEmbedZoneProps) {
  const { blocks, updateBlock, addBlock } = useEditorStore()

  // Find existing embed block
  const existingEmbedBlock = blocks.find(b => b.type === 'embed') as any
  const initialUrl = existingEmbedBlock?.url || ''

  const [videoUrl, setVideoUrl] = useState(initialUrl)
  const [videoTitle, setVideoTitle] = useState(existingEmbedBlock?.title || '')

  // Narrative text for video exclusive
  const existingParagraph = blocks.find(b => b.type === 'paragraph')
  const [narrativeText, setNarrativeText] = useState((existingParagraph as any)?.content || '')
  
  // Detect video type from URL
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const embedInfo = useMemo(() => {
    if (!videoUrl.trim()) return null
    
    // YouTube patterns
    const youtubePatterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/
    ]
    
    for (const pattern of youtubePatterns) {
      const match = videoUrl.match(pattern)
      if (match) {
        return {
          type: 'youtube' as const,
          videoId: match[1],
          embedUrl: `https://www.youtube.com/embed/${match[1]}`,
          thumbnail: `https://img.youtube.com/vi/${match[1]}/maxresdefault.jpg`
        }
      }
    }
    
    // Vimeo patterns
    const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/)
    if (vimeoMatch) {
      return {
        type: 'vimeo' as const,
        videoId: vimeoMatch[1],
        embedUrl: `https://player.vimeo.com/video/${vimeoMatch[1]}`,
        thumbnail: null
      }
    }
    
    // Other URLs - treat as direct embed
    return {
      type: 'other' as const,
      videoId: null,
      embedUrl: videoUrl,
      thumbnail: null
    }
  }, [videoUrl])

  // Auto-sync video embed to store
  useEffect(() => {
    if (!embedInfo || !videoUrl.trim()) return

    const currentBlocks = useEditorStore.getState().blocks
    const existingBlock = currentBlocks.find(b => b.type === 'embed')

    const embedData = {
      url: videoUrl.trim(),
      embedType: embedInfo.type,
      title: videoTitle.trim() || undefined
    }

    if (existingBlock) {
      updateBlock(existingBlock.id, embedData)
    } else {
      addBlock('embed')
      setTimeout(() => {
        const freshBlocks = useEditorStore.getState().blocks
        const newBlock = freshBlocks.find(b => b.type === 'embed')
        if (newBlock) {
          updateBlock(newBlock.id, embedData)
        }
      }, 0)
    }
  }, [videoUrl, videoTitle, embedInfo, updateBlock, addBlock])

  // Auto-sync narrative text to paragraph block
  useEffect(() => {
    const currentBlocks = useEditorStore.getState().blocks
    const paragraphBlock = currentBlocks.find(b => b.type === 'paragraph')

    if (narrativeText.trim()) {
      if (paragraphBlock) {
        updateBlock(paragraphBlock.id, { content: narrativeText })
      } else {
        addBlock('paragraph')
        setTimeout(() => {
          const freshBlocks = useEditorStore.getState().blocks
          const newParagraph = freshBlocks.find(b => b.type === 'paragraph')
          if (newParagraph) {
            updateBlock(newParagraph.id, { content: narrativeText })
          }
        }, 0)
      }
    }
  }, [narrativeText, updateBlock, addBlock])

  const handleSave = useCallback(() => {
    if (!embedInfo || !videoUrl.trim()) return

    const currentBlocks = useEditorStore.getState().blocks
    const existingBlock = currentBlocks.find(b => b.type === 'embed')

    const embedData = {
      url: videoUrl.trim(),
      embedType: embedInfo.type,
      title: videoTitle.trim() || undefined
    }

    if (existingBlock) {
      updateBlock(existingBlock.id, embedData)
    } else {
      addBlock('embed')
      setTimeout(() => {
        const freshBlocks = useEditorStore.getState().blocks
        const newBlock = freshBlocks.find(b => b.type === 'embed')
        if (newBlock) {
          updateBlock(newBlock.id, embedData)
        }
      }, 0)
    }

    onVideoChange?.(embedInfo.embedUrl, embedInfo.type)
  }, [videoUrl, videoTitle, embedInfo, updateBlock, addBlock, onVideoChange])

  const handleRemove = useCallback(() => {
    const currentBlocks = useEditorStore.getState().blocks
    const existingBlock = currentBlocks.find(b => b.type === 'embed')
    if (existingBlock) {
      updateBlock(existingBlock.id, { url: '', embedType: 'youtube', title: '' })
    }
    setVideoUrl('')
    setVideoTitle('')
  }, [updateBlock])
  
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <Video size={16} className="text-purple-500" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-panel-text-primary">Video Eksklusif</h3>
          <p className="text-[10px] text-panel-text-secondary">Embed YouTube atau Vimeo</p>
        </div>
      </div>
      
      {/* Video URL Input */}
      <div className="space-y-2">
        <label className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
          <Link size={12} />
          URL Video
        </label>
        <div className="relative">
          <input
            type="url"
            value={videoUrl}
            onChange={(e) => setVideoUrl(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            className="w-full px-3 py-2.5 pr-10 rounded-xl border border-panel-border bg-panel-surface text-xs text-panel-text-primary focus:outline-none focus:border-panel-accent transition-all placeholder-panel-text-muted"
          />
          {videoUrl && (
            <button
              type="button"
              onClick={() => setVideoUrl('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-panel-text-muted hover:text-panel-text-secondary"
            >
              <X size={14} />
            </button>
          )}
        </div>
        
        {/* Supported formats hint */}
        <div className="flex items-center gap-2 text-[9px] text-panel-text-muted">
          <span>Didukung:</span>
          <span className="px-1.5 py-0.5 bg-panel-elevated rounded">YouTube</span>
          <span className="px-1.5 py-0.5 bg-panel-elevated rounded">Vimeo</span>
          <span className="px-1.5 py-0.5 bg-panel-elevated rounded">URL Embed</span>
        </div>
      </div>
      
      {/* Video Title */}
      <div className="space-y-2">
        <label className="text-[10px] font-bold uppercase tracking-wider text-panel-text-secondary">
          Judul Video (opsional)
        </label>
        <input
          type="text"
          value={videoTitle}
          onChange={(e) => setVideoTitle(e.target.value)}
          placeholder="Contoh: Dokumenter Kebakaran Hutan 2025"
          className="w-full px-3 py-2 rounded-xl border border-panel-border bg-panel-surface text-xs text-panel-text-primary focus:outline-none focus:border-panel-accent transition-all placeholder-panel-text-muted"
        />
      </div>
      
      {/* Preview */}
      {embedInfo && videoUrl && (
        <div className="space-y-3">
          {/* Detected type badge */}
          <div className="flex items-center gap-2">
            <span className={cn(
              "px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider",
              embedInfo.type === 'youtube' && "bg-red-500/10 text-red-500",
              embedInfo.type === 'vimeo' && "bg-blue-500/10 text-blue-500",
              embedInfo.type === 'other' && "bg-panel-elevated text-panel-text-secondary"
            )}>
              {embedInfo.type === 'youtube' && 'YouTube'}
              {embedInfo.type === 'vimeo' && 'Vimeo'}
              {embedInfo.type === 'other' && 'Embed'}
            </span>
            {embedInfo.type === 'other' && (
              <div className="flex items-center gap-1 text-[9px] text-amber-500">
                <AlertCircle size={10} />
                <span>URL tidak dikenali, akan diembed langsung</span>
              </div>
            )}
          </div>
          
          {/* Video preview */}
          <div className="relative aspect-video rounded-xl overflow-hidden bg-black">
            {embedInfo.type === 'youtube' && embedInfo.thumbnail ? (
              <div className="relative w-full h-full">
                <img
                  src={embedInfo.thumbnail}
                  alt="Video thumbnail"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Play size={32} className="text-white ml-1" />
                  </div>
                </div>
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <Video size={32} className="mx-auto text-white/50 mb-2" />
                  <p className="text-[10px] text-white/50">Preview akan muncul saat disimpan</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleSave}
          disabled={!videoUrl.trim()}
          className={cn(
            "flex-1 px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider transition-all",
            videoUrl.trim()
              ? "bg-panel-accent text-white hover:bg-panel-accent/80"
              : "bg-panel-elevated text-panel-text-muted cursor-not-allowed"
          )}
        >
          Simpan Video
        </button>

        {videoUrl && (
          <button
            onClick={handleRemove}
            className="px-4 py-2.5 rounded-xl text-[11px] font-bold uppercase tracking-wider bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all"
          >
            Hapus
          </button>
        )}
      </div>

      {/* Narrative Text */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-panel-text-primary">
            Narasi Video
          </label>
          <span className="text-[10px] text-panel-text-muted">
            {(() => {
              const content = narrativeText.replace(/<[^>]*>/g, '')
              const count = content.split(/\s+/).filter(Boolean).length
              return `${count} kata`
            })()}
          </span>
        </div>
        <textarea
          value={narrativeText}
          onChange={(e) => setNarrativeText(e.target.value)}
          placeholder="Tulis narasi video eksklusif di sini... (minimal 15 kata)"
          rows={6}
          className="w-full px-4 py-3 bg-panel-surface border border-panel-border rounded-xl text-sm text-panel-text-primary placeholder-panel-text-muted resize-y focus:outline-none focus:ring-2 focus:ring-panel-accent/30 focus:border-panel-accent"
        />
      </div>
    </div>
  )
}

export default VideoEmbedZone