'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Save,
  AlertCircle,
  Loader2,
  Lock as LockIcon,
} from 'lucide-react'
import { api } from '../../../../../../lib/api'
import { useRequireRole } from '../../../../../../hooks/useRequireRole'
import axios from 'axios'

export default function WapimredPermissionsPage() {
  const { isAllowed } = useRequireRole(['superadmin'])
  const { site } = useParams() as { site: string }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [wapimredSettings, setWapimredSettings] = useState({
    canPublish: false,
    canSchedule: false,
    canForcePublish: false,
    canDeletePublished: false,
    canManageCategories: false,
    canTransferUser: false,
    canDeleteUser: false,
    notifyPimredOnSubmit: true,
    notifyPimredOnApprove: true,
  })

  const fetchWapimredSettings = async () => {
    try {
      const { data } = await api.get('/sites/wapimred-settings')
      if (data.success) {
        setWapimredSettings({
          canPublish: data.data.canPublish ?? false,
          canSchedule: data.data.canSchedule ?? false,
          canForcePublish: data.data.canForcePublish ?? false,
          canDeletePublished: data.data.canDeletePublished ?? false,
          canManageCategories: data.data.canManageCategories ?? false,
          canTransferUser: data.data.canTransferUser ?? false,
          canDeleteUser: data.data.canDeleteUser ?? false,
          notifyPimredOnSubmit: data.data.notifyPimredOnSubmit ?? true,
          notifyPimredOnApprove: data.data.notifyPimredOnApprove ?? true,
        })
      }
    } catch (err) {
      console.error('Failed to fetch wapimred settings', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchWapimredSettings()
  }, [site])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const { data } = await api.patch('/sites/wapimred-settings', wapimredSettings)
      if (data.success) {
        setWapimredSettings(data.data)
        setMessage({ type: 'success', text: 'Hak akses Wapimred berhasil diperbarui!' })
      }
    } catch (err: unknown) {
      setMessage({
        type: 'error',
        text: (axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal menyimpan pengaturan',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!isAllowed) return null

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <div className="w-16 h-16 border-4 border-brand-red/10 rounded-full animate-spin border-t-brand-red" />
        <p className="text-sm text-gray-500">Memuat hak akses...</p>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-24">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-gray-200 dark:border-gray-800 pb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-brand-red/10 rounded-lg">
              <LockIcon size={20} className="text-brand-red" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
              Hak Akses Wapimred
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            Atur wewenang Wakil Pimpinan Redaksi di situs <span className="text-brand-red font-bold">#{site}</span>
          </p>
        </div>
      </div>

      {/* NOTIFIKASI STATUS */}
      {message && (
        <div
          className={`p-4 flex items-center gap-3 rounded-xl border ${
            message.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400'
              : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
          }`}
        >
          <AlertCircle size={18} />
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* INFO BOX */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          Saat toggle <strong>OFF</strong>, Wapimred tidak bisa menjalankan aksi tersebut. Tombol terkait akan dinonaktifkan di dashboard.
        </p>
      </div>

      {/* TOGGLE ITEMS */}
      <div className="space-y-4">
        {[
          { key: 'canPublish' as const, label: 'Boleh Terbitkan Artikel', desc: 'Wapimred bisa menerbitkan artikel yang sudah disetujui (approved) langsung ke publik.' },
          { key: 'canSchedule' as const, label: 'Boleh Jadwalkan Artikel', desc: 'Wapimred bisa menjadwalkan artikel untuk terbit otomatis pada waktu tertentu.' },
          { key: 'canForcePublish' as const, label: 'Boleh Force-Publish', desc: 'Wapimred bisa menerbitkan artikel dari status apapun (skip workflow). Berisiko tinggi.' },
          { key: 'canDeletePublished' as const, label: 'Boleh Hapus Post Terbit', desc: 'Wapimred bisa menghapus artikel yang sudah tayang di publik. Berisiko tinggi.' },
          { key: 'canManageCategories' as const, label: 'Boleh Kelola Kategori', desc: 'Wapimred bisa membuat, mengedit, dan menghapus kategori di situs ini.' },
          { key: 'canTransferUser' as const, label: 'Boleh Pindah Cabang User', desc: 'Wapimred bisa memindahkan user ke situs lain.' },
          { key: 'canDeleteUser' as const, label: 'Boleh Hapus User', desc: 'Wapimred bisa menghapus (soft-delete) user di situs ini.' },
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
                  [item.key]: !wapimredSettings[item.key],
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

      <hr className="border-gray-200 dark:border-gray-800" />

      {/* NOTIFIKASI PIMRED */}
      <div>
        <h4 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2 mb-1">
          <AlertCircle size={14} className="text-brand-red" /> Notifikasi Pimred
        </h4>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Atur notifikasi yang dikirim ke Pimred saat Wapimred melakukan aksi editorial.
        </p>
        <div className="space-y-4">
          {[
            { key: 'notifyPimredOnSubmit' as const, label: 'Notif saat artikel masuk antrian', desc: 'Pimred mendapat notifikasi setiap ada artikel baru yang diajukan penulis.' },
            { key: 'notifyPimredOnApprove' as const, label: 'Notif saat Wapimred approve artikel', desc: 'Pimred mendapat notifikasi saat Wapimred menyetujui artikel (siap terbit).' },
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
                    [item.key]: !wapimredSettings[item.key],
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
      </div>

      {/* TOMBOL SIMPAN */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-brand-red hover:bg-red-700 text-white px-6 py-3 text-sm font-medium transition-all rounded-lg shadow-lg disabled:opacity-50"
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Menyimpan...' : 'Simpan Pengaturan Wapimred'}
        </button>
      </div>
    </div>
  )
}
