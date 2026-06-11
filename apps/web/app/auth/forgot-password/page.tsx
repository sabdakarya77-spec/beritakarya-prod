'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Loader2, ArrowRight, AlertCircle, CheckCircle, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Terjadi kesalahan');
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
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

        {/* Forgot Password Box */}
        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/5 rounded-2xl">
          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-brand-red" />
            </div>
            <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">Lupa Password?</h2>
            <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest">
              Masukkan email Anda untuk reset password
            </p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-3 rounded-sm">
                <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-brand-red tracking-tight">{error}</p>
            </div>
          )}

          {success ? (
            <div className="text-center">
              <div className="mb-6 p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 flex flex-col items-center gap-3 rounded-sm">
                <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Email Terkirim!</p>
                  <p className="text-xs text-green-600 dark:text-green-500">
                    Silakan cek inbox email Anda untuk link reset password.
                  </p>
                </div>
              </div>
              
              <p className="text-xs text-brand-text-muted mb-4">
                Tidak menerima email? Periksa folder spam atau{' '}
                <button 
                  onClick={() => {
                    setSuccess(false);
                    setEmail('');
                  }}
                  className="text-brand-red hover:text-brand-black dark:hover:text-white transition-colors font-bold"
                >
                  coba lagi
                </button>
              </p>

              <Link 
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:text-brand-black dark:hover:text-white transition-colors"
              >
                <ArrowRight size={16} className="-translate-x-1" />
                Kembali ke halaman login
              </Link>
            </div>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-black dark:text-gray-300">
                    Alamat Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError(null);
                    }}
                    required
                    placeholder="nama@beritakarya.co"
                    className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !email}
                  className="w-full flex justify-center items-center gap-2 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl group shadow-lg shadow-brand-red/20"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Mengirim...
                    </>
                  ) : (
                    <>
                      Kirim Link Reset
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