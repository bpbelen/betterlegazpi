#!/usr/bin/env node
/**
 * Citizen-facing facts derived from a charter service.
 *
 * The Citizen's Charter is written for ARTA compliance: it reports the office's
 * total processing time and says nothing about what the visit costs the citizen.
 * So HRMO's Recruitment service is published as "29 days, 3 hrs. & 20 minutes"
 * when the applicant is actually at the counter for ten minutes and the office
 * spends the remaining twenty-nine days working without them.
 *
 * Reproducing that framing is what makes a web page feel like a worse PDF. These
 * derivations answer the questions someone actually has before setting out: how
 * long am I there, how many trips is this, which window, how many documents, and
 * do I walk out with the thing or come back for it.
 *
 * Nothing here invents data. Every value is computed from steps already
 * transcribed and verified against the source charter.
 */

const { sumSteps } = require('./charter-duration.js');

/** Matches "Window 1", "window 5", "Windows 3" as written in the charters. */
const WINDOW_RE = /\bwindows?\s+(\d+)\b/gi;

/**
 * Time the citizen is present, as opposed to elapsed time.
 *
 * A step with a client action is a moment the citizen is at the counter; a step
 * with only an agency action is the office working while they are elsewhere. The
 * charter's own total conflates the two.
 */
function counterTime(steps) {
  return sumSteps((steps ?? []).filter((s) => s.client));
}

/** Number of separate times the citizen has to interact with the office. */
function visitCount(steps) {
  return (steps ?? []).filter((s) => s.client).length;
}

/**
 * Window or counter numbers named anywhere in the service.
 *
 * Charters bury these inside step prose ("...at Land Tax Division (Window 5)"),
 * which is useless to someone standing in the lobby holding a queue number.
 */
function windows(steps) {
  const found = new Set();
  for (const step of steps ?? []) {
    const text = `${step.client ?? ''} ${step.agency ?? ''}`;
    for (const m of text.matchAll(WINDOW_RE)) found.add(Number(m[1]));
  }
  return [...found].sort((a, b) => a - b);
}

/**
 * True when the citizen walks out with the result.
 *
 * Equality of counter time and total time means no step happens without them
 * present, so there is nothing to come back for. This separates a seven-minute
 * over-the-counter transaction from an eleven-day process that also happens to
 * need only one visit.
 */
function isSameVisit(steps) {
  const counter = counterTime(steps);
  const total = sumSteps(steps ?? []);
  // A service whose charter states no durations at all would otherwise compare
  // zero against zero and claim the citizen walks out with it. Saying nothing is
  // correct there; claiming a same-visit turnaround is not.
  if (!total.days && !total.hours && !total.minutes) return false;
  return (
    counter.days === total.days &&
    counter.hours === total.hours &&
    counter.minutes === total.minutes
  );
}

/** True when the charter gives no processing time for any step the citizen takes. */
function counterTimeUnknown(steps) {
  const c = counterTime(steps);
  return !c.days && !c.hours && !c.minutes;
}

/**
 * Everything the collapsed card and the "before you go" panel need.
 */
function serviceFacts(service) {
  const steps = service.steps ?? [];
  return {
    counter: counterTime(steps),
    total: sumSteps(steps),
    visits: visitCount(steps),
    windows: windows(steps),
    documents: (service.requirements ?? []).length,
    sameVisit: isSameVisit(steps),
    counterUnknown: counterTimeUnknown(steps),
  };
}

module.exports = {
  counterTime,
  counterTimeUnknown,
  visitCount,
  windows,
  isSameVisit,
  serviceFacts,
};
