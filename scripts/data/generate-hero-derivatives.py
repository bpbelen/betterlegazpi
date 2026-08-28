#!/usr/bin/env python3
"""Generate responsive WebP derivatives for the home hero backdrop.

The source photo (Mayon Volcano, by Rye Belen) ships at 3576x2682 / 2.1 MB,
which is far too heavy for the LCP element on a phone. This script produces
a 2560px WebP master plus 640/1280/1920 variants, and an inline-sized LQIP
used as the background placeholder while the real image decodes.

Run by hand after replacing the source photo:

    python scripts/data/generate-hero-derivatives.py

Outputs are committed; this is not part of `npm run build`.
"""

import base64
import io
import os
import sys

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BANNERS = os.path.join(ROOT, 'assets', 'images', 'banners')

SOURCE = os.path.join(BANNERS, 'legazpi-mayonvolcano.jpg')
STEM = 'home-hero-mayon'
WIDTHS = [640, 1280, 1920, 2560]
QUALITY = {640: 72, 1280: 74, 1920: 76, 2560: 78}


def emit(img, width, path):
    ratio = width / img.width
    out = img.resize((width, round(img.height * ratio)), Image.LANCZOS)
    out.save(path, 'WEBP', quality=QUALITY[width], method=6)
    return os.path.getsize(path)


def lqip(img):
    """A 24px-wide WebP, base64'd, small enough to inline in the stylesheet."""
    tiny = img.resize((24, max(1, round(24 * img.height / img.width))), Image.LANCZOS)
    buf = io.BytesIO()
    tiny.save(buf, 'WEBP', quality=40, method=6)
    return base64.b64encode(buf.getvalue()).decode('ascii')


def main():
    if not os.path.exists(SOURCE):
        sys.exit('missing source photo: %s' % SOURCE)

    img = Image.open(SOURCE).convert('RGB')
    print('source: %d x %d, %.1f KB' % (img.width, img.height, os.path.getsize(SOURCE) / 1024))

    for width in WIDTHS:
        path = os.path.join(BANNERS, '%s-%d.webp' % (STEM, width))
        size = emit(img, width, path)
        print('  %-34s %7.1f KB' % (os.path.basename(path), size / 1024))

    blob = lqip(img)
    print('\nLQIP (%d bytes base64), paste into home.css as the placeholder layer:' % len(blob))
    print('url(\'data:image/webp;base64,%s\')' % blob)


if __name__ == '__main__':
    main()
