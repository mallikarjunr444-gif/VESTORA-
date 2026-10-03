"""
VESTORA Common VTON Engine Interface
Provides a standardized abstract contract for all virtual try-on engines in VESTORA:
- RT-VTON (Fast real-time prototype)
- CatVTON (High-fidelity image diffusion)
- CatV2TON (Video virtual try-on with temporal concatenation)
- Future real-time video models
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional, Union
from PIL import Image

class VTONEngine(ABC):
    """
    Common virtual try-on engine interface.
    """

    @abstractmethod
    def initialize(self) -> bool:
        """Loads weights, configures pipelines, and binds to hardware device (MPS / CUDA / CPU)"""
        pass

    @abstractmethod
    def prepare_person(self, person_image: Union[Image.Image, str], options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Preprocesses human frame, computes pose landmarks and agnostic body representation"""
        pass

    @abstractmethod
    def prepare_garment(self, garment_image: Union[Image.Image, str], category: str, options: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Extracts complete clothing item and removes backgrounds"""
        pass

    @abstractmethod
    def try_on(
        self,
        person_input: Any,
        garment_input: Any,
        category: str = "upper_body",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Executes full try-on inference replacing user's current clothes"""
        pass

    @abstractmethod
    def process_frame(
        self,
        frame_input: Any,
        garment_input: Any,
        category: str = "upper_body",
        options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Processes continuous live camera video frames with temporal smoothing"""
        pass

    @abstractmethod
    def release(self) -> None:
        """Releases GPU/memory resources and clears caches"""
        pass

    @abstractmethod
    def get_metadata(self) -> Dict[str, Any]:
        """Returns engine name, repo, license, device, and capabilities"""
        pass
