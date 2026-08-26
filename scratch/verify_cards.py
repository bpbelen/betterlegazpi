import re

with open('tourism/index.html', 'r', encoding='utf-8') as f:
    html = f.read()

articles = re.findall(r'<article class="tourism-featured-card.*?</article>', html, re.DOTALL)
for a in articles:
    title = re.search(r'<h3[^>]*>(.*?)</h3>', a)
    img = re.search(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', a)
    t = title.group(1) if title else 'Unknown'
    i = img.group(1) if img else 'No img'
    print(f'Card: {t.strip()} -> Image: {i}')
