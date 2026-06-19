import type { Page, Route } from '@playwright/test';

type UserRole = 'superadmin' | 'wapimred' | 'reporter' | 'kontributor' | 'advertiser';

interface MockUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  siteId: string;
  isVerified: boolean;
}

const MOCK_USERS: Record<UserRole, MockUser> = {
  superadmin: {
    id: 'test-superadmin-id',
    name: 'Test Superadmin',
    email: 'superadmin@test.com',
    role: 'superadmin',
    siteId: 'pusat',
    isVerified: true,
  },
  wapimred: {
    id: 'test-wapimred-id',
    name: 'Test Wapimred',
    email: 'wapimred@test.com',
    role: 'wapimred',
    siteId: 'pusat',
    isVerified: true,
  },
  reporter: {
    id: 'test-reporter-id',
    name: 'Test Reporter',
    email: 'reporter@test.com',
    role: 'reporter',
    siteId: 'pusat',
    isVerified: true,
  },
  kontributor: {
    id: 'test-kontributor-id',
    name: 'Test Kontributor',
    email: 'kontributor@test.com',
    role: 'kontributor',
    siteId: 'pusat',
    isVerified: false,
  },
  advertiser: {
    id: 'test-advertiser-id',
    name: 'Test Advertiser',
    email: 'advertiser@test.com',
    role: 'advertiser',
    siteId: 'pusat',
    isVerified: true,
  },
};

/**
 * Helper to fulfill a route with JSON data.
 */
function fulfillJson(route: Route, data: unknown, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(data),
  });
}

/**
 * Simulate login by injecting auth state into cookies and localStorage.
 * Uses a single catch-all route handler for all API mocks — more reliable
 * than individual handlers which can have ordering/timing issues.
 *
 * Usage: call loginAs(), then page.goto() to the target URL.
 */
export async function loginAs(page: Page, role: UserRole, site: string = 'pusat') {
  const user = { ...MOCK_USERS[role], siteId: site };

  // Set auth cookie
  await page.context().addCookies([
    {
      name: 'accessToken',
      value: 'mock-access-token-for-testing',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
    {
      name: 'token',
      value: 'mock-access-token-for-testing',
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
    {
      name: 'siteId',
      value: site,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      sameSite: 'Lax',
    },
  ]);

  // Inject localStorage before the app hydrates
  await page.addInitScript((userData) => {
    const authState = {
      state: {
        user: userData,
        lastActiveSite: userData.siteId,
      },
      version: 0,
    };
    localStorage.setItem('auth-storage', JSON.stringify(authState));
  }, user);

  // Single catch-all handler for ALL /api/v1/* requests.
  // More reliable than individual handlers — no ordering/timing issues.
  await page.route(/\/api\/v1\//, async (route) => {
    const url = route.request().url();
    const method = route.request().method();

    // Auth endpoints
    if (url.includes('/auth/me')) {
      return fulfillJson(route, { success: true, data: { user } });
    }
    if (url.includes('/auth/refresh')) {
      return fulfillJson(route, { success: true });
    }

    // Heartbeat — critical for auth state stability
    if (url.includes('/users/heartbeat')) {
      return fulfillJson(route, { success: true });
    }

    // Notifications
    if (url.includes('/notifications')) {
      return fulfillJson(route, { success: true, data: [], unreadCount: 0 });
    }

    // Sites
    if (url.includes('/sites') && method === 'GET') {
      return fulfillJson(route, {
        success: true,
        data: [{ id: site, name: `Site ${site}`, domain: `${site}.test.com` }],
      });
    }

    // Analytics
    if (url.includes('/analytics')) {
      return fulfillJson(route, { success: true, data: {} });
    }

    // Categories
    if (url.includes('/categories')) {
      return fulfillJson(route, { success: true, data: [] });
    }

    // Comments
    if (url.includes('/comments')) {
      return fulfillJson(route, { success: true, data: [] });
    }

    // Users list (GET only)
    if (url.includes('/users') && method === 'GET') {
      return fulfillJson(route, { success: true, data: [] });
    }

    // For all other API requests — fall through to real API.
    // This allows SSR data (articles, ad packages) to come from the seeded DB.
    return route.fallback();
  });
}

/**
 * Get the mock user for a given role.
 */
export function getMockUser(role: UserRole): MockUser {
  return { ...MOCK_USERS[role] };
}
