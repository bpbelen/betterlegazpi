import urllib.request, urllib.parse, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

layer_url = "https://services1.arcgis.com/IwZZTMxZCmAmFYvF/arcgis/rest/services/FloodControl_Data_20250802_v6_corrected_coordinates_for_uploading/FeatureServer/0/query"

# Query where Project_Name LIKE '%Legazpi%' or Municipality LIKE '%Legazpi%' or District LIKE '%Albay 2nd%'
params = {
    "where": "Project_Name LIKE '%Legazpi%' OR Municipality LIKE '%Legazpi%'",
    "outFields": "*",
    "returnGeometry": "true",
    "f": "json"
}

query_url = layer_url + "?" + urllib.parse.urlencode(params)
req = urllib.request.Request(query_url, headers={"User-Agent": "Mozilla/5.0"})

with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
    result = json.loads(resp.read().decode('utf-8'))
    features = result.get("features", [])
    print(f"ArcGIS FeatureServer returned: {len(features)} Legazpi features!")
    if features:
        print("\nAttributes of first feature:")
        print(json.dumps(features[0]["attributes"], indent=2))
        print("\nGeometry of first feature:", features[0].get("geometry"))
        
        # Save all features
        with open("c:/Users/belen/OneDrive/Documents/betterlegazpi/scratch/arcgis_legazpi_features.json", "w", encoding="utf-8") as f:
            json.dump(features, f, indent=2)
