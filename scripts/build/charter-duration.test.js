/**
 * Unit tests for charter processing-time arithmetic.
 *
 * Run with `node --test scripts/build/` — deliberately not a Playwright spec, since
 * this is pure arithmetic with no page to load and the Playwright projects would run
 * it once per browser for no benefit.
 *
 * The cases below are taken verbatim from published charters; the reconciliation
 * tests at the bottom are the real proof that the day/hour rule in
 * charter-duration.js matches how the LGU computes its own totals.
 */

const test = require('node:test');
const assert = require('node:assert/strict');

const {
  parseDuration,
  formatDuration,
  normalize,
  sumSteps,
  sumFees,
  compareToStated,
} = require('./charter-duration.js');

const comps = (text) => {
  const { days, hours, minutes } = normalize(parseDuration(text));
  return { days, hours, minutes };
};

test('parses the unit spellings the charters actually use', () => {
  assert.deepEqual(comps('10 minutes'), { days: 0, hours: 0, minutes: 10 });
  assert.deepEqual(comps('20 mins.'), { days: 0, hours: 0, minutes: 20 });
  assert.deepEqual(comps('5 Minutes'), { days: 0, hours: 0, minutes: 5 });
  assert.deepEqual(comps('3 hours'), { days: 0, hours: 3, minutes: 0 });
  assert.deepEqual(comps('1 hr. & 30 Minutes'), { days: 0, hours: 1, minutes: 30 });
  assert.deepEqual(comps('2 days & 1 hr.'), { days: 2, hours: 1, minutes: 0 });
  assert.deepEqual(comps('29 days, 3 hrs. & 20 minutes'), {
    days: 29,
    hours: 3,
    minutes: 20,
  });
});

test('accumulates every duration in a multi-activity cell', () => {
  assert.deepEqual(comps('1 hr/applicant; 30 min/applicant; 7 days'), {
    days: 7,
    hours: 1,
    minutes: 30,
  });
});

test('records a rate qualifier without letting it change the arithmetic', () => {
  const d = parseDuration('1 hr/applicant');
  assert.equal(d.rate, 'applicant');
  assert.equal(d.hours, 1);
});

test('minutes roll into hours, hours never roll into days', () => {
  // 90 minutes is an hour and a half...
  assert.deepEqual(normalize({ days: 0, hours: 0, minutes: 90 }), {
    days: 0,
    hours: 1,
    minutes: 30,
  });
  // ...but 24 hours is not a charter "day", which is a working day of unstated length.
  assert.deepEqual(normalize({ days: 0, hours: 24, minutes: 0 }), {
    days: 0,
    hours: 24,
    minutes: 0,
  });
});

test('reads quantities spelled as words, and the doubled legal form', () => {
  // CCR writes "One hour" and "Two (2) hours" in the same charter.
  assert.deepEqual(comps('One hour'), { days: 0, hours: 1, minutes: 0 });
  assert.deepEqual(comps('THREE (3) Hours'), { days: 0, hours: 3, minutes: 0 });
  assert.deepEqual(comps('ten (10) days notice of posting'), {
    days: 10,
    hours: 0,
    minutes: 0,
  });
});

test('"half day" and "½ Day" are the same quantity', () => {
  // CEO writes it as a word, OCENR as a glyph. If these disagreed, one charter's
  // half day would count and the other's would not.
  assert.deepEqual(comps('half day'), { days: 0.5, hours: 0, minutes: 0 });
  assert.deepEqual(comps('½ Day'), comps('half day'));
});

test('a quantity written twice is counted once', () => {
  // "Two (2) hours" is one duration in two notations, not two hours plus two hours.
  assert.deepEqual(comps('Two (2) hours'), { days: 0, hours: 2, minutes: 0 });
});

test('reads the day qualifiers and hyphenation the charters use', () => {
  // CCR writes posting periods three different ways in the same charter.
  assert.deepEqual(comps('10 calendar days'), { days: 10, hours: 0, minutes: 0 });
  assert.deepEqual(comps('10 working days'), { days: 10, hours: 0, minutes: 0 });
  assert.deepEqual(comps('10-day notice of posting'), { days: 10, hours: 0, minutes: 0 });
});

test('a span the office does not control is not silently counted', () => {
  // "2-5 months" is CCR waiting on the PSA. Months are not a unit we model, so the
  // value is reported as unreadable rather than folded into a total as zero.
  const { unrecognized } = sumSteps([
    { processingTime: '2 hours' },
    { processingTime: 'PSA affirmation is 2-5 months' },
  ]);
  assert.deepEqual(unrecognized, ['PSA affirmation is 2-5 months']);
});

test('reads fractions in both spellings the charters use', () => {
  // OCENR writes its webinars as "2.5 hrs" and its seedling release as "½ Day".
  assert.deepEqual(comps('2.5 hrs'), { days: 0, hours: 2, minutes: 30 });
  assert.deepEqual(comps('1.25 hours'), { days: 0, hours: 1, minutes: 15 });
  assert.deepEqual(comps('½ Day'), { days: 0.5, hours: 0, minutes: 0 });
  assert.deepEqual(comps('1½ hrs.'), { days: 0, hours: 1, minutes: 30 });
});

test('a fractional hour settles into minutes; a fractional day does not', () => {
  // An hour is a defined quantity, so half of one is 30 minutes. A charter day has no
  // stated length, so half of one stays half a day rather than becoming four hours.
  assert.equal(formatDuration(comps('2.5 hrs & 25 minutes')), '2 hrs. & 55 minutes');
  assert.equal(formatDuration(comps('½ day & 30 minutes')), '0.5 days & 30 minutes');
});

test('unrecognized durations are reported, not silently counted as zero', () => {
  const { unrecognized, text } = sumSteps([
    { processingTime: '10 minutes' },
    { processingTime: 'upon availability' },
    { processingTime: null },
  ]);
  assert.deepEqual(unrecognized, ['upon availability']);
  assert.equal(text, '10 minutes');
});

test('formats in the charters house style', () => {
  assert.equal(formatDuration({ days: 29, hours: 3, minutes: 20 }), '29 days, 3 hrs. & 20 minutes');
  assert.equal(formatDuration({ days: 2, hours: 1, minutes: 0 }), '2 days & 1 hr.');
  assert.equal(formatDuration({ days: 0, hours: 0, minutes: 1 }), '1 minute');
  assert.equal(formatDuration({ days: 1, hours: 0, minutes: 0 }), '1 day');
  assert.equal(formatDuration({ days: 0, hours: 0, minutes: 0 }), 'None');
});

test('a small discrepancy reports as small — no borrowing across units', () => {
  // Regression: a -2 minute gap once borrowed an hour and read as "1 hr. & 58 minutes".
  const derived = { days: 16, hours: 2, minutes: 50 };
  const c = compareToStated(derived, '16 days, 2 hrs. & 52 minutes');
  assert.equal(c.agrees, false);
  assert.equal(c.deltaText, '2 minutes');
});

test('gaps that straddle the hour boundary report the real difference', () => {
  // Regression: 45 minutes vs 1 hour is a 15-minute gap, but comparing hours and
  // minutes as independent units once reported it as "1 hr., 45 minutes".
  const c = compareToStated({ days: 2, hours: 0, minutes: 45 }, '2 days & 1 hr.');
  assert.equal(c.agrees, false);
  assert.equal(c.deltaText, '15 minutes');

  const d = compareToStated({ days: 5, hours: 1, minutes: 45 }, '5 days & 2 hrs.');
  assert.equal(d.deltaText, '15 minutes');
});

test('a day-only gap stays in days', () => {
  const c = compareToStated({ days: 11, hours: 0, minutes: 10 }, '10 days & 10 mins.');
  assert.equal(c.deltaText, '1 day');
});

test('an absent stated total is a disagreement, not a match', () => {
  const c = compareToStated({ days: 1, hours: 0, minutes: 0 }, null);
  assert.equal(c.agrees, false);
  assert.equal(c.stated, null);
  assert.equal(c.derived, '1 day');
});

test('fees summarise as Free only when nothing at all is payable', () => {
  assert.equal(sumFees([{ feeText: 'None' }, { feeText: '' }, { feeText: '—' }]).free, true);
  assert.equal(sumFees([{ feeText: 'None' }, { feeText: '750 (Class A)' }]).free, false);
  assert.equal(sumFees([{ feeText: 'None' }, { feeText: '750 (Class A)' }]).text, '750 (Class A)');
});

test('reconciles against real published charter totals', () => {
  // HRMO service 1 — the LGU's own TOTAL row. If this ever fails, the day/hour rule
  // in charter-duration.js has drifted from how the charters are actually computed.
  const steps = [
    { processingTime: '10 minutes' },
    { processingTime: '10 minutes' },
    { processingTime: '1 hr/applicant' },
    { processingTime: '1 hr/applicant; 30 min/applicant; 7 days' },
    { processingTime: null },
    { processingTime: null },
    { processingTime: '30 min.' },
    { processingTime: '2 days; 15 days' },
    { processingTime: null },
    { processingTime: '5 days' },
  ];
  assert.equal(sumSteps(steps).text, '29 days, 3 hrs. & 20 minutes');

  // OCENR, Environmental Certificate by virtual seminar (non-compliant): the charter's
  // own 2 hrs. & 55 minutes only reconciles if "2.5 hrs" is read as a fraction.
  const ocenrWebinar = sumSteps([
    { processingTime: '15 minutes' },
    { processingTime: '2.5 hrs' },
    { processingTime: '10 minutes per certificate' },
  ]);
  assert.equal(ocenrWebinar.text, '2 hrs. & 55 minutes');
  assert.ok(compareToStated(ocenrWebinar, '2 Hours and 55 Minutes').agrees);

  // OCENR, Certificate of No Objection to Cut Tree: days stay days.
  const ocenrTree = sumSteps([
    { processingTime: '5 minutes' },
    { processingTime: '15 minutes' },
    { processingTime: '1 day' },
    { processingTime: '5 days (depending on the complexity of the request)' },
    { processingTime: '10 minutes' },
    { processingTime: '10 minutes' },
  ]);
  assert.equal(ocenrTree.text, '6 days & 40 minutes');
  assert.ok(compareToStated(ocenrTree, '6 days and 40 minutes').agrees);
});
