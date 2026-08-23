import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Let's search with recperpage=100
params = {
    'cmd': 'search',
    't': 'v_activefacilities',
    'psearch': 'Legazpi',
    'psearchtype': '=',
    'recperpage': '100'
}
url = 'https://nhfr.doh.gov.ph/VActivefacilitiesList?' + urllib.parse.urlencode(params)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})

try:
    with urllib.request.urlopen(req, context=ctx, timeout=15) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        all_tr = re.findall(r'<tr[^>]*data-rowindex=[\'"]\d+[\'"][\s\S]*?</tr>', html)
        print('Total TRs for Legazpi:', len(all_tr))
        facilities = []
        for tr in all_tr:
            tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', tr)
            clean_tds = [re.sub(r'<[^>]+>', '', td).strip() for td in tds]
            if len(clean_tds) >= 11:
                facilities.append({
                    'code': clean_tds[0],
                    'name': clean_tds[1],
                    'type': clean_tds[2],
                    'ownership': clean_tds[3],
                    'street': clean_tds[4],
                    'building': clean_tds[5],
                    'region': clean_tds[6],
                    'province': clean_tds[7],
                    'city': clean_tds[8],
                    'barangay': clean_tds[9],
                    'landline': clean_tds[10],
                    'license_status': clean_tds[11] if len(clean_tds) > 11 else '',
                    'license_validity': clean_tds[12] if len(clean_tds) > 12 else ''
                })
        print(f'Parsed {len(facilities)} facilities:')
        for f in facilities:
            print(f"- [{f['type']}] {f['name']} ({f['ownership']}) - Brgy: {f['barangay']} - City: {f['city']}")
except Exception as e:
    print('Error:', e)
