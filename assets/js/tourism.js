/**
 * BetterLegazpi - Tourism & Travel Guide Interactive Engine
 * Multi-Page aware: Powers both the Main Showcase Hub and dedicated Category Sub-pages
 */

(function () {
  'use strict';

  // State
  const state = {
    pageType: 'hub', // 'hub' | 'attractions' | 'experience' | 'food' | 'accommodations' | 'landmarks'
    data: null,
    barangays: [],
    items: [],
    filteredItems: [],
    activeSubcategory: 'all',
    selectedDistrict: 'all',
    selectedBarangay: 'all',
    searchQuery: '',
    sortBy: 'default',
    viewMode: 'grid', // 'grid' | 'table'
    currentPage: 1,
    itemsPerPage: 24
  };

  // DOM References
  const DOM = {
    body: document.body,
    searchInput: document.getElementById('tourism-search'),
    clearSearchBtn: document.getElementById('tourism-search-clear'),
    districtSelect: document.getElementById('tourism-district-select'),
    barangaySelect: document.getElementById('tourism-barangay-select'),
    sortSelect: document.getElementById('tourism-sort-select'),
    subcategoryContainer: document.getElementById('tourism-subcategory-container'),
    gridContainer: document.getElementById('tourism-grid-container'),
    tableWrapper: document.getElementById('tourism-table-wrapper'),
    tableBody: document.getElementById('tourism-table-body'),
    resultsCount: document.getElementById('tourism-results-count'),
    activeFilters: document.getElementById('tourism-active-filters'),
    emptyState: document.getElementById('tourism-empty-state'),
    btnResetFilters: document.getElementById('tourism-reset-filters'),
    paginationContainer: document.getElementById('tourism-pagination'),
    prevPageBtn: document.getElementById('tourism-prev-page'),
    nextPageBtn: document.getElementById('tourism-next-page'),
    pageInfo: document.getElementById('tourism-page-info'),
    viewGridBtn: document.getElementById('tourism-view-grid'),
    viewTableBtn: document.getElementById('tourism-view-table')
  };

  const DISTRICTS = {
    port: {
      name: 'Port District',
      numbers: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 17, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40]
    },
    old_albay: {
      name: 'Old Albay District',
      numbers: [11, 13, 14, 15, 16, 18, 19, 20, 21, 22, 41, 48, 49, 50]
    },
    northern: {
      name: 'Northern Coastal',
      numbers: [42, 45, 46, 47, 51, 52, 53, 54, 65]
    },
    southern: {
      name: 'Southern Coastal',
      numbers: [55, 56, 57, 58, 59, 60, 61, 62]
    },
    upland: {
      name: 'Upland & Rural',
      numbers: [43, 44, 63, 64, 66, 67, 68, 69, 70]
    }
  };

  function getBarangayNumber(name) {
    if (!name) return null;
    const m = String(name).match(/(?:Bgy\.?|Barangay)\s*(\d+)/i);
    return m ? parseInt(m[1], 10) : null;
  }

  function debounce(fn, delay) {
    let timer = null;
    return function (...args) {
      clearTimeout(timer);
      timer = setTimeout(() => fn.apply(this, args), delay);
    };
  }

  function escapeHTML(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  const LEGAZPI_SEAL_PATH = '../assets/images/logo/legazpi-city-seal.png';

  function setupGlobalImageFallbacks() {
    function processImage(img) {
      if (!img || img.getAttribute('data-fallback-applied') === 'true') return;
      if (img.complete && (img.naturalWidth === 0 || img.naturalHeight === 0)) {
        applySealFallback(img);
      } else {
        img.addEventListener('error', function () {
          applySealFallback(this);
        });
      }
    }

    const selectors = '.tourism-featured-card__img, .tourism-exp-card__img, .tourism-delicacy-card__img, .tourism-card__img, .place-cell-thumb';
    document.querySelectorAll(selectors).forEach(processImage);

    // Capture phase listener for any async or dynamic images
    window.addEventListener(
      'error',
      function (e) {
        if (e.target && e.target.tagName === 'IMG') {
          if (
            e.target.matches &&
            e.target.matches(selectors)
          ) {
            applySealFallback(e.target);
          }
        }
      },
      true
    );
  }

  function applySealFallback(img) {
    if (!img || img.getAttribute('data-fallback-applied') === 'true') return;
    img.setAttribute('data-fallback-applied', 'true');
    img.src = LEGAZPI_SEAL_PATH;
    img.classList.add('tourism-seal-fallback-img');
    if (img.parentElement) {
      img.parentElement.classList.add('tourism-seal-fallback-media');
    }
  }

  /**
   * Initializes page based on data-tourism-category attribute
   */
  async function init() {
    const pageCat = DOM.body.getAttribute('data-tourism-category') || 'hub';
    state.pageType = pageCat;

    // Run global image error catchers on all pages (including Hub)
    setupGlobalImageFallbacks();

    const basePath = window.location.pathname.includes('/tourism') ? '../data/' : 'data/';

    try {
      // Fetch PSGC Barangays
      fetch(basePath + 'barangays.json')
        .then(r => (r.ok ? r.json() : { data: [] }))
        .then(bgData => {
          state.barangays = bgData.data || [];
          populateBarangayDropdown();
        })
        .catch(() => {});

      if (state.pageType === 'hub') {
        // Main Hub page doesn't need to load heavy directory tables
        return;
      }

      // Load specific category dataset
      let jsonFile = 'tourism.json';
      if (state.pageType === 'attractions') jsonFile = 'tourism-attractions.json';
      else if (state.pageType === 'experience') jsonFile = 'tourism-experience.json';
      else if (state.pageType === 'food') jsonFile = 'tourism-food.json';
      else if (state.pageType === 'accommodations') jsonFile = 'tourism-accommodations.json';
      else if (state.pageType === 'landmarks') jsonFile = 'tourism-travel.json';

      const res = await fetch(basePath + jsonFile);
      if (!res.ok) throw new Error(`HTTP error ${res.status}`);
      const json = await res.json();

      // Format items
      if (state.pageType === 'food') {
        const ests = (json.establishments || json.data || []).map(e => ({
          ...e,
          categoryLabel: 'Food Establishment',
          foodGroup: getFoodNormalizedGroup(e)
        }));
        state.items = ests;
      } else {
        state.items = (json.data || json.attractions || json.activities || json.accommodations || json.travel_spots || []).map(i => ({
          ...i,
          categoryLabel: getCategoryDisplayName(state.pageType)
        }));
      }

      setInitialSortDefault();
      renderSubcategories();
      readUrlParams();
      attachEventListeners();
      applyFilters();
    } catch (err) {
      console.error('Error loading tourism dataset:', err);
      if (DOM.gridContainer) {
        DOM.gridContainer.innerHTML = `
          <div class="tourism-empty-state" style="grid-column: 1 / -1;">
            <i class="bi bi-exclamation-triangle-fill"></i>
            <h3>Unable to load category directory</h3>
            <p>Please check your connection or refresh the page.</p>
          </div>
        `;
      }
    }
  }

  function getFoodNormalizedGroup(item) {
    const raw = (item.subcategory || item.classification || '').toUpperCase();
    if (raw.includes('RESTAURANT') || raw.includes('GRILL') || raw.includes('KOREAN BBQ')) {
      if (raw.includes('BAR')) return 'restobars';
      return 'restaurants';
    }
    if (raw.includes('CAFE') || raw.includes('COFFEE') || raw.includes('TEA') || raw.includes('PASTRIES') || raw.includes('BAKERY')) {
      if (raw.includes('MILK TEA')) return 'milktea';
      return 'cafes';
    }
    if (raw.includes('BAR') || raw.includes('RESTOBAR') || raw.includes('LOUNGE') || raw.includes('CLUB')) {
      return 'restobars';
    }
    if (raw.includes('FASTFOOD') || raw.includes('FOOD SERVICE') || raw.includes('SNACK') || raw.includes('KIOSK') || raw.includes('FOOD HUB')) {
      return 'fastfood';
    }
    if (raw.includes('MILK TEA')) return 'milktea';
    return 'other';
  }

  function setInitialSortDefault() {
    if (!DOM.sortSelect) return;
    if (state.pageType === 'food') {
      state.sortBy = 'name_asc';
      DOM.sortSelect.value = 'name_asc';
    } else if (state.pageType === 'accommodations') {
      state.sortBy = 'accredited_first';
      DOM.sortSelect.value = 'accredited_first';
    } else {
      state.sortBy = 'featured_first';
      DOM.sortSelect.value = 'featured_first';
    }
  }

  function getCategoryDisplayName(type) {
    switch (type) {
      case 'attractions': return 'Tourist Attraction';
      case 'experience': return 'Experience & Adventure';
      case 'food': return 'Cuisine & Dining';
      case 'accommodations': return 'Accommodation';
      case 'landmarks': return 'Landmark & Spot';
      default: return 'Destination';
    }
  }

  function populateBarangayDropdown() {
    if (!DOM.barangaySelect) return;

    let optionsHtml = '<option value="all">All Barangays</option>';

    let list = [...state.barangays].sort((a, b) => (a.barangay_number || 0) - (b.barangay_number || 0));

    if (state.selectedDistrict !== 'all') {
      const distNumbers = DISTRICTS[state.selectedDistrict]?.numbers || [];
      list = list.filter(bg => distNumbers.includes(bg.barangay_number));
    }

    list.forEach(bg => {
      optionsHtml += `<option value="${escapeHTML(bg.name)}">${escapeHTML(bg.name)}</option>`;
    });

    DOM.barangaySelect.innerHTML = optionsHtml;
    DOM.barangaySelect.value = state.selectedBarangay;
  }

  /**
   * Option C Subcategory Chips with Top 5 Primary Chips + "More Categories" Select
   */
  function renderSubcategories() {
    if (!DOM.subcategoryContainer) return;

    if (state.pageType === 'food') {
      const counts = {
        all: state.items.length,
        restaurants: state.items.filter(i => i.foodGroup === 'restaurants').length,
        cafes: state.items.filter(i => i.foodGroup === 'cafes').length,
        restobars: state.items.filter(i => i.foodGroup === 'restobars').length,
        fastfood: state.items.filter(i => i.foodGroup === 'fastfood').length,
        milktea: state.items.filter(i => i.foodGroup === 'milktea').length,
        other: state.items.filter(i => i.foodGroup === 'other').length
      };

      const primary = [
        { id: 'all', label: 'All', count: counts.all },
        { id: 'restaurants', label: 'Restaurants & Dining', count: counts.restaurants },
        { id: 'cafes', label: 'Cafes & Coffee Shops', count: counts.cafes },
        { id: 'restobars', label: 'Restobars & Grills', count: counts.restobars },
        { id: 'fastfood', label: 'Fast Food & Snacks', count: counts.fastfood }
      ];

      const niche = [
        { id: 'milktea', label: 'Milk Tea & Beverages', count: counts.milktea },
        { id: 'other', label: 'Food Hubs & Specialty', count: counts.other }
      ];

      DOM.subcategoryContainer.style.display = 'flex';
      let chipsHtml = '';

      primary.forEach(p => {
        const isActive = state.activeSubcategory === p.id;
        chipsHtml += `
          <button type="button" class="tourism-sub-chip ${isActive ? 'active' : ''}" data-subcat="${p.id}">
            ${escapeHTML(p.label)} (${p.count})
          </button>
        `;
      });

      const isNicheActive = niche.some(n => n.id === state.activeSubcategory);
      chipsHtml += `
        <select id="tourism-more-category-select" class="tourism-niche-select ${isNicheActive ? 'active' : ''}" aria-label="More Dining Categories">
          <option value="">More Categories...</option>
          ${niche.map(n => `<option value="${n.id}" ${state.activeSubcategory === n.id ? 'selected' : ''}>${escapeHTML(n.label)} (${n.count})</option>`).join('')}
        </select>
      `;

      DOM.subcategoryContainer.innerHTML = chipsHtml;
      return;
    }

    const subcats = new Set();
    state.items.forEach(item => {
      if (item.subcategory) subcats.add(item.subcategory);
    });

    if (subcats.size <= 1) {
      DOM.subcategoryContainer.style.display = 'none';
      return;
    }

    DOM.subcategoryContainer.style.display = 'flex';
    let chipsHtml = `
      <button type="button" class="tourism-sub-chip ${state.activeSubcategory === 'all' ? 'active' : ''}" data-subcat="all">
        All (${state.items.length})
      </button>
    `;

    Array.from(subcats).sort().forEach(sc => {
      const count = state.items.filter(i => i.subcategory === sc).length;
      chipsHtml += `
        <button type="button" class="tourism-sub-chip ${state.activeSubcategory === sc ? 'active' : ''}" data-subcat="${escapeHTML(sc)}">
          ${escapeHTML(sc)} (${count})
        </button>
      `;
    });

    DOM.subcategoryContainer.innerHTML = chipsHtml;
  }

  function readUrlParams() {
    const params = new URLSearchParams(window.location.search);
    if (params.has('q')) {
      state.searchQuery = params.get('q').trim();
      if (DOM.searchInput) DOM.searchInput.value = state.searchQuery;
      if (DOM.clearSearchBtn && state.searchQuery) DOM.clearSearchBtn.style.display = 'block';
    }
    if (params.has('sub')) {
      state.activeSubcategory = params.get('sub');
      renderSubcategories();
    }
    if (params.has('dist')) {
      state.selectedDistrict = params.get('dist');
      if (DOM.districtSelect) DOM.districtSelect.value = state.selectedDistrict;
      populateBarangayDropdown();
    }
    if (params.has('bgy')) {
      state.selectedBarangay = params.get('bgy');
      if (DOM.barangaySelect) DOM.barangaySelect.value = state.selectedBarangay;
    }
    if (params.has('sort')) {
      state.sortBy = params.get('sort');
      if (DOM.sortSelect) DOM.sortSelect.value = state.sortBy;
    }
  }

  function applyFilters() {
    let result = [...state.items];

    // Subcategory / Category Group filter
    if (state.activeSubcategory !== 'all') {
      if (state.pageType === 'food') {
        result = result.filter(item => item.foodGroup === state.activeSubcategory);
      } else {
        result = result.filter(item => item.subcategory === state.activeSubcategory);
      }
    }

    // District filter
    if (state.selectedDistrict !== 'all') {
      const distNumbers = DISTRICTS[state.selectedDistrict]?.numbers || [];
      result = result.filter(item => {
        const bNum = getBarangayNumber(item.barangay_name);
        if (bNum && distNumbers.includes(bNum)) return true;

        const addr = (item.address || '').toLowerCase();
        if (state.selectedDistrict === 'old_albay' && (addr.includes('old albay') || addr.includes('peñaranda') || addr.includes('penaranda'))) return true;
        if (state.selectedDistrict === 'port' && (addr.includes('port') || addr.includes('pier') || addr.includes('embarcadero') || addr.includes('rizal'))) return true;
        return false;
      });
    }

    // Barangay filter
    if (state.selectedBarangay !== 'all') {
      result = result.filter(item => {
        if (!item.barangay_name) return false;
        return item.barangay_name.toLowerCase() === state.selectedBarangay.toLowerCase();
      });
    }

    // Search query filter
    if (state.searchQuery.trim() !== '') {
      const q = state.searchQuery.toLowerCase();
      result = result.filter(item => {
        return (
          (item.name && item.name.toLowerCase().includes(q)) ||
          (item.description && item.description.toLowerCase().includes(q)) ||
          (item.address && item.address.toLowerCase().includes(q)) ||
          (item.barangay_name && item.barangay_name.toLowerCase().includes(q)) ||
          (item.subcategory && item.subcategory.toLowerCase().includes(q)) ||
          (item.owner && item.owner.toLowerCase().includes(q)) ||
          (item.classification && item.classification.toLowerCase().includes(q))
        );
      });
    }

    // Sorting logic (Option A)
    if (state.sortBy === 'name_asc') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (state.sortBy === 'name_desc') {
      result.sort((a, b) => b.name.localeCompare(a.name));
    } else if (state.sortBy === 'barangay_asc') {
      result.sort((a, b) => {
        const bgA = a.barangay_name || 'ZZZ';
        const bgB = b.barangay_name || 'ZZZ';
        const cmp = bgA.localeCompare(bgB);
        if (cmp !== 0) return cmp;
        return a.name.localeCompare(b.name);
      });
    } else if (state.sortBy === 'accredited_first') {
      result.sort((a, b) => {
        const accA = a.classification || a.contact ? 0 : 1;
        const accB = b.classification || b.contact ? 0 : 1;
        if (accA !== accB) return accA - accB;
        return a.name.localeCompare(b.name);
      });
    } else {
      // Default / Featured first
      result.sort((a, b) => {
        const fA = a.image_url && !a.image_url.includes('seal') ? 0 : 1;
        const fB = b.image_url && !b.image_url.includes('seal') ? 0 : 1;
        if (fA !== fB) return fA - fB;
        return a.name.localeCompare(b.name);
      });
    }

    state.filteredItems = result;
    state.currentPage = 1;

    renderActiveFilterTags();
    renderResults();
  }

  function renderActiveFilterTags() {
    if (!DOM.activeFilters) return;
    const tags = [];

    if (state.activeSubcategory !== 'all') {
      let label = state.activeSubcategory;
      if (state.pageType === 'food') {
        const labels = {
          restaurants: 'Restaurants & Dining',
          cafes: 'Cafes & Coffee Shops',
          restobars: 'Restobars & Grills',
          fastfood: 'Fast Food & Snacks',
          milktea: 'Milk Tea & Beverages',
          delicacies: 'Signature Delicacies',
          other: 'Specialty & Hubs'
        };
        label = labels[state.activeSubcategory] || state.activeSubcategory;
      }
      tags.push(`
        <span class="tourism-filter-tag">
          Category: ${escapeHTML(label)}
          <button type="button" data-clear="subcategory" aria-label="Clear category filter">&times;</button>
        </span>
      `);
    }

    if (state.selectedDistrict !== 'all') {
      const distName = DISTRICTS[state.selectedDistrict]?.name || state.selectedDistrict;
      tags.push(`
        <span class="tourism-filter-tag">
          District: ${escapeHTML(distName)}
          <button type="button" data-clear="district" aria-label="Clear district filter">&times;</button>
        </span>
      `);
    }

    if (state.selectedBarangay !== 'all') {
      tags.push(`
        <span class="tourism-filter-tag">
          Barangay: ${escapeHTML(state.selectedBarangay)}
          <button type="button" data-clear="barangay" aria-label="Clear barangay filter">&times;</button>
        </span>
      `);
    }

    if (state.searchQuery.trim() !== '') {
      tags.push(`
        <span class="tourism-filter-tag">
          "${escapeHTML(state.searchQuery)}"
          <button type="button" data-clear="search" aria-label="Clear search filter">&times;</button>
        </span>
      `);
    }

    DOM.activeFilters.innerHTML = tags.join('');
  }

  function renderResults() {
    const total = state.filteredItems.length;

    if (DOM.resultsCount) {
      DOM.resultsCount.innerHTML = `Showing <strong>${total}</strong> ${total === 1 ? 'result' : 'results'}`;
    }

    if (total === 0) {
      if (DOM.gridContainer) DOM.gridContainer.style.display = 'none';
      if (DOM.tableWrapper) DOM.tableWrapper.style.display = 'none';
      if (DOM.paginationContainer) DOM.paginationContainer.style.display = 'none';
      if (DOM.emptyState) DOM.emptyState.style.display = 'block';
      return;
    }

    if (DOM.emptyState) DOM.emptyState.style.display = 'none';

    const startIdx = (state.currentPage - 1) * state.itemsPerPage;
    const endIdx = startIdx + state.itemsPerPage;
    const pageItems = state.filteredItems.slice(startIdx, endIdx);
    const totalPages = Math.ceil(total / state.itemsPerPage);

    if (state.viewMode === 'grid') {
      if (DOM.gridContainer) DOM.gridContainer.style.display = 'grid';
      if (DOM.tableWrapper) DOM.tableWrapper.style.display = 'none';
      renderGrid(pageItems);
    } else {
      if (DOM.gridContainer) DOM.gridContainer.style.display = 'none';
      if (DOM.tableWrapper) DOM.tableWrapper.style.display = 'block';
      renderTable(pageItems);
    }

    renderPagination(totalPages);
  }

  const LEGAZPI_SEAL_LOCAL = '../assets/images/logo/legazpi-city-seal.png';
  const LEGAZPI_SEAL_URL = 'https://legazpi.gov.ph/wp-content/uploads/2025/07/NEW-LOGO.png';

  function renderGrid(items) {
    if (!DOM.gridContainer) return;
    let html = '';

    items.forEach(item => {
      const imgSrc = item.image || item.image_url;
      const attrHtml = item.imageAttribution
        ? `<div class="tourism-card__attribution" title="Photo Source: ${escapeHTML(item.imageAttribution)}"><i class="bi bi-camera-fill"></i> ${escapeHTML(item.imageAttribution)}</div>`
        : '';

      const mediaHtml = imgSrc
        ? `<img src="${escapeHTML(imgSrc)}" alt="${escapeHTML(item.name)}" class="tourism-card__img" loading="lazy" onerror="this.onerror=null; this.src='${LEGAZPI_SEAL_LOCAL}'; this.classList.add('tourism-seal-fallback-img'); this.parentElement.classList.add('tourism-seal-fallback-media'); const b = this.parentElement.querySelector('.tourism-card__attribution'); if (b) b.remove();" />${attrHtml}`
        : `<img src="${LEGAZPI_SEAL_LOCAL}" alt="City of Legazpi Seal" class="tourism-card__img tourism-seal-fallback-img" loading="lazy" onerror="this.src='${LEGAZPI_SEAL_URL}';" />`;

      let metaHtml = '';
      if (item.address) {
        metaHtml += `
          <div class="tourism-meta-item">
            <i class="bi bi-geo-alt-fill" aria-hidden="true"></i>
            <span>${escapeHTML(item.address)}</span>
          </div>
        `;
      }

      if (item.barangay_name) {
        metaHtml += `
          <div class="tourism-meta-item">
            <span class="barangay-tag"><i class="bi bi-pin-map-fill"></i> ${escapeHTML(item.barangay_name)}</span>
          </div>
        `;
      }

      if (item.contact) {
        metaHtml += `
          <div class="tourism-meta-item">
            <i class="bi bi-telephone-fill" aria-hidden="true"></i>
            <div class="tourism-card__contacts">
              ${formatContactLinks(item.contact)}
            </div>
          </div>
        `;
      }

      if (item.owner) {
        metaHtml += `
          <div class="tourism-meta-item" style="font-size: 0.8rem; opacity: 0.85;">
            <i class="bi bi-person-fill" aria-hidden="true"></i>
            <span>Owner / Operator: ${escapeHTML(item.owner)}</span>
          </div>
        `;
      }

      html += `
        <article class="tourism-card" data-id="${escapeHTML(item.id)}">
          <div class="tourism-card__media ${!imgSrc ? 'tourism-seal-fallback-media' : ''}">
            ${mediaHtml}
            <div class="tourism-card__badges">
              <span class="tourism-badge tourism-badge--category">${escapeHTML(item.subcategory || item.categoryLabel)}</span>
              ${item.classification || item.contact ? `<span class="tourism-badge tourism-badge--verified"><i class="bi bi-patch-check-fill"></i> LGU Verified</span>` : ''}
            </div>
          </div>
          <div class="tourism-card__body">
            <h3 class="tourism-card__title">${escapeHTML(item.name)}</h3>
            ${item.description ? `<p class="tourism-card__desc">${escapeHTML(item.description)}</p>` : ''}
            <div class="tourism-card__meta">
              ${metaHtml}
            </div>
            <div class="tourism-card__actions">
              <a href="${escapeHTML(item.google_maps_url)}" target="_blank" rel="noopener noreferrer" class="tourism-btn-map" aria-label="Open ${escapeHTML(item.name)} in Google Maps">
                <i class="bi bi-geo-alt"></i>
                <span>Open in Google Maps</span>
                <i class="bi bi-box-arrow-up-right" style="font-size: 0.8rem;" aria-hidden="true"></i>
              </a>
            </div>
          </div>
        </article>
      `;
    });

    DOM.gridContainer.innerHTML = html;
  }

  function renderTable(items) {
    if (!DOM.tableBody) return;
    let html = '';

    items.forEach(item => {
      const imgSrc = item.image || item.image_url;
      const thumbHtml = imgSrc
        ? `<img src="${escapeHTML(imgSrc)}" alt="" class="place-cell-thumb" loading="lazy" onerror="this.onerror=null; this.src='${LEGAZPI_SEAL_LOCAL}';" />`
        : `<img src="${LEGAZPI_SEAL_LOCAL}" alt="" class="place-cell-thumb" loading="lazy" onerror="this.src='${LEGAZPI_SEAL_URL}';" style="object-fit:contain;background:#0f172a;padding:4px;" />`;

      let contactCell = '-';
      if (item.contact) {
        contactCell = formatContactLinks(item.contact);
      }

      html += `
        <tr>
          <td>
            <div class="place-cell">
              ${thumbHtml}
              <div class="place-cell-meta">
                <span class="place-cell-name">${escapeHTML(item.name)}</span>
                <span class="place-cell-category">${escapeHTML(item.subcategory || item.categoryLabel)}</span>
              </div>
            </div>
          </td>
          <td><span class="barangay-tag"><i class="bi bi-pin-map-fill"></i> ${escapeHTML(item.barangay_name || 'Legazpi City')}</span></td>
          <td><span class="tourism-table-desc">${escapeHTML(item.address || '-')}</span></td>
          <td>${contactCell}</td>
          <td>
            <a href="${escapeHTML(item.google_maps_url)}" target="_blank" rel="noopener noreferrer" class="tourism-btn-table-map" aria-label="Map directions for ${escapeHTML(item.name)}">
              <i class="bi bi-geo-alt-fill"></i> Map
            </a>
          </td>
        </tr>
      `;
    });

    DOM.tableBody.innerHTML = html;
  }

  function formatContactLinks(contactStr) {
    if (!contactStr) return '-';
    const parts = contactStr.split(/[\/,]/).map(s => s.trim()).filter(Boolean);
    return parts
      .map(p => {
        if (p.includes('@')) {
          return `<a href="mailto:${escapeHTML(p)}" class="contact-pill"><i class="bi bi-envelope-fill"></i> ${escapeHTML(p)}</a>`;
        }
        const cleanedPhone = p.replace(/[^\d+]/g, '');
        return `<a href="tel:${cleanedPhone}" class="contact-pill"><i class="bi bi-telephone-fill"></i> ${escapeHTML(p)}</a>`;
      })
      .join(' ');
  }

  function renderPagination(totalPages) {
    if (!DOM.paginationContainer) return;

    if (totalPages <= 1) {
      DOM.paginationContainer.style.display = 'none';
      return;
    }

    DOM.paginationContainer.style.display = 'flex';
    if (DOM.pageInfo) {
      DOM.pageInfo.textContent = `Page ${state.currentPage} of ${totalPages}`;
    }

    if (DOM.prevPageBtn) {
      DOM.prevPageBtn.disabled = state.currentPage <= 1;
    }

    if (DOM.nextPageBtn) {
      DOM.nextPageBtn.disabled = state.currentPage >= totalPages;
    }
  }

  function attachEventListeners() {
    if (DOM.searchInput) {
      DOM.searchInput.addEventListener(
        'input',
        debounce(e => {
          state.searchQuery = e.target.value.trim();
          if (DOM.clearSearchBtn) {
            DOM.clearSearchBtn.style.display = state.searchQuery ? 'block' : 'none';
          }
          applyFilters();
        }, 250)
      );
    }

    if (DOM.clearSearchBtn) {
      DOM.clearSearchBtn.addEventListener('click', () => {
        if (DOM.searchInput) DOM.searchInput.value = '';
        state.searchQuery = '';
        DOM.clearSearchBtn.style.display = 'none';
        applyFilters();
      });
    }

    if (DOM.districtSelect) {
      DOM.districtSelect.addEventListener('change', e => {
        state.selectedDistrict = e.target.value;
        state.selectedBarangay = 'all';
        populateBarangayDropdown();
        applyFilters();
      });
    }

    if (DOM.barangaySelect) {
      DOM.barangaySelect.addEventListener('change', e => {
        state.selectedBarangay = e.target.value;
        applyFilters();
      });
    }

    if (DOM.sortSelect) {
      DOM.sortSelect.addEventListener('change', e => {
        state.sortBy = e.target.value;
        applyFilters();
      });
    }

    if (DOM.subcategoryContainer) {
      DOM.subcategoryContainer.addEventListener('click', e => {
        const chip = e.target.closest('.tourism-sub-chip');
        if (!chip) return;
        state.activeSubcategory = chip.getAttribute('data-subcat');
        const allChips = DOM.subcategoryContainer.querySelectorAll('.tourism-sub-chip');
        allChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        const nicheSelect = document.getElementById('tourism-more-category-select');
        if (nicheSelect) {
          nicheSelect.value = '';
          nicheSelect.classList.remove('active');
        }
        applyFilters();
      });

      DOM.subcategoryContainer.addEventListener('change', e => {
        if (e.target && e.target.id === 'tourism-more-category-select') {
          const val = e.target.value;
          if (val) {
            state.activeSubcategory = val;
            const allChips = DOM.subcategoryContainer.querySelectorAll('.tourism-sub-chip');
            allChips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
          } else {
            state.activeSubcategory = 'all';
            renderSubcategories();
            applyFilters();
          }
        }
      });
    }

    if (DOM.viewGridBtn) {
      DOM.viewGridBtn.addEventListener('click', () => {
        state.viewMode = 'grid';
        DOM.viewGridBtn.classList.add('active');
        DOM.viewGridBtn.setAttribute('aria-pressed', 'true');
        if (DOM.viewTableBtn) {
          DOM.viewTableBtn.classList.remove('active');
          DOM.viewTableBtn.setAttribute('aria-pressed', 'false');
        }
        renderResults();
      });
    }

    if (DOM.viewTableBtn) {
      DOM.viewTableBtn.addEventListener('click', () => {
        state.viewMode = 'table';
        DOM.viewTableBtn.classList.add('active');
        DOM.viewTableBtn.setAttribute('aria-pressed', 'true');
        if (DOM.viewGridBtn) {
          DOM.viewGridBtn.classList.remove('active');
          DOM.viewGridBtn.setAttribute('aria-pressed', 'false');
        }
        renderResults();
      });
    }

    if (DOM.activeFilters) {
      DOM.activeFilters.addEventListener('click', e => {
        const btn = e.target.closest('button[data-clear]');
        if (!btn) return;
        const type = btn.getAttribute('data-clear');
        if (type === 'subcategory') {
          state.activeSubcategory = 'all';
          renderSubcategories();
        } else if (type === 'district') {
          state.selectedDistrict = 'all';
          if (DOM.districtSelect) DOM.districtSelect.value = 'all';
          populateBarangayDropdown();
        } else if (type === 'barangay') {
          state.selectedBarangay = 'all';
          if (DOM.barangaySelect) DOM.barangaySelect.value = 'all';
        } else if (type === 'search') {
          state.searchQuery = '';
          if (DOM.searchInput) DOM.searchInput.value = '';
          if (DOM.clearSearchBtn) DOM.clearSearchBtn.style.display = 'none';
        }
        applyFilters();
      });
    }

    if (DOM.btnResetFilters) {
      DOM.btnResetFilters.addEventListener('click', () => {
        state.activeSubcategory = 'all';
        state.selectedDistrict = 'all';
        state.selectedBarangay = 'all';
        state.searchQuery = '';
        setInitialSortDefault();
        if (DOM.searchInput) DOM.searchInput.value = '';
        if (DOM.clearSearchBtn) DOM.clearSearchBtn.style.display = 'none';
        if (DOM.districtSelect) DOM.districtSelect.value = 'all';
        populateBarangayDropdown();
        renderSubcategories();
        applyFilters();
      });
    }

    if (DOM.prevPageBtn) {
      DOM.prevPageBtn.addEventListener('click', () => {
        if (state.currentPage > 1) {
          state.currentPage--;
          renderResults();
          const toolbar = document.querySelector('.tourism-toolbar');
          if (toolbar) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }

    if (DOM.nextPageBtn) {
      DOM.nextPageBtn.addEventListener('click', () => {
        const totalPages = Math.ceil(state.filteredItems.length / state.itemsPerPage);
        if (state.currentPage < totalPages) {
          state.currentPage++;
          renderResults();
          const toolbar = document.querySelector('.tourism-toolbar');
          if (toolbar) toolbar.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
