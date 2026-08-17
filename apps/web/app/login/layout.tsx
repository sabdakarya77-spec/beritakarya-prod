import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Masuk — BeritaKarya',
  description: 'Masuk ke akun BeritaKarya Anda untuk mengakses fitur komentar dan konten eksklusif.',
  robots: { index: false, follow: false },
}

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children
}
