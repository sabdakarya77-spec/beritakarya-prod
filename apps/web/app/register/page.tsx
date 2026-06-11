'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, AlertCircle, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  
  const { register, isLoading, error, clearError, user } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleParam = searchParams.get('role') || 'reader';
  const isAdvertiser = roleParam === 'advertiser';

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      // Get the site ID from cookies or default to 'pusat'
      const siteId = document.cookie
        .split('; ')
        .find(row => row.startsWith('siteId='))
        ?.split('=')[1] || 'pusat';
      
      if (user.role === 'advertiser') {
        router.push(`/${siteId}/dashboard`);
      } else {
        router.push(`/${siteId}`);
      }
    }
  }, [user, router]);

  // Clear error on unmount or when user starts typing
  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setLocalError(null);
    
    if (password !== confirmPassword) {
      setLocalError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    try {
      const siteId = document.cookie
        .split('; ')
        .find(row => row.startsWith('siteId='))
        ?.split('=')[1] || 'pusat';
      await register(name, email, password, siteId, roleParam);
    } catch (err) {
      // Error is handled by the store
    }
  };

  const displayError = localError || error;

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex flex-col justify-center items-center p-4">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-red/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in my-8">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-3xl md:text-4xl font-black tracking-[-0.04em] leading-none text-brand-black dark:text-white">
              <span className="text-brand-red group-hover:text-brand-red/90 transition-colors">BERITA</span>
              <span className="group-hover:opacity-90 transition-opacity">KARYA</span>
            </h1>
          </Link>
        </div>

        {/* Register Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/5 rounded-2xl">
          <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">
            {isAdvertiser ? 'Pendaftaran Mitra Pengiklan' : 'Buat Akun Baru'}
          </h2>
          <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mb-8">
            {isAdvertiser ? 'Daftar untuk pasang & kelola iklan mandiri Anda' : 'Daftar untuk mengakses portal penuh'}
          </p>

          {displayError && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-3 rounded-sm">
              <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
              <p className="text-xs font-bold text-brand-red tracking-tight">{displayError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                {isAdvertiser ? 'Nama Perusahaan / Brand / Personal' : 'Nama Lengkap'}
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (displayError) { clearError(); setLocalError(null); }
                }}
                required
                placeholder={isAdvertiser ? 'Contoh: PT Sukses Bersama' : 'Nama Anda'}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (displayError) { clearError(); setLocalError(null); }
                }}
                required
                placeholder={isAdvertiser ? 'email@perusahaan.com' : 'nama@beritakarya.co'}
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (displayError) { clearError(); setLocalError(null); }
                  }}
                  required
                  placeholder="Minimal 8 karakter"
                  className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-black dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              <p className="text-[9px] text-brand-text-muted font-medium leading-normal">
                * Minimal 8 karakter dengan huruf kapital, angka, & simbol
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Konfirmasi Kata Sandi
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    if (displayError) { clearError(); setLocalError(null); }
                  }}
                  required
                  placeholder="Ulangi kata sandi"
                  className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-black dark:hover:text-white transition-colors"
                >
                  {showConfirmPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !name || !email || !password || !confirmPassword}
              className="w-full flex justify-center items-center gap-2 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl group shadow-lg shadow-brand-red/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Mendaftarkan...
                </>
              ) : (
                <>
                  Daftar Sekarang
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center border-t border-gray-100 dark:border-slate-800 pt-4">
            <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest">
              Sudah punya akun?{' '}
              <Link href="/login" className="text-brand-red hover:text-brand-black dark:hover:text-white transition-colors">
                Masuk di sini
              </Link>
            </p>
          </div>
        </div>
        
        <p className="text-center text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-6">
          &copy; {new Date().getFullYear()} BeritaKarya Nusantara
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex justify-center items-center">
        <Loader2 size={24} className="text-brand-red animate-spin" />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  );
}
