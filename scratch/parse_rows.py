import re

with open('scratch/nhfr_search_legazpi.html', encoding='utf-8') as f:
    html = f.read()

# Let's find table headers and cell contents
headers = re.findall(r'<th[^>]*>([\s\S]*?)</th>', html)
print('Headers:', [re.sub(r'<[^>]+>', '', h).strip() for h in headers if h.strip()])

all_tr = re.findall(r'<tr[^>]*data-rowindex=[\'"]\d+[\'"][\s\S]*?</tr>', html)
print('Total TRs:', len(all_tr))
for i, tr in enumerate(all_tr[:10]):
    tds = re.findall(r'<td[^>]*>([\s\S]*?)</td>', tr)
    clean_tds = [re.sub(r'<[^>]+>', '', td).strip() for td in tds]
    print(f'Row {i}:', clean_tds)
