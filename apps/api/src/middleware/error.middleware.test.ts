import { describe, it, expect, vi, beforeEach } from 'vitest'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'

vi.mock('../lib/logger', () => ({
  logger: { error: vi.fn() },
}))

vi.mock('../lib/env', () => ({
  env: { NODE_ENV: 'test' },
}))

import { errorMiddleware } from './error.middleware'
import { AppError } from '../utils/AppError'
import { mockReq, mockRes } from '../test/fixtures'

describe('errorMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('menangani Prisma P2002 (email duplicate)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['email'] },
    })
    const req = mockReq()
    const res = mockRes()

    errorMiddleware(err, req, res, () => {})

    expect(res.statusCode).toBe(400)
    expect(res.body.error!.code).toBe('UNIQUE_CONSTRAINT_ERROR')
    expect(res.body.error!.message).toContain('Email sudah terdaftar')
  })

  it('menangani Prisma P2002 (field lain)', () => {
    const err = new Prisma.PrismaClientKnownRequestError('Unique constraint', {
      code: 'P2002',
      clientVersion: '5.0.0',
      meta: { target: ['slug'] },
    })
    const req = mockReq()
    const res = mockRes()

    errorMiddleware(err, req, res, () => {})

    expect(res.statusCode).toBe(400)
    expect(res.body.error!.message).toContain('slug')
  })

  it('menangani ZodError', () => {
    const err = new ZodError([
      { code: 'too_small', minimum: 3, type: 'string', inclusive: true, path: ['name'], message: 'Too short' },
    ])
    const req = mockReq()
    const res = mockRes()

    errorMiddleware(err, req, res, () => {})

    expect(res.statusCode).toBe(400)
    expect(res.body.error!.code).toBe('VALIDATION_ERROR')
    expect(res.body.error!.details).toBeDefined()
  })

  it('menangani AppError', () => {
    const err = new AppError('Not found', 404, 'NOT_FOUND')
    const req = mockReq()
    const res = mockRes()

    errorMiddleware(err, req, res, () => {})

    expect(res.statusCode).toBe(404)
    expect(res.body.error!.code).toBe('NOT_FOUND')
    expect(res.body.error!.message).toBe('Not found')
  })

  it('menangani generic error (500)', () => {
    const err = new Error('Something broke')
    const req = mockReq()
    const res = mockRes()

    errorMiddleware(err, req, res, () => {})

    expect(res.statusCode).toBe(500)
    expect(res.body.error!.code).toBe('SERVER_ERROR')
  })

  it('menangani error dengan custom statusCode', () => {
    const err = Object.assign(new Error('Rate limited'), { statusCode: 429, code: 'RATE_LIMITED' })
    const req = mockReq()
    const res = mockRes()

    errorMiddleware(err, req, res, () => {})

    expect(res.statusCode).toBe(429)
    expect(res.body.error!.code).toBe('RATE_LIMITED')
  })
})
