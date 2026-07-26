import { test, expect } from '@playwright/test';

test.describe('Theme Toggle', () => {
  test('default theme is applied on initial load', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const theme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
    expect(['dark', 'light']).toContain(theme);
  });

  test('clicking theme toggle switches theme on homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    const expectedAfter = initialTheme === 'dark' ? 'light' : 'dark';

    const toggle = page.locator('.theme-toggle, [aria-label*="theme" i], [aria-label*="Theme" i], button:has-text("☀"), button:has-text("☾"), button:has-text("🌙"), button:has-text("🌞")').first();
    await toggle.click();
    await page.waitForTimeout(500);

    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(newTheme).toBe(expectedAfter);
  });

  test('theme persists across page reload', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('.theme-toggle, [aria-label*="theme" i], button:has-text("☀"), button:has-text("☾")').first();
    await toggle.click();
    await page.waitForTimeout(500);

    const themeBeforeReload = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    await page.reload();
    await page.waitForLoadState('networkidle');

    const themeAfterReload = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(themeAfterReload).toBe(themeBeforeReload);
  });

  test('theme toggle works on article pages', async ({ page }) => {
    await page.goto('/2025/12/26/Singleton/');
    await page.waitForLoadState('networkidle');

    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    const expectedAfter = initialTheme === 'dark' ? 'light' : 'dark';

    const toggle = page.locator('.theme-toggle, [aria-label*="theme" i], button:has-text("☀"), button:has-text("☾")').first();
    await toggle.click();
    await page.waitForTimeout(500);

    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(newTheme).toBe(expectedAfter);
  });

  test('theme toggle is keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const toggle = page.locator('#theme-toggle');
    await expect(toggle).toBeVisible();

    const initialTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );

    await toggle.focus();
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);

    const newTheme = await page.evaluate(() =>
      document.documentElement.getAttribute('data-theme')
    );
    expect(newTheme).not.toBe(initialTheme);
  });

  test('re-renders Mermaid diagrams after theme toggle', async ({ page }) => {
    await page.goto('/2026/02/27/Lamport-Happens-Before/');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 15000 });

    const before = await page.locator('.mermaid').first().innerHTML();
    await page.locator('#theme-toggle').click();
    await expect(page.locator('.mermaid').first()).toHaveAttribute('data-mermaid-state', 'rendered', { timeout: 15000 });
    await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.mermaid-error')).toHaveCount(0);

    const after = await page.locator('.mermaid').first().innerHTML();
    expect(after).not.toBe(before);
  });
});
