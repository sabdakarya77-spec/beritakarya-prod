'use client'

import { useState } from 'react'
import { Check, Copy, ArrowUpRight } from 'lucide-react'
import { SiFacebook, SiWhatsapp, SiX } from 'react-icons/si'

type ArticleSharePanelProps = {
  title: string
  url: string
}

export default function ArticleSharePanel({ title, url }: ArticleSharePanelProps) {
  const [isCopied, setIsCopied] = useState(false)

  const shareItems = [
    {
      label: 'Facebook',
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      Icon: SiFacebook,
      iconClassName: 'text-[#1877F2]',
      hoverClassName: 'hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10',
    },
    {
      label: 'X',
      href: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      Icon: SiX,
      iconClassName: 'text-white',
      hoverClassName: 'hover:border-white/20 hover:bg-white/10',
    },
    {
      label: 'WhatsApp',
      href: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      Icon: SiWhatsapp,
      iconClassName: 'text-[#25D366]',
      hoverClassName: 'hover:border-[#25D366]/40 hover:bg-[#25D366]/10',
    },
  ]

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(url)
    setIsCopied(true)
    window.setTimeout(() => setIsCopied(false), 2000)
  }

  return (
    <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-brand-red/15 blur-3xl rounded-full" />
      <div className="relative">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-brand-red mb-8 border-b border-white/5 pb-3">
          Bagikan Post
        </h4>

        <div className="grid grid-cols-2 gap-3">
          {shareItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition-all ${item.hoverClassName}`}
            >
              <item.Icon className={`${item.iconClassName} text-base transition-transform group-hover:scale-110`} />
              <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90">{item.label}</span>
            </a>
          ))}

          <button
            type="button"
            onClick={copyToClipboard}
            className="group flex flex-col items-center gap-3 rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:border-brand-red/40 hover:bg-brand-red/10"
          >
            {isCopied ? (
              <Check size={18} className="text-brand-red transition-transform group-hover:scale-110" />
            ) : (
              <Copy size={18} className="text-white transition-transform group-hover:scale-110" />
            )}
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white/90">
              {isCopied ? 'Tersalin' : 'Copy Link'}
            </span>
          </button>
        </div>

        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex items-center gap-2 text-[11px] font-medium tracking-wide text-white/55 hover:text-white transition-colors"
        >
          Bagikan cepat
          <ArrowUpRight size={14} />
        </a>
      </div>
    </div>
  )
}
