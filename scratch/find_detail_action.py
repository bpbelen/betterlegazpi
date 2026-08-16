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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
})
opener.open(main_req, timeout=30)

# Let's search inside the HTML of the main page or JS files for actions like get_project, project_details, etc.
resp = opener.open(main_req)
html_text = resp.read().decode('utf-8', errors='ignore')

# Search for ajax actions or script functions
matches = re.findall(r'action[\'"]?\s*[:=]\s*[\'"]([^\'"]+)[\'"]', html_text)
print("Actions in main page:", matches)

# Also test calling admin-ajax with get_project_details or load_project_details for data-id="6773"
test_actions = [
    {"action": "get_project_details", "id": "6773"},
    {"action": "get_project_card", "id": "6773"},
    {"action": "load_project_card", "id": "6773"},
    {"action": "get_project", "id": "6773"},
    {"action": "get_project", "project_id": "6773"},
    {"action": "project_card", "id": "6773"}
]

url = "https://sumbongsapangulo.ph/wp-admin/admin-ajax.php"
ajax_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sumbongsapangulo.ph/flood-control-map/",
    "Origin": "https://sumbongsapangulo.ph"
}

for payload in test_actions:
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=ajax_headers)
    try:
        r = opener.open(req, timeout=15)
        res = r.read().decode('utf-8', errors='ignore')
        print(f"Action {payload['action']}: {res[:200]}")
    except Exception as e:
        print(f"Error {payload['action']}:", e)
