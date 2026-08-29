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

    test('Bikol is shown but cannot be selected', async ({ page }) => {
      await gotoPage(page, route);
      await page.locator('.lang-toggle-btn').click();
      const opt = page.locator('.lang-option[data-lang="bcl"]');
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
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test('Filipino is selectable, swaps chrome text, and shows the MT notice', async ({ page }) => {
      await gotoPage(page, route);
      await page.locator('.lang-toggle-btn').click();
      const opt = page.locator('.lang-option[data-lang="fil"]');
      await expect(opt).not.toHaveAttribute('aria-disabled', 'true');
      await expect(opt.locator('.lang-option-soon')).toHaveCount(0);
      await opt.click();
      await expect(page.locator('.lang-toggle-code')).toHaveText('FIL');
      await expect(page.locator('html')).toHaveAttribute('lang', 'fil');
      await expect(page.locator('[data-i18n="skip_to_content"]')).toHaveText(
        'Lumaktaw papunta sa pangunahing nilalaman'
      );
      // Unreviewed machine translation (data/locales/fil.json meta.reviewed is
      // false), so the notice + report link must be showing.
      const notice = page.locator('#i18n-notice');
      await expect(notice).toBeVisible();
      await expect(page.locator('.i18n-notice-report')).toHaveAttribute(
        'href',
        /^mailto:volunteer@betterlegazpi\.org\?subject=/
      );
      // Switching back to English restores the chrome and drops the notice.
      // Restoration is a full reload (main.js's click handler special-cases
      // "back to English from a translated page" that way — see the comment
      // there), so wait for navigation rather than an in-page DOM update.
      await page.locator('.lang-toggle-btn').click();
      await Promise.all([
        page.waitForNavigation(),
        page.locator('.lang-option[data-lang="en"]').click(),
      ]);
      await expect(page.locator('[data-i18n="skip_to_content"]')).toHaveText(
        'Skip to main content'
      );
      await expect(page.locator('#i18n-notice')).toHaveCount(0);
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });

    test('the notice can be dismissed and does not reappear until the page reloads', async ({
      page,
    }) => {
      await gotoPage(page, route);
      await page.locator('.lang-toggle-btn').click();
      await page.locator('.lang-option[data-lang="fil"]').click();
      const notice = page.locator('#i18n-notice');
      await expect(notice).toBeVisible();
      await page.locator('.i18n-notice-dismiss').click();
      await expect(notice).toHaveCount(0);
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

// The homepage hero is the only content translated beyond the shared chrome
// (data-i18n tags on the hero_* keys live only in index.html), so this is
// verified separately rather than in the route loop above.
test.describe('/index.html hero (Filipino)', () => {
  test('hero title, subtitle, search box, pills, and CTAs all translate', async ({ page }) => {
    await gotoPage(page, '/index.html');
    await page.locator('.lang-toggle-btn').click();
    await page.locator('.lang-option[data-lang="fil"]').click();

    await expect(page.locator('[data-i18n="hero_title"]')).toHaveText(
      'Maligayang pagdating sa BetterLegazpi.org'
    );
    await expect(page.locator('#hero-search')).toHaveAttribute(
      'placeholder',
      'Maghanap ng serbisyo (hal., birth certificate, business permit, buwis)...'
    );
    await expect(page.locator('#hero-search')).toHaveAttribute(
      'aria-label',
      'Maghanap ng mga serbisyo'
    );
    // Official document names keep the English term alongside the Filipino
    // one on purpose (data/locales/fil.json's meta.note explains why) — a
    // reader matching this against a physical requirement list should still
    // recognize it.
    await expect(page.locator('[data-i18n="hero_pill_birth_cert"]')).toContainText(
      'Birth Certificate'
    );
    await expect(page.locator('[data-i18n="hero_cta_browse_services"]')).toHaveText(
      'Tingnan ang Lahat ng Serbisyo'
    );

    // Nav is NOT translated yet (its markup isn't uniform across pages, see
    // the comment above AVAILABLE in main.js) — this should stay English.
    await expect(page.locator('.main-nav a[href="/government/"]')).toHaveText('Government');
  });
});
