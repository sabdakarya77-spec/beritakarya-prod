'use client'

/**
 * HomepageConfigDialog — Template selector + customize untuk homepage site.
 * Dipanggil dari admin page, 1 dialog per site.
 */

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X, Save, Loader2, Layout, Palette } from 'lucide-react'
import { api } from '../../lib/api'

// ─── Types ───────────────────────────────────────────────────────────────

interface InterstitialItem {
  id: string
  afterCardIndex: number
  widget: string
  enabled: boolean
}

interface HomepageConfig {
  id: string
  siteId: string
  template: string
  heroMode: string
  heroAutoRotate: boolean
  heroIntervalMs: number
  feedLayout: string
  trendingStyle: string
  scoreFreshness: number
  scoreEngagement: number
  scoreEditorial: number
  scoreRelevance: number
  opinionCategories: string[]
  photoCategories: string[]
  videoCategories: string[]
  sectionOrder: string[]
  sectionVisibility: Record<string, boolean>
  feedColumns: number
  showExcerpt: boolean
  interstitials: InterstitialItem[]
}

interface TemplateOption {
  key: string
  name: string
  desc: string
  hero: string
  feed: string
  trending: string
  color: string
}

const TEMPLATES: TemplateOption[] = [
  { key: 'A', name: 'Classic Editorial', desc: 'Bersih, rapi, terinspirasi NYT', hero: 'BENTO_4', feed: 'pattern_rotation', trending: 'horizontal_strip', color: 'bg-blue-500' },
  { key: 'B', name: 'Magazine Bold', desc: 'Visual-heavy, cover-style', hero: 'MAGAZINE_COVER', feed: 'asymmetric_heavy', trending: 'numbered_podium', color: 'bg-purple-500' },
  { key: 'C', name: 'Data-Driven', desc: 'Informasi padat, kategori grid', hero: 'SPLIT_HERO', feed: 'text_heavy', trending: 'ticker', color: 'bg-emerald-500' },
  { key: 'D', name: 'Compact Dense', desc: 'Maksimal konten di atas fold', hero: 'BENTO_3', feed: 'dense_3col', trending: 'sticky_sidebar', color: 'bg-amber-500' },
  { key: 'E', name: 'Visual Storytelling', desc: 'Foto-forward, immersive', hero: 'DUAL_HERO', feed: 'hero_pair_heavy', trending: 'with_context', color: 'bg-pink-500' },
  { key: 'F', name: 'Best of ⭐', desc: 'Kombinasi terbaik, default', hero: 'MAGAZINE_COVER_550', feed: 'sidebar_70_30', trending: 'numbered_podium', color: 'bg-brand-red' },
]

// ─── Component ───────────────────────────────────────────────────────────

interface HomepageConfigDialogProps {
  siteId: string
  siteName: string
  open: boolean
  onClose: () => void
}

export function HomepageConfigDialog({ siteId, siteName, open, onClose }: HomepageConfigDialogProps) {
  const [config, setConfig] = useState<HomepageConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [activeSection, setActiveSection] = useState<'template' | 'sections' | 'categories'>('template')

  // Fetch config
  useEffect(() => {
    if (!open) return
    setLoading(true)
    api.get(`/sites/${siteId}/homepage-config`)
      .then(({ data }) => { if (data.success) setConfig(data.data) })
      .catch(() => setToast({ message: 'Gagal memuat config', type: 'error' }))
      .finally(() => setLoading(false))
  }, [open, siteId])

  // Save config
  const handleSave = async () => {
    if (!config) return
    setSaving(true)
    try {
      const { data } = await api.put(`/sites/${siteId}/homepage-config`, config)
      if (data.success) {
        setConfig(data.data)
        setToast({ message: 'Config berhasil disimpan', type: 'success' })
      }
    } catch {
      setToast({ message: 'Gagal menyimpan config', type: 'error' })
    } finally {
      setSaving(false)
    }
  }

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3000)
      return () => clearTimeout(t)
    }
  }, [toast])

  if (!open) return null

  const selectedTemplate = TEMPLATES.find(t => t.key === config?.template) || TEMPLATES[5]

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-xl relative z-10 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Layout size={18} className="text-brand-red" />
              Homepage Template
            </h2>
            <p className="text-sm text-gray-500 mt-0.5">{siteName}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg">
            <X size={18} />
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`mx-6 mt-4 px-4 py-3 rounded-lg text-sm font-medium ${
            toast.type === 'success'
              ? 'bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}>
            {toast.message}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 size={24} className="animate-spin text-brand-red" />
            </div>
          ) : config ? (
            <div className="p-6 space-y-6">

              {/* Section tabs */}
              <div className="flex gap-2 flex-wrap">
                {[
                  { key: 'template' as const, label: 'Template', icon: Layout },
                  { key: 'sections' as const, label: 'Sections', icon: Layout },
                  { key: 'categories' as const, label: 'Kategori', icon: Palette },
                ].map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => setActiveSection(key)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      activeSection === key
                        ? 'bg-brand-red text-white'
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                    }`}
                  >
                    <Icon size={14} />
                    {label}
                  </button>
                ))}
              </div>

              {/* Template Selection */}
              {activeSection === 'template' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Pilih Template</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {TEMPLATES.map((t) => (
                      <button
                        key={t.key}
                        onClick={() => setConfig({ ...config, template: t.key, heroMode: t.hero, feedLayout: t.feed, trendingStyle: t.trending })}
                        className={`text-left p-4 rounded-xl border-2 transition-all ${
                          config.template === t.key
                            ? 'border-brand-red bg-brand-red/5 dark:bg-brand-red/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <span className={`w-8 h-8 rounded-lg ${t.color} text-white text-sm font-bold flex items-center justify-center`}>
                            {t.key}
                          </span>
                          <div>
                            <div className="font-bold text-sm text-gray-900 dark:text-white">{t.name}</div>
                            <div className="text-xs text-gray-500">{t.desc}</div>
                          </div>
                        </div>
                        <div className="text-[10px] text-gray-400 space-y-0.5">
                          <div>Hero: {t.hero}</div>
                          <div>Feed: {t.feed}</div>
                          <div>Trending: {t.trending}</div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Override detail */}
                  <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Override Detail (opsional)</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Hero Mode</label>
                        <select
                          value={config.heroMode}
                          onChange={(e) => setConfig({ ...config, heroMode: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                        >
                          {TEMPLATES.map(t => <option key={t.hero} value={t.hero}>{t.hero}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Feed Layout</label>
                        <select
                          value={config.feedLayout}
                          onChange={(e) => setConfig({ ...config, feedLayout: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                        >
                          {TEMPLATES.map(t => <option key={t.feed} value={t.feed}>{t.feed}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Trending Style</label>
                        <select
                          value={config.trendingStyle}
                          onChange={(e) => setConfig({ ...config, trendingStyle: e.target.value })}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                        >
                          {TEMPLATES.map(t => <option key={t.trending} value={t.trending}>{t.trending}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Section Order & Visibility */}
              {activeSection === 'sections' && (
                <div className="space-y-6">
                  {/* Section Order */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-1">Urutan Section</h3>
                    <p className="text-xs text-gray-500 mb-4">Drag untuk reorder. Toggle untuk mati/hidup.</p>
                    <div className="space-y-2">
                      {config.sectionOrder.map((sectionId, index) => {
                        const labels: Record<string, string> = {
                          hero: 'Hero', fokus_redaksi: 'Fokus Redaksi', trending: 'Trending',
                          feed: 'Feed', pilihan_editor: 'Pilihan Editor', opini: 'Opini & Analisis',
                          foto: 'Foto Jurnalistik', video: 'Video Eksklusif',
                        }
                        const visible = config.sectionVisibility[sectionId] ?? true
                        return (
                          <div key={sectionId} className={`flex items-center gap-3 p-3 rounded-lg border ${visible ? 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900' : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 opacity-60'}`}>
                            <span className="text-xs text-gray-400 w-6 text-center">{index + 1}</span>
                            <div className="flex-1">
                              <span className={`text-sm font-medium ${visible ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
                                {labels[sectionId] || sectionId}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              {/* Move up */}
                              {index > 0 && (
                                <button
                                  onClick={() => {
                                    const newOrder = [...config.sectionOrder]
                                    ;[newOrder[index - 1], newOrder[index]] = [newOrder[index], newOrder[index - 1]]
                                    setConfig({ ...config, sectionOrder: newOrder })
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >↑</button>
                              )}
                              {/* Move down */}
                              {index < config.sectionOrder.length - 1 && (
                                <button
                                  onClick={() => {
                                    const newOrder = [...config.sectionOrder]
                                    ;[newOrder[index], newOrder[index + 1]] = [newOrder[index + 1], newOrder[index]]
                                    setConfig({ ...config, sectionOrder: newOrder })
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                >↓</button>
                              )}
                              {/* Toggle visibility */}
                              <button
                                onClick={() => setConfig({
                                  ...config,
                                  sectionVisibility: { ...config.sectionVisibility, [sectionId]: !visible }
                                })}
                                className={`px-3 py-1 rounded text-xs font-medium ${visible ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}
                              >
                                {visible ? 'ON' : 'OFF'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* Feed Columns & Excerpt */}
                  <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl space-y-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase">Feed Detail</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Feed Columns</label>
                        <select
                          value={config.feedColumns}
                          onChange={(e) => setConfig({ ...config, feedColumns: parseInt(e.target.value) })}
                          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm"
                        >
                          <option value={1}>1 kolom</option>
                          <option value={2}>2 kolom</option>
                          <option value={3}>3 kolom</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Show Excerpt</label>
                        <button
                          onClick={() => setConfig({ ...config, showExcerpt: !config.showExcerpt })}
                          className={`w-full px-3 py-2 rounded-lg text-sm font-medium border ${config.showExcerpt ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'}`}
                        >
                          {config.showExcerpt ? '✓ Aktif' : 'Nonaktif'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Interstitial Placement */}
                  <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide mb-1">Interstitial Placement</h3>
                    <p className="text-xs text-gray-500 mb-4">Atur kapan widget muncul di antara kartu feed.</p>
                    <div className="space-y-3">
                      {config.interstitials.map((item, index) => {
                        const labels: Record<string, string> = {
                          trending: 'Paling Dibaca', redaksi: 'Akses Redaksi',
                          market: 'Info Pasar', photo: 'Foto Jurnalistik',
                        }
                        return (
                          <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
                            <div className="flex-1">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">
                                {labels[item.widget] || item.widget}
                              </span>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-gray-500">Setelah kartu ke-</span>
                                <input
                                  type="number"
                                  min={1}
                                  max={50}
                                  value={item.afterCardIndex}
                                  onChange={(e) => {
                                    const newInterstitials = [...config.interstitials]
                                    newInterstitials[index] = { ...item, afterCardIndex: parseInt(e.target.value) || 6 }
                                    setConfig({ ...config, interstitials: newInterstitials })
                                  }}
                                  className="w-16 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded px-2 py-1 text-sm text-center"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const newInterstitials = [...config.interstitials]
                                  newInterstitials[index] = { ...item, enabled: !item.enabled }
                                  setConfig({ ...config, interstitials: newInterstitials })
                                }}
                                className={`px-3 py-1 rounded text-xs font-medium ${item.enabled ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}
                              >
                                {item.enabled ? 'ON' : 'OFF'}
                              </button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Category Config */}
              {activeSection === 'categories' && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wide">Konfigurasi Kategori</h3>
                  <p className="text-xs text-gray-500">Slug kategori untuk editorial extras. Kosongkan untuk menggunakan default.</p>

                  {[
                    { key: 'opinionCategories', label: 'Opini & Analisis', default: 'opini, kolom-esai, analisis, kolom' },
                    { key: 'photoCategories', label: 'Foto Jurnalistik', default: 'foto-jurnalistik' },
                    { key: 'videoCategories', label: 'Video Eksklusif', default: 'video, dokumenter-reportase' },
                  ].map(({ key, label, default: defaultVal }) => (
                    <div key={key}>
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">{label}</label>
                      <input
                        type="text"
                        value={(config[key as keyof HomepageConfig] as string[]).join(', ')}
                        onChange={(e) => setConfig({
                          ...config,
                          [key]: e.target.value.split(',').map(s => s.trim()).filter(Boolean)
                        })}
                        placeholder={defaultVal}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      />
                      <p className="text-[10px] text-gray-400 mt-1">Default: {defaultVal}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/30">
          <div className="text-xs text-gray-400">
            {selectedTemplate && (
              <span>Template aktif: <strong>{selectedTemplate.name}</strong></span>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              Tutup
            </button>
            <button
              onClick={() => {
                if (confirm('Reset ke default (Design F)? Semua perubahan akan hilang.')) {
                  setConfig({
                    ...config!,
                    template: 'F',
                    heroMode: 'MAGAZINE_COVER_550',
                    heroAutoRotate: true,
                    heroIntervalMs: 5000,
                    feedLayout: 'sidebar_70_30',
                    trendingStyle: 'numbered_podium',
                    scoreFreshness: 0.3,
                    scoreEngagement: 0.3,
                    scoreEditorial: 0.3,
                    scoreRelevance: 0.1,
                    sectionOrder: ['hero', 'fokus_redaksi', 'trending', 'feed', 'pilihan_editor', 'opini', 'foto', 'video'],
                    sectionVisibility: { hero: true, fokus_redaksi: true, trending: true, feed: true, pilihan_editor: true, opini: true, foto: true, video: true },
                    feedColumns: 2,
                    showExcerpt: true,
                    interstitials: [
                      { id: 'trending', afterCardIndex: 6, widget: 'trending', enabled: true },
                      { id: 'redaksi', afterCardIndex: 12, widget: 'redaksi', enabled: true },
                      { id: 'market', afterCardIndex: 18, widget: 'market', enabled: true },
                      { id: 'photo', afterCardIndex: 24, widget: 'photo', enabled: true },
                    ],
                  })
                }
              }}
              className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-red-600 dark:hover:text-red-400 transition-all border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              Reset Default
            </button>
            <a
              href={`/${siteId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-brand-red transition-all border border-gray-200 dark:border-gray-700 rounded-lg"
            >
              Preview ↗
            </a>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 bg-brand-red hover:bg-red-600 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
              {saving ? 'Menyimpan...' : 'Simpan'}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}
