import { Request, Response, NextFunction } from 'express'
import { env } from '../lib/env'

/**
 * Middleware for adding security-related HTTP headers
 */
export function securityHeadersMiddleware(
  _req: Request,
  res: Response,
  next: NextFunction
) {
  // Prevent clickjacking by forbidding iframe nesting
  res.setHeader('X-Frame-Options', 'DENY')

  // Prevent MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff')

  // Referrer policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')

  // Permissions policy - disable unused browser features
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), payment=()'
  )

  // Add HSTS
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  )

  // Add XSS Protection
  res.setHeader('X-XSS-Protection', '1; mode=block')

  // Content Security Policy (CSP) — aktif di SEMUA environment
  const cspDirectives = [
    "default-src 'self'",
    env.NODE_ENV === 'production'
      ? "script-src 'self'"
      : "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https: blob:",
    "connect-src 'self' https://*.beritakarya.co https://beritakarya.co wss://*.beritakarya.co ws://localhost:*",
    "frame-ancestors 'none'",
    "form-action 'self'",
    "base-uri 'self'",
  ].join('; ')

  res.setHeader('Content-Security-Policy', cspDirectives)

  // Handle CORS Preflight - Don't add CSP to OPTIONS requests
  if (_req.method === 'OPTIONS') {
    return next()
  }

  next()
}