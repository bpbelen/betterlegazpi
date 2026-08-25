# BetterLegazpi.org

A civic-tech initiative providing transparent access to municipal services, programs, and public funds of LGU Legazpi City, Albay, Philippines.

![Version](https://img.shields.io/badge/version-1.1.19-green)
![License](https://img.shields.io/badge/license-MIT%20%7C%20CC%20BY%204.0-blue)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?logo=nodedotjs&logoColor=white)

This project began as a fork of [BetterSolano.org](https://github.com/BetterSolano/bettersolano), a civic-tech site built for LGU Solano, Nueva Vizcaya, retrofitted for Legazpi City. See [MIGRATION.md](MIGRATION.md) for background on the upstream project's React + TypeScript rewrite (not part of this repository).

## Open Source for LGUs

This repository is open source under the **MIT License** and **CC BY 4.0** and is freely available for use, modification, redistribution, and publication by any individual or organization that wishes to implement it in their respective local government unit (LGU) across the Philippines.

We encourage adoption by other municipalities in support of:

- **Transparency** - Making government information accessible to citizens
- **Accessibility** - Ensuring services are available to all, including persons with disabilities
- **Modernization** - Bringing local government services to digital platforms
- **Public Service** - Improving the delivery of government services to the community

To adapt this project for your LGU, fork the repository and customize the content, styling, and data sources to match your municipality's requirements.

## About

BetterLegazpi.org is a volunteer-driven, open-source project that empowers the people of Legazpi City with easy access to local government information. The platform aggregates public data from official government portals and presents it in a user-friendly, accessible format.

**Cost to the People of Legazpi = ₱0**

## Live Demo

Visit the live website: [https://betterlegazpi.org](https://betterlegazpi.org)

## Technology Stack

| Category            | Technologies                                                           |
| -------------------- | ----------------------------------------------------------------------- |
| **Frontend**        | HTML5, CSS3, JavaScript (ES6+)                                         |
| **Styling**         | Custom CSS, CSS Variables, Flexbox, CSS Grid, Responsive Design        |
| **Icons**           | Bootstrap Icons (CDN)                                                  |
| **Fonts**           | Google Fonts (Inter)                                                   |
| **Maps**            | Leaflet.js, OpenStreetMap                                              |
| **Charts**          | Chart.js (Canvas-based)                                                |
| **Data Format**     | JSON                                                                   |
| **APIs**            | Open-Meteo (Weather), ExchangeRate API (Currency)                      |
| **Build Tools**     | Node.js, npm, Bash, Babel (@babel/preset-env)                          |
| **Minification**    | html-minifier-terser, clean-css-cli, terser                            |
| **Code Formatting** | Prettier                                                               |
| **Testing**         | Playwright (responsive + accessibility specs), axe-core                |
| **Version Control** | Git, GitHub                                                            |
| **Server**          | Apache (.htaccess), mod_rewrite, mod_deflate                           |
| **Hosting**         | cPanel (Production), Python HTTP Server (Development)                  |
| **PWA**             | Service Worker (versioned caching, install prompt, seamless updates), Web App Manifest, offline fallback |
| **SEO**             | Open Graph, Twitter Cards, XML Sitemap, robots.txt                     |
| **Security**        | HTTPS, CSP Headers, HSTS, X-Frame-Options                              |
| **Analytics**       | Google Analytics (gtag.js)                                             |
| **Accessibility**   | WCAG 2.1, ARIA, Semantic HTML                                          |
| **Performance**     | GZIP Compression, Browser Caching, Asset Minification                  |

## Key Features

| Feature                          | Description                                                                                                          |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Municipal Services Directory** | Comprehensive guide to city services with requirements, fees, and processing times, cross-referenced to office pages |
| **Government Officials**         | Directory of elected officials and department heads with contact information                                        |
| **Budget Transparency**          | Financial reports, income/expenditure breakdowns, and infrastructure projects                                       |
| **City Statistics**              | Demographics, economic data, and competitive index rankings                                                         |
| **Real-time Information**        | Live weather updates, currency exchange rates, and Philippine time                                                  |
| **Emergency Hotline Bar**        | Standardized emergency contact numbers shown on every page                                                          |
| **Progressive Web App**          | Installable PWA with "Install App" prompt, seamless auto-updates via skipWaiting (no manual refresh), versioned service worker caching (static + runtime), offline fallback page with emergency hotlines |
| **Auto Version Management**      | Dynamic version display from `version.json`, synced across all HTML pages and `package.json`                        |
| **Clean URLs**                   | SEO-friendly URLs without `.html` extensions, powered by Apache mod_rewrite                                          |
| **Accessibility**                | WCAG 2.1 compliant with skip links, ARIA labels, keyboard navigation, and semantic HTML                             |
| **SEO Optimized**                | Meta tags, Open Graph, Twitter Cards, structured data, and XML sitemap                                              |
| **Performance**                  | Size reduction through minification, GZIP compression, Babel transpilation, and browser caching                     |

**Not yet live:** multi-language support (English/Filipino/Bicol) is planned but not currently wired up — see [CLAUDE.md](CLAUDE.md) for the current state and rationale. The legislative documents section (ordinances/resolutions) is intentionally hidden pending real Legazpi City data.

## Quick Start

```bash
# Clone the repository
git clone https://github.com/bpbelen/betterlegazpi.git

# Navigate to project directory
cd betterlegazpi

# Install dependencies
npm install

# Start development server (with clean URL support)
npm run dev

# Open in browser
# http://localhost:8000
```

## Installation

### Prerequisites

| Requirement | Version | Purpose                            |
| ----------- | ------- | ----------------------------------- |
| Node.js     | v16+    | Build tools and package management |
| npm         | v8+     | Dependency management              |
| Python 3    | v3.x    | Local development server           |
| Git         | Latest  | Version control                    |

### Setup Steps

1. **Clone the repository**

```bash
git clone https://github.com/bpbelen/betterlegazpi.git
cd betterlegazpi
```

2. **Install dependencies**

```bash
npm install
```

3. **Start the development server**

```bash
npm run dev
```

4. **Open in browser**
   - Development: http://localhost:8000
   - Production preview: http://localhost:8080 (after build)

## Usage

### Development Commands

| Command                      | Description                                                           |
| ------------------------------ | ----------------------------------------------------------------------- |
| `npm run dev`                | Start local development server (port 8000)                            |
| `npm run build`              | Build minified production files to `dist/` (auto-bumps patch version) |
| `npm run build -- --no-bump` | Build without incrementing the version number                         |
| `npm run build:minor`        | Bump minor version and build                                          |
| `npm run build:major`        | Bump major version and build                                          |
| `npm run serve:dist`         | Serve production build (port 8080)                                    |
| `npm run version:check`      | Display current version                                               |
| `npm run version:patch`      | Bump patch version only                                               |
| `npm run version:minor`      | Bump minor version only                                               |
| `npm run version:major`      | Bump major version only                                               |
| `npm run format`             | Format all files with Prettier                                        |
| `npm run format:check`       | Check formatting without writing changes                              |
| `npm test`                   | Run the Playwright test suite                                         |

### Production Deployment

1. **Build production files**

```bash
npm run build
```

2. **Output location**
   - Minified files are generated in the `dist/` folder

3. **Deploy to server**
   - Upload contents of `dist/` to your web server's `public_html` directory
   - Ensure `.htaccess` is included for clean URLs, CSP headers, and security

### File Permissions (cPanel)

| Type        | Permission | Numeric |
| ----------- | ---------- | ------- |
| Files       | rw-r--r--  | 644     |
| Directories | rwxr-xr-x  | 755     |

## Project Structure

```
betterlegazpi/
├── assets/
│   ├── css/              # Stylesheets
│   ├── js/                # JavaScript modules
│   ├── images/            # Images, icons, banners, partner logos
│   └── animation/          # Lottie JSON animation files
├── data/                  # JSON data files
│   ├── officials.json     # Government officials data
│   ├── services.json      # Municipal services data
│   ├── news.json          # News and announcements
│   ├── ordinances.json    # Legislative ordinances
│   └── resolutions.json   # Legislative resolutions
├── services/              # Service category pages
├── service-details/       # Individual office/service pages
├── government/            # Government directory pages
├── legislative/           # Legislative framework pages
├── budget/                # Budget transparency page
├── statistics/            # City statistics page
├── news/                  # News and announcements page
├── history/               # History of Legazpi City page
├── contact/                # Contact information page
├── faq/                    # Frequently asked questions
├── sitemap/                # HTML sitemap page
├── scripts/                # Build and version scripts
│   └── bump-version.js     # Cross-platform Node.js version bump script
├── tests/                  # Playwright responsive + accessibility specs
├── dist/                   # Production build output (gitignored)
├── index.html               # Homepage
├── sw.js                    # Service worker (versioned caching, offline support)
├── manifest.webmanifest     # PWA web app manifest
├── offline.html             # Offline fallback page with emergency hotlines
├── serve.py                 # Local dev server with clean URL rewriting
├── .htaccess                # Apache configuration (CSP, rewrites, caching)
├── version.json              # Version tracking
├── build.sh                  # Build automation script
├── package.json               # Node.js configuration
└── README.md                  # Project documentation
```

## Contributing

We welcome contributions from everyone! Whether you're a developer, designer, data researcher, content writer, or a concerned citizen of Legazpi City, your participation helps shape this project. See [CONTRIBUTING.md](CONTRIBUTING.md) for the full guide.

## Data Sources

All public information is sourced from official government portals:

| Source                             | URL                                          | Data Type                 |
| ------------------------------------ | ---------------------------------------------- | ---------------------------- |
| LGU Legazpi Official Website        | [legazpi.gov.ph](https://legazpi.gov.ph/)     | Services, Officials       |
| Bureau of Local Government Finance | [blgf.gov.ph](https://blgf.gov.ph/)            | Budget, Financial Reports |
| Philippine Statistics Authority    | [psa.gov.ph](https://psa.gov.ph/)              | Demographics, Census      |
| DTI CMCI Portal                    | [cmci.dti.gov.ph](https://cmci.dti.gov.ph/)    | Competitive Index         |

## License

This project is dual-licensed:

| License     | Applies To  | Details                                |
| ----------- | ----------- | ---------------------------------------- |
| MIT License | Source Code | Free to use, modify, and distribute    |
| CC BY 4.0   | Content     | Attribution required for content reuse |

See [LICENSE](LICENSE) for full details.

## Contact

Questions, bug reports, and feature requests: open a [GitHub issue](https://github.com/bpbelen/betterlegazpi/issues).

## Acknowledgments

- [BetterGov.ph](https://bettergov.ph) for the civic-tech initiative in the Philippines
- [BetterSolano.org](https://github.com/BetterSolano/bettersolano), the original project this repository was forked and retrofitted from
- All volunteers and contributors who dedicate their time
- Open-source community for the tools and libraries used
- Citizens of Legazpi City for their feedback and support

---

Made for the people of Legazpi City, Albay

## Maintainer

This fork is maintained by [Rye](https://github.com/bpbelen).
