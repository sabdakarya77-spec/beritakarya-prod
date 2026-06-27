import type { Page } from '@playwright/test';

/**
 * Helper to mock API endpoints using page.route().
 * All routes are prefixed with the API path to match the axios baseURL.
 */

// ─── Ad Packages ─────────────────────────────────────────────────────────────

interface MockAdPackage {
  id: string;
  name: string;
  slot: string;
  durationDays: number;
  price: string;
  description: string;
  allowedFormat: string;
  isActive: boolean;
}

export const MOCK_PACKAGES: MockAdPackage[] = [
  {
    id: 'pkg-home-top-30',
    name: 'Hero Banner Pusat',
    slot: 'HOME_TOP',
    durationDays: 30,
    price: '1500000',
    description: 'Impresi tertinggi di first-fold bagian atas homepage.',
    allowedFormat: 'ALL',
    isActive: true,
  },
  {
    id: 'pkg-home-feed1-14',
    name: 'Feed Atas',
    slot: 'HOME_FEED_1',
    durationDays: 14,
    price: '500000',
    description: 'Slot iklan di tengah feed homepage.',
    allowedFormat: 'IMAGE',
    isActive: true,
  },
];

export function mockAdPackages(page: Page, packages: MockAdPackage[] = MOCK_PACKAGES) {
  page.route(/\/api\/v1\/ads\/packages/, (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: packages }),
    });
  });
}

// ─── Ad Bookings ─────────────────────────────────────────────────────────────

interface MockAdBooking {
  id: string;
  userId: string;
  siteId: string;
  packageId: string;
  package: MockAdPackage;
  imageUrl: string;
  linkUrl: string;
  startDate: string;
  endDate: string;
  paymentStatus: string;
  status: string;
  impressions: number;
  clicks: number;
  user?: { name: string; email: string };
}

export const MOCK_BOOKINGS: MockAdBooking[] = [
  {
    id: 'booking-001',
    userId: 'test-advertiser-id',
    siteId: 'pusat',
    packageId: 'pkg-home-top-30',
    package: MOCK_PACKAGES[0],
    imageUrl: 'https://example.com/banner.webp',
    linkUrl: 'https://example.com',
    startDate: '2026-06-01T00:00:00.000Z',
    endDate: '2026-07-01T00:00:00.000Z',
    paymentStatus: 'PAID',
    status: 'ACTIVE',
    impressions: 1250,
    clicks: 45,
    user: { name: 'Test Advertiser', email: 'advertiser@test.com' },
  },
];

export function mockAdBookingsMy(page: Page, bookings: MockAdBooking[] = MOCK_BOOKINGS) {
  page.route('**/api/v1/ads/bookings/my', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: bookings }),
    });
  });
}

export function mockAdBookingsAll(page: Page, bookings: MockAdBooking[] = MOCK_BOOKINGS) {
  page.route('**/api/v1/ads/bookings/all', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: bookings }),
    });
  });
}

// ─── Public Ads ──────────────────────────────────────────────────────────────

interface MockAd {
  id: string;
  siteId: string;
  slot: string;
  imageUrl: string | null;
  linkUrl: string | null;
  code: string | null;
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
    code: null,
    isActive: true,
    order: 0,
  },
  {
    id: 'ad-002',
    siteId: 'pusat',
    slot: 'HOME_FEED_1',
    imageUrl: 'https://example.com/home-feed1.webp',
    linkUrl: 'https://example.com',
    code: null,
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
    // Only match the list endpoint, not sub-paths like /ads/packages or /ads/bookings
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

export function mockCreateBooking(page: Page, bookingId: string = 'booking-new-001') {
  page.route('**/api/v1/ads/bookings', (route) => {
    if (route.request().method() === 'POST') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: bookingId, status: 'PENDING_REVIEW', paymentStatus: 'PENDING' },
        }),
      });
    } else {
      route.continue();
    }
  });
}

export function mockApproveBooking(page: Page) {
  page.route('**/api/v1/ads/bookings/*/approve', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { status: 'ACTIVE', paymentStatus: 'PAID' } }),
    });
  });
}

export function mockRejectBooking(page: Page) {
  page.route('**/api/v1/ads/bookings/*/reject', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { status: 'REJECTED', paymentStatus: 'REJECTED' } }),
    });
  });
}

export function mockPayBooking(page: Page) {
  page.route('**/api/v1/ads/bookings/*/pay', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { paymentStatus: 'VERIFYING' } }),
    });
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
  mockAdPackages(page);
  mockAdBookingsMy(page);
  mockAdBookingsAll(page);
  mockAdPublic(page);
  mockAdsList(page);
  mockCreateBooking(page);
  mockApproveBooking(page);
  mockRejectBooking(page);
  mockPayBooking(page);
  mockMediaUpload(page);
}
