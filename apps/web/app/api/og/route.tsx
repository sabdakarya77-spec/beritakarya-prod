import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

/**
 * Dynamic OG Image Generator
 *
 * Generates branded Open Graph images with article titles.
 * Used as fallback when articles don't have a featured image.
 *
 * Usage: /api/og?title=Judul+Artikel&site=Nama+Situs
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') || 'BeritaKarya'
  const site = searchParams.get('site') || 'BeritaKarya'

  // Truncate title if too long
  const displayTitle = title.length > 100 ? title.substring(0, 97) + '...' : title

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Background accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)',
          }}
        />

        {/* Main content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '60px 80px',
            textAlign: 'center',
            maxWidth: '100%',
          }}
        >
          {/* Site name */}
          <div
            style={{
              fontSize: '24px',
              fontWeight: 600,
              color: '#dc2626',
              marginBottom: '24px',
              letterSpacing: '0.05em',
              textTransform: 'uppercase',
            }}
          >
            {site}
          </div>

          {/* Article title */}
          <div
            style={{
              fontSize: displayTitle.length > 60 ? '40px' : '52px',
              fontWeight: 800,
              color: '#111827',
              lineHeight: 1.2,
              marginBottom: '32px',
              maxWidth: '900px',
            }}
          >
            {displayTitle}
          </div>

          {/* Divider */}
          <div
            style={{
              width: '80px',
              height: '4px',
              backgroundColor: '#dc2626',
              borderRadius: '2px',
              marginBottom: '24px',
            }}
          />

          {/* Branding */}
          <div
            style={{
              fontSize: '20px',
              fontWeight: 500,
              color: '#6b7280',
            }}
          >
            beritakarya.co
          </div>
        </div>

        {/* Bottom accent */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '8px',
            background: 'linear-gradient(90deg, #dc2626, #ef4444, #dc2626)',
          }}
        />
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
