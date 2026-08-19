import { Mail } from 'lucide-react'
import { SiTelegram, SiWhatsapp } from '../../../ui/SocialIcons'

interface AksesRedaksiSidebarProps {
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
}

export function AksesRedaksiSidebar({ whatsappUrl, telegramUrl, reportUrl }: AksesRedaksiSidebarProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3.5 sm:p-5 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-3 sm:mb-4 flex items-center gap-2">
        <Mail size={14} className="text-brand-red" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
          Akses Redaksi
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 lg:grid-cols-1 lg:gap-2.5">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-emerald-500/15 bg-emerald-50/50 p-2.5 text-center text-brand-black transition-colors hover:bg-emerald-100/60 dark:border-emerald-500/20 dark:bg-emerald-500/5 dark:text-white dark:hover:bg-emerald-500/10 sm:flex-row sm:justify-start sm:gap-3.5 sm:p-3 sm:text-left lg:border-transparent lg:bg-transparent lg:p-3 lg:hover:bg-emerald-50 dark:lg:bg-transparent dark:lg:hover:bg-emerald-500/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 sm:h-10 sm:w-10">
              <SiWhatsapp size={18} />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-bold sm:text-sm">WhatsApp</span>
              <span className="hidden text-[11px] text-brand-text-muted sm:block">Chat Redaksi</span>
            </div>
          </a>
        )}
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-sky-500/15 bg-sky-50/50 p-2.5 text-center text-brand-black transition-colors hover:bg-sky-100/60 dark:border-sky-500/20 dark:bg-sky-500/5 dark:text-white dark:hover:bg-sky-500/10 sm:flex-row sm:justify-start sm:gap-3.5 sm:p-3 sm:text-left lg:border-transparent lg:bg-transparent lg:p-3 lg:hover:bg-sky-50 dark:lg:bg-transparent dark:lg:hover:bg-sky-500/10"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 sm:h-10 sm:w-10">
              <SiTelegram size={18} />
            </span>
            <div className="min-w-0">
              <span className="block text-xs font-bold sm:text-sm">Telegram</span>
              <span className="hidden text-[11px] text-brand-text-muted sm:block">Ikuti Kanal</span>
            </div>
          </a>
        )}
        <a
          href={reportUrl}
          className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-gray-200/60 bg-gray-50/70 p-2.5 text-center text-brand-black transition-colors hover:bg-gray-100/80 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 sm:flex-row sm:justify-start sm:gap-3.5 sm:p-3 sm:text-left lg:border-transparent lg:bg-transparent lg:p-3 lg:hover:bg-gray-50 dark:lg:bg-transparent dark:lg:hover:bg-white/5"
        >
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-200/60 text-gray-700 dark:bg-white/10 dark:text-white sm:h-10 sm:w-10">
            <Mail size={18} />
          </span>
          <div className="min-w-0">
            <span className="block text-xs font-bold sm:text-sm">Email</span>
            <span className="hidden text-[11px] text-brand-text-muted sm:block">Kirim Email</span>
          </div>
        </a>
      </div>
    </div>
  )
}
