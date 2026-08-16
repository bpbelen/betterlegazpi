import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://services1.arcgis.com/IwZZTMxZCmAmFYvF/arcgis/rest/services/FloodControl_Data_20250802_v6_corrected_coordinates_for_uploading/FeatureServer/0?f=json"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Layer name:", data.get("name"))
    print("Fields:")
    for f in data.get("fields", []):
        print(f" - {f.get('name')} ({f.get('type')}, alias: {f.get('alias')})")
