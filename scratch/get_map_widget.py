import json

with open("c:/Users/belen/OneDrive/Documents/betterlegazpi/scratch/dashboard_data.json", "r", encoding="utf-8") as f:
    d = json.load(f)

map_widget = d["desktopView"]["widgets"][1]
print("Map widget keys:", list(map_widget.keys()))
print("Map widget JSON:", json.dumps(map_widget, indent=2))
