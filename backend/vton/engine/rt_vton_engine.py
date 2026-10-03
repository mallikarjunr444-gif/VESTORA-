"""
VESTORA RT-VTON Engine Implementation
Implements the common VTONEngine interface for real-time virtual try-on.
"""

from typing import Dict, Any, Optional, Union
from PIL import Image

from .base_engine import VTONEngine
from .base import BaseVTONEngine
from ..preprocessing import GarmentProcessor, PersonProcessor, PoseProcessor
from ..inference import RTVTONInferenceSession

class RTVTONEngine(VTONEngine, BaseVTONEngine):
    """
    RT-VTON engine implementation for fast real-time try-on.
    """

    def __init__(self, target_fps: int = 24):
        self.target_fps = target_fps
        self.session = RTVTONInferenceSession(target_fps=target_fps)
        self.device = self.session.device
        self.garment_proc = GarmentProcessor()
        self.person_proc = PersonProcessor()
        self.pose_proc = PoseProcessor()
        self.is_initialized = False

    def initialize(self) -> bool:
        """Loads RT-VTON checkpoints and initializes inference runtime"""
        success = self.session.load_model()
        self.is_initialized = success
        return success

    def prepare_person(
        self,
        person_image: Union[Image.Image, str],
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Preprocesses human frame, computes pose landmarks and inpaint mask"""
        category = (options or {}).get("category", "upper_body")
        raw_landmarks = (options or {}).get("landmarks", None)
        
        person_res = self.person_proc.process(
            person_image=person_image,
            category=category,
            pose_landmarks=raw_landmarks,
            options=options
        )
        pw, ph = person_res["size"]
        pose_res = self.pose_proc.process(pw, ph, raw_landmarks=raw_landmarks)
        
        return {
            "person_image": person_res["person_image"],
            "inpaint_mask": person_res["inpaint_mask"],
            "pose": pose_res,
            "size": (pw, ph)
        }

    def prepare_garment(
        self,
        garment_image: Union[Image.Image, str],
        category: str = "upper_body",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Extracts complete clothing item and removes backgrounds"""
        product_title = (options or {}).get("product_title", "Garment")
        category_hint = (options or {}).get("category_hint", category)
        return self.garment_proc.process(
            garment_image=garment_image,
            product_title=product_title,
            category_hint=category_hint,
            options=options
        )

    def try_on(
        self,
        person_input: Any,
        garment_input: Any,
        category: str = "upper_body",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Executes full try-on inference replacing user's current clothes"""
        options = options or {}
        
        # Prepare person if not already a dict
        if not isinstance(person_input, dict) or "person_image" not in person_input:
            person_data = self.prepare_person(person_input, options={"category": category, **options})
        else:
            person_data = person_input

        # Prepare garment if not already a dict
        if not isinstance(garment_input, dict) or "garment_image" not in garment_input:
            garment_data = self.prepare_garment(garment_input, category=category, options=options)
        else:
            garment_data = garment_input

        person_img = person_data["person_image"]
        inpaint_mask = person_data.get("inpaint_mask")
        landmarks = person_data["pose"]["landmarks"]
        garment_img = garment_data["garment_image"]
        detected_cat = garment_data.get("category", category)

        # Run inference
        output_img = self.session.run_inference(
            person_img=person_img,
            garment_img=garment_img,
            category=detected_cat,
            landmarks=landmarks,
            inpaint_mask=inpaint_mask
        )

        return {
            "success": True,
            "output_image": output_img,
            "engine": "RT-VTON",
            "device": self.device,
            "category": detected_cat,
            "frames_processed": self.session.total_frames,
            "frames_skipped": self.session.skipped_frames
        }

    def process_frame(
        self,
        frame_input: Any,
        garment_input: Any,
        category: str = "upper_body",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Processes continuous live camera video frames with frame throttle / skipping"""
        if not self.session.should_process_frame() and self.session.cached_output:
            return {
                "success": True,
                "output_image": self.session.cached_output,
                "engine": "RT-VTON",
                "device": self.device,
                "category": category,
                "is_cached": True,
                "frames_processed": self.session.total_frames,
                "frames_skipped": self.session.skipped_frames
            }

        res = self.try_on(
            person_input=frame_input,
            garment_input=garment_input,
            category=category,
            options=options
        )
        res["is_cached"] = False
        return res

    def run_tryon(
        self,
        person_image: Image.Image,
        garment_image: Image.Image,
        category: str,
        inpaint_mask: Optional[Image.Image] = None,
        pose_data: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Adapter for BaseVTONEngine contract"""
        landmarks = (pose_data or {}).get("landmarks", [])
        person_data = {
            "person_image": person_image,
            "inpaint_mask": inpaint_mask,
            "pose": {"landmarks": landmarks}
        }
        garment_data = {
            "garment_image": garment_image,
            "category": category
        }
        return self.try_on(person_data, garment_data, category=category, options=options)

    def release(self) -> None:
        """Cleans up resources"""
        self.session.cached_output = None
        self.pose_proc.reset()

    def get_metadata(self) -> Dict[str, Any]:
        return {
            "name": "RT-VTON",
            "repo": "https://github.com/ZaiqiangWu/RTV.git",
            "license": "Academic / Non-Commercial Research License",
            "capability": "realtime_video_and_image",
            "device": self.device,
            "target_fps": self.target_fps,
            "commercial_use_permitted": False,
            "status": "ready"
        }
