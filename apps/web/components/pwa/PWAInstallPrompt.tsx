'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { X, Download, Check } from 'lucide-react'

interface PWAInstallPromptProps {
  /** Identifier situs, mis. 'pusat' | 'bandung' | 'surabaya' */
  site?: string
  /** Nama tampilan situs, mis. 'BeritaKarya Bandung' */
  siteName?: string
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstallPrompt({
  site = 'pusat',
  siteName = 'BeritaKarya',
}: PWAInstallPromptProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isIOS, setIsIOS] = useState(false)

  useEffect(() => {
    setMounted(true)

    // 1. Cek apakah sudah berjalan di mode standalone (sudah terinstal & dibuka)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    const isSafariStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true
    if (isStandalone || isSafariStandalone) {
      return
    }

    // 2. Cek apakah ada batasan dismiss 24 jam di localStorage (per-situs)
    const dismissKey = `pwa-prompt-dismissed:${site}`
    const lastDismissed = localStorage.getItem(dismissKey)
    if (lastDismissed) {
      const parsedTime = parseInt(lastDismissed, 10)
      const oneDayInMs = 24 * 60 * 60 * 1000
      if (Date.now() - parsedTime < oneDayInMs) {
        return // Belum lewat 24 jam, jangan munculkan
      }
    }

    // Deteksi jika perangkat adalah iOS (iPhone/iPad/iPod)
    const userAgent = typeof window !== 'undefined' ? window.navigator.userAgent.toLowerCase() : ''
    const iosDetected = /iphone|ipad|ipod/.test(userAgent) || 
      (typeof navigator !== 'undefined' && navigator.maxTouchPoints > 1 && userAgent.includes('macintosh'))
    
    if (iosDetected) {
      setIsIOS(true)
      setIsVisible(true)
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      // Cegah prompt bawaan browser muncul otomatis
      e.preventDefault()
      // Simpan event prompt untuk dipicu nanti
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      // Tampilkan popup kustom kita
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Deteksi jika aplikasi berhasil diinstal
    const handleAppInstalled = () => {
      setIsVisible(false)
      setDeferredPrompt(null)
      console.log(`PWA ${siteName} berhasil diinstal!`)
    }

    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [site, siteName])

  const handleDismiss = () => {
    setIsVisible(false)
    // Simpan timestamp per-situs untuk batasan 24 jam
    localStorage.setItem(`pwa-prompt-dismissed:${site}`, Date.now().toString())
  }

  const handleInstall = async () => {
    if (!deferredPrompt) return

    // Tampilkan prompt instalasi bawaan browser
    await deferredPrompt.prompt()

    // Tunggu pilihan pengguna
    const { outcome } = await deferredPrompt.userChoice
    console.log(`User response to install prompt: ${outcome}`)

    // Bersihkan prompt
    setDeferredPrompt(null)
    setIsVisible(false)
  }

  // Hindari mismatch hidrasi antara server-render dan client-render
  if (!mounted || !isVisible || (!deferredPrompt && !isIOS)) return null

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 left-4 sm:left-auto sm:w-[420px] z-[9999] animate-fade-in">
      <div className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-gray-200 dark:border-white/10 p-5 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)]">
        
        {/* Tombol Tutup (X) di Pojok Kanan Atas */}
        <button
          onClick={handleDismiss}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-brand-text-muted transition-colors"
          title="Tutup"
        >
          <X size={16} />
        </button>

        {/* Konten Atas: Logo & Info */}
        <div className="flex gap-4 items-start">
          <div className="relative flex-shrink-0 w-14 h-14 rounded-2xl overflow-hidden bg-brand-red p-1 shadow-md border border-brand-red/20">
            <Image
              src="/icons/icon-192x192.png"
              alt="Logo BeritaKarya"
              width={56}
              height={56}
              className="object-cover rounded-xl"
              priority
            />
          </div>
          <div className="space-y-1 pr-6">
            <h4 className="text-sm sm:text-base font-black text-gray-900 dark:text-white leading-tight">
              Instal {siteName}
            </h4>
            <p className="text-xs text-brand-text-muted leading-snug">
              Tambahkan ke layar utama untuk akses portal berita lebih cepat dan lancar.
            </p>
          </div>
        </div>

        {/* Keunggulan PWA (Badges) */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400 border border-green-200/50 dark:border-green-800/30">
            <Check size={10} strokeWidth={3} />
            Bisa Offline
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/30">
            <Check size={10} strokeWidth={3} />
            Loading Cepat
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-red-50 dark:bg-red-950/30 text-brand-red dark:text-red-400 border border-red-200/50 dark:border-red-800/30">
            <Check size={10} strokeWidth={3} />
            Bebas Iklan Browser
          </span>
        </div>

        {/* Tombol Aksi atau Panduan iOS */}
        {isIOS ? (
          <div className="mt-5 p-3.5 bg-gray-50 dark:bg-slate-800/60 rounded-xl border border-gray-100 dark:border-white/5 text-xs text-brand-text-muted space-y-2.5">
            <p className="font-extrabold text-gray-900 dark:text-white">
              Cara instal di iOS / Safari:
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-[11px] leading-relaxed">
              <li>
                Ketuk tombol bagikan/share <span className="inline-flex items-center justify-center w-5 h-5 bg-gray-200 dark:bg-slate-700 rounded text-gray-800 dark:text-gray-200 font-mono text-[10px] align-middle">⎋</span> di bagian bawah Safari.
              </li>
              <li>
                Pilih menu <span className="font-bold text-gray-900 dark:text-white">Add to Home Screen</span> (Tambahkan ke Layar Utama).
              </li>
              <li>
                Ketuk <span className="font-bold text-brand-red">Add</span> (Tambah) di pojok kanan atas.
              </li>
            </ol>
            <button
              onClick={handleDismiss}
              className="w-full mt-2 py-2 px-4 rounded-xl text-xs font-bold text-center text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-slate-800 border border-gray-200 dark:border-white/10 transition-colors"
            >
              Mengerti
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 mt-5">
            <button
              onClick={handleDismiss}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-300 bg-gray-50/50 dark:bg-slate-800/50 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              Nanti Saja
            </button>
            <button
              onClick={handleInstall}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 text-white bg-brand-red hover:bg-red-700 active:scale-[0.98] shadow-lg shadow-brand-red/20 transition-all"
            >
              <Download size={14} />
              Instal Aplikasi
            </button>
          </div>
        )}

      </div>
    </div>
  )
}
