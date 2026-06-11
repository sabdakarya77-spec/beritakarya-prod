/**
 * Single Source of Truth untuk Article Status Labels dan Config
 * Digunakan di semua apps (web & api) untuk konsistensi
 */

export type ArticleStatusKey = 'draft' | 'submitted' | 'review' | 'revision' | 'approved' | 'scheduled' | 'published' | 'archived' | 'rejected'

export interface StatusConfigItem {
  label: string
  color: string
  bgMuted: string
  textMuted: string
}

export const STATUS_LABELS: Record<string, string> = {
  '': 'Semua',
  draft: 'Draft',
  submitted: 'Dikirim',
  review: 'Review',
  revision: 'Revisi',
  approved: 'Disetujui',
  scheduled: 'Terjadwal',
  published: 'Terbit',
  archived: 'Arsip',
  rejected: 'Ditolak',
}

export const STATUS_CONFIG: Record<ArticleStatusKey, StatusConfigItem> = {
  draft: { label: 'Draft', color: 'bg-emerald-500', bgMuted: 'bg-emerald-500/10', textMuted: 'text-emerald-400' },
  submitted: { label: 'Menunggu Review', color: 'bg-amber-500', bgMuted: 'bg-amber-500/10', textMuted: 'text-amber-400' },
  review: { label: 'Review', color: 'bg-violet-500', bgMuted: 'bg-violet-500/10', textMuted: 'text-violet-400' },
  revision: { label: 'Revisi', color: 'bg-orange-500', bgMuted: 'bg-orange-500/10', textMuted: 'text-orange-400' },
  approved: { label: 'Disetujui', color: 'bg-blue-500', bgMuted: 'bg-blue-500/10', textMuted: 'text-blue-400' },
  published: { label: 'Terbit', color: 'bg-emerald-500', bgMuted: 'bg-emerald-500/10', textMuted: 'text-emerald-400' },
  scheduled: { label: 'Terjadwal', color: 'bg-cyan-500', bgMuted: 'bg-cyan-500/10', textMuted: 'text-cyan-400' },
  archived: { label: 'Diarsipkan', color: 'bg-gray-400', bgMuted: 'bg-gray-400/10', textMuted: 'text-gray-400' },
  rejected: { label: 'Ditolak', color: 'bg-red-500', bgMuted: 'bg-red-500/10', textMuted: 'text-red-400' },
}

export function getStatusConfig(status: string): StatusConfigItem {
  return STATUS_CONFIG[status as ArticleStatusKey] || STATUS_CONFIG.draft
}
