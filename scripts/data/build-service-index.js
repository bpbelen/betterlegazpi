#!/usr/bin/env node
/**
 * Build data/service-index.json from the office charters in data/offices/.
 *
 * The category pages need three things from the charters: a service count per
 * office, and a fee and processing time for each service a journey step points at.
 * Fetching the charters themselves to get them would cost 230KB on Infrastructure
 * alone (ceo.json is 142KB), for a few short strings.
 *
 * So this generates a flat index - the same facts, derived rather than retyped,
 * regenerated whenever a charter changes. The office JSONs remain the source of
 * truth; nothing here is authored by hand.
 *
 *   node scripts/data/build-service-index.js [--check]
 *
 * --check exits non-zero if the committed index is stale, for use in validation.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const OFFICES_DIR = path.join(ROOT, 'data/offices');
const OUT_FILE = path.join(ROOT, 'data/service-index.json');

/**
 * Charters record `feeText: "None"` on every step that takes no money, which is most
 * of them. Reading that as "free" would print "Fee: None" on a building permit, so
 * a service counts as free only when no step charges anything at all.
 *
 * Returns { kind, text } where kind is one of:
 *   free       - no step charges anything
 *   assessed   - charged, but the amount is set by an order of payment
 *   ordinance  - charged, amount defined by an ordinance rather than stated here
 *   amount     - a specific amount the charter states
 */
function deriveFee(service) {
  const charged = (service.steps || [])
    .map((s) => s.feeText)
    .filter((t) => t && t.trim() && t.trim().toLowerCase() !== 'none');

  if (charged.length === 0) return { kind: 'free', text: 'Free' };

  const text = charged[0].trim();
  if (/order of payment/i.test(text)) return { kind: 'assessed', text: 'Fee on assessment' };
  if (/ordinance/i.test(text) && !/\d/.test(text.replace(/(no\.?|ordinance)[^,;]*/gi, ''))) {
    return { kind: 'ordinance', text: 'Fee set by ordinance' };
  }
  return { kind: 'amount', text };
}

/**
 * Only the charter's own stated total is used. 13 of CEO's 30 services state none -
 * including the building permit - and summing their steps would publish a number the
 * city never did. A missing total is reported as missing.
 */
function deriveTime(service) {
  const stated = (service.statedTotals || {}).processingTime;
  if (!stated || !String(stated).trim()) return null;
  return String(stated).trim();
}

function build() {
  const files = fs
    .readdirSync(OFFICES_DIR)
    .filter((f) => f.endsWith('.json'))
    .sort();

  const offices = {};
  const services = {};

  for (const file of files) {
    const office = JSON.parse(fs.readFileSync(path.join(OFFICES_DIR, file), 'utf8'));
    const charter = office.charter;
    const list = charter.services || [];

    offices[office.slug] = {
      slug: office.slug,
      route: office.route,
      name: charter.office,
      abbreviation: charter.abbreviation || null,
      edition: charter.edition || null,
      serviceCount: list.length,
    };

    for (const service of list) {
      services[service.id] = {
        office: office.slug,
        title: service.title,
        group: service.charterGroup || null,
        requirementCount: (service.requirements || []).length,
        fee: deriveFee(service),
        time: deriveTime(service),
      };
    }
  }

  return {
    // Generated file - do not edit. Run scripts/data/build-service-index.js.
    generatedFrom: 'data/offices/*.json',
    officeCount: Object.keys(offices).length,
    serviceCount: Object.keys(services).length,
    offices,
    services,
  };
}

const index = build();
const json = JSON.stringify(index, null, 2) + '\n';

if (process.argv.includes('--check')) {
  const current = fs.existsSync(OUT_FILE) ? fs.readFileSync(OUT_FILE, 'utf8') : '';
  if (current !== json) {
    console.error(
      'data/service-index.json is stale. Run: node scripts/data/build-service-index.js'
    );
    process.exit(1);
  }
  console.log('data/service-index.json is up to date.');
} else {
  fs.writeFileSync(OUT_FILE, json);
  const kb = Math.round(Buffer.byteLength(json) / 1024);
  console.log(
    `Wrote data/service-index.json - ${index.officeCount} offices, ${index.serviceCount} services, ${kb} KB`
  );
}
