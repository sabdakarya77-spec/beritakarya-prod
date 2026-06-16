'use client'

import { AIDashboard } from '../../../../../components/admin/AIDashboard'
import { useRequireRole } from '../../../../../hooks/useRequireRole'

export default function AIUsagePage() {
  const { isAllowed } = useRequireRole(['superadmin']);

  if (!isAllowed) return null;

  return <AIDashboard />
}
