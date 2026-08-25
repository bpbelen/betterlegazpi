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
 * Supported keys per route:
 *   waitForSelector — wait for this to attach before measuring
 *   skip            — skip the route entirely, with `reason`
 */
module.exports = {
  '/index.html': { waitForSelector: '#home-news-grid > *' },
  '/news/index.html': { waitForSelector: '#news-grid > *' },
  '/government/officials.html': { waitForSelector: '#officials-container > *' },
  '/services/health.html': { waitForSelector: '#facilities-grid > *' },
  '/statistics/index.html': { waitForSelector: '#barangayListContainer > *' },
  '/legislative/ordinance-framework.html': { waitForSelector: '#ordinance-table-body > *' },
  '/budget/index.html': { waitForSelector: '#dpwh-contractor-list > *' },
};
