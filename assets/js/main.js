/* BetterLegazpi - Main JavaScript */

// ─── PWA Install Prompt ─────────────────────────────────────────────────────
var deferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', function (e) {
  e.preventDefault();
  deferredInstallPrompt = e;
  showInstallBanner();
});

function showInstallBanner() {
  // Don't show if already installed or dismissed recently
  if (window.matchMedia('(display-mode: standalone)').matches) return;
  if (navigator.standalone) return;
  // Reading storage throws outright in Safari private browsing and wherever
  // site data is blocked; treat that as "not dismissed" rather than letting it
  // abort the rest of this handler.
  try {
    if (sessionStorage.getItem('pwa-install-dismissed')) return;
  } catch (e) {
    /* storage unavailable — fall through and show the banner */
  }

  var existing = document.querySelector('.pwa-install-banner');
  if (existing) return;

  var banner = document.createElement('div');
  banner.className = 'pwa-install-banner';
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'polite');
  banner.innerHTML =
    '<div class="pwa-install-content">' +
    '<i class="bi bi-download" aria-hidden="true"></i>' +
    '<span>Install BetterLegazpi for quick access to services.</span>' +
    '</div>' +
    '<div class="pwa-install-actions">' +
    '<button class="pwa-install-btn" aria-label="Install BetterLegazpi app">Install</button>' +
    '<button class="pwa-install-dismiss" aria-label="Dismiss install prompt">&times;</button>' +
    '</div>';

  document.body.appendChild(banner);

  banner.querySelector('.pwa-install-btn').addEventListener('click', function () {
    if (!deferredInstallPrompt) return;
    deferredInstallPrompt.prompt();
    deferredInstallPrompt.userChoice.then(function () {
      deferredInstallPrompt = null;
      banner.remove();
    });
  });

  banner.querySelector('.pwa-install-dismiss').addEventListener('click', function () {
    try {
      sessionStorage.setItem('pwa-install-dismissed', '1');
    } catch (e) {
      /* dismissal will not persist, but the banner still closes */
    }
    banner.remove();
  });
}

// ─── Register Service Worker with seamless updates ──────────────────────────
if ('serviceWorker' in navigator) {
  var isLocalhost =
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === '';

  if (isLocalhost) {
    // Unregister any existing service worker on localhost to prevent stale caching during dev
    navigator.serviceWorker.getRegistrations().then(function (registrations) {
      for (var reg of registrations) {
        reg.unregister();
      }
    });
    if ('caches' in window) {
      caches.keys().then(function (names) {
        for (var name of names) {
          caches.delete(name);
        }
      });
    }
  } else {
    window.addEventListener('load', function () {
      navigator.serviceWorker
        .register('/sw.js')
        .then(function (reg) {
          // Check for updates every 30 minutes
          setInterval(
            function () {
              reg.update();
            },
            30 * 60 * 1000
          );

          reg.addEventListener('updatefound', function () {
            var newWorker = reg.installing;
            if (!newWorker) return;
            newWorker.addEventListener('statechange', function () {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New SW installed and waiting — show update banner
                showUpdateBanner(newWorker);
              }
            });
          });
        })
        .catch(function (err) {
          console.warn('SW registration failed:', err);
        });

      var hadController = !!navigator.serviceWorker.controller;
      var refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', function () {
        if (!hadController || refreshing) return;
        refreshing = true;
        window.location.reload();
      });
    });
  }
}

function showUpdateBanner(worker) {
  var existing = document.querySelector('.sw-update-banner');
  if (existing) existing.remove();

  var banner = document.createElement('div');
  banner.setAttribute('role', 'alert');
  banner.setAttribute('aria-live', 'polite');
  banner.className = 'sw-update-banner';
  banner.innerHTML =
    '<span>A new version is available.</span>' +
    '<button class="sw-update-btn" aria-label="Update now">Update</button>' +
    '<button class="sw-update-dismiss" aria-label="Dismiss update notice">&times;</button>';

  document.body.appendChild(banner);

  banner.querySelector('.sw-update-btn').addEventListener('click', function () {
    worker.postMessage({ type: 'SKIP_WAITING' });
    banner.remove();
  });

  banner.querySelector('.sw-update-dismiss').addEventListener('click', function () {
    banner.remove();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  // Prevent double-click on navigation and header links from causing unintended behavior
  const headerLinks = document.querySelectorAll('.site-header a, .main-nav a, .logo-container a');
  headerLinks.forEach((link) => {
    // Prevent text selection on double-click
    link.addEventListener('mousedown', (e) => {
      if (e.detail > 1) {
        e.preventDefault();
      }
    });

    // Handle double-click explicitly
    link.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      // Stay on current link's destination (don't redirect elsewhere)
      if (link.href && !link.href.startsWith('javascript:')) {
        window.location.href = link.href;
      }
    });
  });

  // Prevent double-click text selection on entire header
  const siteHeader = document.querySelector('.site-header');
  if (siteHeader) {
    siteHeader.addEventListener('mousedown', (e) => {
      if (e.detail > 1) {
        e.preventDefault();
      }
    });
  }

  // Utility: detect mobile breakpoint
  var isMobileNav = function () {
    return window.matchMedia('(max-width: 1024px)').matches;
  };

  // Hotline Marquee (tablet + mobile)
  var initHotlineMarquee = function () {
    var isTabletOrBelow = function () {
      return window.matchMedia('(max-width: 1024px)').matches;
    };
    var hotlineItems = document.querySelector('.hotline-items');
    if (!hotlineItems) return;

    var track = null;
    var originalItems = Array.from(hotlineItems.children);

    var buildMarquee = function () {
      if (!isTabletOrBelow() || track) return;
      track = document.createElement('div');
      track.className = 'hotline-items-track';
      track.setAttribute('aria-label', 'Emergency contacts scrolling');
      while (hotlineItems.firstChild) {
        track.appendChild(hotlineItems.firstChild);
      }
      originalItems.forEach(function (item) {
        var clone = item.cloneNode(true);
        clone.setAttribute('aria-hidden', 'true');
        clone.setAttribute('tabindex', '-1');
        track.appendChild(clone);
      });
      hotlineItems.appendChild(track);
    };

    var destroyMarquee = function () {
      if (!track) return;
      while (hotlineItems.firstChild) {
        hotlineItems.removeChild(hotlineItems.firstChild);
      }
      originalItems.forEach(function (item) {
        hotlineItems.appendChild(item);
      });
      track = null;
    };

    var handleResize = function () {
      if (isTabletOrBelow()) {
        buildMarquee();
      } else {
        destroyMarquee();
      }
    };

    handleResize();
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(handleResize, 150);
    });
  };

  initHotlineMarquee();

  // Mobile Menu Toggle
  var createMobileMenu = function () {
    var headerInner = document.querySelector('.header-inner');
    var nav = document.querySelector('.main-nav');

    if (!headerInner || !nav) return;

    var toggleBtn = document.createElement('button');
    toggleBtn.className = 'mobile-menu-toggle btn btn-secondary';
    toggleBtn.innerHTML = '<i class="bi bi-list" aria-hidden="true"></i>';
    toggleBtn.setAttribute('aria-label', 'Toggle Navigation');
    toggleBtn.setAttribute('aria-expanded', 'false');
    toggleBtn.setAttribute('aria-controls', 'main-nav');
    nav.setAttribute('id', 'main-nav');

    var actions = document.querySelector('.header-actions');
    if (actions) {
      headerInner.insertBefore(toggleBtn, actions);
    } else {
      headerInner.appendChild(toggleBtn);
    }

    // Get focusable elements within menu for focus trap
    var getFocusableElements = function () {
      return nav.querySelectorAll('a[href], button:not([disabled])');
    };

    var closeAllDropdowns = function () {
      var openItems = nav.querySelectorAll('.has-dropdown.dropdown-open');
      for (var i = 0; i < openItems.length; i++) {
        openItems[i].classList.remove('dropdown-open');
        var t = openItems[i].querySelector('a[aria-haspopup]');
        if (t) t.setAttribute('aria-expanded', 'false');
      }
    };

    var scrollY = 0;

    var lockBodyScroll = function () {
      scrollY = window.scrollY;
      document.body.classList.add('mobile-menu-open');
      document.body.style.top = '-' + scrollY + 'px';
    };

    var unlockBodyScroll = function () {
      document.body.classList.remove('mobile-menu-open');
      document.body.style.top = '';
      window.scrollTo(0, scrollY);
    };

    var isAnimating = false;

    var closeMobileMenu = function () {
      if (isAnimating) return;
      isAnimating = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
      nav.classList.remove('active');
      toggleBtn.innerHTML = '<i class="bi bi-list" aria-hidden="true"></i>';
      closeAllDropdowns();
      unlockBodyScroll();
      setTimeout(function () {
        isAnimating = false;
      }, 320);
    };

    var openMobileMenu = function () {
      if (isAnimating) return;
      isAnimating = true;
      toggleBtn.setAttribute('aria-expanded', 'true');
      nav.classList.add('active');
      toggleBtn.innerHTML = '<i class="bi bi-x-lg" aria-hidden="true"></i>';
      lockBodyScroll();
      setTimeout(function () {
        isAnimating = false;
      }, 320);
    };

    toggleBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        closeMobileMenu();
        toggleBtn.focus();
      } else {
        openMobileMenu();
      }
    });

    // Click outside to close mobile menu
    document.addEventListener('click', function (e) {
      if (!isMobileNav()) return;
      if (!nav.classList.contains('active')) return;
      if (nav.contains(e.target) || toggleBtn.contains(e.target)) return;
      closeMobileMenu();
    });

    // Close mobile menu when a non-dropdown nav link is clicked
    nav.addEventListener('click', function (e) {
      if (!isMobileNav()) return;
      var link = e.target.closest('a');
      if (!link) return;
      // If it's a dropdown trigger, don't close menu (handled by dropdown init)
      if (link.getAttribute('aria-haspopup') === 'true') return;
      if (
        link.parentElement &&
        link.parentElement.classList.contains('has-dropdown') &&
        link.parentElement.querySelector('.dropdown-menu')
      )
        return;
      closeMobileMenu();
    });

    // Escape key to close mobile menu
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && nav.classList.contains('active')) {
        closeMobileMenu();
        toggleBtn.focus();
      }
    });

    // Focus trap for mobile menu
    nav.addEventListener('keydown', function (e) {
      if (!nav.classList.contains('active')) return;
      if (e.key !== 'Tab') return;

      var focusable = getFocusableElements();
      if (focusable.length === 0) return;
      var firstEl = focusable[0];
      var lastEl = focusable[focusable.length - 1];

      if (e.shiftKey && document.activeElement === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && document.activeElement === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    });

    // Clean up on resize: if resized to desktop, reset mobile state (debounced)
    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (!isMobileNav() && nav.classList.contains('active')) {
          isAnimating = false; // force allow close on resize
          closeMobileMenu();
        }
      }, 150);
    });
  };

  createMobileMenu();

  // Dropdown handling: mobile touch/click toggle + desktop keyboard navigation (WCAG 2.1)
  var initDropdowns = function () {
    var dropdownItems = document.querySelectorAll('.has-dropdown');

    dropdownItems.forEach(function (item) {
      var trigger = item.querySelector('a[aria-haspopup]') || item.querySelector(':scope > a');
      var menu = item.querySelector('.dropdown-menu');

      if (!trigger || !menu) return;

      // Ensure ARIA attributes are present for accessibility
      if (!trigger.hasAttribute('aria-haspopup')) {
        trigger.setAttribute('aria-haspopup', 'true');
      }
      if (!trigger.hasAttribute('aria-expanded')) {
        trigger.setAttribute('aria-expanded', 'false');
      }

      var menuLinks = menu.querySelectorAll('a');

      var openDropdown = function () {
        // Close sibling dropdowns first
        var siblings = item.parentElement.querySelectorAll('.has-dropdown.dropdown-open');
        for (var i = 0; i < siblings.length; i++) {
          if (siblings[i] !== item) {
            siblings[i].classList.remove('dropdown-open');
            var st = siblings[i].querySelector('a[aria-haspopup]');
            if (st) st.setAttribute('aria-expanded', 'false');
          }
        }
        item.classList.add('dropdown-open');
        trigger.setAttribute('aria-expanded', 'true');
      };

      var closeDropdown = function () {
        item.classList.remove('dropdown-open');
        trigger.setAttribute('aria-expanded', 'false');
      };

      // Mobile: tap/click on dropdown trigger toggles submenu instead of navigating
      trigger.addEventListener('click', function (e) {
        if (!isMobileNav()) return;
        e.preventDefault();
        e.stopPropagation();
        if (item.classList.contains('dropdown-open')) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      // iOS Safari: ensure touch events trigger dropdown reliably
      trigger.addEventListener('touchend', function (e) {
        if (!isMobileNav()) return;
        e.preventDefault();
        if (item.classList.contains('dropdown-open')) {
          closeDropdown();
        } else {
          openDropdown();
        }
      });

      // Keyboard: arrow-down opens dropdown and moves to first item
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'Down') {
          e.preventDefault();
          openDropdown();
          if (menuLinks[0]) menuLinks[0].focus();
        } else if (e.key === 'Enter' || e.key === ' ') {
          if (isMobileNav()) {
            e.preventDefault();
            if (item.classList.contains('dropdown-open')) {
              closeDropdown();
            } else {
              openDropdown();
              if (menuLinks[0]) menuLinks[0].focus();
            }
          }
        }
      });

      // Navigate within dropdown with arrow keys
      menuLinks.forEach(function (link, index) {
        link.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown' || e.key === 'Down') {
            e.preventDefault();
            var next = menuLinks[index + 1] || menuLinks[0];
            next.focus();
          } else if (e.key === 'ArrowUp' || e.key === 'Up') {
            e.preventDefault();
            var prev = menuLinks[index - 1] || menuLinks[menuLinks.length - 1];
            prev.focus();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeDropdown();
            trigger.focus();
          } else if (e.key === 'Tab' && !e.shiftKey && index === menuLinks.length - 1) {
            closeDropdown();
          }
        });
      });

      // Close dropdown when focus leaves the item entirely
      item.addEventListener('focusout', function () {
        setTimeout(function () {
          if (!item.contains(document.activeElement)) {
            closeDropdown();
          }
        }, 100);
      });
    });

    // Desktop: click outside any open dropdown closes them
    document.addEventListener('click', function (e) {
      if (isMobileNav()) return;
      dropdownItems.forEach(function (item) {
        if (!item.contains(e.target)) {
          item.classList.remove('dropdown-open');
          var t = item.querySelector('a[aria-haspopup]');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    });
  };

  initDropdowns();

  // No language handling here: the site currently ships in English only.
  // The inherited BetterLegazpi City TranslationEngine was removed along with its
  // translations.js — no page carries data-i18n attributes or a language
  // toggle. Multi-language (English, Filipino, Bicol) is planned for a later
  // iteration and should be built as per-locale files fetched on demand,
  // not as a single bundle loaded on every page.

  // Dynamic copyright year
  const yearElement = document.getElementById('copyright-year');
  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }

  // FAQ Accordion Functionality
  const initAccordion = () => {
    const accordionTriggers = document.querySelectorAll('.accordion-trigger');

    if (accordionTriggers.length === 0) return;

    accordionTriggers.forEach((trigger) => {
      trigger.addEventListener('click', function () {
        const accordionItem = this.closest('.accordion-item');
        const isActive = accordionItem.classList.contains('active');
        const accordionContent = accordionItem.querySelector('.accordion-content');

        // Close all other accordion items (optional - remove for multi-open)
        const allItems = document.querySelectorAll('.accordion-item');
        allItems.forEach((item) => {
          if (item !== accordionItem) {
            item.classList.remove('active');
            item.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'false');
          }
        });

        // Toggle current item
        if (isActive) {
          accordionItem.classList.remove('active');
          this.setAttribute('aria-expanded', 'false');
        } else {
          accordionItem.classList.add('active');
          this.setAttribute('aria-expanded', 'true');
        }
      });

      // Keyboard accessibility
      trigger.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          this.click();
        }
      });
    });

    // Open first accordion item by default (optional)
    // const firstItem = document.querySelector('.accordion-item');
    // if (firstItem) {
    //     firstItem.classList.add('active');
    //     firstItem.querySelector('.accordion-trigger').setAttribute('aria-expanded', 'true');
    // }
  };

  initAccordion();

  // Education Category Accordion
  const initEduAccordion = () => {
    const categoryHeaders = document.querySelectorAll('.edu-category-header');

    categoryHeaders.forEach((header) => {
      header.addEventListener('click', function () {
        const content = this.nextElementSibling;
        const isExpanded = this.getAttribute('aria-expanded') === 'true';

        if (isExpanded) {
          content.hidden = true;
          this.setAttribute('aria-expanded', 'false');
        } else {
          content.hidden = false;
          this.setAttribute('aria-expanded', 'true');
        }
      });
    });
  };

  initEduAccordion();

  // Education School Node Expand via Event Delegation
  const initEduSchoolExpand = () => {
    document.addEventListener('click', (e) => {
      const card = e.target.closest('.edu-school-item.is-expandable');
      if (!card) return;

      // If clicking directly on an anchor tag (link), do not toggle card
      if (e.target.closest('a')) return;

      const details = card.querySelector('.edu-school-details');
      if (!details) return;

      const isExpanded = card.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        details.hidden = true;
        card.setAttribute('aria-expanded', 'false');
      } else {
        details.hidden = false;
        card.setAttribute('aria-expanded', 'true');
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const card = e.target.closest('.edu-school-item.is-expandable');
      if (!card) return;

      if (e.target.closest('a')) return;

      const details = card.querySelector('.edu-school-details');
      if (!details) return;

      e.preventDefault();
      const isExpanded = card.getAttribute('aria-expanded') === 'true';
      if (isExpanded) {
        details.hidden = true;
        card.setAttribute('aria-expanded', 'false');
      } else {
        details.hidden = false;
        card.setAttribute('aria-expanded', 'true');
      }
    });
  };

  initEduSchoolExpand();

  // Education Directory Real-Time Search & Filter
  const initEduSearchAndFilter = () => {
    const searchInput = document.getElementById('edu-school-search');
    const searchClear = document.getElementById('edu-search-clear');
    const filterPills = document.querySelectorAll('.edu-filter-pill');

    if (!searchInput) return;

    let activeFilter = 'all';

    const filterSchools = () => {
      const query = searchInput.value.trim().toLowerCase();

      if (query.length > 0) {
        if (searchClear) searchClear.hidden = false;
      } else {
        if (searchClear) searchClear.hidden = true;
      }

      const categories = document.querySelectorAll('.edu-category');

      categories.forEach((cat) => {
        const header = cat.querySelector('.edu-category-header');
        const content = cat.querySelector('.edu-category-content');
        const cards = cat.querySelectorAll('.edu-school-item');
        let visibleCount = 0;

        cards.forEach((card) => {
          const text = card.textContent.toLowerCase();
          const matchesQuery = !query || text.includes(query);

          // Type matching (Public / Private / SUC)
          let matchesType = true;
          if (activeFilter !== 'all') {
            const badge = card.querySelector('.badge-type');
            const typeText = badge ? badge.textContent.trim().toLowerCase() : '';
            matchesType = typeText === activeFilter;
          }

          if (matchesQuery && matchesType) {
            card.style.display = '';
            visibleCount++;
          } else {
            card.style.display = 'none';
          }
        });

        // Auto expand category accordion if user is actively searching/filtering and matching cards exist
        if ((query || activeFilter !== 'all') && visibleCount > 0) {
          if (content) content.hidden = false;
          if (header) header.setAttribute('aria-expanded', 'true');
        }
      });
    };

    searchInput.addEventListener('input', filterSchools);

    if (searchClear) {
      searchClear.addEventListener('click', () => {
        searchInput.value = '';
        filterSchools();
        searchInput.focus();
      });
    }

    filterPills.forEach((pill) => {
      pill.addEventListener('click', function () {
        filterPills.forEach((p) => {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        });
        this.classList.add('active');
        // Without this the selected filter is conveyed by colour alone, which
        // a screen-reader user cannot perceive. These are toggle buttons in a
        // group, not tabs, so aria-pressed is the correct state to expose.
        this.setAttribute('aria-pressed', 'true');
        activeFilter = this.getAttribute('data-filter') || 'all';
        filterSchools();
      });
    });
  };

  try {
    initEduSearchAndFilter();
  } catch (err) {
    console.error('Education search initialization error:', err);
  }

  // ─── Universal Theme Toggle (Light / Dark Mode) ──────────────────────────
  function initThemeToggle() {
    const toggleBtns = document.querySelectorAll('#theme-toggle, .theme-toggle-btn');
    if (!toggleBtns || toggleBtns.length === 0) return;

    function updateToggleIcons() {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      toggleBtns.forEach((btn) => {
        const icon = btn.querySelector('i');
        if (icon) {
          if (isDark) {
            icon.className = 'bi bi-sun-fill';
            btn.setAttribute('aria-label', 'Switch to light mode');
            btn.setAttribute('title', 'Switch to light mode');
          } else {
            icon.className = 'bi bi-moon-stars-fill';
            btn.setAttribute('aria-label', 'Switch to dark mode');
            btn.setAttribute('title', 'Switch to dark mode');
          }
        }
      });
    }

    updateToggleIcons();

    // Storage can throw outright (Safari private browsing, cookies blocked), so
    // every access is guarded: the theme still applies, it just isn't remembered.
    function readStoredTheme() {
      try {
        return localStorage.getItem('theme');
      } catch (e) {
        return null;
      }
    }

    function storeTheme(theme) {
      try {
        localStorage.setItem('theme', theme);
      } catch (e) {
        /* not remembered across visits; the page still renders correctly */
      }
    }

    function setTheme(theme) {
      if (theme === 'dark') {
        document.documentElement.setAttribute('data-theme', 'dark');
        storeTheme('dark');
      } else {
        document.documentElement.removeAttribute('data-theme');
        storeTheme('light');
      }
      updateToggleIcons();
      document.dispatchEvent(new CustomEvent('themechange', { detail: { theme: theme } }));
    }

    toggleBtns.forEach((btn) => {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        setTheme(newTheme);
      });
    });

    // Listen for OS system preference changes if user hasn't explicitly set preference
    if (window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', function (e) {
        if (!readStoredTheme()) {
          if (e.matches) {
            document.documentElement.setAttribute('data-theme', 'dark');
          } else {
            document.documentElement.removeAttribute('data-theme');
          }
          updateToggleIcons();
          document.dispatchEvent(
            new CustomEvent('themechange', { detail: { theme: e.matches ? 'dark' : 'light' } })
          );
        }
      });
    }
  }

  initThemeToggle();

  // ─── Language Switcher (English / Filipino / Bikol) ──────────────────────
  // The site ships English-only today. Filipino and Bikol sit in the menu as
  // "coming soon" and are not selectable: the control exists now so the
  // per-locale files planned at the top of this file can be wired in later
  // without editing all 64 pages again. Adding a locale to AVAILABLE (once its
  // strings actually exist) is what makes its menu entry live.
  function initLangSwitcher() {
    const switchers = document.querySelectorAll('.lang-switcher');
    if (!switchers || switchers.length === 0) return;

    const AVAILABLE = ['en'];
    const FALLBACK = 'en';

    // Storage can throw outright (Safari private browsing, cookies blocked), so
    // every access is guarded, exactly as the theme toggle above does.
    function readStoredLang() {
      try {
        return localStorage.getItem('lang');
      } catch (e) {
        return null;
      }
    }

    function storeLang(lang) {
      try {
        localStorage.setItem('lang', lang);
      } catch (e) {
        /* not remembered across visits; the page still renders correctly */
      }
    }

    // A stored locale may have been removed since, or may never have shipped,
    // so anything unrecognised falls back to English rather than blanking out.
    let currentLang = readStoredLang();
    if (AVAILABLE.indexOf(currentLang) === -1) currentLang = FALLBACK;

    function closeMenu(sw) {
      const btn = sw.querySelector('.lang-toggle-btn');
      const menu = sw.querySelector('.lang-menu');
      if (!btn || !menu) return;
      menu.hidden = true;
      sw.classList.remove('lang-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    function openMenu(sw) {
      const btn = sw.querySelector('.lang-toggle-btn');
      const menu = sw.querySelector('.lang-menu');
      if (!btn || !menu) return;
      switchers.forEach(function (other) {
        if (other !== sw) closeMenu(other);
      });
      menu.hidden = false;
      sw.classList.add('lang-open');
      btn.setAttribute('aria-expanded', 'true');
      const active =
        menu.querySelector('.lang-option.is-active') || menu.querySelector('.lang-option');
      if (active) active.focus();
    }

    function applyLang(lang, label, code) {
      currentLang = lang;
      storeLang(lang);
      document.documentElement.setAttribute('lang', lang);
      switchers.forEach(function (sw) {
        const btn = sw.querySelector('.lang-toggle-btn');
        const codeEl = sw.querySelector('.lang-toggle-code');
        if (codeEl) codeEl.textContent = code;
        if (btn) {
          btn.setAttribute('aria-label', 'Change language. Current language: ' + label);
        }
        sw.querySelectorAll('.lang-option').forEach(function (opt) {
          const isActive = opt.getAttribute('data-lang') === lang;
          opt.classList.toggle('is-active', isActive);
          opt.setAttribute('aria-checked', isActive ? 'true' : 'false');
        });
      });
      document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang: lang } }));
    }

    switchers.forEach(function (sw) {
      const btn = sw.querySelector('.lang-toggle-btn');
      const menu = sw.querySelector('.lang-menu');
      if (!btn || !menu) return;
      const options = Array.prototype.slice.call(menu.querySelectorAll('.lang-option'));

      btn.addEventListener('click', function (e) {
        e.preventDefault();
        e.stopPropagation();
        if (menu.hidden) {
          openMenu(sw);
        } else {
          closeMenu(sw);
        }
      });

      btn.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          openMenu(sw);
        }
      });

      options.forEach(function (opt, i) {
        opt.addEventListener('click', function (e) {
          e.preventDefault();
          // aria-disabled rather than the disabled attribute: the entry stays
          // focusable, so a screen reader can reach it and announce that the
          // language is coming rather than skipping past it silently.
          if (opt.getAttribute('aria-disabled') === 'true') return;
          applyLang(
            opt.getAttribute('data-lang'),
            opt.getAttribute('data-lang-label'),
            opt.getAttribute('data-lang-code')
          );
          closeMenu(sw);
          btn.focus();
        });

        opt.addEventListener('keydown', function (e) {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            const dir = e.key === 'ArrowDown' ? 1 : -1;
            options[(i + dir + options.length) % options.length].focus();
          } else if (e.key === 'Home') {
            e.preventDefault();
            options[0].focus();
          } else if (e.key === 'End') {
            e.preventDefault();
            options[options.length - 1].focus();
          } else if (e.key === 'Escape') {
            e.preventDefault();
            closeMenu(sw);
            btn.focus();
          }
        });
      });
    });

    // Clicking anywhere else closes the menu, matching the nav dropdowns above.
    document.addEventListener('click', function (e) {
      switchers.forEach(function (sw) {
        if (!sw.contains(e.target)) closeMenu(sw);
      });
    });

    // Reflect the stored choice on load.
    const initial = document.querySelector('.lang-option[data-lang="' + currentLang + '"]');
    if (initial) {
      applyLang(
        currentLang,
        initial.getAttribute('data-lang-label'),
        initial.getAttribute('data-lang-code')
      );
    }
  }

  initLangSwitcher();
});
