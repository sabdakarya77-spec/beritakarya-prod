/**
 * Single Source of Truth untuk Role Labels dan Colors
 * Digunakan di semua apps (web & api) untuk konsistensi
 */

export const ROLE_LABELS: Record<string, string> = {
  superadmin: 'Pimred (CEO) / Admin IT',
  wapimred: 'Wakil Pemimpin Redaksi (Wapimred)',
  kaperwil: 'Ketua Perwakilan Wilayah (Kaperwil)',
  kabiro: 'Kepala Biro (Kabiro)',
  reporter: 'Reporter (Internal)',
  kontributor: 'Kontributor (Penulis Lepas)',
  advertiser: 'Pengiklan',
  reader: 'Pembaca'
}

export const ROLE_COLORS: Record<string, string> = {
  superadmin: 'bg-purple-100 text-purple-700 border-purple-200',
  wapimred: 'bg-red-100 text-red-700 border-red-200',
  kaperwil: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  kabiro: 'bg-violet-100 text-violet-700 border-violet-200',
  reporter: 'bg-green-100 text-green-700 border-green-200',
  kontributor: 'bg-blue-100 text-blue-700 border-blue-200',
  advertiser: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  reader: 'bg-gray-100 text-gray-700 border-gray-200'
}
