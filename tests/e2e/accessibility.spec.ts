import { test, expect } from '@playwright/test';

test.describe('Accessibility', () => {
  test('homepage has accessible heading hierarchy', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const h2Count = await page.locator('h2').count();
    expect(h2Count).toBeGreaterThanOrEqual(1);

    const headings = page.locator('h1, h2, h3');
    const count = await headings.count();
    expect(count, 'Expected semantic headings on homepage').toBeGreaterThan(0);
  });

  test('homepage has accessible navigation with links', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const nav = page.locator('nav');
    const navCount = await nav.count();
    expect(navCount).toBeGreaterThanOrEqual(1);

    const navLinks = nav.first().locator('a');
    const linkCount = await navLinks.count();
    expect(linkCount).toBeGreaterThanOrEqual(2);
  });

  test('article page has skip-link or main landmark', async ({ page }) => {
    await page.goto('/2026/02/27/Lamport-Happens-Before/');
    await page.waitForLoadState('networkidle');

    const mainCount = await page.locator('main').count();
    expect(mainCount).toBeGreaterThanOrEqual(1);
  });

  test('article sidebar uses aria-current for active article', async ({ page }) => {
    await page.goto('/2025/12/26/Singleton/');
    await page.waitForLoadState('networkidle');

    const currentLink = page.locator('a[aria-current="page"]');
    const count = await currentLink.count();
    expect(count, 'Expected aria-current="page" on active sidebar link').toBeGreaterThanOrEqual(1);
  });

  test('focus states are visible when tabbing', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const focused = page.locator(':focus');
    const hasFocus = await focused.count();
    expect(hasFocus).toBeGreaterThan(0);
  });

  test('images have alt text', async ({ page }) => {
    await page.goto('/2025/10/28/Reading-lists/');
    await page.waitForLoadState('networkidle');

    const images = page.locator('img');
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute('alt');
      expect(alt, `Image ${i} should have alt text`).toBeTruthy();
    }
  });

  test('links have discernible text', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const links = page.locator('a');
    const count = await links.count();
    for (let i = 0; i < count; i++) {
      const link = links.nth(i);
      const text = await link.textContent();
      const ariaLabel = await link.getAttribute('aria-label');
      expect(
        (text?.trim() || '') || (ariaLabel || ''),
        `Link ${i} should have discernible text`
      ).toBeTruthy();
    }
  });

  test('html element has lang attribute', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const lang = await page.getAttribute('html', 'lang');
    expect(lang).toBe('en');
  });

  test('viewport meta tag is present', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const viewport = page.locator('meta[name="viewport"]');
    await expect(viewport).toHaveAttribute('content', /width=device-width/);
  });
});
