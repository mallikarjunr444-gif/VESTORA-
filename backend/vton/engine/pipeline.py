"""
VESTORA End-to-End Modular VTON Pipeline
Orchestrates:
1. Product & Garment Classification
2. Complete Garment/Accessory Extraction
3. Human Pose & Landmark Estimation
4. Body Parsing & Clothing Agnostic Generation
5. Modular VTON Neural Inference (CatVTON)
6. Photorealistic Result Compositing
"""

from typing import Dict, Any, Optional, Union
import io
import base64
from PIL import Image

from ..garment_classifier import GarmentClassifier
from ..garment_extractor import GarmentExtractor
from ..body_parser import BodyParser
from ..pose import PoseTracker
from .base import BaseVTONEngine
from .catvton_engine import CatVTONEngine

class VTONPipeline:
    """
    Unified VTON pipeline orchestrating complete virtual try-on workflow.
    """

    def __init__(self, engine: Optional[BaseVTONEngine] = None):
        self.classifier = GarmentClassifier()
        self.extractor = GarmentExtractor()
        self.body_parser = BodyParser()
        self.pose_tracker = PoseTracker()
        self.engine = engine or CatVTONEngine()
        self.engine.initialize()

    def process_tryon(
        self,
        person_image: Union[Image.Image, str],
        garment_image: Union[Image.Image, str],
        product_title: str = "Garment",
        category_hint: str = "",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes end-to-end try-on:
        1. Classifies garment and determines target body region
        2. Extracts complete garment (sleeves, collar, buttons, patterns)
        3. Parses person and removes original clothing
        4. Runs neural VTON engine (CatVTON)
        5. Returns realistic try-on image and metadata
        """
        # Load images if base64 or file paths
        person_pil = self._load_image(person_image)
        garment_raw_pil = self._load_image(garment_image)

        # 1. Classify garment
        classification = self.classifier.classify(product_title, category_hint)
        category = classification["category"]
        garment_type = classification["type"]

        # 2. Extract complete garment cutout from model/background
        extracted = self.extractor.extract(garment_raw_pil, category=category, garment_type=garment_type)
        extracted_garment_pil = extracted["extracted_image"]

        # 3. Estimate pose landmarks
        pw, ph = person_pil.size
        pose_data = self.pose_tracker.estimate_pose(pw, ph)

        # 4. Parse person & generate agnostic representation (erasing original clothes)
        parsed = self.body_parser.parse(person_pil, category=category, pose_landmarks=pose_data["landmarks"])
        inpaint_mask = parsed["inpaint_mask"]

        # 5. Run virtual try-on engine
        run_options = {**(options or {}), "garment_type": garment_type}
        result = self.engine.run_tryon(
            person_image=person_pil,
            garment_image=extracted_garment_pil,
            category=category,
            inpaint_mask=inpaint_mask,
            pose_data=pose_data,
            options=run_options
        )

        # 6. Encode result to base64
        output_pil = result["output_image"]
        buffered = io.BytesIO()
        output_pil.save(buffered, format="PNG")
        output_b64 = "data:image/png;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")

        return {
            "success": True,
            "tryon_image_b64": output_b64,
            "classification": classification,
            "extracted_garment_b64": extracted["extracted_b64"],
            "target_region": classification["target_region"],
            "target_body_regions": classification["target_body_regions"],
            "engine": result.get("engine", "CatVTON"),
            "device": result.get("device", "cpu"),
            "metadata": self.engine.get_metadata()
        }

    def _load_image(self, img_input: Union[Image.Image, str]) -> Image.Image:
        """Converts base64 data URLs, file paths, or PIL Images to PIL Image"""
        if isinstance(img_input, Image.Image):
            return img_input
        if isinstance(img_input, str):
            if img_input.startswith("data:image"):
                b64_str = img_input.split(",", 1)[1]
                return Image.open(io.BytesIO(base64.b64decode(b64_str)))
            elif os.path.exists(img_input):
                return Image.open(img_input)
            else:
                # Try raw base64 decode
                try:
                    return Image.open(io.BytesIO(base64.b64decode(img_input)))
                except Exception:
                    raise ValueError(f"Could not load image from input string: {img_input[:40]}…")
        raise TypeError(f"Unsupported image input type: {type(img_input)}")
