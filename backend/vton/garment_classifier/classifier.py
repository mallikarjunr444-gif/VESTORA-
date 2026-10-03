"""
VESTORA Universal Garment & Accessory Classifier
Classifies apparel and accessories across all 28 supported categories and maps them to target anatomical body regions.
"""

from typing import Dict, Any, List, Optional
import re

# Canonical category definitions
CATEGORY_MAPPINGS = {
    # ── Upper Body Garments ──
    "t_shirt": {
        "category": "upper_body",
        "type": "t_shirt",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms"],
        "keywords": ["t-shirt", "tshirt", "tee", "crew neck", "v-neck"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "shirt": {
        "category": "upper_body",
        "type": "shirt",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms"],
        "keywords": ["shirt", "oxford", "button-down", "button up", "formal shirt", "casual shirt", "flannel", "linen shirt"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "polo": {
        "category": "upper_body",
        "type": "polo",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms"],
        "keywords": ["polo", "polo shirt", "collared t-shirt"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "hoodie": {
        "category": "upper_body",
        "type": "hoodie",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Head", "Neck", "Upper body", "Shoulders", "Arms"],
        "keywords": ["hoodie", "hooded sweatshirt", "pullover hoodie", "zip hoodie"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "sweater": {
        "category": "upper_body",
        "type": "sweater",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms"],
        "keywords": ["sweater", "cardigan", "pullover", "knitwear", "jumper", "sweatshirt"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "jacket": {
        "category": "upper_body",
        "type": "jacket",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms"],
        "keywords": ["jacket", "bomber", "windbreaker", "biker jacket", "denim jacket", "leather jacket", "track jacket"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "blazer": {
        "category": "upper_body",
        "type": "blazer",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms"],
        "keywords": ["blazer", "suit jacket", "tuxedo jacket", "sport coat"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "coat": {
        "category": "upper_body",
        "type": "coat",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms", "Waist"],
        "keywords": ["coat", "overcoat", "trench coat", "parka", "peacoat", "winter coat"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_wrist", "right_wrist", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
    "kurta": {
        "category": "upper_body",
        "type": "kurta",
        "target_region": "torso_and_arms",
        "target_body_regions": ["Upper body", "Shoulders", "Arms", "Waist"],
        "keywords": ["kurta", "kurti", "tunic", "sherwani", "bandhgala", "nehru jacket"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_elbow", "right_elbow", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },

    # ── Full Body Garments ──
    "dress": {
        "category": "full_body",
        "type": "dress",
        "target_region": "shoulders_to_legs",
        "target_body_regions": ["Upper body", "Shoulders", "Waist", "Legs"],
        "keywords": ["dress", "maxi dress", "midi dress", "mini dress", "gown", "frock", "jumpsuit", "romper"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee", "right_knee"],
        "occlusion_sensitive": True,
    },
    "saree": {
        "category": "full_body",
        "type": "saree",
        "target_region": "shoulders_to_legs",
        "target_body_regions": ["Upper body", "Shoulders", "Waist", "Legs"],
        "keywords": ["saree", "sari", "lehenga", "anarkali", "chaniya choli"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder", "left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"],
        "occlusion_sensitive": True,
    },

    # ── Lower Body Garments ──
    "jeans": {
        "category": "lower_body",
        "type": "jeans",
        "target_region": "waist_to_ankles",
        "target_body_regions": ["Waist", "Legs"],
        "keywords": ["jeans", "denim pants", "skinny jeans", "wide leg jeans", "bootcut jeans", "ripped jeans"],
        "anchor_landmarks": ["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"],
        "occlusion_sensitive": False,
    },
    "trousers": {
        "category": "lower_body",
        "type": "trousers",
        "target_region": "waist_to_ankles",
        "target_body_regions": ["Waist", "Legs"],
        "keywords": ["trousers", "chinos", "formal pants", "slacks", "dress pants"],
        "anchor_landmarks": ["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"],
        "occlusion_sensitive": False,
    },
    "pants": {
        "category": "lower_body",
        "type": "pants",
        "target_region": "waist_to_ankles",
        "target_body_regions": ["Waist", "Legs"],
        "keywords": ["pants", "sweatpants", "joggers", "track pants", "cargo pants"],
        "anchor_landmarks": ["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"],
        "occlusion_sensitive": False,
    },
    "shorts": {
        "category": "lower_body",
        "type": "shorts",
        "target_region": "waist_to_knees",
        "target_body_regions": ["Waist", "Legs"],
        "keywords": ["shorts", "bermuda shorts", "cargo shorts", "denim shorts", "swim shorts"],
        "anchor_landmarks": ["left_hip", "right_hip", "left_knee", "right_knee"],
        "occlusion_sensitive": False,
    },
    "skirt": {
        "category": "lower_body",
        "type": "skirt",
        "target_region": "waist_to_knees",
        "target_body_regions": ["Waist", "Legs"],
        "keywords": ["skirt", "mini skirt", "midi skirt", "maxi skirt", "pleated skirt", "pencil skirt"],
        "anchor_landmarks": ["left_hip", "right_hip", "left_knee", "right_knee"],
        "occlusion_sensitive": False,
    },
    "leggings": {
        "category": "lower_body",
        "type": "leggings",
        "target_region": "waist_to_ankles",
        "target_body_regions": ["Waist", "Legs"],
        "keywords": ["leggings", "tights", "yoga pants", "jeggings"],
        "anchor_landmarks": ["left_hip", "right_hip", "left_knee", "right_knee", "left_ankle", "right_ankle"],
        "occlusion_sensitive": False,
    },

    # ── Footwear ──
    "shoes": {
        "category": "footwear",
        "type": "shoes",
        "target_region": "feet",
        "target_body_regions": ["Feet"],
        "keywords": ["shoes", "sneakers", "boots", "loafers", "sandals", "heels", "flats", "trainers", "oxfords"],
        "anchor_landmarks": ["left_ankle", "right_ankle"],
        "occlusion_sensitive": False,
    },

    # ── Accessories & Body Placements ──
    "watch": {
        "category": "accessory",
        "type": "watch",
        "target_region": "wrist",
        "target_body_regions": ["Wrists"],
        "keywords": ["watch", "chronograph", "smartwatch", "wristwatch", "timepiece"],
        "anchor_landmarks": ["left_wrist", "right_wrist"],
        "occlusion_sensitive": True,
    },
    "bracelet": {
        "category": "accessory",
        "type": "bracelet",
        "target_region": "wrist",
        "target_body_regions": ["Wrists"],
        "keywords": ["bracelet", "wristband", "cuff bracelet"],
        "anchor_landmarks": ["left_wrist", "right_wrist"],
        "occlusion_sensitive": True,
    },
    "bangle": {
        "category": "accessory",
        "type": "bangle",
        "target_region": "wrist",
        "target_body_regions": ["Wrists"],
        "keywords": ["bangle", "kada", "chuda"],
        "anchor_landmarks": ["left_wrist", "right_wrist"],
        "occlusion_sensitive": True,
    },
    "ring": {
        "category": "accessory",
        "type": "ring",
        "target_region": "individual_fingers",
        "target_body_regions": ["Hands", "Individual fingers"],
        "keywords": ["ring", "band", "diamond ring", "gold ring"],
        "anchor_landmarks": ["left_wrist", "right_wrist"],
        "occlusion_sensitive": True,
    },
    "necklace": {
        "category": "accessory",
        "type": "necklace",
        "target_region": "neck",
        "target_body_regions": ["Neck"],
        "keywords": ["necklace", "pendant", "choker", "chain", "collar necklace"],
        "anchor_landmarks": ["neck", "left_shoulder", "right_shoulder"],
        "occlusion_sensitive": True,
    },
    "earrings": {
        "category": "accessory",
        "type": "earrings",
        "target_region": "ears",
        "target_body_regions": ["Ears"],
        "keywords": ["earrings", "studs", "hoops", "drop earrings", "jhumkas"],
        "anchor_landmarks": ["left_ear", "right_ear"],
        "occlusion_sensitive": True,
    },
    "sunglasses": {
        "category": "accessory",
        "type": "sunglasses",
        "target_region": "face",
        "target_body_regions": ["Face"],
        "keywords": ["sunglasses", "shades", "glasses", "eyewear", "spectacles", "aviators", "wayfarer"],
        "anchor_landmarks": ["left_eye", "right_eye", "nose"],
        "occlusion_sensitive": True,
    },
    "hat": {
        "category": "accessory",
        "type": "hat",
        "target_region": "head",
        "target_body_regions": ["Head"],
        "keywords": ["hat", "cap", "baseball cap", "beanie", "fedora", "bucket hat", "beret", "snapback"],
        "anchor_landmarks": ["head_crown", "nose"],
        "occlusion_sensitive": False,
    },
    "gloves": {
        "category": "accessory",
        "type": "gloves",
        "target_region": "hands",
        "target_body_regions": ["Hands", "Individual fingers"],
        "keywords": ["gloves", "mittens", "leather gloves", "winter gloves"],
        "anchor_landmarks": ["left_wrist", "right_wrist"],
        "occlusion_sensitive": True,
    },
    "bag": {
        "category": "accessory",
        "type": "bag",
        "target_region": "shoulders_and_hands",
        "target_body_regions": ["Shoulders", "Hands"],
        "keywords": ["bag", "handbag", "tote", "backpack", "crossbody", "clutch", "purse", "shoulder bag"],
        "anchor_landmarks": ["left_shoulder", "right_shoulder", "left_hip", "right_hip"],
        "occlusion_sensitive": True,
    },
}


class GarmentClassifier:
    """
    Intelligent product & garment classifier.
    Analyzes product title, category text, breadcrumbs, and tags to determine
    exact garment category, type, and target body region.
    """

    def __init__(self):
        self.mappings = CATEGORY_MAPPINGS

    def classify(self, title: str, category_hint: str = "", metadata: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """
        Classifies product into category, garment type, and target anatomical body region.
        """
        combined_text = f"{title} {category_hint}".lower()
        if metadata:
            for k, v in metadata.items():
                if isinstance(v, str):
                    combined_text += f" {v.lower()}"

        best_match = None
        highest_score = -1

        for g_key, g_info in self.mappings.items():
            score = 0
            for kw in g_info["keywords"]:
                # Word boundary match gives higher confidence
                pattern = r'\b' + re.escape(kw) + r'\b'
                if re.search(pattern, combined_text):
                    score += len(kw) * 2
                elif kw in combined_text:
                    score += len(kw)

            if score > highest_score:
                highest_score = score
                best_match = g_info

        # Default fallback if no keyword matched
        if not best_match or highest_score <= 0:
            best_match = self.mappings["shirt"]
            confidence = 0.50
        else:
            confidence = min(0.99, 0.70 + (highest_score / 30.0))

        return {
            "category": best_match["category"],
            "type": best_match["type"],
            "target_region": best_match["target_region"],
            "target_body_regions": best_match["target_body_regions"],
            "anchor_landmarks": best_match["anchor_landmarks"],
            "occlusion_sensitive": best_match["occlusion_sensitive"],
            "confidence": round(confidence, 2)
        }
