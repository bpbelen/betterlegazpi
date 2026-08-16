import urllib.request
import urllib.parse
import ssl
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Search for DPWH ArcGIS FeatureServer endpoints
# Common DPWH ArcGIS servers:
# https://services.arcgis.com/..., https://gis.dpwh.gov.ph/..., etc.

test_urls = [
    "https://gis.dpwh.gov.ph/arcgis/rest/services",
    "https://services3.arcgis.com/",
    "https://services5.arcgis.com/",
    "https://services.arcgis.com/"
]

# Let's search via search_web or query known public Esri services for "DPWH Flood Control Projects completed July 2022 to May 2025"
print("Testing Esri / ArcGIS layer discovery...")
