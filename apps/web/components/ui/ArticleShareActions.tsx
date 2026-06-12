'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Copy, MoreHorizontal, Share2 } from 'lucide-react';
import { SiFacebook, SiInstagram, SiTelegram, SiTiktok, SiWhatsapp, SiX, SiYoutube } from 'react-icons/si';
import { cn } from '../../lib/utils';
import { getArticleShareItems } from '../../lib/articleShare';

type ArticleShareActionsProps = {
  title: string;
  url: string;
  className?: string;
  variant?: 'inline' | 'panel';
  tone?: 'default' | 'floating';
};

const MAIN_ICON_MAP = {
  Facebook: SiFacebook,
  X: SiX,
  Telegram: SiTelegram,
  WhatsApp: SiWhatsapp,
} as const;

const MAIN_HOVER_MAP = {
  Facebook: {
    bg: 'hover:bg-[#1877F2]/[0.08] dark:hover:bg-[#1877F2]/[0.12]',
    text: 'hover:text-[#1877F2] dark:hover:text-[#1877F2]',
    border: 'hover:border-[#1877F2]/30 dark:hover:border-[#1877F2]/35]',
  },
  X: {
    bg: 'hover:bg-black/[0.05] dark:hover:bg-white/[0.08]',
    text: 'hover:text-black dark:hover:text-white',
    border: 'hover:border-black/10 dark:hover:border-white/25',
  },
  Telegram: {
    bg: 'hover:bg-[#229ED9]/[0.08] dark:hover:bg-[#229ED9]/[0.12]',
    text: 'hover:text-[#229ED9] dark:hover:text-[#229ED9]',
    border: 'hover:border-[#229ED9]/30 dark:hover:border-[#229ED9]/35]',
  },
  WhatsApp: {
    bg: 'hover:bg-[#25D366]/[0.08] dark:hover:bg-[#25D366]/[0.12]',
    text: 'hover:text-[#25D366] dark:hover:text-[#25D366]',
    border: 'hover:border-[#25D366]/30 dark:hover:border-[#25D366]/35]',
  },
} as const;

const PLATFORM_ICON_MAP = {
  Instagram: SiInstagram,
  TikTok: SiTiktok,
  YouTube: SiYoutube,
} as const;

const PLATFORM_HOVER_MAP = {
  Instagram: {
    bg: 'hover:bg-[#E4405F]/[0.08] dark:hover:bg-[#E4405F]/[0.12]',
    text: 'hover:text-[#E4405F] dark:hover:text-[#E4405F]',
    border: 'hover:border-[#E4405F]/30 dark:hover:border-[#E4405F]/35]',
  },
  TikTok: {
    bg: 'hover:bg-black/[0.06] dark:hover:bg-white/[0.08]',
    text: 'hover:text-black dark:hover:text-white',
    border: 'hover:border-black/20 dark:hover:border-white/25]',
  },
  YouTube: {
    bg: 'hover:bg-[#FF0000]/[0.08] dark:hover:bg-[#FF0000]/[0.12]',
    text: 'hover:text-[#FF0000] dark:hover:text-[#FF0000]',
    border: 'hover:border-[#FF0000]/30 dark:hover:border-[#FF0000]/35]',
  },
} as const;

const mainItemClass =
  'group relative inline-flex items-center justify-center rounded-full border border-gray-200 bg-white text-brand-text-muted transition-all duration-200 dark:border-white/[0.09] dark:bg-white/[0.03] dark:text-gray-300 min-h-[44px] min-w-[44px] sm:min-h-[40px] sm:min-w-[40px] cursor-pointer';

const dropdownItemClass =
  'flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-[11px] font-semibold text-brand-text transition-all duration-150 hover:bg-black/[0.04] hover:text-brand-black dark:text-gray-200 dark:hover:bg-white/[0.05] dark:hover:text-white cursor-pointer';

export default function ArticleShareActions({
  title,
  url,
  className,
  variant = 'inline',
  tone = 'default',
}: ArticleShareActionsProps) {
  const [isCopied, setIsCopied] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const items = useMemo(() => getArticleShareItems(title, url), [title, url]);
  const canUseNativeShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  };

  const handleCopyForPlatform = async (platform: 'Instagram' | 'TikTok' | 'YouTube') => {
    await navigator.clipboard.writeText(`${title}\n${url}`);
    setCopiedLabel(platform);
    setIsMenuOpen(false);
    window.setTimeout(() => setCopiedLabel(current => (current === platform ? null : current)), 2000);
  };

  const handleNativeShare = async () => {
    if (!canUseNativeShare) return;

    try {
      await navigator.share({ title, url });
      setIsMenuOpen(false);
    } catch {
      // Ignore cancelled share sheet interactions.
    }
  };

  if (variant === 'panel') {
    const panelItemClass =
      tone === 'floating'
        ? 'flex w-full items-center gap-3 rounded-[1.05rem] border border-white/[0.08] bg-white/[0.035] px-3.5 py-3 text-left text-[11px] font-semibold text-gray-200 transition-all duration-150 hover:border-white/[0.14] hover:bg-white/[0.06] hover:text-white'
        : 'flex w-full items-center gap-3 rounded-[1.05rem] border border-black/[0.06] bg-black/[0.02] px-3.5 py-3 text-left text-[11px] font-semibold text-brand-text transition-all duration-150 hover:border-black/[0.1] hover:bg-black/[0.04] hover:text-brand-black dark:border-white/[0.08] dark:bg-white/[0.03] dark:text-gray-200 dark:hover:border-white/[0.14] dark:hover:bg-white/[0.06] dark:hover:text-white';

    const sectionDividerClass =
      tone === 'floating' ? 'border-white/[0.08]' : 'border-black/[0.06] dark:border-white/[0.08]';

    const labelClass =
      tone === 'floating'
        ? 'text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted'
        : 'text-[10px] font-black uppercase tracking-[0.18em] text-brand-text-muted';

    const iconShellClass =
      tone === 'floating'
        ? 'flex h-8 w-8 items-center justify-center rounded-xl bg-white/[0.05] text-gray-100 transition-all duration-150'
        : 'flex h-8 w-8 items-center justify-center rounded-xl bg-black/[0.04] text-brand-text transition-all duration-150 dark:bg-white/[0.06] dark:text-gray-100';

    return (
      <div className={cn('space-y-3', className)}>
        <div className="grid grid-cols-1 gap-2">
          {items.map((item) => {
            const Icon = MAIN_ICON_MAP[item.label];
            const isX = item.label === 'X';
            const hover = MAIN_HOVER_MAP[item.label];

            return (
              <a
                key={item.label}
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Bagikan ke ${item.label}`}
                title={`Bagikan ke ${item.label}`}
                className={cn(panelItemClass, hover.border)}
              >
                <span className={cn(iconShellClass, hover.bg, hover.text)}>
                  <Icon size={14} className={cn(isX ? 'opacity-90' : '', 'transition-colors duration-150')} />
                </span>
                <span className="flex-1">{item.label}</span>
              </a>
            );
          })}

          <button type="button" onClick={handleCopy} className={panelItemClass}>
            <span className={cn(iconShellClass, tone === 'floating' ? 'bg-brand-red/12 text-brand-red' : 'bg-brand-red/[0.07] text-brand-red dark:bg-brand-red/15')}>
              {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
            </span>
            <span className="flex-1">{isCopied ? 'Link Tersalin' : 'Salin Link'}</span>
            {isCopied && (
              <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">Tersalin</span>
            )}
          </button>

          {canUseNativeShare && (
            <button type="button" onClick={handleNativeShare} className={panelItemClass}>
              <span className={cn(iconShellClass, tone === 'floating' ? 'bg-brand-red/12 text-brand-red' : 'bg-brand-red/[0.07] text-brand-red dark:bg-brand-red/15')}>
                <Share2 size={14} />
              </span>
              <span className="flex-1">Bagikan Lainnya</span>
            </button>
          )}
        </div>

        <div className={cn('border-t pt-3', sectionDividerClass)}>
          <p className={labelClass}>Untuk Sosial Lain</p>
          <div className="mt-2 grid grid-cols-1 gap-2">
            {(['Instagram', 'TikTok', 'YouTube'] as const).map((platform) => {
              const Icon = PLATFORM_ICON_MAP[platform];
              const hover = PLATFORM_HOVER_MAP[platform];

              return (
                <button
                  key={platform}
                  type="button"
                  onClick={() => handleCopyForPlatform(platform)}
                  className={cn(panelItemClass, hover.border)}
                  aria-label={`Salin untuk ${platform}`}
                  title={`Salin untuk ${platform}`}
                >
                  <span className={cn(iconShellClass, hover.bg, hover.text)}>
                    <Icon size={14} />
                  </span>
                  <span className="flex-1">{platform}</span>
                  {copiedLabel === platform && (
                    <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">Tersalin</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      {items.map((item) => {
        const Icon = MAIN_ICON_MAP[item.label];
        const hover = MAIN_HOVER_MAP[item.label];

        return (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Bagikan ke ${item.label}`}
            title={`Bagikan ke ${item.label}`}
            className={cn(mainItemClass, hover.bg, hover.text, hover.border)}
          >
            <Icon className="text-sm transition-colors duration-200" />
          </a>
        );
      })}

      <div ref={menuRef} className="relative">
        <button
          type="button"
          onClick={() => setIsMenuOpen(open => !open)}
          aria-label="Opsi bagikan lainnya"
          title="Opsi bagikan lainnya"
          className={cn(
            mainItemClass,
            'ml-0.5',
            isMenuOpen || isCopied || copiedLabel
              ? 'border-brand-red/40 text-brand-red'
              : 'hover:text-brand-red hover:border-brand-red/30 hover:bg-brand-red/[0.04]'
          )}
        >
          <MoreHorizontal size={16} className="transition-colors duration-200" />
        </button>

        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.98 }}
              transition={{ duration: 0.18, ease: 'easeOut' }}
              className="absolute right-0 top-full z-30 mt-2.5 w-[13rem] origin-top-right rounded-2xl border border-black/[0.07] bg-white/98 p-2 shadow-[0_16px_48px_rgba(15,23,42,0.12),0_4px_12px_rgba(15,23,42,0.06)] backdrop-blur-xl dark:border-white/[0.09] dark:bg-[color:rgb(2,6,23/0.97)] dark:shadow-[0_16px_48px_rgba(0,0,0,0.4),0_4px_12px_rgba(0,0,0,0.2)]"
            >
              <div className="px-2 pb-1.5 pt-0.5">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-muted">
                  Bagikan Artikel
                </p>
              </div>

              <button
                type="button"
                onClick={handleCopy}
                className={dropdownItemClass}
              >
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/[0.07] text-brand-red transition-colors duration-150 dark:bg-brand-red/15">
                  {isCopied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </span>
                <span className="flex-1">Salin Link</span>
                {isCopied && (
                  <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">Tersalin</span>
                )}
              </button>

              {canUseNativeShare && (
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className={cn(dropdownItemClass, 'mt-0.5')}
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-red/[0.07] text-brand-red transition-colors duration-150 dark:bg-brand-red/15">
                    <Share2 size={14} />
                  </span>
                  <span className="flex-1">Bagikan Lainnya</span>
                </button>
              )}

              <div className="mt-1.5 border-t border-black/[0.05] pt-1.5 dark:border-white/[0.07]">
                <div className="px-2 pb-1.5 pt-0.5">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-text-muted">
                    Untuk Sosial Lain
                  </p>
                </div>
                {(['Instagram', 'TikTok', 'YouTube'] as const).map((platform) => {
                  const Icon = PLATFORM_ICON_MAP[platform];
                  const hover = PLATFORM_HOVER_MAP[platform];

                  return (
                    <button
                      key={platform}
                      type="button"
                      onClick={() => handleCopyForPlatform(platform)}
                      className={cn(dropdownItemClass, hover.bg, 'group')}
                      aria-label={`Salin untuk ${platform}`}
                      title={`Salin untuk ${platform}`}
                    >
                      <span className={cn(
                        'flex h-8 w-8 items-center justify-center rounded-lg transition-all duration-150',
                        hover.bg,
                        hover.text
                      )}>
                        <Icon size={14} />
                      </span>
                      <span className="flex-1">
                        {platform}
                      </span>
                      {copiedLabel === platform && (
                        <span className="text-[10px] font-black uppercase tracking-[0.14em] text-emerald-500">Tersalin</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
