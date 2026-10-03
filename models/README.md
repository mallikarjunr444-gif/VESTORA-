# VESTORA Open-Source Virtual Try-On (VTON) Models

This directory contains open-source virtual try-on neural model weights, architectures, and pipelines integrated into the VESTORA ecosystem.

---

## Model Comparison Matrix

| Feature | CatVTON | CatV2TON |
|---|---|---|
| **Repository** | [github.com/Zheng-Chong/CatVTON](https://github.com/Zheng-Chong/CatVTON.git) | [github.com/Zheng-Chong/CatV2TON](https://github.com/Zheng-Chong/CatV2TON.git) |
| **Input** | Person image + Garment image | Live Person camera video/frames + Garment |
| **Output** | High-resolution try-on image | Real-time continuous try-on video stream |
| **Temporal Consistency** | N/A (single frame) | Native DiT Temporal Concatenation + EMA smoothing |
| **Movement Handling** | Static pose | Dynamic turns, raising arms, body movement |
| **Clothing Replacement** | Replaces original clothes via inpaint mask | Replaces original clothes via temporal video inpainting |
| **Target Role in VESTORA** | High-fidelity image snapshot & catalog try-on | Live webcam / camera stream real-time virtual fitting room |
| **Hardware** | Apple Silicon MPS / CUDA / CPU fallback | Apple Silicon MPS / CUDA / CPU fallback |
| **License** | CC BY-NC-SA 4.0 | CC BY-NC-SA 4.0 |
| **Commercial Use** | Non-Commercial Only | Non-Commercial Only |

---

## 1. CatV2TON (Video Virtual Try-On Engine)

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

### Apple Silicon (M5 Mac) Adaptation
The official upstream scripts (`eval_video_try_on.py`) hardcode CUDA calls (`.cuda()`, `Generator(device='cuda')`).
VESTORA provides an automatic device adapter in `backend/vton/engine/catv2ton_video_engine.py`:
- Automatically detects `torch.backends.mps.is_available()`.
- Uses `device="mps"` for neural tensor acceleration on Apple Silicon GPUs without crashing.
- Falls back to `cpu` with quantized inference when neither MPS nor CUDA is active.

---

## 2. CatVTON (Image Virtual Try-On Engine)

- **Official Repository**: [https://github.com/Zheng-Chong/CatVTON.git](https://github.com/Zheng-Chong/CatVTON.git)
- **Paper**: *CatVTON: Concatenation Is All You Need for Virtual Try-On with Diffusion Models* (Zheng et al., 2024)
- **Local Directory**: `models/CatVTON/`
- **Engine Module**: `backend/vton/engine/catvton_engine.py`
- **License**: [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)

---

## 3. Supported Universal Categories & Body Regions

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

## 4. Running Locally

### Start VTON Backend Server
```bash
# From repository root:
python3 -m backend.vton.api.server
```

### Endpoints
- `POST /api/tryon`: High-resolution single image virtual try-on.
- `POST /api/tryon/video-frame`: Frame-by-frame live camera stream with temporal consistency.
- `POST /api/engine/switch`: Switch active engine (`catv2ton` vs `catvton`).
- `POST /api/classify-garment`: Classifies apparel into category, garment type, and target body region.
- `POST /api/extract-garment`: Extracts complete garment (including collar, sleeves, cuffs, buttons, patterns) without background.
- `GET /api/tryon/status`: Engine readiness, active model metadata, and acceleration device.
- `GET /api/health`: Healthcheck.

---

## 5. Licensing & Commercial Deployment Notice

Both **CatVTON** and **CatV2TON** are released under **CC BY-NC-SA 4.0** (Non-Commercial). 
- Permitted for personal, research, educational, and internal evaluation purposes.
- For commercial distribution or software-as-a-service (SaaS) offerings, VESTORA's modular `BaseVTONEngine` interface allows hot-swapping commercial models (e.g. Apache-2.0 or proprietary licensed weights) without modifying the frontend extension or product detection pipelines.
