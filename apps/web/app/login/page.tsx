'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Loader2, ArrowRight, AlertCircle, Eye, EyeOff, Mail, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [resendError, setResendError] = useState<string | null>(null);

  const { login, isLoading, error, errorCode, errorEmail, clearError, user } = useAuthStore();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      const targetSite = user.siteId || 'pusat';

      if (user.role === 'reader') {
        router.push(`/${targetSite}`);
      } else if (user.role === 'advertiser') {
        router.push(`/${targetSite}/ads`);
      } else {
        router.push(`/${targetSite}/dashboard`);
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
    setResendSuccess(false);

    try {
      await login(email, password);
    } catch (_err) {
      // Error is handled by the store
    }
  };

  const handleResendVerification = async () => {
    const targetEmail = errorEmail || email;
    setIsResending(true);
    setResendSuccess(false);
    setResendError(null);

    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: targetEmail }),
      });

      // Safely parse response — may be HTML if proxy/server error
      let data: Record<string, unknown> = {};
      try {
        data = await response.json();
      } catch {
        if (!response.ok) {
          throw new Error(`Server error (${response.status}). Pastikan API server berjalan.`);
        }
      }

      if (!response.ok) {
        const errorData = data as { error?: { message?: string }; message?: string };
        throw new Error(errorData.error?.message || errorData.message || 'Gagal mengirim email');
      }

      // Check if email was actually sent
      if (data.emailSent === false) {
        throw new Error(data.message as string || 'Gagal mengirim email verifikasi.');
      }

      setResendSuccess(true);
    } catch (err: unknown) {
      setResendError(err instanceof Error ? err.message : 'Gagal mengirim email.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex flex-col justify-center items-center p-4">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-red/5 to-transparent pointer-events-none" />
      
      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo Header */}
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-3xl md:text-4xl font-black tracking-[-0.04em] leading-none text-brand-black dark:text-white">
              <span className="text-brand-red group-hover:text-brand-red/90 transition-colors">BERITA</span>
              <span className="group-hover:opacity-90 transition-opacity">KARYA</span>
            </h1>
          </Link>
        </div>

        {/* Login Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/5 rounded-2xl">
          <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Masuk ke Portal</h2>
          <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mb-8">Silakan masukkan kredensial Anda</p>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-sm">
              <div className="flex items-start gap-3">
                <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-brand-red tracking-tight">{error}</p>
              </div>
              {errorCode === 'EMAIL_NOT_VERIFIED' && (
                <div className="mt-3 pt-3 border-t border-red-100 dark:border-red-500/20">
                  {resendSuccess ? (
                    <div className="flex items-center gap-2">
                      <CheckCircle size={14} className="text-green-600 dark:text-green-400" />
                      <p className="text-xs font-bold text-green-700 dark:text-green-400">
                        Email verifikasi telah dikirim!
                      </p>
                    </div>
                  ) : resendError ? (
                    <div className="space-y-2">
                      <p className="text-xs font-bold text-brand-red">{resendError}</p>
                      <button
                        onClick={handleResendVerification}
                        disabled={isResending}
                        className="flex items-center gap-2 text-xs font-bold text-brand-red hover:text-brand-black dark:hover:text-white transition-colors disabled:opacity-50"
                      >
                        {isResending ? (
                          <>
                            <Loader2 size={12} className="animate-spin" />
                            Mengirim...
                          </>
                        ) : (
                          <>
                            <Mail size={12} />
                            Coba lagi
                          </>
                        )}
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleResendVerification}
                      disabled={isResending}
                      className="flex items-center gap-2 text-xs font-bold text-brand-red hover:text-brand-black dark:hover:text-white transition-colors disabled:opacity-50"
                    >
                      {isResending ? (
                        <>
                          <Loader2 size={12} className="animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Mail size={12} />
                          Kirim ulang email verifikasi
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                Email
              </label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) clearError();
                }}
                required
                placeholder="nama@beritakarya.co"
                className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label htmlFor="login-password" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                  Kata Sandi
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-[9px] font-bold text-brand-red hover:text-brand-black dark:hover:text-white transition-colors uppercase tracking-wider"
                >
                  Lupa Password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) clearError();
                  }}
                  required
                  placeholder="••••••••"
                  className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-black dark:hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full flex justify-center items-center gap-2 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl group shadow-lg shadow-brand-red/20"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Memverifikasi...
                </>
              ) : (
                <>
                  Masuk
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center border-t border-gray-100 dark:border-slate-800 pt-4">
            <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest">
              Belum punya akun?{' '}
              <Link href="/register" rel="nofollow" className="text-brand-red hover:text-brand-black dark:hover:text-white transition-colors">
                Daftar di sini
              </Link>
            </p>
          </div>
        </div>
        
        <p suppressHydrationWarning className="text-center text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-6">
          &copy; {new Date().getFullYear()} BeritaKarya Nusantara
        </p>
      </div>
    </div>
  );
}
