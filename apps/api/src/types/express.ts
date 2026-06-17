import { JWTPayload } from '@beritakarya/types'

// Global augmentation for Express Request type (single source of truth)
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      site?: string
      authError?: unknown
      aiQuota?: {
        dailyRequests: number
        dailyTokens: number
        monthlyBudget: number
        allowedFeatures: string[]
        modelRestriction?: string
      }
      aiUserId?: string
    }
  }
}

export {}