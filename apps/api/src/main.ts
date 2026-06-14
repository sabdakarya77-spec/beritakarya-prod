import 'dotenv/config'
import * as Sentry from '@sentry/node'
import { env } from './lib/env'
import './lib/envValidation'
import express from 'express'
import cors, { type CorsOptions } from 'cors'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { specs } from './swagger'
import { authRouter } from './modules/auth/auth.controller'
import { userRouter } from './modules/user/user.controller'
import { articleRouter } from './modules/article/article.controller'
import { mediaRouter } from './modules/media/media.controller'
import { aiRouter } from './ai/ai.controller'
import { adRouter } from './modules/ad/ad.controller'
import { newsletterRouter } from './modules/newsletter/newsletter.controller'
import { auditRouter } from './modules/audit/audit.controller'
import { analyticsRouter } from './modules/analytics/analytics.controller'
import { notificationRouter } from './modules/notification/notification.controller'
import { commentRouter } from './modules/comment/comment.controller'
import { kycRouter } from './modules/kyc/kyc.controller'
import { invitationRouter } from './modules/invitation/invitation.controller'
import adminRouter from './admin/admin.router'
import { marketRouter } from './modules/market/market.controller'
import { cronRouter } from './cron/cron.router'
import timeout from 'connect-timeout'
import { requestIdMiddleware } from './middleware/requestId.middleware'
import { errorMiddleware } from './middleware/error.middleware'
import { sanitizeMiddleware } from './middleware/sanitize.middleware'
import { securityHeadersMiddleware } from './middleware/security.middleware'
import { performanceMiddleware } from './middleware/performance.middleware'
import { jwtVerify } from './middleware/jwtVerification.middleware'
import { requireAuth, requireRole, requireSuperadmin } from './middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from './middleware/site.middleware'
import { authLimiter, apiLimiter, publicLimiter } from './lib/rateLimit'
import { prisma } from './db/client'
import { logger, httpLogger } from './lib/logger'
import { metrics } from './lib/monitoring'
import { asyncHandler } from './utils/asyncHandler'
import cookieParser from 'cookie-parser'
import { getMeilisearchCircuitStatus } from './modules/article/search.service'

// Import global type augmentation (must be before other imports)
import './types/express'

// Import modular routers
import { categoryRouter } from './modules/category/category.controller'
import { siteRouter } from './modules/site/site.controller'

// ─── Sentry ───────────────────────────────────────────────────────────────────

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: 0.1,
    beforeSend(event) {
      if (event.request) {
        if (event.request.headers?.authorization) event.request.headers.authorization = '[REDACTED]'
        if (event.request.headers?.cookie) event.request.headers.cookie = '[REDACTED]'
      }
      return event
    },
  })
}

// ─── Express App ──────────────────────────────────────────────────────────────

export const app = express()
app.set('trust proxy', env.TRUST_PROXY || 'loopback, linklocal, uniquelocal')

// Request timeout (30s) — for long-running endpoints
app.use(timeout('30s'))
app.use((req, _res, next) => { if (!req.timedout) next() })

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs))

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}))

const allowedOrigins: (string | RegExp)[] = [
  /^https?:\/\/(.+\.)?beritakarya\.co$/,
  /^https?:\/\/(.+\.)?beritakarya\.com$/,
  /^https?:\/\/(.+\.)?vercel\.app$/,
  'http://localhost:3000',
  'http://localhost:3001',
]

if (env.CORS_ORIGIN) {
  env.CORS_ORIGIN.split(',').forEach((o) => allowedOrigins.push(o.trim()))
}

const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true)
    const allowed = allowedOrigins.some((o) =>
      typeof o === 'string' ? o === origin : o.test(origin)
    )
    if (allowed) callback(null, true)
    else callback(new Error(`Origin '${origin}' tidak diizinkan oleh CORS`))
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'X-Site-ID',
    'x-site-id',
    'X-API-Key',
    'x-api-key',
  ],
  exposedHeaders: ['X-Request-ID'],
  maxAge: 86400,
}

app.options('*', cors(corsOptions))
app.use(cors(corsOptions))

app.use(securityHeadersMiddleware)
app.use(cookieParser())
app.use(jwtVerify)
app.use(express.json({ limit: '10mb' }))
app.use(sanitizeMiddleware)
app.use(requestIdMiddleware)
app.use(httpLogger)
app.use(performanceMiddleware)

// Rate limiting (auth has its own limiter)
app.use('/api/v1', (req, res, next) => {
  if (req.path.startsWith('/auth')) return next()
  return apiLimiter(req, res, next)
})

// ─── Routes ───────────────────────────────────────────────────────────────────

app.use('/api/v1/auth', authLimiter, authRouter)
app.use('/api/v1/users', userRouter)
app.use('/api/v1/articles', articleRouter)
app.use('/api/v1/media', mediaRouter)
app.use('/api/v1/ai', aiRouter)

app.use('/api/v1/categories', categoryRouter)
app.use('/api/v1/sites', siteRouter)

app.use('/api/v1/ads', adRouter)
app.use('/api/v1/newsletter', newsletterRouter)
app.use('/api/v1/audit', auditRouter)
app.use('/api/v1/analytics', analyticsRouter)
app.use('/api/v1/notifications', notificationRouter)
app.use('/api/v1/comments', commentRouter)
app.use('/api/v1/kyc', kycRouter)
app.use('/api/v1/invitations', invitationRouter)
app.use('/api/v1/admin', adminRouter)
app.use('/api/v1/market', publicLimiter, marketRouter)

// Cron endpoints (called by Vercel Cron Jobs)
app.use('/api/cron', cronRouter)

// ─── Health & Metrics ─────────────────────────────────────────────────────────

app.get('/health', asyncHandler(async (_, res) => {
  let databaseHealth = false
  try {
    await prisma.$queryRaw`SELECT 1`
    databaseHealth = true
  } catch (e) {
    logger.error('Database health check failed:', e)
  }

  const meilisearchCircuit = getMeilisearchCircuitStatus()
  const meilisearchDegraded = Object.values(meilisearchCircuit).some(
    (s) => s.enabled && s.state === 'open'
  )

  const status = databaseHealth ? (meilisearchDegraded ? 'degraded' : 'healthy') : 'unhealthy'
  res.status(databaseHealth ? 200 : 503).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseHealth ? 'healthy' : 'unhealthy',
      meilisearch: {
        status: meilisearchDegraded ? 'degraded' : 'healthy',
        circuitBreakers: meilisearchCircuit,
      },
    },
  })
}))

app.get('/metrics', requireSuperadmin, (_, res) => {
  res.json({
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    metrics: metrics.getSummary(),
    timestamp: new Date().toISOString(),
  })
})

app.use(errorMiddleware)

if (env.SENTRY_DSN) {
  process.on('uncaughtException', (error) => {
    Sentry.captureException(error)
    Sentry.close()
    process.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    Sentry.captureException(reason)
    Sentry.close()
    process.exit(1)
  })
} else {
  // Always register global error handlers (M14)
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception:', error)
    process.exit(1)
  })
  process.on('unhandledRejection', (reason) => {
    logger.error('Unhandled Rejection:', reason)
    process.exit(1)
  })
}

// ─── Server Start (local only) ────────────────────────────────────────────────
// Di Vercel, file api/index.ts mengekspor `app` langsung sebagai serverless function.
// `app.listen()` HANYA dipanggil saat berjalan secara lokal (bukan di lingkungan Vercel).

if (!process.env.VERCEL) {
  const PORT = env.PORT

  const server = app.listen(PORT, () => {
    logger.info(`API berjalan di http://localhost:${PORT}`)
    logger.info(`Swagger Docs: http://localhost:${PORT}/api-docs`)
  })

  // ── Graceful Shutdown ────────────────────────────────────────────────────────

  const shutdown = async (signal: string) => {
    logger.info(`${signal} received, shutting down gracefully`)
    try {
      await prisma.$disconnect()
      server.close(() => {
        logger.info('Server closed')
        process.exit(0)
      })
    } catch (error) {
      logger.error('Error during graceful shutdown:', error)
      process.exit(1)
    }
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}