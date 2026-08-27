/**
 * BetterLegazpi - The Ibalong Epic
 *
 * Two tellings of the same story on one page, switched in place: a short
 * version for someone who just wants to know why the city has a festival, and
 * the full account for someone who came to read it. Same pattern as the history
 * page, but this page has no timeline, chapter rail or in-page search, so it
 * carries its own small script instead of history.js.
 */

(function () {
  'use strict';

  const VIEWS = {
    concise: {
      btn: document.getElementById('btn-epic-concise'),
      panel: document.getElementById('epic-concise'),
    },
    full: {
      btn: document.getElementById('btn-epic-full'),
      panel: document.getElementById('epic-full'),
    },
  };

  // ==========================================================================
  // Header photograph guard. Same contract as the other tourism pages: if the
  // picture 404s, flag the page so the header falls back to the brand gradient
  // rather than showing a scrim over nothing.
  // ==========================================================================
  (function guardHeaderPhoto() {
    const photo = document.querySelector('.page-header-photo');
    if (!photo) return;

    const markMissing = () => document.body.classList.add('page-header-photo-missing');

    if (photo.complete) {
      if (!photo.naturalWidth) markMissing();
      return;
    }
    photo.addEventListener('error', markMissing, { once: true });
  })();

  if (!VIEWS.concise.btn || !VIEWS.full.btn) return;

  function setView(name, updateUrl = true) {
    if (name !== 'concise' && name !== 'full') name = 'concise';

    for (const [key, view] of Object.entries(VIEWS)) {
      const isActive = key === name;
      view.btn.classList.toggle('active', isActive);
      view.btn.setAttribute('aria-pressed', String(isActive));
      view.panel.classList.toggle('active', isActive);
    }

    if (updateUrl) {
      const url = new URL(window.location.href);
      if (name === 'full') url.searchParams.set('view', 'full');
      else url.searchParams.delete('view');
      history.pushState({ view: name }, '', url);
    }
  }

  VIEWS.concise.btn.addEventListener('click', () => setView('concise'));
  VIEWS.full.btn.addEventListener('click', () => setView('full'));

  // The "read the full epic" link at the end of the short version. Switching
  // rather than navigating keeps the reader's place in one document.
  document.querySelectorAll('[data-epic-goto]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      setView(link.getAttribute('data-epic-goto'));
      window.scrollTo({
        top: 0,
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
      });
    });
  });

  // Deep links (?view=full) and browser back/forward.
  setView(
    new URLSearchParams(window.location.search).get('view') === 'full' ? 'full' : 'concise',
    false
  );

  window.addEventListener('popstate', (e) => {
    setView(e.state && e.state.view ? e.state.view : 'concise', false);
  });
})();
