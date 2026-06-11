import axios from 'axios'

// Gunakan relative path di browser untuk mendukung Next.js API rewrites (mencegah isu cross-domain cookies)
const API_URL = typeof window !== 'undefined'
  ? ''
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001')

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true
})

api.interceptors.request.use(async (config) => {
  if (typeof window !== 'undefined') {
    // [FIX-MULTISITE] Baca site dari cookie (dikelola proxy.ts)
    let siteId = document.cookie
      .split('; ')
      .find(r => r.startsWith('siteId='))
      ?.split('=')[1]

    // [FIX-MULTISITE] Fallback: ekstrak site dari URL path.
    // Mis. /nganjuk/dashboard → 'nganjuk'. Ini safety net kalau
    // cookie siteId di browser stale atau belum di-set (mis. test
    // path-based routing di localhost tanpa subdomain).
    if (!siteId) {
      const pathSegments = window.location.pathname.split('/').filter(Boolean)
      const RESERVED = new Set([
        'login', 'register', 'forgot-password', 'reset-password',
        'sitemap.xml', 'robots.txt', 'dashboard',
        'api', '_next', 'favicon.ico',
      ])
      const SITE_SUBPATHS = new Set([
        'dashboard', 'artikel', 'penulis', 'p', 'kebijakan-privasi',
      ])
      if (pathSegments.length > 0) {
        const firstSeg = pathSegments[0]
        if (firstSeg && /^[a-zA-Z0-9-]+$/.test(firstSeg)) {
          if (pathSegments.length === 1 && !RESERVED.has(firstSeg)) {
            siteId = firstSeg
          } else if (pathSegments.length >= 2 && SITE_SUBPATHS.has(pathSegments[1])) {
            siteId = firstSeg
          }
        }
      }
    }

    const isAuthRoute = config.url?.startsWith('/auth/') || config.url?.includes('/auth/')
    if (siteId && !isAuthRoute) {
      config.headers['X-Site-ID'] = siteId
      if (!config.params) config.params = {}
      if (!config.params.site) {
        config.params.site = siteId
      }
    }
  }
  return config
})

// Mutex untuk mencegah multiple refresh calls bersamaan
let isRefreshing = false
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: unknown) => void }> = []

// Retry limit untuk token refresh (mencegah infinite loops)
let refreshRetryCount = 0
const MAX_REFRESH_RETRIES = 3

const processQueue = (error: unknown) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve()
    }
  })
  failedQueue = []
}

// Daftar endpoint auth yang TIDAK boleh trigger auto-refresh
// karena kegagalannya sudah di-handle langsung oleh pemanggil
const AUTH_SKIP_REFRESH_URLS = [
  '/auth/me',
  '/auth/refresh',
  '/auth/login',
  '/auth/register',
  '/users/heartbeat'
]

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config

    // Enhanced logging untuk debugging
    if (error.response?.status === 401) {
      console.warn('[AUTH] 401 Unauthorized:', {
        url: original.url,
        method: original.method,
        errorCode: error.response?.data?.error?.code,
        hasToken: !!document.cookie.includes('accessToken')
      })
    }

    // Log 403 responses for diagnostic
    if (error.response?.status === 403) {
      const errorCode = error.response?.data?.error?.code
      const errorMessage = error.response?.data?.error?.message
      console.warn('[AUTH] 403 Forbidden:', {
        url: original.url,
        method: original.method,
        errorCode: errorCode,
        errorMessage: errorMessage,
      })
    }

    // Jangan auto-refresh untuk auth endpoints — biarkan callernya yang handle
    const isAuthEndpoint = AUTH_SKIP_REFRESH_URLS.some(url => original.url?.includes(url))

    if (error.response?.status === 401 && !original._retry && !isAuthEndpoint) {
      // Check retry limit untuk mencegah infinite loops
      if (refreshRetryCount >= MAX_REFRESH_RETRIES) {
        console.error('[AUTH] Max refresh retries exceeded, clearing state')
        refreshRetryCount = 0
        // Trigger logout via clearing auth state
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('auth:session-expired'))
        }
        return Promise.reject(error)
      }

      if (isRefreshing) {
        // Sudah ada refresh yang sedang berjalan, antri request ini
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(() => api(original))
      }

      original._retry = true
      isRefreshing = true
      refreshRetryCount++

      try {
        await axios.post(`${API_URL}/api/v1/auth/refresh`, {}, { withCredentials: true })
        refreshRetryCount = 0 // Reset on success
        processQueue(null)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError)
        console.warn(`[AUTH] Token refresh failed (attempt ${refreshRetryCount}/${MAX_REFRESH_RETRIES})`)
        // Jangan redirect di sini — biarkan komponen/store yang menangani
        // Ini mencegah redirect loop pada halaman publik
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)
