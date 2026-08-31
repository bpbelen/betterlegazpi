# BetterLegazpi.org

A civic-tech initiative providing transparent access to city services, programs, and public funds of LGU Legazpi City, Albay, Philippines.

![Version](https://img.shields.io/badge/version-1.2.0-green)
![License](https://img.shields.io/badge/license-MIT%20%7C%20CC%20BY%204.0-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)

This project began as a fork of [BetterSolano.org](https://github.com/BetterSolano/bettersolano), a civic-tech site built for LGU Solano, Nueva Vizcaya, retrofitted for Legazpi City.

## About

BetterLegazpi.org is a volunteer-driven, open-source project that empowers the people of Legazpi City with easy access to local government information. The platform aggregates public data from official government portals and presents it in a user-friendly, accessible format.

**Cost to the People of Legazpi = ₱0**

Visit the live website: [https://betterlegazpi.org](https://betterlegazpi.org)

Follow updates on Facebook: [facebook.com/betterlegazpi](https://www.facebook.com/betterlegazpi)

## Open Source for LGUs

This repository is open source under the **MIT License** and **CC BY 4.0** and is freely available for use, modification, redistribution, and publication by any individual or organization that wishes to implement it in their respective local government unit (LGU) across the Philippines.

We encourage adoption by other municipalities in support of:

- **Transparency** — Making government information accessible to citizens
- **Accessibility** — Ensuring services are available to all, including persons with disabilities
- **Modernization** — Bringing local government services to digital platforms
- **Public Service** — Improving the delivery of government services to the community

To adapt this project for your LGU, fork the repository and customize the content, styling, and data sources to match your municipality's requirements.

---

## How this repository is organized

Every folder answers one question. If you are looking for something, find the question that matches and open that folder.

### The website itself

Each folder below is one section of the site, and its name is the web address. `travel/` becomes `betterlegazpi.org/travel`. Every page is a plain HTML file you can open in a browser — there is no framework or build step required to view one.

| Folder                                                                   | What it holds                                                                |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- |
| `index.html`                                                             | The homepage                                                                 |
| [services/](services/)                                                   | The 12 service categories — health, business, certificates, taxes, and so on |
| [service-details/](service-details/)                                     | One page per city office or programme, with steps, fees, and requirements    |
| [travel/](travel/)                                                       | Attractions, landmarks, food, accommodations, and things to do               |
| [government/](government/)                                               | Elected officials and department heads                                       |
| [policies/](policies/)                                                   | Ordinances and resolutions                                                   |
| [transparency/](transparency/)                                           | Public funds — income, spending, and infrastructure projects                 |
| [statistics/](statistics/)                                               | Population, economy, and barangay data                                       |
| [news/](news/)                                                           | Announcements and updates                                                    |
| [history/](history/)                                                     | The history of Legazpi City                                                  |
| [about/](about/), [contact/](contact/), [faq/](faq/)                     | Who runs this, how to reach the city, and common questions                   |
| [sitemap/](sitemap/)                                                     | A human-readable index of every page                                         |
| [accessibility/](accessibility/), [terms/](terms/), [privacy/](privacy/) | The site's legal and accessibility statements                                |
| `403.html`, `404.html`, `500.html`, `offline.html`                       | Shown when a page is missing, blocked, or the visitor is offline             |

**The rule for `services/` vs `service-details/`:** `services/` holds only the categories a visitor can reach from the main menu. Anything about a single office or a single programme belongs in `service-details/`.

### The content

| Folder             | What it holds                                                                                                                                                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [data/](data/)     | **The city's information, as editable files.** Officials, services, news, budget figures, tourism spots. Pages read these and draw themselves — so this is where you change what the site _says_. |
| [assets/](assets/) | The site's appearance and behaviour: `css/` for styling, `js/` for interactivity, `images/` for photos and logos                                                                                  |

### The workshop

Nothing in this group is published to the live site.

| Folder                                 | What it holds                                                                                                                                        |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| [docs/](docs/)                         | Written documentation — decisions, workflows, audits, and the source research in `docs/sources/`                                                     |
| [scripts/build/](scripts/build/)       | Used every time the site is built. Don't move these without reading the notes in [CLAUDE.md](CLAUDE.md)                                              |
| [scripts/data/](scripts/data/)         | Occasional jobs that regenerate files in `data/` or fetch photos                                                                                     |
| [scripts/validate/](scripts/validate/) | Checkers you run by hand to confirm nothing is broken                                                                                                |
| [tests/](tests/)                       | Automated checks that the site works on phones, tablets, and desktops                                                                                |
| [admin/](admin/)                       | A standalone news editor for maintainers                                                                                                             |
| `scratch/`                             | Throwaway exploration kept as a record. Safe to ignore, but **not** safe to delete wholesale — `scratch/geo/*.json` is a cache two data scripts read |
| `dist/`                                | The finished, compressed site, produced by `npm run build`. Never edited by hand                                                                     |

### Configuration in the root folder

| File                            | Purpose                                                                                                             |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `package.json`                  | Project dependencies and the `npm run` commands                                                                     |
| `build.sh`                      | The build process, start to finish                                                                                  |
| `serve.py`                      | The local preview server                                                                                            |
| `.htaccess`                     | Live-server settings: clean URLs, security headers, compression                                                     |
| `sw.js`, `manifest.webmanifest` | What makes the site installable and usable offline                                                                  |
| `version.json`                  | The single source of truth for the version number                                                                   |
| `sitemap.xml`, `robots.txt`     | What search engines are told about the site. `sitemap.xml` is generated — run `npm run sitemap`, don't hand-edit it |
| `CLAUDE.md`, `CONTEXT.md`       | Notes for contributors and AI assistants working in this repository                                                 |

---

## Changing what the site says

Most content lives in [data/](data/) as JSON files, not inside the HTML pages. Edit the data file and every page that uses it updates on its own.

| To change…                            | Edit…                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| Officials and department heads        | `data/officials.json`                                                                 |
| A service's steps, fees, or documents | `data/services.json`, and the matching page in `service-details/`                     |
| News and announcements                | `data/news.json` (or use the editor in `admin/`)                                      |
| Budget and spending figures           | `data/fiscal-transparency.json`, `data/dpwh-projects.json`                            |
| Barangay data                         | `data/barangays.json`                                                                 |
| Health facilities                     | `data/health-facilities.json`                                                         |
| Tourism listings                      | `data/tourism-attractions.json`, `-food`, `-experience`, `-accommodations`, `-travel` |
| Ordinances and resolutions            | `data/ordinances.json`, `data/resolutions.json`                                       |

> Menus, headers, and footers are the exception — there is no template system, so that markup is repeated in every page. Changing the menu means a find-and-replace across all HTML files.

## Quick Start

```bash
git clone https://github.com/bpbelen/betterlegazpi.git
cd betterlegazpi
npm install
npm run dev          # http://localhost:8000
```

### Prerequisites

| Requirement | Version | Purpose                            |
| ----------- | ------- | ---------------------------------- |
| Node.js     | v16+    | Build tools and package management |
| npm         | v8+     | Dependency management              |
| Python 3    | v3.x    | Local development server           |
| Git         | Latest  | Version control                    |

`npm run dev` calls `python`. If only `python3` is on your PATH, run `python3 serve.py -p 8000 -d .` directly.

## Commands

| Command                                       | Description                                                           |
| --------------------------------------------- | --------------------------------------------------------------------- |
| `npm run dev`                                 | Start the local development server (port 8000, clean URLs)            |
| `npm run build`                               | Build minified production files to `dist/` (auto-bumps patch version) |
| `npm run build -- --no-bump`                  | Build without incrementing the version number                         |
| `npm run build:minor` / `:major`              | Bump minor/major version and build                                    |
| `npm run serve:dist`                          | Serve the production build (port 8080)                                |
| `npm run version:check`                       | Display the current version                                           |
| `npm run version:patch` / `:minor` / `:major` | Bump the given version part only, no build                            |
| `npm run sitemap`                             | Regenerate `sitemap.xml` from the pages on disk                       |
| `npm run sitemap:check`                       | Fail if `sitemap.xml` has drifted from the pages on disk              |
| `npm test`                                    | Run the full Playwright suite                                         |
| `npm run test:unit`                           | Run the Node unit tests for the build and validate scripts            |
| `npm run test:chrome`                         | Run the suite in Chrome only                                          |
| `npm run test:report`                         | Open the last HTML test report                                        |
| `npm run lighthouse`                          | Run Lighthouse CI (mobile config)                                     |
| `npm run format`                              | Format all files with Prettier — **see the Windows warning below**    |
| `npm run format:check`                        | Check formatting without writing changes                              |

There is no `build:patch` — plain `npm run build` _is_ the patch bump.

> **Windows contributors: do not run `npm run format`.** Prettier is configured for LF line endings while git writes CRLF on Windows, so every file fails the check on line endings alone and a tree-wide format would rewrite the entire repository. Format only the files you touched: `npx prettier --write path/to/file`.

## Testing

The test suite checks the whole site, not just one feature:

- `site-responsive.spec.js` — layout and touch-target sizes across ten viewports
- `site-a11y.spec.js` — accessibility, via axe-core
- `volunteer-modal.*.spec.js` — the volunteer sign-up dialog

```bash
npm test                                                              # everything
npx playwright test tests/site-responsive.spec.js --project=mobile-chrome   # one spec
npx playwright test tests/site-a11y.spec.js -g "some test name"             # one test
```

Tests run against a plain HTTP server, which does **not** do the clean-URL rewriting that `serve.py` and `.htaccess` do. Specs must therefore navigate real paths — `/services/index.html`, never `/services/`.

**Continuous integration** (`.github/workflows/`):

| Workflow            | What it does                                                                                                               |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `playwright.yml`    | Responsive specs are a **blocking gate**. Accessibility runs as advisory, because axe reports a known pre-existing backlog |
| `lighthouse.yml`    | Performance and accessibility scores across a mobile × desktop matrix                                                      |
| `facebook-sync.yml` | Pulls Facebook posts into `data/news.json` — see [docs/facebook-sync.md](docs/facebook-sync.md)                            |

## Deployment

```bash
npm run build
```

Upload the contents of `dist/` to your web server's `public_html` directory. Include `.htaccess` — it provides clean URLs, security headers, and compression.

| Type        | Permission | Numeric |
| ----------- | ---------- | ------- |
| Files       | rw-r--r--  | 644     |
| Directories | rwxr-xr-x  | 755     |

The build sets these permissions automatically.

## Key Features

| Feature                          | Description                                                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Municipal Services Directory** | Comprehensive guide to city services with requirements, fees, and processing times, cross-referenced to office pages                                                           |
| **Government Officials**         | Directory of elected officials and department heads with contact information                                                                                                   |
| **Budget Transparency**          | Financial reports, income/expenditure breakdowns, and infrastructure projects                                                                                                  |
| **City Statistics**              | Demographics, economic data, and competitive index rankings                                                                                                                    |
| **Tourism Directory**            | Attractions, landmarks, food, accommodations, and experiences                                                                                                                  |
| **Real-time Information**        | Live weather, currency exchange rates, and Philippine time                                                                                                                     |
| **Emergency Hotline Bar**        | Standardized emergency contact numbers shown on every page                                                                                                                     |
| **Progressive Web App**          | Installable, with auto-updates, versioned service-worker caching, and an offline page carrying emergency hotlines                                                              |
| **Accessibility**                | WCAG 2.1 Level AA target, partially conformant — skip links, ARIA labels, keyboard navigation, semantic HTML. Shortfalls are named on the [accessibility page](accessibility/) |
| **SEO**                          | Clean URLs, meta tags, Open Graph, structured data, XML sitemap                                                                                                                |

**Languages.** English is complete. **Filipino** ships but is machine-translated and not yet reviewed by a native speaker, so the UI says so plainly. **Bikol** appears in the language menu but is deliberately not selectable — it is held back until a human translation exists, because shipping a bad one would be worse than waiting. Translations are per-locale files in `data/locales/`, fetched only when a visitor switches language.

Note the spelling convention: **Bikol** is the language; **Bicol** is the region, and appears in proper nouns (Bicol University, Bicol Express) and in the demonym _Bicolano_.

## Technology Stack

| Category           | Technologies                                                                                                  |
| ------------------ | ------------------------------------------------------------------------------------------------------------- |
| **Frontend**       | HTML5, CSS3, JavaScript (ES6+) — no framework, no bundler                                                     |
| **Data**           | JSON files in `data/`, fetched client-side                                                                    |
| **Libraries**      | Leaflet.js + OpenStreetMap (maps), Chart.js (charts), Bootstrap Icons, Google Fonts (Inter)                   |
| **APIs**           | Open-Meteo (weather), exchangerate.host / open.er-api.com (currency), Facebook page embed                     |
| **Build & test**   | Node.js/npm, Babel, Terser/clean-css/html-minifier-terser, Prettier, Playwright, Lighthouse CI                |
| **Server**         | Apache (`.htaccess`, mod_rewrite, mod_deflate) on cPanel in production; Python's `http.server` in development |
| **PWA & security** | Versioned service worker, web app manifest, HTTPS, CSP/HSTS/X-Frame-Options headers                           |

## Contributing

We welcome contributions from everyone — developers, designers, data researchers, content writers, and concerned citizens of Legazpi City. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide, and [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for community expectations.

Two things worth knowing before your first change:

1. **Content lives in `data/`, not in the HTML.** Check there first.
2. **There is no template system.** Menus, headers, and footers are duplicated into every page.

Deeper technical notes, including the vocabulary this project uses, are in [CLAUDE.md](CLAUDE.md) and [CONTEXT.md](CONTEXT.md). Architecture decisions are recorded in [docs/adr/](docs/adr/).

## Data Sources

All public information is sourced from official government portals:

| Source                                  | URL                                                                   | Data Type                           |
| --------------------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| LGU Legazpi Official Website            | [legazpi.gov.ph](https://legazpi.gov.ph/)                             | Services, Officials, Tourism        |
| Bureau of Local Government Finance      | [blgf.gov.ph](https://blgf.gov.ph/)                                   | Budget, Financial Reports           |
| Philippine Statistics Authority         | [psa.gov.ph](https://psa.gov.ph/)                                     | Demographics, Census, Barangay Data |
| DTI CMCI Portal                         | [cmci.dti.gov.ph](https://cmci.dti.gov.ph/)                           | Competitive Index                   |
| DOH National Health Facility Registry   | [nhfr.doh.gov.ph](https://nhfr.doh.gov.ph/)                           | Health Facilities                   |
| DOH Bicol Center for Health Development | [bicol.doh.gov.ph](https://bicol.doh.gov.ph/)                         | Animal Bite Treatment Centers       |
| PhilHealth                              | [philhealth.gov.ph](https://www.philhealth.gov.ph/)                   | YAKAP / GAMOT Accredited Facilities |
| LTFRB                                   | [ltfrb.gov.ph](https://ltfrb.gov.ph/)                                 | Public Transport Fares              |
| DPWH — Sumbong sa Pangulo               | [sumbongsapangulo.ph](https://sumbongsapangulo.ph/flood-control-map/) | Flood Control Projects              |

Source documents compiled during research are kept in [docs/sources/](docs/sources/).

## Security

To report a vulnerability, see [SECURITY.md](SECURITY.md). Please do not open a public issue for security problems.

## License

This project is dual-licensed:

| License     | Applies To  | Details                                |
| ----------- | ----------- | -------------------------------------- |
| MIT License | Source Code | Free to use, modify, and distribute    |
| CC BY 4.0   | Content     | Attribution required for content reuse |

See [LICENSE](LICENSE) for full details.

## Contact

Questions, bug reports, and feature requests: open a [GitHub issue](https://github.com/bpbelen/betterlegazpi/issues). To volunteer or get in touch directly, email [volunteer@betterlegazpi.org](mailto:volunteer@betterlegazpi.org), or follow along on [Facebook](https://www.facebook.com/betterlegazpi).

## Acknowledgments

- [BetterGov.ph](https://bettergov.ph) for the civic-tech initiative in the Philippines
- [BetterSolano.org](https://github.com/BetterSolano/bettersolano) by [Ramon Logan Jr.](https://ramonloganjr.com/) — the original project this repository was forked and retrofitted from
- All volunteers and contributors who dedicate their time
- The open-source community for the tools and libraries used
- Citizens of Legazpi City for their feedback and support

---

Made for the people of Legazpi City, Albay

## Maintainer

[Rye Belen](https://www.linkedin.com/in/bmpbelen/) is a Bicolano public health professional-turned-management consulting analyst who lives at the intersection of technology, public health, and civic innovation. Having led digital initiatives across provincial youth networks, national government authorities, and global consulting firms, Rye joined as a volunteer for BetterGov.ph to bring modern, transparent, and citizen-first digital infrastructure to his home province. When he’s not analyzing business cases, he maintains BetterLegazpi.org as a free, open-source public service for the community.
