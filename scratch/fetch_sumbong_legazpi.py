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
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.5",
}

print("Initializing session with sumbongsapangulo.ph...")
main_req = urllib.request.Request("https://sumbongsapangulo.ph/flood-control-map/", headers=headers)
try:
    resp = opener.open(main_req, timeout=30)
    print("Session established, status:", resp.status)
except Exception as e:
    print("Error opening main page:", e)

url = "https://sumbongsapangulo.ph/wp-admin/admin-ajax.php"
ajax_headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "X-Requested-With": "XMLHttpRequest",
    "Referer": "https://sumbongsapangulo.ph/flood-control-map/",
    "Origin": "https://sumbongsapangulo.ph",
    "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8"
}

all_albay_trs = []
page = 1

while True:
    payload = {
        "action": "filter_projects",
        "page": str(page),
        "per_page": "100",
        "region": "Region V",
        "municipality": "Albay"
    }
    data = urllib.parse.urlencode(payload).encode('utf-8')
    req = urllib.request.Request(url, data=data, headers=ajax_headers)
    try:
        r = opener.open(req, timeout=30)
        res_json = json.loads(r.read().decode('utf-8', errors='ignore'))
        if not res_json.get("success"):
            print(f"Page {page} returned success=False")
            break
        rows_html = res_json.get("data", {}).get("rows", "")
        trs = re.findall(r'<tr[^>]*>.*?</tr>', rows_html, re.DOTALL)
        if not trs:
            print(f"Page {page}: no TRs found")
            break
        all_albay_trs.extend(trs)
        print(f"Fetched Page {page}: {len(trs)} rows (total Albay rows so far: {len(all_albay_trs)})")
        if not res_json.get("data", {}).get("has_more"):
            break
        page += 1
    except Exception as e:
        print(f"Error on page {page}:", e)
        break

print(f"\nTotal Albay projects fetched: {len(all_albay_trs)}")

# Now parse each TR into a structured dict
parsed_projects = []
for tr in all_albay_trs:
    # Extract data attributes from button.open-report-form or a.load-project-card
    id_match = re.search(r'data-id=[\'"]([^\'"]+)[\'"]', tr)
    fcp_id = id_match.group(1) if id_match else ""
    
    contract_id_match = re.search(r'data-contract_id=[\'"]([^\'"]+)[\'"]', tr)
    contract_id = contract_id_match.group(1) if contract_id_match else ""
    
    desc_match = re.search(r'data-desc=[\'"]([^\'"]+)[\'"]', tr)
    if desc_match:
        name = html.unescape(desc_match.group(1).strip())
    else:
        # Fallback to a text content
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
    
    # Parse table cells for cost and date
    tds = re.findall(r'<td[^>]*>(.*?)</td>', tr, re.DOTALL)
    # Cell 0: Description with link
    # Cell 1: Location (ALBAY)
    # Cell 2: Contractor
    # Cell 3: Cost (e.g. 98,998,134.14)
    # Cell 4: Date (e.g. 10/22/2024)
    cost_str = tds[3].strip() if len(tds) > 3 else "0"
    cost_clean = re.sub(r'[^\d.]', '', cost_str)
    cost = float(cost_clean) if cost_clean else 0.0
    
    date_str = tds[4].strip() if len(tds) > 4 else ""
    # Strip inner HTML tags from date_str
    date_str = re.sub(r'<[^>]+>', '', date_str).strip()
    
    # Check if this project belongs to Legazpi City
    is_legazpi = False
    name_lower = name.lower()
    if "legazpi" in name_lower or "legasp" in name_lower:
        is_legazpi = True
    elif "yawa" in name_lower or "macabalo" in name_lower or "tibu" in name_lower or "padang" in name_lower or "dapdap" in name_lower or "rawis" in name_lower or "em's barrio" in name_lower or "bagumbayan" in name_lower:
        is_legazpi = True
    elif contract_id.startswith("24FB") or contract_id.startswith("23FB") or contract_id.startswith("22FB") or contract_id.startswith("21FB") or contract_id.startswith("20FB") or contract_id.startswith("19FB") or contract_id.startswith("18FB") or contract_id.startswith("17FB") or contract_id.startswith("16FB"):
        # "FB" indicates Albay 2nd District (Legazpi City / 2nd District)
        is_legazpi = True
        
    if is_legazpi:
        # Determine type of work
        type_of_work = "Flood Mitigation Structure"
        if "dike" in name_lower:
            type_of_work = "Construction of Flood Control Structure (Dike)"
        elif "drainage" in name_lower:
            type_of_work = "Construction/Rehabilitation of Drainage System"
        elif "rehabilitation" in name_lower or "repair" in name_lower or "upgrading" in name_lower:
            type_of_work = "Rehabilitation / Major Repair of Flood Control Structure"
        elif "seawall" in name_lower or "causeway" in name_lower or "shore" in name_lower:
            type_of_work = "Construction of Shoreline / Seawall Protection Structure"
        elif "revetment" in name_lower:
            type_of_work = "Construction of Revetment Structure"
        else:
            type_of_work = "Construction of Flood Mitigation Structure"
            
        # Determine year if missing
        if not year and date_str:
            year_match = re.search(r'\d{4}', date_str)
            if year_match:
                year = year_match.group(0)
        if not year and contract_id and len(contract_id) >= 2 and contract_id[:2].isdigit():
            year = "20" + contract_id[:2]
            
        parsed_projects.append({
            "id": contract_id or f"FCP-{fcp_id}",
            "fcpId": fcp_id,
            "name": name,
            "location": "Legazpi City, Albay",
            "typeOfWork": type_of_work,
            "contractor": contractor or "DPWH Albay 2nd DEO / Pending",
            "cost": cost,
            "year": year or "2024",
            "date": date_str,
            "source": "Sumbong sa Pangulo",
            "mapUrl": f"https://sumbongsapangulo.ph/flood-control-map/?project_id={fcp_id}" if fcp_id else "https://sumbongsapangulo.ph/flood-control-map/"
        })

print(f"\nFiltered Legazpi City projects: {len(parsed_projects)}")

# Calculate total cost
total_cost = sum(p["cost"] for p in parsed_projects)
print(f"Total Cost for Legazpi City Flood Control: PHP {total_cost:,.2f}")

# Save to data/sumbong-flood-control.json
output_data = {
    "summary": {
        "title": "Sumbong sa Pangulo - Flood Control Projects in Legazpi City",
        "municipality": "Legazpi City (Capital), Albay",
        "totalProjects": len(parsed_projects),
        "totalCost": total_cost,
        "source": "Sumbong sa Pangulo Flood Control Map",
        "sourceUrl": "https://sumbongsapangulo.ph/flood-control-map/",
        "lastUpdated": "August 16, 2026"
    },
    "projects": parsed_projects
}

out_path = "c:/Users/belen/OneDrive/Documents/betterlegazpi/data/sumbong-flood-control.json"
with open(out_path, "w", encoding="utf-8") as f:
    json.dump(output_data, f, indent=2, ensure_ascii=False)

print(f"Saved successfully to {out_path}")

