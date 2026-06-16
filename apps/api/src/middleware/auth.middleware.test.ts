import { describe, it, expect, vi, beforeEach } from 'vitest'
import jwt from 'jsonwebtoken'
import { requireAuth, requireRole, requireSuperadmin } from './auth.middleware'
import { mockReq, mockRes, mockNext, mockJWTPayload } from '../test/fixtures'

describe('requireAuth', () => {
  it('meloloskan request yang memiliki req.user', () => {
    const req = mockReq({ user: mockJWTPayload() })
    const res = mockRes()
    const next = mockNext()

    requireAuth(req, res, next)

    expect(next).toHaveBeenCalled()
    expect(res.body).toBeNull()
  })

  it('menolak request tanpa req.user dan tanpa error (UNAUTHORIZED)', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
    expect(next).not.toHaveBeenCalled()
  })

  it('menolak request dengan TokenExpiredError', () => {
    const expiredError = new jwt.TokenExpiredError('jwt expired', new Date())
    const req = mockReq({ authError: expiredError })
    const res = mockRes()
    const next = mockNext()

    requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body.error.code).toBe('TOKEN_EXPIRED')
  })

  it('menolak request dengan error token invalid', () => {
    const invalidError = new Error('invalid token')
    const req = mockReq({ authError: invalidError })
    const res = mockRes()
    const next = mockNext()

    requireAuth(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body.error.code).toBe('INVALID_TOKEN')
  })
})

describe('requireRole', () => {
  it('meloloskan user dengan role yang sesuai', () => {
    const middleware = requireRole(['reporter', 'wapimred'])
    const req = mockReq({ user: mockJWTPayload({ role: 'reporter' }) })
    const res = mockRes()
    const next = mockNext()

    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('menolak user dengan role yang tidak sesuai (403)', () => {
    const middleware = requireRole(['superadmin'])
    const req = mockReq({ user: mockJWTPayload({ role: 'reporter' }) })
    const res = mockRes()
    const next = mockNext()

    middleware(req, res, next)

    expect(res.statusCode).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
    expect(next).not.toHaveBeenCalled()
  })

  it('menolak request tanpa user (401)', () => {
    const middleware = requireRole(['reporter'])
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    middleware(req, res, next)

    expect(res.statusCode).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('mendukung multiple roles', () => {
    const middleware = requireRole(['reporter', 'kontributor', 'wapimred'])
    const req = mockReq({ user: mockJWTPayload({ role: 'kontributor' }) })
    const res = mockRes()
    const next = mockNext()

    middleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })
})

describe('requireSuperadmin', () => {
  it('meloloskan superadmin', () => {
    const req = mockReq({ user: mockJWTPayload({ role: 'superadmin' }) })
    const res = mockRes()
    const next = mockNext()

    requireSuperadmin(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('menolak non-superadmin (403)', () => {
    const req = mockReq({ user: mockJWTPayload({ role: 'wapimred' }) })
    const res = mockRes()
    const next = mockNext()

    requireSuperadmin(req, res, next)

    expect(res.statusCode).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })

  it('menolak request tanpa user (401)', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    requireSuperadmin(req, res, next)

    expect(res.statusCode).toBe(401)
  })
})
