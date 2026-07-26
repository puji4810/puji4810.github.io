import { test, expect } from '@playwright/test';

const REPRESENTATIVE_POSTS = [
  {
    route: '/2026/02/27/Lamport-Happens-Before/',
    title: /Happens-Before/,
    checks: ['katex', 'code', 'mermaid'],
  },
  {
    route: '/2025/12/26/Singleton/',
    title: /Singleton/,
    checks: ['code'],
  },
  {
    route: '/2025/10/28/Reading-lists/',
    title: /Reading List/,
    checks: ['links'],
  },
];

test.describe('Article Rendering', () => {
  for (const { route, title, checks } of REPRESENTATIVE_POSTS) {
    test(`${route} loads with title match`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');
      await expect(page).toHaveTitle(title);
    });

    test(`${route} has published date, article body, and layout`, async ({ page }) => {
      await page.goto(route);
      await page.waitForLoadState('networkidle');

      await expect(page.locator('.render-header').first()).toBeVisible();
      await expect(page.locator('.render-prose').first()).toBeVisible();
      await expect(page.locator('.layout-sidebar').first()).toBeVisible();
    });

    if (checks.includes('katex')) {
      test(`${route} renders KaTeX math elements`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await page.waitForSelector('.katex', { timeout: 15000 });
        const katexElements = await page.locator('.katex').count();
        expect(katexElements, 'Expected at least one .katex element').toBeGreaterThan(0);
      });
    }

    if (checks.includes('code')) {
      test(`${route} renders syntax-highlighted code blocks`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        const codeBlocks = await page.locator('pre code').count();
        expect(codeBlocks, 'Expected at least one <pre><code> block').toBeGreaterThan(0);
      });
    }

    if (checks.includes('mermaid')) {
      test(`${route} renders Mermaid diagrams from fenced Markdown`, async ({ page }) => {
        await page.goto(route);
        await page.waitForLoadState('networkidle');
        await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 15000 });
        await expect(page.locator('.mermaid').first()).toHaveAttribute('data-mermaid-state', 'rendered');
        await expect(page.locator('.mermaid-error')).toHaveCount(0);
        await expect(page.locator('pre code.language-mermaid')).toHaveCount(0);
      });
    }
  }

  test('Lamport post renders all expected content types', async ({ page }) => {
    await page.goto('/2026/02/27/Lamport-Happens-Before/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await expect(page.locator('.katex').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('pre code').first()).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.mermaid svg').first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('.mermaid-error')).toHaveCount(0);
  });

  test('SSTable post is the largest article and renders fully', async ({ page }) => {
    await page.goto('/2025/11/01/LevelDB-SSTable/');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(5000);

    await expect(page.locator('.render-prose').first()).toBeVisible();
    const textLength = await page.locator('.render-prose').textContent();
    expect(textLength?.length ?? 0).toBeGreaterThan(500);
  });

  test('all 8 article routes return 200 and render article content', async ({ page }) => {
    const routes = [
      '/2025/10/28/Reading-lists/',
      '/2025/11/01/LevelDB-DBformat/',
      '/2025/11/01/LevelDB-Logformat/',
      '/2025/11/01/LevelDB-Memformat/',
      '/2025/11/01/LevelDB-SSTable/',
      '/2025/11/01/LevelDB-Tableformat/',
      '/2025/12/26/Singleton/',
      '/2026/02/27/Lamport-Happens-Before/',
    ];

    for (const route of routes) {
      const response = await page.goto(route, { waitUntil: 'networkidle' });
      expect(response?.status(), `${route} should return 200`).toBe(200);
      await expect(page.locator('.render-prose').first()).toBeVisible();
    }
  });
});
