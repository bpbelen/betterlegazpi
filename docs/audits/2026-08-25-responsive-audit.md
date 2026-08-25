# Responsive & Compatibility Audit — 2026-08-25

Automated audit of every page for desktop and mobile compatibility, covering
layout, touch targets, accessibility, and performance.

> **Status: remediation pass complete.** The findings below are recorded as
> first measured. Outcomes after fixes:
>
> | Measure                                    | Before                  | After                                                                     |
> | ------------------------------------------ | ----------------------- | ------------------------------------------------------------------------- |
> | Horizontal overflow (430 checks)           | 44 failures / 41 routes | **0**                                                                     |
> | Touch targets breaching WCAG 2.5.8 AA      | 1                       | **0**                                                                     |
> | Touch targets below the 44px AAA guideline | 31 elements             | 48 elements _(more became visible once the largest offenders were fixed)_ |
> | Accessibility scans passing — light theme  | 2 of 86 (2%)            | **51 of 86 (59%)**                                                        |
> | Accessibility scans passing — dark theme   | 22 of 86 (26%)          | 22 of 86 (26%)                                                            |
> | `aria-required-children` criticals         | 2                       | **0**                                                                     |
>
> Two corrections to this report's original conclusions, both established
> during remediation and detailed in [Remediation](#remediation):
> **`.skip-link` was a genuine contrast failure, not an axe artifact**, and
> **dark theme is now the worse theme for contrast**, not light.

## Summary

**817 automated checks** — 645 layout/touch (43 routes × 10 viewports) plus 172
accessibility scans (43 routes × 2 surfaces × 2 themes), Chrome, ~23 minutes
total. **410 passed, 407 failed** — but those failures collapse to roughly
eighteen root causes, because a site with no templating shares its CSS
everywhere.

The findings that matter most:

1. **One shared component breaks 41 of 43 pages** at 320px. Not 41 bugs — one.
2. **The emergency hotline has the smallest touch targets on the site**, and is
   the only element that breaches WCAG 2.5.8 AA.
3. **266 KB (gzipped) of dead JavaScript is precached on every PWA install** for
   a feature that no longer exists in the HTML.
4. **Light theme fails accessibility far more than dark** — 2% of scans pass
   versus 26%. The opposite of what this audit was scoped to expect.
5. **The site does not currently meet its own accessibility gate.**
   `.lighthouserc.json` sets `accessibility ≥ 0.9` as the only hard CI failure,
   and axe reports serious violations on all 43 routes in both themes.

Nothing here is a desktop-only layout defect. Every overflow failure is at
≤393px; the site is geometrically sound from 667px up. The accessibility
failures, by contrast, are viewport-independent — they affect desktop equally.

## Method

A page-agnostic Playwright harness (`tests/site-responsive.spec.js`) navigates
every `.html` route and asserts, per viewport:

- the page does not scroll horizontally, and names the elements responsible
- interactive elements meet a 44×44px touch target (mobile widths only)

A second spec (`tests/site-a11y.spec.js`) runs axe-core against every route at
one mobile and one desktop width, in both light and dark themes, asserting the
WCAG 2.1 A/AA rule set. AAA rules are excluded deliberately — mixing them in
would bury the failures that breach the stated commitment.

Routes come from a glob with `scratch/` excluded — `nhfr.html` and
`nhfr_search_legazpi.html` are saved copies of DOH's facility registry, not
pages of this site. The volunteer modal is suppressed via `localStorage` so it
does not cover every page under test.

**Not covered:** visual regression (no screenshot baseline exists anywhere in
the repo), and cross-browser rendering — this run was Chrome-only. The CI tier
added alongside this audit runs three engines on a page sample.

---

## 1. Layout — horizontal overflow

**44 failures across 41 routes.** Severity is high: horizontal scroll on a phone
makes content unreachable and is the most viscerally "broken" mobile symptom.

### The unifying mechanism

Three of the four root causes are the same CSS behaviour wearing different
clothes: **the automatic minimum size**. A flex or grid item will not shrink
below its content's `min-content` width unless explicitly told it may.

- In grid, `1fr` means `minmax(auto, 1fr)` — the `auto` floor is the culprit.
- In flex, `min-width` defaults to `auto` — same floor.

The fix in both cases is to override that floor (`minmax(0, 1fr)`, or
`min-width: 0`), plus a wrap or truncate strategy for the text inside. This is
worth stating once because it recurs, and because "make the breakpoint smaller"
is the intuitive fix that does _not_ work here.

### Findings, ranked

| #   | Element                                                      | Routes       | Viewports     | Overflow |
| --- | ------------------------------------------------------------ | ------------ | ------------- | -------- |
| L1  | `div.info-bar-item.info-bar-datetime`                        | **41 of 43** | 320           | to 329px |
| L2  | `table#ordinance-table.data-table`                           | 1            | 320, 375, 393 | to 508px |
| L3  | `a/div.home-contact-v2-card.glass-card`                      | 1            | 320, 375      | to 387px |
| L4  | `div.home-leader-card.glass-card`                            | 1            | 320           | to 370px |
| L5  | `div.distribution-chart`, `div.distribution-barangays-panel` | 1            | 320           | to 358px |
| L6  | `canvas#historicalLineChart`, `canvas#cmciOverviewChart`     | 1            | 320           | to 350px |
| L7  | `div.dpwh-chart-card`                                        | 1            | 320           | to 350px |

**L1 — the real-time info bar. Fix this first.**

`assets/css/style.css:8625` sets `.info-bar-datetime { flex-wrap: nowrap }`
inside `@media (max-width: 575px)`. The element is a flex item inside
`.info-bar-inner` (`style.css:8440`), so it inherits `min-width: auto`. With its
contents forced onto one line, its min-content width becomes the full unbroken
string — 329px, wider than a 320px viewport.

The corroboration is clean: **the only two routes that pass are
`admin/news-editor.html` and `offline.html`** — the only two pages in the repo
that load no shared stylesheets. That is as close to proof of a shared root
cause as an audit gets.

Note the sibling `.info-bar-rates-list` already got the correct treatment at
`style.css:8613` (`max-width: 100%; overflow-x: auto`). The datetime item was
simply missed.

**L2 — the ordinance table** is the widest single offender (508px) and the only
finding that survives to 393px, so it affects mainstream phones, not just the
Galaxy Fold. A `data-table` needs an `overflow-x: auto` wrapper; the pattern
already exists elsewhere in the codebase.

**L5–L7 — charts.** Chart.js canvases and their panels overflow at 320px on
`statistics/` and `budget/`. Same wrapper fix as L2.

**L3, L4 — homepage cards.** `.home-contact-v2-grid` (`style.css:7460`) uses
`repeat(3, 1fr)` collapsing to `1fr` at `max-width: 992px` (`style.css:7544`).
The collapse _is_ active at 375px, yet the card still measures 387px — textbook
`1fr` auto-floor. Needs `minmax(0, 1fr)` and `min-width: 0` on the card.

---

## 2. Touch targets

**215 raw failures, but only 31 distinct elements, and only one is a
conformance breach.** The raw count is misleading and is reported here bucketed
by what it actually obliges you to do.

The harness enforces **44×44px** — WCAG 2.5.5 (AAA) and both platform HIGs. The
level that a WCAG 2.1 **AA** commitment binds you to is 2.5.8, at **24×24px**.
Both numbers are legitimate; conflating them turns a short fix list into 215
lines of noise.

### AA breach — fix required

| Element            | Size      | Where                 |
| ------------------ | --------- | --------------------- |
| `a.hotline-number` | **22×21** | emergency hotline bar |

This is the only element on the site below 24×24. It is also, of everything that
could have been too small, an **emergency phone number**. On a government portal
the hotline should be the easiest thing on the page to hit — ideally the largest
target, not the smallest.

Its sibling `a.hotline-item` (137×**25**, on 41 routes) clears the AA floor by a
single pixel. Any future font or padding change tips it over. Treat the hotline
bar as one fix, not two.

### AAA / HIG gap — improvements, not breaches

Meets AA, below the 44px guideline. Ranked by reach:

| Element                                | Size   | Routes              |
| -------------------------------------- | ------ | ------------------- |
| `button#theme-toggle.theme-toggle-btn` | 36×36  | **43** (every page) |
| `a.skip-link`                          | 171×42 | 41                  |
| `a.hotline-item`                       | 137×25 | 41                  |
| `button.mobile-menu-toggle.btn`        | 40×41  | 41                  |
| bare `a` (inline-block)                | 89×32  | 40                  |
| `a.footer-social-btn`                  | 40×40  | 3                   |
| `button.service-tab`                   | 148×32 | 3                   |

The top four are shared chrome — four CSS rules would lift almost the entire
list. `theme-toggle` at 36×36 and `mobile-menu-toggle` at 40×41 are each within
8px of the guideline.

Single-route entries are dominated by `admin/news-editor.html` (`btn-reload`,
`btn-import`, `btn-copy`, `btn-download`, `btn-new`). That page is excluded from
the production build by `build.sh`, so its findings are lowest priority — it was
included in scope deliberately, but no constituent will ever load it.

---

## 3. Accessibility (axe-core, WCAG 2.1 A/AA)

172 scans — 43 routes × {mobile, desktop} × {light, dark}. **24 passed, 148
failed**, across just **6 distinct rules**. A small rule count over a large
failure count is the good case: it means a handful of fixes, not 148.

### Light theme is markedly worse than dark

| Theme | Passing scans      |
| ----- | ------------------ |
| light | **2 of 86 (2%)**   |
| dark  | **22 of 86 (26%)** |

This inverts the assumption the audit was scoped on. Dark mode was treated as
the risk — it shipped in a single 35-file commit with hundreds of component
overrides and no verification — but the freshly-specified dark palette clears
contrast thresholds noticeably more often than the palette the site has carried
since the Solano fork.

Neither theme is close to passing, and **no rule fails in one theme only** —
dark introduced no new _categories_ of violation. But the priority ordering is
the reverse of what was expected: the light palette needs the attention.

### Violations by rule

| Impact   | Routes | Rule                                                       |
| -------- | ------ | ---------------------------------------------------------- |
| critical | 2      | `aria-required-children` — `budget/`, `services/education` |
| critical | 1      | `label` — `admin/news-editor` (`#file-input`)              |
| serious  | **43** | `color-contrast`                                           |
| serious  | 3      | `link-in-text-block`                                       |
| serious  | 2      | `nested-interactive`                                       |
| serious  | 1      | `scrollable-region-focusable`                              |

### `color-contrast` — every route, both themes

The dominant offender is **`.skip-link`, on 41 of 43 routes**.

There is an irony worth stating plainly: the skip link exists purely as a
keyboard-accessibility affordance, and it is the site's most widespread
accessibility violation.

**This one needs a human eye before it is "fixed."** Skip links are normally
visually hidden until focused. axe evaluates them in the DOM regardless, and if
the hiding technique is an off-screen offset rather than a clip, axe will report
a contrast failure against a background the user never actually sees. Check how
`.skip-link` is hidden before changing its colours — the correct fix may be the
hiding technique, not the palette. If it _is_ genuinely visible, this is a real
41-route defect.

Beyond it, contrast failures are thinly spread: 33 routes carry exactly one
violating node, and the rest are page-local — `.office-hours-item--open`,
`.councilor-badge--liga`, `.councilor-badge--sk`, `.sre-title-group`, plus two
selectors matching a repeated card paragraph on 6 routes each.

### Criticals

`aria-required-children` on `budget/` and `services/education` means an ARIA
role is missing its required child roles — a screen reader will misreport the
structure. Two routes, two fixes.

`label` on `admin/news-editor` is a `#file-input` with no label. Lowest priority
of the three: that page never ships to production.

### Caveat

axe catches roughly 30–40% of WCAG issues. Everything above is machine-detected;
a clean axe run would not by itself demonstrate conformance. Keyboard traps,
focus order, and screen-reader comprehensibility still need manual testing, and
none of that was in scope here.

---

## 4. Performance

### P1 — 266 KB gzipped of dead code, precached on every install

`assets/js/translations.js` is **1,135 KB raw / 266 KB gzipped**. It is:

- referenced by **zero** HTML pages (no `<script>` tag anywhere)
- backing a feature with **zero** remaining consumers — no page contains a
  single `data-i18n` attribute, and no page has a language toggle
- still listed in the service worker precache at **`sw.js:20`**

So every PWA install downloads a quarter-megabyte for a system that no longer
exists in the markup. In the prepaid-mobile-data context the rollout strategy
explicitly calls out, this is the single most expensive line in the repo.

`assets/js/main.js:523` still carries the comment _"Language handling is now
managed by TranslationEngine in translations.js"_, which is no longer true and
actively misleads.

**This needs a decision, not just a fix.** Either the multi-language support
described in `README.md` is coming back — in which case the file stays and the
HTML needs reinstrumenting — or it is gone, and both the file and the `sw.js`
precache entry should go with it. Removing the precache line alone is the safe
immediate step either way.

### P2 — payload

| Asset                               | Raw    | Gzipped |
| ----------------------------------- | ------ | ------- |
| `assets/css/style.css`              | 244 KB | 36 KB   |
| `services/education.html`           | 346 KB | —       |
| `service-details/cto-services.html` | 299 KB | —       |

`education.html` and `cto-services.html` are large because page CSS is inlined
rather than shared — `cto-services.html` alone carries a 1,442-line `<style>`
block. Inline CSS cannot be cached across pages, so a visitor reading three
service-detail pages downloads three near-identical copies.

### P3 — `search.js` cache-busting is inconsistent

`index.html` loads `search.js?v=1.3.0`; `services/index.html:656` loads
`search.js` with no query string. The two are distinct cache entries, so a
visitor can hold two copies of the same file, and a stale one can persist after
a version bump.

---

## Appendix — rebranding & hygiene

Not mobile-compatibility issues, but found while reading all 43 pages. **A1 is
causing active harm and should not wait for this audit's fix pass.**

**A1 — 13 pages declare a canonical URL pointing at a different domain.**

```
<link rel="canonical" href="https://bettersolano.org/...">
```

`accessibility/`, `budget/`, `faq/`, `legislative/index`,
`legislative/ordinance-framework`, `legislative/resolution-framework`, `news/`,
`privacy/`, `services/business`, `services/education`, `services/index`,
`sitemap/`, `terms/`. Open Graph images and `twitter:url` point there too.

This instructs search engines that these Legazpi pages are duplicates of
BetterSolano's. It suppresses their ranking for as long as it stands.

**A2 — 17 pages still carry the entire old Solano footer**, with
`facebook.com/bettersolano.org`, a "Solano Quiz" link, a `solano.gov.ph`
Citizen's Charter PDF, and "Empowering the people of Solano": `403`, `404`,
`500`, `accessibility/`, `budget/`, `contact/`, `faq/`, `legislative/` (×3),
`news/`, `privacy/`, `services/business`, `services/education`,
`services/index`, `statistics/`, `terms/`.

The footer exists in two incompatible generations — 52 to 206 normalised lines,
6 to 13 links — so this is a fork of the component, not a set of stale strings.

**A3 — `403/404/500.html` omit `version.js`.** Every other page loads it, so the
error pages show no version in the footer.

**A4 — `service-details/` has no `index.html`.** `/service-details/` resolves to
nothing under `serve.py` and `.htaccess` alike.

**A5 — `class="mswdo-section"` on `ceo-services`, `cpdo-services`,
`gso-services`** — copy-paste leftovers from an MSWDO template, on pages about
engineering, planning, and general services.

**A6 — the logo asset is still `assets/images/logo/better-solano-logo.svg`**,
referenced 85 times. The file exists, so nothing is broken; it is misbranded,
not missing. `alt` text varies per page across four different strings.

**A7 — `npm run format` is unsafe on a Windows checkout.** `.prettierrc` sets
`"endOfLine": "lf"`, `core.autocrlf` is `true`, and there is **no
`.gitattributes`**. Git therefore writes CRLF to disk on checkout, and every
pre-existing file fails `prettier --check` on line endings alone — verified: a
spec file nobody has touched reports 131 CRLF endings and 0 LF.

Running the documented pre-commit step, `npm run format` (`prettier --write .`),
would rewrite the line endings of every file in the repo. `core.autocrlf` would
convert most of it back on commit, so the committed diff may come out clean —
but the working tree churn is total, and it would bury any real change in it.

Adding a `.gitattributes` with `* text=auto eol=lf` would make the repo's stated
formatting contract and its checkout behaviour agree. Until then, format
individual files rather than the tree.

### Corrected — a finding that did not survive verification

An earlier exploration pass reported that `government/officials.html` loads
`officials.js` twice and `services/health.html` loads `health-directory.js`
twice. **This is false.** In both files the apparent second occurrence is an
HTML _comment_ naming the script, not a `<script>` tag. Each loads exactly once.
Recorded here so it is not rediscovered and "fixed".

---

## Recommended order

1. **A1** — canonical URLs. Harm accrues daily; unrelated to everything else.
2. **L1** — the info bar. One rule, 41 pages.
3. **P1** — drop the `sw.js:20` precache line, pending the i18n decision.
4. **Touch: the hotline bar** — the only AA breach, on the most safety-critical
   control on the site.
5. **`.skip-link` contrast** — 41 routes, but _diagnose before fixing_: confirm
   whether it is genuinely visible or an axe artifact of the hiding technique.
6. **L2** — the ordinance table, the only overflow reaching 393px.
7. **The two `aria-required-children` criticals** — `budget/`,
   `services/education`. Two routes, real screen-reader impact.
8. **Light-theme contrast**, working down from the shared components. This is
   the largest body of work in the report and the one most likely to need
   design input rather than a mechanical fix.
9. **L3–L7** — remaining overflow, all 320px-only.
10. **A2–A6, touch AAA gaps, remaining axe serious rules** — hygiene and polish.

Items 1–7 are mechanical and can be done immediately. Item 8 is a palette
decision, not a bug fix, and should probably be its own piece of work.

Deliberately excluded: consolidating the 18 breakpoint values and extracting the
40 inline `<style>` media queries. Both are recorded in
[ADR 0001](../adr/0001-breakpoint-scale.md), and both are unsafe to attempt
without the visual regression coverage this repo does not yet have.

---

## Remediation

### Layout — all 44 overflow failures cleared

| Fix                                                                        | Where                 | Effect              |
| -------------------------------------------------------------------------- | --------------------- | ------------------- |
| `flex-wrap: wrap` + `min-width: 0` on `.info-bar-datetime`                 | `style.css`           | 37 routes           |
| Mobile card layout extended from `.resolution-table` to `.ordinance-table` | `style.css`           | ordinance-framework |
| `overflow-wrap: break-word` on `.hero-title-v3`                            | `index.html` inline   | homepage            |
| `minmax(0, 1fr)` + `min-width: 0` on the contact and leadership grids      | `style.css`           | homepage            |
| `minmax(0, 1fr)` + `min-width: 0` on `.distribution-layout`                | `statistics.css`      | statistics          |
| `minmax(0, 1fr)` + `min-width: 0` on `.dpwh-charts-grid`                   | `transparency-v2.css` | budget              |
| `canvas { max-width: 100% }`                                               | `statistics.css`      | statistics          |

Two things worth recording because they contradict what this report first
assumed:

**The ordinance table already had a mobile card layout — it just wasn't
addressed by it.** The rules naming `.resolution-table` were never extended to
`.ordinance-table`, while the `overflow-x: visible` override that accompanies
them applied to _all_ wrappers. So the ordinance table lost its scroll container
without gaining the card layout. Extending the selectors was the fix; adding a
scroll container would have masked it.

**The statistics and budget grids did have mobile collapses**, later in their
stylesheets, using a bare `1fr`. A first attempt added _new_ collapse rules
earlier in the file, which the existing later rules silently overrode. The
working fix was to change the existing rules, not add new ones.

`h1.hero-title-v3` deserves special mention: its **text**, not any element,
overflowed the box. The harness could not name it, because a text run is not an
element. It was found by walking the `scrollWidth`/`clientWidth` chain down from
`<html>`. The offending token was "BetterLegazpi.org" — one character longer
than the "BetterSolano.org" it replaced.

### Touch targets

- `.hotline-number` on `offline.html` — 22×21 → 44px. The only AA breach, and it
  was the emergency numbers on the page shown when the visitor has no
  connection.
- `.retry-btn` and the offline page's theme toggle — brought to 44px. That page
  loads no shared stylesheet, so its controls were falling back to browser
  defaults.
- `.theme-toggle-btn` — 36×36 → 44×44 across all 43 routes.
- `.skip-link` — 42px → 44px.

Still below the 44px guideline, all clearing the 24×24 AA floor:
`a.hotline-item` (25px, 41 routes), `button.mobile-menu-toggle` (41px, 41
routes), `a.footer-social-btn` (40px), `button.service-tab` (32px). The hotline
bar is the notable one — it is a thin scrolling ticker, and taking its items to
44px makes the bar materially taller on every page. That is a design decision,
not a defect fix, so it is left open.

### Accessibility

**`.skip-link` was a real failure, not the axe artifact this report suspected.**
Its colours were white on `#ff0000` — 4.0:1, below the 4.5:1 AA floor. And it
was never properly hidden: `top: -40px` on a box ~42px tall left ~2px of red
visible on every page, which is exactly why axe evaluated it. Fixed by hiding it
with `transform: translateY(-100%)` (exact at any height) and using the dark
brand blue (~11:1).

The background is deliberately hard-coded rather than `var(--color-primary)`:
dark mode redefines that token to `#4f8eff`, and white on `#4f8eff` is ~2.6:1 —
_worse_ than the red. Because the link is only visible while focused, axe cannot
catch that regression, so the token dependency was removed entirely.

Both `aria-required-children` criticals fixed:

- `budget/` — a redundant `role="table"` on a real `<table>` opted it into
  strict ARIA child validation, which the sort buttons in its header cells then
  violated. Removing the redundant role restores the identical implicit
  semantics without the violation.
- `services/education` — `role="tablist"` on a set of plain filter buttons that
  are not tabs and do not switch panels. Changed to `role="group"`, with
  `aria-pressed` added (and maintained in `main.js`) so the selected filter is
  no longer conveyed by colour alone.

**Dark theme is now the worse theme**, reversing this report's original finding:
light-theme contrast failures fell from 43 routes to 12, while dark stayed at 30. The original measurement was correct, but the skip-link — present on 41
routes — dominated the light-theme count. With it fixed, dark's own palette is
the larger remaining problem.

### Not fixed

- **Contrast, 30 routes dark / 12 light.** The largest remaining body of work,
  and a palette decision rather than a bug fix.
- `link-in-text-block` (3 routes), `nested-interactive` (2),
  `scrollable-region-focusable` (1), `label` on `admin/news-editor` (1, never
  ships).
- Touch targets between 24px and 44px, per the design question above.
- P1, P2, P3 and appendix items A2–A7 are covered in the rebranding work, except
  A6 (the logo), left in place deliberately.

### A caution about the verification

The full 430-check layout run reports 429 passed / 1 failed under 4 parallel
workers, with the failing case showing a closed-browser error rather than an
overflow measurement. Re-running the affected routes serially passes 140/140.
Treat isolated single failures in a parallel run as suspect before treating them
as defects.
