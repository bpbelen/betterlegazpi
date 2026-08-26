"""
Extracts photos from the Official 2024 Travel Guide PDF and converts them to optimized WebP format.
"""
import os
import io
import pypdf
from PIL import Image

PDF_PATH = r"C:\Users\belen\.gemini\antigravity-ide\brain\67df0f05-8e5a-441e-b6ed-15f9269ebd87\.user_uploaded\media_1787682390987.pdf"
OUT_DIR = r"c:\Users\belen\Downloads\betterlegazpi-wip\assets\images\tourism\photos"

os.makedirs(OUT_DIR, exist_ok=True)

reader = pypdf.PdfReader(PDF_PATH)
print(f"Loaded PDF with {len(reader.pages)} pages.")

saved_count = 0

for page_idx, page in enumerate(reader.pages):
    page_num = page_idx + 1
    try:
        images = list(page.images)
    except Exception as e:
        print(f"Error accessing images on page {page_num}: {e}")
        continue

    for img_idx, img in enumerate(images):
        try:
            pil_img = Image.open(io.BytesIO(img.data))
            
            # Skip tiny icons or line graphics (less than 100x100)
            if pil_img.width < 100 or pil_img.height < 100:
                continue

            # Convert to RGB if needed
            if pil_img.mode in ("RGBA", "P"):
                pil_img = pil_img.convert("RGBA")
            else:
                pil_img = pil_img.convert("RGB")

            # Resize if unnecessarily large (max dimension 800px)
            max_dim = 800
            if pil_img.width > max_dim or pil_img.height > max_dim:
                pil_img.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

            # Name file with page and index
            webp_name = f"guide_p{page_num:02d}_img{img_idx+1:02d}_{pil_img.width}x{pil_img.height}.webp"
            out_path = os.path.join(OUT_DIR, webp_name)

            # Save as WebP with 82 quality
            pil_img.save(out_path, "WEBP", quality=82, method=6)
            saved_count += 1
            print(f"Saved: {webp_name} ({pil_img.width}x{pil_img.height})")
        except Exception as err:
            # Silent skip on raw binary mask inconsistencies
            pass

print(f"\nExtraction complete! Saved {saved_count} optimized WebP photos to {OUT_DIR}.")
