/**
 * BetterLegazpi - fare calculator
 *
 * Turns the rules in data/transport-fares.json into a peso figure. Every rule
 * shape here is copied from an LTFRB fare guide or a city ordinance; the
 * arithmetic is theirs, not ours.
 *
 * This file is deliberately dependency-free and attaches to window.FareCalc so
 * that scripts/validate/validate-transport.js can require() the same code the
 * page runs and re-derive the published distance tables from it. A typo in the
 * rules therefore fails validation instead of quoting a wrong fare to someone
 * standing at a terminal.
 */

(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FareCalc = api;
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  /** Every LTFRB guide ends with: "Fares are rounded off to the nearest 25 centavos". */
  function roundToQuarter(value) {
    return Math.round(value / 0.25) * 0.25;
  }

  /**
   * @param {object} rule     one `rule` object from transport-fares.json
   * @param {number} km       distance travelled
   * @param {boolean} discounted  student / senior citizen / PWD
   * @param {number} [minutes]    travel time, metered modes only
   * @returns {number|null} pesos, or null if the rule needs data we lack
   */
  function fare(rule, km, discounted, minutes) {
    if (!rule || typeof km !== 'number' || km < 0) return null;

    if (rule.type === 'base-plus-km') {
      // Below the base distance the base fare applies flat - that is why the
      // published tables repeat the same figure for the first few kilometres.
      const base = discounted ? rule.discountedBaseFare : rule.baseFare;
      const perKm = discounted ? rule.discountedPerKm : rule.perKm;
      // The discounted rate sometimes covers a shorter base distance than the
      // regular one: Legazpi's Tamang Singil fare is ₱12.00 for the first 2 km
      // regular but ₱10.00 for the first 1 km discounted.
      const baseKm =
        discounted && typeof rule.discountedBaseKm === 'number'
          ? rule.discountedBaseKm
          : rule.baseKm;
      const extra = Math.max(0, Math.ceil(km) - baseKm);
      return roundToQuarter(base + extra * perKm);
    }

    if (rule.type === 'per-km') {
      let perKm = rule.perKm;
      if (discounted) {
        perKm =
          typeof rule.discountedPerKm === 'number'
            ? rule.discountedPerKm
            : perKm * (1 - (rule.discountPercent || 0) / 100);
      }
      return roundToQuarter(perKm * km);
    }

    if (rule.type === 'metered') {
      // Flag-down plus distance plus time. Without a time we can still give the
      // distance component, which is what a rider can check against the app.
      const total = rule.flagDown + rule.perKm * km + (minutes ? rule.perMinute * minutes : 0);
      const off = discounted ? 1 - (rule.discountPercent || 0) / 100 : 1;
      return roundToQuarter(total * off);
    }

    return null;
  }

  /** "₱31.00" */
  function format(value) {
    if (value === null || value === undefined) return '—';
    return '₱' + value.toFixed(2);
  }

  /** One-line plain description of how a rule charges, for display under a fare. */
  function explain(rule) {
    if (!rule) return '';
    if (rule.type === 'base-plus-km') {
      return (
        '₱' +
        rule.baseFare.toFixed(2) +
        ' for the first ' +
        rule.baseKm +
        ' km, then ₱' +
        rule.perKm.toFixed(2) +
        ' per km'
      );
    }
    if (rule.type === 'per-km') {
      return '₱' + rule.perKm.toFixed(2) + ' per km';
    }
    if (rule.type === 'metered') {
      return (
        '₱' +
        rule.flagDown.toFixed(2) +
        ' flag-down, ₱' +
        rule.perKm.toFixed(2) +
        ' per km, ₱' +
        rule.perMinute.toFixed(2) +
        ' per minute'
      );
    }
    return '';
  }

  return { fare: fare, format: format, explain: explain, roundToQuarter: roundToQuarter };
});
