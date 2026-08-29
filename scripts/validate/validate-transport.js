#!/usr/bin/env node
/**
 * validate-transport.js — checks data/transport-routes.json against
 * data/transport-routes.geojson.
 *
 * The failure this exists to catch: someone adds a route to the JSON when the
 * routing plan changes, and forgets the geometry. The page would then render a
 * perfectly good route card whose map line silently does not exist — which
 * looks like a rendering bug rather than a data gap, and nothing else would
 * report it.
 *
 * Run by hand:  node scripts/validate/validate-transport.js
 * Geometry is optional overall (the page is list-first and works without any
 * map at all), but a geometry file that exists must be complete and consistent.
 *
 * Exit code 1 on any error; warnings alone still exit 0.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const REPO_ROOT = path.resolve(__dirname, '..', '..');
const DATA = path.join(REPO_ROOT, 'data', 'transport-routes.json');
const GEO = path.join(REPO_ROOT, 'data', 'transport-routes.geojson');

// Legazpi City and the Albay towns these routes reach. A coordinate outside
// this box is a lat/lng swap or a bad geocode, not a real jeepney route.
const BBOX = { minLng: 123.0, maxLng: 124.2, minLat: 12.8, maxLat: 13.6 };

const errors = [];
const warnings = [];

function err(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function readJson(file, label) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    err(`${label}: could not read or parse — ${e.message}`);
    return null;
  }
}

const data = readJson(DATA, 'transport-routes.json');
if (!data) {
  console.error(errors.join('\n'));
  process.exit(1);
}

/* ── routes ──────────────────────────────────────────────────────────────── */

const routes = Array.isArray(data.routes) ? data.routes : [];
if (!routes.length) err('transport-routes.json: no routes defined.');

const sourceIds = new Set((data.sources || []).map((s) => s.id));
const operatorKeys = new Set(Object.keys(data.operatorKey || {}));
const seenRouteIds = new Set();
const expectedKeys = new Set();

routes.forEach((route, i) => {
  const where = `route[${i}] ${route.id || '(no id)'}`;

  if (!route.id) err(`${where}: missing id.`);
  else if (seenRouteIds.has(route.id)) err(`${where}: duplicate route id.`);
  else seenRouteIds.add(route.id);

  if (!/^[a-z0-9-]+$/.test(route.id || '')) {
    err(`${where}: id must be a lowercase hyphenated slug (it is used as a URL fragment).`);
  }
  if (!route.name) err(`${where}: missing name.`);
  if (!route.corridor) err(`${where}: missing corridor (used by the filter buttons).`);

  (route.sourceRefs || []).forEach((ref) => {
    if (!sourceIds.has(ref)) err(`${where}: sourceRef "${ref}" is not in sources[].`);
  });

  const dirs = Array.isArray(route.directions) ? route.directions : [];
  if (!dirs.length) err(`${where}: no directions.`);

  const seenDirIds = new Set();
  dirs.forEach((d, j) => {
    const dwhere = `${where} direction[${j}] ${d.id || '(no id)'}`;
    if (!d.id) err(`${dwhere}: missing id.`);
    else if (seenDirIds.has(d.id)) err(`${dwhere}: duplicate direction id within the route.`);
    else seenDirIds.add(d.id);

    if (!d.label) err(`${dwhere}: missing label. Colour alone cannot identify a direction.`);
    if (!/^#[0-9a-fA-F]{6}$/.test(d.color || '')) err(`${dwhere}: color must be a #rrggbb hex.`);
    if (!Array.isArray(d.stops) || d.stops.length < 2) {
      err(`${dwhere}: needs at least two stops — a route is a sequence.`);
    }
    // distanceKm is what the fare on the card is computed from.
    if (d.distanceKm !== undefined && (typeof d.distanceKm !== 'number' || d.distanceKm <= 0)) {
      err(`${dwhere}: distanceKm must be a positive number.`);
    }
    (d.stops || []).forEach((s, k) => {
      if (typeof s !== 'string' || !s.trim()) err(`${dwhere}: stop[${k}] is empty.`);
    });

    if (route.id && d.id) expectedKeys.add(`${route.id}:${d.id}`);
  });

  if (route.franchise) {
    const f = route.franchise;
    if (typeof f.validFranchisedUnits !== 'number') {
      err(`${where}: franchise.validFranchisedUnits must be a number.`);
    }
    if (!f.asOf) err(`${where}: franchise data must carry an "asOf" — undated counts go stale.`);
    Object.keys(f.operators || {}).forEach((k) => {
      if (!operatorKeys.has(k)) warn(`${where}: operator "${k}" has no entry in operatorKey.`);
    });
    const sum = Object.values(f.operators || {}).reduce((a, b) => a + b, 0);
    if (sum !== f.validFranchisedUnits) {
      warn(
        `${where}: operator counts total ${sum} but validFranchisedUnits is ` +
          `${f.validFranchisedUnits}. This may be correct — check the source slide.`
      );
    }
  }
});

/* ── freshness ───────────────────────────────────────────────────────────── */

if (!data.lastVerified) {
  err('transport-routes.json: missing top-level lastVerified.');
} else {
  const [y, m] = String(data.lastVerified).split('-').map(Number);
  if (!y || !m) {
    err(`transport-routes.json: lastVerified "${data.lastVerified}" is not YYYY-MM.`);
  } else {
    const months = (new Date().getFullYear() - y) * 12 + (new Date().getMonth() + 1 - m);
    if (months > 12) {
      warn(
        `Data was last verified ${months} months ago (${data.lastVerified}). ` +
          'Re-check the routing plan against the City before relying on it.'
      );
    }
  }
}

/* ── geometry ────────────────────────────────────────────────────────────── */

if (!fs.existsSync(GEO)) {
  warn(
    'No data/transport-routes.geojson yet — the page renders list-only, which is a ' +
      'valid state. Generate geometry to enable the map.'
  );
} else {
  const geo = readJson(GEO, 'transport-routes.geojson');
  if (geo) {
    const features = Array.isArray(geo.features) ? geo.features : [];
    const seen = new Set();

    features.forEach((f, i) => {
      const key = f.properties && f.properties.key;
      if (!key) {
        err(`geojson feature[${i}]: missing properties.key ("<routeId>:<directionId>").`);
        return;
      }
      if (seen.has(key)) err(`geojson: duplicate feature for "${key}".`);
      seen.add(key);

      if (!expectedKeys.has(key)) {
        err(`geojson: feature "${key}" has no matching route/direction in the JSON.`);
      }

      const g = f.geometry || {};
      if (g.type !== 'LineString') {
        err(`geojson "${key}": geometry must be a LineString, got "${g.type}".`);
        return;
      }
      const coords = g.coordinates || [];
      if (coords.length < 2) err(`geojson "${key}": fewer than two coordinates.`);
      coords.forEach((c, j) => {
        const [lng, lat] = c || [];
        if (typeof lng !== 'number' || typeof lat !== 'number') {
          err(`geojson "${key}" coord[${j}]: not a [lng, lat] number pair.`);
          return;
        }
        if (lng < BBOX.minLng || lng > BBOX.maxLng || lat < BBOX.minLat || lat > BBOX.maxLat) {
          err(
            `geojson "${key}" coord[${j}]: [${lng}, ${lat}] is outside Albay. ` +
              'Most likely the lat and lng are swapped.'
          );
        }
      });
    });

    expectedKeys.forEach((key) => {
      if (!seen.has(key)) {
        err(`geojson: no line for "${key}". The route card will render with no map line.`);
      }
    });
  }
}

/* ── other modes ─────────────────────────────────────────────────────────── */

const MODES = path.join(REPO_ROOT, 'data', 'transport-modes.json');

if (!fs.existsSync(MODES)) {
  warn('No data/transport-modes.json — the page renders jeepney routes only.');
} else {
  const modes = readJson(MODES, 'transport-modes.json');
  if (modes) {
    if (!modes.lastVerified) err('transport-modes.json: missing lastVerified.');

    const seenModes = new Set();
    (modes.modes || []).forEach((m, i) => {
      const where = `mode[${i}] ${m.id || '(no id)'}`;
      if (!m.id) err(`${where}: missing id.`);
      else if (seenModes.has(m.id)) err(`${where}: duplicate mode id.`);
      else seenModes.add(m.id);

      if (!m.name) err(`${where}: missing name.`);
      if (!m.summary) err(`${where}: missing summary — it is the closed-card text.`);
      if (!m.icon) err(`${where}: missing icon.`);

      // A fare people will act on must say where it came from and when.
      if (m.fare) {
        if (!m.fare.source) err(`${where}: fare has no source.`);
        // A published fare must be locatable: either dated, or linked to the
        // issuance. Some city issuances carry no date, so demanding asOf alone
        // would push someone into inventing one.
        if (!m.fare.asOf && !m.fare.url) {
          err(`${where}: fare needs either an asOf date or a url to its issuance.`);
        }
        if (!Array.isArray(m.fare.rows) || !m.fare.rows.length) {
          err(`${where}: fare has no rows.`);
        }
      }

      (m.terminals || []).forEach((t, j) => {
        const tw = `${where} terminal[${j}] ${t.name || '(no name)'}`;
        if (!t.name) err(`${tw}: missing name.`);
        if (typeof t.lat !== 'number' || typeof t.lon !== 'number') {
          err(`${tw}: needs numeric lat/lon to place a map marker.`);
          return;
        }
        if (
          t.lon < BBOX.minLng ||
          t.lon > BBOX.maxLng ||
          t.lat < BBOX.minLat ||
          t.lat > BBOX.maxLat
        ) {
          err(`${tw}: [${t.lon}, ${t.lat}] is outside Albay — lat and lon may be swapped.`);
        }
      });

      (m.apps || []).forEach((a, j) => {
        if (!a.name || !a.url) err(`${where} app[${j}]: needs both a name and a url.`);
      });
    });

    console.log(`Checked ${(modes.modes || []).length} other transport modes.`);
  }
}

/* ── fare rules ──────────────────────────────────────────────────────────── */

const FARES = path.join(REPO_ROOT, 'data', 'transport-fares.json');

if (!fs.existsSync(FARES)) {
  err('No data/transport-fares.json — the page cannot quote a fare without it.');
} else {
  const fares = readJson(FARES, 'transport-fares.json');
  const FareCalc = require(path.join(REPO_ROOT, 'assets', 'js', 'fare-calc.js'));

  if (fares) {
    const seenClasses = new Set();
    (fares.groups || []).forEach((g, i) => {
      if (!g.id) err(`fares group[${i}]: missing id.`);
      if (!g.label) err(`fares group[${i}]: missing label.`);

      (g.classes || []).forEach((c, j) => {
        const where = `fares ${g.id}/${c.id || '(no id)'}`;
        if (!c.id) err(`${where}: missing id.`);
        else if (seenClasses.has(c.id)) err(`${where}: duplicate fare class id.`);
        else seenClasses.add(c.id);

        // A published fare must be traceable to the document it came from.
        if (!c.source || !c.source.title) err(`${where}: fare class has no source title.`);
        if (!c.source || !c.source.issuer) err(`${where}: fare class has no issuer.`);
        // Every rate must be traceable to the issuance on the publisher's own
        // site, not to a copy we host - a copy goes stale silently.
        if (!c.source || !c.source.url) {
          err(`${where}: fare class has no source.url pointing at the issuance.`);
        } else if (!/^https:\/\//.test(c.source.url)) {
          err(`${where}: source.url must be an absolute https link, got "${c.source.url}".`);
        }

        // The rule must actually compute, or the page shows a dash where a
        // peso figure belongs.
        const v = FareCalc.fare(c.rule, 10, false, 15);
        if (typeof v !== 'number' || !isFinite(v) || v <= 0) {
          err(`${where}: rule does not produce a fare (got ${v}).`);
        }
        const d = FareCalc.fare(c.rule, 10, true, 15);
        if (typeof d !== 'number' || d > v) {
          err(`${where}: discounted fare (${d}) is not below the regular fare (${v}).`);
        }
      });
    });

    // Republished contact details need the public-information note beside them.
    const report = fares.report;
    if (!report) {
      err('transport-fares.json: no report block — "who do I complain to" is core content here.');
    } else {
      const hasContacts = (report.groups || []).some((g) => (g.contacts || []).length);
      if (hasContacts && !report.disclaimer) {
        err(
          'transport-fares.json: report publishes contact numbers but has no ' +
            'disclaimer explaining that they are public information.'
        );
      }
      (report.groups || []).forEach((g, i) => {
        if (!g.label) err(`report group[${i}]: missing label.`);
        (g.contacts || []).forEach((c, j) => {
          if (!c.label || !Array.isArray(c.numbers) || !c.numbers.length) {
            err(`report group[${i}] contact[${j}]: needs a label and at least one number.`);
          }
        });
      });
    }

    console.log(`Checked ${seenClasses.size} fare classes.`);
  }
}

/* ── report ──────────────────────────────────────────────────────────────── */

const dirCount = routes.reduce((n, r) => n + (r.directions || []).length, 0);
console.log(`Checked ${routes.length} routes / ${dirCount} directions.`);

warnings.forEach((w) => console.warn(`  warn  ${w}`));
errors.forEach((e) => console.error(`  ERROR ${e}`));

if (errors.length) {
  console.error(`\n${errors.length} error(s).`);
  process.exit(1);
}
console.log(warnings.length ? `\nOK, with ${warnings.length} warning(s).` : '\nOK.');
