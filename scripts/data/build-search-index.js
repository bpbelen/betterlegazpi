#!/usr/bin/env node
/**
 * Build data/search-index.json — the corpus the site-wide search in
 * assets/js/search.js matches against.
 *
 * Before this existed, search loaded only data/services.json: 50 curated
 * entries covering 9 of the 13 service categories. Health, education and
 * housing had none, so "health" matched nothing better than the death
 * certificate (which carries "city health office" as a keyword) and "YAKAP"
 * matched nothing at all.
 *
 * The 260 charter services were already modelled in data/offices/*.json. This
 * composes two generated sources rather than re-deriving anything:
 *
 *   data/offices/*.json    titles, descriptions, categories, search aliases,
 *                          the route each hub renders at, verified flags
 *   data/service-index.json fee and processing time, already derived by
 *                          build-service-index.js (deriveFee / sumSteps handle
 *                          the "None on every step" and assessed-fee cases —
 *                          duplicating that logic here would let the two drift)
 *
 * Page entries are appended from PAGES below so a search for "tourism" or
 * "mayor" reaches the section itself, not only a transaction inside it.
 *
 *   node scripts/data/build-search-index.js [--check]
 *
 * --check exits non-zero if the committed index is stale. Run
 * build-service-index.js first if charters changed.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OFFICES_DIR = path.join(ROOT, 'data/offices');
const SERVICE_INDEX = path.join(ROOT, 'data/service-index.json');
const CATEGORIES_FILE = path.join(ROOT, 'data/service-categories.json');
const OUT_FILE = path.join(ROOT, 'data/search-index.json');

/** Descriptions are for ranking and a one-line preview, not for reading in full. */
const DESC_LIMIT = 180;

/**
 * Section pages, hand-listed. These are the routes a resident might search for
 * by name rather than by the transaction they need. Error pages, the sitemap
 * and the legal pages are deliberately absent: nobody searches for them, and
 * they would outrank real answers.
 */
const PAGES = [
  {
    title: 'Services',
    url: 'services/index.html',
    keywords: ['services', 'all services', 'directory'],
    description: 'Every city service grouped by category.',
  },
  {
    title: 'Health & Wellness',
    url: 'services/health.html',
    keywords: ['health', 'clinic', 'medical', 'kalusugan', 'wellness', 'doctor'],
    description: 'Health services, clinics and city health programmes.',
  },
  {
    title: 'Education & Scholarship',
    url: 'services/education.html',
    keywords: ['education', 'scholarship', 'school', 'student', 'eskwela'],
    description: 'Scholarships and education assistance.',
  },
  {
    title: 'Housing & Resettlement',
    url: 'services/housing.html',
    keywords: ['housing', 'resettlement', 'relocation', 'bahay', 'lot'],
    description: 'Housing, resettlement and relocation assistance.',
  },
  {
    title: 'Agriculture & Veterinary',
    url: 'services/agriculture.html',
    keywords: ['agriculture', 'farming', 'fisherfolk', 'veterinary', 'animal'],
    description: 'Support for farmers, fisherfolk and animal owners.',
  },
  {
    title: 'Business & Trade',
    url: 'services/business.html',
    keywords: ['business', 'permit', 'trade', 'investment', 'negosyo'],
    description: 'Business permits, licensing and investment.',
  },
  {
    title: 'Certificates & Records',
    url: 'services/certificates.html',
    keywords: ['certificate', 'records', 'civil registry', 'birth', 'marriage', 'death'],
    description: 'Civil registry documents and certifications.',
  },
  {
    title: 'Employment & Livelihood',
    url: 'services/employment.html',
    keywords: ['employment', 'job', 'livelihood', 'trabaho', 'peso'],
    description: 'Job placement, livelihood and employment programmes.',
  },
  {
    title: 'Environment',
    url: 'services/environment.html',
    keywords: ['environment', 'waste', 'tree', 'sanitation'],
    description: 'Environmental permits, waste and greening programmes.',
  },
  {
    title: 'Infrastructure',
    url: 'services/infrastructure.html',
    keywords: ['infrastructure', 'building permit', 'construction', 'road'],
    description: 'Construction permits and public works.',
  },
  {
    title: 'Social Services',
    url: 'services/social-services.html',
    keywords: ['social', 'assistance', 'welfare', 'ayuda', 'senior', 'pwd'],
    description: 'Welfare assistance, senior citizen and PWD services.',
  },
  {
    title: 'Tax & Payments',
    url: 'services/tax-payments.html',
    keywords: ['tax', 'payment', 'real property', 'cedula', 'buwis'],
    description: 'Local taxes, fees and how to pay them.',
  },
  {
    title: 'Public Utilities',
    url: 'services/utilities.html',
    keywords: ['utilities', 'water', 'electricity', 'kuryente', 'tubig'],
    description: 'Water, power and other utility services.',
  },

  {
    title: 'Government',
    url: 'government/index.html',
    keywords: ['government', 'city hall', 'executive', 'offices'],
    description: 'City government structure and offices.',
  },
  {
    title: 'City Officials',
    url: 'government/officials.html',
    keywords: ['officials', 'mayor', 'vice mayor', 'councilor', 'alkalde'],
    description: 'Elected officials and department heads.',
  },
  {
    title: 'Legislative',
    url: 'legislative/index.html',
    keywords: ['legislative', 'ordinance', 'resolution', 'sangguniang panlungsod', 'council'],
    description: 'Ordinances, resolutions and the city council.',
  },
  {
    title: 'Budget',
    url: 'budget/index.html',
    keywords: ['budget', 'appropriation', 'spending'],
    description: 'City budget and appropriations.',
  },
  {
    title: 'Transparency',
    url: 'transparency/index.html',
    keywords: ['transparency', 'full disclosure', 'fiscal', 'procurement'],
    description: 'Fiscal transparency and disclosure reports.',
  },
  {
    title: 'Statistics',
    url: 'statistics/index.html',
    keywords: ['statistics', 'data', 'demographics', 'population'],
    description: 'City demographics and statistics.',
  },
  {
    title: 'News',
    url: 'news/index.html',
    keywords: ['news', 'announcement', 'advisory', 'balita'],
    description: 'City news and announcements.',
  },
  {
    title: 'History',
    url: 'history/index.html',
    keywords: ['history', 'heritage', 'kasaysayan'],
    description: 'The history of Legazpi City.',
  },
  {
    title: 'Contact',
    url: 'contact/index.html',
    keywords: ['contact', 'hotline', 'phone', 'email', 'address'],
    description: 'How to reach the city government.',
  },
  {
    title: 'FAQ',
    url: 'faq/index.html',
    keywords: ['faq', 'questions', 'help'],
    description: 'Frequently asked questions.',
  },

  {
    title: 'Tourism',
    url: 'travel/index.html',
    keywords: ['tourism', 'travel', 'visit', 'turismo'],
    description: 'Visiting Legazpi City.',
  },
  {
    title: 'Attractions',
    url: 'travel/attractions.html',
    keywords: ['attractions', 'mayon', 'sights', 'spots'],
    description: 'Things to see in and around Legazpi.',
  },
  {
    title: 'Landmarks',
    url: 'travel/landmarks.html',
    keywords: ['landmarks', 'cagsawa', 'ruins', 'heritage'],
    description: 'Landmarks and heritage sites.',
  },
  {
    title: 'Food',
    url: 'travel/food.html',
    keywords: ['food', 'restaurant', 'kakanin', 'sili', 'pancit'],
    description: 'Where and what to eat.',
  },
  {
    title: 'Accommodations',
    url: 'travel/accommodations.html',
    keywords: ['hotel', 'accommodation', 'lodging', 'stay'],
    description: 'Places to stay.',
  },
  {
    title: 'Experience',
    url: 'travel/experience.html',
    keywords: ['experience', 'activities', 'adventure'],
    description: 'Activities and experiences.',
  },
  {
    title: 'Transportation',
    url: 'travel/transportation.html',
    keywords: ['transportation', 'jeepney', 'tricycle', 'fare', 'route', 'pamasahe'],
    description: 'Getting around Legazpi: routes and fares.',
  },
  {
    title: 'Ibalong',
    url: 'travel/ibalong.html',
    keywords: ['ibalong', 'festival', 'epic'],
    description: 'The Ibalong festival and epic.',
  },
];

/**
 * Programmes with a dedicated page but no Citizen's Charter entry, so nothing
 * in data/offices/ describes them. Hand-authored from the page itself, which is
 * why each carries `source` rather than a `draft` flag: these are not awaiting
 * verification against a charter, they simply are not charter transactions.
 *
 * PhilHealth YAKAP is the case that prompted this: it has a full page at
 * service-details/philhealth-yakap.html and was unreachable from search.
 */
const PROGRAMMES = [
  {
    id: 'philhealth-yakap',
    title: 'PhilHealth YAKAP (Yaman ng Kalusugan Program)',
    description:
      'Free primary care check-ups, laboratory diagnostics, cancer screening and up to ₱20,000 a year in maintenance medicines at accredited clinics in Legazpi City, with no copayment.',
    office: 'PhilHealth / City Health Office',
    category: 'Health & Wellness',
    categoryId: 'health',
    keywords: [
      'yakap',
      'philhealth',
      'philhealth yakap',
      'yaman ng kalusugan',
      'universal health care',
      'uhc',
      'konsulta',
      'ekonsulta',
      'free medicine',
      'maintenance medicine',
      'libreng gamot',
      'gamot',
      'free check up',
      'primary care',
      'cancer screening',
      'laboratory',
      'health insurance',
      'zero copayment',
      'kalusugan',
    ],
    fee: 'Free',
    url: 'service-details/philhealth-yakap.html',
  },
  {
    id: 'philhealth-yakap-register',
    title: 'Registering for PhilHealth YAKAP',
    description:
      'Sign up once with one accredited clinic in Legazpi, through the eGovPH app, the PhilHealth member portal, or by walking in with one government ID. No fee.',
    office: 'PhilHealth / City Health Office',
    category: 'Health & Wellness',
    categoryId: 'health',
    keywords: [
      'yakap registration',
      'register yakap',
      'philhealth register',
      'egovph',
      'sign up',
      'enroll',
      'magpalista',
    ],
    fee: 'Free',
    url: 'service-details/philhealth-yakap.html#steps',
  },
  {
    id: 'philhealth-yakap-medicines',
    title: 'Check if a medicine or test is covered by YAKAP',
    description:
      'Search the YAKAP catalogue by generic medicine name or by the laboratory test your doctor ordered.',
    office: 'PhilHealth / City Health Office',
    category: 'Health & Wellness',
    categoryId: 'health',
    keywords: [
      'covered medicine',
      'is my medicine covered',
      'yakap catalog',
      'generic name',
      'laboratory test',
      'gamot covered',
    ],
    fee: 'Free',
    url: 'service-details/philhealth-yakap.html#catalog',
  },
  {
    id: 'philhealth-yakap-clinics',
    title: 'YAKAP accredited clinics in Legazpi City',
    description: 'The accredited clinics in Legazpi City where YAKAP benefits can be claimed.',
    office: 'PhilHealth / City Health Office',
    category: 'Health & Wellness',
    categoryId: 'health',
    keywords: [
      'yakap clinic',
      'accredited clinic',
      'where to go',
      'konsulta clinic',
      'health facility',
    ],
    fee: 'Free',
    url: 'service-details/philhealth-yakap.html#facilities',
  },
];

function truncate(s, n) {
  if (!s) return '';
  const t = s.replace(/\s+/g, ' ').trim();
  return t.length <= n
    ? t
    : t.slice(0, t.lastIndexOf(' ', n) > 0 ? t.lastIndexOf(' ', n) : n) + '…';
}

/**
 * Maps an office slug to the site service category it belongs to, using the
 * same data/service-categories.json the category pages are built from. Four
 * offices sit under two categories (CVO under agriculture and health, CPDO
 * under business and infrastructure); the first listed is treated as primary,
 * and the rest are kept so a chip filter still finds the service.
 */
function officeCategoryMap() {
  const cats = JSON.parse(fs.readFileSync(CATEGORIES_FILE, 'utf8')).categories || [];
  const map = {};
  for (const cat of cats) {
    for (const office of cat.offices || []) {
      (map[office.slug] = map[office.slug] || []).push({ id: cat.id, name: cat.name });
    }
  }
  return map;
}

function build() {
  const serviceIndex = JSON.parse(fs.readFileSync(SERVICE_INDEX, 'utf8'));
  const facts = serviceIndex.services || {};
  const officeCats = officeCategoryMap();

  const entries = [];

  const files = fs
    .readdirSync(OFFICES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  for (const file of files) {
    const office = JSON.parse(fs.readFileSync(path.join(OFFICES_DIR, file), 'utf8'));
    const route = office.route;
    const officeName = office.charter.office;
    const aliases = (office.local && office.local.searchAliases) || {};

    // local.categories groups service ids under a human-readable heading; invert
    // it so each service can name the group it appears under on its hub.
    const groupOf = {};
    for (const cat of (office.local && office.local.categories) || []) {
      for (const id of cat.services || []) groupOf[id] = { id: cat.id, title: cat.title };
    }

    for (const svc of office.charter.services || []) {
      const fact = facts[svc.id] || {};
      const group = groupOf[svc.id];
      const cats = officeCats[office.slug] || [];
      entries.push({
        type: 'service',
        id: svc.id,
        title: svc.title,
        description: truncate(svc.description, DESC_LIMIT),
        office: officeName,
        division: svc.office || undefined,
        // The site category (Health, Business, ...) drives the filter chips.
        category: cats.length ? cats[0].name : undefined,
        categoryId: cats.length ? cats[0].id : undefined,
        alsoCategoryIds: cats.length > 1 ? cats.slice(1).map((c) => c.id) : undefined,
        // The grouping used on the office's own hub page, kept for context.
        hubGroup: group ? group.title : undefined,
        keywords: aliases[svc.id] || [],
        fee: fact.fee ? fact.fee.text : undefined,
        processingTime: fact.time || undefined,
        // Every charter service is currently unverified against the published
        // PDF. The UI marks these so an unchecked fee is never presented as
        // settled fact; when a charter is verified this flips on its own.
        draft: svc.verified ? undefined : true,
        url: `${route}#${svc.id}`,
      });
    }
  }

  for (const prog of PROGRAMMES) {
    entries.push({ type: 'service', source: 'programme-page', ...prog });
  }

  for (const page of PAGES) {
    entries.push({
      type: 'page',
      id: page.url.replace(/[/.]/g, '-'),
      title: page.title,
      description: page.description,
      keywords: page.keywords,
      url: page.url,
    });
  }

  const services = entries.filter((e) => e.type === 'service');
  return {
    note: 'Generated by scripts/data/build-search-index.js. Do not edit by hand.',
    generatedFrom: ['data/offices/*.json', 'data/service-index.json'],
    charterEdition: serviceIndex.currentEdition,
    serviceCount: services.length,
    pageCount: entries.length - services.length,
    entries,
  };
}

function main() {
  const payload = build();
  const json = JSON.stringify(payload, null, 2) + '\n';

  if (process.argv.includes('--check')) {
    const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
    if (current !== json) {
      console.error(
        'data/search-index.json is stale. Run: node scripts/data/build-search-index.js'
      );
      process.exit(1);
    }
    console.log('data/search-index.json is up to date.');
    return;
  }

  fs.writeFileSync(OUT_FILE, json);
  const drafts = payload.entries.filter((e) => e.draft).length;
  console.log(`  ${payload.serviceCount} services + ${payload.pageCount} pages`);
  console.log(`  ${drafts} services flagged draft (unverified against the published charter)`);
  console.log(`  charter edition: ${payload.charterEdition}`);
  console.log(`  written to data/search-index.json (${(json.length / 1024).toFixed(0)} KB)`);
}

main();
