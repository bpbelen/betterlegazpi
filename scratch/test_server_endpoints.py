import urllib.request
import json

# Test fetching statistics page and json
res_html = urllib.request.urlopen('http://localhost:8000/statistics/index.html')
assert res_html.status == 200
html_content = res_html.read().decode('utf-8')

assert 'id="barangaySearchInput"' in html_content, "Missing barangaySearchInput"
assert 'id="barangayListContainer"' in html_content, "Missing barangayListContainer"
assert 'id="distributionPieChart"' in html_content, "Missing distributionPieChart"
assert 'id="populationBarChart"' not in html_content, "populationBarChart should be removed"
print("HTML Validation: PASSED (Search input present, container present, old bar chart removed)")

res_json = urllib.request.urlopen('http://localhost:8000/data/barangays.json')
assert res_json.status == 200
b_json = json.loads(res_json.read().decode('utf-8'))
assert b_json['barangay_count'] == 70
assert len(b_json['data']) == 70
assert b_json['total_population'] == 210616
print("JSON Server Validation: PASSED (70 barangays served at /data/barangays.json)")

res_demo = urllib.request.urlopen('http://localhost:8000/data/demographics.json')
assert res_demo.status == 200
demo_json = json.loads(res_demo.read().decode('utf-8'))
assert 'barangays' not in demo_json, "barangays should not be in demographics.json"
assert demo_json['population']['total'] == 210616
print("Demographics JSON Validation: PASSED (barangays field removed, total population = 210,616)")
