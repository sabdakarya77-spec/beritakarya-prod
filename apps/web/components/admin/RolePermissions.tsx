'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import {
  Save,
  AlertCircle,
  Loader2,
  Lock as LockIcon,
} from 'lucide-react'
import { api } from '../../lib/api'
import axios from 'axios'

interface PermissionSettings {
  canPublish: boolean
  canSchedule: boolean
  canForcePublish: boolean
  canDeletePublished: boolean
  canManageCategories: boolean
  canTransferUser: boolean
  canDeleteUser: boolean
  notifyPimredOnSubmit: boolean
  notifyPimredOnApprove: boolean
}

interface RoleConfig {
  label: string
  description: string
  color: string
  bgGradient: string
}

const ROLE_CONFIGS: Record<string, RoleConfig> = {
  wapimred: {
    label: 'Wapimred',
    description: 'Wakil Pimpinan Redaksi',
    color: 'text-red-600',
    bgGradient: 'from-red-500 to-red-600',
  },
  kaperwil: {
    label: 'Kaperwil',
    description: 'Ketua Perwakilan Wilayah',
    color: 'text-indigo-600',
    bgGradient: 'from-indigo-500 to-indigo-600',
  },
  kabiro: {
    label: 'Kabiro',
    description: 'Kepala Biro',
    color: 'text-violet-600',
    bgGradient: 'from-violet-500 to-violet-600',
  },
}

const DEFAULT_SETTINGS: PermissionSettings = {
  canPublish: false,
  canSchedule: false,
  canForcePublish: false,
  canDeletePublished: false,
  canManageCategories: false,
  canTransferUser: false,
  canDeleteUser: false,
  notifyPimredOnSubmit: true,
  notifyPimredOnApprove: true,
}

const PERMISSION_ITEMS = [
  { key: 'canPublish' as const, label: 'Boleh Terbitkan Artikel', desc: 'Bisa menerbitkan artikel yang sudah disetujui (approved) langsung ke publik.' },
  { key: 'canSchedule' as const, label: 'Boleh Jadwalkan Artikel', desc: 'Bisa menjadwalkan artikel untuk terbit otomatis pada waktu tertentu.' },
  { key: 'canForcePublish' as const, label: 'Boleh Force-Publish', desc: 'Bisa menerbitkan artikel dari status apapun (skip workflow). Berisiko tinggi.' },
  { key: 'canDeletePublished' as const, label: 'Boleh Hapus Post Terbit', desc: 'Bisa menghapus artikel yang sudah tayang di publik. Berisiko tinggi.' },
  { key: 'canManageCategories' as const, label: 'Boleh Kelola Kategori', desc: 'Bisa membuat, mengedit, dan menghapus kategori di situs ini.' },
  { key: 'canTransferUser' as const, label: 'Boleh Pindah Cabang User', desc: 'Bisa memindahkan user ke situs lain.' },
  { key: 'canDeleteUser' as const, label: 'Boleh Hapus User', desc: 'Bisa menghapus (soft-delete) user di situs ini.' },
]

const NOTIFICATION_ITEMS = [
  { key: 'notifyPimredOnSubmit' as const, label: 'Notif saat artikel masuk antrian', desc: 'Pimred mendapat notifikasi setiap ada artikel baru yang diajukan penulis.' },
  { key: 'notifyPimredOnApprove' as const, label: 'Notif saat artikel di-approve', desc: 'Pimred mendapat notifikasi saat artikel disetujui (siap terbit).' },
]

interface RolePermissionsProps {
  role: 'wapimred' | 'kaperwil' | 'kabiro'
}

export default function RolePermissions({ role }: RolePermissionsProps) {
  const { site } = useParams() as { site: string }
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [settings, setSettings] = useState<PermissionSettings>(DEFAULT_SETTINGS)

  const config = ROLE_CONFIGS[role] || ROLE_CONFIGS.wapimred

  const fetchSettings = async () => {
    try {
      const { data } = await api.get(`/sites/${role}-settings`)
      if (data.success) {
        setSettings({
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
      console.error(`Failed to fetch ${role} settings`, err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [site, role])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)
    try {
      const { data } = await api.patch(`/sites/${role}-settings`, settings)
      if (data.success) {
        setSettings(data.data)
        setMessage({ type: 'success', text: `Hak akses ${config.label} berhasil diperbarui!` })
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

  const toggleSetting = (key: keyof PermissionSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }))
  }

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
            <div className={`p-2 bg-gradient-to-br ${config.bgGradient} rounded-lg`}>
              <LockIcon size={20} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
                Hak Akses {config.label}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {config.description} — situs <span className={`${config.color} font-bold`}>#{site}</span>
              </p>
            </div>
          </div>
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
          Saat toggle <strong>OFF</strong>, {config.label} tidak bisa menjalankan aksi tersebut. Tombol terkait akan dinonaktifkan di dashboard.
        </p>
      </div>

      {/* PERMISSION ITEMS */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">
          Wewenang Editorial
        </h3>
        <div className="space-y-4">
          {PERMISSION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="flex-1 mr-4">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleSetting(item.key)}
                className={`px-5 py-2.5 text-sm font-medium border rounded-lg transition-all ${
                  settings[item.key]
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                {settings[item.key] ? 'AKTIF' : 'NONAKTIF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      <hr className="border-gray-200 dark:border-gray-800" />

      {/* NOTIFIKASI PIMRED */}
      <div>
        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-2">
          Notifikasi Pimred
        </h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
          Atur notifikasi yang dikirim ke Pimred saat {config.label} melakukan aksi editorial.
        </p>
        <div className="space-y-4">
          {NOTIFICATION_ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex items-center justify-between bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 hover:border-gray-300 dark:hover:border-gray-700 transition-colors"
            >
              <div className="flex-1 mr-4">
                <p className="text-sm font-bold text-gray-900 dark:text-white">{item.label}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{item.desc}</p>
              </div>
              <button
                type="button"
                onClick={() => toggleSetting(item.key)}
                className={`px-5 py-2.5 text-sm font-medium border rounded-lg transition-all ${
                  settings[item.key]
                    ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm'
                    : 'bg-gray-100 border-gray-200 text-gray-500 dark:bg-gray-800 dark:border-gray-700'
                }`}
              >
                {settings[item.key] ? 'AKTIF' : 'NONAKTIF'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* TOMBOL SIMPAN */}
      <div className="flex justify-end sticky bottom-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`flex items-center gap-2 bg-gradient-to-r ${config.bgGradient} hover:opacity-90 text-white px-6 py-3 text-sm font-medium transition-all rounded-lg shadow-lg disabled:opacity-50`}
        >
          {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
          {saving ? 'Menyimpan...' : `Simpan Pengaturan ${config.label}`}
        </button>
      </div>
    </div>
  )
}
