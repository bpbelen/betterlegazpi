import os
import re

info_bar_template = '''    <!-- Real-Time Info Bar -->
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

pages = [
    ('tourism/index.html', 'Tourism &amp; Travel Guide', None, '<!-- Hero Section -->'),
    ('tourism/attractions.html', 'Tourist Attractions', 'attractions', '<!-- Subpage Header -->'),
    ('tourism/experience.html', 'The Legazpi Experience &amp; Adventures', 'experience', '<!-- Subpage Header -->'),
    ('tourism/food.html', 'Cuisine &amp; Dining', 'food', '<!-- Subpage Header -->'),
    ('tourism/accommodations.html', 'Where to Stay', 'accommodations', '<!-- Subpage Header -->'),
    ('tourism/landmarks.html', 'Scenic Landmarks', 'landmarks', '<!-- Subpage Header -->')
]

for filepath, title, cat, next_section in pages:
    if not os.path.exists(filepath):
        continue
    
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    if cat is None:
        bc_block = f'''    <!-- Breadcrumbs -->
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="../">Home</a><span>/</span>
        <span aria-current="page">{title}</span>
      </nav>
    </div>'''
    else:
        bc_block = f'''    <!-- Breadcrumbs -->
    <div class="container">
      <nav class="breadcrumbs" aria-label="Breadcrumb">
        <a href="../">Home</a><span>/</span>
        <a href="./">Tourism</a><span>/</span>
        <span aria-current="page">{title}</span>
      </nav>
    </div>'''

    mid_block = f'\n\n{info_bar_template}\n\n{bc_block}\n\n    '

    # Replace between </header> and next_section
    pattern = r'</header>[\s\S]*?' + re.escape(next_section)
    replacement = '</header>' + mid_block + next_section
    
    new_content, count = re.subn(pattern, replacement, content, count=1)
    if count == 0:
        print(f"Warning: pattern not matched in {filepath}")
    else:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Successfully cleaned header-to-section block in {filepath}")

print("Done!")
