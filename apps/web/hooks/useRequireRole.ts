'use client';

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '../store/authStore';

/**
 * Hook untuk page-level role guard.
 * Redirect ke dashboard jika user tidak memiliki role yang diizinkan.
 *
 * @param allowedRoles - Array role yang diizinkan mengakses halaman
 * @returns Object berisi user dan flag isAllowed
 *
 * @example
 * const { user, isAllowed } = useRequireRole(['superadmin', 'wapimred']);
 * if (!isAllowed) return null;
 */
export function useRequireRole(allowedRoles: string[]) {
  const router = useRouter();
  const { site } = useParams() as { site: string };
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (user && !allowedRoles.includes(user.role)) {
      router.replace(`/${site}/dashboard`);
    }
  }, [user, allowedRoles, router, site]);

  return {
    user,
    isAllowed: user ? allowedRoles.includes(user.role) : false,
  };
}
