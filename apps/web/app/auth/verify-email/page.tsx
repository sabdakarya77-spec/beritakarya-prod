'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, AlertCircle, CheckCircle, Mail } from 'lucide-react';

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const email = searchParams.get('email');

  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resend'>('loading');
  const [message, setMessage] = useState('');
  const [resendEmail, setResendEmail] = useState(email || '');
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Link verifikasi tidak valid. Token atau email tidak ditemukan.');
      return;
    }

    const verify = async () => {
      try {
        const response = await fetch('/api/v1/auth/verify-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, token }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || data.message || 'Verifikasi gagal');
        }

        setStatus('success');
        setMessage(data.message || 'Email berhasil diverifikasi!');
      } catch (err: unknown) {
        setStatus('error');
        setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      }
    };

    verify();
  }, [token, email]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsResending(true);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resendEmail }),
      });

      // Safely parse response — may be HTML if proxy/server error
      let data: Record<string, unknown> = {};
      try {
        data = await response.json();
      } catch {
        // Response is not JSON (e.g., HTML error page)
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
        throw new Error(data.message as string || 'Gagal mengirim email verifikasi. Silakan coba lagi nanti.');
      }

      setResendSuccess(true);
    } catch (err: unknown) {
      setMessage(err instanceof Error ? err.message : 'Terjadi kesalahan.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex flex-col justify-center items-center p-4">
      <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-brand-red/5 to-transparent pointer-events-none" />

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block group">
            <h1 className="font-serif text-3xl md:text-4xl font-black tracking-[-0.04em] leading-none text-brand-black dark:text-white">
              <span className="text-brand-red group-hover:text-brand-red/90 transition-colors">BERITA</span>
              <span className="group-hover:opacity-90 transition-opacity">KARYA</span>
            </h1>
          </Link>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 p-6 sm:p-8 shadow-2xl shadow-black/5 rounded-2xl">
          {status === 'loading' && (
            <div className="text-center py-8">
              <Loader2 size={32} className="text-brand-red animate-spin mx-auto mb-4" />
              <p className="text-sm text-brand-text-muted font-bold">Memverifikasi email Anda...</p>
            </div>
          )}

          {status === 'success' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={28} className="text-green-600 dark:text-green-400" />
              </div>
              <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">
                Email Terverifikasi!
              </h2>
              <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mb-6">
                {message}
              </p>
              <Link
                href="/login"
                className="inline-flex items-center gap-2 px-6 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all rounded-xl shadow-lg shadow-brand-red/20"
              >
                Login Sekarang
                <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {status === 'error' && (
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={28} className="text-brand-red" />
              </div>
              <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">
                Verifikasi Gagal
              </h2>
              <p className="text-xs text-brand-red font-bold mb-6">{message}</p>

              <div className="border-t border-gray-100 dark:border-slate-800 pt-6">
                <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mb-4">
                  Kirim ulang email verifikasi
                </p>

                {resendSuccess ? (
                  <div className="p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-sm">
                    <p className="text-xs font-bold text-green-700 dark:text-green-400">
                      Email verifikasi telah dikirim! Silakan cek inbox Anda.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="space-y-3">
                    <input
                      type="email"
                      value={resendEmail}
                      onChange={(e) => setResendEmail(e.target.value)}
                      required
                      placeholder="nama@beritakarya.co"
                      className="w-full px-3 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-sm text-brand-black dark:text-white focus:outline-none focus:border-brand-red dark:focus:border-brand-red transition-colors rounded-xl"
                    />
                    <button
                      type="submit"
                      disabled={isResending || !resendEmail}
                      className="w-full flex justify-center items-center gap-2 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-brand-black transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl group shadow-lg shadow-brand-red/20"
                    >
                      {isResending ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Mengirim...
                        </>
                      ) : (
                        <>
                          <Mail size={16} />
                          Kirim Ulang
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

              <div className="mt-6 text-center border-t border-gray-100 dark:border-slate-800 pt-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm font-bold text-brand-red hover:text-brand-black dark:hover:text-white transition-colors"
                >
                  <ArrowRight size={16} className="-translate-x-1" />
                  Kembali ke halaman login
                </Link>
              </div>
            </div>
          )}
        </div>

        <p suppressHydrationWarning className="text-center text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-6">
          &copy; {new Date().getFullYear()} BeritaKarya Nusantara
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex justify-center items-center">
        <Loader2 size={24} className="text-brand-red animate-spin" />
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  );
}
