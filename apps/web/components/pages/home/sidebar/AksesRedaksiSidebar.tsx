import { Mail } from 'lucide-react'
import { SiTelegram, SiWhatsapp } from '../../../ui/SocialIcons'

interface AksesRedaksiSidebarProps {
  whatsappUrl: string | null
  telegramUrl: string | null
  reportUrl: string
}

export function AksesRedaksiSidebar({ whatsappUrl, telegramUrl, reportUrl }: AksesRedaksiSidebarProps) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm dark:border-white/5 dark:bg-white/[0.02]">
      <div className="mb-4 flex items-center gap-2">
        <Mail size={14} className="text-brand-red" />
        <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-brand-text-muted">
          Akses Redaksi
        </span>
      </div>
      <div className="space-y-2.5">
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-brand-black transition-colors hover:bg-emerald-50 dark:text-white dark:hover:bg-emerald-500/10"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <SiWhatsapp size={18} />
            </span>
            <div>
              <span className="block text-sm font-bold">WhatsApp</span>
              <span className="block text-[11px] text-brand-text-muted">Chat Redaksi</span>
            </div>
          </a>
        )}
        {telegramUrl && (
          <a
            href={telegramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-brand-black transition-colors hover:bg-sky-50 dark:text-white dark:hover:bg-sky-500/10"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400">
              <SiTelegram size={18} />
            </span>
            <div>
              <span className="block text-sm font-bold">Telegram</span>
              <span className="block text-[11px] text-brand-text-muted">Ikuti Kanal</span>
            </div>
          </a>
        )}
        <a
          href={reportUrl}
          className="flex items-center gap-3.5 rounded-xl px-4 py-3 text-brand-black transition-colors hover:bg-gray-50 dark:text-white dark:hover:bg-white/5"
        >
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-white">
            <Mail size={18} />
          </span>
          <div>
            <span className="block text-sm font-bold">Email</span>
            <span className="block text-[11px] text-brand-text-muted">Kirim Email</span>
          </div>
        </a>
      </div>
    </div>
  )
}
