#!/usr/bin/env python3
"""Enrich data/health-facilities.json with DOH HFSRB licensing data and DOH
Bicol CHD certified animal-bite treatment centres.

Run AFTER scripts/data/generate-health-facilities.py, which rebuilds the base
88 records (70 barangay health stations from data/barangays.json plus 18
hand-maintained city facilities) from Python literals and overwrites the JSON
wholesale. This script is the enrichment pass on top of that output:

    python scripts/data/generate-health-facilities.py
    python scripts/data/fetch-hfsrb-facilities.py

Precedence rule: the DOH National Health Facility Registry wins. HFSRB
publishes the registry's own `NHFR CODE` column, so it is authoritative for
`doh_code`; a disagreeing local value is preserved as a data note rather than
discarded. The one deliberate override is BRHMC, which both DOH sources file
under Daraga but which this directory keeps as a Legazpi facility -- the
conflict is recorded, not acted on.

Nothing new is added to the facility record schema. HFSRB licensing and ABTC
certification ride inside the existing `accreditations` object, mirroring the
`is_yakap_accredited` / `yakap_validity` pair already there. Every conflict
lands in the top-level `_data_notes`, which is document metadata alongside
`_sources` and `_schema_version`.

Writes:
    data/health-facilities.json                 merged directory
    scripts/data/hfsrb-merge-review.json        pairs needing a human decision
"""

import csv
import difflib
import io
import json
import os
import re
import ssl
import sys
import unicodedata
import time
import urllib.request
from datetime import date

HFSRB_INDEX = 'https://hfsrb.doh.gov.ph/list-of-licensed-health-facilities/'
ABTC_INDEX = 'https://bicol.doh.gov.ph/certified-animal-bite-treatment-centers/'
UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126 Safari/537.36'

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
DATA_PATH = os.path.join(REPO_ROOT, 'data', 'health-facilities.json')
REVIEW_PATH = os.path.join(REPO_ROOT, 'scripts', 'data', 'hfsrb-merge-review.json')

CITY = 'legazpi city'

# HFSRB facility types we ingest, mapped onto this directory's category
# vocabulary. `id_prefix` is None where the type never becomes a card of its
# own: a licence held by a hospital already in the directory is folded into
# that hospital as a service, one card per real-world building.
HFSRB_TYPES = {
    'Hospital': {
        'category': 'Hospital', 'id_prefix': 'hosp', 'service': None,
    },
    'Clinical Laboratory': {
        'category': 'Diagnostic Laboratory', 'id_prefix': 'lab',
        'service': 'Clinical Laboratory',
    },
    'Birthing Home Facility': {
        'category': 'Birthing & Lying-in Clinic', 'id_prefix': 'birth',
        'service': 'Birthing & Maternity Care',
    },
    'Dialysis Clinic': {
        'category': 'Dialysis Center', 'id_prefix': 'dialysis',
        'service': 'Hemodialysis',
    },
    'Ambulatory Surgical Clinic (ASC)': {
        'category': 'Ambulatory Surgical Clinic', 'id_prefix': 'asc',
        'service': 'Ambulatory Surgery',
    },
    'Blood Service Facility (BSF)': {
        'category': 'Blood Service Facility', 'id_prefix': 'blood',
        'service': 'Blood Services',
    },
    'Drug Testing Laboratories (DTL)': {
        'category': 'Drug Testing Laboratory', 'id_prefix': 'dtl',
        'service': 'Drug Testing',
    },
    'Cancer Treatment Facility': {
        'category': None, 'id_prefix': None, 'service': 'Cancer Treatment',
    },
    'Primary Care Facility (PCF)': {
        'category': 'PhilHealth YAKAP Clinic', 'id_prefix': 'yakap',
        'service': 'Primary Care',
    },
    'Infirmary': {
        'category': 'Hospital', 'id_prefix': 'hosp', 'service': 'Infirmary Care',
    },
    'Psychiatric Care Facilities': {
        'category': 'Hospital', 'id_prefix': 'hosp', 'service': 'Psychiatric Care',
    },
    'Ambulance Service Provider': {
        'category': None, 'id_prefix': None, 'service': 'Ambulance Service',
    },
    'Newborn Screening Facilities': {
        'category': None, 'id_prefix': None, 'service': 'Newborn Screening',
    },
}

# HFSRB heads the facility-name column differently per sheet: NAME OF FACILITY,
# NAME OF HOSPITAL, NAME OF CLINIC, or Facility Name.
NAME_COLUMN = r'name of (facility|hospital|clinic|laborator|cent[er]r?e?)|facility name'

SSL_CTX = ssl.create_default_context()


def fetch(url, timeout=120, attempts=4):
    """Fetch with retries.

    The DOH hosts and Google's sheet exports both time out intermittently, and
    a single dropped read part-way through 13 workbooks would otherwise lose
    the whole run.
    """
    last = None
    for attempt in range(attempts):
        try:
            req = urllib.request.Request(url, headers={'User-Agent': UA})
            with urllib.request.urlopen(req, timeout=timeout, context=SSL_CTX) as resp:
                return resp.read().decode('utf-8', 'replace')
        except Exception as exc:
            last = exc
            time.sleep(2 * (attempt + 1))
    raise last


def strip_tags(fragment):
    fragment = re.sub(r'<script.*?</script>|<style.*?</style>', '', fragment, flags=re.S)
    return re.sub(r'<[^>]+>', '', fragment)


def unescape(text):
    import html as html_mod
    return html_mod.unescape(text)


def clean(value):
    """Collapse whitespace. HFSRB names carry stray newlines and trailing spaces."""
    return re.sub(r'\s+', ' ', (value or '')).strip()


def normalize_name(name):
    """Fold a facility name to a comparable key.

    Strips accents, expands "&", and drops corporate suffixes and punctuation so
    that "ESTEVEZ MEMORIAL HOSPITAL, INC." and "Estevez Memorial Hospital, Inc."
    collapse to the same key.
    """
    key = clean(name).lower()
    key = unicodedata.normalize('NFKD', key)
    key = ''.join(c for c in key if not unicodedata.combining(c))
    key = re.sub(r'\((?:[^)]*)\)', ' ', key)
    key = key.replace('&', ' and ')
    key = re.sub(r'[^a-z0-9 ]+', ' ', key)
    for suffix in (' inc', ' incorporated', ' corp', ' corporation', ' co'):
        key = re.sub(suffix + r'\b', ' ', key)
    return re.sub(r'\s+', ' ', key).strip()


# Words that describe what a facility *is* rather than which one it is. DOH and
# this directory word them differently for the same building -- "University of
# Santo Tomas (UST) - Legazpi, Inc." against "University of Santo Tomas -
# Legazpi Hospital" -- so a second key with these removed catches the pair
# without resorting to fuzzy matching.
GENERIC_WORDS = {
    'hospital', 'hospitals', 'clinic', 'clinics', 'laboratory', 'laboratories',
    'lab', 'labs', 'center', 'centre', 'centers', 'medical', 'diagnostic',
    'diagnostics', 'health', 'healthcare', 'care', 'services', 'service',
    'and', 'the', 'of', 'city', 'legazpi', 'albay',
}


def core_name(name):
    # Single characters are the debris of possessives -- "Mary's" and "Lana's"
    # both leave a bare "s" that would otherwise count as a shared word.
    words = [w for w in normalize_name(name).split()
             if w not in GENERIC_WORDS and len(w) > 1]
    return ' '.join(words)


# --------------------------------------------------------------------------
# HFSRB
# --------------------------------------------------------------------------

def hfsrb_newest_links():
    """Map each HFSRB facility type to its most recently published sheet.

    The index groups links under a bullet per type, newest first. Parsing the
    index rather than pinning URLs means a later run picks up the next quarter
    without editing this file.
    """
    body = fetch(HFSRB_INDEX)
    main = re.search(r'<(main|article)[^>]*>.*?</\1>', body, re.S)
    body = main.group(0) if main else body
    body = re.sub(r'<script.*?</script>|<style.*?</style>', '', body, flags=re.S)
    body = unescape(body)

    links = {}
    current = None
    pattern = r'(⦿[^<:]{3,70}:)|(<a[^>]+href="(https://docs\.google[^"]+)"[^>]*>(.*?)</a>)'
    for bullet, _whole, url, label in re.findall(pattern, body, re.S):
        if bullet:
            current = bullet.strip('⦿: ').strip()
            links.setdefault(current, [])
        elif current and not links[current]:
            links[current].append((clean(strip_tags(label)), url))
    return {k: v[0] for k, v in links.items() if v}


def sheet_rows(pub_url):
    """Yield (header, row) pairs from every tab of a published Google Sheet.

    Each workbook holds a regional-summary tab plus separate government and
    private facility tabs, so every tab has to be walked and the summary tabs
    skipped by looking for a recognisable name column.
    """
    base = pub_url.rsplit('/pubhtml', 1)[0]
    gids = sorted(set(re.findall(r'gid=(\d+)', fetch(pub_url))))
    for gid in gids:
        try:
            text = fetch('%s/pub?gid=%s&single=true&output=csv' % (base, gid))
        except Exception as exc:  # a single unavailable tab must not abort the run
            print('    ! tab %s unavailable: %s' % (gid, exc), file=sys.stderr)
            continue
        rows = list(csv.reader(io.StringIO(text)))
        header = None
        for row in rows:
            cells = [clean(c) for c in row]
            if not header:
                if any(re.search(NAME_COLUMN, c, re.I) for c in cells):
                    header = cells
                continue
            yield header, cells


def column(header, row, *patterns):
    for pattern in patterns:
        for idx, name in enumerate(header):
            if re.search(pattern, name, re.I) and idx < len(row):
                value = clean(row[idx])
                if value:
                    return value
    return ''


def scrape_hfsrb():
    """Collect Legazpi City rows for every ingested HFSRB type.

    Filtering keys on the city/municipality column alone. Matching any cell
    would drag in XAVIER EYE CENTER (Legazpi Village, Makati) and facilities
    whose name says Legazpi but which sit in Daraga.
    """
    links = hfsrb_newest_links()
    collected = {}
    for type_name, config in HFSRB_TYPES.items():
        if type_name not in links:
            print('  ! HFSRB index has no entry for %s' % type_name, file=sys.stderr)
            continue
        label, url = links[type_name]
        as_of = parse_as_of(label)
        rows = []
        try:
            sheet = list(sheet_rows(url))
        except Exception as exc:
            print('  ! %s unreachable, skipped: %s' % (type_name, exc), file=sys.stderr)
            continue
        for header, row in sheet:
            city = column(header, row, r'city.*munic', r'^address$')
            if city.lower() != CITY:
                # Drug-testing labs publish one address column instead of a
                # city column; fall back to a bounded check on that field.
                address = column(header, row, r'^address$')
                if not (address and re.search(r'\blegazpi city\b', address, re.I)):
                    continue
                if re.search(r'\bdaraga\b', address, re.I):
                    continue
            name = column(header, row, NAME_COLUMN)
            if not name:
                continue
            rows.append({
                'name': name,
                'nhfr_code': column(header, row, r'nhfr code'),
                'accreditation_no': column(header, row, r'accreditation no'),
                'address': column(header, row, r'bldg|street|^address$'),
                'ownership': column(header, row, r'^ownership$') or 'Private',
                'institute_type': column(header, row, r'institute type'),
                'services': column(header, row, r'^services$'),
                'landline': column(header, row, r'telno|contact no'),
                'mobile': column(header, row, r'mobileno'),
                'hfsrb_type': type_name,
                'as_of': as_of,
                'source_label': label,
                'source_url': url,
            })
        collected[type_name] = {'as_of': as_of, 'label': label, 'url': url, 'rows': rows}
        print('  %-38s %2d Legazpi row(s)  [%s]' % (type_name, len(rows), as_of or '?'))
    return collected


def parse_as_of(label):
    match = re.search(r'as of\s+([A-Za-z]+)\s*(\d{1,2}),?\s*(\d{4})', clean(label), re.I)
    if not match:
        return ''
    months = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
              'august', 'september', 'october', 'november', 'december']
    try:
        month = months.index(match.group(1).lower()) + 1
    except ValueError:
        return ''
    return '%s-%02d-%02d' % (match.group(3), month, int(match.group(2)))


# --------------------------------------------------------------------------
# Animal bite treatment centres
# --------------------------------------------------------------------------

def scrape_abtc():
    """Certified ABTCs in Legazpi City, from the DOH Bicol CHD tabbed list.

    Each card is an expiry paragraph, an <h4> name and a location line. The
    Albay pane also carries BRHMC's ABTC filed under Daraga -- that row is
    picked up separately as a data note, not as a Legazpi record.
    """
    body = fetch(ABTC_INDEX)
    cards = re.findall(
        r'Expiry Date:\s*([^<]+)</p>\s*<h4[^>]*>(.*?)</h4>\s*<p[^>]*>(.*?)</p>',
        body, re.S)
    found = []
    for expiry, name, location in cards:
        entry = {
            'name': clean(unescape(strip_tags(name))),
            'location': clean(unescape(strip_tags(location))),
            'expiry_raw': clean(expiry),
            'expiry': parse_expiry(clean(expiry)),
        }
        found.append(entry)
    legazpi = [e for e in found if re.search(r'\blegazpi city\b', e['location'], re.I)]
    print('  %-38s %2d Legazpi row(s)' % ('Certified ABTC (DOH Bicol CHD)', len(legazpi)))
    return legazpi, found


def parse_expiry(text):
    match = re.search(r'([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})', text)
    if not match:
        return ''
    months = ['january', 'february', 'march', 'april', 'may', 'june', 'july',
              'august', 'september', 'october', 'november', 'december']
    try:
        month = months.index(match.group(1).lower()) + 1
    except ValueError:
        return ''
    return '%s-%02d-%02d' % (match.group(3), month, int(match.group(2)))


# --------------------------------------------------------------------------
# Merge
# --------------------------------------------------------------------------

class Merger:
    def __init__(self, data):
        self.data = data
        self.facilities = data['facilities']
        self.notes = []
        self.review = []
        self.by_code = {}
        self.by_name = {}
        core_counts = {}
        for facility in self.facilities:
            code = facility.get('doh_code')
            if code:
                self.by_code.setdefault(str(code), facility)
            # Index the short name too. DOH writes "UST-Legazpi Hospital ABC"
            # where this directory's full name is "University of Santo Tomas -
            # Legazpi Hospital" but its short name matches outright.
            for label in self.labels(facility):
                self.by_name.setdefault(normalize_name(label), facility)
                core = core_name(label)
                if core:
                    core_counts.setdefault(core, []).append(facility)
        # Only trust a core-name match where it is unambiguous on this side.
        self.by_core = {k: v[0] for k, v in core_counts.items()
                        if len({id(f) for f in v}) == 1}

    def near_miss(self, raw_name, key):
        """Find an existing record this row might be a duplicate of.

        Two signals, because neither alone is enough. String similarity catches
        re-spellings, but scores "Philippine Red Cross Albay - Legazpi City
        Chapter" against "Philippine Red Cross - Albay Chapter Blood Service
        Facility" too low to notice. Shared distinguishing words catch that pair
        and ignore ones that merely share a category word, where string
        similarity flags "AMEC Birthing Center" against "Abion Birthing Center".
        """
        close = difflib.get_close_matches(key, list(self.by_name), n=1, cutoff=0.86)
        if close:
            return close[0]
        tokens = set(core_name(raw_name).split())
        if len(tokens) < 3:
            return None
        for candidate in self.by_name:
            shared = tokens & set(core_name(candidate).split())
            if len(shared) >= 3:
                return candidate
        return None

    @staticmethod
    def labels(facility):
        names = [facility['name']]
        short = facility.get('short_name')
        if short and short != facility['name']:
            names.append(short)
        return names

    def note(self, facility_id, kind, message):
        self.notes.append({
            'facility_id': facility_id,
            'type': kind,
            'note': message,
        })

    def find(self, row):
        """Join on the registry code first, then on a normalised name.

        A name that is merely *similar* is never merged silently; it goes to
        the review file for a human to confirm or reject.
        """
        code = row.get('nhfr_code')
        if code and str(code) in self.by_code:
            return self.by_code[str(code)], 'code'
        key = normalize_name(row['name'])
        if key in self.by_name:
            return self.by_name[key], 'name'
        core = core_name(row['name'])
        if core and core in self.by_core:
            return self.by_core[core], 'core'
        close = self.near_miss(row['name'], key)
        if close:
            existing = self.by_name[close]
            self.review.append({
                'hfsrb_name': row['name'],
                'hfsrb_type': row['hfsrb_type'],
                'hfsrb_code': code,
                'existing_name': existing['name'],
                'existing_id': existing['id'],
                'similarity': round(difflib.SequenceMatcher(None, key, close).ratio(), 3),
                'hfsrb_address': row['address'],
                'existing_address': existing['address'].get('street', ''),
                'action_taken': 'added as a new record; confirm this is not a duplicate',
            })
        return None, None

    def next_id(self, prefix):
        pattern = re.compile(r'^fac-%s-(\d+)$' % re.escape(prefix))
        highest = 0
        for facility in self.facilities:
            match = pattern.match(facility['id'])
            if match:
                highest = max(highest, int(match.group(1)))
        return 'fac-%s-%03d' % (prefix, highest + 1)

    def apply_code(self, facility, row):
        """HFSRB carries the registry's own NHFR code, so it wins."""
        code = row.get('nhfr_code')
        if not code:
            return
        existing = facility.get('doh_code')
        if existing and str(existing) != str(code):
            self.note(facility['id'], 'code-conflict',
                      'DOH registry code recorded locally as %s; DOH HFSRB %s list '
                      '(as of %s) publishes NHFR code %s. The registry value takes '
                      'precedence and is shown.'
                      % (existing, row['hfsrb_type'], row['as_of'], code))
        facility['doh_code'] = str(code)

    def apply_licence(self, facility, row):
        accreditations = facility.setdefault('accreditations', {})
        accreditations['is_doh_licensed'] = True
        previous = accreditations.get('hfsrb_as_of', '')
        if row['as_of'] > previous:
            accreditations['hfsrb_as_of'] = row['as_of']

    def add_service(self, facility, service):
        if not service:
            return
        services = facility.setdefault('services', [])
        if service not in services:
            services.append(service)

    def merge_hfsrb(self, collected):
        for type_name, bundle in collected.items():
            config = HFSRB_TYPES[type_name]
            for row in bundle['rows']:
                facility, how = self.find(row)
                if facility:
                    self.apply_code(facility, row)
                    self.apply_licence(facility, row)
                    self.add_service(facility, config['service'])
                    if row['hfsrb_type'] != 'Hospital' and how:
                        pass
                    continue
                if not config['id_prefix']:
                    self.note(None, 'unmatched-licence',
                              '%s holds a DOH %s licence but is not listed as a '
                              'separate facility in this directory.'
                              % (row['name'], type_name))
                    continue
                if config['category'] is None:
                    continue
                self.facilities.append(self.build(row, config))

    def build(self, row, config):
        facility_id = self.next_id(config['id_prefix'])
        name = titlecase(row['name'])
        record = {
            'id': facility_id,
            'name': name,
            'short_name': name,
            'category': config['category'],
            'type': 'DOH-licensed %s' % row['hfsrb_type'],
            'ownership': 'Government' if row['ownership'].lower().startswith('gov') else 'Private',
            'doh_code': str(row['nhfr_code']) if row['nhfr_code'] else None,
            'address': {
                'street': row['address'] or 'N/A',
                'building': '',
                'barangay': extract_barangay(row['address']),
                'city': 'Legazpi City',
                'province': 'Albay',
                'zip': '4500',
            },
            'contact': {
                'landline': row['landline'] or 'N/A',
                'mobile': row['mobile'] or 'N/A',
                'email': 'N/A',
            },
            'accreditations': {
                'is_doh_licensed': True,
                'hfsrb_as_of': row['as_of'],
                'is_yakap_accredited': False,
                'philhealth_accredited': False,
            },
            'services': [s for s in [config['service']] if s],
            'emergency_24_7': False,
        }
        if row['services']:
            for service in re.split(r'\s*[;,/]\s*', row['services']):
                self.add_service(record, titlecase(service))
        self.by_name[normalize_name(name)] = record
        core = core_name(name)
        if core and core not in self.by_core:
            self.by_core[core] = record
        if record['doh_code']:
            self.by_code.setdefault(record['doh_code'], record)
        if not row['nhfr_code']:
            self.note(facility_id, 'missing-code',
                      'The DOH HFSRB %s list (as of %s) publishes no NHFR code for '
                      'this facility.' % (row['hfsrb_type'], row['as_of']))
        if not row['landline'] and not row['mobile']:
            self.note(facility_id, 'contact-unlisted',
                      'DOH does not publish contact details for this facility.')
        return record

    def merge_abtc(self, legazpi, everything):
        for entry in legazpi:
            bare = re.sub(r'\b(abtc|abc)\b', '', entry['name'], flags=re.I)
            key = normalize_name(bare)
            facility = self.by_name.get(key) or self.by_core.get(core_name(bare))
            if not facility:
                close = difflib.get_close_matches(key, list(self.by_name), n=1, cutoff=0.80)
                facility = self.by_name[close[0]] if close else None
            if facility:
                facility['accreditations']['is_abtc_certified'] = True
                facility['accreditations']['abtc_validity'] = entry['expiry']
                self.add_service(facility, 'Animal Bite Treatment')
                if entry['expiry'] and entry['expiry'] < date.today().isoformat():
                    self.note(facility['id'], 'lapsed-certification',
                              'DOH Bicol CHD lists this animal-bite treatment centre '
                              'certification as expiring %s, which has passed. Confirm '
                              'with the facility before relying on it.' % entry['expiry_raw'])
                continue
            facility_id = self.next_id('abtc')
            name = titlecase(entry['name'])
            self.facilities.append({
                'id': facility_id,
                'name': name,
                'short_name': name,
                'category': 'Animal Bite Treatment Center',
                'type': 'DOH-certified Animal Bite Treatment Center',
                'ownership': 'Private',
                'doh_code': None,
                'address': {
                    'street': 'N/A', 'building': '', 'barangay': '',
                    'city': 'Legazpi City', 'province': 'Albay', 'zip': '4500',
                },
                'contact': {'landline': 'N/A', 'mobile': 'N/A', 'email': 'N/A'},
                'accreditations': {
                    'is_doh_licensed': True,
                    'is_abtc_certified': True,
                    'abtc_validity': entry['expiry'],
                    'is_yakap_accredited': False,
                    'philhealth_accredited': False,
                },
                'services': ['Animal Bite Treatment', 'Anti-Rabies Vaccination'],
                'emergency_24_7': False,
            })
            self.note(facility_id, 'contact-unlisted',
                      'DOH does not publish contact details for this facility.')

        # BRHMC's ABTC is filed under Daraga by DOH even though the hospital
        # serves Legazpi from Rizal Street. The directory keeps the facility
        # and records the disagreement rather than acting on it.
        for entry in everything:
            if 'bicol regional hospital' in entry['name'].lower():
                facility = self.by_name.get(normalize_name(
                    'Bicol Regional Hospital and Medical Center'))
                if facility:
                    facility['accreditations']['is_abtc_certified'] = True
                    facility['accreditations']['abtc_validity'] = entry['expiry']
                    self.add_service(facility, 'Animal Bite Treatment')
                    self.note(facility['id'], 'jurisdiction-conflict',
                              'DOH registers this facility under Daraga, Albay (both '
                              'the HFSRB hospital list and the DOH Bicol CHD '
                              'animal-bite centre list). It is retained here because '
                              'it operates on Rizal Street and serves Legazpi City.')


def titlecase(name):
    """Render an ALL-CAPS DOH name in mixed case.

    Every HFSRB name arrives capitalised, so "short and uppercase" says nothing
    about whether a word is an acronym -- OF, MARY and CARE all look like one.
    Only names on the allowlist keep their capitals.
    """
    small = {'of', 'and', 'the', 'for', 'de', 'del', 'in', 'y'}
    fixed = {'INC': 'Inc.', 'CORP': 'Corp.', 'LTD': 'Ltd.', 'JR': 'Jr.', 'SR': 'Sr.'}
    acronyms = {'UST', 'ACE', 'DOH', 'RHU', 'BSF', 'ASC', 'ABC', 'ABTC', 'CHO',
                'GDB', 'AMEC', 'MRR', 'MMG', 'BMSC', 'JB', 'BRHMC', 'II', 'III', 'IV'}

    def word_case(word, index):
        bare = re.sub(r'[^A-Za-z0-9]', '', word)
        if not bare:
            return word
        if bare.upper() in fixed:
            return fixed[bare.upper()]
        if bare.upper() in acronyms or any(c.isdigit() for c in bare):
            return word.upper()
        if bare.lower() in small and index > 0:
            return word.lower()
        return word[:1].upper() + word[1:].lower()

    out = []
    for index, word in enumerate(clean(name).split()):
        # Hyphenated names carry a capital on each side: UST-Legazpi, Bio-Lab.
        parts = word.split('-')
        out.append('-'.join(word_case(part, index if i == 0 else 1)
                             for i, part in enumerate(parts)))
    return ' '.join(out)


def extract_barangay(address):
    match = re.search(r'((?:Brgy\.?|Bgy\.?|Barangay)\s*[^,]{1,40})', address or '', re.I)
    return clean(match.group(1)) if match else ''


def recount(data):
    facilities = data['facilities']

    def count(predicate):
        return sum(1 for f in facilities if predicate(f))

    data['summary_counts'] = {
        'total': len(facilities),
        'hospitals': count(lambda f: f['category'] == 'Hospital'),
        'yakap_accredited': count(lambda f: f['accreditations'].get('is_yakap_accredited')),
        'super_health_centers': count(lambda f: f['category'] == 'Super Health Center & RHU'),
        'birthing_homes': count(lambda f: f['category'] == 'Birthing & Lying-in Clinic'),
        'laboratories': count(lambda f: f['category'] == 'Diagnostic Laboratory'),
        'dialysis_centers': count(lambda f: f['category'] == 'Dialysis Center'),
        'drug_testing_laboratories': count(lambda f: f['category'] == 'Drug Testing Laboratory'),
        'ambulatory_surgical_clinics': count(lambda f: f['category'] == 'Ambulatory Surgical Clinic'),
        'blood_service_facilities': count(lambda f: f['category'] == 'Blood Service Facility'),
        'animal_bite_centers': count(lambda f: f['accreditations'].get('is_abtc_certified')),
        'barangay_health_stations': count(lambda f: f['category'] == 'Barangay Health Station'),
        'government_owned': count(lambda f: f['ownership'] == 'Government'),
        'private_owned': count(lambda f: f['ownership'] == 'Private'),
    }


def build_sources(collected, abtc_label):
    sources = [
        {
            'publisher': 'Department of Health',
            'title': 'National Health Facility Registry (NHFR)',
            'as_of': '2026',
            'url': 'https://nhfr.doh.gov.ph/',
        },
        {
            'publisher': 'PhilHealth',
            'title': 'List of Accredited YAKAP Clinics with Available GAMOT '
                     'Prescription for CY 2026',
            'as_of': '2026-07-31',
            'url': 'https://www.philhealth.gov.ph/',
        },
        {
            'publisher': 'Legazpi City Health Office',
            'title': 'Barangay Health Network directory, with PSA 2024 population '
                     'registry',
            'as_of': '2024',
            'url': 'https://legazpi.gov.ph/',
        },
        {
            'publisher': 'Department of Health – Bicol Center for Health Development',
            'title': 'Certified Animal Bite Treatment Centers',
            'as_of': abtc_label,
            'url': ABTC_INDEX,
        },
    ]
    for type_name, bundle in sorted(collected.items()):
        if not bundle['rows']:
            continue
        sources.append({
            'publisher': 'Department of Health – Health Facilities and Services '
                         'Regulatory Bureau',
            'title': bundle['label'],
            'as_of': bundle['as_of'],
            'url': bundle['url'],
        })
    return sources


def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as handle:
        data = json.load(handle)

    print('Fetching DOH HFSRB licensing lists...')
    collected = scrape_hfsrb()
    print('Fetching DOH Bicol CHD animal-bite treatment centres...')
    abtc_legazpi, abtc_all = scrape_abtc()

    merger = Merger(data)
    merger.merge_hfsrb(collected)
    merger.merge_abtc(abtc_legazpi, abtc_all)

    data['_schema_version'] = '2.0.0'
    data['_sources'] = build_sources(collected, date.today().isoformat())
    data['_data_notes'] = merger.notes
    recount(data)

    with open(DATA_PATH, 'w', encoding='utf-8') as handle:
        json.dump(data, handle, indent=2, ensure_ascii=False)
        handle.write('\n')

    with open(REVIEW_PATH, 'w', encoding='utf-8') as handle:
        json.dump({
            'generated': date.today().isoformat(),
            'note': 'Name-similar pairs that were NOT merged automatically. '
                    'Confirm each is a distinct facility, or merge by hand.',
            'pairs': merger.review,
        }, handle, indent=2, ensure_ascii=False)
        handle.write('\n')

    print('\nTotal facilities: %d' % data['summary_counts']['total'])
    print('Data notes:       %d' % len(merger.notes))
    print('Review pairs:     %d  -> %s' % (len(merger.review), REVIEW_PATH))


if __name__ == '__main__':
    main()
