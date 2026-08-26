# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository context

This repo is a **fork-in-progress of BetterSolano.org being retrofitted for LGU Legazpi City** ("BetterLegazpi.org"). Rebranding is incomplete: `package.json` is still named `bs-web`, the PWA shell still precaches `assets/images/logo/better-solano-logo.svg`, and "Solano" survives in `README.md`, several docs, and page copy. An occurrence of "Solano" may be a genuine leftover _or_ a deliberate reference to the upstream sibling project — check before "fixing" it, and don't assume every occurrence is a bug.

`CONTEXT.md` at the repo root is the shared glossary (route, clean URL, service/category/office, the three coexisting layout generations, theme, audit vs. CI tier). Read it before touching markup or CSS — it explains vocabulary this file assumes. Architecture decisions live in `docs/adr/`.

The static HTML site (this branch, `main`) is the source of truth. A parallel React + TypeScript version exists on the upstream project's `react-typescript` branch (see `MIGRATION.md`) — it is not present in this working tree.

## Commands

```bash
npm run dev              # local dev server with clean-URL support (serve.py), port 8000
npm run build            # bash build.sh — bumps patch version, builds dist/ (minified)
npm run build -- --no-bump
npm run build:minor / build:major
npm run serve:dist       # serve dist/ on port 8080
npm run version:check / version:patch / version:minor / version:major   # scripts/bump-version.js
npm run format           # prettier --write .   (see the Windows warning below)
npm run format:check
npm run lighthouse       # lhci autorun (mobile config)

npm test                 # playwright test — all specs, all six browser projects
npm run test:chrome      # --project=chrome
npm run test:report      # open last HTML report
npx playwright test tests/site-responsive.spec.js --project=mobile-chrome   # one spec, one project
npx playwright test tests/site-a11y.spec.js -g "some test name"             # one test
```

There is no `build:patch` script — plain `npm run build` _is_ the patch bump. `npm run dev` invokes `python`, not `python3`; where only `python3` is on PATH, run `python3 serve.py -p 8000 -d .` directly.

**Do not run `npm run format` (`prettier --write .`) on a Windows checkout.** `.prettierrc` sets `"endOfLine": "lf"`, `core.autocrlf` is `true`, and there is still no `.gitattributes` — so git writes CRLF to disk and _every_ file fails `prettier --check` on line endings alone. A tree-wide format would rewrite every file's line endings and bury real changes in the churn. Format only the files you touched (`npx prettier --write path/to/file`). Adding `.gitattributes` with `* text=auto eol=lf` would fix the underlying mismatch.

## Testing

`playwright.config.js` starts `python3 -m http.server 8321` against the repo root. That is **plain `http.server`, not `serve.py`** — the clean-URL rewriting `serve.py` and `.htaccess` perform is absent under test, so specs must navigate real `.html` paths (`/services/index.html`, never `/services/`).

Coverage is site-wide, not just the volunteer modal: `site-responsive.spec.js` (layout geometry, touch targets), `site-a11y.spec.js` (axe via `@axe-core/playwright`), and `volunteer-modal.{a11y,behavior,responsive,performance}.spec.js`.

The site specs are driven by shared helpers rather than hardcoded lists — that's where changes belong:

- `tests/helpers/pages.js` — `discoverRoutes()` walks every `.html` under the repo (minus `EXCLUDED_DIRS`) for the **audit tier**; `CI_ROUTES` is the hand-picked **CI tier**, one route per layout generation and per page-specific stylesheet. Adding a new stylesheet or layout pattern means adding a route here, or CI never sees it.
- `tests/helpers/viewports.js` — ten viewports; the five flagged `ci: true` sit either side of the breakpoint clusters and form the CI matrix.
- `tests/pages.overrides.js` — per-route escape hatches. A page whose content arrives from `data/*.json` after load needs a `waitForSelector` targeting a _child_ of the render container (the container itself ships in static HTML and would resolve instantly). Add an entry when you add a JSON-rendered page, or the harness measures an empty container and reports a false pass.

**CI.** `.github/workflows/`:

- `playwright.yml` — two jobs. `responsive` is the **blocking gate**: responsive + volunteer-modal specs on `mobile-chrome`, `firefox`, `safari` (bundled engines; the `chrome`/`edge` channel projects are local-only, being slow and fragile on runners). `accessibility` runs `site-a11y.spec.js` with `continue-on-error: true` — advisory, because axe reports a pre-existing backlog.
- `lighthouse.yml` — builds `dist/`, serves it on :8080, runs a **mobile × desktop matrix** over 9 URLs. `.lighthouserc.json` (mobile) is all warnings; `.lighthouserc.desktop.json` gates `categories:accessibility` at `["error", {minScore: 0.9}]` — the only hard Lighthouse failure.
- `facebook-sync.yml` — content sync (see `docs/facebook-sync.md`).

Beyond Prettier and these specs there is no lint or type check for the plain HTML/JS. No pre-commit hook is installed despite README claims of one.

## Architecture

**Static multi-page site, no bundler or framework.** Every route is a real HTML file (or `<dir>/index.html`); "clean URLs" (no `.html`) are produced two ways that must stay in sync:

- Locally: `serve.py`'s `CleanURLHandler` rewrites `/foo` → `foo.html` / `foo/index.html`.
- Production: `.htaccess` mod_rewrite does the same on cPanel/Apache, plus HTTPS force, security headers (CSP, HSTS, X-Frame-Options), and gzip/caching.

These are two independent implementations of one behavior, so a change to either (e.g. a new top-level directory needing index resolution) should be checked against the other — and against the Playwright note above, where neither is in play.

There is no templating layer, so header/nav/footer markup is **duplicated into every page**. Chrome changes are a repo-wide find-and-replace, not a single-file edit.

**Page structure.** Top-level directories each hold one topic's page(s):

- `services/` — category landing pages (agriculture, business, certificates, education, employment, environment, health, infrastructure, social-services, tax-payments) plus `services/index.html`.
- `service-details/` — per-office pages (e.g. `city-civil-registrar.html`, `cto-services.html`), linked from `data/services.json` entries. These carry large page-local `<style>` blocks.
- `tourism/` — attractions, landmarks, food, accommodations, experience.
- `government/`, `legislative/`, `budget/`, `statistics/`, `news/`, `history/`, `contact/`, `faq/`, `sitemap/`, `accessibility/`, `terms/`, `privacy/` — one section each.
- `admin/news-editor.html` — standalone admin tool, excluded from the production build (see `build.sh` rsync excludes).

**Data-driven content.** `data/*.json` (services, officials, news, ordinances, resolutions, demographics, health-facilities, barangays, dpwh-projects, fiscal_transparency, sumbong-flood-control, competitive-index, tourism-\*) is fetched client-side by matching modules in `assets/js/` (`officials.js`, `news.js`, `ordinances.js`, `resolutions.js`, `statistics-new.js`, `health-directory.js`, `dpwh-projects.js`, `sumbong-projects.js`, `transparency-v2.js`, `tourism.js`, `history.js`, `philhealth-yakap.js`, `search.js`). When adding or editing municipal data, edit the JSON — pages render it dynamically rather than hardcoding it, and `service-details/*.html` pages are cross-referenced by id/slug from `data/services.json`.

**i18n — removed, planned for later.** The inherited `TranslationEngine` and its 1.1 MB `assets/js/translations.js` bundle are **gone**: no `data-i18n` attributes, no language toggle, no precache entry, no remaining reference. The site ships English-only. Per the note at `assets/js/main.js:520`, multi-language (English, Filipino, **Bicol**) is planned as **per-locale files fetched on demand**, not a single bundle loaded on every page. Do not add `data-i18n` attributes expecting them to work, and treat README's multi-language claims as describing BetterSolano, not this site.

**PWA.** `sw.js` is a versioned service worker (currently `v5`) with a dual-cache strategy (`STATIC_CACHE` precache + `RUNTIME_CACHE`, FIFO-capped at 80 entries with a 7-day TTL), network-first navigation falling back to `offline.html`, and `skipWaiting`/`controllerchange` silent updates (no manual refresh prompt). `manifest.webmanifest` declares install metadata/shortcuts. Bumping the site version is what invalidates the SW cache — `version.json` is the single source of truth, synced by `scripts/bump-version.js` into `package.json` and every HTML file's footer.

**Build (`build.sh`).** Six-stage bash pipeline: (1) version bump via `scripts/bump-version.js`, (2) clean `dist/`, (3) rsync-copy the static site into `dist/` excluding dev-only paths (`node_modules`, `react-app`, `admin`, `scripts`, `docs`, `*.md`, etc. — read the exclude list before assuming a file ships), (4) build the optional `react-app/` (Next.js) and merge only its `_next/` assets and `services/health.html` into `dist/` without overwriting other legacy pages, (5) minify HTML (html-minifier-terser) / CSS (clean-css) / JS (babel + terser), (6) set cPanel-appropriate permissions (755 dirs / 644 files). On Windows/no-rsync environments it falls back to `scripts/copy-dist.js`. There is no `react-app/` in this checkout, so stage 4 is a no-op; `--no-react` skips it explicitly.

**Scratch and data-sourcing scripts.** `scratch/` holds one-off Python (NHFR health-facility scraping/parsing, link/data validators) that originally generated `data/health-facilities.json`; `scripts/` also carries tourism scrapers and photo-preparation scripts. None are part of the build or test pipeline, and none are guaranteed to still run against live endpoints. `tests/helpers/pages.js` excludes `scratch/` deliberately — the saved DOH pages there are third-party markup and findings against them are not actionable.

## Agent skills

### Issue tracker

Issues live in GitHub Issues at https://github.com/bpbelen/betterlegazpi/issues. PRs are for code review only and are not routed into triage. See `docs/agents/issue-tracker.md`.

### Domain docs

Single-context repository with shared mental model in `CONTEXT.md` and architecture decisions in `docs/adr/` (`NNN-hyphenated-slug.md`). See `docs/agents/domain.md`.
