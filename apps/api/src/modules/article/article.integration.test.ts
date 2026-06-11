import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import express from 'express'
import jwt from 'jsonwebtoken'
import { articleRouter } from './article.controller'
import { errorMiddleware } from '../../middleware/error.middleware'

vi.mock('./article.service')
vi.mock('../../lib/rateLimit', () => ({
  apiLimiter: (_: any, __: any, n: any) => n(),
  articleWriteLimiter: (_: any, __: any, n: any) => n(),
  articleUpdateLimiter: (_: any, __: any, n: any) => n()
}))
vi.mock('../../middleware/site.middleware', () => ({
  siteMiddleware: (req: any, _: any, next: any) => {
    req.site = (req.query.site as string) || 'bandung'
    next()
  },
  requireSiteAccess: (req: any, res: any, next: any) => {
    if (!req.user) return next()
    if (['reporter', 'kontributor'].includes(req.user.role) && req.user.siteId !== req.site) {
      return res.status(403).json({ success: false, error: { code: 'SITE_FORBIDDEN', message: 'Akses ditolak' } })
    }
    next()
  }
}))
vi.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (req: any, res: any, next: any) => {
    const auth = req.headers.authorization
    if (!auth) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED' } })
    }
    const token = auth.replace('Bearer ', '')
    // Decode without verification for test isolation
    const parts = token.split('.')
    req.user = JSON.parse(Buffer.from(parts[1], 'base64').toString())
    next()
  }
}))

import * as articleService from './article.service'

const app = express()
app.use(express.json())
app.use('/api/v1/articles', articleRouter)
app.use(errorMiddleware)

function makeToken(payload: object) {
  return jwt.sign(payload, 'test-secret-key-minimal-32-chars-long', { expiresIn: '1h' })
}

const tokenBandung  = makeToken({ userId: 'u-1', role: 'reporter', siteId: 'bandung' })
const tokenEditor   = makeToken({ userId: 'u-3', role: 'wapimred',     siteId: null })

const mockArticles = {
  items: [{ id: 'a-1', title: 'Test', status: 'draft', siteId: 'bandung' }],
  total: 1, page: 1, limit: 20, totalPages: 1
}

describe('Multi-site isolation — GET /articles', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('reporter bandung BISA akses site bandung', async () => {
    vi.mocked(articleService.getArticles).mockResolvedValue(mockArticles as any)
    const res = await request(app)
      .get('/api/v1/articles?site=bandung')
      .set('Authorization', `Bearer ${tokenBandung}`)
    
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })

  it('reporter bandung TIDAK BISA akses site surabaya → 403', async () => {
    const res = await request(app)
      .get('/api/v1/articles?site=surabaya')
      .set('Authorization', `Bearer ${tokenBandung}`)
    
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('SITE_FORBIDDEN')
  })

  it('wapimred pusat BISA akses site manapun', async () => {
    vi.mocked(articleService.getArticles).mockResolvedValue(mockArticles as any)
    const res = await request(app)
      .get('/api/v1/articles?site=surabaya')
      .set('Authorization', `Bearer ${tokenEditor}`)
    
    expect(res.status).toBe(200)
  })

  it('request tanpa token → 401', async () => {
    const res = await request(app).get('/api/v1/articles?site=bandung')
    expect(res.status).toBe(401)
  })
})

describe('Public article route — GET /articles/slug/:slug', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('mengembalikan artikel published tanpa token', async () => {
    vi.mocked(articleService.getPublishedArticleBySlug).mockResolvedValue({
      id: 'a-1',
      title: 'Artikel Publik',
      slug: 'artikel-publik',
      status: 'published',
      siteId: 'bandung'
    } as any)

    const res = await request(app).get('/api/v1/articles/slug/artikel-publik?site=bandung')

    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
  })
})
