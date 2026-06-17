import { Request, Response, NextFunction } from 'express'
import { ZodError } from 'zod'
import multer from 'multer'
import { logger } from '../lib/logger'
import { env } from '../lib/env'
import { AppError } from '../utils/AppError'
import { Prisma } from '@prisma/client'
import '../types/express'

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  const errObj = err instanceof Error ? err : new Error(String(err))
  const errWithCode = err as Record<string, unknown> | undefined
  logger.error({
    message: errObj.message,
    stack: errObj.stack,
    path: req.path,
    method: req.method,
    requestId: req.headers['x-request-id'],
    userId: req.user?.userId,
    site: req.site,
  })

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = err.meta?.target as string[] | undefined
      const isEmail = target?.includes('email')
      const message = isEmail ? 'Email sudah terdaftar' : `Nilai untuk ${target?.join(', ') || 'kolom'} sudah terdaftar`
      return res.status(400).json({
        success: false,
        error: {
          code: 'UNIQUE_CONSTRAINT_ERROR',
          message
        }
      })
    }
  }

  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Input tidak valid',
        details: err.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message
        }))
      }
    })
  }

  // Multer errors (file size limit, unexpected field, etc.)
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      error: { code: 'FILE_ERROR', message: err.message }
    })
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: { code: err.code, message: err.message }
    })
  }

  const statusCode = (typeof errWithCode?.statusCode === 'number' ? errWithCode.statusCode : undefined) || 500
  const isClientError = statusCode >= 400 && statusCode < 500
  const message =
    env.NODE_ENV === 'production' && !isClientError
      ? 'Terjadi kesalahan server'
      : errObj.message || 'Terjadi kesalahan server'

  res.status(statusCode).json({
    success: false,
    error: {
      code: (typeof errWithCode?.code === 'string' ? errWithCode.code : undefined) || (isClientError ? 'CLIENT_ERROR' : 'SERVER_ERROR'),
      message
    }
  })
}
