'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

export default function NewsletterForm() {
  const { site } = useParams() as { site: string }
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setStatus('loading')
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiUrl}/api/v1/newsletter/subscribe?site=${site}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      const json = await res.json()
      
      if (json.success) {
        setStatus('success')
        setMessage('Terima kasih! Email Anda telah terdaftar.')
        setEmail('')
      } else {
        setStatus('error')
        setMessage(json.error?.message || 'Gagal berlangganan. Coba lagi nanti.')
      }
    } catch (err) {
      setStatus('error')
      setMessage('Terjadi kesalahan koneksi.')
    }
  }

  if (status === 'success') {
    return (
      <div className="bg-green-500/10 border border-green-500/20 p-6 rounded-sm text-center animate-in zoom-in duration-300">
        <CheckCircle2 size={32} className="text-green-500 mx-auto mb-3" />
        <p className="text-xs font-bold text-green-500 uppercase tracking-widest">{message}</p>
      </div>
    )
  }

  return (
    <div className="bg-slate-900 dark:bg-black/40 border border-transparent dark:border-white/5 p-8 rounded-sm overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-brand-red/10 rounded-full -mr-12 -mt-12 blur-3xl" />
      <h4 className="text-white font-serif text-2xl font-bold mb-4 relative z-10">Dapatkan Berita Pilihan</h4>
      <p className="text-brand-text-muted text-xs mb-6 font-light leading-relaxed relative z-10">
        Laporan investigasi dan analisis tajam langsung di email Anda setiap pagi.
      </p>
      
      <form onSubmit={handleSubscribe} className="flex flex-col gap-3 relative z-10">
        <input 
          type="email" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Alamat Email Anda" 
          required
          disabled={status === 'loading'}
          className="bg-white/5 border border-white/10 px-4 py-3 text-xs text-white outline-none focus:border-brand-red transition-colors rounded-sm disabled:opacity-50"
        />
        <button 
          type="submit"
          disabled={status === 'loading'}
          className="bg-brand-red text-white py-3 text-[10px] font-black uppercase tracking-widest hover:bg-white hover:text-brand-black transition-all rounded-sm disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {status === 'loading' ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Mendaftarkan...
            </>
          ) : 'Berlangganan'}
        </button>
      </form>

      {status === 'error' && (
        <div className="mt-4 flex items-center gap-2 text-red-400 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">{message}</span>
        </div>
      )}
    </div>
  )
}
