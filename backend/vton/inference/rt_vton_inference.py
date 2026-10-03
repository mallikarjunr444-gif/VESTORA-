"""
VESTORA RT-VTON Inference Session Manager
Handles:
1. Model loading & checkpoint resolution
2. Hardware routing (MPS on Apple Silicon M-series / CUDA / CPU)
3. Frame-rate throttle & frame skipping for smooth 30 FPS camera preview
4. Tensor pre/post processing
"""

import sys
import os
import time
from pathlib import Path
from typing import Dict, Any, Optional, List, Tuple
from PIL import Image
import numpy as np

# Add models/RT-VTON to path if present
RTVTON_DIR = Path(__file__).resolve().parents[3] / "models" / "RT-VTON"
if RTVTON_DIR.exists() and str(RTVTON_DIR) not in sys.path:
    sys.path.insert(0, str(RTVTON_DIR))

class RTVTONInferenceSession:
    """
    Manages low-latency real-time inference with frame throttle control.
    """

    def __init__(self, target_fps: int = 24):
        self.target_fps = target_fps
        self.frame_interval_sec = 1.0 / max(1, target_fps)
        self.last_inference_time = 0.0
        self.device = self._detect_device()
        self.is_ready = False
        self.total_frames = 0
        self.skipped_frames = 0
        
        # Last processed output cache for frame skipping
        self.cached_output: Optional[Image.Image] = None

    def _detect_device(self) -> str:
        """Detects best acceleration without assuming CUDA"""
        try:
            import torch
            if hasattr(torch.backends, "mps") and torch.backends.mps.is_available():
                return "mps"
            elif torch.cuda.is_available():
                return "cuda"
            else:
                return "cpu"
        except ImportError:
            return "cpu"

    def load_model(self) -> bool:
        """Initializes model weights and verifies inference readiness"""
        try:
            print(f"[VESTORA RT-VTON] Initializing RT-VTON Inference Session on device: {self.device}")
            # Import and instantiate the full-body VTON processor with a pretrained checkpoint.
            from VITON.viton_fullbody_seq import FullBodySeqFrameProcessor
            self.frame_processor = FullBodySeqFrameProcessor('coat_seq_vmssdp2ta_576')
            self.is_ready = True
            return True
        except Exception as e:
            print(f"[VESTORA RT-VTON] Model loading failed: {e}")
            self.is_ready = False
            return False

    def should_process_frame(self) -> bool:
        """Determines if enough time has elapsed to process a new frame (frame throttle)"""
        now = time.time()
        if now - self.last_inference_time >= self.frame_interval_sec:
            return True
        self.skipped_frames += 1
        return False

    def run_inference(
        self,
        person_img: Image.Image,
        garment_img: Image.Image,
        category: str,
        landmarks: List[Dict[str, float]],
        inpaint_mask: Optional[Image.Image] = None
    ) -> Image.Image:
        """
        Executes RT-VTON fast neural try-on:
        1. Aligns garment to anatomical torso & shoulder landmarks
        2. Inpaints over the user's existing shirt
        3. Preserves face, neck, hair, skin, and background
        """
        self.last_inference_time = time.time()
        self.total_frames += 1
        # Try model inference using RT-VTON
        if hasattr(self, "frame_processor"):
            try:
                person_np = np.array(person_img.convert("RGB"))
                garment_np = np.array(garment_img.convert("RGB"))
                combined = np.concatenate([person_np, garment_np], axis=1)
                result_np = self.frame_processor.forward(combined)
                result_img = Image.fromarray(result_np)
                self.cached_output = result_img.convert("RGB")
                return self.cached_output
            except Exception as exc:
                print(f"[VESTORA RT-VTON] Model inference error: {exc}")
        # Fallback to original overlay logic
        pw, ph = person_img.size
        orig_rgba = person_img.convert("RGBA")
        garment_rgba = garment_img.convert("RGBA")

        # Compute anatomical shoulder midpoint and torso height
        if landmarks and len(landmarks) > 24:
            ls = landmarks[11]
            rs = landmarks[12]
            lh = landmarks[23]
            rh = landmarks[24]
            mid_x = (ls["x"] + rs["x"]) / 2.0
            mid_y = (ls["y"] + rs["y"]) / 2.0
            shoulder_w = abs(ls["x"] - rs["x"])
            torso_h = abs(((lh["y"] + rh["y"]) / 2.0) - mid_y)
        else:
            mid_x = pw * 0.5
            mid_y = ph * 0.35
            shoulder_w = pw * 0.42
            torso_h = ph * 0.38

        # Sizing and positioning based on clothing category
        if category in ["upper_body", "jacket", "coat", "blazer", "hoodie", "sweater"]:
            fit_w = int(max(shoulder_w * 1.52, pw * 0.35))
            fit_h = int(max(torso_h * 1.45, ph * 0.38))
            draw_x = int(mid_x - fit_w / 2)
            draw_y = int(mid_y - fit_h * 0.16)
        elif category == "full_body":
            fit_w = int(max(shoulder_w * 1.58, pw * 0.38))
            fit_h = int(ph * 0.75)
            draw_x = int(mid_x - fit_w / 2)
            draw_y = int(mid_y - fit_h * 0.08)
        elif category == "lower_body":
            fit_w = int(max(shoulder_w * 1.35, pw * 0.32))
            fit_h = int(ph * 0.55)
            draw_x = int(mid_x - fit_w / 2)
            draw_y = int(mid_y + torso_h * 0.85)
        else:
            fit_w = int(pw * 0.35)
            fit_h = int(ph * 0.35)
            draw_x = int(mid_x - fit_w / 2)
            draw_y = int(mid_y)

        # Scale garment and drape
        garment_scaled = garment_rgba.resize((max(10, fit_w), max(10, fit_h)), Image.Resampling.BILINEAR)
        
        # Base canvas
        canvas = orig_rgba.copy()
        canvas.paste(garment_scaled, (draw_x, draw_y), garment_scaled)

        # Foreground arm occlusion restoration
        if landmarks and len(landmarks) > 16:
            lw = landmarks[15]
            rw = landmarks[16]
            radius = int(pw * 0.075)
            for pt in [lw, rw]:
                if pt.get("visibility", 1.0) > 0.4:
                    px, py = int(pt["x"]), int(pt["y"])
                    box = (max(0, px - radius), max(0, py - radius), min(pw, px + radius), min(ph, py + radius))
                    if box[2] > box[0] and box[3] > box[1]:
                        patch = orig_rgba.crop(box)
                        canvas.paste(patch, (box[0], box[1]), patch)

        self.cached_output = canvas.convert("RGB")
        return self.cached_output
import base64
import io
from flask import Flask, request, jsonify

# Initialize inference session (load model on first request)
_inference_session = RTVTONInferenceSession(target_fps=24)

def _ensure_model_loaded():
    if not _inference_session.is_ready:
        _inference_session.load_model()

app = Flask(__name__)

@app.route('/api/vton/frame', methods=['POST'])
def process_frame():
    """Accept a JSON payload with base64‑encoded images and metadata.
    Expected fields:
        frame: base64 string of the current video frame (user image)
        garment: base64 string of the selected garment image
        category: string identifier (e.g., "tshirt", "dress", etc.) – defaults to "upper_body"
        landmarks: optional list of pose landmarks (list of dicts with x, y, visibility)
    Returns:
        JSON with "frame_image_b64" as base64 PNG of the try‑on result.
    """
    data = request.get_json(force=True)
    if not data:
        return jsonify({"error": "No JSON payload provided"}), 400

    # Extract fields from front‑end payload
    frame_b64 = data.get("frame")
    garment_b64 = data.get("garment")
    category = data.get("category", "upper_body")
    landmarks = data.get("landmarks", [])
    if not frame_b64 or not garment_b64:
        return jsonify({"error": "Missing frame or garment data"}), 400

    # Decode images
    person_img = Image.open(io.BytesIO(base64.b64decode(frame_b64))).convert("RGBA")
    garment_img = Image.open(io.BytesIO(base64.b64decode(garment_b64))).convert("RGBA")

    _ensure_model_loaded()
    try:
        result_img = _inference_session.run_inference(
            person_img=person_img,
            garment_img=garment_img,
            category=category,
            landmarks=landmarks,
        )
    except Exception as exc:
        return jsonify({"error": str(exc)}), 500

    # Encode result back to base64 PNG
    buffered = io.BytesIO()
    result_img.save(buffered, format="PNG")
    frame_image_b64 = base64.b64encode(buffered.getvalue()).decode('utf-8')
    return jsonify({"frame_image_b64": frame_image_b64})

if __name__ == '__main__':
    # Run on all interfaces for the Express proxy to reach it
    app.run(host='0.0.0.0', port=5000)
