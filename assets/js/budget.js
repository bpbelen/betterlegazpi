/**
 * Transparency Page V2 - Interactive Financial Dashboard
 * Modern, minimal design with smooth animations
 */

// Financial data for FY 2024 (Fallback data)
let FINANCIAL_DATA = {
  q1: {
    period: 'Q1 2024',
    periodLabel: 'Jan - Mar',
    income: {
      local: 462.7,
      external: 252.68,
      total: 715.38,
    },
    expenditures: {
      gps: 73.35,
      social: 29.16,
      economic: 25.08,
      debt: 0.0,
      total: 127.6,
    },
    netIncome: 587.78,
    fundBalance: 2048.79,
  },
  q2: {
    period: 'Q2 2024',
    periodLabel: 'Apr - Jun',
    income: {
      local: 581.52,
      external: 505.18,
      total: 1086.7,
    },
    expenditures: {
      gps: 182.45,
      social: 81.55,
      economic: 63.73,
      debt: 0.0,
      total: 327.73,
    },
    netIncome: 758.97,
    fundBalance: 2152.12,
  },
  q3: {
    period: 'Q3 2024',
    periodLabel: 'Jul - Sep',
    income: {
      local: 714.44,
      external: 756.74,
      total: 1471.18,
    },
    expenditures: {
      gps: 283.6,
      social: 149.51,
      economic: 95.86,
      debt: 0.0,
      total: 528.96,
    },
    netIncome: 942.22,
    fundBalance: 2243.05,
  },
  q4: {
    period: 'Q4 2024',
    periodLabel: 'Oct - Dec',
    income: {
      local: 824.02,
      external: 1008.82,
      total: 1832.84,
    },
    expenditures: {
      gps: 551.31,
      social: 298.74,
      economic: 148.58,
      debt: 0.0,
      total: 998.63,
    },
    netIncome: 834.21,
    fundBalance: 1729.21,
  },
};

// Chart instances
let incomeChart = null;
let expenditureChart = null;
let currentQuarter = 'q1';

/**
 * Format number as Philippine Peso in millions
 */
function formatPeso(value) {
  return `₱${value.toFixed(2)} M`;
}

/**
 * Calculate percentage
 */
function calcPercent(value, total) {
  if (!total || total === 0) return '0.0%';
  return ((value / total) * 100).toFixed(1) + '%';
}

/**
 * Animate value change
 */
function animateValue(element, newValue) {
  element.classList.add('updating');
  setTimeout(() => {
    element.textContent = newValue;
    element.classList.remove('updating');
  }, 150);
}

/**
 * Update all displayed values for selected quarter
 */
function updateDisplay(quarter) {
  const data = FINANCIAL_DATA[quarter];
  if (!data) return;

  // Update metrics
  animateValue(document.getElementById('sre-total-income'), formatPeso(data.income.total));
  animateValue(document.getElementById('sre-total-expense'), formatPeso(data.expenditures.total));
  animateValue(document.getElementById('sre-net-income'), formatPeso(data.netIncome));
  animateValue(document.getElementById('sre-fund-balance'), formatPeso(data.fundBalance));

  const incomeTotal = data.income.total;
  const expTotal = data.expenditures.total;

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.textContent = val;
  };

  // Update income macro
  setEl('sre-income-local', formatPeso(data.income.local));
  setEl('sre-income-local-pct', calcPercent(data.income.local, incomeTotal));
  setEl('sre-income-external', formatPeso(data.income.external));
  setEl('sre-income-external-pct', calcPercent(data.income.external, incomeTotal));

  // Update income breakdown line items
  const incB = data.income.breakdown;
  if (incB && incB.local) {
    const tax = incB.local.tax_revenue;
    const nontax = incB.local.non_tax_revenue;
    if (tax) {
      setEl('sre-income-tax-total', formatPeso(tax.total));
      setEl('sre-income-tax-total-pct', calcPercent(tax.total, incomeTotal));
      if (tax.real_property_tax) {
        setEl('sre-income-rpt-total', formatPeso(tax.real_property_tax.total));
        setEl('sre-income-rpt-total-pct', calcPercent(tax.real_property_tax.total, incomeTotal));
        setEl('sre-income-rpt-gf', formatPeso(tax.real_property_tax.general_fund));
        setEl('sre-income-rpt-sef', formatPeso(tax.real_property_tax.sef));
      }
      setEl('sre-income-tax-business', formatPeso(tax.tax_on_business));
      setEl('sre-income-tax-business-pct', calcPercent(tax.tax_on_business, incomeTotal));
      setEl('sre-income-tax-other', formatPeso(tax.other_taxes));
      setEl('sre-income-tax-other-pct', calcPercent(tax.other_taxes, incomeTotal));
    }
    if (nontax) {
      setEl('sre-income-nontax-total', formatPeso(nontax.total));
      setEl('sre-income-nontax-total-pct', calcPercent(nontax.total, incomeTotal));
      setEl('sre-income-nontax-regulatory', formatPeso(nontax.regulatory_fees));
      setEl('sre-income-nontax-regulatory-pct', calcPercent(nontax.regulatory_fees, incomeTotal));
      setEl('sre-income-nontax-service', formatPeso(nontax.service_user_charges));
      setEl('sre-income-nontax-service-pct', calcPercent(nontax.service_user_charges, incomeTotal));
      setEl('sre-income-nontax-enterprise', formatPeso(nontax.economic_enterprises));
      setEl(
        'sre-income-nontax-enterprise-pct',
        calcPercent(nontax.economic_enterprises, incomeTotal)
      );
      setEl('sre-income-nontax-other', formatPeso(nontax.other_receipts));
      setEl('sre-income-nontax-other-pct', calcPercent(nontax.other_receipts, incomeTotal));
    }
    if (incB.external) {
      setEl('sre-income-ext-nta', formatPeso(incB.external.national_tax_allotment));
      setEl(
        'sre-income-ext-nta-pct',
        calcPercent(incB.external.national_tax_allotment, incomeTotal)
      );
      setEl('sre-income-ext-grants', formatPeso(incB.external.extraordinary_receipts_grants));
      setEl(
        'sre-income-ext-grants-pct',
        calcPercent(incB.external.extraordinary_receipts_grants, incomeTotal)
      );
    }
  }

  // Update expenditure macro
  setEl('sre-exp-gps', formatPeso(data.expenditures.gps));
  setEl('sre-exp-gps-pct', calcPercent(data.expenditures.gps, expTotal));
  setEl('sre-exp-social', formatPeso(data.expenditures.social));
  setEl('sre-exp-social-pct', calcPercent(data.expenditures.social, expTotal));
  setEl('sre-exp-economic', formatPeso(data.expenditures.economic));
  setEl('sre-exp-economic-pct', calcPercent(data.expenditures.economic, expTotal));
  setEl('sre-exp-debt', formatPeso(data.expenditures.debt));
  setEl('sre-exp-debt-pct', calcPercent(data.expenditures.debt, expTotal));

  // Update expenditure social line items
  const expB = data.expenditures.breakdown;
  if (expB && expB.social) {
    setEl('sre-exp-social-health', formatPeso(expB.social.health_nutrition));
    setEl('sre-exp-social-health-pct', calcPercent(expB.social.health_nutrition, expTotal));
    setEl('sre-exp-social-edu', formatPeso(expB.social.education_culture_sports));
    setEl('sre-exp-social-edu-pct', calcPercent(expB.social.education_culture_sports, expTotal));
    setEl('sre-exp-social-welfare', formatPeso(expB.social.social_welfare));
    setEl('sre-exp-social-welfare-pct', calcPercent(expB.social.social_welfare, expTotal));
    setEl('sre-exp-social-housing', formatPeso(expB.social.housing_community_dev));
    setEl('sre-exp-social-housing-pct', calcPercent(expB.social.housing_community_dev, expTotal));
    setEl('sre-exp-social-labor', formatPeso(expB.social.labor_employment));
    setEl('sre-exp-social-labor-pct', calcPercent(expB.social.labor_employment, expTotal));
  }

  // Update charts and any active focus callouts
  updateActiveCharts();
}

let activeExpFocus = null; // 'gps', 'social', 'economic', 'debt'
let activeIncomeFocus = null; // 'local', 'external', 'tax-revenue', 'nontax-revenue', 'rpt'

// The two focusable sets, named once. They were spelled out inline in the
// accordion handler, so a row type could be added to the markup and silently
// match neither list.
const EXPENDITURE_KEYS = ['gps', 'social', 'economic', 'debt'];
const INCOME_KEYS = ['local', 'tax-revenue', 'nontax-revenue', 'rpt', 'external'];

/* Categorical hues for the four expenditure sectors, in fixed order.
 *
 * The previous set was ['#2563eb', '#f43f5e', '#d97706', '#be123c']. Measured as
 * OKLab dE x100, rose #f43f5e against crimson #be123c was 13.2 to normal vision,
 * under the 15 floor where two categories stop being separable at all, and amber
 * #d97706 against that same rose was 6.4 under deuteranopia. Two of the four
 * sectors were effectively one colour.
 *
 * Light and dark are steps of the same four ramps rather than one set reused:
 * the dark surface has a narrower usable lightness band (0.48-0.67 against
 * 0.43-0.77), so a light-tuned step falls out of it. Worst adjacent pair is now
 * 33.6 normal / 24.7 protan in light and 27.0 / 26.0 in dark.
 *
 * The yellow sits under 3:1 against the light surface. That is allowed here
 * because identity never rests on the arc colour alone: the legend table under
 * each chart names every sector with its amount and share.
 */
const MACRO_EXP_COLORS_LIGHT = ['#2a78d6', '#eb6834', '#4a3aa7', '#eda100'];
const MACRO_EXP_COLORS_DARK = ['#3987e5', '#d95926', '#9085e9', '#c98500'];
const MACRO_INCOME_COLORS = ['#059669', '#0284c7'];

// The muted fills are what an arc becomes while a sibling is focused, so they
// have to recede from the card behind them. A single light tint did that in
// light mode and did the opposite in dark, where it outshone the focused arc.
const MUTED_INCOME_COLOR_LIGHT = '#d1fae5';
const MUTED_INCOME_COLOR_DARK = '#1f3b34';
const MUTED_EXP_COLOR_LIGHT = '#cbd5e1';
const MUTED_EXP_COLOR_DARK = '#334155';

function isDarkTheme() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

function macroExpColors() {
  return isDarkTheme() ? MACRO_EXP_COLORS_DARK : MACRO_EXP_COLORS_LIGHT;
}

function mutedExpColor() {
  return isDarkTheme() ? MUTED_EXP_COLOR_DARK : MUTED_EXP_COLOR_LIGHT;
}

function mutedIncomeColor() {
  return isDarkTheme() ? MUTED_INCOME_COLOR_DARK : MUTED_INCOME_COLOR_LIGHT;
}

// Drilling into Social Services replaces one arc with its five parts. That is a
// magnitude breakdown of a single category, so it is one hue stepped light to
// dark - the parent's orange - not five new categorical hues.
const SOCIAL_SUB_COLORS = {
  health_nutrition: '#eb6834',
  social_welfare: '#c9521f',
  education_culture_sports: '#a03f14',
  housing_community_dev: '#f2916a',
  labor_employment: '#f7b79c',
};

const LOCAL_SUB_COLORS = {
  tax_revenue: '#059669',
  non_tax_revenue: '#0d9488',
};

const TAX_SUB_COLORS = {
  rpt: '#059669',
  business: '#10b981',
  other: '#34d399',
};

const RPT_SUB_COLORS = {
  general_fund: '#047857',
  sef: '#059669',
};

const NONTAX_SUB_COLORS = {
  regulatory: '#0d9488',
  service: '#14b8a6',
  enterprise: '#2dd4bf',
  other: '#5eead4',
};

function updateActiveCharts() {
  const data = FINANCIAL_DATA[currentQuarter];
  if (!data) return;

  // Refresh Income Chart data
  if (incomeChart) {
    incomeChart.data.datasets[0].data = [data.income.local, data.income.external];
    if (activeIncomeFocus) {
      const isLocal = ['local', 'tax-revenue', 'nontax-revenue', 'rpt'].includes(activeIncomeFocus);
      incomeChart.data.datasets[0].offset = isLocal ? [16, 0] : [0, 16];
      incomeChart.data.datasets[0].backgroundColor = isLocal
        ? [MACRO_INCOME_COLORS[0], mutedIncomeColor()]
        : [mutedIncomeColor(), MACRO_INCOME_COLORS[1]];
      renderIncomeCallout(activeIncomeFocus, data);
    } else {
      incomeChart.data.datasets[0].offset = [0, 0];
      incomeChart.data.datasets[0].backgroundColor = [...MACRO_INCOME_COLORS];
    }
    incomeChart.update('active');
  }

  // Refresh Expenditure Chart data
  if (expenditureChart) {
    expenditureChart.data.datasets[0].data = [
      data.expenditures.gps,
      data.expenditures.social,
      data.expenditures.economic,
      data.expenditures.debt,
    ];
    if (activeExpFocus) {
      const sectors = ['gps', 'social', 'economic', 'debt'];
      const targetIdx = sectors.indexOf(activeExpFocus);
      expenditureChart.data.datasets[0].offset = sectors.map((_, i) => (i === targetIdx ? 16 : 0));
      expenditureChart.data.datasets[0].backgroundColor = sectors.map((_, i) =>
        i === targetIdx ? macroExpColors()[i] : mutedExpColor()
      );
      renderExpenditureCallout(activeExpFocus, data);
    } else {
      expenditureChart.data.datasets[0].offset = [0, 0, 0, 0];
      expenditureChart.data.datasets[0].backgroundColor = [...macroExpColors()];
    }
    expenditureChart.update('active');
  }
}

/**
 * Common chart creation options with click and hover affordance
 */
function createChartOptions(onClickHandler) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    layout: {
      padding: 10,
    },
    onHover: (event, chartElement) => {
      const target = event.native ? event.native.target : event.chart.canvas;
      if (target) {
        target.style.cursor = chartElement.length > 0 ? 'pointer' : 'default';
      }
    },
    onClick: onClickHandler,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(0,0,0,0.85)',
        padding: 12,
        titleFont: { size: 13, weight: '600' },
        bodyFont: { size: 12 },
        cornerRadius: 8,
        callbacks: {
          label: function (context) {
            return `₱${context.raw.toFixed(2)} M`;
          },
        },
      },
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 400,
      easing: 'easeOutQuart',
    },
  };
}

/**
 * Focus and Explode Expenditure Arc
 */
function focusExpenditure(sectorKey) {
  const data = FINANCIAL_DATA[currentQuarter];
  if (!data || !expenditureChart) return;

  if (activeExpFocus === sectorKey) {
    resetExpenditureFocus();
    return;
  }

  activeExpFocus = sectorKey;
  const sectors = ['gps', 'social', 'economic', 'debt'];
  const targetIndex = sectors.indexOf(sectorKey);

  const offsets = sectors.map((_, i) => (i === targetIndex ? 16 : 0));
  const bgColors = sectors.map((_, i) =>
    i === targetIndex ? macroExpColors()[i] : mutedExpColor()
  );

  expenditureChart.data.datasets[0].offset = offsets;
  expenditureChart.data.datasets[0].backgroundColor = bgColors;
  expenditureChart.update('active');

  const resetBtn = document.getElementById('exp-chart-reset');
  if (resetBtn) resetBtn.style.display = 'inline-flex';

  renderExpenditureCallout(sectorKey, data);
  openAccordionItemAndScroll(sectorKey);
}

/**
 * Reset Expenditure Arc Focus
 */
function resetExpenditureFocus() {
  if (!expenditureChart) return;
  activeExpFocus = null;

  expenditureChart.data.datasets[0].offset = [0, 0, 0, 0];
  expenditureChart.data.datasets[0].backgroundColor = [...macroExpColors()];
  expenditureChart.update('active');

  const resetBtn = document.getElementById('exp-chart-reset');
  if (resetBtn) resetBtn.style.display = 'none';

  const callout = document.getElementById('exp-callout-focus');
  if (callout) callout.style.display = 'none';

  collapseAllAccordion('sre-exp-list');
}

/**
 * Render Floating Sub-Allocation Focus Bar for Expenditure
 */
function renderExpenditureCallout(sectorKey, data) {
  const callout = document.getElementById('exp-callout-focus');
  const title = document.getElementById('exp-callout-title');
  const dot = document.getElementById('exp-callout-dot');
  const bar = document.getElementById('exp-callout-bar');
  const badges = document.getElementById('exp-callout-badges');

  if (!callout || !title || !dot || !bar || !badges) return;

  const totalExp = data.expenditures.total;
  const expB = data.expenditures.breakdown;

  if (sectorKey === 'social' && expB && expB.social) {
    const soc = expB.social;
    const socTotal = data.expenditures.social;
    dot.style.backgroundColor = '#f43f5e';
    title.innerHTML = `<strong>Social Services</strong> Sub-Allocations • ₱${socTotal.toFixed(2)} M <span class="sre-pct-context-pill"><i class="bi bi-pie-chart-fill"></i> % of category</span>`;

    const subItems = [
      {
        name: 'Health, Nutrition & Population',
        val: soc.health_nutrition,
        color: SOCIAL_SUB_COLORS.health_nutrition,
      },
      {
        name: 'Social Services & Welfare',
        val: soc.social_welfare,
        color: SOCIAL_SUB_COLORS.social_welfare,
      },
      {
        name: 'Education, Culture & Sports',
        val: soc.education_culture_sports,
        color: SOCIAL_SUB_COLORS.education_culture_sports,
      },
      {
        name: 'Housing & Community Dev',
        val: soc.housing_community_dev,
        color: SOCIAL_SUB_COLORS.housing_community_dev,
      },
      {
        name: 'Labor & Employment',
        val: soc.labor_employment,
        color: SOCIAL_SUB_COLORS.labor_employment,
      },
    ];

    buildCalloutBarsAndBadges(subItems, socTotal, totalExp, bar, badges);
    callout.style.display = 'block';
  } else {
    // 'social' is listed here too. It is handled by the branch above whenever
    // its breakdown is present, but when it is not, this path used to fall
    // through to `sectorKey` and 0, rendering "social Allocation - P0.00 M"
    // for a sector the page had already printed as P29.16 M just below.
    // Degrading to the macro figure is the honest fallback; degrading to zero
    // states something false.
    const sectorNames = {
      gps: 'General Public Services',
      social: 'Social Services',
      economic: 'Economic Services',
      debt: 'Debt Service',
    };
    const sectorVals = {
      gps: data.expenditures.gps,
      social: data.expenditures.social,
      economic: data.expenditures.economic,
      debt: data.expenditures.debt,
    };
    const palette = macroExpColors();
    const sectorColors = {
      gps: palette[0],
      social: palette[1],
      economic: palette[2],
      debt: palette[3],
    };

    const name = sectorNames[sectorKey] || sectorKey;
    const val = sectorVals[sectorKey] != null ? sectorVals[sectorKey] : 0;
    const color = sectorColors[sectorKey] || palette[0];

    dot.style.backgroundColor = color;
    title.innerHTML = `<strong>${name}</strong> Allocation • ₱${val.toFixed(2)} M (${calcPercent(val, totalExp)} of total budget)`;
    bar.innerHTML = `<div class="sre-callout-segment" style="width: 100%; background: ${color};"></div>`;
    badges.innerHTML = `
      <div class="sre-callout-badge">
        <span class="sre-callout-badge-dot" style="background: ${color};"></span>
        <span class="sre-callout-badge-name">${name}</span>
        <span class="sre-callout-badge-val">₱${val.toFixed(2)} M (${calcPercent(val, totalExp)})</span>
      </div>
    `;
    callout.style.display = 'block';
  }
}

/**
 * Focus and Explode Income Arc
 */
function focusIncome(sectorKey) {
  const data = FINANCIAL_DATA[currentQuarter];
  if (!data || !incomeChart) return;

  if (activeIncomeFocus === sectorKey) {
    resetIncomeFocus();
    return;
  }

  activeIncomeFocus = sectorKey;
  const isLocal = ['local', 'tax-revenue', 'nontax-revenue', 'rpt'].includes(sectorKey);

  const offsets = isLocal ? [16, 0] : [0, 16];
  const bgColors = isLocal
    ? [MACRO_INCOME_COLORS[0], mutedIncomeColor()]
    : [mutedIncomeColor(), MACRO_INCOME_COLORS[1]];

  incomeChart.data.datasets[0].offset = offsets;
  incomeChart.data.datasets[0].backgroundColor = bgColors;
  incomeChart.update('active');

  const resetBtn = document.getElementById('income-chart-reset');
  if (resetBtn) resetBtn.style.display = 'inline-flex';

  renderIncomeCallout(sectorKey, data);
  openAccordionItemAndScroll(sectorKey);
}

/**
 * Reset Income Arc Focus
 */
function resetIncomeFocus() {
  if (!incomeChart) return;
  activeIncomeFocus = null;

  incomeChart.data.datasets[0].offset = [0, 0];
  incomeChart.data.datasets[0].backgroundColor = [...MACRO_INCOME_COLORS];
  incomeChart.update('active');

  const resetBtn = document.getElementById('income-chart-reset');
  if (resetBtn) resetBtn.style.display = 'none';

  const callout = document.getElementById('income-callout-focus');
  if (callout) callout.style.display = 'none';

  collapseAllAccordion('sre-income-list');
}

/**
 * Render Floating Sub-Allocation Focus Bar for Income (Supporting Sub-level 3 & 4 Drilldown)
 */
function renderIncomeCallout(sectorKey, data) {
  const callout = document.getElementById('income-callout-focus');
  const title = document.getElementById('income-callout-title');
  const dot = document.getElementById('income-callout-dot');
  const bar = document.getElementById('income-callout-bar');
  const badges = document.getElementById('income-callout-badges');

  if (!callout || !title || !dot || !bar || !badges) return;

  const totalIncome = data.income.total;
  const incB = data.income.breakdown;

  if (['local', 'tax-revenue', 'nontax-revenue', 'rpt'].includes(sectorKey) && incB && incB.local) {
    const local = incB.local;
    const localTotal = data.income.local;
    dot.style.backgroundColor = '#059669';

    if (sectorKey === 'tax-revenue' && local.tax_revenue) {
      const tax = local.tax_revenue;
      title.innerHTML = `<strong>Tax Revenue</strong> Breakdown • ₱${tax.total.toFixed(2)} M <span class="sre-pct-context-pill"><i class="bi bi-pie-chart-fill"></i> % of category</span> <button type="button" class="sre-callout-back-btn" id="callout-back-local"><i class="bi bi-chevron-left"></i> Local</button>`;
      const items = [
        {
          name: 'Real Property Tax',
          val: tax.real_property_tax.total,
          color: TAX_SUB_COLORS.rpt,
          drillKey: 'rpt',
        },
        { name: 'Tax on Business', val: tax.tax_on_business, color: TAX_SUB_COLORS.business },
        { name: 'Other Taxes', val: tax.other_taxes, color: TAX_SUB_COLORS.other },
      ];
      buildCalloutBarsAndBadges(items, tax.total, totalIncome, bar, badges, focusIncome);
      const backBtn = document.getElementById('callout-back-local');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          focusIncome('local');
          syncAccordionLevel('local');
        });
      }
    } else if (sectorKey === 'rpt' && local.tax_revenue && local.tax_revenue.real_property_tax) {
      const rpt = local.tax_revenue.real_property_tax;
      title.innerHTML = `<strong>RPT Breakdown</strong> • ₱${rpt.total.toFixed(2)} M <span class="sre-pct-context-pill"><i class="bi bi-pie-chart-fill"></i> % of category</span> <button type="button" class="sre-callout-back-btn" id="callout-back-tax"><i class="bi bi-chevron-left"></i> Tax Revenue</button>`;
      const items = [
        { name: 'General Fund', val: rpt.general_fund, color: RPT_SUB_COLORS.general_fund },
        { name: 'Special Education Fund (SEF)', val: rpt.sef, color: RPT_SUB_COLORS.sef },
      ];
      buildCalloutBarsAndBadges(items, rpt.total, totalIncome, bar, badges, focusIncome);
      const backBtn = document.getElementById('callout-back-tax');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          focusIncome('tax-revenue');
          syncAccordionLevel('tax-revenue');
        });
      }
    } else if (sectorKey === 'nontax-revenue' && local.non_tax_revenue) {
      const nontax = local.non_tax_revenue;
      title.innerHTML = `<strong>Non-Tax Revenue</strong> Breakdown • ₱${nontax.total.toFixed(2)} M <span class="sre-pct-context-pill"><i class="bi bi-pie-chart-fill"></i> % of category</span> <button type="button" class="sre-callout-back-btn" id="callout-back-local"><i class="bi bi-chevron-left"></i> Local</button>`;
      const items = [
        {
          name: 'Regulatory Fees',
          val: nontax.regulatory_fees,
          color: NONTAX_SUB_COLORS.regulatory,
        },
        {
          name: 'Service / User Charges',
          val: nontax.service_user_charges,
          color: NONTAX_SUB_COLORS.service,
        },
        {
          name: 'Economic Enterprises',
          val: nontax.economic_enterprises,
          color: NONTAX_SUB_COLORS.enterprise,
        },
        { name: 'Other Receipts', val: nontax.other_receipts, color: NONTAX_SUB_COLORS.other },
      ];
      buildCalloutBarsAndBadges(items, nontax.total, totalIncome, bar, badges, focusIncome);
      const backBtn = document.getElementById('callout-back-local');
      if (backBtn) {
        backBtn.addEventListener('click', () => {
          focusIncome('local');
          syncAccordionLevel('local');
        });
      }
    } else {
      title.innerHTML = `<strong>Local Sources</strong> Breakdown • ₱${localTotal.toFixed(2)} M <span class="sre-pct-context-pill"><i class="bi bi-pie-chart-fill"></i> % of category</span>`;
      const items = [
        {
          name: 'Tax Revenue',
          val: local.tax_revenue.total,
          color: LOCAL_SUB_COLORS.tax_revenue,
          drillKey: 'tax-revenue',
        },
        {
          name: 'Non-Tax Revenue',
          val: local.non_tax_revenue.total,
          color: LOCAL_SUB_COLORS.non_tax_revenue,
          drillKey: 'nontax-revenue',
        },
      ];
      buildCalloutBarsAndBadges(items, localTotal, totalIncome, bar, badges, focusIncome);
    }
    callout.style.display = 'block';
  } else if (sectorKey === 'external' && incB && incB.external) {
    const ext = incB.external;
    const extTotal = data.income.external;
    dot.style.backgroundColor = '#0284c7';
    title.innerHTML = `<strong>External Sources</strong> Breakdown • ₱${extTotal.toFixed(2)} M <span class="sre-pct-context-pill"><i class="bi bi-pie-chart-fill"></i> % of category</span>`;
    const items = [
      {
        name: 'National Tax Allotment (NTA)',
        val: ext.national_tax_allotment,
        color: '#0284c7',
      },
      {
        name: 'Grants / Extraordinary',
        val: ext.extraordinary_receipts_grants,
        color: '#06b6d4',
      },
    ];
    buildCalloutBarsAndBadges(items, extTotal, totalIncome, bar, badges, focusIncome);
    callout.style.display = 'block';
  } else {
    // Neither branch matched, which means the breakdown for this arc is absent.
    // Without this the function returned having drawn nothing, so clicking an
    // income arc appeared to do nothing at all - the expenditure side at least
    // drew something. Fall back to the macro figure, which is always present.
    const isLocal = ['local', 'tax-revenue', 'nontax-revenue', 'rpt'].includes(sectorKey);
    const name = isLocal ? 'Local Sources' : 'External Sources';
    const val = isLocal ? data.income.local : data.income.external;
    const color = isLocal ? MACRO_INCOME_COLORS[0] : MACRO_INCOME_COLORS[1];

    dot.style.backgroundColor = color;
    title.innerHTML = `<strong>${name}</strong> • ₱${val.toFixed(2)} M (${calcPercent(val, totalIncome)} of total income)`;
    bar.innerHTML = `<div class="sre-callout-segment" style="width: 100%; background: ${color};"></div>`;
    badges.innerHTML = `
      <div class="sre-callout-badge">
        <span class="sre-callout-badge-dot" style="background: ${color};"></span>
        <span class="sre-callout-badge-name">${name}</span>
        <span class="sre-callout-badge-val">₱${val.toFixed(2)} M (${calcPercent(val, totalIncome)})</span>
      </div>
    `;
    callout.style.display = 'block';
  }
}

/**
 * Build Stacked Sub-Allocation Progress Bar & Pill Badges
 */
function buildCalloutBarsAndBadges(items, groupTotal, grandTotal, barEl, badgesEl, drillCallback) {
  let barHtml = '';
  let badgesHtml = '';

  items.forEach((item) => {
    const pctOfGroup = groupTotal > 0 ? (item.val / groupTotal) * 100 : 0;
    const pctOfGrand = calcPercent(item.val, grandTotal);
    const isDrillable = Boolean(item.drillKey);
    const clickAttr = isDrillable ? `data-drill="${item.drillKey}"` : '';

    if (item.val > 0) {
      barHtml += `<div class="sre-callout-segment ${isDrillable ? 'is-clickable' : ''}" ${clickAttr} style="width: ${pctOfGroup.toFixed(1)}%; background: ${item.color};" title="${item.name}: ₱${item.val.toFixed(2)} M (${pctOfGroup.toFixed(1)}% of category${isDrillable ? ' - Click to drill down' : ''})"></div>`;
    }
    badgesHtml += `
      <div class="sre-callout-badge ${isDrillable ? 'is-clickable' : ''}" ${clickAttr} title="${item.name} (${pctOfGrand} of total budget${isDrillable ? ' - Click to drill down' : ''})">
        <span class="sre-callout-badge-dot" style="background: ${item.color};"></span>
        <span class="sre-callout-badge-name">${item.name}</span>
        <span class="sre-callout-badge-val">₱${item.val.toFixed(2)} M (${pctOfGroup.toFixed(1)}%)</span>
        ${isDrillable ? '<i class="bi bi-chevron-right sre-callout-badge-arrow"></i>' : ''}
      </div>
    `;
  });

  barEl.innerHTML = barHtml;
  badgesEl.innerHTML = badgesHtml;

  if (drillCallback) {
    barEl.querySelectorAll('.sre-callout-segment[data-drill]').forEach((el) => {
      el.addEventListener('click', () => drillCallback(el.dataset.drill));
    });
    badgesEl.querySelectorAll('.sre-callout-badge[data-drill]').forEach((el) => {
      el.addEventListener('click', () => drillCallback(el.dataset.drill));
    });
  }
}

/**
 * Handle Expenditure Chart Click
 */
function handleExpenditureChartClick(event, elements) {
  if (!elements || elements.length === 0) {
    resetExpenditureFocus();
    return;
  }
  const index = elements[0].index;
  const sectors = ['gps', 'social', 'economic', 'debt'];
  if (sectors[index]) {
    focusExpenditure(sectors[index]);
  }
}

/**
 * Handle Income Chart Click
 */
function handleIncomeChartClick(event, elements) {
  if (!elements || elements.length === 0) {
    resetIncomeFocus();
    return;
  }
  const index = elements[0].index;
  const sectors = ['local', 'external'];
  if (sectors[index]) {
    focusIncome(sectors[index]);
  }
}

/**
 * Initialize charts with Chart.js
 */
function initCharts() {
  const incomeCtx = document.getElementById('incomeChartV2');
  const expenditureCtx = document.getElementById('expenditureChartV2');

  if (!incomeCtx || !expenditureCtx || typeof Chart === 'undefined') return;

  const data = FINANCIAL_DATA[currentQuarter];

  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const chartBorderColor = isDark ? '#1e293b' : '#ffffff';

  // Income Chart
  incomeChart = new Chart(incomeCtx, {
    type: 'doughnut',
    data: {
      labels: ['Local Sources', 'External Sources'],
      datasets: [
        {
          data: [data.income.local, data.income.external],
          backgroundColor: [...MACRO_INCOME_COLORS],
          borderWidth: 2,
          borderColor: chartBorderColor,
          offset: [0, 0],
          hoverOffset: 4,
        },
      ],
    },
    options: createChartOptions(handleIncomeChartClick),
  });

  // Expenditure Chart
  expenditureChart = new Chart(expenditureCtx, {
    type: 'doughnut',
    data: {
      labels: ['General Public Services', 'Social Services', 'Economic Services', 'Debt Service'],
      datasets: [
        {
          data: [
            data.expenditures.gps,
            data.expenditures.social,
            data.expenditures.economic,
            data.expenditures.debt,
          ],
          backgroundColor: [...macroExpColors()],
          borderWidth: 2,
          borderColor: chartBorderColor,
          offset: [0, 0, 0, 0],
          hoverOffset: 4,
        },
      ],
    },
    options: createChartOptions(handleExpenditureChartClick),
  });

  // Attach reset & close buttons
  const incReset = document.getElementById('income-chart-reset');
  if (incReset) incReset.addEventListener('click', resetIncomeFocus);

  const incClose = document.getElementById('income-callout-close');
  if (incClose) incClose.addEventListener('click', resetIncomeFocus);

  const expReset = document.getElementById('exp-chart-reset');
  if (expReset) expReset.addEventListener('click', resetExpenditureFocus);

  const expClose = document.getElementById('exp-callout-close');
  if (expClose) expClose.addEventListener('click', resetExpenditureFocus);

  // Keep the chart borders and the series fills in step with the theme. The
  // fills matter as much as the borders: each mode draws its own steps of the
  // four ramps, so a toggle that only repainted the borders would leave the
  // light-tuned arcs on the dark surface. updateActiveCharts() re-derives the
  // fills through macroExpColors(), which honours whichever focus is open.
  document.addEventListener('themechange', function (e) {
    const isDarkNow =
      (e.detail && e.detail.theme === 'dark') ||
      document.documentElement.getAttribute('data-theme') === 'dark';
    const newBorder = isDarkNow ? '#1e293b' : '#ffffff';
    if (incomeChart && incomeChart.data && incomeChart.data.datasets[0]) {
      incomeChart.data.datasets[0].borderColor = newBorder;
    }
    if (expenditureChart && expenditureChart.data && expenditureChart.data.datasets[0]) {
      expenditureChart.data.datasets[0].borderColor = newBorder;
    }
    updateActiveCharts();
  });
}

/**
 * Open matching accordion group when chart segment is clicked and scroll smoothly into view
 */
function openAccordionItemAndScroll(type) {
  const item = document.querySelector(`[data-type="${type}"]`);
  if (!item) return;

  if (item.classList.contains('has-children')) {
    item.setAttribute('aria-expanded', 'true');
    item.classList.add('expanded');
  }

  const parentGroup = item.closest('.sre-breakdown-group');
  if (parentGroup) parentGroup.classList.add('open');

  let ancestor = parentGroup ? parentGroup.parentElement : null;
  while (ancestor && !ancestor.classList.contains('sre-breakdown-list')) {
    if (ancestor.classList.contains('sre-breakdown-group')) {
      ancestor.classList.add('open');
      const trigger = ancestor.querySelector('.has-children');
      if (trigger) {
        trigger.setAttribute('aria-expanded', 'true');
        trigger.classList.add('expanded');
      }
    }
    ancestor = ancestor.parentElement;
  }

  setTimeout(() => {
    item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, 100);
}

/**
 * Collapse all accordion groups in a list
 */
function collapseAllAccordion(listId) {
  const list = document.getElementById(listId);
  if (!list) return;
  list.querySelectorAll('.sre-breakdown-group.open').forEach((g) => g.classList.remove('open'));
  list.querySelectorAll('.has-children[aria-expanded="true"]').forEach((el) => {
    el.setAttribute('aria-expanded', 'false');
    el.classList.remove('expanded');
  });
}

/**
 * Collapse a specific accordion group and its descendants
 */
function collapseAccordionGroup(type) {
  const item = document.querySelector(`[data-type="${type}"]`);
  if (!item) return;

  if (item.classList.contains('has-children')) {
    item.setAttribute('aria-expanded', 'false');
    item.classList.remove('expanded');
  }

  const parentGroup = item.closest('.sre-breakdown-group');
  if (parentGroup) {
    parentGroup.classList.remove('open');
    parentGroup
      .querySelectorAll('.sre-breakdown-group.open')
      .forEach((g) => g.classList.remove('open'));
    parentGroup.querySelectorAll('.has-children[aria-expanded="true"]').forEach((el) => {
      el.setAttribute('aria-expanded', 'false');
      el.classList.remove('expanded');
    });
  }
}

/**
 * Synchronize accordion state when navigating back in callout
 */
function syncAccordionLevel(targetLevel) {
  if (targetLevel === 'local') {
    collapseAccordionGroup('tax-revenue');
    collapseAccordionGroup('nontax-revenue');
    collapseAccordionGroup('rpt');
    openAccordionItemAndScroll('local');
  } else if (targetLevel === 'tax-revenue') {
    collapseAccordionGroup('rpt');
    openAccordionItemAndScroll('tax-revenue');
  }
}

/**
 * Initialize period toggle buttons
 */
function initPeriodToggle() {
  const buttons = document.querySelectorAll('.sre-period-btn');

  buttons.forEach((btn) => {
    btn.addEventListener('click', function () {
      const quarter = this.dataset.quarter;
      if (quarter === currentQuarter) return;

      // Update button states
      buttons.forEach((b) => {
        b.classList.remove('active');
        b.setAttribute('aria-selected', 'false');
      });
      this.classList.add('active');
      this.setAttribute('aria-selected', 'true');

      // Update data
      currentQuarter = quarter;
      updateDisplay(quarter);
    });
  });
}

/**
 * Initialize scroll animations
 */
function initScrollAnimations() {
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll('.animate-on-scroll').forEach((el) => {
      el.classList.add('visible');
    });
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
  );

  document.querySelectorAll('.animate-on-scroll').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Initialize breakdown item hover effects
 */
function initBreakdownInteractions() {
  const items = document.querySelectorAll('.sre-breakdown-item, .sre-sub-item, .sre-sub-sub-item');

  items.forEach((item) => {
    item.addEventListener('mouseenter', function () {
      const type = this.dataset.type;
      if (type) {
        highlightChartSegment(type, true);
      }
    });

    item.addEventListener('mouseleave', function () {
      const type = this.dataset.type;
      if (type) {
        highlightChartSegment(type, false);
      }
    });

    // Rows that have children get their click from initBreakdownAccordion,
    // which expands them and focuses the chart. Rows without children got no
    // handler at all, so clicking General Public Services, Economic Services
    // or Debt Service left whichever callout was already open on screen,
    // showing one sector's figures under another sector's name.
    if (!item.classList.contains('has-children')) {
      item.addEventListener('click', function (e) {
        const type = this.dataset.type;
        if (!type) return;
        e.stopPropagation();
        if (EXPENDITURE_KEYS.includes(type)) {
          focusExpenditure(type);
        } else if (INCOME_KEYS.includes(type)) {
          focusIncome(type);
        }
      });
    }
  });
}

/**
 * Initialize breakdown accordion click behaviors & synchronize with chart focus
 */
function initBreakdownAccordion() {
  const expandableItems = document.querySelectorAll('.has-children');

  expandableItems.forEach((item) => {
    item.addEventListener('click', function (e) {
      e.stopPropagation();
      const isExpanded = this.getAttribute('aria-expanded') === 'true';
      this.setAttribute('aria-expanded', String(!isExpanded));
      this.classList.toggle('expanded', !isExpanded);

      const parentGroup = this.closest('.sre-breakdown-group');
      if (parentGroup) {
        parentGroup.classList.toggle('open', !isExpanded);
      }

      const type = this.dataset.type;
      if (!isExpanded && type) {
        if (EXPENDITURE_KEYS.includes(type)) {
          focusExpenditure(type);
        } else if (INCOME_KEYS.includes(type)) {
          focusIncome(type);
        }
      } else if (isExpanded && type) {
        if (activeExpFocus === type) resetExpenditureFocus();
        if (activeIncomeFocus === type) resetIncomeFocus();
      }
    });

    item.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.click();
      }
    });
  });
}

/**
 * Highlight chart segment on hover
 */
function highlightChartSegment(type, highlight) {
  const incomeTypes = ['local', 'external', 'tax-revenue', 'nontax-revenue', 'rpt'];
  const expTypes = ['gps', 'social', 'economic', 'debt'];

  let chart = null;
  let index = -1;
  let isFocused = false;

  if (incomeTypes.includes(type)) {
    chart = incomeChart;
    index = ['local', 'tax-revenue', 'nontax-revenue', 'rpt'].includes(type) ? 0 : 1;
    isFocused = Boolean(activeIncomeFocus);
  } else if (expTypes.includes(type)) {
    chart = expenditureChart;
    index = expTypes.indexOf(type);
    isFocused = Boolean(activeExpFocus);
  }

  // Only apply hover dimming if chart is not currently locked into an exploded focus state
  if (chart && index >= 0 && !isFocused) {
    const dataset = chart.data.datasets[0];
    const originalColors = chart === incomeChart ? MACRO_INCOME_COLORS : macroExpColors();
    if (highlight) {
      const dimmedColors = originalColors.map((color, i) => (i === index ? color : color + '40'));
      dataset.backgroundColor = dimmedColors;
    } else {
      dataset.backgroundColor = [...originalColors];
    }
  }
}

/**
 * Load Quarterly SRE Data from SSOT
 */
async function loadBudgetSREData() {
  try {
    // Derived from the depth of the URL, not from the directory's name. This
    // read '/budget' until that directory was renamed to '/transparency', at
    // which point the fetch resolved against the wrong root, 404'd, and the
    // catch below quietly dropped the page onto the fallback constant. The
    // fallback carries the macro totals but no breakdowns, so the page still
    // looked populated while every sub-allocation silently read zero.
    // The page is reachable both as /transparency/ and /transparency/index.html,
    // so the trailing slash decides whether the last segment is a directory.
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);
    const dirDepth = path.endsWith('/') ? segments.length : Math.max(0, segments.length - 1);
    const basePath = dirDepth > 0 ? '../'.repeat(dirDepth) : './';
    const response = await fetch(`${basePath}data/fiscal-transparency.json`);
    if (!response.ok) throw new Error(`fiscal-transparency.json: ${response.status}`);

    const json = await response.json();
    if (json.quarterly_sre_reports) {
      const reports =
        json.quarterly_sre_reports['2024'] ||
        json.quarterly_sre_reports[Object.keys(json.quarterly_sre_reports).sort().pop()];
      if (reports) {
        FINANCIAL_DATA = reports;
        updateDisplay(currentQuarter);
      }
    }
  } catch (err) {
    console.warn('Could not load fiscal data dynamically, using fallback data:', err);
  }
}

/**
 * Initialize the page
 */
async function init() {
  initPeriodToggle();
  initCharts();
  initScrollAnimations();
  initBreakdownInteractions();
  initBreakdownAccordion();
  await loadBudgetSREData();
}

// Run when DOM is ready
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { FINANCIAL_DATA, formatPeso, calcPercent, loadBudgetSREData };
}

// DPWH Table Filter
document.addEventListener('DOMContentLoaded', function () {
  const filterBtns = document.querySelectorAll('.dpwh-filter-btn');
  const tableRows = document.querySelectorAll('.dpwh-table tbody tr');

  filterBtns.forEach((btn) => {
    btn.addEventListener('click', function () {
      const filter = this.dataset.filter;

      filterBtns.forEach((b) => b.classList.remove('active'));
      this.classList.add('active');

      tableRows.forEach((row) => {
        if (filter === 'all' || row.dataset.category === filter) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  });
});
