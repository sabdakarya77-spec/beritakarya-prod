import { ArrowRight, Mail } from 'lucide-react'
import { SiTelegram, SiWhatsapp } from '../../../ui/SocialIcons'

interface AksesRedaksiProps {
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
  siteName?: string
}

export function AksesRedaksi({ whatsappUrl, telegramUrl, reportUrl, siteName }: AksesRedaksiProps) {
  return (
    <section className="my-8 border-t border-b border-black/5 py-8 dark:border-white/5">
      <div className="mb-5 text-center">
        <h3 className="text-[10px] font-black uppercase tracking-[0.16em] text-brand-red">
          Akses Redaksi
        </h3>
        <p className="mt-2 text-lg font-sans font-bold text-brand-black dark:text-white">
          Pilih jalur tercepat ke redaksi{siteName ? ` ${siteName}` : ''}.
        </p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* WhatsApp */}
        {whatsappUrl && (
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-5 transition-colors hover:bg-emerald-500/10 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/15">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-400/10 dark:text-emerald-300">
              <SiWhatsapp size={20} />
            </span>
            <div className="flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-emerald-600 dark:text-emerald-300/90">WhatsApp</span>
              <span className="mt-0.5 block text-sm font-bold text-brand-black dark:text-white">Chat Redaksi</span>
            </div>
            <ArrowRight size={16} className="shrink-0 text-emerald-600 dark:text-emerald-300 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}

        {/* Telegram */}
        {telegramUrl && (
          <a href={telegramUrl} target="_blank" rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-sky-400/20 bg-sky-400/5 p-5 transition-colors hover:bg-sky-400/10 dark:border-sky-400/20 dark:bg-sky-400/10 dark:hover:bg-sky-400/15">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-400/10 text-sky-600 dark:bg-sky-300/10 dark:text-sky-200">
              <SiTelegram size={20} />
            </span>
            <div className="flex-1">
              <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-sky-600 dark:text-sky-200/90">Telegram</span>
              <span className="mt-0.5 block text-sm font-bold text-brand-black dark:text-white">Ikuti Kanal</span>
            </div>
            <ArrowRight size={16} className="shrink-0 text-sky-600 dark:text-sky-200 transition-transform group-hover:translate-x-0.5" />
          </a>
        )}

        {/* Email */}
        <a href={reportUrl}
          className="group flex items-center gap-4 rounded-2xl border border-black/5 bg-black/5 p-5 transition-colors hover:bg-black/10 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10">
          <span className="flex h-12 w-12 items-center justify-center rounded-xl border border-black/10 bg-black/10 text-brand-black dark:border-white/10 dark:bg-white/10 dark:text-white">
            <Mail size={20} />
          </span>
          <div className="flex-1">
            <span className="block text-[10px] font-black uppercase tracking-[0.16em] text-brand-text-muted dark:text-white/75">Email</span>
            <span className="mt-0.5 block text-sm font-bold text-brand-black dark:text-white">Kirim Email</span>
          </div>
          <ArrowRight size={16} className="shrink-0 text-brand-black dark:text-white transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  )
}
