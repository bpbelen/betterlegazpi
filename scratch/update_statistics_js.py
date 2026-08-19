import json

with open('data/barangays.json', 'r', encoding='utf-8') as f:
    b_data = json.load(f)['data']

sorted_barangays = sorted(b_data, key=lambda x: x['population'], reverse=True)
for i, b in enumerate(sorted_barangays, 1):
    b['rank'] = i
    b['pop'] = b['population']

with open('assets/js/statistics-new.js', 'r', encoding='utf-8') as f:
    orig_content = f.read()

# Find where CMCI starts
cmci_marker = '/**\n * CMCI (Competitive Index) Data\n */'
if cmci_marker not in orig_content:
    cmci_marker = '/**\r\n * CMCI (Competitive Index) Data\r\n */'

cmci_index = orig_content.find(cmci_marker)
if cmci_index == -1:
    raise ValueError("Could not find CMCI marker in statistics-new.js")

bottom_content = orig_content[cmci_index:]

# Update DOMContentLoaded and exports in bottom_content
bottom_content = bottom_content.replace(
"""    initScrollAnimations();
    initCharts();
    initEconomyCounters();
    initCMCISection();
    loadFiscalData();""",
"""    initScrollAnimations();
    initCharts();
    loadBarangayData();
    initBarangaySearch();
    initEconomyCounters();
    initCMCISection();
    loadFiscalData();"""
)

bottom_content = bottom_content.replace(
"""  module.exports = {
    barangayData,
    historicalData,
    cmciData,
    COLORS,
    animateCount,
    loadFiscalData,
  };""",
"""  module.exports = {
    barangayData,
    historicalData,
    cmciData,
    COLORS,
    DOUGHNUT_COLORS,
    animateCount,
    renderBarangayList,
    loadBarangayData,
    loadFiscalData,
  };"""
)

barangays_json_str = json.dumps(sorted_barangays, indent=2, ensure_ascii=False)

new_top_content = f"""/**
 * Statistics Page - Enhanced Animations & Charts
 * Better Legazpi Portal - Minimal Professional Design
 */

// Brand colors
const COLORS = {{
  primary: '#0032a0',
  primaryDark: '#002170',
  secondary: '#003D82',
  accent: '#F77F00',
  success: '#06A77D',
  info: '#0077BE',
}};

// Cohesive 10-shade monochromatic blue-teal gradient palette for Doughnut chart
const DOUGHNUT_COLORS = [
  '#002B7A', // Deep Sapphire
  '#003896', // Deep Royal Blue
  '#004DB8', // Classic Navy Blue
  '#0F62DE', // Vibrant Royal Blue
  '#1E77EC', // Cobalt Blue
  '#008ED8', // Cerulean
  '#00A3C8', // Ocean Blue
  '#00B6B2', // Deep Sea Teal
  '#14C59E', // Teal Mint
  '#48CAE4', // Soft Cyan
];

// Official Single Source of Truth Fallback Data (2024 Census - PSA)
let barangayData = {barangays_json_str};

// Historical data (Legazpi City Census - Official PSA)
const historicalData = {{
  years: [1990, 1995, 2000, 2007, 2010, 2015, 2020, 2024],
  populations: [121116, 141657, 157010, 179481, 182201, 196639, 209533, 210616],
}};

// Chart instances
let charts = {{}};

/**
 * Animate number counting
 */
function animateCount(element, target, duration = 2000) {{
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {{
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);

    element.textContent = current.toLocaleString();

    if (progress < 1) {{
      requestAnimationFrame(update);
    }} else {{
      element.textContent = target.toLocaleString();
    }}
  }}

  requestAnimationFrame(update);
}}

/**
 * Intersection Observer for scroll animations
 */
function initScrollAnimations() {{
  const observer = new IntersectionObserver(
    (entries) => {{
      entries.forEach((entry) => {{
        if (entry.isIntersecting) {{
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {{
            entry.target.classList.add('visible');

            // Trigger count animation for metric cards
            const countEl = entry.target.querySelector('[data-count]');
            if (countEl) {{
              const target = parseInt(countEl.dataset.count);
              animateCount(countEl, target);
            }}

            // Animate bars
            animateBars(entry.target);
          }}, delay);

          observer.unobserve(entry.target);
        }}
      }});
    }},
    {{ threshold: 0.2 }}
  );

  document.querySelectorAll('.animate-on-scroll, .metric-card').forEach((el) => {{
    observer.observe(el);
  }});
}}

/**
 * Animate progress bars within an element
 */
function animateBars(container) {{
  // Breakdown bars
  container.querySelectorAll('.breakdown-segment').forEach((bar) => {{
    const width = bar.dataset.width;
    if (width) {{
      setTimeout(() => {{
        bar.style.width = width + '%';
      }}, 300);
    }}
  }});

  // Barangay bars
  container.querySelectorAll('.bar-wrap .bar').forEach((bar) => {{
    const width = bar.dataset.width;
    if (width) {{
      setTimeout(() => {{
        bar.style.width = width + '%';
      }}, 100);
    }}
  }});

  // Sector bars
  container.querySelectorAll('.sector-bar, .sc-fill').forEach((bar) => {{
    const width = bar.dataset.width;
    if (width) {{
      setTimeout(() => {{
        bar.style.width = width + '%';
      }}, 200);
    }}
  }});

  // Poverty bars
  container.querySelectorAll('.poverty-fill').forEach((bar) => {{
    const width = bar.dataset.width;
    if (width) {{
      setTimeout(() => {{
        bar.style.width = width * 10 + '%';
      }}, 300);
    }}
  }});
}}

/**
 * Create Historical Line Chart
 */
function createHistoricalChart() {{
  const ctx = document.getElementById('historicalLineChart');
  if (!ctx) return;

  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(0, 50, 160, 0.2)');
  gradient.addColorStop(1, 'rgba(0, 50, 160, 0)');

  const points = historicalData.years.map((year, index) => ({{
    x: year,
    y: historicalData.populations[index],
  }}));

  charts.historical = new Chart(ctx, {{
    type: 'line',
    data: {{
      datasets: [
        {{
          label: 'Population',
          data: points,
          borderColor: COLORS.primary,
          backgroundColor: gradient,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBorderWidth: 3,
        }},
      ],
    }},
    options: {{
      responsive: true,
      maintainAspectRatio: false,
      animation: {{
        duration: 2000,
        easing: 'easeOutQuart',
      }},
      interaction: {{
        intersect: false,
        mode: 'nearest',
      }},
      plugins: {{
        legend: {{ display: false }},
        tooltip: {{
          backgroundColor: 'rgba(0, 50, 160, 0.95)',
          titleFont: {{ size: 14, weight: '600' }},
          bodyFont: {{ size: 13 }},
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {{
            title: (items) => (items.length ? `Census Year: ${{items[0].raw.x}}` : ''),
            label: (ctx) => `Population: ${{ctx.raw.y.toLocaleString()}}`,
          }},
        }},
      }},
      scales: {{
        x: {{
          type: 'linear',
          min: 1990,
          max: 2025,
          grid: {{ display: false }},
          ticks: {{
            stepSize: 5,
            font: {{ size: 12 }},
            callback: (v) => v.toString(),
          }},
        }},
        y: {{
          min: 120000,
          max: 220000,
          grid: {{ color: 'rgba(0,0,0,0.05)' }},
          ticks: {{
            stepSize: 20000,
            font: {{ size: 12 }},
            callback: (v) => v / 1000 + 'K',
          }},
        }},
      }},
    }},
  }});
}}

/**
 * Create Distribution Pie/Doughnut Chart with cohesive gradient colors
 */
function createDistributionChart() {{
  const ctx = document.getElementById('distributionPieChart');
  if (!ctx) return;

  const top10 = barangayData.slice(0, 10);
  const totalCityPop = 210616;

  charts.distribution = new Chart(ctx, {{
    type: 'doughnut',
    data: {{
      labels: top10.map((d) => d.name),
      datasets: [
        {{
          data: top10.map((d) => d.pop || d.population),
          backgroundColor: DOUGHNUT_COLORS,
          borderColor: '#fff',
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8,
        }},
      ],
    }},
    options: {{
      responsive: true,
      maintainAspectRatio: false,
      animation: {{
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: 'easeOutQuart',
      }},
      cutout: '55%',
      plugins: {{
        legend: {{
          position: 'right',
          labels: {{
            boxWidth: 12,
            padding: 10,
            font: {{ size: 11, family: "'Outfit', 'Inter', sans-serif" }},
            usePointStyle: true,
            pointStyle: 'circle',
          }},
        }},
        tooltip: {{
          backgroundColor: 'rgba(0, 43, 122, 0.96)',
          titleFont: {{ size: 13, weight: '600' }},
          bodyFont: {{ size: 12 }},
          padding: 12,
          cornerRadius: 8,
          callbacks: {{
            label: (ctx) => {{
              const pop = ctx.raw;
              const pct = ((pop / totalCityPop) * 100).toFixed(2);
              return `${{ctx.label}}: ${{pop.toLocaleString()}} (${{pct}}% of city)`;
            }},
          }},
        }},
      }},
    }},
  }});
}}

/**
 * Render Population by Barangay list
 */
function renderBarangayList(list, query = '') {{
  const container = document.getElementById('barangayListContainer');
  if (!container) return;

  if (!list || list.length === 0) {{
    container.innerHTML = `
      <div class="barangay-empty-state">
        <i class="bi bi-search"></i>
        <p>No barangays found matching "<strong>${{escapeHtml(query)}}</strong>"</p>
      </div>
    `;
    return;
  }}

  // Highest population in Legazpi is Bgy. 56 - Taysan (20,017)
  const maxPop = barangayData.length > 0 ? Math.max(...barangayData.map((b) => b.population || b.pop || 1)) : 20017;

  container.innerHTML = list
    .map((item) => {{
      const pop = item.population || item.pop || 0;
      const rank = item.rank || 1;
      const widthPct = Math.max(4, Math.round((pop / maxPop) * 100));
      return `
        <div class="barangay-row" data-rank="${{rank}}">
          <span class="rank">#${{rank}}</span>
          <span class="name" title="${{escapeHtml(item.name)}}">${{escapeHtml(item.name)}}</span>
          <div class="bar-wrap">
            <div class="bar" data-width="${{widthPct}}" style="width: ${{widthPct}}%"></div>
          </div>
          <span class="pop">${{pop.toLocaleString()}}</span>
        </div>
      `;
    }})
    .join('');
}}

/**
 * Initialize instant search for Population by Barangay
 */
function initBarangaySearch() {{
  const searchInput = document.getElementById('barangaySearchInput');
  const clearBtn = document.getElementById('barangaySearchClear');
  const countBadge = document.getElementById('barangayVisibleCount');

  if (!searchInput) return;

  function handleFilter() {{
    const query = searchInput.value.trim().toLowerCase();

    if (clearBtn) {{
      clearBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';
    }}

    let filtered = barangayData;
    if (query) {{
      filtered = barangayData.filter((b) => {{
        const nameMatch = b.name && b.name.toLowerCase().includes(query);
        const codeMatch = b.code && b.code.includes(query);
        const numMatch = b.barangay_number && b.barangay_number.toString() === query.replace(/^bgy\.?\s*/i, '');
        return nameMatch || codeMatch || numMatch;
      }});
    }}

    if (countBadge) {{
      countBadge.textContent = filtered.length;
    }}

    renderBarangayList(filtered, query);
  }}

  searchInput.addEventListener('input', handleFilter);

  if (clearBtn) {{
    clearBtn.addEventListener('click', () => {{
      searchInput.value = '';
      searchInput.focus();
      handleFilter();
    }});
  }}
}}

/**
 * Fetch and load Barangay SSOT data dynamically
 */
async function loadBarangayData() {{
  try {{
    const basePath = window.location.pathname.includes('/statistics') ? '../' : './';
    const response = await fetch(`${{basePath}}data/barangays.json`);
    if (response.ok) {{
      const json = await response.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {{
        const sorted = json.data.sort((a, b) => b.population - a.population);
        sorted.forEach((item, index) => {{
          item.rank = index + 1;
          item.pop = item.population;
        }});
        barangayData = sorted;

        // Refresh doughnut chart if already created
        if (charts.distribution) {{
          charts.distribution.destroy();
          charts.distribution = null;
          createDistributionChart();
        }}
      }}
    }}
  }} catch (err) {{
    console.warn('Using bundled SSOT barangay data fallback:', err);
  }} finally {{
    renderBarangayList(barangayData);
    const countBadge = document.getElementById('barangayVisibleCount');
    if (countBadge) {{
      countBadge.textContent = barangayData.length;
    }}
  }}
}}

/**
 * HTML Escaping utility
 */
function escapeHtml(str) {{
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}}

/**
 * Initialize all charts with lazy loading (bar chart removed)
 */
function initCharts() {{
  const chartObserver = new IntersectionObserver(
    (entries) => {{
      entries.forEach((entry) => {{
        if (entry.isIntersecting) {{
          const chartId = entry.target.id;

          if (chartId === 'historicalLineChart' && !charts.historical) {{
            createHistoricalChart();
          }} else if (chartId === 'distributionPieChart' && !charts.distribution) {{
            createDistributionChart();
          }}

          chartObserver.unobserve(entry.target);
        }}
      }});
    }},
    {{ threshold: 0.1 }}
  );

  document.querySelectorAll('canvas').forEach((canvas) => {{
    chartObserver.observe(canvas);
  }});
}}

"""

final_code = new_top_content + bottom_content

with open('assets/js/statistics-new.js', 'w', encoding='utf-8') as f:
    f.write(final_code)

print("Successfully updated assets/js/statistics-new.js")
