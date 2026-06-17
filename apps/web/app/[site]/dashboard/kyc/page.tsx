'use client'

import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  ShieldCheck,
  Upload,
  CheckCircle2,
  AlertCircle,
  Info,
  Loader2,
  Lock,
  ChevronRight,
  Camera
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import axios from 'axios'
import { api } from '../../../../lib/api'
import { useAuthStore } from '../../../../store/authStore'
import { cn } from '../../../../lib/utils'

const BIO_MIN_LENGTH = 80
const BIO_MAX_LENGTH = 180

export default function KYCPage() {
  const params = useParams()
  const siteId = params.site as string
  const { user } = useAuthStore()
  const router = useRouter()

  const [submitting, setSubmitting] = useState(false)
  const [status, setStatus] = useState<'none' | 'pending' | 'verified' | 'rejected'>('none')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  // Form State
  const [bio, setBio] = useState('')
  const [idCard, setIdCard] = useState<File | null>(null)
  const [familyCard, setFamilyCard] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)

  // Previews
  const [idPreview, setIdPreview] = useState<string | null>(null)
  const [familyPreview, setFamilyPreview] = useState<string | null>(null)

  // Resolusi warnings (tidak memblokir submit)
  const [idLowRes, setIdLowRes] = useState(false)
  const [familyLowRes, setFamilyLowRes] = useState(false)

  const bioLength = bio.trim().length
  const isBioTooShort = bioLength > 0 && bioLength < BIO_MIN_LENGTH
  const isBioTooLong = bio.length > BIO_MAX_LENGTH

  useEffect(() => {
    if (user?.kycStatus === 'APPROVED') {
      setStatus('verified')
    } else if (user?.kycStatus === 'REJECTED') {
      setStatus('rejected')
    } else if (user?.kycStatus === 'PENDING') {
      setStatus('pending')
    } else if (user?.kycSubmittedAt) {
      setStatus('pending')
    }
  }, [user])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'id' | 'family') => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setError('Ukuran file maksimal 5MB')
      return
    }

    // Cek resolusi secara client-side — hanya sebagai warning, tidak memblokir
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)
    img.onload = () => {
      const isLowRes = img.naturalWidth < 640 || img.naturalHeight < 480
      if (type === 'id') {
        setIdLowRes(isLowRes)
      } else {
        setFamilyLowRes(isLowRes)
      }
    }
    img.src = objectUrl

    if (type === 'id') {
      setIdCard(file)
      setIdPreview(objectUrl)
    } else {
      setFamilyCard(file)
      setFamilyPreview(objectUrl)
    }
    setError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedBio = bio.trim()

    if (trimmedBio.length < BIO_MIN_LENGTH) {
      setError(`Tentang penulis minimal ${BIO_MIN_LENGTH} karakter agar profil publik tetap informatif dan seragam`)
      return
    }
    if (trimmedBio.length > BIO_MAX_LENGTH) {
      setError(`Tentang penulis maksimal ${BIO_MAX_LENGTH} karakter agar tetap singkat dan profesional`)
      return
    }
    if (!idCard) {
      setError('Foto KTP wajib diunggah')
      return
    }
    if (!consent) {
      setError('Anda harus menyetujui kebijakan perlindungan data')
      return
    }

    setSubmitting(true)
    setError(null)

    const formData = new FormData()
    formData.append('bio', trimmedBio)
    formData.append('idCard', idCard)
    if (familyCard) formData.append('familyCard', familyCard)
    formData.append('consent', 'true')

    try {
      await api.post('/kyc/submit', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      })
      setSuccess(true)
      setStatus('pending')
    } catch (err: unknown) {
      setError((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) ?? 'Gagal mengirim pengajuan KYC')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'verified') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Akun Terverifikasi</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          Selamat! Identitas Anda telah berhasil diverifikasi. Anda sekarang memiliki akses penuh untuk menerbitkan berita sebagai Reporter.
        </p>
        <button 
          onClick={() => router.push(`/${siteId}/dashboard/articles/new`)}
          className="mt-8 bg-brand-red text-white px-6 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg shadow-brand-red/20 hover:scale-105 transition-transform"
        >
          Buat Berita Pertama
        </button>
      </div>
    )
  }

  if (status === 'rejected') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-in fade-in zoom-in duration-500">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6"
        >
          <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Pengajuan Ditolak</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          Maaf, pengajuan verifikasi identitas Anda belum dapat kami setujui karena alasan berikut:
        </p>
        
        <div className="mt-6 p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-2xl max-w-md w-full">
          <p className="text-sm font-bold text-red-700 dark:text-red-400 italic">
            &quot;{user?.kycNotes || 'Dokumen kurang jelas atau tidak sesuai ketentuan.'}&quot;
          </p>
        </div>

        <button 
          onClick={() => setStatus('none')}
          className="mt-8 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs shadow-lg hover:bg-brand-red dark:bg-brand-red dark:hover:bg-red-500 transition-all"
        >
          Ajukan Ulang Verifikasi
        </button>
      </div>
    )
  }

  if (status === 'pending' || success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-6"
        >
          <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin-slow" />
        </motion.div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Menunggu Verifikasi</h1>
        <p className="text-slate-600 dark:text-slate-400 max-w-md">
          Pengajuan KYC Anda sedang dalam proses peninjauan oleh tim redaksi. Kami akan memberikan notifikasi segera setelah status diperbarui.
        </p>
        <div className="mt-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-xl flex items-center gap-3 text-left">
          <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />
          <p className="text-xs text-slate-500 leading-relaxed">
            Estimasi waktu peninjauan adalah 1-3 hari kerja. Pastikan dokumen Anda jelas dan terbaca.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-10">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <ShieldCheck className="w-7 h-7 text-brand-red" />
          Verifikasi Identitas (KYC)
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Lengkapi data identitas Anda untuk mendapatkan hak akses penerbitan berita.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Bio Section */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
              <label htmlFor="kyc-bio" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider">
                Tentang Penulis (Akan Tampil di Profil Publik)
              </label>
              <p className="mb-3 text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                Tulis deskripsi singkat tentang diri Anda dalam 1-2 kalimat formal. Isi ini akan tampil saat pembaca membuka profil penulis.
              </p>
              <textarea
                id="kyc-bio"
                value={bio}
                onChange={(e) => {
                  setBio(e.target.value)
                  if (error) setError(null)
                }}
                maxLength={BIO_MAX_LENGTH}
                placeholder="Contoh: Penulis BeritaKarya yang berfokus pada isu publik, sosial, dan perkembangan daerah serta menyajikan informasi secara akurat dan berimbang."
                className={cn(
                  "w-full h-32 bg-slate-50 dark:bg-slate-950 border rounded-xl p-4 outline-none transition-all text-sm resize-none",
                  isBioTooShort || isBioTooLong
                    ? "border-amber-300 dark:border-amber-700 focus:border-amber-400"
                    : "border-slate-200 dark:border-slate-800 focus:border-brand-red/30"
                )}
              />
              <div className="mt-3 flex items-center justify-between gap-3 text-[11px]">
                <p className={cn(
                  "leading-relaxed",
                  isBioTooShort || isBioTooLong ? "text-amber-600 dark:text-amber-400" : "text-slate-500 dark:text-slate-400"
                )}>
                  Minimal {BIO_MIN_LENGTH} karakter, maksimal {BIO_MAX_LENGTH} karakter.
                </p>
                <span className={cn(
                  "font-bold tabular-nums",
                  isBioTooShort || isBioTooLong ? "text-amber-600 dark:text-amber-400" : "text-slate-400"
                )}>
                  {bio.length}/{BIO_MAX_LENGTH}
                </span>
              </div>
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/60">
                <p className="text-[11px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Contoh Format
                </p>
                <div className="mt-3 space-y-2 text-[11px] leading-relaxed text-slate-600 dark:text-slate-300">
                  <p>Penulis BeritaKarya yang berfokus pada isu publik, sosial, dan perkembangan daerah serta menyajikan informasi secara akurat dan berimbang.</p>
                  <p>Jurnalis BeritaKarya yang aktif menulis liputan seputar pemerintahan, masyarakat, dan dinamika regional dengan pendekatan yang faktual.</p>
                  <p>Anggota redaksi BeritaKarya yang menaruh perhatian pada perkembangan kebijakan, kehidupan sosial, dan informasi daerah yang relevan bagi publik.</p>
                </div>
              </div>
            </div>

            {/* Document Uploads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* KTP Upload */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <label htmlFor="ktp-upload" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                  Foto KTP <span className="text-brand-red">*</span>
                </label>
                <div 
                  className={cn(
                    "relative aspect-[3/2] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer",
                    idPreview ? "border-brand-red/20" : "border-slate-200 dark:border-slate-800 hover:border-brand-red/20"
                  )}
                  onClick={() => document.getElementById('ktp-upload')?.click()}
                >
                  {idPreview ? (
                    <>
                      <img src={idPreview} alt="KTP Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Klik untuk unggah</p>
                    </div>
                  )}
                </div>
                <input 
                  id="ktp-upload"
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, 'id')}
                />
                {/* Warning resolusi rendah KTP */}
                {idLowRes && (
                  <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <span>⚠</span> Resolusi foto mungkin terlalu rendah. Dokumen tetap bisa dikirim, namun disarankan foto ulang dengan kualitas lebih baik.
                  </p>
                )}
              </div>

              {/* KK Upload */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm">
                <label htmlFor="kk-upload" className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 uppercase tracking-wider">
                  Kartu Keluarga (Opsi)
                </label>
                <div 
                  className={cn(
                    "relative aspect-[3/2] rounded-xl border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden cursor-pointer",
                    familyPreview ? "border-brand-red/20" : "border-slate-200 dark:border-slate-800 hover:border-brand-red/20"
                  )}
                  onClick={() => document.getElementById('kk-upload')?.click()}
                >
                  {familyPreview ? (
                    <>
                      <img src={familyPreview} alt="KK Preview" className="absolute inset-0 w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                        <Camera className="w-8 h-8 text-white" />
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-4">
                      <Upload className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Klik untuk unggah</p>
                    </div>
                  )}
                </div>
                <input 
                  id="kk-upload"
                  type="file" 
                  accept="image/*"
                  className="hidden" 
                  onChange={(e) => handleFileChange(e, 'family')}
                />
                {/* Warning resolusi rendah KK */}
                {familyLowRes && (
                  <p className="mt-2 text-[10px] text-amber-600 dark:text-amber-400 font-bold flex items-center gap-1">
                    <span>⚠</span> Resolusi foto mungkin terlalu rendah. Dokumen tetap bisa dikirim, namun disarankan foto ulang.
                  </p>
                )}
              </div>
            </div>

            {/* Consent & Error */}
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input 
                  type="checkbox" 
                  id="consent"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  className="mt-1 w-4 h-4 rounded border-slate-300 text-brand-red focus:ring-brand-red"
                />
                <label htmlFor="consent" className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                  Saya menyatakan bahwa data yang saya berikan adalah benar dan saya menyetujui <Link href={`/${siteId}/kebijakan-privasi`} className="text-brand-red font-bold hover:underline">Kebijakan Perlindungan Data KYC</Link> BeritaKarya.
                </label>
              </div>

              {error && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400"
                >
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-xs font-bold uppercase tracking-wider">{error}</p>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className={cn(
                  "w-full py-4 rounded-xl font-black uppercase tracking-[0.3em] text-xs transition-all flex items-center justify-center gap-3",
                  submitting 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-brand-red text-white shadow-xl shadow-brand-red/20 hover:scale-[1.02] active:scale-[0.98]"
                )}
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    Kirim Pengajuan Verifikasi
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl">
            <h3 className="font-black uppercase tracking-widest text-xs mb-4 text-brand-red">Panduan Verifikasi</h3>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-slate-300">Foto KTP harus jelas, tidak buram, dan tidak terpotong.</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-slate-300">Pencahayaan cukup agar data teks mudah terbaca.</p>
              </li>
              <li className="flex gap-3">
                <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed text-slate-300">Kartu Keluarga dapat membantu mempercepat proses validasi.</p>
              </li>
            </ul>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-slate-400" />
              <h3 className="font-bold text-sm dark:text-white">Privasi Anda Prioritas Kami</h3>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Dokumen Anda akan otomatis diberi watermark dan disimpan di server terenkripsi. Hanya tim redaksi senior yang memiliki akses untuk keperluan verifikasi.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
