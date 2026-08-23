import urllib.request
import urllib.parse
import ssl
import re
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cookie_jar = urllib.request.HTTPCookieProcessor()
opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx), cookie_jar)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0')]

# Step 1: visit homepage to get session cookies
resp1 = opener.open('https://nhfr.doh.gov.ph/VActivefacilitiesList')

# Step 2: search Legazpi
params = {
    'cmd': 'search',
    't': 'v_activefacilities',
    'psearch': 'Legazpi',
    'psearchtype': '='
}
url = 'https://nhfr.doh.gov.ph/VActivefacilitiesList?' + urllib.parse.urlencode(params)
resp2 = opener.open(url)
html = resp2.read().decode('utf-8', errors='ignore')

# Check total records / pages
pagecount_m = re.search(r'data-pagecount=[\'"](\d+)[\'"]', html)
pagecount = int(pagecount_m.group(1)) if pagecount_m else 1
print('Total pages found for search:', pagecount)

all_facilities = []

def parse_facilities(html_content):
    all_tr = re.findall(r'<tr[^>]*data-rowindex=[\'"]\d+[\'"][\s\S]*?</tr>', html_content)
    page_facs = []
    for tr in all_tr:
        tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', tr)
        clean_tds = [re.sub(r'<[^>]+>', '', td).strip() for td in tds]
        if len(clean_tds) >= 11:
            fac = {
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
            }
            page_facs.append(fac)
    return page_facs

all_facilities.extend(parse_facilities(html))

for p in range(2, pagecount + 1):
    page_url = f'https://nhfr.doh.gov.ph/VActivefacilitiesList?pageno={p}'
    try:
        r = opener.open(page_url)
        h = r.read().decode('utf-8', errors='ignore')
        facs = parse_facilities(h)
        all_facilities.extend(facs)
        print(f'Fetched page {p}/{pagecount} ({len(facs)} items)')
    except Exception as e:
        print(f'Error on page {p}: {e}')

print(f'Total facilities scraped: {len(all_facilities)}')
with open('scratch/doh_nhfr_legazpi.json', 'w', encoding='utf-8') as f:
    json.dump(all_facilities, f, indent=2)

types = {}
for f in all_facilities:
    types[f['type']] = types.get(f['type'], 0) + 1

print('Facility types breakdown:', types)
