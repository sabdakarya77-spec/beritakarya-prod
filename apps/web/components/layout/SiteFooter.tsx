'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { MapPin, Mail, Phone } from 'lucide-react';
import { SiFacebook, SiInstagram, SiTelegram, SiTiktok, SiWhatsapp, SiX, SiYoutube } from '../ui/SocialIcons';

import { CategoryItem, type SiteConfig } from '../../lib/constants';
import { Container } from './Container';
import { ALL_LEGAL_PAGES } from '../../lib/legalPages';

interface SiteFooterProps {
  siteConfig: SiteConfig;
  categories: CategoryItem[];
}

function buildWhatsAppLink(phone?: string | null) {
  if (!phone) return '';

  const normalized = phone.replace(/[^\d+]/g, '');
  if (!normalized) return '';

  if (normalized.startsWith('+')) {
    return `https://wa.me/${normalized.slice(1)}`;
  }

  if (normalized.startsWith('0')) {
    return `https://wa.me/62${normalized.slice(1)}`;
  }

  return `https://wa.me/${normalized}`;
}

export default function SiteFooter({ siteConfig, categories }: SiteFooterProps) {
  const router = useRouter();
  const activeSite = siteConfig?.id || 'pusat';
  const resolvedSocialLinks = {
    whatsapp: siteConfig?.socialLinks?.whatsapp?.trim() || buildWhatsAppLink(siteConfig?.phone),
    facebook: siteConfig?.socialLinks?.facebook?.trim() || '',
    tiktok: siteConfig?.socialLinks?.tiktok?.trim() || '',
    telegram: siteConfig?.socialLinks?.telegram?.trim() || '',
    youtube: siteConfig?.socialLinks?.youtube?.trim() || '',
    twitter: siteConfig?.socialLinks?.twitter?.trim() || '',
    instagram: siteConfig?.socialLinks?.instagram?.trim() || '',
  };
  const mainCategories = categories
    .filter(c => c.slug !== 'terbaru' && c.slug !== 'tersimpan' && c.slug !== 'advertorial')
    .slice(0, 9);
  
  const partnershipLinks = [
    { href: `/${activeSite}/p/ads`, label: 'Iklan' },
    { href: `/${activeSite}?cat=advertorial`, label: 'Advertorial' },
    { href: `/${activeSite}/p/ads`, label: 'Kemitraan & Partner' },
  ];

  const bottomLinks = ALL_LEGAL_PAGES.map((page) => ({
    href: page.href(activeSite),
    label: page.title,
  }));
  const socialLinks = [
    { href: resolvedSocialLinks.whatsapp, label: 'WhatsApp', Icon: SiWhatsapp },
    { href: resolvedSocialLinks.facebook, label: 'Facebook', Icon: SiFacebook },
    { href: resolvedSocialLinks.tiktok, label: 'TikTok', Icon: SiTiktok },
    { href: resolvedSocialLinks.telegram, label: 'Telegram', Icon: SiTelegram },
    { href: resolvedSocialLinks.youtube, label: 'YouTube', Icon: SiYoutube },
    { href: resolvedSocialLinks.twitter, label: 'X', Icon: SiX },
    { href: resolvedSocialLinks.instagram, label: 'Instagram', Icon: SiInstagram },
  ].filter((item) => Boolean(item.href));

  return (
    <footer className="mt-20 border-t border-gray-200 bg-white pb-10 pt-12 text-brand-text transition-colors duration-500 sm:mt-24 sm:pb-12 sm:pt-14 dark:border-white/5 dark:bg-[#020617]">
      <Container>
        <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-4 md:gap-10 lg:grid-cols-5">
          <div className="col-span-1 md:col-span-2">
            <button 
              onClick={() => {
                window.scrollTo({ top: 0, behavior: 'instant' });
                router.push(`/${activeSite}`);
              }}
              className="mb-4 flex flex-col cursor-pointer text-left hover:opacity-90 transition-opacity"
            >
              <span className="font-serif text-[1.75rem] font-black tracking-tight uppercase sm:text-[2rem]">
                {(() => {
                  const siteName = siteConfig?.name || 'BERITA KARYA';
                  const nameParts = siteName.split(' ');
                  const firstName = nameParts[0] || 'BERITA';
                  const lastName = nameParts.slice(1).join(' ') || 'KARYA';
                  return (
                    <>
                      <span className="text-brand-red">{firstName}</span>{' '}
                      <span className="text-brand-black dark:text-white">{lastName}</span>
                    </>
                  );
                })()}
              </span>
            </button>
            <p className="mb-5 max-w-xs text-[13px] leading-6 text-brand-text-muted opacity-80">
              {siteConfig?.description || "Portal berita independen yang berfokus pada kedalaman investigasi dan kejernihan melihat realitas Nusantara."}
            </p>
            <div className="mb-5 flex gap-1.5">
              {socialLinks.map(({ href, label, Icon }, index) => (
                <a
                  key={`${href}-${index}`}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  title={label}
                  className="group flex h-11 w-11 items-center justify-center rounded-xl bg-gray-100 transition-colors hover:bg-brand-red dark:bg-white/5"
                >
                  <Icon size={16} className="text-brand-text-muted group-hover:text-white" />
                </a>
              ))}
            </div>
            <div className="space-y-1.5">
              <p className="flex items-start gap-2 text-[13px] leading-6 text-brand-text-muted">
                <MapPin size={12} className="shrink-0 mt-0.5 text-brand-red" />
                <span>{siteConfig?.address || "Jl Semeru No.54 Wonotakan Kecamatan Berbek Kabupaten Nganjuk"}</span>
              </p>
              <p className="flex items-center gap-2 text-[13px] text-brand-text-muted">
                <Phone size={12} className="text-brand-text-muted opacity-60" /> {siteConfig?.phone || "+62 815 9921 922"}
              </p>
              {siteConfig?.contactEmail && (
                <p className="flex items-center gap-2 text-[13px] text-brand-text-muted">
                  <Mail size={12} className="text-brand-text-muted opacity-60" /> {siteConfig.contactEmail}
                </p>
              )}
            </div>
          </div>

          <div className="md:col-span-1 lg:col-span-2">
            <h5 className="mb-4 text-[10px] font-medium tracking-[0.06em] text-brand-red/90">Kategori Utama</h5>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2.5">
              {mainCategories.map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/${siteConfig.id}?cat=${encodeURIComponent(cat.slug)}`}
                  className="text-[13px] font-medium text-brand-text-muted transition-all hover:text-brand-red"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          <div className="md:col-span-1">
            <h5 className="mb-4 text-[10px] font-medium tracking-[0.06em] text-brand-red/90">Kerja Sama</h5>
            <ul className="space-y-2.5 text-[13px] text-brand-text-muted">
              {partnershipLinks.map((item, index) => (
                <li key={`${item.href}-${index}`}>
                  <Link href={item.href} className="font-medium transition-colors hover:text-brand-red">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-center gap-3 border-t border-black/5 pt-6 md:gap-6 dark:border-white/5">
          {bottomLinks.map((item) => (
            <Link key={item.href} href={item.href} className="text-xs font-medium tracking-[0.04em] text-brand-text-muted opacity-75 transition-colors hover:text-brand-red sm:text-[13px]">
              {item.label}
            </Link>
          ))}
        </div>

        <div className="text-center">
          <span suppressHydrationWarning className="text-xs font-normal tracking-[0.04em] text-brand-text-muted opacity-60">
            {siteConfig?.footerText || `© ${new Date().getFullYear()} PT SABDA KARYA NUSANTARA (BERITA KARYA DIGITAL GROUP). ALL RIGHTS RESERVED.`}
          </span>
        </div>
      </Container>
    </footer>
  );
}
