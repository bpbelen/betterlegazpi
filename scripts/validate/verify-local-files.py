import os
import re

root_dir = r"c:\Users\belen\Downloads\betterlegazpi-wip"
history_html_path = os.path.join(root_dir, "history", "index.html")

with open(history_html_path, "r", encoding="utf-8") as f:
    html = f.read()

links = re.findall(r'(?:href|src)="([^"]+)"', html)
print(f"Found {len(links)} total links/assets in history/index.html")

errors = []
for link in links:
    if link.startswith('http') or link.startswith('tel:') or link.startswith('mailto:') or link.startswith('#'):
        continue
    
    clean_link = link.split('?')[0]
    if clean_link.startswith('../'):
        rel_target = clean_link[3:]
    else:
        rel_target = os.path.join("history", clean_link)
    
    target_disk_path = os.path.join(root_dir, rel_target.replace('/', os.sep))
    
    # Check if target is a file or a directory with index.html, or a .html file
    if os.path.isfile(target_disk_path):
        continue
    elif os.path.isdir(target_disk_path) and os.path.isfile(os.path.join(target_disk_path, "index.html")):
        continue
    elif os.path.isfile(target_disk_path.rstrip(os.sep) + ".html"):
        continue
    else:
        errors.append((link, target_disk_path))

print(f"Broken links count: {len(errors)}")
if errors:
    for e in errors:
        print("  Missing:", e)
else:
    print("SUCCESS: All local assets, styles, scripts, and internal relative links exist on disk!")
