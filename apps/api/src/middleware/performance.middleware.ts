import { Request, Response, NextFunction } from 'express'
import { metrics } from '../lib/monitoring'

export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const startTime = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - startTime
    const method = req.method
    const route = req.route?.path || req.path
    const statusCode = res.statusCode
    const isError = statusCode >= 400

    metrics.record(`${method} ${route}`, duration, isError)
  })

  next()
}
