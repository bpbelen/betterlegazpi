import urllib.request, ssl, re, http.cookiejar

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
}

req = urllib.request.Request("https://sumbongsapangulo.ph/flood-control-map/", headers=headers)
r = opener.open(req, timeout=20)
html_content = r.read().decode('utf-8', errors='ignore')

# Find all script src
scripts = re.findall(r'<script[^>]*src=[\'"]([^\'"]+)[\'"]', html_content)
print("Scripts:")
for s in scripts:
    print(" -", s)

# Find inline scripts
inline_scripts = re.findall(r'<script(?![^>]*src=)[^>]*>(.*?)</script>', html_content, re.DOTALL)
print(f"\nFound {len(inline_scripts)} inline scripts:")
for i, s in enumerate(inline_scripts):
    print(f"\n--- Inline Script {i} (len {len(s)}) ---")
    print(s[:600])
