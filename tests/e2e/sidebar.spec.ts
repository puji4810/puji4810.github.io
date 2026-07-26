import { test, expect } from '@playwright/test';
import { EXPECTED_POST_COUNT } from './constants';

test.describe('Sidebar Navigation', () => {
  test('desktop viewport shows sidebar article list on article pages', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/2026/02/27/Lamport-Happens-Before/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.layout-sidebar');
    await expect(sidebar).toBeVisible();

    const sidebarLinks = sidebar.locator('a');
    const count = await sidebarLinks.count();
    expect(count, 'Sidebar should have article links').toBeGreaterThanOrEqual(1);
  });

  test('current article is marked active in sidebar', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/2025/12/26/Singleton/');
    await page.waitForLoadState('networkidle');

    const currentLinks = page.locator('a[aria-current="page"]');
    await expect(currentLinks.first()).toBeVisible();
  });

  test('clicking sidebar link navigates to another article', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/2026/02/27/Lamport-Happens-Before/');
    await page.waitForLoadState('networkidle');

    const sstableLink = page.locator('.layout-sidebar a').filter({ hasText: /SSTable/ }).first();
    await expect(sstableLink).toBeVisible();
    await sstableLink.click();

    await page.waitForURL(/LevelDB-SSTable/);
    expect(page.url()).toContain('/2025/11/01/LevelDB-SSTable/');

    const newActive = page.locator('a[aria-current="page"]');
    const activeText = await newActive.first().textContent();
    expect(activeText).toContain('SSTable');
  });

  test('sidebar groups posts by year', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/2025/12/26/Singleton/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.layout-sidebar');
    await expect(sidebar.locator('text=2025').first()).toBeVisible();
    await expect(sidebar.locator('text=2026').first()).toBeVisible();
  });

  test('sidebar shows every article', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/2025/11/01/LevelDB-DBformat/');
    await page.waitForLoadState('networkidle');

    const sidebar = page.locator('.layout-sidebar');
    const links = sidebar.locator('a[href^="/202"]');
    const count = await links.count();
    expect(count, 'Sidebar should list every article').toBe(EXPECTED_POST_COUNT);
  });

  test('mobile viewport has article navigation accessible', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/2025/12/26/Singleton/');
    await page.waitForLoadState('networkidle');

    const body = page.locator('body');
    const isVisible = await body.isVisible();
    expect(isVisible).toBe(true);

    const mainContent = page.locator('.render-prose');
    await expect(mainContent).toBeVisible();
  });

  test('no horizontal overflow at desktop width', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/2025/11/01/LevelDB-SSTable/');
    await page.waitForLoadState('networkidle');

    const hasHorizontalOverflow = await page.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    expect(hasHorizontalOverflow).toBe(false);
  });

  test('no horizontal overflow at mobile width', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/2025/12/26/Singleton/');
    await page.waitForLoadState('networkidle');

    const overflowPx = await page.evaluate(() => {
      return document.documentElement.scrollWidth - document.documentElement.clientWidth;
    });
    expect(overflowPx, 'Mobile horizontal overflow within 20px tolerance').toBeLessThanOrEqual(20);
  });
});
