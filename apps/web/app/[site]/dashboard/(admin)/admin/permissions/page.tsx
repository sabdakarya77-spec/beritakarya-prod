'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useRequireRole } from '../../../../../../hooks/useRequireRole'
import { Lock, ChevronRight, Shield, Users } from 'lucide-react'

const ROLES = [
  {
    id: 'wapimred',
    label: 'Wapimred',
    description: 'Wakil Pimpinan Redaksi',
    color: 'from-red-500 to-red-600',
    borderColor: 'border-red-200 dark:border-red-800',
    hoverBorder: 'hover:border-red-400 dark:hover:border-red-600',
  },
  {
    id: 'kaperwil',
    label: 'Kaperwil',
    description: 'Ketua Perwakilan Wilayah',
    color: 'from-indigo-500 to-indigo-600',
    borderColor: 'border-indigo-200 dark:border-indigo-800',
    hoverBorder: 'hover:border-indigo-400 dark:hover:border-indigo-600',
  },
  {
    id: 'kabiro',
    label: 'Kabiro',
    description: 'Kepala Biro',
    color: 'from-violet-500 to-violet-600',
    borderColor: 'border-violet-200 dark:border-violet-800',
    hoverBorder: 'hover:border-violet-400 dark:hover:border-violet-600',
  },
]

export default function PermissionsOverviewPage() {
  const { isAllowed } = useRequireRole(['superadmin'])
  const { site } = useParams() as { site: string }

  if (!isAllowed) return null

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* HEADER */}
      <div>
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-gradient-to-br from-slate-700 to-slate-800 rounded-lg">
            <Shield size={20} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white uppercase">
              Hak Akses Role
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Atur wewenang untuk setiap level manajerial di situs <span className="text-brand-red font-bold">#{site}</span>
            </p>
          </div>
        </div>
      </div>

      {/* INFO BOX */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
        <Lock size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
        <p className="text-sm text-blue-700 dark:text-blue-300">
          Pilih role di bawah untuk mengatur hak akses dan wewenang editorial masing-masing. Perubahan akan langsung berpengaruh pada dashboard user dengan role tersebut.
        </p>
      </div>

      {/* ROLE CARDS */}
      <div className="grid gap-6">
        {ROLES.map((role) => (
          <Link
            key={role.id}
            href={`/${site}/dashboard/admin/permissions/${role.id}`}
            className={`group flex items-center justify-between bg-white dark:bg-gray-900 border ${role.borderColor} ${role.hoverBorder} rounded-xl p-6 transition-all hover:shadow-md`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${role.color} flex items-center justify-center shadow-lg`}>
                <Users size={22} className="text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-brand-red transition-colors">
                  {role.label}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {role.description}
                </p>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400 group-hover:text-brand-red group-hover:translate-x-1 transition-all" />
          </Link>
        ))}
      </div>
    </div>
  )
}
