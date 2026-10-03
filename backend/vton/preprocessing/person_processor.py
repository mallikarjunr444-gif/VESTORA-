"""
VESTORA Person & Human Body Preprocessor
Handles:
1. Human parsing and segmentation
2. Clothing-agnostic generation: erases user's original shirt/clothes
3. Inpaint mask synthesis
4. Face, hair, skin, arms, hands, and background preservation
"""

from typing import Dict, Any, Optional, Union, List
import io
import base64
from PIL import Image

from ..body_parser import BodyParser

class PersonProcessor:
    def __init__(self):
        self.body_parser = BodyParser()

    def process(
        self,
        person_image: Union[Image.Image, str],
        category: str = "upper_body",
        pose_landmarks: Optional[List[Dict[str, float]]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Parses person frame, creates clothing inpaint mask erasing old garments.
        """
        img_pil = self._load_image(person_image)
        parsed = self.body_parser.parse(
            person_img=img_pil,
            category=category,
            pose_landmarks=pose_landmarks
        )

        return {
            "person_image": img_pil,
            "inpaint_mask": parsed["inpaint_mask"],
            "category": category,
            "size": img_pil.size
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
