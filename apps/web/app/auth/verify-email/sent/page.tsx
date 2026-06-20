'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowRight, Mail, CheckCircle, AlertCircle } from 'lucide-react';

function VerifyEmailSentContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setError(null);
    setResendSuccess(false);

    try {
      const response = await fetch('/api/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || data.message || 'Gagal mengirim email');
      }

      setResendSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
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
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail size={28} className="text-blue-600 dark:text-blue-400" />
            </div>

            <h2 className="text-xl font-serif font-black text-brand-black dark:text-white uppercase tracking-tight mb-2">
              Cek Email Anda
            </h2>

            <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mb-6">
              Kami telah mengirim link verifikasi ke
            </p>

            <div className="mb-6 p-4 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
              <p className="text-sm font-bold text-brand-black dark:text-white break-all">
                {email}
              </p>
            </div>

            <p className="text-xs text-brand-text-muted mb-6">
              Klik link di email untuk memverifikasi akun Anda. Link berlaku selama 24 jam.
            </p>

            {error && (
              <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-start gap-3 rounded-sm">
                <AlertCircle size={16} className="text-brand-red shrink-0 mt-0.5" />
                <p className="text-xs font-bold text-brand-red tracking-tight">{error}</p>
              </div>
            )}

            {resendSuccess ? (
              <div className="mb-4 p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 flex items-center gap-3 rounded-sm">
                <CheckCircle size={16} className="text-green-600 dark:text-green-400 shrink-0" />
                <p className="text-xs font-bold text-green-700 dark:text-green-400">
                  Email verifikasi baru telah dikirim!
                </p>
              </div>
            ) : (
              <button
                onClick={handleResend}
                disabled={isResending}
                className="w-full flex justify-center items-center gap-2 py-3 bg-gray-100 dark:bg-slate-800 text-brand-black dark:text-white text-[11px] font-black uppercase tracking-[0.2em] hover:bg-gray-200 dark:hover:bg-slate-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed rounded-xl mb-4"
              >
                {isResending ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Mengirim...
                  </>
                ) : (
                  <>
                    <Mail size={16} />
                    Kirim Ulang Email
                  </>
                )}
              </button>
            )}

            <div className="border-t border-gray-100 dark:border-slate-800 pt-4">
              <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest mb-3">
                Tidak menerima email?
              </p>
              <ul className="text-xs text-brand-text-muted text-left space-y-1.5 mb-4">
                <li>• Periksa folder <strong>Spam</strong> atau <strong>Promotions</strong></li>
                <li>• Pastikan email <strong>{email}</strong> benar</li>
                <li>• Tunggu beberapa menit lalu coba kirim ulang</li>
              </ul>
            </div>

            <div className="mt-4 text-center border-t border-gray-100 dark:border-slate-800 pt-4">
              <p className="text-xs text-brand-text-muted font-bold uppercase tracking-widest">
                Sudah verifikasi?{' '}
                <Link href="/login" className="text-brand-red hover:text-brand-black dark:hover:text-white transition-colors">
                  Login di sini
                </Link>
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-[10px] text-brand-text-muted font-bold uppercase tracking-widest mt-6">
          &copy; {new Date().getFullYear()} BeritaKarya Nusantara
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmailSentPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white dark:bg-[#0a0f1a] flex justify-center items-center">
        <Loader2 size={24} className="text-brand-red animate-spin" />
      </div>
    }>
      <VerifyEmailSentContent />
    </Suspense>
  );
}
