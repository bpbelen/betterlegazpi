import json

with open("c:/Users/belen/OneDrive/Documents/betterlegazpi/scratch/dashboard_data.json", "r", encoding="utf-8") as f:
    d = json.load(f)

print("Top keys:", list(d.keys()))

# Look for dataSources or datasets
if "dataSources" in d:
    print("dataSources:", d["dataSources"])
if "widgets" in d:
    for w in d["widgets"]:
        print("Widget:", w.get("type"), w.get("caption"), w.get("datasets"))
if "mapWidgetIds" in d or "maps" in d:
    print("Maps:", d.get("maps"))

# Recursive search for any strings containing arcgis or http or layer or id
def find_interesting(obj, path=""):
    if isinstance(obj, dict):
        for k, v in obj.items():
            find_interesting(v, f"{path}.{k}")
    elif isinstance(obj, list):
        for i, v in enumerate(obj):
            find_interesting(v, f"{path}[{i}]")
    elif isinstance(obj, str):
        if any(w in obj.lower() for w in ["featureserver", "mapserver", "service", "item", "layer", "http", "p00", "dpwh"]):
            print(f"{path} = {obj[:150]}")

print("\nInteresting items:")
find_interesting(d)
