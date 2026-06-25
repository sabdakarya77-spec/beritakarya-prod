'use client'

// Thin shared shell for all dashboard routes.
// Admin chrome (sidebar, header) lives in (admin)/layout.tsx.
// Ads chrome lives in (ads)/layout.tsx.
// This file only provides shared background, font, and global modals.

import { AIConsentModal } from '../../../components/editor/AIConsentModal'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AIConsentModal />
    </>
  )
}
