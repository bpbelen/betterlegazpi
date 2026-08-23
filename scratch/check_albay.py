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
opener.open('https://nhfr.doh.gov.ph/VActivefacilitiesList')

# Let's search with psearch=Albay
params = {
    'cmd': 'search',
    't': 'v_activefacilities',
    'psearch': 'Albay',
    'psearchtype': '='
}
url = 'https://nhfr.doh.gov.ph/VActivefacilitiesList?' + urllib.parse.urlencode(params)
resp = opener.open(url)
html = resp.read().decode('utf-8', errors='ignore')

pagecount_m = re.search(r'data-pagecount=[\'"](\d+)[\'"]', html)
pagecount = int(pagecount_m.group(1)) if pagecount_m else 1
print('Total pages found for Albay search:', pagecount)
