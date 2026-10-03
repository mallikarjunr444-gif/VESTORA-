"""
VESTORA Unified VTON Engine Manager
Orchestrates modular hot-swapping between:
- RT-VTON (Fast real-time prototype & live frame preview)
- CatVTON (High-fidelity image diffusion inpainting)
- CatV2TON (Video virtual try-on with temporal concatenation)
- Future real-time video VTON engines
"""

from typing import Dict, Any, Optional, List
from PIL import Image

from .base_engine import VTONEngine
from .rt_vton_engine import RTVTONEngine
from .catvton_engine import CatVTONEngine
from .catv2ton_video_engine import CatV2TONVideoEngine

class VTONEngineManager:
    """
    Central manager for all virtual try-on engines in VESTORA.
    """

    def __init__(self, default_engine: str = "rt_vton"):
        self.engines: Dict[str, Any] = {}
        self.active_engine_name = default_engine.lower()
        
        # Register standard engine builders
        self._register_default_engines()
        
        # Initialize default engine
        self._ensure_engine_loaded(self.active_engine_name)

    def _register_default_engines(self):
        """Registers factory functions for supported engines"""
        self._registry = {
            "rt_vton": lambda: RTVTONEngine(target_fps=24),
            "rt-vton": lambda: RTVTONEngine(target_fps=24),
            "catvton": lambda: CatVTONEngine(),
            "catv2ton": lambda: CatV2TONVideoEngine(),
            "catv2ton-video": lambda: CatV2TONVideoEngine()
        }

    def _ensure_engine_loaded(self, name: str) -> Any:
        norm_name = name.lower()
        if norm_name not in self.engines:
            if norm_name in self._registry:
                engine = self._registry[norm_name]()
                engine.initialize()
                self.engines[norm_name] = engine
            else:
                # Default fallback to rt_vton
                engine = RTVTONEngine(target_fps=24)
                engine.initialize()
                self.engines["rt_vton"] = engine
                return engine
        return self.engines[norm_name]

    def set_active_engine(self, name: str) -> Dict[str, Any]:
        """Swaps active try-on engine without restarting VESTORA"""
        norm_name = name.lower()
        engine = self._ensure_engine_loaded(norm_name)
        self.active_engine_name = norm_name
        return {
            "success": True,
            "active_engine": norm_name,
            "metadata": engine.get_metadata()
        }

    def get_active_engine(self) -> Any:
        """Returns the currently active engine instance"""
        return self._ensure_engine_loaded(self.active_engine_name)

    def list_engines(self) -> List[Dict[str, Any]]:
        """Lists all registered engines and their metadata"""
        results = []
        for name in ["rt_vton", "catvton", "catv2ton"]:
            engine = self._ensure_engine_loaded(name)
            meta = engine.get_metadata()
            meta["id"] = name
            meta["is_active"] = (name == self.active_engine_name)
            results.append(meta)
        return results

    def try_on(
        self,
        person_input: Any,
        garment_input: Any,
        category: str = "upper_body",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Runs try-on via active engine"""
        engine = self.get_active_engine()
        if hasattr(engine, "try_on"):
            return engine.try_on(person_input, garment_input, category=category, options=options)
        elif hasattr(engine, "run_tryon"):
            # Adapter for legacy BaseVTONEngine
            return engine.run_tryon(person_input, garment_input, category=category, options=options)
        raise AttributeError(f"Engine {self.active_engine_name} does not implement try_on")

    def process_frame(
        self,
        frame_input: Any,
        garment_input: Any,
        category: str = "upper_body",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Processes continuous video frames via active engine"""
        engine = self.get_active_engine()
        if hasattr(engine, "process_frame"):
            return engine.process_frame(frame_input, garment_input, category=category, options=options)
        elif hasattr(engine, "run_video_frame"):
            return engine.run_video_frame(frame_input, garment_input, category=category, options=options)
        else:
            return self.try_on(frame_input, garment_input, category=category, options=options)
