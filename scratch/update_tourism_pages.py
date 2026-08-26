import re
import os

standard_footer = '''    <footer class="site-footer">
      <div class="container">
        <div class="footer-main-new">
          <div class="footer-brand">
            <img
              src="../assets/images/logo/better-solano-logo-white.svg"
              alt="Better Legazpi logo"
              class="footer-logo"
            />
            <p class="footer-tagline">
              Empowering the people of Legazpi with transparent access to the services, programs, and public funds of LGU Legazpi City.
            </p>
            <div class="footer-social-new">
              <a
                href="https://www.facebook.com/betterlegazpi.org"
                class="footer-social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Facebook"
                ><i class="bi bi-facebook"></i
              ></a>
              <a
                href="https://www.linkedin.com/company/betterlegazpi/"
                class="footer-social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                ><i class="bi bi-linkedin"></i
              ></a>
              <a
                href="https://discord.com/invite/betterlegazpi"
                class="footer-social-btn"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                ><i class="bi bi-discord"></i
              ></a>
            </div>
          </div>
          <div class="footer-column">
            <h4>Quick Links</h4>
            <ul class="footer-links-new">
              <li><a href="../services/">Services Directory</a></li>
              <li><a href="../tourism/">Tourism &amp; Travel</a></li>
              <li><a href="../government/">City Government</a></li>
              <li><a href="../statistics/">Statistics &amp; Data</a></li>
              <li><a href="../budget/">Transparency &amp; Budget</a></li>
              <li><a href="../sitemap/">Sitemap</a></li>
              <li><a href="../terms/">Terms of Use</a></li>
              <li><a href="../privacy/">Privacy Policy</a></li>
              <li><a href="../accessibility/">Accessibility</a></li>
              <li><a href="../faq/">FAQ</a></li>
            </ul>
          </div>
          <div class="footer-column">
            <h4>Resources</h4>
            <ul class="footer-links-new">
              <li>
                <a
                  href="https://data.gov.ph"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Open Data Philippines</a
                >
              </li>
              <li>
                <a
                  href="https://www.foi.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  >Freedom of Information</a
                >
              </li>
              <li>
                <a
                  href="https://legazpi.gov.ph"
                  target="_blank"
                  rel="noopener noreferrer"
                  >City Government of Legazpi</a
                >
              </li>
            </ul>
          </div>
          <div class="footer-column">
            <div
              class="footer-cost"
              role="status"
              aria-label="Cost to the People of Legazpi: Zero Pesos"
            >
              Cost to the People of Legazpi = <span class="footer-cost-value">₱0</span>
            </div>
            <a href="mailto:volunteer@betterlegazpi.org" class="footer-contribute"
              ><i class="bi bi-envelope-heart"></i>
              <span>Volunteer with us</span></a
            >
            <a
              href="https://github.com/bpbelen/betterlegazpi"
              class="footer-contribute"
              target="_blank"
              rel="noopener noreferrer"
              ><i class="bi bi-github"></i>
              <span>Contribute code with us</span></a
            >
          </div>
        </div>
        <div class="footer-bottom-new">
          <div class="footer-copyright">
            <span class="footer-copyright-text">&copy; 2026 BetterLegazpi.org</span>
            <span class="footer-copyright-license">MIT | CC BY 4.0</span>
            <span class="footer-copyright-disclaimer"
              >All public information sourced from official government portals.</span
            >
            <span class="footer-version"><i class="bi bi-boxes"></i> Ver. 1.1.19</span>
          </div>
        </div>
      </div>
    </footer>'''

pages = [
    ('tourism/index.html', 'Tourism &amp; Travel Guide', None),
    ('tourism/attractions.html', 'Tourist Attractions', 'attractions'),
    ('tourism/experience.html', 'The Legazpi Experience', 'experience'),
    ('tourism/food.html', 'Cuisine &amp; Dining', 'food'),
    ('tourism/accommodations.html', 'Where to Stay', 'accommodations'),
    ('tourism/landmarks.html', 'Scenic Landmarks', 'landmarks')
]

for filepath, title, cat in pages:
    if not os.path.exists(filepath):
        print(f"File not found: {filepath}")
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Replace Footer
    content = re.sub(r'<footer[\s\S]*?</footer>', standard_footer, content)

    # 2. Build standard Breadcrumb HTML
    if cat is None:
        breadcrumb_html = '''    <!-- Breadcrumbs -->
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="../">Home</a><span>/</span>
        <span aria-current="page">Tourism &amp; Travel Guide</span>
      </nav>
    </div>'''
    else:
        breadcrumb_html = f'''    <!-- Breadcrumbs -->
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="../">Home</a><span>/</span>
        <a href="./">Tourism</a><span>/</span>
        <span aria-current="page">{title}</span>
      </nav>
    </div>'''

    # Remove any existing breadcrumbs
    content = re.sub(r'\s*<!-- Breadcrumbs? -->[\s\S]*?<\/nav>\s*<\/div>', '', content)
    content = re.sub(r'\s*<nav class="tourism-breadcrumb"[\s\S]*?<\/nav>', '', content)
    content = re.sub(r'\s*<div class="tourism-breadcrumb-wrapper"[\s\S]*?<\/div>\s*<\/div>', '', content)

    # Fix Info Bar block cleanly
    info_bar_pattern = r'<!-- Real-Time Info Bar -->[\s\S]*?<\/div>\s*<\/div>\s*<\/div>'
    info_bar_match = re.search(info_bar_pattern, content)
    if info_bar_match:
        matched_info_bar = info_bar_match.group(0)
        # Ensure info bar has exactly 3 closing divs
        clean_info_bar = '''<!-- Real-Time Info Bar -->
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
    </div>'''
        
        replacement = clean_info_bar + '\n\n' + breadcrumb_html
        content = content[:info_bar_match.start()] + replacement + content[info_bar_match.end():]
    else:
        print(f"Warning: Info bar not matched in {filepath}")

    # Remove any extra orphaned closing div tags right before Subpage Header or Hero
    content = re.sub(r'(<\/div>\s*<\/div>\s*<\/nav>\s*<\/div>)\s*<\/div>', r'\1', content)
    content = re.sub(r'(<\/nav>\s*<\/div>)\s*<\/div>\s*\n\s*(<!-- (?:Subpage Header|Hero Section))', r'\1\n\n    \2', content)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    print(f"Updated {filepath}")

print("All tourism pages successfully updated!")
