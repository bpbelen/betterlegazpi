import urllib.request
import json
import sys

routes = [
    'http://127.0.0.1:8000/tourism/',
    'http://127.0.0.1:8000/tourism/attractions',
    'http://127.0.0.1:8000/tourism/experience',
    'http://127.0.0.1:8000/tourism/food',
    'http://127.0.0.1:8000/tourism/accommodations',
    'http://127.0.0.1:8000/tourism/landmarks',
    'http://127.0.0.1:8000/data/tourism.json',
    'http://127.0.0.1:8000/data/tourism-attractions.json',
    'http://127.0.0.1:8000/data/tourism-experience.json',
    'http://127.0.0.1:8000/data/tourism-food.json',
    'http://127.0.0.1:8000/data/tourism-accommodations.json',
    'http://127.0.0.1:8000/data/tourism-travel.json'
]

all_passed = True
for url in routes:
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            code = res.getcode()
            body = res.read()
            print(f"[OK] {code} - {url} ({len(body)} bytes)")
    except Exception as e:
        print(f"[FAIL] {url}: {e}")
        all_passed = False

if all_passed:
    print("\n>>> ALL TOURISM ENDPOINTS VERIFIED SUCCESSFULLY! <<<")
else:
    print("\n>>> SOME ENDPOINTS FAILED <<<")
    sys.exit(1)
