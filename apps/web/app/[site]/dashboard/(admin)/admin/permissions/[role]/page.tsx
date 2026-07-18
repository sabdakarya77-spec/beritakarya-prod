'use client'

import { useParams } from 'next/navigation'
import { useRequireRole } from '../../../../../../../hooks/useRequireRole'
import RolePermissions from '../../../../../../../components/admin/RolePermissions'

const VALID_ROLES = ['wapimred', 'kaperwil', 'korwil', 'kabiro'] as const
type ValidRole = (typeof VALID_ROLES)[number]

export default function PermissionsPage() {
  const { isAllowed } = useRequireRole(['superadmin'])
  const { role } = useParams() as { role: string }

  if (!isAllowed) return null

  if (!VALID_ROLES.includes(role as ValidRole)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] gap-4">
        <p className="text-sm text-gray-500">Role tidak valid</p>
      </div>
    )
  }

  return <RolePermissions role={role as ValidRole} />
}
