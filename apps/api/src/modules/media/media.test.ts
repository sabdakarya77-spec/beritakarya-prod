import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'
import { mediaRouter } from './media.controller'
import { errorMiddleware } from '../../middleware/error.middleware'

// Mock auth middleware so we don't need real tokens
vi.mock('../../middleware/auth.middleware', () => ({
  requireAuth: (_: any, __: any, next: any) => next()
}))

// Mock site middleware so we don't need a real site header
vi.mock('../../middleware/site.middleware', () => ({
  siteMiddleware: (_: any, __: any, next: any) => {
    _.site = 'bandung'
    next()
  },
  requireSiteAccess: (_: any, __: any, next: any) => next()
}))

// Mock sharp so we don't need real images or binary dependencies in test
vi.mock('sharp', () => ({
  default: vi.fn(() => ({
    metadata: vi.fn().mockResolvedValue({ width: 800, height: 600, format: 'jpeg' }),
    resize: vi.fn().mockReturnThis(),
    webp: vi.fn().mockReturnThis(),
    toFile: vi.fn().mockResolvedValue({})
  }))
}))

const app = express()
app.use(express.json())
app.use('/api/v1/media', mediaRouter)
app.use(errorMiddleware)

describe('Media Upload Endpoint', () => {
  it('harus menolak file yang bukan gambar atau PDF (contoh: TXT)', async () => {
    const res = await request(app)
      .post('/api/v1/media/upload')
      .attach('file', Buffer.from('hello world'), {
        filename: 'document.txt',
        contentType: 'text/plain'
      })
    
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
    expect(res.body.error.message).toMatch(/JPG, PNG, WebP,.*GIF/i)
  })

  it('harus mengembalikan 400 jika tidak ada file yang diunggah', async () => {
    const res = await request(app)
      .post('/api/v1/media/upload')
      .send({})
    
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })
})
