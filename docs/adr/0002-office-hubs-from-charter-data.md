# ADR 0002: Office hubs are generated at build time from charter data

**Status:** Accepted
**Date:** 2026-08-27

## Context

The ten `service-details/*-services.html` office hubs are hand-written HTML. Each carries
its charter content as literal markup and 151–964 lines of page-local `<style>` — 3,865
lines in total across the ten, against a shared `assets/css/service-hub.css` of 672.

The consequences are the ones duplication always produces. The same service is described
in different field orders on different pages; `Division:` on one page is `Office or
Division:` on another because that is what each PDF happened to say; a fee renders as
`None` here and blank there. There is no way to ask "which services are free" or "which
office is slowest" without reading ten files. And when the LGU republishes a charter,
the change has to be found and applied by hand in prose.

The upstream source is unusually good: the LGU publishes a Citizen's Charter per office
in the ARTA-mandated format, so every service already has a fixed field set — office or
division, classification, transaction type, who may avail, a checklist of requirements
paired with where to secure each, a process table of client steps against agency actions
with fees, processing time and person responsible, and a total. That structure is the
schema; the pages just aren't using it.

Seven of the ten charters extract cleanly with `pdftotext -layout`. Two (CPDO, BPLO) have
rasterized page bodies and must be transcribed from page images. Extraction is imperfect
even in the clean cases — table rows drift across page breaks, `TOTAL:` rows land
mid-table, and a single fee cell can hold a tiered schedule — so no extraction can be
trusted without review.

The rest of the site renders `data/*.json` client-side (`officials.js`, `news.js`, …).
That convention is a poor fit here: charter pages are the highest-intent civic content on
the site — what someone opens when they need a document and want to know what to bring —
and client-side rendering means search engines index an empty container and a script
failure yields a blank page where a fee schedule should be.

## Decision

**1. Charter content lives in `data/offices/<slug>.json`, in two tiers.**

`charter` holds fields derived from the PDF and is regenerable. `local` holds
hand-maintained material the charter does not cover — office personnel, contact details,
curated navigation, icons. They are separate top-level keys so re-deriving a charter can
never silently overwrite hand-written work.

**2. The hubs are generated at build time, not fetched at runtime.**

`build.sh` renders each office JSON into complete static HTML before `dist/` is
assembled. The shipped page needs no fetch and no JavaScript to display a charter. This
departs from the site's client-side-JSON convention deliberately, for the SEO and
resilience reasons above; it also means no `tests/pages.overrides.js` `waitForSelector`
entry is needed, because there is no asynchronous render to wait for.

**3. Values are stored verbatim and normalized at render.**

The JSON records what the charter says, character for character. A single renderer
normalizes for display: an absent fee becomes an em dash on a step and "Free" in the
summary; durations get consistent phrasing; person-responsible titles render in CSC
abbreviated form (`Administrative Aide III` → `Admin. Aide III`), since the Office
Personnel section carries full titles. Because the raw value is retained, a normalization
rule can be changed without re-deriving anything.

Fees additionally carry an optional structured `feeTiers[]` for cells that decompose
cleanly. `feeText` is always what renders. `feeTiers` exists only for querying — a
"free services" filter, a fee comparison — and is never displayed, so an extraction error
there cannot put a wrong peso figure on the page.

**3a. A service's total is derived from its steps, never transcribed.**

Several charters omit the `TOTAL:` row entirely, and where it is present it is sometimes
wrong. So the total is computed by `scripts/build/charter-duration.js` by summing the
steps, and the charter's own figure is kept alongside as `statedTotals` purely for
comparison. Where the two disagree, the derived value is what ships and the validator
raises a warning naming the gap.

The arithmetic has one rule worth stating: **minutes roll up into hours at sixty, and
hours never roll up into days.** A charter "day" is a working day of unstated length, so
24 hours and 1 day are not the same quantity. This is not a guess — HRMO's own published
total for Recruitment, Selection and Placement (29 days, 3 hrs. & 20 minutes) reconciles
exactly against its ten steps under this rule and no other, and that reconciliation is
pinned as a regression test.

**4. Every service carries `verified`, and an unverified service fails the build.**

A service is `verified: false` until a person has checked it against the source PDF. The
production build refuses to render an office with any unverified service. Offices
therefore go live one at a time, fully checked, rather than all at once and partly wrong.

`npm run dev` renders unverified services behind a visible draft marker so work is
previewable; only the production path is strict.

**4a. The page reframes the charter rather than reproducing it.**

A faithful transcription is a worse PDF. The charter reports elapsed processing
time because that is what ARTA measures, so HRMO's Recruitment service is published
as "29 days, 3 hrs. & 20 minutes" when the applicant stands at the counter for ten
minutes and the office spends the rest working without them.

`scripts/build/charter-facts.js` derives what a citizen actually needs before
setting out, all of it computed from steps already verified: time at the counter
versus elapsed total, number of separate trips, whether they walk out with the
result, window numbers lifted out of step prose, and a document count. Counter time
is given the visual weight; elapsed time stays secondary.

**4b. JavaScript is progressive enhancement only.**

The requirements checklist and the service search need script, which decision 2
otherwise avoids. They are additive: every service, step, fee and requirement is in
the static HTML, the checkboxes are real inputs, and the search box ships `hidden`
and is revealed only once `assets/js/office-hub.js` runs, so a search field that
does nothing is never shown. Checklist ticks are stored in `localStorage` behind
try/catch, since it throws in private-mode Safari and wherever site data is blocked.
If the script fails to load, the page loses two conveniences and no content.

**5. Navigation has three independent layers.**

- `charter.charterGroup` — the charter's own grouping (`External Services`,
  `PROCUREMENT SERVICES`). SSOT, never edited.
- `local.categories` — citizen-facing categories and sub-categories, at most two levels
  deep. Proposed with AI assistance, reviewed by a person, then committed as an explicit
  list of service ids. Regenerated only on request, never on build: navigation that
  reshuffles between deploys breaks bookmarks and deep links for no visible reason.
  Every service must appear in exactly one category; orphans and duplicates fail the
  build.
- `local.entryPoints` — optional goal-oriented indexes that deep-link into services, as
  a `grid` (CEO's permit types) or a `rail` (CTO's citizen journeys). Purely additive,
  and free to point at any service regardless of its category.

**6. Standardized hubs ship no page-local `<style>`.**

All ten pages' local CSS folds into `service-hub.css`. Per-office customization is
expressed as data — icon names from the already-loaded Bootstrap Icons set, accent
selection — not as bespoke rules. A hub that still needs its own CSS is evidence the
template is missing a feature.

## Consequences

Adding or correcting a service becomes a JSON edit, and standardization is a property of
the renderer rather than a thing to be re-applied by hand. A charter refresh is
`node scripts/data/fetch-charters.js`, a diff, and re-verification of what changed —
`--check` reports upstream drift by sha256 without writing.

The costs are real. The build gains a generation step, so a stale `dist/` serves stale
charters. A single unverified service blocks its whole office from shipping. The
verification burden is front-loaded: roughly 150 services across ten offices, each needing
a human read against the PDF, and the two image-only charters need transcription first.
The `dataviz`-style query benefits of `feeTiers` are speculative and may never be built.

The charter PDFs themselves (19 MB) are not committed. `docs/sources/citizens-charter/*.md`
holds the transcripts with a `source_sha256` pinning each one, and the fetch script
re-downloads on demand.

## Alternatives considered

**Standardize the existing HTML by hand first, template later.** This was the original
plan. It pays for standardization twice — once in prose across ten large files, then
again when those files are replaced by the template — and the second pass is the one that
has to be right.

**Client-side rendering, matching the rest of the site.** Consistent, and it needs no
build step, but it puts the site's most important content behind a fetch. Rejected on
indexability and failure mode.

**Model the process table as two parallel lists** — client steps and agency actions,
unpaired — which extracts far more reliably, since the pairing is what the extractor gets
wrong. Rejected because the pairing is information a citizen actually uses: which of my
actions triggers which office response, and what it costs. Retained as the fallback if
verification proves unsustainable.
