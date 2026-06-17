import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../db/client', () => ({
  prisma: {
    site: { findMany: vi.fn() },
  },
}))

vi.mock('@beritakarya/config', () => ({
  KNOWN_SITE_IDS: ['bandung', 'pusat'],
}))

import { siteMiddleware, requireSiteAccess } from './site.middleware'
import { prisma } from '../db/client'
import { mockReq, mockRes, mockNext, mockJWTPayload } from '../test/fixtures'

describe('siteMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(prisma.site.findMany).mockResolvedValue([
      { id: 'bandung' },
      { id: 'pusat' },
    ] as unknown as Awaited<ReturnType<typeof prisma.site.findMany>>)
  })

  it('meloloskan siteId yang valid dari query param', async () => {
    const req = mockReq({ query: { site: 'bandung' } })
    const res = mockRes()
    const next = mockNext()

    await siteMiddleware(req, res, next)

    expect(req.site).toBe('bandung')
    expect(next).toHaveBeenCalled()
  })

  it('meloloskan siteId dari header x-site-id', async () => {
    const req = mockReq({ headers: { 'x-site-id': 'bandung' } })
    const res = mockRes()
    const next = mockNext()

    await siteMiddleware(req, res, next)

    expect(req.site).toBe('bandung')
    expect(next).toHaveBeenCalled()
  })

  it('menolak request tanpa siteId (400)', async () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    await siteMiddleware(req, res, next)

    expect(res.statusCode).toBe(400)
    expect(res.body.error!.code).toBe('SITE_REQUIRED')
    expect(next).not.toHaveBeenCalled()
  })

  it('meloloskan site "pusat" selalu', async () => {
    const req = mockReq({ query: { site: 'pusat' } })
    const res = mockRes()
    const next = mockNext()

    await siteMiddleware(req, res, next)

    expect(req.site).toBe('pusat')
    expect(next).toHaveBeenCalled()
  })

  it('meloloskan site "all" selalu', async () => {
    const req = mockReq({ query: { site: 'all' } })
    const res = mockRes()
    const next = mockNext()

    await siteMiddleware(req, res, next)

    expect(req.site).toBe('all')
    expect(next).toHaveBeenCalled()
  })
})

describe('requireSiteAccess', () => {
  it('meloloskan reporter yang mengakses site sendiri', () => {
    const req = mockReq({
      user: mockJWTPayload({ role: 'reporter', siteId: 'bandung' }),
      site: 'bandung',
    })
    const res = mockRes()
    const next = mockNext()

    requireSiteAccess(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('menolak reporter yang mengakses site lain (403)', () => {
    const req = mockReq({
      user: mockJWTPayload({ role: 'reporter', siteId: 'bandung' }),
      site: 'pusat',
    })
    const res = mockRes()
    const next = mockNext()

    requireSiteAccess(req, res, next)

    expect(res.statusCode).toBe(403)
    expect(res.body.error!.code).toBe('SITE_FORBIDDEN')
  })

  it('meloloskan superadmin ke semua site', () => {
    const req = mockReq({
      user: mockJWTPayload({ role: 'superadmin', siteId: 'pusat' }),
      site: 'bandung',
    })
    const res = mockRes()
    const next = mockNext()

    requireSiteAccess(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('menolak request tanpa user (401)', () => {
    const req = mockReq({ site: 'bandung' })
    const res = mockRes()
    const next = mockNext()

    requireSiteAccess(req, res, next)

    expect(res.statusCode).toBe(401)
  })
})
