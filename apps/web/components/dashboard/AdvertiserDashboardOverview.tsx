'use client';

import { Megaphone, LayoutDashboard, ArrowRight, BarChart3, CheckCircle2, ClipboardList, FileText, MessageSquareMore } from 'lucide-react';
import Link from 'next/link';

interface AdvertiserDashboardOverviewProps {
  greeting: string;
  userName: string;
  site: string;
  currentDate: string;
}

export function AdvertiserDashboardOverview({ greeting, userName, site, currentDate }: AdvertiserDashboardOverviewProps) {
  const advertiserActions = [
    {
      title: 'Pasang Iklan Baru',
      description: 'Masuk ke flow pemesanan paket iklan regional yang sudah tersedia.',
      href: `/${site}/dashboard/ads/order`,
      icon: Megaphone,
      tone: 'primary',
    },
    {
      title: 'Lihat Paket & Riwayat',
      description: 'Buka dashboard iklan untuk mengecek paket aktif, booking, dan performa saat tersedia.',
      href: `/${site}/dashboard/ads`,
      icon: LayoutDashboard,
      tone: 'secondary',
    },
  ] as const;

  const readinessItems = [
    'Pilih paket iklan yang tersedia untuk regional ini.',
    'Siapkan materi promosi berupa gambar atau video sesuai slot yang dipilih.',
    'Lengkapi pembayaran dan tunggu verifikasi sebelum iklan tayang.',
  ];

  return (
    <div className="space-y-8">
      <div className="dash-card p-5 md:p-6">
        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-5">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center rounded-full bg-brand-red/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-brand-red">
                {greeting}
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/5 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-brand-black dark:text-white">
                Advertiser
              </span>
              <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-white/5 px-2.5 py-1 text-[10px] font-bold text-gray-500 dark:text-gray-300">
                {currentDate}
              </span>
            </div>

            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                Portal Mitra Pengiklan
              </p>
              <h1 className="text-2xl font-black text-brand-black dark:text-white tracking-tight">
                {userName}
              </h1>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                Kelola pemasangan iklan untuk <strong className="text-brand-red">{site === 'pusat' ? 'Pusat' : site}</strong> dari satu dashboard yang lebih ringkas.
              </p>
            </div>

            <div className="max-w-3xl rounded-xl border border-brand-red/10 bg-brand-red/5 px-4 py-3">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-red mb-1">
                Fokus Hari Ini
              </p>
              <p className="text-sm text-brand-black dark:text-white leading-relaxed">
                Mulai dari pemesanan paket iklan yang tersedia. Statistik seperti impresi, klik, dan performa kampanye akan muncul setelah Anda memiliki booking aktif.
              </p>
            </div>
          </div>

          <div className="w-full xl:w-auto xl:min-w-[280px] rounded-xl border border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03] p-4">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              Ketersediaan Dashboard
            </p>
            <div className="mt-3 space-y-3">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-black dark:text-white">Flow pemesanan tersedia</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Anda bisa langsung mulai dari paket iklan regional yang aktif.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-0.5 w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center">
                  <BarChart3 size={15} />
                </div>
                <div>
                  <p className="text-xs font-bold text-brand-black dark:text-white">Statistik tampil setelah booking aktif</p>
                  <p className="text-[10px] text-gray-500 dark:text-gray-400">Tidak ada angka palsu; data performa baru muncul saat kampanye berjalan.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {advertiserActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.title}
              href={action.href}
              className={`dash-card p-5 transition-all border ${
                action.tone === 'primary'
                  ? 'bg-brand-red text-white border-brand-red hover:bg-red-700'
                  : 'bg-white dark:bg-white/[0.03] border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/[0.05]'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    action.tone === 'primary'
                      ? 'bg-white/15 text-white'
                      : 'bg-brand-red/10 text-brand-red'
                  }`}>
                    <Icon size={18} />
                  </div>
                  <div>
                    <p className={`text-sm font-black uppercase tracking-tight ${
                      action.tone === 'primary' ? 'text-white' : 'text-brand-black dark:text-white'
                    }`}>
                      {action.title}
                    </p>
                    <p className={`mt-1 text-sm leading-relaxed ${
                      action.tone === 'primary' ? 'text-white/85' : 'text-gray-600 dark:text-gray-300'
                    }`}>
                      {action.description}
                    </p>
                  </div>
                </div>
                <ArrowRight size={16} className={action.tone === 'primary' ? 'text-white/80' : 'text-gray-400'} />
              </div>
            </Link>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="dash-card p-6 md:p-8 border-brand-red/10 bg-gradient-to-br from-brand-red/5 via-transparent to-transparent">
            <div className="flex items-center gap-2 mb-4">
              <ClipboardList size={16} className="text-brand-red" />
              <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
                Alur Yang Bisa Anda Kerjakan
              </h3>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
              Dashboard advertiser sekarang difokuskan untuk membantu Anda memulai pemasangan iklan dengan jelas. Angka performa hanya muncul saat sudah ada booking atau kampanye aktif, jadi layar ini tidak lagi menampilkan metrik kosong yang menyesatkan.
            </p>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
              {readinessItems.map((item, index) => (
                <div key={item} className="rounded-xl border border-gray-100 dark:border-white/10 bg-white dark:bg-white/[0.03] p-4">
                  <div className="w-8 h-8 rounded-full bg-brand-red text-white flex items-center justify-center text-[10px] font-black mb-3">
                    {index + 1}
                  </div>
                  <p className="text-sm font-bold text-brand-black dark:text-white leading-relaxed">
                    {item}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/${site}/dashboard/ads/order`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-brand-red text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all shadow-lg shadow-brand-red/20"
              >
                <Megaphone size={14} />
                Mulai Pesan Iklan
              </Link>
              <Link
                href={`/${site}/dashboard/ads`}
                className="inline-flex items-center gap-2 px-5 py-3 bg-gray-100 dark:bg-white/5 text-brand-black dark:text-white text-[11px] font-black uppercase tracking-widest rounded-lg hover:bg-gray-200 dark:hover:bg-white/10 transition-all"
              >
                <LayoutDashboard size={14} />
                Buka Dashboard Iklan
              </Link>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="dash-card p-6">
            <div className="flex items-center gap-2 mb-3">
              <FileText size={15} className="text-brand-red" />
              <h4 className="text-[10px] font-black text-brand-black dark:text-white uppercase tracking-widest">
                Sebelum Mulai
              </h4>
            </div>
            <div className="space-y-3 text-xs text-gray-600 dark:text-gray-300">
              <p>Siapkan materi iklan final agar proses booking lebih cepat.</p>
              <p>Gunakan dashboard iklan untuk mengecek paket yang aktif di regional ini.</p>
              <p>Jika belum ada paket yang cocok, hubungi tim marketing untuk bantuan penawaran manual.</p>
            </div>
          </div>

          <div className="dash-card p-6 bg-blue-50/50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/20">
            <div className="flex items-center gap-2 mb-3">
              <MessageSquareMore size={15} className="text-blue-700 dark:text-blue-300" />
              <h4 className="text-[10px] font-black text-blue-900 dark:text-blue-300 uppercase tracking-widest">
                Butuh Bantuan?
              </h4>
            </div>
            <p className="text-xs text-blue-700/80 dark:text-blue-400/80 leading-relaxed mb-4">
              Untuk kebutuhan paket khusus, kerja sama tahunan, atau kendala saat booking, Anda bisa langsung menghubungi marketing.
            </p>
            <a
              href="https://wa.me/628123456789"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
            >
              <MessageSquareMore size={13} />
              Hubungi Marketing
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
