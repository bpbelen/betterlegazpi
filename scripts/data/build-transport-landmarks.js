#!/usr/bin/env node
/**
 * build-transport-landmarks.js
 *
 * Enriches data/transport-routes.json from the generated geometry: adds a
 * `landmarks` array (recognisable places the route actually passes) and a
 * `distanceKm` (how long the leg is), both per direction.
 *
 * distanceKm is what lets the page quote the correct fare for a route, since
 * every published fare rule is a function of distance.
 *
 * Why generated rather than written by hand: a landmark list is only useful if
 * it is true, and "does this jeepney pass the hospital?" is a question about
 * geometry, not memory. So landmarks are taken from OpenStreetMap POIs that lie
 * within a set distance of the route line we already generated. Nothing is
 * invented, and every entry is attributable to OSM.
 *
 * The street sequences themselves are never touched — those come from the
 * City's routing plan and are the authoritative content. This only appends a
 * derived convenience field.
 *
 * Usage:
 *   node scripts/data/build-transport-landmarks.js
 *   node scripts/data/build-transport-landmarks.js --dry-run
 *
 * Run after build-transport-geometry.js, which produces the lines this reads.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const SRC = path.join(ROOT, 'data', 'transport-routes.json');
const GEO = path.join(ROOT, 'data', 'transport-routes.geojson');
const POIS = path.join(ROOT, 'scratch', 'geo', 'pois.json');

const DRY = process.argv.includes('--dry-run');

/**
 * How close a POI must be to the route line to count as "on the route".
 * Generous because Overpass gives one centre point per feature, and a mall or
 * a campus centre can sit a long way back from the road it fronts.
 */
const MAX_METRES = 250;
/** Cap per route, so a card stays scannable. */
const MAX_PER_ROUTE = 10;
/** Cap per category, so one dense category cannot fill the whole list. */
const MAX_PER_KIND = 3;

/**
 * Only categories a passenger would actually navigate by, in priority order —
 * and priority, not proximity, is what decides the list. Ranking purely by
 * distance fills every route with whichever bank branch happens to sit closest
 * to the kerb, while burying the mall and the terminal people actually use.
 *
 * Banks are excluded outright: there are dozens, they cluster on the same two
 * streets, and nobody says "get off at the BDO".
 */
const CATEGORIES = [
  { test: (t) => t.shop === 'mall' || t.shop === 'department_store', label: 'Mall' },
  { test: (t) => t.amenity === 'bus_station', label: 'Terminal' },
  // Campuses rank high deliberately: students are the heaviest daily jeepney
  // users, and "the one that passes Bicol University" is how the route is
  // actually described. Ranked below malls only because there are fewer.
  { test: (t) => t.amenity === 'university' || t.amenity === 'college', label: 'University' },
  { test: (t) => t.amenity === 'hospital', label: 'Hospital' },
  { test: (t) => t.amenity === 'school', label: 'School' },
  { test: (t) => t.amenity === 'marketplace', label: 'Market' },
  { test: (t) => t.amenity === 'townhall' || t.office === 'government', label: 'Government' },
  { test: (t) => t.tourism === 'attraction' || t.tourism === 'museum', label: 'Landmark' },
  { test: (t) => t.amenity === 'place_of_worship', label: 'Church' },
  { test: (t) => t.amenity === 'police' || t.amenity === 'fire_station', label: 'Emergency' },
  { test: (t) => t.amenity === 'fuel', label: 'Fuel station' },
  { test: (t) => t.tourism === 'hotel', label: 'Hotel' },
];

/**
 * Names that are descriptions rather than places. OSM contributors sometimes
 * label a feature by what it is ("Fruit Vendors"), which is useless as a
 * landmark - nobody tells you to get off at the fruit vendors.
 */
const GENERIC_NAMES = new Set([
  'fruit vendors',
  'police',
  'market',
  'public market',
  'terminal',
  'tricycle terminal',
  'chapel',
  'church',
  'school',
  'hospital',
  'clinic',
  // Faculty buildings mapped individually inside a campus. On their own they
  // name no place a passenger could find — the campus is the landmark.
  'college of law',
  'college of medicine',
  'graduate school',
  'open university',
  'high school department',
  'elementary department',
]);

function classify(tags) {
  for (let i = 0; i < CATEGORIES.length; i++) {
    if (CATEGORIES[i].test(tags)) return { kind: CATEGORIES[i].label, rank: i };
  }
  return null;
}

/** Equirectangular approximation — ample at city scale and cheap in a loop. */
function metres(aLat, aLon, bLat, bLon) {
  const R = 6371000;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLon = (((bLon - aLon) * Math.PI) / 180) * Math.cos(((aLat + bLat) / 2 / 180) * Math.PI);
  return Math.sqrt(dLat * dLat + dLon * dLon) * R;
}

function main() {
  if (!fs.existsSync(GEO)) {
    console.error('No data/transport-routes.geojson. Run build-transport-geometry.js first.');
    process.exit(1);
  }
  if (!fs.existsSync(POIS)) {
    console.error('No scratch/geo/pois.json OSM cache. See docs/transport-geometry.md.');
    process.exit(1);
  }

  const data = JSON.parse(fs.readFileSync(SRC, 'utf8'));
  const geo = JSON.parse(fs.readFileSync(GEO, 'utf8'));
  const pois = JSON.parse(fs.readFileSync(POIS, 'utf8')).elements || [];

  const candidates = [];
  pois.forEach((e) => {
    const c = e.center || e;
    const cls = classify(e.tags || {});
    if (!cls || !e.tags.name || typeof c.lat !== 'number') return;
    if (GENERIC_NAMES.has(e.tags.name.trim().toLowerCase())) return;
    candidates.push({ name: e.tags.name, kind: cls.kind, rank: cls.rank, lat: c.lat, lon: c.lon });
  });
  console.log(`${candidates.length} candidate landmarks from OSM.`);

  // Landmarks are per DIRECTION, not per route: the outbound and return legs
  // of these routes follow visibly different streets, so they pass different
  // places. A single route-level list would be wrong for whichever leg it did
  // not describe.
  const lineByKey = {};
  const metresByKey = {};
  geo.features.forEach((f) => {
    lineByKey[f.properties.key] = f.geometry.coordinates;
    metresByKey[f.properties.key] = f.properties.distanceMetres;
  });

  let total = 0;
  const targets = [];
  data.routes.forEach((route) => {
    delete route.landmarks; // was route-level in an earlier revision
    route.directions.forEach((dir) => {
      targets.push({ id: route.id + ':' + dir.id, dir: dir });
    });
  });

  targets.forEach(({ id, dir }) => {
    const line = lineByKey[id];
    if (!line) {
      delete dir.landmarks;
      delete dir.distanceKm;
      console.log(`  ${id}: no geometry, skipped`);
      return;
    }

    if (typeof metresByKey[id] === 'number') {
      dir.distanceKm = Math.round(metresByKey[id] / 100) / 10;
    }

    const near = [];
    candidates.forEach((p) => {
      let best = Infinity;
      for (let i = 0; i < line.length; i += 2) {
        const d = metres(p.lat, p.lon, line[i][1], line[i][0]);
        if (d < best) best = d;
        if (best < 15) break; // close enough; stop scanning
      }
      if (best <= MAX_METRES)
        near.push({ name: p.name, kind: p.kind, rank: p.rank, d: Math.round(best) });
    });

    // Category priority first, distance only as the tie-break within a category.
    const seen = new Set();
    const perKind = {};
    const picked = near
      .sort((a, b) => a.rank - b.rank || a.d - b.d)
      .filter((p) => {
        // OSM carries the same place under slightly different names ("Pacific
        // mall" and "Pacific Mall Legazpi City"); collapse those.
        const k = p.name
          .toLowerCase()
          .replace(/\b(legazpi city|legazpi|daraga|inc\.?|city)\b/g, '')
          .replace(/[^a-z0-9]/g, '');
        if (!k || seen.has(k)) return false;
        seen.add(k);
        // Cap each category, or the ten strongest are all shopping malls and
        // the hospital nobody can find never makes the list.
        perKind[p.kind] = (perKind[p.kind] || 0) + 1;
        return perKind[p.kind] <= MAX_PER_KIND;
      })
      .slice(0, MAX_PER_ROUTE)
      .map((p) => ({ name: p.name, kind: p.kind }));

    dir.landmarks = picked;
    total += picked.length;
    console.log(`  ${id}: ${picked.length} — ${picked.map((p) => p.name).join(', ')}`);
  });

  console.log(`\n${total} landmarks across ${targets.length} directions.`);

  if (DRY) {
    console.log('--dry-run: nothing written.');
    return;
  }
  fs.writeFileSync(SRC, JSON.stringify(data, null, 2) + '\n');
  console.log('Updated data/transport-routes.json');
}

main();
