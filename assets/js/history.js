/**
 * BetterLegazpi - History Page Interactive Functionality
 */

(function () {
  'use strict';

  // DOM Elements
  const btnConcise = document.getElementById('btn-view-concise');
  const btnComprehensive = document.getElementById('btn-view-comprehensive');
  const viewConcise = document.getElementById('view-concise');
  const viewComprehensive = document.getElementById('view-comprehensive');
  const readTimeDisplay = document.getElementById('read-time-display');
  const progressBar = document.getElementById('history-progress-bar');
  const searchInput = document.getElementById('history-search-input');
  const searchClear = document.getElementById('history-search-clear');
  const searchMatchCount = document.getElementById('search-match-count');
  const btnPrint = document.getElementById('btn-print-history');
  const btnShare = document.getElementById('btn-share-history');
  const chapterLinks = document.querySelectorAll('.chapter-nav-link');
  const mobileEraPills = document.querySelectorAll('.mobile-era-pill');
  const timelineNodes = document.querySelectorAll('.timeline-node');
  const chapterBlocks = document.querySelectorAll('.chapter-block');

  let currentView = 'concise';

  // ==========================================================================
  // View Switcher (Concise vs Comprehensive)
  // ==========================================================================
  function setView(view, updateUrl = true) {
    if (view !== 'concise' && view !== 'comprehensive') {
      view = 'concise';
    }
    currentView = view;

    if (view === 'concise') {
      btnConcise.classList.add('active');
      btnConcise.setAttribute('aria-pressed', 'true');
      btnComprehensive.classList.remove('active');
      btnComprehensive.setAttribute('aria-pressed', 'false');

      viewConcise.classList.add('active');
      viewComprehensive.classList.remove('active');

      if (readTimeDisplay) {
        readTimeDisplay.textContent = '2 min read';
      }
    } else {
      btnComprehensive.classList.add('active');
      btnComprehensive.setAttribute('aria-pressed', 'true');
      btnConcise.classList.remove('active');
      btnConcise.setAttribute('aria-pressed', 'false');

      viewComprehensive.classList.add('active');
      viewConcise.classList.remove('active');

      if (readTimeDisplay) {
        readTimeDisplay.textContent = '8 min read';
      }
    }

    // Re-apply or clear search highlights on view switch
    if (searchInput && searchInput.value.trim().length > 0) {
      performSearch(searchInput.value);
    } else {
      clearSearch();
    }

    // Update URL query param without full page reload
    if (updateUrl) {
      const url = new URL(window.location);
      url.searchParams.set('view', view);
      window.history.replaceState({ view: view }, '', url);
    }
  }

  if (btnConcise && btnComprehensive) {
    btnConcise.addEventListener('click', () => setView('concise'));
    btnComprehensive.addEventListener('click', () => setView('comprehensive'));
  }

  // Handle Initial View from URL query param
  const urlParams = new URLSearchParams(window.location.search);
  const initialView = urlParams.get('view');
  if (initialView === 'comprehensive') {
    setView('comprehensive', false);
  } else {
    setView('concise', false);
  }

  // Listen to popstate (browser back/forward)
  window.addEventListener('popstate', (e) => {
    if (e.state && e.state.view) {
      setView(e.state.view, false);
    } else {
      const params = new URLSearchParams(window.location.search);
      setView(params.get('view') || 'concise', false);
    }
  });

  // ==========================================================================
  // Reading Progress Bar (GPU Transform)
  // ==========================================================================
  function updateProgressBar() {
    if (!progressBar) return;
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    if (docHeight <= 0) {
      progressBar.style.transform = 'scaleX(0)';
      return;
    }
    const scrollRatio = Math.min(1, Math.max(0, scrollTop / docHeight));
    progressBar.style.transform = `scaleX(${scrollRatio})`;
  }

  window.addEventListener('scroll', updateProgressBar, { passive: true });

  // ==========================================================================
  // Timeline Node Jump to Chapter
  // ==========================================================================
  timelineNodes.forEach((node) => {
    node.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = node.getAttribute('data-target');
      if (!targetId) return;

      // Switch to comprehensive view if not active
      if (currentView !== 'comprehensive') {
        setView('comprehensive');
      }

      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ==========================================================================
  // Scrollspy for Chapters (Desktop Sidebar & Mobile Pills)
  // ==========================================================================
  if (window.IntersectionObserver && chapterBlocks.length > 0) {
    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px',
      threshold: 0
    };

    const chapterObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          if (!id) return;

          // Update desktop sidebar
          chapterLinks.forEach((link) => {
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
              link.setAttribute('aria-current', 'true');
            } else {
              link.classList.remove('active');
              link.removeAttribute('aria-current');
            }
          });

          // Update mobile pills
          mobileEraPills.forEach((pill) => {
            if (pill.getAttribute('href') === `#${id}`) {
              pill.classList.add('active');
            } else {
              pill.classList.remove('active');
            }
          });
        }
      });
    }, observerOptions);

    chapterBlocks.forEach((block) => chapterObserver.observe(block));
  }

  // Smooth scroll handler for chapter links
  document.querySelectorAll('.chapter-nav-link, .mobile-era-pill').forEach((link) => {
    link.addEventListener('click', (e) => {
      const targetHref = link.getAttribute('href');
      if (targetHref && targetHref.startsWith('#')) {
        const targetEl = document.querySelector(targetHref);
        if (targetEl) {
          e.preventDefault();
          targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }
    });
  });

  // ==========================================================================
  // Robust In-Page Keyword Search & Filter
  // ==========================================================================
  function removeHighlights() {
    const marks = document.querySelectorAll('mark.history-search-highlight');
    marks.forEach((mark) => {
      const parent = mark.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
  }

  function clearSearch() {
    removeHighlights();
    if (searchMatchCount) {
      searchMatchCount.textContent = '';
      searchMatchCount.className = 'search-match-count';
    }
    if (searchClear) {
      searchClear.style.display = 'none';
    }
    chapterBlocks.forEach((block) => {
      block.style.display = '';
    });
  }

  function highlightMatchesInContainer(container, regex) {
    if (!container) return 0;
    const textNodes = [];
    const walker = document.createTreeWalker(
      container,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function (node) {
          if (!node.nodeValue || !node.nodeValue.trim()) {
            return NodeFilter.FILTER_REJECT;
          }
          const parent = node.parentElement;
          if (
            parent &&
            (parent.tagName === 'SCRIPT' ||
              parent.tagName === 'STYLE' ||
              parent.tagName === 'MARK' ||
              parent.classList.contains('reading-toolbar-wrapper'))
          ) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      },
      false
    );

    while (walker.nextNode()) {
      if (regex.test(walker.currentNode.nodeValue)) {
        textNodes.push(walker.currentNode);
      }
    }

    let matchCount = 0;
    textNodes.forEach((node) => {
      const val = node.nodeValue;
      const matches = val.match(regex);
      if (matches) {
        matchCount += matches.length;
      }
      const span = document.createElement('span');
      span.innerHTML = val.replace(regex, '<mark class="history-search-highlight">$1</mark>');
      if (node.parentNode) {
        node.parentNode.replaceChild(span, node);
      }
    });

    return matchCount;
  }

  function performSearch(query) {
    removeHighlights();
    if (!query || query.trim().length === 0) {
      clearSearch();
      return;
    }

    const trimmed = query.trim();
    if (searchClear) {
      searchClear.style.display = 'block';
    }

    const regex = new RegExp(`(${escapeRegExp(trimmed)})`, 'gi');
    let totalMatches = 0;

    const activeContainer = currentView === 'concise' ? viewConcise : viewComprehensive;

    if (currentView === 'comprehensive') {
      const lowerQuery = trimmed.toLowerCase();
      chapterBlocks.forEach((block) => {
        const text = block.textContent.toLowerCase();
        if (text.includes(lowerQuery)) {
          block.style.display = '';
          const count = highlightMatchesInContainer(block, regex);
          totalMatches += count;
        } else {
          block.style.display = 'none';
        }
      });
    } else if (activeContainer) {
      totalMatches = highlightMatchesInContainer(activeContainer, regex);
    }

    // Also check quick facts bento grid
    const bentoSection = document.querySelector('.history-bento-section');
    if (bentoSection) {
      const bentoMatches = highlightMatchesInContainer(bentoSection, regex);
      totalMatches += bentoMatches;
    }

    // Update match count badge
    if (searchMatchCount) {
      if (totalMatches > 0) {
        searchMatchCount.textContent = `${totalMatches} match${totalMatches === 1 ? '' : 'es'}`;
        searchMatchCount.className = 'search-match-count has-matches';
      } else {
        searchMatchCount.textContent = 'No matches';
        searchMatchCount.className = 'search-match-count no-matches';
      }
    }
  }

  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  if (searchInput) {
    let debounceTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        performSearch(searchInput.value);
      }, 150);
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        performSearch(searchInput.value);
        const firstMark = document.querySelector('mark.history-search-highlight');
        if (firstMark) {
          firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    });
  }

  if (searchClear) {
    searchClear.addEventListener('click', () => {
      if (searchInput) {
        searchInput.value = '';
        searchInput.focus();
      }
      clearSearch();
    });
  }

  // ==========================================================================
  // Action Buttons (Print & Share)
  // ==========================================================================
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  if (btnShare) {
    btnShare.addEventListener('click', async () => {
      const shareUrl = window.location.href;
      if (navigator.clipboard) {
        try {
          await navigator.clipboard.writeText(shareUrl);
          const originalText = btnShare.innerHTML;
          btnShare.innerHTML = '<i class="bi bi-check2"></i> Copied Link!';
          setTimeout(() => {
            btnShare.innerHTML = originalText;
          }, 2500);
        } catch (err) {
          console.error('Failed to copy', err);
        }
      }
    });
  }
})();
