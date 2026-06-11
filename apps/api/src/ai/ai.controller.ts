import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { requireAuth } from '../middleware/auth.middleware'
import { checkAIPermissions } from '../middleware/aiQuota'
import { aiLimiter } from '../lib/rateLimit'
import { asyncHandler } from '../utils/asyncHandler'
import * as writeService from './write.service'
import * as optimizeService from './optimize.service'
import * as validateService from './validate.service'
import * as layoutService from './layout.service'
import * as imageService from './image.service'
import { callAIWithTracking } from './base.service'

import { prisma } from '../db/client'

export const aiRouter: Router = Router()

// ── CONSENT (No Quota Check) ──────────────────────────────────
aiRouter.post('/consent', requireAuth, asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: { aiConsentGivenAt: new Date() }
  })

  res.json({ success: true, aiConsentGivenAt: user.aiConsentGivenAt })
}))

// Apply quota checking middleware to all OTHER AI routes
// Note: checkAIPermissions runs BEFORE aiLimiter to reject quota violations early
aiRouter.use(requireAuth, checkAIPermissions, aiLimiter)

// Helper function to wrap AI calls with tracking and quota enforcement
async function withQuotaAndTracking<T>(
  req: Request,
  action: string,
  fn: () => Promise<T>
) {
  return callAIWithTracking(fn, req, action)
}

// ── WRITE ─────────────────────────────────────────────────────
aiRouter.post('/rewrite', asyncHandler(async (req: Request, res: Response) => {
  const { content, tone, length, prevContent, nextContent } = z.object({
    content: z.string().min(10).max(5000),
    tone: z.enum(['formal','santai','berita']).default('berita'),
    length: z.enum(['lebih_pendek','sama','lebih_panjang']).default('sama'),
    prevContent: z.string().optional(),
    nextContent: z.string().optional()
  }).parse(req.body)

  const result = await withQuotaAndTracking(req, 'rewrite', () =>
    writeService.rewriteBlock(content, tone, length, {
      prev: prevContent, next: nextContent
    })
  )
  res.json(result)
}))

aiRouter.post('/expand', asyncHandler(async (req: Request, res: Response) => {
  const { content, prevContent, nextContent } = z.object({
    content: z.string().min(10).max(5000),
    prevContent: z.string().optional(),
    nextContent: z.string().optional()
  }).parse(req.body)

  const result = await withQuotaAndTracking(req, 'expand', () =>
    writeService.expandBlock(content, { prev: prevContent, next: nextContent })
  )
  res.json(result)
}))

aiRouter.post('/transcript-to-quote', asyncHandler(async (req: Request, res: Response) => {
  const { transcript } = z.object({ transcript: z.string().min(20).max(10000) }).parse(req.body)
  const result = await withQuotaAndTracking(req, 'transcript-to-quote', () =>
    writeService.extractQuoteFromTranscript(transcript)
  )
  res.json(result)
}))

// ── OPTIMIZE ──────────────────────────────────────────────────
aiRouter.post('/headline', asyncHandler(async (req: Request, res: Response) => {
  const { title, contentExcerpt } = z.object({
    title: z.string().min(3).max(200),
    contentExcerpt: z.string().max(1000)
  }).parse(req.body)

  const result = await withQuotaAndTracking(req, 'headline', () =>
    optimizeService.generateHeadlines(title, contentExcerpt)
  )
  res.json(result)
}))

aiRouter.post('/seo', asyncHandler(async (req: Request, res: Response) => {
  const { title, contentExcerpt } = z.object({
    title: z.string().min(3).max(200),
    contentExcerpt: z.string().max(2000)
  }).parse(req.body)

  const result = await withQuotaAndTracking(req, 'seo', () =>
    optimizeService.generateSEOMeta(title, contentExcerpt)
  )
  res.json(result)
}))

// ── VALIDATE ──────────────────────────────────────────────────
aiRouter.post('/grammar', asyncHandler(async (req: Request, res: Response) => {
  const { text } = z.object({ text: z.string().min(10).max(5000) }).parse(req.body)
  const result = await withQuotaAndTracking(req, 'grammar', () =>
    validateService.checkGrammar(text)
  )
  res.json(result)
}))

aiRouter.post('/readability', asyncHandler(async (req: Request, res: Response) => {
  const { text } = z.object({ text: z.string().min(50).max(10000) }).parse(req.body)
  const result = await withQuotaAndTracking(req, 'readability', () =>
    validateService.checkReadability(text)
  )
  res.json(result)
}))

aiRouter.post('/fact-check', asyncHandler(async (req: Request, res: Response) => {
  const { text } = z.object({ text: z.string().min(50).max(10000) }).parse(req.body)
  const result = await withQuotaAndTracking(req, 'fact-check', () =>
    validateService.checkFact(text)
  )
  res.json(result)
}))

aiRouter.post('/objectivity', asyncHandler(async (req: Request, res: Response) => {
  const { text } = z.object({ text: z.string().min(50).max(10000) }).parse(req.body)
  const result = await withQuotaAndTracking(req, 'objectivity', () =>
    validateService.auditObjectivity(text)
  )
  res.json(result)
}))

// ── LAYOUT ────────────────────────────────────────────────────
aiRouter.post('/layout', asyncHandler(async (req: Request, res: Response) => {
  const { blocks } = z.object({
    blocks: z.array(z.any()).min(1).max(100)
  }).parse(req.body)

  const result = await withQuotaAndTracking(req, 'layout', () =>
    layoutService.analyzeLayout(blocks)
  )
  res.json(result)
}))

// ── IMAGE ─────────────────────────────────────────────────────
aiRouter.post('/caption', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl } = z.object({
    imageUrl: z.string().url()
  }).parse(req.body)

  const result = await withQuotaAndTracking(req, 'caption', () =>
    imageService.generateCaption(imageUrl)
  )
  res.json(result)
}))