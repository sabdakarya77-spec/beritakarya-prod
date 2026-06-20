export const SAVED_ARTICLES_STORAGE_KEY = 'bk:saved-articles';
export const SAVED_ARTICLES_UPDATED_EVENT = 'bk:saved-articles-updated';

export type SavedArticle = {
  id: string;
  slug: string;
  site: string;
  title: string;
  featuredImage?: string | null;
  featuredImageBlur?: string | null;
  featuredImageColor?: string | null;
  readingTimeMin?: number | null;
  publishedAt?: string | null;
  createdAt?: string | null;
  category?: { name?: string | null } | null;
  author?: { name?: string | null } | null;
  blocks?: Array<{ type: string; content?: string; url?: string }>;
};

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function emitSavedArticlesUpdated() {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(SAVED_ARTICLES_UPDATED_EVENT));
}

export function getSavedArticles(): SavedArticle[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(SAVED_ARTICLES_STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function isArticleSaved(site: string, slug: string) {
  return getSavedArticles().some((item) => item.site === site && item.slug === slug);
}

export function saveArticle(article: SavedArticle) {
  if (!canUseStorage()) return;

  const current = getSavedArticles().filter(
    (item) => !(item.site === article.site && item.slug === article.slug)
  );

  const next = [article, ...current];
  window.localStorage.setItem(SAVED_ARTICLES_STORAGE_KEY, JSON.stringify(next));
  emitSavedArticlesUpdated();
}

export function removeSavedArticle(site: string, slug: string) {
  if (!canUseStorage()) return;

  const next = getSavedArticles().filter((item) => !(item.site === site && item.slug === slug));
  window.localStorage.setItem(SAVED_ARTICLES_STORAGE_KEY, JSON.stringify(next));
  emitSavedArticlesUpdated();
}

export function toggleSavedArticle(article: SavedArticle) {
  const alreadySaved = isArticleSaved(article.site, article.slug);

  if (alreadySaved) {
    removeSavedArticle(article.site, article.slug);
    return false;
  }

  saveArticle(article);
  return true;
}

interface ArticleInput {
  id?: string
  slug: string
  title: string
  featuredImage?: string | null
  featuredImageBlur?: string | null
  featuredImageColor?: string | null
  readingTimeMin?: number | null
  publishedAt?: string | null
  createdAt?: string | null
  category?: { name?: string | null } | null
  author?: { name?: string | null } | null
  blocks?: Array<{ type: string; content?: string; url?: string }>
}

export function createSavedArticlePayload(article: ArticleInput, site: string): SavedArticle {
  const excerpt = (Array.isArray(article.blocks) ? article.blocks : []).find(block => block.type === 'paragraph')?.content || '';

  return {
    id: article.id || article.slug,
    slug: article.slug,
    site,
    title: article.title,
    featuredImage: article.featuredImage || null,
    featuredImageBlur: article.featuredImageBlur || null,
    featuredImageColor: article.featuredImageColor || null,
    readingTimeMin: article.readingTimeMin || null,
    publishedAt: article.publishedAt || null,
    createdAt: article.createdAt || null,
    category: article.category ? { name: article.category.name } : null,
    author: article.author ? { name: article.author.name } : null,
    blocks: excerpt ? [{ type: 'paragraph', content: excerpt }] : [],
  };
}
