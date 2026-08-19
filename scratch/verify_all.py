import json

# 1. Verify demographics.json
with open('data/demographics.json', 'r', encoding='utf-8') as f:
    demo = json.load(f)

assert 'barangays' not in demo, 'barangays field still in demographics.json!'
assert demo['population']['total'] == 210616, f"Total pop mismatch: {demo['population']['total']}"
assert demo['barangay_count'] == 70, f"Barangay count mismatch: {demo['barangay_count']}"
print("demographics.json: PASSED")

# 2. Verify barangays.json
with open('data/barangays.json', 'r', encoding='utf-8') as f:
    brgy_json = json.load(f)

assert brgy_json['barangay_count'] == 70, f"Count mismatch: {brgy_json['barangay_count']}"
assert len(brgy_json['data']) == 70, f"Data length mismatch: {len(brgy_json['data'])}"
assert brgy_json['total_population'] == 210616, f"Total population mismatch: {brgy_json['total_population']}"
sum_pop = sum(b['population'] for b in brgy_json['data'])
assert sum_pop == 210616, f"Sum of population mismatch: {sum_pop}"

for b in brgy_json['data']:
    assert b['code'].startswith('050506'), f"Invalid PSGC code: {b['code']}"
    assert b['population'] > 0, f"Invalid population for {b['name']}: {b['population']}"
print("barangays.json: PASSED (70/70 barangays verified, sum = 210,616)")

# 3. Verify JavaScript files node syntax
import subprocess
try:
    res = subprocess.run(['node', '-c', 'assets/js/statistics-new.js'], capture_output=True, text=True)
    if res.returncode == 0:
        print("assets/js/statistics-new.js: Syntax OK")
    else:
        print("assets/js/statistics-new.js syntax error:", res.stderr)

    res2 = subprocess.run(['node', '-c', 'assets/js/statistics.js'], capture_output=True, text=True)
    if res2.returncode == 0:
        print("assets/js/statistics.js: Syntax OK")
    else:
        print("assets/js/statistics.js syntax error:", res2.stderr)
except Exception as e:
    print("Node check error:", e)
