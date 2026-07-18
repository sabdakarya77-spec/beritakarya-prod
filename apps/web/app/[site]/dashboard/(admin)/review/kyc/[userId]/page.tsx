'use client'

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  Eye,
  Lock,
  AlertTriangle
} from 'lucide-react'
import { useParams, useRouter } from 'next/navigation'
import BackButton from '../../../../../../../components/ui/BackButton'
import axios from 'axios'
import { api } from '../../../../../../../lib/api'
import { useRequireRole } from '../../../../../../../hooks/useRequireRole'

interface KYCUser {
  id: string
  name: string
  email: string
  role: string
  bio: string | null
  isVerified: boolean
  kycStatus: string
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  kycNotes: string | null
  idCardPath: string | null
  familyCardPath: string | null
}

export default function KYCDetailReviewPage() {
  const { isAllowed } = useRequireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']);
  const params = useParams()
  const siteId = params.site as string
  const userId = params.userId as string
  const router = useRouter()

  const [user, setUser] = useState<KYCUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [notes, setNotes] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [showImage, setShowImage] = useState<'idCard' | 'familyCard' | null>(null)

  const fetchUser = async () => {
    setLoading(true)
    try {
      const response = await api.get(`/kyc/${userId}`)
      if (response.data.success) {
        setUser(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch user KYC data:', err)
      setError('Gagal memuat data pengguna')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchUser()
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUser deps (userId, siteId) already tracked
  }, [userId, siteId])

  const handleVerify = async (status: 'approved' | 'rejected') => {
    if (status === 'rejected' && !notes) {
      setError('Catatan alasan wajib diisi jika menolak pengajuan')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      await api.patch(`/kyc/${userId}/verify`, {
        status,
        notes
      })
      router.push(`/${siteId}/dashboard/review/kyc`)
    } catch (err: unknown) {
      setError((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) ?? `Gagal melakukan ${status}`)
    } finally {
      setSubmitting(false)
    }
  }

  if (!isAllowed) return null;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <Loader2 className="w-10 h-10 animate-spin text-brand-red mb-4" />
        <p className="text-xs font-black uppercase tracking-widest text-slate-400">Memuat berkas identitas...</p>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h2 className="text-xl font-bold dark:text-white">User tidak ditemukan</h2>
        <div className="mt-4">
          <BackButton
            fallbackHref={`/${siteId}/dashboard/review/kyc`}
            label="Kembali ke Antrian"
          />
        </div>
      </div>
    )
  }

  const getFileUrl = (type: 'idCard' | 'familyCard') => {
    return `/api/v1/kyc/view/${userId}/${type}?site=${encodeURIComponent(siteId)}`
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in pb-20">
      {/* Back & Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <BackButton
            fallbackHref={`/${siteId}/dashboard/review/kyc`}
            label="Kembali ke Antrian"
          />
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            Tinjau Identitas: {user.name}
          </h1>
          <p className="text-xs text-slate-500">ID: {user.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Review Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Documents Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label htmlFor="kyc-review-idcard" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Foto KTP (Watermarked)</label>
              <div
                id="kyc-review-idcard"
                className="group relative aspect-[3/2] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-zoom-in"
                onClick={() => user.idCardPath && setShowImage('idCard')}
              >
                {user.idCardPath ? (
                  <img src={getFileUrl('idCard')} alt="KTP" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={40} strokeWidth={1} />
                    <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">Tidak ada file</p>
                  </div>
                )}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Eye className="text-white w-8 h-8" />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label htmlFor="kyc-review-familycard" className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Kartu Keluarga (Opsi)</label>
              <div
                id="kyc-review-familycard"
                className="group relative aspect-[3/2] rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 cursor-zoom-in"
                onClick={() => user.familyCardPath && setShowImage('familyCard')}
              >
                {user.familyCardPath ? (
                  <img src={getFileUrl('familyCard')} alt="KK" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400">
                    <FileText size={40} strokeWidth={1} />
                    <p className="text-[10px] font-bold mt-2 uppercase tracking-widest">Tidak ada file</p>
                  </div>
                )}
                {user.familyCardPath && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="text-white w-8 h-8" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* User Bio */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-4">Biografi Penulis</h3>
            <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed italic">
              &ldquo;{user.bio || 'Pengguna tidak memberikan biografi.'}&rdquo;
            </p>
          </div>

          {/* Low Resolution Warning */}
          {user.kycNotes?.includes('PERINGATAN') && (
            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-3xl p-5 flex items-start gap-4">
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600 dark:text-amber-400 mb-1">Peringatan Kualitas Dokumen</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  {user.kycNotes
                    .split(' | ')
                    .filter(n => n.includes('PERINGATAN'))
                    .map(n => n.replace(/\[|\]/g, ''))
                    .join(' • ')}
                </p>
                <p className="text-[10px] text-amber-600/70 dark:text-amber-400/60 mt-2">
                  Dokumen tetap dapat diproses. Persetujuan akhir ada di tangan Anda sebagai reviewer.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Action Column */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-6 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-brand-red" /> Panel Keputusan
            </h3>
            
            <div className="space-y-5">
              <div>
                <label htmlFor="kyc-review-notes" className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Catatan Review</label>
                <textarea
                  id="kyc-review-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Berikan alasan jika ditolak atau catatan tambahan jika disetujui..."
                  className="w-full h-32 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-xs outline-none focus:border-brand-red/30 transition-all resize-none dark:text-white"
                />
              </div>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl flex items-center gap-3 text-red-600 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <p className="text-[10px] font-bold uppercase tracking-wider">{error}</p>
                </div>
              )}

              <div className="flex flex-col gap-3 pt-2">
                <button
                  disabled={submitting}
                  onClick={() => handleVerify('approved')}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] shadow-lg shadow-emerald-200 dark:shadow-none hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  Setujui Verifikasi
                </button>
                <button
                  disabled={submitting}
                  onClick={() => handleVerify('rejected')}
                  className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-red-50 hover:text-red-600 transition-all flex items-center justify-center gap-2"
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Tolak Pengajuan
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-red mb-4">Informasi Keamanan</h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Lock className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Setiap tampilan dokumen identitas dicatat dalam audit trail untuk keamanan data pengguna.</p>
              </div>
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">Persetujuan akan secara otomatis mempromosikan peran pengguna menjadi Reporter.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Modal */}
      <AnimatePresence>
        {showImage && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowImage(null)}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 cursor-zoom-out"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-5xl w-full"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={getFileUrl(showImage)} 
                alt="Document Preview" 
                className="w-full h-auto rounded-lg shadow-2xl border border-white/10"
              />
              <button 
                onClick={() => setShowImage(null)}
                className="absolute -top-12 right-0 text-white flex items-center gap-2 font-black uppercase tracking-widest text-[10px] hover:text-brand-red transition-colors"
              >
                <XCircle className="w-5 h-5" /> Tutup Preview
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
