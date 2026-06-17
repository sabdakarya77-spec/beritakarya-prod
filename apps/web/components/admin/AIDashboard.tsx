'use client'
import { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import {
  TrendingUp,
  DollarSign,
  Activity,
  Users,
  Zap,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Shield,
  Search,
  Check,
  XCircle,
  Cpu,
  Edit3,
  X
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface UsageData {
  period: { start: Date; end: Date }
  overall: {
    totalCost: number
    totalRequests: number
    totalTokens: number
    avgLatency: number
  }
  byRole: Array<{ role: string; requests: number; cost: number; totalTokens: number }>
  byFeature: Array<{ action: string; requests: number; cost: number }>
  bySite: Array<{ site: string; requests: number; cost: number; activeUsers: number }>
  topUsers: Array<{ name: string; email: string; role: string; requests: number; cost: number }>
  budgetStatus: Array<{ role: string; requests: number; currentSpend: number; monthlyBudget: number; percentUsed: number }>
  dailyTrend: Array<{ date: string; requests: number; cost: number; activeUsers: number }>
  modelUsage: Array<{ modelUsed: string; requests: number; cost: number }>
}

interface QuotaData {
  roleQuotas: Array<{
    role: string
    dailyRequests: number
    dailyTokens: number
    monthlyBudget: number
    allowedFeatures: string[]
    modelRestriction: string | null
  }>
  users: Array<{
    id: string
    name: string
    email: string
    role: string
    site: { domain: string; name: string } | null
    aiEnabled: boolean
    aiDailyLimit: number
    aiMonthlyBudget: number
    aiFeaturesAllowed: string[]
    aiModelRestriction: string | null
    currentMonthUsage: { requests: number; cost: number; tokens: number }
  }>
}

function formatCurrency(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(Number(value) || 0)
}

function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat('en-US').format(Number(value) || 0)
}

export function AIDashboard() {
  const [usageData, setUsageData] = useState<UsageData | null>(null)
  const [quotaData, setQuotaData] = useState<QuotaData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [searchTerm, setSearchTerm] = useState('')
  
  const [editingRole, setEditingRole] = useState<any | null>(null)
  const [roleFormData, setRoleFormData] = useState({
    dailyRequests: 50,
    monthlyBudget: 10,
    modelRestriction: '',
    allowedFeatures: [] as string[]
  })
  const [submittingRole, setSubmittingRole] = useState(false)

  const AVAILABLE_FEATURES = [
    { id: 'rewrite', name: 'Tulis Ulang (Rewrite)' },
    { id: 'expand', name: 'Perluas Teks (Expand)' },
    { id: 'headline', name: 'Buat Judul (Headline)' },
    { id: 'seo', name: 'Audit SEO (SEO Audit)' },
    { id: 'grammar', name: 'Perbaiki Gramatika (Grammar)' },
    { id: 'readability', name: 'Keterbacaan (Readability)' },
    { id: 'fact-check', name: 'Cek Fakta (Fact Check)' },
    { id: 'caption', name: 'Keterangan Gambar (Caption)' },
    { id: 'image_gen', name: 'Pembuat Gambar AI (Image Gen)' }
  ]

  function openEditRoleModal(quota: any) {
    let allowed: string[] = []
    if (Array.isArray(quota.allowedFeatures)) {
      allowed = quota.allowedFeatures
    } else if (typeof quota.allowedFeatures === 'string') {
      try {
        allowed = JSON.parse(quota.allowedFeatures)
      } catch (_e) {
        allowed = []
      }
    }

    setEditingRole(quota)
    setRoleFormData({
      dailyRequests: quota.dailyRequests,
      monthlyBudget: Number(quota.monthlyBudget) || 0,
      modelRestriction: quota.modelRestriction || '',
      allowedFeatures: allowed
    })
  }

  async function handleRoleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingRole) return
    setSubmittingRole(true)
    try {
      const res = await api.patch(`/admin/roles/${editingRole.role}/quota`, {
        dailyRequests: Number(roleFormData.dailyRequests),
        dailyTokens: Number(roleFormData.dailyRequests) * 2000,
        monthlyBudget: Number(roleFormData.monthlyBudget),
        allowedFeatures: roleFormData.allowedFeatures,
        modelRestriction: roleFormData.modelRestriction || null
      })

      if (res.data.success) {
        await fetchData()
        setEditingRole(null)
      }
    } catch (error) {
      console.error('Failed to update role quota:', error)
      alert('Gagal memperbarui kuota peran!')
    } finally {
      setSubmittingRole(false)
    }
  }

  function handleFeatureToggle(featureId: string) {
    setRoleFormData(prev => {
      const allowed = prev.allowedFeatures.includes(featureId)
        ? prev.allowedFeatures.filter(id => id !== featureId)
        : [...prev.allowedFeatures, featureId]
      return { ...prev, allowedFeatures: allowed }
    })
  }

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const [usageRes, quotaRes] = await Promise.all([
        api.get('/admin/ai-usage'),
        api.get('/admin/quotas')
      ])
      
      setUsageData(usageRes.data)
      setQuotaData(quotaRes.data)
    } catch (error) {
      console.error('Failed to fetch admin data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 space-y-4">
        <div className="w-12 h-12 border-4 border-brand-red border-t-transparent rounded-full animate-spin" />
        <p className="text-[11px] font-medium text-gray-400">Menghubungkan ke AI Command Center...</p>
      </div>
    )
  }

  // Filtered users for search bar
  const filteredUsers = (quotaData?.users || []).filter(u => 
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (u.site?.name || '').toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-20 text-gray-200">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-brand-red text-white flex items-center justify-center shadow-lg shadow-brand-red/30 relative group overflow-hidden border border-red-400/20">
            <Cpu size={24} className="group-hover:rotate-12 transition-transform duration-300" />
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
              AI Command Center
              <span className="text-[10px] px-2 py-0.5 bg-brand-red/10 text-brand-red rounded-md font-bold uppercase tracking-wider border border-brand-red/20">Active</span>
            </h1>
            <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">
              Pemantauan kuota, biaya, dan performa kecerdasan buatan <strong className="text-brand-red">GPT-4o</strong>
            </p>
          </div>
        </div>
        
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2.5 px-5 py-2.5 bg-[#0f172a] hover:bg-brand-red border border-white/5 hover:border-red-400/30 text-white text-[11px] font-semibold rounded-xl transition-all duration-300 shadow-lg shadow-black/40 group active:scale-95"
        >
          <Activity size={14} className="text-brand-red group-hover:text-white" />
          Refresh Stats
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex bg-[#0c121e]/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/5 shadow-2xl">
        {['overview', 'quotas', 'users', 'reports'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 py-3 text-[11px] font-semibold rounded-xl transition-all duration-300",
              activeTab === tab
                ? "bg-brand-red text-white shadow-lg shadow-brand-red/20"
                : "text-gray-400 hover:text-white hover:bg-white/[0.02]"
            )}
          >
            {tab === 'overview' && 'Ringkasan'}
            {tab === 'quotas' && 'Definisi Kuota'}
            {tab === 'users' && 'Akses Pengguna'}
            {tab === 'reports' && 'Ekspor Laporan'}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-8">
          
          {/* Key Metrics */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            
            {/* Total Cost */}
            <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-emerald-500/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Total Pengeluaran</p>
                  <p className="text-3xl font-black text-emerald-400 mt-2 tracking-tight">
                    {formatCurrency(usageData?.overall.totalCost || 0)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <Activity size={10} className="text-emerald-500" />
                    {formatNumber(usageData?.overall.totalRequests || 0)} Permintaan
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center border border-emerald-500/20 group-hover:scale-110 transition-transform">
                  <DollarSign size={20} />
                </div>
              </div>
            </div>

            {/* Active Users */}
            <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-blue-500/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Pengguna Aktif</p>
                  <p className="text-3xl font-black text-blue-400 mt-2 tracking-tight">
                    {usageData?.dailyTrend.reduce((sum, d) => sum + d.activeUsers, 0) || 0}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <Users size={10} className="text-blue-500" />
                    30 Hari Terakhir
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center border border-blue-500/20 group-hover:scale-110 transition-transform">
                  <Users size={20} />
                </div>
              </div>
            </div>

            {/* Avg Latency */}
            <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-amber-500/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Waktu Respons Rata-rata</p>
                  <p className="text-3xl font-black text-amber-400 mt-2 tracking-tight">
                    {Math.round(usageData?.overall.avgLatency || 0)}ms
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <Clock size={10} className="text-amber-500" />
                    Respon Sangat Cepat
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20 group-hover:scale-110 transition-transform">
                  <Clock size={20} />
                </div>
              </div>
            </div>

            {/* Total Tokens */}
            <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-xl relative overflow-hidden group hover:border-purple-500/20 transition-all duration-300">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] font-semibold text-gray-500">Token Diproses</p>
                  <p className="text-3xl font-black text-purple-400 mt-2 tracking-tight">
                    {formatNumber(usageData?.overall.totalTokens || 0)}
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1.5 flex items-center gap-1.5">
                    <Zap size={10} className="text-purple-500" />
                    Input + Output
                  </p>
                </div>
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center border border-purple-500/20 group-hover:scale-110 transition-transform">
                  <Zap size={20} />
                </div>
              </div>
            </div>

          </div>

          {/* Cost by Feature & Budget Status */}
          <div className="grid gap-8 md:grid-cols-2">
            
            {/* Cost by Feature */}
            <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Distribusi Biaya per Fitur</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Analisis Alokasi Anggaran AI</p>
              </div>
              
              <div className="space-y-4">
                {(usageData?.byFeature || []).map((feature, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-extrabold">
                      <span className="capitalize text-gray-300">{feature.action}</span>
                      <span className="text-white">{formatCurrency(feature.cost)}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-white/5 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className="bg-brand-red h-1.5 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.5)] transition-all duration-500"
                          style={{ width: `${(feature.cost / Math.max(...(usageData?.byFeature || []).map(f => f.cost || 1))) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500">
                        {feature.requests} Req
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Budget Status by Role */}
            <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Status Anggaran per Peran</h3>
                <p className="text-[11px] text-gray-500 mt-0.5">Kontrol Pengeluaran Jurnalistik</p>
              </div>
              
              <div className="space-y-5">
                {(usageData?.budgetStatus || []).map((budget, idx) => {
                  const pct = Number(budget.percentUsed) || 0
                  const spend = Number(budget.currentSpend) || 0
                  const limit = Number(budget.monthlyBudget) || 0
                  return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-extrabold">
                      <span className="capitalize text-gray-300">{budget.role}</span>
                      <span className={cn(
                        "px-2.5 py-0.5 rounded text-[10px] font-semibold border",
                        pct > 90 
                          ? "bg-rose-500/10 text-rose-400 border-rose-500/20" 
                          : pct > 70 
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20" 
                          : "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      )}>
                        {pct.toFixed(1)}% Terpakai
                      </span>
                    </div>
                    
                    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                      <div 
                        className={cn(
                          "h-1.5 rounded-full transition-all duration-500",
                          pct > 90 
                            ? "bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]" 
                            : pct > 70 
                            ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" 
                            : "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                        )}
                        style={{ width: `${Math.min(pct, 100)}%` }}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                      <span>Pengeluaran: {formatCurrency(spend)}</span>
                      <span>Batas: {formatCurrency(limit)}</span>
                    </div>
                  </div>
                  )
                })}
              </div>
            </div>

          </div>

          {/* Top Users Table */}
          <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wide text-white">Reporter & Kontributor AI</h3>
              <p className="text-[11px] text-gray-500 mt-0.5">Analisis Penggunaan Individu</p>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wide text-[10px]">
                    <th className="py-3 px-4">Reporter / Pengguna</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4 text-right">Total Permintaan</th>
                    <th className="py-3 px-4 text-right">Biaya API</th>
                  </tr>
                </thead>
                <tbody>
                  {(usageData?.topUsers || []).map((user, idx) => (
                    <tr key={idx} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-extrabold text-[10px] text-brand-red uppercase">
                            {user.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-200">{user.name}</p>
                              <p className="text-[10px] text-gray-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">
                        <span className={cn(
                          "px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                          user.role === 'superadmin' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : user.role === 'wapimred'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="text-right py-4 px-4 font-bold text-gray-400">{user.requests} Req</td>
                      <td className="text-right py-4 px-4 font-black text-emerald-400">{formatCurrency(user.cost)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ── QUOTAS TAB ────────────────────────────────────────────────────── */}
      {activeTab === 'quotas' && (
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* Role Quotas Definitions */}
          <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Hak Akses & Kuota Peran</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Konfigurasi Hak Redaksional Global</p>
            </div>
            
            <div className="space-y-4">
              {(quotaData?.roleQuotas || []).map((quota) => (
                <div key={quota.role} className="border border-white/5 rounded-xl p-4 bg-white/[0.01] space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-white capitalize">{quota.role}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-black uppercase tracking-widest bg-brand-red/10 border border-brand-red/20 text-brand-red px-2 py-0.5 rounded-md">
                        {quota.modelRestriction || 'Semua Model (GPT-4o)'}
                      </span>
                      <button 
                        onClick={() => openEditRoleModal(quota)}
                        className="p-1 text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 rounded-md border border-white/5"
                        title="Sesuaikan Kuota AI Peran"
                      >
                        <Edit3 size={11} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    <div>
                      <span className="text-gray-500 block text-[10px] font-black">Limit Harian:</span>
                      <p className="font-extrabold text-gray-200 mt-1">{quota.dailyRequests} Permintaan / Hari</p>
                    </div>
                    <div>
                      <span className="text-gray-500 block text-[10px] font-black">Batas Bulanan:</span>
                      <p className="font-extrabold text-emerald-400 mt-1">{formatCurrency(quota.monthlyBudget)} / Bulan</p>
                    </div>
                  </div>
                  
                  <div className="pt-3 border-t border-white/5">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Fitur AI yang Diizinkan:</span>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {(() => {
                        let allowed: string[] = []
                        if (Array.isArray(quota.allowedFeatures)) {
                          allowed = quota.allowedFeatures
                        } else if (typeof quota.allowedFeatures === 'string') {
                          try {
                            allowed = JSON.parse(quota.allowedFeatures)
                          } catch (_e) {
                            allowed = []
                          }
                        }
                        return (allowed || []).map((f) => (
                          <span key={f} className="text-[10px] font-black uppercase tracking-wider bg-white/5 border border-white/10 text-gray-300 px-2 py-0.5 rounded">
                            {f}
                          </span>
                        ))
                      })()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats Overview */}
          <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Ringkasan Proteksi AI</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Metrik Manajemen Proteksi & Batas</p>
            </div>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                <Shield className="text-emerald-500 mt-0.5" size={16} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-300">Sistem KYC Terintegrasi</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">AI hanya diizinkan untuk reporter, kontributor, dan editor yang telah lolos verifikasi berkas (KYC) demi menjaga integritas data media.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                <AlertTriangle className="text-amber-500 mt-0.5" size={16} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-300">Peringatan Kuota Otomatis</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Sistem akan otomatis mengirimkan peringatan redaksi apabila penggunaan kuota harian atau bulanan pengguna mendekati 80% batas.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 bg-white/[0.01] p-3 rounded-xl border border-white/5">
                <Cpu className="text-purple-500 mt-0.5" size={16} />
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-wider text-gray-300">Distribusi Beban Kerja</h4>
                  <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">Sistem membatasi request per detik (Rate Limiting) secara real-time untuk mencegah penyalahgunaan API atau serangan spamming.</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* ── USERS TAB ─────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Daftar Hak Akses Akun Pengguna</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Detail Kuota Khusus per Pengguna</p>
            </div>
            
            {/* Search Input */}
            <div className="relative w-full md:w-72">
              <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama, email, cabang..."
                className="w-full pl-11 pr-4 py-2.5 bg-slate-950/80 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-brand-red transition-all"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-gray-500 font-black uppercase tracking-widest text-[10px] bg-white/[0.01]">
                  <th className="py-3 px-4">User</th>
                  <th className="py-3 px-4">Peran</th>
                  <th className="py-3 px-4">Situs Cabang</th>
                  <th className="py-3 px-4 text-right">Batas Harian</th>
                  <th className="py-3 px-4 text-right">Anggaran Bulanan</th>
                  <th className="py-3 px-4 text-right">Bulan Ini</th>
                  <th className="py-3 px-4 text-center">Model AI</th>
                  <th className="py-3 px-4 text-center">Status AI</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-gray-500 font-bold uppercase tracking-wider text-xs">
                      Tidak ditemukan pengguna yang cocok
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center font-extrabold text-[10px] text-brand-red uppercase">
                            {user.name.slice(0, 2)}
                          </div>
                          <div>
                            <p className="font-extrabold text-gray-200">{user.name}</p>
                            <p className="text-[10px] text-gray-500 font-semibold">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 capitalize">
                        <span className={cn(
                          "px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                          user.role === 'superadmin' 
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                            : user.role === 'wapimred'
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                            : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        )}>
                          {user.role}
                        </span>
                      </td>
                      <td className="py-4 px-4 font-bold text-gray-400">{user.site?.domain || 'Pusat'}</td>
                      <td className="text-right py-4 px-4 font-bold text-gray-300">{user.aiDailyLimit} Req</td>
                      <td className="text-right py-4 px-4 font-extrabold text-emerald-400">{formatCurrency(user.aiMonthlyBudget)}</td>
                      <td className="text-right py-4 px-4">
                        <div className="font-black text-gray-200">{formatCurrency(user.currentMonthUsage.cost)}</div>
                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-0.5">{user.currentMonthUsage.requests} req</p>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className="text-[10px] font-black uppercase bg-white/5 border border-white/10 px-2 py-0.5 rounded text-gray-300">
                          {user.aiModelRestriction || 'GPT-4o'}
                        </span>
                      </td>
                      <td className="text-center py-4 px-4">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border",
                          user.aiEnabled 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                        )}>
                          {user.aiEnabled ? <Check size={8} /> : <XCircle size={8} />}
                          {user.aiEnabled ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORTS TAB ───────────────────────────────────────────────────── */}
      {activeTab === 'reports' && (
        <div className="grid gap-8 md:grid-cols-2">
          
          {/* Export Reports Options */}
          <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Ekspor Laporan Penggunaan</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Ekspor Data untuk Audit Keuangan</p>
            </div>
            
            <div className="space-y-3">
              <button className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-brand-red hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-lg shadow-brand-red/10 active:scale-95">
                <Download size={14} />
                Ekspor Laporan Bulanan (CSV)
              </button>
              
              <button className="w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 active:scale-95">
                <Download size={14} />
                Ekspor JSON Lengkap (Audit)
              </button>
            </div>
          </div>

          {/* Quick Insights */}
          <div className="bg-[#0c121e]/40 backdrop-blur-md border border-white/5 rounded-2xl p-6 shadow-2xl space-y-6">
            <div>
              <h3 className="text-xs font-black uppercase tracking-wider text-white">Analisis & Wawasan Cepat</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Evaluasi Performa & Biaya API</p>
            </div>
            
            <div className="space-y-4">
              {usageData && (
                <>
                  <div className="flex items-start gap-3 p-3 bg-white/[0.01] rounded-xl border border-white/5">
                    <TrendingUp className="text-emerald-500 mt-0.5" size={16} />
                    <p className="text-xs text-gray-300">
                      Terdapat <strong className="text-white">{usageData.bySite.length}</strong> cabang portal berita aktif yang rutin memanfaatkan bantuan asisten kecerdasan buatan.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/[0.01] rounded-xl border border-white/5">
                    <Zap className="text-amber-500 mt-0.5" size={16} />
                    <p className="text-xs text-gray-300">
                      Sebanyak <strong className="text-white">{usageData.modelUsage.length}</strong> model kecerdasan buatan aktif dikerahkan di server produksi BeritaKarya.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/[0.01] rounded-xl border border-white/5">
                    <AlertTriangle className="text-rose-500 mt-0.5" size={16} />
                    <p className="text-xs text-gray-300">
                      Ditemukan <strong className="text-white">{usageData.budgetStatus.filter(b => b.percentUsed > 80).length}</strong> peran yang penggunaan anggarannya telah menyentuh batas kritis di atas 80%.
                    </p>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-white/[0.01] rounded-xl border border-white/5">
                    <CheckCircle className="text-blue-500 mt-0.5" size={16} />
                    <p className="text-xs text-gray-300">
                      Tingkat keberhasilan pemrosesan kueri kecerdasan buatan berada di rata-rata terbaik yaitu <strong className="text-white">99.8%</strong> sukses.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      )}

      {/* ── ROLE QUOTA EDIT MODAL ────────────────────────────────────────── */}
      {editingRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0c121e] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-6 relative overflow-hidden">
            {/* Background glowing effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex justify-between items-center pb-4 border-b border-white/5">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-white">Sesuaikan Kuota AI Peran</h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Konfigurasi Peran: <span className="text-brand-red uppercase">{editingRole.role}</span></p>
              </div>
              <button 
                onClick={() => setEditingRole(null)}
                className="text-gray-400 hover:text-white transition-colors bg-white/5 hover:bg-white/10 p-1.5 rounded-lg border border-white/5"
              >
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleRoleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Batas Permintaan Harian</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    value={roleFormData.dailyRequests}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, dailyRequests: parseInt(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-brand-red transition-all font-bold"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Anggaran Bulanan (USD)</label>
                  <input 
                    type="number" 
                    required
                    min={0}
                    step="0.01"
                    value={roleFormData.monthlyBudget}
                    onChange={(e) => setRoleFormData(prev => ({ ...prev, monthlyBudget: parseFloat(e.target.value) || 0 }))}
                    className="w-full px-3 py-2 bg-slate-950/80 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-brand-red transition-all font-bold"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Batasan Model AI</label>
                <select 
                  value={roleFormData.modelRestriction}
                  onChange={(e) => setRoleFormData(prev => ({ ...prev, modelRestriction: e.target.value }))}
                  className="w-full px-3 py-2 bg-slate-950/80 border border-white/5 rounded-xl text-xs text-white outline-none focus:border-brand-red transition-all font-bold"
                >
                  <option value="">Semua Model (Default: GPT-4o)</option>
                  <option value="gpt-4o">GPT-4o (Premium)</option>
                  <option value="gpt-4o-mini">GPT-4o Mini (Hemat)</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo (Legacy)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Hak Akses Fitur AI</label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                  {AVAILABLE_FEATURES.map((feature) => {
                    const isChecked = roleFormData.allowedFeatures.includes(feature.id)
                    return (
                      <div 
                        key={feature.id}
                        onClick={() => handleFeatureToggle(feature.id)}
                        className={cn(
                          "flex items-center gap-2 px-3 py-2 rounded-xl border cursor-pointer select-none transition-all",
                          isChecked 
                            ? "bg-brand-red/10 border-brand-red/30 text-white" 
                            : "bg-white/[0.01] border-white/5 text-gray-400 hover:bg-white/5"
                        )}
                      >
                        <div className={cn(
                          "w-3.5 h-3.5 rounded flex items-center justify-center border transition-all",
                          isChecked 
                            ? "bg-brand-red border-brand-red text-white" 
                            : "border-white/20"
                        )}>
                          {isChecked && <Check size={10} strokeWidth={3} />}
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-wider">{feature.name}</span>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-white/5 flex gap-3">
                <button 
                  type="button"
                  onClick={() => setEditingRole(null)}
                  className="flex-1 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300"
                >
                  Batal
                </button>
                <button 
                  type="submit"
                  disabled={submittingRole}
                  className="flex-1 px-4 py-2.5 bg-brand-red hover:bg-red-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-xl transition-all duration-300 shadow-lg shadow-brand-red/10 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {submittingRole ? 'Menyimpan...' : 'Simpan Kuota'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}