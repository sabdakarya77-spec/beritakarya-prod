import winston from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'
import { Request, Response, NextFunction } from 'express'
import path from 'path'
import { env } from './env'

const { combine, timestamp, json, colorize, printf, errors } = winston.format

// ─── Log Directory ────────────────────────────────────────────────────────────

const LOG_DIR = path.resolve(process.cwd(), 'logs')

// ─── Formats ──────────────────────────────────────────────────────────────────

const devFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaStr = Object.keys(meta).length
    ? '  ' + JSON.stringify(meta, null, 0)
    : ''
  const stackStr = stack ? `\n${stack}` : ''
  return `${timestamp} [${level.toUpperCase()}] ${message}${metaStr}${stackStr}`
})

const productionFormat = combine(
  errors({ stack: true }),   // Capture stack traces on Error objects
  timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  json()
)

const developmentFormat = combine(
  errors({ stack: true }),
  colorize(),
  timestamp({ format: 'HH:mm:ss' }),
  devFormat
)

// ─── Daily Rotate Transport Factory ──────────────────────────────────────────

function makeDailyRotate(options: {
  level?: string
  filename: string
  auditFile: string
}): DailyRotateFile {
  return new DailyRotateFile({
    dirname: LOG_DIR,
    filename: options.filename,       // e.g. 'error-%DATE%.log'
    datePattern: 'YYYY-MM-DD',
    level: options.level,
    zippedArchive: true,              // Gzip rotated logs
    maxSize: '20m',                   // Rotate when file exceeds 20 MB
    maxFiles: '14d',                  // Keep 14 days of logs
    auditFile: path.join(LOG_DIR, options.auditFile),
    format: productionFormat,
  })
}

// ─── Transports ───────────────────────────────────────────────────────────────

const transports: winston.transport[] = [
  new winston.transports.Console({
    format: env.NODE_ENV === 'production' ? productionFormat : developmentFormat,
  }),
]

if (env.NODE_ENV === 'production') {
  // All logs (info and above) → app-YYYY-MM-DD.log
  transports.push(
    makeDailyRotate({
      filename: 'app-%DATE%.log',
      auditFile: '.audit-app.json',
    })
  )

  // Error logs only → error-YYYY-MM-DD.log
  transports.push(
    makeDailyRotate({
      level: 'error',
      filename: 'error-%DATE%.log',
      auditFile: '.audit-error.json',
    })
  )

  // HTTP transport: send logs to a centralized endpoint if configured
  // Set LOG_HTTP_HOST in .env.production to enable (e.g. http://logstash:5044)
  if (env.LOG_HTTP_HOST) {
    transports.push(
      new winston.transports.Http({
        host: new URL(env.LOG_HTTP_HOST).hostname,
        port: parseInt(new URL(env.LOG_HTTP_HOST).port || '80'),
        path: new URL(env.LOG_HTTP_HOST).pathname || '/',
        ssl: env.LOG_HTTP_HOST.startsWith('https'),
        level: 'warn',   // Only ship warn+ to aggregator (reduce noise)
        format: productionFormat,
      })
    )
  }
}

// ─── Logger Instance ──────────────────────────────────────────────────────────

export const logger = winston.createLogger({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: productionFormat,
  transports,
  // Don't crash the app on unhandled logger errors
  exitOnError: false,
})

// Handle transport errors (e.g. disk full, network error)
logger.on('error', (err) => {
  // eslint-disable-next-line no-console
  console.error('[Logger] Transport error:', err)
})

// ─── HTTP Request Logging Middleware ─────────────────────────────────────────

export function httpLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const level =
      res.statusCode >= 500 ? 'error'
      : res.statusCode >= 400 ? 'warn'
      : 'http'

    // Use 'info' as fallback since winston may not have 'http' level
    const logLevel = level === 'http' ? 'info' : level

    logger[logLevel](`${req.method} ${req.path} ${res.statusCode}`, {
      method:    req.method,
      path:      req.path,
      status:    res.statusCode,
      duration:  `${duration}ms`,
      requestId: req.headers['x-request-id'],
      userId:    (req as any).user?.userId,
      site:      (req as any).site,
      ip:        req.ip,
    })
  })

  next()
}