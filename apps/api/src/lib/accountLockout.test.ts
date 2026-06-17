import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock redis to avoid real connection
vi.mock('./redis', () => ({
  redis: {
    get: vi.fn(),
    incr: vi.fn(),
    expire: vi.fn(),
    del: vi.fn(),
  },
}))

import { checkAccountLockout, recordFailedAttempt, resetFailedAttempts } from './accountLockout'
import { redis } from './redis'

const TEST_EMAIL = 'test@bandung.com'

describe('accountLockout (Redis path)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.REDIS_HOST = 'localhost'
  })

  afterEach(() => {
    delete process.env.REDIS_HOST
  })

  describe('checkAccountLockout', () => {
    it('mengembalikan false jika tidak ada attempt', async () => {
      vi.mocked(redis!.get).mockResolvedValue(null)

      const locked = await checkAccountLockout(TEST_EMAIL)

      expect(locked).toBe(false)
      expect(redis!.get).toHaveBeenCalledWith(`lockout:${TEST_EMAIL}`)
    })

    it('mengembalikan false jika attempt < MAX_ATTEMPTS', async () => {
      vi.mocked(redis!.get).mockResolvedValue('3')

      const locked = await checkAccountLockout(TEST_EMAIL)

      expect(locked).toBe(false)
    })

    it('mengembalikan true jika attempt >= MAX_ATTEMPTS', async () => {
      vi.mocked(redis!.get).mockResolvedValue('5')

      const locked = await checkAccountLockout(TEST_EMAIL)

      expect(locked).toBe(true)
    })
  })

  describe('recordFailedAttempt', () => {
    it('mengincrement counter di Redis', async () => {
      vi.mocked(redis!.incr).mockResolvedValue(1)

      await recordFailedAttempt(TEST_EMAIL)

      expect(redis!.incr).toHaveBeenCalledWith(`lockout:${TEST_EMAIL}`)
      expect(redis!.expire).toHaveBeenCalledWith(`lockout:${TEST_EMAIL}`, 900)
    })

    it('tidak set TTL jika bukan insert pertama', async () => {
      vi.mocked(redis!.incr).mockResolvedValue(3)

      await recordFailedAttempt(TEST_EMAIL)

      expect(redis!.incr).toHaveBeenCalled()
      expect(redis!.expire).not.toHaveBeenCalled()
    })
  })

  describe('resetFailedAttempts', () => {
    it('menghapus key lockout di Redis', async () => {
      vi.mocked(redis!.del).mockResolvedValue(1)

      await resetFailedAttempts(TEST_EMAIL)

      expect(redis!.del).toHaveBeenCalledWith(`lockout:${TEST_EMAIL}`)
    })
  })
})

describe('accountLockout (memory fallback)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.REDIS_HOST
  })

  it('mengembalikan false jika tidak ada attempt', async () => {
    const locked = await checkAccountLockout('new@user.com')
    expect(locked).toBe(false)
  })

  it('mengembalikan true setelah 5 attempt gagal', async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedAttempt(TEST_EMAIL)
    }

    const locked = await checkAccountLockout(TEST_EMAIL)
    expect(locked).toBe(true)
  })

  it('reset menghapus semua attempt', async () => {
    for (let i = 0; i < 5; i++) {
      await recordFailedAttempt(TEST_EMAIL)
    }

    await resetFailedAttempts(TEST_EMAIL)

    const locked = await checkAccountLockout(TEST_EMAIL)
    expect(locked).toBe(false)
  })
})
