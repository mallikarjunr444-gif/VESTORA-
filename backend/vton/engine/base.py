"""
VESTORA Modular VTON Engine Base Interface
Allows plug-and-play swapping of CatVTON, CatV2TON, diffusion inpainters, and real-time video models.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from PIL import Image

class BaseVTONEngine(ABC):
    """
    Abstract contract for all virtual try-on engines in VESTORA.
    """

    @abstractmethod
    def initialize(self) -> bool:
        """Loads weights and prepares inference devices (MPS / CUDA / CPU)"""
        pass

    @abstractmethod
    def run_tryon(
        self,
        person_image: Image.Image,
        garment_image: Image.Image,
        category: str,
        inpaint_mask: Optional[Image.Image] = None,
        pose_data: Optional[Dict[str, Any]] = None,
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes virtual try-on, replacing the person's clothing with the target garment.
        Returns:
        {
            "success": bool,
            "output_image": Image.Image,
            "engine": str,
            "device": str,
            "category": str
        }
        """
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Returns engine name, license, device, and capabilities"""
        pass
