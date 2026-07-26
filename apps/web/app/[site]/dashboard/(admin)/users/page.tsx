'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../../lib/api';
import { useToastStore } from '../../../../../store/toastStore';
import { useAuthStore } from '../../../../../store/authStore';
import { useRequireRole } from '../../../../../hooks/useRequireRole';
import axios from 'axios';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'superadmin' | 'wapimred' | 'kaperwil' | 'korwil' | 'kabiro' | 'reporter' | 'kontributor' | 'reader' | 'advertiser';
  avatarUrl?: string | null;
  siteId?: string | null;
  createdAt: string;
}

export default function UsersDashboard() {
  const { isAllowed } = useRequireRole(['superadmin', 'wapimred', 'kaperwil', 'korwil', 'kabiro']);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [error, setError] = useState<string | null>(null);
  const { addToast } = useToastStore();
  const { user: currentUser } = useAuthStore();
  const params = useParams();
  const siteId = (params.site as string) || 'pusat';

  const fetchUsers = async () => {
    setError(null);
    try {
      const queryParams: Record<string, string> = {};
      if (showAll) {
        queryParams.site = 'all';
      }
      const { data } = await api.get('/users', { params: queryParams });
      if (data.success) {
        setUsers(data.data);
      }
    } catch (err: unknown) {
      const msg = (axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal mengambil data pengguna';
      setError(msg);
      console.error('Gagal mengambil users', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSites = async () => {
    try {
      const { data } = await api.get('/sites');
      if (data.success) {
        setSites(data.data);
      }
    } catch (err) {
      console.error('Gagal mengambil data situs', err);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchSites();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fetchUsers/fetchSites deps (showAll) already tracked
  }, [showAll]);

  // Base scope filter based on current site vs showAll
  const siteScopedUsers = useMemo(() => {
    if (showAll) return users;
    return users.filter(u => !u.siteId || u.siteId === siteId || u.role === 'superadmin');
  }, [users, showAll, siteId]);

  // Combined search & role filter
  const filteredUsers = useMemo(() => {
    return siteScopedUsers.filter(u => {
      const matchesSearch = 
        !searchQuery.trim() ||
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = roleFilter === 'all' || u.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [siteScopedUsers, searchQuery, roleFilter]);

  if (!isAllowed) return null;

  const handleRoleChange = async (targetUser: User, newRole: string) => {
    if (window.confirm(`Ubah peran ${targetUser.name} menjadi ${getRoleLabel(newRole)}?`)) {
      try {
        await api.put(`/users/${targetUser.id}/role`, { role: newRole, siteId: targetUser.siteId });
        addToast(`Berhasil mengubah peran ${targetUser.name} menjadi ${getRoleLabel(newRole)}`, 'success');
        fetchUsers();
      } catch (err: unknown) {
        addToast((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal mengubah peran', 'error');
      }
    }
  };

  const handleSiteChange = async (targetUser: User, newSiteId: string | null) => {
    const siteName = newSiteId ? (sites.find(s => s.id === newSiteId)?.name || newSiteId) : 'Global / Pusat';
    if (window.confirm(`Ubah wilayah penugasan ${targetUser.name} menjadi ${siteName}?`)) {
      try {
        await api.put(`/users/${targetUser.id}/role`, { role: targetUser.role, siteId: newSiteId });
        addToast(`Berhasil memindahkan wilayah ${targetUser.name} ke ${siteName}`, 'success');
        fetchUsers();
      } catch (err: unknown) {
        addToast((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal memindahkan wilayah', 'error');
      }
    }
  };

  const handleDeleteUser = async (targetUser: User) => {
    if (window.confirm(`⚠️ PERINGATAN KESELAMATAN: Apakah Anda yakin ingin menghapus akun ${targetUser.name} (${targetUser.email}) secara permanen? Akun ini akan segera dinonaktifkan dari sistem BeritaKarya.`)) {
      try {
        await api.delete(`/users/${targetUser.id}`);
        addToast(`Berhasil menghapus akun ${targetUser.name}`, 'success');
        fetchUsers();
      } catch (err: unknown) {
        addToast((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal menghapus akun', 'error');
      }
    }
  };

  return (
    <div className="w-full space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-5 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Manajemen Pengguna
          </h1>
          <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400 mt-1 font-medium">
            Kelola akun pimpinan, pengelola wilayah, reporter, kontributor, dan tim redaksi
            {!showAll && <span className="text-brand-red font-bold"> di {siteId}</span>}
          </p>
        </div>

        {/* Superadmin Toggle */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm flex items-center justify-center gap-2 ${
              showAll 
                ? 'bg-purple-600 hover:bg-purple-700 text-white ring-2 ring-purple-500/30' 
                : 'bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
            }`}
          >
            <span>{showAll ? '🌐 Semua Situs' : '📍 Situs Ini'}</span>
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
        </div>
      )}

      {/* Stats Summary - Grid matching all requested roles including Kaperwil, Korwil, Kabiro */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-8 gap-3">
        {/* Total Users */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Users</p>
            <span className="w-2 h-2 rounded-full bg-gray-400"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white mt-1.5">
            {siteScopedUsers.length}
          </p>
        </div>

        {/* Superadmin */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Superadmin</p>
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-red-600 dark:text-red-400 mt-1.5">
            {siteScopedUsers.filter(u => u.role === 'superadmin').length}
          </p>
        </div>

        {/* Wapimred */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Wapimred</p>
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 mt-1.5">
            {siteScopedUsers.filter(u => u.role === 'wapimred').length}
          </p>
        </div>

        {/* Kaperwil */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kaperwil</p>
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400 mt-1.5">
            {siteScopedUsers.filter(u => u.role === 'kaperwil').length}
          </p>
        </div>

        {/* Korwil */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Korwil</p>
            <span className="w-2 h-2 rounded-full bg-cyan-500"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400 mt-1.5">
            {siteScopedUsers.filter(u => u.role === 'korwil').length}
          </p>
        </div>

        {/* Kabiro */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider">Kabiro</p>
            <span className="w-2 h-2 rounded-full bg-purple-500"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1.5">
            {siteScopedUsers.filter(u => u.role === 'kabiro').length}
          </p>
        </div>

        {/* Reporter / Kontributor */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Reporter / Kontrib</p>
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1.5">
            {siteScopedUsers.filter(u => u.role === 'reporter').length} <span className="text-xs font-normal text-gray-400">/</span> {siteScopedUsers.filter(u => u.role === 'kontributor').length}
          </p>
        </div>

        {/* Pembaca / Pengiklan */}
        <div className="bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl p-3.5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-[10px] sm:text-[11px] font-bold text-gray-500 uppercase tracking-wider truncate">Pembaca / Iklan</p>
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1.5">
            {siteScopedUsers.filter(u => u.role === 'reader').length} <span className="text-xs font-normal text-gray-400">/</span> {siteScopedUsers.filter(u => u.role === 'advertiser').length}
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 p-3.5 rounded-xl shadow-sm">
        <div className="relative flex-1 min-w-[220px]">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-gray-400 text-xs">
            🔍
          </span>
          <input
            type="text"
            placeholder="Cari pengguna berdasarkan nama, email, atau ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-8 py-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-red/30 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 whitespace-nowrap hidden sm:inline">Peran:</label>
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-auto text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 font-semibold text-gray-700 dark:text-gray-200 outline-none cursor-pointer focus:ring-2 focus:ring-brand-red/30 transition-all"
          >
            <option value="all">Semua Peran</option>
            <option value="superadmin">Superadmin</option>
            <option value="wapimred">Wapimred</option>
            <option value="kaperwil">Kaperwil</option>
            <option value="korwil">Korwil</option>
            <option value="kabiro">Kabiro</option>
            <option value="reporter">Reporter (Internal)</option>
            <option value="kontributor">Kontributor (Lepas)</option>
            <option value="advertiser">Pengiklan</option>
            <option value="reader">Pembaca</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-gray-100 dark:bg-gray-700/50 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-12 text-center shadow-sm">
          <div className="flex flex-col items-center gap-3 text-gray-400">
            <span className="text-5xl">👥</span>
            <span className="text-sm font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300">Pengguna Tidak Ditemukan</span>
            <p className="text-xs text-gray-500 max-w-sm">
              {searchQuery || roleFilter !== 'all' 
                ? 'Tidak ada pengguna yang cocok dengan kriteria pencarian atau filter yang dipilih.'
                : 'Belum ada pengguna terdaftar pada situs ini.'}
            </p>
            {(searchQuery || roleFilter !== 'all') && (
              <button
                onClick={() => { setSearchQuery(''); setRoleFilter('all'); }}
                className="mt-2 text-xs font-bold text-brand-red hover:underline"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* DESKTOP TABLE VIEW (Visible on md and up, full width, no horizontal scroll) */}
          <div className="hidden md:block bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl overflow-hidden shadow-sm">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-700/80 text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="px-5 py-4">Nama</th>
                  <th className="px-5 py-4">Email</th>
                  <th className="px-5 py-4">Peran</th>
                  <th className="px-5 py-4">Situs / Wilayah</th>
                  <th className="px-5 py-4">Bergabung</th>
                  <th className="px-5 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700/60">
                {filteredUsers.map(user => (
                  <tr key={user.id} className="hover:bg-gray-50/60 dark:hover:bg-white/[0.03] transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {user.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.name} className="w-9 h-9 rounded-full object-cover shadow-sm ring-1 ring-black/5" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[180px]" title={user.name}>
                            {user.name}
                          </p>
                          <p className="text-[10px] text-gray-400 font-mono">
                            ID: {user.id.slice(0, 8)}...
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <a 
                        href={`mailto:${user.email}`} 
                        className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium truncate block max-w-[200px]"
                        title={user.email}
                      >
                        {user.email}
                      </a>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {user.siteId ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                          {sites.find(s => s.id === user.siteId)?.name || user.siteId}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-gray-100 dark:bg-gray-700/60 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                          Global / Pusat
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap text-xs text-gray-500 dark:text-gray-400 font-medium">
                      {new Date(user.createdAt).toLocaleDateString('id-ID')}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Role select */}
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          className="text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-2.5 py-1 font-semibold outline-none cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-brand-red/30 transition-all"
                        >
                          <option value="reader">Pembaca</option>
                          <option value="reporter">Reporter (Internal)</option>
                          <option value="kontributor">Kontributor (Lepas)</option>
                          <option value="advertiser">Pengiklan</option>
                          <option value="kabiro">Kabiro</option>
                          <option value="korwil">Korwil</option>
                          <option value="kaperwil">Kaperwil</option>
                          <option value="wapimred">Wapimred</option>
                          <option value="superadmin">Superadmin</option>
                        </select>

                        {/* Branch select for superadmins */}
                        {currentUser?.role === 'superadmin' && (
                          <select
                            value={user.siteId || ''}
                            onChange={(e) => handleSiteChange(user, e.target.value || null)}
                            className="text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-2 py-1 font-semibold outline-none cursor-pointer hover:border-gray-300 focus:ring-2 focus:ring-brand-red/30 transition-all"
                          >
                            <option value="">Pusat</option>
                            {sites.map(s => (
                              <option key={s.id} value={s.id}>{s.name}</option>
                            ))}
                          </select>
                        )}

                        {currentUser?.id !== user.id && (
                          <button
                            onClick={() => handleDeleteUser(user)}
                            className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg px-2.5 py-1 font-bold transition-all shadow-2xs"
                          >
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

          {/* MOBILE CARD VIEW (Visible only on mobile, clean app-like design) */}
          <div className="block md:hidden space-y-3.5">
            {filteredUsers.map(user => (
              <div key={user.id} className="bg-white dark:bg-gray-800/90 border border-gray-200 dark:border-gray-700/80 rounded-2xl p-4 shadow-sm space-y-3">
                {/* User Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover shadow-sm ring-1 ring-black/5" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug">
                        {user.name}
                      </h3>
                      <a href={`mailto:${user.email}`} className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline block truncate max-w-[200px]">
                        {user.email}
                      </a>
                    </div>
                  </div>

                  <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border shrink-0 ${getRoleBadge(user.role)}`}>
                    {getRoleLabel(user.role)}
                  </span>
                </div>

                {/* Details Row */}
                <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700/60 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400 font-medium">Situs:</span>
                    {user.siteId ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/40">
                        {sites.find(s => s.id === user.siteId)?.name || user.siteId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                        Global / Pusat
                      </span>
                    )}
                  </div>
                  <span className="text-gray-400 text-[11px]">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>

                {/* Mobile Actions Bar */}
                <div className="pt-3 border-t border-gray-100 dark:border-gray-700/60 flex flex-col gap-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ubah Peran</label>
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user, e.target.value)}
                        className="w-full text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-2.5 py-2 font-semibold outline-none"
                      >
                        <option value="reader">Pembaca</option>
                        <option value="reporter">Reporter (Internal)</option>
                        <option value="kontributor">Kontributor (Lepas)</option>
                        <option value="advertiser">Pengiklan</option>
                        <option value="kabiro">Kabiro</option>
                        <option value="korwil">Korwil</option>
                        <option value="kaperwil">Kaperwil</option>
                        <option value="wapimred">Wapimred</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                    </div>

                    {currentUser?.role === 'superadmin' && (
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Ubah Situs</label>
                        <select
                          value={user.siteId || ''}
                          onChange={(e) => handleSiteChange(user, e.target.value || null)}
                          className="w-full text-xs bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 rounded-lg px-2.5 py-2 font-semibold outline-none"
                        >
                          <option value="">Pusat</option>
                          {sites.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  {currentUser?.id !== user.id && (
                    <button
                      onClick={() => handleDeleteUser(user)}
                      className="w-full mt-1 text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg py-2 font-bold transition-all"
                    >
                      Hapus Akun Pengguna
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Footer Counter */}
          <div className="px-5 py-3.5 bg-white dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/80 rounded-xl shadow-sm">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              Menampilkan {filteredUsers.length} dari {users.length} pengguna
              {showAll && <span className="text-purple-600 dark:text-purple-400"> (semua situs)</span>}
            </p>
          </div>
        </>
      )}
    </div>
  );
}