import { describe, it, expect, vi } from 'vitest'
import request from 'supertest'
import express from 'express'

// Must be mocked before any import that transitively loads base.service.ts,
// because OpenAI is instantiated at module level (not inside a function).
vi.mock('openai', () => ({
  default: vi.fn().mockImplementation(function () {
    return { chat: { completions: { create: vi.fn() } } }
  })
}))

import { aiRouter } from './ai.controller'
import { errorMiddleware } from '../middleware/error.middleware'

vi.mock('./write.service', () => ({
  rewriteBlock: vi.fn().mockResolvedValue('teks hasil rewrite'),
  expandBlock: vi.fn().mockResolvedValue('teks hasil expand')
}))

vi.mock('../middleware/auth.middleware', () => ({
  requireAuth: (_: any, __: any, next: any) => {
    _.user = { userId: 'u1', role: 'reporter', siteId: 'bandung' }
    next()
  }
}))

vi.mock('../middleware/aiQuota.middleware', () => ({
  checkAIPermissions: (_: any, __: any, next: any) => {
    // Mock user quota context
    _.aiQuota = { allowedFeatures: ['rewrite', 'expand'] }
    _.aiUserId = 'u1'
    next()
  }
}))

vi.mock('../lib/rateLimit', () => ({
  aiLimiter: (_: any, __: any, next: any) => next()
}))

vi.mock('./usage.service', () => ({
  logUsage: vi.fn()
}))

vi.mock('../db/client', () => ({
  prisma: {
    aIUsage: { create: vi.fn() }
  }
}))

const app = express()
app.use(express.json())
app.use('/api/v1/ai', aiRouter)
app.use(errorMiddleware)

describe('AI endpoints', () => {
  it('POST /ai/rewrite — success', async () => {
    const res = await request(app)
      .post('/api/v1/ai/rewrite')
      .send({ content: 'Ini adalah paragraf yang akan ditulis ulang oleh AI.' })
    expect(res.status).toBe(200)
    expect(res.body.success).toBe(true)
    expect(res.body.data).toBe('teks hasil rewrite')
  })

  it('POST /ai/rewrite — validasi input terlalu pendek', async () => {
    const res = await request(app)
      .post('/api/v1/ai/rewrite')
      .send({ content: 'pendek' })
    expect(res.status).toBe(400)
    expect(res.body.success).toBe(false)
  })

  it('Response shape konsisten: selalu ada field success', async () => {
    const res = await request(app)
      .post('/api/v1/ai/rewrite')
      .send({ content: 'Paragraf cukup panjang untuk diproses oleh AI service.' })
    expect(res.body).toHaveProperty('success')
  })
})