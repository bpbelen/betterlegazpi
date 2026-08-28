# User journeys — draft for review

Draft copy for the journey sections on the service category pages. This file is the
review surface: argue with the wording and the step order here, before any of it
becomes markup. Once approved it becomes `data/journeys.json`.

**Phase 1 covers Infrastructure only.** The remaining eight categories are drafted
in one batch after the Infrastructure pilot page is approved.

---

## What a journey is here

A journey is a **life event**, not a service. It answers "I want to do X, what do I
actually have to do and in what order" — a question no single citizen's charter can
answer, because charters are organised by office.

Rules agreed for this work:

- **Every step is a real charter service** and deep-links to its anchor in the office
  hub (e.g. `service-details/ceo-services.html#ceo-building-permit`).
- **No steps outside the city's charters.** A real house build also involves the
  barangay, a licensed professional and possibly HLURB — those are deliberately
  absent, because the site can only vouch for what it holds a charter for.
- **Fees and processing times are read from the charter data at render time**, never
  typed by hand. See the derivation rule below.
- Journeys may span offices or sequence services **within** one office.
- Each journey has exactly one owning category; other categories show a referral card.

---

## Derivation rule for fee and time badges

Reading these fields naively produces false statements, so the rule is worth
stating explicitly and reviewing.

**Fee.** Every non-payment step in a charter records `feeText: "None"`. Rendering
that as "Free" would put "Fee: None" on a building permit, which is plainly wrong.
So: take the first step whose `feeText` is anything other than `"None"`.

| What the data says                    | What the page shows             |
| ------------------------------------- | ------------------------------- |
| No step has a charged fee             | `Free`                          |
| `"Based on the order of payment"`     | `Fee on assessment`             |
| A specific amount                     | The amount, e.g. `₱350 per day` |
| A fee defined by ordinance, no amount | `Fee set by ordinance`          |

**Time.** Use `statedTotals.processingTime` when the charter states one. **13 of
CEO's 30 services do not state a total** — including the building permit and the
certificate of occupancy. For those the page shows `Processing time not stated in
the charter` rather than summing the individual steps, because a sum would be a
number the city never published.

> **Reviewer check:** this is the rule I'd most like challenged. The alternative is
> to show a computed sum with a "calculated, not official" note. I judged that a
> fabricated total on a building permit is worse than an honest gap, but it is a
> judgement call and it makes the flagship journey's headline step vaguer than the
> others.

---

## Infrastructure — 3 journeys

Offices: **CEO** (City Engineer's Office, 30 services) and **CPDO** (City Planning
and Development Office, 17 services).

---

### Journey 1 — "I'm building a house"

**Owning category:** Infrastructure
**Steps:** 5 · **Offices:** CPDO → CEO

The flagship. Someone building a home has to visit two offices in a specific order,
and getting it wrong means being turned away — the building permit cannot be filed
without the locational clearance, and the locational clearance depends on what the
lot is zoned for.

| #   | Step                                                                                                                               | Office | Fee                  | Time                  | Anchor                           |
| --- | ---------------------------------------------------------------------------------------------------------------------------------- | ------ | -------------------- | --------------------- | -------------------------------- |
| 1   | **Check what your lot is zoned for** — a site zoning or land use certification tells you whether a house is allowed there at all   | CPDO   | Fee set by ordinance | 1 day max             | `cpdo-site-zoning-certification` |
| 2   | **Get locational clearance for the building permit** — CPDO confirms the plan fits the zoning before the engineers will look at it | CPDO   | Fee set by ordinance | 1 day max             | `cpdo-lc-building-permit`        |
| 3   | **Apply for the building permit** — 16 documentary requirements; this is the long one                                              | CEO    | Fee on assessment    | Not stated in charter | `ceo-building-permit`            |
| 4   | **Apply for the electrical permit** — filed alongside the building permit, not after it                                            | CEO    | Fee on assessment    | Not stated in charter | `ceo-electrical-permit`          |
| 5   | **Get the certificate of occupancy** — once built. You are not legally allowed to occupy the building without it                   | CEO    | Fee on assessment    | Not stated in charter | `ceo-certificate-occupancy`      |

**Copy for the page intro:** "Two offices, in this order. The building permit can't
be filed until City Planning has cleared the location, and the location can't be
cleared until you know how the lot is zoned."

> **Reviewer checks:**
>
> 1. Is step 4 (electrical permit) genuinely concurrent with step 3, or does it
>    follow? The charter doesn't say. I've written it as concurrent based on the
>    shared Window B intake, but a local reader will know better than the document.
> 2. Should the mechanical permit be a step? I left it out because it only applies
>    to buildings with mechanical systems, and a five-step journey with two
>    conditional steps starts to read like a form rather than a path.

---

### Journey 2 — "I'm subdividing or developing land"

**Owning category:** Infrastructure
**Steps:** 3 · **Offices:** CPDO

Distinct from journey 1 in audience and timescale — this is a landowner or developer,
and the waits are measured in weeks, not days. Worth separating precisely because
someone who has only done journey 1 will assume this is similarly quick.

| #   | Step                                                                                                                            | Office | Fee                                                                                                                      | Time                | Anchor                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------ | ------------------- | -------------------------------- |
| 1   | **Confirm the current land use** — what the land is zoned for today                                                             | CPDO   | Fee set by ordinance                                                                                                     | 1 day max           | `cpdo-site-zoning-certification` |
| 2   | **Reclassify the land, if it isn't zoned for what you plan** — the step people don't expect, and the one that sets the timeline | CPDO   | Fee set by ordinance                                                                                                     | 33 working days max | `cpdo-land-use-reclassification` |
| 3   | **Apply for preliminary approval and locational clearance (PALC)** — the subdivision approval itself                            | CPDO   | ₱360/hectare (PD 957) · ₱90/hectare (BP 220 socialized) · ₱216/hectare (BP 220 economic), plus ₱1,500/hectare inspection | 33 days max         | `cpdo-palc`                      |

**Copy for the page intro:** "All at City Planning, but budget for two months if the
land needs reclassifying first."

> **Reviewer check:** step 2 is conditional — most subdivisions on already-residential
> land skip it. Should the journey show it as an "only if" step, or should there be
> two separate journeys? I've kept one journey with the condition in the step text,
> because the whole value here is warning people the 33-day step exists.

---

### Journey 3 — "I'm holding an event on a public road"

**Owning category:** Infrastructure
**Steps:** 3 · **Offices:** CEO

A fiesta procession, motorcade, recorrida or fun run. Chosen because it is the one
Infrastructure journey with **specific peso amounts** in the charter, so it will
render very differently from the two permit journeys above — useful for testing the
fee badge with real numbers rather than "on assessment".

| #   | Step                                                                                                               | Office | Fee                                                                     | Time                     | Anchor                 |
| --- | ------------------------------------------------------------------------------------------------------------------ | ------ | ----------------------------------------------------------------------- | ------------------------ | ---------------------- |
| 1   | **Get the road use permit** — to close or use a city road for the activity                                         | CEO    | ₱350 per day of the activity                                            | 1 hour 55 minutes        | `ceo-road-use-permit`  |
| 2   | **Get a permit for your banners and tarpaulins** — separate from the road permit, and charged by size and duration | CEO    | ₱24 per sq.m. per week per piece, plus a dismantling charge             | 1 day, 1 hour 5 minutes  | `ceo-banner-permit`    |
| 3   | **Get a truck ban exemption, if you're bringing floats or heavy vehicles through**                                 | CEO    | ₱750 (under 4,500kg) · ₱1,000 (4,500–12,000kg) · ₱1,250 (over 12,000kg) | 1 day, 1 hour 10 minutes | `ceo-truck-ban-permit` |

**Copy for the page intro:** "Three separate permits, all at the City Engineer's
Office. The banners are charged separately from the road."

> **Reviewer check:** is the truck ban exemption a real part of this journey, or am
> I reaching to make it three steps? It applies to floats and delivery vehicles for
> large events. If it feels forced, this becomes a two-step journey and that's fine.

---

## Referral cards on the Infrastructure page

Journeys owned elsewhere that touch CPDO or CEO. Rendered as compact cards, not full
journeys.

| Journey                                   | Owned by         | Why it appears here                                                                              |
| ----------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------ |
| "I'm opening a business"                  | Business & Trade | Its first step is CPDO's locational clearance for a new business permit (`cpdo-lc-new-business`) |
| "My business needs its annual inspection" | Business & Trade | CEO issues the certificate of annual inspection                                                  |

Both are placeholders until the Business journeys are drafted in the next batch —
listed here so the pilot page renders a real referral card rather than a stub.

---

## What I could not include, and why

Honest gaps, so the review isn't reading around them:

- **No barangay steps.** Almost every real construction journey starts with a
  barangay clearance. There is no barangay charter in `data/offices/`, so under the
  charter-only rule it cannot be a step. This is the single biggest omission and it
  affects all three journeys.
- **No fee totals.** Not one of these journeys can tell you what the whole thing
  costs, because three of the five steps in the flagship are "on assessment".
- **The building permit's 16 requirements are not shown** in the journey. They live
  on the hub, one click away. Surfacing them would turn the journey into the charter
  it is meant to summarise.
