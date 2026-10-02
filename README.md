# VESTORA — Real-Time AI Virtual Try-On Chrome Extension

> **Wear What You Imagine.**

VESTORA is a high-performance, privacy-first Manifest V3 Chrome extension for real-time virtual try-on on any online fashion store.

---

## 🏗️ Project Architecture (Phase 1 Foundation)

```text
vestora/
├── extension/                       # Chrome Extension Source
│   ├── manifest.json                # Manifest V3 Configuration
│   ├── background/
│   │   └── service-worker.ts        # Service worker (lifecycle, settings, CORS bypass)
│   ├── content/
│   │   ├── product-detector.ts      # Main DOM scanner & mutation observer
│   │   ├── product-extractor.ts     # Normalized Product model extractor
│   │   ├── tryon-button.ts          # Non-destructive "Try with VESTORA" button
│   │   └── page-adapter.ts          # Image heuristics & skip filters
│   ├── popup/
│   │   ├── popup.html               # Extension action popup
│   │   ├── popup.ts                 # Popup controller & hardware inspection
│   │   └── popup.css                # Dark luxury fashion-tech styling
│   ├── assets/
│   │   ├── logo/
│   │   │   └── vestora-logo.png     # Official high-resolution transparent wordmark
│   │   └── icons/
│   │       ├── icon16.png           # 16x16 3D metallic VESTORA icon
│   │       ├── icon32.png           # 32x32 3D metallic VESTORA icon
│   │       ├── icon48.png           # 48x48 3D metallic VESTORA icon
│   │       └── icon128.png          # 128x128 3D metallic VESTORA icon
│   └── styles/
│       └── overlay.css              # Injected button and feedback toast styling
│
├── engine/                          # Modular VTO Engine Interfaces (Zero-Vendor Lock-in)
│   ├── tracking/                    # Pose & body landmark abstraction (PoseEngine)
│   ├── segmentation/                # Person & garment segmentation (SegmentationEngine)
│   ├── garment/                     # Garment representation & cutout pipeline
│   ├── rendering/                   # GPU / WebGPU / Canvas 2D render loop
│   └── temporal/                    # Motion smoothing & temporal stabilization
│
├── shared/                          # Shared Contracts & Constants
│   ├── types/                       # Strictly typed Product, Garment, Pose, Settings
│   ├── constants/                   # Brand tokens, storage keys, FPS targets
│   └── utilities/                   # Structured logger
│
├── tests/                           # Automated Verification Suite
│   └── foundation.test.js           # 26/26 automated MV3 & contract tests
│
├── dist/                            # Compiled Manifest V3 Extension (Ready for Chrome)
├── build.mjs                        # esbuild compilation script
├── tsconfig.json                    # Strict TypeScript configuration
└── package.json
```

---

## 🚀 Quick Start & Development

### 1. Install Dependencies
```bash
npm install
```

### 2. Type Check
```bash
npm run typecheck
```

### 3. Build Extension
```bash
npm run build
```
Or run in development watch mode:
```bash
npm run dev
```

### 4. Run Automated Test Suite
```bash
npm test
```

---

## 📦 How to Load in Chrome

1. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
2. Enable **Developer mode** using the toggle switch in the top-right corner.
3. Click the **Load unpacked** button in the top-left corner.
4. Select the **`dist`** folder located at:
   ```text
   /Users/malikarjunr/Downloads/VESTORA/dist
   ```
5. **VESTORA: Real-Time AI Virtual Try-On** will appear in your extensions list.
6. Click the VESTORA icon in the Chrome toolbar to open the popup, check camera and performance status, or open any fashion shopping site to see the "Try with VESTORA" button overlay.
