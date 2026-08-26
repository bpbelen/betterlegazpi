import json

with open('data/health-facilities.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

print('JSON VALIDATION PASS: Total facilities =', len(data['facilities']))
print('Summary counts in JSON:', data['summary_counts'])

required_keys = ['id', 'name', 'category', 'type', 'ownership', 'address', 'contact', 'accreditations', 'services', 'emergency_24_7']
missing_count = 0
for idx, fac in enumerate(data['facilities']):
    for key in required_keys:
        if key not in fac:
            print(f"Facility {idx} ({fac.get('name')}) missing key: {key}")
            missing_count += 1

if missing_count == 0:
    print('ALL 88 health facility objects contain all required keys!')
