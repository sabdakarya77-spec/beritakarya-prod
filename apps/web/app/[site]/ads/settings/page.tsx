'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  User,
  Mail,
  Shield,
  Key,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { ROLE_LABELS } from '../../../../lib/constants';

export default function AdsSettingsPage() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    setSaveError('');
    setSaveSuccess(false);
    try {
      await api.put('/auth/profile', { name: name.trim() });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setSaveError(msg || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError('Konfirmasi password tidak cocok');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password minimal 6 karakter');
      return;
    }
    setChangingPassword(true);
    setPasswordError('');
    setPasswordSuccess(false);
    try {
      await api.put('/auth/change-password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: { message?: string } } } })?.response?.data?.error?.message;
      setPasswordError(msg || 'Gagal mengubah password');
    } finally {
      setChangingPassword(false);
    }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Pengaturan</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Kelola profil dan keamanan akun Anda</p>
      </div>

      {/* Profile Card */}
      <div className="dash-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
            <User size={18} className="text-brand-red" />
          </div>
          <div>
            <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Profil</h2>
            <p className="text-[10px] text-gray-400">Informasi dasar akun Anda</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Email</span>
            <div className="flex items-center gap-2">
              <Mail size={12} className="text-gray-400" />
              <span className="text-xs font-semibold text-brand-black dark:text-white">{user.email}</span>
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-white/[0.03] rounded-xl">
            <span className="text-[8px] text-gray-400 font-bold uppercase tracking-widest block mb-1">Role</span>
            <div className="flex items-center gap-2">
              <Shield size={12} className="text-brand-red" />
              <span className="text-xs font-black text-brand-red uppercase">{ROLE_LABELS[user.role] || user.role}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-red-500 text-xs">
              <AlertCircle size={14} />
              <span>{saveError}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-500 text-xs">
              <CheckCircle2 size={14} />
              <span>Profil berhasil disimpan</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-2"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Simpan
            </button>
          </div>
        </form>
      </div>

      {/* Password Card */}
      <div className="dash-card p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-red/10 flex items-center justify-center">
            <Key size={18} className="text-brand-red" />
          </div>
          <div>
            <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Ubah Password</h2>
            <p className="text-[10px] text-gray-400">Perbarui password akun Anda</p>
          </div>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Password Saat Ini</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black dark:hover:text-white">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-4 py-3 pr-10 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black dark:hover:text-white">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 block mb-1">Konfirmasi Password Baru</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 text-red-500 text-xs">
              <AlertCircle size={14} />
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 text-emerald-500 text-xs">
              <CheckCircle2 size={14} />
              <span>Password berhasil diubah</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="px-5 py-2.5 bg-brand-red hover:bg-red-700 text-white text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40 disabled:cursor-not-allowed rounded-xl flex items-center gap-2"
            >
              {changingPassword ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
              Ubah Password
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
