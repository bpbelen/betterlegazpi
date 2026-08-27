/**
 * BetterLegazpi - PhilHealth YAKAP Interactive Controller
 * Handles 4-Pillar Benefit Tabs, Searchable GAMOT Medicines & Labs catalog,
 * Legazpi facilities filtering, FAQ accordion, and sticky navigation.
 */
(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initTabs();
    initCatalogFilter();
    initFacilitiesFilter();
    initFaqAccordion();
    initStickyNavObserver();
    initSubnavHeaderOffset();
  });

  /* --------------------------------------------------------------------------
     1. Benefit Tabs Controller
     -------------------------------------------------------------------------- */
  function initTabs() {
    const tabButtons = document.querySelectorAll('.yakap-tab-btn');
    const tabPanes = document.querySelectorAll('.yakap-tab-pane');

    if (!tabButtons.length || !tabPanes.length) return;

    tabButtons.forEach((btn, index) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-tab');

        // Update button states
        tabButtons.forEach((b) => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-selected', 'true');

        // Update pane states
        tabPanes.forEach((pane) => {
          if (pane.id === targetId) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
      });

      // Keyboard accessibility (Arrow navigation)
      btn.addEventListener('keydown', (e) => {
        let nextIndex = null;
        if (e.key === 'ArrowRight') {
          nextIndex = (index + 1) % tabButtons.length;
        } else if (e.key === 'ArrowLeft') {
          nextIndex = (index - 1 + tabButtons.length) % tabButtons.length;
        }

        if (nextIndex !== null) {
          e.preventDefault();
          tabButtons[nextIndex].focus();
          tabButtons[nextIndex].click();
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     2. Searchable GAMOT Medicines & Diagnostic Tests Catalog
     -------------------------------------------------------------------------- */
  function initCatalogFilter() {
    const searchInput = document.getElementById('yakap-catalog-search');
    const catGroups = document.querySelectorAll('.yakap-cat-group');
    const emptyState = document.getElementById('yakap-catalog-empty');

    if (!catGroups.length) return;

    // Accordion Header click listeners
    catGroups.forEach((group) => {
      const headerBtn = group.querySelector('.yakap-cat-header');
      if (!headerBtn) return;

      headerBtn.addEventListener('click', () => {
        const isExpanded = group.classList.contains('active');
        if (isExpanded) {
          group.classList.remove('active');
          headerBtn.setAttribute('aria-expanded', 'false');
        } else {
          group.classList.add('active');
          headerBtn.setAttribute('aria-expanded', 'true');
        }
      });
    });

    let searchQuery = '';

    function filterItems() {
      let totalVisible = 0;

      catGroups.forEach((group) => {
        const itemCards = group.querySelectorAll('.yakap-item-card');
        let groupVisibleCount = 0;

        itemCards.forEach((card) => {
          const title = (card.querySelector('.yakap-item-title')?.textContent || '').toLowerCase();
          const desc = (card.querySelector('.yakap-item-desc')?.textContent || '').toLowerCase();
          const subtext = (
            card.querySelector('.yakap-item-subtext')?.textContent || ''
          ).toLowerCase();

          const matchesSearch =
            !searchQuery ||
            title.includes(searchQuery) ||
            desc.includes(searchQuery) ||
            subtext.includes(searchQuery);

          if (matchesSearch) {
            card.style.display = 'flex';
            groupVisibleCount++;
            totalVisible++;
          } else {
            card.style.display = 'none';
          }
        });

        if (groupVisibleCount > 0) {
          group.style.display = 'block';
          // Auto-expand group if there is an active search query
          if (searchQuery) {
            group.classList.add('active');
            const headerBtn = group.querySelector('.yakap-cat-header');
            if (headerBtn) headerBtn.setAttribute('aria-expanded', 'true');
          }
        } else {
          group.style.display = 'none';
        }
      });

      if (emptyState) {
        emptyState.style.display = totalVisible === 0 ? 'block' : 'none';
      }
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.trim().toLowerCase();
        filterItems();
      });
    }
  }

  /* --------------------------------------------------------------------------
     3. Legazpi YAKAP Facilities Category Filter
     -------------------------------------------------------------------------- */
  function initFacilitiesFilter() {
    const facPills = document.querySelectorAll('.yakap-fac-filter-pill');
    const facCards = document.querySelectorAll('.yakap-fac-card');

    if (!facPills.length || !facCards.length) return;

    facPills.forEach((pill) => {
      pill.addEventListener('click', () => {
        facPills.forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        const filter = pill.getAttribute('data-fac-filter') || 'all';

        facCards.forEach((card) => {
          const type = card.getAttribute('data-fac-type') || '';
          if (filter === 'all' || type === filter) {
            card.style.display = 'flex';
          } else {
            card.style.display = 'none';
          }
        });
      });
    });
  }

  /* --------------------------------------------------------------------------
     4. FAQ Accordion Controller
     -------------------------------------------------------------------------- */
  function initFaqAccordion() {
    const faqItems = document.querySelectorAll('.yakap-faq-item');

    faqItems.forEach((item) => {
      const questionBtn = item.querySelector('.yakap-faq-question');
      if (!questionBtn) return;

      questionBtn.addEventListener('click', () => {
        const isActive = item.classList.contains('active');

        // Close all other accordion items for clean single-view
        faqItems.forEach((other) => {
          other.classList.remove('active');
          const otherBtn = other.querySelector('.yakap-faq-question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        });

        // Toggle clicked item
        if (!isActive) {
          item.classList.add('active');
          questionBtn.setAttribute('aria-expanded', 'true');
        } else {
          item.classList.remove('active');
          questionBtn.setAttribute('aria-expanded', 'false');
        }
      });
    });
  }

  /* --------------------------------------------------------------------------
     5. Sub-Nav Sticky Offset
     -------------------------------------------------------------------------- */
  /**
   * .site-header is itself sticky at top:0 with a higher z-index (style.css),
   * so the sub-nav's own top:0 would stick at the same coordinate and render
   * hidden behind the header. Measuring the header's live height and writing
   * it as a CSS variable keeps the sub-nav parked directly under the header
   * without hardcoding the header's padding here, which would silently drift
   * the next time the header markup changes.
   */
  function initSubnavHeaderOffset() {
    const header = document.querySelector('.site-header');
    if (!header) return;

    const setOffset = () => {
      document.documentElement.style.setProperty('--yakap-header-h', `${header.offsetHeight}px`);
    };

    setOffset();
    window.addEventListener('resize', setOffset);

    if ('ResizeObserver' in window) {
      new ResizeObserver(setOffset).observe(header);
    }
  }

  /* --------------------------------------------------------------------------
     6. Sticky Sub-Nav Intersection Observer
     -------------------------------------------------------------------------- */
  function prefersReducedMotion() {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function initStickyNavObserver() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.yakap-subnav-link');

    if (!sections.length || !navLinks.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const currentId = entry.target.getAttribute('id');
            navLinks.forEach((link) => {
              if (link.getAttribute('href') === `#${currentId}`) {
                link.classList.add('active');
                // Track the active pill in the sub-nav's own horizontal overflow.
                // scrollIntoView() was scrolling the *page* here, fighting the
                // reader's own scroll on mobile, so drive scrollLeft directly.
                const strip = link.parentElement;
                if (strip && strip.scrollWidth > strip.clientWidth) {
                  strip.scrollTo({
                    left: link.offsetLeft - (strip.clientWidth - link.offsetWidth) / 2,
                    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
                  });
                }
              } else {
                link.classList.remove('active');
              }
            });
          }
        });
      },
      {
        rootMargin: '-20% 0px -70% 0px',
        threshold: 0,
      }
    );

    sections.forEach((sec) => observer.observe(sec));
  }
})();
