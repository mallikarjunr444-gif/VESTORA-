# VESTORA Open-Source Virtual Try-On (VTON) Models

This directory contains open-source virtual try-on neural model weights and pipelines integrated into the VESTORA ecosystem.

---

## 1. CatVTON (Concatenation Is All You Need for Virtual Try-On)

- **Official Repository**: [https://github.com/Zheng-Chong/CatVTON.git](https://github.com/Zheng-Chong/CatVTON.git)
- **Paper**: *CatVTON: Concatenation Is All You Need for Virtual Try-On with Diffusion Models* (Zheng et al., 2024)
- **Local Directory**: `models/CatVTON/`
- **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/))
- **Commercial Use**: **Non-Commercial Only**. For commercial deployments, VESTORA's modular engine abstraction allows swapping in commercially licensed models (Apache 2.0 / MIT checkpoints).

### Supported Garment Categories & Body Regions
CatVTON natively supports inpainting and transfer for:
1. **Upper-Body**: T-shirt, Shirt, Polo, Hoodie, Sweater, Jacket, Blazer, Coat, Kurta
   - *Target Body Region*: Upper body, shoulders, chest, torso, and arms (`torso_and_arms`)
2. **Lower-Body**: Jeans, Trousers, Pants, Shorts, Skirt, Leggings
   - *Target Body Region*: Waist, hips, thighs, calves, and ankles (`waist_to_ankles`)
3. **Full-Body**: Dress, Saree, Jumpsuit
   - *Target Body Region*: Shoulders down to legs (`shoulders_to_legs`)

Accessories and footwear (Watches, Bracelets, Rings, Necklaces, Earrings, Sunglasses, Hats, Bags, Shoes) are routed through VESTORA's anatomical landmark precision module (`backend/vton/pose/` and `engine/rendering/`).

### Image vs. Video Capability
- **Current Mode**: High-resolution image-based diffusion inpainting (768×1024 or 512×384, 24–30 inference steps).
- **Video Strategy**: CatVTON is integrated behind VESTORA's modular `BaseVTONEngine` interface. This allows seamless plug-and-play migration to real-time video models (such as CatV2TON / live video VTON pipelines) without altering the extension UI or product detector.

### Hardware & Platform Requirements
- **Apple Silicon (macOS / M1–M5)**:
  - Supports Apple Metal Performance Shaders (`torch.device("mps")`) automatically.
  - Recommended Unified Memory: 8 GB minimum, 16 GB+ recommended.
- **NVIDIA GPU (Linux / Windows)**:
  - Supports CUDA (`torch.device("cuda")`).
  - Recommended VRAM: 8 GB+ (supports `fp16` and `bfloat16`).
- **CPU Fallback**:
  - Automatically activates `torch.device("cpu")` with quantized weights if neither MPS nor CUDA is available.

---

## 2. Model Checkpoint Download

To download the official CatVTON weights from Hugging Face:

```bash
# 1. Install Hugging Face Hub CLI if needed
pip install huggingface_hub

# 2. Download official weights into the model directory
python3 -c "
from huggingface_hub import snapshot_download
snapshot_download(repo_id='zhengchong/CatVTON', local_dir='models/CatVTON/resource')
"
```

---

## 3. How to Run Locally

### Start VTON Backend Engine
```bash
# From repository root:
python3 -m backend.vton.api.server
```
The server will start on `http://localhost:5000` (or `http://localhost:3000` via the Node.js bridge) exposing:
- `POST /api/tryon`
- `POST /api/classify-garment`
- `POST /api/extract-garment`
- `GET /api/tryon/status`
- `GET /api/health`

### Automatic Hardware Acceleration Detection
VESTORA inspects available acceleration at startup:
```python
if torch.backends.mps.is_available():
    device = "mps"  # Apple Silicon M5
elif torch.cuda.is_available():
    device = "cuda" # NVIDIA GPU
else:
    device = "cpu"  # Universal CPU fallback
```
