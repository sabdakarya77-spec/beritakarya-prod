'use client';

import { useEffect, useState } from 'react';
import { getSavedArticles, SAVED_ARTICLES_UPDATED_EVENT } from '../lib/savedArticles';

export function useSavedArticles(site?: string) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const syncSavedArticles = () => {
      const articles = getSavedArticles();
      const filtered = site ? articles.filter((item) => item.site === site) : articles;
      setCount(filtered.length);
    };

    syncSavedArticles();
    window.addEventListener('storage', syncSavedArticles);
    window.addEventListener(SAVED_ARTICLES_UPDATED_EVENT, syncSavedArticles);

    return () => {
      window.removeEventListener('storage', syncSavedArticles);
      window.removeEventListener(SAVED_ARTICLES_UPDATED_EVENT, syncSavedArticles);
    };
  }, [site]);

  return { count };
}
