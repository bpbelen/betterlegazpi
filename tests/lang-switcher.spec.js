// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoPage } = require('./helpers/site');

const ROUTES = ['/index.html', '/services/index.html', '/contact/index.html'];

for (const route of ROUTES) {
  test.describe(route, () => {
    test('button renders beside the theme toggle', async ({ page }) => {
      await gotoPage(page, route);
      const lang = page.locator('.lang-toggle-btn');
      const theme = page.locator('#theme-toggle');
      await expect(lang).toBeVisible();
      await expect(theme).toBeVisible();
      const lb = await lang.boundingBox();
      const tb = await theme.boundingBox();
      expect(Math.abs(lb.y - tb.y)).toBeLessThan(12);
      expect(lb.x).toBeLessThan(tb.x);
      // WCAG 2.5.5, the rule the theme toggle's own comment cites.
      expect(lb.height).toBeGreaterThanOrEqual(44);
    });

    test('menu opens, closes, and reports state', async ({ page }) => {
      await gotoPage(page, route);
      const btn = page.locator('.lang-toggle-btn');
      const menu = page.locator('.lang-menu');
      await expect(menu).toBeHidden();
      await expect(btn).toHaveAttribute('aria-expanded', 'false');
      await btn.click();
      await expect(menu).toBeVisible();
      await expect(btn).toHaveAttribute('aria-expanded', 'true');
      await page.keyboard.press('Escape');
      await expect(menu).toBeHidden();
      await expect(btn).toHaveAttribute('aria-expanded', 'false');
    });

    test('outside click closes the menu', async ({ page }) => {
      await gotoPage(page, route);
      await page.locator('.lang-toggle-btn').click();
      await expect(page.locator('.lang-menu')).toBeVisible();
      await page.locator('body').click({ position: { x: 5, y: 400 } });
      await expect(page.locator('.lang-menu')).toBeHidden();
    });

    test('Filipino and Bikol are shown but cannot be selected', async ({ page }) => {
      await gotoPage(page, route);
      await page.locator('.lang-toggle-btn').click();
      for (const code of ['fil', 'bcl']) {
        const opt = page.locator(`.lang-option[data-lang="${code}"]`);
        await expect(opt).toBeVisible();
        await expect(opt).toHaveAttribute('aria-disabled', 'true');
        await expect(opt.locator('.lang-option-soon')).toHaveText(/coming soon/i);
        // force: Playwright refuses to click an aria-disabled control, which is
        // the point — this bypasses that guard to prove the handler ALSO
        // refuses, so a stray programmatic click can't switch to a locale that
        // has no strings yet.
        await opt.click({ force: true });
        await expect(page.locator('.lang-toggle-code')).toHaveText('EN');
        await expect(opt).toHaveAttribute('aria-checked', 'false');
      }
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test('English is the checked option', async ({ page }) => {
      await gotoPage(page, route);
      await page.locator('.lang-toggle-btn').click();
      const en = page.locator('.lang-option[data-lang="en"]');
      await expect(en).toHaveAttribute('aria-checked', 'true');
      await expect(en).toHaveClass(/is-active/);
    });

    test('keyboard reaches every option, disabled ones included', async ({ page }) => {
      await gotoPage(page, route);
      await page.locator('.lang-toggle-btn').focus();
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('.lang-menu')).toBeVisible();
      await expect(page.locator('.lang-option[data-lang="en"]')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('.lang-option[data-lang="fil"]')).toBeFocused();
      await page.keyboard.press('ArrowDown');
      await expect(page.locator('.lang-option[data-lang="bcl"]')).toBeFocused();
      await page.keyboard.press('ArrowDown'); // wraps back to the top
      await expect(page.locator('.lang-option[data-lang="en"]')).toBeFocused();
    });

    test('an unshipped stored locale falls back to English', async ({ page }) => {
      await page.addInitScript(() => {
        try {
          localStorage.setItem('lang', 'bcl');
        } catch (e) {
          /* storage disabled */
        }
      });
      await gotoPage(page, route);
      await expect(page.locator('.lang-toggle-code')).toHaveText('EN');
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test('the theme toggle still works alongside it', async ({ page }) => {
      await gotoPage(page, route);
      await page.locator('#theme-toggle').click();
      await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
      await page.locator('#theme-toggle').click();
      await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'dark');
    });
  });
}
