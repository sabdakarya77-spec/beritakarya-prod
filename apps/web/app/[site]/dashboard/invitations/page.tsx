'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { api } from '../../../../lib/api';
import { Mail, Plus, CheckCircle, Clock, XCircle, AlertCircle } from 'lucide-react';
import { useRequireRole } from '../../../../hooks/useRequireRole';
import axios from 'axios';

interface Invitation {
  id: string;
  email: string;
  token: string;
  role: string;
  siteId?: string | null;
  acceptedAt?: string | null;
  expiresAt: string;
  createdAt: string;
  invitedByUser: {
    name: string;
    email: string;
  };
}

export default function InvitationsDashboard() {
  const { isAllowed } = useRequireRole(['superadmin', 'wapimred']);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('reporter');
  const [siteScope, setSiteScope] = useState<'current' | 'global'>('current');
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  const params = useParams();
  const siteId = (params.site as string) || 'pusat';

  const fetchInvitations = async () => {
    try {
      const { data } = await api.get('/invitations', { params: { limit: 100 } });
      if (data.success) setInvitations(data.data);
    } catch (err: unknown) {
      console.error(err);
      setError('Gagal mengambil data undangan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [siteId]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitLoading(true);
    try {
      const payload = {
        email,
        role,
        siteId: siteScope === 'current' ? siteId : null
      };
      await api.post('/invitations', payload);
      setToast({ message: 'Undangan berhasil dikirim', type: 'success' });
      setEmail('');
      fetchInvitations();
    } catch (err: unknown) {
      setToast({
        message: (axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) || 'Gagal mengirim undangan',
        type: 'error'
      });
    } finally {
      setSubmitLoading(false);
    }
  };

  // Toast effect
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const getStatusBadge = (inv: Invitation) => {
    if (inv.acceptedAt) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800"><CheckCircle size={10} /> DITERIMA</span>;
    }
    if (new Date(inv.expiresAt) < new Date()) {
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-800"><XCircle size={10} /> KADALUARSA</span>;
    }
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800"><Clock size={10} /> MENUNGGU</span>;
  };

  if (!isAllowed) return null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {toast && (
        <div className={`fixed top-6 right-6 z-[100] px-5 py-4 rounded-xl shadow-2xl text-sm font-semibold transition-all animate-fade-in ${
          toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold">
          {error}
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Mail className="text-brand-red" /> Manajemen Undangan
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Undang pengguna baru ke platform BeritaKarya.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Add */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
            <h2 className="text-sm font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
              Kirim Undangan Baru
            </h2>
            <form onSubmit={handleInvite} className="space-y-5">
              <div>
                <label htmlFor="invitation-email" className="block text-sm font-medium mb-2">Email Penerima</label>
                <input
                  id="invitation-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="reporter@email.com"
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-red-500 transition-all"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="invitation-role" className="block text-sm font-medium mb-2">Peran (Role)</label>
                <select
                  id="invitation-role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg text-sm outline-none focus:border-red-500"
                >
                  <option value="reporter">Reporter (Internal)</option>
                  <option value="kontributor">Kontributor (Lepas)</option>
                  <option value="advertiser">Pengiklan</option>
                  <option value="wapimred">Wapimred</option>
                  <option value="reader">Pembaca</option>
                </select>
              </div>

              <div>
                <label htmlFor="invitation-scope" className="block text-sm font-medium mb-2">Cakupan Situs (Scope)</label>
                <div id="invitation-scope" className="flex gap-4">
                  <label htmlFor="invitation-scope-current" className="flex items-center gap-2">
                    <input
                      id="invitation-scope-current"
                      type="radio"
                      name="siteScope"
                      checked={siteScope === 'current'}
                      onChange={() => setSiteScope('current')}
                    />
                    <span className="text-sm">Hanya {siteId}</span>
                  </label>
                  <label htmlFor="invitation-scope-global" className="flex items-center gap-2">
                    <input
                      id="invitation-scope-global"
                      type="radio"
                      name="siteScope"
                      checked={siteScope === 'global'}
                      onChange={() => setSiteScope('global')}
                    />
                    <span className="text-sm">Global (Semua)</span>
                  </label>
                </div>
              </div>

              <button 
                type="submit" 
                disabled={submitLoading}
                className="w-full bg-brand-red hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2 mt-4"
              >
                {submitLoading ? 'Mengirim...' : <><Plus size={16} /> Kirim Undangan</>}
              </button>
            </form>
          </div>
        </div>

        {/* List Table */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Email & Status</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Role & Scope</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Dikirim Oleh</th>
                    <th className="px-6 py-4 text-left text-xs font-bold uppercase tracking-wider text-gray-500">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">Memuat data...</td>
                    </tr>
                  ) : invitations.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center gap-3 text-gray-400">
                          <AlertCircle size={32} />
                          <span className="text-sm font-bold uppercase tracking-widest">Belum ada undangan</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    invitations.map(inv => (
                      <tr key={inv.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="font-medium text-sm text-gray-900 dark:text-white">{inv.email}</div>
                          <div className="mt-1">{getStatusBadge(inv)}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-xs font-bold uppercase text-gray-700 dark:text-gray-300">{inv.role}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {inv.siteId ? `Situs: ${inv.siteId}` : 'Global'}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{inv.invitedByUser?.name}</div>
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-500">
                          {new Date(inv.createdAt).toLocaleDateString('id-ID')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
              <p className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Total: {invitations.length} Undangan
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
