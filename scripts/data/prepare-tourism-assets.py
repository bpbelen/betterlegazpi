"""
Maps, standardizes, and optimizes all extracted 2024 Travel Guide photos and curated destination photos.
All output images are saved as optimized WebP files under assets/images/tourism/photos/.
"""
import os
import shutil
from PIL import Image

BASE_DIR = r"c:\Users\belen\Downloads\betterlegazpi-wip"
PHOTOS_DIR = os.path.join(BASE_DIR, "assets", "images", "tourism", "photos")
os.makedirs(PHOTOS_DIR, exist_ok=True)

# 1. Exact High-Res Guide Photo Mappings
GUIDE_MAPPINGS = {
    # 28 Attractions & Monuments
    "guide_p05_img01_800x537.webp": "attraction_ibalong_heroes_monument.webp",
    "guide_p06_img01_800x798.webp": "attraction_baltog_monument.webp",
    "guide_p07_img01_751x750.webp": "attraction_bantong_monument.webp",
    "guide_p08_img01_525x800.webp": "attraction_battle_of_legazpi_pylon.webp",
    "guide_p09_img04_800x537.webp": "attraction_miguel_lopez_de_legazpi.webp",
    "guide_p10_img04_800x537.webp": "attraction_headless_monument.webp",
    "guide_p11_img02_800x537.webp": "attraction_500_years_christianity_marker.webp",
    "guide_p12_img02_800x537.webp": "attraction_camp_simeon_ola.webp",
    "guide_p13_img02_800x537.webp": "attraction_padang_memorial_cross.webp",
    "guide_p14_img01_800x798.webp": "attraction_albay_gulf_landing_monument.webp",
    "guide_p15_img01_800x798.webp": "attraction_jose_ignacio_paua_monument.webp",
    "guide_p16_img02_800x538.webp": "attraction_mayon_volcano.webp",
    "guide_p17_img02_635x427.webp": "attraction_lignon_hill.webp",
    "guide_p18_img02_800x538.webp": "attraction_kapuntukan_hill_sleeping_lion.webp",
    "guide_p19_img02_800x560.webp": "attraction_albay_park_and_wildlife.webp",
    "guide_p20_img02_800x537.webp": "attraction_pro5_heritage_park_arboretum.webp",
    "guide_p21_img02_800x537.webp": "attraction_sawangan_park.webp",
    "guide_p22_img02_800x538.webp": "attraction_legazpi_boulevard.webp",
    "guide_p23_img02_800x537.webp": "attraction_the_obelisk.webp",
    "guide_p24_img02_800x538.webp": "attraction_embarcadero_de_legazpi.webp",
    "guide_p25_img03_800x538.webp": "attraction_jci_tourism_super_marker.webp",
    "guide_p26_img01_400x269.webp": "attraction_sanitary_landfill.webp",
    "guide_p27_img01_800x538.webp": "attraction_macabalo_bridge.webp",
    "guide_p28_img01_800x798.webp": "attraction_risen_christ_statue.webp",
    "guide_p29_img02_799x537.webp": "attraction_albay_cathedral.webp",
    "guide_p30_img02_800x538.webp": "attraction_st_raphael_church.webp",
    "guide_p31_img02_800x538.webp": "attraction_nuestra_sra_de_salvacion.webp",
    "guide_p32_img02_800x537.webp": "attraction_padre_pio_church.webp",

    # Adventures & Experiences
    "guide_p33_img02_387x512.webp": "experience_mayon_atv_ride.webp",
    "guide_p34_img03_502x318.webp": "experience_black_lava_wall_climb_zipline.webp",
    "guide_p35_img07_358x483.webp": "experience_albay_gulf_diving.webp",
    "guide_p35_img03_384x243.webp": "experience_albay_gulf_snorkelling.webp",

    # 9 Gastronomy & Delicacy Items
    "guide_p38_img02_231x251.webp": "gastro_sili_ice_cream.webp",
    "guide_p38_img03_193x210.webp": "gastro_mayon_lava_cake.webp",
    "guide_p38_img04_378x410.webp": "gastro_pinangat_pasta.webp",
    "guide_p38_img05_308x334.webp": "gastro_sili_halo_halo.webp",
    "guide_p38_img06_367x398.webp": "gastro_pili_ensaymada.webp",
    "guide_p38_img07_258x280.webp": "gastro_gulay_na_pagulong.webp",
    "guide_p38_img08_232x253.webp": "gastro_sili_cheesecake.webp",
    "guide_p38_img09_283x308.webp": "gastro_pancit_dinuguan_combo.webp",

    # Products of Pride
    "guide_p36_img04_308x410.webp": "product_pinukpok_abaca_silk.webp",
    "guide_p36_img02_788x499.webp": "product_pili_nut_skincare.webp",
    "guide_p36_img03_521x549.webp": "product_woven_abaca_crafts.webp",

    # Festival & Hospitality
    "guide_p37_img04_788x525.webp": "festival_ibalong_street_dancing.webp",
    "guide_p39_img02_638x800.webp": "hospitality_mabuhay_gesture.webp",
    "guide_p39_img03_477x489.webp": "hospitality_welcome_lei_putong.webp",
}

print("Standardizing semantic high-res names...")
for src_file, dest_file in GUIDE_MAPPINGS.items():
    src_path = os.path.join(PHOTOS_DIR, src_file)
    dest_path = os.path.join(PHOTOS_DIR, dest_file)
    if os.path.exists(src_path):
        try:
            im = Image.open(src_path)
            if im.mode != "RGB":
                im = im.convert("RGB")
            # Save optimized WebP
            im.save(dest_path, "WEBP", quality=85, method=6)
            size_kb = os.path.getsize(dest_path) / 1024
            print(f"Standardized: {dest_file} ({im.width}x{im.height}, {size_kb:.1f} KB)")
        except Exception as e:
            print(f"Error copying {src_file}: {e}")

print("High-res asset standardization complete.")
