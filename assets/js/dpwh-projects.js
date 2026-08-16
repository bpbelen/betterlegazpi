// DPWH Projects Renderer - Enhanced Interactive Presentation & Data Analytics
(function () {
  'use strict';

  const CONFIG = {
    pageSize: 50,
    truncateLength: 85,
  };

  // State
  let allProjects = [];
  let filteredProjects = [];
  let currentPage = 1;
  let currentCategory = 'all';
  let currentStatus = 'all';
  let currentSort = 'id-asc';
  let searchQuery = '';
  let selectedContractors = new Set();
  let expandedProjectId = null;

  // Drilldown state for In-Place Subdivision Doughnut Chart
  let drilldownCategory = null; // null or 'buildings' | 'roads' | 'flood' | 'bridges' | 'water'
  let drilldownSubtype = null;

  // Chart instances
  let categoryChartInstance = null;
  let contractorChartInstance = null;

  // Color Palettes for Categories
  const CATEGORY_CONFIG = {
    buildings: {
      name: 'Buildings',
      baseColor: '#7c3aed',
      gradient: ['#4c1d95', '#6d28d9', '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd'],
    },
    roads: {
      name: 'Roads',
      baseColor: '#2563eb',
      gradient: ['#1e3a8a', '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'],
    },
    flood: {
      name: 'Flood Control',
      baseColor: '#0284c7',
      gradient: ['#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc'],
    },
    bridges: {
      name: 'Bridges',
      baseColor: '#ea580c',
      gradient: ['#7c2d12', '#9a3412', '#c2410c', '#ea580c', '#f97316', '#fb923c'],
    },
    water: {
      name: 'Water',
      baseColor: '#059669',
      gradient: ['#064e3b', '#065f46', '#047857', '#059669', '#10b981', '#34d399'],
    },
  };

  // 10-Step Gradient for Top 10 Contractors (Rank 1 darkest to Rank 10 lightest)
  const CONTRACTOR_RANK_GRADIENT = [
    '#0f2b66', // Rank 1 (Darkest Navy)
    '#16387c', // Rank 2
    '#1e40af', // Rank 3
    '#1d4ed8', // Rank 4
    '#2563eb', // Rank 5
    '#3b82f6', // Rank 6
    '#60a5fa', // Rank 7
    '#7dd3fc', // Rank 8
    '#93c5fd', // Rank 9
    '#bfdbfe', // Rank 10 (Lightest Soft Blue)
  ];

  async function loadDPWHProjects() {
    const container = document.getElementById('dpwh-projects-container');
    if (!container) return;

    try {
      const response = await fetch('../data/dpwh-projects.json');
      const data = await response.json();
      allProjects = data.projects || [];
      filteredProjects = [...allProjects];
      applyFiltersAndSort();
      renderLayout(container, data);
      initCharts();
    } catch (error) {
      console.error('Failed to load DPWH projects:', error);
      container.innerHTML = `
        <div class="dpwh-empty-state">
          <i class="bi bi-exclamation-triangle"></i>
          <div class="dpwh-empty-title">Failed to load DPWH Projects</div>
          <p>Please refresh the page or try again later.</p>
        </div>
      `;
    }
  }

  // --- Sub-type Classification Logic ---

  function getSubtype(p) {
    const name = (p.name || '').toLowerCase();
    const cat = p.category || '';

    if (cat.includes('Flood')) {
      if (name.includes('shore') || name.includes('seawall') || name.includes('causeway') || name.includes('coastal')) {
        return 'Shore Protection & Seawalls';
      }
      if (name.includes('river') || name.includes('dike') || name.includes('spillway') || name.includes('gully') || name.includes('creek')) {
        return 'River Dikes & Mitigation';
      }
      return 'Urban Drainage Systems';
    }

    if (cat.includes('Bridge')) {
      if (name.includes('rehab') || name.includes('maintenance') || name.includes('retrofitting') || name.includes('repair')) {
        return 'Bridge Rehabilitation & Repair';
      }
      return 'Permanent Bridge Construction';
    }

    if (cat.includes('Road')) {
      if (name.includes('bypass') || name.includes('by-pass') || name.includes('diversion') || name.includes('coastal road')) {
        return 'By-Pass & Diversion Roads';
      }
      if (name.includes('widening') || name.includes('reconstruction') || name.includes('pccp')) {
        return 'Road Widening & Upgrading';
      }
      if (name.includes('preventive') || name.includes('asphalt') || name.includes('overlay') || name.includes('preservation')) {
        return 'Preventive Maintenance & Overlay';
      }
      if (name.includes('access') || name.includes('tourism') || name.includes('trip') || name.includes('sipag') || name.includes('airport')) {
        return 'Tourism & Access Roads';
      }
      return 'Off-Carriageway & Drainage';
    }

    if (cat.includes('Water')) {
      if (name.includes('rainwater') || name.includes('collector') || name.includes('storage')) {
        return 'Rainwater & Storage Facilities';
      }
      return 'Barangay Water Networks (Level III)';
    }

    // Default: Buildings
    if (name.includes('deped') || name.includes('beff') || name.includes('classroom') || name.includes('school')) {
      return 'School Buildings & Classrooms';
    }
    if (name.includes('evacuation') || name.includes('multi-purpose') || name.includes('multi purpose') || name.includes('covered court') || name.includes('holding center')) {
      return 'Evacuation & Multi-Purpose Halls';
    }
    if (name.includes('regional center') || name.includes('dbm') || name.includes('marina') || name.includes('dar') || name.includes('penro') || name.includes('blgf') || name.includes('camp ola') || name.includes('office building') || name.includes('dpwh regional')) {
      return 'Government Offices & Regional Centers';
    }
    if (name.includes('bicol university') || name.includes('hospital') || name.includes('health') || name.includes('medical') || name.includes('testing center')) {
      return 'University & Health Facilities';
    }
    return 'Other Public Buildings';
  }

  // --- Utility Formatting Helpers ---

  function formatCurrency(amount) {
    if (!amount || amount === 0) return '₱0.00';
    return (
      '₱' + amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    );
  }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;
    return date.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '…';
  }

  function formatSummaryCost(amount) {
    if (!amount) return '₱0.00';
    if (amount >= 1e9) {
      return `₱${(amount / 1e9).toFixed(2)}B`;
    }
    if (amount >= 1e6) {
      return `₱${(amount / 1e6).toFixed(1)}M`;
    }
    return `₱${amount.toLocaleString('en-PH')}`;
  }

  function getCategoryClass(category) {
    if (!category) return 'buildings';
    if (category.includes('Flood')) return 'flood';
    if (category.includes('Bridge')) return 'bridges';
    if (category.includes('Road')) return 'roads';
    if (category.includes('Water')) return 'water';
    return 'buildings';
  }

  function getCategoryLabel(category) {
    if (!category) return 'Buildings';
    if (category.includes('Flood')) return 'Flood Control';
    if (category.includes('Bridge')) return 'Bridges';
    if (category.includes('Road')) return 'Roads';
    if (category.includes('Water')) return 'Water';
    return 'Buildings';
  }

  function getStatusBadge(status) {
    if (status === 100) return '<span class="dpwh-badge complete">Completed</span>';
    return `<span class="dpwh-badge ongoing">${status.toFixed(1)}%</span>`;
  }

  function getCategoryCounts(projects) {
    const counts = { all: projects.length, buildings: 0, roads: 0, flood: 0, water: 0, bridges: 0 };
    projects.forEach((p) => {
      if (p.category.includes('Flood')) counts.flood++;
      else if (p.category.includes('Bridge')) counts.bridges++;
      else if (p.category.includes('Road')) counts.roads++;
      else if (p.category.includes('Water')) counts.water++;
      else counts.buildings++;
    });
    return counts;
  }

  function getAllContractors() {
    const contractorMap = {};
    allProjects.forEach((p) => {
      const c = p.contractor || 'Pending / Ongoing Bidding';
      if (!contractorMap[c]) {
        contractorMap[c] = { name: c, count: 0, totalCost: 0 };
      }
      contractorMap[c].count++;
      contractorMap[c].totalCost += p.cost || 0;
    });
    return Object.values(contractorMap).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  }

  // --- Filtering & Sorting Logic ---

  function applyFiltersAndSort() {
    let result = [...allProjects];

    // 1. Category Filter
    if (currentCategory !== 'all') {
      result = result.filter((p) => {
        if (currentCategory === 'buildings') {
          return (
            !p.category.includes('Flood') &&
            !p.category.includes('Road') &&
            !p.category.includes('Bridge') &&
            !p.category.includes('Water')
          );
        }
        if (currentCategory === 'roads') return p.category.includes('Road');
        if (currentCategory === 'bridges') return p.category.includes('Bridge');
        if (currentCategory === 'flood') return p.category.includes('Flood');
        if (currentCategory === 'water') return p.category.includes('Water');
        return true;
      });
    }

    // 2. Drilldown Sub-type Filter
    if (drilldownSubtype) {
      result = result.filter((p) => getSubtype(p) === drilldownSubtype);
    }

    // 3. Contractor Multi-Select Filter
    if (selectedContractors.size > 0) {
      result = result.filter((p) => selectedContractors.has(p.contractor));
    }

    // 4. Status Filter
    if (currentStatus === 'completed') {
      result = result.filter((p) => p.status === 100);
    } else if (currentStatus === 'ongoing') {
      result = result.filter((p) => p.status < 100);
    }

    // 5. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((p) => {
        return (
          (p.id && p.id.toLowerCase().includes(q)) ||
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.contractor && p.contractor.toLowerCase().includes(q)) ||
          (p.location && p.location.toLowerCase().includes(q)) ||
          (p.contractorId && p.contractorId.toLowerCase().includes(q))
        );
      });
    }

    // 6. Sorting
    result.sort((a, b) => {
      switch (currentSort) {
        case 'id-asc':
          return (a.id || '').localeCompare(b.id || '');
        case 'id-desc':
          return (b.id || '').localeCompare(a.id || '');
        case 'cost-desc':
          return (b.cost || 0) - (a.cost || 0);
        case 'cost-asc':
          return (a.cost || 0) - (b.cost || 0);
        case 'status-desc':
          return (b.status || 0) - (a.status || 0);
        case 'status-asc':
          return (a.status || 0) - (b.status || 0);
        case 'date-desc': {
          const dateA = a.completionDate ? new Date(a.completionDate).getTime() : 0;
          const dateB = b.completionDate ? new Date(b.completionDate).getTime() : 0;
          return dateB - dateA;
        }
        case 'date-asc': {
          const dateA = a.completionDate ? new Date(a.completionDate).getTime() : Infinity;
          const dateB = b.completionDate ? new Date(b.completionDate).getTime() : Infinity;
          return dateA - dateB;
        }
        default:
          return 0;
      }
    });

    filteredProjects = result;
  }

  // --- Aggregate Metrics Calculation ---

  function calculateMetrics(dataset = filteredProjects) {
    const total = dataset.length;
    const completed = dataset.filter((p) => p.status === 100).length;
    const ongoing = total - completed;
    const completionRate = total > 0 ? ((completed / total) * 100).toFixed(1) : '0.0';

    const totalCost = dataset.reduce((sum, p) => sum + (p.cost || 0), 0);
    const avgCost = total > 0 ? totalCost / total : 0;

    // Largest Contract within dataset
    let maxProject = null;
    dataset.forEach((p) => {
      if (!maxProject || (p.cost || 0) > (maxProject.cost || 0)) {
        maxProject = p;
      }
    });

    // Top Contractor by Total Contract Value within dataset
    const contractorMap = {};
    dataset.forEach((p) => {
      if (!p.contractor || p.contractor.includes('Pending')) return;
      if (!contractorMap[p.contractor]) {
        contractorMap[p.contractor] = { name: p.contractor, totalCost: 0, count: 0 };
      }
      contractorMap[p.contractor].totalCost += p.cost || 0;
      contractorMap[p.contractor].count += 1;
    });

    const contractorList = Object.values(contractorMap).sort((a, b) => b.totalCost - a.totalCost);
    const topContractor = contractorList[0] || { name: 'None', totalCost: 0, count: 0 };

    return {
      total,
      completed,
      ongoing,
      completionRate,
      totalCost,
      avgCost,
      maxProject,
      topContractor,
      topContractorsList: contractorList.slice(0, 10),
    };
  }

  function updateKPICards() {
    const metrics = calculateMetrics(filteredProjects);

    const rateVal = document.getElementById('dpwh-kpi-rate-val');
    const rateSub = document.getElementById('dpwh-kpi-rate-sub');
    const avgVal = document.getElementById('dpwh-kpi-avg-val');
    const avgSub = document.getElementById('dpwh-kpi-avg-sub');
    const maxVal = document.getElementById('dpwh-kpi-max-val');
    const maxSub = document.getElementById('dpwh-kpi-max-sub');
    const topVal = document.getElementById('dpwh-kpi-top-val');
    const topSub = document.getElementById('dpwh-kpi-top-sub');

    if (rateVal) rateVal.textContent = `${metrics.completionRate}%`;
    if (rateSub) rateSub.textContent = `${metrics.completed} of ${metrics.total} completed`;

    if (avgVal) avgVal.textContent = formatSummaryCost(metrics.avgCost);
    if (avgSub) {
      if (filteredProjects.length === allProjects.length) {
        avgSub.textContent = `Across all 781 contracts`;
      } else {
        avgSub.textContent = `Across ${metrics.total} filtered contracts`;
      }
    }

    if (maxVal) maxVal.textContent = metrics.maxProject ? formatSummaryCost(metrics.maxProject.cost) : '—';
    if (maxSub) {
      if (metrics.maxProject) {
        maxSub.textContent = `${metrics.maxProject.id}: ${truncateText(metrics.maxProject.name, 28)}`;
        maxSub.title = metrics.maxProject.name;
      } else {
        maxSub.textContent = 'No matching project';
        maxSub.title = '';
      }
    }

    if (topVal) topVal.textContent = metrics.topContractor.totalCost > 0 ? formatSummaryCost(metrics.topContractor.totalCost) : '—';
    if (topSub) {
      if (metrics.topContractor && metrics.topContractor.totalCost > 0) {
        topSub.textContent = `${metrics.topContractor.name} (${metrics.topContractor.count} contracts)`;
        topSub.title = metrics.topContractor.name;
      } else {
        topSub.textContent = 'No contractor data';
        topSub.title = '';
      }
    }
  }

  // --- Layout & Main Render ---

  function renderLayout(container, data) {
    const counts = getCategoryCounts(allProjects);
    const metrics = calculateMetrics(allProjects);
    const allContractors = getAllContractors();

    container.innerHTML = `
      <!-- Overall Summary Bar -->
      <div class="dpwh-summary-bar">
        <div class="dpwh-summary-item">
          <span class="dpwh-summary-value">${data.summary.totalProjects}</span>
          <span class="dpwh-summary-label">Projects</span>
        </div>
        <div class="dpwh-summary-item">
          <span class="dpwh-summary-value">${formatSummaryCost(data.summary.totalCost)}</span>
          <span class="dpwh-summary-label">Total Investment</span>
        </div>
        <div class="dpwh-summary-item">
          <span class="dpwh-summary-value">${data.summary.completedProjects}</span>
          <span class="dpwh-summary-label">Completed</span>
        </div>
        <div class="dpwh-summary-item">
          <span class="dpwh-summary-value">${data.summary.ongoingProjects}</span>
          <span class="dpwh-summary-label">Ongoing</span>
        </div>
      </div>

      <!-- Interactive Analytics Dashboard -->
      <div class="dpwh-dashboard">
        <!-- KPI Cards Grid -->
        <div class="dpwh-kpi-grid">
          <div class="dpwh-kpi-card dpwh-kpi-rate">
            <div class="dpwh-kpi-icon"><i class="bi bi-check-circle"></i></div>
            <div class="dpwh-kpi-body">
              <span class="dpwh-kpi-label">Completion Rate</span>
              <span class="dpwh-kpi-val" id="dpwh-kpi-rate-val">${metrics.completionRate}%</span>
              <span class="dpwh-kpi-sub" id="dpwh-kpi-rate-sub">${metrics.completed} of ${metrics.total} completed</span>
            </div>
          </div>
          <div class="dpwh-kpi-card dpwh-kpi-avg">
            <div class="dpwh-kpi-icon"><i class="bi bi-calculator"></i></div>
            <div class="dpwh-kpi-body">
              <span class="dpwh-kpi-label">Avg Project Cost</span>
              <span class="dpwh-kpi-val" id="dpwh-kpi-avg-val">${formatSummaryCost(metrics.avgCost)}</span>
              <span class="dpwh-kpi-sub" id="dpwh-kpi-avg-sub">Across all 781 contracts</span>
            </div>
          </div>
          <div class="dpwh-kpi-card dpwh-kpi-max">
            <div class="dpwh-kpi-icon"><i class="bi bi-trophy"></i></div>
            <div class="dpwh-kpi-body">
              <span class="dpwh-kpi-label">Largest Contract</span>
              <span class="dpwh-kpi-val" id="dpwh-kpi-max-val">${metrics.maxProject ? formatSummaryCost(metrics.maxProject.cost) : '—'}</span>
              <span class="dpwh-kpi-sub" id="dpwh-kpi-max-sub" title="${metrics.maxProject ? metrics.maxProject.name : ''}">${metrics.maxProject ? `${metrics.maxProject.id}: ${truncateText(metrics.maxProject.name, 28)}` : '—'}</span>
            </div>
          </div>
          <div class="dpwh-kpi-card dpwh-kpi-top">
            <div class="dpwh-kpi-icon"><i class="bi bi-award"></i></div>
            <div class="dpwh-kpi-body">
              <span class="dpwh-kpi-label">Top Contractor</span>
              <span class="dpwh-kpi-val" id="dpwh-kpi-top-val">${formatSummaryCost(metrics.topContractor.totalCost)}</span>
              <span class="dpwh-kpi-sub" id="dpwh-kpi-top-sub" title="${metrics.topContractor.name}">${metrics.topContractor.name} (${metrics.topContractor.count} contracts)</span>
            </div>
          </div>
        </div>

        <!-- Charts Grid -->
        <div class="dpwh-charts-grid">
          <!-- In-Place Subdivision Doughnut Chart Card -->
          <div class="dpwh-chart-card">
            <div class="dpwh-chart-header">
              <div>
                <span class="dpwh-chart-title" id="dpwh-cat-chart-title">
                  <i class="bi bi-pie-chart-fill"></i> Projects by Category
                </span>
                <span class="dpwh-chart-subtitle" id="dpwh-cat-chart-subtitle">Click a slice or legend item to drill down</span>
              </div>
            </div>
            <div class="dpwh-chart-canvas-wrap">
              <canvas id="dpwhCategoryChart"></canvas>
            </div>
            <div id="dpwh-chart-reset-container"></div>
          </div>

          <!-- Top 10 Contractors Horizontal Bar Chart Card -->
          <div class="dpwh-chart-card">
            <div class="dpwh-chart-header">
              <div>
                <span class="dpwh-chart-title">
                  <i class="bi bi-bar-chart-line-fill"></i> Top 10 Contractors
                </span>
                <span class="dpwh-chart-subtitle">Ranked #1 to #10 by total value • Click to filter</span>
              </div>
            </div>
            <div class="dpwh-chart-canvas-wrap">
              <canvas id="dpwhContractorChart"></canvas>
            </div>
          </div>
        </div>
      </div>

      <!-- Controls & Filter Tabs -->
      <div class="dpwh-controls">
        <div class="dpwh-filter-group" role="tablist" aria-label="Filter projects by category">
          <button class="dpwh-tab active" data-filter="all" role="tab" aria-selected="true">All <span class="dpwh-tab-count">${counts.all}</span></button>
          <button class="dpwh-tab" data-filter="buildings" role="tab" aria-selected="false">Buildings <span class="dpwh-tab-count">${counts.buildings}</span></button>
          <button class="dpwh-tab" data-filter="roads" role="tab" aria-selected="false">Roads <span class="dpwh-tab-count">${counts.roads}</span></button>
          <button class="dpwh-tab" data-filter="flood" role="tab" aria-selected="false">Flood Control <span class="dpwh-tab-count">${counts.flood}</span></button>
          ${counts.bridges > 0 ? `<button class="dpwh-tab" data-filter="bridges" role="tab" aria-selected="false">Bridges <span class="dpwh-tab-count">${counts.bridges}</span></button>` : ''}
          ${counts.water > 0 ? `<button class="dpwh-tab" data-filter="water" role="tab" aria-selected="false">Water <span class="dpwh-tab-count">${counts.water}</span></button>` : ''}
        </div>

        <!-- Action Toolbar: Search, Contractor Multi-Select, Status, Sort & Export Dropdowns -->
        <div class="dpwh-toolbar">
          <div class="dpwh-toolbar-left">
            <!-- Search Input -->
            <div class="dpwh-search-wrapper">
              <i class="bi bi-search dpwh-search-icon"></i>
              <input type="text" id="dpwh-search-input" class="dpwh-search-input" placeholder="Search project, contractor, ID..." aria-label="Search contracts" />
              <button id="dpwh-search-clear" class="dpwh-search-clear" title="Clear search" aria-label="Clear search"><i class="bi bi-x"></i></button>
            </div>

            <!-- Contractor Multi-Select Dropdown -->
            <div class="dpwh-multiselect-container" id="dpwh-contractor-multiselect">
              <button type="button" class="dpwh-multiselect-btn" id="dpwh-multiselect-toggle">
                <span id="dpwh-multiselect-label"><i class="bi bi-person-badge"></i> All Contractors</span>
                <i class="bi bi-chevron-down" style="font-size: 0.6875rem; color: #94a3b8;"></i>
              </button>

              <div class="dpwh-multiselect-dropdown">
                <div class="dpwh-multiselect-header">
                  <input type="text" id="dpwh-contractor-search" class="dpwh-multiselect-search" placeholder="Search contractor..." />
                </div>
                <div class="dpwh-multiselect-actions">
                  <button type="button" class="dpwh-multiselect-action-btn" id="dpwh-contractor-select-all">Select All</button>
                  <button type="button" class="dpwh-multiselect-action-btn" id="dpwh-contractor-clear-all">Clear All</button>
                </div>
                <div class="dpwh-multiselect-list" id="dpwh-contractor-list">
                  ${allContractors
                    .map(
                      (c) => `
                    <label class="dpwh-multiselect-item">
                      <input type="checkbox" value="${c.name.replace(/"/g, '&quot;')}" ${selectedContractors.has(c.name) ? 'checked' : ''} />
                      <span class="dpwh-multiselect-item-name" title="${c.name}">${c.name}</span>
                      <span class="dpwh-multiselect-item-count">${c.count}</span>
                    </label>
                  `
                    )
                    .join('')}
                </div>
              </div>
            </div>

            <!-- Status Select -->
            <div class="dpwh-select-wrapper">
              <select id="dpwh-status-select" class="dpwh-select" aria-label="Filter by project status">
                <option value="all">All Statuses</option>
                <option value="completed">Completed (100%)</option>
                <option value="ongoing">Ongoing (<100%)</option>
              </select>
            </div>

            <!-- Sort Select -->
            <div class="dpwh-select-wrapper">
              <select id="dpwh-sort-select" class="dpwh-select" aria-label="Sort contracts">
                <option value="id-asc">Contract ID (A → Z)</option>
                <option value="id-desc">Contract ID (Z → A)</option>
                <option value="cost-desc">Cost (Highest First)</option>
                <option value="cost-asc">Cost (Lowest First)</option>
                <option value="status-desc">Status (Highest %)</option>
                <option value="status-asc">Status (Lowest %)</option>
                <option value="date-desc">Completion Date (Newest)</option>
                <option value="date-asc">Completion Date (Oldest)</option>
              </select>
            </div>
          </div>

          <div class="dpwh-toolbar-right">
            <!-- Split Export Buttons -->
            <div class="dpwh-export-group">
              <!-- CSV Export Dropdown -->
              <div class="dpwh-export-dropdown-wrapper" id="dpwh-csv-dropdown-wrapper">
                <button type="button" class="dpwh-btn-export" id="dpwh-csv-toggle-btn" title="Download CSV Spreadsheet">
                  <i class="bi bi-file-earmark-spreadsheet"></i> CSV <i class="bi bi-chevron-down"></i>
                </button>
                <div class="dpwh-export-menu">
                  <button type="button" class="dpwh-export-item" id="dpwh-export-csv-filtered">
                    <div>
                      <div class="dpwh-export-item-title"><i class="bi bi-filter"></i> Export Current View</div>
                      <div class="dpwh-export-item-sub"><span id="dpwh-export-filtered-count">${filteredProjects.length}</span> matching contracts</div>
                    </div>
                  </button>
                  <button type="button" class="dpwh-export-item" id="dpwh-export-csv-all">
                    <div>
                      <div class="dpwh-export-item-title"><i class="bi bi-database"></i> Export Full Dataset</div>
                      <div class="dpwh-export-item-sub">All ${allProjects.length} contracts archive</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- PDF Export Dropdown -->
              <div class="dpwh-export-dropdown-wrapper" id="dpwh-pdf-dropdown-wrapper">
                <button type="button" class="dpwh-btn-export" id="dpwh-pdf-toggle-btn" title="Print or Save PDF Report">
                  <i class="bi bi-printer"></i> PDF <i class="bi bi-chevron-down"></i>
                </button>
                <div class="dpwh-export-menu">
                  <button type="button" class="dpwh-export-item" id="dpwh-export-pdf-filtered">
                    <div>
                      <div class="dpwh-export-item-title"><i class="bi bi-filter"></i> Print Current View</div>
                      <div class="dpwh-export-item-sub"><span id="dpwh-pdf-filtered-count">${filteredProjects.length}</span> matching contracts</div>
                    </div>
                  </button>
                  <button type="button" class="dpwh-export-item" id="dpwh-export-pdf-all">
                    <div>
                      <div class="dpwh-export-item-title"><i class="bi bi-printer"></i> Print Full Dataset</div>
                      <div class="dpwh-export-item-sub">All ${allProjects.length} contracts</div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Filter Chips Bar -->
        <div id="dpwh-active-filters-container"></div>
      </div>

      <!-- Table Wrapper -->
      <div class="dpwh-table-wrap">
        <table class="dpwh-table" role="table">
          <thead>
            <tr>
              <th scope="col" class="col-desc">Contract Description</th>
              <th scope="col" class="col-contractor">Contractor</th>
              <th scope="col" class="col-cost">Cost</th>
              <th scope="col" class="col-status">Status</th>
              <th scope="col" class="col-date">Completed</th>
            </tr>
          </thead>
          <tbody id="dpwh-table-body"></tbody>
        </table>
      </div>

      <!-- Pagination Bar -->
      <div id="dpwh-pagination-container" class="dpwh-pagination"></div>
    `;

    renderActiveFilterChips();
    renderTablePage();
    attachEventListeners();
  }

  // --- Active Filter Chips Rendering ---

  function renderActiveFilterChips() {
    const container = document.getElementById('dpwh-active-filters-container');
    if (!container) return;

    const chips = [];

    if (currentCategory !== 'all') {
      const cfg = CATEGORY_CONFIG[currentCategory];
      chips.push({
        type: 'category',
        label: `Category: ${cfg ? cfg.name : currentCategory}`,
      });
    }

    if (drilldownSubtype) {
      chips.push({
        type: 'subtype',
        label: `Sub-Type: ${drilldownSubtype}`,
      });
    }

    if (selectedContractors.size > 0) {
      if (selectedContractors.size === 1) {
        chips.push({
          type: 'contractor',
          label: `Contractor: ${Array.from(selectedContractors)[0]}`,
        });
      } else {
        chips.push({
          type: 'contractor',
          label: `Contractors: ${selectedContractors.size} selected`,
        });
      }
    }

    if (currentStatus !== 'all') {
      chips.push({
        type: 'status',
        label: `Status: ${currentStatus === 'completed' ? 'Completed (100%)' : 'Ongoing (<100%)'}`,
      });
    }

    if (searchQuery.trim()) {
      chips.push({
        type: 'search',
        label: `Search: "${searchQuery.trim()}"`,
      });
    }

    if (chips.length === 0) {
      container.innerHTML = '';
      return;
    }

    container.innerHTML = `
      <div class="dpwh-active-filters-bar">
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
        <button type="button" class="dpwh-filter-clear-all" id="dpwh-clear-all-filters">Clear All Filters</button>
      </div>
    `;

    // Chip remove buttons
    container.querySelectorAll('.dpwh-filter-chip-remove').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.filterType;
        if (type === 'category') {
          currentCategory = 'all';
          drilldownCategory = null;
          drilldownSubtype = null;
          syncCategoryTabs();
          renderCategoryChart();
        } else if (type === 'subtype') {
          drilldownSubtype = null;
          renderCategoryChart();
        } else if (type === 'contractor') {
          selectedContractors.clear();
          updateContractorMultiSelectUI();
          if (contractorChartInstance) renderContractorChart();
        } else if (type === 'status') {
          currentStatus = 'all';
          const sel = document.getElementById('dpwh-status-select');
          if (sel) sel.value = 'all';
        } else if (type === 'search') {
          searchQuery = '';
          const inp = document.getElementById('dpwh-search-input');
          const clr = document.getElementById('dpwh-search-clear');
          if (inp) inp.value = '';
          if (clr) clr.classList.remove('visible');
        }

        currentPage = 1;
        applyFiltersAndSort();
        renderActiveFilterChips();
        renderTablePage();
      });
    });

    const clearAllBtn = document.getElementById('dpwh-clear-all-filters');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        currentCategory = 'all';
        drilldownCategory = null;
        drilldownSubtype = null;
        selectedContractors.clear();
        currentStatus = 'all';
        searchQuery = '';

        syncCategoryTabs();
        updateContractorMultiSelectUI();

        const sel = document.getElementById('dpwh-status-select');
        if (sel) sel.value = 'all';
        const inp = document.getElementById('dpwh-search-input');
        const clr = document.getElementById('dpwh-search-clear');
        if (inp) inp.value = '';
        if (clr) clr.classList.remove('visible');

        renderCategoryChart();
        renderContractorChart();

        currentPage = 1;
        applyFiltersAndSort();
        renderActiveFilterChips();
        renderTablePage();
      });
    }
  }

  function syncCategoryTabs() {
    document.querySelectorAll('.dpwh-tab').forEach((tab) => {
      const isActive = tab.dataset.filter === currentCategory;
      tab.classList.toggle('active', isActive);
      tab.setAttribute('aria-selected', isActive);
    });
  }

  // --- Chart.js Visualizations (In-Place Subdivision & Rank Gradients) ---

  function initCharts() {
    if (typeof Chart === 'undefined') return;
    renderCategoryChart();
    renderContractorChart();
  }

  function renderCategoryChart() {
    const catCanvas = document.getElementById('dpwhCategoryChart');
    const titleEl = document.getElementById('dpwh-cat-chart-title');
    const subtitleEl = document.getElementById('dpwh-cat-chart-subtitle');
    const resetContainer = document.getElementById('dpwh-chart-reset-container');

    if (!catCanvas) return;
    if (categoryChartInstance) categoryChartInstance.destroy();

    const counts = getCategoryCounts(allProjects);
    const categoryOrder = ['buildings', 'roads', 'flood', 'bridges', 'water'];
    const totalProjectsCount = allProjects.length;

    // --- CASE 1: In-Place Subdivision Drilldown Mode ---
    if (drilldownCategory) {
      const activeCfg = CATEGORY_CONFIG[drilldownCategory];
      const activeCatName = activeCfg.name;

      if (titleEl) {
        titleEl.innerHTML = `<i class="bi bi-pie-chart-fill" style="color:${activeCfg.baseColor};"></i> Projects by Sub-Category: ${activeCatName}`;
      }
      if (subtitleEl) {
        subtitleEl.textContent = `Showing ${activeCatName} sub-types within total ${totalProjectsCount} contracts (others greyed out)`;
      }
      if (resetContainer) {
        resetContainer.innerHTML = `
          <div class="dpwh-chart-footer">
            <button type="button" class="dpwh-chart-reset-btn" id="dpwh-btn-reset-drilldown">
              <i class="bi bi-arrow-left"></i> Return to All Categories
            </button>
          </div>
        `;
        document.getElementById('dpwh-btn-reset-drilldown').addEventListener('click', () => {
          drilldownCategory = null;
          drilldownSubtype = null;
          currentCategory = 'all';
          syncCategoryTabs();
          renderCategoryChart();
          currentPage = 1;
          applyFiltersAndSort();
          renderActiveFilterChips();
          renderTablePage();
        });
      }

      // Collect target projects within drilldown category
      const targetProjects = allProjects.filter((p) => {
        if (drilldownCategory === 'buildings') {
          return !p.category.includes('Flood') && !p.category.includes('Road') && !p.category.includes('Bridge') && !p.category.includes('Water');
        }
        if (drilldownCategory === 'roads') return p.category.includes('Road');
        if (drilldownCategory === 'bridges') return p.category.includes('Bridge');
        if (drilldownCategory === 'flood') return p.category.includes('Flood');
        if (drilldownCategory === 'water') return p.category.includes('Water');
        return true;
      });

      const subtypeMap = {};
      targetProjects.forEach((p) => {
        const st = getSubtype(p);
        subtypeMap[st] = (subtypeMap[st] || 0) + 1;
      });

      // Sort sub-types descending by count
      const sortedSubtypes = Object.entries(subtypeMap).sort((a, b) => b[1] - a[1]);

      // Construct unified in-place subdivision dataset maintaining 100% circle circumference
      const chartLabels = [];
      const chartData = [];
      const chartColors = [];
      const sliceMetadata = [];

      categoryOrder.forEach((catKey) => {
        if (catKey === drilldownCategory) {
          // Explode selected category into its sub-types using tiered gradient
          const gradient = activeCfg.gradient;
          sortedSubtypes.forEach(([stName, stCount], idx) => {
            chartLabels.push(stName);
            chartData.push(stCount);
            chartColors.push(gradient[idx % gradient.length]);
            sliceMetadata.push({
              isSubtype: true,
              categoryKey: catKey,
              subtypeName: stName,
              count: stCount,
              categoryTotal: targetProjects.length,
            });
          });
        } else {
          // Other categories remain as greyed-out solid arcs in their exact positions
          const catCount = counts[catKey];
          const catName = CATEGORY_CONFIG[catKey].name;
          chartLabels.push(`${catName} (Other)`);
          chartData.push(catCount);
          chartColors.push('#cbd5e1'); // Muted Grey
          sliceMetadata.push({
            isSubtype: false,
            categoryKey: catKey,
            categoryName: catName,
            count: catCount,
            categoryTotal: catCount,
          });
        }
      });

      categoryChartInstance = new Chart(catCanvas, {
        type: 'doughnut',
        data: {
          labels: chartLabels,
          datasets: [
            {
              data: chartData,
              backgroundColor: chartColors,
              borderWidth: 2,
              borderColor: '#ffffff',
              hoverOffset: 6,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          onClick: (evt, elements) => {
            if (elements && elements.length > 0) {
              const clickedIndex = elements[0].index;
              const meta = sliceMetadata[clickedIndex];

              if (meta.isSubtype) {
                // Clicked a sub-type slice: toggle sub-type filter
                if (drilldownSubtype === meta.subtypeName) {
                  drilldownSubtype = null;
                } else {
                  drilldownSubtype = meta.subtypeName;
                }
              } else {
                // Clicked a greyed-out other category: switch focus to that category!
                drilldownCategory = meta.categoryKey;
                drilldownSubtype = null;
                currentCategory = meta.categoryKey;
                syncCategoryTabs();
                renderCategoryChart();
              }

              currentPage = 1;
              applyFiltersAndSort();
              renderActiveFilterChips();
              renderTablePage();
            }
          },
          plugins: {
            legend: {
              position: 'right',
              onClick: (e, legendItem) => {
                // Non-destructive legend click: select the item instead of hiding it!
                const idx = legendItem.index;
                const meta = sliceMetadata[idx];
                if (meta.isSubtype) {
                  drilldownSubtype = drilldownSubtype === meta.subtypeName ? null : meta.subtypeName;
                } else {
                  drilldownCategory = meta.categoryKey;
                  drilldownSubtype = null;
                  currentCategory = meta.categoryKey;
                  syncCategoryTabs();
                  renderCategoryChart();
                }
                currentPage = 1;
                applyFiltersAndSort();
                renderActiveFilterChips();
                renderTablePage();
              },
              labels: {
                boxWidth: 10,
                padding: 8,
                font: { size: 10, family: 'inherit', weight: '500' },
                generateLabels: function () {
                  return chartLabels.map((label, i) => {
                    const meta = sliceMetadata[i];
                    const isSelectedSt = drilldownSubtype && meta.isSubtype && drilldownSubtype === meta.subtypeName;
                    return {
                      text: `${truncateText(label, 18)} (${chartData[i]})`,
                      fillStyle: chartColors[i],
                      fontStyle: isSelectedSt ? 'bold' : 'normal',
                      hidden: false,
                      index: i,
                    };
                  });
                },
              },
            },
            tooltip: {
              callbacks: {
                label: function (ctx) {
                  const idx = ctx.dataIndex;
                  const meta = sliceMetadata[idx];
                  if (meta.isSubtype) {
                    const catPct = ((meta.count / meta.categoryTotal) * 100).toFixed(1);
                    const totalPct = ((meta.count / totalProjectsCount) * 100).toFixed(1);
                    return [
                      ` ${meta.subtypeName}: ${meta.count} projects`,
                      ` (${catPct}% of ${CATEGORY_CONFIG[meta.categoryKey].name}, ${totalPct}% of Total)`,
                      ` [Click to filter table]`,
                    ];
                  } else {
                    const totalPct = ((meta.count / totalProjectsCount) * 100).toFixed(1);
                    return [
                      ` ${meta.categoryName}: ${meta.count} projects (${totalPct}% of Total)`,
                      ` [Click to drill down into ${meta.categoryName}]`,
                    ];
                  }
                },
              },
            },
          },
          cutout: '58%',
        },
      });
      return;
    }

    // --- CASE 2: High-Level Full Category Doughnut (Initial State) ---
    if (titleEl) {
      titleEl.innerHTML = `<i class="bi bi-pie-chart-fill"></i> Projects by Category`;
    }
    if (subtitleEl) {
      subtitleEl.textContent = 'Click slice or legend item to drill down';
    }
    if (resetContainer) {
      resetContainer.innerHTML = '';
    }

    const catNames = categoryOrder.map((k) => CATEGORY_CONFIG[k].name);
    const catValues = categoryOrder.map((k) => counts[k]);
    const catColors = categoryOrder.map((k) => CATEGORY_CONFIG[k].baseColor);

    categoryChartInstance = new Chart(catCanvas, {
      type: 'doughnut',
      data: {
        labels: catNames,
        datasets: [
          {
            data: catValues,
            backgroundColor: catColors,
            borderWidth: 2,
            borderColor: '#ffffff',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        onClick: (evt, elements) => {
          if (elements && elements.length > 0) {
            const clickedIndex = elements[0].index;
            const chosenCat = categoryOrder[clickedIndex];

            drilldownCategory = chosenCat;
            drilldownSubtype = null;
            currentCategory = chosenCat;

            syncCategoryTabs();
            renderCategoryChart();

            currentPage = 1;
            applyFiltersAndSort();
            renderActiveFilterChips();
            renderTablePage();
          }
        },
        plugins: {
          legend: {
            position: 'right',
            onClick: (e, legendItem) => {
              // Non-destructive legend click: triggers drilldown into clicked category!
              const clickedIndex = legendItem.index;
              const chosenCat = categoryOrder[clickedIndex];

              drilldownCategory = chosenCat;
              drilldownSubtype = null;
              currentCategory = chosenCat;

              syncCategoryTabs();
              renderCategoryChart();

              currentPage = 1;
              applyFiltersAndSort();
              renderActiveFilterChips();
              renderTablePage();
            },
            labels: {
              boxWidth: 12,
              padding: 10,
              font: { size: 11, family: 'inherit', weight: '500' },
              generateLabels: function () {
                return catNames.map((label, i) => ({
                  text: `${label} (${catValues[i]})`,
                  fillStyle: catColors[i],
                  hidden: false,
                  index: i,
                }));
              },
            },
          },
          tooltip: {
            callbacks: {
              label: function (ctx) {
                const val = ctx.parsed;
                const pct = totalProjectsCount > 0 ? ((val / totalProjectsCount) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${val} projects (${pct}%) — Click to drill down`;
              },
            },
          },
        },
        cutout: '62%',
      },
    });
  }

  // --- Top 10 Contractors Chart with Continuous Rank Gradient & Reactive Filtering ---

  function renderContractorChart() {
    const contCanvas = document.getElementById('dpwhContractorChart');
    if (!contCanvas) return;
    if (contractorChartInstance) contractorChartInstance.destroy();

    const metrics = calculateMetrics(filteredProjects);
    const topList = metrics.topContractorsList;
    const labels = topList.map((c) => truncateText(c.name, 24));
    const values = topList.map((c) => c.totalCost);

    // Color gradient based on rank (Rank 1 darkest to Rank 10 lightest, active = orange)
    const barColors = topList.map((c, idx) => {
      if (selectedContractors.has(c.name)) {
        return '#ea580c'; // Highlighted active contractor
      }
      return CONTRACTOR_RANK_GRADIENT[idx] || '#2563eb';
    });

    contractorChartInstance = new Chart(contCanvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            data: values,
            backgroundColor: barColors,
            hoverBackgroundColor: '#002270',
            borderRadius: 4,
            barThickness: 14,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        onClick: (evt, elements) => {
          if (elements && elements.length > 0) {
            const idx = elements[0].index;
            const contractorName = topList[idx].name;

            if (selectedContractors.has(contractorName)) {
              selectedContractors.delete(contractorName);
            } else {
              selectedContractors.add(contractorName);
            }

            updateContractorMultiSelectUI();
            currentPage = 1;
            applyFiltersAndSort();
            renderActiveFilterChips();
            renderTablePage();
          }
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              title: function (items) {
                const idx = items[0].dataIndex;
                return `Rank #${idx + 1}: ${topList[idx].name}`;
              },
              label: function (ctx) {
                const idx = ctx.dataIndex;
                const item = topList[idx];
                const isSelected = selectedContractors.has(item.name);
                return [
                  ` Total Awarded: ${formatCurrency(item.totalCost)} (${item.count} projects)`,
                  isSelected ? ` [Active Filter — Click to remove]` : ` [Click bar to filter table]`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            grid: { color: 'rgba(0,0,0,0.04)' },
            ticks: {
              callback: function (val) {
                return formatSummaryCost(val);
              },
              font: { size: 10 },
            },
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 10 } },
          },
        },
      },
    });
  }

  function updateContractorMultiSelectUI() {
    const labelEl = document.getElementById('dpwh-multiselect-label');
    const checkboxes = document.querySelectorAll('#dpwh-contractor-list input[type="checkbox"]');

    if (checkboxes) {
      checkboxes.forEach((cb) => {
        cb.checked = selectedContractors.has(cb.value);
      });
    }

    if (labelEl) {
      if (selectedContractors.size === 0) {
        labelEl.innerHTML = `<i class="bi bi-person-badge"></i> All Contractors`;
      } else if (selectedContractors.size === 1) {
        const name = Array.from(selectedContractors)[0];
        labelEl.innerHTML = `<i class="bi bi-person-check-fill"></i> ${truncateText(name, 14)} <span class="dpwh-multiselect-badge">1</span>`;
      } else {
        labelEl.innerHTML = `<i class="bi bi-people-fill"></i> Contractors <span class="dpwh-multiselect-badge">${selectedContractors.size}</span>`;
      }
    }
  }

  // --- Table Rows & Expandable Detail Rendering ---

  function renderTablePage() {
    updateKPICards();
    renderContractorChart();

    const tbody = document.getElementById('dpwh-table-body');
    const filteredCountEl = document.getElementById('dpwh-export-filtered-count');
    const pdfFilteredCountEl = document.getElementById('dpwh-pdf-filtered-count');
    if (filteredCountEl) filteredCountEl.textContent = filteredProjects.length;
    if (pdfFilteredCountEl) pdfFilteredCountEl.textContent = filteredProjects.length;

    if (!tbody) return;

    if (filteredProjects.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5">
            <div class="dpwh-empty-state">
              <i class="bi bi-search"></i>
              <div class="dpwh-empty-title">No matching contracts found</div>
              <p>Try adjusting your search terms, contractor selection, or status filters.</p>
            </div>
          </td>
        </tr>
      `;
      renderPaginationControls();
      return;
    }

    const totalPages = Math.ceil(filteredProjects.length / CONFIG.pageSize);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * CONFIG.pageSize;
    const endIndex = Math.min(startIndex + CONFIG.pageSize, filteredProjects.length);

    let html = '';

    for (let i = startIndex; i < endIndex; i++) {
      const p = filteredProjects[i];
      const isExpanded = expandedProjectId === p.id;

      html += `
        <tr class="dpwh-row ${isExpanded ? 'expanded' : ''}" data-project-id="${p.id}" tabindex="0" role="button" aria-expanded="${isExpanded}">
          <td class="col-desc">
            <div class="dpwh-desc-wrap">
              <span class="dpwh-proj-id">${p.id}</span>
              <span class="dpwh-cat-badge ${getCategoryClass(p.category)}">${getCategoryLabel(p.category)}</span>
            </div>
            <div class="dpwh-proj-title-row">
              <span class="dpwh-proj-title" title="${p.name}">${truncateText(p.name, CONFIG.truncateLength)}</span>
              <i class="bi bi-chevron-down dpwh-expand-chevron"></i>
            </div>
            <span class="dpwh-proj-location"><i class="bi bi-geo-alt"></i>${p.location || 'Legazpi City, Albay'}</span>
          </td>
          <td class="col-contractor">
            <span class="dpwh-contractor">${p.contractor}</span>
            <span class="dpwh-contractor-id">#${p.contractorId}</span>
          </td>
          <td class="col-cost">${formatCurrency(p.cost)}</td>
          <td class="col-status">${getStatusBadge(p.status)}</td>
          <td class="col-date">${formatDate(p.completionDate)}</td>
        </tr>
      `;

      // If this row is expanded, render detailed accordion row
      if (isExpanded) {
        html += `
          <tr class="dpwh-detail-row">
            <td colspan="5">
              <div class="dpwh-detail-box">
                <div class="dpwh-detail-full-title">
                  <strong>Full Contract Name:</strong><br>${p.name}
                </div>
                <div class="dpwh-detail-grid">
                  <div class="dpwh-detail-item">
                    <span class="dpwh-detail-label">Project Location & Sub-Type</span>
                    <div class="dpwh-detail-value"><i class="bi bi-geo-alt text-primary"></i> ${p.location || 'Legazpi City, Albay'} <br><small class="text-muted"><i class="bi bi-tag"></i> ${getSubtype(p)}</small></div>
                  </div>
                  <div class="dpwh-detail-item">
                    <span class="dpwh-detail-label">Contractor & ID</span>
                    <div class="dpwh-detail-value">${p.contractor} <small class="text-muted">(#${p.contractorId})</small></div>
                  </div>
                  <div class="dpwh-detail-item">
                    <span class="dpwh-detail-label">Contract Cost</span>
                    <div class="dpwh-detail-value text-success">${formatCurrency(p.cost)}</div>
                  </div>
                  <div class="dpwh-detail-item">
                    <span class="dpwh-detail-label">Accomplishment Status</span>
                    <div class="dpwh-detail-value">${p.status.toFixed(1)}% ${p.status === 100 ? '(Completed)' : '(In Progress)'}</div>
                    <div class="dpwh-progress-bar-wrap">
                      <div class="dpwh-progress-bar ${p.status < 100 ? 'ongoing' : ''}" style="width: ${Math.min(p.status, 100)}%;"></div>
                    </div>
                  </div>
                </div>
              </div>
            </td>
          </tr>
        `;
      }
    }

    tbody.innerHTML = html;
    renderPaginationControls();
    attachRowClickListeners();
  }

  // --- Pagination Controls ---

  function renderPaginationControls() {
    const container = document.getElementById('dpwh-pagination-container');
    if (!container) return;

    const totalItems = filteredProjects.length;
    if (totalItems === 0) {
      container.innerHTML = '';
      return;
    }

    const totalPages = Math.ceil(totalItems / CONFIG.pageSize);
    const startItem = (currentPage - 1) * CONFIG.pageSize + 1;
    const endItem = Math.min(currentPage * CONFIG.pageSize, totalItems);

    const pages = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 4) pages.push('...');

      const start = Math.max(2, currentPage - 2);
      const end = Math.min(totalPages - 1, currentPage + 2);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 3) pages.push('...');
      if (!pages.includes(totalPages)) pages.push(totalPages);
    }

    let navHtml = `
      <div class="dpwh-pagination-info">
        Showing ${startItem} to ${endItem} of ${totalItems} contracts
      </div>
      <div class="dpwh-pagination-nav" role="navigation" aria-label="Pagination Navigation">
        <button class="dpwh-page-btn dpwh-page-prev" data-page="${currentPage - 1}" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous page">
          <i class="bi bi-chevron-left"></i>
        </button>
    `;

    pages.forEach((p) => {
      if (p === '...') {
        navHtml += `<span class="dpwh-page-ellipsis">...</span>`;
      } else {
        const isActive = p === currentPage;
        navHtml += `
          <button class="dpwh-page-btn ${isActive ? 'active' : ''}" data-page="${p}" ${isActive ? 'aria-current="page"' : ''}>
            ${p}
          </button>
        `;
      }
    });

    navHtml += `
        <button class="dpwh-page-btn dpwh-page-next" data-page="${currentPage + 1}" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next page">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>
    `;

    container.innerHTML = navHtml;

    container.querySelectorAll('.dpwh-page-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const page = parseInt(btn.dataset.page, 10);
        if (page && page >= 1 && page <= totalPages && page !== currentPage) {
          currentPage = page;
          renderTablePage();
          const tableWrap = document.querySelector('.dpwh-table-wrap');
          if (tableWrap) {
            const rect = tableWrap.getBoundingClientRect();
            if (rect.top < 80) {
              tableWrap.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }
        }
      });
    });
  }

  // --- Row Expansion Listener ---

  function attachRowClickListeners() {
    const rows = document.querySelectorAll('.dpwh-row');
    rows.forEach((row) => {
      row.addEventListener('click', () => {
        const id = row.dataset.projectId;
        if (expandedProjectId === id) {
          expandedProjectId = null;
        } else {
          expandedProjectId = id;
        }
        renderTablePage();
      });

      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          row.click();
        }
      });
    });
  }

  // --- Download & Export Handlers ---

  function exportCSV(scope) {
    const dataset = scope === 'all' ? allProjects : filteredProjects;
    if (!dataset || dataset.length === 0) {
      alert('No projects available to export.');
      return;
    }

    const headers = [
      'Contract ID',
      'Contract Description',
      'Location',
      'Category',
      'Sub-Type',
      'Contractor',
      'Contractor ID',
      'Cost (PHP)',
      'Accomplishment (%)',
      'Completion Date',
    ];

    const escapeCsv = (val) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [headers.join(',')];

    dataset.forEach((p) => {
      const row = [
        escapeCsv(p.id),
        escapeCsv(p.name),
        escapeCsv(p.location),
        escapeCsv(p.category),
        escapeCsv(getSubtype(p)),
        escapeCsv(p.contractor),
        escapeCsv(p.contractorId),
        p.cost || 0,
        p.status || 0,
        escapeCsv(p.completionDate || ''),
      ];
      csvRows.push(row.join(','));
    });

    const csvString = '\uFEFF' + csvRows.join('\r\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const scopeLabel = scope === 'all' ? 'full_dataset_781' : 'filtered_view';
    link.setAttribute('href', url);
    link.setAttribute('download', `DPWH_Projects_Legazpi_City_${scopeLabel}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportPDF(scope) {
    if (scope === 'all') {
      const prevFiltered = filteredProjects;
      filteredProjects = allProjects;
      renderTablePage();
      window.print();
      filteredProjects = prevFiltered;
      renderTablePage();
    } else {
      window.print();
    }
  }

  // --- Global Event Listeners ---

  function attachEventListeners() {
    // 1. Category Filter Tabs
    document.querySelectorAll('.dpwh-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        const filter = tab.dataset.filter;
        currentCategory = filter;
        drilldownCategory = filter === 'all' ? null : filter;
        drilldownSubtype = null;

        syncCategoryTabs();
        renderCategoryChart();

        currentPage = 1;
        applyFiltersAndSort();
        renderActiveFilterChips();
        renderTablePage();
      });
    });

    // 2. Search Input with Debounce & Clear
    const searchInput = document.getElementById('dpwh-search-input');
    const searchClear = document.getElementById('dpwh-search-clear');

    let searchTimer = null;
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const val = e.target.value;
        searchQuery = val;
        if (searchClear) {
          searchClear.classList.toggle('visible', val.length > 0);
        }

        clearTimeout(searchTimer);
        searchTimer = setTimeout(() => {
          currentPage = 1;
          applyFiltersAndSort();
          renderActiveFilterChips();
          renderTablePage();
        }, 180);
      });
    }

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        if (searchInput) {
          searchInput.value = '';
          searchQuery = '';
          searchClear.classList.remove('visible');
          currentPage = 1;
          applyFiltersAndSort();
          renderActiveFilterChips();
          renderTablePage();
          searchInput.focus();
        }
      });
    }

    // 3. Contractor Multi-Select Dropdown Toggle & Search
    const multiContainer = document.getElementById('dpwh-contractor-multiselect');
    const multiToggleBtn = document.getElementById('dpwh-multiselect-toggle');
    const contractorSearch = document.getElementById('dpwh-contractor-search');
    const contractorList = document.getElementById('dpwh-contractor-list');

    if (multiToggleBtn && multiContainer) {
      multiToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        multiContainer.classList.toggle('open');
        document.querySelectorAll('.dpwh-export-dropdown-wrapper').forEach((d) => d.classList.remove('open'));
      });
    }

    if (contractorSearch && contractorList) {
      contractorSearch.addEventListener('input', (e) => {
        const q = e.target.value.toLowerCase().trim();
        const items = contractorList.querySelectorAll('.dpwh-multiselect-item');
        items.forEach((item) => {
          const name = item.querySelector('.dpwh-multiselect-item-name').textContent.toLowerCase();
          item.style.display = name.includes(q) ? 'flex' : 'none';
        });
      });
    }

    // Checkbox changes inside contractor list
    if (contractorList) {
      contractorList.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
          const val = e.target.value;
          if (e.target.checked) {
            selectedContractors.add(val);
          } else {
            selectedContractors.delete(val);
          }
          updateContractorMultiSelectUI();
          renderContractorChart();

          currentPage = 1;
          applyFiltersAndSort();
          renderActiveFilterChips();
          renderTablePage();
        }
      });
    }

    // Select All / Clear All Contractor Shortcuts
    const selectAllBtn = document.getElementById('dpwh-contractor-select-all');
    const clearAllBtn = document.getElementById('dpwh-contractor-clear-all');

    if (selectAllBtn) {
      selectAllBtn.addEventListener('click', () => {
        allProjects.forEach((p) => {
          if (p.contractor) selectedContractors.add(p.contractor);
        });
        updateContractorMultiSelectUI();
        renderContractorChart();
        currentPage = 1;
        applyFiltersAndSort();
        renderActiveFilterChips();
        renderTablePage();
      });
    }

    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        selectedContractors.clear();
        updateContractorMultiSelectUI();
        renderContractorChart();
        currentPage = 1;
        applyFiltersAndSort();
        renderActiveFilterChips();
        renderTablePage();
      });
    }

    // 4. Status Select
    const statusSelect = document.getElementById('dpwh-status-select');
    if (statusSelect) {
      statusSelect.addEventListener('change', (e) => {
        currentStatus = e.target.value;
        currentPage = 1;
        applyFiltersAndSort();
        renderActiveFilterChips();
        renderTablePage();
      });
    }

    // 5. Sort Select
    const sortSelect = document.getElementById('dpwh-sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        applyFiltersAndSort();
        renderTablePage();
      });
    }

    // 6. Split Export Dropdown Toggles (CSV & PDF)
    const csvWrapper = document.getElementById('dpwh-csv-dropdown-wrapper');
    const csvToggleBtn = document.getElementById('dpwh-csv-toggle-btn');
    const pdfWrapper = document.getElementById('dpwh-pdf-dropdown-wrapper');
    const pdfToggleBtn = document.getElementById('dpwh-pdf-toggle-btn');

    if (csvToggleBtn && csvWrapper) {
      csvToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        csvWrapper.classList.toggle('open');
        if (pdfWrapper) pdfWrapper.classList.remove('open');
        if (multiContainer) multiContainer.classList.remove('open');
      });
    }

    if (pdfToggleBtn && pdfWrapper) {
      pdfToggleBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        pdfWrapper.classList.toggle('open');
        if (csvWrapper) csvWrapper.classList.remove('open');
        if (multiContainer) multiContainer.classList.remove('open');
      });
    }

    // Export Trigger Buttons
    const csvFiltered = document.getElementById('dpwh-export-csv-filtered');
    const csvAll = document.getElementById('dpwh-export-csv-all');
    const pdfFiltered = document.getElementById('dpwh-export-pdf-filtered');
    const pdfAll = document.getElementById('dpwh-export-pdf-all');

    if (csvFiltered) {
      csvFiltered.addEventListener('click', () => {
        csvWrapper.classList.remove('open');
        exportCSV('filtered');
      });
    }
    if (csvAll) {
      csvAll.addEventListener('click', () => {
        csvWrapper.classList.remove('open');
        exportCSV('all');
      });
    }
    if (pdfFiltered) {
      pdfFiltered.addEventListener('click', () => {
        pdfWrapper.classList.remove('open');
        exportPDF('filtered');
      });
    }
    if (pdfAll) {
      pdfAll.addEventListener('click', () => {
        pdfWrapper.classList.remove('open');
        exportPDF('all');
      });
    }

    // Close any open dropdowns when clicking outside
    document.addEventListener('click', (e) => {
      if (multiContainer && !multiContainer.contains(e.target)) {
        multiContainer.classList.remove('open');
      }
      if (csvWrapper && !csvWrapper.contains(e.target)) {
        csvWrapper.classList.remove('open');
      }
      if (pdfWrapper && !pdfWrapper.contains(e.target)) {
        pdfWrapper.classList.remove('open');
      }
    });
  }

  // --- Initializer ---
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadDPWHProjects);
  } else {
    loadDPWHProjects();
  }
})();
