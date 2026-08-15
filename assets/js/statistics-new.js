/**
 * Statistics Page - Enhanced Animations & Charts
 * Better Solano Portal - Minimal Professional Design
 */

// Brand colors
const COLORS = {
  primary: '#0032a0',
  primaryDark: '#002170',
  secondary: '#003D82',
  accent: '#F77F00',
  success: '#06A77D',
  info: '#0077BE',
};

// Barangay data (2024 Census)
const barangayData = [
  { name: 'Roxas', pop: 9088 },
  { name: 'Quirino', pop: 6572 },
  { name: 'Osmeña', pop: 6403 },
  { name: 'Quezon', pop: 5758 },
  { name: 'Curifang', pop: 4885 },
  { name: 'Bagahabag', pop: 4731 },
  { name: 'Uddiawan', pop: 4217 },
  { name: 'Bascaran', pop: 3845 },
  { name: 'Aggub', pop: 3101 },
  { name: 'San Luis', pop: 2668 },
  { name: 'Communal', pop: 2586 },
  { name: 'Lactawan', pop: 2109 },
  { name: 'San Juan', pop: 1965 },
  { name: 'Concepcion', pop: 1954 },
  { name: 'Dadap', pop: 1409 },
  { name: 'Wacal', pop: 1398 },
  { name: 'Bangaan', pop: 1284 },
  { name: 'Tucal', pop: 1244 },
  { name: 'Bangar', pop: 1146 },
  { name: 'Pilar D. Galima', pop: 1146 },
  { name: 'Poblacion North', pop: 970 },
  { name: 'Poblacion South', pop: 817 },
];

// Historical data
const historicalData = {
  years: [1990, 1995, 2000, 2007, 2010, 2015, 2020, 2024],
  populations: [38006, 42857, 47288, 53004, 56831, 62649, 65896, 69296],
};

// Chart instances
let charts = {};

/**
 * Animate number counting
 */
function animateCount(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

/**
 * Intersection Observer for scroll animations
 */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');

            // Trigger count animation for metric cards
            const countEl = entry.target.querySelector('[data-count]');
            if (countEl) {
              const target = parseInt(countEl.dataset.count);
              animateCount(countEl, target);
            }

            // Animate bars
            animateBars(entry.target);
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.animate-on-scroll, .metric-card').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Animate progress bars within an element
 */
function animateBars(container) {
  // Breakdown bars
  container.querySelectorAll('.breakdown-segment').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width + '%';
      }, 300);
    }
  });

  // Barangay bars
  container.querySelectorAll('.bar-wrap .bar').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width + '%';
      }, 100);
    }
  });

  // Sector bars
  container.querySelectorAll('.sector-bar, .sc-fill').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width + '%';
      }, 200);
    }
  });

  // Poverty bars
  container.querySelectorAll('.poverty-fill').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width * 10 + '%';
      }, 300);
    }
  });
}

/**
 * Create Historical Line Chart
 */
function createHistoricalChart() {
  const ctx = document.getElementById('historicalLineChart');
  if (!ctx) return;

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(0, 50, 160, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 50, 160, 0)');

  charts.historical = new Chart(ctx, {
    type: 'line',
    data: {
      labels: historicalData.years,
      datasets: [
        {
          label: 'Population',
          data: historicalData.populations,
          borderColor: COLORS.primary,
          backgroundColor: gradient,
          fill: true,
          tension: 0.4,
          pointBackgroundColor: COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 2000,
        easing: 'easeOutQuart',
      },
      interaction: {
        intersect: false,
        mode: 'index',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 50, 160, 0.95)',
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (ctx) => `Population: ${ctx.raw.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { font: { size: 12 } },
        },
        y: {
          beginAtZero: false,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font: { size: 12 },
            callback: (v) => v / 1000 + 'K',
          },
        },
      },
    },
  });
}

/**
 * Create Distribution Pie Chart
 */
function createDistributionChart() {
  const ctx = document.getElementById('distributionPieChart');
  if (!ctx) return;

  const top10 = barangayData.slice(0, 10);
  const colors = [
    COLORS.primary,
    COLORS.accent,
    COLORS.success,
    COLORS.info,
    '#8B5CF6',
    '#EC4899',
    '#14B8A6',
    '#F59E0B',
    '#6366F1',
    COLORS.secondary,
  ];

  charts.distribution = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: top10.map((d) => d.name),
      datasets: [
        {
          data: top10.map((d) => d.pop),
          backgroundColor: colors,
          borderColor: '#fff',
          borderWidth: 3,
          hoverBorderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: 'easeOutQuart',
      },
      cutout: '55%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 14,
            padding: 12,
            font: { size: 12 },
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: 'rgba(0, 50, 160, 0.95)',
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
              const pct = ((ctx.raw / total) * 100).toFixed(1);
              return `${ctx.raw.toLocaleString()} (${pct}%)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Create Population Bar Chart
 */
function createBarChart() {
  const ctx = document.getElementById('populationBarChart');
  if (!ctx) return;

  const sorted = [...barangayData].sort((a, b) => b.pop - a.pop);

  charts.bar = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: sorted.map((d) => d.name),
      datasets: [
        {
          label: 'Population',
          data: sorted.map((d) => d.pop),
          backgroundColor: sorted.map((_, i) => {
            const opacity = 1 - i * 0.03;
            return `rgba(0, 50, 160, ${opacity})`;
          }),
          borderRadius: 4,
          borderSkipped: false,
        },
      ],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeOutQuart',
        delay: (ctx) => ctx.dataIndex * 50,
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0, 50, 160, 0.95)',
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            label: (ctx) => `Population: ${ctx.raw.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: {
            font: { size: 11 },
            callback: (v) => v.toLocaleString(),
          },
        },
        y: {
          grid: { display: false },
          ticks: { font: { size: 11 } },
        },
      },
    },
  });
}

/**
 * Initialize all charts with lazy loading
 */
function initCharts() {
  const chartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const chartId = entry.target.id;

          if (chartId === 'historicalLineChart' && !charts.historical) {
            createHistoricalChart();
          } else if (chartId === 'distributionPieChart' && !charts.distribution) {
            createDistributionChart();
          } else if (chartId === 'populationBarChart' && !charts.bar) {
            createBarChart();
          }

          chartObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('canvas').forEach((canvas) => {
    chartObserver.observe(canvas);
  });
}

/**
 * Initialize economy section counters
 */
function initEconomyCounters() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const countEl = entry.target.querySelector('[data-count]');
          if (countEl) {
            const target = parseInt(countEl.dataset.count);
            animateCount(countEl, target, 1500);
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.3 }
  );

  document.querySelectorAll('.economy-card').forEach((card) => {
    observer.observe(card);
  });
}

/**
 * CMCI (Competitive Index) Data
 */
const cmciData = {
  years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
  pillars: {
    economicDynamism: {
      labels: [
        'Local Economy Size',
        'Local Economy Growth',
        'Active Establishments',
        'Safety Compliant Business',
        'Employment Generation',
        'Cost of Living',
        'Cost of Doing Business',
        'Financial Deepening',
        'Productivity',
        'Business & Prof. Organizations',
      ],
      data: [
        [0.0836, 0.5628, 0.6533, 0.2854, 1.4896, 1.5438, 1.5557, 0.1457, 0.2204, 0.1688, 0.1375],
        [1.1346, 0.3252, 0.3421, 0.0589, 0.4253, 0.1038, 0.5575, 0.0101, 0.0164, 0.0123, 0.0098],
        [null, null, null, 1.5372, 1.4852, 1.0082, 0.7671, 0.8381, 0.6904, 0.8107, 1.2331],
        [null, null, null, 0.5491, 0.4092, 0.6662, 0.7260, 0.3878, 0.5173, 0.5147, 0.4927],
        [0.3967, 0.7864, 1.9368, 0.4001, 2.2459, 1.0558, 2.0809, 1.9125, 1.0008, 1.1003, 0.2406],
        [3.2692, 2.9438, 3.5000, 1.6810, 0.7143, 0.2778, 1.9366, 0.2273, 1.0000, 1.0957, 0.9296],
        [3.7040, 3.4046, 3.3498, 1.7362, 1.8941, 1.9723, 2.1282, 2.2036, 1.6248, 1.6062, 1.7885],
        [0.3159, 0.6628, 2.0833, 1.5800, 1.3847, 1.0219, 1.2964, 1.1492, 1.0690, 0.9314, 1.1362],
        [0.0498, 0.1813, 0.1395, 0.0109, 0.0232, 0.9413, 1.3548, 0.9267, 0.1414, 0.1559, 0.1529],
        [0.2717, 0.7494, 1.3634, 0.4158, 0.4786, 0.4002, 1.2792, 0.8448, 2.0000, 2.0000, 2.0000],
      ],
    },
    governmentEfficiency: {
      labels: [
        'Compliance to Directives',
        'Investment Promotion Unit',
        'ARTA Citizens Charter',
        'Local Resource Generation',
        'Capacity of Health Services',
        'Capacity of School Services',
        'Recognition of Performance',
        'Business Permits',
        'Peace and Order',
        'Social Protection',
      ],
      data: [
        [2.9167, 3.3333, 2.8105, 2.4306, 2.3611, 2.4306, 2.5000, 2.4265, 1.8571, 1.9643, 2.0000],
        [3.3333, 3.3333, 3.3333, 2.5000, 2.5000, 2.5000, 2.5000, 2.5000, 1.9048, 1.9048, 2.0001],
        [null, 2.1134, 1.9476, 1.8439, 2.0130, 1.1632, 2.2766, 1.0417, 2.0000, 2.0000, 2.0000],
        [0.9656, 1.1834, 0.6239, 0.5512, 0.5682, 0.3819, 0.3771, 0.2641, 0.5644, 0.4643, 0.2247],
        [0.0941, 0.3425, 0.6827, 0.9042, 1.4015, 1.3582, 1.1587, 1.1622, 0.8112, 0.7329, 0.6818],
        [0.5480, 1.0780, 0.3458, 0.3699, 0.0474, 0.9268, 0.8618, 0.6910, 0.2954, 0.6763, 0.5917],
        [0.5714, 0.4496, 2.5000, 0.3699, 0.6604, 0.5832, 0.7935, 0.2729, 0.3616, 1.0833, 0.5578],
        [null, null, 3.0944, 2.2106, 2.1230, 2.2650, 2.1363, 2.3461, 2.0000, 2.0000, 2.0000],
        [0.6895, 0.8681, 1.9525, 1.0121, 0.2076, 0.3754, 0.5876, 0.4468, 0.0007, 0.3979, 0.3307],
        [null, null, 0.7996, 0.0199, 1.5081, 0.8581, 0.7192, 0.7175, 1.2860, 0.5640, 1.7674],
      ],
    },
    infrastructure: {
      labels: [
        'Road Network',
        'Distance to Ports',
        'Basic Utilities',
        'Transportation Vehicles',
        'Education',
        'Health',
        'LGU Investment',
        'Accommodation Capacity',
        'IT Capacity',
        'FinTech Capacity',
      ],
      data: [
        [0.1529, 0.0014, 0.3671, 0.0063, 2.5000, 0.1069, 0.1070, 0.0522, 0.0093, 0.0023, 0.0075],
        [3.2937, 3.3117, 3.3116, 2.4816, 2.4595, 2.4622, 2.4708, 2.4859, 1.9770, 1.9584, 1.9183],
        [3.3333, 3.3333, 3.3333, 2.5000, 2.5000, 2.5000, 2.5000, 2.5000, 1.5710, 1.5800, 0.9936],
        [0.3047, 0.6300, 0.2556, 0.2835, 0.2358, 1.4174, 1.6161, 0.4990, 0.3798, 0.2739, 0.1476],
        [0.2918, 0.9501, 0.7898, 0.6803, 1.0588, 1.0409, 0.9383, 0.8080, 0.7691, 0.6235, 0.6333],
        [0.7312, 1.1021, 0.5881, 1.0757, 1.3019, 1.4124, 1.8439, 1.6773, 1.3211, 1.1773, 1.1994],
        [0.9969, 0.3214, 3.1818, 0.9360, 0.9837, 0.6890, 0.6609, 0.1339, 0.0028, 0.5090, 0.3190],
        [0.4443, 1.2404, 1.4686, 2.0252, 2.4510, 1.6233, 1.7930, 1.4424, 1.3014, 1.1746, 1.1444],
        [0.2851, 0.9028, 1.5769, 0.8516, 1.3371, 2.0000, 1.7045, 0.7292, 0.2456, 0.2857, 0.2629],
        [0.2766, 0.7878, 1.4357, 1.0312, 1.1308, 1.2178, 1.3721, 1.1044, 1.3944, 1.3760, 1.4153],
      ],
    },
    resiliency: {
      labels: [
        'Land Use Plan',
        'DRR Plan',
        'Disaster Drill',
        'Early Warning System',
        'DRRMP Budget',
        'Risk Assessments',
        'Emergency Infrastructure',
        'Utilities',
        'Employed Population',
        'Sanitary System',
      ],
      data: [
        [null, null, null, 2.5000, 2.5000, 2.4998, 2.5000, 2.4800, 1.9524, 1.9643, 1.9828],
        [null, null, null, 2.5000, 2.5000, 2.4405, 2.5000, 2.5000, 1.8889, 1.9524, 1.9091],
        [null, null, null, 2.5000, 2.5000, 1.2500, 2.5000, 1.2635, 1.1748, 1.0745, 1.0136],
        [null, null, null, 2.5000, 2.5000, 2.5000, 2.5000, 1.3571, 1.0884, 1.0090, 1.0041],
        [null, null, null, 0.0627, 0.2109, 0.2672, 0.5516, 0.7942, 0.3579, 0.3638, 0.7416],
        [null, null, null, 2.5000, 2.5000, 2.5000, 2.5000, 2.5000, 2.0000, 2.0000, 2.0000],
        [null, null, null, 1.2760, 1.2982, 0.9502, 0.9828, 0.5961, 0.6450, 0.5757, 0.5241],
        [null, null, null, 1.0546, 1.7227, 1.9294, 1.9393, 1.5884, 1.6553, 1.6443, 1.4978],
        [null, null, null, 0.3476, 0.0423, 0.0773, 0.0464, 0.0220, 0.3059, 0.3949, 0.2657],
        [null, null, null, 1.6180, 1.6659, 1.8815, 1.9875, 1.8762, 1.5004, 1.5192, 1.5212],
      ],
    },
    innovation: {
      labels: [
        'ICT Plan',
        'R&D Expenditures',
        'E-BPLS Software',
        'Online Payment Facilities',
        'STEM Graduates',
        'IP Registration',
        'Internet Capability',
        'Basic Internet Service',
        'Innovation Facilities',
        'New Technology',
      ],
      data: [
        [null, null, null, null, null, null, null, null, 2.0001, 2.0001, 2.0001],
        [null, null, null, null, null, null, null, null, 0.0036, 0.0763, 0.0925],
        [null, null, null, null, null, null, null, null, 2.0000, 2.0000, 2.0000],
        [null, null, null, null, null, null, null, null, 2.0000, 2.0000, 2.0000],
        [null, null, null, null, null, null, null, null, 0.8490, 1.2746, 0.9778],
        [null, null, null, null, null, null, null, null, 0.4989, 0.3639, 0.3832],
        [null, null, null, null, null, null, null, null, 1.0473, 1.0299, 1.0016],
        [null, null, null, null, null, null, null, null, 0.7291, 0.8892, 0.9868],
        [null, null, null, null, null, null, null, null, 0.3193, 0.3225, 0.2272],
        [null, null, null, null, null, null, null, null, 0.0766, 0.0106, 0.0128],
      ],
    },
  },
  keyIndicators: {
    labels: ['Health', 'Education', 'Social Protection', 'Peace & Order', 'LGU Investment'],
    data: [
      [0.7312, 1.1021, 0.5881, 1.0757, 1.3019, 1.4124, 1.8439, 1.6773, 1.3211, 1.1773, 1.1994],
      [0.2918, 0.9501, 0.7898, 0.6803, 1.0588, 1.0409, 0.9383, 0.8080, 0.7691, 0.6235, 0.6333],
      [null, null, 0.7996, 0.0199, 1.5081, 0.8581, 0.7192, 0.7175, 1.2860, 0.5640, 1.7674],
      [0.6895, 0.8681, 1.9525, 1.0121, 0.2076, 0.3754, 0.5876, 0.4468, 0.0007, 0.3979, 0.3307],
      [0.9969, 0.3214, 3.1818, 0.9360, 0.9837, 0.6890, 0.6609, 0.1339, 0.0028, 0.5090, 0.3190],
    ],
  },
};

/**
 * Palette for charts (up to 10 series)
 */
const CMCI_PALETTE = [
  COLORS.primary,
  COLORS.accent,
  COLORS.success,
  COLORS.info,
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#14B8A6',
];

/**
 * Setup 2-in-1 Interactive Bottom Legend for a CMCI Chart (Option 2)
 */
function setupInteractiveBottomLegend(chartInstance, canvasId, labels, colors) {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const container = canvas.closest('.cmci-chart-container');
  if (!container) return;

  // Clean up any old toolbars or legends
  const prevToolbar = container.querySelector('.cmci-chart-toolbar');
  if (prevToolbar) prevToolbar.remove();
  const prevLegend = container.querySelector('.cmci-interactive-legend');
  if (prevLegend) prevLegend.remove();

  const legendContainer = document.createElement('div');
  legendContainer.className = 'cmci-interactive-legend';

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'cmci-legend-items';

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'cmci-legend-actions';

  const btnAll = document.createElement('button');
  btnAll.type = 'button';
  btnAll.className = 'cmci-legend-btn active';
  btnAll.innerHTML = '<i class="bi bi-check2-all"></i> <span data-i18n="stats-filter-all">All</span>';

  const btnClear = document.createElement('button');
  btnClear.type = 'button';
  btnClear.className = 'cmci-legend-btn';
  btnClear.innerHTML = '<i class="bi bi-x"></i> <span data-i18n="stats-filter-clear">Clear</span>';

  actionsContainer.appendChild(btnAll);
  actionsContainer.appendChild(btnClear);

  const legendItems = [];

  labels.forEach((label, index) => {
    const color = colors[index % colors.length];
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'cmci-legend-item active';
    item.style.setProperty('--indicator-color', color);
    item.innerHTML = `<span class="legend-indicator" style="--indicator-color:${color}"></span><span class="legend-text">${label}</span>`;
    item.title = 'Click to toggle. Double-click to isolate.';

    // Single click toggles
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = chartInstance.isDatasetVisible(index);
      chartInstance.setDatasetVisibility(index, !isVisible);
      item.classList.toggle('active', !isVisible);
      item.classList.toggle('inactive', isVisible);
      chartInstance.update();
      updateActionState();
    });

    // Double click isolates
    item.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isolateIndicator(index);
    });

    // Hover highlight
    item.addEventListener('mouseenter', () => {
      if (!chartInstance.isDatasetVisible(index)) return;
      chartInstance.data.datasets.forEach((ds, i) => {
        if (i === index) {
          ds.borderWidth = 3.5;
          ds.pointRadius = 4;
        } else {
          ds.borderColor = colors[i % colors.length] + '35';
        }
      });
      chartInstance.update('none');
    });

    item.addEventListener('mouseleave', () => {
      chartInstance.data.datasets.forEach((ds, i) => {
        ds.borderWidth = 2;
        ds.pointRadius = 0;
        ds.borderColor = colors[i % colors.length];
      });
      chartInstance.update('none');
    });

    itemsContainer.appendChild(item);
    legendItems.push(item);
  });

  function isolateIndicator(targetIndex) {
    labels.forEach((_, i) => {
      const show = (i === targetIndex);
      chartInstance.setDatasetVisibility(i, show);
      if (legendItems[i]) {
        legendItems[i].classList.toggle('active', show);
        legendItems[i].classList.toggle('inactive', !show);
      }
    });
    chartInstance.update();
    updateActionState();
  }

  function updateActionState() {
    let allActive = true;
    let noneActive = true;
    labels.forEach((_, i) => {
      const visible = chartInstance.isDatasetVisible(i);
      if (visible) noneActive = false;
      else allActive = false;
    });
    btnAll.classList.toggle('active', allActive);
    btnClear.classList.toggle('active', noneActive);
  }

  btnAll.addEventListener('click', () => {
    labels.forEach((_, i) => {
      chartInstance.setDatasetVisibility(i, true);
      if (legendItems[i]) {
        legendItems[i].classList.add('active');
        legendItems[i].classList.remove('inactive');
      }
    });
    chartInstance.update();
    updateActionState();
  });

  btnClear.addEventListener('click', () => {
    labels.forEach((_, i) => {
      chartInstance.setDatasetVisibility(i, false);
      if (legendItems[i]) {
        legendItems[i].classList.remove('active');
        legendItems[i].classList.add('inactive');
      }
    });
    chartInstance.update();
    updateActionState();
  });

  legendContainer.appendChild(itemsContainer);
  legendContainer.appendChild(actionsContainer);
  container.appendChild(legendContainer);

  // Link indicator cards in panel to chart filter
  const panel = container.closest('.cmci-panel');
  if (panel) {
    panel.querySelectorAll('.cmci-indicator-card').forEach((card) => {
      card.title = 'Click to isolate indicator on chart';
      card.addEventListener('click', () => {
        const headerEl = card.querySelector('.indicator-header');
        if (!headerEl) return;
        const text = headerEl.textContent.trim().toLowerCase();
        const matchIndex = labels.findIndex((l) => {
          const lLower = l.toLowerCase();
          return text.includes(lLower) || lLower.includes(text);
        });
        if (matchIndex !== -1) {
          isolateIndicator(matchIndex);
          panel.querySelectorAll('.cmci-indicator-card').forEach((c) => c.classList.remove('card-selected'));
          card.classList.add('card-selected');
        }
      });
    });
  }
}

/**
 * Create CMCI Overview Chart
 */
function createCMCIOverviewChart() {
  if (typeof document === 'undefined') return;
  const ctx = document.getElementById('cmciOverviewChart');
  if (!ctx || charts.cmciOverview) return;

  const labels = cmciData.keyIndicators.labels;

  charts.cmciOverview = new Chart(ctx, {
    type: 'line',
    data: {
      labels: cmciData.years,
      datasets: labels.map((label, i) => ({
        label: label,
        data: cmciData.keyIndicators.data[i],
        borderColor: CMCI_PALETTE[i % CMCI_PALETTE.length],
        backgroundColor: CMCI_PALETTE[i % CMCI_PALETTE.length] + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1500, easing: 'easeOutQuart' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 50, 160, 0.95)',
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) =>
              ctx.raw !== null
                ? `${ctx.dataset.label}: ${ctx.raw.toFixed(4)}`
                : `${ctx.dataset.label}: N/A`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 } } },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 11 } },
        },
      },
    },
  });

  setupInteractiveBottomLegend(charts.cmciOverview, 'cmciOverviewChart', labels, CMCI_PALETTE);
}

/**
 * Create CMCI Pillar Chart
 */
function createCMCIPillarChart(pillarKey, canvasId) {
  if (typeof document === 'undefined') return;
  const ctx = document.getElementById(canvasId);
  if (!ctx || charts[canvasId]) return;

  const pillarData = cmciData.pillars[pillarKey];
  if (!pillarData) return;

  charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: cmciData.years,
      datasets: pillarData.labels.map((label, i) => ({
        label: label,
        data: pillarData.data[i],
        borderColor: CMCI_PALETTE[i % CMCI_PALETTE.length],
        backgroundColor: CMCI_PALETTE[i % CMCI_PALETTE.length] + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: 'rgba(0, 50, 160, 0.95)',
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (ctx) =>
              ctx.raw !== null
                ? `${ctx.dataset.label}: ${ctx.raw.toFixed(4)}`
                : `${ctx.dataset.label}: N/A`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 } } },
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(0,0,0,0.05)' },
          ticks: { font: { size: 10 } },
        },
      },
    },
  });

  setupInteractiveBottomLegend(charts[canvasId], canvasId, pillarData.labels, CMCI_PALETTE);
}

/**
 * Initialize CMCI Tab Navigation
 */
function initCMCITabs() {
  const tabs = document.querySelectorAll('.cmci-tab');
  const panels = document.querySelectorAll('.cmci-panel');

  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const pillar = tab.dataset.pillar;

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel
      panels.forEach((p) => p.classList.remove('active'));
      const activePanel = document.getElementById(`panel-${pillar}`);
      if (activePanel) {
        activePanel.classList.add('active');

        // Create chart for this panel if needed
        if (pillar === 'overview') {
          createCMCIOverviewChart();
        } else if (pillar === 'economic-dynamism') {
          createCMCIPillarChart('economicDynamism', 'cmciEconomicChart');
        } else if (pillar === 'government-efficiency') {
          createCMCIPillarChart('governmentEfficiency', 'cmciGovernmentChart');
        } else if (pillar === 'infrastructure') {
          createCMCIPillarChart('infrastructure', 'cmciInfraChart');
        } else if (pillar === 'resiliency') {
          createCMCIPillarChart('resiliency', 'cmciResiliencyChart');
        } else if (pillar === 'innovation') {
          createCMCIPillarChart('innovation', 'cmciInnovationChart');
        }

        // Animate indicator bars
        animateCMCIBars(activePanel);
      }
    });
  });
}

/**
 * Animate CMCI indicator bars
 */
function animateCMCIBars(container) {
  container.querySelectorAll('.indicator-fill').forEach((bar) => {
    const value = bar.dataset.value;
    if (value) {
      setTimeout(() => {
        bar.style.setProperty('--fill-width', value + '%');
        bar.classList.add('animated');
      }, 100);
    }
  });
}

/**
 * Initialize CMCI Section
 */
function initCMCISection() {
  const cmciSection = document.getElementById('competitive-index');
  if (!cmciSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initCMCITabs();
          createCMCIOverviewChart();
          animateCMCIBars(document.getElementById('panel-overview'));
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(cmciSection);
}

// Initialize on DOM ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initCharts();
    initEconomyCounters();
    initCMCISection();
  });
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    barangayData,
    historicalData,
    cmciData,
    COLORS,
    animateCount,
  };
}
