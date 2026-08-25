// @ts-check

/**
 * Viewports chosen to cover the real edges: the narrowest phone still in use,
 * ordinary portrait phones, phones held sideways, tablets, laptops, and a short
 * desktop window — the case where content most often overflows unreachably.
 *
 * `ci: true` marks the subset the regression gate runs across every browser.
 * Those five sit either side of each breakpoint cluster in the stylesheets
 * (575/576, 767/768/769, 991/992/993, 1024/1025), which is where layout bugs
 * actually surface.
 */
const VIEWPORTS = [
  { name: 'Galaxy Fold (320x653)', width: 320, height: 653, ci: true },
  { name: 'iPhone SE portrait (375x667)', width: 375, height: 667, ci: true },
  { name: 'iPhone 14 Pro (393x852)', width: 393, height: 852 },
  { name: 'iPhone SE landscape (667x375)', width: 667, height: 375 },
  { name: 'iPhone 14 landscape (852x393)', width: 852, height: 393 },
  { name: 'iPad portrait (768x1024)', width: 768, height: 1024, ci: true },
  { name: 'iPad landscape (1024x768)', width: 1024, height: 768 },
  { name: 'Laptop (1280x800)', width: 1280, height: 800, ci: true },
  { name: 'Short desktop window (1280x420)', width: 1280, height: 420 },
  { name: 'Full HD (1920x1080)', width: 1920, height: 1080, ci: true },
];

/** The five-viewport subset used by the CI tier. */
const CI_VIEWPORTS = VIEWPORTS.filter((vp) => vp.ci);

/** One phone and one desktop width, for checks that don't vary continuously. */
const MOBILE_VIEWPORT = VIEWPORTS[1]; // iPhone SE portrait
const DESKTOP_VIEWPORT = VIEWPORTS[7]; // Laptop 1280x800

module.exports = { VIEWPORTS, CI_VIEWPORTS, MOBILE_VIEWPORT, DESKTOP_VIEWPORT };
