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
 */

const UNIT_PATTERNS = [
  { unit: 'days', re: /(\d+(?:\.\d+)?)\s*(?:working\s+)?(?:d|day|days)\b\.?/gi },
  { unit: 'hours', re: /(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b\.?/gi },
  { unit: 'minutes', re: /(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b\.?/gi },
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

  for (const { unit, re } of UNIT_PATTERNS) {
    re.lastIndex = 0;
    let m;
    while ((m = re.exec(text)) !== null) {
      out[unit] += Number(m[1]);
      out.recognized = true;
    }
  }

  const rate = text.match(/\/\s*([A-Za-z][\w-]*)/);
  if (rate) out.rate = rate[1];

  return out;
}

/** Rolls minutes up into hours. Hours are never rolled into days — see the note above. */
function normalize(total) {
  const minutes = Math.round(total.minutes);
  return {
    days: total.days,
    hours: total.hours + Math.floor(minutes / 60),
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
  if (days) parts.push(`${days} ${PLURAL.days(days)}`);
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
  if (dayGap) parts.push(`${Math.abs(dayGap)} ${PLURAL.days(Math.abs(dayGap))}`);
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
