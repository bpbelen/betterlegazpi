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
    if os.path.basename(file_path) == "news-editor.html":
        continue
    if "history" in file_path:
        continue # history/index.html already has History in nav

    rel_path = os.path.relpath(file_path, root_dir)
    depth = rel_path.count(os.sep)

    if depth == 0:
        history_href = "history/"
    else:
        history_href = "../" * depth + "history/"
        # Fix for single depth: "../history/"
        if depth == 1:
            history_href = "../history/"
        elif depth == 2:
            history_href = "../history/" # from service-details/

    with open(file_path, "r", encoding="utf-8") as f:
        content = f.read()

    # Check if History already in main nav
    if f'href="{history_href}"' in content and 'History</a></li>' in content:
        print(f"Already present in {rel_path}")
        continue

    # Pattern 1: Find <li><a href="...contact/"...>Contact</a></li> in <nav class="main-nav">
    # We want to insert <li><a href="{history_href}">History</a></li> right before Contact
    # e.g.:
    # <li><a href="contact/">Contact</a></li>
    # or <li><a href="../contact/" class="active">Contact</a></li>
    
    # We match the contact li in main-nav
    contact_pattern = re.compile(r'(\s*<li><a\s+href="(?:\.\./)*contact/"[^>]*>Contact</a></li>)', re.IGNORECASE)
    
    match = contact_pattern.search(content)
    if match:
        contact_li = match.group(1)
        # Determine indentation
        indent = re.match(r'(\s*)', contact_li).group(1)
        # If the file is at root, history_href is "history/"
        # If in subfolder, history_href is "../history/"
        
        # Check contact href in the match to match prefix
        contact_href_match = re.search(r'href="((?:\.\./)*)contact/"', contact_li)
        prefix = contact_href_match.group(1) if contact_href_match else ("" if depth == 0 else "../")
        
        nav_history_li = f'{indent}<li><a href="{prefix}history/">History</a></li>'
        new_content = content[:match.start()] + nav_history_li + content[match.start():]
        
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"Updated nav in {rel_path}")
        updated_count += 1
    else:
        print(f"Could not find contact nav in {rel_path}")

print(f"Total updated: {updated_count}")
