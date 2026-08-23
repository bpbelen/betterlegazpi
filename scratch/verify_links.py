import urllib.request
import re

html = urllib.request.urlopen('http://localhost:8000/history/').read().decode('utf-8')
links = re.findall(r'(?:href|src)="([^"]+)"', html)
print(f"Found {len(links)} total href/src references in history/index.html")

errors = []
checked = 0
for link in links:
    if link.startswith('http') or link.startswith('tel:') or link.startswith('mailto:') or link.startswith('#'):
        continue
    checked += 1
    # Resolve relative URL against /history/
    if link.startswith('../'):
        test_url = 'http://localhost:8000/' + link[3:]
    else:
        test_url = 'http://localhost:8000/history/' + link
    try:
        r = urllib.request.urlopen(test_url)
        # print('OK:', test_url)
    except Exception as e:
        errors.append((test_url, str(e)))

print(f"Checked {checked} local relative references.")
print(f"Errors found: {len(errors)}")
if errors:
    for err in errors:
        print("  ERROR:", err)
else:
    print("All local asset references and relative links verified successfully (200 OK)!")
