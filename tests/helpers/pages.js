// @ts-check
const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');

/**
 * Directories that hold no servable page.
 *
 * `scratch/` is excluded deliberately: nhfr.html and nhfr_search_legazpi.html
 * are saved copies of DOH's National Health Facility Registry, kept only as the
 * raw input that produced data/health-facilities.json. They are third-party
 * markup, linked from nothing, and findings against them are not actionable.
 */
const EXCLUDED_DIRS = new Set([
  'scratch',
  'dist',
  'node_modules',
  '.git',
  '.claude',
  'react-app',
  'test-results',
  'playwright-report',
]);

/**
 * The CI tier: one page per layout archetype and per page-specific stylesheet.
 * The full tier covers every page, but cross-browser risk lives in shared CSS,
 * so the regression gate only needs a page that exercises each distinct sheet
 * and each of the three layout generations.
 */
const CI_ROUTES = [
  '/index.html', // homepage — the only page loading all 8 scripts
  '/services/index.html', // services landing
  '/services/certificates.html', // old tier: page-header + office-card
  '/service-details/cto-services.html', // new tier A, 1442-line inline <style>
  '/service-details/gso-services.html', // new tier B outlier
  '/statistics/index.html', // statistics.css
  '/budget/index.html', // transparency-v2.css
  '/history/index.html', // history.css
  '/legislative/index.html', // legislative.css
  '/terms/index.html', // legal.css
  '/404.html', // error page, omits version.js
];

/** Every .html file under the repo root, as server routes. */
function discoverRoutes() {
  const routes = [];

  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walk(path.join(dir, entry.name));
      } else if (entry.isFile() && entry.name.endsWith('.html')) {
        const rel = path.relative(REPO_ROOT, path.join(dir, entry.name));
        routes.push('/' + rel.split(path.sep).join('/'));
      }
    }
  };

  walk(REPO_ROOT);
  return routes.sort();
}

/**
 * Routes for the active tier. `SITE_AUDIT_TIER=full` runs everything (the
 * one-time audit); anything else runs the CI sample.
 *
 * Routes keep their .html extension on purpose. playwright.config.js serves the
 * repo with plain `python3 -m http.server`, which has none of the clean-URL
 * rewriting that serve.py and .htaccess perform in dev and production — so
 * `/services/` would 404 under test where `/services/index.html` resolves.
 */
function routesForTier() {
  const all = discoverRoutes();
  if (process.env.SITE_AUDIT_TIER === 'full') return all;

  const present = new Set(all);
  return CI_ROUTES.filter((r) => present.has(r));
}

module.exports = { REPO_ROOT, EXCLUDED_DIRS, CI_ROUTES, discoverRoutes, routesForTier };
