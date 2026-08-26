import urllib.request
import re

with open('scripts/scrape-tourism.js', 'r', encoding='utf-8') as f:
    code = f.read()

urls = re.findall(r"image_url:\s*'([^']+)'", code)
for u in set(urls):
    try:
        req = urllib.request.Request(u, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            print(f"[OK 200] {u}")
    except Exception as e:
        print(f"[FAIL 404/ERR] {u} -> {e}")
