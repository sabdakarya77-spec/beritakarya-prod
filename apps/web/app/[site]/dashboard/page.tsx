'use client';

import { BarChart3, TrendingUp, FileText, ShieldCheck, Activity, ArrowRight, Clock3, CheckCircle2, Users, PenSquare, Megaphone, MessageSquareMore, LayoutDashboard, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import TrafficChart from '../../../components/dashboard/TrafficChart';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Skeleton from '../../../components/ui/Skeleton';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/authStore';
import { ROLE_LABELS } from '@beritakarya/config';

// Components
import { DashboardHeader } from '../../../components/dashboard/DashboardHeader';
import { KPICards } from '../../../components/dashboard/KPICards';
import { DashboardStats } from '../../../components/dashboard/DashboardStats';
import { ReviewQueue } from '../../../components/dashboard/ReviewQueue';
import { RecentActivity } from '../../../components/dashboard/RecentActivity';
import { CategoryPerformance } from '../../../components/dashboard/CategoryPerformance';
import { TopContent } from '../../../components/dashboard/TopContent';
import { QuickActions } from '../../../components/dashboard/QuickActions';

// ─── Types ──────────────────────────────────────────────────────
interface Article {
  id: string;
  title: string;
  status: string;
  category?: { name: string };
  author?: { name: string };
  publishedAt?: string;
  createdAt: string;
  updatedAt?: string;
  viewCount?: number;
  isBreaking?: boolean;
}

interface DashboardFocusCard {
  title: string;
  description: string;
  href: string;
  ctaLabel: string;
  accent: string;
  icon: React.ElementType;
  badge?: string;
}

interface DashboardRoleSignal {
  label: string;
  value: string;
  hint: string;
  tone: string;
}

export default function DashboardOverview() {
  const { site } = useParams() as { site: string };
  const { user } = useAuthStore();
  const [articles, setArticles] = useState<Article[]>([]);
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [topContent, setTopContent] = useState<any[]>([]);
  const [engagementStats, setEngagementStats] = useState<any>(null);
  const [kycRequests, setKycRequests] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('Selamat');
  const [currentDate, setCurrentDate] = useState('');
  const [currentTimestamp] = useState(() => Date.now());

  useEffect(() => {
    const hour = new Date().getHours();
    setGreeting(hour < 11 ? 'Selamat Pagi' : hour < 15 ? 'Selamat Siang' : hour < 18 ? 'Selamat Sore' : 'Selamat Malam');
    setCurrentDate(new Date().toLocaleDateString('id-ID', { weekday:'long', year:'numeric', month:'long', day:'numeric' }));
  }, []);

  useEffect(() => {
    if (user?.role === 'advertiser') {
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    const loadData = async () => {
      setLoading(true);
      try {
        const [artRes, trafficRes, topRes, engRes] = await Promise.all([
          api.get('/articles', { params: { limit: 50 }, signal: controller.signal }),
          api.get('/analytics/traffic', { params: { days: 7 }, signal: controller.signal }),
          api.get('/analytics/top-content', { params: { limit: 5 }, signal: controller.signal }),
          api.get('/analytics/engagement', { signal: controller.signal })
        ]);

        if (controller.signal.aborted) return;
        setArticles(artRes.data.data.articles || artRes.data.data.items || []);
        setTrafficData(trafficRes.data.data);
        setTopContent(topRes.data.data);
        setEngagementStats(engRes.data.data);

        if (user?.role === 'superadmin') {
          try {
            const [kycRes, auditRes] = await Promise.all([
              api.get('/kyc', { params: { status: 'pending', limit: 5 }, signal: controller.signal }),
              api.get('/audit', { params: { limit: 5 }, signal: controller.signal })
            ]);
            if (controller.signal.aborted) return;
            setKycRequests(kycRes.data.data || []);
            setAuditLogs(auditRes.data.data?.items || []);
          } catch (err: any) {
            if (err?.name !== 'CanceledError') console.error('Failed to load admin stats:', err);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'CanceledError') console.error('Failed to load dashboard data:', err);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    };
    loadData();
    return () => { controller.abort(); };
  }, [site, user]);

  if (loading) {
    return (
      <div className="space-y-8">
        <Skeleton variant="text" className="h-8 w-72" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <Skeleton key={i} variant="text" className="h-36 w-full rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2"><Skeleton variant="text" className="h-72 w-full rounded-lg" /></div>
          <Skeleton variant="text" className="h-72 w-full rounded-lg" />
        </div>
      </div>
    );
  }

  // Computed stats
  const total       = articles.length;
  const published   = articles.filter(a => a.status === 'published').length;
  const drafts      = articles.filter(a => a.status === 'draft').length;
  const submitted   = articles.filter(a => a.status === 'submitted').length;
  const inReview    = articles.filter(a => a.status === 'review' || a.status === 'submitted').length;
  const scheduled   = articles.filter(a => a.status === 'scheduled').length;
  const approved    = articles.filter(a => a.status === 'approved').length;
  const revisions   = articles.filter(a => a.status === 'revision').length;
  const totalViews  = articles.reduce((s, a) => s + (a.viewCount || 0), 0);

  const getQueueHours = (article: Article) => {
    const queueDate = new Date(article.updatedAt || article.createdAt).getTime();
    return Math.max(1, Math.floor((currentTimestamp - queueDate) / (1000 * 60 * 60)));
  };

  const reviewQueue = [...articles]
    .filter(a => a.status === 'review' || a.status === 'submitted')
    .sort((a, b) => {
      if (Number(b.isBreaking) !== Number(a.isBreaking)) {
        return Number(b.isBreaking) - Number(a.isBreaking);
      }
      return getQueueHours(b) - getQueueHours(a);
    })
    .slice(0, 4);
  const recentActivityList = [...articles].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  // Category breakdown
  const catMap: Record<string, number> = {};
  articles.forEach(a => {
    const cat = a.category?.name || 'Umum';
    catMap[cat] = (catMap[cat] || 0) + 1;
  });
  const catEntries = Object.entries(catMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const catMax = catEntries[0]?.[1] || 1;

  // Sparkline data from real traffic
  const trafficSpark = trafficData.length > 0 ? trafficData.map(d => d.views) : [0,0,0,0,0,0,0];
  const publishedSpark = trafficData.length > 0 ? trafficData.map(d => Math.floor(d.views / 20)) : [0,0,0,0,0,0,0];

  const supportEmail = 'support.beritakarya@gmail.com';
  const supportSubject = encodeURIComponent(`Bantuan Dashboard ${site}`);
  const articlesHref = (status?: string) =>
    status ? `/${site}/dashboard/articles?status=${status}` : `/${site}/dashboard/articles`;
  const reviewHref = (tab?: 'submitted' | 'review' | 'revision' | 'approved') =>
    tab ? `/${site}/dashboard/review?tab=${tab}` : `/${site}/dashboard/review`;
  const roleFocusText: Record<string, string> = {
    reporter: drafts > 0
      ? `Fokus hari ini: lanjutkan ${drafts} draft yang belum selesai dan kirim artikel yang sudah siap ke meja editor.`
      : 'Fokus hari ini: cek artikel yang sudah dikirim, tanggapi revisi editor, atau mulai post baru bila agenda liputan sudah siap.',
    kontributor: drafts > 0
      ? `Fokus hari ini: rapikan ${drafts} draft yang masih tertahan lalu kirim artikel yang sudah siap untuk ditinjau editor.`
      : 'Fokus hari ini: cek respons editor pada kiriman sebelumnya atau mulai post baru bila materi sudah lengkap.',
    wapimred: inReview > 0
      ? `Fokus hari ini: prioritaskan ${inReview} post yang sedang menunggu review agar antrean redaksi tidak menumpuk.`
      : 'Fokus hari ini: pantau artikel siap terbit, jaga ritme publikasi, dan pastikan tidak ada antrean review yang terlewat.',
    superadmin: kycRequests.length > 0
      ? `Fokus hari ini: amankan operasional redaksi dengan memproses ${inReview} antrean review dan ${kycRequests.length} verifikasi KYC.`
      : 'Fokus hari ini: pantau kesehatan operasional, cek audit sistem, dan pastikan alur editorial berjalan tanpa hambatan.',
  };

  const roleSignals: DashboardRoleSignal[] = (() => {
    switch (user?.role) {
      case 'reporter':
      case 'kontributor':
        return [
          {
            label: 'Draft Aktif',
            value: `${drafts}`,
            hint: drafts > 0 ? 'Perlu dirapikan atau dikirim ke editor.' : 'Tidak ada draft tertahan.',
            tone: 'text-brand-red bg-brand-red/5 border-brand-red/10',
          },
          {
            label: 'Perlu Revisi',
            value: `${revisions}`,
            hint: revisions > 0 ? 'Ada catatan editor yang perlu ditindaklanjuti.' : 'Tidak ada revisi baru.',
            tone: 'text-amber-600 bg-amber-50 dark:bg-amber-900/10 border-amber-100 dark:border-amber-500/10',
          },
          {
            label: 'Sudah Dikirim',
            value: `${submitted}`,
            hint: submitted > 0 ? 'Sedang menunggu keputusan editor.' : 'Belum ada kiriman aktif di meja editor.',
            tone: 'text-blue-600 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-500/10',
          },
        ];
      case 'wapimred':
        return [
          {
            label: 'Antrean Review',
            value: `${inReview}`,
            hint: inReview > 0 ? 'Perlu keputusan editorial hari ini.' : 'Antrean review sedang bersih.',
            tone: 'text-violet-600 bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-500/10',
          },
          {
            label: 'Siap Terbit',
            value: `${approved}`,
            hint: approved > 0 ? 'Post approved siap diarahkan ke publikasi.' : 'Belum ada post approved yang menunggu.',
            tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/10',
          },
          {
            label: 'Terjadwal',
            value: `${scheduled}`,
            hint: scheduled > 0 ? 'Perlu dipantau agar ritme terbit tetap terjaga.' : 'Belum ada post terjadwal.',
            tone: 'text-sky-600 bg-sky-50 dark:bg-sky-900/10 border-sky-100 dark:border-sky-500/10',
          },
        ];
      case 'superadmin':
        return [
          {
            label: 'Antrean Editorial',
            value: `${inReview}`,
            hint: inReview > 0 ? 'Masih ada post yang membutuhkan pengawasan.' : 'Operasional editorial sedang aman.',
            tone: 'text-violet-600 bg-violet-50 dark:bg-violet-900/10 border-violet-100 dark:border-violet-500/10',
          },
          {
            label: 'KYC Pending',
            value: `${kycRequests.length}`,
            hint: kycRequests.length > 0 ? 'Verifikasi menunggu tindakan admin.' : 'Tidak ada KYC yang tertahan.',
            tone: 'text-brand-red bg-brand-red/5 border-brand-red/10',
          },
          {
            label: 'Views 7 Hari',
            value: totalViews.toLocaleString('id-ID'),
            hint: 'Menjadi sinyal cepat kesehatan distribusi konten.',
            tone: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-500/10',
          },
        ];
      default:
        return [];
    }
  })();

  const focusCards: DashboardFocusCard[] = (() => {
    switch (user?.role) {
      case 'reporter':
      case 'kontributor':
        return [
          {
            title: 'Selesaikan Draft Aktif',
            description: drafts > 0
              ? `${drafts} draft masih menunggu dirapikan atau dikirim ke editor.`
              : 'Tidak ada draft tertahan. Anda bisa mulai post baru atau cek hasil kiriman sebelumnya.',
            href: articlesHref(drafts > 0 ? 'draft' : undefined),
            ctaLabel: drafts > 0 ? 'Buka Draft' : 'Lihat Daftar Post',
            accent: 'from-brand-red/10 via-brand-red/5 to-transparent border-brand-red/10',
            icon: PenSquare,
            badge: drafts > 0 ? `${drafts} draft` : undefined,
          },
          {
            title: 'Tindak Lanjut Revisi',
            description: revisions > 0
              ? `${revisions} post membutuhkan perbaikan dari catatan editor.`
              : 'Belum ada revisi baru. Gunakan waktu untuk menuntaskan tulisan berikutnya.',
            href: articlesHref('revision'),
            ctaLabel: 'Cek Revisi',
            accent: 'from-amber-500/10 via-amber-500/5 to-transparent border-amber-500/10',
            icon: Clock3,
            badge: revisions > 0 ? `${revisions} revisi` : undefined,
          },
        ];
      case 'wapimred':
        return [
          {
            title: 'Prioritas Meja Editor',
            description: inReview > 0
              ? `${inReview} post sedang menunggu keputusan review atau persetujuan editorial.`
              : 'Antrean review sedang bersih. Gunakan waktu untuk memantau kualitas dan ritme terbit.',
            href: reviewHref('submitted'),
            ctaLabel: 'Buka Antrean Review',
            accent: 'from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/10',
            icon: Clock3,
            badge: inReview > 0 ? `${inReview} antrean` : undefined,
          },
          {
            title: 'Konten Siap Terbit',
            description: approved > 0
              ? `${approved} post sudah disetujui dan siap dilanjutkan ke tahap publikasi.`
              : 'Belum ada post yang berhenti di status disetujui.',
            href: reviewHref('approved'),
            ctaLabel: 'Tinjau Status Approved',
            accent: 'from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/10',
            icon: CheckCircle2,
            badge: approved > 0 ? `${approved} approved` : undefined,
          },
        ];
      case 'superadmin':
        return [
          {
            title: 'Operasional Editorial',
            description: inReview > 0
              ? `${inReview} post masih ada di antrean review dan perlu pengawasan operasional.`
              : 'Antrean review editorial sedang bersih dan tidak membutuhkan eskalasi.',
            href: reviewHref('submitted'),
            ctaLabel: 'Pantau Review',
            accent: 'from-violet-500/10 via-violet-500/5 to-transparent border-violet-500/10',
            icon: Clock3,
            badge: inReview > 0 ? `${inReview} antrean` : undefined,
          },
          {
            title: 'Kontrol Sistem',
            description: kycRequests.length > 0
              ? `${kycRequests.length} verifikasi KYC masih menunggu tindakan bersama pemantauan audit sistem.`
              : 'Tidak ada KYC tertahan. Lanjutkan pemantauan audit dan konfigurasi operasional.',
            href: `/${site}/dashboard/review/kyc`,
            ctaLabel: 'Buka KYC',
            accent: 'from-brand-red/10 via-brand-red/5 to-transparent border-brand-red/10',
            icon: Users,
            badge: kycRequests.length > 0 ? `${kycRequests.length} KYC` : undefined,
          },
        ];
      default:
        return [];
    }
  })();

  if (user?.role === 'advertiser') {
    return (
      <AdvertiserDashboardOverview 
        greeting={greeting}
        userName={user?.name || 'Mitra Bisnis'}
        site={site}
        currentDate={currentDate}
      />
    );
  }

  return (
    <div className="space-y-8">
      <DashboardHeader 
        greeting={greeting}
        roleLabel={ROLE_LABELS[user?.role || 'reporter']}
        userName={user?.name || 'Redaktur'}
        site={site}
        currentDate={currentDate}
        roleFocus={roleFocusText[user?.role || 'reporter']}
      />

      {roleSignals.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roleSignals.map((signal) => (
            <div
              key={signal.label}
              className={`dash-card p-5 border ${signal.tone}`}
            >
              <p className="text-[10px] font-black uppercase tracking-widest">
                {signal.label}
              </p>
              <p className="mt-2 text-3xl font-black tabular-nums text-brand-black dark:text-white">
                {signal.value}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                {signal.hint}
              </p>
            </div>
          ))}
        </div>
      )}

      {focusCards.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {focusCards.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className={`dash-card p-5 bg-gradient-to-br ${item.accent}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-xl bg-white dark:bg-slate-900/60 border border-white/60 dark:border-white/10 flex items-center justify-center shadow-sm">
                      <Icon size={18} className="text-brand-red" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
                          {item.title}
                        </h2>
                        {item.badge && (
                          <span className="px-2 py-1 rounded-full bg-white/80 dark:bg-slate-900/70 text-[10px] font-black text-brand-black dark:text-white">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={item.href}
                    className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 bg-brand-black dark:bg-white text-white dark:text-slate-900 text-[11px] font-black uppercase tracking-wide rounded-lg hover:opacity-90 transition-all"
                  >
                    {item.ctaLabel}
                    <ArrowRight size={14} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <KPICards 
        stats={{ total, published, inReview, scheduled }}
        trafficSpark={trafficSpark}
        publishedSpark={publishedSpark}
      />

      {(user?.role === 'superadmin' || user?.role === 'wapimred') && (
        <DashboardStats 
          published={published}
          drafts={drafts}
          totalViews={totalViews}
        />
      )}

      <div className="dash-card">
        <div className="dash-card-header">
          <div className="flex items-center gap-2">
            <BarChart3 size={16} className="text-brand-red" />
            <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">Ikhtisar Trafik</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-brand-red animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-brand-red">Real-time</span>
          </div>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            <div>
              <p className="dash-label mb-1">Total Views (7 Hari)</p>
              <p className="text-4xl font-black text-brand-black dark:text-white tabular-nums">
                {trafficData.reduce((acc, curr) => acc + curr.views, 0).toLocaleString('id-ID')}
              </p>
            </div>
            <div>
              <p className="dash-label mb-1">Sumber Trafik Utama</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-black uppercase rounded">Direct</span>
                <span className="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase rounded">Google</span>
                <span className="px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black uppercase rounded">Social</span>
              </div>
            </div>
            <div>
              <p className="dash-label mb-1">Engagement Rate</p>
              <p className="text-xl font-black text-brand-black dark:text-white tabular-nums flex items-center gap-2">
                {engagementStats ? `${engagementStats.rate}%` : '0%'}
                {engagementStats && engagementStats.rate > 2 ? (
                  <TrendingUp size={16} className="text-emerald-500" />
                ) : (
                  <TrendingUp size={16} className="text-gray-300" />
                )}
              </p>
            </div>
          </div>
          <TrafficChart data={trafficData} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {(user?.role === 'superadmin' || user?.role === 'wapimred') && (
            <ReviewQueue articles={reviewQueue} site={site} count={inReview} />
          )}
          {user?.role === 'superadmin' && (
            <>
              <KYCRequestsWidget requests={kycRequests} site={site} />
              <AuditLogsWidget logs={auditLogs} site={site} />
            </>
          )}
          <RecentActivity articles={recentActivityList} site={site} />
        </div>

        <div className="space-y-6">
          <CategoryPerformance catEntries={catEntries} catMax={catMax} />
          <TopContent topContent={topContent} site={site} />
          <QuickActions
            site={site}
            userRole={user?.role}
            context={{
              drafts,
              inReview,
              approved,
              revisions,
              kycPending: kycRequests.length,
            }}
          />
          
          <div className="dash-card p-6 text-center bg-gradient-to-br from-brand-red/5 to-violet-500/5 border-brand-red/10">
            <div className="w-10 h-10 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-3">
              <FileText size={16} className="text-brand-red" />
            </div>
            <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight mb-1">Bantuan Redaksi</p>
            <p className="text-[10px] text-gray-400 leading-relaxed mb-4">
              Kendala teknis atau pertanyaan editorial? Tim kami siap membantu.
            </p>
            <a
              href={`mailto:${supportEmail}?subject=${supportSubject}`}
              className="w-full py-2.5 bg-brand-red text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-700 transition-all inline-flex items-center justify-center"
            >
              Hubungi Support
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdvertiserDashboardOverview({ greeting, userName, site, currentDate }: { greeting: string, userName: string, site: string, currentDate: string }) {
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

function KYCRequestsWidget({ requests, site }: { requests: any[]; site: string }) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <ShieldCheck size={16} className="text-brand-red" />
          <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
            Antrean Verifikasi KYC Reporter/Kontributor ({requests.length})
          </h3>
        </div>
        <Link
          href={`/${site}/dashboard/review/kyc`}
          className="text-[10px] font-black uppercase tracking-widest text-brand-red hover:underline"
        >
          Lihat Semua →
        </Link>
      </div>
      <div className="p-6 divide-y divide-gray-50 dark:divide-white/5">
        {requests.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Tidak ada pengajuan verifikasi KYC baru.</p>
        ) : (
          requests.map((req) => (
            <div key={req.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black text-brand-black dark:text-white uppercase tracking-tight">{req.name}</p>
                <p className="text-[10px] text-gray-400 mt-0.5">{req.email}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[9px] font-bold text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded">
                  {req.kycSubmittedAt ? new Date(req.kycSubmittedAt).toLocaleDateString('id-ID') : '-'}
                </span>
                <Link
                  href={`/${site}/dashboard/review/kyc/${req.id}`}
                  className="px-3 py-1.5 bg-brand-red text-white text-[9px] font-black uppercase tracking-widest hover:bg-red-700 rounded transition-colors"
                >
                  Review
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function AuditLogsWidget({ logs, site }: { logs: any[]; site: string }) {
  return (
    <div className="dash-card">
      <div className="dash-card-header">
        <div className="flex items-center gap-2">
          <Activity size={16} className="text-brand-red" />
          <h3 className="text-sm font-black text-brand-black dark:text-white uppercase tracking-tight">
            Log Aktivitas Sistem Terkini
          </h3>
        </div>
      </div>
      <div className="p-6 divide-y divide-gray-50 dark:divide-white/5">
        {logs.length === 0 ? (
          <p className="text-xs text-gray-400 py-4 text-center">Tidak ada log aktivitas.</p>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-brand-black dark:text-white">
                  <span className="font-black uppercase tracking-wider text-[10px] text-brand-red mr-1.5">{log.action}</span>
                  {log.user?.name || log.userId}
                </p>
                <p className="text-[10px] text-gray-400 mt-0.5">Entity: {log.entityType || '-'} ({log.entityId || '-'})</p>
              </div>
              <span className="text-[9px] font-bold text-gray-400 tabular-nums">
                {new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
