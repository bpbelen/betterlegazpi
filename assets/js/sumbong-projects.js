// The Flood Control Watch - Sumbong sa Pangulo & DPWH Flood Control Projects Dynamic Renderer
(function () {
  'use strict';

  const PAGE_SIZE = 6;
  let allSumbongProjects = [];
  let filteredSumbongProjects = [];
  let currentPage = 1;
  let currentYear = 'all';
  let currentType = 'all';
  let currentContractor = 'all';
  let searchQuery = '';
  let currentSort = 'cost-desc';
  let expandedProjectId = null;

  function formatCurrency(amount) {
    if (!amount) return '₱0.00';
    return '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatSummaryCost(amount) {
    if (!amount) return '₱0.00';
    if (amount >= 1e9) return `₱${(amount / 1e9).toFixed(2)}B`;
    if (amount >= 1e6) return `₱${(amount / 1e6).toFixed(1)}M`;
    return `₱${amount.toLocaleString('en-PH')}`;
  }

  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '…';
  }

  function getTypeIcon(type) {
    if (!type) return '<i class="bi bi-water"></i>';
    const t = type.toLowerCase();
    if (t.includes('dike')) return '<i class="bi bi-bricks"></i>';
    if (t.includes('slope') || t.includes('revetment')) return '<i class="bi bi-shield-shaded"></i>';
    if (t.includes('repair') || t.includes('rehabilitation')) return '<i class="bi bi-tools"></i>';
    if (t.includes('drainage')) return '<i class="bi bi-droplet-half"></i>';
    if (t.includes('river bank') || t.includes('river')) return '<i class="bi bi-water"></i>';
    if (t.includes('upgrading')) return '<i class="bi bi-arrow-up-right-circle"></i>';
    return '<i class="bi bi-shield-check"></i>';
  }

  function init() {
    const container = document.getElementById('sumbong-projects-container');
    if (!container) return;

    fetch('../data/sumbong-flood-control.json')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load flood control data');
        return res.json();
      })
      .then((data) => {
        allSumbongProjects = data.projects || [];
        filteredSumbongProjects = [...allSumbongProjects];
        renderInterface(container, data);
      })
      .catch((err) => {
        console.error('Error initializing The Flood Control Watch projects:', err);
        fetch('/data/sumbong-flood-control.json')
          .then((r) => r.json())
          .then((data) => {
            allSumbongProjects = data.projects || [];
            filteredSumbongProjects = [...allSumbongProjects];
            renderInterface(container, data);
          })
          .catch((e) => {
            container.innerHTML = `<p class="text-muted text-center py-4">Unable to load flood control projects.</p>`;
          });
      });
  }

  function getAvailableYears() {
    const years = new Set();
    allSumbongProjects.forEach((p) => {
      if (p.fundingYear) years.add(p.fundingYear);
      else if (p.year) years.add(p.year);
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }

  function getAvailableTypes() {
    const typesMap = {};
    allSumbongProjects.forEach((p) => {
      const t = p.typeOfWork || 'Other';
      typesMap[t] = (typesMap[t] || 0) + 1;
    });
    return Object.entries(typesMap).sort((a, b) => b[1] - a[1]);
  }

  function getAvailableContractors() {
    const contractorsMap = {};
    allSumbongProjects.forEach((p) => {
      const c = p.contractor || 'DPWH';
      contractorsMap[c] = (contractorsMap[c] || 0) + 1;
    });
    return Object.entries(contractorsMap).sort((a, b) => b[1] - a[1]);
  }

  function applyFilters() {
    let result = [...allSumbongProjects];

    // 1. Year Filter
    if (currentYear !== 'all') {
      result = result.filter((p) => String(p.fundingYear || p.year) === String(currentYear));
    }

    // 2. Type of Work Filter
    if (currentType !== 'all') {
      result = result.filter((p) => p.typeOfWork === currentType);
    }

    // 3. Contractor Filter
    if (currentContractor !== 'all') {
      result = result.filter((p) => p.contractor === currentContractor);
    }

    // 4. Search Filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.contractor && p.contractor.toLowerCase().includes(q)) ||
          (p.id && p.id.toLowerCase().includes(q)) ||
          (p.contractId && p.contractId.toLowerCase().includes(q)) ||
          (p.projectId && p.projectId.toLowerCase().includes(q)) ||
          (p.typeOfWork && p.typeOfWork.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q))
        );
      });
    }

    // 5. Sorting
    if (currentSort === 'cost-desc') {
      result.sort((a, b) => (b.cost || 0) - (a.cost || 0));
    } else if (currentSort === 'cost-asc') {
      result.sort((a, b) => (a.cost || 0) - (b.cost || 0));
    } else if (currentSort === 'abc-desc') {
      result.sort((a, b) => (b.abc || 0) - (a.abc || 0));
    } else if (currentSort === 'abc-asc') {
      result.sort((a, b) => (a.abc || 0) - (b.abc || 0));
    } else if (currentSort === 'date-desc') {
      result.sort((a, b) => {
        const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
        const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
        return dateB - dateA;
      });
    } else if (currentSort === 'date-asc') {
      result.sort((a, b) => {
        const dateA = a.completionDate ? new Date(a.completionDate).getTime() : Infinity;
        const dateB = b.completionDate ? new Date(b.completionDate).getTime() : Infinity;
        return dateA - dateB;
      });
    } else if (currentSort === 'project-id-desc') {
      result.sort((a, b) => (b.projectId || b.id || '').localeCompare(a.projectId || a.id || ''));
    } else if (currentSort === 'project-id-asc') {
      result.sort((a, b) => (a.projectId || a.id || '').localeCompare(b.projectId || b.id || ''));
    }

    filteredSumbongProjects = result;
    updateExportCounts();
  }

  function updateExportCounts() {
    const csvFilteredCount = document.getElementById('sumbong-csv-filtered-count');
    const pdfFilteredCount = document.getElementById('sumbong-pdf-filtered-count');
    if (csvFilteredCount) csvFilteredCount.textContent = filteredSumbongProjects.length;
    if (pdfFilteredCount) pdfFilteredCount.textContent = filteredSumbongProjects.length;
  }

  function renderInterface(container, data) {
    const years = getAvailableYears();
    const types = getAvailableTypes();
    const contractors = getAvailableContractors();
    const totalInvest = data.summary.totalCost || allSumbongProjects.reduce((s, p) => s + (p.cost || 0), 0);

    container.innerHTML = `
      <!-- Toolbar: Summary stats, Export buttons & Filters -->
      <div class="sumbong-toolbar">
        <div class="sumbong-top-bar">
          <div class="sumbong-stats-badge">
            <i class="bi bi-shield-check"></i>
            <span><strong>${allSumbongProjects.length} Flood Control Projects</strong> (${formatSummaryCost(totalInvest)} Total)</span>
          </div>

          <div class="dpwh-export-group">
            <!-- CSV Export Dropdown -->
            <div class="dpwh-export-dropdown-wrapper" id="sumbong-csv-dropdown-wrapper">
              <button type="button" class="dpwh-btn-export" id="sumbong-csv-toggle-btn" title="Download CSV Spreadsheet">
                <i class="bi bi-file-earmark-spreadsheet"></i> CSV <i class="bi bi-chevron-down"></i>
              </button>
              <div class="dpwh-export-menu" id="sumbong-csv-export-menu">
                <button type="button" class="dpwh-export-item" id="sumbong-export-csv-filtered">
                  <i class="bi bi-funnel"></i>
                  <div>
                    <div class="dpwh-export-item-title">Filtered Dataset</div>
                    <div class="dpwh-export-item-sub"><span id="sumbong-csv-filtered-count">${filteredSumbongProjects.length}</span> matching projects</div>
                  </div>
                </button>
                <button type="button" class="dpwh-export-item" id="sumbong-export-csv-all">
                  <i class="bi bi-database"></i>
                  <div>
                    <div class="dpwh-export-item-title">Full Dataset</div>
                    <div class="dpwh-export-item-sub">All ${allSumbongProjects.length} projects</div>
                  </div>
                </button>
              </div>
            </div>

            <!-- PDF Export Dropdown -->
            <div class="dpwh-export-dropdown-wrapper" id="sumbong-pdf-dropdown-wrapper">
              <button type="button" class="dpwh-btn-export" id="sumbong-pdf-toggle-btn" title="Print or Save PDF Report">
                <i class="bi bi-printer"></i> PDF <i class="bi bi-chevron-down"></i>
              </button>
              <div class="dpwh-export-menu" id="sumbong-pdf-export-menu">
                <button type="button" class="dpwh-export-item" id="sumbong-export-pdf-filtered">
                  <i class="bi bi-funnel"></i>
                  <div>
                    <div class="dpwh-export-item-title">Filtered Report</div>
                    <div class="dpwh-export-item-sub"><span id="sumbong-pdf-filtered-count">${filteredSumbongProjects.length}</span> matching projects</div>
                  </div>
                </button>
                <button type="button" class="dpwh-export-item" id="sumbong-export-pdf-all">
                  <i class="bi bi-file-earmark-pdf"></i>
                  <div>
                    <div class="dpwh-export-item-title">Full Report</div>
                    <div class="dpwh-export-item-sub">All ${allSumbongProjects.length} projects</div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="sumbong-filter-controls">
          <div class="sumbong-search-wrap">
            <i class="bi bi-search"></i>
            <input type="text" id="sumbong-search-input" placeholder="Search project, contractor, ID..." aria-label="Search flood control projects">
          </div>

          <select id="sumbong-type-select" class="sumbong-select" aria-label="Filter by Type of Work">
            <option value="all">All Types (${allSumbongProjects.length})</option>
            ${types.map(([t, cnt]) => `<option value="${t}">${truncateText(t, 32)} (${cnt})</option>`).join('')}
          </select>

          <select id="sumbong-year-select" class="sumbong-select" aria-label="Filter by Year">
            <option value="all">All Years (${allSumbongProjects.length})</option>
            ${years.map((y) => `<option value="${y}">Year ${y}</option>`).join('')}
          </select>

          <select id="sumbong-contractor-select" class="sumbong-select" aria-label="Filter by Contractor">
            <option value="all">All Contractors (${contractors.length})</option>
            ${contractors.map(([c, cnt]) => `<option value="${c}">${truncateText(c, 24)} (${cnt})</option>`).join('')}
          </select>

          <select id="sumbong-sort-select" class="sumbong-select" aria-label="Sort flood control projects">
            <option value="cost-desc">Highest Contract Cost</option>
            <option value="cost-asc">Lowest Contract Cost</option>
            <option value="abc-desc">Highest Budget (ABC)</option>
            <option value="abc-asc">Lowest Budget (ABC)</option>
            <option value="date-desc">Latest Completion Date</option>
            <option value="date-asc">Earliest Completion Date</option>
            <option value="project-id-desc">Highest Project ID</option>
            <option value="project-id-asc">Lowest Project ID</option>
          </select>
        </div>
      </div>

      <!-- Active Filter Chips -->
      <div id="sumbong-active-chips-container"></div>

      <!-- Cards Grid / List -->
      <div id="sumbong-cards-container" class="sumbong-cards-list"></div>

      <!-- Pagination Bar -->
      <div id="sumbong-pagination-container" class="dpwh-pagination" style="margin-top: 24px;"></div>
    `;

    renderActiveChips();
    renderCards();
    attachListeners();
  }

  function renderActiveChips() {
    const chipsContainer = document.getElementById('sumbong-active-chips-container');
    if (!chipsContainer) return;

    const chips = [];

    if (currentType !== 'all') {
      chips.push({ type: 'type', label: `Type: ${truncateText(currentType, 24)}` });
    }
    if (currentYear !== 'all') {
      chips.push({ type: 'year', label: `Year: ${currentYear}` });
    }
    if (currentContractor !== 'all') {
      chips.push({ type: 'contractor', label: `Contractor: ${truncateText(currentContractor, 20)}` });
    }
    if (searchQuery.trim()) {
      chips.push({ type: 'search', label: `Search: "${searchQuery.trim()}"` });
    }

    if (chips.length === 0) {
      chipsContainer.innerHTML = '';
      return;
    }

    chipsContainer.innerHTML = `
      <div class="dpwh-active-filters-bar" style="margin-bottom: 16px;">
        <span class="dpwh-active-filters-label"><i class="bi bi-funnel-fill"></i> Active Filters:</span>
        ${chips
          .map(
            (c) => `
          <span class="dpwh-filter-chip">
            ${c.label}
            <button type="button" class="dpwh-filter-chip-remove" data-filter-type="${c.type}" title="Remove filter" aria-label="Remove filter">
              <i class="bi bi-x"></i>
            </button>
          </span>
        `
          )
          .join('')}
        <button type="button" class="dpwh-filter-clear-all" id="sumbong-clear-all-filters">Clear All</button>
      </div>
    `;

    chipsContainer.querySelectorAll('.dpwh-filter-chip-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = btn.dataset.filterType;
        if (t === 'type') {
          currentType = 'all';
          const sel = document.getElementById('sumbong-type-select');
          if (sel) sel.value = 'all';
        } else if (t === 'year') {
          currentYear = 'all';
          const sel = document.getElementById('sumbong-year-select');
          if (sel) sel.value = 'all';
        } else if (t === 'contractor') {
          currentContractor = 'all';
          const sel = document.getElementById('sumbong-contractor-select');
          if (sel) sel.value = 'all';
        } else if (t === 'search') {
          searchQuery = '';
          const inp = document.getElementById('sumbong-search-input');
          if (inp) inp.value = '';
        }
        currentPage = 1;
        applyFilters();
        renderActiveChips();
        renderCards();
      });
    });

    const clearAllBtn = document.getElementById('sumbong-clear-all-filters');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        currentType = 'all';
        currentYear = 'all';
        currentContractor = 'all';
        searchQuery = '';

        const typeSel = document.getElementById('sumbong-type-select');
        const yearSel = document.getElementById('sumbong-year-select');
        const contSel = document.getElementById('sumbong-contractor-select');
        const searchInp = document.getElementById('sumbong-search-input');

        if (typeSel) typeSel.value = 'all';
        if (yearSel) yearSel.value = 'all';
        if (contSel) contSel.value = 'all';
        if (searchInp) searchInp.value = '';

        currentPage = 1;
        applyFilters();
        renderActiveChips();
        renderCards();
      });
    }
  }

  function renderCards() {
    const listContainer = document.getElementById('sumbong-cards-container');
    if (!listContainer) return;

    if (filteredSumbongProjects.length === 0) {
      listContainer.innerHTML = `
        <div class="dpwh-empty-state" style="margin: 20px 0; background: white; padding: 40px; border-radius: 12px; text-align: center; border: 1px solid rgba(0,0,0,0.06);">
          <i class="bi bi-search" style="font-size: 2rem; color: #94a3b8;"></i>
          <div class="dpwh-empty-title" style="font-size: 1.125rem; font-weight: 600; margin-top: 10px; color: #1e293b;">No matching flood control projects found</div>
          <p style="color: #64748b; font-size: 0.875rem; margin-top: 4px;">Try searching for a different keyword or clearing active filters.</p>
        </div>
      `;
      renderPaginationControls();
      return;
    }

    const totalPages = Math.ceil(filteredSumbongProjects.length / PAGE_SIZE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * PAGE_SIZE;
    const endIndex = Math.min(startIndex + PAGE_SIZE, filteredSumbongProjects.length);
    const visibleProjects = filteredSumbongProjects.slice(startIndex, endIndex);

    listContainer.innerHTML = visibleProjects
      .map((p) => {
        const uniqueKey = p.projectId || p.id;
        const isExpanded = expandedProjectId === uniqueKey;
        return `
          <div class="infra-project-v5 sumbong-card ${isExpanded ? 'expanded' : ''}" data-project-key="${uniqueKey}">
            <div class="infra-project-main">
              <div class="infra-project-tags">
                <span class="infra-tag-year">${p.fundingYear || p.year || '2024'}</span>
                ${p.projectId ? `<span class="infra-tag-projid">${p.projectId}</span>` : ''}
                <span class="infra-tag-work">${getTypeIcon(p.typeOfWork)} ${p.typeOfWork}</span>
              </div>
              <div class="sumbong-title-row">
                <h3>${p.name}</h3>
                <button type="button" class="sumbong-expand-toggle" aria-expanded="${isExpanded}" aria-label="${isExpanded ? 'Hide' : 'Expand'} details for ${p.name.replace(/"/g, '&quot;')}">
                  ${isExpanded ? 'Hide Details <i class="bi bi-chevron-up" aria-hidden="true"></i>' : 'View Full Details <i class="bi bi-chevron-down" aria-hidden="true"></i>'}
                </button>
              </div>
              <p class="infra-location">
                <i class="bi bi-geo-alt"></i>
                <span>${p.location}</span>
              </p>
            </div>

            <div class="infra-project-details">
              <div class="infra-detail-row">
                <div class="infra-detail-col">
                  <span class="infra-detail-label">Contractor</span>
                  <span class="infra-detail-value">${p.contractor}</span>
                </div>
                <div class="infra-detail-col infra-detail-cost">
                  <span class="infra-detail-label">Contract Cost</span>
                  <span class="infra-detail-value">${formatCurrency(p.cost)}</span>
                </div>
                <div class="infra-detail-col">
                  <span class="infra-detail-label">Completion Date (Actual)</span>
                  <span class="infra-detail-value">${p.completionDate || '—'}</span>
                </div>
              </div>
            </div>

            <!-- Expanded Complete 16-Field Metadata Breakdown -->
            ${
              isExpanded
                ? `
              <div class="sumbong-expanded-details">
                <div class="sumbong-expanded-header">
                  <i class="bi bi-file-earmark-text-fill"></i> Complete DPWH Flood Control Project Record
                </div>
                <div class="sumbong-grid-table">
                  <div class="sumbong-field-row"><span class="sumbong-k">Region</span><span class="sumbong-v">${p.region || 'Region V'}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Legislative District</span><span class="sumbong-v">${p.legislativeDistrict || 'ALBAY (SECOND LEGISLATIVE DISTRICT)'}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">District Engineering Office</span><span class="sumbong-v">${p.districtOffice || 'Albay 2nd District Engineering Office'}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Project ID</span><span class="sumbong-v"><code>${p.projectId || p.id}</code></span></div>
                  <div class="sumbong-field-row full-width"><span class="sumbong-k">Project Name</span><span class="sumbong-v">${p.name}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Type of Work</span><span class="sumbong-v">${p.typeOfWork}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Infrastructure Type</span><span class="sumbong-v">${p.infrastructureType || 'Flood Control Structures'}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Longitude</span><span class="sumbong-v"><code>${p.longitude}</code></span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Latitude</span><span class="sumbong-v"><code>${p.latitude}</code></span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Contract ID</span><span class="sumbong-v"><code>${p.contractId || p.id}</code></span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Approved Budget for Contract (ABC)</span><span class="sumbong-v">${formatCurrency(p.abc)}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Contract Cost</span><span class="sumbong-v text-success"><strong>${formatCurrency(p.cost)}</strong></span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Start Date</span><span class="sumbong-v">${p.startDate || '—'}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Funding Year</span><span class="sumbong-v">${p.fundingYear || p.year}</span></div>
                  <div class="sumbong-field-row"><span class="sumbong-k">Completion Date (actual)</span><span class="sumbong-v">${p.completionDate || '—'}</span></div>
                  <div class="sumbong-field-row full-width"><span class="sumbong-k">Contractor</span><span class="sumbong-v"><strong>${p.contractor}</strong></span></div>
                </div>
              </div>
            `
                : ''
            }

            <div class="infra-project-footer">
              <span class="infra-source"><i class="bi bi-info-circle"></i> Source: DPWH Flood Control Projects</span>
              <div class="sumbong-card-actions">
                <a href="${p.googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="infra-link sumbong-gmaps-link" title="Open precise coordinates in Google Maps (Lat: ${p.latitude}, Lng: ${p.longitude})">
                  <i class="bi bi-geo-alt-fill"></i> View on Google Maps
                </a>
              </div>
            </div>
          </div>
        `;
      })
      .join('');

    // Attach expand/collapse listeners — card-click (except on links) or button click
    listContainer.querySelectorAll('.sumbong-card').forEach((card) => {
      card.addEventListener('click', (e) => {
        // Prevent expanding if clicking direct external links
        if (e.target.closest('a')) return;
        const key = card.dataset.projectKey;
        expandedProjectId = expandedProjectId === key ? null : key;
        renderCards();
      });
    });

    // Keyboard: allow Enter/Space on the card itself (when focus is directly on card)
    listContainer.querySelectorAll('.sumbong-card').forEach((card) => {
      card.addEventListener('keydown', (e) => {
        if (e.target.closest('.sumbong-expand-toggle')) return; // button handles its own keys
        if (e.target.closest('a')) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          const key = card.dataset.projectKey;
          expandedProjectId = expandedProjectId === key ? null : key;
          renderCards();
        }
      });
    });

    renderPaginationControls();
  }

  function renderPaginationControls() {
    const container = document.getElementById('sumbong-pagination-container');
    if (!container) return;

    const totalItems = filteredSumbongProjects.length;
    if (totalItems === 0) {
      container.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const startIndex = (currentPage - 1) * PAGE_SIZE + 1;
    const endIndex = Math.min(currentPage * PAGE_SIZE, totalItems);

    let pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages = [1, 2, 3, 4, '...', totalPages];
      } else if (currentPage >= totalPages - 2) {
        pages = [1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
      } else {
        pages = [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
      }
    }

    container.innerHTML = `
      <div class="dpwh-pagination-info">
        Showing ${startIndex} to ${endIndex} of ${totalItems} projects
      </div>
      <div class="dpwh-pagination-nav" role="navigation" aria-label="Flood control projects pagination">
        <button type="button" class="dpwh-page-btn dpwh-page-prev" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous Page">
          <i class="bi bi-chevron-left"></i>
        </button>
        ${pages
          .map((p) => {
            if (p === '...') {
              return `<span class="dpwh-page-ellipsis">…</span>`;
            }
            const isActive = p === currentPage;
            return `<button type="button" class="dpwh-page-btn ${isActive ? 'active' : ''}" data-page="${p}" ${isActive ? 'aria-current="page"' : ''}>${p}</button>`;
          })
          .join('')}
        <button type="button" class="dpwh-page-btn dpwh-page-next" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next Page">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    `;

    container.querySelectorAll('.dpwh-page-btn[data-page]').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentPage = parseInt(btn.dataset.page, 10);
        renderCards();
        scrollToSection();
      });
    });

    const prevBtn = container.querySelector('.dpwh-page-prev');
    if (prevBtn && currentPage > 1) {
      prevBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentPage--;
        renderCards();
        scrollToSection();
      });
    }

    const nextBtn = container.querySelector('.dpwh-page-next');
    if (nextBtn && currentPage < totalPages) {
      nextBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        currentPage++;
        renderCards();
        scrollToSection();
      });
    }
  }

  function scrollToSection() {
    const el = document.getElementById('sumbong-projects-container');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // --- Export Functions ---

  function exportCSV(scope) {
    const dataset = scope === 'all' ? allSumbongProjects : filteredSumbongProjects;
    if (!dataset || dataset.length === 0) {
      alert('No flood control projects available to export.');
      return;
    }

    const headers = [
      'Contract ID',
      'Project ID',
      'Project Name',
      'Location',
      'Type of Work',
      'Infrastructure Type',
      'Contractor',
      'Approved Budget (ABC)',
      'Contract Cost (PHP)',
      'Funding Year',
      'Start Date',
      'Completion Date Actual',
      'Region',
      'Province',
      'Municipality',
      'District Engineering Office',
      'Latitude',
      'Longitude',
      'Google Maps Link'
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];

    dataset.forEach((p) => {
      const row = [
        escapeCsv(p.contractId || p.id),
        escapeCsv(p.projectId || ''),
        escapeCsv(p.name),
        escapeCsv(p.location),
        escapeCsv(p.typeOfWork),
        escapeCsv(p.infrastructureType || 'Flood Control Structures'),
        escapeCsv(p.contractor),
        p.abc || 0,
        p.cost || 0,
        escapeCsv(p.fundingYear || p.year || ''),
        escapeCsv(p.startDate || ''),
        escapeCsv(p.completionDate || ''),
        escapeCsv(p.region || 'Region V'),
        escapeCsv(p.province || 'ALBAY'),
        escapeCsv(p.municipality || 'LEGAZPI CITY'),
        escapeCsv(p.districtOffice || 'Albay 2nd DEO'),
        escapeCsv(p.latitude || ''),
        escapeCsv(p.longitude || ''),
        escapeCsv(p.googleMapsUrl || '')
      ];
      csvRows.push(row.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const scopeLabel = scope === 'all' ? 'full_dataset_38' : 'filtered_view';
    link.setAttribute('href', url);
    link.setAttribute('download', `DPWH_Flood_Control_Watch_Legazpi_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportPDF(scope) {
    const dataset = scope === 'all' ? allSumbongProjects : filteredSumbongProjects;
    if (!dataset || dataset.length === 0) {
      alert('No flood control projects available to print/export.');
      return;
    }

    const totalCost = dataset.reduce((sum, p) => sum + (p.cost || 0), 0);
    const scopeLabel = scope === 'all' ? `All ${allSumbongProjects.length} Projects` : `Filtered View (${dataset.length} Projects)`;
    const reportDate = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const printWindow = window.open('', '_blank', 'width=1100,height=800');
    if (!printWindow) {
      alert('Pop-up blocked. Please allow pop-ups to generate PDF report.');
      return;
    }

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>The Flood Control Watch - Legazpi City Report</title>
        <style>
          @page { size: landscape; margin: 12mm 10mm; }
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; font-size: 11px; color: #1e293b; margin: 0; padding: 20px; }
          .header { border-bottom: 2px solid #0032a0; padding-bottom: 12px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: flex-end; }
          .title { font-size: 20px; font-weight: 800; color: #0032a0; text-transform: uppercase; margin: 0; }
          .subtitle { font-size: 12px; color: #475569; margin: 4px 0 0 0; }
          .meta { text-align: right; font-size: 10px; color: #64748b; }
          .summary-kpi { display: flex; gap: 20px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 10px 16px; margin-bottom: 16px; }
          .kpi-box { flex: 1; }
          .kpi-label { font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; }
          .kpi-val { font-size: 15px; font-weight: 800; color: #0f172a; }
          table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          th { background: #0032a0; color: white; text-align: left; padding: 6px 8px; font-size: 10px; font-weight: 700; text-transform: uppercase; }
          td { padding: 6px 8px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
          tr:nth-child(even) td { background: #f8fafc; }
          .cost-col { text-align: right; font-family: monospace; font-weight: 700; color: #166534; }
          .id-col { font-family: monospace; font-weight: 600; color: #0032a0; white-space: nowrap; }
          .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #cbd5e1; font-size: 9px; color: #64748b; display: flex; justify-content: space-between; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <h1 class="title">The Flood Control Watch</h1>
            <p class="subtitle">Flood control structure projects completed from July 2022 to May 2025 • Legazpi City, Albay</p>
          </div>
          <div class="meta">
            <div><strong>Report Scope:</strong> ${scopeLabel}</div>
            <div><strong>Generated:</strong> ${reportDate}</div>
            <div><strong>Source:</strong> DPWH Flood Control Projects / Sumbong sa Pangulo</div>
          </div>
        </div>

        <div class="summary-kpi">
          <div class="kpi-box">
            <div class="kpi-label">Total Projects</div>
            <div class="kpi-val">${dataset.length} Contracts</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Total Completed Investment</div>
            <div class="kpi-val">${formatCurrency(totalCost)}</div>
          </div>
          <div class="kpi-box">
            <div class="kpi-label">Location / Implementing Unit</div>
            <div class="kpi-val">Legazpi City • Albay 2nd DEO</div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 30px;">#</th>
              <th style="width: 80px;">Contract ID</th>
              <th style="width: 90px;">Project ID</th>
              <th>Project Description</th>
              <th style="width: 140px;">Type of Work</th>
              <th style="width: 150px;">Contractor</th>
              <th style="width: 90px; text-align: right;">Cost (PHP)</th>
              <th style="width: 75px;">Actual Date</th>
              <th style="width: 120px;">Coordinates</th>
            </tr>
          </thead>
          <tbody>
            ${dataset
              .map(
                (p, idx) => `
              <tr>
                <td>${idx + 1}</td>
                <td class="id-col">${p.contractId || p.id}</td>
                <td style="font-family: monospace; font-size: 10px;">${p.projectId || '—'}</td>
                <td><strong>${p.name}</strong></td>
                <td>${p.typeOfWork}</td>
                <td>${p.contractor}</td>
                <td class="cost-col">${formatCurrency(p.cost)}</td>
                <td>${p.completionDate || '—'}</td>
                <td style="font-family: monospace; font-size: 9px;">${p.latitude}, ${p.longitude}</td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>

        <div class="footer">
          <div>Better Legazpi Transparency Initiative • Source: Department of Public Works and Highways (DPWH)</div>
          <div>Page 1 of 1</div>
        </div>

        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  }

  function attachListeners() {
    const searchInput = document.getElementById('sumbong-search-input');
    const typeSelect = document.getElementById('sumbong-type-select');
    const yearSelect = document.getElementById('sumbong-year-select');
    const contractorSelect = document.getElementById('sumbong-contractor-select');
    const sortSelect = document.getElementById('sumbong-sort-select');

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        currentPage = 1;
        applyFilters();
        renderActiveChips();
        renderCards();
      });
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', (e) => {
        currentType = e.target.value;
        currentPage = 1;
        applyFilters();
        renderActiveChips();
        renderCards();
      });
    }

    if (yearSelect) {
      yearSelect.addEventListener('change', (e) => {
        currentYear = e.target.value;
        currentPage = 1;
        applyFilters();
        renderActiveChips();
        renderCards();
      });
    }

    if (contractorSelect) {
      contractorSelect.addEventListener('change', (e) => {
        currentContractor = e.target.value;
        currentPage = 1;
        applyFilters();
        renderActiveChips();
        renderCards();
      });
    }

    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        currentPage = 1;
        applyFilters();
        renderActiveChips();
        renderCards();
      });
    }

    // Export Dropdowns
    const csvWrapper = document.getElementById('sumbong-csv-dropdown-wrapper');
    const csvToggleBtn = document.getElementById('sumbong-csv-toggle-btn');
    const pdfWrapper = document.getElementById('sumbong-pdf-dropdown-wrapper');
    const pdfToggleBtn = document.getElementById('sumbong-pdf-toggle-btn');

    if (csvToggleBtn && csvWrapper) {
      csvToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        csvWrapper.classList.toggle('open');
        if (pdfWrapper) pdfWrapper.classList.remove('open');
      });
    }

    if (pdfToggleBtn && pdfWrapper) {
      pdfToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pdfWrapper.classList.toggle('open');
        if (csvWrapper) csvWrapper.classList.remove('open');
      });
    }

    const csvFiltered = document.getElementById('sumbong-export-csv-filtered');
    const csvAll = document.getElementById('sumbong-export-csv-all');
    if (csvFiltered) {
      csvFiltered.addEventListener('click', () => {
        if (csvWrapper) csvWrapper.classList.remove('open');
        exportCSV('filtered');
      });
    }
    if (csvAll) {
      csvAll.addEventListener('click', () => {
        if (csvWrapper) csvWrapper.classList.remove('open');
        exportCSV('all');
      });
    }

    const pdfFiltered = document.getElementById('sumbong-export-pdf-filtered');
    const pdfAll = document.getElementById('sumbong-export-pdf-all');
    if (pdfFiltered) {
      pdfFiltered.addEventListener('click', () => {
        if (pdfWrapper) pdfWrapper.classList.remove('open');
        exportPDF('filtered');
      });
    }
    if (pdfAll) {
      pdfAll.addEventListener('click', () => {
        if (pdfWrapper) pdfWrapper.classList.remove('open');
        exportPDF('all');
      });
    }

    document.addEventListener('click', (e) => {
      if (csvWrapper && !csvWrapper.contains(e.target)) {
        csvWrapper.classList.remove('open');
      }
      if (pdfWrapper && !pdfWrapper.contains(e.target)) {
        pdfWrapper.classList.remove('open');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
