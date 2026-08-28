/**
 * BetterLegazpi - Service category pages
 *
 * Renders the standardized sections of a service category page from data:
 * an orienting line, user journeys, online/face-to-face options, the offices
 * responsible, and a fallback for readers the journeys don't serve.
 *
 * Journeys carry no fees or times of their own. Each step names a charter service
 * id, and the fee and processing time are read from data/service-index.json - which
 * is generated from the office charters. Nothing on the page is a hand-typed number,
 * which is what went wrong with the service cards this replaces.
 */
(function () {
  'use strict';

  const DATA = '../data/';
  const HUB = '../service-details/';

  function esc(value) {
    return String(value == null ? '' : value).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }

  async function loadJson(name) {
    const response = await fetch(DATA + name);
    if (!response.ok) throw new Error(`${name}: ${response.status}`);
    return response.json();
  }

  /* ---------- orienting line ---------- */

  function renderSummary(category, index) {
    const offices = category.offices.filter((o) => index.offices[o.slug]);
    if (!offices.length) return '';

    const services = offices.reduce((sum, o) => sum + index.offices[o.slug].serviceCount, 0);
    const officeWord = offices.length === 1 ? 'office' : 'offices';

    return `
      <p class="sc-summary">
        <i class="bi bi-info-circle" aria-hidden="true"></i>
        <span><strong>${services}</strong> services across
        <strong>${offices.length}</strong> ${officeWord}, all documented in the city's
        published citizen's charters.</span>
      </p>`;
  }

  /* ---------- journeys ---------- */

  function renderStep(step, position, index) {
    const service = index.services[step.service];
    if (!service) return '';

    const office = index.offices[service.office];
    const href = `${HUB}${office.route.split('/').pop()}#${step.service}`;

    // A missing time is stated as missing rather than summed from the steps: 13 of
    // CEO's 30 services publish no total, and inventing one would put a number on
    // the page that the city never published.
    const time = service.time
      ? `<span class="sc-meta-item"><i class="bi bi-clock" aria-hidden="true"></i>${esc(service.time)}</span>`
      : `<span class="sc-meta-item sc-meta-missing"><i class="bi bi-clock" aria-hidden="true"></i>Time not stated in the charter</span>`;

    const fee = `<span class="sc-meta-item sc-fee sc-fee--${esc(service.fee.kind)}">
        <i class="bi bi-tag" aria-hidden="true"></i>${esc(service.fee.text)}</span>`;

    // The whole step body is the link, not just its title line. A title alone is
    // about 24px tall on a wide screen - under the 44px touch target - and the note
    // and fee line describe the same service anyway, so the larger target is honest.
    return `
      <li class="sc-step${step.conditional ? ' sc-step--conditional' : ''}">
        <span class="sc-step-number" aria-hidden="true">${position}</span>
        <a class="sc-step-body" href="${esc(href)}">
          <span class="sc-step-title">
            <span class="sc-step-label">${esc(step.label)}</span>
            ${step.conditional ? '<span class="sc-step-tag">only if it applies</span>' : ''}
          </span>
          ${step.note ? `<span class="sc-step-note">${esc(step.note)}</span>` : ''}
          <span class="sc-step-meta">
            <span class="sc-meta-item sc-meta-office">
              <i class="bi bi-building" aria-hidden="true"></i>${esc(office.abbreviation || office.name)}</span>
            ${fee}
            ${time}
          </span>
        </a>
      </li>`;
  }

  function renderJourney(journey, index) {
    const steps = journey.steps
      .map((step, i) => renderStep(step, i + 1, index))
      .filter(Boolean)
      .join('');
    if (!steps) return '';

    return `
      <article class="sc-journey">
        <header class="sc-journey-head">
          <h3 class="sc-journey-title">
            <i class="bi ${esc(journey.icon || 'bi-signpost-2')}" aria-hidden="true"></i>
            ${esc(journey.title)}
          </h3>
          ${journey.summary ? `<p class="sc-journey-summary">${esc(journey.summary)}</p>` : ''}
        </header>
        <ol class="sc-steps">${steps}</ol>
      </article>`;
  }

  function renderReferral(journey, categoriesById) {
    const owner = categoriesById[journey.category];
    if (!owner) return '';
    const href = `../${owner.route.replace('services/', '')}`;
    const count = journey.steps.length;

    return `
      <a class="sc-referral" href="${esc(href)}#journeys">
        <span class="sc-referral-icon"><i class="bi ${esc(journey.icon || 'bi-signpost-2')}" aria-hidden="true"></i></span>
        <span class="sc-referral-body">
          <span class="sc-referral-title">${esc(journey.title)}</span>
          <span class="sc-referral-meta">${count} step${count === 1 ? '' : 's'} &middot; in ${esc(owner.name)}</span>
        </span>
        <i class="bi bi-arrow-right sc-referral-arrow" aria-hidden="true"></i>
      </a>`;
  }

  function renderJourneys(category, journeys, index, categoriesById) {
    const owned = journeys.filter((j) => j.category === category.id);
    const borrowed = journeys.filter(
      (j) => j.category !== category.id && (j.relatedCategories || []).includes(category.id)
    );
    if (!owned.length && !borrowed.length) return '';

    const ownedHtml = owned
      .map((j) => renderJourney(j, index))
      .filter(Boolean)
      .join('');

    const referralGrid = `<div class="sc-referrals-grid">
        ${borrowed.map((j) => renderReferral(j, categoriesById)).join('')}
      </div>`;

    // A category can have referrals but no journeys of its own - Health is one.
    // Heading it "What do you want to do?" and promising step-by-step paths, then
    // showing only pointers elsewhere, reads as a section that failed to load.
    if (!owned.length) {
      return `
      <section class="section sc-section" id="journeys" aria-labelledby="journeys-heading">
        <div class="container">
          <h2 class="sc-section-title" id="journeys-heading">Related journeys</h2>
          <p class="sc-section-lead">
            No step-by-step journey starts here, but these ones pass through this
            category on their way somewhere else.
          </p>
          <div class="sc-referrals">${referralGrid}</div>
        </div>
      </section>`;
    }

    const borrowedHtml = borrowed.length
      ? `<div class="sc-referrals">
           <h3 class="sc-referrals-title">Related journeys in other categories</h3>
           ${referralGrid}
         </div>`
      : '';

    return `
      <section class="section sc-section" id="journeys" aria-labelledby="journeys-heading">
        <div class="container">
          <h2 class="sc-section-title" id="journeys-heading">What do you want to do?</h2>
          <p class="sc-section-lead">
            Step-by-step paths through the offices involved. Every step links to the
            service in the city's citizen's charter.
          </p>
          <div class="sc-journeys">${ownedHtml}</div>
          ${borrowedHtml}
        </div>
      </section>`;
  }

  /* ---------- online and face-to-face ---------- */

  function renderOnline(category, portals, index) {
    const kinds = portals.kinds;
    const entries = [];

    for (const office of category.offices) {
      for (const entry of portals.offices[office.slug] || []) {
        entries.push({ entry, office: index.offices[office.slug] });
      }
    }
    // A category with nothing online still deserves the question answered. Saying
    // so plainly is more use than an empty section or a list of links that turn out
    // to be videos - see the note on tax-payments in data/service-categories.json.
    if (!entries.length) {
      if (!category.onlineNote) return '';
      return `
      <section class="section sc-section sc-section--alt" aria-labelledby="online-heading">
        <div class="container">
          <h2 class="sc-section-title" id="online-heading">Can I do this online?</h2>
          <p class="sc-section-lead sc-online-none">${esc(category.onlineNote)}</p>
        </div>
      </section>`;
    }

    const cards = entries
      .map(({ entry, office }) => {
        const kind = kinds[entry.kind] || kinds.portal;
        const inner = `
          <span class="sc-portal-kind">
            <i class="bi ${esc(kind.icon)}" aria-hidden="true"></i>${esc(kind.label)}
          </span>
          <span class="sc-portal-title">${esc(entry.title)}</span>
          <span class="sc-portal-office">${esc(office ? office.abbreviation || office.name : '')}</span>
          ${entry.caveat ? `<span class="sc-portal-caveat">${esc(entry.caveat)}</span>` : ''}`;

        // Not every remote option is a URL. An email-based service has no page to
        // link to, and a link to nowhere is worse than no link.
        return entry.url
          ? `<a class="sc-portal sc-portal--${esc(entry.kind)}" href="${esc(entry.url)}"
               target="_blank" rel="noopener noreferrer">${inner}</a>`
          : `<div class="sc-portal sc-portal--${esc(entry.kind)} sc-portal--static">${inner}</div>`;
      })
      .join('');

    return `
      <section class="section sc-section sc-section--alt" aria-labelledby="online-heading">
        <div class="container">
          <h2 class="sc-section-title" id="online-heading">Can I do this online?</h2>
          <p class="sc-section-lead">
            Each option below is labelled with what it actually is - a working online
            portal, a document describing a procedure you still finish in person, or a
            request you can send by email.
          </p>
          <div class="sc-portals">${cards}</div>
        </div>
      </section>`;
  }

  /* ---------- offices ---------- */

  function renderOfficeCard(office, index) {
    const meta = index.offices[office.slug];
    if (!meta) return '';
    const href = `../${meta.route}`;

    return `
      <a class="sc-office" href="${esc(href)}">
        <span class="sc-office-head">
          <span class="sc-office-name">${esc(meta.name)}</span>
          ${meta.abbreviation ? `<span class="sc-office-abbr">${esc(meta.abbreviation)}</span>` : ''}
        </span>
        <span class="sc-office-desc">${esc(office.description)}</span>
        <span class="sc-office-foot">
          <span class="sc-office-charter">
            <i class="bi bi-journal-text" aria-hidden="true"></i>
            Citizen's Charter &middot; ${meta.serviceCount} services
          </span>
          <i class="bi bi-arrow-right" aria-hidden="true"></i>
        </span>
      </a>`;
  }

  function renderOffices(category, index) {
    if (!category.offices.length) return '';

    let body;
    if (category.groups && category.groups.length) {
      // Employment is the only category that needs this: job seekers and city staff
      // are different audiences, and a flat card grid makes a reader check both.
      body = category.groups
        .map((group) => {
          const inGroup = category.offices.filter((o) => o.group === group.id);
          if (!inGroup.length) return '';
          return `
            <div class="sc-office-group">
              <h3 class="sc-office-group-title">
                <i class="bi ${esc(group.icon || 'bi-dot')}" aria-hidden="true"></i>${esc(group.label)}
              </h3>
              <div class="sc-offices">${inGroup.map((o) => renderOfficeCard(o, index)).join('')}</div>
            </div>`;
        })
        .join('');
    } else {
      body = `<div class="sc-offices">${category.offices.map((o) => renderOfficeCard(o, index)).join('')}</div>`;
    }

    return `
      <section class="section sc-section" aria-labelledby="offices-heading">
        <div class="container">
          <h2 class="sc-section-title" id="offices-heading">Offices responsible</h2>
          <p class="sc-section-lead">
            Each office hub carries its full citizen's charter - every service, its
            requirements, fees and processing times.
          </p>
          ${body}
        </div>
      </section>`;
  }

  /* ---------- fallback ---------- */

  function renderFallback(hasJourneys) {
    // Health and Education carry no journeys of their own, so the usual line would
    // point at something that isn't on the page.
    const text = hasJourneys
      ? 'The journeys above cover the most common paths, not every service.'
      : 'This page covers the most common needs, not every service the city offers.';

    return `
      <section class="section sc-section sc-section--alt" aria-labelledby="fallback-heading">
        <div class="container">
          <div class="sc-fallback">
            <h2 class="sc-fallback-title" id="fallback-heading">Not what you're looking for?</h2>
            <p class="sc-fallback-text">${text}</p>
            <div class="sc-fallback-actions">
              <a class="btn btn-primary" href="./">All service categories</a>
              <a class="btn sc-btn-quiet" href="../sitemap/">Browse the full sitemap</a>
              <a class="btn sc-btn-quiet" href="../contact/">Contact the city</a>
            </div>
          </div>
        </div>
      </section>`;
  }

  /* ---------- boot ---------- */

  async function init() {
    const root = document.getElementById('service-category-app');
    if (!root) return;

    const id = root.dataset.category;

    try {
      const [taxonomy, journeyData, portals, index] = await Promise.all([
        loadJson('service-categories.json'),
        loadJson('journeys.json'),
        loadJson('online-portals.json'),
        loadJson('service-index.json'),
      ]);

      const category = taxonomy.categories.find((c) => c.id === id);
      if (!category) throw new Error(`unknown category: ${id}`);

      const categoriesById = {};
      taxonomy.categories.forEach((c) => {
        categoriesById[c.id] = c;
      });

      const hasJourneys = journeyData.journeys.some((j) => j.category === category.id);

      root.innerHTML = [
        renderSummary(category, index),
        renderJourneys(category, journeyData.journeys, index, categoriesById),
        renderOnline(category, portals, index),
        renderOffices(category, index),
        renderFallback(hasJourneys),
      ].join('');
    } catch (error) {
      console.error('service-categories:', error);
      root.innerHTML = `
        <section class="section sc-section">
          <div class="container">
            <p class="sc-error" role="alert">
              This page's services could not be loaded. Please try again, or
              <a href="../contact/">contact the city</a> directly.
            </p>
          </div>
        </section>`;
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
