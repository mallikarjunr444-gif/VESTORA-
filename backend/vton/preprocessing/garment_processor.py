"""
VESTORA Garment Preprocessor
Handles:
1. Garment category & sub-type classification
2. Target body region mapping
3. Complete garment silhouette extraction preserving collar, sleeves, cuffs, buttons, patterns
4. Background & human model removal
"""

from typing import Dict, Any, Optional, Union
import io
import base64
from PIL import Image

from ..garment_classifier import GarmentClassifier
from ..garment_extractor import GarmentExtractor

class GarmentProcessor:
    def __init__(self):
        self.classifier = GarmentClassifier()
        self.extractor = GarmentExtractor()

    def process(
        self,
        garment_image: Union[Image.Image, str],
        product_title: str = "Garment",
        category_hint: str = "",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Processes raw garment image:
        - Classifies item category
        - Segments complete garment
        - Returns structured garment metadata
        """
        img_pil = self._load_image(garment_image)
        classification = self.classifier.classify(product_title, category_hint)
        category = classification["category"]
        garment_type = classification["type"]

        extracted = self.extractor.extract(img_pil, category=category, garment_type=garment_type)

        return {
            "category": category,
            "garment_type": garment_type,
            "target_region": classification["target_region"],
            "target_body_regions": classification["target_body_regions"],
            "classification": classification,
            "garment_image": extracted["extracted_image"],
            "garment_b64": extracted["extracted_b64"],
            "bbox": extracted["bbox"],
            "original_size": img_pil.size
        }

    def _load_image(self, img_input: Union[Image.Image, str]) -> Image.Image:
        if isinstance(img_input, Image.Image):
            return img_input
        if isinstance(img_input, str):
            if img_input.startswith("data:image"):
                b64_str = img_input.split(",", 1)[1]
                return Image.open(io.BytesIO(base64.b64decode(b64_str)))
            try:
                return Image.open(io.BytesIO(base64.b64decode(img_input)))
            except Exception:
                return Image.open(img_input)
        raise TypeError(f"Unsupported image format: {type(img_input)}")
