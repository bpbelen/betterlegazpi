/**
 * BetterLegazpi - Public Utility Jeepney route reference
 *
 * Renders data/transport-routes.json into the route list, then - only if the
 * vendored Leaflet bundle actually parsed - mounts a map and draws the route
 * geometry from data/transport-routes.geojson.
 *
 * The list is the product; the map is an enhancement. Every map step is guarded
 * so that a missing Leaflet, a missing GeoJSON file, or blocked OSM tiles
 * degrade to a complete, usable page rather than a broken one.
 */

(function () {
  'use strict';

  const DATA_URL = '../data/transport-routes.json';
  const GEO_URL = '../data/transport-routes.geojson';
  const MODES_URL = '../data/transport-modes.json';
  const FARES_URL = '../data/transport-fares.json';

  // Legazpi City proper. Used only until real geometry gives us bounds to fit.
  const FALLBACK_CENTER = [13.1391, 123.7438];
  const FALLBACK_ZOOM = 13;

  const listEl = document.getElementById('transport-routes');
  const mapWrap = document.getElementById('transport-map-wrap');
  const searchEl = document.getElementById('transport-search');
  const filterEl = document.getElementById('transport-filters');
  const noticeEl = document.getElementById('transport-notice');
  const sourcesEl = document.getElementById('transport-sources');
  const fareEl = document.getElementById('transport-fare');
  const modesEl = document.getElementById('transport-modes');
  const reportEl = document.getElementById('transport-report');

  if (!listEl) return;

  let routes = [];
  let map = null;
  let layers = {}; // `${routeId}:${directionId}` -> L.Polyline
  let selectedId = null;
  let activeCorridor = 'all';
  // Terminals from transport-modes.json, held until the map exists.
  let terminals = [];
  // Fare rules, shared by the checker and by each route's end-to-end figure.
  let fareData = null;
  let query = '';
  // routeId -> true when the card is open. Kept outside the DOM so it survives
  // the re-render that every search keystroke triggers.
  const expanded = {};
  // Set per render: when a search narrows the list to a handful, those cards
  // open on their own. Making someone search and then click every result to see
  // whether it is the right one defeats the search.
  let autoOpen = false;

  /* ── helpers ──────────────────────────────────────────────────────────── */

  function esc(value) {
    return String(value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }

  function corridorLabel(corridor) {
    const labels = {
      all: 'All routes',
      'daraga-legazpi': 'Daraga - Legazpi',
      'daraga-rawis': 'Daraga - Rawis',
      'daraga-arimbay': 'Daraga - Arimbay',
      province: 'From other Albay towns',
    };
    return labels[corridor] || corridor;
  }

  /**
   * A route matches the search box if its name, qualifier, any street, or any
   * landmark along it does. Landmarks matter here because most people do not
   * know the street name — they know they want the one that passes SM.
   */
  function matchesQuery(route, q) {
    if (!q) return true;
    const haystack = [route.name, route.shortName, route.qualifier, route.plan]
      .concat(route.directions.flatMap((d) => [d.label].concat(d.stops)))
      .concat(
        route.directions.flatMap((d) => (d.landmarks || []).map((l) => l.name + ' ' + l.kind))
      )
      .join(' ')
      .toLowerCase();
    return haystack.includes(q);
  }

  function visibleRoutes() {
    return routes.filter(
      (r) => (activeCorridor === 'all' || r.corridor === activeCorridor) && matchesQuery(r, query)
    );
  }

  /* ── rendering ────────────────────────────────────────────────────────── */

  function renderNotice(planStatus) {
    if (!noticeEl || !planStatus) return;
    noticeEl.innerHTML =
      '<i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>' +
      '<div><strong>' +
      esc(planStatus.label) +
      '</strong>' +
      esc(planStatus.detail) +
      '</div>';
  }

  function renderSources(sources) {
    if (!sourcesEl || !Array.isArray(sources)) return;
    sourcesEl.innerHTML = sources
      .map((s) => {
        const title = s.url
          ? '<a href="' +
            esc(s.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            esc(s.title) +
            '</a>'
          : esc(s.title);
        const bits = [];
        if (s.ordinanceNo) bits.push('Ordinance No. ' + esc(s.ordinanceNo));
        if (s.dateApproved) bits.push('approved ' + esc(s.dateApproved));
        if (s.publisher) bits.push(esc(s.publisher));
        if (s.status) bits.push(esc(s.status));
        return '<li>' + title + (bits.length ? ' — ' + bits.join(', ') : '') + '</li>';
      })
      .join('');
  }

  function renderFilters() {
    if (!filterEl) return;
    const corridors = ['all'].concat(
      routes
        .map((r) => r.corridor)
        .filter((c, i, arr) => arr.indexOf(c) === i)
        .sort()
    );
    filterEl.innerHTML = corridors
      .map(
        (c) =>
          '<button type="button" class="transport-filter" data-corridor="' +
          esc(c) +
          '" aria-pressed="' +
          (c === activeCorridor) +
          '">' +
          esc(corridorLabel(c)) +
          '</button>'
      )
      .join('');
  }

  function franchiseMarkup(route, operatorKey) {
    const f = route.franchise;
    if (!f) return '';
    const ops = Object.keys(f.operators || {})
      .map(function (key) {
        const name = (operatorKey && operatorKey[key]) || key;
        return (
          '<li><b>' +
          esc(f.operators[key]) +
          '</b><span title="' +
          esc(name) +
          '">' +
          esc(key) +
          '</span></li>'
        );
      })
      .join('');
    const alloc = f.allocatedFrom
      ? ' of ' + esc(f.allocatedFrom) + ' units on the original combined route'
      : '';
    return (
      '<details class="transport-franchise">' +
      '<summary>Franchise &amp; operator details</summary>' +
      '<div class="transport-franchise-body">' +
      '<p class="transport-franchise-note"><strong>' +
      esc(f.validFranchisedUnits) +
      '</strong> valid franchised units' +
      alloc +
      ', as of ' +
      esc(f.asOf) +
      '.</p>' +
      '<ul class="transport-franchise-grid">' +
      ops +
      '</ul>' +
      (f.note ? '<p class="transport-franchise-note">' + esc(f.note) + '</p>' : '') +
      '</div></details>'
    );
  }

  /** Bootstrap Icons per landmark category. */
  const KIND_ICON = {
    Mall: 'bi-shop',
    Terminal: 'bi-bus-front',
    University: 'bi-mortarboard-fill',
    Hospital: 'bi-hospital',
    School: 'bi-book',
    Market: 'bi-basket',
    Government: 'bi-bank',
    Landmark: 'bi-geo-alt-fill',
    Church: 'bi-house-heart',
    Emergency: 'bi-shield-fill',
    'Fuel station': 'bi-fuel-pump',
    Hotel: 'bi-building',
  };

  /**
   * Landmarks come first, before the street list: people look for a place they
   * recognise long before they look for a street name. They are derived from
   * OpenStreetMap features on the generated line rather than from the routing
   * plan, so the heading says "passes near" — they are a guide, not the route.
   */
  function landmarkMarkup(direction) {
    const marks = direction.landmarks || [];
    if (!marks.length) return '';
    return (
      '<div class="transport-landmarks">' +
      '<h5 class="transport-sublabel">Passes near</h5>' +
      '<ul>' +
      marks
        .map(function (l) {
          const icon = KIND_ICON[l.kind] || 'bi-geo-alt';
          return (
            '<li><i class="bi ' +
            icon +
            '" aria-hidden="true"></i>' +
            '<span class="transport-landmark-name">' +
            esc(l.name) +
            '</span>' +
            '<span class="transport-landmark-kind">' +
            esc(l.kind) +
            '</span></li>'
          );
        })
        .join('') +
      '</ul></div>'
    );
  }

  function routeMarkup(route, operatorKey) {
    const directions = route.directions
      .map(function (d) {
        return (
          '<div class="transport-direction">' +
          '<div class="transport-direction-head">' +
          '<span class="transport-swatch" style="background:' +
          esc(d.color) +
          '" aria-hidden="true"></span>' +
          '<h4>' +
          esc(d.label) +
          '</h4></div>' +
          directionFare(d) +
          landmarkMarkup(d) +
          '<div class="transport-route-streets">' +
          '<h5 class="transport-sublabel">Actual route</h5>' +
          '<ol class="transport-stops">' +
          d.stops
            .map(function (s) {
              return '<li><span class="transport-stop">' + esc(s) + '</span></li>';
            })
            .join('') +
          '</ol></div></div>'
        );
      })
      .join('');

    // Cards are collapsed by default. Expanded, twelve routes with up to two
    // directions each run to several screens of chips, and the list stops being
    // scannable — which is the one job it has. The summary line keeps a closed
    // card informative: where it runs and what it passes.
    const open = expanded[route.id] === true || autoOpen;
    return (
      '<article class="transport-route' +
      (open ? ' is-open' : '') +
      '" id="' +
      esc(route.id) +
      '" data-route="' +
      esc(route.id) +
      '">' +
      '<button type="button" class="transport-route-head" aria-expanded="' +
      open +
      '" aria-controls="body-' +
      esc(route.id) +
      '">' +
      '<span class="transport-route-headline">' +
      '<span class="transport-route-title">' +
      esc(route.name) +
      '</span>' +
      '<span class="transport-tag">' +
      esc(route.plan) +
      '</span>' +
      '</span>' +
      '<span class="transport-route-summary">' +
      esc(routeSummary(route)) +
      '</span>' +
      '<i class="bi bi-chevron-down transport-chevron" aria-hidden="true"></i>' +
      '</button>' +
      '<div class="transport-route-body" id="body-' +
      esc(route.id) +
      '"' +
      (open ? '' : ' hidden') +
      '>' +
      // Several routes name their source plan as the qualifier too; showing it
      // twice reads as a rendering fault rather than emphasis.
      (route.qualifier && route.qualifier !== route.plan
        ? '<p class="transport-route-qualifier">' + esc(route.qualifier) + '</p>'
        : '') +
      directions +
      franchiseMarkup(route, operatorKey) +
      '</div>' +
      '</article>'
    );
  }

  /**
   * One line describing a closed card: where the route starts and ends, and the
   * landmarks most likely to be recognised. Endpoints come from the first
   * direction's street sequence, which is the plan's own wording.
   */
  function routeSummary(route) {
    const first = route.directions[0];
    if (!first) return '';
    const stops = first.stops;
    const ends =
      stops[0] === stops[stops.length - 1]
        ? 'Loop from ' + stops[0]
        : stops[0] + ' to ' + stops[stops.length - 1];
    const marks = (first.landmarks || []).slice(0, 3).map(function (l) {
      return l.name;
    });
    return marks.length ? ends + ' — passes ' + marks.join(', ') : ends;
  }

  function renderList(operatorKey) {
    const shown = visibleRoutes();
    if (!shown.length) {
      listEl.innerHTML =
        '<p class="transport-empty">No routes match that search. Try a street name such as ' +
        '<em>Quezon Ave.</em> or a destination such as <em>Rawis</em>.</p>';
      return;
    }
    autoOpen = Boolean(query) && shown.length <= 3;
    listEl.innerHTML = shown
      .map(function (r) {
        return routeMarkup(r, operatorKey);
      })
      .join('');
    if (selectedId) {
      const el = listEl.querySelector('[data-route="' + selectedId + '"]');
      if (el) el.classList.add('is-selected');
    }
    syncMapVisibility();
  }

  /* ── fares ────────────────────────────────────────────────────────────── */

  /**
   * "Magkano dapat?" — the fare checker.
   *
   * This is the reason the page exists. Routes tell you which jeepney to board;
   * this tells you what it is allowed to charge you for it, straight from the
   * LTFRB fare guides and the city ordinance, both of which are published
   * alongside so a rider can show the driver the document.
   */
  /**
   * There is no live trip planner yet, so this bridges the gap: how to get the
   * one number the checker needs (distance), and what to say once you have a
   * fare in hand. Collapsed by default — it is a one-time explainer, not
   * something a returning visitor needs open every time.
   */
  function howToUseMarkup() {
    return (
      '<details class="transport-howto">' +
      '<summary><i class="bi bi-info-circle-fill" aria-hidden="true"></i> How to use this</summary>' +
      '<div class="transport-howto-body">' +
      '<ol>' +
      '<li>' +
      '<b>Check the distance.</b> Open Google Maps or Apple Maps, drop a pin on where you are ' +
      'boarding and where you are getting off, and read the driving distance in kilometres. ' +
      'Enter that number above.' +
      '</li>' +
      '<li>' +
      '<b>Confirm with the driver before you board.</b> Drivers sometimes quote by zone rather ' +
      'than exact distance, so use the fare above as your anchor for the conversation. In ' +
      'Bikol: <i>&ldquo;Manggurano tabi?&rdquo;</i> (Filipino: <i>&ldquo;Magkano po?&rdquo;</i>) ' +
      '&mdash; ' +
      '&ldquo;How much, po?&rdquo;' +
      '</li>' +
      '</ol>' +
      '<p class="transport-fare-note">' +
      'This page does not track your live trip or draw a route for you yet &mdash; it only computes ' +
      'the fare a distance is entitled to under the published rules.' +
      '</p>' +
      '</div></details>'
    );
  }

  function renderFareChecker(fares) {
    if (!fareEl || !fares) return;
    fareData = fares;

    const groupOptions = fares.groups
      .map((g) => '<option value="' + esc(g.id) + '">' + esc(g.label) + '</option>')
      .join('');

    fareEl.innerHTML =
      '<div class="transport-checker">' +
      howToUseMarkup() +
      '<div class="transport-checker-controls">' +
      '<div class="transport-field"><label for="fare-group">I am riding a</label>' +
      '<select id="fare-group">' +
      groupOptions +
      '</select></div>' +
      '<div class="transport-field"><label for="fare-class">Type</label>' +
      '<select id="fare-class"></select></div>' +
      '<div class="transport-field"><label for="fare-km">Distance (km)</label>' +
      '<input type="number" id="fare-km" min="1" max="600" step="1" value="1" inputmode="numeric" />' +
      '</div>' +
      '<div class="transport-field transport-field--time" id="fare-time-field" hidden>' +
      '<label for="fare-min">Travel time (min)</label>' +
      '<input type="number" id="fare-min" min="0" max="600" step="1" value="15" inputmode="numeric" />' +
      '</div>' +
      '</div>' +
      '<output class="transport-checker-result" id="fare-result"></output>' +
      '<p class="transport-fare-note" id="fare-source"></p>' +
      (fares.disclaimer
        ? '<p class="transport-fare-note transport-fare-caveat">' + esc(fares.disclaimer) + '</p>'
        : '') +
      '</div>';

    const groupSel = document.getElementById('fare-group');
    const classSel = document.getElementById('fare-class');

    function fillClasses() {
      const group = fares.groups.find((g) => g.id === groupSel.value);
      classSel.innerHTML = group.classes
        .map((c) => '<option value="' + esc(c.id) + '">' + esc(c.label) + '</option>')
        .join('');
      compute();
    }

    function currentClass() {
      const group = fares.groups.find((g) => g.id === groupSel.value);
      return group && group.classes.find((c) => c.id === classSel.value);
    }

    function compute() {
      const cls = currentClass();
      const out = document.getElementById('fare-result');
      const src = document.getElementById('fare-source');
      const timeField = document.getElementById('fare-time-field');
      if (!cls || !out) return;

      const metered = cls.rule.type === 'metered';
      timeField.hidden = !metered;

      const km = Number(document.getElementById('fare-km').value) || 0;
      const mins = metered ? Number(document.getElementById('fare-min').value) || 0 : undefined;
      const regular = window.FareCalc.fare(cls.rule, km, false, mins);
      const discounted = window.FareCalc.fare(cls.rule, km, true, mins);

      out.innerHTML =
        '<span class="transport-checker-figure"><b>' +
        esc(window.FareCalc.format(regular)) +
        '</b><span>Regular</span></span>' +
        '<span class="transport-checker-figure transport-checker-figure--alt"><b>' +
        esc(window.FareCalc.format(discounted)) +
        '</b><span>Student / Senior / PWD</span></span>' +
        '<span class="transport-checker-rule">' +
        esc(window.FareCalc.explain(cls.rule)) +
        '</span>';

      const s = cls.source || {};
      const bits = [esc(s.title)];
      if (s.issuer) bits.push(esc(s.issuer));
      if (s.effective) bits.push('effective ' + esc(s.effective));
      if (s.documentLabel) bits.push('document marked &ldquo;' + esc(s.documentLabel) + '&rdquo;');
      src.innerHTML =
        (s.url
          ? '<a href="' +
            esc(s.url) +
            '" target="_blank" rel="noopener noreferrer">' +
            bits.join(' &middot; ') +
            '</a>'
          : bits.join(' &middot; ')) + (cls.note ? '<br>' + esc(cls.note) : '');
    }

    groupSel.addEventListener('change', fillClasses);
    classSel.addEventListener('change', compute);
    ['fare-km', 'fare-min'].forEach(function (id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', compute);
    });
    fillClasses();
  }

  /**
   * "Kanino magsumbong?" — who acts on an overcharge. Consolidated at the top
   * of the page rather than buried inside the tricycle section, because the
   * person who needs it is angry, on a kerb, on a phone.
   */
  function renderReport(report) {
    if (!reportEl || !report) return;
    reportEl.innerHTML =
      '<h2>' +
      esc(report.title) +
      '</h2>' +
      '<p class="transport-report-intro">' +
      esc(report.intro) +
      '</p>' +
      '<p class="transport-fare-note">' +
      esc(report.disclaimer) +
      '</p>' +
      '<div class="transport-report-groups">' +
      report.groups
        .map(function (g) {
          const links = (g.links || [])
            .map(
              (l) =>
                '<a href="' +
                esc(l.url) +
                '" target="_blank" rel="noopener noreferrer">' +
                esc(l.label) +
                '</a>'
            )
            .join(' ');
          return (
            '<div class="transport-report-group"><h3>' +
            esc(g.label) +
            '</h3><p>' +
            esc(g.note) +
            '</p><ul class="transport-contacts">' +
            g.contacts
              .map(function (c) {
                const nums = c.numbers
                  .map(
                    (n) => '<a href="tel:' + esc(n.replace(/[^0-9+]/g, '')) + '">' + esc(n) + '</a>'
                  )
                  .join(' &middot; ');
                return '<li><b>' + esc(c.label) + '</b><span>' + nums + '</span></li>';
              })
              .join('') +
            '</ul>' +
            (links ? '<p>' + links + '</p>' : '') +
            '</div>'
          );
        })
        .join('') +
      '</div>';
  }

  /** The correct fare for one leg, given the distance we derived from its line. */
  function directionFare(direction) {
    if (!fareData || !direction || typeof direction.distanceKm !== 'number') return '';
    if (!window.FareCalc) return '';
    const jeep = fareData.groups.find((g) => g.id === 'jeepney');
    const cls = jeep && jeep.classes.find((c) => c.id === 'puj-traditional');
    if (!cls) return '';
    const regular = window.FareCalc.fare(cls.rule, direction.distanceKm, false);
    const discounted = window.FareCalc.fare(cls.rule, direction.distanceKm, true);
    return (
      '<div class="transport-legfare">' +
      '<span class="transport-legfare-label">End to end, ' +
      esc(direction.distanceKm.toFixed(1)) +
      ' km &mdash; correct fare</span>' +
      '<span class="transport-legfare-figures"><b>' +
      esc(window.FareCalc.format(regular)) +
      '</b> regular &middot; <b>' +
      esc(window.FareCalc.format(discounted)) +
      '</b> student / senior / PWD</span>' +
      '<span class="transport-legfare-note">Traditional jeepney rate. A shorter ride costs less.</span>' +
      '</div>'
    );
  }

  /** Small table shared by the per-mode fare blocks. */
  function fareTable(rows, columns) {
    const head = columns
      ? '<thead><tr><th scope="col">Fare</th>' +
        columns.map((c) => '<th scope="col">' + esc(c) + '</th>').join('') +
        '</tr></thead>'
      : '';
    const body = rows
      .map(function (r) {
        if (r.flat) {
          // One figure spanning both columns, as printed on the source matrix.
          return (
            '<tr><th scope="row">' +
            esc(r.label) +
            '</th><td colspan="' +
            (columns ? columns.length : 1) +
            '" class="transport-fare-flat">' +
            esc(r.flat) +
            '</td></tr>'
          );
        }
        const cells = r.values || [r.value];
        return (
          '<tr><th scope="row">' +
          esc(r.label) +
          '</th>' +
          cells.map((v) => '<td>' + esc(v) + '</td>').join('') +
          '</tr>'
        );
      })
      .join('');
    return '<table class="transport-fare-table">' + head + '<tbody>' + body + '</tbody></table>';
  }

  function renderFare(fare) {
    if (!fareEl || !fare) return;
    const sources = (fare.sources || [])
      .map(
        (s) =>
          '<li><a href="' +
          esc(s.url) +
          '" target="_blank" rel="noopener noreferrer">' +
          esc(s.label) +
          '</a></li>'
      )
      .join('');
    fareEl.innerHTML =
      '<h3>' +
      esc(fare.title) +
      '</h3>' +
      fareTable(fare.rows) +
      '<p class="transport-fare-note">' +
      esc(fare.scopeNote) +
      '</p>' +
      '<p class="transport-fare-note transport-fare-caveat">' +
      esc(fare.sourceNote) +
      '</p>' +
      (sources ? '<ul class="transport-sources">' + sources + '</ul>' : '');
  }

  /* ── other modes ──────────────────────────────────────────────────────── */

  function modeSection(title, inner) {
    return '<div class="transport-mode-block"><h4>' + esc(title) + '</h4>' + inner + '</div>';
  }

  function pairList(items, extraClass) {
    return (
      '<ul class="transport-pairs' +
      (extraClass ? ' ' + extraClass : '') +
      '">' +
      items.map((i) => '<li><b>' + esc(i.a) + '</b><span>' + esc(i.b) + '</span></li>').join('') +
      '</ul>'
    );
  }

  function modeMarkup(mode, disclaimer) {
    let body = '';

    if (mode.fare) {
      body += modeSection(
        mode.fare.title,
        fareTable(mode.fare.rows, mode.fare.columns) +
          '<p class="transport-fare-note">' +
          esc(mode.fare.note || '') +
          '</p>' +
          '<p class="transport-fare-note">Source: ' +
          (mode.fare.url
            ? '<a href="' +
              esc(mode.fare.url) +
              '" target="_blank" rel="noopener noreferrer">' +
              esc(mode.fare.source) +
              '</a>'
            : esc(mode.fare.source)) +
          (mode.fare.asOf ? ', ' + esc(mode.fare.asOf) : '') +
          '.</p>' +
          '<p class="transport-fare-note transport-fare-caveat">' +
          esc(mode.fare.verifyNote) +
          '</p>'
      );
    }

    if (mode.capacity) {
      body += modeSection(
        'Allowable passengers',
        pairList(mode.capacity.map((c) => ({ a: c.value, b: c.label })))
      );
    }

    if (mode.example) {
      body += modeSection(
        mode.example.title,
        '<p class="transport-fare-note">From ' +
          esc(mode.example.origin) +
          '</p>' +
          fareTable(mode.example.rows, mode.example.columns) +
          '<p class="transport-fare-note">' +
          esc(mode.example.note) +
          '</p>'
      );
    }

    if (mode.terminals) {
      body += modeSection(
        mode.terminals.length > 1 ? 'Terminals' : 'Terminal',
        '<ul class="transport-terminals">' +
          mode.terminals
            .map(function (t) {
              const link = t.mapUrl
                ? ' <a href="' +
                  esc(t.mapUrl) +
                  '" target="_blank" rel="noopener noreferrer">Open in Maps</a>'
                : '';
              return (
                '<li><b>' + esc(t.name) + '</b><span>' + esc(t.role) + '</span>' + link + '</li>'
              );
            })
            .join('') +
          '</ul>'
      );
    }

    if (mode.apps) {
      body += modeSection(
        'Apps operating here',
        '<ul class="transport-terminals">' +
          mode.apps
            .map(
              (a) =>
                '<li><b>' +
                esc(a.name) +
                '</b><span>' +
                esc(a.kind) +
                '</span> <a href="' +
                esc(a.url) +
                '" target="_blank" rel="noopener noreferrer">Official site</a></li>'
            )
            .join('') +
          '</ul>'
      );
    }

    if (mode.penalties) {
      body += modeSection(
        mode.penalties.title,
        pairList(
          mode.penalties.rows.map((r) => ({ a: r.label, b: r.value })),
          'transport-pairs--stacked'
        )
      );
    }

    if (mode.report) {
      body += modeSection(
        mode.report.title,
        '<p class="transport-fare-note transport-fare-caveat">' +
          esc(disclaimer || '') +
          '</p>' +
          '<ul class="transport-contacts">' +
          mode.report.contacts
            .map(function (c) {
              const nums = c.numbers
                .map(
                  (n) => '<a href="tel:' + esc(n.replace(/[^0-9+]/g, '')) + '">' + esc(n) + '</a>'
                )
                .join(' &middot; ');
              return '<li><b>' + esc(c.label) + '</b><span>' + nums + '</span></li>';
            })
            .join('') +
          '</ul>'
      );
    }

    if (mode.note) body += '<p class="transport-fare-note">' + esc(mode.note) + '</p>';

    if (mode.links) {
      body += mode.links
        .map(
          (l) =>
            '<p><a class="transport-mode-link" href="' +
            esc(l.url) +
            '">' +
            esc(l.label) +
            ' &rarr;</a></p>'
        )
        .join('');
    }

    // Same collapsed-by-default pattern as the route cards. These sections are
    // long, and a reader wants the one mode they are actually travelling by.
    return (
      '<article class="transport-route" data-mode="' +
      esc(mode.id) +
      '">' +
      '<button type="button" class="transport-route-head" aria-expanded="false" aria-controls="mode-' +
      esc(mode.id) +
      '">' +
      '<span class="transport-route-headline">' +
      '<i class="bi ' +
      esc(mode.icon) +
      ' transport-mode-icon" aria-hidden="true"></i>' +
      '<span class="transport-route-title">' +
      esc(mode.name) +
      '</span></span>' +
      '<span class="transport-route-summary">' +
      esc(mode.summary) +
      '</span>' +
      '<i class="bi bi-chevron-down transport-chevron" aria-hidden="true"></i>' +
      '</button>' +
      '<div class="transport-route-body" id="mode-' +
      esc(mode.id) +
      '" hidden>' +
      body +
      '</div></article>'
    );
  }

  function renderModes(data) {
    if (!modesEl || !data) return;
    modesEl.innerHTML = data.modes
      .map(function (m) {
        return modeMarkup(m, data.contactDisclaimer);
      })
      .join('');

    // Mode cards toggle on their own; they have no map line to select.
    modesEl.addEventListener('click', function (e) {
      const head = e.target.closest('.transport-route-head');
      if (!head || !modesEl.contains(head)) return;
      const card = head.closest('.transport-route');
      const body = card.querySelector('.transport-route-body');
      const open = head.getAttribute('aria-expanded') !== 'true';
      head.setAttribute('aria-expanded', String(open));
      card.classList.toggle('is-open', open);
      if (body) body.hidden = !open;
    });

    terminals = [];
    data.modes.forEach(function (m) {
      (m.terminals || []).forEach(function (t) {
        terminals.push(t);
      });
    });
    addTerminalMarkers();
  }

  /** Terminals are places, so they are markers rather than lines. */
  function addTerminalMarkers() {
    if (!map || !terminals.length || !window.L) return;
    terminals.forEach(function (t) {
      window.L.circleMarker([t.lat, t.lon], {
        radius: 7,
        color: '#ffffff',
        weight: 2,
        fillColor: '#c2410c',
        fillOpacity: 1,
      })
        .bindPopup('<b>' + esc(t.name) + '</b><br>' + esc(t.role))
        .addTo(map);
    });
  }

  /* ── map (enhancement only) ───────────────────────────────────────────── */

  function leafletAvailable() {
    return typeof window.L !== 'undefined' && typeof window.L.map === 'function';
  }

  function initMap(geojson) {
    if (!mapWrap || !leafletAvailable() || !geojson) return;

    const target = document.getElementById('transport-map');
    if (!target) return;

    mapWrap.classList.add('is-active');
    map = window.L.map(target, { scrollWheelZoom: false }).setView(FALLBACK_CENTER, FALLBACK_ZOOM);

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    // Bounds for the opening view are taken from the city routes only. The
    // province routes run 45km out to Polangui, and fitting those shrinks
    // Legazpi - where eleven of the twelve routes actually are - to an
    // unreadable knot a few pixels across.
    const cityBounds = [];
    const provinceCorridors = {};
    routes.forEach(function (r) {
      provinceCorridors[r.id] = r.corridor === 'province';
    });

    (geojson.features || []).forEach(function (feature) {
      const key = feature.properties && feature.properties.key;
      const coords = feature.geometry && feature.geometry.coordinates;
      if (!key || !Array.isArray(coords)) return;
      // GeoJSON is [lng, lat]; Leaflet wants [lat, lng].
      const latlngs = coords.map(function (c) {
        return [c[1], c[0]];
      });
      const line = window.L.polyline(latlngs, {
        color: (feature.properties && feature.properties.color) || '#0032a0',
        weight: 4,
        opacity: 0.85,
      });
      line.bindPopup(esc((feature.properties && feature.properties.label) || key));
      layers[key] = line;
      if (!provinceCorridors[feature.properties.routeId]) cityBounds.push(latlngs);
    });

    if (cityBounds.length) map.fitBounds(cityBounds.flat(), { padding: [20, 20] });
    // Terminals may have loaded before the map existed; place them now.
    addTerminalMarkers();
    syncMapVisibility();
  }

  /** Show only the lines belonging to routes currently visible in the list. */
  function syncMapVisibility() {
    if (!map) return;
    const visible = visibleRoutes().map(function (r) {
      return r.id;
    });
    Object.keys(layers).forEach(function (key) {
      const routeId = key.split(':')[0];
      const shouldShow = visible.indexOf(routeId) !== -1;
      const onMap = map.hasLayer(layers[key]);
      if (shouldShow && !onMap) layers[key].addTo(map);
      if (!shouldShow && onMap) map.removeLayer(layers[key]);
    });
  }

  function selectRoute(routeId) {
    selectedId = routeId;
    listEl.querySelectorAll('.transport-route').forEach(function (el) {
      el.classList.toggle('is-selected', el.dataset.route === routeId);
    });
    if (!map) return;
    const own = Object.keys(layers).filter(function (k) {
      return k.indexOf(routeId + ':') === 0;
    });
    // Fade the rest rather than hiding them: the surrounding routes are useful
    // context for where this one sits, but they must not compete with it.
    Object.keys(layers).forEach(function (k) {
      const mine = own.indexOf(k) !== -1;
      layers[k].setStyle({ opacity: mine ? 0.95 : 0.2, weight: mine ? 5 : 3 });
      if (mine) layers[k].bringToFront();
    });
    if (!own.length) return;
    const group = window.L.featureGroup(
      own.map(function (k) {
        return layers[k];
      })
    );
    map.fitBounds(group.getBounds(), { padding: [24, 24] });
  }

  /* ── wiring ───────────────────────────────────────────────────────────── */

  function bindEvents(operatorKey) {
    if (searchEl) {
      searchEl.addEventListener('input', function (e) {
        query = e.target.value.trim().toLowerCase();
        renderList(operatorKey);
      });
    }

    if (filterEl) {
      filterEl.addEventListener('click', function (e) {
        const btn = e.target.closest('.transport-filter');
        if (!btn) return;
        activeCorridor = btn.dataset.corridor;
        filterEl.querySelectorAll('.transport-filter').forEach(function (b) {
          b.setAttribute('aria-pressed', String(b === btn));
        });
        renderList(operatorKey);
      });
    }

    listEl.addEventListener('click', function (e) {
      // Let the franchise <details> toggle without hijacking it as a selection.
      if (e.target.closest('summary')) return;

      const head = e.target.closest('.transport-route-head');
      if (head) {
        const card = head.closest('.transport-route');
        const id = card.dataset.route;
        if (!id) return; // a mode card - handled by its own listener
        const open = !expanded[id];
        expanded[id] = open;
        head.setAttribute('aria-expanded', String(open));
        card.classList.toggle('is-open', open);
        const body = card.querySelector('.transport-route-body');
        if (body) body.hidden = !open;
        // Opening a route is also how you ask the map to show it.
        if (open) selectRoute(id);
        return;
      }

      const card = e.target.closest('.transport-route');
      if (card) selectRoute(card.dataset.route);
    });
  }

  /** Deep link support: /tourism/transportation#daraga-rawis-a */
  function applyHash() {
    const id = window.location.hash.replace('#', '');
    if (!id) return;
    let card = listEl.querySelector('[data-route="' + id + '"]');
    if (!card) return;
    // A shared link should land on an open card, not one the reader must click.
    if (!expanded[id]) {
      expanded[id] = true;
      card.classList.add('is-open');
      const head = card.querySelector('.transport-route-head');
      if (head) head.setAttribute('aria-expanded', 'true');
      const body = card.querySelector('.transport-route-body');
      if (body) body.hidden = false;
    }
    selectRoute(id);
    card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── boot ─────────────────────────────────────────────────────────────── */

  fetch(DATA_URL)
    .then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    })
    .then(function (data) {
      routes = data.routes || [];
      renderNotice(data.planStatus);
      renderSources(data.sources);
      renderFilters();
      bindEvents(data.operatorKey);

      // Fares first: the route cards quote one, so the rules must be in hand
      // before the list renders. A failure here still leaves the routes usable.
      fetch(FARES_URL)
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(function (fares) {
          if (fares) {
            renderFareChecker(fares);
            renderReport(fares.report);
          }
        })
        .catch(function (err) {
          if (window.console) console.error('transport.js fares:', err);
        })
        .then(function () {
          renderList(data.operatorKey);
          applyHash();
          window.addEventListener('hashchange', applyHash);
        });

      // The other modes are independent of the routes; a failure there must not
      // take the jeepney list down with it.
      fetch(MODES_URL)
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(renderModes)
        .catch(function (err) {
          if (window.console) console.error('transport.js modes:', err);
        });

      // Geometry is optional: the page is complete without it.
      if (!leafletAvailable()) return;
      return fetch(GEO_URL)
        .then(function (r) {
          return r.ok ? r.json() : null;
        })
        .then(initMap)
        .catch(function () {
          /* no geometry yet — list-only is a valid state */
        });
    })
    .catch(function (err) {
      listEl.innerHTML =
        '<p class="transport-empty">We could not load the jeepney routes right now. ' +
        'Please refresh, or check the source documents linked below.</p>';
      if (window.console) console.error('transport.js:', err);
    });
})();
