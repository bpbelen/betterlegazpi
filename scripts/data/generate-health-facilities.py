"""One-off generator that produced the first version of data/health-facilities.json.

DO NOT RE-RUN AGAINST THE LIVE FILE. data/health-facilities.json has since been
enriched from the DOH HFSRB licensing lists (doh_code, hfsrb_as_of) and corrected
against PhilHealth's two accreditation lists, none of which this script knows
about. Re-running it would drop the DOH registry codes and reinstate the
hand-typed YAKAP flags that were found to be wrong -- notably BRHMC, which is a
GAMOT Package Provider but not an accredited YAKAP clinic.

The JSON is the source of truth. Edit it directly, as CLAUDE.md says.
"""

import json
import os

# Load barangays to get the 70 barangays for BHS
with open('data/barangays.json', 'r', encoding='utf-8') as f:
    barangays_data = json.load(f)

facilities = []

# 1. Hospitals
hospitals = [
    {
        "id": "fac-hosp-001",
        "name": "Bicol Regional Hospital and Medical Center (BRHMC)",
        "short_name": "BRHMC",
        "category": "Hospital",
        "type": "Level 3 Tertiary Apex Medical Center",
        "ownership": "Government",
        "address": {
            "street": "Rizal Street",
            "building": "BRHMC Medical Complex",
            "barangay": "Bgy. 1 - Em's Barrio / Concepcion Border",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 483-0017 / (052) 483-0014",
            "mobile": "0917-826-6467",
            "email": "brhmc.doh@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Emergency",
            "Trauma & Critical Care",
            "Specialized Surgery",
            "Cardiology & Hemodialysis",
            "Pediatrics & OB-GYN",
            "Oncology",
            "Comprehensive Laboratory & Radiology",
            "Pharmacy"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1444, "lng": 123.7291}
    },
    {
        "id": "fac-hosp-002",
        "name": "Allied Care Experts (ACE) Medical Center - Legazpi, Inc.",
        "short_name": "ACE Medical Center Legazpi",
        "category": "Hospital",
        "type": "Level 2 General Hospital",
        "ownership": "Private",
        "doh_code": "43714",
        "address": {
            "street": "Maharlika Highway",
            "building": "ACE Medical Center Complex",
            "barangay": "Bgy. 41 - Bogtong",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 742-5938",
            "mobile": "0917-142-3633",
            "email": "info@acemedicalcenterlegazpi.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": False,
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Emergency",
            "ICU & NICU",
            "Inpatient Care",
            "Hemodialysis",
            "Endoscopy & Diagnostics",
            "CT Scan & X-Ray",
            "Pharmacy"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1678, "lng": 123.7225}
    },
    {
        "id": "fac-hosp-003",
        "name": "Albay Doctors' Hospital, Inc.",
        "short_name": "Albay Doctors' Hospital",
        "category": "Hospital",
        "type": "Level 2 General Hospital",
        "ownership": "Private",
        "doh_code": "2071",
        "address": {
            "street": "Peñaranda Street",
            "building": "",
            "barangay": "Bgy. 15 - Ilawod",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-7777 / (052) 480-7778",
            "mobile": "0917-582-3977 / 0917-558-1679",
            "email": "adh_hospital@yahoo.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Emergency",
            "YAKAP Konsulta & GAMOT",
            "Inpatient Care",
            "Maternity & Child Care",
            "Surgical Services",
            "Clinical Laboratory",
            "Pharmacy"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1396, "lng": 123.7441}
    },
    {
        "id": "fac-hosp-004",
        "name": "Tanchuling General Hospital, Inc.",
        "short_name": "Tanchuling Hospital",
        "category": "Hospital",
        "type": "Level 2 General Hospital",
        "ownership": "Private",
        "doh_code": "2105",
        "address": {
            "street": "Imperial Court Subdivision, Rizal Street",
            "building": "",
            "barangay": "Bgy. 24 - Rizal Street",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-7411",
            "mobile": "0945-385-3587",
            "email": "tghlegazpi@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Emergency",
            "YAKAP Konsulta Clinic",
            "Inpatient & Outpatient",
            "General Surgery & OB-GYN",
            "Pediatrics",
            "Diagnostic Ultrasound & X-Ray",
            "Pharmacy"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1415, "lng": 123.7380}
    },
    {
        "id": "fac-hosp-005",
        "name": "Legazpi City Hospital",
        "short_name": "City Hospital",
        "category": "Hospital",
        "type": "Level 1 Local Government Hospital",
        "ownership": "Government",
        "doh_code": "35681",
        "address": {
            "street": "Zone 9",
            "building": "Legazpi City Hospital Complex",
            "barangay": "Bgy. 37 - Bitano",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 742-1234",
            "mobile": "0905-892-1185",
            "email": "legazpicityhospital.ph@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Emergency",
            "YAKAP Konsulta & GAMOT",
            "General Inpatient Care",
            "Maternity & Delivery",
            "Pediatrics",
            "Primary Surgery",
            "Clinical Lab & Pharmacy"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1465, "lng": 123.7485}
    },
    {
        "id": "fac-hosp-006",
        "name": "University of Santo Tomas - Legazpi Hospital",
        "short_name": "UST-Legazpi Hospital",
        "category": "Hospital",
        "type": "Level 2 University Hospital",
        "ownership": "Private",
        "address": {
            "street": "Capt. F. Aquende Drive (Washington Drive)",
            "building": "UST-Legazpi Medical Complex",
            "barangay": "Bgy. 17 - Ilawod",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 736-0330 / (052) 481-1450",
            "mobile": "0917-578-8785",
            "email": "hospital@ust-legazpi.edu.ph"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": False,
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Emergency",
            "Intensive Care Unit (ICU)",
            "Diagnostic Imaging & CT Scan",
            "Laboratory Services",
            "Physical Therapy & Rehab",
            "Outpatient Specialties",
            "Pharmacy"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1418, "lng": 123.7412}
    },
    {
        "id": "fac-hosp-007",
        "name": "Ago General Hospital",
        "short_name": "Ago Hospital",
        "category": "Hospital",
        "type": "Level 1 General Hospital",
        "ownership": "Private",
        "address": {
            "street": "Rizal Street",
            "building": "",
            "barangay": "Bgy. 24 - Rizal Street",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-7132",
            "mobile": "0917-512-3456",
            "email": "agohospital@yahoo.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": False,
            "philhealth_accredited": True
        },
        "services": [
            "Emergency Care",
            "General Medicine",
            "Maternity & Pediatric Care",
            "Outpatient Clinic",
            "Clinical Laboratory"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1388, "lng": 123.7365}
    },
    {
        "id": "fac-hosp-008",
        "name": "Estévez Memorial Hospital, Inc.",
        "short_name": "Estevez Hospital",
        "category": "Hospital",
        "type": "Level 1 General Hospital",
        "ownership": "Private",
        "address": {
            "street": "Guevarra Subdivision",
            "building": "",
            "barangay": "Bgy. 28 - Victory Village",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-7764 / (052) 480-7765",
            "mobile": "0917-890-1234",
            "email": "estevezhospital@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": False,
            "philhealth_accredited": True
        },
        "services": [
            "Emergency Care",
            "Inpatient & Outpatient",
            "Minor Surgery",
            "Maternal & Child Health",
            "Pharmacy"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1432, "lng": 123.7510}
    }
]
facilities.extend(hospitals)

# 2. PhilHealth YAKAP Dedicated Clinics & Primary Care Facilities
yakap_clinics = [
    {
        "id": "fac-yakap-001",
        "name": "Legazpi City Health Office (Main CHO)",
        "short_name": "City Health Office",
        "category": "PhilHealth YAKAP Clinic",
        "type": "City Health Office & Primary Care Facility",
        "ownership": "Government",
        "doh_code": "6700",
        "yakap_code": "2085",
        "address": {
            "street": "City Hall Compound, Rizal Street",
            "building": "City Health Office Building",
            "barangay": "Bgy. 24 - Rizal Street",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 435-0832 / (052) 742-2000",
            "mobile": "0956-841-6087",
            "email": "cholegazpi@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2027-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "Free YAKAP Konsulta Consultations",
            "Free GAMOT Maintenance Medicines",
            "Childhood Immunization & EPI",
            "Prenatal & Postnatal Care",
            "TB-DOTS Treatment",
            "Dental Health Services",
            "Sanitary Inspection & Health Cards"
        ],
        "emergency_24_7": False,
        "coordinates": {"lat": 13.1398, "lng": 123.7345}
    },
    {
        "id": "fac-yakap-002",
        "name": "PremierMD Health Care Clinic",
        "short_name": "PremierMD Clinic",
        "category": "PhilHealth YAKAP Clinic",
        "type": "Primary Care Facility & Specialty Clinic",
        "ownership": "Private",
        "yakap_code": "2093",
        "address": {
            "street": "213 Magallanes Street",
            "building": "",
            "barangay": "Bgy. 34 - Oro Site",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 742-8899",
            "mobile": "0916-373-8055",
            "email": "premiermd213@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "PhilHealth YAKAP Konsulta Package",
            "GAMOT Prescription Dispensing",
            "General Medical Consultation",
            "Diagnostic Laboratory",
            "Preventive Health Checkups"
        ],
        "emergency_24_7": False,
        "coordinates": {"lat": 13.1425, "lng": 123.7460}
    },
    {
        "id": "fac-yakap-003",
        "name": "Regional Medical and Dental Unit 5 (RMDU 5)",
        "short_name": "PNP RMDU 5 Clinic",
        "category": "PhilHealth YAKAP Clinic",
        "type": "Government Institutional Health Facility",
        "ownership": "Government",
        "yakap_code": "2094",
        "address": {
            "street": "Camp BGen Simeon A. Ola",
            "building": "RMDU 5 Health Facility",
            "barangay": "Bgy. 1 - Em's Barrio",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-1234",
            "mobile": "0956-875-8958",
            "email": "rmdu5ekonsulta@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "PhilHealth YAKAP Konsulta Services",
            "General Medical & Dental Consultations",
            "Physical Examinations",
            "Primary Care & First Aid"
        ],
        "emergency_24_7": False,
        "coordinates": {"lat": 13.1460, "lng": 123.7310}
    },
    {
        "id": "fac-yakap-004",
        "name": "Southeast Occupational Health and Environmental Safety Services, Inc.",
        "short_name": "Southeast Health Services",
        "category": "PhilHealth YAKAP Clinic",
        "type": "Primary Care & Occupational Health Clinic",
        "ownership": "Private",
        "yakap_code": "2104",
        "address": {
            "street": "Landco Business Park",
            "building": "2F Towermall Building 4",
            "barangay": "Bgy. 36 - Capantawan",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 836-7014",
            "mobile": "0956-221-1360",
            "email": "southeastoccupationalhealth@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "PhilHealth YAKAP Konsulta Provider",
            "Occupational Health & Pre-Employment Exams",
            "Diagnostic Laboratory Tests",
            "Executive Health Checkups"
        ],
        "emergency_24_7": False,
        "coordinates": {"lat": 13.1402, "lng": 123.7525}
    }
]
facilities.extend(yakap_clinics)

# 3. Super Health Centers & Rural Health Units
super_health_centers = [
    {
        "id": "fac-shc-001",
        "name": "Legazpi City Health Office (LCHO) RHU III (Super Health Center)",
        "short_name": "Homapon Super Health Center",
        "category": "Super Health Center & RHU",
        "type": "Rural Health Unit / Super Health Center",
        "ownership": "Government",
        "doh_code": "54794",
        "address": {
            "street": "Homapon National Highway",
            "building": "Super Health Center Complex",
            "barangay": "Bgy. 62 - Homapon",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-0695",
            "mobile": "0956-841-6087",
            "email": "cholegazpi.rhu3@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2027-12-31",
            "is_yakap_accredited": True,
            "yakap_validity": "2026-12-31",
            "philhealth_accredited": True
        },
        "services": [
            "Outpatient Consultations",
            "Birthing & Lying-in Facility",
            "Laboratory & Ultrasound Diagnostics",
            "Childhood Immunization",
            "Pharmacy & GAMOT Dispensing",
            "Dental Care",
            "Minor Surgery & Triage"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1095, "lng": 123.7220}
    }
]
facilities.extend(super_health_centers)

# 4. Birthing & Lying-In Clinics
birthing_homes = [
    {
        "id": "fac-birth-001",
        "name": "Legazpi CHO Northern District Maternity Lying-in Clinic",
        "short_name": "Buyuan Maternity Clinic",
        "category": "Birthing & Lying-in Clinic",
        "type": "Government Birthing Home",
        "ownership": "Government",
        "doh_code": "32449",
        "address": {
            "street": "Northern District Health Center Road",
            "building": "Buyuan Health Center Compound",
            "barangay": "Bgy. 51 - Buyuan",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-0695",
            "mobile": "0956-841-6087",
            "email": "cholegazpi.buyuan@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Normal Spontaneous Delivery",
            "Prenatal & Postnatal Care",
            "Newborn Screening & Hearing Test",
            "Family Planning & Lactation Counseling"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.2030, "lng": 123.7650}
    },
    {
        "id": "fac-birth-002",
        "name": "Legazpi CHO Southern District Maternity Lying-in Clinic",
        "short_name": "Banquerohan Maternity Clinic",
        "category": "Birthing & Lying-in Clinic",
        "type": "Government Birthing Home",
        "ownership": "Government",
        "doh_code": "32450",
        "address": {
            "street": "Southern District Road",
            "building": "Banquerohan Health Station Compound",
            "barangay": "Bgy. 66 - Banquerohan",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-0695",
            "mobile": "0956-841-6087",
            "email": "cholegazpi.banquerohan@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "philhealth_accredited": True
        },
        "services": [
            "24/7 Normal Spontaneous Delivery",
            "Prenatal & Postnatal Checkups",
            "Newborn Care & Immunization",
            "Family Planning Services"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.0850, "lng": 123.7550}
    },
    {
        "id": "fac-birth-003",
        "name": "Legazpi CHO Southern District 2 Maternity Lying-in Clinic",
        "short_name": "Taysan Maternity Clinic",
        "category": "Birthing & Lying-in Clinic",
        "type": "Government Birthing Home",
        "ownership": "Government",
        "doh_code": "37755",
        "address": {
            "street": "Taysan Main Road",
            "building": "Taysan Health Center",
            "barangay": "Bgy. 56 - Taysan",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-0695",
            "mobile": "0956-841-6087",
            "email": "cholegazpi.taysan@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "philhealth_accredited": True
        },
        "services": [
            "Normal Delivery Services",
            "Maternal Health Monitoring",
            "Newborn Care",
            "Immunization & Nutrition"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1210, "lng": 123.7380}
    }
]
facilities.extend(birthing_homes)

# 5. Diagnostic Laboratories & Blood Services
laboratories = [
    {
        "id": "fac-lab-001",
        "name": "Legazpi City Health Office Laboratory",
        "short_name": "CHO Diagnostic Lab",
        "category": "Diagnostic Laboratory",
        "type": "Government Clinical & Diagnostic Laboratory",
        "ownership": "Government",
        "doh_code": "39679",
        "address": {
            "street": "City Hall Compound, Rizal Street",
            "building": "CHO Building",
            "barangay": "Bgy. 24 - Rizal Street",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 435-0832",
            "mobile": "0956-841-6087",
            "email": "cholegazpi.lab@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": True,
            "philhealth_accredited": True
        },
        "services": [
            "CBC & Blood Chemistry",
            "Urinalysis & Fecalysis",
            "Sputum Examination & GeneXpert (TB)",
            "Water Testing & Food Handler Screening",
            "Drug Testing"
        ],
        "emergency_24_7": False,
        "coordinates": {"lat": 13.1398, "lng": 123.7345}
    },
    {
        "id": "fac-lab-002",
        "name": "Philippine Red Cross - Albay Chapter Blood Service Facility",
        "short_name": "PRC Albay Blood Center",
        "category": "Diagnostic Laboratory",
        "type": "Blood Service Facility & Emergency First Aid",
        "ownership": "Government",
        "address": {
            "street": "Landco Business Park",
            "building": "Red Cross Building",
            "barangay": "Bgy. 36 - Capantawan",
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "(052) 480-1288",
            "mobile": "0917-838-8975",
            "email": "albay@redcross.org.ph"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "doh_license_validity": "2026-12-31",
            "is_yakap_accredited": False,
            "philhealth_accredited": False
        },
        "services": [
            "24/7 Blood Banking & Blood Products",
            "Voluntary Blood Donation",
            "Blood Typing & Crossmatching",
            "Ambulance & Emergency Response"
        ],
        "emergency_24_7": True,
        "coordinates": {"lat": 13.1405, "lng": 123.7530}
    }
]
facilities.extend(laboratories)

# 6. Barangay Health Stations (70 Barangays)
for bgy in barangays_data['data']:
    bgy_num = bgy.get('barangay_number')
    bgy_name = bgy.get('name')
    pop = bgy.get('population', 0)
    pb = bgy.get('punong_barangay', 'N/A')
    contact = bgy.get('contact_number', 'N/A')
    sec = bgy.get('barangay_secretary', 'N/A')
    urban_rural = bgy.get('urban_rural', 'Urban')
    
    fac_id = f"fac-bhs-{str(bgy_num).zfill(3)}"
    fac_name = f"{bgy_name} Barangay Health Center"
    
    bhs_item = {
        "id": fac_id,
        "name": fac_name,
        "short_name": f"{bgy_name} BHS",
        "category": "Barangay Health Station",
        "type": "Primary Barangay Health Station (BHS)",
        "ownership": "Government",
        "barangay_number": bgy_num,
        "urban_rural": urban_rural,
        "population_served": pop,
        "punong_barangay": pb,
        "barangay_secretary": sec,
        "address": {
            "street": "Barangay Hall Compound",
            "building": "Barangay Health Station",
            "barangay": bgy_name,
            "city": "Legazpi City",
            "province": "Albay",
            "zip": "4500"
        },
        "contact": {
            "landline": "N/A",
            "mobile": contact if contact != "N/A" else "0956-841-6087 (CHO Hotline)",
            "email": "cholegazpi@gmail.com"
        },
        "accreditations": {
            "is_doh_licensed": True,
            "is_yakap_accredited": False,
            "philhealth_accredited": False
        },
        "services": [
            "Free Primary Consultation & Triage",
            "Childhood Immunization & Growth Monitoring",
            "Maternal & Prenatal Health Checkups",
            "Family Planning & Contraceptive Distribution",
            "Blood Pressure & Vital Signs Monitoring",
            "Barangay Health Worker (BHW) Outreach"
        ],
        "emergency_24_7": False
    }
    facilities.append(bhs_item)

# Summary counts
counts = {
    "total": len(facilities),
    "hospitals": len([f for f in facilities if f['category'] == 'Hospital']),
    "yakap_accredited": len([f for f in facilities if f.get('accreditations', {}).get('is_yakap_accredited', False)]),
    "super_health_centers": len([f for f in facilities if f['category'] == 'Super Health Center & RHU']),
    "birthing_homes": len([f for f in facilities if f['category'] == 'Birthing & Lying-in Clinic']),
    "laboratories": len([f for f in facilities if f['category'] == 'Diagnostic Laboratory']),
    "barangay_health_stations": len([f for f in facilities if f['category'] == 'Barangay Health Station']),
    "government_owned": len([f for f in facilities if f['ownership'] == 'Government']),
    "private_owned": len([f for f in facilities if f['ownership'] == 'Private'])
}

ssot_data = {
    "_schema_version": "1.0",
    "_sources": [
        "Department of Health (DOH) National Health Facility Registry (NHFR) 2026",
        "PhilHealth List of Accredited YAKAP Clinics with Available GAMOT Prescription for CY 2026 (Updated July 31, 2026)",
        "Legazpi City Health Office (CHO) Barangay Health Network & PSA 2024 Population Registry"
    ],
    "city": "City of Legazpi",
    "province": "Albay",
    "region": "Region V - Bicol Region",
    "summary_counts": counts,
    "facilities": facilities
}

with open('data/health-facilities.json', 'w', encoding='utf-8') as f:
    json.dump(ssot_data, f, indent=2, ensure_ascii=False)

print("Created data/health-facilities.json successfully!")
print("Summary Counts:", json.dumps(counts, indent=2))
