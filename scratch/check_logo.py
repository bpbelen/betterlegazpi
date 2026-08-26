import urllib.request
import re

req = urllib.request.Request('https://legazpi.gov.ph/new-logo/', headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as res:
        html = res.read().decode('utf-8', errors='ignore')
        imgs = re.findall(r'<img[^>]+src=[\'"]([^\'"]+)[\'"]', html)
        with open('scratch/logo_images.txt', 'w', encoding='utf-8') as f:
            for img in imgs:
                f.write(img + '\n')
            for m in re.finditer(r'(https?://[^\s"\'<>]+\.(?:png|jpg|jpeg|svg|webp))', html, re.IGNORECASE):
                f.write('ALL_IMG: ' + m.group(1) + '\n')
        print("Done! Found", len(imgs), "img tags.")
except Exception as e:
    print('Error:', e)
