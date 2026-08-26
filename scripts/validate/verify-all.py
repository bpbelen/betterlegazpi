import os
import re

def verify():
    html_files = []
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', '.gemini']]
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))

    skip_header_files = [
        os.path.normpath('./admin/news-editor.html'),
        os.path.normpath('./offline.html'),
        os.path.normpath('./service-details/municipal-civil-registrar.html')
    ]

    errors = []
    expected_services = [
        "Agriculture",
        "Business",
        "Certificates",
        "Education",
        "Employment",
        "Environment",
        "Health",
        "Infrastructure",
        "Social Services",
        "Tax & Payments"
    ]

    for hf in sorted(html_files):
        with open(hf, 'r', encoding='utf-8') as f:
            content = f.read()

        rel_path = os.path.relpath(hf, '.')

        # Check 1: data-i18n
        i18n_matches = re.findall(r'data-i18n(?:-[a-z]+)?=', content)
        if i18n_matches:
            errors.append(f"{rel_path}: Found {len(i18n_matches)} data-i18n attributes")

        # Check 2: translations.js
        if 'translations.js' in content:
            errors.append(f"{rel_path}: Found translations.js script tag")

        # Check 3: hreflang
        if 'hreflang' in content:
            errors.append(f"{rel_path}: Found hreflang link")

        # Check 4: lang-selector
        if 'lang-selector' in content:
            errors.append(f"{rel_path}: Found lang-selector")

        if os.path.normpath(hf) not in skip_header_files:
            # Check 5: Hotline Bar
            if 'Command Center: 911' not in content or 'Hospital: 0905 892 1185' not in content or 'PCG: 0927 564 0600' not in content:
                errors.append(f"{rel_path}: Hotline bar is missing expected emergency numbers")

            # Check 6: Info Bar
            if 'weather-location">Legazpi<' not in content or '1 USD = ₱ --' not in content or 'info-bar-datetime' not in content:
                errors.append(f"{rel_path}: Info bar is missing expected Legazpi weather / rates / datetime elements")

            # Check 7: Info bar script
            if 'info-bar.js' not in content:
                errors.append(f"{rel_path}: Missing info-bar.js script tag")

            # Check 8: Main nav & Legislative removal
            nav_m = re.search(r'<nav class="main-nav"[^>]*>([\s\S]*?)</nav>', content)
            if not nav_m:
                errors.append(f"{rel_path}: Missing main-nav element")
            else:
                nav_content = nav_m.group(1)
                if 'Legislative' in nav_content:
                    errors.append(f"{rel_path}: Found 'Legislative' still in main navigation")
                
                # Check dropdown services
                for svc in expected_services:
                    if f'>{svc}<' not in nav_content:
                        errors.append(f"{rel_path}: Missing service '{svc}' in Services dropdown")

    print(f"\n==========================================")
    print(f"VERIFICATION RESULTS FOR {len(html_files)} HTML FILES")
    print(f"==========================================")
    if errors:
        print(f"FAILED with {len(errors)} errors:")
        for err in errors:
            print(f" - {err}")
    else:
        print(f"SUCCESS: All {len(html_files)} files passed all verification checks perfectly!")
    print(f"==========================================\n")

if __name__ == '__main__':
    verify()
