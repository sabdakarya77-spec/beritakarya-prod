import { redis } from './redis'

const MAX_ATTEMPTS = 5
const LOCKOUT_DURATION = 15 * 60 // 15 minutes in seconds

// Fallback in-memory map jika Redis belum tersedia
interface FailedAttempt {
  count: number
  lastAttempt: Date
}
const failedAttempts = new Map<string, FailedAttempt>()

export async function checkAccountLockout(email: string): Promise<boolean> {
  if (process.env.REDIS_HOST) {
    try {
      const attempts = await redis.get(`lockout:${email}`)
      return attempts ? parseInt(attempts) >= MAX_ATTEMPTS : false
    } catch {
      // Fallback to memory map below
    }
  }

  // Fallback memory
  const attempt = failedAttempts.get(email)
  if (!attempt) return false
  
  const timeSinceLastAttempt = Date.now() - attempt.lastAttempt.getTime()
  if (timeSinceLastAttempt > LOCKOUT_DURATION * 1000) {
    failedAttempts.delete(email)
    return false
  }
  
  return attempt.count >= MAX_ATTEMPTS
}

export async function recordFailedAttempt(email: string): Promise<void> {
  if (process.env.REDIS_HOST) {
    try {
      const key = `lockout:${email}`
      const current = await redis.incr(key)
      if (current === 1) {
        // Set TTL hanya saat pertama kali insert
        await redis.expire(key, LOCKOUT_DURATION)
      }
      return
    } catch {
      // Fallback to memory map below
    }
  }

  // Fallback memory
  const attempt = failedAttempts.get(email) || { count: 0, lastAttempt: new Date() }
  attempt.count++
  attempt.lastAttempt = new Date()
  failedAttempts.set(email, attempt)
}

export async function resetFailedAttempts(email: string): Promise<void> {
  if (process.env.REDIS_HOST) {
    try {
      await redis.del(`lockout:${email}`)
      return
    } catch {
      // Fallback to memory map below
    }
  }

  // Fallback memory
  failedAttempts.delete(email)
}