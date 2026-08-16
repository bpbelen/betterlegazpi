import urllib.request, urllib.parse, ssl, json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

layer_url = "https://services1.arcgis.com/IwZZTMxZCmAmFYvF/arcgis/rest/services/FloodControl_Data_20250802_v6_corrected_coordinates_for_uploading/FeatureServer/0/query"

# Query where Province = 'ALBAY'
params = {
    "where": "Province = 'ALBAY' OR Province = 'Albay'",
    "outFields": "*",
    "returnGeometry": "false",
    "f": "json"
}

query_url = layer_url + "?" + urllib.parse.urlencode(params)
req = urllib.request.Request(query_url, headers={"User-Agent": "Mozilla/5.0"})

with urllib.request.urlopen(req, context=ctx, timeout=30) as resp:
    result = json.loads(resp.read().decode('utf-8'))
    features = result.get("features", [])
    print(f"Total Albay features in official DPWH FeatureServer: {len(features)}")
    
    # Filter for Legazpi
    legazpi_features = []
    for f in features:
        attrs = f.get("attributes", {})
        muni = str(attrs.get("Municipality", "")).upper()
        desc = str(attrs.get("ProjectDescription", "")).upper()
        if "LEGAZPI" in muni or "LEGAZPI" in desc:
            legazpi_features.append(attrs)
            
    print(f"Total Legazpi City features: {len(legazpi_features)}")
    if legazpi_features:
        print("\nFirst Legazpi feature attributes:")
        print(json.dumps(legazpi_features[0], indent=2))
        
    with open("c:/Users/belen/OneDrive/Documents/betterlegazpi/scratch/official_dpwh_legazpi.json", "w", encoding="utf-8") as out_f:
        json.dump(legazpi_features, out_f, indent=2)
