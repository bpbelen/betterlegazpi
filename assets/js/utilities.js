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
      coverageSummary:
        'Bagumbayan, Pinaric, Portion of Brgy. 17, Washington Drive, Airport Road & Nearby Subdivisions',
      landmarks: [
        'Washington Drive',
        'Airport Road',
        'Renaissance Garden',
        'Aeroville Subd.',
        'Happy Homes Subd.',
      ],
      barangays: [
        { no: 8, name: 'Bgy. 8 - Bagumbayan', psgc: '0500506042' },
        { no: 9, name: 'Bgy. 9 - Pinaric', psgc: '0500506043' },
        { no: 16, name: 'Bgy. 16 - Washington Drive & Aeroville Subd.', psgc: '0500506050' },
        { no: 17, name: 'Bgy. 17 - Rizal St., Ilawod (Portion)', psgc: '0500506051' },
        { no: 71, name: 'Renaissance Garden & Airport Road Area', psgc: '0500506000' },
        { no: 72, name: 'Tarlac & Molave St.', psgc: '0500506000' },
        { no: 73, name: "Teacher's Village & Happy Homes Subd.", psgc: '0500506000' },
        { no: 74, name: 'Sunrise Subd. & University Homes', psgc: '0500506000' },
      ],
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
      coverageSummary:
        "Em's Barrio (Bagtang Elem. Area), Daraga (Maroroy, Binitayan, Malobago), Camalig & Jovellar Grid",
      landmarks: [
        'Bagtang Elem. School Area',
        'Daraga Highway Corridor',
        'Camalig Town Proper',
        'Daraga Recloser Lines',
        'Jovellar Line',
      ],
      barangays: [
        { no: 1, name: "Bgy. 1 - Em's Barrio (Bagtang Elem. Area)", psgc: '0500506005' },
        { no: 55, name: 'Bgy. 55 - Binitayan (Daraga/Legazpi Line)', psgc: '0500506089' },
        { no: 101, name: 'Maroroy, Malobago, Bagtang (Daraga)', psgc: 'DARAGA' },
        { no: 102, name: 'Bañag, Cullat, Bongalon, Busay, Pandan (Daraga)', psgc: 'DARAGA' },
        { no: 103, name: 'Lacag, Malabog, Salvacion, Budiao, Mi-isi (Daraga)', psgc: 'DARAGA' },
        { no: 104, name: 'Camalig Poblacion (Brgys 1-4) & 30+ Camalig Bgys', psgc: 'CAMALIG' },
        { no: 105, name: 'Florista (Jovellar)', psgc: 'JOVELLAR' },
      ],
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
      coverageSummary:
        'Old Albay, Southern Legazpi (Taysan, Banquerohan, Homapon, Maslog), Daraga Lines & Manito',
      landmarks: [
        'Old Albay District',
        'Taysan Sanitary Complex',
        'Banquerohan Resettlement Area',
        'Homapon Junction',
        'Manito Scenic Highway',
      ],
      barangays: [
        { no: 1, name: "Bgy. 1 - Em's Barrio (Pob.)", psgc: '0500506005' },
        { no: 2, name: "Bgy. 2 - Em's Barrio South (Pob.)", psgc: '0500506016' },
        { no: 3, name: "Bgy. 3 - Em's Barrio North (Pob.)", psgc: '0500506027' },
        { no: 4, name: 'Bgy. 4 - Sagpon', psgc: '0500506038' },
        { no: 5, name: 'Bgy. 5 - Sagmin', psgc: '0500506039' },
        { no: 6, name: 'Bgy. 6 - Bañadero', psgc: '0500506040' },
        { no: 7, name: 'Bgy. 7 - Bañadero', psgc: '0500506041' },
        { no: 9, name: 'Bgy. 9 - Pinaric (Pob.)', psgc: '0500506043' },
        { no: 10, name: 'Bgy. 10 - Cabugao', psgc: '0500506044' },
        { no: 11, name: 'Bgy. 11 - Maoyod (Pob.)', psgc: '0500506045' },
        { no: 12, name: 'Bgy. 12 - Tula-Tula', psgc: '0500506046' },
        { no: 59, name: 'Bgy. 59 - Taysan & Doña Aurora', psgc: '0500506093' },
        { no: 60, name: 'Bgy. 60 - Banquerohan', psgc: '0500506094' },
        { no: 61, name: 'Bgy. 61 - Bariis & Naontugan', psgc: '0500506095' },
        { no: 62, name: 'Bgy. 62 - Homapon (Anonang, Banban, Pokpokan)', psgc: '0500506096' },
        { no: 63, name: 'Bgy. 63 - Mariawa', psgc: '0500506097' },
        { no: 64, name: 'Bgy. 64 - Bagacay', psgc: '0500506098' },
        { no: 65, name: 'Bgy. 65 - Imalnod', psgc: '0500506099' },
        { no: 66, name: 'Bgy. 66 - Buenavista & Cawalog', psgc: '0500506100' },
        { no: 67, name: 'Bgy. 67 - Estanza', psgc: '0500506101' },
        { no: 68, name: 'Bgy. 68 - Maslog & Pulot', psgc: '0500506102' },
        { no: 69, name: 'Bgy. 69 - San Francisco & Cagbacong', psgc: '0500506103' },
        { no: 106, name: 'Anahao Village & Marquez St. Area', psgc: '0500506000' },
        { no: 201, name: 'Manito, Albay (Cagbacongan to Nang Maharang - 16 Bgys)', psgc: 'MANITO' },
      ],
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
      coverageSummary:
        'Daraga Rural Lines (Sipi, Kimantong, Balinad, Bascaran, Tabontabon, Villahermosa, etc.)',
      landmarks: [
        'Bascaran Recloser Junction',
        'Sipi & Kimantong Corridors',
        'Gabawan & Tabontabon Line',
        'Villahermosa Upland Grid',
        'Daraga Rural Circuits',
      ],
      barangays: [
        { no: 110, name: 'Sipi, Kimantong, Balinad (Daraga)', psgc: 'DARAGA' },
        { no: 111, name: 'Peñafrancia, Dela Paz, Gapo, Inarado (Daraga)', psgc: 'DARAGA' },
        { no: 112, name: 'Gabawan, Tabontabon, Bascaran (Daraga)', psgc: 'DARAGA' },
        { no: 113, name: 'Talahib, Burgos, Alobo, Namantao (Daraga)', psgc: 'DARAGA' },
        { no: 114, name: 'Baldo, Maopi, Canarom, San Ramon (Daraga)', psgc: 'DARAGA' },
        { no: 115, name: 'San Vicente, Nabasan, Ibaogan, Mayon (Daraga)', psgc: 'DARAGA' },
        { no: 116, name: 'Villahermosa, Bigao, San Roque (Daraga)', psgc: 'DARAGA' },
        { no: 117, name: 'Balaguer, Santa Maria (Daraga)', psgc: 'DARAGA' },
        { no: 118, name: 'Magogon (Camalig Line)', psgc: 'CAMALIG' },
      ],
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
      coverageSummary:
        'Portion of Bitano, Kapantawan, Pigcale, Sabang, Baybay, Oro Site, Peñaranda St., Victory Village & PNR Area',
      landmarks: [
        'Legazpi Port Area',
        'Peñaranda Park & St.',
        'PNR Station Area',
        'Sabang Seafront',
        'Oro Site Commercial Strip',
      ],
      barangays: [
        { no: 26, name: 'Bgy. 26 - Dinagaan (Pob.)', psgc: '0500506060' },
        { no: 27, name: 'Bgy. 27 - Victory Village South (Portion)', psgc: '0500506061' },
        { no: 28, name: 'Bgy. 28 - Victory Village North (Portion)', psgc: '0500506062' },
        { no: 29, name: 'Bgy. 29 - Sabang (Pob.)', psgc: '0500506063' },
        { no: 30, name: 'Bgy. 30 - Pigcale (Pob.)', psgc: '0500506064' },
        { no: 31, name: 'Bgy. 31 - Centro-Baybay (Pob.)', psgc: '0500506065' },
        { no: 32, name: 'Bgy. 32 - San Roque', psgc: '0500506066' },
        { no: 33, name: 'Bgy. 33 - PNR-Peñaranda St.-Iraya (Pob.)', psgc: '0500506067' },
        { no: 34, name: 'Bgy. 34 - Oro Site-Magallanes St. (Pob.)', psgc: '0500506068' },
        { no: 35, name: 'Bgy. 35 - Tinago', psgc: '0500506069' },
        { no: 36, name: 'Bgy. 36 - Kapantawan', psgc: '0500506070' },
        { no: 37, name: 'Bgy. 37 - Bitano (Portion)', psgc: '0500506071' },
      ],
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
      coverageSummary:
        'Bitano (Portion), Kapantawan, Victory Village (Portion), Binanuahan, Buragwis, Dap-Dap, Puro, Lamba & Cabangan',
      landmarks: [
        'Legazpi City Boulevard',
        'Victory Village Coastal Strip',
        'Binanuahan Commercial Strip',
        'Puro Coastal Beach',
        'Buragwis-Lamba Corridor',
      ],
      barangays: [
        { no: 18, name: 'Bgy. 18 - Cabagñan West (Pob.)', psgc: '0500506052' },
        { no: 19, name: 'Bgy. 19 - Cabagñan (Pob.)', psgc: '0500506053' },
        { no: 20, name: 'Bgy. 20 - Cabagñan East (Pob.)', psgc: '0500506054' },
        { no: 21, name: 'Bgy. 21 - Binanuahan West (Pob.)', psgc: '0500506055' },
        { no: 22, name: 'Bgy. 22 - Binanuahan East (Pob.)', psgc: '0500506056' },
        { no: 25, name: 'Bgy. 25 - Dap-Dap / Lapu-Lapu', psgc: '0500506059' },
        { no: 27, name: 'Bgy. 27 - Victory Village South (Portion)', psgc: '0500506061' },
        { no: 28, name: 'Bgy. 28 - Victory Village North (Portion)', psgc: '0500506062' },
        { no: 36, name: 'Bgy. 36 - Kapantawan', psgc: '0500506070' },
        { no: 37, name: 'Bgy. 37 - Bitano (Portion)', psgc: '0500506071' },
        { no: 56, name: 'Bgy. 56 - Puro', psgc: '0500506090' },
        { no: 57, name: 'Bgy. 57 - Lamba', psgc: '0500506091' },
        { no: 58, name: 'Bgy. 58 - Buragwis', psgc: '0500506092' },
        { no: 70, name: 'Bgy. 70 - Cabagñan', psgc: '0500506104' },
      ],
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
      coverageSummary:
        'Bitano (Portion), Brgy. 16 Ilawod, Brgy. 17 Rizal St. Ilawod, Marquez St. (Portion), Sto. Niño Village, Vel-Amor Subd., Guevarra Subd. & Benny Imperial St.',
      landmarks: [
        'Benny Imperial St.',
        'Vel-Amor Subdivision',
        'Guevarra Subdivision',
        'Sto. Niño Village',
        'Imperial Court Commercial Area',
      ],
      barangays: [
        { no: 13, name: 'Bgy. 13 - Ilawod West (Pob.)', psgc: '0500506047' },
        { no: 14, name: 'Bgy. 14 - Ilawod (Pob.)', psgc: '0500506048' },
        { no: 15, name: 'Bgy. 15 - Ilawod East (Pob.)', psgc: '0500506049' },
        { no: 16, name: 'Bgy. 16 - Kawit-East Washington Drive / Ilawod', psgc: '0500506050' },
        { no: 17, name: 'Bgy. 17 - Rizal St., Ilawod (Pob.)', psgc: '0500506051' },
        { no: 23, name: 'Bgy. 23 - Imperial Court Subd. (Pob.)', psgc: '0500506057' },
        { no: 24, name: 'Bgy. 24 - Rizal Street (Pob.)', psgc: '0500506058' },
        { no: 37, name: 'Bgy. 37 - Bitano (Portion)', psgc: '0500506071' },
        { no: 75, name: 'Vel-Amor & Guevarra Subdivisions', psgc: '0500506000' },
        { no: 76, name: 'Sto. Niño Village & Benny Imperial St.', psgc: '0500506000' },
      ],
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
      coverageSummary:
        'Cruzada, Barriada, Gogon, Bogtong, Bonot, Rawis, PAGASA Rawis, Tamaoyan, San Joaquin, Dita, Pawa & Daraga Lines (Kilicao, Mabinit, Bañadero, Tagas)',
      landmarks: [
        'Camp General Simeon Ola (PRO-5)',
        'PAGASA Doppler Radar Station Rawis',
        'DPWH Region V Complex',
        'Bicol University CIT Campus',
        'Northern Coastal Highway',
      ],
      barangays: [
        { no: 37, name: 'Bgy. 37 - Bitano (Portion)', psgc: '0500506071' },
        { no: 38, name: 'Bgy. 38 - Gogon', psgc: '0500506072' },
        { no: 39, name: 'Bgy. 39 - Bonot', psgc: '0500506073' },
        { no: 40, name: 'Bgy. 40 - Cruzada', psgc: '0500506074' },
        { no: 41, name: 'Bgy. 41 - Bogtong', psgc: '0500506075' },
        { no: 42, name: 'Bgy. 42 - Rawis (including PAGASA Area)', psgc: '0500506076' },
        { no: 43, name: 'Bgy. 43 - Tamaoyan', psgc: '0500506077' },
        { no: 44, name: 'Bgy. 44 - Pawa', psgc: '0500506078' },
        { no: 45, name: 'Bgy. 45 - Dita', psgc: '0500506079' },
        { no: 46, name: 'Bgy. 46 - San Joaquin', psgc: '0500506080' },
        { no: 47, name: 'Bgy. 47 - Arimbay', psgc: '0500506081' },
        { no: 48, name: 'Bgy. 48 - Bagong Abre', psgc: '0500506082' },
        { no: 49, name: 'Bgy. 49 - Bigaa', psgc: '0500506083' },
        { no: 50, name: 'Bgy. 50 - Padang', psgc: '0500506084' },
        { no: 51, name: 'Bgy. 51 - Buyuan', psgc: '0500506085' },
        { no: 52, name: 'Bgy. 52 - Matanag', psgc: '0500506086' },
        { no: 53, name: 'Bgy. 53 - Bonga', psgc: '0500506087' },
        { no: 54, name: 'Bgy. 54 - Mabinit (Legazpi / Daraga Line)', psgc: '0500506088' },
        { no: 77, name: 'Barriada', psgc: '0500506000' },
        { no: 301, name: 'Kilicao, Bañadero, Tagas (Daraga Line)', psgc: 'DARAGA' },
      ],
    },
  ];

  // --- Non-Legazpi service areas carried on shared feeders ---
  const NON_LEGAZPI = ['DARAGA', 'CAMALIG', 'JOVELLAR', 'MANITO'];

  const BARANGAY_TAG_PREVIEW = 12;

  // --- Init ---
  document.addEventListener('DOMContentLoaded', () => {
    initUtilitySwitcher();
    initSubnav();
    initFeederLookup();
    initFeederBrowse();
    initRequirementsChecklist();
    initSituationFilter();
    initCopyHotlines();
    initAdvisories();
    initFacebookEmbeds();
  });

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  function escapeHtml(str) {
    return String(str).replace(
      /[&<>"']/g,
      (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]
    );
  }

  function cleanBarangayName(name) {
    return name
      .replace(/\s*\(Pob\.?\)/gi, '')
      .replace(/\s*\(Poblacion\)/gi, '')
      .trim();
  }

  function isNonLegazpi(bgy) {
    return NON_LEGAZPI.includes(bgy.psgc) || /\((Daraga|Camalig|Jovellar|Manito)\)/i.test(bgy.name);
  }

  // ---------------------------------------------------------------------------
  // Utility switcher (electricity / water)
  //
  // These are two links, not an ARIA tabs widget: the panels are page sections
  // with their own URL hash, so the browser's own history and focus handling do
  // the right thing without a roving tabindex or arrow-key handler.
  // ---------------------------------------------------------------------------

  function initUtilitySwitcher() {
    const links = document.querySelectorAll('.utility-switch-link');

    links.forEach((link) => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switchUtility(link.getAttribute('data-target'), true);
      });
    });

    window.addEventListener('popstate', () => applyHash(false));
    applyHash(false);
  }

  function applyHash(pushHash) {
    const hash = (window.location.hash || '').toLowerCase();
    switchUtility(hash.indexOf('water') !== -1 ? 'water' : 'electricity', pushHash);
  }

  function switchUtility(target, pushHash) {
    const isWater = target === 'water';

    document.querySelectorAll('.utility-switch-link').forEach((link) => {
      const selected = link.getAttribute('data-target') === target;
      link.classList.toggle('active', selected);
      if (selected) {
        link.setAttribute('aria-current', 'true');
      } else {
        link.removeAttribute('aria-current');
      }
    });

    const elec = document.getElementById('electricity-section');
    const water = document.getElementById('water-section');
    if (elec) elec.hidden = isWater;
    if (water) water.hidden = !isWater;

    retargetSubnav(target);

    if (pushHash) {
      const next = isWater ? '#water' : '#electricity';
      if (window.location.hash !== next) history.pushState(null, '', next);
    }
  }

  // ---------------------------------------------------------------------------
  // Sticky sub-navigation
  //
  // Anchor jumps are left to the browser. Offset is handled once in CSS by
  // --utility-sticky-offset feeding scroll-margin-top, so there is no second
  // copy of that measurement here.
  // ---------------------------------------------------------------------------

  function initSubnav() {
    const links = Array.from(document.querySelectorAll('.utility-subnav-link'));
    if (!links.length) return;

    const targets = new Map();

    function collectTargets() {
      targets.clear();
      links.forEach((link) => {
        const el = document.querySelector(link.getAttribute('href'));
        if (el) targets.set(el, link);
      });
    }

    collectTargets();
    document.addEventListener('utility:switched', collectTargets);

    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const link = targets.get(entry.target);
          if (!link) return;
          if (entry.isIntersecting) {
            links.forEach((l) => {
              l.classList.remove('active');
              l.removeAttribute('aria-current');
            });
            link.classList.add('active');
            link.setAttribute('aria-current', 'true');
          }
        });
      },
      { rootMargin: '-140px 0px -55% 0px', threshold: 0 }
    );

    document.querySelectorAll('.utility-block').forEach((block) => observer.observe(block));
  }

  function retargetSubnav(utility) {
    const prefix = utility === 'water' ? '#water-' : '#electricity-';

    document.querySelectorAll('.utility-subnav-link, .triage-tile').forEach((link) => {
      const section = link.getAttribute('data-section');
      if (section) link.setAttribute('href', prefix + section);
    });

    document.dispatchEvent(new CustomEvent('utility:switched', { detail: { utility } }));
  }

  // ---------------------------------------------------------------------------
  // Feeder lookup: one barangay in, one answer out
  // ---------------------------------------------------------------------------

  function barangayIndex() {
    const index = [];
    ALECO_FEEDERS_DATA.forEach((feeder) => {
      feeder.barangays.forEach((bgy) => {
        index.push({ label: cleanBarangayName(bgy.name), raw: bgy, feeder: feeder });
      });
    });
    return index.sort((a, b) => a.label.localeCompare(b.label));
  }

  function initFeederLookup() {
    const input = document.getElementById('barangay-input');
    const list = document.getElementById('barangay-options');
    const answer = document.getElementById('feeder-answer');
    if (!input || !answer) return;

    const index = barangayIndex();

    if (list) {
      list.innerHTML = index
        .map((entry) => `<option value="${escapeHtml(entry.label)}"></option>`)
        .join('');
    }

    function resolve() {
      const term = input.value.trim().toLowerCase();

      if (!term) {
        answer.innerHTML = '';
        answer.hidden = true;
        return;
      }

      const exact = index.find((e) => e.label.toLowerCase() === term);
      const matches = exact
        ? [exact]
        : index.filter(
            (e) =>
              e.label.toLowerCase().indexOf(term) !== -1 ||
              e.raw.psgc.indexOf(term) !== -1 ||
              String(e.raw.no) === term
          );

      answer.hidden = false;

      if (!matches.length) {
        answer.innerHTML = `
          <div class="feeder-answer-empty">
            <h4>No barangay matches "${escapeHtml(input.value.trim())}"</h4>
            <p>Try the barangay name on your electric bill, for example Cruzada, Rawis, or Em's Barrio. You can also open the full feeder list below.</p>
          </div>`;
        return;
      }

      if (matches.length > 1 && matches.length <= 6) {
        answer.innerHTML = `
          <div class="feeder-answer-empty">
            <h4>${matches.length} barangays match "${escapeHtml(input.value.trim())}"</h4>
            <p>Pick the exact one:</p>
            <div class="feeder-answer-options">
              ${matches
                .map(
                  (m) =>
                    `<button type="button" class="feeder-answer-option" data-pick="${escapeHtml(m.label)}">${escapeHtml(m.label)}</button>`
                )
                .join('')}
            </div>
          </div>`;
        return;
      }

      renderAnswer(matches[0]);
    }

    function renderAnswer(entry) {
      const feeder = entry.feeder;
      const landmarks = feeder.landmarks
        .slice(0, 5)
        .map((l) => `<span class="feeder-landmark-pill">${escapeHtml(l)}</span>`)
        .join('');

      answer.innerHTML = `
        <div class="feeder-answer-card">
          <p class="feeder-answer-lede">${escapeHtml(entry.label)} is served by</p>
          <p class="feeder-answer-feeder">${escapeHtml(feeder.displayName)}</p>
          <dl class="feeder-answer-meta">
            <div><dt>Substation</dt><dd>${escapeHtml(feeder.substation)}</dd></div>
            <div><dt>Line voltage</dt><dd>${escapeHtml(feeder.voltage)}</dd></div>
            <div><dt>Barangays on this line</dt><dd>${feeder.barangays.length}</dd></div>
          </dl>
          <div class="feeder-answer-landmarks">
            <p class="feeder-answer-label">Also on this line</p>
            <div class="feeder-landmarks-list">${landmarks}</div>
          </div>
          <p class="feeder-answer-hint">ALECO names this feeder in its interruption notices. Watch for <strong>${escapeHtml(feeder.displayName)}</strong> in the advisories below.</p>
        </div>`;
    }

    let debounce;
    input.addEventListener('input', () => {
      window.clearTimeout(debounce);
      debounce = window.setTimeout(resolve, 160);
    });

    input.addEventListener('change', resolve);

    answer.addEventListener('click', (e) => {
      const pick = e.target.closest('[data-pick]');
      if (!pick) return;
      input.value = pick.getAttribute('data-pick');
      resolve();
    });
  }

  // ---------------------------------------------------------------------------
  // Browse-all feeder grid (behind a disclosure)
  // ---------------------------------------------------------------------------

  function initFeederBrowse() {
    const grid = document.getElementById('feeder-cards-grid');
    if (!grid) return;

    renderFeederCards();

    grid.addEventListener('click', (e) => {
      const toggle = e.target.closest('.feeder-coverage-toggle');
      if (toggle) {
        const panel = document.getElementById(toggle.getAttribute('aria-controls'));
        const open = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', open ? 'false' : 'true');
        if (panel) panel.classList.toggle('show', !open);
        return;
      }

      const showAll = e.target.closest('.feeder-show-all');
      if (showAll) {
        const wrap = showAll.previousElementSibling;
        if (wrap) wrap.classList.add('all-shown');
        showAll.remove();
      }
    });
  }

  function renderFeederCards() {
    const grid = document.getElementById('feeder-cards-grid');
    if (!grid) return;

    grid.innerHTML = ALECO_FEEDERS_DATA.map((feeder) => {
      const tags = feeder.barangays
        .map((bgy, i) => {
          const classes = ['feeder-bgy-tag'];
          if (isNonLegazpi(bgy)) classes.push('non-legazpi');
          if (i >= BARANGAY_TAG_PREVIEW) classes.push('overflow');
          return `<span class="${classes.join(' ')}" title="${escapeHtml(bgy.name)}">${escapeHtml(cleanBarangayName(bgy.name))}</span>`;
        })
        .join('');

      const hidden = feeder.barangays.length - BARANGAY_TAG_PREVIEW;
      const showAll =
        hidden > 0
          ? `<button type="button" class="feeder-show-all">Show all ${feeder.barangays.length} barangays</button>`
          : '';

      const landmarks = feeder.landmarks
        .slice(0, 5)
        .map((l) => `<span class="feeder-landmark-pill">${escapeHtml(l)}</span>`)
        .join('');

      return `
        <div class="feeder-card" id="card-${escapeHtml(feeder.id)}">
          <div class="feeder-card-header">
            <span class="feeder-badge">${escapeHtml(feeder.displayName)}</span>
            <span class="feeder-substation">${escapeHtml(feeder.substation)}</span>
          </div>
          <div class="feeder-landmarks-block">
            <p class="feeder-section-label">Landmarks</p>
            <div class="feeder-landmarks-list">${landmarks}</div>
          </div>
          <button type="button" class="feeder-coverage-toggle" aria-expanded="false" aria-controls="collapse-${escapeHtml(feeder.id)}">
            <span class="toggle-title">Covered barangays (${feeder.barangays.length})</span>
            <span class="toggle-icon" aria-hidden="true"><i class="bi bi-chevron-down"></i></span>
          </button>
          <div class="feeder-barangays-collapse" id="collapse-${escapeHtml(feeder.id)}">
            <div class="feeder-barangays-list">${tags}</div>
            ${showAll}
          </div>
        </div>`;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // Requirements checklist
  //
  // State is keyed by a stable data-req-id rather than list position, so the
  // situation filter can add and remove items without shuffling saved ticks.
  // ---------------------------------------------------------------------------

  function initRequirementsChecklist() {
    document.querySelectorAll('.requirements-container').forEach((container) => {
      const storageKey = `checklist_${container.id || 'default'}`;
      let saved = {};

      try {
        saved = JSON.parse(localStorage.getItem(storageKey)) || {};
      } catch (e) {
        saved = {};
      }

      container.querySelectorAll('.requirement-item').forEach((item) => {
        const box = item.querySelector('input[type="checkbox"]');
        const id = item.getAttribute('data-req-id');
        if (!box || !id) return;

        if (saved[id]) box.checked = true;
        item.classList.toggle('checked', box.checked);

        // The label already toggles the checkbox natively; listening for change
        // avoids the double-toggle a click handler on the label would cause.
        box.addEventListener('change', () => {
          saved[id] = box.checked;
          item.classList.toggle('checked', box.checked);
          try {
            localStorage.setItem(storageKey, JSON.stringify(saved));
          } catch (err) {
            /* storage blocked: the checklist still works for this visit */
          }
          updateChecklistCounter(container);
        });
      });

      updateChecklistCounter(container);
    });
  }

  function updateChecklistCounter(container) {
    const counter = container.querySelector('.requirements-counter');
    if (!counter) return;

    const items = Array.from(container.querySelectorAll('.requirement-item')).filter(
      (item) => item.offsetParent !== null || !item.hidden
    );
    const visible = items.filter((item) => !item.hidden);
    const done = visible.filter((item) => {
      const box = item.querySelector('input[type="checkbox"]');
      return box && box.checked;
    }).length;

    counter.textContent = `${done} of ${visible.length} ready`;
  }

  // ---------------------------------------------------------------------------
  // Situation filter: shows only the conditional documents that apply
  // ---------------------------------------------------------------------------

  function initSituationFilter() {
    const filter = document.querySelector('.situation-filter');
    if (!filter) return;

    const container = filter.closest('.requirements-container');
    const prompt = container ? container.querySelector('.situation-prompt') : null;

    function apply(situation) {
      if (!container) return;

      container.querySelectorAll('.requirement-item[data-situations]').forEach((item) => {
        const applies =
          !!situation && item.getAttribute('data-situations').split(' ').indexOf(situation) !== -1;
        item.hidden = !applies;
      });

      if (prompt) prompt.hidden = !!situation;
      updateChecklistCounter(container);
    }

    filter.querySelectorAll('input[type="radio"]').forEach((radio) => {
      radio.addEventListener('change', () => {
        if (radio.checked) {
          apply(radio.value);
          try {
            localStorage.setItem('utilities_situation', radio.value);
          } catch (e) {
            /* storage blocked */
          }
        }
      });
    });

    let restored = null;
    try {
      restored = localStorage.getItem('utilities_situation');
    } catch (e) {
      restored = null;
    }

    const preset = restored ? filter.querySelector(`input[value="${CSS.escape(restored)}"]`) : null;

    if (preset) {
      preset.checked = true;
      apply(restored);
    } else {
      apply(null);
    }
  }

  // ---------------------------------------------------------------------------
  // Copy hotline
  // ---------------------------------------------------------------------------

  function initCopyHotlines() {
    const buttons = document.querySelectorAll('.copy-hotline-btn');
    if (!buttons.length) return;

    let toast = document.querySelector('.utility-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.className = 'utility-toast';
      toast.setAttribute('role', 'status');
      document.body.appendChild(toast);
    }

    let hideTimer;

    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const number = (btn.getAttribute('data-phone') || '').trim();
        if (!number || !navigator.clipboard) return;

        navigator.clipboard.writeText(number).then(
          () => showToast(`Copied ${number}`),
          () => showToast('Could not copy. Long-press the number to copy it manually.')
        );
      });
    });

    function showToast(message) {
      toast.textContent = message;
      toast.classList.add('show');
      window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => {
        toast.classList.remove('show');
        toast.textContent = '';
      }, 3000);
    }
  }

  // ---------------------------------------------------------------------------
  // Advisories rendered from data/utility-advisories.json
  //
  // The official pages belong to ALECO and LCWD, so this file is curated in the
  // repo rather than synced: scripts/data/sync-facebook.js needs a Page access
  // token with an Editor role on the page it reads, which BetterLegazpi does not
  // hold for either utility.
  // ---------------------------------------------------------------------------

  function initAdvisories() {
    const lists = document.querySelectorAll('.advisory-list');
    if (!lists.length) return;

    fetch('../data/utility-advisories.json', { cache: 'no-cache' })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data) => {
        lists.forEach((list) => {
          const utility = list.getAttribute('data-utility');
          const items = (data && data.advisories && data.advisories[utility]) || [];
          renderAdvisories(list, items);
        });
      })
      .catch(() => {
        /* No advisories file, or it could not be read: the static empty state
           already says the right thing, so leave the page as it is. */
      });
  }

  function renderAdvisories(list, items) {
    const utility = list.getAttribute('data-utility');
    const provider = utility === 'water' ? 'LCWD' : 'ALECO';

    const active = items
      .filter((item) => !item.endsAt || new Date(item.endsAt).getTime() > Date.now())
      .sort((a, b) => new Date(b.postedAt) - new Date(a.postedAt));

    if (!active.length) {
      // The static markup already carries this state, so only rebuild it if a
      // previous render replaced it with items.
      if (!list.querySelector('.advisory-empty')) {
        list.innerHTML = `
        <div class="advisory-empty">
          <p class="advisory-empty-title">No advisory recorded here right now.</p>
          <p>${provider} posts interruption notices on its Facebook page as they happen. Open the live feed below to check.</p>
        </div>`;
      }
      return;
    }

    list.innerHTML = active
      .map((item) => {
        const areas = (item.areas || [])
          .map((a) => `<span class="advisory-area">${escapeHtml(a)}</span>`)
          .join('');

        const posted = item.postedAt
          ? new Date(item.postedAt).toLocaleDateString('en-PH', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
          : '';

        return `
          <article class="advisory-item advisory-${escapeHtml(item.kind || 'notice')}">
            <p class="advisory-meta">
              <span class="advisory-kind">${escapeHtml(item.kind || 'Notice')}</span>
              ${posted ? `<time datetime="${escapeHtml(item.postedAt)}">${escapeHtml(posted)}</time>` : ''}
            </p>
            <h4>${escapeHtml(item.title || '')}</h4>
            ${item.window ? `<p class="advisory-window">${escapeHtml(item.window)}</p>` : ''}
            ${areas ? `<div class="advisory-areas">${areas}</div>` : ''}
            ${item.body ? `<p>${escapeHtml(item.body)}</p>` : ''}
            ${item.source ? `<a class="advisory-source" href="${escapeHtml(item.source)}" target="_blank" rel="noopener noreferrer">Read the ${escapeHtml(provider)} post</a>` : ''}
          </article>`;
      })
      .join('');
  }

  // ---------------------------------------------------------------------------
  // Facebook embed, loaded only on request
  //
  // The plugin is a third-party frame that content blockers routinely drop, so
  // the page never depends on it: the card below it is the real fallback and is
  // always present, and the frame is opt-in.
  // ---------------------------------------------------------------------------

  function initFacebookEmbeds() {
    document.querySelectorAll('.fb-load-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const slot = document.getElementById(btn.getAttribute('aria-controls'));
        if (!slot || slot.getAttribute('data-loaded') === 'true') return;

        const src = slot.getAttribute('data-src');
        const title = slot.getAttribute('data-title') || 'Facebook timeline';

        const frame = document.createElement('iframe');
        frame.className = 'fb-embed-frame';
        frame.src = src;
        frame.title = title;
        frame.loading = 'lazy';
        frame.setAttribute('scrolling', 'no');
        frame.setAttribute('frameborder', '0');
        frame.setAttribute('allowfullscreen', 'true');
        frame.setAttribute(
          'allow',
          'clipboard-write; encrypted-media; picture-in-picture; web-share'
        );

        slot.innerHTML = '';
        slot.appendChild(frame);
        slot.hidden = false;
        slot.setAttribute('data-loaded', 'true');

        btn.hidden = true;

        // A blocked frame stays blank and never fires load. Say so rather than
        // leaving an empty rectangle on the page.
        const timer = window.setTimeout(() => {
          const note = document.createElement('p');
          note.className = 'fb-blocked-note';
          note.textContent =
            'The Facebook feed did not load. A browser privacy setting or content blocker is likely stopping it. Use the link above to open the page directly.';
          slot.appendChild(note);
        }, 6000);

        frame.addEventListener('load', () => window.clearTimeout(timer));
      });
    });
  }
})();
