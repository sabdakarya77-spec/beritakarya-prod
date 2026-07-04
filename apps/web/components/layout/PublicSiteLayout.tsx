'use client';

import { useState, useEffect, lazy, Suspense } from 'react';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import BreakingNewsTicker from '../ui/BreakingNewsTicker';
import MobileBottomNav from './MobileBottomNav';
import { CATEGORIES_CONFIG, CategoryItem, type SiteConfig } from '../../lib/constants';
import { api } from '../../lib/api';
import { Container } from './Container';

// Lazy load components that are hidden on initial render
const MobileMenu = lazy(() => import('./MobileMenu'));
const FullScreenSearch = lazy(() => import('../ui/FullScreenSearch'));
const AISummary = lazy(() => import('../ui/AISummary'));

interface ApiCategory {
  name: string;
  slug: string;
  subCategories?: ApiCategory[];
}

interface PublicSiteLayoutProps {
  children: React.ReactNode;
  siteConfig: SiteConfig;
  initialCategory?: string;
  hideTicker?: boolean;
}

export default function PublicSiteLayout({
  children,
  siteConfig,
  initialCategory = 'terbaru',
  hideTicker = false
}: PublicSiteLayoutProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  useEffect(() => {
    setSelectedCategory(initialCategory);
  }, [initialCategory]);

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>(CATEGORIES_CONFIG);

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await api.get('/categories/tree', {
          params: { site: siteConfig.id }
        });
          if (data.success && data.data && data.data.length > 0) {
          const apiCategories = data.data as ApiCategory[];
          const filteredCategories = apiCategories.filter(
            (cat) => cat.slug !== 'terbaru' && cat.slug !== 'tersimpan'
          )
          const mapped: CategoryItem[] = [
            { name: 'Terbaru', slug: 'terbaru' },
            ...filteredCategories.map((cat) => ({
              name: cat.name,
              slug: cat.slug,
              subCategories: cat.subCategories?.map((sub) => ({
                name: sub.name,
                slug: sub.slug,
                subCategories: sub.subCategories?.map((subsub) => ({
                  name: subsub.name,
                  slug: subsub.slug
                }))
              }))
            })),
            { name: 'Tersimpan', slug: 'tersimpan' }
          ];
          setCategories(mapped);
        }
      } catch (error) {
        console.error('Failed to load categories tree, falling back to static config', error);
      }
    }

    loadCategories();
  }, [siteConfig.id]);

  return (
    <div
      className="min-h-screen bg-[var(--bg-main)] pb-28 transition-colors duration-500 md:pb-0"
      style={{ '--brand-red': siteConfig.appearance?.primaryColor || '#B91C1C' } as React.CSSProperties}
    >
      <a href="#main-content" className="skip-to-content">
        Langsung ke konten
      </a>

      {!hideTicker && (
        <div className="border-b border-black/5 bg-brand-black text-white shadow-[0_16px_32px_rgba(2,6,23,0.18)] dark:border-white/5 dark:bg-[#020617]">
          <Container>
            <BreakingNewsTicker />
          </Container>
        </div>
      )}

      <Navbar
        siteConfig={siteConfig}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        onSearchClick={() => setIsSearchOpen(true)}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {children}

      <SiteFooter
        siteConfig={siteConfig}
        categories={categories}
      />

      <MobileBottomNav
        site={siteConfig.id}
        onSearchClick={() => setIsSearchOpen(true)}
        selectedCategory={selectedCategory}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      {/* Lazy-loaded overlay components — only loaded when triggered */}
      <Suspense fallback={null}>
        {isMenuOpen && (
          <MobileMenu
            isOpen={isMenuOpen}
            onClose={() => setIsMenuOpen(false)}
            categories={categories}
            siteConfig={siteConfig}
            selectedCategory={selectedCategory}
            onCategoryClick={(slug) => setSelectedCategory(slug)}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        {isSearchOpen && (
          <FullScreenSearch
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            site={siteConfig.id}
            trendingTopics={(siteConfig.trendingTopics as string[]) || undefined}
          />
        )}
      </Suspense>

      <Suspense fallback={null}>
        <AISummary title="Ringkasan AI" content="Konten ringkasan otomatis akan muncul di sini." />
      </Suspense>
    </div>
  );
}
