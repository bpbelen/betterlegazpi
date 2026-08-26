/**
 * BetterLegazpi - Public Utilities Interactive Script
 * Electricity (ALECO) & Water (LCWD) Features
 */

(function () {
  'use strict';

  // --- Official ALECO Substation Feeders Data (8 Active Operational Feeders - 100% 70 PSGC Coverage) ---
  const ALECO_FEEDERS_DATA = [
    {
      id: 'washington-f1',
      feederNo: 1,
      code: 'W-F1',
      displayName: 'Feeder 1 (W-F1)',
      name: 'Washington Feeder 1',
      substation: 'Washington Substation',
      substationKey: 'washington',
      voltage: '13.2 kV',
      coverageSummary: 'Bagumbayan, Pinaric, Portion of Brgy. 17, Washington Drive, Airport Road & Nearby Subdivisions',
      landmarks: ['Washington Drive', 'Airport Road', 'Renaissance Garden', 'Aeroville Subd.', 'Happy Homes Subd.'],
      barangays: [
        { no: 8, name: "Bgy. 8 - Bagumbayan", psgc: "0500506042" },
        { no: 9, name: "Bgy. 9 - Pinaric", psgc: "0500506043" },
        { no: 16, name: "Bgy. 16 - Washington Drive & Aeroville Subd.", psgc: "0500506050" },
        { no: 17, name: "Bgy. 17 - Rizal St., Ilawod (Portion)", psgc: "0500506051" },
        { no: 71, name: "Renaissance Garden & Airport Road Area", psgc: "0500506000" },
        { no: 72, name: "Tarlac & Molave St.", psgc: "0500506000" },
        { no: 73, name: "Teacher's Village & Happy Homes Subd.", psgc: "0500506000" },
        { no: 74, name: "Sunrise Subd. & University Homes", psgc: "0500506000" }
      ]
    },
    {
      id: 'washington-f2',
      feederNo: 2,
      code: 'W-F2',
      displayName: 'Feeder 2 (W-F2)',
      name: 'Washington Feeder 2',
      substation: 'Washington Substation',
      substationKey: 'washington',
      voltage: '13.2 kV',
      coverageSummary: 'Em\'s Barrio (Bagtang Elem. Area), Daraga (Maroroy, Binitayan, Malobago), Camalig & Jovellar Grid',
      landmarks: ['Bagtang Elem. School Area', 'Daraga Highway Corridor', 'Camalig Town Proper', 'Daraga Recloser Lines', 'Jovellar Line'],
      barangays: [
        { no: 1, name: "Bgy. 1 - Em's Barrio (Bagtang Elem. Area)", psgc: "0500506005" },
        { no: 55, name: "Bgy. 55 - Binitayan (Daraga/Legazpi Line)", psgc: "0500506089" },
        { no: 101, name: "Maroroy, Malobago, Bagtang (Daraga)", psgc: "DARAGA" },
        { no: 102, name: "Bañag, Cullat, Bongalon, Busay, Pandan (Daraga)", psgc: "DARAGA" },
        { no: 103, name: "Lacag, Malabog, Salvacion, Budiao, Mi-isi (Daraga)", psgc: "DARAGA" },
        { no: 104, name: "Camalig Poblacion (Brgys 1-4) & 30+ Camalig Bgys", psgc: "CAMALIG" },
        { no: 105, name: "Florista (Jovellar)", psgc: "JOVELLAR" }
      ]
    },
    {
      id: 'washington-f3',
      feederNo: 3,
      code: 'W-F3',
      displayName: 'Feeder 3 (W-F3)',
      name: 'Washington Feeder 3',
      substation: 'Washington Substation',
      substationKey: 'washington',
      voltage: '13.2 kV',
      coverageSummary: 'Old Albay, Southern Legazpi (Taysan, Banquerohan, Homapon, Maslog), Daraga Lines & Manito',
      landmarks: ['Old Albay District', 'Taysan Sanitary Complex', 'Banquerohan Resettlement Area', 'Homapon Junction', 'Manito Scenic Highway'],
      barangays: [
        { no: 1, name: "Bgy. 1 - Em's Barrio (Pob.)", psgc: "0500506005" },
        { no: 2, name: "Bgy. 2 - Em's Barrio South (Pob.)", psgc: "0500506016" },
        { no: 3, name: "Bgy. 3 - Em's Barrio North (Pob.)", psgc: "0500506027" },
        { no: 4, name: "Bgy. 4 - Sagpon", psgc: "0500506038" },
        { no: 5, name: "Bgy. 5 - Sagmin", psgc: "0500506039" },
        { no: 6, name: "Bgy. 6 - Bañadero", psgc: "0500506040" },
        { no: 7, name: "Bgy. 7 - Bañadero", psgc: "0500506041" },
        { no: 9, name: "Bgy. 9 - Pinaric (Pob.)", psgc: "0500506043" },
        { no: 10, name: "Bgy. 10 - Cabugao", psgc: "0500506044" },
        { no: 11, name: "Bgy. 11 - Maoyod (Pob.)", psgc: "0500506045" },
        { no: 12, name: "Bgy. 12 - Tula-Tula", psgc: "0500506046" },
        { no: 59, name: "Bgy. 59 - Taysan & Doña Aurora", psgc: "0500506093" },
        { no: 60, name: "Bgy. 60 - Banquerohan", psgc: "0500506094" },
        { no: 61, name: "Bgy. 61 - Bariis & Naontugan", psgc: "0500506095" },
        { no: 62, name: "Bgy. 62 - Homapon (Anonang, Banban, Pokpokan)", psgc: "0500506096" },
        { no: 63, name: "Bgy. 63 - Mariawa", psgc: "0500506097" },
        { no: 64, name: "Bgy. 64 - Bagacay", psgc: "0500506098" },
        { no: 65, name: "Bgy. 65 - Imalnod", psgc: "0500506099" },
        { no: 66, name: "Bgy. 66 - Buenavista & Cawalog", psgc: "0500506100" },
        { no: 67, name: "Bgy. 67 - Estanza", psgc: "0500506101" },
        { no: 68, name: "Bgy. 68 - Maslog & Pulot", psgc: "0500506102" },
        { no: 69, name: "Bgy. 69 - San Francisco & Cagbacong", psgc: "0500506103" },
        { no: 106, name: "Anahao Village & Marquez St. Area", psgc: "0500506000" },
        { no: 201, name: "Manito, Albay (Cagbacongan to Nang Maharang - 16 Bgys)", psgc: "MANITO" }
      ]
    },
    {
      id: 'washington-f4',
      feederNo: 4,
      code: 'W-F4',
      displayName: 'Feeder 4 (W-F4)',
      name: 'Washington Feeder 4',
      substation: 'Washington Substation',
      substationKey: 'washington',
      voltage: '13.2 kV',
      coverageSummary: 'Daraga Rural Lines (Sipi, Kimantong, Balinad, Bascaran, Tabontabon, Villahermosa, etc.)',
      landmarks: ['Bascaran Recloser Junction', 'Sipi & Kimantong Corridors', 'Gabawan & Tabontabon Line', 'Villahermosa Upland Grid', 'Daraga Rural Circuits'],
      barangays: [
        { no: 110, name: "Sipi, Kimantong, Balinad (Daraga)", psgc: "DARAGA" },
        { no: 111, name: "Peñafrancia, Dela Paz, Gapo, Inarado (Daraga)", psgc: "DARAGA" },
        { no: 112, name: "Gabawan, Tabontabon, Bascaran (Daraga)", psgc: "DARAGA" },
        { no: 113, name: "Talahib, Burgos, Alobo, Namantao (Daraga)", psgc: "DARAGA" },
        { no: 114, name: "Baldo, Maopi, Canarom, San Ramon (Daraga)", psgc: "DARAGA" },
        { no: 115, name: "San Vicente, Nabasan, Ibaogan, Mayon (Daraga)", psgc: "DARAGA" },
        { no: 116, name: "Villahermosa, Bigao, San Roque (Daraga)", psgc: "DARAGA" },
        { no: 117, name: "Balaguer, Santa Maria (Daraga)", psgc: "DARAGA" },
        { no: 118, name: "Magogon (Camalig Line)", psgc: "CAMALIG" }
      ]
    },
    {
      id: 'bitano-f1',
      feederNo: 1,
      code: 'B-F1',
      displayName: 'Feeder 1 (B-F1)',
      name: 'Bitano Feeder 1',
      substation: 'Bitano Substation',
      substationKey: 'bitano',
      voltage: '13.2 kV',
      coverageSummary: 'Portion of Bitano, Kapantawan, Pigcale, Sabang, Baybay, Oro Site, Peñaranda St., Victory Village & PNR Area',
      landmarks: ['Legazpi Port Area', 'Peñaranda Park & St.', 'PNR Station Area', 'Sabang Seafront', 'Oro Site Commercial Strip'],
      barangays: [
        { no: 26, name: "Bgy. 26 - Dinagaan (Pob.)", psgc: "0500506060" },
        { no: 27, name: "Bgy. 27 - Victory Village South (Portion)", psgc: "0500506061" },
        { no: 28, name: "Bgy. 28 - Victory Village North (Portion)", psgc: "0500506062" },
        { no: 29, name: "Bgy. 29 - Sabang (Pob.)", psgc: "0500506063" },
        { no: 30, name: "Bgy. 30 - Pigcale (Pob.)", psgc: "0500506064" },
        { no: 31, name: "Bgy. 31 - Centro-Baybay (Pob.)", psgc: "0500506065" },
        { no: 32, name: "Bgy. 32 - San Roque", psgc: "0500506066" },
        { no: 33, name: "Bgy. 33 - PNR-Peñaranda St.-Iraya (Pob.)", psgc: "0500506067" },
        { no: 34, name: "Bgy. 34 - Oro Site-Magallanes St. (Pob.)", psgc: "0500506068" },
        { no: 35, name: "Bgy. 35 - Tinago", psgc: "0500506069" },
        { no: 36, name: "Bgy. 36 - Kapantawan", psgc: "0500506070" },
        { no: 37, name: "Bgy. 37 - Bitano (Portion)", psgc: "0500506071" }
      ]
    },
    {
      id: 'bitano-f2',
      feederNo: 2,
      code: 'B-F2',
      displayName: 'Feeder 2 (B-F2)',
      name: 'Bitano Feeder 2',
      substation: 'Bitano Substation',
      substationKey: 'bitano',
      voltage: '13.2 kV',
      coverageSummary: 'Bitano (Portion), Kapantawan, Victory Village (Portion), Binanuahan, Buragwis, Dap-Dap, Puro, Lamba & Cabangan',
      landmarks: ['Legazpi City Boulevard', 'Victory Village Coastal Strip', 'Binanuahan Commercial Strip', 'Puro Coastal Beach', 'Buragwis-Lamba Corridor'],
      barangays: [
        { no: 18, name: "Bgy. 18 - Cabagñan West (Pob.)", psgc: "0500506052" },
        { no: 19, name: "Bgy. 19 - Cabagñan (Pob.)", psgc: "0500506053" },
        { no: 20, name: "Bgy. 20 - Cabagñan East (Pob.)", psgc: "0500506054" },
        { no: 21, name: "Bgy. 21 - Binanuahan West (Pob.)", psgc: "0500506055" },
        { no: 22, name: "Bgy. 22 - Binanuahan East (Pob.)", psgc: "0500506056" },
        { no: 25, name: "Bgy. 25 - Dap-Dap / Lapu-Lapu", psgc: "0500506059" },
        { no: 27, name: "Bgy. 27 - Victory Village South (Portion)", psgc: "0500506061" },
        { no: 28, name: "Bgy. 28 - Victory Village North (Portion)", psgc: "0500506062" },
        { no: 36, name: "Bgy. 36 - Kapantawan", psgc: "0500506070" },
        { no: 37, name: "Bgy. 37 - Bitano (Portion)", psgc: "0500506071" },
        { no: 56, name: "Bgy. 56 - Puro", psgc: "0500506090" },
        { no: 57, name: "Bgy. 57 - Lamba", psgc: "0500506091" },
        { no: 58, name: "Bgy. 58 - Buragwis", psgc: "0500506092" },
        { no: 70, name: "Bgy. 70 - Cabagñan", psgc: "0500506104" }
      ]
    },
    {
      id: 'bitano-f3',
      feederNo: 3,
      code: 'B-F3',
      displayName: 'Feeder 3 (B-F3)',
      name: 'Bitano Feeder 3',
      substation: 'Bitano Substation',
      substationKey: 'bitano',
      voltage: '13.2 kV',
      coverageSummary: 'Bitano (Portion), Brgy. 16 Ilawod, Brgy. 17 Rizal St. Ilawod, Marquez St. (Portion), Sto. Niño Village, Vel-Amor Subd., Guevarra Subd. & Benny Imperial St.',
      landmarks: ['Benny Imperial St.', 'Vel-Amor Subdivision', 'Guevarra Subdivision', 'Sto. Niño Village', 'Imperial Court Commercial Area'],
      barangays: [
        { no: 13, name: "Bgy. 13 - Ilawod West (Pob.)", psgc: "0500506047" },
        { no: 14, name: "Bgy. 14 - Ilawod (Pob.)", psgc: "0500506048" },
        { no: 15, name: "Bgy. 15 - Ilawod East (Pob.)", psgc: "0500506049" },
        { no: 16, name: "Bgy. 16 - Kawit-East Washington Drive / Ilawod", psgc: "0500506050" },
        { no: 17, name: "Bgy. 17 - Rizal St., Ilawod (Pob.)", psgc: "0500506051" },
        { no: 23, name: "Bgy. 23 - Imperial Court Subd. (Pob.)", psgc: "0500506057" },
        { no: 24, name: "Bgy. 24 - Rizal Street (Pob.)", psgc: "0500506058" },
        { no: 37, name: "Bgy. 37 - Bitano (Portion)", psgc: "0500506071" },
        { no: 75, name: "Vel-Amor & Guevarra Subdivisions", psgc: "0500506000" },
        { no: 76, name: "Sto. Niño Village & Benny Imperial St.", psgc: "0500506000" }
      ]
    },
    {
      id: 'bitano-f4',
      feederNo: 4,
      code: 'B-F4',
      displayName: 'Feeder 4 (B-F4)',
      name: 'Bitano Feeder 4',
      substation: 'Bitano Substation',
      substationKey: 'bitano',
      voltage: '13.2 kV',
      coverageSummary: 'Cruzada, Barriada, Gogon, Bogtong, Bonot, Rawis, PAGASA Rawis, Tamaoyan, San Joaquin, Dita, Pawa & Daraga Lines (Kilicao, Mabinit, Bañadero, Tagas)',
      landmarks: ['Camp General Simeon Ola (PRO-5)', 'PAGASA Doppler Radar Station Rawis', 'DPWH Region V Complex', 'Bicol University CIT Campus', 'Northern Coastal Highway'],
      barangays: [
        { no: 37, name: "Bgy. 37 - Bitano (Portion)", psgc: "0500506071" },
        { no: 38, name: "Bgy. 38 - Gogon", psgc: "0500506072" },
        { no: 39, name: "Bgy. 39 - Bonot", psgc: "0500506073" },
        { no: 40, name: "Bgy. 40 - Cruzada", psgc: "0500506074" },
        { no: 41, name: "Bgy. 41 - Bogtong", psgc: "0500506075" },
        { no: 42, name: "Bgy. 42 - Rawis (including PAGASA Area)", psgc: "0500506076" },
        { no: 43, name: "Bgy. 43 - Tamaoyan", psgc: "0500506077" },
        { no: 44, name: "Bgy. 44 - Pawa", psgc: "0500506078" },
        { no: 45, name: "Bgy. 45 - Dita", psgc: "0500506079" },
        { no: 46, name: "Bgy. 46 - San Joaquin", psgc: "0500506080" },
        { no: 47, name: "Bgy. 47 - Arimbay", psgc: "0500506081" },
        { no: 48, name: "Bgy. 48 - Bagong Abre", psgc: "0500506082" },
        { no: 49, name: "Bgy. 49 - Bigaa", psgc: "0500506083" },
        { no: 50, name: "Bgy. 50 - Padang", psgc: "0500506084" },
        { no: 51, name: "Bgy. 51 - Buyuan", psgc: "0500506085" },
        { no: 52, name: "Bgy. 52 - Matanag", psgc: "0500506086" },
        { no: 53, name: "Bgy. 53 - Bonga", psgc: "0500506087" },
        { no: 54, name: "Bgy. 54 - Mabinit (Legazpi / Daraga Line)", psgc: "0500506088" },
        { no: 77, name: "Barriada", psgc: "0500506000" },
        { no: 301, name: "Kilicao, Bañadero, Tagas (Daraga Line)", psgc: "DARAGA" }
      ]
    }
  ];

  // --- Initialize on DOM Ready ---
  document.addEventListener('DOMContentLoaded', () => {
    initUtilityTabs();
    initFeederDirectory();
    initRequirementsChecklist();
    initCopyHotlines();
    initStickySubnav();
    handleInitialHash();
  });

  // --- Utility Master Tab Switching ---
  function initUtilityTabs() {
    const tabBtns = document.querySelectorAll('.utility-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const targetUtility = btn.getAttribute('data-target');
        switchUtility(targetUtility);
      });
    });
  }

  function switchUtility(targetUtility, updateHash = true) {
    const tabBtns = document.querySelectorAll('.utility-tab-btn');
    const elecSection = document.getElementById('electricity-section');
    const waterSection = document.getElementById('water-section');
    const currentUtilityBadge = document.getElementById('current-utility-badge');

    tabBtns.forEach(b => {
      const isTarget = b.getAttribute('data-target') === targetUtility;
      b.classList.toggle('active', isTarget);
      b.setAttribute('aria-selected', isTarget ? 'true' : 'false');
    });

    if (targetUtility === 'electricity') {
      if (elecSection) elecSection.style.display = 'block';
      if (waterSection) waterSection.style.display = 'none';
      if (currentUtilityBadge) {
        currentUtilityBadge.innerHTML = '<i class="bi bi-lightning-charge-fill" style="color: #ea580c;"></i> <span>Electricity (ALECO)</span>';
      }
    } else {
      if (elecSection) elecSection.style.display = 'none';
      if (waterSection) waterSection.style.display = 'block';
      if (currentUtilityBadge) {
        currentUtilityBadge.innerHTML = '<i class="bi bi-droplet-fill" style="color: #0284c7;"></i> <span>Water (LCWD)</span>';
      }
    }

    updateSubnavForUtility(targetUtility);

    if (updateHash) {
      const newHash = targetUtility === 'electricity' ? '#electricity' : '#water';
      if (window.location.hash !== newHash) {
        history.pushState(null, null, newHash);
      }
    }
  }

  function updateSubnavForUtility(utility) {
    const subnavLinks = document.querySelectorAll('.utility-subnav-link');
    subnavLinks.forEach(link => {
      const section = link.getAttribute('data-section');
      const href = link.getAttribute('href');

      if (section === 'feeders') {
        if (utility === 'water') {
          link.closest('li').style.display = 'none';
        } else {
          link.closest('li').style.display = '';
        }
      } else {
        link.closest('li').style.display = '';
      }

      if (href) {
        if (utility === 'electricity') {
          link.setAttribute('href', href.replace(/^#water-/, '#electricity-'));
        } else {
          link.setAttribute('href', href.replace(/^#electricity-/, '#water-'));
        }
      }
    });
  }

  // --- Handle URL Hash on Load ---
  function handleInitialHash() {
    const hash = window.location.hash.toLowerCase();
    if (hash.includes('water')) {
      switchUtility('water', false);
    } else {
      switchUtility('electricity', false);
    }
  }

  // --- Sticky Subnav Scroll Spy & Smooth Scroll ---
  function initStickySubnav() {
    const subnavLinks = document.querySelectorAll('.utility-subnav-link');
    
    subnavLinks.forEach(link => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        if (targetId && targetId.startsWith('#')) {
          const targetEl = document.querySelector(targetId);
          if (targetEl) {
            e.preventDefault();
            const navHeight = 120;
            const targetPos = targetEl.getBoundingClientRect().top + window.pageYOffset - navHeight;
            window.scrollTo({
              top: targetPos,
              behavior: 'smooth'
            });
            history.pushState(null, null, targetId);
          }
        }
      });
    });
  }

  // --- Feeder Directory & PSGC Barangay Lookup (Option B: Substation-Grouped Filter Bar) ---
  function initFeederDirectory() {
    const cardsGrid = document.getElementById('feeder-cards-grid');
    const searchInput = document.getElementById('feeder-search-input');
    const substationPills = document.querySelectorAll('.substation-pill');
    const subchipsContainer = document.getElementById('feeder-subchips');

    if (!cardsGrid) return;

    let currentSubstation = 'all';
    let currentFeederFilter = 'all';

    function updateSubchips(substation) {
      if (!subchipsContainer) return;
      if (substation === 'all') {
        subchipsContainer.style.display = 'none';
        subchipsContainer.innerHTML = '';
        return;
      }

      subchipsContainer.style.display = 'flex';
      const prefix = substation === 'washington' ? 'W' : 'B';
      const subName = substation === 'washington' ? 'Washington' : 'Bitano';

      let html = `<button type="button" class="feeder-chip active" data-filter="${substation}-all">All ${subName}</button>`;
      for (let i = 1; i <= 4; i++) {
        html += `<button type="button" class="feeder-chip" data-filter="${substation}-f${i}">Feeder ${i} (${prefix}-F${i})</button>`;
      }
      subchipsContainer.innerHTML = html;
    }

    // Substation Pill Click Event
    substationPills.forEach(pill => {
      pill.addEventListener('click', () => {
        substationPills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');

        currentSubstation = pill.getAttribute('data-substation');
        currentFeederFilter = currentSubstation === 'all' ? 'all' : `${currentSubstation}-all`;

        updateSubchips(currentSubstation);

        const query = searchInput ? searchInput.value.trim() : '';
        renderFeeders(query, currentSubstation, currentFeederFilter);
      });
    });

    // Subchip Click Event (Event Delegation)
    if (subchipsContainer) {
      subchipsContainer.addEventListener('click', (e) => {
        const chip = e.target.closest('.feeder-chip');
        if (!chip) return;

        const allChips = subchipsContainer.querySelectorAll('.feeder-chip');
        allChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');

        currentFeederFilter = chip.getAttribute('data-filter');
        const query = searchInput ? searchInput.value.trim() : '';
        renderFeeders(query, currentSubstation, currentFeederFilter);
      });
    }

    // Search Input Event
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        renderFeeders(query, currentSubstation, currentFeederFilter);
      });
    }

    // Event delegation for Collapsible Covered Barangays toggle
    cardsGrid.addEventListener('click', (e) => {
      const toggleBtn = e.target.closest('.feeder-coverage-toggle');
      if (!toggleBtn) return;
      const feederId = toggleBtn.getAttribute('data-feeder-id');
      const collapseEl = document.getElementById(`collapse-${feederId}`);
      if (collapseEl) {
        const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
        collapseEl.classList.toggle('show', !isExpanded);
      }
    });

    // Initial render
    renderFeeders();
  }

  function renderFeeders(searchTerm = '', substation = 'all', filterFeeder = 'all') {
    const cardsGrid = document.getElementById('feeder-cards-grid');
    if (!cardsGrid) return;

    const term = searchTerm.toLowerCase();
    cardsGrid.innerHTML = '';

    let matchedCount = 0;

    ALECO_FEEDERS_DATA.forEach(feeder => {
      // Check Substation Filter
      if (substation !== 'all' && feeder.substationKey !== substation) {
        return;
      }

      // Check Specific Feeder Filter
      if (filterFeeder !== 'all' && filterFeeder !== `${substation}-all` && feeder.id !== filterFeeder) {
        return;
      }

      // Check search match
      let isFeederMatch = false;
      let matchedBgyList = [];

      if (!term) {
        isFeederMatch = true;
      } else {
        const feederNameMatch = feeder.displayName.toLowerCase().includes(term) || feeder.name.toLowerCase().includes(term);
        const subMatch = feeder.substation.toLowerCase().includes(term);
        const lndMatch = feeder.landmarks.some(l => l.toLowerCase().includes(term));

        const bgyMatches = feeder.barangays.filter(b => 
          b.name.toLowerCase().includes(term) || 
          b.psgc.includes(term) || 
          b.no.toString() === term
        );

        if (feederNameMatch || subMatch || lndMatch || bgyMatches.length > 0) {
          isFeederMatch = true;
          matchedBgyList = bgyMatches.map(b => b.name);
        }
      }

      if (isFeederMatch) {
        matchedCount++;
        const isHighlighted = term.length > 0;
        const card = document.createElement('div');
        card.className = `feeder-card ${isHighlighted ? 'highlighted' : ''}`;
        card.id = `card-${feeder.id}`;

        // Determine if Covered Barangays should be open
        // When viewing all feeders with no specific filter: collapsed by default, UNLESS search matched a bgy in this feeder
        // When filtered to a specific substation or feeder: open by default
        const isFiltered = substation !== 'all' || (filterFeeder !== 'all');
        const shouldBeOpen = isFiltered || (term.length > 0 && matchedBgyList.length > 0);

        const barangayTags = feeder.barangays.map(b => {
          const isTagMatched = matchedBgyList.includes(b.name);
          const cleanName = b.name.replace(/\s*\(Pob\.?\)/gi, '').replace(/\s*\(Poblacion\)/gi, '').trim();
          const isNonLegazpi = ['DARAGA', 'CAMALIG', 'JOVELLAR', 'MANITO'].includes(b.psgc) || /\((Daraga|Camalig|Jovellar|Manito)\)/i.test(b.name);
          return `<span class="feeder-bgy-tag ${isTagMatched ? 'matched' : ''} ${isNonLegazpi ? 'non-legazpi' : ''}" title="${b.name}">${cleanName}</span>`;
        }).join('');

        const landmarkTags = feeder.landmarks.slice(0, 5).map(l => `<span class="feeder-landmark-pill"><i class="bi bi-geo-alt-fill"></i> ${l}</span>`).join('');

        card.innerHTML = `
          <div class="feeder-card-header">
            <span class="feeder-badge"><i class="bi bi-lightning-charge-fill"></i> ${feeder.displayName}</span>
            <span class="feeder-substation"><i class="bi bi-broadcast-pin"></i> ${feeder.substation}</span>
          </div>
          <div class="feeder-landmarks-block">
            <div class="feeder-section-label"><i class="bi bi-pin-map-fill"></i> Landmarks</div>
            <div class="feeder-landmarks-list">
              ${landmarkTags}
            </div>
          </div>
          <button type="button" class="feeder-coverage-toggle" aria-expanded="${shouldBeOpen ? 'true' : 'false'}" data-feeder-id="${feeder.id}" aria-controls="collapse-${feeder.id}">
            <span class="toggle-title"><i class="bi bi-houses-fill"></i> Covered Barangays (${feeder.barangays.length})</span>
            <span class="toggle-icon"><i class="bi bi-chevron-down"></i></span>
          </button>
          <div class="feeder-barangays-collapse ${shouldBeOpen ? 'show' : ''}" id="collapse-${feeder.id}">
            <div class="feeder-barangays-list">
              ${barangayTags}
            </div>
          </div>
        `;

        cardsGrid.appendChild(card);
      }
    });

    if (matchedCount === 0) {
      cardsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 36px 20px; background: var(--color-bg-alt, #f8f9fa); border-radius: 12px; border: 1px dashed #d1d5db;">
          <i class="bi bi-search" style="font-size: 2rem; color: #9ca3af; margin-bottom: 8px; display: inline-block;"></i>
          <h4 style="margin-bottom: 4px; color: var(--color-text);">No matching feeder found for "${searchTerm}"</h4>
          <p style="color: var(--color-text-light); margin: 0; font-size: 0.9rem;">Try searching by Barangay name (e.g. "Cruzada", "Em's Barrio", "Rawis") or PSGC code.</p>
        </div>
      `;
    }
  }

  // --- Requirements Interactive Checklist ---
  function initRequirementsChecklist() {
    const checklistContainers = document.querySelectorAll('.requirements-container');
    
    checklistContainers.forEach(container => {
      const items = container.querySelectorAll('.requirement-item');
      const counter = container.querySelector('.requirements-counter');
      const storageKey = `checklist_${container.id || 'default'}`;

      // Load saved state
      let savedState = {};
      try {
        savedState = JSON.parse(localStorage.getItem(storageKey)) || {};
      } catch (e) {
        savedState = {};
      }

      function updateCounter() {
        let checkedCount = 0;
        items.forEach((item, idx) => {
          const checkbox = item.querySelector('input[type="checkbox"]');
          if (checkbox && checkbox.checked) {
            checkedCount++;
            item.classList.add('checked');
          } else {
            item.classList.remove('checked');
          }
        });
        if (counter) {
          counter.textContent = `${checkedCount} of ${items.length} Ready`;
        }
      }

      items.forEach((item, idx) => {
        const checkbox = item.querySelector('input[type="checkbox"]');
        if (checkbox) {
          if (savedState[idx]) {
            checkbox.checked = true;
          }
          item.addEventListener('click', (e) => {
            if (e.target !== checkbox) {
              checkbox.checked = !checkbox.checked;
            }
            savedState[idx] = checkbox.checked;
            try {
              localStorage.setItem(storageKey, JSON.stringify(savedState));
            } catch (err) {}
            updateCounter();
          });
        }
      });

      updateCounter();
    });
  }

  // --- Copy Hotline Utility with Toast Notification ---
  function initCopyHotlines() {
    const copyBtns = document.querySelectorAll('.copy-hotline-btn');
    let toast = document.querySelector('.utility-toast');

    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'utility-toast';
      toast.innerHTML = '<i class="bi bi-check-circle-fill" style="color: #10b981;"></i> <span id="utility-toast-msg">Copied to clipboard!</span>';
      document.body.appendChild(toast);
    }

    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const num = btn.getAttribute('data-phone') || btn.innerText;
        if (navigator.clipboard) {
          navigator.clipboard.writeText(num.trim()).then(() => {
            showToast(`Copied ${num.trim()} to clipboard`);
          });
        }
      });
    });
  }

  function showToast(msg) {
    const toast = document.querySelector('.utility-toast');
    const msgEl = document.getElementById('utility-toast-msg');
    if (toast && msgEl) {
      msgEl.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => {
        toast.classList.remove('show');
      }, 2500);
    }
  }

})();
