import os
import re

def test_matches():
    html_files = []
    for root, dirs, files in os.walk('.'):
        dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', '.gemini']]
        for f in files:
            if f.endswith('.html'):
                html_files.append(os.path.join(root, f))
    
    # Exclude the 3 files that don't have headers
    skip_files = [
        os.path.normpath('./admin/news-editor.html'),
        os.path.normpath('./offline.html'),
        os.path.normpath('./service-details/municipal-civil-registrar.html')
    ]

    for hf in sorted(html_files):
        if os.path.normpath(hf) in skip_files:
            continue
        with open(hf, 'r', encoding='utf-8') as f:
            content = f.read()

        # Test hotline bar match
        hotline_m = re.search(r'(?:<!--\s*Hotline Bar\s*-->\s*)?<div class="hotline-bar">[\s\S]*?(?=\s*<header)', content)
        if not hotline_m:
            print(f"FAILED hotline match: {hf}")

        # Test main-nav match
        nav_m = re.search(r'<nav class="main-nav"[^>]*>[\s\S]*?</nav>', content)
        if not nav_m:
            print(f"FAILED nav match: {hf}")

        # Test header-actions match
        actions_m = re.search(r'<div class="header-actions">[\s\S]*?</div>\s*(?=</div>\s*</header>)', content)
        if not actions_m:
            print(f"FAILED header actions match: {hf}")

        # Test info-bar match
        infobar_m = re.search(r'(?:<!--\s*(?:Real-Time )?Info Bar\s*-->\s*)?<div class="info-bar"[^>]*>[\s\S]*?</div>\s*</div>\s*</div>\s*</div>', content)
        if not infobar_m:
            print(f"FAILED info bar match: {hf}")

    print("Match testing completed!")

if __name__ == '__main__':
    test_matches()
