import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

params = {
    'cmd': 'search',
    't': 'v_activefacilities',
    'psearch': 'Legazpi',
    'psearchtype': '='
}
url = 'https://nhfr.doh.gov.ph/VActivefacilitiesList?' + urllib.parse.urlencode(params)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        print('Search URL:', url)
        print('Result length:', len(html))
        # Look for table rows
        rows = re.findall(r'<tr[^>]*data-rowindex=[\'"](\d+)[\'"][\s\S]*?</tr>', html, re.I)
        print('Rows matched:', len(rows))
        with open('scratch/nhfr_search_legazpi.html', 'w', encoding='utf-8') as f:
            f.write(html)
        # Find facility names
        names = re.findall(r'<span[^>]*id=[\'"]el\d+_v_activefacilities_facname[\'"][^>]*>([\s\S]*?)</span>', html, re.I)
        print('Facilities found:', len(names))
        for n in names[:15]:
            clean_n = re.sub(r'<[^>]+>', '', n).strip()
            print(' -', clean_n)
except Exception as e:
    print('Error:', e)
