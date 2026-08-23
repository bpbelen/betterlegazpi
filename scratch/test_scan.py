import os
import re

html_files = []
for root, dirs, files in os.walk('.'):
    dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', 'dist', '.gemini']]
    for f in files:
        if f.endswith('.html'):
            html_files.append(os.path.join(root, f))

print(f"Total HTML files: {len(html_files)}")
missing_hotline = []
missing_nav = []
missing_actions = []
missing_infobar = []

for hf in sorted(html_files):
    with open(hf, 'r', encoding='utf-8') as f:
        c = f.read()
    if 'hotline-bar' not in c:
        missing_hotline.append(hf)
    if 'main-nav' not in c:
        missing_nav.append(hf)
    if 'header-actions' not in c:
        missing_actions.append(hf)
    if 'info-bar' not in c:
        missing_infobar.append(hf)

print('Missing hotline:', len(missing_hotline), missing_hotline)
print('Missing nav:', len(missing_nav), missing_nav)
print('Missing header actions:', len(missing_actions), missing_actions)
print('Missing info bar:', len(missing_infobar), missing_infobar)
