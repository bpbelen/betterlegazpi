import urllib.request, ssl, re, http.cookiejar

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}

r = opener.open(urllib.request.Request("https://sumbongsapangulo.ph/flood-control-map/", headers=headers), timeout=20)
html_content = r.read().decode('utf-8', errors='ignore')

iframes = re.findall(r'<iframe[^>]+src=[\'"]([^\'"]+)[\'"]', html_content)
print("Iframes found:")
for f in iframes:
    print(" -", f)
