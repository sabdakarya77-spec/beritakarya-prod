'use client';

import { useState, useEffect } from 'react';
import Navbar from './Navbar';
import SiteFooter from './SiteFooter';
import BreakingNewsTicker from '../ui/BreakingNewsTicker';
import AISummary from '../ui/AISummary';
import MobileBottomNav from './MobileBottomNav';
import MobileMenu from './MobileMenu';
import FullScreenSearch from '../ui/FullScreenSearch';
import { CATEGORIES_CONFIG, CategoryItem, type SiteConfig } from '../../lib/constants';
import { api } from '../../lib/api';
import { Container } from './Container';

interface ApiCategory {
  name: string;
  slug: string;
  subCategories?: ApiCategory[];
}

interface PublicSiteLayoutProps {
  children: React.ReactNode;
  siteConfig: SiteConfig;
  initialCategory?: string;
}

export default function PublicSiteLayout({ children, siteConfig, initialCategory = 'terbaru' }: PublicSiteLayoutProps) {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [categories, setCategories] = useState<CategoryItem[]>(CATEGORIES_CONFIG);

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data } = await api.get('/categories/tree', {
          params: { site: siteConfig.id }
        });
          if (data.success && data.data && data.data.length > 0) {
          // Filter out sistem categories (terbaru & tersimpan) from API response to avoid duplicates
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
                // Map 3rd-level sub-subcategories (Navbar supports 3 levels)
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
      {/* Skip-to-content for keyboard and screen reader users */}
      <a href="#main-content" className="skip-to-content">
        Langsung ke konten
      </a>

      <div className="border-b border-black/5 bg-brand-black text-white shadow-[0_16px_32px_rgba(2,6,23,0.18)] dark:border-white/5 dark:bg-[#020617]">
        <Container>
          <BreakingNewsTicker />
        </Container>
      </div>

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

      {/* AI Summary is hidden by default in its component logic */}
      <AISummary title="Ringkasan AI" content="Konten ringkasan otomatis akan muncul di sini." />

      <MobileBottomNav 
        site={siteConfig.id} 
        onSearchClick={() => setIsSearchOpen(true)}
        selectedCategory={selectedCategory}
        onMenuClick={() => setIsMenuOpen(true)}
      />

      <MobileMenu 
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        categories={categories}
        siteConfig={siteConfig}
        selectedCategory={selectedCategory}
        onCategoryClick={(slug) => {
          setSelectedCategory(slug);
          // router push logic is handled in Navbar, but we can sync here
        }}
      />

      <FullScreenSearch 
        isOpen={isSearchOpen} 
        onClose={() => setIsSearchOpen(false)} 
        site={siteConfig.id} 
        trendingTopics={(siteConfig.trendingTopics as string[]) || undefined}
      />
    </div>
  );
}
