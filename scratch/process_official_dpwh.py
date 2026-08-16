import json

with open("c:/Users/belen/OneDrive/Documents/betterlegazpi/scratch/official_dpwh_legazpi.json", "r", encoding="utf-8") as f:
    raw_features = json.load(f)

print(f"Loaded {len(raw_features)} raw DPWH ArcGIS features.")

projects = []
for f in raw_features:
    lat = float(f.get("Latitude", 0))
    lng = float(f.get("Longitude", 0))
    cost = float(f.get("ContractCost", 0))
    abc = float(f.get("ABC", cost * 1.02))
    
    contract_id = f.get("ContractID") or ""
    project_id = f.get("ProjectID") or ""
    name = f.get("ProjectDescription") or ""
    type_of_work = f.get("TypeofWork") or "Flood Mitigation Structure"
    infra_type = f.get("infra_type") or "Flood Control Structures"
    contractor = f.get("Contractor") or "DPWH Albay 2nd DEO"
    
    funding_year = str(f.get("FundingYear") or f.get("CompletionYear") or "2024")
    completion_date = f.get("CompletionDateActual") or ""
    start_date = f.get("StartDate") or "—"
    
    google_maps_url = f"https://www.google.com/maps?q={lat:.8f},{lng:.8f}"
    
    projects.append({
        "id": contract_id or project_id,
        "projectId": project_id,
        "contractId": contract_id,
        "name": name,
        "region": f.get("Region") or "Region V",
        "province": f.get("Province") or "ALBAY",
        "municipality": f.get("Municipality") or "LEGAZPI CITY (CAPITAL) (ALBAY)",
        "legislativeDistrict": f.get("LegislativeDistrict") or "ALBAY (SECOND LEGISLATIVE DISTRICT)",
        "districtOffice": f.get("DistrictEngineeringOffice") or "Albay 2nd District Engineering Office",
        "location": "Legazpi City, Albay",
        "typeOfWork": type_of_work,
        "infrastructureType": infra_type,
        "contractor": contractor,
        "abc": abc,
        "cost": cost,
        "startDate": start_date,
        "completionDate": completion_date,
        "completionYear": f.get("CompletionYear") or int(funding_year) if funding_year.isdigit() else 2024,
        "fundingYear": funding_year,
        "latitude": f"{lat:.8f}",
        "longitude": f"{lng:.8f}",
        "googleMapsUrl": google_maps_url,
        "source": "DPWH Flood Control Projects / Sumbong sa Pangulo"
    })

# Sort projects initially by cost descending
projects.sort(key=lambda p: p.get("cost", 0), reverse=True)

total_cost = sum(p["cost"] for p in projects)
print(f"Processed {len(projects)} projects. Total Cost: PHP {total_cost:,.2f}")

output = {
    "summary": {
        "title": "The Flood Control Watch",
        "subtitle": "Flood control structure projects completed from July 2022 to May 2025 from the DPWH Flood Control Projects",
        "municipality": "Legazpi City (Capital), Albay",
        "totalProjects": len(projects),
        "totalCost": total_cost,
        "source": "DPWH Flood Control Projects (July 2022 - May 2025)",
        "sourceUrl": "https://sumbongsapangulo.ph/flood-control-map/",
        "lastUpdated": "August 16, 2026"
    },
    "projects": projects
}

out_path = "c:/Users/belen/OneDrive/Documents/betterlegazpi/data/sumbong-flood-control.json"
with open(out_path, "w", encoding="utf-8") as out_f:
    json.dump(output, out_f, indent=2, ensure_ascii=False)

print(f"Successfully written to {out_path}")
