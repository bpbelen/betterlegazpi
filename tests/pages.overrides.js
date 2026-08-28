// @ts-check

/**
 * Per-route escape hatches for the site harness.
 *
 * Most pages need nothing here — the generic settle in helpers/site.js (network
 * idle, fonts ready, a short quiet period) is enough. Entries below are for
 * pages whose main content arrives from data/*.json after load, where measuring
 * too early would size an empty container and report a false pass.
 *
 * Selectors deliberately target a *child* of the render container. The
 * containers themselves ship in the static HTML, so waiting on them would
 * resolve instantly and defeat the point.
 *
 * Keep entries in step with the markup. A selector that never attaches fails the
 * route's tests with an explicit "stale override" message rather than passing
 * quietly, because the silent version cost every test on the route a 15s wait.
 *
 * Supported keys per route:
 *   waitForSelector — wait for this to attach before measuring
 *   skip            — skip the route entirely, with `reason`
 */
module.exports = {
  // The homepage weather section renders from the Open-Meteo response (with a
  // mock fallback), and now carries a five-day strip, so measuring before it
  // arrives sizes an empty container.
  '/index.html': { waitForSelector: '#weather-container > *' },
  '/news/index.html': { waitForSelector: '#news-grid > *' },
  '/government/officials.html': { waitForSelector: '#officials-container > *' },
  '/statistics/index.html': { waitForSelector: '#barangayListContainer > *' },
  '/transparency/index.html': { waitForSelector: '#dpwh-projects-container > *' },

  // Service category pages: every section below the page header is rendered by
  // assets/js/service-categories.js from four JSON files, so #service-category-app
  // ships empty and the whole page body is late-arriving content.
  '/services/agriculture.html': { waitForSelector: '#service-category-app > *' },
  '/services/business.html': { waitForSelector: '#service-category-app > *' },
  '/services/certificates.html': { waitForSelector: '#service-category-app > *' },
  '/services/education.html': { waitForSelector: '#service-category-app > *' },
  '/services/employment.html': { waitForSelector: '#service-category-app > *' },
  '/services/environment.html': { waitForSelector: '#service-category-app > *' },
  // health also renders its facilities directory from JSON, but the category app sits
  // last on the page, so waiting for it covers both.
  '/services/health.html': { waitForSelector: '#service-category-app > *' },
  '/services/housing.html': { waitForSelector: '#service-category-app > *' },
  '/services/infrastructure.html': { waitForSelector: '#service-category-app > *' },
  '/services/social-services.html': { waitForSelector: '#service-category-app > *' },
  '/services/tax-payments.html': { waitForSelector: '#service-category-app > *' },
};
