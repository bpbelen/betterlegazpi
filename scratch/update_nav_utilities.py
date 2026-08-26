import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

EXCLUDE_DIRS = {'.git', 'node_modules', 'scratch', 'test-results', '.vscode', '.github', '.agents', '.claude'}

count_updated = 0

for root, dirs, files in os.walk(ROOT):
    dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS]
    for file in files:
        if file.endswith('.html'):
            file_path = os.path.join(root, file)
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()

            # Pattern: find dropdown-menu containing tax-payments without utilities
            # e.g., <li><a href="...tax-payments">Tax &amp; Payments</a></li>
            # or <li><a href="...tax-payments">Tax & Payments</a></li>
            
            # Check if file already has utilities in dropdown
            if 'services/utilities' in content or 'utilities" class="active"' in content:
                continue

            # Look for tax-payments list item in dropdown
            pattern = re.compile(r'([ \t]*<li><a href="([^"]*services/)?tax-payments"([^>]*)>Tax[^<]*</a></li>)', re.IGNORECASE)
            
            match = pattern.search(content)
            if match:
                original_line = match.group(1)
                href_prefix = match.group(2) or ''
                indent = match.group(1)[:len(match.group(1)) - len(match.group(1).lstrip())]
                
                # construct utilities line
                new_line = f'{original_line}\n{indent}<li><a href="{href_prefix}utilities">Utilities</a></li>'
                updated_content = content.replace(original_line, new_line, 1)
                
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(updated_content)
                
                print(f"Updated: {os.path.relpath(file_path, ROOT)}")
                count_updated += 1

print(f"Total files updated: {count_updated}")
