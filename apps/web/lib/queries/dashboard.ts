import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

// ─── Types ──────────────────────────────────────────────────────────
export interface Article {
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

export interface TrafficDataPoint {
  date: string;
  views: number;
}

export interface TopContentItem {
  id: string;
  title: string;
  slug?: string;
  views?: number;
  viewCount?: number;
  category?: { name?: string };
  categories?: {
    category?: {
      name?: string;
    };
  }[];
}

export interface EngagementStats {
  rate: number;
  [key: string]: unknown;
}

export interface ArticleStats {
  draft?: number;
  submitted?: number;
  review?: number;
  approved?: number;
  scheduled?: number;
  published?: number;
  revision?: number;
}

export interface GA4Data {
  date: string;
  sessions: number;
  pageviews: number;
}

export interface GA4Audience {
  totalUsers: number;
  totalSessions: number;
  avgSessionDuration: number;
  bounceRate: number;
  realtimeUsers?: number;
  sources: { source: string; sessions: number; percentage: number }[];
}

export interface GA4Realtime {
  activeUsers: number;
}

export interface GSCPerformance {
  totalImpressions: number;
  totalClicks: number;
  avgCtr: number;
  avgPosition: number;
  overTime: { date: string; impressions: number; clicks: number; ctr: number; position: number }[];
}

export interface GSCQuery {
  query: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface GSCPage {
  page: string;
  impressions: number;
  clicks: number;
  ctr: number;
  position: number;
}

export interface KYCRequest {
  id: string;
  name: string;
  email: string;
  kycSubmittedAt?: string | null;
  userId?: string;
  status?: string;
  createdAt?: string;
  user?: { name?: string; email?: string };
}

export interface AuditLog {
  id: string;
  action: string;
  userId: string;
  createdAt: string;
  user?: { name?: string };
  entityType?: string;
  entityId?: string;
  details?: string;
}

// ─── Query Keys ─────────────────────────────────────────────────────
export const queryKeys = {
  articles: (site: string, params?: Record<string, unknown>) => ['articles', site, params] as const,
  articleStats: (site: string) => ['articleStats', site] as const,
  traffic: (site: string, days: number) => ['traffic', site, days] as const,
  topContent: (site: string) => ['topContent', site] as const,
  engagement: (site: string) => ['engagement', site] as const,
  ga4Traffic: (site: string, days: number) => ['ga4Traffic', site, days] as const,
  ga4Audience: (site: string, days: number) => ['ga4Audience', site, days] as const,
  ga4Realtime: (site: string) => ['ga4Realtime', site] as const,
  gscPerformance: (site: string, days: number) => ['gscPerformance', site, days] as const,
  gscQueries: (site: string) => ['gscQueries', site] as const,
  gscPages: (site: string) => ['gscPages', site] as const,
  kycRequests: (site: string) => ['kycRequests', site] as const,
  auditLogs: (site: string) => ['auditLogs', site] as const,
};

// ─── Core Fetch Functions ────────────────────────────────────────────
async function fetchJSON<T>(url: string, params?: Record<string, unknown>): Promise<T> {
  const res = await api.get<T>(url, { params });
  return res.data;
}

// ─── Dashboard Queries ───────────────────────────────────────────────

/**
 * Get articles list with caching
 * @param site - Site ID
 * @param params - Query params (limit, status, etc)
 */
export function useArticles(site: string, params?: { limit?: number; status?: string }) {
  return useQuery({
    queryKey: queryKeys.articles(site, params),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: { articles?: Article[]; items?: Article[] } }>(
        '/articles',
        { ...params, site }
      ).then((res) => res.data?.articles || res.data?.items || []),
    enabled: !!site,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

/**
 * Get article statistics
 * @param site - Site ID
 */
export function useArticleStats(site: string) {
  return useQuery({
    queryKey: queryKeys.articleStats(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: ArticleStats }>('/articles/stats', { site }).then(
        (res) => res.data || {}
      ),
    enabled: !!site,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get internal traffic data
 * @param site - Site ID
 * @param days - Number of days to fetch
 */
export function useTraffic(site: string, days = 7) {
  return useQuery({
    queryKey: queryKeys.traffic(site, days),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: TrafficDataPoint[] }>('/analytics/traffic', {
        days,
        site,
      }).then((res) => (Array.isArray(res.data) ? res.data : [])),
    enabled: !!site,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get top content
 * @param site - Site ID
 */
export function useTopContent(site: string) {
  return useQuery({
    queryKey: queryKeys.topContent(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: TopContentItem[] }>('/analytics/top-content', {
        limit: 5,
        site,
      }).then((res) => res.data || []),
    enabled: !!site,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Get engagement stats
 * @param site - Site ID
 */
export function useEngagement(site: string) {
  return useQuery({
    queryKey: queryKeys.engagement(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: EngagementStats }>('/analytics/engagement', {
        site,
      }).then((res) => res.data),
    enabled: !!site,
    staleTime: 5 * 60 * 1000,
  });
}

// ─── GA4 Queries ─────────────────────────────────────────────────────

/**
 * Get GA4 traffic data
 * @param site - Site ID
 * @param days - Number of days
 */
export function useGA4Traffic(site: string, days = 7) {
  return useQuery({
    queryKey: queryKeys.ga4Traffic(site, days),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: GA4Data[]; message?: string; error?: string }>(
        '/analytics/ga4/traffic',
        { days, site }
      ).then((res) => ({
        data: res.data || [],
        isConfigured: !res.message?.includes('tidak dikonfigurasi'),
        error: res.success ? null : res.error || res.message || 'Gagal memuat data GA4',
      })),
    enabled: !!site,
    staleTime: 10 * 60 * 1000, // 10 minutes for external API data
    retry: 2,
  });
}

/**
 * Get GA4 audience data
 * @param site - Site ID
 * @param days - Number of days
 */
export function useGA4Audience(site: string, days = 7) {
  return useQuery({
    queryKey: queryKeys.ga4Audience(site, days),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: GA4Audience }>('/analytics/ga4/audience', {
        days,
        site,
      }).then((res) => res.data),
    enabled: !!site,
    staleTime: 10 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Get GA4 realtime data
 * @param site - Site ID
 */
export function useGA4Realtime(site: string) {
  return useQuery({
    queryKey: queryKeys.ga4Realtime(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: GA4Realtime }>('/analytics/ga4/realtime', {
        site,
      }).then((res) => res.data),
    enabled: !!site,
    // Refetch every 30 seconds for realtime data
    refetchInterval: 30 * 1000,
    staleTime: 15 * 1000,
    retry: 2,
  });
}

// ─── GSC Queries ────────────────────────────────────────────────────

/**
 * Get GSC performance data
 * @param site - Site ID
 * @param days - Number of days
 */
export function useGSCPerformance(site: string, days = 28) {
  return useQuery({
    queryKey: queryKeys.gscPerformance(site, days),
    queryFn: () =>
      fetchJSON<{
        success: boolean;
        data: GSCPerformance;
        message?: string;
        error?: string;
      }>('/analytics/gsc/performance', { days, site }).then((res) => ({
        data: res.data,
        isConfigured: !res.message?.includes('tidak dikonfigurasi'),
        error: res.success ? null : res.error || res.message || 'Gagal memuat data Search Console',
      })),
    enabled: !!site,
    staleTime: 15 * 60 * 1000, // 15 minutes for GSC data
    retry: 2,
  });
}

/**
 * Get GSC top queries
 * @param site - Site ID
 */
export function useGSCQueries(site: string) {
  return useQuery({
    queryKey: queryKeys.gscQueries(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: GSCQuery[] }>('/analytics/gsc/queries', {
        limit: 10,
        site,
      }).then((res) => res.data || []),
    enabled: !!site,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });
}

/**
 * Get GSC top pages
 * @param site - Site ID
 */
export function useGSCPages(site: string) {
  return useQuery({
    queryKey: queryKeys.gscPages(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: GSCPage[] }>('/analytics/gsc/pages', {
        limit: 10,
        site,
      }).then((res) => res.data || []),
    enabled: !!site,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });
}

// ─── Admin Queries ──────────────────────────────────────────────────

/**
 * Get KYC requests (superadmin only)
 * @param site - Site ID
 */
export function useKYCRequests(site: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.kycRequests(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: KYCRequest[] }>('/kyc', {
        status: 'pending',
        limit: 5,
        site,
      }).then((res) => res.data || []),
    enabled: !!site && enabled,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Get audit logs (superadmin only)
 * @param site - Site ID
 */
export function useAuditLogs(site: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.auditLogs(site),
    queryFn: () =>
      fetchJSON<{ success: boolean; data: { items?: AuditLog[] } }>('/audit', {
        limit: 5,
        site,
      }).then((res) => res.data?.items || []),
    enabled: !!site && enabled,
    staleTime: 1 * 60 * 1000, // 1 minute
  });
}

// ─── Combined Dashboard Query ───────────────────────────────────────

export interface DashboardData {
  // Core data
  articles: Article[];
  articlesIsLoading: boolean;
  articlesError: unknown;
  
  articleStats: ArticleStats;
  
  trafficData: TrafficDataPoint[];
  trafficIsLoading: boolean;
  
  topContent: TopContentItem[];
  
  engagementStats: EngagementStats | null;
  
  // GA4 data
  ga4Traffic: GA4Data[];
  ga4Audience: GA4Audience | null;
  ga4Realtime: GA4Realtime | null;
  isGa4Configured: boolean;
  ga4Error: string | null;
  
  // GSC data
  gscPerformance: GSCPerformance | null;
  gscQueries: GSCQuery[];
  gscPages: GSCPage[];
  isGscConfigured: boolean;
  gscError: string | null;
  
  // Admin data
  kycRequests: KYCRequest[];
  auditLogs: AuditLog[];
  
  // Overall loading state
  isLoading: boolean;
}

/**
 * Combined dashboard data hook - fetches all core dashboard data in parallel
 * Uses React Query's built-in deduplication and caching
 * 
 * @param site - Site ID
 * @param userRole - Current user role for conditional queries
 */
export function useDashboardData(site: string, userRole?: string): DashboardData {
  // Core queries that run for all users
  const coreQueries = {
    articles: useArticles(site, { limit: 50 }),
    articleStats: useArticleStats(site),
    traffic: useTraffic(site, 7),
    topContent: useTopContent(site),
    engagement: useEngagement(site),
  };

  // GA4/GSC queries (run independently, fire-and-forget style)
  const analyticsQueries = {
    ga4Traffic: useGA4Traffic(site, 7),
    ga4Audience: useGA4Audience(site, 7),
    ga4Realtime: useGA4Realtime(site),
    gscPerformance: useGSCPerformance(site, 28),
    gscQueries: useGSCQueries(site),
    gscPages: useGSCPages(site),
  };

  // Admin-only queries - run unconditionally, controlled by enabled flag
  const kycRequestsQuery = useKYCRequests(site, userRole === 'superadmin');
  const auditLogsQuery = useAuditLogs(site, userRole === 'superadmin');

  return {
    // Core data
    articles: coreQueries.articles.data ?? [],
    articlesIsLoading: coreQueries.articles.isLoading,
    articlesError: coreQueries.articles.error,
    
    articleStats: coreQueries.articleStats.data ?? {},
    
    trafficData: coreQueries.traffic.data ?? [],
    trafficIsLoading: coreQueries.traffic.isLoading,
    
    topContent: coreQueries.topContent.data ?? [],
    
    engagementStats: coreQueries.engagement.data ?? null,
    
    // GA4 data
    ga4Traffic: analyticsQueries.ga4Traffic.data?.data ?? [],
    ga4Audience: analyticsQueries.ga4Audience.data ?? null,
    ga4Realtime: analyticsQueries.ga4Realtime.data ?? null,
    isGa4Configured: analyticsQueries.ga4Traffic.data?.isConfigured ?? false,
    ga4Error: analyticsQueries.ga4Traffic.data?.error ?? null,
    
    // GSC data
    gscPerformance: analyticsQueries.gscPerformance.data?.data ?? null,
    gscQueries: analyticsQueries.gscQueries.data ?? [],
    gscPages: analyticsQueries.gscPages.data ?? [],
    isGscConfigured: analyticsQueries.gscPerformance.data?.isConfigured ?? false,
    gscError: analyticsQueries.gscPerformance.data?.error ?? null,
    
    // Admin data - always return arrays, even if not admin (empty arrays)
    kycRequests: kycRequestsQuery?.data ?? [],
    auditLogs: auditLogsQuery?.data ?? [],
    
    // Overall loading state
    isLoading: coreQueries.articles.isLoading || coreQueries.articleStats.isLoading,
  };
}

// ─── Mutations (for data updates) ─────────────────────────────────

/**
 * Invalidate dashboard queries - call after article create/update/delete
 */
export function useInvalidateDashboardQueries() {
  const queryClient = useQueryClient();
  
  return (site: string) => {
    // Invalidate all dashboard-related queries
    queryClient.invalidateQueries({ queryKey: ['articles', site] });
    queryClient.invalidateQueries({ queryKey: ['articleStats', site] });
    queryClient.invalidateQueries({ queryKey: ['topContent', site] });
    queryClient.invalidateQueries({ queryKey: ['engagement', site] });
    queryClient.invalidateQueries({ queryKey: ['traffic', site] });
  };
}