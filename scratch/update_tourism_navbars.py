import os
import re

root_dir = r"c:\Users\belen\Downloads\betterlegazpi-wip"

html_files = []
for root, dirs, files in os.walk(root_dir):
    if ".git" in root or "node_modules" in root or "scratch" in root:
        continue
    for file in files:
        if file.endswith(".html"):
            html_files.append(os.path.join(root, file))

print(f"Total HTML files found: {len(html_files)}")

updated_count = 0

for file_path in html_files:
    if os.path.basename(file_path) in ["news-editor.html", "offline.html"]:
        continue
    if "tourism" in file_path and os.path.basename(file_path) == "index.html":
        continue # tourism/index.html already has Tourism in nav

    rel_path = os.path.relpath(file_path, root_dir)
    depth = rel_path.count(os.sep)

    if depth == 0:
        prefix = ""
    elif depth == 1:
        prefix = "../"
    else:
        prefix = "../" * depth

    tourism_href = f"{prefix}tourism/"

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if Tourism already in main nav
    if f'href="{tourism_href}"' in content and 'Tourism</a></li>' in content:
        print(f"Already present in {rel_path}")
        continue

    # Try inserting right after Statistics or before Transparency/Budget or before History/Contact
    # Look for Statistics li or Budget/Transparency li
    stat_pattern = re.compile(r'(\s*<li><a\s+href="(?:\.\./)*statistics/"[^>]*>Statistics</a></li>)', re.IGNORECASE)
    match_stat = stat_pattern.search(content)

    if match_stat:
        stat_li = match_stat.group(1)
        indent = re.match(r'(\s*)', stat_li).group(1)
        stat_href_match = re.search(r'href="((?:\.\./)*)statistics/"', stat_li)
        p = stat_href_match.group(1) if stat_href_match else prefix
        
        tourism_li = f'\n{indent}<li><a href="{p}tourism/">Tourism</a></li>'
        new_content = content[:match_stat.end()] + tourism_li + content[match_stat.end():]
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated nav (after stats) in {rel_path}")
        updated_count += 1
        continue

    # If Statistics not found, try before Transparency / Budget
    budget_pattern = re.compile(r'(\s*<li><a\s+href="(?:\.\./)*budget/"[^>]*>Transparency</a></li>)', re.IGNORECASE)
    match_budget = budget_pattern.search(content)
    if match_budget:
        budget_li = match_budget.group(1)
        indent = re.match(r'(\s*)', budget_li).group(1)
        budget_href_match = re.search(r'href="((?:\.\./)*)budget/"', budget_li)
        p = budget_href_match.group(1) if budget_href_match else prefix

        tourism_li = f'{indent}<li><a href="{p}tourism/">Tourism</a></li>\n'
        new_content = content[:match_budget.start()] + tourism_li + content[match_budget.start():]

        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated nav (before budget) in {rel_path}")
        updated_count += 1
        continue

    print(f"Could not match nav pattern in {rel_path}")

print(f"Total files updated: {updated_count}")
