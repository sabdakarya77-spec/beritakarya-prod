import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Daftar — BeritaKarya',
  description: 'Buat akun BeritaKarya untuk bergabung dengan komunitas dan berkomentar pada artikel.',
  robots: { index: false, follow: false },
}

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return children
}
