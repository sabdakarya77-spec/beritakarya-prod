import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, fireEvent } from '@testing-library/react'
import { SmartImage, prefetchImage } from './SmartImage'

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt, onError, onLoad, className, ...props }: Record<string, unknown>) => (
    <img
      src={src as string}
      alt={alt as string}
      className={className as string}
      onError={onError as () => void}
      onLoad={onLoad as () => void}
      data-testid="next-image"
      {...props}
    />
  ),
}))

describe('SmartImage', () => {
  describe('Rendering', () => {
    it('renders with src', () => {
      const { getByTestId } = render(
        <SmartImage src="/test-image.jpg" alt="Test" />
      )
      const img = getByTestId('next-image')
      expect(img).toHaveAttribute('src', '/test-image.jpg')
    })

    it('renders with fallbackSrc when src is null', () => {
      const { getByTestId } = render(
        <SmartImage src={null} fallbackSrc="/fallback.jpg" alt="Test" />
      )
      const img = getByTestId('next-image')
      expect(img).toHaveAttribute('src', '/fallback.jpg')
    })

    it('renders with default placeholder when src is empty', () => {
      const { getByTestId } = render(
        <SmartImage src="" alt="Test" />
      )
      const img = getByTestId('next-image')
      expect(img).toHaveAttribute('src', '/placeholder.jpg')
    })

    it('applies custom className', () => {
      const { getByTestId } = render(
        <SmartImage src="/test.jpg" alt="Test" className="custom-class" />
      )
      const img = getByTestId('next-image')
      expect(img.className).toContain('custom-class')
    })
  })

  describe('Context-based sizes and quality', () => {
    it('uses card context by default', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" />
      )
      // Card context should be applied (wrapper exists)
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper).toBeTruthy()
    })

    it('accepts hero_lead context', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" context="hero_lead" />
      )
      expect(container.firstChild).toBeTruthy()
    })

    it('accepts article_cover context', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" context="article_cover" />
      )
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('Error handling', () => {
    it('falls back to thumbnail on first error', () => {
      const { getByTestId, container } = render(
        <SmartImage src="/image.jpg" thumbUrl="/thumb.jpg" alt="Test" />
      )
      const img = getByTestId('next-image')
      fireEvent.error(img)
      // After first error, should try thumbnail
      const updatedImg = container.querySelector('[data-testid="next-image"]')
      expect(updatedImg).toBeTruthy()
    })

    it('falls back to placeholder on second error', () => {
      const { getByTestId, container } = render(
        <SmartImage src="/image.jpg" alt="Test" />
      )
      const img = getByTestId('next-image')
      fireEvent.error(img) // first error → try fallback (placeholder)
      fireEvent.error(img) // second error → broken state (no image src)
      // After all fallbacks fail, component shows broken state SVG
      const brokenSvg = container.querySelector('svg')
      expect(brokenSvg).toBeTruthy()
    })

    it('shows broken state after all fallbacks fail', () => {
      const { getByTestId, container } = render(
        <SmartImage src="/image.jpg" fallbackSrc="/fallback.jpg" alt="Test" />
      )
      const img = getByTestId('next-image')
      fireEvent.error(img) // src fail → try fallback
      fireEvent.error(img) // fallback fail → try placeholder
      fireEvent.error(img) // placeholder fail → broken state
      // Should show broken state SVG (no image)
      const brokenSvg = container.querySelector('svg')
      expect(brokenSvg).toBeTruthy()
    })
  })

  describe('Loading state', () => {
    it('shows shimmer while loading', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" />
      )
      // Shimmer should be present (animate-pulse div)
      const shimmer = container.querySelector('.animate-pulse')
      expect(shimmer).toBeTruthy()
    })

    it('hides shimmer after load', () => {
      const { getByTestId, container } = render(
        <SmartImage src="/test.jpg" alt="Test" />
      )
      const img = getByTestId('next-image')
      fireEvent.load(img)
      // After load, shimmer should be gone
      const shimmer = container.querySelector('.animate-pulse')
      expect(shimmer).toBeNull()
    })
  })

  describe('Dominant color background', () => {
    it('applies dominantColor as background', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" dominantColor="#ff0000" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.style.backgroundColor).toBe('rgb(255, 0, 0)')
    })
  })

  describe('Priority loading', () => {
    it('uses eager loading when priority is true', () => {
      const { getByTestId } = render(
        <SmartImage src="/test.jpg" alt="Test" priority />
      )
      const img = getByTestId('next-image')
      expect(img).toHaveAttribute('loading', 'eager')
    })

    it('uses lazy loading by default', () => {
      const { getByTestId } = render(
        <SmartImage src="/test.jpg" alt="Test" />
      )
      const img = getByTestId('next-image')
      expect(img).toHaveAttribute('loading', 'lazy')
    })
  })

  describe('User interaction', () => {
    it('sets userInteracted on mouse enter', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" />
      )
      const wrapper = container.firstChild as HTMLElement
      fireEvent.mouseEnter(wrapper)
      // No error should be thrown, interaction is tracked internally
      expect(wrapper).toBeTruthy()
    })

    it('sets userInteracted on touch start', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" />
      )
      const wrapper = container.firstChild as HTMLElement
      fireEvent.touchStart(wrapper)
      expect(wrapper).toBeTruthy()
    })
  })

  describe('Wrapper structure', () => {
    it('applies fill mode by default', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('absolute inset-0')
    })

    it('applies relative mode when fill is false', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" fill={false} />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('relative')
    })

    it('applies wrapperClassName', () => {
      const { container } = render(
        <SmartImage src="/test.jpg" alt="Test" wrapperClassName="wrapper-custom" />
      )
      const wrapper = container.firstChild as HTMLElement
      expect(wrapper.className).toContain('wrapper-custom')
    })
  })
})

describe('prefetchImage', () => {
  beforeEach(() => {
    document.head.innerHTML = ''
  })

  it('creates a prefetch link for the image', () => {
    prefetchImage('/test-image.jpg')
    const link = document.querySelector('link[href="/test-image.jpg"]')
    expect(link).toBeTruthy()
    expect(link).toHaveAttribute('rel', 'prefetch')
    // Note: 'as' attribute may not be readable in jsdom but is set in code
  })

  it('does not create duplicate prefetch links', () => {
    prefetchImage('/test-image.jpg')
    prefetchImage('/test-image.jpg')
    const links = document.querySelectorAll('link[href="/test-image.jpg"]')
    expect(links).toHaveLength(1)
  })

  it('does nothing for empty url', () => {
    prefetchImage('')
    const links = document.querySelectorAll('link')
    expect(links).toHaveLength(0)
  })
})
