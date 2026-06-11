import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { JWTPayload } from '@beritakarya/types'

// Extend Express Request type to include user, site and auth error
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload
      site?: string
      authError?: any
    }
  }
}

/**
 * Middleware to require authentication
 */
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    const error = req.authError

    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'TOKEN_EXPIRED',
          message: 'Token telah kadaluarsa, silakan refresh token Anda'
        }
      })
    }

    if (error) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: 'Token tidak valid'
        }
      })
    }

    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    })
  }
  next()
}

/**
 * Middleware to require specific roles
 */
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
      })
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Insufficient permissions' }
      })
    }

    next()
  }
}

/**
 * Middleware to require superadmin role
 */
export function requireSuperadmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: { code: 'UNAUTHORIZED', message: 'Authentication required' }
    })
  }

  if (req.user.role !== 'superadmin') {
    return res.status(403).json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Superadmin access required' }
    })
  }

  next()
}