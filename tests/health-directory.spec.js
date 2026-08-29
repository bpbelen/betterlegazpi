/**
 * Health facilities directory — disclosure behaviour.
 *
 * The directory renders 120 cards, so everything secondary is behind a
 * disclosure: the per-card details panel, the overflow category chips, and the
 * documentary sources section. All three must ship closed.
 *
 * That last part is the reason this spec exists. `[hidden]` is only a UA
 * stylesheet rule, so any author `display` value outranks it — a details panel
 * styled `display: flex` renders open on load no matter what the attribute
 * says. A test that clicks first and asserts visibility afterwards passes
 * happily against that bug, so the assertions here run before any interaction.
 */
const { test, expect } = require('@playwright/test');

const ROUTE = '/services/health.html';

test.describe('Health facilities directory', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTE);
    await page.waitForSelector('.facility-card');
  });

  test('every disclosure ships closed', async ({ page }) => {
    expect(await page.locator('.facility-details:visible').count()).toBe(0);
    await expect(page.locator('#health-references-panel')).toBeHidden();
    expect(await page.locator('.health-cat-pill[data-secondary]:visible').count()).toBe(0);

    const toggles = page.locator('[data-facility-toggle]');
    const count = await toggles.count();
    for (let i = 0; i < count; i++) {
      await expect(toggles.nth(i)).toHaveAttribute('aria-expanded', 'false');
    }
  });

  test('a card details panel opens and closes independently', async ({ page }) => {
    const first = page.locator('.facility-card').nth(0);
    const second = page.locator('.facility-card').nth(1);

    await first.locator('[data-facility-toggle]').click();
    await expect(first.locator('.facility-details')).toBeVisible();
    // Opening one card must not disturb another: the cards sit in a grid, and
    // an accordion would collapse something the reader is not looking at.
    await expect(second.locator('.facility-details')).toBeHidden();

    await first.locator('[data-facility-toggle]').click();
    await expect(first.locator('.facility-details')).toBeHidden();
  });

  test('the "+N more" services chip opens the details panel', async ({ page }) => {
    const card = page
      .locator('.facility-card')
      .filter({ has: page.locator('button.service-pill-more') })
      .first();

    await card.locator('button.service-pill-more').click();
    await expect(card.locator('[data-facility-toggle]')).toHaveAttribute('aria-expanded', 'true');
    await expect(card.locator('.facility-details')).toBeVisible();
  });

  test('the overflow control reveals the remaining category chips', async ({ page }) => {
    await page.locator('#health-cat-more').click();
    expect(await page.locator('.health-cat-pill[data-secondary]:visible').count()).toBeGreaterThan(
      0
    );
  });

  test('the references section carries its counts on the collapsed header', async ({ page }) => {
    // The badge is what keeps the collapsed state honest — a reader has to be
    // able to tell that source notes exist without opening the section.
    await expect(page.locator('#health-references-badge')).toHaveText(
      /\d+ sources? · \d+ data note/
    );

    await page.locator('#health-references-toggle').click();
    await expect(page.locator('#health-references-panel')).toBeVisible();
    expect(await page.locator('#health-references-list li').count()).toBeGreaterThan(0);
    expect(await page.locator('#health-references-notes li').count()).toBeGreaterThan(0);
  });

  test('category chips render counts from the data', async ({ page }) => {
    await expect(
      page.locator('.health-cat-pill[data-category="all"] [data-chip-count]')
    ).toHaveText(/^\(\d+\)$/);
  });
});
