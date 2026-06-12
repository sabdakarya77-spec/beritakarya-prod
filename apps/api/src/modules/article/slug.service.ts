import { Prisma } from '@prisma/client'
import { generateSlug } from '@beritakarya/utils'
import * as repo from './article.repository'

const MAX_SLUG_ATTEMPTS = 5

export function isSlugUniqueViolation(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientKnownRequestError &&
    err.code === 'P2002'
  )
}

/** Resolve a slug that does not collide with active (non-deleted) articles. */
export async function resolveUniqueSlug(
  title: string,
  siteId: string,
  excludeId?: string
): Promise<string> {
  const base = generateSlug(title)
  let counter = 2
  let slug = base
  while (await repo.slugExists(slug, siteId, excludeId)) {
    slug = `${base}-${counter++}`
  }
  return slug
}

export async function createArticleWithSlugRetry(
  data: Parameters<typeof repo.createArticle>[0]
) {
  let slug = data.slug || (await resolveUniqueSlug(data.title, data.siteId))
  const base = generateSlug(data.title)
  let counter = 2

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    try {
      return await repo.createArticle({ ...data, slug })
    } catch (err) {
      if (!isSlugUniqueViolation(err) || attempt === MAX_SLUG_ATTEMPTS - 1) {
        throw err
      }
      slug = `${base}-${counter++}`
    }
  }

  throw Object.assign(new Error('Gagal membuat slug unik untuk artikel'), {
    statusCode: 409
  })
}

export async function updateArticleWithSlugRetry(
  id: string,
  siteId: string,
  data: Parameters<typeof repo.updateArticle>[2]
) {
  if (!data.slug) {
    return repo.updateArticle(id, siteId, data)
  }

  let slug = data.slug
  let counter = 2

  for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
    try {
      return await repo.updateArticle(id, siteId, { ...data, slug })
    } catch (err) {
      if (!isSlugUniqueViolation(err) || attempt === MAX_SLUG_ATTEMPTS - 1) {
        throw err
      }
      slug = `${data.slug}-${counter++}`
    }
  }

  throw Object.assign(new Error('Gagal memperbarui slug artikel'), {
    statusCode: 409
  })
}
