/**
 * Statistics Page - Chart.js Implementation
 * Better Legazpi Portal
 */

// Site branding color palette for charts
const CHART_COLORS = {
  primary: '#0032a0',
  primaryDark: '#002170',
  accent: '#F77F00',
  success: '#06A77D',
  danger: '#D62828',
  info: '#0077BE',
  secondary: '#003D82',
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

/**
 * Get chart color palette matching site branding
 * @param {number} count - Number of colors needed
 * @returns {Array} Array of color strings
 */
function getChartColors(count) {
  if (count <= 10) {
    return DOUGHNUT_COLORS.slice(0, count);
  }
  const colors = [];
  for (let i = 0; i < count; i++) {
    colors.push(DOUGHNUT_COLORS[i % DOUGHNUT_COLORS.length]);
  }
  return colors;
}

// Barangay population data (2024 Census) - Source: PSA, July 1, 2024
const barangayData = [
  {
    "code": "050506070",
    "psgc10DigitCode": "0500506070",
    "name": "Bgy. 56 - Taysan",
    "official_psgc_name": "Bgy. 56 - Taysan",
    "barangay_number": 56,
    "population": 20017,
    "percentage": 9.5,
    "urban_rural": "Urban",
    "rank": 1
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
    "rank": 2
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
    "rank": 3
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
    "rank": 4
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
    "rank": 5
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
    "rank": 6
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
    "rank": 7
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
    "rank": 8
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
    "rank": 9
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
    "rank": 10
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
    "rank": 11
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
    "rank": 12
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
    "rank": 13
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
    "rank": 14
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
    "rank": 15
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
    "rank": 16
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
    "rank": 17
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
    "rank": 18
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
    "rank": 19
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
    "rank": 20
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
    "rank": 21
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
    "rank": 22
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
    "rank": 23
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
    "rank": 24
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
    "rank": 25
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
    "rank": 26
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
    "rank": 27
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
    "rank": 28
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
    "rank": 29
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
    "rank": 30
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
    "rank": 31
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
    "rank": 32
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
    "rank": 33
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
    "rank": 34
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
    "rank": 35
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
    "rank": 36
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
    "rank": 37
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
    "rank": 38
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
    "rank": 39
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
    "rank": 40
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
    "rank": 41
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
    "rank": 42
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
    "rank": 43
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
    "rank": 44
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
    "rank": 45
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
    "rank": 46
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
    "rank": 47
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
    "rank": 48
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
    "rank": 49
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
    "rank": 50
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
    "rank": 51
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
    "rank": 52
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
    "rank": 53
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
    "rank": 54
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
    "rank": 55
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
    "rank": 56
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
    "rank": 57
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
    "rank": 58
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
    "rank": 59
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
    "rank": 60
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
    "rank": 61
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
    "rank": 62
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
    "rank": 63
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
    "rank": 64
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
    "rank": 65
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
    "rank": 66
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
    "rank": 67
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
    "rank": 68
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
    "rank": 69
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
    "rank": 70
  }
];

// Historical population data (Census years - Official PSA)
const historicalData = {
  years: [1990, 1995, 2000, 2007, 2010, 2015, 2020, 2024],
  populations: [121116, 141657, 157010, 179481, 182201, 196639, 209533, 210616],
};

// Economic indicators data
const economicData = {
  registeredBusinesses: 1200,
  agriculturalLand: 8500, // hectares
  incomeClass: '1st Class',
  landArea: 161.6, // km²
};

// Chart instances storage
let chartInstances = {};

/**
 * Create historical population line chart
 * @param {string} canvasId - Canvas element ID
 * @returns {Chart} Chart.js instance
 */
function createHistoricalLineChart(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  const points = historicalData.years.map((year, index) => ({
    x: year,
    y: historicalData.populations[index],
  }));

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      datasets: [
        {
          label: 'Population',
          data: points,
          borderColor: CHART_COLORS.primary,
          backgroundColor: 'rgba(0, 50, 160, 0.1)',
          fill: true,
          tension: 0.3,
          pointBackgroundColor: CHART_COLORS.primary,
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: function (items) {
              return items.length ? `Census Year: ${items[0].raw.x}` : '';
            },
            label: function (context) {
              return `Population: ${context.raw.y.toLocaleString()}`;
            },
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
            callback: function (val) {
              return val.toString();
            },
          },
        },
        y: {
          min: 120000,
          max: 220000,
          ticks: {
            stepSize: 20000,
            callback: function (value) {
              return value.toLocaleString();
            },
          },
        },
      },
    },
  });

  chartInstances[canvasId] = chart;
  return chart;
}

/**
 * Create population distribution pie chart
 * @param {string} canvasId - Canvas element ID
 * @returns {Chart} Chart.js instance
 */
function createDistributionPieChart(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx) {
    console.error(`Canvas element ${canvasId} not found`);
    return null;
  }

  // Get top 10 barangays by population
  const top10 = [...barangayData].sort((a, b) => b.population - a.population).slice(0, 10);
  const totalPopulation = 210616;

  const chart = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: top10.map((d) => d.name),
      datasets: [
        {
          data: top10.map((d) => d.population),
          backgroundColor: DOUGHNUT_COLORS,
          borderColor: '#fff',
          borderWidth: 2,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: {
            boxWidth: 12,
            padding: 10,
          },
        },
        tooltip: {
          callbacks: {
            label: function (context) {
              const percentage = ((context.raw / totalPopulation) * 100).toFixed(2);
              return `${context.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
            },
          },
        },
      },
    },
  });

  chartInstances[canvasId] = chart;
  return chart;
}

/**
 * Show loading indicator for a chart container
 * @param {string} containerId - Container element ID
 */
function showChartLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.add('chart-loading');
  }
}

/**
 * Hide loading indicator for a chart container
 * @param {string} containerId - Container element ID
 */
function hideChartLoading(containerId) {
  const container = document.getElementById(containerId);
  if (container) {
    container.classList.remove('chart-loading');
  }
}

/**
 * Initialize all charts on the statistics page
 */
function initializeCharts() {
  // Historical Population chart
  if (document.getElementById('historicalLineChart')) {
    showChartLoading('historicalChartContainer');
    createHistoricalLineChart('historicalLineChart');
    hideChartLoading('historicalChartContainer');
  }

  // Population Distribution chart
  if (document.getElementById('distributionPieChart')) {
    showChartLoading('distributionChartContainer');
    createDistributionPieChart('distributionPieChart');
    hideChartLoading('distributionChartContainer');
  }
}

// Initialize charts when DOM is ready
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', initializeCharts);
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    getChartColors,
    DOUGHNUT_COLORS,
    barangayData,
    historicalData,
    economicData,
    createHistoricalLineChart,
    createDistributionPieChart,
    initializeCharts,
    CHART_COLORS,
  };
}
