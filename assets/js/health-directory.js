/**
 * BetterLegazpi - Health Facilities Directory & SSOT Client
 * Provides dynamic search, category filtering, accreditation badges,
 * and responsive rendering of Legazpi City's health facilities.
 */
(function () {
  'use strict';

  // Three cards on arrival, matching the councilor directory on the government
  // page, so the whole control strip and the sources section stay in reach
  // without scrolling past a wall of results. Each "show more" reveals a
  // larger batch, because stepping 120 facilities three at a time would not.
  const INITIAL_VISIBLE = 3;
  const LOAD_MORE_STEP = 12;
  let allFacilities = [];
  let filteredFacilities = [];
  let summaryCounts = {};
  let gamotProviders = [];
  let dataNotes = [];
  let dataSources = [];
  let currentPage = 1;
  let activeCategory = 'all';
  let activeOwnership = 'all';
  let activeFilterYakapOnly = false;
  let searchQuery = '';

  const DOM = {
    container: null,
    grid: null,
    statsTotal: null,
    statsHospitals: null,
    statsYakap: null,
    statsSuperCenters: null,
    statsBhs: null,
    searchInput: null,
    searchClear: null,
    categoryPills: null,
    ownershipSelect: null,
    filterYakapCheck: null,
    resultCount: null,
    loadMoreContainer: null,
    loadMoreBtn: null,
    emptyState: null,
    chipOverflowBtn: null,
    referencesList: null,
    referencesNotes: null,
    referencesBadge: null,
    referencesToggle: null,
    referencesPanel: null,
  };

  function init() {
    DOM.container = document.getElementById('health-directory-app');
    if (!DOM.container) return;

    cacheDomElements();
    attachEventListeners();
    attachDisclosureHandlers();
    loadFacilitiesData();
  }

  function cacheDomElements() {
    DOM.grid = document.getElementById('facilities-grid');
    DOM.statsTotal = document.getElementById('stat-total-facilities');
    DOM.statsHospitals = document.getElementById('stat-hospitals');
    DOM.statsYakap = document.getElementById('stat-yakap');
    DOM.statsGamot = document.getElementById('stat-gamot');
    DOM.gamotGrid = document.getElementById('gamot-providers-grid');
    DOM.gamotCount = document.getElementById('gamot-result-count');
    DOM.statsSuperCenters = document.getElementById('stat-super-centers');
    DOM.statsBhs = document.getElementById('stat-bhs');
    DOM.searchInput = document.getElementById('health-search-input');
    DOM.searchClear = document.getElementById('health-search-clear');
    // The overflow control shares the pill styling but is not a filter, so it
    // is excluded here by requiring a category.
    DOM.categoryPills = document.querySelectorAll('.health-cat-pill[data-category]');
    DOM.ownershipSelect = document.getElementById('health-ownership-filter');
    DOM.filterYakapCheck = document.getElementById('filter-yakap-only');
    DOM.resultCount = document.getElementById('health-result-count');
    DOM.loadMoreContainer = document.getElementById('health-load-more-wrap');
    DOM.loadMoreBtn = document.getElementById('health-load-more-btn');
    DOM.emptyState = document.getElementById('health-empty-state');
    DOM.chipOverflowBtn = document.getElementById('health-cat-more');
    DOM.referencesList = document.getElementById('health-references-list');
    DOM.referencesNotes = document.getElementById('health-references-notes');
    DOM.referencesBadge = document.getElementById('health-references-badge');
    DOM.referencesToggle = document.getElementById('health-references-toggle');
    DOM.referencesPanel = document.getElementById('health-references-panel');
  }

  function attachEventListeners() {
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        if (DOM.searchClear) {
          DOM.searchClear.style.display = searchQuery ? 'inline-flex' : 'none';
        }
        currentPage = 1;
        applyFilters();
      });
    }

    if (DOM.searchClear) {
      DOM.searchClear.addEventListener('click', () => {
        if (DOM.searchInput) {
          DOM.searchInput.value = '';
          DOM.searchInput.focus();
        }
        searchQuery = '';
        DOM.searchClear.style.display = 'none';
        currentPage = 1;
        applyFilters();
      });
    }

    if (DOM.categoryPills) {
      DOM.categoryPills.forEach((pill) => {
        pill.addEventListener('click', () => {
          DOM.categoryPills.forEach((p) => p.classList.remove('active'));
          pill.classList.add('active');
          activeCategory = pill.getAttribute('data-category') || 'all';
          currentPage = 1;
          applyFilters();
        });
      });
    }

    if (DOM.ownershipSelect) {
      DOM.ownershipSelect.addEventListener('change', (e) => {
        activeOwnership = e.target.value;
        currentPage = 1;
        applyFilters();
      });
    }

    if (DOM.filterYakapCheck) {
      DOM.filterYakapCheck.addEventListener('change', (e) => {
        activeFilterYakapOnly = e.target.checked;
        currentPage = 1;
        applyFilters();
      });
    }

    if (DOM.loadMoreBtn) {
      DOM.loadMoreBtn.addEventListener('click', () => {
        currentPage++;
        renderFacilities();
      });
    }

    const resetBtn = document.getElementById('health-reset-filters');
    if (resetBtn) {
      resetBtn.addEventListener('click', resetFilters);
    }
  }

  function resetFilters() {
    if (DOM.searchInput) DOM.searchInput.value = '';
    if (DOM.searchClear) DOM.searchClear.style.display = 'none';
    searchQuery = '';
    activeCategory = 'all';
    activeOwnership = 'all';
    activeFilterYakapOnly = false;

    if (DOM.ownershipSelect) DOM.ownershipSelect.value = 'all';
    if (DOM.filterYakapCheck) DOM.filterYakapCheck.checked = false;

    if (DOM.categoryPills) {
      DOM.categoryPills.forEach((p) => {
        if (p.getAttribute('data-category') === 'all') {
          p.classList.add('active');
        } else {
          p.classList.remove('active');
        }
      });
    }

    currentPage = 1;
    applyFilters();
  }

  function loadFacilitiesData() {
    const urls = ['../data/health-facilities.json', '/data/health-facilities.json'];

    const tryFetch = (index) => {
      if (index >= urls.length) {
        showError('Unable to load health facilities dataset.');
        return;
      }

      fetch(urls[index])
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          return res.json();
        })
        .then((data) => {
          allFacilities = data.facilities || [];
          summaryCounts = data.summary_counts || {};
          gamotProviders = data.gamot_providers || [];
          dataNotes = data._data_notes || [];
          dataSources = data._sources || [];
          filteredFacilities = [...allFacilities];
          updateStats();
          renderCategoryChips();
          renderReferences();
          renderGamotProviders();
          applyFilters();
        })
        .catch(() => {
          tryFetch(index + 1);
        });
    };

    tryFetch(0);
  }

  /**
   * A facility with no YAKAP entry of its own may still be covered: the CHO's
   * branches operate under the main office's accreditation. The data records
   * that as a facility id so the parent's list number stays a single fact.
   */
  function yakapParentLabel(fac) {
    const parentId = fac.accreditations?.yakap_under_accreditation_of;
    if (!parentId) return '';
    const parent = allFacilities.find((f) => f.id === parentId);
    if (!parent) return '';
    const listNo = parent.accreditations?.yakap_konsulta_no;
    return `Under ${parent.name}${listNo ? ` (YAKAP no. ${listNo})` : ''}`;
  }

  /**
   * GAMOT-only providers are FDA-licensed drug outlets, not DOH health
   * facilities, so they are held in their own array and rendered in their own
   * section rather than counted into the facility directory. Facilities that
   * hold GAMOT accreditation are folded in here too, so this section answers
   * one question completely: where a YAKAP prescription can be filled.
   */
  function renderGamotProviders() {
    if (!DOM.gamotGrid) return;

    const fromDirectory = allFacilities
      .filter((f) => f.accreditations?.is_yakap_gamot)
      .map((f) => ({
        name: f.name,
        listNo: f.accreditations.gamot_provider_no,
        validUntil: f.accreditations.gamot_valid_until,
        address: f.address,
        contact: f.contact,
        kind: f.type || f.category,
        isFacility: true,
        outsideCity: Boolean(f.outside_city_limits),
      }));

    const fromPharmacies = gamotProviders.map((p) => ({
      name: p.name,
      listNo: p.gamot_provider_no,
      validUntil: p.gamot_valid_until,
      address: p.address,
      contact: p.contact,
      kind: 'FDA-licensed drug outlet',
      isFacility: false,
      outsideCity: false,
    }));

    const all = fromDirectory
      .concat(fromPharmacies)
      .sort((a, b) => Number(a.listNo) - Number(b.listNo));

    if (DOM.gamotCount) {
      // BRHMC is shown but not counted, because it is registered under Daraga.
      // Saying so here keeps this figure and the stat tile above from looking
      // like two different answers to the same question.
      const outside = all.filter((p) => p.outsideCity);
      const counted = all.length - outside.length;
      const aside = outside.length
        ? ` in Legazpi City, plus ${outside.map((p) => p.name.replace(/\s*\(.*\)$/, '')).join(' and ')} in Daraga`
        : '';
      DOM.gamotCount.innerHTML = `Showing <strong>${counted}</strong> GAMOT provider${counted === 1 ? '' : 's'}${escapeHtml(aside)}`;
    }

    DOM.gamotGrid.innerHTML = all
      .map((p) => {
        const dial = p.contact?.landline || p.contact?.mobile || '';
        const line = [p.address?.building, p.address?.street, p.address?.city]
          .filter(Boolean)
          .join(', ');
        return `
          <article class="gamot-card">
            <div class="gamot-card-head">
              <span class="gamot-list-no" title="PhilHealth GAMOT Package Provider list number">No. ${escapeHtml(p.listNo)}</span>
              <span class="badge ${p.isFacility ? 'badge-govt' : 'badge-private'}">${escapeHtml(p.kind)}</span>
            </div>
            <h3 class="gamot-card-title">${escapeHtml(p.name)}</h3>
            ${p.outsideCity ? '<p class="gamot-card-flag"><i class="bi bi-info-circle" aria-hidden="true"></i> Registered under Daraga, Albay</p>' : ''}
            <p class="gamot-card-address"><i class="bi bi-geo-alt-fill" aria-hidden="true"></i> ${escapeHtml(line)}</p>
            <dl class="gamot-card-meta">
              <div><dt>Accreditation valid to</dt><dd>${escapeHtml(formatDate(p.validUntil) || 'Not published')}</dd></div>
            </dl>
            ${
              dial
                ? `<a class="gamot-card-call" href="tel:${escapeHtml(dial.split('/')[0].trim())}"><i class="bi bi-telephone-fill" aria-hidden="true"></i> ${escapeHtml(dial)}</a>`
                : '<p class="gamot-card-call gamot-card-call--none">No contact number published</p>'
            }
          </article>`;
      })
      .join('');
  }

  function updateStats() {
    if (DOM.statsTotal && summaryCounts.total) {
      DOM.statsTotal.textContent = summaryCounts.total;
    }
    if (DOM.statsHospitals && summaryCounts.hospitals) {
      DOM.statsHospitals.textContent = summaryCounts.hospitals;
    }
    if (DOM.statsYakap && summaryCounts.yakap_konsulta_clinics) {
      DOM.statsYakap.textContent = summaryCounts.yakap_konsulta_clinics;
    }
    if (DOM.statsGamot && summaryCounts.gamot_providers) {
      DOM.statsGamot.textContent = summaryCounts.gamot_providers;
    }
    if (DOM.statsSuperCenters) {
      const shcCount =
        (summaryCounts.super_health_centers || 0) + (summaryCounts.birthing_homes || 0);
      DOM.statsSuperCenters.textContent = shcCount;
    }
    if (DOM.statsBhs && summaryCounts.barangay_health_stations) {
      DOM.statsBhs.textContent = summaryCounts.barangay_health_stations;
    }
  }

  function applyFilters() {
    filteredFacilities = allFacilities.filter((facility) => {
      // 1. Category Filter
      if (activeCategory !== 'all') {
        if (activeCategory === 'yakap-accredited') {
          if (!facility.accreditations?.is_yakap_konsulta) return false;
        } else if (activeCategory === 'abtc-certified') {
          // Hospitals run animal-bite centres as departments, so this filter
          // reads the certification rather than the category -- one card per
          // real-world building.
          if (!facility.accreditations?.is_abtc_certified) return false;
        } else if (facility.category !== activeCategory) {
          return false;
        }
      }

      // 2. Ownership Filter
      if (activeOwnership !== 'all') {
        if (facility.ownership !== activeOwnership) return false;
      }

      // 3. YAKAP Only Toggle
      if (activeFilterYakapOnly && !facility.accreditations?.is_yakap_konsulta) {
        return false;
      }

      // 4. Search Query
      if (searchQuery) {
        const name = (facility.name || '').toLowerCase();
        const shortName = (facility.short_name || '').toLowerCase();
        const bgy = (facility.address?.barangay || '').toLowerCase();
        const street = (facility.address?.street || '').toLowerCase();
        const cat = (facility.category || '').toLowerCase();
        const type = (facility.type || '').toLowerCase();
        // Not shown on the card any more -- the lists made it too long -- but
        // still indexed, so a search for a procedure finds the facility.
        const services = Array.isArray(facility.services)
          ? facility.services.join(' ').toLowerCase()
          : '';
        const addOns = (facility.licensed_add_ons || '').toLowerCase();
        const pb = (facility.punong_barangay || '').toLowerCase();

        const match =
          name.includes(searchQuery) ||
          shortName.includes(searchQuery) ||
          bgy.includes(searchQuery) ||
          street.includes(searchQuery) ||
          cat.includes(searchQuery) ||
          type.includes(searchQuery) ||
          services.includes(searchQuery) ||
          addOns.includes(searchQuery) ||
          pb.includes(searchQuery);

        if (!match) return false;
      }

      return true;
    });

    renderResultCount();
    renderFacilities();
  }

  function renderResultCount() {
    if (!DOM.resultCount) return;
    const total = filteredFacilities.length;
    DOM.resultCount.innerHTML = `Showing <strong>${total}</strong> health facilit${total === 1 ? 'y' : 'ies'}`;
  }

  function getCategoryIcon(category) {
    switch (category) {
      case 'Hospital':
        return 'bi-hospital';
      case 'PhilHealth YAKAP Clinic':
        return 'bi-shield-plus';
      case 'Super Health Center & RHU':
        return 'bi-building-add';
      case 'Birthing & Lying-in Clinic':
        return 'bi-heart-pulse-fill';
      case 'Diagnostic Laboratory':
        return 'bi-prescription2';
      case 'Barangay Health Station':
        return 'bi-geo-alt-fill';
      case 'Dialysis Center':
        return 'bi-droplet-half';
      case 'Drug Testing Laboratory':
        return 'bi-clipboard2-pulse';
      case 'Ambulatory Surgical Clinic':
        return 'bi-scissors';
      case 'Blood Service Facility':
        return 'bi-droplet-fill';
      case 'Animal Bite Treatment Center':
        return 'bi-bandaid-fill';
      default:
        return 'bi-hospital';
    }
  }

  function renderFacilities() {
    if (!DOM.grid) return;

    if (filteredFacilities.length === 0) {
      DOM.grid.innerHTML = '';
      if (DOM.emptyState) DOM.emptyState.style.display = 'block';
      if (DOM.loadMoreContainer) DOM.loadMoreContainer.style.display = 'none';
      return;
    }

    if (DOM.emptyState) DOM.emptyState.style.display = 'none';

    const visibleItems = filteredFacilities.slice(
      0,
      INITIAL_VISIBLE + (currentPage - 1) * LOAD_MORE_STEP
    );

    let html = '';
    visibleItems.forEach((fac) => {
      // YAKAP is two separate PhilHealth accreditations published as two separate
      // lists: konsulta consultations, and GAMOT medicine dispensing. A facility can
      // hold either without the other -- BRHMC dispenses GAMOT but runs no konsulta --
      // so each is badged from its own list rather than from one combined flag.
      const isKonsulta = fac.accreditations?.is_yakap_konsulta;
      const isGamot = fac.accreditations?.is_yakap_gamot;
      const isYakap = isKonsulta || isGamot;
      const isDoh = fac.accreditations?.is_doh_licensed;
      const isGovt = fac.ownership === 'Government';
      const isAbtc = fac.accreditations?.is_abtc_certified;
      const abtcLapsed = isAbtc && hasLapsed(fac.accreditations?.abtc_validity);
      const konsultaLapsed =
        isKonsulta && hasLapsed(fac.accreditations?.yakap_konsulta_valid_until);
      const gamotLapsed = isGamot && hasLapsed(fac.accreditations?.gamot_valid_until);
      const icon = getCategoryIcon(fac.category);

      const mapQuery = encodeURIComponent(
        `${fac.name}, ${fac.address?.barangay || ''}, ${fac.address?.city || 'Legazpi City'}, Albay`
      );
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

      // Contact Info Strings
      const landline =
        fac.contact?.landline && fac.contact.landline !== 'N/A' ? fac.contact.landline : null;
      const mobile =
        fac.contact?.mobile && fac.contact.mobile !== 'N/A' ? fac.contact.mobile : null;
      const email = fac.contact?.email && fac.contact.email !== 'N/A' ? fac.contact.email : null;

      // Extract primary dial number
      let dialNumber = null;
      if (mobile) {
        const cleanMobile = mobile
          .split('/')[0]
          .trim()
          .replace(/[^0-9+]/g, '');
        if (cleanMobile) dialNumber = cleanMobile;
      } else if (landline) {
        const cleanLandline = landline
          .split('/')[0]
          .trim()
          .replace(/[^0-9+]/g, '');
        if (cleanLandline) dialNumber = cleanLandline;
      }

      const notes = dataNotes.filter((note) => note.facility_id === fac.id);
      const detailsId = `facility-details-${fac.id}`;

      let bhsExtraHtml = '';
      if (fac.category === 'Barangay Health Station') {
        bhsExtraHtml = `
          <div class="bhs-meta-grid">
            <div class="bhs-meta-item">
              <span class="bhs-meta-label">Punong Barangay:</span>
              <span class="bhs-meta-val">${escapeHtml(fac.punong_barangay || 'N/A')}</span>
            </div>
            ${
              fac.population_served
                ? `<div class="bhs-meta-item">
                     <span class="bhs-meta-label">Pop. Served:</span>
                     <span class="bhs-meta-val">${fac.population_served.toLocaleString('en-PH')}</span>
                   </div>`
                : ''
            }
          </div>
        `;
      }

      const contactLines = [
        mobile ? contactLine('bi-phone-fill', 'tel:' + mobile.split('/')[0].trim(), mobile) : '',
        landline
          ? contactLine('bi-telephone-fill', 'tel:' + landline.split('/')[0].trim(), landline)
          : '',
        email ? contactLine('bi-envelope-fill', 'mailto:' + email, email) : '',
      ].filter(Boolean);

      const licenceRows = [
        detailRow('DOH registry code', fac.doh_code),
        detailRow('DOH licensing list', formatDate(fac.accreditations?.hfsrb_as_of), 'as of '),
        detailRow('DOH licence valid to', formatDate(fac.accreditations?.doh_license_validity)),
        detailRow('YAKAP Konsulta list no.', fac.accreditations?.yakap_konsulta_no),
        detailRow(
          'YAKAP Konsulta valid to',
          formatDate(fac.accreditations?.yakap_konsulta_valid_until)
        ),
        detailRow('GAMOT provider list no.', fac.accreditations?.gamot_provider_no),
        detailRow(
          'GAMOT accreditation valid to',
          formatDate(fac.accreditations?.gamot_valid_until)
        ),
        detailRow('YAKAP coverage', yakapParentLabel(fac)),
        detailRow('Drug-testing accreditation no.', fac.accreditations?.dtl_accreditation_no),
        detailRow('Drug-testing list', formatDate(fac.accreditations?.dtl_list_as_of), 'as of '),
        detailRow(
          'Animal-bite certification valid to',
          formatDate(fac.accreditations?.abtc_validity)
        ),
        // DOH publishes this as "ABC" -- authorised bed capacity.
        detailRow('DOH-authorised beds', fac.bed_capacity),
      ].filter(Boolean);

      html += `
        <article class="facility-card ${isYakap ? 'facility-card--yakap' : ''} ${isGovt ? 'facility-card--govt' : 'facility-card--private'}">
          <div class="facility-card-header">
            <div class="facility-badge-strip">
              <span class="badge ${isGovt ? 'badge-govt' : 'badge-private'}">
                <i class="bi ${isGovt ? 'bi-bank' : 'bi-building'}"></i> ${fac.ownership || 'Facility'}
              </span>
              ${
                isKonsulta
                  ? `<span class="badge badge-yakap ${konsultaLapsed ? 'badge--lapsed' : ''}" title="On the PhilHealth list of Accredited YAKAP Clinics -- free consultations and laboratory tests">
                       <i class="bi bi-patch-check-fill"></i> YAKAP Konsulta${konsultaLapsed ? ' (lapsed)' : ''}
                     </span>`
                  : ''
              }
              ${
                isGamot
                  ? `<span class="badge badge-gamot ${gamotLapsed ? 'badge--lapsed' : ''}" title="On the PhilHealth list of Accredited GAMOT Package Providers -- dispenses the free YAKAP maintenance medicines">
                       <i class="bi bi-capsule"></i> YAKAP GAMOT${gamotLapsed ? ' (lapsed)' : ''}
                     </span>`
                  : ''
              }
              ${
                isAbtc
                  ? `<span class="badge badge-abtc ${abtcLapsed ? 'badge--lapsed' : ''}" title="${
                      abtcLapsed
                        ? 'Animal-bite certification lapsed on ' +
                          formatDate(fac.accreditations?.abtc_validity) +
                          ' -- call before you travel'
                        : 'DOH-certified Animal Bite Treatment Centre'
                    }">
                       <i class="bi bi-bandaid-fill"></i> Animal Bite Centre${abtcLapsed ? ' (lapsed)' : ''}
                     </span>`
                  : ''
              }
              ${
                isDoh && !isYakap
                  ? `<span class="badge badge-doh" title="DOH Licensed Health Facility">
                       <i class="bi bi-check2-circle"></i> DOH Licensed
                     </span>`
                  : ''
              }
            </div>
            <h3 class="facility-title">
              <i class="bi ${icon} facility-type-icon" aria-hidden="true"></i>
              <span>${escapeHtml(fac.name)}</span>
            </h3>
            <p class="facility-type-desc">${escapeHtml(fac.type || fac.category)}</p>
          </div>

          <div class="facility-card-body">
            <div class="facility-location">
              <i class="bi bi-geo-alt-fill location-icon" aria-hidden="true"></i>
              <div class="location-text">
                <strong>${escapeHtml(fac.address?.barangay || fac.address?.city || 'Legazpi City')}</strong>
                <span>${escapeHtml([fac.address?.building, fac.address?.street, fac.address?.city, fac.address?.province].filter(Boolean).join(', '))}</span>
              </div>
            </div>

            ${contactLines.length ? `<div class="facility-contacts">${contactLines[0]}</div>` : ''}

          </div>

          <button type="button" class="facility-disclosure" aria-expanded="false" aria-controls="${escapeHtml(detailsId)}" data-facility-toggle>
            <span class="facility-disclosure-label">Details${notes.length ? ' &amp; source note' : ''}</span>
            <i class="bi bi-chevron-down facility-disclosure-icon" aria-hidden="true"></i>
          </button>

          <div class="facility-details" id="${escapeHtml(detailsId)}" hidden>
            ${bhsExtraHtml}

            <div class="facility-details-group">
              <h4 class="facility-details-heading">Contact</h4>
              ${
                contactLines.length
                  ? `<div class="facility-contacts">${contactLines.join('')}</div>`
                  : '<p class="facility-details-empty">DOH does not publish contact details for this facility.</p>'
              }
            </div>

            ${
              licenceRows.length
                ? `<div class="facility-details-group">
                     <h4 class="facility-details-heading">Registration &amp; licensing</h4>
                     <dl class="facility-detail-list">${licenceRows.join('')}</dl>
                   </div>`
                : ''
            }

            ${
              notes.length
                ? `<div class="facility-source-note">
                     <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
                     <div>
                       ${notes.map((note) => `<p>${escapeHtml(note.note)}</p>`).join('')}
                       <a href="#references" class="facility-source-link">Read the source notes</a>
                     </div>
                   </div>`
                : ''
            }
          </div>

          <div class="facility-card-footer">
            ${
              dialNumber
                ? `<a href="tel:${escapeHtml(dialNumber)}" class="facility-action-btn facility-action-btn--primary">
                     <i class="bi bi-telephone-fill"></i> Call Facility
                   </a>`
                : `<span class="facility-action-btn facility-action-btn--unlisted">
                     <i class="bi bi-telephone-x"></i> Contact Unlisted
                   </span>`
            }
            <a href="${mapUrl}" target="_blank" rel="noopener noreferrer" class="facility-action-btn facility-action-btn--secondary">
              <i class="bi bi-map"></i> View Map
            </a>
          </div>
        </article>
      `;
    });

    DOM.grid.innerHTML = html;

    // Load More Visibility
    if (DOM.loadMoreContainer) {
      if (visibleItems.length < filteredFacilities.length) {
        DOM.loadMoreContainer.style.display = 'flex';
        if (DOM.loadMoreBtn) {
          const remaining = filteredFacilities.length - visibleItems.length;
          DOM.loadMoreBtn.textContent = `Show More Facilities (${remaining} remaining)`;
        }
      } else {
        DOM.loadMoreContainer.style.display = 'none';
      }
    }
  }

  function contactLine(icon, href, label) {
    return `
      <div class="contact-line">
        <i class="bi ${icon}"></i>
        <a href="${escapeHtml(href)}" class="contact-link">${escapeHtml(label)}</a>
      </div>
    `;
  }

  function detailRow(label, value, prefix) {
    if (!value) return '';
    return `
      <div class="facility-detail-row">
        <dt>${escapeHtml(label)}</dt>
        <dd>${escapeHtml((prefix || '') + value)}</dd>
      </div>
    `;
  }

  /**
   * An accreditation with a past expiry date is not a current accreditation.
   * The published lists keep lapsed entries, so a badge rendered straight from
   * the flag can promise a service the facility may no longer be certified to
   * give -- animal-bite treatment being the case that matters most.
   */
  function hasLapsed(value) {
    if (!value) return false;
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return false;
    return parsed < new Date();
  }

  function formatDate(value) {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value);
    return parsed.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  /**
   * Fill in each category chip's count from the data and hide the ones that
   * would return nothing, so a chip never promises results it cannot show.
   */
  function renderCategoryChips() {
    if (!DOM.categoryPills) return;

    DOM.categoryPills.forEach((pill) => {
      const category = pill.getAttribute('data-category');
      const label = pill.querySelector('[data-chip-count]');
      if (!label) return;

      let total;
      if (category === 'all') {
        total = allFacilities.length;
      } else if (category === 'yakap-accredited') {
        total = allFacilities.filter((f) => f.accreditations?.is_yakap_konsulta).length;
      } else if (category === 'abtc-certified') {
        total = allFacilities.filter((f) => f.accreditations?.is_abtc_certified).length;
      } else {
        total = allFacilities.filter((f) => f.category === category).length;
      }

      // The parentheses are written here rather than in the markup, where the
      // formatter would wrap them onto their own lines and render as "( 8 )".
      label.textContent = `(${total})`;
      if (total === 0 && category !== 'all') {
        pill.hidden = true;
      }
    });

    updateChipOverflowLabel();
  }

  function updateChipOverflowLabel() {
    if (!DOM.chipOverflowBtn) return;
    const hidden = Array.prototype.filter.call(
      document.querySelectorAll('.health-cat-pill[data-secondary]'),
      (pill) => !pill.hidden
    ).length;

    if (hidden === 0) {
      DOM.chipOverflowBtn.hidden = true;
      return;
    }
    const expanded = DOM.chipOverflowBtn.getAttribute('aria-expanded') === 'true';
    DOM.chipOverflowBtn.querySelector('[data-chip-overflow-label]').textContent = expanded
      ? 'Fewer categories'
      : `${hidden} more`;
  }

  /**
   * Render the citation list and the source notes, and advertise both on the
   * collapsed header so a reader knows the notes are there without opening it.
   */
  function renderReferences() {
    if (DOM.referencesList) {
      DOM.referencesList.innerHTML = dataSources
        .map((source) => {
          // HFSRB titles already end in "(as of <date>)", so repeating the
          // date would read twice in the same citation.
          const asOf =
            source.as_of && !/as of/i.test(source.title) ? ` (${escapeHtml(source.as_of)})` : '';
          const link = source.url
            ? ` <a href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(source.url)}</a>`
            : '';
          return `<li>${escapeHtml(source.publisher)}${asOf}. <em>${escapeHtml(source.title)}</em>.${link}</li>`;
        })
        .join('');
    }

    if (DOM.referencesNotes) {
      const byId = {};
      allFacilities.forEach((facility) => {
        byId[facility.id] = facility.name;
      });
      DOM.referencesNotes.innerHTML = dataNotes.length
        ? dataNotes
            .map((note) => {
              const subject = byId[note.facility_id];
              return `<li>${subject ? `<strong>${escapeHtml(subject)}</strong> &mdash; ` : ''}${escapeHtml(note.note)}</li>`;
            })
            .join('')
        : '<li>No source conflicts recorded for the current dataset.</li>';
    }

    if (DOM.referencesBadge) {
      const sources = dataSources.length;
      const notes = dataNotes.length;
      DOM.referencesBadge.textContent = `${sources} source${sources === 1 ? '' : 's'} · ${notes} data note${notes === 1 ? '' : 's'}`;
    }
  }

  function setDisclosure(button, panel, expand) {
    button.setAttribute('aria-expanded', expand ? 'true' : 'false');
    panel.hidden = !expand;
  }

  function attachDisclosureHandlers() {
    if (DOM.grid) {
      // Delegated so the handlers survive every re-render, and so cards open
      // independently -- opening one does not close another elsewhere in the
      // grid, which at this many cards would be disorienting.
      DOM.grid.addEventListener('click', (event) => {
        const trigger = event.target.closest('[data-facility-toggle]');
        if (!trigger) return;

        const card = trigger.closest('.facility-card');
        const button = card && card.querySelector('[data-facility-toggle]');
        const panel = card && card.querySelector('.facility-details');
        if (!button || !panel) return;

        setDisclosure(button, panel, button.getAttribute('aria-expanded') !== 'true');
      });
    }

    if (DOM.chipOverflowBtn) {
      DOM.chipOverflowBtn.addEventListener('click', () => {
        const expanded = DOM.chipOverflowBtn.getAttribute('aria-expanded') === 'true';
        DOM.chipOverflowBtn.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        document.querySelectorAll('.health-cat-pill[data-secondary]').forEach((pill) => {
          pill.classList.toggle('is-revealed', !expanded);
        });
        updateChipOverflowLabel();
      });
    }

    // There is more than one references block on the page -- the facility
    // directory has its own, and so does the GAMOT provider list -- so these are
    // wired by their aria-controls rather than by a single known id.
    const referencePairs = Array.from(document.querySelectorAll('.health-references-toggle'))
      .map((toggle) => ({
        toggle,
        panel: document.getElementById(toggle.getAttribute('aria-controls')),
      }))
      .filter((pair) => pair.panel);

    referencePairs.forEach(({ toggle, panel }) => {
      toggle.addEventListener('click', () => {
        setDisclosure(toggle, panel, toggle.getAttribute('aria-expanded') !== 'true');
      });
    });

    // A card's source note links to #references; arriving there should not land
    // the reader on a section that is still shut.
    const openFromHash = () => {
      const target = window.location.hash.slice(1);
      if (!target) return;
      const pair = referencePairs.find(
        ({ toggle, panel }) =>
          toggle.closest('.health-references')?.id === target || panel.id === target
      );
      if (pair) setDisclosure(pair.toggle, pair.panel, true);
    };
    window.addEventListener('hashchange', openFromHash);
    openFromHash();
  }

  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    };
    return String(text).replace(/[&<>"']/g, (m) => map[m]);
  }

  function showError(msg) {
    if (DOM.grid) {
      DOM.grid.innerHTML = `
        <div class="directory-error-state">
          <i class="bi bi-exclamation-octagon-fill"></i>
          <h4>Unable to Load Directory</h4>
          <p>${escapeHtml(msg)}</p>
          <button class="btn btn-primary mt-3" onclick="location.reload()">Retry</button>
        </div>
      `;
    }
  }

  // Initialize once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
