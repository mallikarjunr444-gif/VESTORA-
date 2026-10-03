"""
VESTORA Modular VTON API Handler
Provides REST API request dispatching for:
- POST /api/vton/try-on
- POST /api/vton/frame
- POST /api/vton/classify
- POST /api/vton/extract
- POST /api/vton/engine/switch
- GET  /api/vton/engines
- GET  /api/vton/status
"""

from typing import Dict, Any, Optional
import io
import base64
from PIL import Image

from ..engine.engine_manager import VTONEngineManager
from ..preprocessing import GarmentProcessor, PersonProcessor, PoseProcessor

class VTONApiHandler:
    """
    Central API handler dispatching virtual try-on requests to the active engine.
    """

    def __init__(self):
        self.manager = VTONEngineManager(default_engine="rt_vton")
        self.garment_proc = GarmentProcessor()
        self.person_proc = PersonProcessor()
        self.pose_proc = PoseProcessor()

    def handle_try_on(self, req_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/vton/try-on
        Handles full virtual try-on request with specified or active engine.
        """
        person_b64 = req_data.get("person") or req_data.get("person_image") or req_data.get("personImage")
        garment_b64 = req_data.get("garment") or req_data.get("garment_image") or req_data.get("garmentImage")
        category = req_data.get("category", "upper_body")
        engine_name = req_data.get("engine") or req_data.get("selected_engine")
        product_title = req_data.get("product_title") or req_data.get("title", "Garment")
        options = req_data.get("options", {})

        if not person_b64 or not garment_b64:
            return {"success": False, "error": "Both 'person' and 'garment' fields are required"}

        # Switch engine if explicitly requested in payload
        if engine_name and engine_name.lower() != self.manager.active_engine_name:
            self.manager.set_active_engine(engine_name)

        # Preprocess garment
        garment_info = self.garment_proc.process(
            garment_image=garment_b64,
            product_title=product_title,
            category_hint=category,
            options=options
        )
        detected_cat = garment_info["category"]

        # Preprocess person
        raw_landmarks = options.get("landmarks", None)
        person_info = self.person_proc.process(
            person_image=person_b64,
            category=detected_cat,
            pose_landmarks=raw_landmarks,
            options=options
        )
        pw, ph = person_info["size"]
        pose_info = self.pose_proc.process(pw, ph, raw_landmarks=raw_landmarks)

        # Run try-on through active engine
        person_payload = {
            "person_image": person_info["person_image"],
            "inpaint_mask": person_info["inpaint_mask"],
            "pose": pose_info
        }
        garment_payload = {
            "garment_image": garment_info["garment_image"],
            "category": detected_cat,
            "target_region": garment_info["target_region"]
        }

        tryon_res = self.manager.try_on(
            person_input=person_payload,
            garment_input=garment_payload,
            category=detected_cat,
            options=options
        )

        # Encode output image to base64
        output_pil = tryon_res["output_image"]
        buf = io.BytesIO()
        output_pil.save(buf, format="PNG")
        output_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "tryon_image_b64": output_b64,
            "engine": tryon_res.get("engine", self.manager.active_engine_name),
            "device": tryon_res.get("device", "cpu"),
            "category": detected_cat,
            "target_region": garment_info["target_region"],
            "classification": garment_info["classification"],
            "metadata": self.manager.get_active_engine().get_metadata()
        }

    def handle_process_frame(self, req_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /api/vton/frame
        Handles real-time camera video frame with temporal stability and frame throttle.
        """
        frame_b64 = req_data.get("frame") or req_data.get("person")
        garment_b64 = req_data.get("garment")
        category = req_data.get("category", "upper_body")
        options = req_data.get("options", {})

        if not frame_b64 or not garment_b64:
            return {"success": False, "error": "Both 'frame' and 'garment' fields are required"}

        # Run frame processing via manager
        frame_res = self.manager.process_frame(
            frame_input=frame_b64,
            garment_input=garment_b64,
            category=category,
            options=options
        )

        output_pil = frame_res["output_image"]
        buf = io.BytesIO()
        output_pil.save(buf, format="PNG")
        output_b64 = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "success": True,
            "frame_image_b64": output_b64,
            "engine": frame_res.get("engine", self.manager.active_engine_name),
            "device": frame_res.get("device", "cpu"),
            "is_cached": frame_res.get("is_cached", False),
            "frames_processed": frame_res.get("frames_processed", 1)
        }

    def handle_switch_engine(self, req_data: Dict[str, Any]) -> Dict[str, Any]:
        """POST /api/vton/engine/switch"""
        engine_name = req_data.get("engine", "rt_vton")
        return self.manager.set_active_engine(engine_name)

    def handle_list_engines(self) -> Dict[str, Any]:
        """GET /api/vton/engines"""
        return {
            "success": True,
            "active_engine": self.manager.active_engine_name,
            "engines": self.manager.list_engines()
        }

    def handle_status(self) -> Dict[str, Any]:
        """GET /api/vton/status"""
        active = self.manager.get_active_engine()
        return {
            "status": "ready",
            "active_engine": self.manager.active_engine_name,
            "device": active.device,
            "metadata": active.get_metadata()
        }
