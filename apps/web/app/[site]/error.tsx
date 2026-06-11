'use client'

import { useEffect } from 'react'
import { PublicErrorView } from '../../components/layout/PublicErrorView'

export default function SiteError({
  error,
  reset,
  params,
}: {
  error: Error & { digest?: string }
  reset: () => void
  params?: { site?: string }
}) {
  useEffect(() => {
    console.error('[SiteErrorBoundary]', {
      site: params?.site,
      message: error.message,
      digest: error.digest,
    })
  }, [error, params?.site])

  return <PublicErrorView error={error} reset={reset} site={params?.site} />
}
