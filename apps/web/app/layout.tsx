import { Plus_Jakarta_Sans, Playfair_Display } from 'next/font/google'
import './globals.css'
import { constructMetadata } from '../lib/metadata'
import type { Viewport } from 'next'

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-plus-jakarta-sans',
  display: 'swap',
  adjustFontFallback: true,
})
const playfair = Playfair_Display({
  subsets: ['latin'],
  weight: ['800', '900'],
  variable: '--font-playfair',
  display: 'swap',
  adjustFontFallback: true,
})

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
}

export const metadata = constructMetadata()

import { Toaster } from '../components/ui/Toaster'
import { AuthCheck } from '../components/AuthInit'
import ScrollReset from '../components/layout/ScrollReset'
import { SwRegister } from './SwRegister'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" className="scroll-smooth" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#B91C1C" />
        <link rel="preconnect" href="https://media.beritakarya.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://media.beritakarya.co" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
            (function() {
              try {
                if ('scrollRestoration' in history) {
                  history.scrollRestoration = 'manual';
                }

                const theme = localStorage.getItem('theme');
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

                if (theme === 'dark' || (!theme && systemDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (e) {
                console.error('Theme initialization error:', e);
              }
            })();
            `,
          }}
        />
      </head>
      <body className={`${plusJakartaSans.variable} ${playfair.variable} font-sans antialiased overflow-x-hidden`}>
        <AuthCheck />
        <ScrollReset />
        {children}
        <Toaster />
        <SwRegister site="pusat" />
      </body>
    </html>
  )
}
