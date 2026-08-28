#!/usr/bin/env node
/**
 * Capture full-page screenshots of a representative page set in both themes.
 *
 * These are *baselines*, captured before the design-token restructure (ADR 0003)
 * so that a later visual-regression harness has a pre-change reference to compare
 * against. Nothing compares them yet — that is deliberate; the images are the part
 * that expires, the tooling is not.
 *
 * The route list covers one page per page-specific stylesheet, since those are the
 * pages that fight the sitewide dark-mode rules on specificity and so are the ones
 * most likely to break when those rules become token overrides.
 *
 *   node scripts/validate/capture-theme-baselines.js [--out tests/baselines] [--port 8322]
 */

const { chromium } = require('@playwright/test');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const ROUTES = [
  ['home', '/index.html'],
  ['services-index', '/services/index.html'],
  ['services-agriculture', '/services/agriculture.html'],
  ['services-business', '/services/business.html'],
  ['services-health', '/services/health.html'],
  ['services-utilities', '/services/utilities.html'],
  ['hub-ceo', '/service-details/ceo-services.html'],
  ['hub-cto', '/service-details/cto-services.html'],
  ['government', '/government/index.html'],
  ['policies', '/policies/index.html'],
  ['budget', '/budget/index.html'],
  ['statistics', '/statistics/index.html'],
  ['tourism', '/tourism/index.html'],
  ['history', '/history/index.html'],
  ['contact', '/contact/index.html'],
  ['news', '/news/index.html'],
  ['faq', '/faq/index.html'],
];

const args = process.argv.slice(2);
const argOf = (flag, fallback) => {
  const i = args.indexOf(flag);
  return i === -1 ? fallback : args[i + 1];
};

const OUT_DIR = path.resolve(argOf('--out', 'tests/baselines'));
const PORT = Number(argOf('--port', '8322'));
const ROOT = path.resolve(__dirname, '../..');

function startServer() {
  const server = spawn('python', ['-m', 'http.server', String(PORT)], {
    cwd: ROOT,
    stdio: 'ignore',
  });
  return server;
}

// A raw socket probe rather than fetch(): python's http.server closes the
// connection in a way undici asserts on, which crashes the process outright.
async function waitForServer(port, timeoutMs = 20000) {
  const net = require('net');
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const up = await new Promise((resolve) => {
      const socket = net.connect({ port, host: '127.0.0.1' });
      socket.once('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.once('error', () => resolve(false));
    });
    if (up) return;
    await new Promise((r) => setTimeout(r, 250));
  }
  throw new Error(`static server did not come up on port ${port}`);
}

/**
 * The theme toggle writes to localStorage and sets data-theme on <html>. Setting
 * both before load avoids a flash of the wrong theme being captured, and matches
 * what main.js reads on boot.
 */
async function captureTheme(browser, theme) {
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: 'reduce',
    colorScheme: theme,
  });

  await context.addInitScript((mode) => {
    try {
      localStorage.setItem('theme', mode);
    } catch {
      /* storage may be unavailable */
    }
    document.documentElement.setAttribute('data-theme', mode);
    if (mode === 'light') document.documentElement.removeAttribute('data-theme');
  }, theme);

  const page = await context.newPage();

  for (const [name, route] of ROUTES) {
    const url = `http://127.0.0.1:${PORT}${route}`;
    await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 });
    // JSON-rendered sections settle after the network goes quiet; give them a beat.
    await page.waitForTimeout(600);
    // JPEG, not PNG: full-page PNGs of this site total ~27 MB, which would nearly
    // triple the repo against 4.6 MB of actual site imagery. These baselines are
    // read by eye and by coarse diffing, not by pixel-exact comparison, so the
    // compression costs nothing that matters here.
    const file = path.join(OUT_DIR, theme, `${name}.jpg`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    await page.screenshot({ path: file, fullPage: true, type: 'jpeg', quality: 60 });
    const kb = Math.round(fs.statSync(file).size / 1024);
    console.log(`  ${theme.padEnd(5)} ${name.padEnd(22)} ${String(kb).padStart(5)} KB`);
  }

  await context.close();
}

(async () => {
  const server = startServer();
  let browser;
  try {
    await waitForServer(PORT);
    browser = await chromium.launch();
    console.log(`Capturing ${ROUTES.length} routes x 2 themes -> ${OUT_DIR}`);
    await captureTheme(browser, 'light');
    await captureTheme(browser, 'dark');
    console.log('Done.');
  } finally {
    if (browser) await browser.close();
    server.kill();
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
