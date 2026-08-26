import urllib.request
import re

with open('tourism/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

imgs = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', html)
for img in set(imgs):
    if img.startswith('http'):
        try:
            req = urllib.request.Request(img, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=5) as res:
                print(f'[OK {res.getcode()}] {img}')
        except Exception as e:
            print(f'[FAIL] {img}: {e}')
    else:
        print(f'[LOCAL] {img}')
