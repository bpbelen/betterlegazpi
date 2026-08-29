// @ts-check
const { test, expect } = require('@playwright/test');
const { gotoPage } = require('./helpers/site');

/**
 * Site-wide search on the home page.
 *
 * These guard a specific reported failure: searching "YAKAP" returned "No
 * services found", and searching "health" returned the death certificate as its
 * only result. Both had the same cause — search loaded data/services.json, 50
 * curated entries with no health, education or housing services in it, and the
 * death certificate matched only because it carried "city health office" as a
 * keyword.
 *
 * Search now reads data/search-index.json, generated from the office charters
 * by scripts/data/build-search-index.js.
 *
 * The harness serves the repo with plain http.server, so navigation uses real
 * .html paths (see playwright.config.js). gotoPage() is used rather than a bare
 * page.goto: it seeds the localStorage key that suppresses the volunteer modal,
 * which otherwise renders over the hero and intercepts every click on the
 * search input.
 */

const SEARCH_INPUT = '#heroSearchInput, .search-input, input[type="search"]';
const DROPDOWN = '.search-autocomplete';

/** Types a query and waits for the debounced (150ms) render to settle. */
async function search(page, query) {
  const input = page.locator(SEARCH_INPUT).first();
  await input.fill('');
  await input.click();
  await input.type(query, { delay: 15 });
  await page.waitForTimeout(400);
  return page.locator(DROPDOWN);
}

/** Visible titles of confident results, in rendered order. */
async function resultTitles(page) {
  return page.$$eval(
    `${DROPDOWN} .search-section--results .search-result-item .search-result-title`,
    (nodes) => nodes.map((n) => n.textContent.replace(/\s+/g, ' ').trim())
  );
}

test.describe('home page search', () => {
  test.beforeEach(async ({ page }) => {
    await gotoPage(page, '/index.html');
    await page.locator(SEARCH_INPUT).first().waitFor();
  });

  test('finds PhilHealth YAKAP by name', async ({ page }) => {
    await search(page, 'YAKAP');
    const titles = await resultTitles(page);

    expect(titles.length).toBeGreaterThan(0);
    expect(titles.join(' | ')).toMatch(/YAKAP/i);
    // The programme itself should lead, not one of its sub-pages.
    expect(titles[0]).toMatch(/PhilHealth YAKAP/i);
  });

  test('finds YAKAP by what people actually call it', async ({ page }) => {
    for (const term of ['philhealth', 'libreng gamot']) {
      await search(page, term);
      const titles = await resultTitles(page);
      expect(titles.join(' | '), `"${term}" should reach YAKAP`).toMatch(/YAKAP/i);
    }
  });

  test('"health" returns health services, not the death certificate', async ({ page }) => {
    await search(page, 'health');
    const titles = await resultTitles(page);

    expect(titles.length).toBeGreaterThan(1);
    expect(titles.some((t) => /health/i.test(t))).toBe(true);
    // The original bug: this was the single result for "health".
    expect(titles[0]).not.toMatch(/death certificate/i);
  });

  test('services are listed above pages', async ({ page }) => {
    await search(page, 'building permit');
    const headers = await page.$$eval(`${DROPDOWN} .search-section-header`, (nodes) =>
      nodes.map((n) => n.textContent.replace(/\s+/g, ' ').trim())
    );

    const services = headers.findIndex((h) => /Services/i.test(h));
    const pages = headers.findIndex((h) => /Pages/i.test(h));
    expect(services).toBeGreaterThanOrEqual(0);
    if (pages >= 0) expect(services).toBeLessThan(pages);
  });

  test('a typo is offered as a suggestion, not asserted as an answer', async ({ page }) => {
    await search(page, 'helth');

    const weak = page.locator(`${DROPDOWN} .search-section--weak`);
    await expect(weak).toBeVisible();
    await expect(weak).toContainText(/Not exactly what you're looking for/i);

    // Loose matches must never be presented among the confident results.
    expect(await resultTitles(page)).toHaveLength(0);
  });

  test('nonsense returns nothing rather than a bad guess', async ({ page }) => {
    await search(page, 'zzzzqqq');
    await expect(page.locator(`${DROPDOWN} .search-no-results`)).toBeVisible();
  });

  test('unverified charter entries are labelled', async ({ page }) => {
    await search(page, 'building permit');
    // Every charter service is currently unverified against the published PDF,
    // so the badge must appear rather than presenting the fee as settled.
    await expect(page.locator(`${DROPDOWN} .search-result-draft`).first()).toBeVisible();
  });
});
