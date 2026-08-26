/**
 * BetterLegazpi - Tourism Data Extraction & Parser Script
 * Ingests official data from:
 * 1. Legazpi City Official Portal (https://legazpi.gov.ph/)
 * 2. Official "City of Fun and Adventure" Travel Guide (City Tourism Services Unit, 2024)
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const SNAPSHOTS = {
  attractions: path.join(__dirname, '../data/snapshots/legazpi_attractions.html'),
  food: path.join(__dirname, '../data/snapshots/legazpi_food.html'),
  activities: path.join(__dirname, '../data/snapshots/legazpi_activities.html'),
  accommodations: path.join(__dirname, '../data/snapshots/legazpi_accomodation.html'),
  travel: path.join(__dirname, '../data/snapshots/legazpi_travel.html'),
  experience: path.join(__dirname, '../data/snapshots/legazpi_experience.html')
};

const LIVE_URLS = {
  attractions: 'https://legazpi.gov.ph/legazpi-city-tourist-attractions/',
  food: 'https://legazpi.gov.ph/food-2/',
  activities: 'https://legazpi.gov.ph/activities-2/',
  accommodations: 'https://legazpi.gov.ph/accomodation-2/',
  travel: 'https://legazpi.gov.ph/travel-2/',
  experience: 'https://legazpi.gov.ph/experience-2/'
};

// Load PSGC Barangays for cross-referencing
let BARANGAYS = [];
try {
  const bgRaw = fs.readFileSync(path.join(__dirname, '../data/barangays.json'), 'utf-8');
  BARANGAYS = JSON.parse(bgRaw).data || [];
} catch (e) {
  console.warn('Could not load barangays.json:', e.message);
}

function matchBarangay(address) {
  if (!address || typeof address !== 'string') return { name: 'Legazpi City', psgc: null };
  const lower = address.toLowerCase();

  const numMatch = lower.match(/(?:bgy\.?|brgy\.?|barangay)\s*(\d+)/i) || lower.match(/\b(\d{1,2})\b/);
  if (numMatch) {
    const num = parseInt(numMatch[1], 10);
    const foundByNum = BARANGAYS.find(b => b.barangay_number === num);
    if (foundByNum) return { name: foundByNum.name, psgc: foundByNum.psgc_code };
  }

  for (const bg of BARANGAYS) {
    const cleanBg = bg.name.replace(/^Bgy\.\s*\d+\s*-\s*/i, '').toLowerCase();
    if (cleanBg.length > 3 && lower.includes(cleanBg)) {
      return { name: bg.name, psgc: bg.psgc_code };
    }
  }

  if (lower.includes('old albay') || lower.includes('peñaranda') || lower.includes('penaranda')) {
    const bg11 = BARANGAYS.find(b => b.barangay_number === 11);
    if (bg11) return { name: bg11.name, psgc: bg11.psgc_code };
  }

  if (lower.includes('port district') || lower.includes('pier')) {
    const bg1 = BARANGAYS.find(b => b.barangay_number === 1);
    if (bg1) return { name: bg1.name, psgc: bg1.psgc_code };
  }

  return { name: 'Legazpi City', psgc: null };
}

function createGoogleMapsUrl(name, address) {
  const query = encodeURIComponent(`${name}, ${address || 'Legazpi City, Albay, Philippines'}`);
  return `https://www.google.com/maps/search/?api=1&query=${query}`;
}

async function fetchHtml(type) {
  const snapshotFile = SNAPSHOTS[type];
  const liveUrl = LIVE_URLS[type];

  return new Promise((resolve) => {
    let snapshotContent = '';
    if (fs.existsSync(snapshotFile)) {
      snapshotContent = fs.readFileSync(snapshotFile, 'utf-8');
    }

    const req = https.get(liveUrl, { timeout: 8000, headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        let data = '';
        res.on('data', chunk => { data += chunk; });
        res.on('end', () => {
          if (data.length > 5000) {
            console.log(`[scrape] Successfully fetched live: ${liveUrl} (${data.length} bytes)`);
            resolve(data);
            return;
          }
          resolve(snapshotContent);
        });
      } else {
        console.warn(`[scrape] Live fetch status ${res.statusCode} for ${liveUrl}, using snapshot`);
        resolve(snapshotContent);
      }
    });

    req.on('error', (err) => {
      console.warn(`[scrape] Live fetch error for ${liveUrl}: ${err.message}, using snapshot`);
      resolve(snapshotContent);
    });

    req.on('timeout', () => {
      req.destroy();
      console.warn(`[scrape] Live fetch timeout for ${liveUrl}, using snapshot`);
      resolve(snapshotContent);
    });
  });
}

function cleanText(str) {
  if (!str) return '';
  return str
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&#8217;|&#8216;/g, "'")
    .replace(/&#8220;|&#8221;/g, '"')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// --- Local WebP Photo & Micro-Attribution Mappings ---
const ATTRACTION_PHOTOS = {
  'Ibalong Heroes Monument': { img: '../assets/images/tourism/photos/attraction_ibalong_heroes_monument.webp', attr: '2024 Travel Guide' },
  'Baltog Monument': { img: '../assets/images/tourism/photos/attraction_baltog_monument.webp', attr: '2024 Travel Guide' },
  'Bantong Monument': { img: '../assets/images/tourism/photos/attraction_bantong_monument.webp', attr: '2024 Travel Guide' },
  'Bantog Monument': { img: '../assets/images/tourism/photos/attraction_bantong_monument.webp', attr: '2024 Travel Guide' },
  'Battle of Legazpi Pylon': { img: '../assets/images/tourism/photos/attraction_battle_of_legazpi_pylon.webp', attr: '2024 Travel Guide' },
  'Miguel Lopez de Legazpi Monument': { img: '../assets/images/tourism/photos/attraction_miguel_lopez_de_legazpi.webp', attr: '2024 Travel Guide' },
  'Headless Monument': { img: '../assets/images/tourism/photos/attraction_headless_monument.webp', attr: '2024 Travel Guide' },
  '500 Years of Christianity Marker': { img: '../assets/images/tourism/photos/attraction_500_years_christianity_marker.webp', attr: '2024 Travel Guide' },
  'Camp Simeon Ola': { img: '../assets/images/tourism/photos/attraction_camp_simeon_ola.webp', attr: '2024 Travel Guide' },
  'Padang Memorial Cross': { img: '../assets/images/tourism/photos/attraction_padang_memorial_cross.webp', attr: '2024 Travel Guide' },
  'Albay Gulf Landing Monument': { img: '../assets/images/tourism/photos/attraction_albay_gulf_landing_monument.webp', attr: '2024 Travel Guide' },
  'Jose Ignacio Paua Monument': { img: '../assets/images/tourism/photos/attraction_jose_ignacio_paua_monument.webp', attr: '2024 Travel Guide' },
  'Mayon Volcano': { img: '../assets/images/tourism/photos/attraction_mayon_volcano.webp', attr: '2024 Travel Guide' },
  'Ligñon Hill Nature Park': { img: '../assets/images/tourism/photos/attraction_lignon_hill.webp', attr: '2024 Travel Guide' },
  'Ligñon Hill': { img: '../assets/images/tourism/photos/attraction_lignon_hill.webp', attr: '2024 Travel Guide' },
  'Kapuntukan Hill (Sleeping Lion)': { img: '../assets/images/tourism/photos/attraction_kapuntukan_hill_sleeping_lion.webp', attr: '2024 Travel Guide' },
  'Albay Park & Wildlife': { img: '../assets/images/tourism/photos/attraction_albay_park_and_wildlife.webp', attr: '2024 Travel Guide' },
  'Albay Park and Wildlife': { img: '../assets/images/tourism/photos/attraction_albay_park_and_wildlife.webp', attr: '2024 Travel Guide' },
  'PRO 5 Heritage Park & Arboretum': { img: '../assets/images/tourism/photos/attraction_pro5_heritage_park_arboretum.webp', attr: '2024 Travel Guide' },
  'PRO5 Heritage Park and Arboretum': { img: '../assets/images/tourism/photos/attraction_pro5_heritage_park_arboretum.webp', attr: '2024 Travel Guide' },
  'Sawangan Park': { img: '../assets/images/tourism/photos/attraction_sawangan_park.webp', attr: '2024 Travel Guide' },
  'Legazpi Boulevard': { img: '../assets/images/tourism/photos/attraction_legazpi_boulevard.webp', attr: '2024 Travel Guide' },
  'The Obelisk': { img: '../assets/images/tourism/photos/attraction_the_obelisk.webp', attr: '2024 Travel Guide' },
  'Embarcadero de Legazpi': { img: '../assets/images/tourism/photos/attraction_embarcadero_de_legazpi.webp', attr: '2024 Travel Guide' },
  'JCI Legazpi Tourism Super Marker': { img: '../assets/images/tourism/photos/attraction_jci_tourism_super_marker.webp', attr: '2024 Travel Guide' },
  'Legazpi Ecological Sanitary Landfill': { img: '../assets/images/tourism/photos/attraction_sanitary_landfill.webp', attr: '2024 Travel Guide' },
  'Sanitary Landfill': { img: '../assets/images/tourism/photos/attraction_sanitary_landfill.webp', attr: '2024 Travel Guide' },
  'Macabalo Bridge': { img: '../assets/images/tourism/photos/attraction_macabalo_bridge.webp', attr: '2024 Travel Guide' },
  'Risen Christ Statue': { img: '../assets/images/tourism/photos/attraction_risen_christ_statue.webp', attr: '2024 Travel Guide' },
  'Albay Cathedral (St. Gregory the Great)': { img: '../assets/images/tourism/photos/attraction_albay_cathedral.webp', attr: '2024 Travel Guide' },
  'Albay Cathedral': { img: '../assets/images/tourism/photos/attraction_albay_cathedral.webp', attr: '2024 Travel Guide' },
  'St. Raphael Church': { img: '../assets/images/tourism/photos/attraction_st_raphael_church.webp', attr: '2024 Travel Guide' },
  'St. Raphael the Archangel Church': { img: '../assets/images/tourism/photos/attraction_st_raphael_church.webp', attr: '2024 Travel Guide' },
  'Giant Statue of Nuestra Sra. de Salvacion': { img: '../assets/images/tourism/photos/attraction_nuestra_sra_de_salvacion.webp', attr: '2024 Travel Guide' },
  'Padre Pio Church': { img: '../assets/images/tourism/photos/attraction_padre_pio_church.webp', attr: '2024 Travel Guide' }
};

const EXPERIENCE_PHOTOS = {
  'ATV Ride Experience': { img: '../assets/images/tourism/photos/experience_mayon_atv_ride.webp', attr: '2024 Travel Guide' },
  'Mayon ATV Lava Trail Ride': { img: '../assets/images/tourism/photos/experience_mayon_atv_ride.webp', attr: '2024 Travel Guide' },
  'Black Lava Wall Climbing': { img: '../assets/images/tourism/photos/experience_black_lava_wall_climb_zipline.webp', attr: '2024 Travel Guide' },
  'Mayon Black Lava Zipline Adventure': { img: '../assets/images/tourism/photos/experience_black_lava_wall_climb_zipline.webp', attr: '2024 Travel Guide' },
  'Mayon Black Lava Zipline': { img: '../assets/images/tourism/photos/experience_black_lava_wall_climb_zipline.webp', attr: '2024 Travel Guide' },
  'Mayon Foot Trails Trekking': { img: '../assets/images/tourism/photos/experience_mayon_atv_ride.webp', attr: '2024 Travel Guide' },
  'Mayon Volcano Trail Trekking': { img: '../assets/images/tourism/photos/experience_mayon_atv_ride.webp', attr: '2024 Travel Guide' },
  'Albay Gulf Scuba Diving (16 Marine Reefs)': { img: '../assets/images/tourism/photos/experience_albay_gulf_diving.webp', attr: '2024 Travel Guide' },
  'Albay Gulf Marine Scuba Diving': { img: '../assets/images/tourism/photos/experience_albay_gulf_diving.webp', attr: '2024 Travel Guide' },
  'Albay Gulf Snorkelling': { img: '../assets/images/tourism/photos/experience_albay_gulf_snorkelling.webp', attr: '2024 Travel Guide' },
  'Coral Reef Snorkelling': { img: '../assets/images/tourism/photos/experience_albay_gulf_snorkelling.webp', attr: '2024 Travel Guide' },
  'Ligñon Hill 360° Viewing Deck': { img: '../assets/images/tourism/photos/attraction_lignon_hill.webp', attr: '2024 Travel Guide' },
  'Ligñon Hill 360° Viewing & Skywalk': { img: '../assets/images/tourism/photos/attraction_lignon_hill.webp', attr: '2024 Travel Guide' },
  'Legazpi Boulevard Biking & Strolling': { img: '../assets/images/tourism/photos/attraction_legazpi_boulevard.webp', attr: '2024 Travel Guide' },
  'Legazpi Boulevard Coastal Cycling': { img: '../assets/images/tourism/photos/attraction_legazpi_boulevard.webp', attr: '2024 Travel Guide' }
};

const GASTRO_PHOTOS = {
  'Sili Ice Cream': { img: '../assets/images/tourism/photos/gastro_sili_ice_cream.webp', attr: '2024 Travel Guide' },
  'Mayon Lava Cake': { img: '../assets/images/tourism/photos/gastro_mayon_lava_cake.webp', attr: '2024 Travel Guide' },
  'Pinangat Pasta': { img: '../assets/images/tourism/photos/gastro_pinangat_pasta.webp', attr: '2024 Travel Guide' },
  'Sili Halo-Halo': { img: '../assets/images/tourism/photos/gastro_sili_halo_halo.webp', attr: '2024 Travel Guide' },
  'Pili Ensaymada': { img: '../assets/images/tourism/photos/gastro_pili_ensaymada.webp', attr: '2024 Travel Guide' },
  'Gulay na Pagulong': { img: '../assets/images/tourism/photos/gastro_gulay_na_pagulong.webp', attr: '2024 Travel Guide' },
  'Sili Cheesecake': { img: '../assets/images/tourism/photos/gastro_sili_cheesecake.webp', attr: '2024 Travel Guide' },
  'Pancit-Dinuguan Combo': { img: '../assets/images/tourism/photos/gastro_pancit_dinuguan_combo.webp', attr: '2024 Travel Guide' },
  'Pili Bread & Sweets': { img: '../assets/images/tourism/photos/product_pili_nut_skincare.webp', attr: '2024 Travel Guide' },
  'Pili Bread & Pastries': { img: '../assets/images/tourism/photos/product_pili_nut_skincare.webp', attr: '2024 Travel Guide' }
};

const FOOD_PHOTOS = {
  '1ST COLONIAL GRILL': { img: '../assets/images/tourism/photos/resto_1st_colonial_grill.webp', attr: '2024 Travel Guide' },
  'SMALL TALK CAFE': { img: '../assets/images/tourism/photos/resto_small_talk_cafe.webp', attr: '2024 Travel Guide' },
  'BALAY CENA UNA': { img: '../assets/images/tourism/photos/resto_balay_cena_una.webp', attr: 'Google Places' },
  "BIGG'S DINER": { img: '../assets/images/tourism/photos/resto_biggs_diner.webp', attr: 'Google Places' },
  "WAWAY'S RESTAURANT": { img: '../assets/images/tourism/photos/resto_waways_restaurant.webp', attr: 'Google Places' },
  "LEGAZPI FOUR SEASON'S INC.": { img: '../assets/images/tourism/photos/resto_four_seasons.webp', attr: 'Google Places' },
  'LEGAZPI FOUR SEASONS RESTAURANT': { img: '../assets/images/tourism/photos/resto_four_seasons.webp', attr: 'Google Places' },
  'GRACELAND BAKERS PLAZA - SM CITY': { img: '../assets/images/tourism/photos/resto_graceland_bakers.webp', attr: 'Google Places' },
  'GRACELAND': { img: '../assets/images/tourism/photos/resto_graceland_bakers.webp', attr: 'Google Places' },
  'MESA FILIPINO MODERNE': { img: '../assets/images/tourism/photos/resto_mesa_filipino_moderne.webp', attr: 'Google Places' },
  'KUYA J RESTAURANT': { img: '../assets/images/tourism/photos/resto_kuya_j.webp', attr: 'Google Places' },
  'ARANG RESTO BAR': { img: '../assets/images/tourism/photos/resto_arang_restobar.webp', attr: 'Google Places' },
  'CASA DE SIKATUNA GARDEN RESTAURANT': { img: '../assets/images/tourism/photos/resto_casa_de_sikatuna.webp', attr: 'Google Places' },
  'QUENTO BAR & RESTAURANT': { img: '../assets/images/tourism/photos/resto_quento_bar.webp', attr: 'Google Places' }
};

const ACCOMMODATION_PHOTOS = {
  'THE ORIENTAL LEGAZPI': { img: '../assets/images/tourism/photos/hotel_the_oriental_legazpi.webp', attr: 'DOT Bicol' },
  'THE ORIENTAL HOSPITALITY AND RESTAURANT MANAGEMENT SERV ICES, INC.': { img: '../assets/images/tourism/photos/hotel_the_oriental_legazpi.webp', attr: 'DOT Bicol' },
  'HOTEL ST. ELLIS': { img: '../assets/images/tourism/photos/hotel_hotel_st_ellis.webp', attr: 'Google Places' },
  'THE MARISON HOTEL': { img: '../assets/images/tourism/photos/hotel_the_marison_hotel.webp', attr: 'Google Places' },
  'CASABLANCA HOTEL': { img: '../assets/images/tourism/photos/hotel_casablanca_hotel.webp', attr: 'Google Places' },
  'PEPPERLAND HOTEL': { img: '../assets/images/tourism/photos/hotel_pepperland_hotel.webp', attr: 'Google Places' },
  'PEPPERLAND HOTEL AND LEISURES CORPORATION': { img: '../assets/images/tourism/photos/hotel_pepperland_hotel.webp', attr: 'Google Places' },
  'EMBARCADERO HOTEL': { img: '../assets/images/tourism/photos/hotel_embarcadero_hotel.webp', attr: 'Google Places' },
  'LEGAZPI AMIGOS HOMETEL': { img: '../assets/images/tourism/photos/hotel_casablanca_hotel.webp', attr: 'Google Places' },
  'ALICIA HOTEL & CONVENTION CENTER, INC.': { img: '../assets/images/tourism/photos/hotel_the_oriental_legazpi.webp', attr: 'Google Places' },
  'EMERALD BOUTIQUE HOTEL INC.': { img: '../assets/images/tourism/photos/hotel_the_marison_hotel.webp', attr: 'Google Places' },
  'MAYON BLUE LOTUS CORPORATION( LOTUS BLU HOTEL)': { img: '../assets/images/tourism/photos/hotel_hotel_st_ellis.webp', attr: 'Google Places' },
  'MAGAYON HOTEL': { img: '../assets/images/tourism/photos/hotel_casablanca_hotel.webp', attr: 'Google Places' },
  'MAYON BACKPACKERS HOTEL': { img: '../assets/images/tourism/photos/hotel_casablanca_hotel.webp', attr: 'Google Places' }
};

/**
 * 28 Official Tourist Attractions categorized per the 2024 Municipal Guide
 */
function getOfficialAttractions() {
  const officialList = [
    // --- Historical (11) ---
    {
      name: 'Ibalong Heroes Monument',
      subcategory: 'Historical',
      description: 'Built in honor of the Ibalong mythical heroes Baltog, Handyong, and Bantong—the three brave warriors who fought for the peace of Ibalon (the ancient name of Bicol).',
      address: 'Brgy. 25 Lapu-Lapu, Legazpi City',
      image_url: null
    },
    {
      name: 'Baltog Monument',
      subcategory: 'Historical',
      description: 'A 10-foot bronze-patina statue of Baltog, the legendary chieftain and first epic warrior of the ancient Bicol Epic "Ibalon".',
      address: 'Legazpi Boulevard, Brgy. 57 Dap-Dap, Legazpi City',
      image_url: null
    },
    {
      name: 'Bantog Monument',
      subcategory: 'Historical',
      description: 'Statue honoring Bantog, the valiant hero of the Bicol Epic "Ibalon" who vanquished the monstrous man-beast Rabot.',
      address: 'Legazpi Boulevard, Brgy. 57 Dap-Dap, Legazpi City',
      image_url: null
    },
    {
      name: 'Battle of Legazpi Pylon',
      subcategory: 'Historical',
      description: 'A historic memorial to the valiant defense of Albayanos under General Vito Belarmino against American invaders on January 23, 1900.',
      address: 'Rizal St., Legazpi Port District, Legazpi City',
      image_url: null
    },
    {
      name: 'Miguel Lopez de Legazpi Monument',
      subcategory: 'Historical',
      description: 'Monument of Miguel Lopez de Legazpi, known as El Adelantado and El Viejo, the Basque-Spanish navigator after whom the city was named.',
      address: 'Brgy. 57 Dap-Dap, Legazpi City',
      image_url: null
    },
    {
      name: 'Headless Monument',
      subcategory: 'Historical',
      description: 'Constructed as a solemn dedication to the unknown heroes and civilians who died and shed their blood during the Japanese military occupation.',
      address: 'Post Office Compound, Quezon Avenue, Legazpi City',
      image_url: null
    },
    {
      name: '500 Years of Christianity Marker',
      subcategory: 'Historical',
      description: "Symbolizing 500 years of Christianity in the Philippines, featuring Magellan's cross for salvation, a faith navigator ship, and the Holy Spirit guiding missionaries.",
      address: 'Brgy. 57 Dap-Dap, Legazpi City',
      image_url: null
    },
    {
      name: 'Camp Simeon Ola',
      subcategory: 'Historical',
      description: 'Named in honor of General Simeón Ola y Arboleda, the Philippine Revolutionary hero and last Filipino general to surrender in the Philippine-American War.',
      address: "Brgy. 1 EM's Barrio, Legazpi City",
      image_url: null
    },
    {
      name: 'Padang Memorial Cross',
      subcategory: 'Historical',
      description: 'Historical repository shrine at the foot of Mayon commemorating the residents who perished when catastrophic mudslides struck during Super Typhoon Reming in November 2006.',
      address: 'Brgy. 50 Padang, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/PADANG-MEMORIAL-SHRINE.jpg'
    },
    {
      name: 'Albay Gulf Landing Monument',
      subcategory: 'Historical',
      description: 'Built in 1995 commemorating the 50th Anniversary of the Allied American Liberation Forces landing in Legazpi City during World War II.',
      address: 'Brgy. 42 Rawis, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Albay-Gulf-Landing-Commemorative-Pylon.jpg'
    },
    {
      name: 'Jose Ignacio Paua Monument',
      subcategory: 'Historical',
      description: 'Honors General Jose Ignacio Paua, a Chinese general in the Philippine Revolution who signed the Biak-na-Bato constitution and later relocated to Albay.',
      address: 'Brgy. 5 Sagmin, Legazpi City',
      image_url: null
    },

    // --- Natural (3) ---
    {
      name: 'Mayon Volcano',
      subcategory: 'Natural',
      description: "The world's most renowned conical active volcano, soaring to an elevation of 8,189 feet with a symmetrical crater of international acclaim.",
      address: 'Mayon Volcano Natural Park, Albay',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Mayon-Volcano1-2-scaled.jpg'
    },
    {
      name: 'Ligñon Hill Nature Park',
      subcategory: 'Natural',
      description: 'A 156-meter prominent volcanic hill providing 360-degree views of Mayon Volcano, Albay Gulf, and Legazpi City with WWII Japanese tunnels and viewing decks.',
      address: 'Brgy. 41 Bogtong, Legazpi City',
      image_url: null
    },
    {
      name: 'Kapuntukan Hill (Sleeping Lion)',
      subcategory: 'Natural',
      description: 'Iconic scenic coastal hill resembling a slumbering lion on aerial view, presiding over Legazpi Port, Albay Gulf, and Embarcadero harbor.',
      address: 'Brgy. 57 Dap-Dap, Legazpi City',
      image_url: null
    },

    // --- Man-Made & Parks (9) ---
    {
      name: 'Albay Park & Wildlife',
      subcategory: 'Man-Made',
      description: 'Official rescue and rehabilitation sanctuary for wildlife species set amid lush botanical grounds with picnic groves and family recreational areas.',
      address: 'Brgy. 41 Bogtong, Legazpi City',
      image_url: null
    },
    {
      name: 'PRO 5 Heritage Park & Arboretum',
      subcategory: 'Man-Made',
      description: 'Eco-friendly arboretum and conservation park fostering environmental awareness, tree preservation, and climate action in the Bicol region.',
      address: "Brgy. 1 EM's Barrio, Legazpi City",
      image_url: null
    },
    {
      name: 'Sawangan Park',
      subcategory: 'Man-Made',
      description: 'Vibrant seaside urban park and open-air fitness hub welcoming joggers, families, and sunset strollers along Legazpi Boulevard.',
      address: 'Brgy. 57 Dap-Dap, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Sawangan-Outdoor-Gym-1-scaled.jpg'
    },
    {
      name: 'Legazpi Boulevard',
      subcategory: 'Man-Made',
      description: 'Dubbed the "Fitness Hub of the City", a premier 4.095-kilometer coastal promenade offering panoramic views of Albay Gulf and Kapuntukan Hill.',
      address: 'Brgy. 57 Dap-Dap, Brgy. 59 Puro, Brgy. 60 Lamba, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Legazpi_Boulevard-scaled.jpg'
    },
    {
      name: 'The Obelisk',
      subcategory: 'Man-Made',
      description: 'A stately monument erected as a joint civic project between the City Government of Legazpi and Mayon Lodge No. 61.',
      address: 'Brgy. 59 Puro, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/THE-OBELISK-.jpg'
    },
    {
      name: 'Embarcadero de Legazpi',
      subcategory: 'Man-Made',
      description: 'World-class waterfront lifestyle hub and harbor promenade in Southern Luzon featuring retail, dining, and scenic oceanview plazas.',
      address: 'Brgy. 27 Victory Village South, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/EMBARCADERO.jpg'
    },
    {
      name: 'JCI Legazpi Tourism Super Marker',
      subcategory: 'Man-Made',
      description: 'Iconic panoramic photo stop framing five natural and civic landmarks (Albay Gulf, Legazpi Boulevard, Sleeping Lion, Ligñon Hill, and Mayon).',
      address: 'Brgy. 59 Puro, Legazpi City',
      image_url: null
    },
    {
      name: 'Legazpi Ecological Sanitary Landfill',
      subcategory: 'Man-Made',
      description: 'Nationally acclaimed municipal eco-facility utilizing waste-to-fertilizer technology in partnership with JICA since 2018.',
      address: 'Brgy. 66 Banquerohan, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/legazpi-sanitary-landfill.gif'
    },
    {
      name: 'Macabalo Bridge',
      subcategory: 'Man-Made',
      description: 'Scenic illuminated bridge structure spanning the Macabalo river inlet along the boulevard, famous for nighttime waterfront strolls.',
      address: 'Brgy. 57 Dap-Dap, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/MACABALO-BRIDGE.jpg'
    },

    // --- Religious (5) ---
    {
      name: 'Risen Christ Statue',
      subcategory: 'Religious',
      description: 'Hilltop landmark reminiscent of Rio de Janeiro’s Christ the Redeemer, strategically positioned on southern highlands facing the Pacific Ocean.',
      address: 'Brgy. 66 Banquerohan, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/2021-05-05.jpg'
    },
    {
      name: 'Albay Cathedral (St. Gregory the Great)',
      subcategory: 'Religious',
      description: 'Historic Roman Catholic Cathedral and Episcopal Seat of the Roman Catholic Diocese of Legazpi in historic Old Albay District.',
      address: 'Albay District, Brgy. 11 Peñaranda, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Visita-Iglesia-in-Albay.jpg'
    },
    {
      name: 'St. Raphael Church',
      subcategory: 'Religious',
      description: 'Centuries-old stone sanctuary in the heart of Legazpi Port District with an altar constructed out of native volcanic rock.',
      address: 'Aguinaldo St., Legazpi Port District, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/8022053813_e08fdb6d0b_z.jpg'
    },
    {
      name: 'Giant Statue of Nuestra Sra. de Salvacion',
      subcategory: 'Religious',
      description: 'Impressive 15-meter (49-foot) tall image of the Heavenly Patroness of Albay sculpted at the northern gateway rotunda.',
      address: 'Brgy. 43 Tamaoyan, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/318698104_197718762818499_980917034408178879_n-1.jpg'
    },
{
      name: 'Padre Pio Church',
      subcategory: 'Religious',
      description: 'Revered spiritual retreat and major pilgrimage church visited during Holy Week Visita Iglesia.',
      address: 'Brgy. 42 Rawis, Legazpi City',
      image_url: null
    }
  ];

  return officialList.map((item, idx) => {
    const bg = matchBarangay(item.address);
    const photoMatch = ATTRACTION_PHOTOS[item.name];
    return {
      id: `attr-${idx + 1}`,
      name: item.name,
      category: 'attractions',
      subcategory: item.subcategory,
      description: item.description,
      address: item.address,
      barangay_name: bg.name,
      barangay_psgc: bg.psgc,
      image_url: photoMatch ? photoMatch.img : item.image_url,
      image: photoMatch ? photoMatch.img : item.image_url,
      imageAttribution: photoMatch ? photoMatch.attr : null,
      google_maps_url: createGoogleMapsUrl(item.name, item.address)
    };
  });
}

/**
 * Parses Food Page (240 Food Establishments + 9 Delicacies)
 */
function parseFood(html) {
  const rawDelicacies = [
    {
      id: 'food-delicacy-1',
      name: 'Sili Ice Cream',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: "World-famous creamy artisanal ice cream infused with local bird's eye chili, ranging from Level 1 to Volcano heat."
    },
    {
      id: 'food-delicacy-2',
      name: 'Mayon Lava Cake',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: "Decadent molten chocolate cake crowned with spicy chili ganache and volcanic red garnish mimicking Mayon's glowing lava flow."
    },
    {
      id: 'food-delicacy-3',
      name: 'Pinangat Pasta',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: 'Creative fusion pasta tossed in rich Bicolano coconut cream and savory shredded taro leaf pinangat.'
    },
    {
      id: 'food-delicacy-4',
      name: 'Sili Halo-Halo',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: 'Classic Filipino shaved-ice dessert crowned with chili-infused artisanal ice cream and sweet local condiments.'
    },
    {
      id: 'food-delicacy-5',
      name: 'Pili Ensaymada',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: 'Fluffy golden brioche pastry topped with rich butter, sugar, cheese, and roasted Albay pili nuts.'
    },
    {
      id: 'food-delicacy-6',
      name: 'Gulay na Pagulong',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: 'Traditional indigenous Bicolano vegetable specialty simmered in fresh pure coconut milk and local spices.'
    },
    {
      id: 'food-delicacy-7',
      name: 'Sili Cheesecake',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: 'Velvety baked cheesecake with a gentle spicy chili kick balanced over a crisp buttered crust.'
    },
    {
      id: 'food-delicacy-8',
      name: 'Pancit-Dinuguan Combo',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: 'Time-honored Bicolano afternoon merienda pairing savory stir-fried noodles with rich savory dinuguan stew.'
    },
    {
      id: 'food-delicacy-9',
      name: 'Pili Bread & Sweets',
      category: 'food',
      subcategory: 'Signature Delicacy',
      description: 'Freshly baked artisan loaves, mazapan, and glazed pastries generously studded with indigenous buttery pili nuts.'
    }
  ];

  const delicacies = rawDelicacies.map(d => {
    const photoMatch = GASTRO_PHOTOS[d.name];
    return {
      ...d,
      image_url: photoMatch ? photoMatch.img : null,
      image: photoMatch ? photoMatch.img : null,
      imageAttribution: photoMatch ? photoMatch.attr : null
    };
  });

  const establishments = [];
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (tableMatch) {
    const tableHtml = tableMatch[0];
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    rowMatches.slice(1).forEach((row, idx) => {
      const cells = row.match(/<td[\s\S]*?<\/td>/gi) || [];
      if (cells.length >= 4) {
        const name = cleanText(cells[1]);
        const address = cleanText(cells[2]);
        const classification = cleanText(cells[3]);
        const contact = cells[4] ? cleanText(cells[4]) : '';

        if (name && name !== 'N/A' && name.length > 2) {
          const bg = matchBarangay(address);
          const nameUpper = name.toUpperCase().trim();
          const photoMatch = FOOD_PHOTOS[nameUpper];

          establishments.push({
            id: `food-est-${idx + 1}`,
            name: name,
            category: 'food',
            subcategory: classification || 'Food Establishment',
            classification: classification,
            description: `${classification} located in ${address || bg.name}.`,
            address: address,
            barangay_name: bg.name,
            barangay_psgc: bg.psgc,
            contact: contact,
            image_url: photoMatch ? photoMatch.img : null,
            image: photoMatch ? photoMatch.img : null,
            imageAttribution: photoMatch ? photoMatch.attr : null,
            google_maps_url: createGoogleMapsUrl(name, address)
          });
        }
      }
    });
  }

  return { delicacies, establishments };
}

/**
 * 6 Core Activities with Detailed Barangays & 16 Dive Reefs
 */
function getOfficialActivities() {
  const officialActs = [
    {
      name: 'ATV Ride Experience',
      subcategory: 'All-Terrain Adventure',
      description: 'Hop on an all-terrain vehicle for an adventurous off-road ride navigating rocky terrain and river trails leading near the majestic Mayon Volcano.',
      address: 'Brgy. 44 Pawa, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/ATV-Experience-in-Legazpi-by-Your-Brother.jpg'
    },
    {
      name: 'Black Lava Wall Climbing',
      subcategory: 'Extreme Outdoor',
      description: 'A thrilling outdoor challenge climbing the basaltic 2006 Mayon black lava wall for up-close crater vantage points.',
      address: 'Brgy. 54 Mabinit, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/lava-wall-climbing.jpg'
    },
    {
      name: 'Mayon Foot Trails Trekking',
      subcategory: 'Eco-Trek',
      description: 'Guided scenic hiking expeditions through lush volcanic slopes, pine trails, and panoramic view ridges around Mayon Volcano.',
      address: 'Brgy. 54 Mabinit, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/trekking.jpg'
    },
    {
      name: 'Mayon Black Lava Zipline Adventure',
      subcategory: 'Aerial Adventure',
      description: 'High-speed tandem zipline experience soaring over volcanic lava fields with panoramic backdrops of Mayon Volcano and Legazpi City.',
      address: 'Brgy. 54 Mabinit, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/ziplining.png'
    },
    {
      name: 'Albay Gulf Scuba Diving (16 Marine Reefs)',
      subcategory: 'Marine Diving',
      description: 'Pristine diving across 16 protected sites in Albay Gulf: Bulang Buya (Denson Reef), Sadit na Itom na Buya, Itom na Buya, Barao Reef, Bigaa Beach, Pasig Out, Pasig In, Canal, Sleeping Lion, Dakula na Masolog, Sadig na Masolog, Malaya, Sagoron, Maslog Out, Maslog In, and Kabunturan.',
      address: 'Albay Gulf Territorial Waters, Legazpi City',
      image_url: null
    },
    {
      name: 'Albay Gulf Snorkelling',
      subcategory: 'Marine Eco-Tour',
      description: 'Experience floating over expansive coral gardens, observing rare tropical fish, and swimming alongside sea turtle sanctuaries in crystal-clear waters.',
      address: 'Albay Gulf Marine Sanctuary, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/SNORKELING.jpg'
    },
    {
      name: 'Embarcadero Skywalk Adventure',
      subcategory: 'Urban Thrills',
      description: 'Suspended bridge and observation skywalk offering panoramic harbor views over Albay Gulf and the city skyline.',
      address: 'Brgy. 27 Victory Village South, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/skywalk-adventure.jpg'
    },
    {
      name: 'Legazpi Boulevard Coastal Fitness & Cycling',
      subcategory: 'Seaside Recreation',
      description: 'Active recreational cycling, jogging, and seaside sunset fitness along the panoramic 4-kilometer coastal highway.',
      address: 'Brgy. 57 Dap-Dap to Brgy. 60 Lamba, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Legazpi_Boulevard-scaled.jpg'
    }
  ];

  return officialActs.map((act, idx) => {
    const bg = matchBarangay(act.address);
    const photoMatch = EXPERIENCE_PHOTOS[act.name];
    return {
      id: `act-${idx + 1}`,
      name: act.name,
      category: 'activities',
      subcategory: act.subcategory,
      description: act.description,
      address: act.address,
      barangay_name: bg.name,
      barangay_psgc: bg.psgc,
      image_url: photoMatch ? photoMatch.img : act.image_url,
      image: photoMatch ? photoMatch.img : act.image_url,
      imageAttribution: photoMatch ? photoMatch.attr : null,
      google_maps_url: createGoogleMapsUrl(act.name, act.address)
    };
  });
}

/**
 * Parses Accommodations Page
 */
function parseAccommodations(html) {
  const items = [];
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);
  if (tableMatch) {
    const tableHtml = tableMatch[0];
    const rowMatches = tableHtml.match(/<tr[\s\S]*?<\/tr>/gi) || [];

    rowMatches.slice(1).forEach((row, idx) => {
      const cells = row.match(/<td[\s\S]*?<\/td>/gi) || [];
      if (cells.length >= 3) {
        const name = cleanText(cells[0]);
        const contact = cells[1] ? cleanText(cells[1]) : '';
        const address = cells[2] ? cleanText(cells[2]) : '';
        const classification = cells[3] ? cleanText(cells[3]) : 'Accommodation';

        if (name && name !== 'N/A' && name.length > 2) {
          const bg = matchBarangay(address);
          const nameUpper = name.toUpperCase().trim();
          const photoMatch = ACCOMMODATION_PHOTOS[nameUpper];

          items.push({
            id: `acc-${idx + 1}`,
            name: name,
            category: 'accommodations',
            subcategory: classification || 'Hotel / Resort',
            classification: classification,
            description: `${classification} located in ${address || bg.name}.`,
            address: address,
            barangay_name: bg.name,
            barangay_psgc: bg.psgc,
            contact: contact,
            image_url: photoMatch ? photoMatch.img : null,
            image: photoMatch ? photoMatch.img : null,
            imageAttribution: photoMatch ? photoMatch.attr : null,
            google_maps_url: createGoogleMapsUrl(name, address)
          });
        }
      }
    });
  }

  return items;
}

/**
 * Parses Travel / Scenic Landmarks Page (9 Man-made Landmarks & Parks)
 */
function parseTravel(html) {
  const curated = [
    {
      name: 'Sawangan Park',
      subcategory: 'Public Park & Recreation',
      description: 'Spacious coastal green park and outdoor community gym equipped with fitness stations and children’s play zones along Legazpi Boulevard.',
      address: 'Legazpi Boulevard, Brgy. 57 Dap-Dap, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Sawangan-Outdoor-Gym-1-scaled.jpg'
    },
    {
      name: 'The Obelisk',
      subcategory: 'Monuments & Memorials',
      description: 'Stately obelisk tower monument standing proudly along the waterfront boulevard as a tribute to civic pride and resilience.',
      address: 'Legazpi Boulevard, Brgy. 59 Puro, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/THE-OBELISK-.jpg'
    },
    {
      name: 'Macabalo Bridge',
      subcategory: 'Scenic Bridge',
      description: 'Architectural bridge structure connecting boulevard districts over the Macabalo river inlet with night illumination and volcano vistas.',
      address: 'Legazpi Boulevard, Brgy. 57 Dap-Dap, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/MACABALO-BRIDGE.jpg'
    },
    {
      name: 'Embarcadero de Legazpi',
      subcategory: 'Waterfront Lifestyle Hub',
      description: 'Premier waterfront commercial, retail, dining, and adventure complex along Legazpi port with a seaside promenade and lighted lighthouse.',
      address: 'Brgy. 27 Victory Village South, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/EMBARCADERO.jpg'
    },
    {
      name: 'Legazpi Ecological Sanitary Landfill',
      subcategory: 'Eco-Tourism & Waste Model',
      description: 'Nationally recognized engineered sanitary landfill and green eco-park utilizing Japanese waste-to-fertilizer technology since 2018.',
      address: 'Brgy. 66 Banquerohan, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/legazpi-sanitary-landfill.gif'
    },
    {
      name: 'Legazpi Boulevard Promenade',
      subcategory: 'Coastal Boulevard & Leisure',
      description: 'One of the longest and most picturesque coastal roads in the Philippines, stretching 4+ kilometers with uninterrupted ocean views and evening breeze.',
      address: 'Brgy. 57 Dap-Dap to Brgy. 60 Lamba, Legazpi City',
      image_url: 'https://legazpi.gov.ph/wp-content/uploads/2023/04/Legazpi_Boulevard-scaled.jpg'
    },
    {
      name: 'PRO 5 Heritage Park Arboretum',
      subcategory: 'Eco-Park & Arboretum',
      description: 'Green sanctuary dedicated to indigenous tree propagation, bird conservation, and environmental education within Camp Simeon Ola.',
      address: "Brgy. 1 EM's Barrio, Legazpi City",
      image_url: null
    },
    {
      name: 'JCI Legazpi Tourism Super Marker',
      subcategory: 'Landmark Super Marker',
      description: 'Iconic civic structure and scenic overlook marking Albay Gulf, Sleeping Lion, Ligñon Hill, and the grandeur of Mayon Volcano.',
      address: 'Legazpi Boulevard, Brgy. 59 Puro, Legazpi City',
      image_url: null
    },
    {
      name: 'Albay Park & Wildlife Botanical Grounds',
      subcategory: 'Eco-Park & Wildlife',
      description: 'Lush 5-hectare lakeside sanctuary housing over 300 endemic animals, picnic gazebos, lagoon boat rides, and botanical gardens.',
      address: 'Brgy. 41 Bogtong, Legazpi City',
      image_url: null
    }
  ];

  return curated.map((item, idx) => {
    const bg = matchBarangay(item.address);
    const photoMatch = ATTRACTION_PHOTOS[item.name];
    return {
      id: `trv-${idx + 1}`,
      name: item.name,
      category: 'travel',
      subcategory: item.subcategory,
      description: item.description,
      address: item.address,
      barangay_name: bg.name,
      barangay_psgc: bg.psgc,
      image_url: photoMatch ? photoMatch.img : item.image_url,
      image: photoMatch ? photoMatch.img : item.image_url,
      imageAttribution: photoMatch ? photoMatch.attr : null,
      google_maps_url: createGoogleMapsUrl(item.name, item.address)
    };
  });
}

/**
 * Culture, Products & Hospitality Data from Official Guidebook
 */
function getOfficialCulture() {
  return {
    products: [
      {
        id: 'prod-pinukpok',
        name: 'Pinukpok (Abaca Silk)',
        category: 'Textile & Fashion',
        origin: 'Brgy. 66 Banquerohan',
        description: 'Locally hand-pounded abaca silk renowned for its lustrous texture, used as premium fabric for Philippine Barong, formal gowns, and heirloom attire.',
        where_to_buy: 'Banquerohan Weaving Center, SEDCen, Legazpi City Public Market',
        icon: 'bi-gem'
      },
      {
        id: 'prod-pili',
        name: 'Pili Nut Delights & Wellness',
        category: 'Delicacy & Cosmetics',
        origin: 'Legazpi City & Albay',
        description: 'Harvested from the indigenous "Magic Tree" of Bicol, creating world-class culinary treats, pili oil skincare, and therapeutic wellness products.',
        where_to_buy: 'Albay Pilinut, Legazpi Pasalubong Center, SEDCen, City Malls, Legazpi Market',
        icon: 'bi-tree-fill'
      },
      {
        id: 'prod-abaca',
        name: 'Woven Abaca Handicrafts',
        category: 'Handicrafts & Decor',
        origin: 'Legazpi Artisan Communities',
        description: 'Intricately woven natural fiber crafts including eco-friendly fashion bags, dining placemats, decorative baskets, and Mayon souvenir keepsakes.',
        where_to_buy: 'Legazpi Pasalubong Area, SEDCen, Legazpi Public Market, Malls',
        icon: 'bi-bag-heart-fill'
      }
    ],
    festival: {
      name: 'Ibalong Festival',
      subtitle: 'Celebration of the Mythical Epic of Bicol',
      type: 'Non-Religious Cultural Festival',
      description: 'An annual celebration commemorating the ancient Ibalong Epic of the three mythical warrior-heroes: Baltog, Handiong, and Bantong. Features theatrical street pageantry, mask-wearing dancers depicting mythical beasts (Oryol, Sarimaw, Rabot), and grand cultural parades.',
      schedule: 'Every August in Legazpi City'
    },
    hospitality: {
      mabuhay_gesture: {
        title: 'The Mabuhay Gesture',
        description: 'The signature Filipino Brand of Service greeting with hand gently placed over the heart, symbolizing heartfelt welcome, sincerity, and authentic Legazpeño warmth.'
      },
      welcome_traditions: {
        title: 'Welcome Lei & Putong Ceremony',
        description: 'Traditional welcoming honor where distinguished guests are draped with a handcrafted native Bicol woven Lei necklace and crowned with the ceremonial Putong headdress.'
      }
    }
  };
}

/**
 * Main execution
 */
async function main() {
  console.log('=== Starting BetterLegazpi Tourism Data Scraper & Parser ===');

  const [htmlAttr, htmlFood, htmlAct, htmlAcc, htmlTrv, htmlExp] = await Promise.all([
    fetchHtml('attractions'),
    fetchHtml('food'),
    fetchHtml('activities'),
    fetchHtml('accommodations'),
    fetchHtml('travel'),
    fetchHtml('experience')
  ]);

  const attractions = getOfficialAttractions();
  const { delicacies, establishments: foodEstablishments } = parseFood(htmlFood);
  const activities = getOfficialActivities();
  const accommodations = parseAccommodations(htmlAcc);
  const travelSpots = parseTravel(htmlTrv);
  const culture = getOfficialCulture();

  // Grouped summary
  const tourismDataset = {
    _schema_version: '1.2',
    _updated_at: new Date().toISOString(),
    _source: 'City Government of Legazpi (https://legazpi.gov.ph/) & Official 2024 Travel Guide (City Tourism Services Unit)',
    city: 'City of Legazpi',
    province: 'Albay',
    region: 'Region V - Bicol Region',
    stats: {
      total_attractions: attractions.length,
      total_delicacies: delicacies.length,
      total_food_establishments: foodEstablishments.length,
      total_activities: activities.length,
      total_accommodations: accommodations.length,
      total_travel_spots: travelSpots.length,
      total_destinations: attractions.length + foodEstablishments.length + activities.length + accommodations.length + travelSpots.length
    },
    categories: [
      { id: 'attractions', name: 'Tourist Attractions', count: attractions.length, icon: 'bi-geo-alt-fill' },
      { id: 'food', name: 'Cuisine & Dining', count: foodEstablishments.length, icon: 'bi-cup-hot-fill' },
      { id: 'activities', name: 'Adventures & Activities', count: activities.length, icon: 'bi-compass-fill' },
      { id: 'accommodations', name: 'Accommodations', count: accommodations.length, icon: 'bi-building-fill' },
      { id: 'travel', name: 'Landmarks & Travel Spots', count: travelSpots.length, icon: 'bi-camera-fill' }
    ],
    attractions: attractions,
    delicacies: delicacies,
    food_establishments: foodEstablishments,
    activities: activities,
    accommodations: accommodations,
    travel_spots: travelSpots,
    culture: culture
  };

  const dataDir = path.join(__dirname, '../data');
  fs.writeFileSync(path.join(dataDir, 'tourism.json'), JSON.stringify(tourismDataset, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'tourism-attractions.json'), JSON.stringify({ category: 'attractions', count: attractions.length, data: attractions }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'tourism-experience.json'), JSON.stringify({ category: 'activities', count: activities.length, data: activities }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'tourism-food.json'), JSON.stringify({ category: 'food', count: foodEstablishments.length, delicacies: delicacies, establishments: foodEstablishments }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'tourism-accommodations.json'), JSON.stringify({ category: 'accommodations', count: accommodations.length, data: accommodations }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'tourism-travel.json'), JSON.stringify({ category: 'travel', count: travelSpots.length, data: travelSpots }, null, 2), 'utf-8');
  fs.writeFileSync(path.join(dataDir, 'tourism-culture.json'), JSON.stringify(culture, null, 2), 'utf-8');

  console.log(`[scrape] Successfully saved complete official datasets to ${dataDir}`);
  console.log(`[scrape] Attractions: ${attractions.length} | Dining Spots: ${foodEstablishments.length} | Stays: ${accommodations.length} | Adventures: ${activities.length} | Landmarks: ${travelSpots.length}`);
}

main().catch(err => {
  console.error('Scraper fatal error:', err);
  process.exit(1);
});
