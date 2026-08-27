// @ts-check
const OVERRIDES = require('../pages.overrides');

/** localStorage key the volunteer popup uses to remember a dismissal. */
const VOL_POPUP_KEY = 'bs-vol-popup-v1';

/**
 * Third-party hosts that are allowed through.
 *
 * These serve fonts, icon glyphs, and Leaflet's stylesheet — all of which
 * change element metrics. Blocking them would shrink icon-only buttons and
 * produce touch-target failures that don't exist in a real browser. Everything
 * else external (weather, exchange rates, Facebook, analytics, map tiles) is
 * blocked so geometry is measured without network flakiness.
 */
const ALLOWED_HOSTS = [
  'fonts.googleapis.com',
  'fonts.gstatic.com',
  'cdn.jsdelivr.net',
  'unpkg.com',
];

async function blockVolatileHosts(page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    if (url.startsWith('http://localhost') || url.startsWith('data:') || url.startsWith('blob:')) {
      return route.continue();
    }
    if (ALLOWED_HOSTS.some((h) => url.includes(h))) return route.continue();
    return route.abort();
  });
}

/**
 * Loads a page ready for measurement.
 *
 * Both storage keys are seeded before navigation because the code that reads
 * them runs during the page's own head/DOMContentLoaded handlers: the volunteer
 * popup decides whether to show itself, and the inline FOUC guard stamps
 * `data-theme` on <html> before first paint. Seeding after navigation would be
 * too late for either.
 */
async function gotoPage(page, route, { theme = 'light' } = {}) {
  await blockVolatileHosts(page);

  await page.addInitScript(
    ([volKey, themeValue]) => {
      try {
        localStorage.setItem(volKey, '1'); // suppress the modal — it would cover every page
        localStorage.setItem('theme', themeValue);
      } catch (e) {
        /* storage disabled — pages are expected to cope */
      }
    },
    [VOL_POPUP_KEY, theme]
  );

  await page.goto(route, { waitUntil: 'load' });
  await settle(page, route);
}

/**
 * Waits for content that arrives after load. Most sections render from
 * data/*.json via fetch, so measuring at `load` would size an empty container.
 */
async function settle(page, route) {
  const override = OVERRIDES[route];

  if (override && override.waitForSelector) {
    await page
      .locator(override.waitForSelector)
      .first()
      .waitFor({ state: 'attached', timeout: 15_000 })
      .catch(() => {
        throw new Error(
          `${route}: waitForSelector "${override.waitForSelector}" never attached. ` +
            'Either the page stopped rendering that content, or the entry for this route in ' +
            'tests/pages.overrides.js is stale and names a container the markup no longer has. ' +
            'A stale entry costs every test on this route a 15s wait, so fix the entry rather ' +
            'than widening the timeout.'
        );
      });
  }

  await page.waitForLoadState('networkidle').catch(() => {});
  await page.evaluate(() => document.fonts && document.fonts.ready).catch(() => {});
  await page.waitForTimeout(250);
}

/** Applies the dark theme to an already-loaded page, without a reload. */
async function setTheme(page, theme) {
  await page.evaluate((t) => {
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.waitForTimeout(150);
}

module.exports = { VOL_POPUP_KEY, ALLOWED_HOSTS, blockVolatileHosts, gotoPage, settle, setTheme };
