import urllib.request
import json
import re
import csv
import io

csv_raw = """"Province, City, Municipality, 
and Barangay",,,"Total 
Population",
,CITY OF LEGAZPI ,,"210,616",
,Bgy. 47 - Arimbay,,"4,085",
,Bgy. 64 - Bagacay,,"1,869",
,Bgy. 48 - Bagong Abre,,"1,675",
,Bgy. 66 - Banquerohan,,"8,918",
,Bgy. 1 - Em's Barrio ,,"3,259",
,Bgy. 11 - Maoyod Pob.,,"1,505",
,Bgy. 12 - Tula-tula ,,"1,041",
,Bgy. 13 - Ilawod West Pob.,,365,
,Bgy. 14 - Ilawod Pob.,,719,
,Bgy. 15 - Ilawod East Pob.,,"2,386",
,Bgy. 16 - Kawit-East Washington Drive ,,"5,420",
,"Bgy. 17 - Rizal Street., Ilawod ",,"2,365",
,Bgy. 19 - Cabagñan,,"1,611",
,Bgy. 2 - Em's Barrio South ,,"1,416",
,Bgy. 18 - Cabagñan West ,,"4,133",
,Bgy. 21 - Binanuahan West ,,770,
,Bgy. 22 - Binanuahan East ,,"1,861",
,Bgy. 23 - Imperial Court Subd. ,,"1,202",
,Bgy. 20 - Cabagñan East ,,707,
,Bgy. 25 - Lapu-lapu ,,"2,730",
,Bgy. 26 - Dinagaan ,,534,
,Bgy. 27 - Victory Village South ,,"1,451",
,Bgy. 28 - Victory Village North ,,"1,487",
,Bgy. 29 - Sabang ,,"1,894",
,Bgy. 3 - Em's Barrio East ,,945,
,Bgy. 36 - Kapantawan ,,404,
,Bgy. 30 - Pigcale ,,"1,210",
,Bgy. 31 - Centro-Baybay ,,"1,088",
,Bgy. 33 - PNR-Peñaranda St.-Iraya ,,"2,887",
,Bgy. 34 - Oro Site-Magallanes St. ,,"2,140",
,Bgy. 35 - Tinago ,,340,
,Bgy. 37 - Bitano ,,"7,546",
,Bgy. 39 - Bonot ,,"2,375",
,Bgy. 4 - Sagpon Pob.,,975,
,Bgy. 5 - Sagmin Pob.,,"1,037",
,Bgy. 6 - Bañadero Pob.,,"1,289",
,Bgy. 7 - Baño ,,559,
,Bgy. 8 - Bagumbayan ,,"2,564",
,Bgy. 9 - Pinaric ,,"1,414",
,Bgy. 67 - Bariis,,"1,739",
,Bgy. 49 - Bigaa,,"7,287",
,Bgy. 41 - Bogtong,,"5,389",
,Bgy. 53 - Bonga,,"4,308",
,Bgy. 69 - Buenavista,,"1,419",
,Bgy. 51 - Buyuan,,"4,200",
,Bgy. 70 - Cagbacong,,"3,019",
,Bgy. 40 - Cruzada,,"7,030",
,Bgy. 57 - Dap-dap,,"1,746",
,Bgy. 45 - Dita,,"2,167",
,Bgy. 55 - Estanza,,"4,963",
,Bgy. 38 - Gogon,,"6,534",
,Bgy. 62 - Homapon,,"5,250",
,Bgy. 65 - Imalnod,,"2,798",
,Bgy. 54 - Mabinit,,"1,699",
,Bgy. 63 - Mariawa,,"2,026",
,Bgy. 61 - Maslog,,"5,320",
,Bgy. 50 - Padang,,"1,949",
,Bgy. 44 - Pawa,,"4,585",
,Bgy. 59 - Puro,,"5,215",
,Bgy. 42 - Rawis,,"10,330",
,Bgy. 68 - San Francisco,,"2,322",
,Bgy. 46 - San Joaquin,,"1,903",
,Bgy. 32 - San Roque,,"5,452",
,Bgy. 43 - Tamaoyan,,"1,809",
,Bgy. 56 - Taysan,,"20,017",
,Bgy. 52 - Matanag,,"1,904",
,Bgy. 10 - Cabugao,,452,
,Bgy. 24 - Rizal Street,,"1,826",
,Bgy. 58 - Buragwis,,"4,329",
,Bgy. 60 - Lamba,,"1,453",
"""

reader = csv.reader(io.StringIO(csv_raw.strip()))
parsed_csv = []
total_pop = 0

for row in reader:
    non_empty = [c.strip() for c in row if c.strip()]
    if len(non_empty) == 2:
        name, pop_str = non_empty[0], non_empty[1]
        if 'CITY OF LEGAZPI' in name or 'Population' in name:
            continue
        try:
            pop = int(pop_str.replace(',', ''))
            parsed_csv.append({'name': name, 'population': pop})
            total_pop += pop
        except ValueError:
            pass

print(f"Parsed {len(parsed_csv)} barangays from CSV. Sum of populations = {total_pop:,} (Legazpi Total = 210,616)")

req = urllib.request.Request(
    'https://psgc.gitlab.io/api/cities-municipalities/050506000/barangays.json',
    headers={'User-Agent': 'Mozilla/5.0'}
)
with urllib.request.urlopen(req) as resp:
    psgc_list = json.loads(resp.read().decode('utf-8'))

def extract_bgy_num(name):
    m = re.search(r'Bgy\.?\s*(\d+)', name, re.IGNORECASE)
    return int(m.group(1)) if m else None

psgc_map = {}
for p in psgc_list:
    num = extract_bgy_num(p['name'])
    if num is not None:
        psgc_map[num] = p

matched_records = []
for item in parsed_csv:
    num = extract_bgy_num(item['name'])
    psgc_item = psgc_map.get(num)
    if psgc_item:
        matched_records.append({
            'code': psgc_item['code'],
            'psgc10DigitCode': psgc_item.get('psgc10DigitCode'),
            'name': psgc_item['name'],
            'census_name': item['name'],
            'population': item['population'],
            'urban_rural': 'Urban' if 'Pob' in psgc_item['name'] or 'Pob' in item['name'] else 'Rural'
        })
    else:
        print(f"UNMATCHED: {item}")

print(f"Matched {len(matched_records)} out of {len(parsed_csv)} with PSGC official codes.")
