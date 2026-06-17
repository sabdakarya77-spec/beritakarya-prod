import { describe, it, expect, vi } from 'vitest'

vi.mock('../lib/env', () => ({
  env: { NODE_ENV: 'test' },
}))

import { securityHeadersMiddleware } from './security.middleware'
import { mockReq, mockRes, mockNext } from '../test/fixtures'

describe('securityHeadersMiddleware', () => {
  it('mengatur semua security headers', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    securityHeadersMiddleware(req, res, next)

    expect(res.headers['X-Frame-Options']).toBe('DENY')
    expect(res.headers['X-Content-Type-Options']).toBe('nosniff')
    expect(res.headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin')
    expect(res.headers['Strict-Transport-Security']).toContain('max-age=')
    expect(res.headers['X-XSS-Protection']).toBe('1; mode=block')
    expect(res.headers['Content-Security-Policy']).toBeDefined()
  })

  it('mengatur CSP dengan unsafe-inline untuk non-production', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    securityHeadersMiddleware(req, res, next)

    const csp = res.headers['Content-Security-Policy']
    expect(csp).toContain("'unsafe-inline'")
    expect(csp).toContain("'unsafe-eval'")
  })

  it('memanggil next()', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    securityHeadersMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('tetap memanggil next untuk OPTIONS request', () => {
    const req = mockReq({ method: 'OPTIONS' })
    const res = mockRes()
    const next = mockNext()

    securityHeadersMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
    // Headers tetap diatur sebelum early return
    expect(res.headers['X-Frame-Options']).toBe('DENY')
  })
})
