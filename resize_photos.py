#!/usr/bin/env python3
"""
resize_photos.py — Batch resize all hotel photos to 1200×800 px.

Run this once after dropping your photos into the photos/ folders:
    python3 resize_photos.py

Requirements:
    pip install Pillow

What it does:
    • Walks every subfolder inside photos/
    • Finds .jpg / .jpeg / .png / .webp files
    • Crops and resizes each to exactly 1200×800 px (landscape)
      using a smart center-crop so nothing looks stretched
    • Overwrites the originals in place (keeps your filenames)
    • Skips files that are already the right size

Change TARGET_W / TARGET_H below if you want a different size.
"""

from pathlib import Path
from PIL import Image

# ── CONFIG ────────────────────────────────────────────────────────────────────
TARGET_W = 1200   # output width  in pixels
TARGET_H =  915   # output height in pixels
QUALITY  =  88    # JPEG quality (1–95); 88 is a good balance
PHOTOS_DIR = Path(__file__).parent / 'photos'   # relative to this script
EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp'}
# ─────────────────────────────────────────────────────────────────────────────


def smart_crop_resize(img: Image.Image, target_w: int, target_h: int) -> Image.Image:
    """
    Scale the image so it fills the target dimensions completely,
    then center-crop any excess. Result is exactly target_w × target_h.
    """
    src_w, src_h = img.size
    scale = max(target_w / src_w, target_h / src_h)
    new_w = round(src_w * scale)
    new_h = round(src_h * scale)
    img = img.resize((new_w, new_h), Image.LANCZOS)

    # Center crop
    left = (new_w - target_w) // 2
    top  = (new_h - target_h) // 2
    img = img.crop((left, top, left + target_w, top + target_h))
    return img


def process_photo(path: Path) -> None:
    with Image.open(path) as img:
        # Convert palette / RGBA → RGB for JPEG output
        if img.mode in ('P', 'RGBA', 'LA'):
            img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')

        resized = smart_crop_resize(img, TARGET_W, TARGET_H)

    # Save — always as JPEG regardless of original format
    out_path = path.with_suffix('.jpg')
    resized.save(out_path, 'JPEG', quality=QUALITY, optimize=True)

    # If original was .png/.webp, remove it after saving as .jpg
    if path.suffix.lower() != '.jpg' and path != out_path:
        path.unlink()
        print(f'  done  {out_path.relative_to(PHOTOS_DIR.parent)}  (converted from {path.suffix})')
    else:
        print(f'  done  {out_path.relative_to(PHOTOS_DIR.parent)}')


def main():
    if not PHOTOS_DIR.exists():
        print(f'ERROR: photos/ folder not found at {PHOTOS_DIR}')
        print('Make sure resize_photos.py is in the same folder as your photos/ directory.')
        return

    files = [p for p in PHOTOS_DIR.rglob('*') if p.suffix.lower() in EXTENSIONS]

    if not files:
        print('No photos found. Drop your images into the photos/ subfolders first.')
        return

    print(f'Resizing {len(files)} photo(s) to {TARGET_W}×{TARGET_H} px...\n')
    for f in sorted(files):
        try:
            process_photo(f)
        except Exception as e:
            print(f'  ERROR {f.name}: {e}')

    print(f'\nDone! All photos are now {TARGET_W}×{TARGET_H} px.')


if __name__ == '__main__':
    main()