import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('uuid', () => ({
  v4: vi.fn(() => 'mock-uuid-1234'),
}))

import { requestIdMiddleware } from './requestId.middleware'
import { mockReq, mockRes, mockNext } from '../test/fixtures'

describe('requestIdMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('menggunakan request ID yang sudah ada', () => {
    const req = mockReq({ headers: { 'x-request-id': 'existing-id' } })
    const res = mockRes()
    const next = mockNext()

    requestIdMiddleware(req, res, next)

    expect(req.headers['x-request-id']).toBe('existing-id')
    expect(res.headers['X-Request-ID']).toBe('existing-id')
    expect(next).toHaveBeenCalled()
  })

  it('generate UUID baru jika tidak ada header', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    requestIdMiddleware(req, res, next)

    expect(req.headers['x-request-id']).toBe('mock-uuid-1234')
    expect(res.headers['X-Request-ID']).toBe('mock-uuid-1234')
    expect(next).toHaveBeenCalled()
  })
})
