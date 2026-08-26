/**
 * Enriches all Tourism JSON files with local WebP images and micro-attributions.
 */
const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const DATA_DIR = path.join(ROOT_DIR, 'data');
const PHOTOS_DIR = path.join(ROOT_DIR, 'assets', 'images', 'tourism', 'photos');

// 1. Attractions Image Mapping
const ATTRACTION_PHOTOS = {
  'Ibalong Heroes Monument': { img: '../assets/images/tourism/photos/attraction_ibalong_heroes_monument.webp', attr: '2024 Travel Guide' },
  'Baltog Monument': { img: '../assets/images/tourism/photos/attraction_baltog_monument.webp', attr: '2024 Travel Guide' },
  'Bantong Monument': { img: '../assets/images/tourism/photos/attraction_bantong_monument.webp', attr: '2024 Travel Guide' },
  'Battle of Legazpi Pylon': { img: '../assets/images/tourism/photos/attraction_battle_of_legazpi_pylon.webp', attr: '2024 Travel Guide' },
  'Miguel Lopez de Legazpi Monument': { img: '../assets/images/tourism/photos/attraction_miguel_lopez_de_legazpi.webp', attr: '2024 Travel Guide' },
  'Headless Monument': { img: '../assets/images/tourism/photos/attraction_headless_monument.webp', attr: '2024 Travel Guide' },
  '500 Years of Christianity Marker': { img: '../assets/images/tourism/photos/attraction_500_years_christianity_marker.webp', attr: '2024 Travel Guide' },
  'Camp Simeon Ola': { img: '../assets/images/tourism/photos/attraction_camp_simeon_ola.webp', attr: '2024 Travel Guide' },
  'Padang Memorial Cross': { img: '../assets/images/tourism/photos/attraction_padang_memorial_cross.webp', attr: '2024 Travel Guide' },
  'Albay Gulf Landing Monument': { img: '../assets/images/tourism/photos/attraction_albay_gulf_landing_monument.webp', attr: '2024 Travel Guide' },
  'Jose Ignacio Paua Monument': { img: '../assets/images/tourism/photos/attraction_jose_ignacio_paua_monument.webp', attr: '2024 Travel Guide' },
  'Mayon Volcano': { img: '../assets/images/tourism/photos/attraction_mayon_volcano.webp', attr: '2024 Travel Guide' },
  'Ligñon Hill': { img: '../assets/images/tourism/photos/attraction_lignon_hill.webp', attr: '2024 Travel Guide' },
  'Kapuntukan Hill (Sleeping Lion)': { img: '../assets/images/tourism/photos/attraction_kapuntukan_hill_sleeping_lion.webp', attr: '2024 Travel Guide' },
  'Albay Park and Wildlife': { img: '../assets/images/tourism/photos/attraction_albay_park_and_wildlife.webp', attr: '2024 Travel Guide' },
  'PRO5 Heritage Park and Arboretum': { img: '../assets/images/tourism/photos/attraction_pro5_heritage_park_arboretum.webp', attr: '2024 Travel Guide' },
  'Sawangan Park': { img: '../assets/images/tourism/photos/attraction_sawangan_park.webp', attr: '2024 Travel Guide' },
  'Legazpi Boulevard': { img: '../assets/images/tourism/photos/attraction_legazpi_boulevard.webp', attr: '2024 Travel Guide' },
  'The Obelisk': { img: '../assets/images/tourism/photos/attraction_the_obelisk.webp', attr: '2024 Travel Guide' },
  'Embarcadero de Legazpi': { img: '../assets/images/tourism/photos/attraction_embarcadero_de_legazpi.webp', attr: '2024 Travel Guide' },
  'JCI Legazpi Tourism Super Marker': { img: '../assets/images/tourism/photos/attraction_jci_tourism_super_marker.webp', attr: '2024 Travel Guide' },
  'Sanitary Landfill': { img: '../assets/images/tourism/photos/attraction_sanitary_landfill.webp', attr: '2024 Travel Guide' },
  'Macabalo Bridge': { img: '../assets/images/tourism/photos/attraction_macabalo_bridge.webp', attr: '2024 Travel Guide' },
  'Risen Christ Statue': { img: '../assets/images/tourism/photos/attraction_risen_christ_statue.webp', attr: '2024 Travel Guide' },
  'Albay Cathedral': { img: '../assets/images/tourism/photos/attraction_albay_cathedral.webp', attr: '2024 Travel Guide' },
  'St. Raphael the Archangel Church': { img: '../assets/images/tourism/photos/attraction_st_raphael_church.webp', attr: '2024 Travel Guide' },
  'Giant Statue of Nuestra Sra. de Salvacion': { img: '../assets/images/tourism/photos/attraction_nuestra_sra_de_salvacion.webp', attr: '2024 Travel Guide' },
  'Padre Pio Church': { img: '../assets/images/tourism/photos/attraction_padre_pio_church.webp', attr: '2024 Travel Guide' }
};

// 2. Experience Image Mapping
const EXPERIENCE_PHOTOS = {
  'Mayon ATV Lava Trail Ride': { img: '../assets/images/tourism/photos/experience_mayon_atv_ride.webp', attr: '2024 Travel Guide' },
  'Black Lava Wall Climbing': { img: '../assets/images/tourism/photos/experience_black_lava_wall_climb_zipline.webp', attr: '2024 Travel Guide' },
  'Mayon Black Lava Zipline': { img: '../assets/images/tourism/photos/experience_black_lava_wall_climb_zipline.webp', attr: '2024 Travel Guide' },
  'Mayon Volcano Trail Trekking': { img: '../assets/images/tourism/photos/experience_mayon_atv_ride.webp', attr: '2024 Travel Guide' },
  'Albay Gulf Marine Scuba Diving': { img: '../assets/images/tourism/photos/experience_albay_gulf_diving.webp', attr: '2024 Travel Guide' },
  'Coral Reef Snorkelling': { img: '../assets/images/tourism/photos/experience_albay_gulf_snorkelling.webp', attr: '2024 Travel Guide' },
  'Ligñon Hill 360° Viewing & Skywalk': { img: '../assets/images/tourism/photos/attraction_lignon_hill.webp', attr: '2024 Travel Guide' },
  'Legazpi Boulevard Coastal Cycling': { img: '../assets/images/tourism/photos/attraction_legazpi_boulevard.webp', attr: '2024 Travel Guide' }
};

// 3. Gastronomy Delicacies Mapping
const GASTRO_PHOTOS = {
  'Sili Ice Cream': { img: '../assets/images/tourism/photos/gastro_sili_ice_cream.webp', attr: '2024 Travel Guide' },
  'Mayon Lava Cake': { img: '../assets/images/tourism/photos/gastro_mayon_lava_cake.webp', attr: '2024 Travel Guide' },
  'Pinangat Pasta': { img: '../assets/images/tourism/photos/gastro_pinangat_pasta.webp', attr: '2024 Travel Guide' },
  'Sili Halo-Halo': { img: '../assets/images/tourism/photos/gastro_sili_halo_halo.webp', attr: '2024 Travel Guide' },
  'Pili Ensaymada': { img: '../assets/images/tourism/photos/gastro_pili_ensaymada.webp', attr: '2024 Travel Guide' },
  'Gulay na Pagulong': { img: '../assets/images/tourism/photos/gastro_gulay_na_pagulong.webp', attr: '2024 Travel Guide' },
  'Sili Cheesecake': { img: '../assets/images/tourism/photos/gastro_sili_cheesecake.webp', attr: '2024 Travel Guide' },
  'Pancit-Dinuguan Combo': { img: '../assets/images/tourism/photos/gastro_pancit_dinuguan_combo.webp', attr: '2024 Travel Guide' },
  'Pili Bread & Pastries': { img: '../assets/images/tourism/photos/product_pili_nut_skincare.webp', attr: '2024 Travel Guide' }
};

// 4. Accommodations Photos Mapping
const ACCOMMODATION_PHOTOS = {
  'THE ORIENTAL LEGAZPI': { img: '../assets/images/tourism/photos/hotel_the_oriental_legazpi.webp', attr: 'DOT Bicol' },
  'HOTEL ST. ELLIS': { img: '../assets/images/tourism/photos/hotel_hotel_st_ellis.webp', attr: 'Google Places' },
  'THE MARISON HOTEL': { img: '../assets/images/tourism/photos/hotel_the_marison_hotel.webp', attr: 'Google Places' },
  'CASABLANCA HOTEL': { img: '../assets/images/tourism/photos/hotel_casablanca_hotel.webp', attr: 'Google Places' },
  'PEPPERLAND HOTEL': { img: '../assets/images/tourism/photos/hotel_pepperland_hotel.webp', attr: 'Google Places' },
  'EMBARCADERO HOTEL': { img: '../assets/images/tourism/photos/hotel_embarcadero_hotel.webp', attr: 'Google Places' },
  'LEGAZPI AMIGOS HOMETEL': { img: '../assets/images/tourism/photos/hotel_casablanca_hotel.webp', attr: 'Google Places' }
};

// 5. Food Establishments Mapping
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

// Enrich Attractions
const attractionsPath = path.join(DATA_DIR, 'tourism-attractions.json');
if (fs.existsSync(attractionsPath)) {
  const attractions = JSON.parse(fs.readFileSync(attractionsPath, 'utf8'));
  (attractions.data || []).forEach(item => {
    const match = ATTRACTION_PHOTOS[item.name];
    if (match) {
      item.image = match.img;
      item.imageAttribution = match.attr;
    }
  });
  fs.writeFileSync(attractionsPath, JSON.stringify(attractions, null, 2), 'utf8');
  console.log(`Enriched ${attractions.data.length} attractions.`);
}

// Enrich Experiences
const experiencePath = path.join(DATA_DIR, 'tourism-experience.json');
if (fs.existsSync(experiencePath)) {
  const exp = JSON.parse(fs.readFileSync(experiencePath, 'utf8'));
  (exp.data || []).forEach(item => {
    const match = EXPERIENCE_PHOTOS[item.name];
    if (match) {
      item.image = match.img;
      item.imageAttribution = match.attr;
    }
  });
  fs.writeFileSync(experiencePath, JSON.stringify(exp, null, 2), 'utf8');
  console.log(`Enriched ${exp.data.length} experiences.`);
}

// Enrich Accommodations
const accPath = path.join(DATA_DIR, 'tourism-accommodations.json');
if (fs.existsSync(accPath)) {
  const acc = JSON.parse(fs.readFileSync(accPath, 'utf8'));
  (acc.data || []).forEach(item => {
    const match = ACCOMMODATION_PHOTOS[item.name.toUpperCase()];
    if (match) {
      item.image = match.img;
      item.imageAttribution = match.attr;
    }
  });
  fs.writeFileSync(accPath, JSON.stringify(acc, null, 2), 'utf8');
  console.log(`Enriched ${acc.data.length} accommodations.`);
}

// Enrich Food & Dining
const foodPath = path.join(DATA_DIR, 'tourism-food.json');
if (fs.existsSync(foodPath)) {
  const food = JSON.parse(fs.readFileSync(foodPath, 'utf8'));
  
  // Delicacies
  (food.delicacies || []).forEach(item => {
    const match = GASTRO_PHOTOS[item.name];
    if (match) {
      item.image = match.img;
      item.imageAttribution = match.attr;
    }
  });

  // Establishments
  (food.establishments || []).forEach(item => {
    const nameUpper = (item.name || '').toUpperCase().trim();
    const match = FOOD_PHOTOS[nameUpper];
    if (match) {
      item.image = match.img;
      item.imageAttribution = match.attr;
    }
  });

  fs.writeFileSync(foodPath, JSON.stringify(food, null, 2), 'utf8');
  console.log(`Enriched ${food.establishments.length} food spots & ${food.delicacies.length} delicacies.`);
}

// Re-run scrape-tourism to update master tourism.json
require('./scrape-tourism.js');
console.log('Master tourism.json updated successfully!');
