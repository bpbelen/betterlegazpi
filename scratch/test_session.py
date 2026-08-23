import urllib.request
import urllib.parse
import ssl
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cookie_jar = urllib.request.HTTPCookieProcessor()
opener = urllib.request.build_opener(urllib.request.HTTPSHandler(context=ctx), cookie_jar)
opener.addheaders = [('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/119.0')]

# Step 1: visit homepage to get session cookies
resp1 = opener.open('https://nhfr.doh.gov.ph/VActivefacilitiesList')
print('Home status:', resp1.status)

# Step 2: search Legazpi
params = {
    'cmd': 'search',
    't': 'v_activefacilities',
    'psearch': 'Legazpi',
    'psearchtype': '='
}
url = 'https://nhfr.doh.gov.ph/VActivefacilitiesList?' + urllib.parse.urlencode(params)
resp2 = opener.open(url)
print('Search status:', resp2.status)
html = resp2.read().decode('utf-8', errors='ignore')
all_tr = re.findall(r'<tr[^>]*data-rowindex=[\'"]\d+[\'"][\s\S]*?</tr>', html)
print('Page 1 count:', len(all_tr))

# Step 3: check if there is a page 2
for page in [2, 3]:
    page_url = f'https://nhfr.doh.gov.ph/VActivefacilitiesList?pageno={page}'
    try:
        resp = opener.open(page_url)
        h = resp.read().decode('utf-8', errors='ignore')
        trs = re.findall(r'<tr[^>]*data-rowindex=[\'"]\d+[\'"][\s\S]*?</tr>', h)
        print(f'Page {page} count:', len(trs))
    except Exception as e:
        print(f'Page {page} error:', e)
