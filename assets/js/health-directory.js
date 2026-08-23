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
    emptyState: null
  };

  function init() {
    DOM.container = document.getElementById('health-directory-app');
    if (!DOM.container) return;

    cacheDomElements();
    attachEventListeners();
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
    DOM.categoryPills = document.querySelectorAll('.health-cat-pill');
    DOM.ownershipSelect = document.getElementById('health-ownership-filter');
    DOM.filterYakapCheck = document.getElementById('filter-yakap-only');
    DOM.filter247Check = document.getElementById('filter-247-only');
    DOM.resultCount = document.getElementById('health-result-count');
    DOM.loadMoreContainer = document.getElementById('health-load-more-wrap');
    DOM.loadMoreBtn = document.getElementById('health-load-more-btn');
    DOM.emptyState = document.getElementById('health-empty-state');
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
          filteredFacilities = [...allFacilities];
          updateStats();
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
      const shcCount = (summaryCounts.super_health_centers || 0) + (summaryCounts.birthing_homes || 0);
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
        const services = Array.isArray(facility.services) ? facility.services.join(' ').toLowerCase() : '';
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
      const icon = getCategoryIcon(fac.category);

      const mapQuery = encodeURIComponent(`${fac.name}, ${fac.address?.barangay || ''}, Legazpi City, Albay`);
      const mapUrl = `https://www.google.com/maps/search/?api=1&query=${mapQuery}`;

      // Contact Info Strings
      const landline = fac.contact?.landline && fac.contact.landline !== 'N/A' ? fac.contact.landline : null;
      const mobile = fac.contact?.mobile && fac.contact.mobile !== 'N/A' ? fac.contact.mobile : null;
      const email = fac.contact?.email && fac.contact.email !== 'N/A' ? fac.contact.email : null;

      // Extract primary dial number
      let dialNumber = null;
      if (mobile) {
        const cleanMobile = mobile.split('/')[0].trim().replace(/[^0-9+]/g, '');
        if (cleanMobile) dialNumber = cleanMobile;
      } else if (landline) {
        const cleanLandline = landline.split('/')[0].trim().replace(/[^0-9+]/g, '');
        if (cleanLandline) dialNumber = cleanLandline;
      }

      // Services chips
      let servicesHtml = '';
      if (Array.isArray(fac.services) && fac.services.length > 0) {
        servicesHtml = `
          <div class="facility-services-wrap">
            <span class="facility-services-label"><i class="bi bi-tag-fill"></i> Services:</span>
            <div class="facility-services-tags">
              ${fac.services
                .slice(0, 5)
                .map((s) => `<span class="service-pill">${escapeHtml(s)}</span>`)
                .join('')}
              ${fac.services.length > 5 ? `<span class="service-pill service-pill-more">+${fac.services.length - 5} more</span>` : ''}
            </div>
          </div>
        `;
      }

      // BHS Specific info
      let bhsExtraHtml = '';
      if (fac.category === 'Barangay Health Station') {
        bhsExtraHtml = `
          <div class="bhs-meta-grid">
            <div class="bhs-meta-item">
              <span class="bhs-meta-label">Punong Barangay:</span>
              <span class="bhs-meta-val">${escapeHtml(fac.punong_barangay || 'N/A')}</span>
            </div>
            ${fac.population_served ? `
              <div class="bhs-meta-item">
                <span class="bhs-meta-label">Pop. Served:</span>
                <span class="bhs-meta-val">${fac.population_served.toLocaleString('en-PH')}</span>
              </div>
            ` : ''}
          </div>
        `;
      }

      html += `
        <article class="facility-card ${isYakap ? 'facility-card--yakap' : ''} ${isGovt ? 'facility-card--govt' : 'facility-card--private'}">
          <div class="facility-card-header">
            <div class="facility-badge-strip">
              <span class="badge ${isGovt ? 'badge-govt' : 'badge-private'}">
                <i class="bi ${isGovt ? 'bi-bank' : 'bi-building'}"></i> ${fac.ownership || 'Facility'}
              </span>
              ${isYakap ? `
                <span class="badge badge-yakap" title="Accredited PhilHealth YAKAP Clinic (Konsulta & GAMOT)">
                  <i class="bi bi-patch-check-fill"></i> PhilHealth YAKAP
                </span>
              ` : ''}
              ${is247 ? `
                <span class="badge badge-247" title="Open 24 Hours / Emergency Response">
                  <i class="bi bi-clock-fill"></i> 24/7 Emergency
                </span>
              ` : ''}
              ${isDoh && !isYakap ? `
                <span class="badge badge-doh" title="DOH Licensed Health Facility">
                  <i class="bi bi-check2-circle"></i> DOH Licensed
                </span>
              ` : ''}
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

            ${bhsExtraHtml}

            <div class="facility-contacts">
              ${mobile ? `
                <div class="contact-line">
                  <i class="bi bi-phone-fill"></i>
                  <a href="tel:${escapeHtml(mobile.split('/')[0].trim())}" class="contact-link">${escapeHtml(mobile)}</a>
                </div>
              ` : ''}
              ${landline ? `
                <div class="contact-line">
                  <i class="bi bi-telephone-fill"></i>
                  <a href="tel:${escapeHtml(landline.split('/')[0].trim())}" class="contact-link">${escapeHtml(landline)}</a>
                </div>
              ` : ''}
              ${email ? `
                <div class="contact-line">
                  <i class="bi bi-envelope-fill"></i>
                  <a href="mailto:${escapeHtml(email)}" class="contact-link">${escapeHtml(email)}</a>
                </div>
              ` : ''}
            </div>

            ${servicesHtml}
          </div>

          <div class="facility-card-footer">
            ${dialNumber ? `
              <a href="tel:${escapeHtml(dialNumber)}" class="facility-action-btn facility-action-btn--primary">
                <i class="bi bi-telephone-fill"></i> Call Facility
              </a>
            ` : ''}
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

  function escapeHtml(text) {
    if (!text) return '';
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
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
