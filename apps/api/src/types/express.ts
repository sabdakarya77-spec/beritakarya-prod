import { JWTPayload } from '@beritakarya/types'

// Global augmentation for Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      site?: string
    }
  }
}

export {}