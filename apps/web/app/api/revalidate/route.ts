import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

/**
 * POST /api/revalidate
 * Webhook endpoint untuk men-trigger revalidasi Next.js Data Cache setelah
 * mutasi data di backend (create/update/delete kategori, artikel, dll).
 *
 * Diamankan dengan secret token yang di-set via env REVALIDATE_SECRET.
 *
 * Body: { tag: string, secret: string }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { tag, secret } = body

    const revalidateSecret = process.env.REVALIDATE_SECRET
    if (!revalidateSecret || secret !== revalidateSecret) {
      return NextResponse.json({ success: false, message: 'Invalid secret' }, { status: 401 })
    }

    if (!tag || typeof tag !== 'string') {
      return NextResponse.json({ success: false, message: 'Tag is required' }, { status: 400 })
    }

    // Next.js 16: revalidateTag butuh 2 argumen.
    // { expire: 0 } = invalidasi langsung (cocok untuk webhook)
    revalidateTag(tag, { expire: 0 })
    console.log(`[Revalidate] Tag "${tag}" revalidated`)

    return NextResponse.json({ success: true, revalidated: true, tag })
  } catch (err) {
    console.error('[Revalidate] Error:', err)
    return NextResponse.json({ success: false, message: 'Internal server error' }, { status: 500 })
  }
}
