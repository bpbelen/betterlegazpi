/* BetterLegazpi - Enhanced Search Functionality */
/* Updated: 2025-12-05 */

(function () {
  'use strict';

  // Services database
  let servicesData = [];
  let isDataLoaded = false;
  let searchIndex = null;

  // Search analytics storage
  const ANALYTICS_KEY = 'betterlegazpi_search_analytics';
  const RECENT_SEARCHES_KEY = 'betterlegazpi_recent_searches';
  const MAX_RECENT_SEARCHES = 10;
  const MAX_ANALYTICS_ENTRIES = 100;

  // How many of each kind the dropdown shows at once.
  const SERVICE_RESULT_LIMIT = 8;
  const PAGE_RESULT_LIMIT = 4;
  const WEAK_RESULT_LIMIT = 4;

  /** Below this, a loose match is noise rather than a suggestion worth offering. */
  const WEAK_SCORE_FLOOR = 15;

  /**
   * Below this many confident results, the weak matches are offered under
   * "Not exactly what you're looking for?". Above it, they stay hidden — there
   * is no reason to show near-misses when there are already good answers.
   */
  const WEAK_THRESHOLD = 3;

  /**
   * Short labels for the category chips. The chips used to be built by taking
   * the first word of each category name, which produced "Certificates",
   * "Business", "Tax" — ambiguous once more categories exist. Keyed by the
   * categoryId used across data/service-categories.json and the hubs.
   */
  const CATEGORY_CHIP_LABELS = {
    agriculture: 'Agriculture',
    business: 'Business',
    certificates: 'Certificates',
    education: 'Education',
    employment: 'Jobs',
    environment: 'Environment',
    health: 'Health',
    housing: 'Housing',
    infrastructure: 'Building',
    'social-services': 'Social',
    'tax-payments': 'Tax',
    utilities: 'Utilities',
  };

  // Popular searches (curated + dynamic)
  const CURATED_POPULAR = [
    'birth certificate',
    'business permit',
    'cedula',
    'real property tax',
    'senior citizen id',
    'pwd id',
    'barangay clearance',
    'building permit',
    'marriage certificate',
    'death certificate',
    'tricycle franchise',
    'property declaration',
    'online payment',
    'mswdo',
    'slaughterhouse',
  ];

  /**
   * Relative prefix back to the site root, so data/ and result URLs resolve from
   * any depth. Derived from the path rather than a list of known directories:
   * the old hardcoded list had grown stale and omitted /tourism/, /legislative/,
   * /budget/ and /history/, where the fetch would have 404'd.
   *
   * Works for both real ".html" paths and the clean URLs serve.py and .htaccess
   * rewrite: a trailing segment with no dot is treated as a directory index.
   */
  function getBasePath() {
    const path = window.location.pathname;
    const segments = path.split('/').filter(Boolean);

    // A final segment containing a dot is a file, not a directory to climb out of.
    if (segments.length && segments[segments.length - 1].includes('.')) segments.pop();

    return segments.length ? '../'.repeat(segments.length) : '';
  }

  // ==================== SEARCH INDEX ====================

  // Build search index for faster lookups
  function buildSearchIndex(services) {
    const index = {
      titleIndex: new Map(),
      keywordIndex: new Map(),
      categoryIndex: new Map(),
      officeIndex: new Map(),
      allTerms: new Set(),
    };

    services.forEach((service, idx) => {
      // Index title words
      const titleWords = tokenize(service.title);
      titleWords.forEach((word) => {
        if (!index.titleIndex.has(word)) index.titleIndex.set(word, []);
        index.titleIndex.get(word).push(idx);
        index.allTerms.add(word);
      });

      // Index keywords
      (service.keywords || []).forEach((keyword) => {
        const kw = keyword.toLowerCase();
        if (!index.keywordIndex.has(kw)) index.keywordIndex.set(kw, []);
        index.keywordIndex.get(kw).push(idx);
        index.allTerms.add(kw);
      });

      // Index category
      const catWords = tokenize(service.category);
      catWords.forEach((word) => {
        if (!index.categoryIndex.has(word)) index.categoryIndex.set(word, []);
        index.categoryIndex.get(word).push(idx);
      });

      // Index office
      if (service.office) {
        const officeWords = tokenize(service.office);
        officeWords.forEach((word) => {
          if (!index.officeIndex.has(word)) index.officeIndex.set(word, []);
          index.officeIndex.get(word).push(idx);
        });
      }
    });

    return index;
  }

  // Tokenize text into searchable words
  function tokenize(text) {
    if (!text) return [];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length >= 2);
  }

  // ==================== FUZZY MATCHING ====================

  /**
   * Damerau-Levenshtein (optimal string alignment): edit distance that counts a
   * transposition as one edit rather than two. Plain Levenshtein scored
   * "brith" against "birth" as distance 2 — a 0.6 similarity that fell below
   * every threshold — even though swapped adjacent letters are the single most
   * common typing mistake.
   */
  function levenshteinDistance(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= a.length; j++) {
      matrix[0][j] = j;
    }

    for (let i = 1; i <= b.length; i++) {
      for (let j = 1; j <= a.length; j++) {
        const cost = b.charAt(i - 1) === a.charAt(j - 1) ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + cost,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
        if (
          i > 1 &&
          j > 1 &&
          b.charAt(i - 1) === a.charAt(j - 2) &&
          b.charAt(i - 2) === a.charAt(j - 1)
        ) {
          matrix[i][j] = Math.min(matrix[i][j], matrix[i - 2][j - 2] + 1);
        }
      }
    }
    return matrix[b.length][a.length];
  }

  /**
   * Whether `term` is a near-miss for any single word in `text`.
   *
   * isFuzzyMatch compares a term against a whole string, which works for a
   * one-word target and fails completely for a sentence: "helth" against
   * "Getting a health card issued" is a huge edit distance, so a one-letter
   * typo used to return nothing at all. Comparing word by word is what makes
   * the "Not exactly what you're looking for?" suggestions work.
   */
  function fuzzyWordMatch(term, text) {
    if (!text || term.length < 4) return false;
    return tokenize(text).some((word) => word.length >= 4 && isFuzzyMatch(term, word, 0.25));
  }

  // Check if terms are similar (fuzzy match)
  function isFuzzyMatch(term, target, threshold = 0.3) {
    if (target.includes(term) || term.includes(target)) return true;
    if (target.startsWith(term) || term.startsWith(target)) return true;

    const distance = levenshteinDistance(term, target);
    const maxLen = Math.max(term.length, target.length);
    const similarity = 1 - distance / maxLen;

    return similarity >= 1 - threshold;
  }

  // Find fuzzy matches in index
  function findFuzzyMatches(term, indexMap) {
    const matches = new Set();

    // Exact match first
    if (indexMap.has(term)) {
      indexMap.get(term).forEach((idx) => matches.add(idx));
    }

    // Fuzzy matches
    indexMap.forEach((indices, key) => {
      if (isFuzzyMatch(term, key)) {
        indices.forEach((idx) => matches.add(idx));
      }
    });

    return matches;
  }

  // ==================== DATA LOADING ====================

  /**
   * data/search-index.json is generated by scripts/data/build-search-index.js
   * from the office charters in data/offices/. It carries every charter service
   * (264) plus the section pages, where the old data/services.json held only 50
   * curated entries covering 9 of the 13 categories — which is why searches for
   * "health", "education" or "YAKAP" used to return nothing useful.
   *
   * The two are not merged: the charter describes the same transactions in
   * plainer words, so loading both would return every service twice.
   */
  async function loadServicesData() {
    if (isDataLoaded) return servicesData;

    const basePath = getBasePath();

    try {
      const response = await fetch(`${basePath}data/search-index.json`);
      if (!response.ok) throw new Error('search-index.json unavailable');
      const data = await response.json();
      servicesData = data.entries || [];
      if (!servicesData.length) throw new Error('search-index.json is empty');
    } catch (error) {
      console.warn('Falling back to data/services.json:', error.message);
      try {
        const response = await fetch(`${basePath}data/services.json`);
        if (!response.ok) throw new Error('services.json unavailable');
        const data = await response.json();
        servicesData = (data.services || []).map((s) => ({ type: 'service', ...s }));
      } catch (fallbackError) {
        console.warn('Could not load any search data:', fallbackError.message);
        servicesData = getFallbackServices();
      }
    }

    searchIndex = buildSearchIndex(servicesData);
    isDataLoaded = true;
    return servicesData;
  }

  /** Last resort when neither JSON file can be fetched (offline, first visit). */
  function getFallbackServices() {
    return [
      {
        type: 'service',
        id: 'ccro-on-time-birth',
        title: 'On-Time Registration of Certificate of Live Birth',
        category: 'Certificates & Vital Records',
        categoryId: 'certificates',
        keywords: ['birth', 'birth certificate', 'certificate of live birth', 'colb'],
        office: "City Civil Registrar's Office",
        fee: 'Free (Marital) / ₱300.00 (Non-Marital)',
        processingTime: '2 hours',
        url: 'service-details/city-civil-registrar.html#on-time-birth',
      },
      {
        id: 'bplo-new-business',
        title: 'New Business Permit Application',
        category: 'Business, Trade & Investment',
        keywords: ['business permit', 'bpls', 'new business', 'mayors permit'],
        office: 'Business Permits & Licensing Office',
        fee: 'Based on capitalization/scale',
        processingTime: '1-3 days',
        url: 'service-details/business-permits-licensing.html#new-business',
      },
    ];
  }

  // ==================== ENHANCED SEARCH ====================

  const EMPTY_RESULTS = { services: [], pages: [], weak: [], total: 0 };

  function searchServices(query, services, options = {}) {
    if (!query || query.length < 2) return EMPTY_RESULTS;

    const { category = null, limit = SERVICE_RESULT_LIMIT } = options;
    const searchTerms = tokenize(query);
    if (searchTerms.length === 0) return EMPTY_RESULTS;

    const candidateIndices = new Set();

    // Use index for fast candidate lookup
    if (searchIndex) {
      searchTerms.forEach((term) => {
        // Title matches (highest priority)
        findFuzzyMatches(term, searchIndex.titleIndex).forEach((idx) => candidateIndices.add(idx));
        // Keyword matches
        findFuzzyMatches(term, searchIndex.keywordIndex).forEach((idx) =>
          candidateIndices.add(idx)
        );
        // Category matches
        findFuzzyMatches(term, searchIndex.categoryIndex).forEach((idx) =>
          candidateIndices.add(idx)
        );
        // Office matches
        findFuzzyMatches(term, searchIndex.officeIndex).forEach((idx) => candidateIndices.add(idx));
      });
    } else {
      // Fallback: check all services
      services.forEach((_, idx) => candidateIndices.add(idx));
    }

    // Score candidates
    const confident = [];
    const weak = [];

    candidateIndices.forEach((idx) => {
      const service = services[idx];
      if (!service) return;

      // Category filter applies to services only; pages carry no category.
      if (category) {
        if (service.type === 'page') return;
        const label = (service.category || '').toLowerCase();
        if (service.categoryId !== category && !label.includes(category.toLowerCase())) return;
      }

      const { score, confident: isConfident } = calculateScore(service, searchTerms, query);
      if (score <= 0) return;

      const entry = { ...service, score, _query: query };
      (isConfident ? confident : weak).push(entry);
    });

    const byScore = (a, b) => b.score - a.score;
    confident.sort(byScore);
    weak.sort(byScore);

    // Services lead: someone searching a city site usually wants a transaction
    // they can complete, not the landing page that describes it.
    const services_ = confident.filter((r) => r.type !== 'page').slice(0, limit);
    const pages = confident.filter((r) => r.type === 'page').slice(0, PAGE_RESULT_LIMIT);

    return {
      services: services_,
      pages,
      // Shown under "Not exactly what you're looking for?" only — never mixed
      // into the confident list, so a loose match can no longer pose as an answer.
      // The floor keeps out matches so faint they are just noise: "jeepney fare"
      // should not offer financial-assistance services because "fare" is inside
      // "welfare".
      weak: weak.filter((r) => r.score >= WEAK_SCORE_FLOOR).slice(0, WEAK_RESULT_LIMIT),
      total: services_.length + pages.length,
    };
  }

  /**
   * Scores a candidate and decides whether the match is strong enough to present
   * as an answer.
   *
   * A match is "confident" only when the query lines up with something the entry
   * actually is: its title, one of its curated aliases, its category or its
   * office. Everything else — Levenshtein near-misses, a term buried mid-way
   * through a longer alias — scores, but is quarantined into the weak list.
   *
   * This is what stopped "health" from returning the death certificate: that
   * entry matched only because it carried "city health office" as a keyword.
   */
  function calculateScore(service, searchTerms, originalQuery) {
    let score = 0;
    let confident = false;
    // How many of the query's terms this entry matched at all. An entry that
    // answers half the query is much less relevant than one that answers all of
    // it, which is what separates "Registering a birth within 30 days" from
    // "Getting a certificate of occupancy" for the query "brith certificate".
    let matchedTerms = 0;

    const titleLower = service.title.toLowerCase();
    const categoryLower = (service.category || '').toLowerCase();
    const descLower = (service.description || '').toLowerCase();
    const officeLower = (service.office || '').toLowerCase();
    const processingTime = (service.processingTime || '').toLowerCase();
    const keywords = service.keywords || [];
    const queryLower = originalQuery.toLowerCase().trim();

    /** True when `term` appears in `text` as a whole word, not inside another. */
    const hasWord = (text, term) =>
      new RegExp(`(^|[^a-z0-9])${escapeRegex(term)}([^a-z0-9]|$)`, 'i').test(text);

    // Whole-query match on the title is as strong a signal as there is.
    if (titleLower === queryLower) {
      score += 200;
      confident = true;
    } else if (titleLower.includes(queryLower)) {
      score += 100;
      confident = true;
    }

    searchTerms.forEach((term) => {
      const before = score;

      // Title
      if (titleLower === term) {
        score += 80;
        confident = true;
      } else if (titleLower.startsWith(term)) {
        score += 60;
        confident = true;
      } else if (hasWord(titleLower, term)) {
        score += 40;
        confident = true;
      } else if (titleLower.includes(term)) {
        score += 12; // inside a longer word — weak on its own
      } else if (fuzzyWordMatch(term, titleLower)) {
        // A typo against a title word: real enough to suggest, never to assert.
        score += 16;
      }

      // Curated aliases. An alias the query matches whole, or whose leading
      // word it matches, names the thing. A term buried mid-alias does not.
      keywords.forEach((keyword) => {
        const kw = keyword.toLowerCase();
        if (kw === term || kw === queryLower) {
          score += 45;
          confident = true;
        } else if (kw.startsWith(term)) {
          score += 25;
          confident = true;
        } else if (hasWord(kw, term)) {
          score += 10;
        } else if (kw.includes(term)) {
          score += 4;
        } else if (fuzzyWordMatch(term, kw)) {
          score += 9;
        }
      });

      // Category and office name the area of city business the entry sits in.
      if (categoryLower && hasWord(categoryLower, term)) {
        score += 18;
        confident = true;
      } else if (categoryLower.includes(term)) {
        score += 6;
      }

      if (officeLower && hasWord(officeLower, term)) {
        score += 14;
        confident = true;
      } else if (officeLower.includes(term)) {
        score += 5;
      }

      if (descLower.includes(term)) score += 8;
      if (processingTime.includes(term)) score += 4;

      if (score > before) matchedTerms += 1;
    });

    if (searchTerms.length > 1) {
      score *= 0.4 + 0.6 * (matchedTerms / searchTerms.length);
    }

    // Prefer entries a resident can act on: a known fee and processing time
    // mean the page answers "what will this cost me and how long will it take".
    if (service.fee) score += 2;
    if (service.processingTime) score += 2;
    if (service.description) score += 1;

    // Unverified charter entries still rank, just never above a checked one
    // that scored the same.
    if (service.draft) score -= 1;

    /**
     * Length normalisation. A long title collects incidental word matches: for
     * "birth certificate", "Certification of the location named on a birth or
     * marriage certificate" contains both words and used to outrank
     * "Registering a birth within 30 days", which is the service people mean.
     * Discounting by title length is the standard correction, and it favours
     * the short central title a short query is usually reaching for.
     */
    const titleWords = titleLower.split(/\s+/).filter(Boolean).length;
    score = score / (1 + 0.06 * Math.max(0, titleWords - 5));

    return { score, confident };
  }

  // ==================== CATEGORY FILTER ====================

  /**
   * Chips cover services only — pages are not transactions, so filtering them
   * by service category would be meaningless. Ordered by how many services sit
   * in each category so the busiest filters come first.
   */
  function getCategories(services) {
    const counts = new Map();
    services.forEach((service) => {
      if (service.type === 'page') return;
      if (!service.categoryId) return;
      counts.set(service.categoryId, (counts.get(service.categoryId) || 0) + 1);
    });

    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => ({ id, name: CATEGORY_CHIP_LABELS[id] || id }));
  }

  // ==================== RECENT SEARCHES ====================

  function getRecentSearches() {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function addRecentSearch(query) {
    if (!query || query.length < 2) return;

    try {
      let recent = getRecentSearches();
      // Remove if already exists
      recent = recent.filter((q) => q.toLowerCase() !== query.toLowerCase());
      // Add to front
      recent.unshift(query);
      // Limit size
      recent = recent.slice(0, MAX_RECENT_SEARCHES);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent));
    } catch {
      // localStorage not available
    }
  }

  function clearRecentSearches() {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {
      // localStorage not available
    }
  }

  // ==================== SEARCH ANALYTICS ====================

  function trackSearch(query, resultsCount) {
    try {
      let analytics = getSearchAnalytics();
      const existing = analytics.find((a) => a.query.toLowerCase() === query.toLowerCase());

      if (existing) {
        existing.count++;
        existing.lastSearched = Date.now();
      } else {
        analytics.push({
          query: query,
          count: 1,
          resultsCount: resultsCount,
          lastSearched: Date.now(),
        });
      }

      // Sort by count and limit
      analytics.sort((a, b) => b.count - a.count);
      analytics = analytics.slice(0, MAX_ANALYTICS_ENTRIES);

      localStorage.setItem(ANALYTICS_KEY, JSON.stringify(analytics));
    } catch {
      // localStorage not available
    }
  }

  function getSearchAnalytics() {
    try {
      const stored = localStorage.getItem(ANALYTICS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  function getPopularSearches(limit = 5) {
    const analytics = getSearchAnalytics();
    const popular = analytics
      .filter((a) => a.count >= 2)
      .slice(0, limit)
      .map((a) => a.query);

    // Fill with curated if not enough
    if (popular.length < limit) {
      CURATED_POPULAR.forEach((term) => {
        if (popular.length < limit && !popular.includes(term)) {
          popular.push(term);
        }
      });
    }

    return popular;
  }

  // ==================== SEARCH SUGGESTIONS ====================

  function getSuggestions(query, services) {
    if (!query || query.length < 1) {
      // Return popular + recent when no query
      const popular = getPopularSearches(4);
      const recent = getRecentSearches().slice(0, 3);
      return {
        popular: popular,
        recent: recent,
        suggestions: [],
      };
    }

    const queryLower = query.toLowerCase();
    const suggestions = new Set();

    // Add matching service titles
    services.forEach((service) => {
      if (service.title.toLowerCase().includes(queryLower)) {
        suggestions.add(service.title);
      }
    });

    // Add matching keywords
    if (searchIndex) {
      searchIndex.allTerms.forEach((term) => {
        if (term.startsWith(queryLower) && term !== queryLower) {
          suggestions.add(term);
        }
      });
    }

    // Add fuzzy matches from popular searches
    CURATED_POPULAR.forEach((term) => {
      if (term.includes(queryLower) || isFuzzyMatch(queryLower, term, 0.4)) {
        suggestions.add(term);
      }
    });

    return {
      popular: [],
      recent: [],
      suggestions: Array.from(suggestions).slice(0, 8),
    };
  }

  // ==================== UI COMPONENTS ====================

  function createAutocomplete(input) {
    const existingDropdown = input.parentElement.querySelector('.search-autocomplete');
    if (existingDropdown) existingDropdown.remove();

    const dropdown = document.createElement('div');
    dropdown.className = 'search-autocomplete';
    dropdown.setAttribute('role', 'listbox');
    dropdown.setAttribute('aria-label', 'Search suggestions');

    input.parentElement.style.position = 'relative';
    input.parentElement.appendChild(dropdown);

    return dropdown;
  }

  function renderResults(results, dropdown, options = {}) {
    const {
      showSuggestions = false,
      suggestions = {},
      categories = [],
      selectedCategory = null,
    } = options;

    const services = results.services || [];
    const pages = results.pages || [];
    const weak = results.weak || [];

    let html = '';

    // Category filter (if categories provided)
    if (categories.length > 0) {
      html += `
                <div class="search-filters">
                    <button class="search-filter-btn ${!selectedCategory ? 'active' : ''}" data-category="">All</button>
                    ${categories
                      .slice(0, 8)
                      .map(
                        (cat) => `
                        <button class="search-filter-btn ${selectedCategory === cat.id ? 'active' : ''}" data-category="${escapeHtml(cat.id)}">${escapeHtml(cat.name)}</button>
                    `
                      )
                      .join('')}
                </div>
            `;
    }

    // Show suggestions when no results or empty query
    if (showSuggestions && (suggestions.popular?.length || suggestions.recent?.length)) {
      if (suggestions.recent?.length) {
        html += `
                    <div class="search-section">
                        <div class="search-section-header">
                            <span><i class="bi bi-clock-history"></i> Recent Searches</span>
                            <button class="search-clear-recent" type="button">Clear</button>
                        </div>
                        ${suggestions.recent
                          .map(
                            (term) => `
                            <a href="#" class="search-suggestion-item" data-suggestion="${escapeHtml(term)}">
                                <i class="bi bi-arrow-counterclockwise"></i> ${escapeHtml(term)}
                            </a>
                        `
                          )
                          .join('')}
                    </div>
                `;
      }
      if (suggestions.popular?.length) {
        html += `
                    <div class="search-section">
                        <div class="search-section-header">
                            <span><i class="bi bi-fire"></i> Popular Searches</span>
                        </div>
                        ${suggestions.popular
                          .map(
                            (term) => `
                            <a href="#" class="search-suggestion-item" data-suggestion="${escapeHtml(term)}">
                                <i class="bi bi-search"></i> ${escapeHtml(term)}
                            </a>
                        `
                          )
                          .join('')}
                    </div>
                `;
      }
      dropdown.innerHTML = html;
      dropdown.style.display = 'block';
      return;
    }

    // Show autocomplete term suggestions only when nothing at all matched.
    // `results` is an object now, so the old `results.length === 0` was always
    // false-y-undefined and this block rendered alongside good results.
    if (suggestions.suggestions?.length && !services.length && !pages.length) {
      html += `
                <div class="search-section">
                    <div class="search-section-header">
                        <span><i class="bi bi-lightbulb"></i> Did you mean?</span>
                    </div>
                    ${suggestions.suggestions
                      .slice(0, 5)
                      .map(
                        (term) => `
                        <a href="#" class="search-suggestion-item" data-suggestion="${escapeHtml(term)}">
                            <i class="bi bi-search"></i> ${escapeHtml(term)}
                        </a>
                    `
                      )
                      .join('')}
                </div>
            `;
    }

    // No results at all
    if (!services.length && !pages.length && !weak.length) {
      html += `
                <div class="search-no-results">
                    <i class="bi bi-search"></i>
                    <p>Nothing found</p>
                    <small>Try different keywords or check spelling</small>
                </div>
            `;
      dropdown.innerHTML = html;
      dropdown.style.display = 'block';
      return;
    }

    // `index` runs across every rendered result so arrow-key navigation and the
    // selected-item lookup stay in step with the flattened order.
    let index = 0;
    const renderService = (result) => renderResultItem(result, index++, 'service');
    const renderPage = (result) => renderResultItem(result, index++, 'page');

    if (services.length) {
      html += `
                <div class="search-section search-section--results">
                    <div class="search-section-header">
                        <span><i class="bi bi-file-earmark-text"></i> Services</span>
                    </div>
                    ${services.map(renderService).join('')}
                </div>
            `;
    }

    if (pages.length) {
      html += `
                <div class="search-section search-section--results">
                    <div class="search-section-header">
                        <span><i class="bi bi-signpost-2"></i> Pages</span>
                    </div>
                    ${pages.map(renderPage).join('')}
                </div>
            `;
    }

    // Loose matches, kept out of the answers above.
    if (weak.length && services.length + pages.length < WEAK_THRESHOLD) {
      html += `
                <div class="search-section search-section--weak">
                    <div class="search-section-header">
                        <span><i class="bi bi-question-circle"></i> Not exactly what you're looking for?</span>
                    </div>
                    ${weak.map((result) => renderResultItem(result, index++, 'weak')).join('')}
                </div>
            `;
    }

    const shown = services.length + pages.length;
    html += `
            <div class="search-footer">
                <span class="search-footer-count">${shown} result${shown !== 1 ? 's' : ''}</span>
                <span class="search-keyboard-hint">
                    <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                    <span><kbd>Enter</kbd> Select</span>
                    <span><kbd>Esc</kbd> Close</span>
                </span>
            </div>
        `;

    dropdown.innerHTML = html;
    dropdown.style.display = 'block';
  }

  /** One result row. `kind` is 'service', 'page' or 'weak'. */
  function renderResultItem(result, index, kind) {
    let url = result.url || '#';
    if (!url.startsWith('http') && !url.startsWith('/')) {
      url = getBasePath() + url.replace(/^\.\.\//, '');
    }

    const isPage = kind === 'page';
    const meta = [];

    if (result.category) {
      meta.push(
        `<span class="search-result-category"><i class="bi bi-folder"></i> ${escapeHtml(result.category)}</span>`
      );
    }
    if (result.fee) {
      meta.push(
        `<span class="search-result-fee"><i class="bi bi-cash"></i> ${escapeHtml(result.fee)}</span>`
      );
    }
    if (result.processingTime) {
      meta.push(
        `<span class="search-result-time"><i class="bi bi-clock"></i> ${escapeHtml(result.processingTime)}</span>`
      );
    }

    // Every charter entry is currently unverified against the published PDF.
    // Saying so is the difference between a citation and a rumour.
    const draftBadge = result.draft
      ? '<span class="search-result-draft" title="Not yet checked against the published Citizen\'s Charter">Unverified</span>'
      : '';

    return `
            <a href="${url}" class="search-result-item ${kind === 'weak' ? 'is-weak' : ''}" role="option" data-index="${index}">
                <div class="search-result-title">
                    ${isPage ? '<i class="bi bi-arrow-right-short"></i> ' : ''}${highlightMatch(result.title, result._query || '')}
                    ${draftBadge}
                </div>
                ${meta.length ? `<div class="search-result-meta">${meta.join('')}</div>` : ''}
                ${!isPage && result.office ? `<div class="search-result-office"><i class="bi bi-building"></i> ${escapeHtml(result.office)}</div>` : ''}
                ${result.description ? `<div class="search-result-desc">${escapeHtml(result.description)}</div>` : ''}
            </a>
        `;
  }

  function highlightMatch(text, query) {
    if (!query) return escapeHtml(text);
    const terms = tokenize(query);
    let result = escapeHtml(text);
    terms.forEach((term) => {
      if (term.length >= 2) {
        const regex = new RegExp(`(${escapeRegex(term)})`, 'gi');
        result = result.replace(regex, '<mark>$1</mark>');
      }
    });
    return result;
  }

  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  // ==================== INITIALIZATION ====================

  async function initSearch(input) {
    const services = await loadServicesData();
    const dropdown = createAutocomplete(input);
    const categories = getCategories(services);

    let debounceTimer;
    let selectedIndex = -1;
    let currentCategory = null;
    let currentResults = [];

    // Show suggestions on focus with empty input
    input.addEventListener('focus', function () {
      const query = this.value.trim();
      if (query.length < 2) {
        const suggestions = getSuggestions('', services);
        renderResults(EMPTY_RESULTS, dropdown, { showSuggestions: true, suggestions, categories });
      } else {
        performSearch(query);
      }
    });

    // Handle input
    input.addEventListener('input', function () {
      clearTimeout(debounceTimer);
      const query = this.value.trim();

      if (query.length < 2) {
        const suggestions = getSuggestions(query, services);
        renderResults(EMPTY_RESULTS, dropdown, { showSuggestions: true, suggestions, categories });
        selectedIndex = -1;
        return;
      }

      debounceTimer = setTimeout(() => performSearch(query), 150);
    });

    function performSearch(query) {
      const results = searchServices(query, services, { category: currentCategory });

      // Flattened in the order rendered, so keyboard navigation and Enter act on
      // the row the user is actually looking at.
      currentResults = [...results.services, ...results.pages];

      const suggestions = getSuggestions(query, services);

      renderResults(results, dropdown, {
        suggestions,
        categories,
        selectedCategory: currentCategory,
      });

      trackSearch(query, results.total);
      selectedIndex = -1;
    }

    // Handle keyboard navigation
    input.addEventListener('keydown', function (e) {
      const items = dropdown.querySelectorAll('.search-result-item, .search-suggestion-item');

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        selectedIndex = Math.min(selectedIndex + 1, items.length - 1);
        updateSelection(items, selectedIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        selectedIndex = Math.max(selectedIndex - 1, -1);
        updateSelection(items, selectedIndex);
      } else if (e.key === 'Enter') {
        if (selectedIndex >= 0 && items[selectedIndex]) {
          e.preventDefault();
          const item = items[selectedIndex];
          if (item.dataset.suggestion) {
            input.value = item.dataset.suggestion;
            performSearch(item.dataset.suggestion);
          } else {
            addRecentSearch(input.value.trim());
            item.click();
          }
        } else if (currentResults.length > 0) {
          e.preventDefault();
          addRecentSearch(input.value.trim());
          const firstResult = dropdown.querySelector('.search-result-item');
          if (firstResult) firstResult.click();
        }
      } else if (e.key === 'Escape') {
        dropdown.style.display = 'none';
        selectedIndex = -1;
      }
    });

    function updateSelection(items, index) {
      items.forEach((item, i) => {
        item.classList.toggle('selected', i === index);
      });
      if (index >= 0 && items[index]) {
        items[index].scrollIntoView({ block: 'nearest' });
      }
    }

    // Handle clicks in dropdown
    dropdown.addEventListener('click', function (e) {
      // Handle suggestion clicks
      const suggestionItem = e.target.closest('.search-suggestion-item');
      if (suggestionItem) {
        e.preventDefault();
        const suggestion = suggestionItem.dataset.suggestion;
        input.value = suggestion;
        performSearch(suggestion);
        return;
      }

      // Handle category filter clicks
      const filterBtn = e.target.closest('.search-filter-btn');
      if (filterBtn) {
        e.preventDefault();
        currentCategory = filterBtn.dataset.category || null;
        dropdown
          .querySelectorAll('.search-filter-btn')
          .forEach((btn) => btn.classList.remove('active'));
        filterBtn.classList.add('active');
        if (input.value.trim().length >= 2) {
          performSearch(input.value.trim());
        }
        return;
      }

      // Handle clear recent
      const clearBtn = e.target.closest('.search-clear-recent');
      if (clearBtn) {
        e.preventDefault();
        clearRecentSearches();
        const suggestions = getSuggestions('', services);
        renderResults(EMPTY_RESULTS, dropdown, { showSuggestions: true, suggestions, categories });
        return;
      }

      // Handle result clicks - add to recent
      const resultItem = e.target.closest('.search-result-item');
      if (resultItem) {
        addRecentSearch(input.value.trim());
      }
    });

    // Close dropdown when clicking outside
    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !dropdown.contains(e.target)) {
        dropdown.style.display = 'none';
        selectedIndex = -1;
      }
    });

    // Prevent form submission
    const form = input.closest('form');
    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        const query = input.value.trim();
        if (query.length >= 2 && currentResults.length > 0) {
          addRecentSearch(query);
          let url = currentResults[0].url;
          if (
            !url.startsWith('http') &&
            !url.startsWith('/') &&
            !url.startsWith('../') &&
            !url.startsWith('services/')
          ) {
            if (!window.location.pathname.includes('/services/')) {
              url = 'services/' + url;
            }
          }
          window.location.href = url;
        }
      });
    }
  }

  // ==================== STYLES ====================

  function addSearchStyles() {
    if (document.getElementById('search-styles-v3')) return;

    // Remove old styles if present
    const oldStyles = document.getElementById('search-styles-v2');
    if (oldStyles) oldStyles.remove();

    const styles = document.createElement('style');
    styles.id = 'search-styles-v3';
    styles.textContent = `
            .search-autocomplete {
                position: absolute;
                top: 100%;
                left: 0;
                right: 0;
                background: #fff;
                border: 1px solid rgba(0, 50, 160, 0.1);
                border-radius: 16px;
                box-shadow: 0 12px 40px rgba(0, 50, 160, 0.15), 0 4px 12px rgba(0, 0, 0, 0.08);
                max-height: 480px;
                overflow-y: auto;
                z-index: 1000;
                display: none;
                margin-top: 8px;
                animation: searchDropdownFadeIn 0.2s ease;
            }
            
            @keyframes searchDropdownFadeIn {
                from { opacity: 0; transform: translateY(-8px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .search-autocomplete::-webkit-scrollbar {
                width: 6px;
            }
            
            .search-autocomplete::-webkit-scrollbar-track {
                background: transparent;
            }
            
            .search-autocomplete::-webkit-scrollbar-thumb {
                background: rgba(0, 50, 160, 0.2);
                border-radius: 3px;
            }
            
            .search-loading {
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 24px;
                color: #666;
                font-size: 0.875rem;
            }
            
            .search-loading-spinner {
                width: 20px;
                height: 20px;
                border: 2px solid rgba(0, 50, 160, 0.2);
                border-top-color: #0032a0;
                border-radius: 50%;
                animation: searchSpin 0.8s linear infinite;
                margin-right: 10px;
            }
            
            @keyframes searchSpin {
                to { transform: rotate(360deg); }
            }
            
            .search-filters {
                display: flex;
                gap: 6px;
                padding: 12px 14px;
                border-bottom: 1px solid rgba(0, 50, 160, 0.06);
                overflow-x: auto;
                flex-wrap: nowrap;
                background: linear-gradient(180deg, #fafbfc 0%, #fff 100%);
                border-radius: 16px 16px 0 0;
            }
            
            .search-filters::-webkit-scrollbar {
                height: 0;
            }
            
            .search-filter-btn {
                padding: 6px 14px;
                border: 1px solid rgba(0, 50, 160, 0.15);
                border-radius: 20px;
                background: #fff;
                font-size: 0.75rem;
                font-weight: 500;
                color: #555;
                cursor: pointer;
                white-space: nowrap;
                transition: all 0.2s ease;
            }
            
            .search-filter-btn:hover {
                border-color: #0032a0;
                color: #0032a0;
                background: rgba(0, 50, 160, 0.04);
            }
            
            .search-filter-btn.active {
                background: linear-gradient(135deg, #0032a0 0%, #0044cc 100%);
                border-color: #0032a0;
                color: #fff;
                box-shadow: 0 2px 8px rgba(0, 50, 160, 0.3);
            }
            
            .search-section {
                border-bottom: 1px solid rgba(0, 50, 160, 0.06);
            }
            
            .search-section:last-child {
                border-bottom: none;
            }
            
            .search-section-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px 16px 8px;
                font-size: 0.6875rem;
                font-weight: 600;
                color: #888;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .search-section-header i {
                margin-right: 5px;
                color: #0032a0;
            }
            
            .search-clear-recent {
                background: none;
                border: none;
                color: #0032a0;
                font-size: 0.6875rem;
                font-weight: 500;
                cursor: pointer;
                padding: 3px 8px;
                border-radius: 4px;
                transition: background 0.15s ease;
            }
            
            .search-clear-recent:hover {
                background: rgba(0, 50, 160, 0.08);
            }
            
            .search-suggestion-item {
                display: flex;
                align-items: center;
                padding: 11px 16px;
                text-decoration: none;
                color: #333;
                font-size: 0.875rem;
                transition: all 0.15s ease;
                text-align: left;
                border-left: 3px solid transparent;
            }
            
            .search-suggestion-item i {
                color: #999;
                margin-right: 10px;
                font-size: 0.8125rem;
                transition: color 0.15s ease;
            }
            
            .search-suggestion-item:hover,
            .search-suggestion-item.selected {
                background: linear-gradient(90deg, rgba(0, 50, 160, 0.06) 0%, rgba(0, 50, 160, 0.02) 100%);
                border-left-color: #0032a0;
                text-decoration: none;
                color: #0032a0;
            }
            
            .search-suggestion-item:hover i,
            .search-suggestion-item.selected i {
                color: #0032a0;
            }
            
            .search-result-item {
                display: block;
                padding: 14px 16px;
                text-decoration: none;
                color: #1a1a1a;
                border-bottom: 1px solid rgba(0, 50, 160, 0.06);
                transition: all 0.15s ease;
                text-align: left;
                border-left: 3px solid transparent;
            }
            
            .search-result-item:last-child {
                border-bottom: none;
            }
            
            .search-result-item:hover,
            .search-result-item.selected {
                background: linear-gradient(90deg, rgba(0, 50, 160, 0.06) 0%, rgba(0, 50, 160, 0.02) 100%);
                border-left-color: #0032a0;
                text-decoration: none;
            }
            
            .search-result-title {
                font-weight: 600;
                color: #0032a0;
                margin-bottom: 6px;
                font-size: 0.9375rem;
                display: flex;
                align-items: center;
                gap: 8px;
            }
            
            .search-result-title mark {
                background: linear-gradient(180deg, transparent 60%, rgba(0, 50, 160, 0.15) 60%);
                color: inherit;
                padding: 0;
                border-radius: 0;
            }
            
            .search-result-badge {
                font-size: 0.625rem;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 4px;
                background: rgba(6, 167, 125, 0.1);
                color: #06a77d;
                text-transform: uppercase;
                letter-spacing: 0.3px;
            }
            
            /* Charter entries not yet checked against the published PDF. Muted
               rather than alarming: the information is usable, just unconfirmed. */
            .search-result-draft {
                font-size: 0.625rem;
                font-weight: 600;
                padding: 2px 6px;
                border-radius: 4px;
                background: rgba(180, 130, 20, 0.12);
                color: #8a6410;
                text-transform: uppercase;
                letter-spacing: 0.3px;
                white-space: nowrap;
            }

            [data-theme="dark"] .search-result-draft {
                background: rgba(240, 190, 90, 0.16);
                color: #e0b563;
            }

            /* Loose matches, shown only when there are few confident answers. */
            .search-section--weak {
                border-top: 1px solid var(--search-border, #e5e7eb);
                background: rgba(0, 0, 0, 0.015);
            }

            [data-theme="dark"] .search-section--weak {
                background: rgba(255, 255, 255, 0.02);
            }

            .search-result-item.is-weak .search-result-title {
                font-weight: 500;
                opacity: 0.85;
            }

            .search-result-meta {
                display: flex;
                flex-wrap: wrap;
                gap: 12px;
                font-size: 0.75rem;
                margin-bottom: 6px;
            }
            
            .search-result-meta span {
                display: inline-flex;
                align-items: center;
                gap: 5px;
            }
            
            .search-result-meta i {
                font-size: 0.6875rem;
                opacity: 0.8;
            }
            
            .search-result-category {
                color: #666;
                background: rgba(0, 0, 0, 0.04);
                padding: 2px 8px;
                border-radius: 4px;
            }
            
            .search-result-fee {
                color: #06a77d;
                font-weight: 600;
            }
            
            .search-result-time {
                color: #0066cc;
            }
            
            .search-result-office {
                font-size: 0.75rem;
                color: #777;
                margin-bottom: 4px;
                display: flex;
                align-items: center;
            }
            
            .search-result-office i {
                margin-right: 6px;
                font-size: 0.6875rem;
                color: #0032a0;
            }
            
            .search-result-desc {
                font-size: 0.8125rem;
                color: #666;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                line-height: 1.4;
            }
            
            .search-no-results {
                padding: 32px 24px;
                text-align: center;
                color: #666;
            }
            
            .search-no-results i {
                font-size: 2.5rem;
                color: rgba(0, 50, 160, 0.2);
                margin-bottom: 12px;
                display: block;
            }
            
            .search-no-results p {
                margin: 0 0 6px;
                font-weight: 600;
                color: #333;
            }
            
            .search-no-results small {
                color: #888;
                font-size: 0.8125rem;
            }
            
            .search-keyboard-hint {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 16px;
                padding: 10px 16px;
                background: #fafbfc;
                border-top: 1px solid rgba(0, 50, 160, 0.06);
                font-size: 0.6875rem;
                color: #888;
                border-radius: 0 0 16px 16px;
            }
            
            .search-keyboard-hint kbd {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                min-width: 20px;
                height: 20px;
                padding: 0 5px;
                background: #fff;
                border: 1px solid #ddd;
                border-radius: 4px;
                font-family: inherit;
                font-size: 0.625rem;
                font-weight: 600;
                color: #555;
                box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
                margin: 0 2px;
            }
            
            .search-footer {
                display: flex;
                align-items: center;
                justify-content: space-between;
                padding: 10px 16px;
                background: #fafbfc;
                border-top: 1px solid rgba(0, 50, 160, 0.06);
                font-size: 0.75rem;
                color: #888;
                border-radius: 0 0 16px 16px;
            }
            
            .search-footer-count {
                font-weight: 500;
            }
            
            .search-footer-powered {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .search-footer-powered i {
                color: #0032a0;
            }
            
            @media (max-width: 575px) {
                .search-autocomplete {
                    border-radius: 12px;
                    margin-top: 6px;
                }
                
                .search-filters {
                    padding: 10px 12px;
                    gap: 5px;
                    border-radius: 12px 12px 0 0;
                }
                
                .search-filter-btn {
                    padding: 5px 12px;
                    font-size: 0.6875rem;
                }
                
                .search-result-meta {
                    gap: 8px;
                }
                
                .search-result-item {
                    padding: 12px 14px;
                }
                
                .search-suggestion-item {
                    padding: 10px 14px;
                }
                
                .search-keyboard-hint {
                    display: none;
                }
                
                .search-footer {
                    border-radius: 0 0 12px 12px;
                }
            }
        `;
    document.head.appendChild(styles);
  }

  // ==================== INIT ====================

  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function () {
      addSearchStyles();

      const searchInputs = document.querySelectorAll(
        '#service-search, #hero-search, .service-search-input'
      );
      searchInputs.forEach((input) => {
        if (input) initSearch(input);
      });
    });
  }

  // ==================== EXPORTS ====================

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      searchServices,
      getSuggestions,
      getPopularSearches,
      getRecentSearches,
      getSearchAnalytics,
      trackSearch,
    };
  }

  if (typeof window !== 'undefined') {
    window.BetterLegazpiSearch = {
      searchServices,
      getSuggestions,
      getPopularSearches,
      getRecentSearches,
      getSearchAnalytics,
      trackSearch,
      clearRecentSearches,
    };
  }
})();
