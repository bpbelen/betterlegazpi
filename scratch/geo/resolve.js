/* Throwaway: match transport-routes.json stop names to OSM features. */
'use strict';
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..', '..');

const roads = JSON.parse(fs.readFileSync(path.join(__dirname, 'roads.json'), 'utf8')).elements;
const pois = JSON.parse(fs.readFileSync(path.join(__dirname, 'pois.json'), 'utf8')).elements;
const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'transport-routes.json'), 'utf8'));

// Names that are corridors or instructions, not points. They are implied by
// routing between the real waypoints either side of them.
const NOT_A_POINT = new Set(['AH 26', 'U-turn']);

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
    .replace(/\(.*?\)/g, ' ') // drop parenthetical qualifiers
    .replace(/[.,'’]/g, '')
    .replace(/ñ/g, 'n')
    .replace(/\s*-\s*/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  ABBR.forEach(([re, to]) => (t = t.replace(re, to)));
  return t.replace(/\s+/g, ' ').trim();
}

// Build candidate index: normalised name -> [{lat, lon, kind, raw}]
const index = new Map();
function add(name, lat, lon, kind) {
  if (typeof lat !== 'number' || typeof lon !== 'number') return;
  const k = norm(name);
  if (!k) return;
  if (!index.has(k)) index.set(k, []);
  index.get(k).push({ lat, lon, kind, raw: name });
}
roads.forEach((e) => e.center && add(e.tags.name, e.center.lat, e.center.lon, 'road'));
pois.forEach((e) => {
  const c = e.center || e;
  add(e.tags.name, c.lat, c.lon, 'poi');
});

// Hand-written aliases for names the plan writes differently from OSM, or that
// OSM does not carry at all. Coordinates here are deliberate decisions, so they
// are listed explicitly rather than guessed at run time.
const ALIAS = {
  'shell daraga': 'daraga shell gasoline station',
  'old legazpi public market ayala mall': 'ayala malls legazpi',
  'quezon avenue going to ayala mall': 'quezon avenue',
  'rizal avenue going to daraga': 'rizal avenue',
  'rizal street from daraga': 'rizal avenue',
  'rizal street': 'rizal avenue',
  'albay capitol': 'albay provincial capitol',
  'imelda c roces avenue': 'imelda roces avenue',
  'ramon a santos street': 'ramon santos street',
  'general luna': 'general luna street',
  'bicol 630': 'bicol 630 road',
  'quezon avenue extension': 'quezon avenue',
  'legazpi city grand terminal': 'legazpi grand central terminal',
  'sm legazpi city': 'sm city legazpi',
  'dunkin donut': "dunkin' donuts",
  'circumferential road ravalo machine shop  auto supply': 'circumferential road',
  'f imperial street cross': 'f imperial street',
  'legazpi city market back portion': 'legazpi city public market',
};

const stops = new Map();
data.routes.forEach((r) =>
  r.directions.forEach((d) => d.stops.forEach((s) => stops.set(s, (stops.get(s) || 0) + 1)))
);

const hit = [];
const miss = [];
for (const [stop, count] of stops) {
  if (NOT_A_POINT.has(stop)) continue;
  const key = ALIAS[norm(stop)] || norm(stop);
  const cands = index.get(key);
  if (cands && cands.length) hit.push({ stop, key, n: cands.length, kind: cands[0].kind });
  else miss.push({ stop, key, count });
}

console.log(`resolved ${hit.length} / ${hit.length + miss.length} stop names\n`);
console.log('UNRESOLVED (need a manual coordinate or a better alias):');
miss
  .sort((a, b) => b.count - a.count)
  .forEach((m) => console.log(`  ${String(m.count).padStart(2)}x  ${m.stop}   [norm: ${m.key}]`));

// Fuzzy suggestions for the misses, to speed up writing aliases.
console.log('\nSUGGESTIONS:');
const keys = [...index.keys()];
miss.forEach((m) => {
  const toks = m.key.split(' ').filter((t) => t.length > 3);
  const near = keys
    .filter((k) => toks.some((t) => k.includes(t)))
    .slice(0, 5);
  if (near.length) console.log(`  ${m.stop} -> ${near.join(' | ')}`);
});
