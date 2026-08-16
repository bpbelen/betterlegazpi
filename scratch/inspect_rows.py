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
payload = {
    "action": "filter_projects",
    "page": "1",
    "per_page": "5",
    "region": "Region V",
    "search_itm": "Legazpi"
}

data = urllib.parse.urlencode(payload).encode('utf-8')
req = urllib.request.Request(url, data=data, headers={
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sumbongsapangulo.ph/flood-control-map/",
    "Origin": "https://sumbongsapangulo.ph"
})

res = json.loads(opener.open(req, timeout=20).read().decode('utf-8'))
rows_html = res.get("data", {}).get("rows", "")

# Print first full tr
trs = re.findall(r'<tr[^>]*>.*?</tr>', rows_html, re.DOTALL)
print(f"Found {len(trs)} TRs.")
if trs:
    print("\n--- TR 1 ---")
    print(trs[0])
