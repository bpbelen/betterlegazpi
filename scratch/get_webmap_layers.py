import urllib.request, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://dpwh.maps.arcgis.com/sharing/rest/content/items/62c6ad03ac354a6f80778004241a7195/data?f=json"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})

with urllib.request.urlopen(req, context=ctx, timeout=20) as resp:
    webmap_data = json.loads(resp.read().decode('utf-8'))
    print("Operational layers count:", len(webmap_data.get("operationalLayers", [])))
    for layer in webmap_data.get("operationalLayers", []):
        print("\nLayer Title:", layer.get("title"))
        print("Layer URL:", layer.get("url"))
        print("Layer ID:", layer.get("id"))
        if "layerDefinition" in layer:
            print("Fields:", [f.get("name") for f in layer["layerDefinition"].get("fields", [])][:15])
            
    with open("c:/Users/belen/OneDrive/Documents/betterlegazpi/scratch/webmap_layers.json", "w", encoding="utf-8") as f:
        json.dump(webmap_data, f, indent=2)
