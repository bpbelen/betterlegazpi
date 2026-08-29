#!/usr/bin/env node
/**
 * build-transport-geometry.js
 *
 * Generates data/transport-routes.geojson from the street sequences in
 * data/transport-routes.json.
 *
 * This is an AUTHORING tool, not a runtime dependency. It runs by hand when the
 * routing plan changes, and its output is committed. The published page never
 * calls a routing or geocoding service — it just reads the committed GeoJSON.
 *
 *   1. Resolve each stop name to a coordinate, using OSM extracts cached in
 *      scratch/geo/ (roads.json, pois.json) plus the alias table below.
 *   2. Chain the candidates: where a name matches several OSM features (long
 *      streets are split into many ways), pick the one nearest the previously
 *      chosen point, so the waypoints trace a coherent path.
 *   3. Ask OSRM for a road-following line through those waypoints.
 *   4. Write one LineString per direction, keyed "<routeId>:<directionId>".
 *
 * Every skipped waypoint is recorded on the feature. A line whose waypoints
 * were partly skipped is a first draft to be checked against the source slide,
 * not a fact.
 *
 * Usage:
 *   node scripts/data/build-transport-geometry.js            # write the file
 *   node scripts/data/build-transport-geometry.js --dry-run  # report only
 *
 * Refresh the OSM cache first if the area has changed - see docs/transport-geometry.md.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const CACHE = path.join(ROOT, 'scratch', 'geo');
const SRC = path.join(ROOT, 'data', 'transport-routes.json');
const OUT = path.join(ROOT, 'data', 'transport-routes.geojson');
const OSRM = 'https://router.project-osrm.org/route/v1/driving/';

const DRY = process.argv.includes('--dry-run');

/* ── names that are not points ───────────────────────────────────────────── */

/**
 * Corridors and instructions. "AH 26" is the Asian Highway - hundreds of
 * kilometres long, so a single coordinate for it is meaningless. These are
 * implied by routing between the real waypoints either side.
 */
const NOT_A_POINT = new Set(['AH 26', 'U-turn']);

/**
 * Named in the routing plan but absent from OpenStreetMap. Skipped as
 * waypoints rather than guessed at: a fabricated coordinate would put a
 * confident-looking line through a street we cannot actually locate.
 * Removing one is a matter of adding it to OSM, or supplying a coordinate here
 * from a surveyed source.
 */
const UNMAPPED = new Set([
  'Gov. Forbes St.',
  'Elizondo St.',
  'Arquiga St.',
  'Capantawan Rd.',
  'Alternative Rd.',
  'Terminal Access Rd.',
  'Legazpi City - Tiwi Coastal Rd.',
  'Legazpi City Market (back portion)',
  'Arimbay Chapel',
  'Oas Proper (National Highway)',
  'Ligao City Proper (National Highway)',
]);

/**
 * Where the plan and OSM use different names for the same thing. Values are
 * normalised OSM names. Approximations are commented - they place a waypoint
 * near, not exactly on, what the plan names.
 */
const ALIAS = {
  'shell daraga': 'daraga shell gasoline station',
  // norm() strips parentheticals, so these keys are the post-strip form.
  'old legazpi public market': 'ayala malls legazpi',
  // Several Petron stations are mapped and none is named for its town; the
  // chain picks whichever is nearest the preceding waypoint, which for these
  // routes is the Daraga one.
  'petron daraga': 'petron',
  'quezon avenue going to ayala mall': 'quezon avenue',
  'rizal avenue going to daraga': 'rizal avenue',
  'rizal street from daraga': 'rizal avenue',
  'rizal street': 'rizal avenue',
  'albay capitol': 'albay provincial capitol',
  'imelda roces avenue': 'imelda c roces avenue',
  'ramon a santos street': 'ramon santos street',
  'general luna': 'general luna street',
  'bicol 630 road': 'bicol 630',
  'quezon avenue extension': 'quezon avenue',
  'legazpi city grand terminal': 'legazpi grand central terminal',
  'sm legazpi city': 'sm city legazpi',
  'dunkin donut': 'dunkin donuts',
  'f aquende drive': 'captain fermin aquende drive',
  'bariada road': 'barriada road', // OSM spelling
  'r rosario street': 'rosario street',
  'landco road': 'landco access road', // approximation: only the access road is mapped
  'landco business park entrance': 'landco access road', // approximation
  'imperial court subdivision 2': 'imperial court subd i', // approximation: only Subd I is mapped
  'gogon bonot bypass road': 'gogon bogtong bypass road', // OSM names the adjacent barangay
  'guinobatan proper': 'guinobatan poblacion road',
  'polangui integrated terminal': 'polangui national road', // approximation
  'circumferential road ravalo machine shop  auto supply': 'circumferential road',
  'f imperial street cross': 'f imperial street',
};

/* ── normalisation ───────────────────────────────────────────────────────── */

const ABBR = [
  [/\bave\.?\b/g, 'avenue'],
  [/\bst\.?\b/g, 'street'],
  [/\brd\.?\b/g, 'road'],
  [/\bdr\.?\b/g, 'drive'],
  [/\bblvd\.?\b/g, 'boulevard'],
  [/\bsubd\.?\b/g, 'subdivision'],
  [/\bext\.?\b/g, 'extension'],
  [/\bgen\.?\b/g, 'general'],
  [/\bgov\.?\b/g, 'governor'],
];

function norm(s) {
  let t = String(s)
    .toLowerCase()
    .replace(/\(.*?\)/g, ' ')
    .replace(/[.,'’]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  ABBR.forEach(function (pair) {
    t = t.replace(pair[0], pair[1]);
  });
  return t.replace(/\s+/g, ' ').trim();
}

/* ── candidate index ─────────────────────────────────────────────────────── */

function loadCache(file) {
  const p = path.join(CACHE, file);
  if (!fs.existsSync(p)) {
    console.error(
      `Missing OSM cache ${p}.\n` + 'Fetch it from Overpass first — see docs/transport-geometry.md.'
    );
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(p, 'utf8')).elements || [];
}

const index = new Map();
function addCandidate(name, lat, lon) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return;
  const k = norm(name);
  if (!k) return;
  if (!index.has(k)) index.set(k, []);
  index.get(k).push({ lat: lat, lon: lon });
}

loadCache('roads.json').forEach(function (e) {
  if (e.center) addCandidate(e.tags.name, e.center.lat, e.center.lon);
});
loadCache('pois.json').forEach(function (e) {
  const c = e.center || e;
  addCandidate(e.tags.name, c.lat, c.lon);
});

function candidatesFor(stop) {
  const key = ALIAS[norm(stop)] || norm(stop);
  return index.get(key) || null;
}

/* ── geometry helpers ────────────────────────────────────────────────────── */

function dist(a, b) {
  const dx = a.lon - b.lon;
  const dy = a.lat - b.lat;
  return Math.sqrt(dx * dx + dy * dy);
}

/** Pick one coordinate per stop, each nearest to the one chosen before it. */
function chain(stops) {
  const used = [];
  const skipped = [];
  let anchor = null;

  // Anchor on the first stop that resolves to exactly one candidate; that is
  // the least ambiguous point in the sequence.
  for (let i = 0; i < stops.length && !anchor; i++) {
    const c = candidatesFor(stops[i]);
    if (c && c.length === 1) anchor = c[0];
  }

  stops.forEach(function (stop) {
    if (NOT_A_POINT.has(stop)) {
      skipped.push({ stop: stop, why: 'corridor or instruction, not a point' });
      return;
    }
    if (UNMAPPED.has(stop)) {
      skipped.push({ stop: stop, why: 'not present in OpenStreetMap' });
      return;
    }
    const cands = candidatesFor(stop);
    if (!cands || !cands.length) {
      skipped.push({ stop: stop, why: 'no match in the OSM extract' });
      return;
    }
    let pick = cands[0];
    const ref = used.length ? used[used.length - 1].pt : anchor;
    if (ref && cands.length > 1) {
      pick = cands.reduce(function (best, c) {
        return dist(c, ref) < dist(best, ref) ? c : best;
      }, cands[0]);
    }
    used.push({ stop: stop, pt: pick });
  });

  return { used: used, skipped: skipped };
}

async function osrmRoute(points) {
  const coords = points
    .map(function (p) {
      return p.lon.toFixed(6) + ',' + p.lat.toFixed(6);
    })
    .join(';');
  const url = OSRM + coords + '?overview=full&geometries=geojson&continue_straight=true';
  const res = await fetch(url);
  if (!res.ok) throw new Error('OSRM HTTP ' + res.status);
  const body = await res.json();
  if (body.code !== 'Ok' || !body.routes || !body.routes.length) {
    throw new Error('OSRM: ' + body.code + ' ' + (body.message || ''));
  }
  return {
    // 5 decimal places is roughly one metre — far finer than a jeepney route
    // needs, and it cuts the committed file by more than half. OSRM's raw 6
    // decimals only pad the payload every viewer has to download.
    coordinates: body.routes[0].geometry.coordinates.map(function (c) {
      return [Number(c[0].toFixed(5)), Number(c[1].toFixed(5))];
    }),
    distance: body.routes[0].distance,
  };
}

/* ── main ────────────────────────────────────────────────────────────────── */

(async function main() {
  const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const features = [];
  const report = [];

  for (const route of data.routes) {
    for (const dir of route.directions) {
      const key = route.id + ':' + dir.id;
      const picked = chain(dir.stops);

      if (picked.used.length < 2) {
        report.push({ key: key, status: 'SKIPPED', detail: 'fewer than two usable waypoints' });
        continue;
      }

      // OSRM caps the number of coordinates per request; these routes are well
      // under it, but guard anyway rather than fail opaquely.
      const pts = picked.used.map(function (u) {
        return u.pt;
      });
      if (pts.length > 100) {
        report.push({ key: key, status: 'SKIPPED', detail: 'too many waypoints' });
        continue;
      }

      try {
        const line = await osrmRoute(pts);
        features.push({
          type: 'Feature',
          properties: {
            key: key,
            routeId: route.id,
            directionId: dir.id,
            label: route.name + ' — ' + dir.label,
            color: dir.color,
            waypointsUsed: picked.used.length,
            waypointsSkipped: picked.skipped.map(function (s) {
              return s.stop;
            }),
            distanceMetres: Math.round(line.distance),
            generatedBy: 'scripts/data/build-transport-geometry.js',
          },
          geometry: { type: 'LineString', coordinates: line.coordinates },
        });
        report.push({
          key: key,
          status: picked.skipped.length ? 'DRAFT' : 'OK',
          detail:
            picked.used.length +
            ' waypoints, ' +
            (line.distance / 1000).toFixed(1) +
            ' km' +
            (picked.skipped.length
              ? ', skipped: ' + picked.skipped.map((s) => s.stop).join(', ')
              : ''),
        });
      } catch (e) {
        report.push({ key: key, status: 'FAILED', detail: e.message });
      }

      // Be a good citizen on a free public endpoint.
      await new Promise(function (r) {
        setTimeout(r, 400);
      });
    }
  }

  const counts = { OK: 0, DRAFT: 0, FAILED: 0, SKIPPED: 0 };
  report.forEach(function (r) {
    counts[r.status]++;
    console.log(r.status.padEnd(8) + r.key + '  ' + r.detail);
  });
  console.log(
    `\n${counts.OK} complete, ${counts.DRAFT} draft (some waypoints skipped), ` +
      `${counts.FAILED} failed, ${counts.SKIPPED} not attempted.`
  );

  if (DRY) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  // Written compact, not pretty-printed: this file is machine-generated, every
  // viewer downloads it, and indenting a quarter-million coordinates purely for
  // human reading costs more than it is worth. Read it through the review tool
  // or the map, not by eye.
  fs.writeFileSync(
    OUT,
    JSON.stringify({
      type: 'FeatureCollection',
      note:
        'Generated by scripts/data/build-transport-geometry.js from the street ' +
        'sequences in transport-routes.json, snapped to roads via OSRM over ' +
        'OpenStreetMap data (ODbL). Features carrying waypointsSkipped are drafts: ' +
        'the named place could not be located, so the line through that segment is ' +
        'the routing engine guess, not the published route.',
      features: features,
    }) + '\n'
  );
  console.log('\nWrote ' + path.relative(ROOT, OUT) + ' (' + features.length + ' features).');
})();
