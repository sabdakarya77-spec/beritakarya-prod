import { describe, it, expect, vi, beforeEach } from 'vitest'

const { mockCreate } = vi.hoisted(() => ({
  mockCreate: vi.fn()
}))

// Mock OpenAI
vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(function () {
      return {
        chat: {
          completions: {
            create: mockCreate
          }
        }
      }
    })
  }
})

vi.mock('opossum', () => {
  const MockBreaker = vi.fn().mockImplementation(function (this: Record<string, unknown>, action: (...args: unknown[]) => unknown) {
    this.fire = vi.fn().mockImplementation((...args: unknown[]) => action(...args))
    this.on = vi.fn().mockReturnThis()
    this.stats = { state: 'closed' }
    return this
  })
  return {
    default: MockBreaker,
    __esModule: true
  }
})

import { callAI, chatComplete } from './base.service'


describe('base.service — retry & fallback', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
  })

  it('berhasil pada attempt pertama', async () => {
    mockCreate.mockResolvedValueOnce({
      choices: [{ message: { content: 'hasil AI' } }]
    })
    const result = await callAI(() => chatComplete('system', 'user'))
    expect(result.success).toBe(true)
    expect(result.data).toBe('hasil AI')
  })

  it('retry 3x lalu return fallback error — tidak throw', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('Rate limited'), { status: 429 }))
    const result = await callAI(() => chatComplete('system', 'user'), 3)
    expect(result.success).toBe(false)
    expect(result.error).toContain('tidak tersedia')
    expect(result.data).toBeUndefined()
  })

  it('tidak retry jika error bukan retryable (400)', async () => {
    mockCreate.mockRejectedValue(Object.assign(new Error('Bad request'), { status: 400 }))
    const result = await callAI(() => chatComplete('system', 'user'), 3)
    expect(result.success).toBe(false)
    expect(mockCreate).toHaveBeenCalledTimes(1)
  })
})

describe('AI tidak crash aplikasi saat gagal', () => {
  it('callAI selalu return object, tidak pernah throw', async () => {
    mockCreate.mockRejectedValue(new Error('Network error'))
    const result = await callAI(() => chatComplete('s', 'u'))
    expect(result).toHaveProperty('success')
    expect(result).toHaveProperty('error')
  })
})
