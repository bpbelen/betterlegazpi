# Context

Shared vocabulary for BetterLegazpi.org. Glossary only — no implementation
detail, no specs, no task notes. See `docs/agents/domain.md` for how this file
is maintained and `docs/adr/` for recorded decisions.

## The site

**BetterLegazpi.org** — a civic-tech portal for LGU Legazpi City. Forked from
**BetterSolano.org**, a sibling project for LGU Solano, Nueva Vizcaya. The fork
is incomplete: Solano-era strings survive in places, and an occurrence of
"Solano" may be either a genuine leftover or a deliberate upstream reference.
Neither can be assumed.

**Route** — one navigable page. Every route is a real `.html` file on disk;
there is no templating layer or router. Consequently header, nav, and footer
markup is duplicated into every page rather than shared.

**Clean URL** — a route addressed without its `.html` extension
(`/services/certificates`). Not a property of the files; produced at request
time by two independent implementations that must agree: `serve.py` locally and
`.htaccess` in production. A plain static file server has neither, so a clean
URL resolves only where one of those two is in front of it.

## Content

**Service** — one thing a constituent can obtain from the city (a certificate, a
permit, a clearance). The catalogue lives in `data/services.json`; each entry
names the page that documents it.

**Category** — a grouping of services, one per page under `services/`
(agriculture, business, certificates, …).

**Office** — a city department that delivers services (City Civil Registrar's
Office, Business Permits & Licensing Office). Documented under
`service-details/`. Note the asymmetry: a category page groups services _by
subject_, an office page groups them _by who provides them_, and one office
commonly appears across several categories.

## Layout generations

The site is mid-refactor and three visual generations coexist. This is the most
common source of confusion when reading the codebase, so the distinction is
named rather than left implicit.

**Old tier** — the `services/` category pages. `page-header` hero, then
`office-card` and `service-item-card` grids. Almost no inline CSS.

**New tier A** — most `service-details/` pages. An accordion built from
`sub-service-*` classes that appears nowhere else on the site.

**New tier B** — `ceo-services`, `cpdo-services`, `gso-services`. An earlier
draft of the new pattern using `category-card` and `service-tabs` instead of the
accordion, never brought forward.

Both new tiers carry large page-local `<style>` blocks, which is what
distinguishes them structurally from the old tier.

## Presentation

**Theme** — light or dark, selected by a `data-theme` attribute on the root
element and persisted per visitor. The system preference is consulted only as a
fallback when the visitor has expressed no choice. Dark is a full colour
re-specification, not a filter.

**Breakpoint** — a viewport width at which layout rules change. The canonical
set is defined in [ADR 0001](docs/adr/0001-breakpoint-scale.md); values outside
it exist in older rules and are legacy.

## Verification

**Audit tier** — a harness run covering every route at every viewport. A
one-time measurement, run locally; too large for CI.

**CI tier** — the same harness over one route per layout generation and per
page-specific stylesheet, at five viewports. The regression gate. Its premise is
that on a site with no templating, shared CSS is where cross-cutting risk lives,
so sampling routes is adequate where sampling stylesheets would not be.
