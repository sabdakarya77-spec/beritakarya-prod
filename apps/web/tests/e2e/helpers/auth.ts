import type { Page } from '@playwright/test';

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
 * Simulate login by injecting auth state into cookies and localStorage.
 * Sets up mocks for common API endpoints.
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

  // Mock common API endpoints
  await page.route('**/api/v1/auth/me', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: { user } }),
    });
  });

  await page.route('**/api/v1/auth/refresh', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/v1/users/heartbeat', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  await page.route('**/api/v1/notifications**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [], unreadCount: 0 }),
    });
  });

  await page.route('**/api/v1/sites**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: [{ id: site, name: `Site ${site}`, domain: `${site}.test.com` }],
        }),
      });
    } else {
      route.continue();
    }
  });

  await page.route('**/api/v1/articles**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { items: [], total: 0, page: 1, limit: 20, totalPages: 0 },
        }),
      });
    } else {
      route.continue();
    }
  });

  await page.route('**/api/v1/analytics**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: {} }),
    });
  });

  await page.route('**/api/v1/categories**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/v1/comments**', (route) => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: [] }),
    });
  });

  await page.route('**/api/v1/users**', (route) => {
    if (route.request().method() === 'GET') {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: [] }),
      });
    } else {
      route.continue();
    }
  });
}

/**
 * Get the mock user for a given role.
 */
export function getMockUser(role: UserRole): MockUser {
  return { ...MOCK_USERS[role] };
}
