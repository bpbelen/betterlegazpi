# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository context

This repo is a **fork-in-progress of BetterSolano.org being retrofitted for LGU Legazpi City** ("BetterLegazpi.org"). Rebranding is incomplete: `package.json`, `README.md`, and comments/strings in several JS files (e.g. `assets/js/main.js`) still say "BetterSolano" / "Solano", while `index.html`'s `<title>`, `data/services.json`, and most content already reference Legazpi City. When editing shared strings (install prompts, footer text, meta tags), check whether you're touching a not-yet-migrated Solano-era string before assuming it's correct as-is — don't "fix" it back to Solano, and don't assume every occurrence of "Solano" is intentional.

The static HTML site (this branch, `main`) is the source of truth. A parallel React + TypeScript version exists on the upstream project's `react-typescript` branch (see `MIGRATION.md`) — it is not present in this working tree.

## Commands

```bash
npm run dev              # local dev server with clean-URL support (serve.py), port 8000
npm run build             # bash build.sh — bumps patch version, builds dist/ (minified, includes React merge step if react-app/ present)
npm run build -- --no-bump
npm run build:minor / build:major
npm run serve:dist        # serve dist/ on port 8080
npm run version:check / version:patch / version:minor / version:major   # scripts/bump-version.js
npm run format             # prettier --write .
npm run format:check
npm run lighthouse         # lhci autorun (config: .lighthouserc.json)

npm test                   # playwright test (all browser projects)
npm run test:chrome        # playwright test --project=chrome
npm run test:report        # open last HTML report
npx playwright test tests/volunteer-modal.a11y.spec.js         # run a single spec file
npx playwright test tests/volunteer-modal.a11y.spec.js -g "some test name"   # run a single test
```

Playwright (`playwright.config.js`) spins up `python3 -m http.server 8321` automatically against the repo root and runs specs across chrome/edge/firefox/safari/mobile-safari/mobile-chrome projects. Note this is **plain `http.server`, not `serve.py`** — the clean-URL rewriting that `serve.py` and `.htaccess` perform is absent under test, so specs must navigate real `.html` paths (`/services/index.html`, not `/services/`). No pre-commit hook is installed in this checkout despite README claims of one.

**Do not run `npm run format` (`prettier --write .`) on a Windows checkout.** `.prettierrc` sets `"endOfLine": "lf"`, `core.autocrlf` is `true`, and there is no `.gitattributes` — so git writes CRLF to disk and *every* file fails `prettier --check` on line endings alone. A tree-wide format would rewrite every file's line endings and bury real changes in the churn. Format the specific files you touched instead (`npx prettier --write path/to/file`). Adding `.gitattributes` with `* text=auto eol=lf` would fix the underlying mismatch.

**CI.** `.github/workflows/` holds `lighthouse.yml` (builds `dist/`, serves it on :8080, runs Lighthouse CI against 4 URLs using `.lighthouserc.json`) and `facebook-sync.yml`. `.lighthouserc.json` sets `categories:accessibility` to `["error", {minScore: 0.9}]` — the only hard gate; performance/SEO/best-practices are warnings. It specifies no form factor, so Lighthouse runs its **mobile** default and desktop is never audited. No workflow runs Playwright, despite the config carrying CI branches (`forbidOnly`, `retries: 1`, `['github']` reporter).

No test/lint command exists for plain HTML/JS correctness beyond Prettier formatting and the Playwright specs under `tests/` (currently scoped to the volunteer modal only).

## Architecture

**Static multi-page site, no bundler/framework for the main site.** Every route is a real HTML file (or `<dir>/index.html`); "clean URLs" (no `.html`) are achieved two ways that must stay in sync:

- Locally: `serve.py`'s `CleanURLHandler` rewrites `/foo` → `foo.html` / `foo/index.html`.
- Production: `.htaccess` mod_rewrite rules do the same thing on cPanel/Apache, plus HTTPS force, security headers (CSP, HSTS, X-Frame-Options), and gzip/caching.

Because these are two independent implementations of the same rewrite behavior, a change to one (e.g. adding a new top-level directory that needs index resolution) should be checked against the other.

**Page structure.** Top-level directories each hold one topic's page(s):

- `services/` — category landing pages (agriculture, business, certificates, education, employment, environment, health, infrastructure, social-services, tax-payments) plus `services/index.html`.
- `service-details/` — individual office/department service pages (e.g. `city-civil-registrar.html`, `cto-services.html`), linked from `data/services.json` entries.
- `government/`, `legislative/`, `budget/`, `statistics/`, `news/`, `history/`, `contact/`, `faq/`, `sitemap/`, `accessibility/`, `terms/`, `privacy/` — one section each.
- `admin/news-editor.html` — a standalone admin tool, excluded from the production build (see `build.sh` rsync excludes).

**Data-driven content.** `data/*.json` (services, officials, news, ordinances, resolutions, demographics, health-facilities, barangays, dpwh-projects, fiscal_transparency, sumbong-flood-control, competitive-index) is fetched client-side by matching JS modules in `assets/js/` (`officials.js`, `news.js`, `ordinances.js`, `resolutions.js`, `statistics-new.js`, `health-directory.js`, `dpwh-projects.js`, `sumbong-projects.js`, `transparency-v2.js`, `search.js`). When adding or editing municipal data, edit the JSON in `data/` — HTML pages generally render it dynamically rather than hardcoding content, and `service-details/*.html` pages are cross-referenced by id/slug from `data/services.json`.

**i18n — present in the repo, absent from the site.** `assets/js/translations.js` (1,135 KB / 266 KB gzipped) defines an en/fil/ilo `translations` object and a `TranslationEngine` driven by `data-i18n*` attributes. **None of it is wired up.** No HTML page loads the script, no page contains a single `data-i18n` attribute, and no page has a language toggle — the Legazpi fork stripped the feature from the markup and left the file behind. Two traps follow from this: `sw.js:20` still precaches the 1.1 MB file, so every PWA install pays for it; and `main.js:523` still claims "Language handling is now managed by TranslationEngine in translations.js", which is no longer true. Do not add `data-i18n` attributes expecting them to work, and treat README's multi-language claims as describing BetterSolano, not this site.

**PWA.** `sw.js` is a versioned service worker with a dual-cache strategy (`STATIC_CACHE` precache + `RUNTIME_CACHE` FIFO/TTL runtime cache), network-first navigation with `offline.html` fallback, and `skipWaiting`/`controllerchange`-based silent updates (no manual refresh prompt). `manifest.webmanifest` declares install metadata/shortcuts. Bumping the site version (via `scripts/bump-version.js`) is what invalidates the SW cache — `version.json` is the single source of truth, synced into `package.json` and every HTML file's footer.

**Build (`build.sh`).** Six-stage bash pipeline: (1) version bump via `scripts/bump-version.js`, (2) clean `dist/`, (3) rsync-copy the static site into `dist/` excluding dev-only paths (`node_modules`, `react-app`, `admin`, `scripts`, `docs`, `*.md`, etc. — see the exclude list before assuming a file ships), (4) build the optional `react-app/` (Next.js) and merge only its `_next/` assets and `services/health.html` into `dist/` without overwriting other legacy pages, (5) minify HTML (html-minifier-terser)/CSS (clean-css)/JS (babel + terser), (6) set cPanel-appropriate file permissions (755 dirs / 644 files). On Windows/no-rsync environments it falls back to `scripts/copy-dist.js`. There is no `react-app/` directory in this checkout, so stage 4 is a no-op here.

**Scratch/data-sourcing scripts.** `scratch/` holds one-off Python scripts (NHFR health-facility scraping/parsing, link/data validators) used to originally generate `data/health-facilities.json` and similar — not part of the build or test pipeline, and not guaranteed to still run against live endpoints.

## Agent skills

### Issue tracker

Issues live in GitHub Issues at https://github.com/bpbelen/betterlegazpi/issues. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context repository with shared mental model in `CONTEXT.md` and architecture decisions in `docs/adr/`. See `docs/agents/domain.md`.
