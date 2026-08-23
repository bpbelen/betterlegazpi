import urllib.request
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request(
    'https://nhfr.doh.gov.ph/VActivefacilitiesList',
    headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
)
try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print('HTML length:', len(html))
        with open('scratch/nhfr.html', 'w', encoding='utf-8') as f:
            f.write(html)
        forms = re.findall(r'<form[\s\S]*?</form>', html, re.IGNORECASE)
        print('Forms found:', len(forms))
        for f in forms:
            print('Form tag:', re.findall(r'<form[^>]*>', f, re.I))
        inputs = re.findall(r'<input[^>]*>', html, re.I)
        print('Inputs count:', len(inputs))
        for inp in inputs[:10]:
            print(' ', inp)
        selects = re.findall(r'<select[^>]*name=[\'"]([^\'"]+)[\'"]', html, re.I)
        print('Select names:', selects)
except Exception as e:
    print('Error:', e)
