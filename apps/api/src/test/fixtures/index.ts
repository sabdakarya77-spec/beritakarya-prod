import { vi } from 'vitest'
import { Role } from '@prisma/client'

// ─── Mock User Factory ─────────────────────────────────────────────────────────

interface MockUserOverrides {
  id?: string
  email?: string
  name?: string
  role?: Role
  siteId?: string
  passwordHash?: string
  isVerified?: boolean
  aiEnabled?: boolean
  aiDailyLimit?: number
  aiMonthlyBudget?: number
  aiFeaturesAllowed?: string | null
  aiModelRestriction?: string | null
  aiConsentGivenAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export function mockUser(overrides: MockUserOverrides = {}) {
  return {
    id: 'u-1',
    email: 'test@bandung.com',
    name: 'Test User',
    role: Role.reporter,
    siteId: 'bandung',
    passwordHash: '$2b$10$hashedpassword',
    isVerified: true,
    aiEnabled: false,
    aiDailyLimit: null,
    aiMonthlyBudget: null,
    aiFeaturesAllowed: null,
    aiModelRestriction: null,
    aiConsentGivenAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ─── Mock Article Factory ──────────────────────────────────────────────────────

interface MockArticleOverrides {
  id?: string
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  blocks?: Array<Record<string, unknown>>
  status?: string
  authorId?: string
  siteId?: string
  categoryId?: string | null
  featuredImage?: string | null
  contentType?: string
  publishedAt?: Date | null
  createdAt?: Date
  updatedAt?: Date
}

export function mockArticle(overrides: MockArticleOverrides = {}) {
  return {
    id: 'art-1',
    title: 'Test Article',
    slug: 'test-article',
    excerpt: 'Test excerpt',
    content: 'Test content',
    blocks: [{ type: 'paragraph', content: 'Test content' }],
    status: 'draft',
    authorId: 'u-1',
    siteId: 'bandung',
    categoryId: 'cat-1',
    featuredImage: null,
    contentType: 'article',
    metaTitle: null,
    metaDescription: null,
    tags: [],
    isBreaking: false,
    isExclusive: false,
    isFeatured: false,
    viewCount: 0,
    publishedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ─── Mock Site Factory ─────────────────────────────────────────────────────────

interface MockSiteOverrides {
  id?: string
  name?: string
  domain?: string
  isActive?: boolean
}

export function mockSite(overrides: MockSiteOverrides = {}) {
  return {
    id: 'bandung',
    name: 'BeritaKarya Bandung',
    domain: 'bandung.beritakarya.co',
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// ─── Mock Request/Response Helpers ─────────────────────────────────────────────

export function mockReq(overrides: Record<string, unknown> = {}) {
  return {
    headers: {},
    cookies: {},
    query: {},
    params: {},
    body: {},
    path: '/test',
    method: 'GET',
    user: undefined,
    site: undefined,
    authError: undefined,
    ...overrides,
  } as unknown as import('express').Request
}

import type { Response } from 'express'

// Test-only response body shape — intentionally permissive for test assertions
export interface MockResponseBody {
  success?: boolean
  error?: { code: string; message?: string; [key: string]: unknown }
  data?: unknown
  message?: string
  [key: string]: unknown
}

export type MockResponse = Response & { body: MockResponseBody; headers: Record<string, string> }

export function mockRes(): MockResponse {
  const res = {
    statusCode: 200,
    headers: {} as Record<string, string>,
    body: null as unknown as MockResponseBody,
    status(code: number) {
      res.statusCode = code
      return res
    },
    json(data: MockResponseBody) {
      res.body = data
      return res
    },
    setHeader(name: string, value: string) {
      res.headers[name] = value
      return res
    },
    on() {
      return res
    },
  }
  return res as unknown as MockResponse
}

export function mockNext() {
  return vi.fn()
}

// ─── Mock JWTPayload ───────────────────────────────────────────────────────────

export function mockJWTPayload(overrides: Record<string, unknown> = {}) {
  return {
    userId: 'u-1',
    email: 'test@bandung.com',
    role: 'reporter',
    siteId: 'bandung',
    ...overrides,
  }
}
