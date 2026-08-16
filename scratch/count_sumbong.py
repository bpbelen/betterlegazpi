import urllib.request
import urllib.parse
import ssl
import json
import http.cookiejar
import re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

main_req = urllib.request.Request("https://sumbongsapangulo.ph/flood-control-map/", headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
})
opener.open(main_req, timeout=20)

url = "https://sumbongsapangulo.ph/wp-admin/admin-ajax.php"

# Let's search with municipality: Albay or search_itm: Legazpi
all_legazpi_projects = []
page = 1
while True:
    payload = {
        "action": "filter_projects",
        "page": str(page),
        "per_page": "100",
        "region": "Region V",
        "municipality": "Albay"
    }
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://sumbongsapangulo.ph/flood-control-map/",
        "Origin": "https://sumbongsapangulo.ph"
    })
    try:
        resp = opener.open(req, timeout=25)
        res = json.loads(resp.read().decode('utf-8'))
        if not res.get("success"):
            break
        rows_html = res.get("data", {}).get("rows", "")
        trs = re.findall(r'<tr[^>]*>.*?</tr>', rows_html, re.DOTALL)
        if not trs:
            break
        
        # Filter for Legazpi
        for tr in trs:
            if "legazpi" in tr.lower():
                all_legazpi_projects.append(tr)
                
        print(f"Page {page}: found {len(trs)} Albay projects (total Legazpi matches so far: {len(all_legazpi_projects)})")
        if not res.get("data", {}).get("has_more"):
            break
        page += 1
    except Exception as e:
        print(f"Error on page {page}:", e)
        break

print(f"\nFinished scan: Total Legazpi City flood control projects in Sumbong sa Pangulo: {len(all_legazpi_projects)}")
