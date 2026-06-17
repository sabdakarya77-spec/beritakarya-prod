import * as express from 'express'

export function asyncHandler(
  fn: (req: express.Request, res: express.Response, next: express.NextFunction) => Promise<unknown>
): express.RequestHandler {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}