export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean
  public code: string

  constructor(message: string, statusCode: number, code: string = 'ERROR') {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}
