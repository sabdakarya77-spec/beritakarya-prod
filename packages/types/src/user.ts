export type UserRole = 'reader' | 'reporter' | 'kontributor' | 'wapimred' | 'superadmin' | 'advertiser'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  siteId: string | null  // null = editor pusat (akses semua site)
  isVerified: boolean
  kycSubmittedAt: string | null
  kycReviewedAt: string | null
  kycNotes: string | null
  createdAt: string
  updatedAt: string
}

export type KycStatus = 'UNSUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface AuthUser {
  id: string
  email: string
  name: string
  role: UserRole
  siteId: string | null
  isVerified: boolean
  kycSubmittedAt: string | null
  kycStatus: KycStatus
  kycNotes: string | null
}

export interface JWTPayload {
  userId: string
  role: UserRole
  siteId: string | null
  iat: number
  exp: number
}