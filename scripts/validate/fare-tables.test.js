/**
 * Checks assets/js/fare-calc.js against the distance tables printed on the
 * LTFRB fare guides, each of which is linked from data/transport-fares.json.
 *
 * The point is not to test arithmetic. It is that the numbers a commuter sees
 * on this site must equal the numbers on the government document they can pull
 * up next to it. Every expectation below is a row transcribed from a published
 * table; if a rule in data/transport-fares.json is edited wrongly, this fails.
 *
 *   node --test scripts/validate/fare-tables.test.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..');
const FareCalc = require(path.join(ROOT, 'assets', 'js', 'fare-calc.js'));
const fares = JSON.parse(fs.readFileSync(path.join(ROOT, 'data', 'transport-fares.json'), 'utf8'));

function ruleFor(id) {
  for (const g of fares.groups) {
    const c = g.classes.find((x) => x.id === id);
    if (c) return c.rule;
  }
  throw new Error('No fare class "' + id + '" in transport-fares.json');
}

/** [km, regular, discounted] rows copied from the published guides. */
const TABLES = {
  // PUJ General Fare Guide, effective 8 October 2023.
  'puj-traditional': [
    [1, 13.0, 10.5],
    [4, 13.0, 10.5],
    [5, 14.75, 11.75],
    [7, 18.5, 14.75],
    [14, 31.0, 24.75],
    [25, 50.75, 40.75],
    [50, 95.75, 76.75],
  ],
  // Non-Aircon Modern and Electric PUJ General Fare Guide.
  'puj-modern-nonaircon': [
    [4, 15.0, 12.0],
    [5, 16.75, 13.5],
    [20, 43.75, 35.0],
    [50, 97.75, 78.25],
  ],
  // Aircon Modern and Electric PUJ General Fare Guide.
  'puj-modern-aircon': [
    [4, 15.0, 12.0],
    [5, 17.25, 13.75],
    [20, 50.25, 40.25],
    [50, 116.25, 93.0],
  ],
  // PUB (Ordinary) General Fare Guide - Provincial, effective 3 October 2022.
  'pub-provincial-ordinary': [
    [5, 11.0, 8.75],
    [10, 20.5, 16.5],
    [100, 191.5, 153.25],
    [600, 1141.5, 913.25],
  ],
  // PUB (Regular Aircon) - Provincial.
  'pub-provincial-aircon': [
    [5, 10.5, 8.5],
    [100, 210.0, 168.0],
    [600, 1260.0, 1008.0],
  ],
  // PUB (Super Deluxe) - Provincial.
  'pub-provincial-superdeluxe': [
    [5, 11.75, 9.5],
    [100, 235.0, 188.0],
    [600, 1410.0, 1128.0],
  ],
  // PUB (Luxury) - Provincial.
  'pub-provincial-luxury': [
    [5, 14.5, 11.5],
    [100, 290.0, 232.0],
    [600, 1740.0, 1392.0],
  ],
  // PUB (Ordinary) General Fare Guide - Metro Manila.
  'pub-city-ordinary': [
    [5, 13.0, 10.5],
    [6, 15.25, 12.25],
    [30, 69.25, 55.5],
    [60, 136.75, 109.5],
  ],
  // PUB (Aircon) General Fare Guide - Metro Manila.
  'pub-city-aircon': [
    [5, 15.0, 12.0],
    [6, 17.75, 14.0],
    [30, 81.25, 65.0],
    [60, 160.75, 128.5],
  ],
};

for (const [id, rows] of Object.entries(TABLES)) {
  test(`${id} matches the published fare table`, () => {
    const rule = ruleFor(id);
    for (const [km, regular, discounted] of rows) {
      assert.strictEqual(
        FareCalc.fare(rule, km, false),
        regular,
        `${id}: ${km} km regular should be ${regular}`
      );
      assert.strictEqual(
        FareCalc.fare(rule, km, true),
        discounted,
        `${id}: ${km} km discounted should be ${discounted}`
      );
    }
  });
}

test('UV Express charges per kilometre with a 20% discount', () => {
  const rule = ruleFor('uv-traditional');
  assert.strictEqual(FareCalc.fare(rule, 10, false), 24.0);
  assert.strictEqual(FareCalc.fare(rule, 10, true), 19.25); // 24 * 0.8 = 19.20 -> 19.25
});

test('Taxi applies flag-down plus distance plus time', () => {
  const rule = ruleFor('taxi');
  // 50.00 + 13.50*5 + 2.00*10 = 137.50
  assert.strictEqual(FareCalc.fare(rule, 5, false, 10), 137.5);
});

test('TNVS sedan matches the published flag-down and rates', () => {
  const rule = ruleFor('tnvs-sedan');
  // 45.00 + 15.00*8 + 2.00*12 = 189.00
  assert.strictEqual(FareCalc.fare(rule, 8, false, 12), 189.0);
});

test('Tricycle follows the Tamang Singil city-wide fare', () => {
  const rule = ruleFor('tricycle');
  // Regular: P12.00 for the first 2 km, then P3.00 per km.
  assert.strictEqual(FareCalc.fare(rule, 1, false), 12.0);
  assert.strictEqual(FareCalc.fare(rule, 2, false), 12.0);
  assert.strictEqual(FareCalc.fare(rule, 3, false), 15.0);
  assert.strictEqual(FareCalc.fare(rule, 5, false), 21.0);
  // Discounted: P10.00 for the first 1 km, then P1.50 per km. The discounted
  // base distance is shorter than the regular one, which is the whole reason
  // discountedBaseKm exists.
  assert.strictEqual(FareCalc.fare(rule, 1, true), 10.0);
  assert.strictEqual(FareCalc.fare(rule, 2, true), 11.5);
  assert.strictEqual(FareCalc.fare(rule, 5, true), 16.0);
});

test('Padyak is charged on the same schedule as a tricycle', () => {
  assert.deepStrictEqual(ruleFor('padyak'), ruleFor('tricycle'));
});

test('fares are always a multiple of 25 centavos', () => {
  for (const g of fares.groups) {
    for (const c of g.classes) {
      for (let km = 1; km <= 60; km++) {
        const v = FareCalc.fare(c.rule, km, false, 10);
        assert.ok(
          Math.abs(v / 0.25 - Math.round(v / 0.25)) < 1e-9,
          `${c.id} at ${km} km produced ${v}, not a 25-centavo multiple`
        );
      }
    }
  }
});
