import urllib.request
import urllib.parse
import ssl
import json
import http.cookiejar
import re
import html

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}
opener.open(urllib.request.Request("https://sumbongsapangulo.ph/flood-control-map/", headers=headers), timeout=30)

url = "https://sumbongsapangulo.ph/wp-admin/admin-ajax.php"
ajax_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sumbongsapangulo.ph/flood-control-map/",
    "Origin": "https://sumbongsapangulo.ph",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
}

page = 1
legazpi_38_trs = []

while True:
    payload = {
        "action": "filter_projects",
        "page": str(page),
        "per_page": "100",
        "region": "Region V",
        "municipality": "Albay",
        "search_itm": "Legazpi City"
    }
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=ajax_headers)
    r = opener.open(req, timeout=30)
    res_json = json.loads(r.read().decode('utf-8', errors='ignore'))
    if not res_json.get("success"):
        break
    rows_html = res_json.get("data", {}).get("rows", "")
    trs = re.findall(r'<tr[^>]*>.*?</tr>', rows_html, re.DOTALL)
    if not trs:
        break
    legazpi_38_trs.extend(trs)
    print(f"Page {page}: got {len(trs)} rows")
    if not res_json.get("data", {}).get("has_more"):
        break
    page += 1

print(f"\nTotal strictly matching 'Legazpi City': {len(legazpi_38_trs)} projects")

for i, tr in enumerate(legazpi_38_trs):
    desc_match = re.search(r'data-desc=[\'"]([^\'"]+)[\'"]', tr)
    cid_match = re.search(r'data-contract_id=[\'"]([^\'"]+)[\'"]', tr)
    print(f"{i+1}. CID: {cid_match.group(1) if cid_match else 'N/A'} - {desc_match.group(1)[:60] if desc_match else ''}")
