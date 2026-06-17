'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, 
  Mail, 
  Shield, 
  Key, 
  Eye, 
  EyeOff,
  Save,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Edit3,
  Lock
} from 'lucide-react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { api } from '../../../../lib/api';
import { useAuthStore } from '../../../../store/authStore';
import { cn } from '../../../../lib/utils';

const BIO_MIN_LENGTH = 80;
const BIO_MAX_LENGTH = 180;

interface ProfileData {
  name: string;
  email: string;
  role: string;
  bio: string | null;
  isVerified: boolean;
}

export default function ProfilePage() {
  const params = useParams();
  const siteId = params.site as string;
  const { user } = useAuthStore();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  
  // Profile state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [_email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [isVerified, setIsVerified] = useState(false);
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // Messages
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const bioLength = bio.trim().length;
  const isBioTooShort = bioLength > 0 && bioLength < BIO_MIN_LENGTH;
  const isBioTooLong = bio.length > BIO_MAX_LENGTH;

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        // Fetch profile data from API
        const response = await api.get('/users/profile');
        if (response.data.success) {
          const profileData: ProfileData = response.data.data;
          setName(profileData.name || '');
          setBio(profileData.bio || '');
          setEmail(profileData.email || user.email || '');
          setRole(profileData.role || user.role || '');
          setIsVerified(profileData.isVerified ?? user.isVerified ?? false);
        }
      } catch (_err) {
        // Fallback to user data from auth store
        setName(user.name || '');
        setEmail(user.email || '');
        setRole(user.role || '');
        setIsVerified(user.isVerified ?? false);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedBio = bio.trim();

    if (trimmedBio.length > 0 && trimmedBio.length < BIO_MIN_LENGTH) {
      setProfileMessage({ type: 'error', text: `Bio minimal ${BIO_MIN_LENGTH} karakter` });
      return;
    }

    if (trimmedBio.length > BIO_MAX_LENGTH) {
      setProfileMessage({ type: 'error', text: `Bio maksimal ${BIO_MAX_LENGTH} karakter` });
      return;
    }

    setSaving(true);
    setProfileMessage(null);

    try {
      const response = await api.put('/users/profile', {
        name: name.trim(),
        bio: trimmedBio || null
      });

      if (response.data.success) {
        setProfileMessage({ type: 'success', text: 'Profil berhasil disimpan' });
      }
    } catch (err: unknown) {
      setProfileMessage({ type: 'error', text: (axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) ?? 'Gagal menyimpan profil' });
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password baru minimal 6 karakter' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok' });
      return;
    }

    setChangingPassword(true);

    try {
      const response = await api.post('/auth/change-password', {
        currentPassword,
        newPassword
      });

      if (response.data.success) {
        setPasswordMessage({ type: 'success', text: 'Password berhasil diubah' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      }
    } catch (err: unknown) {
      setPasswordMessage({ type: 'error', text: (axios.isAxiosError(err) ? err.response?.data?.error?.message : undefined) ?? 'Gagal mengubah password' });
    } finally {
      setChangingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-brand-red" />
      </div>
    );
  }

  const roleLabel = role ? role.charAt(0).toUpperCase() + role.slice(1).replace(/([A-Z])/g, ' $1') : 'User';

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-3">
          <User className="w-7 h-7 text-brand-red" />
          Profil Saya
        </h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2">
          Kelola informasi profil dan pengaturan akun Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Profile Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
              <Edit3 className="w-4 h-4" />
              Informasi Profil
            </h2>

            {/* Static Info */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="space-y-1">
                <label htmlFor="profile-display-email" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Email</label>
                <div id="profile-display-email" className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {user?.email || '-'}
                </div>
              </div>
              <div className="space-y-1">
                <label htmlFor="profile-display-role" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Role</label>
                <div id="profile-display-role" className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
                  <Shield className="w-4 h-4 text-slate-400" />
                  {roleLabel}
                </div>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mb-6">
              <label htmlFor="profile-display-verification" className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Status Verifikasi</label>
              {isVerified ? (
                <div id="profile-display-verification" className="inline-flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 rounded-full text-xs font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                  Terverifikasi
                </div>
              ) : (
                <div id="profile-display-verification" className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded-full text-xs font-bold">
                  <AlertCircle className="w-4 h-4" />
                  Belum Terverifikasi
                </div>
              )}
            </div>

            {/* Edit Form */}
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-name" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Lengkap</label>
                <input
                  id="profile-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:border-brand-red/30 transition-colors"
                  placeholder="Masukkan nama lengkap"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="profile-bio" className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex justify-between items-center">
                  <span>Bio Publik (yang tampil di profil penulis)</span>
                  <span className={cn(
                    "font-bold tabular-nums",
                    isBioTooShort || isBioTooLong ? "text-amber-500" : "text-slate-400"
                  )}>
                    {bio.length}/{BIO_MAX_LENGTH}
                  </span>
                </label>
                <textarea
                  id="profile-bio"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={BIO_MAX_LENGTH}
                  placeholder="Contoh: Penulis BeritaKarya yang berfokus pada isu publik dan sosial..."
                  className={cn(
                    "w-full h-28 bg-slate-50 dark:bg-slate-950 border rounded-xl p-4 outline-none transition-colors text-sm resize-none",
                    isBioTooShort || isBioTooLong
                      ? "border-amber-300 dark:border-amber-700 focus:border-amber-400"
                      : "border-slate-200 dark:border-slate-800 focus:border-brand-red/30"
                  )}
                />
                <p className={cn(
                  "text-[10px]",
                  isBioTooShort || isBioTooLong ? "text-amber-500" : "text-slate-400"
                )}>
                  Minimal {BIO_MIN_LENGTH} karakter untuk profil publik
                </p>
              </div>

              {profileMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl flex items-center gap-2 text-xs font-bold",
                    profileMessage.type === 'success' 
                      ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                  )}
                >
                  {profileMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {profileMessage.text}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={saving}
                className={cn(
                  "w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                  saving 
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-brand-red text-white shadow-lg shadow-brand-red/20 hover:scale-[1.01] active:scale-[0.99]"
                )}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Perubahan
                  </>
                )}
              </button>
            </form>
          </motion.div>

          {/* Change Password */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm"
          >
            <h2 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-6 flex items-center gap-2">
              <Key className="w-4 h-4" />
              Ubah Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="profile-current-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password Saat Ini</label>
                <div className="relative">
                  <input
                    id="profile-current-password"
                    type={showPasswords ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-2.5 pr-10 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:border-brand-red/30 transition-colors"
                    placeholder="Masukkan password saat ini"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  >
                    {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label htmlFor="profile-new-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Password Baru</label>
                  <input
                    id="profile-new-password"
                    type={showPasswords ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:border-brand-red/30 transition-colors"
                    placeholder="Minimal 6 karakter"
                  />
                </div>
                <div className="space-y-1.5">
                  <label htmlFor="profile-confirm-password" className="text-[10px] font-black uppercase tracking-widest text-slate-400">Konfirmasi</label>
                  <input
                    id="profile-confirm-password"
                    type={showPasswords ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm text-slate-700 dark:text-white focus:outline-none focus:border-brand-red/30 transition-colors"
                    placeholder="Ulangi password baru"
                  />
                </div>
              </div>

              {passwordMessage && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-xl flex items-center gap-2 text-xs font-bold",
                    passwordMessage.type === 'success' 
                      ? "bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800"
                      : "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800"
                  )}
                >
                  {passwordMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  {passwordMessage.text}
                </motion.div>
              )}

              <button
                type="submit"
                disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
                className={cn(
                  "w-full py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all flex items-center justify-center gap-2",
                  changingPassword || !currentPassword || !newPassword || !confirmPassword
                    ? "bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : "bg-slate-900 dark:bg-slate-800 text-white hover:bg-slate-800 dark:hover:bg-slate-700"
                )}
              >
                {changingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Mengubah...
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    Ubah Password
                  </>
                )}
              </button>
            </form>
          </motion.div>
        </div>

        {/* Right Column - Quick Actions */}
        <div className="space-y-6">
          {/* View Public Profile */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-brand-red to-red-700 rounded-2xl p-6 text-white shadow-xl"
          >
            <h3 className="text-sm font-black uppercase tracking-widest opacity-80 mb-4">Profil Publik</h3>
            <p className="text-[11px] leading-relaxed opacity-70 mb-6">
              Lihat bagaimana profil Anda tampil di halaman penulis BeritaKarya.
            </p>
            <Link 
              href={user?.id ? `/${siteId}/penulis/${user.id}` : '#'}
              className="flex items-center justify-center gap-2 w-full py-3 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl font-black uppercase tracking-widest text-xs transition-all"
            >
              <ExternalLink className="w-4 h-4" />
              Lihat Profil Saya
            </Link>
          </motion.div>

          {/* Tips */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800"
          >
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-4">Tips Profil</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                Gunakan nama lengkap yang mudah dikenali pembaca.
              </li>
              <li className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                Bio yang menarik meningkatkan kredibilitas Anda.
              </li>
              <li className="flex items-start gap-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-brand-red flex-shrink-0 mt-0.5" />
                Minimal 80 karakter untuk profil publik.
              </li>
            </ul>
          </motion.div>
        </div>
      </div>
    </div>
  );
}