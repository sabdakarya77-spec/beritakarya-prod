import { Mail } from 'lucide-react'
import { SiTelegram, SiWhatsapp } from '../../../ui/SocialIcons'

interface AksesRedaksiSidebarProps {
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
}

export function AksesRedaksiSidebar({ whatsappUrl, telegramUrl, reportUrl }: AksesRedaksiSidebarProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-3 flex items-center gap-1.5">
        <Mail size={12} className="text-brand-red" />
        <span className="text-[9px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
          Akses Redaksi
        </span>
      </div>
      <div className="space-y-2">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-brand-black transition-colors hover:bg-emerald-50 dark:text-white dark:hover:bg-emerald-500/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <SiWhatsapp size={14} />
            </span>
            <span className="text-[11px] font-bold">WhatsApp</span>
          </a>
        )}
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-brand-black transition-colors hover:bg-sky-50 dark:text-white dark:hover:bg-sky-500/10"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <SiTelegram size={14} />
            </span>
            <span className="text-[11px] font-bold">Telegram</span>
          </a>
        )}
        <a
          href={reportUrl}
          className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-brand-black transition-colors hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white">
            <Mail size={14} />
          </span>
          <span className="text-[11px] font-bold">Email</span>
        </a>
      </div>
    </div>
  )
}
