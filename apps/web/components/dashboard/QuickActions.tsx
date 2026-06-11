'use client';

import { Plus, Tag, Settings, ShieldCheck, Users, Eye, CalendarDays, FileText, Activity, ArrowRight, Clock3, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '../../lib/utils';

interface QuickActionsProps {
  site: string;
  userRole?: string;
  context?: {
    drafts: number;
    inReview: number;
    approved: number;
    revisions: number;
    kycPending: number;
  };
}

type QuickActionTone = 'primary' | 'neutral';

interface QuickActionItem {
  label: string;
  href: string;
  icon: React.ElementType;
  description: string;
  badge?: string;
  tone: QuickActionTone;
  kicker?: string;
}

export function QuickActions({ site, userRole, context }: QuickActionsProps) {
  const safeContext = {
    drafts: context?.drafts || 0,
    inReview: context?.inReview || 0,
    approved: context?.approved || 0,
    revisions: context?.revisions || 0,
    kycPending: context?.kycPending || 0,
  };

  const articlesHref = (status?: string) =>
    status ? `/${site}/dashboard/articles?status=${status}` : `/${site}/dashboard/articles`;
  const reviewHref = (tab?: 'submitted' | 'review' | 'revision' | 'approved') =>
    tab ? `/${site}/dashboard/review?tab=${tab}` : `/${site}/dashboard/review`;

  const role = userRole || 'reporter';
  let focusText = 'Aksi diurutkan dari prioritas harian ke pekerjaan pendukung.';
  let actions: QuickActionItem[] = [];

  if (role === 'reporter' || role === 'kontributor') {
    if (safeContext.revisions > 0) {
      focusText = 'Selesaikan revisi lebih dulu agar antrean editorial tidak tertahan.';
      actions = [
        {
          label: 'Tindak Lanjuti Revisi',
          href: articlesHref('revision'),
          icon: Clock3,
          description: `${safeContext.revisions} post masih menunggu perbaikan dari catatan editor.`,
          badge: `${safeContext.revisions}`,
          tone: 'primary',
          kicker: 'Prioritas Sekarang',
        },
        {
          label: 'Lanjutkan Draft',
          href: articlesHref('draft'),
          icon: FileText,
          description: safeContext.drafts > 0
            ? `${safeContext.drafts} draft masih aktif dan siap dirapikan.`
            : 'Tidak ada draft tertahan saat ini.',
          badge: safeContext.drafts > 0 ? `${safeContext.drafts}` : undefined,
          tone: 'neutral',
        },
        {
          label: 'Pantau Post Dikirim',
          href: articlesHref('submitted'),
          icon: Eye,
          description: 'Cek kiriman yang sudah masuk antrean editor.',
          tone: 'neutral',
        },
      ];
    } else if (safeContext.drafts > 0) {
      focusText = 'Tuntaskan draft aktif lebih dulu sebelum memulai pekerjaan baru.';
      actions = [
        {
          label: 'Lanjutkan Draft',
          href: articlesHref('draft'),
          icon: FileText,
          description: `${safeContext.drafts} draft siap dilanjutkan atau dikirim ke editor.`,
          badge: `${safeContext.drafts}`,
          tone: 'primary',
          kicker: 'Prioritas Sekarang',
        },
        {
          label: 'Pantau Post Dikirim',
          href: articlesHref('submitted'),
          icon: Eye,
          description: 'Lihat post yang sudah menunggu review editor.',
          tone: 'neutral',
        },
        {
          label: 'Tulis Post Baru',
          href: `/${site}/dashboard/articles/new`,
          icon: Plus,
          description: 'Mulai liputan atau artikel baru bila materi sudah siap.',
          tone: 'neutral',
        },
      ];
    } else {
      focusText = 'Tidak ada pekerjaan tertahan; Anda bisa mulai tulisan baru atau memantau kiriman terakhir.';
      actions = [
        {
          label: 'Tulis Post Baru',
          href: `/${site}/dashboard/articles/new`,
          icon: Plus,
          description: 'Mulai artikel baru tanpa perlu membuka daftar post lebih dulu.',
          tone: 'primary',
          kicker: 'Prioritas Sekarang',
        },
        {
          label: 'Pantau Post Dikirim',
          href: articlesHref('submitted'),
          icon: Eye,
          description: 'Cek status kiriman yang sedang menunggu editor.',
          tone: 'neutral',
        },
        {
          label: 'Buka Semua Post',
          href: articlesHref(),
          icon: FileText,
          description: 'Lihat seluruh daftar post untuk meninjau progres harian.',
          tone: 'neutral',
        },
      ];
    }
  } else if (role === 'wapimred') {
    focusText = safeContext.inReview > 0
      ? 'Antrean review menjadi fokus pertama sebelum kalender dan struktur kanal.'
      : 'Antrean review sedang aman; lanjutkan ke publikasi dan pengaturan ritme redaksi.';
    actions = [
      {
        label: safeContext.inReview > 0 ? 'Review Antrean Masuk' : 'Pantau Post Disetujui',
        href: safeContext.inReview > 0 ? reviewHref('submitted') : reviewHref('approved'),
        icon: safeContext.inReview > 0 ? Eye : CheckCircle2,
        description: safeContext.inReview > 0
          ? `${safeContext.inReview} post menunggu keputusan editorial.`
          : safeContext.approved > 0
            ? `${safeContext.approved} post siap diarahkan ke tahap terbit.`
            : 'Tidak ada antrean mendesak; pantau post yang sudah siap terbit.',
        badge: safeContext.inReview > 0
          ? `${safeContext.inReview}`
          : safeContext.approved > 0
            ? `${safeContext.approved}`
            : undefined,
        tone: 'primary',
        kicker: 'Prioritas Sekarang',
      },
      {
        label: 'Kalender Redaksi',
        href: `/${site}/dashboard/calendar`,
        icon: CalendarDays,
        description: 'Jaga ritme publikasi dan agenda terjadwal tetap rapi.',
        tone: 'neutral',
      },
      {
        label: 'Kelola Kategori',
        href: `/${site}/dashboard/categories`,
        icon: Tag,
        description: 'Rapikan kanal agar distribusi topik lebih terarah.',
        tone: 'neutral',
      },
      {
        label: 'Monitor Tim',
        href: `/${site}/dashboard/team`,
        icon: Users,
        description: 'Lihat distribusi kerja reporter dan kontributor.',
        tone: 'neutral',
      },
    ];
  } else if (role === 'superadmin') {
    focusText = safeContext.kycPending > 0
      ? 'Mulai dari verifikasi KYC karena ini langsung memengaruhi operasional tim.'
      : safeContext.inReview > 0
        ? 'Antrean editorial masih butuh pengawasan sebelum audit dan pengaturan.'
        : 'Operasional stabil; lanjutkan pemantauan audit dan konfigurasi inti.';
    actions = [
      {
        label: safeContext.kycPending > 0 ? 'Verifikasi KYC' : 'Pantau Antrean Editorial',
        href: safeContext.kycPending > 0 ? `/${site}/dashboard/review/kyc` : reviewHref('submitted'),
        icon: safeContext.kycPending > 0 ? ShieldCheck : Eye,
        description: safeContext.kycPending > 0
          ? `${safeContext.kycPending} pengajuan verifikasi masih menunggu tindakan.`
          : safeContext.inReview > 0
            ? `${safeContext.inReview} post masih ada di meja editor.`
            : 'Tidak ada antrean mendesak; gunakan waktu untuk pemantauan operasional.',
        badge: safeContext.kycPending > 0
          ? `${safeContext.kycPending}`
          : safeContext.inReview > 0
            ? `${safeContext.inReview}`
            : undefined,
        tone: 'primary',
        kicker: 'Prioritas Sekarang',
      },
      {
        label: 'Audit Sistem',
        href: `/${site}/dashboard/audit`,
        icon: Activity,
        description: 'Pantau jejak perubahan penting dan aktivitas sistem terkini.',
        tone: 'neutral',
      },
      {
        label: 'Pengaturan Situs',
        href: `/${site}/dashboard/settings`,
        icon: Settings,
        description: 'Buka konfigurasi inti portal aktif saat operasional sudah aman.',
        tone: 'neutral',
      },
      {
        label: 'Lihat Post Approved',
        href: reviewHref('approved'),
        icon: CheckCircle2,
        description: safeContext.approved > 0
          ? `${safeContext.approved} post siap diarahkan ke publikasi.`
          : 'Pantau konten yang sudah lolos review untuk menjaga ritme terbit.',
        badge: safeContext.approved > 0 ? `${safeContext.approved}` : undefined,
        tone: 'neutral',
      },
    ];
  }

  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div>
          <h3 className="dash-label">Aksi Kontekstual</h3>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {focusText}
          </p>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {actions.map((item, index) => (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              'flex items-start gap-3 rounded-xl transition-all border',
              item.tone === 'primary'
                ? 'bg-brand-red text-white border-brand-red hover:bg-red-700 px-4 py-4'
                : 'bg-gray-50 dark:bg-white/5 text-brand-black dark:text-white border-gray-100 dark:border-white/10 hover:bg-gray-100 dark:hover:bg-white/10 px-4 py-3'
            )}
          >
            <div className={cn(
              'mt-0.5 w-9 h-9 rounded-lg flex items-center justify-center shrink-0',
              item.tone === 'primary'
                ? 'bg-white/15 text-white'
                : 'bg-white dark:bg-slate-900/80 text-brand-red border border-gray-100 dark:border-white/10'
            )}>
              <item.icon size={14} />
            </div>
            <div className="min-w-0 flex-1">
              {item.kicker && index === 0 && (
                <p className={cn(
                  'text-[10px] font-black uppercase tracking-widest mb-1',
                  item.tone === 'primary' ? 'text-white/70' : 'text-brand-red'
                )}>
                  {item.kicker}
                </p>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <span className={cn(
                  'text-[11px] font-black uppercase tracking-wide',
                  item.tone === 'primary' ? 'text-white' : 'text-brand-black dark:text-white'
                )}>
                  {item.label}
                </span>
                {item.badge && (
                  <span className={cn(
                    'px-1.5 py-0.5 rounded-full text-[10px] font-black',
                    item.tone === 'primary'
                      ? 'bg-white/15 text-white'
                      : 'bg-brand-red/10 text-brand-red'
                  )}>
                    {item.badge}
                  </span>
                )}
              </div>
              <p className={cn(
                'text-xs mt-1 leading-relaxed',
                item.tone === 'primary' ? 'text-white/85' : 'text-gray-500 dark:text-gray-400'
              )}>
                {item.description}
              </p>
            </div>
            <ArrowRight
              size={14}
              className={cn(
                'mt-1 shrink-0',
                item.tone === 'primary' ? 'text-white/80' : 'text-gray-400'
              )}
            />
          </Link>
        ))}
      </div>
    </div>
  );
}
