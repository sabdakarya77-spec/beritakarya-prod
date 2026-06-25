'use client';

import { useState, useEffect } from 'react';
import {
  User,
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

export default function AdsSettingsPage() {
  const { user } = useAuthStore();

  // Profile
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Password
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
    <div className="max-w-lg mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-lg font-black text-brand-black dark:text-white uppercase tracking-tight">Pengaturan</h1>
        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Kelola akun Anda</p>
      </div>

      {/* Profile */}
      <div className="dash-card p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-red/10 flex items-center justify-center">
            <User size={16} className="text-brand-red" />
          </div>
          <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Profil</h2>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-3">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Nama</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {saveError && (
            <div className="flex items-center gap-2 text-red-500 text-[10px]">
              <AlertCircle size={12} />
              <span>{saveError}</span>
            </div>
          )}
          {saveSuccess && (
            <div className="flex items-center gap-2 text-emerald-500 text-[10px]">
              <CheckCircle2 size={12} />
              <span>Tersimpan</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving || !name.trim()}
              className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 rounded-lg flex items-center gap-2"
            >
              {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
              Simpan
            </button>
          </div>
        </form>
      </div>

      {/* Password */}
      <div className="dash-card p-5 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-red/10 flex items-center justify-center">
            <Key size={16} className="text-brand-red" />
          </div>
          <h2 className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">Ubah Password</h2>
        </div>

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Password Saat Ini</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 pr-9 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black dark:hover:text-white">
                {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Password Baru</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full px-3 py-2.5 pr-9 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-black dark:hover:text-white">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-[9px] font-black uppercase tracking-widest text-gray-400 block mb-1">Konfirmasi</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-3 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-xs text-brand-black dark:text-white focus:outline-none focus:border-brand-red transition-colors"
            />
          </div>

          {passwordError && (
            <div className="flex items-center gap-2 text-red-500 text-[10px]">
              <AlertCircle size={12} />
              <span>{passwordError}</span>
            </div>
          )}
          {passwordSuccess && (
            <div className="flex items-center gap-2 text-emerald-500 text-[10px]">
              <CheckCircle2 size={12} />
              <span>Password berhasil diubah</span>
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
              className="px-4 py-2 bg-brand-red hover:bg-red-700 text-white text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-40 rounded-lg flex items-center gap-2"
            >
              {changingPassword ? <Loader2 size={12} className="animate-spin" /> : <Key size={12} />}
              Ubah
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
