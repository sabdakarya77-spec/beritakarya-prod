type BadgeVariant = 'breaking' | 'exclusive' | 'analysis' | 'live' | 'photo' | 'video' | 'featured' | 'opinion';

export function resolveArticleBadge(article: {
  isBreaking?: boolean;
  isExclusive?: boolean;
  isFeatured?: boolean;
  status?: string;
}): BadgeVariant | null {
  if (article.isBreaking) return 'breaking';
  if (article.isExclusive) return 'exclusive';
  if (article.isFeatured) return 'featured';
  if (article.status === 'live') return 'live';
  return null;
}