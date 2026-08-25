// @ts-check
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const { MOBILE_VIEWPORT, DESKTOP_VIEWPORT } = require('./helpers/viewports');
const { routesForTier } = require('./helpers/pages');
const { gotoPage } = require('./helpers/site');
const OVERRIDES = require('./pages.overrides');

const ROUTES = routesForTier();

/**
 * WCAG 2.1 A and AA — the conformance level the rollout strategy commits to,
 * and the level the Lighthouse CI gate (accessibility >= 0.9) is scored against.
 * AAA rules are deliberately excluded: they are aspirational, and mixing them in
 * would bury the failures that actually breach the commitment.
 */
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];

/**
 * Both themes are scanned because dark mode is a `data-theme` attribute toggle
 * with hundreds of per-component colour overrides, added in a single commit and
 * never verified. Contrast regressions there are invisible to a light-only scan.
 */
const THEMES = ['light', 'dark'];

const SURFACES = [
  { label: 'mobile', vp: MOBILE_VIEWPORT },
  { label: 'desktop', vp: DESKTOP_VIEWPORT },
];

/** Collapses axe output to one line per rule, with the worst offenders named. */
function summarise(violations) {
  return violations.map((v) => {
    const where = v.nodes
      .slice(0, 3)
      .map((n) => n.target.join(' '))
      .join('\n      ');
    return (
      `${v.id} (${v.impact}, ${v.nodes.length} node${v.nodes.length === 1 ? '' : 's'})\n` +
      `    ${v.help}\n      ${where}`
    );
  });
}

for (const route of ROUTES) {
  const override = OVERRIDES[route];
  if (override && override.skip) continue;

  test.describe(route, () => {
    for (const surface of SURFACES) {
      for (const theme of THEMES) {
        test.describe(`${surface.label} / ${theme}`, () => {
          test.use({ viewport: { width: surface.vp.width, height: surface.vp.height } });

          test('has no WCAG 2.1 A/AA violations', async ({ page }) => {
            await gotoPage(page, route, { theme });

            const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();

            expect(
              results.violations,
              `${route} — ${surface.label}, ${theme} theme — ` +
                `${results.violations.length} rule(s) violated:\n  ` +
                summarise(results.violations).join('\n  ')
            ).toEqual([]);
          });
        });
      }
    }
  });
}
