import { Router, Request, Response } from 'express'
import { requireAuth } from '../../middleware/auth.middleware'
import { siteMiddleware, requireSiteAccess } from '../../middleware/site.middleware'
import { asyncHandler } from '../../utils/asyncHandler'
import * as repo from './audit.repository'

export const auditRouter: Router = Router()

const withSite = [requireAuth, siteMiddleware, requireSiteAccess]

// GET /api/v1/audit  — list audit logs (superadmin only)
auditRouter.get('/', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak' })
  }

  const { action, entityType, userId, page, limit } = req.query
  const result = await repo.findAuditLogs(req.site!, {
    action: action as string,
    entityType: entityType as string,
    userId: userId as string,
    page: page ? parseInt(page as string) : 1,
    limit: limit ? Math.min(parseInt(limit as string), 100) : 30,
  })

  res.json({ success: true, data: result })
}))

// GET /api/v1/audit/stats  — summary stats (superadmin only)
auditRouter.get('/stats', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak' })
  }

  const stats = await repo.getAuditStats(req.site!)
  res.json({ success: true, data: stats })
}))

// GET /api/v1/audit/export — download CSV (superadmin only)
auditRouter.get('/export', ...withSite, asyncHandler(async (req: Request, res: Response) => {
  if (req.user!.role !== 'superadmin') {
    return res.status(403).json({ success: false, message: 'Akses ditolak' })
  }

  const logs = await repo.findAllAuditLogsForExport(req.site!)
  
  let csv = 'ID,Timestamp,User,Action,Entity,EntityID\n'
  logs.forEach(log => {
    const ts = log.createdAt.toISOString()
    const userName = log.user?.name || log.userId
    csv += `"${log.id}","${ts}","${userName}","${log.action}","${log.entityType || ''}","${log.entityId || ''}"\n`
  })

  res.setHeader('Content-Type', 'text/csv')
  res.setHeader('Content-Disposition', `attachment; filename=audit-log-${req.site}-${new Date().toISOString().split('T')[0]}.csv`)
  res.status(200).send(csv)
}))