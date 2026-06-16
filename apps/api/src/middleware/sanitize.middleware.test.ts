import { describe, it, expect, vi, beforeEach } from 'vitest'
import { sanitizeMiddleware } from './sanitize.middleware'
import { mockReq, mockRes, mockNext } from '../test/fixtures'

describe('sanitizeMiddleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('memanggil next()', () => {
    const req = mockReq({ body: { title: 'Test' } })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('membersihkan XSS pada string field', () => {
    const req = mockReq({
      body: { title: '<script>alert("xss")</script>Hello' },
    })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(req.body.title).not.toContain('<script>')
    expect(req.body.title).toContain('Hello')
  })

  it('mempertahankan tag yang diizinkan (b, i, a)', () => {
    const req = mockReq({
      body: { content: '<b>Bold</b> <i>Italic</i> <a href="https://example.com">Link</a>' },
    })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(req.body.content).toContain('<b>Bold</b>')
    expect(req.body.content).toContain('<i>Italic</i>')
    expect(req.body.content).toContain('<a href')
  })

  it('tidak sanitize field password', () => {
    const password = '<script>alert("xss")</script>mypass'
    const req = mockReq({ body: { password } })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(req.body.password).toBe(password)
  })

  it('tidak sanitize field email', () => {
    const email = 'test+tag@bandung.com'
    const req = mockReq({ body: { email } })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(req.body.email).toBe(email)
  })

  it('sanitize blocks array dengan benar', () => {
    const req = mockReq({
      body: {
        blocks: [
          {
            type: 'paragraph',
            id: 'block-1',
            content: '<p>Normal content</p>',
          },
          {
            type: 'image',
            id: 'block-2',
            url: 'https://example.com/image.jpg',
            alt: 'Image alt',
          },
        ],
      },
    })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    // Block fields dipertahankan
    expect(req.body.blocks[0].type).toBe('paragraph')
    expect(req.body.blocks[0].id).toBe('block-1')
    expect(req.body.blocks[1].url).toBe('https://example.com/image.jpg')
    // Content di-sanitize
    expect(req.body.blocks[0].content).toContain('Normal content')
  })

  it('sanitize nested objects', () => {
    const req = mockReq({
      body: {
        meta: {
          title: '<script>bad</script>Good Title',
          description: 'Clean description',
        },
      },
    })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(req.body.meta.title).not.toContain('<script>')
    expect(req.body.meta.title).toContain('Good Title')
    expect(req.body.meta.description).toBe('Clean description')
  })

  it('melanjutkan jika req.body tidak ada', () => {
    const req = mockReq()
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(next).toHaveBeenCalled()
  })

  it('membatasi style attribute hanya text-align', () => {
    const req = mockReq({
      body: {
        content: '<p style="text-align: center; color: red; background: url(javascript:bad)">Text</p>',
      },
    })
    const res = mockRes()
    const next = mockNext()

    sanitizeMiddleware(req, res, next)

    expect(req.body.content).toContain('text-align: center')
    expect(req.body.content).not.toContain('color: red')
    expect(req.body.content).not.toContain('javascript:')
  })
})
