/**
 * Statistics Page - Enhanced Animations & Charts
 * Better Legazpi Portal - Minimal Professional Design
 */

// Brand colors
const COLORS = {
  primary: '#0032a0',
  primaryDark: '#002170',
  secondary: '#003d82',
  accent: '#c2410c',
  success: '#067a5e',
  danger: '#d62828',
  info: '#0077be',
};

// Cohesive 10-shade monochromatic blue-teal gradient palette for Doughnut chart
const DOUGHNUT_COLORS = [
  '#002B7A', // Deep Sapphire
  '#003896', // Deep Royal Blue
  '#004DB8', // Classic Navy Blue
  '#0F62DE', // Vibrant Royal Blue
  '#1E77EC', // Cobalt Blue
  '#008ED8', // Cerulean
  '#00A3C8', // Ocean Blue
  '#00B6B2', // Deep Sea Teal
  '#14C59E', // Teal Mint
  '#48CAE4', // Soft Cyan
];

// Official Single Source of Truth Fallback Data (2024 Census - PSA)
let barangayData = [
  {
    "code": "050506070",
    "psgc10DigitCode": "0500506070",
    "name": "Bgy. 56 - Taysan",
    "official_psgc_name": "Bgy. 56 - Taysan",
    "barangay_number": 56,
    "population": 20017,
    "percentage": 9.5,
    "urban_rural": "Urban",
    "rank": 1,
    "pop": 20017
  },
  {
    "code": "050506064",
    "psgc10DigitCode": "0500506064",
    "name": "Bgy. 42 - Rawis",
    "official_psgc_name": "Bgy. 42 - Rawis",
    "barangay_number": 42,
    "population": 10330,
    "percentage": 4.9,
    "urban_rural": "Urban",
    "rank": 2,
    "pop": 10330
  },
  {
    "code": "050506004",
    "psgc10DigitCode": "0500506004",
    "name": "Bgy. 66 - Banquerohan",
    "official_psgc_name": "Bgy. 66 - Banquerohan",
    "barangay_number": 66,
    "population": 8918,
    "percentage": 4.23,
    "urban_rural": "Urban",
    "rank": 3,
    "pop": 8918
  },
  {
    "code": "050506035",
    "psgc10DigitCode": "0500506035",
    "name": "Bgy. 37 - Bitano",
    "official_psgc_name": "Bgy. 37 - Bitano (Pob.)",
    "barangay_number": 37,
    "population": 7546,
    "percentage": 3.58,
    "urban_rural": "Urban",
    "rank": 4,
    "pop": 7546
  },
  {
    "code": "050506045",
    "psgc10DigitCode": "0500506045",
    "name": "Bgy. 49 - Bigaa",
    "official_psgc_name": "Bgy. 49 - Bigaa",
    "barangay_number": 49,
    "population": 7287,
    "percentage": 3.46,
    "urban_rural": "Urban",
    "rank": 5,
    "pop": 7287
  },
  {
    "code": "050506051",
    "psgc10DigitCode": "0500506051",
    "name": "Bgy. 40 - Cruzada",
    "official_psgc_name": "Bgy. 40 - Cruzada",
    "barangay_number": 40,
    "population": 7030,
    "percentage": 3.34,
    "urban_rural": "Urban",
    "rank": 6,
    "pop": 7030
  },
  {
    "code": "050506055",
    "psgc10DigitCode": "0500506055",
    "name": "Bgy. 38 - Gogon",
    "official_psgc_name": "Bgy. 38 - Gogon",
    "barangay_number": 38,
    "population": 6534,
    "percentage": 3.1,
    "urban_rural": "Urban",
    "rank": 7,
    "pop": 6534
  },
  {
    "code": "050506067",
    "psgc10DigitCode": "0500506067",
    "name": "Bgy. 32 - San Roque",
    "official_psgc_name": "Bgy. 32 - San Roque",
    "barangay_number": 32,
    "population": 5452,
    "percentage": 2.59,
    "urban_rural": "Urban",
    "rank": 8,
    "pop": 5452
  },
  {
    "code": "050506012",
    "psgc10DigitCode": "0500506012",
    "name": "Bgy. 16 - Kawit-East Washington Drive",
    "official_psgc_name": "Bgy. 16 - Kawit-East Washington Drive (Pob.)",
    "barangay_number": 16,
    "population": 5420,
    "percentage": 2.57,
    "urban_rural": "Urban",
    "rank": 9,
    "pop": 5420
  },
  {
    "code": "050506046",
    "psgc10DigitCode": "0500506046",
    "name": "Bgy. 41 - Bogtong",
    "official_psgc_name": "Bgy. 41 - Bogtong",
    "barangay_number": 41,
    "population": 5389,
    "percentage": 2.56,
    "urban_rural": "Urban",
    "rank": 10,
    "pop": 5389
  },
  {
    "code": "050506060",
    "psgc10DigitCode": "0500506060",
    "name": "Bgy. 61 - Maslog",
    "official_psgc_name": "Bgy. 61 - Maslog",
    "barangay_number": 61,
    "population": 5320,
    "percentage": 2.53,
    "urban_rural": "Urban",
    "rank": 11,
    "pop": 5320
  },
  {
    "code": "050506056",
    "psgc10DigitCode": "0500506056",
    "name": "Bgy. 62 - Homapon",
    "official_psgc_name": "Bgy. 62 - Homapon",
    "barangay_number": 62,
    "population": 5250,
    "percentage": 2.49,
    "urban_rural": "Urban",
    "rank": 12,
    "pop": 5250
  },
  {
    "code": "050506063",
    "psgc10DigitCode": "0500506063",
    "name": "Bgy. 59 - Puro",
    "official_psgc_name": "Bgy. 59 - Puro",
    "barangay_number": 59,
    "population": 5215,
    "percentage": 2.48,
    "urban_rural": "Urban",
    "rank": 13,
    "pop": 5215
  },
  {
    "code": "050506054",
    "psgc10DigitCode": "0500506054",
    "name": "Bgy. 55 - Estanza",
    "official_psgc_name": "Bgy. 55 - Estanza",
    "barangay_number": 55,
    "population": 4963,
    "percentage": 2.36,
    "urban_rural": "Rural",
    "rank": 14,
    "pop": 4963
  },
  {
    "code": "050506062",
    "psgc10DigitCode": "0500506062",
    "name": "Bgy. 44 - Pawa",
    "official_psgc_name": "Bgy. 44 - Pawa",
    "barangay_number": 44,
    "population": 4585,
    "percentage": 2.18,
    "urban_rural": "Rural",
    "rank": 15,
    "pop": 4585
  },
  {
    "code": "050506074",
    "psgc10DigitCode": "0500506074",
    "name": "Bgy. 58 - Buragwis",
    "official_psgc_name": "Bgy. 58 - Buragwis",
    "barangay_number": 58,
    "population": 4329,
    "percentage": 2.06,
    "urban_rural": "Rural",
    "rank": 16,
    "pop": 4329
  },
  {
    "code": "050506047",
    "psgc10DigitCode": "0500506047",
    "name": "Bgy. 53 - Bonga",
    "official_psgc_name": "Bgy. 53 - Bonga",
    "barangay_number": 53,
    "population": 4308,
    "percentage": 2.05,
    "urban_rural": "Rural",
    "rank": 17,
    "pop": 4308
  },
  {
    "code": "050506049",
    "psgc10DigitCode": "0500506049",
    "name": "Bgy. 51 - Buyuan",
    "official_psgc_name": "Bgy. 51 - Buyuan",
    "barangay_number": 51,
    "population": 4200,
    "percentage": 1.99,
    "urban_rural": "Rural",
    "rank": 18,
    "pop": 4200
  },
  {
    "code": "050506017",
    "psgc10DigitCode": "0500506017",
    "name": "Bgy. 18 - Cabagñan West",
    "official_psgc_name": "Bgy. 18 - Cabagñan West (Pob.)",
    "barangay_number": 18,
    "population": 4133,
    "percentage": 1.96,
    "urban_rural": "Urban",
    "rank": 19,
    "pop": 4133
  },
  {
    "code": "050506001",
    "psgc10DigitCode": "0500506001",
    "name": "Bgy. 47 - Arimbay",
    "official_psgc_name": "Bgy. 47 - Arimbay",
    "barangay_number": 47,
    "population": 4085,
    "percentage": 1.94,
    "urban_rural": "Rural",
    "rank": 20,
    "pop": 4085
  },
  {
    "code": "050506005",
    "psgc10DigitCode": "0500506005",
    "name": "Bgy. 1 - Em's Barrio",
    "official_psgc_name": "Bgy. 1 - Em's Barrio (Pob.)",
    "barangay_number": 1,
    "population": 3259,
    "percentage": 1.55,
    "urban_rural": "Urban",
    "rank": 21,
    "pop": 3259
  },
  {
    "code": "050506050",
    "psgc10DigitCode": "0500506050",
    "name": "Bgy. 70 - Cagbacong",
    "official_psgc_name": "Bgy. 70 - Cagbacong",
    "barangay_number": 70,
    "population": 3019,
    "percentage": 1.43,
    "urban_rural": "Rural",
    "rank": 22,
    "pop": 3019
  },
  {
    "code": "050506032",
    "psgc10DigitCode": "0500506032",
    "name": "Bgy. 33 - PNR-Peñaranda St.-Iraya",
    "official_psgc_name": "Bgy. 33 - PNR-Peñaranda St.-Iraya (Pob.)",
    "barangay_number": 33,
    "population": 2887,
    "percentage": 1.37,
    "urban_rural": "Urban",
    "rank": 23,
    "pop": 2887
  },
  {
    "code": "050506057",
    "psgc10DigitCode": "0500506057",
    "name": "Bgy. 65 - Imalnod",
    "official_psgc_name": "Bgy. 65 - Imalnod",
    "barangay_number": 65,
    "population": 2798,
    "percentage": 1.33,
    "urban_rural": "Rural",
    "rank": 24,
    "pop": 2798
  },
  {
    "code": "050506022",
    "psgc10DigitCode": "0500506022",
    "name": "Bgy. 25 - Lapu-lapu",
    "official_psgc_name": "Bgy. 25 - Lapu-lapu (Pob.)",
    "barangay_number": 25,
    "population": 2730,
    "percentage": 1.3,
    "urban_rural": "Urban",
    "rank": 25,
    "pop": 2730
  },
  {
    "code": "050506042",
    "psgc10DigitCode": "0500506042",
    "name": "Bgy. 8 - Bagumbayan",
    "official_psgc_name": "Bgy. 8 - Bagumbayan (Pob.)",
    "barangay_number": 8,
    "population": 2564,
    "percentage": 1.22,
    "urban_rural": "Urban",
    "rank": 26,
    "pop": 2564
  },
  {
    "code": "050506011",
    "psgc10DigitCode": "0500506011",
    "name": "Bgy. 15 - Ilawod East Pob.",
    "official_psgc_name": "Bgy. 15 - Ilawod East Pob.",
    "barangay_number": 15,
    "population": 2386,
    "percentage": 1.13,
    "urban_rural": "Urban",
    "rank": 27,
    "pop": 2386
  },
  {
    "code": "050506037",
    "psgc10DigitCode": "0500506037",
    "name": "Bgy. 39 - Bonot",
    "official_psgc_name": "Bgy. 39 - Bonot (Pob.)",
    "barangay_number": 39,
    "population": 2375,
    "percentage": 1.13,
    "urban_rural": "Urban",
    "rank": 28,
    "pop": 2375
  },
  {
    "code": "050506013",
    "psgc10DigitCode": "0500506013",
    "name": "Bgy. 17 - Rizal Street., Ilawod",
    "official_psgc_name": "Bgy. 17 - Rizal Street., Ilawod (Pob.)",
    "barangay_number": 17,
    "population": 2365,
    "percentage": 1.12,
    "urban_rural": "Urban",
    "rank": 29,
    "pop": 2365
  },
  {
    "code": "050506065",
    "psgc10DigitCode": "0500506065",
    "name": "Bgy. 68 - San Francisco",
    "official_psgc_name": "Bgy. 68 - San Francisco",
    "barangay_number": 68,
    "population": 2322,
    "percentage": 1.1,
    "urban_rural": "Rural",
    "rank": 30,
    "pop": 2322
  },
  {
    "code": "050506053",
    "psgc10DigitCode": "0500506053",
    "name": "Bgy. 45 - Dita",
    "official_psgc_name": "Bgy. 45 - Dita",
    "barangay_number": 45,
    "population": 2167,
    "percentage": 1.03,
    "urban_rural": "Rural",
    "rank": 31,
    "pop": 2167
  },
  {
    "code": "050506033",
    "psgc10DigitCode": "0500506033",
    "name": "Bgy. 34 - Oro Site-Magallanes St.",
    "official_psgc_name": "Bgy. 34 - Oro Site-Magallanes St. (Pob.)",
    "barangay_number": 34,
    "population": 2140,
    "percentage": 1.02,
    "urban_rural": "Urban",
    "rank": 32,
    "pop": 2140
  },
  {
    "code": "050506059",
    "psgc10DigitCode": "0500506059",
    "name": "Bgy. 63 - Mariawa",
    "official_psgc_name": "Bgy. 63 - Mariawa",
    "barangay_number": 63,
    "population": 2026,
    "percentage": 0.96,
    "urban_rural": "Rural",
    "rank": 33,
    "pop": 2026
  },
  {
    "code": "050506061",
    "psgc10DigitCode": "0500506061",
    "name": "Bgy. 50 - Padang",
    "official_psgc_name": "Bgy. 50 - Padang",
    "barangay_number": 50,
    "population": 1949,
    "percentage": 0.93,
    "urban_rural": "Rural",
    "rank": 34,
    "pop": 1949
  },
  {
    "code": "050506071",
    "psgc10DigitCode": "0500506071",
    "name": "Bgy. 52 - Matanag",
    "official_psgc_name": "Bgy. 52 - Matanag",
    "barangay_number": 52,
    "population": 1904,
    "percentage": 0.9,
    "urban_rural": "Rural",
    "rank": 35,
    "pop": 1904
  },
  {
    "code": "050506066",
    "psgc10DigitCode": "0500506066",
    "name": "Bgy. 46 - San Joaquin",
    "official_psgc_name": "Bgy. 46 - San Joaquin",
    "barangay_number": 46,
    "population": 1903,
    "percentage": 0.9,
    "urban_rural": "Rural",
    "rank": 36,
    "pop": 1903
  },
  {
    "code": "050506026",
    "psgc10DigitCode": "0500506026",
    "name": "Bgy. 29 - Sabang",
    "official_psgc_name": "Bgy. 29 - Sabang (Pob.)",
    "barangay_number": 29,
    "population": 1894,
    "percentage": 0.9,
    "urban_rural": "Urban",
    "rank": 37,
    "pop": 1894
  },
  {
    "code": "050506002",
    "psgc10DigitCode": "0500506002",
    "name": "Bgy. 64 - Bagacay",
    "official_psgc_name": "Bgy. 64 - Bagacay",
    "barangay_number": 64,
    "population": 1869,
    "percentage": 0.89,
    "urban_rural": "Rural",
    "rank": 38,
    "pop": 1869
  },
  {
    "code": "050506019",
    "psgc10DigitCode": "0500506019",
    "name": "Bgy. 22 - Binanuahan East",
    "official_psgc_name": "Bgy. 22 - Binanuahan East (Pob.)",
    "barangay_number": 22,
    "population": 1861,
    "percentage": 0.88,
    "urban_rural": "Urban",
    "rank": 39,
    "pop": 1861
  },
  {
    "code": "050506073",
    "psgc10DigitCode": "0500506073",
    "name": "Bgy. 24 - Rizal Street",
    "official_psgc_name": "Bgy. 24 - Rizal Street",
    "barangay_number": 24,
    "population": 1826,
    "percentage": 0.87,
    "urban_rural": "Rural",
    "rank": 40,
    "pop": 1826
  },
  {
    "code": "050506069",
    "psgc10DigitCode": "0500506069",
    "name": "Bgy. 43 - Tamaoyan",
    "official_psgc_name": "Bgy. 43 - Tamaoyan",
    "barangay_number": 43,
    "population": 1809,
    "percentage": 0.86,
    "urban_rural": "Rural",
    "rank": 41,
    "pop": 1809
  },
  {
    "code": "050506052",
    "psgc10DigitCode": "0500506052",
    "name": "Bgy. 57 - Dap-dap",
    "official_psgc_name": "Bgy. 57 - Dap-dap",
    "barangay_number": 57,
    "population": 1746,
    "percentage": 0.83,
    "urban_rural": "Rural",
    "rank": 42,
    "pop": 1746
  },
  {
    "code": "050506044",
    "psgc10DigitCode": "0500506044",
    "name": "Bgy. 67 - Bariis",
    "official_psgc_name": "Bgy. 67 - Bariis",
    "barangay_number": 67,
    "population": 1739,
    "percentage": 0.83,
    "urban_rural": "Rural",
    "rank": 43,
    "pop": 1739
  },
  {
    "code": "050506058",
    "psgc10DigitCode": "0500506058",
    "name": "Bgy. 54 - Mabinit",
    "official_psgc_name": "Bgy. 54 - Mabinit",
    "barangay_number": 54,
    "population": 1699,
    "percentage": 0.81,
    "urban_rural": "Rural",
    "rank": 44,
    "pop": 1699
  },
  {
    "code": "050506003",
    "psgc10DigitCode": "0500506003",
    "name": "Bgy. 48 - Bagong Abre",
    "official_psgc_name": "Bgy. 48 - Bagong Abre",
    "barangay_number": 48,
    "population": 1675,
    "percentage": 0.8,
    "urban_rural": "Rural",
    "rank": 45,
    "pop": 1675
  },
  {
    "code": "050506015",
    "psgc10DigitCode": "0500506015",
    "name": "Bgy. 19 - Cabagñan",
    "official_psgc_name": "Bgy. 19 - Cabagñan",
    "barangay_number": 19,
    "population": 1611,
    "percentage": 0.76,
    "urban_rural": "Rural",
    "rank": 46,
    "pop": 1611
  },
  {
    "code": "050506007",
    "psgc10DigitCode": "0500506007",
    "name": "Bgy. 11 - Maoyod Pob.",
    "official_psgc_name": "Bgy. 11 - Maoyod Pob.",
    "barangay_number": 11,
    "population": 1505,
    "percentage": 0.71,
    "urban_rural": "Urban",
    "rank": 47,
    "pop": 1505
  },
  {
    "code": "050506025",
    "psgc10DigitCode": "0500506025",
    "name": "Bgy. 28 - Victory Village North",
    "official_psgc_name": "Bgy. 28 - Victory Village North (Pob.)",
    "barangay_number": 28,
    "population": 1487,
    "percentage": 0.71,
    "urban_rural": "Urban",
    "rank": 48,
    "pop": 1487
  },
  {
    "code": "050506077",
    "psgc10DigitCode": "0500506077",
    "name": "Bgy. 60 - Lamba",
    "official_psgc_name": "Bgy. 60 - Lamba",
    "barangay_number": 60,
    "population": 1453,
    "percentage": 0.69,
    "urban_rural": "Rural",
    "rank": 49,
    "pop": 1453
  },
  {
    "code": "050506024",
    "psgc10DigitCode": "0500506024",
    "name": "Bgy. 27 - Victory Village South",
    "official_psgc_name": "Bgy. 27 - Victory Village South (Pob.)",
    "barangay_number": 27,
    "population": 1451,
    "percentage": 0.69,
    "urban_rural": "Urban",
    "rank": 50,
    "pop": 1451
  },
  {
    "code": "050506048",
    "psgc10DigitCode": "0500506048",
    "name": "Bgy. 69 - Buenavista",
    "official_psgc_name": "Bgy. 69 - Buenavista",
    "barangay_number": 69,
    "population": 1419,
    "percentage": 0.67,
    "urban_rural": "Rural",
    "rank": 51,
    "pop": 1419
  },
  {
    "code": "050506016",
    "psgc10DigitCode": "0500506016",
    "name": "Bgy. 2 - Em's Barrio South",
    "official_psgc_name": "Bgy. 2 - Em's Barrio South (Pob.)",
    "barangay_number": 2,
    "population": 1416,
    "percentage": 0.67,
    "urban_rural": "Urban",
    "rank": 52,
    "pop": 1416
  },
  {
    "code": "050506043",
    "psgc10DigitCode": "0500506043",
    "name": "Bgy. 9 - Pinaric",
    "official_psgc_name": "Bgy. 9 - Pinaric (Pob.)",
    "barangay_number": 9,
    "population": 1414,
    "percentage": 0.67,
    "urban_rural": "Urban",
    "rank": 53,
    "pop": 1414
  },
  {
    "code": "050506040",
    "psgc10DigitCode": "0500506040",
    "name": "Bgy. 6 - Bañadero Pob.",
    "official_psgc_name": "Bgy. 6 - Bañadero Pob.",
    "barangay_number": 6,
    "population": 1289,
    "percentage": 0.61,
    "urban_rural": "Urban",
    "rank": 54,
    "pop": 1289
  },
  {
    "code": "050506029",
    "psgc10DigitCode": "0500506029",
    "name": "Bgy. 30 - Pigcale",
    "official_psgc_name": "Bgy. 30 - Pigcale (Pob.)",
    "barangay_number": 30,
    "population": 1210,
    "percentage": 0.57,
    "urban_rural": "Urban",
    "rank": 55,
    "pop": 1210
  },
  {
    "code": "050506020",
    "psgc10DigitCode": "0500506020",
    "name": "Bgy. 23 - Imperial Court Subd.",
    "official_psgc_name": "Bgy. 23 - Imperial Court Subd. (Pob.)",
    "barangay_number": 23,
    "population": 1202,
    "percentage": 0.57,
    "urban_rural": "Urban",
    "rank": 56,
    "pop": 1202
  },
  {
    "code": "050506030",
    "psgc10DigitCode": "0500506030",
    "name": "Bgy. 31 - Centro-Baybay",
    "official_psgc_name": "Bgy. 31 - Centro-Baybay (Pob.)",
    "barangay_number": 31,
    "population": 1088,
    "percentage": 0.52,
    "urban_rural": "Urban",
    "rank": 57,
    "pop": 1088
  },
  {
    "code": "050506008",
    "psgc10DigitCode": "0500506008",
    "name": "Bgy. 12 - Tula-tula",
    "official_psgc_name": "Bgy. 12 - Tula-tula (Pob.)",
    "barangay_number": 12,
    "population": 1041,
    "percentage": 0.49,
    "urban_rural": "Urban",
    "rank": 58,
    "pop": 1041
  },
  {
    "code": "050506039",
    "psgc10DigitCode": "0500506039",
    "name": "Bgy. 5 - Sagmin Pob.",
    "official_psgc_name": "Bgy. 5 - Sagmin Pob.",
    "barangay_number": 5,
    "population": 1037,
    "percentage": 0.49,
    "urban_rural": "Urban",
    "rank": 59,
    "pop": 1037
  },
  {
    "code": "050506038",
    "psgc10DigitCode": "0500506038",
    "name": "Bgy. 4 - Sagpon Pob.",
    "official_psgc_name": "Bgy. 4 - Sagpon Pob.",
    "barangay_number": 4,
    "population": 975,
    "percentage": 0.46,
    "urban_rural": "Urban",
    "rank": 60,
    "pop": 975
  },
  {
    "code": "050506027",
    "psgc10DigitCode": "0500506027",
    "name": "Bgy. 3 - Em's Barrio East",
    "official_psgc_name": "Bgy. 3 - Em's Barrio East (Pob.)",
    "barangay_number": 3,
    "population": 945,
    "percentage": 0.45,
    "urban_rural": "Urban",
    "rank": 61,
    "pop": 945
  },
  {
    "code": "050506018",
    "psgc10DigitCode": "0500506018",
    "name": "Bgy. 21 - Binanuahan West",
    "official_psgc_name": "Bgy. 21 - Binanuahan West (Pob.)",
    "barangay_number": 21,
    "population": 770,
    "percentage": 0.37,
    "urban_rural": "Urban",
    "rank": 62,
    "pop": 770
  },
  {
    "code": "050506010",
    "psgc10DigitCode": "0500506010",
    "name": "Bgy. 14 - Ilawod Pob.",
    "official_psgc_name": "Bgy. 14 - Ilawod Pob.",
    "barangay_number": 14,
    "population": 719,
    "percentage": 0.34,
    "urban_rural": "Urban",
    "rank": 63,
    "pop": 719
  },
  {
    "code": "050506021",
    "psgc10DigitCode": "0500506021",
    "name": "Bgy. 20 - Cabagñan East",
    "official_psgc_name": "Bgy. 20 - Cabagñan East (Pob.)",
    "barangay_number": 20,
    "population": 707,
    "percentage": 0.34,
    "urban_rural": "Urban",
    "rank": 64,
    "pop": 707
  },
  {
    "code": "050506041",
    "psgc10DigitCode": "0500506041",
    "name": "Bgy. 7 - Baño",
    "official_psgc_name": "Bgy. 7 - Baño (Pob.)",
    "barangay_number": 7,
    "population": 559,
    "percentage": 0.27,
    "urban_rural": "Urban",
    "rank": 65,
    "pop": 559
  },
  {
    "code": "050506023",
    "psgc10DigitCode": "0500506023",
    "name": "Bgy. 26 - Dinagaan",
    "official_psgc_name": "Bgy. 26 - Dinagaan (Pob.)",
    "barangay_number": 26,
    "population": 534,
    "percentage": 0.25,
    "urban_rural": "Urban",
    "rank": 66,
    "pop": 534
  },
  {
    "code": "050506072",
    "psgc10DigitCode": "0500506072",
    "name": "Bgy. 10 - Cabugao",
    "official_psgc_name": "Bgy. 10 - Cabugao",
    "barangay_number": 10,
    "population": 452,
    "percentage": 0.21,
    "urban_rural": "Rural",
    "rank": 67,
    "pop": 452
  },
  {
    "code": "050506028",
    "psgc10DigitCode": "0500506028",
    "name": "Bgy. 36 - Kapantawan",
    "official_psgc_name": "Bgy. 36 - Kapantawan (Pob.)",
    "barangay_number": 36,
    "population": 404,
    "percentage": 0.19,
    "urban_rural": "Urban",
    "rank": 68,
    "pop": 404
  },
  {
    "code": "050506009",
    "psgc10DigitCode": "0500506009",
    "name": "Bgy. 13 - Ilawod West Pob.",
    "official_psgc_name": "Bgy. 13 - Ilawod West Pob.",
    "barangay_number": 13,
    "population": 365,
    "percentage": 0.17,
    "urban_rural": "Urban",
    "rank": 69,
    "pop": 365
  },
  {
    "code": "050506034",
    "psgc10DigitCode": "0500506034",
    "name": "Bgy. 35 - Tinago",
    "official_psgc_name": "Bgy. 35 - Tinago (Pob.)",
    "barangay_number": 35,
    "population": 340,
    "percentage": 0.16,
    "urban_rural": "Urban",
    "rank": 70,
    "pop": 340
  }
];

// Historical data (Legazpi City Census - Official PSA)
const historicalData = {
  years: [1990, 1995, 2000, 2007, 2010, 2015, 2020, 2024],
  populations: [121116, 141657, 157010, 179481, 182201, 196639, 209533, 210616],
};

// Official PSA Small Area Poverty Estimates for Albay (2018, 2021, 2023)
const povertyAlbayData = [
  { id: '50501', name: 'Bacacay', rates: { 2018: 31.5, 2021: 27.3, 2023: 27.8 }, ci: { 2018: [27.8, 35.2], 2021: [24.2, 30.4], 2023: [25.3, 30.4] } },
  { id: '50502', name: 'Camalig', rates: { 2018: 21.1, 2021: 23.4, 2023: 26.0 }, ci: { 2018: [17.8, 24.3], 2021: [20.2, 26.5], 2023: [22.7, 29.2] } },
  { id: '50503', name: 'Daraga (Locsin)', rates: { 2018: 13.5, 2021: 15.5, 2023: 16.9 }, ci: { 2018: [11.1, 15.9], 2021: [13.2, 17.7], 2023: [14.9, 18.9] } },
  { id: '50504', name: 'Guinobatan', rates: { 2018: 25.6, 2021: 21.9, 2023: 24.0 }, ci: { 2018: [22.4, 28.9], 2021: [19.2, 24.6], 2023: [21.6, 26.4] } },
  { id: '50505', name: 'Jovellar', rates: { 2018: 37.5, 2021: 37.0, 2023: 36.0 }, ci: { 2018: [32.2, 42.9], 2021: [31.9, 42.0], 2023: [31.3, 40.8] } },
  { id: '50506', name: 'City of Legazpi', isLegazpi: true, rates: { 2018: 13.8, 2021: 17.6, 2023: 16.3 }, ci: { 2018: [11.7, 15.8], 2021: [15.9, 19.3], 2023: [14.4, 18.3] } },
  { id: '50507', name: 'Libon', rates: { 2018: 37.4, 2021: 33.3, 2023: 34.7 }, ci: { 2018: [33.1, 41.6], 2021: [29.9, 36.6], 2023: [32.0, 37.5] } },
  { id: '50508', name: 'City of Ligao', rates: { 2018: 23.1, 2021: 24.7, 2023: 28.4 }, ci: { 2018: [20.4, 25.7], 2021: [22.3, 27.2], 2023: [26.1, 30.8] } },
  { id: '50509', name: 'Malilipot', rates: { 2018: 26.1, 2021: 21.3, 2023: 25.8 }, ci: { 2018: [21.3, 30.9], 2021: [17.4, 25.2], 2023: [21.6, 30.0] } },
  { id: '50510', name: 'Malinao', rates: { 2018: 33.7, 2021: 28.3, 2023: 33.1 }, ci: { 2018: [29.5, 37.8], 2021: [24.8, 31.7], 2023: [29.5, 36.6] } },
  { id: '50511', name: 'Manito', rates: { 2018: 37.2, 2021: 29.0, 2023: 34.4 }, ci: { 2018: [31.5, 42.9], 2021: [23.4, 34.5], 2023: [29.3, 39.6] } },
  { id: '50512', name: 'Oas', rates: { 2018: 34.2, 2021: 31.4, 2023: 29.7 }, ci: { 2018: [31.0, 37.5], 2021: [28.3, 34.5], 2023: [26.9, 32.5] } },
  { id: '50513', name: 'Pio Duran', rates: { 2018: 37.5, 2021: 31.4, 2023: 35.4 }, ci: { 2018: [32.8, 42.2], 2021: [27.7, 35.1], 2023: [31.5, 39.3] } },
  { id: '50514', name: 'Polangui', rates: { 2018: 21.3, 2021: 22.3, 2023: 24.8 }, ci: { 2018: [18.5, 24.2], 2021: [20.0, 24.6], 2023: [22.3, 27.3] } },
  { id: '50515', name: 'Rapu-Rapu', rates: { 2018: 42.7, 2021: 38.8, 2023: 39.9 }, ci: { 2018: [38.3, 47.1], 2021: [34.2, 43.4], 2023: [36.4, 43.5] } },
  { id: '50516', name: 'Santo Domingo', rates: { 2018: 23.0, 2021: 17.9, 2023: 20.7 }, ci: { 2018: [18.1, 27.9], 2021: [14.7, 21.1], 2023: [17.6, 23.9] } },
  { id: '50517', name: 'City of Tabaco', rates: { 2018: 19.8, 2021: 20.2, 2023: 22.3 }, ci: { 2018: [16.7, 22.9], 2021: [17.7, 22.7], 2023: [19.9, 24.7] } },
  { id: '50518', name: 'Tiwi', rates: { 2018: 23.6, 2021: 24.7, 2023: 27.3 }, ci: { 2018: [19.0, 28.2], 2021: [21.2, 28.2], 2023: [24.7, 29.9] } },
];

// Chart instances
let charts = {};

/**
 * Animate number counting
 */
function animateCount(element, target, duration = 2000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * easeOut);

    element.textContent = current.toLocaleString();

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target.toLocaleString();
    }
  }

  requestAnimationFrame(update);
}

/**
 * Intersection Observer for scroll animations
 */
function initScrollAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const delay = entry.target.dataset.delay || 0;
          setTimeout(() => {
            entry.target.classList.add('visible');

            // Trigger count animation for metric cards
            const countEl = entry.target.querySelector('[data-count]');
            if (countEl) {
              const target = parseInt(countEl.dataset.count);
              animateCount(countEl, target);
            }

            // Animate bars
            animateBars(entry.target);

            // Resize or create poverty chart when scrolled into view
            if (entry.target.classList.contains('stats-poverty') || entry.target.querySelector('#povertyAlbayChart')) {
              if (!charts.povertyAlbay) {
                createPovertyChart();
              } else {
                charts.povertyAlbay.resize();
              }
            }
          }, delay);

          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2 }
  );

  document.querySelectorAll('.animate-on-scroll, .metric-card').forEach((el) => {
    observer.observe(el);
  });
}

/**
 * Animate progress bars within an element
 */
function animateBars(container) {
  // Breakdown bars
  container.querySelectorAll('.breakdown-segment').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width + '%';
      }, 300);
    }
  });

  // Barangay bars
  container.querySelectorAll('.bar-wrap .bar').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width + '%';
      }, 100);
    }
  });

  // Sector bars
  container.querySelectorAll('.sector-bar, .sc-fill').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width + '%';
      }, 200);
    }
  });

  // Poverty bars
  container.querySelectorAll('.poverty-fill').forEach((bar) => {
    const width = bar.dataset.width;
    if (width) {
      setTimeout(() => {
        bar.style.width = width * 10 + '%';
      }, 300);
    }
  });
}

/**
 * Dark Mode & Theme Color Helpers
 */
function isDarkMode() {
  return typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme') === 'dark';
}

function getChartThemeColors() {
  const dark = isDarkMode();
  return {
    isDark: dark,
    textColor: dark ? '#e2e8f0' : '#334155',
    textMuted: dark ? '#94a3b8' : '#64748b',
    gridColor: dark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)',
    tooltipBg: dark ? 'rgba(15, 23, 42, 0.96)' : 'rgba(0, 50, 160, 0.95)',
    doughnutBorder: dark ? '#1e293b' : '#ffffff',
    otherBarColor: dark ? '#475569' : '#cbd5e1',
    otherBorderColor: dark ? '#64748b' : '#94a3b8',
    otherHoverColor: dark ? '#64748b' : '#64748b',
    avgLineColor: dark ? '#f59e0b' : '#f59e0b',
    avgTextColor: dark ? '#fbbf24' : '#b45309',
  };
}

/**
 * Create Historical Line Chart
 */
function createHistoricalChart() {
  const ctx = document.getElementById('historicalLineChart');
  if (!ctx) return;

  const theme = getChartThemeColors();
  const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 400);
  gradient.addColorStop(0, 'rgba(0, 50, 160, 0.25)');
  gradient.addColorStop(1, 'rgba(0, 50, 160, 0)');

  const points = historicalData.years.map((year, index) => ({
    x: year,
    y: historicalData.populations[index],
  }));

  charts.historical = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Population',
          data: points,
          borderColor: COLORS.primary,
          backgroundColor: gradient,
          fill: true,
          tension: 0.3,
          pointBackgroundColor: COLORS.primary,
          pointBorderColor: theme.doughnutBorder,
          pointBorderWidth: 3,
          pointRadius: 6,
          pointHoverRadius: 8,
          pointHoverBorderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 1500,
        easing: 'easeOutQuart',
      },
      interaction: {
        intersect: false,
        mode: 'nearest',
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleFont: { size: 14, weight: '600' },
          bodyFont: { size: 13 },
          padding: 12,
          cornerRadius: 8,
          displayColors: false,
          callbacks: {
            title: (items) => (items.length ? `Census Year: ${items[0].raw.x}` : ''),
            label: (ctx) => `Population: ${ctx.raw.y.toLocaleString()}`,
          },
        },
      },
      scales: {
        x: {
          type: 'linear',
          min: 1990,
          max: 2025,
          grid: { display: false },
          ticks: {
            stepSize: 5,
            font: { size: 12 },
            color: theme.textMuted,
            callback: (v) => v.toString(),
          },
        },
        y: {
          min: 120000,
          max: 220000,
          grid: { color: theme.gridColor },
          ticks: {
            stepSize: 20000,
            font: { size: 12 },
            color: theme.textMuted,
            callback: (v) => v / 1000 + 'K',
          },
        },
      },
    },
  });
}

/**
 * Create Distribution Pie/Doughnut Chart with cohesive gradient colors
 */
function createDistributionChart() {
  const ctx = document.getElementById('distributionPieChart');
  if (!ctx) return;

  const theme = getChartThemeColors();
  const top10 = barangayData.slice(0, 10);
  const totalCityPop = 210616;

  charts.distribution = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: top10.map((d) => d.name),
      datasets: [
        {
          data: top10.map((d) => d.pop || d.population),
          backgroundColor: DOUGHNUT_COLORS,
          borderColor: theme.doughnutBorder,
          borderWidth: 2,
          hoverBorderWidth: 3,
          hoverOffset: 8,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        animateRotate: true,
        animateScale: true,
        duration: 1500,
        easing: 'easeOutQuart',
      },
      cutout: '55%',
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10,
            font: { size: 11, family: "'Outfit', 'Inter', sans-serif" },
            color: theme.textColor,
            usePointStyle: true,
            pointStyle: 'circle',
          },
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          titleFont: { size: 13, weight: '600' },
          bodyFont: { size: 12 },
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) => {
              const pop = ctx.raw;
              const pct = ((pop / totalCityPop) * 100).toFixed(2);
              return `${ctx.label}: ${pop.toLocaleString()} (${pct}% of city)`;
            },
          },
        },
      },
    },
  });
}

/**
 * Create Albay Poverty Comparison Horizontal Bar Chart
 */
let currentPovertyYear = 2023;

function createPovertyChart() {
  if (typeof document === 'undefined') return;
  const ctx = document.getElementById('povertyAlbayChart');
  if (!ctx) return;

  if (typeof Chart === 'undefined') {
    console.warn('Chart.js is not loaded yet');
    return;
  }

  const theme = getChartThemeColors();

  // Destroy previous instance if exists
  if (charts.povertyAlbay) {
    try {
      charts.povertyAlbay.destroy();
    } catch (e) {
      console.warn('Error destroying poverty chart:', e);
    }
    charts.povertyAlbay = null;
  }

  // Map and sort items for current year
  const items = povertyAlbayData.map((d) => {
    return {
      id: d.id,
      name: d.name,
      isLegazpi: d.isLegazpi || d.id === '50506',
      rate: (d.rates && d.rates[currentPovertyYear]) || 0,
      ci: (d.ci && d.ci[currentPovertyYear]) || [0, 0],
    };
  });

  // Calculate provincial average across all 18 LGUs
  const totalRate = items.reduce((acc, curr) => acc + curr.rate, 0);
  const albayAvg = +(totalRate / items.length).toFixed(1);

  // Update Legend & Footer Insight
  const avgLegendEl = document.getElementById('povertyAvgLegendLabel');
  if (avgLegendEl) {
    avgLegendEl.innerHTML = `Albay Average: <strong>${albayAvg}%</strong>`;
  }

  const legazpiItem = items.find((d) => d.isLegazpi);
  const insightEl = document.getElementById('povertyInsightText');
  if (insightEl && legazpiItem) {
    const allSorted = items.slice().sort((a, b) => a.rate - b.rate);
    const rank = allSorted.findIndex((d) => d.isLegazpi) + 1;
    const rankSuffix = rank === 1 ? 'lowest' : `#${rank} lowest`;
    insightEl.innerHTML = `In ${currentPovertyYear}, <strong>Legazpi City</strong> recorded the ${rankSuffix} poverty incidence in the Province of Albay at <strong>${legazpiItem.rate}%</strong> (90% CI: ${legazpiItem.ci[0]}% - ${legazpiItem.ci[1]}%), well below the provincial average of <strong>${albayAvg}%</strong>.`;
  }

  // Sorted items from lowest to highest poverty incidence
  const displayItems = items.slice().sort((a, b) => a.rate - b.rate);

  // Generate colors based on active theme
  const backgroundColors = displayItems.map((d) => (d.isLegazpi ? '#0032a0' : theme.otherBarColor));
  const borderColors = displayItems.map((d) => (d.isLegazpi ? '#002170' : theme.otherBorderColor));
  const hoverColors = displayItems.map((d) => (d.isLegazpi ? '#002170' : theme.otherHoverColor));
  const labels = displayItems.map((d) => (d.isLegazpi ? `⭐ ${d.name}` : d.name));
  const rates = displayItems.map((d) => d.rate);

  // Plugin to draw dashed average line safely
  const povertyAvgLinePlugin = {
    id: 'povertyAvgLine',
    afterDatasetsDraw(chart) {
      if (!chart || !chart.chartArea) return;
      const chartCtx = chart.ctx;
      const chartArea = chart.chartArea;
      const x = chart.scales && chart.scales.x;
      if (!chartCtx || !chartArea || !x) return;

      const top = chartArea.top;
      const bottom = chartArea.bottom;
      const left = chartArea.left;
      const right = chartArea.right;

      const xPos = x.getPixelForValue(albayAvg);
      if (typeof xPos !== 'number' || isNaN(xPos) || xPos < left || xPos > right) return;

      chartCtx.save();
      chartCtx.beginPath();
      chartCtx.setLineDash([4, 4]);
      chartCtx.strokeStyle = theme.avgLineColor;
      chartCtx.lineWidth = 2;
      chartCtx.moveTo(xPos, top);
      chartCtx.lineTo(xPos, bottom);
      chartCtx.stroke();

      // Label at top
      chartCtx.fillStyle = theme.avgTextColor;
      chartCtx.font = 'bold 11px Outfit, Inter, sans-serif';
      chartCtx.textAlign = 'center';
      chartCtx.fillText(`Albay Avg: ${albayAvg}%`, xPos, Math.max(10, top - 6));
      chartCtx.restore();
    },
  };

  try {
    charts.povertyAlbay = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: `Poverty Incidence (${currentPovertyYear})`,
            data: rates,
            backgroundColor: backgroundColors,
            borderColor: borderColors,
            hoverBackgroundColor: hoverColors,
            borderWidth: 1.5,
            borderRadius: 6,
            barPercentage: 0.75,
            categoryPercentage: 0.85,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        layout: {
          padding: { top: 20, right: 24, bottom: 8, left: 8 },
        },
        animation: {
          duration: 600,
          easing: 'easeOutQuart',
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: theme.tooltipBg,
            titleFont: { size: 13, weight: 'bold', family: "'Outfit', 'Inter', sans-serif" },
            bodyFont: { size: 12, family: "'Outfit', 'Inter', sans-serif" },
            padding: 12,
            cornerRadius: 8,
            callbacks: {
              title: (tooltipItems) => {
                if (!tooltipItems || !tooltipItems.length) return '';
                const idx = tooltipItems[0].dataIndex;
                const item = displayItems[idx];
                return item ? (item.isLegazpi ? `${item.name} (Focus LGU)` : item.name) : '';
              },
              label: (toolCtx) => `Poverty Incidence: ${toolCtx.raw}%`,
              afterLabel: (toolCtx) => {
                const idx = toolCtx.dataIndex;
                const item = displayItems[idx];
                if (!item) return [];
                const allSorted = items.slice().sort((a, b) => a.rate - b.rate);
                const rank = allSorted.findIndex((d) => d.id === item.id) + 1;
                const legazpiRate = legazpiItem ? legazpiItem.rate : 16.3;
                const diff = item.rate - legazpiRate;
                const diffStr = item.isLegazpi
                  ? '⭐ Lowest in Albay'
                  : `${diff >= 0 ? '+' : ''}${diff.toFixed(1)}% vs Legazpi`;

                return [
                  `90% Confidence Interval: ${item.ci[0]}% - ${item.ci[1]}%`,
                  `Rank in Albay: #${rank} of 18`,
                  `Comparison: ${diffStr}`,
                ];
              },
            },
          },
        },
        scales: {
          x: {
            min: 0,
            max: 48,
            grid: { color: theme.gridColor },
            ticks: {
              stepSize: 5,
              font: { size: 11, family: "'Outfit', 'Inter', sans-serif" },
              color: theme.textMuted,
              callback: (v) => v + '%',
            },
            title: {
              display: true,
              text: 'Poverty Incidence (%)',
              font: { size: 11, weight: 'bold' },
              color: theme.textMuted,
            },
          },
          y: {
            grid: { display: false },
            ticks: {
              font: { size: 11, family: "'Outfit', 'Inter', sans-serif" },
              color: theme.textColor,
            },
          },
        },
      },
      plugins: [povertyAvgLinePlugin],
    });
  } catch (err) {
    console.error('Failed to create poverty chart:', err);
  }
}

function initPovertyControls() {
  const yearButtons = document.querySelectorAll('.poverty-year-btn');
  yearButtons.forEach((btn) => {
    btn.addEventListener('click', function () {
      const selectedYear = parseInt(this.dataset.year, 10);
      if (selectedYear === currentPovertyYear) return;

      yearButtons.forEach((b) => b.classList.remove('active'));
      this.classList.add('active');

      currentPovertyYear = selectedYear;
      createPovertyChart();
    });
  });
}

/**
 * Render Population by Barangay list
 */
function renderBarangayList(list, query = '') {
  const container = document.getElementById('barangayListContainer');
  if (!container) return;

  if (!list || list.length === 0) {
    container.innerHTML = `
      <div class="barangay-empty-state">
        <i class="bi bi-search"></i>
        <p>No barangays found matching "<strong>${escapeHtml(query)}</strong>"</p>
      </div>
    `;
    return;
  }

  // Highest population in Legazpi is Bgy. 56 - Taysan (20,017)
  const maxPop = barangayData.length > 0 ? Math.max(...barangayData.map((b) => b.population || b.pop || 1)) : 20017;

  container.innerHTML = list
    .map((item) => {
      const pop = item.population || item.pop || 0;
      const rank = item.rank || 1;
      const widthPct = Math.max(4, Math.round((pop / maxPop) * 100));
      return `
        <div class="barangay-row" data-rank="${rank}">
          <span class="rank">#${rank}</span>
          <span class="name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</span>
          <div class="bar-wrap">
            <div class="bar" data-width="${widthPct}" style="width: ${widthPct}%"></div>
          </div>
          <span class="pop">${pop.toLocaleString()}</span>
        </div>
      `;
    })
    .join('');
}

/**
 * Initialize instant search for Population by Barangay
 */
function initBarangaySearch() {
  const searchInput = document.getElementById('barangaySearchInput');
  const clearBtn = document.getElementById('barangaySearchClear');
  const countBadge = document.getElementById('barangayVisibleCount');

  if (!searchInput) return;

  function handleFilter() {
    const query = searchInput.value.trim().toLowerCase();

    if (clearBtn) {
      clearBtn.style.display = query.length > 0 ? 'inline-flex' : 'none';
    }

    let filtered = barangayData;
    if (query) {
      filtered = barangayData.filter((b) => {
        const nameMatch = b.name && b.name.toLowerCase().includes(query);
        const codeMatch = b.code && b.code.includes(query);
        const numMatch = b.barangay_number && b.barangay_number.toString() === query.replace(/^bgy\.?\s*/i, '');
        return nameMatch || codeMatch || numMatch;
      });
    }

    if (countBadge) {
      countBadge.textContent = filtered.length;
    }

    renderBarangayList(filtered, query);
  }

  searchInput.addEventListener('input', handleFilter);

  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      searchInput.value = '';
      searchInput.focus();
      handleFilter();
    });
  }
}

/**
 * Fetch and load Barangay SSOT data dynamically
 */
async function loadBarangayData() {
  try {
    const basePath = window.location.pathname.includes('/statistics') ? '../' : './';
    const response = await fetch(`${basePath}data/barangays.json`);
    if (response.ok) {
      const json = await response.json();
      if (json && Array.isArray(json.data) && json.data.length > 0) {
        const sorted = json.data.sort((a, b) => b.population - a.population);
        sorted.forEach((item, index) => {
          item.rank = index + 1;
          item.pop = item.population;
        });
        barangayData = sorted;

        // Refresh doughnut chart if already created
        if (charts.distribution) {
          charts.distribution.destroy();
          charts.distribution = null;
          createDistributionChart();
        }
      }
    }
  } catch (err) {
    console.warn('Using bundled SSOT barangay data fallback:', err);
  } finally {
    renderBarangayList(barangayData);
    const countBadge = document.getElementById('barangayVisibleCount');
    if (countBadge) {
      countBadge.textContent = barangayData.length;
    }
  }
}

/**
 * HTML Escaping utility
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Initialize all core charts with lazy intersection observer
 */
function initCharts() {
  const chartObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const chartId = entry.target.id;

          if (chartId === 'historicalLineChart' && !charts.historical) {
            createHistoricalChart();
          } else if (chartId === 'distributionPieChart' && !charts.distribution) {
            createDistributionChart();
          } else if (chartId === 'povertyAlbayChart' && !charts.povertyAlbay) {
            createPovertyChart();
          }

          chartObserver.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  document.querySelectorAll('canvas').forEach((canvas) => {
    chartObserver.observe(canvas);
  });
}

/**
 * Dynamically synchronize all Chart.js instances with current Dark/Light theme
 */
function updateAllChartsTheme() {
  const theme = getChartThemeColors();

  // 1. Historical Line Chart
  if (charts.historical && charts.historical.options) {
    if (charts.historical.options.scales) {
      if (charts.historical.options.scales.x && charts.historical.options.scales.x.ticks) {
        charts.historical.options.scales.x.ticks.color = theme.textMuted;
      }
      if (charts.historical.options.scales.y) {
        if (charts.historical.options.scales.y.ticks) {
          charts.historical.options.scales.y.ticks.color = theme.textMuted;
        }
        if (charts.historical.options.scales.y.grid) {
          charts.historical.options.scales.y.grid.color = theme.gridColor;
        }
      }
    }
    if (charts.historical.options.plugins && charts.historical.options.plugins.tooltip) {
      charts.historical.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
    }
    if (charts.historical.data.datasets[0]) {
      charts.historical.data.datasets[0].pointBorderColor = theme.doughnutBorder;
    }
    charts.historical.update('none');
  }

  // 2. Population Distribution Doughnut Chart
  if (charts.distribution && charts.distribution.options) {
    if (charts.distribution.options.plugins && charts.distribution.options.plugins.legend) {
      charts.distribution.options.plugins.legend.labels.color = theme.textColor;
    }
    if (charts.distribution.options.plugins && charts.distribution.options.plugins.tooltip) {
      charts.distribution.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
    }
    if (charts.distribution.data.datasets[0]) {
      charts.distribution.data.datasets[0].borderColor = theme.doughnutBorder;
    }
    charts.distribution.update('none');
  }

  // 3. Poverty Comparison Chart (re-render to update plugin & dataset colors cleanly)
  if (charts.povertyAlbay) {
    createPovertyChart();
  }

  // 4. CMCI Overview & Pillar Charts
  const cmciChartKeys = [
    'cmciOverview',
    'cmciEconomicChart',
    'cmciGovernmentChart',
    'cmciInfraChart',
    'cmciResiliencyChart',
    'cmciInnovationChart',
  ];
  cmciChartKeys.forEach((key) => {
    const chart = charts[key];
    if (chart && chart.options) {
      if (chart.options.scales) {
        if (chart.options.scales.x && chart.options.scales.x.ticks) {
          chart.options.scales.x.ticks.color = theme.textMuted;
        }
        if (chart.options.scales.y) {
          if (chart.options.scales.y.ticks) {
            chart.options.scales.y.ticks.color = theme.textMuted;
          }
          if (chart.options.scales.y.grid) {
            chart.options.scales.y.grid.color = theme.gridColor;
          }
        }
      }
      if (chart.options.plugins && chart.options.plugins.tooltip) {
        chart.options.plugins.tooltip.backgroundColor = theme.tooltipBg;
      }
      chart.update('none');
    }
  });
}

/**
 * CMCI (Competitive Index) Data
 */
const cmciData = {
  years: ['2014', '2015', '2016', '2017', '2018', '2019', '2020', '2021', '2022', '2023', '2024'],
  pillars: {
    economicDynamism: {
      labels: [
        'Local Economy Size',
        'Local Economy Growth',
        'Active Establishments',
        'Safety Compliant Business',
        'Employment Generation',
        'Cost of Living',
        'Cost of Doing Business',
        'Financial Deepening',
        'Productivity',
        'Business & Prof. Organizations',
      ],
      data: [
        [0.0836, 0.5628, 0.6533, 0.2854, 1.4896, 1.5438, 1.5557, 0.1457, 0.2204, 0.1688, 0.1375],
        [1.1346, 0.3252, 0.3421, 0.0589, 0.4253, 0.1038, 0.5575, 0.0101, 0.0164, 0.0123, 0.0098],
        [null, null, null, 1.5372, 1.4852, 1.0082, 0.7671, 0.8381, 0.6904, 0.8107, 1.2331],
        [null, null, null, 0.5491, 0.4092, 0.6662, 0.726, 0.3878, 0.5173, 0.5147, 0.4927],
        [0.3967, 0.7864, 1.9368, 0.4001, 2.2459, 1.0558, 2.0809, 1.9125, 1.0008, 1.1003, 0.2406],
        [3.2692, 2.9438, 3.5, 1.681, 0.7143, 0.2778, 1.9366, 0.2273, 1.0, 1.0957, 0.9296],
        [3.704, 3.4046, 3.3498, 1.7362, 1.8941, 1.9723, 2.1282, 2.2036, 1.6248, 1.6062, 1.7885],
        [0.3159, 0.6628, 2.0833, 1.58, 1.3847, 1.0219, 1.2964, 1.1492, 1.069, 0.9314, 1.1362],
        [0.0498, 0.1813, 0.1395, 0.0109, 0.0232, 0.9413, 1.3548, 0.9267, 0.1414, 0.1559, 0.1529],
        [0.2717, 0.7494, 1.3634, 0.4158, 0.4786, 0.4002, 1.2792, 0.8448, 2.0, 2.0, 2.0],
      ],
    },
    governmentEfficiency: {
      labels: [
        'Compliance to Directives',
        'Investment Promotion Unit',
        'ARTA Citizens Charter',
        'Local Resource Generation',
        'Capacity of Health Services',
        'Capacity of School Services',
        'Recognition of Performance',
        'Business Permits',
        'Peace and Order',
        'Social Protection',
      ],
      data: [
        [2.9167, 3.3333, 2.8105, 2.4306, 2.3611, 2.4306, 2.5, 2.4265, 1.8571, 1.9643, 2.0],
        [3.3333, 3.3333, 3.3333, 2.5, 2.5, 2.5, 2.5, 2.5, 1.9048, 1.9048, 2.0001],
        [null, 2.1134, 1.9476, 1.8439, 2.013, 1.1632, 2.2766, 1.0417, 2.0, 2.0, 2.0],
        [0.9656, 1.1834, 0.6239, 0.5512, 0.5682, 0.3819, 0.3771, 0.2641, 0.5644, 0.4643, 0.2247],
        [0.0941, 0.3425, 0.6827, 0.9042, 1.4015, 1.3582, 1.1587, 1.1622, 0.8112, 0.7329, 0.6818],
        [0.548, 1.078, 0.3458, 0.3699, 0.0474, 0.9268, 0.8618, 0.691, 0.2954, 0.6763, 0.5917],
        [0.5714, 0.4496, 2.5, 0.3699, 0.6604, 0.5832, 0.7935, 0.2729, 0.3616, 1.0833, 0.5578],
        [null, null, 3.0944, 2.2106, 2.123, 2.265, 2.1363, 2.3461, 2.0, 2.0, 2.0],
        [0.6895, 0.8681, 1.9525, 1.0121, 0.2076, 0.3754, 0.5876, 0.4468, 0.0007, 0.3979, 0.3307],
        [null, null, 0.7996, 0.0199, 1.5081, 0.8581, 0.7192, 0.7175, 1.286, 0.564, 1.7674],
      ],
    },
    infrastructure: {
      labels: [
        'Road Network',
        'Distance to Ports',
        'Basic Utilities',
        'Transportation Vehicles',
        'Education',
        'Health',
        'LGU Investment',
        'Accommodation Capacity',
        'IT Capacity',
        'FinTech Capacity',
      ],
      data: [
        [0.1529, 0.0014, 0.3671, 0.0063, 2.5, 0.1069, 0.107, 0.0522, 0.0093, 0.0023, 0.0075],
        [3.2937, 3.3117, 3.3116, 2.4816, 2.4595, 2.4622, 2.4708, 2.4859, 1.977, 1.9584, 1.9183],
        [3.3333, 3.3333, 3.3333, 2.5, 2.5, 2.5, 2.5, 2.5, 1.571, 1.58, 0.9936],
        [0.3047, 0.63, 0.2556, 0.2835, 0.2358, 1.4174, 1.6161, 0.499, 0.3798, 0.2739, 0.1476],
        [0.2918, 0.9501, 0.7898, 0.6803, 1.0588, 1.0409, 0.9383, 0.808, 0.7691, 0.6235, 0.6333],
        [0.7312, 1.1021, 0.5881, 1.0757, 1.3019, 1.4124, 1.8439, 1.6773, 1.3211, 1.1773, 1.1994],
        [0.9969, 0.3214, 3.1818, 0.936, 0.9837, 0.689, 0.6609, 0.1339, 0.0028, 0.509, 0.319],
        [0.4443, 1.2404, 1.4686, 2.0252, 2.451, 1.6233, 1.793, 1.4424, 1.3014, 1.1746, 1.1444],
        [0.2851, 0.9028, 1.5769, 0.8516, 1.3371, 2.0, 1.7045, 0.7292, 0.2456, 0.2857, 0.2629],
        [0.2766, 0.7878, 1.4357, 1.0312, 1.1308, 1.2178, 1.3721, 1.1044, 1.3944, 1.376, 1.4153],
      ],
    },
    resiliency: {
      labels: [
        'Land Use Plan',
        'DRR Plan',
        'Disaster Drill',
        'Early Warning System',
        'DRRMP Budget',
        'Risk Assessments',
        'Emergency Infrastructure',
        'Utilities',
        'Employed Population',
        'Sanitary System',
      ],
      data: [
        [null, null, null, 2.5, 2.5, 2.4998, 2.5, 2.48, 1.9524, 1.9643, 1.9828],
        [null, null, null, 2.5, 2.5, 2.4405, 2.5, 2.5, 1.8889, 1.9524, 1.9091],
        [null, null, null, 2.5, 2.5, 1.25, 2.5, 1.2635, 1.1748, 1.0745, 1.0136],
        [null, null, null, 2.5, 2.5, 2.5, 2.5, 1.3571, 1.0884, 1.009, 1.0041],
        [null, null, null, 0.0627, 0.2109, 0.2672, 0.5516, 0.7942, 0.3579, 0.3638, 0.7416],
        [null, null, null, 2.5, 2.5, 2.5, 2.5, 2.5, 2.0, 2.0, 2.0],
        [null, null, null, 1.276, 1.2982, 0.9502, 0.9828, 0.5961, 0.645, 0.5757, 0.5241],
        [null, null, null, 1.0546, 1.7227, 1.9294, 1.9393, 1.5884, 1.6553, 1.6443, 1.4978],
        [null, null, null, 0.3476, 0.0423, 0.0773, 0.0464, 0.022, 0.3059, 0.3949, 0.2657],
        [null, null, null, 1.618, 1.6659, 1.8815, 1.9875, 1.8762, 1.5004, 1.5192, 1.5212],
      ],
    },
    innovation: {
      labels: [
        'ICT Plan',
        'R&D Expenditures',
        'E-BPLS Software',
        'Online Payment Facilities',
        'STEM Graduates',
        'IP Registration',
        'Internet Capability',
        'Basic Internet Service',
        'Innovation Facilities',
        'New Technology',
      ],
      data: [
        [null, null, null, null, null, null, null, null, 2.0001, 2.0001, 2.0001],
        [null, null, null, null, null, null, null, null, 0.0036, 0.0763, 0.0925],
        [null, null, null, null, null, null, null, null, 2.0, 2.0, 2.0],
        [null, null, null, null, null, null, null, null, 2.0, 2.0, 2.0],
        [null, null, null, null, null, null, null, null, 0.849, 1.2746, 0.9778],
        [null, null, null, null, null, null, null, null, 0.4989, 0.3639, 0.3832],
        [null, null, null, null, null, null, null, null, 1.0473, 1.0299, 1.0016],
        [null, null, null, null, null, null, null, null, 0.7291, 0.8892, 0.9868],
        [null, null, null, null, null, null, null, null, 0.3193, 0.3225, 0.2272],
        [null, null, null, null, null, null, null, null, 0.0766, 0.0106, 0.0128],
      ],
    },
  },
  keyIndicators: {
    labels: ['Health', 'Education', 'Social Protection', 'Peace & Order', 'LGU Investment'],
    data: [
      [0.7312, 1.1021, 0.5881, 1.0757, 1.3019, 1.4124, 1.8439, 1.6773, 1.3211, 1.1773, 1.1994],
      [0.2918, 0.9501, 0.7898, 0.6803, 1.0588, 1.0409, 0.9383, 0.808, 0.7691, 0.6235, 0.6333],
      [null, null, 0.7996, 0.0199, 1.5081, 0.8581, 0.7192, 0.7175, 1.286, 0.564, 1.7674],
      [0.6895, 0.8681, 1.9525, 1.0121, 0.2076, 0.3754, 0.5876, 0.4468, 0.0007, 0.3979, 0.3307],
      [0.9969, 0.3214, 3.1818, 0.936, 0.9837, 0.689, 0.6609, 0.1339, 0.0028, 0.509, 0.319],
    ],
  },
};

/**
 * Palette for charts (up to 10 series)
 */
const CMCI_PALETTE = [
  COLORS.primary,
  COLORS.accent,
  COLORS.success,
  COLORS.info,
  '#8B5CF6',
  '#EC4899',
  '#10B981',
  '#F59E0B',
  '#6366F1',
  '#14B8A6',
];

/**
 * Setup 2-in-1 Interactive Bottom Legend for a CMCI Chart (Option 2)
 */
function setupInteractiveBottomLegend(chartInstance, canvasId, labels, colors) {
  if (typeof document === 'undefined') return;
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const container = canvas.closest('.cmci-chart-container');
  if (!container) return;

  // Clean up any old toolbars or legends
  const prevToolbar = container.querySelector('.cmci-chart-toolbar');
  if (prevToolbar) prevToolbar.remove();
  const prevLegend = container.querySelector('.cmci-interactive-legend');
  if (prevLegend) prevLegend.remove();

  const legendContainer = document.createElement('div');
  legendContainer.className = 'cmci-interactive-legend';

  const itemsContainer = document.createElement('div');
  itemsContainer.className = 'cmci-legend-items';

  const actionsContainer = document.createElement('div');
  actionsContainer.className = 'cmci-legend-actions';

  const btnAll = document.createElement('button');
  btnAll.type = 'button';
  btnAll.className = 'cmci-legend-btn active';
  btnAll.innerHTML =
    '<i class="bi bi-check2-all"></i> <span data-i18n="stats-filter-all">All</span>';

  const btnClear = document.createElement('button');
  btnClear.type = 'button';
  btnClear.className = 'cmci-legend-btn';
  btnClear.innerHTML = '<i class="bi bi-x"></i> <span data-i18n="stats-filter-clear">Clear</span>';

  actionsContainer.appendChild(btnAll);
  actionsContainer.appendChild(btnClear);

  const legendItems = [];

  labels.forEach((label, index) => {
    const color = colors[index % colors.length];
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'cmci-legend-item active';
    item.style.setProperty('--indicator-color', color);
    item.innerHTML = `<span class="legend-indicator" style="--indicator-color:${color}"></span><span class="legend-text">${label}</span>`;
    item.title = 'Click to toggle. Double-click to isolate.';

    // Single click toggles
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = chartInstance.isDatasetVisible(index);
      chartInstance.setDatasetVisibility(index, !isVisible);
      item.classList.toggle('active', !isVisible);
      item.classList.toggle('inactive', isVisible);
      chartInstance.update();
      updateActionState();
    });

    // Double click isolates
    item.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      isolateIndicator(index);
    });

    // Hover highlight
    item.addEventListener('mouseenter', () => {
      if (!chartInstance.isDatasetVisible(index)) return;
      chartInstance.data.datasets.forEach((ds, i) => {
        if (i === index) {
          ds.borderWidth = 3.5;
          ds.pointRadius = 4;
        } else {
          ds.borderColor = colors[i % colors.length] + '35';
        }
      });
      chartInstance.update('none');
    });

    item.addEventListener('mouseleave', () => {
      chartInstance.data.datasets.forEach((ds, i) => {
        ds.borderWidth = 2;
        ds.pointRadius = 0;
        ds.borderColor = colors[i % colors.length];
      });
      chartInstance.update('none');
    });

    itemsContainer.appendChild(item);
    legendItems.push(item);
  });

  function isolateIndicator(targetIndex) {
    labels.forEach((_, i) => {
      const show = i === targetIndex;
      chartInstance.setDatasetVisibility(i, show);
      if (legendItems[i]) {
        legendItems[i].classList.toggle('active', show);
        legendItems[i].classList.toggle('inactive', !show);
      }
    });
    chartInstance.update();
    updateActionState();
  }

  function updateActionState() {
    let allActive = true;
    let noneActive = true;
    labels.forEach((_, i) => {
      const visible = chartInstance.isDatasetVisible(i);
      if (visible) noneActive = false;
      else allActive = false;
    });
    btnAll.classList.toggle('active', allActive);
    btnClear.classList.toggle('active', noneActive);
  }

  btnAll.addEventListener('click', () => {
    labels.forEach((_, i) => {
      chartInstance.setDatasetVisibility(i, true);
      if (legendItems[i]) {
        legendItems[i].classList.add('active');
        legendItems[i].classList.remove('inactive');
      }
    });
    chartInstance.update();
    updateActionState();
  });

  btnClear.addEventListener('click', () => {
    labels.forEach((_, i) => {
      chartInstance.setDatasetVisibility(i, false);
      if (legendItems[i]) {
        legendItems[i].classList.remove('active');
        legendItems[i].classList.add('inactive');
      }
    });
    chartInstance.update();
    updateActionState();
  });

  legendContainer.appendChild(itemsContainer);
  legendContainer.appendChild(actionsContainer);
  container.appendChild(legendContainer);

  // Link indicator cards in panel to chart filter
  const panel = container.closest('.cmci-panel');
  if (panel) {
    panel.querySelectorAll('.cmci-indicator-card').forEach((card) => {
      card.title = 'Click to isolate indicator on chart';
      card.addEventListener('click', () => {
        const headerEl = card.querySelector('.indicator-header');
        if (!headerEl) return;
        const text = headerEl.textContent.trim().toLowerCase();
        const matchIndex = labels.findIndex((l) => {
          const lLower = l.toLowerCase();
          return text.includes(lLower) || lLower.includes(text);
        });
        if (matchIndex !== -1) {
          isolateIndicator(matchIndex);
          panel
            .querySelectorAll('.cmci-indicator-card')
            .forEach((c) => c.classList.remove('card-selected'));
          card.classList.add('card-selected');
        }
      });
    });
  }
}

/**
 * Create CMCI Overview Chart
 */
function createCMCIOverviewChart() {
  if (typeof document === 'undefined') return;
  const ctx = document.getElementById('cmciOverviewChart');
  if (!ctx || charts.cmciOverview) return;

  const theme = getChartThemeColors();
  const labels = cmciData.keyIndicators.labels;

  charts.cmciOverview = new Chart(ctx, {
    type: 'line',
    data: {
      labels: cmciData.years,
      datasets: labels.map((label, i) => ({
        label: label,
        data: cmciData.keyIndicators.data[i],
        borderColor: CMCI_PALETTE[i % CMCI_PALETTE.length],
        backgroundColor: CMCI_PALETTE[i % CMCI_PALETTE.length] + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1500, easing: 'easeOutQuart' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          padding: 12,
          cornerRadius: 8,
          callbacks: {
            label: (ctx) =>
              ctx.raw !== null
                ? `${ctx.dataset.label}: ${ctx.raw.toFixed(4)}`
                : `${ctx.dataset.label}: N/A`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 11 }, color: theme.textMuted } },
        y: {
          beginAtZero: true,
          grid: { color: theme.gridColor },
          ticks: { font: { size: 11 }, color: theme.textMuted },
        },
      },
    },
  });

  setupInteractiveBottomLegend(charts.cmciOverview, 'cmciOverviewChart', labels, CMCI_PALETTE);
}

/**
 * Create CMCI Pillar Chart
 */
function createCMCIPillarChart(pillarKey, canvasId) {
  if (typeof document === 'undefined') return;
  const ctx = document.getElementById(canvasId);
  if (!ctx || charts[canvasId]) return;

  const theme = getChartThemeColors();
  const pillarData = cmciData.pillars[pillarKey];
  if (!pillarData) return;

  charts[canvasId] = new Chart(ctx, {
    type: 'line',
    data: {
      labels: cmciData.years,
      datasets: pillarData.labels.map((label, i) => ({
        label: label,
        data: pillarData.data[i],
        borderColor: CMCI_PALETTE[i % CMCI_PALETTE.length],
        backgroundColor: CMCI_PALETTE[i % CMCI_PALETTE.length] + '20',
        fill: false,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointHitRadius: 8,
        borderWidth: 2,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 1200, easing: 'easeOutQuart' },
      interaction: { intersect: false, mode: 'index' },
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          backgroundColor: theme.tooltipBg,
          padding: 10,
          cornerRadius: 6,
          callbacks: {
            label: (ctx) =>
              ctx.raw !== null
                ? `${ctx.dataset.label}: ${ctx.raw.toFixed(4)}`
                : `${ctx.dataset.label}: N/A`,
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: theme.textMuted } },
        y: {
          beginAtZero: true,
          grid: { color: theme.gridColor },
          ticks: { font: { size: 10 }, color: theme.textMuted },
        },
      },
    },
  });

  setupInteractiveBottomLegend(charts[canvasId], canvasId, pillarData.labels, CMCI_PALETTE);
}

/**
 * Initialize CMCI Tab Navigation
 */
function initCMCITabs() {
  const tabs = document.querySelectorAll('.cmci-tab');
  const panels = document.querySelectorAll('.cmci-panel');

  if (!tabs.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const pillar = tab.dataset.pillar;

      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Update active panel
      panels.forEach((p) => p.classList.remove('active'));
      const activePanel = document.getElementById(`panel-${pillar}`);
      if (activePanel) {
        activePanel.classList.add('active');

        // Create chart for this panel if needed
        if (pillar === 'overview') {
          createCMCIOverviewChart();
        } else if (pillar === 'economic-dynamism') {
          createCMCIPillarChart('economicDynamism', 'cmciEconomicChart');
        } else if (pillar === 'government-efficiency') {
          createCMCIPillarChart('governmentEfficiency', 'cmciGovernmentChart');
        } else if (pillar === 'infrastructure') {
          createCMCIPillarChart('infrastructure', 'cmciInfraChart');
        } else if (pillar === 'resiliency') {
          createCMCIPillarChart('resiliency', 'cmciResiliencyChart');
        } else if (pillar === 'innovation') {
          createCMCIPillarChart('innovation', 'cmciInnovationChart');
        }

        // Animate indicator bars
        animateCMCIBars(activePanel);
      }
    });
  });
}

/**
 * Animate CMCI indicator bars
 */
function animateCMCIBars(container) {
  container.querySelectorAll('.indicator-fill').forEach((bar) => {
    const value = bar.dataset.value;
    if (value) {
      setTimeout(() => {
        bar.style.setProperty('--fill-width', value + '%');
        bar.classList.add('animated');
      }, 100);
    }
  });
}

/**
 * Initialize CMCI Section
 */
function initCMCISection() {
  const cmciSection = document.getElementById('competitive-index');
  if (!cmciSection) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          initCMCITabs();
          createCMCIOverviewChart();
          animateCMCIBars(document.getElementById('panel-overview'));
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1 }
  );

  observer.observe(cmciSection);
}

/**
 * Load Fiscal Transparency Data (SSOT) & 5-Year SRE Series (2021-2025)
 */
let FISCAL_SERIES_DATA = null;

function renderTrendBadge(
  elementId,
  currentVal,
  prevVal,
  isPercentagePts = false,
  prevYearLabel = ''
) {
  const el = document.getElementById(elementId);
  if (!el) return;

  if (prevVal === undefined || prevVal === null || prevVal === 0) {
    el.className = 'finance-trend-badge badge-neutral';
    el.innerHTML = `<i class="bi bi-dash"></i> Base Year (${prevYearLabel ? '20' + prevYearLabel : '2021'})`;
    return;
  }

  if (isPercentagePts) {
    const diff = currentVal - prevVal;
    const sign = diff >= 0 ? '+' : '';
    const badgeClass =
      Math.abs(diff) < 0.05 ? 'badge-neutral' : diff > 0 ? 'badge-up' : 'badge-down';
    const icon = diff >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
    el.className = `finance-trend-badge ${badgeClass}`;
    el.innerHTML = `<i class="bi ${icon}"></i> ${sign}${diff.toFixed(2)}% vs FY${prevYearLabel}`;
  } else {
    const pctChange = ((currentVal - prevVal) / prevVal) * 100;
    const sign = pctChange >= 0 ? '+' : '';
    const badgeClass = pctChange >= 0 ? 'badge-up' : 'badge-down';
    const icon = pctChange >= 0 ? 'bi-arrow-up-right' : 'bi-arrow-down-right';
    el.className = `finance-trend-badge ${badgeClass}`;
    el.innerHTML = `<i class="bi ${icon}"></i> ${sign}${pctChange.toFixed(2)}% vs FY${prevYearLabel}`;
  }
}

function updateFinanceDisplay(annual) {
  if (!annual) return;

  // Update Annual Income
  const annualValEl = document.getElementById('finance-annual-income-value');
  const annualDetailEl = document.getElementById('finance-annual-income-detail');
  if (annualValEl && annual.annual_income?.formatted_short) {
    annualValEl.textContent = annual.annual_income.formatted_short;
  }
  if (annualDetailEl && annual.annual_income?.formatted_full) {
    annualDetailEl.textContent = annual.annual_income.formatted_full;
  }

  // Update IRA Share
  const iraValEl = document.getElementById('finance-ira-share-value');
  const iraDetailEl = document.getElementById('finance-ira-share-detail');
  if (iraValEl && annual.ira_share?.formatted_short) {
    iraValEl.textContent = annual.ira_share.formatted_short;
  }
  if (iraDetailEl && annual.ira_share?.label) {
    iraDetailEl.textContent = annual.ira_share.label;
  }

  // Update IRA Dependency
  const iraDepValEl = document.getElementById('finance-ira-dependency-value');
  if (iraDepValEl && annual.ira_dependency_rate !== undefined) {
    iraDepValEl.textContent = `${annual.ira_dependency_rate}%`;
  }

  // Update YoY Trend Badges
  const year = annual.year || parseInt(annual.source_dataset, 10) || 2025;
  const prevYear = year - 1;
  const prevData = FISCAL_SERIES_DATA ? FISCAL_SERIES_DATA[String(prevYear)] : null;
  const prevYearShort = String(prevYear).slice(-2);

  renderTrendBadge(
    'finance-annual-income-trend',
    annual.annual_income?.exact_amount,
    prevData?.annual_income?.exact_amount,
    false,
    prevYearShort
  );

  renderTrendBadge(
    'finance-ira-share-trend',
    annual.ira_share?.exact_amount,
    prevData?.ira_share?.exact_amount,
    false,
    prevYearShort
  );

  renderTrendBadge(
    'finance-ira-dependency-trend',
    annual.ira_dependency_rate,
    prevData?.ira_dependency_rate,
    true,
    prevYearShort
  );

  // Update Breakdown bars and labels
  const iraBar = document.getElementById('finance-breakdown-ira');
  const localBar = document.getElementById('finance-breakdown-local');
  const iraLabel = document.getElementById('finance-breakdown-ira-label');
  const localLabel = document.getElementById('finance-breakdown-local-label');

  if (iraBar && annual.ira_dependency_rate !== undefined) {
    iraBar.dataset.width = annual.ira_dependency_rate;
    iraBar.style.width = `${annual.ira_dependency_rate}%`;
    if (iraLabel) {
      iraLabel.textContent = `IRA ${annual.ira_dependency_rate}%`;
    }
  }

  if (localBar && annual.local_sources_share?.percentage !== undefined) {
    localBar.dataset.width = annual.local_sources_share.percentage;
    localBar.style.width = `${annual.local_sources_share.percentage}%`;
    if (localLabel) {
      localLabel.textContent = `Local ${annual.local_sources_share.percentage}%`;
    }
  }

  // Update source dataset tag
  const sourceDatasetEl = document.getElementById('finance-source-dataset');
  if (sourceDatasetEl && annual.source_dataset) {
    sourceDatasetEl.textContent = annual.source_dataset;
  }
}

async function loadFiscalData() {
  const financeSection = document.getElementById('stats-finance-section');
  if (!financeSection) return;

  try {
    const basePath = window.location.pathname.includes('/statistics') ? '../' : './';
    const response = await fetch(`${basePath}data/fiscal-transparency.json`);
    if (!response.ok) return;

    const data = await response.json();
    FISCAL_SERIES_DATA = data.annual_income_series || null;

    const yearSelect = document.getElementById('finance-year-select');
    if (yearSelect && FISCAL_SERIES_DATA) {
      yearSelect.addEventListener('change', function () {
        const selectedYear = this.value;
        if (FISCAL_SERIES_DATA[selectedYear]) {
          updateFinanceDisplay(FISCAL_SERIES_DATA[selectedYear]);
        }
      });
    }

    const initialData =
      (FISCAL_SERIES_DATA && FISCAL_SERIES_DATA['2025']) || data.annual_income_summary || null;

    if (initialData) {
      updateFinanceDisplay(initialData);
    }
  } catch (error) {
    console.warn('Could not load fiscal data dynamically, using fallback markup:', error);
  }
}

function initAllStatistics() {
  initScrollAnimations();
  initCharts();
  initPovertyControls();
  loadBarangayData();
  initBarangaySearch();
  initCMCISection();
  loadFiscalData();

  // Listen to universal theme changes dispatched from main.js
  if (typeof document !== 'undefined') {
    document.addEventListener('themechange', updateAllChartsTheme);
  }
}

// Initialize on DOM ready or immediately if already loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAllStatistics);
  } else {
    initAllStatistics();
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    barangayData,
    historicalData,
    povertyAlbayData,
    cmciData,
    COLORS,
    DOUGHNUT_COLORS,
    animateCount,
    createPovertyChart,
    renderBarangayList,
    loadBarangayData,
    loadFiscalData,
  };
}
