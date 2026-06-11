import { test, expect, type Page } from '@playwright/test'

const PUBLIC_ROUTES = ['/pusat', '/pusat/p/about', '/pusat/p/ethics']

async function hasHorizontalOverflow(page: Page) {
  return page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
}

test.describe('Container Layout System', () => {
  test('homepage has no horizontal overflow on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/pusat')
    await expect(page.locator('main')).toBeVisible()
    await expect.poll(() => hasHorizontalOverflow(page)).toBe(false)
  })

  test('public info pages render without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })

    for (const route of PUBLIC_ROUTES) {
      await page.goto(route)
      await expect(page.locator('main, article').first()).toBeVisible()
      await expect.poll(() => hasHorizontalOverflow(page)).toBe(false)
    }
  })

  test('main content stays within viewport across breakpoints', async ({ page }) => {
    const viewports = [
      { width: 375, height: 667 },
      { width: 768, height: 800 },
      { width: 1280, height: 800 },
    ]

    for (const viewport of viewports) {
      await page.setViewportSize(viewport)
      await page.goto('/pusat')

      const container = page.locator('main').first()
      await expect(container).toBeVisible()

      const box = await container.boundingBox()
      expect(box).not.toBeNull()

      if (box) {
        expect(box.x).toBeGreaterThanOrEqual(0)
        expect(box.x + box.width).toBeLessThanOrEqual(viewport.width)
      }
    }
  })

  test('layout remains stable after initial render', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/pusat')

    const initialWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('main')).toBeVisible()

    await expect
      .poll(async () => {
        const currentWidth = await page.evaluate(() => document.documentElement.scrollWidth)
        return Math.abs(currentWidth - initialWidth)
      })
      .toBeLessThanOrEqual(1)
  })
})
