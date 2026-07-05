import { cn } from '@/lib/utils';

interface ContainerProps {
  children: React.ReactNode;
  className?: string;
  size?: 'default' | 'content' | 'full' | 'wide';
  bleed?: boolean;
}

/**
 * Standardized container wrapper for all public pages.
 * Provides consistent responsive padding and max-width across the site.
 * 
 * @param children - Content to wrap
 * @param className - Additional CSS classes
 * @param size - Container width preset:
 *   - 'default': max-w-container (1160px) for general content
 *   - 'content': max-w-content (760px) for optimal reading (articles, text-heavy pages)
 *   - 'full': max-w-full for edge-to-edge sections
 *   - 'wide': max-w-wide (1400px) for full-width hero/grids
 * @param bleed - When true, creates edge-to-edge effect by extending to viewport edges
 *                while maintaining inner content padding balance. Note: bleed mode
 *                disables `mx-auto` to avoid class conflicts, so use inside a centered
 *                parent container for proper layout.
 * 
 * @example
 * // Standard container
 * <Container>
 *   <PageContent />
 * </Container>
 * 
 * @example
 * // Content-width for articles
 * <Container size="content">
 *   <ArticleBody />
 * </Container>
 * 
 * @example
 * // Edge-to-edge hero section (inside a centered parent)
 * <Container bleed>
 *   <HeroSection />
 * </Container>
 */
export function Container({ 
  children, 
  className = '',
  size = 'default',
  bleed = false 
}: ContainerProps) {
  const sizeClasses = {
    default: 'max-w-container',
    content: 'max-w-content',
    full: 'max-w-full',
    wide: 'max-w-wide'
  };

  return (
    <div className={cn(
      bleed 
        ? '-mx-4 md:-mx-8 lg:-mx-10 px-4 md:px-8 lg:px-10'
        : 'px-4 md:px-8 lg:px-10',
      sizeClasses[size],
      !bleed ? 'mx-auto' : '',
      className
    )}>
      {children}
    </div>
  );
}
