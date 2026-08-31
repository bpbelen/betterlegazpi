#!/usr/bin/env node
/**
 * Traceability checker for data/health-facilities.json.
 *
 * Fetches the DOH / PhilHealth / Bicol CHD lists cited in the file's own
 * `_sources` block and reports, field by field, which published values back the
 * ones we ship. It writes no data files -- the JSON stays the source of truth,
 * as CLAUDE.md says. Run it, read the report, edit the JSON deliberately.
 *
 *   node scripts/data/verify-health-sources.js            # report to stdout
 *   node scripts/data/verify-health-sources.js --json     # machine-readable
 *   node scripts/data/verify-health-sources.js --refresh  # bypass the cache
 *
 * The HFSRB lists are Google Sheets published to the web. Two traps, both of
 * which produced wrong answers during the first audit:
 *
 *   1. `/pubhtml` returns a title and no rows. Use `/pub?...&output=csv`.
 *   2. `output=csv` alone returns only the FIRST tab, which on most of these
 *      sheets is a regional-count summary, not the facility list. Every sheet
 *      needs an explicit `gid` per tab. The gids below were read off the live
 *      sheets on 2026-08-31; if a sheet is republished they may move, and the
 *      script will report a tab as empty rather than silently checking nothing.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const ROOT = path.resolve(__dirname, '../..');
const DATA = path.join(ROOT, 'data/health-facilities.json');
const CACHE = path.join(os.tmpdir(), 'legazpi-health-sources');

const REFRESH = process.argv.includes('--refresh');
const AS_JSON = process.argv.includes('--json');

/** Google Sheets published-to-web CSV endpoint for one tab. */
const sheet = (id, gid) =>
  `https://docs.google.com/spreadsheets/d/e/${id}/pub?gid=${gid}&single=true&output=csv`;

const HFSRB = {
  ambulatory: '2PACX-1vQmUU2oMSgAYZojzn5040H3Om5vckQiWCKCMNsD7AoxQCbxDPuDoimifznf8ZZuNkyXxexaAjwLhvpo',
  birthing: '2PACX-1vRwHeUBQvFrhdcIyes8vWGB3Mt_v8Fl_sj4iEilHbh5FJIqEs6CxY77JqirYuLSaKwM0NqqtEiTZnTi',
  blood: '2PACX-1vRdH6frusJM0WBHrG8FXCVBlEg_72kni5ACecslSJBHn1QqVkas5WxY6b0ehZDNhHJ0uRBnJ0R_JX_s',
  cancer: '2PACX-1vT-TyFkys15FYNRCuWzbL8cjOV4Z6CITnuiH1Y_a8njw9c6QtsbDOsGCR4uLfkqinikbfZmt2_1sIsf',
  clinicalLab: '2PACX-1vSgHqO86ff92RfVCSUH1wFXLBYqm9uQLB64EelB1U6fizGWb0LufoFDSN41JvweCHRAJx3B0KLo2Y7I',
  dialysis: '2PACX-1vR0T_5LKHV8soNilfnxsjd5ImQ_CzB9MFYJPH2jHOyoxIVT7Kz2guLYeKiAliOCezKj-7su307sB4an',
  drugTesting: '2PACX-1vTnhRA0Tgo50k6ecFeKQNiOT8GMoDSkA4BVjOVNx9fUC9gMjcXsZF1dzCNXHZcJy74Ry6Zdr5SRw6os',
  hospitals: '2PACX-1vSzVqrbHHGuOuouvS9WR2un2Q_AZ4SEw5x5F9npaW9xFtV0OV0T70_-NybWKJUTpRS2wiCk9VH5cxMV',
};

/**
 * Each tab we actually read. `summary` tabs are deliberately absent -- they hold
 * regional counts, not facilities.
 */
const TABS = [
  { source: 'ambulatory', label: 'Ambulatory Surgical Clinics', url: sheet(HFSRB.ambulatory, '1149067199'), tab: 'government' },
  { source: 'ambulatory', label: 'Ambulatory Surgical Clinics', url: sheet(HFSRB.ambulatory, '325136124'), tab: 'private' },
  { source: 'birthing', label: 'Birthing Home Facilities', url: sheet(HFSRB.birthing, '1807163672'), tab: 'government' },
  { source: 'birthing', label: 'Birthing Home Facilities', url: sheet(HFSRB.birthing, '330429063'), tab: 'private' },
  { source: 'blood', label: 'Blood Service Facilities', url: sheet(HFSRB.blood, '1067480363'), tab: 'government' },
  { source: 'blood', label: 'Blood Service Facilities', url: sheet(HFSRB.blood, '1846885471'), tab: 'private' },
  { source: 'cancer', label: 'Cancer Treatment Facilities', url: sheet(HFSRB.cancer, '1227203781'), tab: 'government-hospital-based' },
  { source: 'cancer', label: 'Cancer Treatment Facilities', url: sheet(HFSRB.cancer, '1974858609'), tab: 'private-non-hospital-based' },
  { source: 'cancer', label: 'Cancer Treatment Facilities', url: sheet(HFSRB.cancer, '640098549'), tab: 'private-hospital-based' },
  { source: 'clinicalLab', label: 'Clinical Laboratories', url: sheet(HFSRB.clinicalLab, '1729206860'), tab: 'government' },
  { source: 'clinicalLab', label: 'Clinical Laboratories', url: sheet(HFSRB.clinicalLab, '1377153079'), tab: 'private' },
  { source: 'dialysis', label: 'Free-Standing Dialysis Clinics', url: sheet(HFSRB.dialysis, '1094125951'), tab: 'government' },
  { source: 'dialysis', label: 'Free-Standing Dialysis Clinics', url: sheet(HFSRB.dialysis, '1397518050'), tab: 'private' },
  { source: 'drugTesting', label: 'Accredited Drug Testing Laboratories', url: sheet(HFSRB.drugTesting, '2073052033'), tab: 'government' },
  { source: 'drugTesting', label: 'Accredited Drug Testing Laboratories', url: sheet(HFSRB.drugTesting, '722170213'), tab: 'private' },
  { source: 'hospitals', label: 'Government and Private Hospitals', url: sheet(HFSRB.hospitals, '618835953'), tab: 'government' },
  { source: 'hospitals', label: 'Government and Private Hospitals', url: sheet(HFSRB.hospitals, '935520484'), tab: 'private' },
];

/**
 * Column headers vary between sheets and carry typos that exist in the
 * published files (`SERVCE  CAPABILITY`, the double space included). Match
 * loosely on a normalised header rather than pinning exact strings.
 */
const COLUMN_ALIASES = {
  nhfrCode: ['nhfr code', 'accreditation no'],
  name: ['name of facility', 'name of hospital', 'name of clinic', 'facility name'],
  city: ['city/ municipality', 'city/municipality'],
  address: ['bldg or house no., street, brgy (as applicable)', 'complete address', 'address'],
  contact: ['contact nos.', 'contact no.', 'contact number', 'telno'],
  mobile: ['mobileno'],
  email: ['e-mail address', 'email address', 'emailadr', 'email'],
  serviceCapability: ['servce capability', 'service capability', 'servce capability (category)', 'class'],
  addOns: ['add-ons services', 'add-ons service', 'services', 'service'],
  validUntil: ['validity until', 'valid until'],
  licenseNo: ['licensed no.', 'license no.', 'licence no.', 'accreditation no'],
};

const normHeader = (h) => String(h || '').replace(/\s+/g, ' ').trim().toLowerCase();

/** Digits only, leading 0/63 stripped -- so 09985469453 == 9985469453 == +63 998 546 9453. */
function phoneKey(value) {
  let d = String(value || '').replace(/\D/g, '');
  if (d.startsWith('63')) d = d.slice(2);
  if (d.startsWith('0')) d = d.slice(1);
  return d;
}

/** Every phone-shaped run of digits in a free-text cell. Cells hold 1-3 numbers. */
function phoneKeys(value) {
  return String(value || '')
    .split(/[,;/\n]+/)
    .map(phoneKey)
    .filter((d) => d.length >= 7);
}

function nameKey(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[‘’ʼ']/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\b(inc|incorporated|corp|corporation|co|ltd|the)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/** RFC4180-ish parser: quoted fields, doubled quotes, newlines inside cells. */
function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (quoted) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else quoted = false;
      } else field += c;
      continue;
    }
    if (c === '"') quoted = true;
    else if (c === ',') {
      row.push(field);
      field = '';
    } else if (c === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (c !== '\r') field += c;
  }
  if (field.length || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function fetchCached(url, key) {
  fs.mkdirSync(CACHE, { recursive: true });
  const file = path.join(CACHE, `${key}.csv`);
  if (!REFRESH && fs.existsSync(file)) return fs.readFileSync(file, 'utf8');
  const res = await fetch(url, { redirect: 'follow' });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const text = await res.text();
  fs.writeFileSync(file, text, 'utf8');
  return text;
}

/** Rows for one tab, keyed by our column aliases, filtered to Legazpi. */
function extractLegazpi(csvText) {
  const rows = parseCsv(csvText);
  if (!rows.length) return { columns: {}, records: [] };
  const header = rows[0].map(normHeader);
  const columns = {};
  for (const [field, aliases] of Object.entries(COLUMN_ALIASES)) {
    const idx = header.findIndex((h) => aliases.includes(h));
    if (idx !== -1) columns[field] = idx;
  }
  const records = [];
  for (const row of rows.slice(1)) {
    const joined = row.join(' ').toUpperCase();
    // "Legaspi" also matches Legaspi Village, Makati -- require an Albay signal.
    if (!/LEGAZPI|LEGASPI/.test(joined)) continue;
    if (!/ALBAY|REGION 5|BICOL/.test(joined)) continue;
    const rec = { _row: row };
    for (const [field, idx] of Object.entries(columns)) rec[field] = (row[idx] || '').trim();
    records.push(rec);
  }
  return { columns, records };
}

async function loadSources() {
  const bySource = {};
  for (const tab of TABS) {
    const key = `${tab.source}-${tab.tab}`;
    const entry = (bySource[tab.source] ||= { label: tab.label, tabs: [], records: [], columns: {} });
    try {
      const text = await fetchCached(tab.url, key);
      const { columns, records } = extractLegazpi(text);
      records.forEach((r) => {
        r._tab = tab.tab;
        r._source = tab.source;
      });
      entry.records.push(...records);
      entry.columns = { ...entry.columns, ...columns };
      entry.tabs.push({ tab: tab.tab, ok: true, matched: records.length });
    } catch (err) {
      entry.tabs.push({ tab: tab.tab, ok: false, error: err.message });
    }
  }
  return bySource;
}

/** Find the published rows for one of our facilities: NHFR code first, then name. */
function matchFacility(facility, bySource) {
  const code = String(facility.doh_code || '').replace(/^DOH0*/i, '').replace(/^0+/, '');
  const key = nameKey(facility.name);
  const shortKey = nameKey(facility.short_name);
  const hits = [];
  for (const [source, entry] of Object.entries(bySource)) {
    for (const rec of entry.records) {
      const recCode = String(rec.nhfrCode || '').replace(/^DOH0*/i, '').replace(/^0+/, '');
      const recName = nameKey(rec.name);
      let how = null;
      if (code && recCode && code === recCode) how = 'nhfr-code';
      else if (recName && (recName === key || recName === shortKey)) how = 'name';
      else if (recName && key && (recName.includes(key) || key.includes(recName)) && key.length > 8) how = 'name-partial';
      if (how) hits.push({ source, label: entry.label, how, rec });
    }
  }
  return hits;
}

function auditFacility(facility, hits) {
  const findings = [];
  const publishedPhones = new Set();
  const publishedEmails = new Set();
  let anyServices = null;

  for (const hit of hits) {
    for (const f of ['contact', 'mobile']) {
      phoneKeys(hit.rec[f]).forEach((d) => publishedPhones.add(d));
    }
    String(hit.rec.email || '')
      .split(/[,;/\s]+/)
      .map((e) => e.trim().toLowerCase())
      .filter((e) => e.includes('@'))
      .forEach((e) => publishedEmails.add(e));
    const svc = [hit.rec.serviceCapability, hit.rec.addOns].filter(Boolean).join(' | ').trim();
    if (svc) anyServices = anyServices ? `${anyServices} || ${svc}` : svc;
  }

  const contact = facility.contact || {};
  for (const field of ['landline', 'mobile']) {
    const raw = contact[field];
    if (!raw || /^n\/?a$/i.test(raw.trim())) continue;
    const ours = phoneKeys(raw);
    if (!ours.length) continue;
    const traced = ours.filter((d) => publishedPhones.has(d));
    findings.push({
      field: `contact.${field}`,
      value: raw,
      status: !hits.length ? 'no-source-row' : traced.length === ours.length ? 'traced' : traced.length ? 'partial' : 'untraced',
      published: [...publishedPhones],
    });
  }

  const email = (contact.email || '').trim().toLowerCase();
  if (email && !/^n\/?a$/i.test(email)) {
    findings.push({
      field: 'contact.email',
      value: contact.email,
      status: !hits.length ? 'no-source-row' : publishedEmails.has(email) ? 'traced' : 'untraced',
      published: [...publishedEmails],
    });
  }

  findings.push({
    field: 'services',
    value: (facility.services || []).join(' | '),
    status: anyServices ? 'source-publishes-services' : hits.length ? 'source-has-no-services-column' : 'no-source-row',
    published: anyServices ? [anyServices] : [],
  });

  if (Object.prototype.hasOwnProperty.call(facility, 'emergency_24_7')) {
    findings.push({
      field: 'emergency_24_7',
      value: String(facility.emergency_24_7),
      status: 'no-source-column',
      published: [],
    });
  }

  return findings;
}

async function main() {
  const data = JSON.parse(fs.readFileSync(DATA, 'utf8'));
  const bySource = await loadSources();

  const report = [];
  for (const facility of data.facilities) {
    const hits = matchFacility(facility, bySource);
    report.push({
      id: facility.id,
      name: facility.name,
      category: facility.category,
      doh_code: facility.doh_code || null,
      matched: hits.map((h) => ({ source: h.source, how: h.how, name: h.rec.name })),
      findings: auditFacility(facility, hits),
    });
  }

  if (AS_JSON) {
    console.log(JSON.stringify({ generated: new Date().toISOString(), sources: bySource ? Object.keys(bySource) : [], report }, null, 2));
    return;
  }

  console.log('SOURCE FETCH');
  for (const [source, entry] of Object.entries(bySource)) {
    for (const t of entry.tabs) {
      console.log(`  ${source.padEnd(12)} ${t.tab.padEnd(28)} ${t.ok ? `ok, ${t.matched} Legazpi rows` : `FAILED: ${t.error}`}`);
    }
  }

  const tally = {};
  console.log('\nPER-FACILITY TRACEABILITY');
  for (const r of report) {
    const flagged = r.findings.filter((f) => f.status !== 'traced');
    if (!flagged.length) continue;
    console.log(`\n  ${r.id}  ${r.name}`);
    console.log(`    matched: ${r.matched.length ? r.matched.map((m) => `${m.source}(${m.how})`).join(', ') : 'NO SOURCE ROW'}`);
    for (const f of flagged) {
      tally[f.status] = (tally[f.status] || 0) + 1;
      console.log(`    [${f.status}] ${f.field} = ${f.value.slice(0, 90)}`);
      if (f.published.length) console.log(`        published: ${f.published.join(' , ').slice(0, 200)}`);
    }
  }

  console.log('\nTALLY');
  for (const [status, n] of Object.entries(tally).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(n).padStart(4)}  ${status}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
