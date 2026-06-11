import { Suspense } from 'react'
import Skeleton from './Skeleton'

interface SectionSuspenseProps {
  children: React.ReactNode
  variant?: 'text' | 'card' | 'minimal'
  rows?: number
  className?: string
}

export default function SectionSuspense({
  children,
  variant = 'text',
  rows = 3,
  className = '',
}: SectionSuspenseProps) {
  return (
    <Suspense
      fallback={
        <div className={className}>
          {Array.from({ length: rows }).map((_, i) => (
            <Skeleton key={i} variant={variant} className="mb-2" />
          ))}
        </div>
      }
    >
      {children}
    </Suspense>
  )
}
