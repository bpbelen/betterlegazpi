# ADR 0001: A canonical breakpoint scale, applied incrementally

**Status:** Accepted
**Date:** 2026-08-25

## Context

Responsive rules in this repo use **18 distinct breakpoint values** across 22,035 lines of CSS:

| Value  | Uses | Value        | Uses   |
| ------ | ---- | ------------ | ------ |
| 768px  | 21   | 576px        | 3      |
| 575px  | 20   | 1200px       | 3      |
| 991px  | 12   | 1199px       | 2      |
| 767px  | 9    | 1100px       | 2      |
| 992px  | 8    | 1025px       | 2      |
| 480px  | 8    | 993px        | 1      |
| 1024px | 8    | 960px        | 1      |
| 640px  | 4    | 840px        | 1      |
|        |      | 560px, 500px | 1 each |

The values cluster into near-duplicate pairs — 575/576, 767/768/769, 991/992/993, 1024/1025 — because two conventions are in use simultaneously: the Bootstrap `-1px` family (575/767/991/1199) and the round family (576/768/992/1200). `style.css` alone contains 11 uses of `575px` and 3 of `576px`, 7 of `767px` and 14 of `768px`.

Where a pair straddles the same boundary, a one-pixel band exists where both rules apply or neither does. That is the mechanism behind layout that "only breaks on iPad" — the bug is invisible at every viewport a developer normally checks.

The rules are also scattered: `responsive.css` owns only 6 of roughly 90 media queries despite its name, ~84 live in `style.css` and the feature stylesheets, and a further 40 are inline in `<style>` blocks on 15 HTML pages — including 4 inside the 1,442-line block in `service-details/cto-services.html`.

## Decision

Adopt five canonical breakpoint values:

| Name | Value  | Boundary                            |
| ---- | ------ | ----------------------------------- |
| xs   | 480px  | small phone                         |
| sm   | 576px  | large phone / landscape             |
| md   | 768px  | tablet portrait                     |
| lg   | 1024px | tablet landscape, iPad Pro portrait |
| xl   | 1200px | desktop container max               |

Convention: `min-width` queries use the value unchanged; `max-width` queries subtract `0.02px` (`@media (max-width: 767.98px)`). This removes the overlap gaps by construction — no value is ever both a `max-width` and a `min-width` boundary.

**These stay as literals, not CSS custom properties.** Custom properties are not valid in media query conditions — `@media (max-width: var(--bp-md))` does not work in any browser. Genuine breakpoint tokens would require a preprocessor or a PostCSS `@custom-media` step, which means adding a build dependency to a site that deliberately ships hand-written CSS. The canonical list is documented in the `:root` comment block in `assets/css/style.css` and enforced by review, not by tooling.

**The existing 18 values are not migrated in a single pass.** New and modified rules use the canonical five; existing rules are converted opportunistically when the surrounding code is touched for another reason.

`1024px` is retained deliberately. It was chosen over `991px` to capture iPad Pro portrait and iPad Air landscape, and that reasoning still holds.

## Rationale

A mass rewrite is the obvious alternative and was rejected. Consolidating ~130 media queries across 8 stylesheets and 15 inline blocks would touch nearly every visual rule on the site, and **there is no visual regression coverage to catch what it breaks** — no screenshot comparison exists anywhere in the repo. The Playwright harness added alongside this ADR asserts geometry (overflow, touch targets) but cannot see that a card turned the wrong colour or a section lost its spacing.

The sequencing is therefore: canonical values first, screenshot coverage second, migration third. Committing to the scale now stops the sprawl growing while the safety net is built.

Five values rather than the four of a Bootstrap-style scale, because `480px` (8 uses) and `1024px` (8 uses) both carry real, distinct intent here that a four-step scale would erase.

## Consequences

- New CSS has one correct answer for each boundary; review has an objective standard to apply.
- The near-duplicate clusters stop growing, but do not disappear — the codebase will hold a mix of canonical and legacy values for some time. This is accepted, and is why the scale is documented rather than assumed.
- The one-pixel overlap bands remain in unconverted rules and remain a live source of viewport-specific bugs until those rules are touched.
- Adding a preprocessor later would let the literals become real tokens. That decision is deliberately deferred; it trades the site's zero-build-step CSS for type-safety the review process currently provides adequately.
- The 40 inline `<style>` media queries are the weakest link: they are invisible to anyone reading `assets/css/`. Extracting them is a prerequisite for the eventual migration and should be its own change.
