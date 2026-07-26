import { test, expect } from '@playwright/test';

const POST_ROUTES = [
  '/2025/10/28/Reading-lists/',
  '/2025/11/01/LevelDB-DBformat/',
  '/2025/11/01/LevelDB-Logformat/',
  '/2025/11/01/LevelDB-Memformat/',
  '/2025/11/01/LevelDB-SSTable/',
  '/2025/11/01/LevelDB-Tableformat/',
  '/2025/12/26/Singleton/',
  '/2026/02/27/Lamport-Happens-Before/',
];

test.describe('Homepage', () => {
  test('loads successfully with title', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveTitle(/Home/);
  });

  test('renders featured post prominently', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const featured = page.locator('text=Featured').first();
    await expect(featured).toBeVisible();
    await expect(page.locator('text=Reading List 2025').first()).toBeVisible();
  });

  test('links to all 8 article routes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    for (const route of POST_ROUTES) {
      const link = page.locator(`a[href="${route}"]`);
      await expect(link.first(), `Missing link to ${route}`).toBeVisible();
    }
  });

  test('has no browser console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(errors.filter(e => !e.includes('Mermaid')).length).toBe(0);
  });

  test('has functional navigation links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('a[href="/archive/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/tags/"]').first()).toBeVisible();
    await expect(page.locator('a[href="/about/"]').first()).toBeVisible();
  });
});
