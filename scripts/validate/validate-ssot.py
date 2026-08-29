"""Check data/health-facilities.json for internal consistency.

Asserts that the record count and the published summary agree with each other
rather than with a number typed into this file, so the check keeps working as
the directory grows.
"""

import json
import sys

with open('data/health-facilities.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

facilities = data['facilities']
counts = data['summary_counts']
errors = []

print('JSON VALIDATION PASS: Total facilities =', len(facilities))
print('Schema version:', data.get('_schema_version'))
print('Summary counts in JSON:', json.dumps(counts, indent=2))

required_keys = ['id', 'name', 'category', 'type', 'ownership', 'address',
                 'contact', 'accreditations', 'services', 'emergency_24_7']
for idx, fac in enumerate(facilities):
    for key in required_keys:
        if key not in fac:
            errors.append('Facility %d (%s) missing key: %s' % (idx, fac.get('name'), key))

if counts.get('total') != len(facilities):
    errors.append('summary_counts.total is %s but there are %d facilities'
                  % (counts.get('total'), len(facilities)))

seen = {}
for fac in facilities:
    if fac['id'] in seen:
        errors.append('Duplicate facility id: %s' % fac['id'])
    seen[fac['id']] = fac

# Every category count in the summary must match the records it describes.
category_fields = {
    'hospitals': 'Hospital',
    'super_health_centers': 'Super Health Center & RHU',
    'birthing_homes': 'Birthing & Lying-in Clinic',
    'laboratories': 'Diagnostic Laboratory',
    'dialysis_centers': 'Dialysis Center',
    'drug_testing_laboratories': 'Drug Testing Laboratory',
    'ambulatory_surgical_clinics': 'Ambulatory Surgical Clinic',
    'blood_service_facilities': 'Blood Service Facility',
    'barangay_health_stations': 'Barangay Health Station',
}
for field, category in category_fields.items():
    actual = sum(1 for f in facilities if f['category'] == category)
    if field in counts and counts[field] != actual:
        errors.append('summary_counts.%s is %s but %d facilities are %s'
                      % (field, counts[field], actual, category))

# Data notes must point at facilities that exist.
for note in data.get('_data_notes', []):
    if note.get('facility_id') and note['facility_id'] not in seen:
        errors.append('_data_notes references unknown facility %s' % note['facility_id'])

if errors:
    print('\nFAILED (%d problem(s)):' % len(errors))
    for error in errors:
        print('  -', error)
    sys.exit(1)

print('\nAll %d health facility objects are internally consistent.' % len(facilities))
