import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import {
  SiFacebook,
  SiInstagram,
  SiTelegram,
  SiWhatsapp,
  SiX,
  SiYoutube,
  SiTiktok,
} from './SocialIcons'

const icons = [
  { name: 'SiFacebook', Component: SiFacebook },
  { name: 'SiInstagram', Component: SiInstagram },
  { name: 'SiTelegram', Component: SiTelegram },
  { name: 'SiWhatsapp', Component: SiWhatsapp },
  { name: 'SiX', Component: SiX },
  { name: 'SiYoutube', Component: SiYoutube },
  { name: 'SiTiktok', Component: SiTiktok },
]

describe('SocialIcons', () => {
  describe.each(icons)('$name', ({ Component }) => {
    it('renders an SVG element', () => {
      const { container } = render(<Component />)
      const svg = container.querySelector('svg')
      expect(svg).toBeTruthy()
    })

    it('has correct viewBox', () => {
      const { container } = render(<Component />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('viewBox', '0 0 24 24')
    })

    it('has role="img"', () => {
      const { container } = render(<Component />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('role', 'img')
    })

    it('has default size 24x24', () => {
      const { container } = render(<Component />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '24')
      expect(svg).toHaveAttribute('height', '24')
    })

    it('accepts custom size', () => {
      const { container } = render(<Component size={32} />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('width', '32')
      expect(svg).toHaveAttribute('height', '32')
    })

    it('accepts custom className', () => {
      const { container } = render(<Component className="text-red-500" />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('class', 'text-red-500')
    })

    it('has fill="currentColor" on the SVG element', () => {
      const { container } = render(<Component />)
      const svg = container.querySelector('svg')
      expect(svg).toHaveAttribute('fill', 'currentColor')
    })

    it('has a non-empty path d attribute', () => {
      const { container } = render(<Component />)
      const path = container.querySelector('svg path')
      const d = path?.getAttribute('d')
      expect(d).toBeTruthy()
      expect(d!.length).toBeGreaterThan(10)
    })
  })

  describe('All icons', () => {
    it('renders all 7 social icons', () => {
      expect(icons).toHaveLength(7)
    })

    it('each icon has a unique SVG path', () => {
      const paths = icons.map(({ Component }) => {
        const { container } = render(<Component />)
        return container.querySelector('svg path')?.getAttribute('d')
      })
      const uniquePaths = new Set(paths)
      expect(uniquePaths.size).toBe(paths.length)
    })
  })
})
