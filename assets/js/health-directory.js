/**
 * BetterLegazpi - Health Facilities Directory & SSOT Client
 * Provides dynamic search, category filtering, accreditation badges,
 * and responsive rendering of Legazpi City's health facilities.
 */
(function () {
  'use strict';

  const PAGE_SIZE = 12;
  let allFacilities = [];
  let filteredFacilities = [];
  let summaryCounts = {};
  let dataNotes = [];
  let dataSources = [];
  let currentPage = 1;
  let activeCategory = 'all';
  let activeOwnership = 'all';
  let activeFilterYakapOnly = false;
  let activeFilter247Only = false;
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
    filter247Check: null,
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
    DOM.statsSuperCenters = document.getElementById('stat-super-centers');
    DOM.statsBhs = document.getElementById('stat-bhs');
    DOM.searchInput = document.getElementById('health-search-input');
    DOM.searchClear = document.getElementById('health-search-clear');
    // The overflow control shares the pill styling but is not a filter, so it
    // is excluded here by requiring a category.
    DOM.categoryPills = document.querySelectorAll('.health-cat-pill[data-category]');
    DOM.ownershipSelect = document.getElementById('health-ownership-filter');
    DOM.filterYakapCheck = document.getElementById('filter-yakap-only');
    DOM.filter247Check = document.getElementById('filter-247-only');
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

    if (DOM.filter247Check) {
      DOM.filter247Check.addEventListener('change', (e) => {
        activeFilter247Only = e.target.checked;
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
    activeFilter247Only = false;

    if (DOM.ownershipSelect) DOM.ownershipSelect.value = 'all';
    if (DOM.filterYakapCheck) DOM.filterYakapCheck.checked = false;
    if (DOM.filter247Check) DOM.filter247Check.checked = false;

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
          dataNotes = data._data_notes || [];
          dataSources = data._sources || [];
          filteredFacilities = [...allFacilities];
          updateStats();
          renderCategoryChips();
          renderReferences();
          applyFilters();
        })
        .catch(() => {
          tryFetch(index + 1);
        });
    };

    tryFetch(0);
  }

  function updateStats() {
    if (DOM.statsTotal && summaryCounts.total) {
      DOM.statsTotal.textContent = summaryCounts.total;
    }
    if (DOM.statsHospitals && summaryCounts.hospitals) {
      DOM.statsHospitals.textContent = summaryCounts.hospitals;
    }
    if (DOM.statsYakap && summaryCounts.yakap_accredited) {
      DOM.statsYakap.textContent = summaryCounts.yakap_accredited;
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
          if (!facility.accreditations?.is_yakap_accredited) return false;
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
      if (activeFilterYakapOnly && !facility.accreditations?.is_yakap_accredited) {
        return false;
      }

      // 4. 24/7 Emergency Only Toggle
      if (activeFilter247Only && !facility.emergency_24_7) {
        return false;
      }

      // 5. Search Query
      if (searchQuery) {
        const name = (facility.name || '').toLowerCase();
        const shortName = (facility.short_name || '').toLowerCase();
        const bgy = (facility.address?.barangay || '').toLowerCase();
        const street = (facility.address?.street || '').toLowerCase();
        const cat = (facility.category || '').toLowerCase();
        const type = (facility.type || '').toLowerCase();
        const services = Array.isArray(facility.services)
          ? facility.services.join(' ').toLowerCase()
          : '';
        const pb = (facility.punong_barangay || '').toLowerCase();

        const match =
          name.includes(searchQuery) ||
          shortName.includes(searchQuery) ||
          bgy.includes(searchQuery) ||
          street.includes(searchQuery) ||
          cat.includes(searchQuery) ||
          type.includes(searchQuery) ||
          services.includes(searchQuery) ||
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

    const visibleItems = filteredFacilities.slice(0, currentPage * PAGE_SIZE);

    let html = '';
    visibleItems.forEach((fac) => {
      const isYakap = fac.accreditations?.is_yakap_accredited;
      const isDoh = fac.accreditations?.is_doh_licensed;
      const is247 = fac.emergency_24_7;
      const isGovt = fac.ownership === 'Government';
      const isAbtc = fac.accreditations?.is_abtc_certified;
      const icon = getCategoryIcon(fac.category);

      const mapQuery = encodeURIComponent(
        `${fac.name}, ${fac.address?.barangay || ''}, Legazpi City, Albay`
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
      const services = Array.isArray(fac.services) ? fac.services : [];
      const detailsId = `facility-details-${fac.id}`;

      // The card face shows a sample of services. The rest live in the details
      // panel, and the "+N more" chip is the control that opens it rather than
      // a label that goes nowhere.
      const PREVIEW = 3;
      let servicesHtml = '';
      if (services.length > 0) {
        const hidden = services.length - PREVIEW;
        servicesHtml = `
          <div class="facility-services-wrap">
            <span class="facility-services-label"><i class="bi bi-tag-fill"></i> Services:</span>
            <div class="facility-services-tags">
              ${services
                .slice(0, PREVIEW)
                .map((s) => `<span class="service-pill">${escapeHtml(s)}</span>`)
                .join('')}
              ${
                hidden > 0
                  ? `<button type="button" class="service-pill service-pill-more" data-facility-expand aria-controls="${escapeHtml(detailsId)}">+${hidden} more</button>`
                  : ''
              }
            </div>
          </div>
        `;
      }

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
        detailRow('PhilHealth YAKAP valid to', formatDate(fac.accreditations?.yakap_validity)),
        detailRow('YAKAP code', fac.yakap_code),
        detailRow(
          'Animal-bite certification valid to',
          formatDate(fac.accreditations?.abtc_validity)
        ),
      ].filter(Boolean);

      html += `
        <article class="facility-card ${isYakap ? 'facility-card--yakap' : ''} ${isGovt ? 'facility-card--govt' : 'facility-card--private'}">
          <div class="facility-card-header">
            <div class="facility-badge-strip">
              <span class="badge ${isGovt ? 'badge-govt' : 'badge-private'}">
                <i class="bi ${isGovt ? 'bi-bank' : 'bi-building'}"></i> ${fac.ownership || 'Facility'}
              </span>
              ${
                isYakap
                  ? `<span class="badge badge-yakap" title="Accredited PhilHealth YAKAP Clinic (Konsulta &amp; GAMOT)">
                       <i class="bi bi-patch-check-fill"></i> PhilHealth YAKAP
                     </span>`
                  : ''
              }
              ${
                is247
                  ? `<span class="badge badge-247" title="Open 24 Hours / Emergency Response">
                       <i class="bi bi-clock-fill"></i> 24/7 Emergency
                     </span>`
                  : ''
              }
              ${
                isAbtc
                  ? `<span class="badge badge-abtc" title="DOH-certified Animal Bite Treatment Centre">
                       <i class="bi bi-bandaid-fill"></i> Animal Bite Centre
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
                <strong>${escapeHtml(fac.address?.barangay || 'Legazpi City')}</strong>
                <span>${escapeHtml([fac.address?.building, fac.address?.street, fac.address?.city, fac.address?.province].filter(Boolean).join(', '))}</span>
              </div>
            </div>

            ${contactLines.length ? `<div class="facility-contacts">${contactLines[0]}</div>` : ''}

            ${servicesHtml}
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
              services.length
                ? `<div class="facility-details-group">
                     <h4 class="facility-details-heading">All services</h4>
                     <div class="facility-services-tags">
                       ${services.map((sv) => `<span class="service-pill">${escapeHtml(sv)}</span>`).join('')}
                     </div>
                   </div>`
                : ''
            }

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
        total = allFacilities.filter((f) => f.accreditations?.is_yakap_accredited).length;
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
        const trigger = event.target.closest('[data-facility-toggle], [data-facility-expand]');
        if (!trigger) return;

        const card = trigger.closest('.facility-card');
        const button = card && card.querySelector('[data-facility-toggle]');
        const panel = card && card.querySelector('.facility-details');
        if (!button || !panel) return;

        const expand = trigger.hasAttribute('data-facility-expand')
          ? true
          : button.getAttribute('aria-expanded') !== 'true';
        setDisclosure(button, panel, expand);
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

    if (DOM.referencesToggle && DOM.referencesPanel) {
      DOM.referencesToggle.addEventListener('click', () => {
        const expanded = DOM.referencesToggle.getAttribute('aria-expanded') === 'true';
        setDisclosure(DOM.referencesToggle, DOM.referencesPanel, !expanded);
      });

      // A card's source note links to #references; arriving there should not
      // land the reader on a section that is still shut.
      const openFromHash = () => {
        if (window.location.hash === '#references') {
          setDisclosure(DOM.referencesToggle, DOM.referencesPanel, true);
        }
      };
      window.addEventListener('hashchange', openFromHash);
      openFromHash();
    }
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
