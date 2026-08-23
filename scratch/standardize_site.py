import os
import re

HOTLINE_BAR_TEMPLATE = """    <!-- Hotline Bar -->
    <div class="hotline-bar">
      <div class="container">
        <div class="hotline-inner">
          <div class="hotline-items">
            <a href="tel:911" class="hotline-item">
              <i class="bi bi-telephone-fill" aria-hidden="true"></i>
              <span>Command Center: 911</span>
            </a>
            <a href="tel:09058921185" class="hotline-item">
              <i class="bi bi-hospital" aria-hidden="true"></i>
              <span>Hospital: 0905 892 1185</span>
            </a>
            <a href="tel:09209528188" class="hotline-item">
              <i class="bi bi-exclamation-triangle-fill" aria-hidden="true"></i>
              <span>CDRRMO: 0920 952 8188</span>
            </a>
            <a href="tel:09985985926" class="hotline-item">
              <i class="bi bi-shield-fill" aria-hidden="true"></i>
              <span>PNP: 0998 598 5926</span>
            </a>
            <a href="tel:09171859984" class="hotline-item">
              <i class="bi bi-fire" aria-hidden="true"></i>
              <span>BFP: 0917 185 9984</span>
            </a>
            <a href="tel:09275640600" class="hotline-item">
              <i class="bi bi-life-preserver" aria-hidden="true"></i>
              <span>PCG: 0927 564 0600</span>
            </a>
          </div>
        </div>
      </div>
    </div>"""

INFO_BAR_TEMPLATE = """    <!-- Real-Time Info Bar -->
    <div class="info-bar" role="complementary" aria-label="Real-time information">
      <div class="container">
        <div class="info-bar-inner" aria-live="polite" aria-atomic="false">
          <div class="info-bar-item info-bar-rates" aria-label="Exchange rates">
            <i class="bi bi-currency-exchange" aria-hidden="true"></i>
            <span class="rate-rotator">
              <span class="rate-display">1 USD = ₱ --</span>
            </span>
          </div>
          <div class="info-bar-item info-bar-weather" aria-label="Current weather in Legazpi">
            <i class="bi bi-thermometer-half" aria-hidden="true"></i>
            <span class="weather-location">Legazpi</span>
            <span class="weather-temp">--°C</span>
          </div>
          <div class="info-bar-item info-bar-datetime" aria-label="Philippine Date and Time">
            <i class="bi bi-calendar3" aria-hidden="true"></i>
            <span class="date-value">--- --, ----</span>
            <span class="datetime-separator" aria-hidden="true">•</span>
            <i class="bi bi-clock" aria-hidden="true"></i>
            <span class="time-value">--:-- --</span>
            <span class="time-label">PHT</span>
          </div>
        </div>
      </div>
    </div>"""

HEADER_ACTIONS_TEMPLATE = """        <div class="header-actions">
          <button id="theme-toggle" class="theme-toggle-btn" aria-label="Toggle dark mode" title="Toggle dark mode">
            <i class="bi bi-moon-stars-fill" aria-hidden="true"></i>
          </button>
        </div>"""

def get_main_nav(rel_prefix, active_category):
    home_active = ' class="active"' if active_category == 'home' else ''
    services_active = ' class="active"' if active_category == 'services' else ''
    gov_active = ' class="active"' if active_category == 'government' else ''
    stats_active = ' class="active"' if active_category == 'statistics' else ''
    trans_active = ' class="active"' if active_category == 'transparency' else ''
    contact_active = ' class="active"' if active_category == 'contact' else ''

    if rel_prefix == '':
        home_href = "/"
        svc_prefix = "services/"
        gov_href = "government/"
        stats_href = "statistics/"
        trans_href = "budget/"
        contact_href = "contact/"
    else:
        home_href = "../"
        svc_prefix = "../services/"
        gov_href = "../government/"
        stats_href = "../statistics/"
        trans_href = "../budget/"
        contact_href = "../contact/"

    return f"""        <nav class="main-nav" aria-label="Main Navigation">
          <ul>
            <li><a href="{home_href}"{home_active}>Home</a></li>
            <li class="has-dropdown">
              <a
                href="{svc_prefix}"{services_active}
                aria-haspopup="true"
                aria-expanded="false"
                >Services</a
              >
              <ul class="dropdown-menu">
                <li><a href="{svc_prefix}agriculture">Agriculture</a></li>
                <li><a href="{svc_prefix}business">Business</a></li>
                <li><a href="{svc_prefix}certificates">Certificates</a></li>
                <li><a href="{svc_prefix}education">Education</a></li>
                <li><a href="{svc_prefix}employment">Employment</a></li>
                <li><a href="{svc_prefix}environment">Environment</a></li>
                <li><a href="{svc_prefix}health">Health</a></li>
                <li><a href="{svc_prefix}infrastructure">Infrastructure</a></li>
                <li><a href="{svc_prefix}social-services">Social Services</a></li>
                <li><a href="{svc_prefix}tax-payments">Tax & Payments</a></li>
              </ul>
            </li>
            <li><a href="{gov_href}"{gov_active}>Government</a></li>
            <li><a href="{stats_href}"{stats_active}>Statistics</a></li>
            <li><a href="{trans_href}"{trans_active}>Transparency</a></li>
            <li><a href="{contact_href}"{contact_active}>Contact</a></li>
          </ul>
        </nav>"""

def determine_active_category(rel_path):
    p = rel_path.replace('\\', '/')
    if p in ['index.html', './index.html']:
        return 'home'
    elif p.startswith('services/') or p.startswith('service-details/'):
        return 'services'
    elif p.startswith('government/'):
        return 'government'
    elif p.startswith('statistics/'):
        return 'statistics'
    elif p.startswith('budget/'):
        return 'transparency'
    elif p.startswith('contact/'):
        return 'contact'
    else:
        return 'none'

def process_html_file(filepath):
    rel_path = os.path.relpath(filepath, '.')
    rel_prefix = '' if os.path.dirname(rel_path) == '' else '../'
    active_cat = determine_active_category(rel_path)

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Remove all data-i18n attributes
    content = re.sub(r'\s+data-i18n(?:-[a-z]+)?="[^"]*"', '', content)
    content = re.sub(r"\s+data-i18n(?:-[a-z]+)?='[^']*'", '', content)

    # 2. Remove hreflang links from head
    content = re.sub(r'<!--\s*Hreflang[^-]*-->\s*', '', content, flags=re.IGNORECASE)
    content = re.sub(r'\s*<link\s+rel="alternate"\s+hreflang="[^"]*"\s+href="[^"]*"\s*/?>', '', content)

    # Skip files without standard header/nav
    skip_header_files = [
        os.path.normpath('./admin/news-editor.html'),
        os.path.normpath('./offline.html'),
        os.path.normpath('./service-details/municipal-civil-registrar.html')
    ]

    if os.path.normpath(filepath) not in skip_header_files:
        # 3. Replace Hotline Bar
        content = re.sub(r'(?:<!--\s*Hotline Bar\s*-->\s*)?<div class="hotline-bar">[\s\S]*?(?=\s*<header)', HOTLINE_BAR_TEMPLATE + '\n\n    ', content, count=1)

        # 4. Replace Main Nav
        main_nav_replacement = get_main_nav(rel_prefix, active_cat)
        content = re.sub(r'<nav class="main-nav"[^>]*>[\s\S]*?</nav>', main_nav_replacement, content, count=1)

        # 5. Clean header-actions (remove lang-selector)
        content = re.sub(r'<div class="header-actions">[\s\S]*?</div>\s*(?=</div>\s*</header>)', HEADER_ACTIONS_TEMPLATE + '\n      ', content, count=1)

        # 6. Replace Real-Time Info Bar
        content = re.sub(r'(?:<!--\s*(?:Real-Time )?Info Bar\s*-->\s*)?<div class="info-bar"[^>]*>[\s\S]*?</div>\s*</div>\s*</div>\s*</div>', INFO_BAR_TEMPLATE, content, count=1)

    # 7. Remove translations.js script tag
    content = re.sub(r'\s*<script[^>]*src="[^"]*translations\.js"[^>]*>\s*</script>', '', content)

    # 8. Ensure info-bar.js script tag is present if page has info-bar
    if os.path.normpath(filepath) not in skip_header_files:
        if 'info-bar.js' not in content:
            info_bar_script = f'<script defer src="{rel_prefix}assets/js/info-bar.js"></script>'
            if f'<script defer src="{rel_prefix}assets/js/main.js"></script>' in content:
                content = content.replace(f'<script defer src="{rel_prefix}assets/js/main.js"></script>', f'{info_bar_script}\n    <script defer src="{rel_prefix}assets/js/main.js"></script>')
            elif '</body>' in content:
                content = content.replace('</body>', f'    {info_bar_script}\n  </body>')

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    print(f"Processed: {rel_path}")

def main():
    html_files = []
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', '.gemini']]
        for file in files:
            if file.endswith('.html'):
                html_files.append(os.path.join(root, file))
    
    print(f"Found {len(html_files)} HTML files to process.")
    for hf in sorted(html_files):
        process_html_file(hf)

if __name__ == '__main__':
    main()
