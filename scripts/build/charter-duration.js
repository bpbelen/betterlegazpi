#!/usr/bin/env node
/**
 * Charter processing-time arithmetic.
 *
 * Citizen's Charters write durations as free text — "10 minutes", "20 mins.",
 * "1 hr. & 30 Minutes", "2 days & 1 hr.", "1 hr/applicant", "29 days, 3 hrs. & 20
 * minutes". Per ADR 0002 a service's total is *derived from its steps*, never taken
 * from the PDF's TOTAL row: several charters omit the row entirely, and where it is
 * present it is sometimes wrong.
 *
 * Days are deliberately never converted into hours. A charter "day" is a working day
 * of unstated length, so 8 hours and 1 day are not interchangeable quantities — the
 * charters themselves keep the units separate and so do we. Minutes roll up into
 * hours at 60; hours never roll up into days.
 *
 * Rate qualifiers ("1 hr/applicant") are recorded but do not change the arithmetic —
 * they describe a rate, and the charter's own totals treat them as a single unit.
 *
 * Charters also write fractions two ways — a decimal ("2.5 hrs") and a vulgar fraction
 * glyph ("½ Day"). Both are read. A fractional *hour* settles into minutes, since an
 * hour is a defined quantity; a fractional *day* is left alone, because a working day
 * has no stated length and half of an unknown is still unknown.
 */

/** Vulgar fraction glyphs the charters use in place of a decimal. */
const FRACTIONS = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
const FRACTION_RE = /(\d*)\s*([¼½¾])/g;

const WORD_NUMBERS = {
  // "half day" is the same quantity as "½ Day", which the fraction glyphs already
  // read; the two spellings have to agree or one charter's half day counts and
  // another's does not.
  half: 0.5,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
};
const WORD_NUMBER_RE =
  /\b(half|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\b/gi;
const WORD_THEN_DIGIT_RE =
  /\b(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s*\((\d+(?:\.\d+)?)\)/gi;
const PARENTHESISED_DIGIT_RE = /\((\d+(?:\.\d+)?)\)/g;

/**
 * Puts a duration into a form the unit patterns can read.
 *
 * Charters spell quantities three ways, sometimes in one cell: a vulgar fraction
 * ("½ Day"), a word ("One hour"), and the legal-document habit of writing both
 * ("Two (2) hours", "ten (10) days"). The doubled form is collapsed first, so a value
 * written twice is not counted twice.
 */
function expandNumerals(text) {
  return text
    .replace(FRACTION_RE, (_, whole, glyph) => String((Number(whole) || 0) + FRACTIONS[glyph]))
    .replace(WORD_THEN_DIGIT_RE, '$1')
    .replace(PARENTHESISED_DIGIT_RE, '$1')
    .replace(WORD_NUMBER_RE, (w) => String(WORD_NUMBERS[w.toLowerCase()]));
}

/**
 * The separator between a number and its unit absorbs a hyphen as well as spaces, and
 * tolerates a qualifier sitting between the two: charters write "10 calendar days",
 * "10 working days" and "10-day notice of posting" for the same kind of quantity.
 */
const UNIT_PATTERNS = [
  {
    unit: 'days',
    re: /(\d+(?:\.\d+)?)[\s-]*(?:calendar\s+|working\s+)?(?:d|day|days)\b\.?/gi,
  },
  { unit: 'hours', re: /(\d+(?:\.\d+)?)[\s-]*(?:h|hr|hrs|hour|hours)\b\.?/gi },
  { unit: 'minutes', re: /(\d+(?:\.\d+)?)[\s-]*(?:m|min|mins|minute|minutes)\b\.?/gi },
];

const ZERO = () => ({ days: 0, hours: 0, minutes: 0 });

/**
 * Parses a charter duration string into whole-unit components.
 *
 * A cell may hold several durations for sub-activities ("1 hr/applicant; 30
 * min/applicant; 7 days"); every quantity found is accumulated, which matches how the
 * charters compute their own totals.
 *
 * @param {string|null} text
 * @returns {{days:number, hours:number, minutes:number, rate:string|null,
 *            raw:string|null, recognized:boolean}}
 */
function parseDuration(text) {
  const out = { ...ZERO(), rate: null, raw: text ?? null, recognized: false };
  if (!text || typeof text !== 'string') return out;

  const expanded = expandNumerals(text);

  for (const { unit, re } of UNIT_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(expanded)) !== null) {
      out[unit] += Number(m[1]);
      out.recognized = true;
    }
  }

  const rate = text.match(/\/\s*([A-Za-z][\w-]*)/);
  if (rate) out.rate = rate[1];

  return out;
}

/**
 * Rolls minutes up into hours. Hours are never rolled into days — see the note above.
 *
 * A fractional hour ("2.5 hrs") settles down into minutes first, so a charter's
 * "2.5 hrs" plus "25 minutes" reads back as "2 hrs. & 55 minutes" rather than
 * "2.5 hrs. & 25 minutes". Fractional days are left as they are for the same reason
 * days never become hours: a working day has no stated length to divide.
 */
function normalize(total) {
  const wholeHours = Math.floor(total.hours);
  const minutes = Math.round(total.minutes + (total.hours - wholeHours) * 60);
  return {
    days: total.days,
    hours: wholeHours + Math.floor(minutes / 60),
    minutes: minutes % 60,
  };
}

/**
 * Sums the processing times of a service's steps.
 *
 * @param {Array<{processingTime: string|null}>} steps
 * @returns {{days:number, hours:number, minutes:number, text:string,
 *            unrecognized:string[]}}
 */
function sumSteps(steps) {
  const total = ZERO();
  const unrecognized = [];

  for (const step of steps) {
    const raw = step.processingTime;
    if (raw === null || raw === undefined || raw === '') continue;
    const d = parseDuration(raw);
    if (!d.recognized) {
      unrecognized.push(raw);
      continue;
    }
    total.days += d.days;
    total.hours += d.hours;
    total.minutes += d.minutes;
  }

  const n = normalize(total);
  return { ...n, text: formatDuration(n), unrecognized };
}

/** Drops a trailing ".0" so a whole number never prints as "1.0". */
const trim = (v) => String(Number(v.toFixed(2)));

const PLURAL = {
  days: (v) => (v === 1 ? 'day' : 'days'),
  hours: (v) => (v === 1 ? 'hr.' : 'hrs.'),
  minutes: (v) => (v === 1 ? 'minute' : 'minutes'),
};

/**
 * Renders components in the charters' own house style: comma-separated, with "&"
 * before the last part — "29 days, 3 hrs. & 20 minutes".
 */
function formatDuration({ days, hours, minutes }) {
  const parts = [];
  if (days) parts.push(`${trim(days)} ${PLURAL.days(days)}`);
  if (hours) parts.push(`${hours} ${PLURAL.hours(hours)}`);
  if (minutes) parts.push(`${minutes} ${PLURAL.minutes(minutes)}`);

  if (!parts.length) return 'None';
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(', ')} & ${parts[parts.length - 1]}`;
}

/**
 * Compares a derived total against whatever the PDF's TOTAL row claimed.
 * The derived value always wins; this exists to surface where the source disagrees,
 * because a mismatch means either a misread step or an error in the charter itself.
 *
 * @returns {{agrees:boolean, derived:string, stated:string|null, deltaText:string|null}}
 */
function compareToStated(derivedComponents, statedText) {
  const derived = formatDuration(derivedComponents);
  if (!statedText) return { agrees: false, derived, stated: null, deltaText: null };

  const s = normalize(parseDuration(statedText));
  const agrees =
    s.days === derivedComponents.days &&
    s.hours === derivedComponents.hours &&
    s.minutes === derivedComponents.minutes;

  if (agrees) return { agrees: true, derived, stated: statedText, deltaText: null };

  // Hours and minutes convert freely, so their gap is one quantity measured in
  // minutes — comparing them unit-by-unit reports "1 hr., 45 minutes" for what is a
  // 15-minute difference (45 min vs 1 hr). Days stay separate because a charter day
  // is a working day of unstated length and cannot be expressed in hours.
  const dayGap = derivedComponents.days - s.days;
  const minuteGap =
    derivedComponents.hours * 60 + derivedComponents.minutes - (s.hours * 60 + s.minutes);

  const parts = [];
  if (dayGap) parts.push(`${trim(Math.abs(dayGap))} ${PLURAL.days(Math.abs(dayGap))}`);
  if (minuteGap) {
    const mins = Math.abs(minuteGap);
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h) parts.push(`${h} ${PLURAL.hours(h)}`);
    if (m) parts.push(`${m} ${PLURAL.minutes(m)}`);
  }

  return {
    agrees: false,
    derived,
    stated: statedText,
    deltaText: parts.length ? parts.join(', ') : null,
  };
}

/**
 * Derives a service's total fee text from its steps.
 * Per the display rule: nothing payable reads "Free" in a summary (an individual step
 * with no fee renders as an em dash instead — see the renderer).
 */
function sumFees(steps) {
  const payable = steps
    .map((s) => (s.feeText ?? '').trim())
    .filter((f) => f && !/^(none|n\/a|free|-|—)$/i.test(f));
  if (!payable.length) return { free: true, text: 'Free', components: [] };
  return { free: false, text: payable.join('; '), components: payable };
}

module.exports = {
  parseDuration,
  formatDuration,
  normalize,
  sumSteps,
  sumFees,
  compareToStated,
};
