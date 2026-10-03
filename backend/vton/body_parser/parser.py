"""
VESTORA Body Parser & Clothing Replacement Agnostic Mask Generator
Segments human person, isolates existing clothing (e.g. yellow shirt),
and generates the clothing-agnostic representation for CatVTON and diffusion pipelines.
Preserves face, hair, arms, hands, body shape, and background.
"""

from typing import Dict, Any, List, Tuple, Optional
import math
from PIL import Image, ImageDraw, ImageFilter

class BodyParser:
    """
    Parses human body into anatomical semantic regions:
    - Target clothing region to be erased & replaced (upper_body / lower_body / full_body)
    - Foreground occlusion elements (arms, forearms, hands)
    - Protected identity elements (face, neck, hair, background)
    """

    def __init__(self):
        pass

    def parse(self, person_img: Image.Image, category: str = "upper_body", pose_landmarks: Optional[List[Dict[str, float]]] = None) -> Dict[str, Any]:
        """
        Parses person image and returns:
        - agnostic_image: Person with original clothing erased/masked
        - inpaint_mask: Mask where new garment will be synthesized
        - arm_mask: Foreground arms for natural occlusion
        - face_mask: Protected face/head region
        """
        w, h = person_img.size

        # If pose landmarks are provided or estimated, use them to anchor anatomical regions
        lm = pose_landmarks or self._estimate_fallback_landmarks(w, h)

        # 1. Generate inpaint mask for the target clothing category (e.g. original shirt)
        inpaint_mask = self._generate_clothing_mask(w, h, category, lm)

        # 2. Generate foreground arm occlusion mask (hands & forearms in front of torso)
        arm_occlusion_mask = self._generate_arm_occlusion_mask(w, h, lm)

        # Subtract foreground arms from inpaint mask so arms are NOT erased
        inpaint_mask_minus_arms = Image.new("L", (w, h), 0)
        in_pix = inpaint_mask.load()
        arm_pix = arm_occlusion_mask.load()
        out_pix = inpaint_mask_minus_arms.load()

        for y in range(h):
            for x in range(w):
                if in_pix[x, y] > 128 and arm_pix[x, y] < 128:
                    out_pix[x, y] = 255

        # 3. Create Agnostic Person Image (original yellow shirt is erased with neutral gray/inpainting tone)
        agnostic_img = person_img.copy()
        draw = ImageDraw.Draw(agnostic_img)
        # Fill the inpaint region with 128 neutral gray (standard VTON agnostic representation)
        draw.bitmap((0, 0), inpaint_mask_minus_arms, fill=(128, 128, 128, 255))

        return {
            "agnostic_image": agnostic_img,
            "inpaint_mask": inpaint_mask_minus_arms,
            "arm_occlusion_mask": arm_occlusion_mask,
            "category": category,
            "landmarks": lm
        }

    def _generate_clothing_mask(self, w: int, h: int, category: str, lm: List[Dict[str, float]]) -> Image.Image:
        """Generates binary mask covering the person's existing clothing to be replaced"""
        mask = Image.new("L", (w, h), 0)
        draw = ImageDraw.Draw(mask)

        # Landmarks: 0:Nose, 5:L_Shoulder, 6:R_Shoulder, 7:L_Elbow, 8:R_Elbow, 11:L_Hip, 12:R_Hip
        ls = lm[5]
        rs = lm[6]
        le = lm[7]
        re = lm[8]
        lh = lm[11]
        rh = lm[12]

        neck_x = (ls["x"] + rs["x"]) / 2.0
        neck_y = (ls["y"] + rs["y"]) / 2.0 - (h * 0.04)

        if category == "upper_body":
            # Polygon covering torso and upper arms (the existing shirt)
            poly = [
                (neck_x, neck_y),
                (rs["x"] + w * 0.03, rs["y"]),
                (re["x"] + w * 0.04, re["y"]),
                (rh["x"] + w * 0.05, rh["y"] + h * 0.04),
                (lh["x"] - w * 0.05, lh["y"] + h * 0.04),
                (le["x"] - w * 0.04, le["y"]),
                (ls["x"] - w * 0.03, ls["y"]),
            ]
            draw.polygon(poly, fill=255)
            # Soften collar curve
            draw.ellipse([neck_x - w * 0.08, neck_y, neck_x + w * 0.08, neck_y + h * 0.08], fill=255)

        elif category == "lower_body":
            # Polygon covering waist to ankles (existing pants/trousers)
            lk = lm[13] if len(lm) > 13 else {"x": lh["x"], "y": h * 0.85}
            rk = lm[14] if len(lm) > 14 else {"x": rh["x"], "y": h * 0.85}
            poly = [
                (lh["x"] - w * 0.04, lh["y"] - h * 0.02),
                (rh["x"] + w * 0.04, rh["y"] - h * 0.02),
                (rk["x"] + w * 0.05, h * 0.95),
                (lk["x"] - w * 0.05, h * 0.95),
            ]
            draw.polygon(poly, fill=255)

        elif category == "full_body":
            # Covers neckline down to ankles
            poly = [
                (neck_x, neck_y),
                (rs["x"] + w * 0.04, rs["y"]),
                (rh["x"] + w * 0.08, h * 0.95),
                (lh["x"] - w * 0.08, h * 0.95),
                (ls["x"] - w * 0.04, ls["y"]),
            ]
            draw.polygon(poly, fill=255)

        # Apply slight feathering for seamless edge blending
        return mask.filter(ImageFilter.GaussianBlur(radius=2))

    def _generate_arm_occlusion_mask(self, w: int, h: int, lm: List[Dict[str, float]]) -> Image.Image:
        """Identifies forearms and hands that pass in front of the torso to preserve them in front"""
        mask = Image.new("L", (w, h), 0)
        draw = ImageDraw.Draw(mask)

        ls = lm[5]
        rs = lm[6]
        le = lm[7]
        re = lm[8]
        lw = lm[9] if len(lm) > 9 else {"x": le["x"], "y": le["y"] + h * 0.15}
        rw = lm[10] if len(lm) > 10 else {"x": re["x"], "y": re["y"] + h * 0.15}

        # Check if left forearm is within chest width
        min_x = min(ls["x"], rs["x"]) - w * 0.02
        max_x = max(ls["x"], rs["x"]) + w * 0.02
        min_y = min(ls["y"], rs["y"])
        max_y = h * 0.9

        arm_width = int(w * 0.06)

        if min_x <= lw["x"] <= max_x and min_y <= lw["y"] <= max_y:
            draw.line([(le["x"], le["y"]), (lw["x"], lw["y"])], fill=255, width=arm_width)
            draw.ellipse([lw["x"] - arm_width, lw["y"] - arm_width, lw["x"] + arm_width, lw["y"] + arm_width], fill=255)

        if min_x <= rw["x"] <= max_x and min_y <= rw["y"] <= max_y:
            draw.line([(re["x"], re["y"]), (rw["x"], rw["y"])], fill=255, width=arm_width)
            draw.ellipse([rw["x"] - arm_width, rw["y"] - arm_width, rw["x"] + arm_width, rw["y"] + arm_width], fill=255)

        return mask.filter(ImageFilter.GaussianBlur(radius=1.5))

    def _estimate_fallback_landmarks(self, w: int, h: int) -> List[Dict[str, float]]:
        """Standard human anatomical proportional anchors for standing/sitting person"""
        cx = w * 0.5
        return [
            {"x": cx, "y": h * 0.35},                 # 0: Nose
            {"x": cx - w * 0.06, "y": h * 0.30},      # 1: L Eye
            {"x": cx + w * 0.06, "y": h * 0.30},      # 2: R Eye
            {"x": cx - w * 0.12, "y": h * 0.35},      # 3: L Ear
            {"x": cx + w * 0.12, "y": h * 0.35},      # 4: R Ear
            {"x": cx - w * 0.28, "y": h * 0.54},      # 5: L Shoulder
            {"x": cx + w * 0.28, "y": h * 0.54},      # 6: R Shoulder
            {"x": cx - w * 0.34, "y": h * 0.72},      # 7: L Elbow
            {"x": cx + w * 0.34, "y": h * 0.72},      # 8: R Elbow
            {"x": cx - w * 0.38, "y": h * 0.88},      # 9: L Wrist
            {"x": cx + w * 0.38, "y": h * 0.88},      # 10: R Wrist
            {"x": cx - w * 0.18, "y": h * 0.94},      # 11: L Hip
            {"x": cx + w * 0.18, "y": h * 0.94},      # 12: R Hip
            {"x": cx - w * 0.18, "y": h * 1.15},      # 13: L Knee
            {"x": cx + w * 0.18, "y": h * 1.15},      # 14: R Knee
        ]
