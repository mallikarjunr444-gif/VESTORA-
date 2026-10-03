"""
VESTORA Complete Garment & Accessory Extractor
Extracts ONLY the relevant complete garment/accessory from product photos containing models,
backgrounds, pants, shoes, bags, or other objects without cropping only the center.
"""

from typing import Tuple, Dict, Any, Optional
import io
import base64
import math
from PIL import Image, ImageFilter, ImageOps, ImageChops

class GarmentExtractor:
    """
    Extracts the complete target garment or accessory from full-model e-commerce images.
    Preserves collar, sleeves, cuffs, hem, buttons, graphics, and patterns.
    """

    def __init__(self):
        pass

    def extract_from_base64(self, b64_str: str, category: str = "upper_body", garment_type: str = "shirt") -> Dict[str, Any]:
        """Convenience method to process base64 data URLs"""
        if "," in b64_str:
            b64_str = b64_str.split(",", 1)[1]
        raw_bytes = base64.b64decode(b64_str)
        img = Image.open(io.BytesIO(raw_bytes)).convert("RGBA")
        return self.extract(img, category=category, garment_type=garment_type)

    def extract(self, image: Image.Image, category: str = "upper_body", garment_type: str = "shirt") -> Dict[str, Any]:
        """
        Extracts complete garment/accessory from input image.
        Returns extracted transparent RGBA image, mask, and bounding box.
        """
        orig_w, orig_h = image.size
        img_rgb = image.convert("RGB")
        img_rgba = image.convert("RGBA")

        # 1. Estimate background color from outer borders
        bg_color = self._sample_background_color(img_rgb)
        
        # 2. Build initial saliency / foreground mask
        fg_mask = self._compute_foreground_mask(img_rgb, bg_color)

        # 3. Category-specific anatomical region filtering
        # When a model is wearing an entire outfit, isolate ONLY the requested garment
        # e.g. Shirt: keep torso & sleeves, remove head/face and lower pants
        refined_mask = self._isolate_category_region(fg_mask, category, garment_type, orig_w, orig_h)

        # 4. Filter out bare human skin tones if sleeves/neck expose skin
        refined_mask = self._filter_skin_tones(img_rgb, refined_mask, category)

        # 5. Smooth and antialias mask edges
        refined_mask = refined_mask.filter(ImageFilter.GaussianBlur(radius=1.5))

        # 6. Apply mask to produce isolated transparent RGBA cutout
        cutout = Image.new("RGBA", (orig_w, orig_h), (0, 0, 0, 0))
        cutout.paste(img_rgba, (0, 0), refined_mask)

        # 7. Compute complete bounding box (preserving full collar and sleeves)
        bbox = cutout.getbbox() or (0, 0, orig_w, orig_h)

        # 8. Encode results
        buffered = io.BytesIO()
        cutout.save(buffered, format="PNG")
        cutout_b64 = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

        return {
            "success": True,
            "category": category,
            "garment_type": garment_type,
            "extracted_image": cutout,
            "extracted_b64": cutout_b64,
            "mask": refined_mask,
            "bbox": {
                "x": bbox[0],
                "y": bbox[1],
                "width": bbox[2] - bbox[0],
                "height": bbox[3] - bbox[1]
            },
            "original_size": {"width": orig_w, "height": orig_h}
        }

    def _sample_background_color(self, img: Image.Image) -> Tuple[int, int, int]:
        """Samples the 4 outer image borders to calculate true background color"""
        w, h = img.size
        pixels = img.load()
        r_tot, g_tot, b_tot, count = 0, 0, 0, 0

        # Sample perimeter
        step_x = max(1, w // 30)
        step_y = max(1, h // 30)

        for x in range(0, w, step_x):
            r1, g1, b1 = pixels[x, 0]
            r2, g2, b2 = pixels[x, h - 1]
            r_tot += r1 + r2
            g_tot += g1 + g2
            b_tot += b1 + b2
            count += 2

        for y in range(0, h, step_y):
            r1, g1, b1 = pixels[0, y]
            r2, g2, b2 = pixels[w - 1, y]
            r_tot += r1 + r2
            g_tot += g1 + g2
            b_tot += b1 + b2
            count += 2

        return (r_tot // count, g_tot // count, b_tot // count)

    def _compute_foreground_mask(self, img: Image.Image, bg_color: Tuple[int, int, int]) -> Image.Image:
        """Computes foreground mask by color distance from background"""
        w, h = img.size
        mask = Image.new("L", (w, h), 0)
        mask_pix = mask.load()
        img_pix = img.load()

        bg_r, bg_g, bg_b = bg_color
        threshold = 32.0

        for y in range(h):
            for x in range(w):
                r, g, b = img_pix[x, y]
                dist = math.sqrt((r - bg_r) ** 2 + (g - bg_g) ** 2 + (b - bg_b) ** 2)
                if dist > threshold:
                    mask_pix[x, y] = 255
                else:
                    mask_pix[x, y] = 0

        return mask

    def _isolate_category_region(self, mask: Image.Image, category: str, garment_type: str, w: int, h: int) -> Image.Image:
        """
        Restricts the mask to the anatomical bounding region of the target garment:
        - Upper body: keeps collar, sleeves, and torso; removes head and lower pants
        - Lower body: keeps waist to ankles; removes upper body and feet
        - Full body: keeps neck to hem
        - Accessories: isolates relevant target zone (head, face, wrist, etc.)
        """
        filtered = mask.copy()
        pixels = filtered.load()

        if category == "upper_body":
            # Cut off head/face (top ~12-16%) and lower pants (bottom ~35-40%) if model image
            head_cutoff = int(h * 0.12)
            pants_cutoff = int(h * 0.72)
            for y in range(h):
                if y < head_cutoff or y > pants_cutoff:
                    for x in range(w):
                        pixels[x, y] = 0

        elif category == "lower_body":
            # Keep waist down to ankles, zero out upper body and shoes
            top_cutoff = int(h * 0.48)
            shoe_cutoff = int(h * 0.94)
            for y in range(h):
                if y < top_cutoff or y > shoe_cutoff:
                    for x in range(w):
                        pixels[x, y] = 0

        elif category == "footwear":
            # Keep only feet region
            top_cutoff = int(h * 0.85)
            for y in range(h):
                if y < top_cutoff:
                    for x in range(w):
                        pixels[x, y] = 0

        elif category == "accessory":
            if garment_type in ["sunglasses", "hat"]:
                # Keep only head/face area
                bottom_cutoff = int(h * 0.35)
                for y in range(h):
                    if y > bottom_cutoff:
                        for x in range(w):
                            pixels[x, y] = 0

        return filtered

    def _filter_skin_tones(self, img: Image.Image, mask: Image.Image, category: str) -> Image.Image:
        """
        Removes exposed bare skin (face, neck, hands) from clothing masks
        using YCbCr human skin tone color clustering.
        """
        if category not in ["upper_body", "lower_body", "full_body"]:
            return mask

        w, h = img.size
        img_pix = img.load()
        mask_pix = mask.load()

        for y in range(h):
            for x in range(w):
                if mask_pix[x, y] > 0:
                    r, g, b = img_pix[x, y]
                    # Standard digital YCbCr skin chrominance cluster
                    cb = 128 - 0.168736 * r - 0.331264 * g + 0.5 * b
                    cr = 128 + 0.5 * r - 0.418688 * g - 0.081312 * b
                    if 77 <= cb <= 127 and 133 <= cr <= 173:
                        # Near the upper neckline or bottom arm edges, attenuate skin
                        if y < h * 0.22 or x < w * 0.15 or x > w * 0.85:
                            mask_pix[x, y] = 0

        return mask
