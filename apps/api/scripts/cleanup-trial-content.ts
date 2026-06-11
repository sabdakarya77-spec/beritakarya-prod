/**
 * Bersihkan konten trial per site (artikel, media DB, file upload, Meilisearch).
 *
 * Contoh:
 *   pnpm --filter @beritakarya/api exec ts-node scripts/cleanup-trial-content.ts --site=pusat --dry-run
 *   pnpm --filter @beritakarya/api exec ts-node scripts/cleanup-trial-content.ts --site=pusat --confirm --clear-uploads --clear-meilisearch
 */
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'
import { MeiliSearch } from 'meilisearch'
import fs from 'fs/promises'
import path from 'path'

const prisma = new PrismaClient()

type Options = {
  site: string
  dryRun: boolean
  confirm: boolean
  clearUploads: boolean
  clearMeilisearch: boolean
  clearNotifications: boolean
}

function parseArgs(): Options {
  const args = process.argv.slice(2).filter((a) => a !== '--')
  let site = 'pusat'
  let dryRun = false
  let confirm = false
  let clearUploads = false
  let clearMeilisearch = false
  let clearNotifications = false

  for (const arg of args) {
    if (arg === '--dry-run') dryRun = true
    else if (arg === '--confirm') confirm = true
    else if (arg === '--clear-uploads') clearUploads = true
    else if (arg === '--clear-meilisearch') clearMeilisearch = true
    else if (arg === '--clear-notifications') clearNotifications = true
    else if (arg.startsWith('--site=')) site = arg.slice('--site='.length).trim()
    else if (arg === '--help' || arg === '-h') {
      printHelp()
      process.exit(0)
    } else {
      console.error(`Argumen tidak dikenal: ${arg}`)
      printHelp()
      process.exit(1)
    }
  }

  if (!site) {
    console.error('❌ --site wajib diisi (contoh: --site=pusat)')
    process.exit(1)
  }

  return { site, dryRun, confirm, clearUploads, clearMeilisearch, clearNotifications }
}

function printHelp() {
  console.log(`
Bersihkan konten editorial trial untuk satu site.

Flags:
  --site=pusat          Site yang dibersihkan (default: pusat)
  --dry-run             Simulasi: tampilkan jumlah, tidak menghapus
  --confirm             Wajib untuk eksekusi hapus (tanpa --dry-run)
  --clear-uploads       Hapus file fisik dari baris Media site ini
  --clear-meilisearch   Hapus dokumen artikel site ini dari Meilisearch
  --clear-notifications Hapus notifikasi in-app untuk site ini

Yang TIDAK dihapus: User, Site, Category, KYC, sesi auth.

Contoh:
  ts-node scripts/cleanup-trial-content.ts --site=pusat --dry-run
  ts-node scripts/cleanup-trial-content.ts --site=pusat --confirm --clear-uploads
`)
}

type Counts = {
  pageViews: number
  comments: number
  articles: number
  articleVersions: number
  media: number
  notifications: number
}

async function countTargets(siteId: string, withNotifications: boolean): Promise<Counts> {
  const articleIds = await prisma.article.findMany({
    where: { siteId },
    select: { id: true }
  })
  const ids = articleIds.map((a) => a.id)

  const [pageViews, comments, articles, articleVersions, media, notifications] =
    await Promise.all([
      prisma.pageView.count({
        where: {
          OR: [{ siteId }, ...(ids.length ? [{ articleId: { in: ids } }] : [])]
        }
      }),
      prisma.comment.count({ where: { siteId } }),
      prisma.article.count({ where: { siteId } }),
      ids.length
        ? prisma.articleVersion.count({ where: { articleId: { in: ids } } })
        : Promise.resolve(0),
      prisma.media.count({ where: { siteId } }),
      withNotifications
        ? prisma.notification.count({ where: { siteId } })
        : Promise.resolve(0)
    ])

  return {
    pageViews,
    comments,
    articles,
    articleVersions,
    media,
    notifications
  }
}

function resolveUploadPath(mediaUrl: string, uploadRoot: string): string | null {
  const marker = '/uploads/'
  const idx = mediaUrl.indexOf(marker)
  if (idx === -1) return null
  const relative = mediaUrl.slice(idx + marker.length).split('?')[0]
  if (!relative || relative.includes('..')) return null
  return path.join(uploadRoot, relative)
}

async function collectUploadFiles(siteId: string, uploadRoot: string): Promise<string[]> {
  const rows = await prisma.media.findMany({
    where: { siteId },
    select: { url: true, thumbUrl: true }
  })
  const paths = new Set<string>()
  for (const row of rows) {
    for (const url of [row.url, row.thumbUrl]) {
      const p = resolveUploadPath(url, uploadRoot)
      if (p) paths.add(p)
    }
  }
  return [...paths]
}

async function clearMeilisearchForSite(siteId: string, dryRun: boolean): Promise<void> {
  const host = process.env.MEILISEARCH_HOST
  const key = process.env.MEILISEARCH_KEY
  if (!host || !key) {
    console.log('⏭️  Meilisearch: MEILISEARCH_HOST/KEY tidak diset — dilewati')
    return
  }

  const safeSiteId = siteId.replace(/[^a-zA-Z0-9-]/g, '')
  const client = new MeiliSearch({ host, apiKey: key })
  const index = client.index('articles')

  if (dryRun) {
    const stats = await index.getStats().catch(() => null)
    console.log(
      `🔍 Meilisearch [dry-run]: akan hapus dokumen dengan filter siteId = "${safeSiteId}"` +
        (stats ? ` (index saat ini ~${stats.numberOfDocuments} dokumen total)` : '')
    )
    return
  }

  await index.deleteDocuments({ filter: `siteId = "${safeSiteId}"` })
  console.log(`✅ Meilisearch: dokumen site "${safeSiteId}" dihapus dari index articles`)
}

async function run() {
  const opts = parseArgs()

  const site = await prisma.site.findUnique({ where: { id: opts.site } })
  if (!site) {
    console.error(`❌ Site "${opts.site}" tidak ditemukan di database`)
    process.exit(1)
  }

  const uploadRoot = path.resolve(
    process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads')
  )

  console.log('═══════════════════════════════════════════════════════')
  console.log(`  Cleanup trial — site: ${opts.site} (${site.name})`)
  console.log(`  Mode: ${opts.dryRun ? 'DRY-RUN (tidak ada perubahan)' : 'EKSEKUSI HAPUS'}`)
  console.log('═══════════════════════════════════════════════════════\n')

  const counts = await countTargets(opts.site, opts.clearNotifications)
  const uploadFiles = opts.clearUploads
    ? await collectUploadFiles(opts.site, uploadRoot)
    : []

  console.log('Target yang akan dibersihkan:')
  console.log(`  • PageView              : ${counts.pageViews}`)
  console.log(`  • Comment               : ${counts.comments}`)
  console.log(`  • Article               : ${counts.articles}`)
  console.log(`  • ArticleVersion        : ${counts.articleVersions} (cascade dari Article)`)
  console.log(`  • Media (DB)            : ${counts.media}`)
  if (opts.clearNotifications) {
    console.log(`  • Notification          : ${counts.notifications}`)
  }
  if (opts.clearUploads) {
    console.log(`  • File upload (disk)    : ${uploadFiles.length} file di ${uploadRoot}`)
  }
  if (opts.clearMeilisearch) {
    console.log('  • Meilisearch           : dokumen artikel per site')
  }
  console.log('')

  if (opts.dryRun) {
    console.log('✅ Dry-run selesai. Tambahkan --confirm untuk menghapus (tanpa --dry-run).')
    if (opts.clearMeilisearch) {
      await clearMeilisearchForSite(opts.site, true)
    }
    return
  }

  if (!opts.confirm) {
    console.error(
      '❌ Penghapusan dibatalkan. Tambahkan --confirm untuk menjalankan, atau --dry-run untuk simulasi.'
    )
    process.exit(1)
  }

  const articleIds = (
    await prisma.article.findMany({
      where: { siteId: opts.site },
      select: { id: true }
    })
  ).map((a) => a.id)

  await prisma.$transaction(async (tx) => {
    await tx.pageView.deleteMany({
      where: {
        OR: [
          { siteId: opts.site },
          ...(articleIds.length ? [{ articleId: { in: articleIds } }] : [])
        ]
      }
    })
    await tx.comment.deleteMany({ where: { siteId: opts.site } })
    await tx.article.deleteMany({ where: { siteId: opts.site } })
    await tx.media.deleteMany({ where: { siteId: opts.site } })
    if (opts.clearNotifications) {
      await tx.notification.deleteMany({ where: { siteId: opts.site } })
    }
  })

  console.log('✅ Database: artikel & data terkait site ini telah dihapus')

  if (opts.clearUploads) {
    let removed = 0
    let missing = 0
    for (const filePath of uploadFiles) {
      try {
        await fs.unlink(filePath)
        removed++
      } catch (err: any) {
        if (err?.code === 'ENOENT') missing++
        else console.warn(`⚠️  Gagal hapus ${filePath}: ${err.message}`)
      }
    }
    console.log(`✅ Upload files: ${removed} dihapus, ${missing} sudah tidak ada`)
  }

  if (opts.clearMeilisearch) {
    await clearMeilisearchForSite(opts.site, false)
  }

  console.log('\n🎉 Cleanup selesai. Site, user, dan kategori tidak diubah.')
}

run()
  .catch((err) => {
    console.error('❌ Cleanup gagal:', err)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
