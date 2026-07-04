'use client';

import dynamic from 'next/dynamic';

export const CommentSection = dynamic(
  () => import('../../../../components/ui/CommentSection'),
  {
    ssr: false,
    loading: () => <div className="mt-8 h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-white/5" />,
  }
);

export const ArticleFloatingTools = dynamic(
  () => import('../../../../components/ui/ArticleFloatingTools'),
  { ssr: false }
);

export const MobileArticleTools = dynamic(
  () => import('../../../../components/ui/MobileArticleTools'),
  { ssr: false }
);
