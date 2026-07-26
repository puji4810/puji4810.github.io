import { test, expect } from '@playwright/test';

const POST = '/2026/07/26/A-scheduler-design/';
const PHONE = { width: 390, height: 780 };
const DESKTOP = { width: 1440, height: 900 };

test.describe('Mobile table overflow', () => {
  test('wide tables scroll inside their own box, not the page', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(POST);
    await page.waitForLoadState('networkidle');

    const overflow = await page.evaluate(() => ({
      docScrollWidth: document.documentElement.scrollWidth,
      viewport: window.innerWidth,
    }));
    expect(
      overflow.docScrollWidth,
      'Page must not scroll sideways on a phone'
    ).toBeLessThanOrEqual(overflow.viewport);

    const scrolling = await page.evaluate(() => {
      const wrappers = Array.from(
        document.querySelectorAll<HTMLElement>('.render-prose .table-scroll')
      );
      return {
        total: wrappers.length,
        scrollable: wrappers.filter(w => w.scrollWidth > w.clientWidth + 1).length,
        widerThanColumn: wrappers.filter(
          w => w.getBoundingClientRect().width > window.innerWidth
        ).length,
      };
    });
    expect(scrolling.total).toBeGreaterThan(0);
    expect(scrolling.scrollable, 'Wide tables should overflow their wrapper').toBeGreaterThan(0);
    expect(scrolling.widerThanColumn, 'No wrapper may exceed the viewport').toBe(0);
  });
});

test.describe('Mobile contents button', () => {
  test('is visible on a phone and hidden once the rail appears', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(POST);
    await page.waitForLoadState('networkidle');
    await expect(page.locator('.toc-fab')).toBeVisible();

    await page.setViewportSize(DESKTOP);
    await expect(page.locator('.toc-fab')).toBeHidden();
    await expect(page.locator('.layout-toc')).toBeVisible();
  });

  test('opens a sheet, navigates to a heading, and closes itself', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(POST);
    await page.waitForLoadState('networkidle');

    const sheet = page.locator('.toc-sheet');
    await expect(sheet).toBeHidden();

    await page.locator('.toc-fab').click();
    await expect(sheet).toBeVisible();
    await expect(page.locator('.toc-fab')).toHaveAttribute('aria-expanded', 'true');

    const before = await page.evaluate(() => window.scrollY);
    await sheet.locator('.toc-link').nth(12).click();

    await expect(sheet).toBeHidden();
    await expect
      .poll(() => page.evaluate(() => window.scrollY))
      .not.toBe(before);
  });

  test('closes on Escape and returns focus to the button', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(POST);
    await page.waitForLoadState('networkidle');

    await page.locator('.toc-fab').click();
    await expect(page.locator('.toc-sheet')).toBeVisible();

    await page.keyboard.press('Escape');
    await expect(page.locator('.toc-sheet')).toBeHidden();
    await expect(page.locator('.toc-fab')).toBeFocused();
  });

  test('marks the section being read in both the rail and the sheet', async ({ page }) => {
    await page.setViewportSize(PHONE);
    await page.goto(POST);
    await page.waitForLoadState('networkidle');

    await page.evaluate(() =>
      window.scrollTo({ top: document.documentElement.scrollHeight * 0.5, behavior: 'instant' })
    );
    await expect
      .poll(() => page.locator('.toc-sheet .toc-link.is-active').count())
      .toBe(1);
  });
});
