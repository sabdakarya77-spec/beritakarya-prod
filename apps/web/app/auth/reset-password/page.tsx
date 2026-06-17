'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, AlertCircle, CheckCircle, Key, Eye, EyeOff } from 'lucide-react';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const _router = useRouter();
  
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    const emailParam = searchParams.get('email');
    const tokenParam = searchParams.get('token');
    
    if (emailParam && tokenParam) {
      setEmail(emailParam);
      setToken(tokenParam);
      setIsValidating(false);
    } else {
      setError('Link reset password tidak valid. Silakan minta link baru.');
      setIsValidating(false);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (newPassword !== confirmPassword) {
      setError('Password baru dan konfirmasi password tidak cocok');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password minimal 6 karakter');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      setSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex flex-col justify-center items-center p-4">
        <Loader2 size={32} className="animate-spin text-brand-red" />
      </div>
    );
  }

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

        {/* Reset Password Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/5 rounded-2xl">
          {success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Password Berhasil Diubah!</h2>
              <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mb-6">
                Password Anda telah berhasil direset. Silakan masuk dengan password baru.
              </p>

              <Link 
                href="/login"
                className="inline-flex items-center justify-center gap-2 w-full py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all rounded-xl group shadow-lg shadow-brand-red/20"
              >
                Masuk dengan Password Baru
                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Key size={28} className="text-brand-red" />
                </div>
                <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Reset Password</h2>
                <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest">
                  Masukkan password baru untuk akun Anda
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-3 rounded-sm">
                  <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
                  <p className="text-xs font-bold text-brand-red tracking-tight">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="reset-password-new" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                    Password Baru
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password-new"
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      placeholder="Minimal 6 karakter"
                      minLength={6}
                      className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-black dark:hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="reset-password-confirm" className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                    Konfirmasi Password Baru
                  </label>
                  <div className="relative">
                    <input
                      id="reset-password-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (error) setError(null);
                      }}
                      required
                      placeholder="Masukkan ulang password baru"
                      minLength={6}
                      className="w-full px-3 py-2.5 pr-10 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-text-muted hover:text-brand-black dark:hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !newPassword || !confirmPassword}
                  className="w-full flex justify-center items-center gap-2 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl group shadow-lg shadow-brand-red/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      Simpan Password Baru
                      <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 text-center border-t border-gray-100 dark:border-slate-800 pt-4">
                <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest">
                  Ingat password?{' '}
                  <Link href="/login" className="text-brand-red hover:text-brand-black dark:hover:text-white transition-colors">
                    Masuk di sini
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
        
        <p className="text-center text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-6">
          &copy; {new Date().getFullYear()} BeritaKarya Nusantara
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex flex-col justify-center items-center p-4">
        <Loader2 size={32} className="animate-spin text-brand-red" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}