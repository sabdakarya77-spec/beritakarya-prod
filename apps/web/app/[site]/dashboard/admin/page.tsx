'use client'

import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { api } from '../../../../lib/api'
import { SiteCategoriesDialog } from './components/SiteCategoriesDialog'
import { 
  Plus, 
  Settings, 
  Trash2, 
  Edit3, 
  Globe, 
  Mail, 
  Users, 
  FileText, 
  FolderOpen,
  Tags,
  AlertTriangle,
  X,
  CheckCircle2
} from 'lucide-react'

interface Site {
  id: string
  domain: string
  name: string
  contactEmail?: string
  stats?: {
    users: number
    articles: number
    categories: number
  }
}

export default function AdminDashboardPage() {
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [formData, setFormData] = useState({
    id: '',
    domain: '',
    name: '',
    contactEmail: ''
  })
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [categoriesSite, setCategoriesSite] = useState<Site | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const fetchSites = async () => {
    try {
      const { data } = await api.get('/sites', { params: { includeStats: true } })
      if (data.success) {
        setSites(data.data)
      }
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Gagal memuat data situs', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSites()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      if (editingSite) {
        await api.put(`/sites/${editingSite.id}`, formData)
      } else {
        await api.post('/sites', formData)
      }
      showToast(editingSite ? 'Situs berhasil diperbarui' : 'Situs berhasil dibuat')
      setDialogOpen(false)
      fetchSites()
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Gagal menyimpan situs', 'error')
    }
  }

  const openEditDialog = (site: Site) => {
    setEditingSite(site)
    setFormData({
      id: site.id,
      domain: site.domain,
      name: site.name,
      contactEmail: site.contactEmail || ''
    })
    setDialogOpen(true)
  }

  const openCreateDialog = () => {
    setEditingSite(null)
    setFormData({
      id: '',
      domain: '',
      name: '',
      contactEmail: ''
    })
    setDialogOpen(true)
  }

  const handleDelete = async (siteId: string) => {
    setDeleteConfirm(siteId)
  }

  const confirmDelete = async () => {
    if (!deleteConfirm) return
    try {
      await api.delete(`/sites/${deleteConfirm}`)
      showToast('Situs berhasil dihapus')
      fetchSites()
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Gagal menghapus situs', 'error')
    } finally {
      setDeleteConfirm(null)
    }
  }

  const createEditDialog =
    dialogOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              onClick={() => setDialogOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl max-w-xl w-full p-8 shadow-xl relative z-10">
              <button
                onClick={() => setDialogOpen(false)}
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-2 rounded-lg transition-all"
              >
                <X size={18} />
              </button>

              <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase mb-2 flex items-center gap-2">
                <Settings size={20} className="text-brand-red" />
                {editingSite ? 'Edit Konfigurasi Situs' : 'Tambahkan Portal Berita'}
              </h2>
              <p className="text-sm text-gray-500 mb-8">
                {editingSite
                  ? 'Perbarui konfigurasi situs yang terdaftar'
                  : 'Tambahkan portal berita baru ke jaringan BeritaKarya'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label htmlFor="admin-site-id" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Site ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="admin-site-id"
                      type="text"
                      value={formData.id}
                      onChange={(e) => setFormData({ ...formData, id: e.target.value })}
                      placeholder="contoh: surabaya"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      required
                      disabled={!!editingSite}
                    />
                    <p className="text-xs text-gray-500">Unique identifier. Digunakan dalam URL: /[site_id]/</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="admin-site-domain" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Domain <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="admin-site-domain"
                      type="text"
                      value={formData.domain}
                      onChange={(e) => setFormData({ ...formData, domain: e.target.value })}
                      placeholder="surabaya.beritakarya.co"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      required
                    />
                    <p className="text-xs text-gray-500">Alamat domain lengkap untuk portal cabang.</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="admin-site-name" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nama Tampilan <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="admin-site-name"
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="BeritaKarya Surabaya"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                      required
                    />
                    <p className="text-xs text-gray-500">Nama cabang yang ditampilkan ke pembaca.</p>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="admin-site-email" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email Kontak
                    </label>
                    <input
                      id="admin-site-email"
                      type="email"
                      value={formData.contactEmail}
                      onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                      placeholder="admin@surabaya.beritakarya.co"
                      className="w-full bg-gray-50 dark:bg-gray-950 border border-gray-200 dark:border-gray-800 rounded-lg px-4 py-3 text-base text-gray-900 dark:text-white outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-all"
                    />
                    <p className="text-xs text-gray-500">Email administrasi untuk notifikasi resmi.</p>
                  </div>
                </div>

                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-800 mt-8">
                  <button
                    type="button"
                    onClick={() => setDialogOpen(false)}
                    className="px-6 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all border border-gray-200 dark:border-gray-700"
                  >
                    Batal
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-brand-red hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-all"
                  >
                    {editingSite ? 'Perbarui' : 'Buat Situs'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )
      : null

  const deleteDialog =
    deleteConfirm && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div
              onClick={() => setDeleteConfirm(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 rounded-xl max-w-md w-full p-8 shadow-xl relative z-10">
              <div className="w-12 h-12 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl flex items-center justify-center text-red-500 mb-5">
                <AlertTriangle size={24} />
              </div>

              <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Konfirmasi Hapus Situs
              </h3>
              <p className="text-sm text-gray-500 mb-6">
                Tindakan ini permanen dan tidak dapat dibatalkan.
              </p>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-8">
                Apakah Anda yakin ingin menghapus situs <code className="text-red-600 font-bold bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded">{deleteConfirm}</code>? Tindakan ini akan menghapus semua data terkait secara permanen.
              </p>

              <div className="flex justify-end gap-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="px-6 py-3 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-all border border-gray-200 dark:border-gray-700"
                >
                  Batal
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-6 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg text-sm font-medium transition-all"
                >
                  Ya, Hapus
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-6 right-6 z-50 px-6 py-4 rounded-xl shadow-lg flex items-center gap-3 border ${
          toast.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700 dark:bg-emerald-900/20 dark:border-emerald-800 dark:text-emerald-400' 
            : 'bg-red-50 border-red-200 text-red-700 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span className="text-sm font-medium">{toast.message}</span>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
            Manajemen <span className="text-brand-red">Situs</span>
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Kelola semua portal berita di jaringan BeritaKarya
          </p>
        </div>
        <button 
          onClick={openCreateDialog}
          className="bg-brand-red hover:bg-red-600 text-white px-5 py-3 rounded-lg font-bold text-sm uppercase tracking-wide flex items-center gap-2 transition-all"
        >
          <Plus size={16} />
          Tambah Situs
        </button>
      </div>

      {/* Main Table */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-800">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase">
                    Site ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase">
                    Domain
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase hidden md:table-cell">
                    Nama & Kontak
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-bold text-gray-500 uppercase hidden sm:table-cell">
                    Statistik
                  </th>
                  <th className="px-6 py-4 text-right text-sm font-bold text-gray-500 uppercase">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {sites.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-16 text-center text-sm text-gray-500">
                      Belum ada situs terdaftar di sistem.
                    </td>
                  </tr>
                ) : sites.map((site) => (
                  <tr key={site.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                    {/* Site ID */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm font-medium px-3 py-1.5 rounded-lg">
                        {site.id}
                      </span>
                    </td>
                     
                    {/* Domain */}
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Globe size={14} className="text-brand-red" />
                        <a 
                          href={`https://${site.domain}`} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-brand-red hover:text-red-600 font-medium transition-colors"
                        >
                          {site.domain}
                        </a>
                      </div>
                    </td>

                    {/* Name & Contact */}
                    <td className="px-6 py-4 whitespace-nowrap hidden md:table-cell">
                      <div>
                        <div className="font-medium text-gray-900 dark:text-gray-100">
                          {site.name}
                        </div>
                        {site.contactEmail ? (
                          <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-1">
                            <Mail size={12} /> {site.contactEmail}
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400 italic mt-1">
                            Tanpa email kontak
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Statistics */}
                    <td className="px-6 py-4 whitespace-nowrap hidden sm:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded text-xs font-medium">
                          <Users size={12} /> {site.stats?.users || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded text-xs font-medium">
                          <FileText size={12} /> {site.stats?.articles || 0}
                        </span>
                        <span className="inline-flex items-center gap-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 px-2 py-1 rounded text-xs font-medium">
                          <FolderOpen size={12} /> {site.stats?.categories || 0}
                        </span>
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex gap-2 justify-end">
                        <button 
                          onClick={() => setCategoriesSite(site)}
                          className="px-3.5 py-1.5 border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-all flex items-center gap-1"
                        >
                          <Tags size={13} />
                          Kategori
                        </button>
                        <button 
                          onClick={() => openEditDialog(site)}
                          className="px-3.5 py-1.5 border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-100 dark:hover:bg-gray-700 transition-all flex items-center gap-1"
                        >
                          <Edit3 size={13} />
                          Edit
                        </button>
                        {site.id !== 'pusat' && (
                          <button 
                            onClick={() => handleDelete(site.id)}
                            className="px-3.5 py-1.5 bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-800 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition-all flex items-center gap-1"
                          >
                            <Trash2 size={13} />
                            Hapus
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {createEditDialog}
      {deleteDialog}

      <SiteCategoriesDialog
        site={categoriesSite}
        open={!!categoriesSite}
        onClose={() => setCategoriesSite(null)}
        onToast={showToast}
      />
    </div>
  )
}
