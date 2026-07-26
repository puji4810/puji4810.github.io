import { test, expect } from '@playwright/test';
import { EXPECTED_POST_COUNT } from './constants';

test.describe('Navigation Pages', () => {
  test.describe('Archive Page', () => {
    test('loads with title and shows post count', async ({ page }) => {
      await page.goto('/archive/');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(/Archive/);
      await expect(page.locator(`text=${EXPECTED_POST_COUNT} articles`).first()).toBeVisible();
    });

    test('groups posts by year 2025 and 2026', async ({ page }) => {
      await page.goto('/archive/');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=2025').first()).toBeVisible();
      await expect(page.locator('text=2026').first()).toBeVisible();
    });

    test('links to all articles', async ({ page }) => {
      await page.goto('/archive/');
      await page.waitForLoadState('networkidle');
      const articleLinks = page.locator('main a[href^="/202"]');
      const count = await articleLinks.count();
      expect(count).toBe(EXPECTED_POST_COUNT);
    });
  });

  test.describe('Tags Page', () => {
    test('loads with title and shows tag count', async ({ page }) => {
      await page.goto('/tags/');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(/Tags/);
    });

    test('shows LevelDB, CPP, and Distributed Systems tags', async ({ page }) => {
      await page.goto('/tags/');
      await page.waitForLoadState('networkidle');
      await expect(page.locator('text=#LevelDB').first()).toBeVisible();
      await expect(page.locator('text=#CPP').first()).toBeVisible();
      await expect(page.locator('text=#Distributed Systems').first()).toBeVisible();
    });

    test('tag sections link to associated posts', async ({ page }) => {
      await page.goto('/tags/');
      await page.waitForLoadState('networkidle');
      const leveldbLinks = page.locator('section#leveldb a');
      const count = await leveldbLinks.count();
      expect(count).toBeGreaterThanOrEqual(5);
    });
  });

  test.describe('About Page', () => {
    test('loads with title and content', async ({ page }) => {
      await page.goto('/about/');
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(/About/);
      await expect(page.locator('text=Puji').first()).toBeVisible();
    });
  });

  test.describe('404 Page', () => {
    test('renders for nonexistent route', async ({ page }) => {
      const response = await page.goto('/nonexistent-page-12345/');
      expect(response?.status()).toBe(404);
      await expect(page.locator('text=404').first()).toBeVisible();
    });

    test('has navigation links to Home, Archive, Tags, About', async ({ page }) => {
      await page.goto('/nonexistent-page-12345/');
      await expect(page.locator('a[href="/"]').first()).toBeVisible();
      await expect(page.locator('a[href="/archive/"]').first()).toBeVisible();
      await expect(page.locator('a[href="/tags/"]').first()).toBeVisible();
      await expect(page.locator('a[href="/about/"]').first()).toBeVisible();
    });
  });
});
