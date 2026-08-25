// @ts-check
const { test, expect } = require('@playwright/test');
const { VIEWPORTS, CI_VIEWPORTS } = require('./helpers/viewports');
const { routesForTier } = require('./helpers/pages');
const { gotoPage } = require('./helpers/site');
const OVERRIDES = require('./pages.overrides');

const FULL = process.env.SITE_AUDIT_TIER === 'full';
const ROUTES = routesForTier();
const MATRIX = FULL ? VIEWPORTS : CI_VIEWPORTS;

/**
 * WCAG 2.5.5 (AAA) and both platform HIGs put the minimum touch target at 44px.
 * Only enforced at widths where touch is the likely input mode — a 44px floor
 * on a 1920px desktop viewport measures nothing real.
 */
const TOUCH_TARGET_MIN = 44;
const TOUCH_VIEWPORT_MAX_WIDTH = 768;

const INTERACTIVE = [
  'a[href]',
  'button',
  'input:not([type="hidden"])',
  'select',
  'textarea',
  '[role="button"]',
  '[tabindex]:not([tabindex="-1"])',
].join(', ');

/**
 * Names the elements responsible for horizontal page scroll.
 *
 * An element only extends the page if nothing between it and the root clips it,
 * so elements inside an `overflow-x: hidden|auto|scroll` ancestor are skipped —
 * they look wide but scroll within their own container, which is the intended
 * pattern for the site's tables and charts. Nested offenders collapse to their
 * outermost ancestor, since a wide child inside a wide parent is one bug.
 */
function findOverflowCulprits() {
  const docWidth = document.documentElement.clientWidth;
  const offenders = [];

  for (const el of document.body.querySelectorAll('*')) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;
    if (r.right <= docWidth + 1) continue;

    let clipped = false;
    for (let n = el.parentElement; n && n !== document.documentElement; n = n.parentElement) {
      if (/(hidden|clip|auto|scroll)/.test(getComputedStyle(n).overflowX)) {
        clipped = true;
        break;
      }
    }
    if (clipped) continue;
    offenders.push(el);
  }

  const outermost = offenders.filter((el) => !offenders.some((o) => o !== el && o.contains(el)));

  return outermost.slice(0, 8).map((el) => {
    const r = el.getBoundingClientRect();
    const id = el.id ? `#${el.id}` : '';
    const cls =
      el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
    return `${el.tagName.toLowerCase()}${id}${cls} → right edge ${Math.round(r.right)}px of ${docWidth}px`;
  });
}

/**
 * Interactive elements that are visible, on-screen, and not exempt.
 * Takes a single packed argument because Playwright serialises this function
 * into the page — it cannot close over anything from module scope.
 */
function findSmallTouchTargets([selector, minSize]) {
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const findings = [];

  for (const el of document.querySelectorAll(selector)) {
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) continue;

    const s = getComputedStyle(el);
    if (s.visibility === 'hidden' || s.display === 'none' || s.pointerEvents === 'none') continue;
    if (el.closest('[hidden], [aria-hidden="true"], [inert]')) continue;

    // Off-screen: closed nav drawers and collapsed menus aren't targets yet.
    if (r.right < 0 || r.bottom < 0 || r.left > vw || r.top > vh) continue;

    // WCAG 2.5.5 exempts targets in a sentence or block of text.
    if (s.display === 'inline' && el.tagName === 'A') continue;

    if (r.width >= minSize && r.height >= minSize) continue;

    const id = el.id ? `#${el.id}` : '';
    const cls =
      el.className && typeof el.className === 'string'
        ? '.' + el.className.trim().split(/\s+/).slice(0, 2).join('.')
        : '';
    const label = (el.textContent || '').trim().slice(0, 30) || el.getAttribute('aria-label') || '';
    findings.push(
      `${el.tagName.toLowerCase()}${id}${cls} "${label}" → ${Math.round(r.width)}x${Math.round(r.height)}`
    );
  }

  return findings.slice(0, 10);
}

for (const route of ROUTES) {
  const override = OVERRIDES[route];
  if (override && override.skip) {
    test.skip(`${route} — skipped`, () => {});
    continue;
  }

  test.describe(route, () => {
    for (const vp of MATRIX) {
      test.describe(vp.name, () => {
        test.use({ viewport: { width: vp.width, height: vp.height } });

        test('does not scroll horizontally', async ({ page }) => {
          await gotoPage(page, route);

          const overflow = await page.evaluate(
            () => document.documentElement.scrollWidth - document.documentElement.clientWidth
          );

          const detail =
            overflow > 1
              ? `${route} overflows by ${overflow}px at ${vp.width}px wide.\nCaused by:\n  ` +
                (await page.evaluate(findOverflowCulprits)).join('\n  ')
              : '';

          expect(overflow, detail).toBeLessThanOrEqual(1);
        });

        if (vp.width <= TOUCH_VIEWPORT_MAX_WIDTH) {
          test(`interactive elements meet the ${TOUCH_TARGET_MIN}px touch target`, async ({
            page,
          }) => {
            await gotoPage(page, route);

            const small = await page.evaluate(findSmallTouchTargets, [
              INTERACTIVE,
              TOUCH_TARGET_MIN,
            ]);

            expect(
              small,
              `${route} has ${small.length} undersized touch targets at ${vp.width}px:\n  ` +
                small.join('\n  ')
            ).toEqual([]);
          });
        }
      });
    }
  });
}
