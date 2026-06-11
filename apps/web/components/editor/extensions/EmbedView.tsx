'use client'

import { NodeViewWrapper, NodeViewProps } from '@tiptap/react'
import { useState } from 'react'
import { 
  Globe, ExternalLink, Video, MessageCircle,
  RefreshCw, Trash2, Edit3, Check, X, Link as LinkIcon
} from 'lucide-react'
import { EmbedType, extractYouTubeId, extractTweetId, detectEmbedType } from './EmbedExtension'

/**
 * EmbedView - React component untuk embed block
 * Mendukung YouTube, Twitter, Instagram, dan custom embeds
 */
export function EmbedView({ node, updateAttributes, selected, deleteNode }: NodeViewProps) {
  const [isEditing, setIsEditing] = useState(!node.attrs.url)
  const [inputUrl, setInputUrl] = useState(node.attrs.url || '')
  const [inputTitle, setInputTitle] = useState(node.attrs.title || '')
  const [isLoading, setIsLoading] = useState(false)
  
  const embedType = (node.attrs.embedType || 'youtube') as EmbedType
  const url = node.attrs.url || ''
  
  const handleSave = () => {
    if (!inputUrl.trim()) return
    
    setIsLoading(true)
    const newType = detectEmbedType(inputUrl)
    
    // Simulate loading
    setTimeout(() => {
      updateAttributes({
        url: inputUrl,
        embedType: newType,
        title: inputTitle || undefined,
      })
      setIsLoading(false)
      setIsEditing(false)
    }, 500)
  }
  
  const handleCancel = () => {
    if (!url) {
      deleteNode()
    } else {
      setInputUrl(url)
      setInputTitle(node.attrs.title || '')
      setIsEditing(false)
    }
  }
  
  const renderEmbedPreview = () => {
    switch (embedType) {
      case 'youtube': {
        const videoId = extractYouTubeId(url)
        if (!videoId) return <div className="text-red-500">Invalid YouTube URL</div>
        return (
          <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
            <iframe
              className="absolute top-0 left-0 w-full h-full rounded-lg"
              src={`https://www.youtube.com/embed/${videoId}`}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={node.attrs.title || 'YouTube video'}
            />
          </div>
        )
      }
      
      case 'twitter': {
        const tweetId = extractTweetId(url)
        if (!tweetId) return <div className="text-red-500">Invalid Twitter URL</div>
        return (
          <div className="bg-slate-100 dark:bg-slate-800 rounded-lg p-4 text-center">
            <MessageCircle className="w-8 h-8 mx-auto mb-2 text-blue-400" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Tweet ID: {tweetId}</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-blue-500 hover:underline mt-2"
            >
              Lihat tweet <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )
      }
      
      case 'instagram': {
        return (
          <div className="bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 text-center">
            <Video className="w-8 h-8 mx-auto mb-2 text-pink-500" />
            <p className="text-sm text-gray-600 dark:text-gray-400">Instagram Post</p>
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-pink-500 hover:underline mt-2"
            >
              Lihat post <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )
      }
      
      default: {
        return (
          <div className="bg-gray-100 dark:bg-slate-800 rounded-lg p-4 text-center">
            <Globe className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <a 
              href={url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-blue-500 hover:underline"
            >
              Buka link <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )
      }
    }
  }
  
  const getEmbedIcon = () => {
    switch (embedType) {
      case 'youtube': return <Video className="w-5 h-5 text-red-500" />
      case 'twitter': return <MessageCircle className="w-5 h-5 text-blue-400" />
      case 'instagram': return <Video className="w-5 h-5 text-pink-500" />
      default: return <Globe className="w-5 h-5 text-gray-500" />
    }
  }
  
  if (isEditing) {
    return (
      <NodeViewWrapper className="embed-view-wrapper my-4">
        <div className={`
          rounded-lg border-2 border-dashed p-4
          ${selected ? 'border-brand-red bg-brand-red/5' : 'border-gray-300 dark:border-gray-600'}
        `}>
          <div className="flex items-center gap-2 mb-4">
            <LinkIcon className="w-5 h-5 text-gray-500" />
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {url ? 'Edit Embed' : 'Tambah Embed'}
            </span>
          </div>
          
          {/* URL Input */}
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                URL
              </label>
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Judul (opsional)
              </label>
              <input
                type="text"
                value={inputTitle}
                onChange={(e) => setInputTitle(e.target.value)}
                placeholder="Judul embed..."
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-slate-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red"
              />
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={!inputUrl.trim() || isLoading}
              className={`
                inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white
                ${inputUrl.trim() ? 'bg-brand-red hover:bg-brand-red/90' : 'bg-gray-300 cursor-not-allowed'}
                transition-colors
              `}
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Memuat...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Simpan
                </>
              )}
            </button>
            <button
              onClick={handleCancel}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Batal
            </button>
          </div>
        </div>
      </NodeViewWrapper>
    )
  }
  
  return (
    <NodeViewWrapper className="embed-view-wrapper my-4 group">
      <div className={`
        rounded-lg overflow-hidden bg-white dark:bg-slate-900 border border-gray-200 dark:border-gray-700
        ${selected ? 'ring-2 ring-brand-red' : ''}
      `}>
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-slate-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            {getEmbedIcon()}
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400 capitalize">
              {embedType}
            </span>
          </div>
          
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => setIsEditing(true)}
              className="p-1.5 rounded hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-500"
              title="Edit"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => deleteNode()}
              className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-500"
              title="Hapus"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Title */}
        {node.attrs.title && (
          <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
            <h4 className="font-medium text-gray-900 dark:text-white">
              {node.attrs.title}
            </h4>
          </div>
        )}
        
        {/* Embed Content */}
        <div className="p-4">
          {renderEmbedPreview()}
        </div>
      </div>
    </NodeViewWrapper>
  )
}

export default EmbedView