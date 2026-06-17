import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventEmitter } from 'events'
import type { Response } from 'express'

vi.mock('../lib/monitoring', () => ({
  metrics: {
    record: vi.fn(),
  },
}))

import { performanceMiddleware } from './performance.middleware'
import { metrics } from '../lib/monitoring'
import { mockReq, mockNext } from '../test/fixtures'

describe('performanceMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('memanggil next() segera', () => {
    const req = mockReq()
    const res = new EventEmitter() as unknown as Response
    res.statusCode = 200
    const next = mockNext()

    performanceMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('mencatat metrics saat response selesai', () => {
    const req = mockReq({ method: 'GET', path: '/api/v1/articles', route: { path: '/api/v1/articles' } })
    const res = new EventEmitter() as unknown as Response
    res.statusCode = 200
    const next = mockNext()

    performanceMiddleware(req, res, next)

    // Simulate response finish
    res.emit('finish')

    expect(metrics.record).toHaveBeenCalledWith(
      'GET /api/v1/articles',
      expect.any(Number),
      false
    )
  })

  it('menandai error jika status >= 400', () => {
    const req = mockReq({ method: 'POST', path: '/api/v1/auth/login' })
    const res = new EventEmitter() as unknown as Response
    res.statusCode = 401
    const next = mockNext()

    performanceMiddleware(req, res, next)

    res.emit('finish')

    expect(metrics.record).toHaveBeenCalledWith(
      'POST /api/v1/auth/login',
      expect.any(Number),
      true
    )
  })

  it('fallback ke req.path jika req.route tidak ada', () => {
    const req = mockReq({ method: 'GET', path: '/unknown' })
    const res = new EventEmitter() as unknown as Response
    res.statusCode = 200
    const next = mockNext()

    performanceMiddleware(req, res, next)

    res.emit('finish')

    expect(metrics.record).toHaveBeenCalledWith(
      'GET /unknown',
      expect.any(Number),
      false
    )
  })
})
