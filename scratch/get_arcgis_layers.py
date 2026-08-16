import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://dpwh.maps.arcgis.com/sharing/rest/content/items/f585444def084abaadda090952759e28/data?f=json"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

try:
    with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Dashboard Title / widgets count:", len(data.get("widgets", [])))
        # Find map widget or layer URLs
        for w in data.get("widgets", []):
            if "mapWidgetId" in w or "itemId" in w or "layers" in w:
                print("Widget:", w.get("type"), w.get("title"), w.get("itemId"))
                
        # Dump json to inspect
        with open("c:/Users/belen/OneDrive/Documents/betterlegazpi/scratch/dashboard_data.json", "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
        print("Saved dashboard_data.json")
except Exception as e:
    print("Error:", e)
