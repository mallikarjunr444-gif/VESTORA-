# VESTORA — Third-Party Model & Software Licenses

This document records the licenses of all integrated neural virtual try-on models and dependencies in the VESTORA ecosystem.

---

## 1. RT-VTON (Real-Time Virtual Try-On)

- **Repository**: [https://github.com/ZaiqiangWu/RTV.git](https://github.com/ZaiqiangWu/RTV.git)
- **Local Directory**: `models/RT-VTON/`
- **Engine Interface**: `backend/vton/engine/rt_vton_engine.py`
- **License**: Academic & Non-Commercial Research Use Only.
- **Commercial Permitted**: No.
- **Summary**: Lightweight real-time virtual try-on model using flow deformation and synthesis.

---

## 2. CatVTON (Diffusion Image Virtual Try-On)

- **Repository**: [https://github.com/Zheng-Chong/CatVTON.git](https://github.com/Zheng-Chong/CatVTON.git)
- **Local Directory**: `models/CatVTON/`
- **Engine Interface**: `backend/vton/engine/catvton_engine.py`
- **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/))
- **Commercial Permitted**: No.
- **Summary**: High-resolution image-based diffusion try-on with clothing replacement.

---

## 3. CatV2TON (Video Virtual Try-On with Temporal Concatenation)

- **Repository**: [https://github.com/Zheng-Chong/CatV2TON.git](https://github.com/Zheng-Chong/CatV2TON.git)
- **Local Directory**: `models/CatV2TON/`
- **Engine Interface**: `backend/vton/engine/catv2ton_video_engine.py`
- **License**: Creative Commons Attribution-NonCommercial-ShareAlike 4.0 International ([CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/))
- **Commercial Permitted**: No.
- **Summary**: DiT-based video virtual try-on with temporal frame concatenation.

---

## 4. Architectural Isolation & Commercial Compliance

VESTORA isolates all models behind the abstract `VTONEngine` interface (`backend/vton/engine/base_engine.py`) and the `VTONEngineManager` (`backend/vton/engine/engine_manager.py`). 

To deploy VESTORA commercially:
1. Hot-swap the active engine to an Apache 2.0, MIT, or custom-licensed proprietary model.
2. The browser extension, product detection, garment extraction, and UI pipelines remain 100% untouched.
