/**
 * Office hub enhancements (see ADR 0002).
 *
 * Everything on an office hub page is rendered at build time and readable without
 * JavaScript. This file only adds two conveniences on top:
 *
 *   1. Requirement checkboxes remember their state per browser, so a citizen can
 *      tick documents off while gathering them and still have the list when they
 *      come back.
 *   2. A search box filters the services already in the page.
 *
 * Both degrade cleanly. The checkboxes are real inputs that work unticked-and-
 * forgotten without this file; the search box ships `hidden` and is only revealed
 * here, because a search field that does nothing is worse than none at all.
 *
 * No network calls, no rendering. If this file fails to load the page is intact.
 */

(function () {
  'use strict';

  var hub = document.querySelector('.office-hub');
  if (!hub) return;

  var STORE_PREFIX = 'betterlegazpi:hub:' + (hub.dataset.office || 'office') + ':';

  /* ---------------------------------------------------------------------
   * Requirement checklists
   * ------------------------------------------------------------------ */

  /**
   * localStorage throws in private-mode Safari and wherever site data is
   * blocked. A remembered tick is a nicety, so every access is guarded and
   * failure is silent rather than breaking the rest of the page.
   */
  function readStore(key) {
    try {
      return window.localStorage.getItem(STORE_PREFIX + key);
    } catch (err) {
      return null;
    }
  }

  function writeStore(key, value) {
    try {
      window.localStorage.setItem(STORE_PREFIX + key, value);
    } catch (err) {
      /* Storage unavailable or full. The checkbox still works for this visit. */
    }
  }

  function updateChecklistCount(list) {
    var boxes = list.querySelectorAll('.hub-req-box');
    var done = list.querySelectorAll('.hub-req-box:checked').length;
    var label = list.querySelector('.hub-checklist-count');
    if (!label) return;

    if (done === 0) {
      label.textContent = boxes.length + (boxes.length === 1 ? ' item' : ' items');
      label.classList.remove('is-partial', 'is-complete');
      return;
    }

    label.textContent = done + ' of ' + boxes.length + ' ready';
    label.classList.toggle('is-complete', done === boxes.length);
    label.classList.toggle('is-partial', done !== boxes.length);
  }

  Array.prototype.forEach.call(hub.querySelectorAll('[data-checklist]'), function (list) {
    Array.prototype.forEach.call(list.querySelectorAll('.hub-req-box'), function (box) {
      if (readStore(box.id) === '1') box.checked = true;

      box.addEventListener('change', function () {
        writeStore(box.id, box.checked ? '1' : '0');
        updateChecklistCount(list);
      });
    });
    updateChecklistCount(list);
  });

  /* ---------------------------------------------------------------------
   * Following a link to a service
   * ------------------------------------------------------------------ */

  /**
   * Opens the service a link points at.
   *
   * Following a journey link used to scroll to a collapsed card, so the citizen
   * landed on a title and had to work out that they still needed to click it. The
   * point of the journey list is to answer "where does this lead", so the card
   * opens on arrival and says so.
   *
   * Handles clicks, an address bar hash on load, and the back button.
   */
  function revealService(id) {
    if (!id) return null;
    var service = document.getElementById(id);
    if (!service || !service.classList.contains('hub-service')) return null;

    var shell = service.querySelector('.hub-service-shell');
    if (shell) shell.open = true;

    // Re-trigger the highlight even if the same card is opened twice.
    service.classList.remove('is-target');
    void service.offsetWidth;
    service.classList.add('is-target');

    return service;
  }

  hub.addEventListener('click', function (event) {
    var link = event.target.closest ? event.target.closest('a[href^="#"]') : null;
    if (!link || !hub.contains(link)) return;

    var id = decodeURIComponent(link.getAttribute('href').slice(1));
    var service = revealService(id);
    if (!service) return;

    // Open before scrolling: the card grows as it opens, and the browser's own
    // jump would otherwise land against the pre-expansion position.
    event.preventDefault();
    service.scrollIntoView({
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      block: 'start',
    });
    if (window.history && window.history.replaceState) {
      window.history.replaceState(null, '', '#' + id);
    }
  });

  window.addEventListener('hashchange', function () {
    revealService(decodeURIComponent(window.location.hash.slice(1)));
  });

  if (window.location.hash) {
    var landed = revealService(decodeURIComponent(window.location.hash.slice(1)));
    // The browser already jumped to the collapsed position, so correct it now
    // that the card has its full height.
    if (landed) {
      window.setTimeout(function () {
        landed.scrollIntoView({ behavior: 'auto', block: 'start' });
      }, 0);
    }
  }

  /* ---------------------------------------------------------------------
   * Service search
   * ------------------------------------------------------------------ */

  var search = hub.querySelector('[data-hub-search]');
  if (!search) return;

  var input = search.querySelector('.hub-search-input');
  var status = search.querySelector('.hub-search-status');
  var services = Array.prototype.slice.call(hub.querySelectorAll('.hub-service'));
  var categories = Array.prototype.slice.call(hub.querySelectorAll('.hub-category'));
  var journeys = hub.querySelector('.hub-journeys');
  var layout = hub.querySelector('.hub-layout');

  search.hidden = false;

  function apply(term) {
    var query = term.trim().toLowerCase();
    var matches = 0;

    services.forEach(function (service) {
      var hit = !query || (service.dataset.search || '').indexOf(query) !== -1;
      service.hidden = !hit;
      if (hit) matches += 1;
    });

    // A category heading with nothing under it is noise, so hide the whole
    // section rather than leaving an empty title behind.
    categories.forEach(function (category) {
      var visible = category.querySelectorAll('.hub-service:not([hidden])').length;
      category.hidden = visible === 0;
    });

    // The journeys sidebar links to services that may now be filtered out, so it
    // steps aside while a search is active rather than offering dead links.
    // The layout has to collapse with it: hiding the aside leaves its 280px grid
    // column in place, and the results then render into that narrow column.
    if (journeys) journeys.hidden = query.length > 0;
    if (layout) layout.classList.toggle('is-searching', query.length > 0);

    if (!query) {
      status.textContent = '';
    } else if (matches === 0) {
      status.textContent = 'No services match "' + term.trim() + '".';
    } else {
      status.textContent = matches + (matches === 1 ? ' service' : ' services') + ' found.';
    }
  }

  var pending;
  input.addEventListener('input', function () {
    // Debounced so the status message is not re-announced to screen readers on
    // every keystroke.
    window.clearTimeout(pending);
    pending = window.setTimeout(function () {
      apply(input.value);
    }, 150);
  });

  input.addEventListener('search', function () {
    apply(input.value);
  });
})();
