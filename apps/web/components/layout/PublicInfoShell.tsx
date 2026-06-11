import type { ReactNode } from 'react'
import PublicSiteLayout from './PublicSiteLayout'
import { Container } from './Container'
import type { PublicSiteConfig } from '../../lib/siteSettings'
import { publicInfoShellWidthClass } from './publicInfoStyles'
import { cn } from '../../lib/utils'

export type PublicInfoShellProps = {
  siteConfig: PublicSiteConfig
  children: ReactNode
  /** `content` = legal/docs; `wide` = marketing layouts (e.g. ads landing) */
  width?: keyof typeof publicInfoShellWidthClass
}

export function PublicInfoShell({
  siteConfig,
  children,
  width = 'content',
}: PublicInfoShellProps) {
  return (
    <PublicSiteLayout siteConfig={siteConfig}>
      <main id="main-content">
        <Container>
          <div
            className={cn('py-16 md:py-20 mx-auto', publicInfoShellWidthClass[width])}
          >
            {children}
          </div>
        </Container>
      </main>
    </PublicSiteLayout>
  )
}
