'use client';

import { useState, useEffect } from 'react';
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
  const { isAllowed } = useRequireRole(['superadmin', 'wapimred', 'kaperwil']);
  const [users, setUsers] = useState<User[]>([]);
  const [sites, setSites] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
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

  if (!isAllowed) return null;

  const getRoleBadge = (role: string) => {
    const styles = {
      superadmin: 'bg-red-100 text-red-800 border-red-300',
      wapimred: 'bg-blue-100 text-blue-800 border-blue-300',
      kaperwil: 'bg-indigo-100 text-indigo-800 border-indigo-300',
      korwil: 'bg-cyan-100 text-cyan-800 border-cyan-300',
      kabiro: 'bg-purple-100 text-purple-800 border-purple-300',
      reporter: 'bg-green-100 text-green-800 border-green-300',
      kontributor: 'bg-teal-100 text-teal-800 border-teal-300',
      advertiser: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      reader: 'bg-gray-100 text-gray-800 border-gray-300'
    };
    return styles[role as keyof typeof styles] || styles.reader;
  };
  
  const getRoleLabel = (role: string) => {
    const labels = {
      superadmin: 'Superadmin',
      wapimred: 'Wapimred',
      kaperwil: 'Kaperwil',
      korwil: 'Korwil',
      kabiro: 'Kabiro',
      reporter: 'Reporter (Internal)',
      kontributor: 'Kontributor (Lepas)',
      advertiser: 'Pengiklan',
      reader: 'Pembaca'
    };
    return labels[role as keyof typeof labels] || role;
  };

  // Filter users based on role and current site
  const getVisibleUsers = () => {
    if (showAll) return users;
    // Allow users belonging to this site, global users (null siteId), or superadmins
    return users.filter(u => !u.siteId || u.siteId === siteId || u.role === 'superadmin');
  };

  const visibleUsers = getVisibleUsers();

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Manajemen Pengguna
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Kelola akun reporter, kontributor, dan tim redaksi
            {!showAll && <span className="text-red-600 font-semibold"> di {siteId}</span>}
          </p>
        </div>

        {/* Superadmin Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAll(!showAll)}
            className={`px-4 py-2 rounded-lg text-xs font-bold uppercase transition-all ${
              showAll 
                ? 'bg-purple-600 text-white' 
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
            }`}
          >
            {showAll ? '🌐 Semua Situs' : '📍 Situs Ini'}
          </button>
          
          {showAll && (
            <div className="text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg border border-purple-200 dark:border-purple-900/30">
              Melihat semua pengguna di semua situs. Hanya superadmin.
            </div>
          )}
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-700 dark:text-red-400">
          ⚠️ {error}
        </div>
      )}

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Total Users</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{visibleUsers.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Superadmin</p>
          <p className="text-2xl font-bold text-red-600 mt-1">
            {visibleUsers.filter(u => u.role === 'superadmin').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Wapimred</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {visibleUsers.filter(u => u.role === 'wapimred').length}
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4">
          <p className="text-xs text-gray-500 uppercase tracking-widest">Reporter / Kontributor</p>
          <p className="text-2xl font-bold text-green-600 mt-1">
            {visibleUsers.filter(u => u.role === 'reporter').length} / {visibleUsers.filter(u => u.role === 'kontributor').length}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-x-auto">
        <table className="w-full min-w-[800px]">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Nama
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Email
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Peran
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Situs
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">
                Bergabung
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-gray-500">
                Aksi
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              [...Array(5)].map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-6 py-4">
                    <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded animate-pulse" />
                  </td>
                </tr>
              ))
            ) : visibleUsers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center">
                  <div className="flex flex-col items-center gap-3 text-gray-400">
                    <span className="text-4xl">👥</span>
                    <span className="text-sm font-bold uppercase tracking-widest">Belum ada pengguna</span>
                    <p className="text-xs">Pengguna akan muncul setelah mereka register or di-invite.</p>
                  </div>
                </td>
              </tr>
            ) : (
              visibleUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-all">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-red to-red-900 flex items-center justify-center text-white text-sm font-bold">
                          {user.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <a href={`mailto:${user.email}`} className="text-sm text-blue-600 hover:underline">
                      {user.email}
                    </a>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadge(user.role)}`}>
                      {getRoleLabel(user.role)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {user.siteId ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-300">
                        {sites.find(s => s.id === user.siteId)?.name || user.siteId}
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-300">
                        Global / Pusat
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {new Date(user.createdAt).toLocaleDateString('id-ID')}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      {/* Role select */}
                      <select
                        value={user.role}
                        onChange={async (e) => {
                          const newRole = e.target.value;
                          if (window.confirm(`Ubah peran ${user.name} menjadi ${newRole}?`)) {
                            try {
                              await api.put(`/users/${user.id}/role`, { role: newRole, siteId: user.siteId });
                              addToast(`Berhasil mengubah peran ${user.name}`, 'success');
                              fetchUsers();
                            } catch (err: unknown) {
                              addToast((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal mengubah peran', 'error');
                            }
                          }
                        }}
                        className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 outline-none"
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
                          onChange={async (e) => {
                            const newSiteId = e.target.value || null;
                            const siteName = newSiteId ? (sites.find(s => s.id === newSiteId)?.name || newSiteId) : 'Global / Pusat';
                            if (window.confirm(`Ubah wilayah penugasan ${user.name} menjadi ${siteName}?`)) {
                              try {
                                await api.put(`/users/${user.id}/role`, { role: user.role, siteId: newSiteId });
                                addToast(`Berhasil memindahkan wilayah ${user.name} ke ${siteName}`, 'success');
                                fetchUsers();
                              } catch (err: unknown) {
                                addToast((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal memindahkan wilayah', 'error');
                              }
                            }
                          }}
                          className="text-xs bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1 outline-none font-medium"
                        >
                          <option value="">Global / Pusat</option>
                          {sites.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                        </select>
                      )}

                      {currentUser?.id !== user.id && (
                        <button
                          onClick={async () => {
                            if (window.confirm(`⚠️ PERINGATAN KESELAMATAN: Apakah Anda yakin ingin menghapus akun ${user.name} (${user.email}) secara permanen? Akun ini akan segera dinonaktifkan dari sistem BeritaKarya.`)) {
                              try {
                                await api.delete(`/users/${user.id}`);
                                addToast(`Berhasil menghapus akun ${user.name}`, 'success');
                                fetchUsers();
                              } catch (err: unknown) {
                                addToast((axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal menghapus akun', 'error');
                              }
                            }
                          }}
                          className="text-xs bg-red-50 hover:bg-red-100 dark:bg-red-950/20 dark:hover:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 rounded-lg px-2.5 py-1 font-semibold transition-colors"
                        >
                          Hapus
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
            Menampilkan {visibleUsers.length} dari {users.length} pengguna
            {showAll && <span className="text-purple-600 dark:text-purple-400"> (semua situs)</span>}
          </p>
        </div>
      </div>
    </div>
  );
}