import urllib.request, urllib.parse, ssl, json, http.cookiejar, re

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

main_req = urllib.request.Request("https://sumbongsapangulo.ph/flood-control-map/", headers={"User-Agent": "Mozilla/5.0"})
opener.open(main_req, timeout=20)

url = "https://sumbongsapangulo.ph/wp-admin/admin-ajax.php"
page = 1
search_results = []
while True:
    payload = {
        "action": "filter_projects",
        "page": str(page),
        "per_page": "100",
        "region": "Region V",
        "search_itm": "Legazpi"
    }
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers={
        "User-Agent": "Mozilla/5.0",
        "X-Requested-With": "XMLHttpRequest",
        "Referer": "https://sumbongsapangulo.ph/flood-control-map/",
        "Origin": "https://sumbongsapangulo.ph"
    })
    resp = opener.open(req, timeout=25)
    res = json.loads(resp.read().decode('utf-8'))
    if not res.get("success"): break
    rows_html = res.get("data", {}).get("rows", "")
    trs = re.findall(r'<tr[^>]*>.*?</tr>', rows_html, re.DOTALL)
    search_results.extend(trs)
    if not res.get("data", {}).get("has_more") or not trs: break
    page += 1

print(f"Direct search for 'Legazpi' found: {len(search_results)} projects")
