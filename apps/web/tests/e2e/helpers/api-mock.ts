import type { Page } from '@playwright/test';

/**
 * Helper to mock API endpoints using page.route().
 * All routes are prefixed with the API path to match the axios baseURL.
 */

// ─── Public Ads ──────────────────────────────────────────────────────────────

interface MockAd {
  id: string;
  siteId: string;
  slot: string;
  imageUrl: string | null;
  linkUrl: string | null;
  isActive: boolean;
  order: number;
}

export const MOCK_ADS: MockAd[] = [
  {
    id: 'ad-001',
    siteId: 'pusat',
    slot: 'HOME_TOP',
    imageUrl: 'https://example.com/home-top.webp',
    linkUrl: 'https://example.com',
    isActive: true,
    order: 0,
  },
  {
    id: 'ad-002',
    siteId: 'pusat',
    slot: 'HOME_FEED_1',
    imageUrl: 'https://example.com/home-feed1.webp',
    linkUrl: 'https://example.com',
    isActive: true,
    order: 0,
  },
];

export function mockAdPublic(page: Page, ads: MockAd[] = MOCK_ADS) {
  page.route('**/api/v1/ads/public**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: ads }),
    });
  });
}

// ─── Ad Management (CRUD) ────────────────────────────────────────────────────

export function mockAdsList(page: Page, ads: MockAd[] = MOCK_ADS) {
  page.route('**/api/v1/ads**', (route) => {
    const url = route.request().url();
    // Only match the list endpoint, not sub-paths
    if (route.request().method() === 'GET' && url.endsWith('/api/v1/ads')) {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: ads }),
      });
    } else {
      route.continue();
    }
  });
}

// ─── Media Upload ────────────────────────────────────────────────────────────

export function mockMediaUpload(page: Page, url: string = 'https://example.com/uploaded.webp') {
  page.route('**/api/v1/media/upload**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { url } }),
    });
  });
}

// ─── Comments Stats ──────────────────────────────────────────────────────────

export function mockCommentsStats(page: Page) {
  page.route('**/api/v1/comments/stats**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { pending: 3, approvedToday: 5, total: 120 } }),
    });
  });
}

// ─── Convenience: Mock all ad-related endpoints ──────────────────────────────

export function mockAllAdEndpoints(page: Page) {
  mockAdPublic(page);
  mockAdsList(page);
  mockMediaUpload(page);
}