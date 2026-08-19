import json

with open('data/barangays.json', 'r', encoding='utf-8') as f:
    b_data = json.load(f)['data']

sorted_barangays = sorted(b_data, key=lambda x: x['population'], reverse=True)
for i, b in enumerate(sorted_barangays, 1):
    b['rank'] = i

barangays_json_str = json.dumps(sorted_barangays, indent=2, ensure_ascii=False)

code = f"""/**
 * Statistics Page - Chart.js Implementation
 * Better Legazpi Portal
 */

// Site branding color palette for charts
const CHART_COLORS = {{
  primary: '#0032a0',
  primaryDark: '#002170',
  accent: '#F77F00',
  success: '#06A77D',
  danger: '#D62828',
  info: '#0077BE',
  secondary: '#003D82',
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

/**
 * Get chart color palette matching site branding
 * @param {{number}} count - Number of colors needed
 * @returns {{Array}} Array of color strings
 */
function getChartColors(count) {{
  if (count <= 10) {{
    return DOUGHNUT_COLORS.slice(0, count);
  }}
  const colors = [];
  for (let i = 0; i < count; i++) {{
    colors.push(DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]);
  }}
  return colors;
}}

// Barangay population data (2024 Census) - Source: PSA, July 1, 2024
const barangayData = {barangays_json_str};

// Historical population data (Census years - Official PSA)
const historicalData = {{
  years: [1990, 1995, 2000, 2007, 2010, 2015, 2020, 2024],
  populations: [121116, 141657, 157010, 179481, 182201, 196639, 209533, 210616],
}};

// Economic indicators data
const economicData = {{
  registeredBusinesses: 1200,
  agriculturalLand: 8500, // hectares
  incomeClass: '1st Class',
  landArea: 161.6, // km²
}};

// Chart instances storage
let chartInstances = {{}};

/**
 * Create historical population line chart
 * @param {{string}} canvasId - Canvas element ID
 * @returns {{Chart}} Chart.js instance
 */
function createHistoricalLineChart(canvasId) {{
  const ctx = document.getElementById(canvasId);
  if (!ctx) {{
    console.error(`Canvas element ${{canvasId}} not found`);
    return null;
  }}

  const points = historicalData.years.map((year, index) => ({{
    x: year,
    y: historicalData.populations[index],
  }}));

  const chart = new Chart(ctx, {{
    type: 'line',
    data: {{
      datasets: [
        {{
          label: 'Population',
          data: points,
          borderColor: CHART_COLORS.primary,
          backgroundColor: 'rgba(0, 50, 160, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: CHART_COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        }},
      ],
    }},
    options: {{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {{
        legend: {{
          display: false,
        }},
        tooltip: {{
          callbacks: {{
            title: function (items) {{
              return items.length ? `Census Year: ${{items[0].raw.x}}` : '';
            }},
            label: function (context) {{
              return `Population: ${{context.raw.y.toLocaleString()}}`;
            }},
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
            callback: function (val) {{
              return val.toString();
            }},
          }},
        }},
        y: {{
          min: 120000,
          max: 220000,
          ticks: {{
            stepSize: 20000,
            callback: function (value) {{
              return value.toLocaleString();
            }},
          }},
        }},
      }},
    }},
  }});

  chartInstances[canvasId] = chart;
  return chart;
}}

/**
 * Create population distribution pie chart
 * @param {{string}} canvasId - Canvas element ID
 * @returns {{Chart}} Chart.js instance
 */
function createDistributionPieChart(canvasId) {{
  const ctx = document.getElementById(canvasId);
  if (!ctx) {{
    console.error(`Canvas element ${{canvasId}} not found`);
    return null;
  }}

  // Get top 10 barangays by population
  const top10 = [...barangayData].sort((a, b) => b.population - a.population).slice(0, 10);
  const totalPopulation = 210616;

  const chart = new Chart(ctx, {{
    type: 'doughnut',
    data: {{
      labels: top10.map((d) => d.name),
      datasets: [
        {{
          data: top10.map((d) => d.population),
          backgroundColor: DOUGHNUT_COLORS,
          borderColor: '#fff',
          borderWidth: 2,
        }},
      ],
    }},
    options: {{
      responsive: true,
      maintainAspectRatio: false,
      plugins: {{
        legend: {{
          display: true,
          position: 'right',
          labels: {{
            boxWidth: 12,
            padding: 10,
          }},
        }},
        tooltip: {{
          callbacks: {{
            label: function (context) {{
              const percentage = ((context.raw / totalPopulation) * 100).toFixed(2);
              return `${{context.label}}: ${{context.raw.toLocaleString()}} (${{percentage}}%)`;
            }},
          }},
        }},
      }},
    }},
  }});

  chartInstances[canvasId] = chart;
  return chart;
}}

/**
 * Show loading indicator for a chart container
 * @param {{string}} containerId - Container element ID
 */
function showChartLoading(containerId) {{
  const container = document.getElementById(containerId);
  if (container) {{
    container.classList.add('chart-loading');
  }}
}}

/**
 * Hide loading indicator for a chart container
 * @param {{string}} containerId - Container element ID
 */
function hideChartLoading(containerId) {{
  const container = document.getElementById(containerId);
  if (container) {{
    container.classList.remove('chart-loading');
  }}
}}

/**
 * Initialize all charts on the statistics page
 */
function initializeCharts() {{
  // Historical Population chart
  if (document.getElementById('historicalLineChart')) {{
    showChartLoading('historicalChartContainer');
    createHistoricalLineChart('historicalLineChart');
    hideChartLoading('historicalChartContainer');
  }}

  // Population Distribution chart
  if (document.getElementById('distributionPieChart')) {{
    showChartLoading('distributionChartContainer');
    createDistributionPieChart('distributionPieChart');
    hideChartLoading('distributionChartContainer');
  }}
}}

// Initialize charts when DOM is ready
if (typeof document !== 'undefined') {{
  document.addEventListener('DOMContentLoaded', initializeCharts);
}}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {{
  module.exports = {{
    getChartColors,
    DOUGHNUT_COLORS,
    barangayData,
    historicalData,
    economicData,
    createHistoricalLineChart,
    createDistributionPieChart,
    initializeCharts,
    CHART_COLORS,
  }};
}}
"""

with open('assets/js/statistics.js', 'w', encoding='utf-8') as f:
    f.write(code)

print("Successfully updated assets/js/statistics.js")
