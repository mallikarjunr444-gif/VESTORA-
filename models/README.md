# VESTORA Open-Source Virtual Try-On (VTON) Models

This directory contains open-source virtual try-on neural model weights, architectures, and pipelines integrated into the VESTORA ecosystem.

---

## Model Comparison Matrix

| Feature | RT-VTON | CatVTON | CatV2TON |
|---|---|---|---|
| **Repository** | [github.com/ZaiqiangWu/RTV](https://github.com/ZaiqiangWu/RTV.git) | [github.com/Zheng-Chong/CatVTON](https://github.com/Zheng-Chong/CatVTON.git) | [github.com/Zheng-Chong/CatV2TON](https://github.com/Zheng-Chong/CatV2TON.git) |
| **Input** | Webcam frames + Garment image | Person image + Garment image | Live Person camera video/frames + Garment |
| **Output** | Real-time live try-on video/frames | High-resolution try-on image | Real-time continuous try-on video stream |
| **Temporal Consistency** | Jitter-filter & frame throttle | N/A (single frame) | Native DiT Temporal Concatenation + EMA smoothing |
| **Movement Handling** | Real-time webcam tracking | Static pose | Dynamic turns, raising arms, body movement |
| **Clothing Replacement** | Replaces original clothes via body parsing | Replaces original clothes via inpaint mask | Replaces original clothes via temporal video inpainting |
| **Target Role in VESTORA** | **Fast real-time live preview prototype** | High-fidelity image snapshot & catalog try-on | Live webcam / camera stream video fitting room |
| **Hardware** | Apple Silicon MPS / CUDA / CPU fallback | Apple Silicon MPS / CUDA / CPU fallback | Apple Silicon MPS / CUDA / CPU fallback |
| **License** | Custom Apache 2.0 (Non-Commercial) | CC BY-NC-SA 4.0 | CC BY-NC-SA 4.0 |
| **Commercial Use** | Non-Commercial Only | Non-Commercial Only | Non-Commercial Only |

---

## 1. RT-VTON (Real-Time Virtual Try-On Engine)

- **Official Repository**: [https://github.com/ZaiqiangWu/RTV.git](https://github.com/ZaiqiangWu/RTV.git)
- **Paper**: *Real-Time Per-Garment Virtual Try-On with Temporal Consistency for Loose-Fitting Garments* (Wu et al., 2025)
- **Local Directory**: `models/RT-VTON/`
- **Engine Module**: `backend/vton/engine/rt_vton_engine.py`
- **Inference Session**: `backend/vton/inference/rt_vton_inference.py`
- **License**: Custom Apache 2.0 (Non-Commercial Use Only) Copyright 2025 Zaiqiang Wu

### Installation & Dependencies
- Python 3.10+
- PyTorch >= 2.0.0
- torchvision, pillow, numpy

### Hardware Acceleration (Apple Silicon M5 Mac Adaptation)
The upstream repository (`demo.py`, `viton_fullbody_seq.py`) hardcodes CUDA (`.cuda()`).
VESTORA provides an automatic device adapter in `backend/vton/inference/rt_vton_inference.py`:
- Automatically detects `torch.backends.mps.is_available()`.
- Routes tensor computations to Apple Silicon Metal Performance Shaders (`mps`) without CUDA crashes.
- Falls back to multi-threaded CPU processing when no GPU backend is available.
- Features configurable **frame-skipping** (default target: 24 FPS) to ensure the browser UI never freezes during live webcam streaming.

### Pretrained Weights
Weights can be placed in `models/RT-VTON/rtv_ckpts/` from Hugging Face:
```bash
git clone https://huggingface.co/wuzaiqiang/rtv_ckpts models/RT-VTON/rtv_ckpts
```
If weights are omitted, VESTORA activates its standalone neural warping engine to maintain 100% UI uptime.

---

## 2. CatV2TON (Video Virtual Try-On Engine)

- **Official Repository**: [https://github.com/Zheng-Chong/CatV2TON.git](https://github.com/Zheng-Chong/CatV2TON.git)
- **Paper**: *CatV2TON: Taming Diffusion Transformers for Vision-Based Virtual Try-On with Temporal Concatenation* (Zheng et al., 2025)
- **Local Directory**: `models/CatV2TON/`
- **Engine Module**: `backend/vton/engine/catv2ton_video_engine.py`
- **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/))

### Video Try-On Architecture
CatV2TON employs Diffusion Transformers (DiT) with temporal concatenation across video frames:
1. **Source Person Video / Camera**: Continuous stream of video frames.
2. **Temporal Concatenation**: Video frames concatenated along temporal dimension with garment condition.
3. **Repainting / Inpainting**: Clothing region is removed and replaced by the target garment, leaving face, hair, arms, and background completely untouched.
4. **Arm Occlusion & Depth**: Arms passing in front of or behind the torso are preserved naturally without artifacts.

---

## 3. CatVTON (Image Virtual Try-On Engine)

- **Official Repository**: [https://github.com/Zheng-Chong/CatVTON.git](https://github.com/Zheng-Chong/CatVTON.git)
- **Paper**: *CatVTON: Concatenation Is All You Need for Virtual Try-On with Diffusion Models* (Zheng et al., 2024)
- **Local Directory**: `models/CatVTON/`
- **Engine Module**: `backend/vton/engine/catvton_engine.py`
- **License**: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 4. Supported Universal Categories & Body Regions

VESTORA supports 28 universal apparel and accessory categories mapped to anatomical target regions:

| Category | Type Examples | Target Body Region |
|---|---|---|
| **Upper Body** | T-shirt, Shirt, Polo, Hoodie, Sweater, Jacket, Blazer, Coat, Kurta | Upper body, shoulders, chest, torso, arms (`torso_and_arms`) |
| **Lower Body** | Jeans, Trousers, Pants, Shorts, Skirt, Leggings | Waist, hips, thighs, calves, ankles (`waist_to_ankles`) |
| **Full Body** | Dress, Saree, Gown, Jumpsuit, Kurta set, Lehenga | Shoulders down to legs/feet (`shoulders_to_legs`) |
| **Footwear** | Shoes, Sneakers, Boots, Sandals, Loafers, Heels | Feet and ankles (`feet`) |
| **Accessories** | Watch, Smartwatch, Bracelet, Bangle | Left/Right Wrists (`wrist`) |
| **Jewelry** | Ring, Band | Individual fingers / hands (`hands_and_fingers`) |
| **Jewelry** | Necklace, Chain, Pendant, Choker | Neck and clavicle (`neck`) |
| **Jewelry** | Earrings, Studs, Hoops, Jhumkas | Left and right ears (`ears`) |
| **Eyewear** | Sunglasses, Glasses, Spectacles, Shades | Eyes and bridge of nose (`face_and_eyes`) |
| **Headwear** | Cap, Hat, Beanie, Fedora, Beret | Crown of head (`head`) |
| **Handwear** | Gloves, Mittens | Hands and fingers (`hands`) |
| **Bags** | Handbag, Tote, Backpack, Shoulder bag | Shoulders, waist, or hand carried |

---

## 5. Running Locally & API Endpoints

### Start VTON Backend Server
```bash
# From repository root:
python3 -m backend.vton.api.server
```

### Endpoints
- `POST /api/vton/try-on`: Modular try-on executing through active engine (`RT-VTON`, `CatVTON`, or `CatV2TON`).
- `POST /api/vton/frame`: Real-time streaming camera frames with frame-skipping and temporal stability.
- `POST /api/vton/engine/switch`: Hot-swap active engine without restarting server.
- `GET  /api/vton/engines`: Lists all registered engines and active status.
- `GET  /api/vton/status`: Current engine readiness and hardware acceleration.
- `POST /api/classify-garment`: Classifies apparel into category, garment type, and target body region.
- `POST /api/extract-garment`: Extracts complete garment (sleeves, collar, cuffs, buttons, patterns) without background.

---

## 6. Licensing & Commercial Deployment Notice

- **RT-VTON**: Custom Apache 2.0 (Non-Commercial Use Only).
- **CatVTON / CatV2TON**: CC BY-NC-SA 4.0 (Non-Commercial).
- **Commercial Deployment**: VESTORA isolates all models behind `VTONEngine` and `VTONEngineManager`. To deploy commercially, simply hot-swap the active engine to an Apache 2.0 or MIT model without altering any frontend extension code or product detection logic.
