'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import {
  Save,
  Plus,
  X,
  Globe,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldAlert,
  BarChart3,
  BookOpen,
  Flame,
  Eye,
  EyeOff,
  ExternalLink,
  Sparkles,
  Phone,
  MapPin,
  Share2,
  Image,
  Eye as EyeIcon,
  Download,
  FileText,
  Lock as LockIcon,
} from 'lucide-react'
import { api } from '../../../../../lib/api'
import { useAuthStore } from '../../../../../store/authStore'
import { ALL_LEGAL_PAGES } from '../../../../../lib/legalPages'
import { LegalRichTextEditor } from '../../../../../components/dashboard/settings/LegalRichTextEditor'
import { useRequireRole } from '../../../../../hooks/useRequireRole'
import axios from 'axios'

type SettingsTab = 'basic' | 'contact' | 'google' | 'info' | 'trending' | 'wapimred'
type LegalFieldKey =
  | 'aboutUs'
  | 'codeOfEthics'
  | 'editorial'
  | 'privacyPolicy'
  | 'termsOfService'
  | 'mediaSiber'
export default function SettingsPage() {
  const { isAllowed } = useRequireRole(['superadmin', 'wapimred'])
  const { site } = useParams() as { site: string }
  const { user } = useAuthStore()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)
  
  const [settings, setSettings] = useState({
    name: '',
    domain: '',
    description: '',
    logoUrl: '',
    faviconUrl: '',
    ogImageUrl: '',
    footerText: '',
    address: '',
    contactEmail: '',
    phone: '',
    aboutUs: '',
    codeOfEthics: '',
    editorial: '',
    privacyPolicy: '',
    termsOfService: '',
    mediaSiber: '',
    socialLinks: {
      whatsapp: '',
      facebook: '',
      twitter: '',
      instagram: '',
      youtube: '',
      telegram: '',
      tiktok: ''
    },
    appearance: {
      primaryColor: '#e11d48',
      editorialPdfUrl: ''
    },
    trendingTopics: [] as string[],
    googleIndexingConfig: {
      clientEmail: '',
      privateKey: '',
      isActive: false
    },
    ga4PropertyId: '',
    gscSiteUrl: ''
  })

  const [wapimredSettings, setWapimredSettings] = useState({
    canPublish: false,
    canSchedule: false,
    canForcePublish: false,
    canDeletePublished: false
  })
  const [wapimredSaving, setWapimredSaving] = useState(false)
  
  const [originalSettings, setOriginalSettings] = useState<typeof settings | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [activeTab, setActiveTab] = useState<SettingsTab>('basic')
  const [showPrivateKey, setShowPrivateKey] = useState(false)
  const [newTag, setNewTag] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [activeLegalSubTab, setActiveLegalSubTab] = useState<LegalFieldKey>('aboutUs')
  const logoInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!originalSettings) return
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
    setIsDirty(changed)
  }, [settings, originalSettings])

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault()
        e.returnValue = 'Anda memiliki perubahan yang belum disimpan. Yakin ingin meninggalkan halaman ini?'
        return e.returnValue
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const cleanDomain = (val: string) => {
    let clean = val.trim().toLowerCase()
    clean = clean.replace(/^(https?:\/\/)?(www\.)?/, '')
    clean = clean.replace(/\/$/, '')
    return clean
  }

  const isValidEmail = (email: string) => {
    if (!email) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const getContrastAdvice = (hexColor: string) => {
    const hex = hexColor.replace('#', '')
    if (hex.length !== 6) return null
    const r = parseInt(hex.substring(0, 2), 16) / 255
    const g = parseInt(hex.substring(2, 4), 16) / 255
    const b = parseInt(hex.substring(4, 6), 16) / 255
    
    const a = [r, g, b].map(v => {
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
    })
    const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]
    const ratio = 1.05 / (luminance + 0.05)
    const isSafe = ratio >= 3.0
    
    return {
      isSafe,
      ratio: ratio.toFixed(1),
      textAdvice: isSafe 
        ? 'Aman untuk Teks Putih (Kontras Optimal)' 
        : 'Terlalu Terang! Teks putih di portal depan akan sulit dibaca.'
    }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingLogo(true)
    const formData = new FormData()
    formData.append('file', file)

    try {
      const { data } = await api.post('/media/upload?type=logo', formData)
      setSettings({ ...settings, logoUrl: data.data.url })
    } catch (err: unknown) {
      console.error('Failed to upload logo', err)
      alert((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal mengunggah logo')
    } finally {
      setUploadingLogo(false)
    }
  }

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/sites/settings')
      if (data.success) {
        const mappedSettings = {
          name: data.data.name || '',
          domain: data.data.domain || '',
          description: data.data.description || '',
          logoUrl: data.data.logoUrl || '',
          faviconUrl: data.data.faviconUrl || '',
          ogImageUrl: data.data.ogImageUrl || '',
          footerText: data.data.footerText || '',
          address: data.data.address || '',
          contactEmail: data.data.contactEmail || '',
          phone: data.data.phone || '',
          aboutUs: data.data.aboutUs || '',
          codeOfEthics: data.data.codeOfEthics || '',
          editorial: data.data.editorial || '',
          privacyPolicy: data.data.privacyPolicy || '',
          termsOfService: data.data.termsOfService || '',
          mediaSiber: data.data.mediaSiber || '',
          socialLinks: {
            whatsapp: data.data.socialLinks?.whatsapp || '',
            facebook: data.data.socialLinks?.facebook || '',
            twitter: data.data.socialLinks?.twitter || '',
            instagram: data.data.socialLinks?.instagram || '',
            youtube: data.data.socialLinks?.youtube || '',
            telegram: data.data.socialLinks?.telegram || '',
            tiktok: data.data.socialLinks?.tiktok || ''
          },
          appearance: {
            primaryColor: data.data.appearance?.primaryColor || '#e11d48',
            editorialPdfUrl: data.data.appearance?.editorialPdfUrl || ''
          },
          trendingTopics: data.data.trendingTopics || [],
          googleIndexingConfig: data.data.googleIndexingConfig || { clientEmail: '', privateKey: '', isActive: false },
          ga4PropertyId: data.data.ga4PropertyId || '',
          gscSiteUrl: data.data.gscSiteUrl || ''
        }
        setSettings(mappedSettings)
        setOriginalSettings(JSON.parse(JSON.stringify(mappedSettings)))
      }
    } catch (err) {
      console.error('Failed to fetch settings', err)
    } finally {
      setLoading(false)
    }
  }

  const fetchWapimredSettings = async () => {
    try {
      const { data } = await api.get('/sites/wapimred-settings')
      if (data.success) {
        setWapimredSettings({
          canPublish: data.data.canPublish ?? false,
          canSchedule: data.data.canSchedule ?? false,
          canForcePublish: data.data.canForcePublish ?? false,
          canDeletePublished: data.data.canDeletePublished ?? false
        })
      }
    } catch (err) {
      console.error('Failed to fetch wapimred settings', err)
    }
  }

  useEffect(() => {
    fetchSettings()
    if (user?.role === 'superadmin') {
      fetchWapimredSettings()
    }
  }, [site])

  const handleSave = async () => {
    const cleanedDomain = cleanDomain(settings.domain)
    const finalSettings = {
      ...settings,
      domain: cleanedDomain,
      contactEmail: settings.contactEmail.trim()
    }

    if (!isValidEmail(finalSettings.contactEmail)) {
      setMessage({ type: 'error', text: 'Format email kontak tidak valid!' })
      return
    }

    setSaving(true)
    setMessage(null)
    try {
      const { data } = await api.patch('/sites/settings', finalSettings)
      if (data.success) {
        setMessage({ type: 'success', text: 'Pengaturan berhasil disimpan!' })
        setSettings(finalSettings)
        setOriginalSettings(JSON.parse(JSON.stringify(finalSettings)))
        setIsDirty(false)
      } else {
        setMessage({ type: 'error', text: data.error?.message || 'Gagal menyimpan pengaturan' })
      }
    } catch (err: unknown) {
      const msg = (axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Terjadi kesalahan koneksi'
      setMessage({ type: 'error', text: msg })
    } finally {
      setSaving(false)
    }
  }

  const addTag = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newTag.trim()) return
    if (settings.trendingTopics.includes(newTag.trim())) {
      setNewTag('')
      return
    }
    setSettings({
      ...settings,
      trendingTopics: [...settings.trendingTopics, newTag.trim()]
    })
    setNewTag('')
  }

  const removeTag = (tagToRemove: string) => {
    setSettings({
      ...settings,
      trendingTopics: settings.trendingTopics.filter(t => t !== tagToRemove)
    })
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-16 h-16 border-4 border-brand-red/10 rounded-full animate-spin border-t-brand-red" />
        <p className="text-sm text-gray-500">Menyinkronkan Konfigurasi...</p>
      </div>
    )
  }

  // [MULTISITE] Sembunyikan tab Google Search API & Halaman Legal untuk wapimred.
  // Wapimred bukan admin/SEO/compliance officer — field-field ini berdampak
  // sistemik (indexing Google, dokumen legal) dan bukan ranah editorial.
  const isSuperadmin = user?.role === 'superadmin'
  const allTabs = [
    { id: 'basic', label: 'Identitas & Visual', icon: Globe, desc: 'Nama portal, logo, favicon, OG image, & skema warna utama' },
    { id: 'contact', label: 'Kontak & Sosial', icon: Mail, desc: 'Alamat redaksi, hotline, & link media sosial resmi' },
    { id: 'google', label: 'Google Search API', icon: ShieldAlert, desc: 'Konfigurasi otomatis indeks artikel Google' },
    { id: 'info', label: 'Halaman Legal', icon: BookOpen, desc: 'Tentang Kami, Kode Etik, Redaksi, Iklan, Privasi, Syarat' },
    { id: 'trending', label: 'Topik Hangat', icon: Flame, desc: 'Manajemen kata kunci trending di navigasi depan' },
    { id: 'wapimred', label: 'Hak Akses Wapimred', icon: LockIcon, desc: 'Atur wewenang Wapimred: terbitkan, jadwalkan, hapus post' }
  ] as const
  const tabs = allTabs.filter((t) => isSuperadmin || (t.id !== 'google' && t.id !== 'info' && t.id !== 'wapimred'))

  const contrastAdvice = getContrastAdvice(settings.appearance.primaryColor)

  if (!isAllowed) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-red/10 rounded-lg">
              <SettingsIcon size={20} className="text-brand-red" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
              Konfigurasi Sistem Portal
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Manajemen Identitas Cabang Regional <span className="text-brand-red font-bold">#{site}</span>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="text-xs font-bold uppercase bg-amber-500/10 text-amber-600 px-3 py-1.5 rounded-full border border-amber-500/20">
              Ada Perubahan Belum Disimpan
            </span>
          )}
          <a
            href={`/${site}`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-4 py-3 text-sm font-medium transition-all rounded-lg"
          >
            <EyeIcon size={12} />
            Lihat Portal
          </a>
          <button
            onClick={() => {
              const settingsJson = JSON.stringify(settings, null, 2)
              const blob = new Blob([settingsJson], { type: 'application/json' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `beritakarya-${site}-settings-${new Date().toISOString().split('T')[0]}.json`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-4 py-3 text-sm font-medium transition-all rounded-lg"
          >
            <Download size={12} />
            Export
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-3 text-sm font-medium transition-all rounded-lg shadow-lg disabled:opacity-50"
          >
            {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
            {saving ? 'Sedang Menyimpan...' : 'Simpan Konfigurasi'}
          </button>
        </div>
      </div>

      {/* NOTIFIKASI STATUS */}
      {message && (
        <div className={`p-4 flex items-center gap-3 rounded-xl border ${
          message.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        
        {/* TAB SISI KIRI */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <p className="text-xs font-bold uppercase text-gray-500 mb-3">Kategori Pengaturan</p>
            {tabs.map((t) => {
              const Icon = t.icon
              const isActive = activeTab === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setMessage(null)
                    setActiveTab(t.id)
                  }}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg transition-all ${
                    isActive 
                      ? 'bg-brand-red text-white' 
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <Icon size={16} className={isActive ? 'text-white' : 'text-brand-red'} />
                  <div>
                    <p className="text-sm font-bold uppercase">{t.label}</p>
                    <p className={`text-xs mt-0.5 ${isActive ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                      {t.desc}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>

          <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-xl border border-gray-200 dark:border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-brand-red" />
              <h4 className="text-sm font-bold text-gray-700 dark:text-gray-300">Tips Search Engine</h4>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
              Mesin pencari seperti Google menyukai deskripsi situs yang mengandung kata kunci geografis daerah Anda. Tulis deskripsi SEO secara singkat dan padat.
            </p>
          </div>
        </div>

        {/* KONTEN KANAN */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-xl p-8 min-h-[500px]">
            
            {/* TAB 1: IDENTITAS & VISUAL */}
            {activeTab === 'basic' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Globe size={18} className="text-brand-red" /> Identitas & Branding Utama
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Tentukan jati diri digital utama untuk portal berita regional Anda.
                  </p>
                    <p className="text-xs text-brand-red mt-1">
                      Brand utama &quot;BERITA KARYA&quot; adalah tetap.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label htmlFor="settings-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nama Publikasi Regional <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="settings-name"
                      type="text"
                      value={settings.name}
                      onChange={(e) => setSettings({...settings, name: e.target.value})}
                      placeholder="Contoh: BeritaKarya Bandung"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                    />
                    <p className="text-xs text-gray-500">Nama ini akan muncul di SERP Google.</p>
                  </div>
                  
                  <div className="space-y-3">
                    <label htmlFor="settings-domain" className="text-sm font-medium text-gray-700 dark:text-gray-300">Domain Publik (URL)</label>
                    <div className="relative">
                      <input
                        id="settings-domain"
                        type="text"
                        value={settings.domain}
                        onChange={(e) => setSettings({...settings, domain: e.target.value})}
                        onBlur={(e) => setSettings({...settings, domain: cleanDomain(e.target.value)})}
                        placeholder="bandung.beritakarya.co"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg pl-4 pr-12 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      />
                      <span className="absolute right-3 top-3 text-xs font-bold text-brand-red uppercase">LIVE</span>
                    </div>
                  </div>

                  <div className="md:col-span-2 p-6 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-xl">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-bold text-gray-500">Pratinjau Hasil Pencarian Google</h4>
                      <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">SEO OPTIMAL</span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm text-gray-500 flex items-center gap-1.5 truncate">
                        <span>https://{settings.domain || 'bandung.beritakarya.co'}</span>
                      </div>
                      <div className="text-xl text-blue-600 dark:text-blue-400 font-medium hover:underline cursor-pointer">
                        {settings.name || 'BeritaKarya Bandung - Portal Berita Regional Terpercaya'}
                      </div>
                      <div className="text-base text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2">
                        {settings.description || 'Tulis deskripsi situs di bawah untuk melihat simulasi tampilan ringkasan berita portal Anda di halaman pencarian Google.'}
                      </div>
                    </div>
                  </div>

                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="settings-description" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        Deskripsi Situs (SEO & Meta Description)
                      </label>
                      <span className={`text-sm ${settings.description.length > 160 ? 'text-red-500' : 'text-gray-400'}`}>
                        {settings.description.length} / 160 Karakter
                      </span>
                    </div>
                    <textarea
                      id="settings-description"
                      value={settings.description}
                      onChange={(e) => setSettings({...settings, description: e.target.value})}
                      placeholder="Tulis ringkasan tentang jenis berita, fokus daerah, dan komitmen portal..."
                      rows={3}
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all resize-none"
                    />
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* BRANDING LOGO & COLOR */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Identitas Visual Logo Portal</label>
                    
                    <div className="space-y-4">
                      {settings.logoUrl ? (
                        <div className="w-full h-32 bg-gray-50 dark:bg-gray-950 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex items-center justify-center p-4 relative">
                          <img src={settings.logoUrl} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                          <button 
                            type="button"
                            onClick={() => setSettings({...settings, logoUrl: ''})}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-50 dark:bg-gray-950 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl flex flex-col items-center justify-center">
                          <Sparkles className="w-8 h-8 text-gray-400 mb-2" />
                          <p className="text-sm font-bold text-gray-400 uppercase">Belum ada logo</p>
                        </div>
                      )}
                      
                      <div className="flex gap-3">
                        <input 
                          type="text" 
                          value={settings.logoUrl}
                          onChange={(e) => setSettings({...settings, logoUrl: e.target.value})}
                          placeholder="https://.../logo.png"
                          className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                        />
                        <div className="relative">
                          <input 
                            ref={logoInputRef}
                            type="file" 
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                          />
                          <button 
                            type="button"
                            onClick={() => logoInputRef.current?.click()}
                            disabled={uploadingLogo}
                            className="h-full bg-gray-900 dark:bg-gray-100 hover:bg-brand-red text-white px-6 text-sm font-medium transition-all rounded-lg flex items-center gap-2"
                          >
                            {uploadingLogo ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
                            {uploadingLogo ? 'Unggah...' : 'Upload'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Warna Aksen Portal (Brand Theme)</label>
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="w-12 h-11 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                          <input 
                            type="color" 
                            value={settings.appearance.primaryColor}
                            onChange={(e) => setSettings({
                              ...settings, 
                              appearance: { ...settings.appearance, primaryColor: e.target.value }
                            })}
                            className="w-full h-full p-0 border-0 cursor-pointer"
                          />
                        </div>
                        <input 
                          type="text" 
                          value={settings.appearance.primaryColor}
                          onChange={(e) => setSettings({
                            ...settings, 
                            appearance: { ...settings.appearance, primaryColor: e.target.value }
                          })}
                          className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all font-mono"
                        />
                      </div>

                      {contrastAdvice && (
                        <div className={`p-4 rounded-lg border ${
                          contrastAdvice.isSafe
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
                            : 'bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400'
                        }`}>
                          <div className="flex items-start gap-2">
                            <AlertCircle size={14} className="mt-0.5" />
                            <div className="text-sm space-y-0.5">
                              <p>Rasio Kontras: {contrastAdvice.ratio}:1 (Standard AA)</p>
                              <p className="opacity-80">{contrastAdvice.textAdvice}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <hr className="border-gray-200 dark:border-gray-800" />

                {/* FAVICON & OG IMAGE */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Image size={16} className="text-brand-red" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Favicon</label>
                    </div>
                    <div className="space-y-3">
                      {settings.faviconUrl ? (
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center p-2 relative">
                          <img src={settings.faviconUrl} alt="Favicon Preview" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setSettings({...settings, faviconUrl: ''})}
                            className="absolute -top-2 -right-2 p-1 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-16 h-16 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center">
                          <p className="text-xs font-medium text-gray-400">Belum Ada</p>
                        </div>
                      )}
                      <input
                        type="text"
                        value={settings.faviconUrl}
                        onChange={(e) => setSettings({...settings, faviconUrl: e.target.value})}
                        placeholder="https://.../favicon.ico"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      />
                      <p className="text-xs text-gray-500">Format: ICO, PNG 32x32 atau SVG</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Share2 size={16} className="text-brand-red" />
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">OG Image (Share Preview)</label>
                    </div>
                    <div className="space-y-3">
                      {settings.ogImageUrl ? (
                        <div className="w-full h-32 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg flex items-center justify-center p-2 relative">
                          <img src={settings.ogImageUrl} alt="OG Image Preview" className="max-w-full max-h-full object-contain" />
                          <button
                            type="button"
                            onClick={() => setSettings({...settings, ogImageUrl: ''})}
                            className="absolute top-2 right-2 p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full"
                          >
                            <X size={10} />
                          </button>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg flex flex-col items-center justify-center text-center">
                          <Share2 size={20} className="text-gray-400 mb-2" />
                          <p className="text-sm font-bold text-gray-400 uppercase">Belum Ada OG Image</p>
                        </div>
                      )}
                      <input
                        type="text"
                        value={settings.ogImageUrl}
                        onChange={(e) => setSettings({...settings, ogImageUrl: e.target.value})}
                        placeholder="https://.../og-image.jpg"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2.5 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      />
                      <p className="text-xs text-gray-500">Format rekomendasi: JPG/PNG 1200x630px</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KONTAK & SOSIAL */}
            {activeTab === 'contact' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Mail size={18} className="text-brand-red" /> Kontak & Saluran Sosial
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Kelola alamat redaksi, email keluhan, hotline bantuan, dan akun media sosial resmi portal.
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-3">
                    <label htmlFor="settings-address" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                      <MapPin size={14} className="text-brand-red" /> Alamat Fisik Kantor Redaksi
                    </label>
                    <input
                      id="settings-address"
                      type="text"
                      value={settings.address}
                      onChange={(e) => setSettings({...settings, address: e.target.value})}
                      placeholder="Contoh: Gedung BeritaKarya Lt. 3, Jl. Asia Afrika No. 45, Bandung"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="settings-email" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center justify-between">
                        <span className="flex items-center gap-2"><Mail size={14} className="text-brand-red" /> Email Kontak Resmi</span>
                        {!isValidEmail(settings.contactEmail) && (
                          <span className="text-red-500 text-xs">Format Email Tidak Valid!</span>
                        )}
                      </label>
                      <input
                        id="settings-email"
                        type="email"
                        value={settings.contactEmail}
                        onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                        placeholder="redaksi.bandung@beritakarya.co"
                        className={`w-full bg-gray-50 dark:bg-gray-950 border rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none transition-all ${
                          isValidEmail(settings.contactEmail) 
                            ? 'border-gray-200 dark:border-gray-800 focus:border-brand-red focus:ring-1 focus:ring-brand-red/20' 
                            : 'border-red-500 focus:border-red-500 focus:ring-1 focus:ring-red-500/20'
                        }`}
                      />
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="settings-phone" className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                        <Phone size={14} className="text-brand-red" /> Nomor Telepon / WhatsApp
                      </label>
                      <input
                        id="settings-phone"
                        type="text"
                        value={settings.phone}
                        onChange={(e) => setSettings({...settings, phone: e.target.value})}
                        placeholder="+62 812-3456-7890"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      />
                    </div>
                  </div>

                  {isSuperadmin && (
                    <>
                      <hr className="border-gray-200 dark:border-gray-800" />

                      <div className="space-y-4">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                          <Share2 size={14} className="text-brand-red" /> Saluran Media Sosial Resmi
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {Object.keys(settings.socialLinks).map((key) => (
                            <div key={key} className="space-y-2">
                              <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{key} URL</label>
                              <input
                                type="text"
                                value={(settings.socialLinks as Record<string, string>)[key]}
                                onChange={(e) => setSettings({
                                  ...settings,
                                  socialLinks: { ...settings.socialLinks, [key]: e.target.value }
                                })}
                                placeholder={`https://${key}.com/profile-anda`}
                                className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-2 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  {isSuperadmin && (
                    <>
                      <hr className="border-gray-200 dark:border-gray-800" />

                      <div className="space-y-3">
                        <label htmlFor="settings-footer-text" className="text-sm font-medium text-gray-700 dark:text-gray-300">Teks Footer Hak Cipta</label>
                        <input
                          id="settings-footer-text"
                          type="text"
                          value={settings.footerText}
                          onChange={(e) => setSettings({...settings, footerText: e.target.value})}
                          placeholder="© 2026 BeritaKarya Bandung. Hak cipta dilindungi undang-undang."
                          className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: GOOGLE SEARCH INDEXING API */}
            {activeTab === 'google' && isSuperadmin && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <ShieldAlert size={18} className="text-brand-red" /> Google Search Indexing API
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Sinkronisasi instan artikel Anda ke mesin pencari Google.
                    </p>
                  </div>
                  
                  <button
                    type="button"
                    onClick={() => setSettings({
                      ...settings,
                      googleIndexingConfig: {
                        ...settings.googleIndexingConfig,
                        isActive: !settings.googleIndexingConfig.isActive
                      }
                    })}
                    className={`px-5 py-2.5 text-sm font-medium border rounded-lg transition-all ${
                      settings.googleIndexingConfig.isActive
                        ? 'bg-emerald-500 text-white border-emerald-600'
                        : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                    }`}
                  >
                    {settings.googleIndexingConfig.isActive ? '🔥 SINKRONISASI AKTIF' : '⏹️ SINKRONISASI NONAKTIF'}
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <label htmlFor="settings-gsa-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Service Account Email</label>
                    <input
                      id="settings-gsa-email"
                      type="text"
                      value={settings.googleIndexingConfig.clientEmail}
                      onChange={(e) => setSettings({
                        ...settings,
                        googleIndexingConfig: {
                          ...settings.googleIndexingConfig,
                          clientEmail: e.target.value
                        }
                      })}
                      placeholder="nama-akun@id-project.iam.gserviceaccount.com"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <label htmlFor="settings-private-key" className="text-sm font-medium text-gray-700 dark:text-gray-300">Private Key (PEM Format)</label>
                      <button
                        type="button"
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="text-sm font-medium text-brand-red hover:underline flex items-center gap-1"
                      >
                        {showPrivateKey ? <EyeOff size={12} /> : <Eye size={12} />}
                        {showPrivateKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
                      </button>
                    </div>
                    
                    {showPrivateKey ? (
                      <textarea
                        id="settings-private-key"
                        value={settings.googleIndexingConfig.privateKey}
                        onChange={(e) => setSettings({
                          ...settings,
                          googleIndexingConfig: {
                            ...settings.googleIndexingConfig,
                            privateKey: e.target.value
                          }
                        })}
                        placeholder="-----BEGIN PRIVATE KEY-----\n..."
                        rows={5}
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-sm text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all font-mono resize-none"
                      />
                    ) : (
                      <div className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-8 text-center text-gray-500 font-mono">
                        <LockIcon size={20} className="mx-auto mb-2 text-gray-400" />
                        <p className="text-sm font-medium">Kunci Privat Disensor untuk Keamanan</p>
                        <p className="text-xs text-gray-500 mt-1">Klik &apos;Tampilkan Kunci&apos; di atas untuk melihat atau mengedit</p>
                      </div>
                    )}
                  </div>

                  <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl dark:bg-amber-900/20 dark:border-amber-800">
                    <h4 className="text-sm font-bold text-amber-800 dark:text-amber-400 flex items-center gap-2 mb-4">
                      <AlertCircle size={16} className="text-amber-600" /> Panduan Pemasangan Google Search Console
                    </h4>
                    <ol className="text-sm text-amber-800/80 dark:text-amber-400/80 space-y-2 list-decimal pl-4">
                      <li>
                        Buka <a href="https://console.cloud.google.com/" target="_blank" rel="noreferrer" className="text-brand-red underline flex items-center gap-1">Google Cloud Console <ExternalLink size={12} /></a>, aktifkan Indexing API, buat Service Account, unduh JSON Private Key.
                      </li>
                      <li>
                        Salin client_email dan private_key dari berkas JSON ke isian di atas.
                      </li>
                      <li>
                        <span className="text-brand-red font-bold">WAJIB:</span> Tambahkan Service Account Email sebagai <strong>Owner</strong> di Google Search Console.
                      </li>
                    </ol>
                  </div>
                </div>

                {/* Google Analytics (GA4) & Search Console Configuration */}
                <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-800">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <BarChart3 size={18} className="text-brand-red" /> Google Analytics & Search Console
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Hubungkan GA4 dan GSC untuk menampilkan data analytics langsung di dashboard.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-3">
                      <label htmlFor="settings-ga4-id" className="text-sm font-medium text-gray-700 dark:text-gray-300">GA4 Property ID</label>
                      <input
                        id="settings-ga4-id"
                        type="text"
                        value={settings.ga4PropertyId}
                        onChange={(e) => setSettings({ ...settings, ga4PropertyId: e.target.value })}
                        placeholder="properties/123456789"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      />
                      <p className="text-xs text-gray-500">
                        Ditemukan di Google Analytics → Admin → Property Settings → Property ID (format: properties/XXXXXXXXX)
                      </p>
                    </div>

                    <div className="space-y-3">
                      <label htmlFor="settings-gsc-url" className="text-sm font-medium text-gray-700 dark:text-gray-300">Google Search Console Site URL</label>
                      <input
                        id="settings-gsc-url"
                        type="text"
                        value={settings.gscSiteUrl}
                        onChange={(e) => setSettings({ ...settings, gscSiteUrl: e.target.value })}
                        placeholder="sc-domain:beritakarya.co atau https://beritakarya.co/"
                        className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      />
                      <p className="text-xs text-gray-500">
                        Format: <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">sc-domain:domain.com</code> untuk domain property, atau URL lengkap untuk URL prefix property.
                      </p>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl dark:bg-blue-900/20 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-400">
                      <strong>Catatan:</strong> Service Account yang sama digunakan untuk Google Indexing, GA4, dan GSC.
                      Pastikan Service Account sudah ditambahkan sebagai <strong>Viewer</strong> di Google Analytics dan <strong>Owner</strong> di Google Search Console.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 4: HALAMAN INFORMASI PORTAL */}
            {activeTab === 'info' && isSuperadmin && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <BookOpen size={18} className="text-brand-red" /> Halaman Informasi & Legalitas
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Sesuaikan halaman legalitas untuk memenuhi regulasi Dewan Pers.
                  </p>
                </div>

                {/* Sub-Tabs Navigation — dihasilkan otomatis dari ALL_LEGAL_PAGES */}
                <div className="flex flex-wrap gap-2 border-b border-gray-200 dark:border-gray-800 pb-3">
                  {ALL_LEGAL_PAGES.map((legalPage) => {
                    const isSubActive = activeLegalSubTab === legalPage.id
                    return (
                      <button
                        key={legalPage.id}
                        type="button"
                        onClick={() => setActiveLegalSubTab(legalPage.id as LegalFieldKey)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                          isSubActive
                            ? 'bg-brand-red/10 text-brand-red border border-brand-red/20'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200 border border-transparent'
                        }`}
                      >
                        <FileText size={14} />
                        <span>{legalPage.title}</span>
                      </button>
                    )
                  })}
                </div>

                {/* Sub-Tabs Content — dihasilkan otomatis dari ALL_LEGAL_PAGES */}
                <div className="pt-2">
                  {ALL_LEGAL_PAGES.map((legalPage) => {
                    if (activeLegalSubTab !== legalPage.id) return null
                    const fieldKey = legalPage.settingsKey as keyof typeof settings

                    // Kasus khusus: tab Redaksi memiliki tombol Template Dewan Pers
                    if (legalPage.id === 'editorial') {
                      return (
                        <div key={legalPage.id} className="space-y-3">
                          <div className="flex items-center justify-between">
                            <label className="text-sm font-bold text-gray-700 dark:text-gray-300">{legalPage.title}</label>
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm('Apakah Anda yakin ingin memuat format Dewan Pers standar? Teks saat ini akan ditimpa.')) {
                                  setSettings({
                                    ...settings,
                                    editorial: `PT SABDA KARYA MEDIA (BERITAKARYA.CO)
SK MENKUMHAM: AHU-0012345.AH.01.01.TAHUN 2026

SUSUNAN REDAKSI & TATA KELOLA PERUSAHAAN

Penerbit / Badan Hukum:
PT Sabda Karya Media

Dewan Pembina / Penasihat:
- [Nama Dewan Pembina]

Pemimpin Umum / Direktur Utama:
- [Nama Pemimpin Umum]

Pemimpin Redaksi / Penanggung Jawab:
- [Nama Pemimpin Redaksi]

Redaktur Pelaksana (Redpel):
- [Nama Redaktur Pelaksana]

Redaktur Senior & Editor:
- [Nama Editor 1]
- [Nama Editor 2]

Reporter Lapangan:
- [Nama Reporter 1]
- [Nama Reporter 2]

Desain Grafis, IT & Multimedia:
- [Nama Tim IT/Desain]

Alamat Kantor Redaksi Pusat:
Gedung BeritaKarya, Lt. 3, Jl. Asia Afrika No. 45, Bandung
Email: redaksi@beritakarya.co | Telp: +62 812-3456-7890

Penasihat Hukum:
- [Nama Advokat], S.H., M.H.`
                                  })
                                }
                              }}
                              className="text-sm font-medium text-brand-red hover:underline flex items-center gap-1"
                            >
                              <Sparkles size={12} /> Gunakan Template Dewan Pers
                            </button>
                          </div>
                          <LegalRichTextEditor
                            label={legalPage.title}
                            value={(settings[fieldKey] as string) || ''}
                            onChange={(nextValue) => setSettings({ ...settings, [fieldKey]: nextValue })}
                            placeholder={`Tuliskan konten ${legalPage.title}...`}
                          />
                        </div>
                      )
                    }

                    return (
                      <LegalRichTextEditor
                        key={legalPage.id}
                        label={legalPage.title}
                        value={(settings[fieldKey] as string) || ''}
                        onChange={(nextValue) => setSettings({ ...settings, [fieldKey]: nextValue })}
                        placeholder={`Tuliskan konten ${legalPage.title}...`}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* TAB 5: TOPIK HANGAT */}
            {activeTab === 'trending' && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <Flame size={18} className="text-brand-red" /> Manajemen Topik Hangat
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Tentukan tag khusus yang disematkan pada bar navigasi depan.
                    </p>
                  </div>
                  <span className="text-sm font-bold text-white bg-brand-red px-3 py-1 rounded-full">
                    {settings.trendingTopics.length} Topik Aktif
                  </span>
                </div>

                <form onSubmit={addTag} className="flex gap-3">
                  <input 
                    type="text" 
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Tambah topik baru (contoh: Pilkada 2026)"
                    className="flex-1 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                  />
                  <button 
                    type="submit"
                    className="bg-gray-900 dark:bg-gray-100 hover:bg-brand-red text-white px-5 py-3 transition-all rounded-lg flex items-center gap-1"
                  >
                    <Plus size={16} />
                    <span className="text-sm font-medium">Tambah</span>
                  </button>
                </form>

                <div className="flex flex-wrap gap-3">
                  {settings.trendingTopics.length > 0 ? (
                    settings.trendingTopics.map((tag) => (
                      <div 
                        key={tag}
                        className="group flex items-center gap-2.5 bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 px-4 py-2.5 rounded-lg transition-all hover:border-brand-red"
                      >
                        <span className="text-sm font-medium text-gray-900 dark:text-white">#{tag}</span>
                        <button 
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="text-gray-400 hover:text-brand-red transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="w-full py-12 text-center border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-xl">
                      <Flame size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm font-bold text-gray-400 uppercase">Belum ada topik khusus</p>
                      <p className="text-xs text-gray-400 mt-1">Situs depan akan menggunakan topik default pusat</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 6: HAK AKSES WAPIMRED */}
            {activeTab === 'wapimred' && isSuperadmin && (
              <div className="space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <LockIcon size={18} className="text-brand-red" /> Hak Akses Wapimred
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">
                      Atur wewenang Wapimred di situs ini. Perubahan berlaku instan tanpa restart.
                    </p>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
                  <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Saat toggle <strong>OFF</strong>, Wapimred tidak bisa menjalankan aksi tersebut. Tombol terkait akan dinonaktifkan di dashboard.
                  </p>
                </div>

                <div className="space-y-4">
                  {[
                    { key: 'canPublish' as const, label: 'Boleh Terbitkan Artikel', desc: 'Wapimred bisa menerbitkan artikel yang sudah disetujui (approved) langsung ke publik.' },
                    { key: 'canSchedule' as const, label: 'Boleh Jadwalkan Artikel', desc: 'Wapimred bisa menjadwalkan artikel untuk terbit otomatis pada waktu tertentu.' },
                    { key: 'canForcePublish' as const, label: 'Boleh Force-Publish', desc: 'Wapimred bisa menerbitkan artikel dari status apapun (skip workflow). Berisiko tinggi.' },
                    { key: 'canDeletePublished' as const, label: 'Boleh Hapus Post Terbit', desc: 'Wapimred bisa menghapus artikel yang sudah tayang di publik. Berisiko tinggi.' },
                  ].map((item) => (
                    <div
                      key={item.key}
                      className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5"
                    >
                      <div className="flex-1 mr-4">
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setWapimredSettings({
                            ...wapimredSettings,
                            [item.key]: !wapimredSettings[item.key]
                          })
                        }
                        className={`px-5 py-2.5 text-sm font-medium border rounded-lg transition-all ${
                          wapimredSettings[item.key]
                            ? 'bg-emerald-500 text-white border-emerald-600'
                            : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                        }`}
                      >
                        {wapimredSettings[item.key] ? 'AKTIF' : 'NONAKTIF'}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={async () => {
                      setWapimredSaving(true)
                      try {
                        const { data } = await api.patch('/sites/wapimred-settings', wapimredSettings)
                        if (data.success) {
                          setWapimredSettings(data.data)
                          setMessage({ type: 'success', text: 'Hak akses Wapimred berhasil diperbarui!' })
                        }
                      } catch (err: unknown) {
                        setMessage({
                          type: 'error',
                          text: (axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal menyimpan pengaturan'
                        })
                      } finally {
                        setWapimredSaving(false)
                      }
                    }}
                    disabled={wapimredSaving}
                    className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-3 text-sm font-medium transition-all rounded-lg shadow-lg disabled:opacity-50"
                  >
                    {wapimredSaving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                    {wapimredSaving ? 'Menyimpan...' : 'Simpan Pengaturan Wapimred'}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* FLOATING ACTION BAR */}
      {isDirty && (
        <div className="fixed bottom-8 right-8 z-40">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-3 bg-brand-red hover:bg-red-700 text-white px-8 py-4 text-sm font-medium transition-all shadow-xl disabled:opacity-50 rounded-xl"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Sedang Menyimpan...' : 'Simpan Seluruh Perubahan'}
          </button>
        </div>
      )}

    </div>
  )
}
