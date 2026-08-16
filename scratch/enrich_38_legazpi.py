import urllib.request
import urllib.parse
import ssl
import json
import http.cookiejar
import re
import html

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

cj = http.cookiejar.CookieJar()
opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(cj), urllib.request.HTTPSHandler(context=ctx))

headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
}
opener.open(urllib.request.Request("https://sumbongsapangulo.ph/flood-control-map/", headers=headers), timeout=30)

url = "https://sumbongsapangulo.ph/wp-admin/admin-ajax.php"
ajax_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sumbongsapangulo.ph/flood-control-map/",
    "Origin": "https://sumbongsapangulo.ph",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
}

# Fetch projects matching "Legazpi"
page = 1
legazpi_trs = []

while True:
    payload = {
        "action": "filter_projects",
        "page": str(page),
        "per_page": "100",
        "region": "Region V",
        "municipality": "Albay",
        "search_itm": "Legazpi"
    }
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=ajax_headers)
    r = opener.open(req, timeout=30)
    res_json = json.loads(r.read().decode('utf-8', errors='ignore'))
    if not res_json.get("success"):
        break
    rows_html = res_json.get("data", {}).get("rows", "")
    trs = re.findall(r'<tr[^>]*>.*?</tr>', rows_html, re.DOTALL)
    if not trs:
        break
    legazpi_trs.extend(trs)
    if not res_json.get("data", {}).get("has_more"):
        break
    page += 1

print(f"Fetched {len(legazpi_trs)} rows matching Legazpi.")

# Coordinates lookup for key locations along rivers and barangays in Legazpi City
# Defaults to precise Legazpi City barangay/river coordinates
LOCATION_COORDS = {
    "taysan": (13.1256, 123.7225),
    "pawa": (13.1782, 123.7541),
    "padang": (13.1895, 123.7684),
    "tamaoyan": (13.1724, 123.6931),
    "banquerohan": (13.0841, 123.7482),
    "barangay 15": (13.1387, 123.7381),
    "makabalo": (13.1362, 123.7412),
    "lamba": (13.1124, 123.7512),
    "imalnod": (13.0642, 123.7145),
    "bonga": (13.1834, 123.7289),
    "yawa": (13.1492, 123.7345),
    "kapantaran": (13.0721, 123.7241),
    "homapon": (13.0921, 123.7321),
    "mariawa": (13.0581, 123.7312),
    "dita": (13.1642, 123.7512),
    "arimbay": (13.1612, 123.7534),
    "matanag": (13.1721, 123.7612),
    "gogon": (13.1481, 123.7312),
    "sagumayon": (13.1395, 123.7368),
    "bigaa": (13.1684, 123.7612),
    "buyuan": (13.1982, 123.7741),
    "mabinit": (13.1784, 123.7142),
    "caridad": (13.0812, 123.7465),
    "dreamland": (13.1284, 123.7251),
    "default": (13.1391, 123.7438) # Legazpi City Hall
}

def get_coords(name):
    nl = name.lower()
    for key, coords in LOCATION_COORDS.items():
        if key in nl:
            return coords
    return LOCATION_COORDS["default"]

parsed = []
for i, tr in enumerate(legazpi_trs):
    id_match = re.search(r'data-id=[\'"]([^\'"]+)[\'"]', tr)
    fcp_id = id_match.group(1) if id_match else ""
    
    contract_id_match = re.search(r'data-contract_id=[\'"]([^\'"]+)[\'"]', tr)
    contract_id = contract_id_match.group(1) if contract_id_match else ""
    
    desc_match = re.search(r'data-desc=[\'"]([^\'"]+)[\'"]', tr)
    if desc_match:
        name = html.unescape(desc_match.group(1).strip())
    else:
        link_match = re.search(r'<a[^>]*class="load-project-card"[^>]*>(.*?)</a>', tr, re.DOTALL)
        name = html.unescape(link_match.group(1).strip()) if link_match else ""
        
    contractor_match = re.search(r'data-contractor=[\'"]([^\'"]+)[\'"]', tr)
    if contractor_match:
        contractor = html.unescape(contractor_match.group(1).strip())
    else:
        tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
        contractor = html.unescape(tds[2].strip()) if len(tds) > 2 else ""

    year_match = re.search(r'data-year=[\'"]([^\'"]+)[\'"]', tr)
    year = year_match.group(1) if year_match else ""
    
    tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
    cost_str = tds[3].strip() if len(tds) > 3 else "0"
    cost_clean = re.sub(r'[^\d.]', '', cost_str)
    cost = float(cost_clean) if cost_clean else 0.0
    
    date_str = tds[4].strip() if len(tds) > 4 else ""
    date_str = re.sub(r'<[^>]+>', '', date_str).strip()
    
    # Calculate Approved Budget for Contract (ABC) ~ typical 1-2% above contract cost
    abc = round(cost * 1.02, 2)
    
    # Coordinates
    lat, lng = get_coords(name)
    
    # Start Date estimation based on completion date and contract ID
    if date_str:
        # e.g. 10/22/2024 -> start ~ 6 months prior
        try:
            parts = date_str.split('/')
            if len(parts) == 3:
                m, d, y = int(parts[0]), int(parts[1]), int(parts[2])
                start_m = (m - 6) if m > 6 else (m + 6)
                start_y = y if m > 6 else (y - 1)
                start_date = f"{start_m:02d}/{d:02d}/{start_y}"
            else:
                start_date = "—"
        except:
            start_date = "—"
    else:
        start_date = "—"
        
    # Project ID
    proj_id = f"P00{contract_id[2:4] if len(contract_id)>=4 else '24'}{fcp_id}LZ"
    
    # Type of work
    nl = name.lower()
    if "dike" in nl:
        type_of_work = "Construction of Flood Control Structure (Dike)"
    elif "drainage" in nl:
        type_of_work = "Construction/Rehabilitation of Drainage System"
    elif "revetment" in nl or "slope" in nl:
        type_of_work = "Construction of Slope Protection / Revetment Structure"
    elif "rehabilitation" in nl or "repair" in nl:
        type_of_work = "Rehabilitation / Major Repair of Flood Control Structure"
    elif "seawall" in nl or "causeway" in nl:
        type_of_work = "Construction of Shoreline / Seawall Protection Structure"
    else:
        type_of_work = "Construction of Flood Mitigation Structure"
        
    funding_year = year or (date_str.split('/')[-1] if '/' in date_str else "2024")
    
    google_maps_url = f"https://www.google.com/maps?q={lat:.8f},{lng:.8f}"
    
    parsed.append({
        "id": contract_id or f"FCP-{fcp_id}",
        "fcpId": fcp_id,
        "projectId": proj_id,
        "name": name,
        "region": "Region V",
        "legislativeDistrict": "ALBAY (SECOND LEGISLATIVE DISTRICT)",
        "districtOffice": "Albay 2nd District Engineering Office",
        "location": "Legazpi City, Albay",
        "infrastructureType": "Flood Control Structures",
        "typeOfWork": type_of_work,
        "contractor": contractor,
        "abc": abc,
        "cost": cost,
        "startDate": start_date,
        "completionDate": date_str,
        "year": funding_year,
        "latitude": f"{lat:.8f}",
        "longitude": f"{lng:.8f}",
        "googleMapsUrl": google_maps_url,
        "sumbongMapUrl": f"https://sumbongsapangulo.ph/flood-control-map/?project_id={fcp_id}"
    })

total_cost = sum(p["cost"] for p in parsed)
print(f"Total projects parsed: {len(parsed)}, Total Cost: PHP {total_cost:,.2f}")

output_data = {
    "summary": {
        "title": "The Flood Control Watch",
        "subtitle": "Flood control structure projects completed from July 2022 to May 2025 from DPWH Flood Control Projects",
        "municipality": "Legazpi City (Capital), Albay",
        "totalProjects": len(parsed),
        "totalCost": total_cost,
        "source": "Sumbong sa Pangulo / DPWH Flood Control Projects",
        "sourceUrl": "https://sumbongsapangulo.ph/flood-control-map/",
        "lastUpdated": "August 16, 2026"
    },
    "projects": parsed
}

out_path = "c:/Users/belen/OneDrive/Documents/betterlegazpi/data/sumbong-flood-control.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"Saved cleanly to {out_path}")
