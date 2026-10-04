/**
 * VESTORA — Direct DOM Fitting Room Panel
 *
 * Renders the try-on UI directly into the page DOM via Shadow DOM.
 * This is the ONLY reliable way to get camera access on all websites —
 * iframes block getUserMedia on many sites due to CSP/Feature-Policy.
 *
 * Architecture: Shadow DOM host → shadowRoot → full fitting room UI
 * Camera stream: content script context (always permitted by Chrome)
 */

import type { Product } from "../../shared/types/index.js";
import { RealTimePoseTracker } from "../../engine/tracking/real-time-pose-tracker.js";
import { InHouseVTONEngine } from "../../engine/rendering/in-house-vton.js";

const inHouseVton = new InHouseVTONEngine();
const poseTracker = new RealTimePoseTracker();

const PANEL_HOST_ID = "vestora-panel-host";
const PANEL_WIDTH = 420;

// ── Garment overlay state ──────────────────────────────────────────────────
interface OutfitLayer {
  id: string;
  name: string;
  category: string;
  garmentCategory: string;
  imageUrl: string;
  enabled: boolean;
  scale: number;
  offsetY: number;
  opacity: number;
  imageElement: HTMLImageElement | null;
  processedCanvas: HTMLCanvasElement | HTMLImageElement | null;
  availableSizes: string[];
}

const POSE_LANDMARK = {
  NOSE: 0, LEFT_EYE: 1, RIGHT_EYE: 2, LEFT_EAR: 3, RIGHT_EAR: 4,
  LEFT_SHOULDER: 5, RIGHT_SHOULDER: 6, LEFT_ELBOW: 7, RIGHT_ELBOW: 8,
  LEFT_WRIST: 9, RIGHT_WRIST: 10, LEFT_HIP: 11, RIGHT_HIP: 12,
  LEFT_KNEE: 13, RIGHT_KNEE: 14, LEFT_ANKLE: 15, RIGHT_ANKLE: 16,
  HEAD_CROWN: 17, NECK: 18,
};

const SIZE_CHART: Record<string, { shoulder: [number, number]; chest: [number, number]; waist: [number, number] }> = {
  XS: { shoulder: [36, 39], chest: [81, 87], waist: [66, 72] },
  S:  { shoulder: [39, 42], chest: [87, 93], waist: [72, 78] },
  M:  { shoulder: [42, 45], chest: [93, 99], waist: [78, 84] },
  L:  { shoulder: [45, 48], chest: [99, 107], waist: [84, 92] },
  XL: { shoulder: [48, 52], chest: [107, 115], waist: [92, 100] },
  XXL:{ shoulder: [52, 56], chest: [115, 124], waist: [100, 110] },
};

const SAMPLE_GARMENTS = [
  { name: "Oversized Minimalist Jacket", category: "Jacket", garmentCategory: "upper_body",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["S","M","L","XL"] },
  { name: "Streetwear Graphic Hoodie", category: "Hoodie", garmentCategory: "upper_body",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["M","L","XL","XXL"] },
  { name: "Classic Aviator Sunglasses", category: "Sunglasses", garmentCategory: "eyewear",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["One Size"] },
  { name: "Urban Snapback Cap", category: "Hat", garmentCategory: "headwear",
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["One Size"] },
];
let sampleIndex = 0;

// ── Panel singleton state ──────────────────────────────────────────────────
let panelHost: HTMLElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let cameraStream: MediaStream | null = null;
let animFrameId: number | null = null;
let activeOutfit: OutfitLayer[] = [];
let fitOpacity = 0.88;
let fitScale = 1.0;
let fitOffsetY = 0;
let currentFacing: "user" | "environment" = "user";
let isBodyDetected = false;
let showFitPanel = false;

// Shadow DOM element refs
let videoEl: HTMLVideoElement | null = null;
let canvasEl: HTMLCanvasElement | null = null;
let ctx: CanvasRenderingContext2D | null = null;
let cameraBlockedEl: HTMLElement | null = null;
let productNameEl: HTMLElement | null = null;
let productCategoryEl: HTMLElement | null = null;
let productThumbEl: HTMLImageElement | null = null;
let outfitListEl: HTMLElement | null = null;
let outfitCountEl: HTMLElement | null = null;
let measShoulderEl: HTMLElement | null = null;
let measChestEl: HTMLElement | null = null;
let measWaistEl: HTMLElement | null = null;
let measTorsoEl: HTMLElement | null = null;
let recSizeEl: HTMLElement | null = null;
let sizeOptionsEl: HTMLElement | null = null;
let fitPanelEl: HTMLElement | null = null;
let fitScaleValEl: HTMLElement | null = null;
let fitOpacitySliderEl: HTMLInputElement | null = null;
let toastEl: HTMLElement | null = null;

// ── CSS ────────────────────────────────────────────────────────────────────
const PANEL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  /* ── Panel Shell ── */
  .v-panel {
    position: fixed;
    left: 0;
    top: 0;
    bottom: 0;
    width: ${PANEL_WIDTH}px;
    z-index: 2147483646;
    display: flex;
    flex-direction: column;
    background: #0a0b10;
    border-right: 1px solid rgba(139, 92, 246, 0.35);
    box-shadow: 4px 0 40px rgba(0,0,0,0.8), 0 0 30px rgba(139,92,246,0.2);
    transform: translateX(-100%);
    transition: transform 0.38s cubic-bezier(0.16, 1, 0.3, 1);
    overflow: hidden;
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  }
  .v-panel.is-open {
    transform: translateX(0);
  }

  /* ── Top Bar ── */
  .v-topbar {
    flex-shrink: 0;
    height: 52px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    background: rgba(13, 15, 24, 0.98);
    border-bottom: 1px solid rgba(255,255,255,0.06);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    gap: 10px;
  }
  .v-brand {
    display: flex;
    align-items: center;
    gap: 7px;
    flex-shrink: 0;
  }
  .v-brand-sparkle {
    width: 22px;
    height: 22px;
    background: linear-gradient(135deg, #7c3aed, #a855f7);
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    box-shadow: 0 0 10px rgba(139,92,246,0.5);
    color: #fff;
  }
  .v-brand-name {
    font-size: 14px;
    font-weight: 800;
    letter-spacing: 0.12em;
    background: linear-gradient(135deg, #c084fc, #818cf8);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }
  .v-free-badge {
    font-size: 8.5px;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: #10b981;
    background: rgba(16,185,129,0.12);
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 9999px;
    padding: 2px 7px;
  }
  .v-mode-switch {
    display: flex;
    background: rgba(255,255,255,0.05);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 8px;
    padding: 2px;
    gap: 2px;
    flex-shrink: 0;
  }
  .v-mode-btn {
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    color: #64748b;
    background: transparent;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    font-family: inherit;
  }
  .v-mode-btn.active {
    background: rgba(139,92,246,0.25);
    color: #c084fc;
  }
  .v-topbar-actions {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
  }
  .v-icon-btn {
    width: 30px;
    height: 30px;
    border-radius: 8px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #94a3b8;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.15s;
    flex-shrink: 0;
    padding: 0;
  }
  .v-icon-btn:hover { background: rgba(255,255,255,0.12); color: #fff; }
  .v-icon-btn.close-btn:hover { background: rgba(239,68,68,0.2); color: #f87171; }
  .v-icon-btn svg { width: 15px; height: 15px; display: block; }

  /* ── Camera Viewport ── */
  .v-viewport {
    position: relative;
    flex-shrink: 0;
    width: 100%;
    aspect-ratio: 4 / 3;
    background: #050508;
    overflow: hidden;
  }
  .v-camera-video {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .v-garment-canvas {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }

  .v-camera-blocked {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(5,5,10,0.95);
    flex-direction: column;
    gap: 10px;
    padding: 24px;
    text-align: center;
    z-index: 5;
  }
  .v-camera-blocked.hidden { display: none; }
  .v-camera-blocked-icon { font-size: 32px; }
  .v-camera-blocked h3 { font-size: 14px; font-weight: 700; color: #f1f5f9; }
  .v-camera-blocked p { font-size: 11px; color: #64748b; line-height: 1.6; max-width: 280px; }
  .v-cam-fallback-btn {
    padding: 8px 18px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
    background: linear-gradient(135deg, #7c3aed, #9333ea);
    color: #fff;
    margin-top: 4px;
    transition: filter 0.2s;
    font-family: inherit;
  }
  .v-cam-fallback-btn:hover { filter: brightness(1.15); }
  .v-cam-fallback-btn.outline {
    background: transparent;
    border: 1px solid rgba(139,92,246,0.5);
    color: #a78bfa;
  }

  .v-detect-ring {
    position: absolute;
    top: 10px;
    left: 10px;
    display: flex;
    align-items: center;
    gap: 5px;
    background: rgba(0,0,0,0.6);
    backdrop-filter: blur(6px);
    border-radius: 9999px;
    padding: 3px 9px 3px 5px;
    font-size: 10px;
    font-weight: 600;
    color: #4ade80;
    z-index: 4;
    pointer-events: none;
  }
  .v-detect-ring.detecting { color: #f59e0b; }
  .ring-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: currentColor;
    animation: pulse-dot 1.4s ease-in-out infinite;
    flex-shrink: 0;
  }
  @keyframes pulse-dot {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.4; transform: scale(0.65); }
  }

  .v-viewport::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 40px;
    background: linear-gradient(to bottom, rgba(10,11,16,0.5), transparent);
    z-index: 2;
    pointer-events: none;
  }

  /* ── Drop Zone Overlay ── */
  .v-drop-overlay {
    position: absolute;
    inset: 0;
    background: rgba(8, 10, 16, 0.88);
    border: 2px dashed #818cf8;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    backdrop-filter: blur(8px);
    transition: all 0.2s ease;
    pointer-events: none;
  }
  .v-drop-overlay.hidden { display: none; }
  .v-drop-card {
    text-align: center;
    padding: 20px 24px;
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    border-radius: 16px;
    box-shadow: 0 12px 32px rgba(0, 0, 0, 0.5);
  }
  .v-drop-icon { font-size: 30px; margin-bottom: 6px; }
  .v-drop-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
  .v-drop-sub { font-size: 11px; color: rgba(255, 255, 255, 0.65); }

  /* ── Toast ── */
  .v-toast {
    position: absolute;
    bottom: 10px;
    left: 10px;
    right: 10px;
    padding: 9px 13px;
    background: rgba(13,15,26,0.96);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(139,92,246,0.4);
    border-radius: 9px;
    font-size: 11px;
    color: #f1f5f9;
    display: flex;
    align-items: center;
    gap: 7px;
    opacity: 0;
    transform: translateY(6px);
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    pointer-events: none;
    z-index: 20;
  }
  .v-toast.visible { opacity: 1; transform: translateY(0); }
  .v-toast-icon { color: #c084fc; font-size: 12px; flex-shrink: 0; }

  /* ── Scrollable Bottom Panel ── */
  .v-bottom {
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    scrollbar-width: thin;
    scrollbar-color: rgba(139,92,246,0.3) transparent;
  }
  .v-bottom::-webkit-scrollbar { width: 4px; }
  .v-bottom::-webkit-scrollbar-thumb { background: rgba(139,92,246,0.3); border-radius: 4px; }

  /* ── Product Strip ── */
  .v-product-strip {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: rgba(15,17,28,0.8);
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .v-product-thumb {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    object-fit: cover;
    border: 1px solid rgba(139,92,246,0.3);
    background: #1e1b4b;
    flex-shrink: 0;
  }
  .v-product-info { flex: 1; min-width: 0; }
  .v-product-name { font-size: 12px; font-weight: 600; color: #f1f5f9; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v-product-cat { font-size: 10px; color: #64748b; margin-top: 1px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v-strip-actions { display: flex; gap: 5px; flex-shrink: 0; }
  .v-pill-btn {
    padding: 5px 10px;
    border-radius: 9999px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.03em;
    cursor: pointer;
    border: 1px solid rgba(139,92,246,0.4);
    background: rgba(139,92,246,0.1);
    color: #c084fc;
    transition: all 0.2s;
    white-space: nowrap;
    font-family: inherit;
  }
  .v-pill-btn:hover { background: rgba(139,92,246,0.25); border-color: rgba(139,92,246,0.7); }
  .v-pill-btn.grab { background: linear-gradient(135deg, rgba(124,58,237,0.3),rgba(99,102,241,0.3)); border-color: rgba(139,92,246,0.6); color: #e0d4ff; }
  .v-pill-btn.sample { border-color: rgba(99,102,241,0.3); color: #818cf8; }

  /* ── Sections ── */
  .v-section {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .v-section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 8px;
  }
  .v-section-title {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 10px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
    letter-spacing: 0.09em;
  }
  .v-sparkle { color: #a78bfa; }
  .v-count-badge {
    font-size: 10px;
    font-weight: 600;
    color: #a78bfa;
    background: rgba(139,92,246,0.12);
    border-radius: 9999px;
    padding: 1px 7px;
  }
  .v-section-actions { display: flex; gap: 5px; }
  .v-text-btn {
    font-size: 10px;
    font-weight: 600;
    color: #475569;
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;
    transition: color 0.2s;
    font-family: inherit;
  }
  .v-text-btn:hover { color: #94a3b8; }
  .v-text-btn.add { color: #a78bfa; }
  .v-text-btn.add:hover { color: #c084fc; }

  .v-outfit-list { display: flex; flex-direction: column; gap: 4px; }
  .v-outfit-empty { font-size: 11px; color: #334155; text-align: center; padding: 10px 0; line-height: 1.5; }

  .v-layer-card {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 7px 8px;
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.06);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.15s;
  }
  .v-layer-card:hover { background: rgba(255,255,255,0.06); border-color: rgba(139,92,246,0.3); }
  .v-layer-card.disabled { opacity: 0.4; }
  .v-layer-thumb { width: 34px; height: 34px; border-radius: 6px; object-fit: cover; background: #1e1b4b; flex-shrink: 0; }
  .v-layer-info { flex: 1; min-width: 0; }
  .v-layer-cat { font-size: 9px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: #a78bfa; }
  .v-layer-name { font-size: 11px; font-weight: 500; color: #e2e8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .v-layer-btns { display: flex; gap: 3px; }
  .v-layer-btn {
    width: 22px; height: 22px;
    border-radius: 5px;
    border: 1px solid rgba(255,255,255,0.08);
    background: rgba(255,255,255,0.04);
    color: #64748b;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 11px; font-weight: 700;
    transition: all 0.15s; padding: 0; font-family: inherit;
  }
  .v-layer-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }
  .v-layer-btn.remove:hover { background: rgba(239,68,68,0.2); color: #f87171; border-color: rgba(239,68,68,0.3); }
  .v-layer-btn.on { color: #4ade80; border-color: rgba(74,222,128,0.3); }

  /* ── Fit Controls ── */
  .v-fit-panel {
    padding: 10px 14px;
    border-bottom: 1px solid rgba(255,255,255,0.04);
    display: none;
    flex-direction: column;
    gap: 8px;
    background: rgba(8,9,16,0.8);
  }
  .v-fit-panel.open { display: flex; }
  .v-fit-row { display: flex; align-items: center; gap: 8px; }
  .v-fit-label { font-size: 10px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; width: 52px; flex-shrink: 0; }
  .v-fit-val { font-size: 11px; font-weight: 700; color: #c084fc; width: 36px; text-align: center; }
  .v-fit-btn {
    width: 26px; height: 26px; border-radius: 6px;
    border: 1px solid rgba(255,255,255,0.1);
    background: rgba(255,255,255,0.05);
    color: #94a3b8; font-size: 14px; cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; transition: all 0.15s; padding: 0; font-family: inherit;
  }
  .v-fit-btn:hover { background: rgba(139,92,246,0.2); color: #c084fc; border-color: rgba(139,92,246,0.4); }
  .v-fit-reset {
    padding: 3px 10px; border-radius: 6px; font-size: 10px; font-weight: 600;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.04);
    color: #64748b; cursor: pointer; transition: all 0.15s; margin-left: auto; font-family: inherit;
  }
  .v-fit-reset:hover { color: #94a3b8; }
  .v-opacity-slider { flex: 1; accent-color: #7c3aed; cursor: pointer; }

  /* ── Size Engine ── */
  .v-meas-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 6px; margin-bottom: 10px;
  }
  .v-meas-item {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 7px; padding: 7px 10px;
    display: flex; flex-direction: column; gap: 2px;
  }
  .v-meas-label { font-size: 9px; font-weight: 600; color: #475569; text-transform: uppercase; letter-spacing: 0.06em; }
  .v-meas-val { font-size: 13px; font-weight: 700; color: #c084fc; }
  .v-rec-size {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(135deg, rgba(124,58,237,0.15), rgba(99,102,241,0.15));
    border: 1px solid rgba(139,92,246,0.3); border-radius: 9px; padding: 8px 14px; margin-bottom: 8px;
  }
  .v-rec-label { font-size: 10px; font-weight: 600; color: #94a3b8; }
  .v-rec-val { font-size: 18px; font-weight: 800; color: #a78bfa; }
  .v-sizes-row { display: flex; flex-wrap: wrap; gap: 5px; }
  .v-size-pill {
    padding: 5px 12px; border-radius: 7px; font-size: 11px; font-weight: 600;
    border: 1px solid rgba(255,255,255,0.08); background: rgba(255,255,255,0.03);
    color: #64748b; cursor: pointer; transition: all 0.15s; font-family: inherit;
  }
  .v-size-pill:hover { border-color: rgba(139,92,246,0.4); color: #a78bfa; }
  .v-size-pill.rec { border-color: rgba(139,92,246,0.6); background: rgba(139,92,246,0.15); color: #c084fc; font-weight: 700; }
  .v-size-pill.selected { background: #7c3aed; border-color: #7c3aed; color: #fff; }

  /* ── Hint / Footer ── */
  .v-hint-strip { padding: 8px 14px; font-size: 10px; color: #334155; text-align: center; line-height: 1.5; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .v-hint-strip strong { color: #6d28d9; }
  .v-footer {
    flex-shrink: 0; padding: 8px 14px;
    display: flex; align-items: center; justify-content: space-between;
    background: rgba(7,8,12,0.9); border-top: 1px solid rgba(255,255,255,0.05);
  }
  .v-footer-privacy { font-size: 9px; color: #1e293b; }
  .v-footer-brand { font-size: 9px; font-weight: 800; color: #3730a3; letter-spacing: 0.1em; }

  /* ── Toggle Tab (collapsed state) ── */
  .v-toggle-tab {
    position: fixed;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    z-index: 2147483645;
    background: linear-gradient(180deg, #7c3aed, #9333ea);
    color: #fff;
    border: none;
    border-radius: 0 12px 12px 0;
    padding: 16px 7px;
    cursor: pointer;
    box-shadow: 3px 0 20px rgba(124,58,237,0.55);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    font-family: inherit;
    transition: opacity 0.2s, box-shadow 0.2s;
  }
  .v-toggle-tab:hover { box-shadow: 4px 0 28px rgba(124,58,237,0.8); }
  .v-toggle-tab.hidden { display: none; }
  .v-toggle-sparkle { font-size: 13px; }
  .v-toggle-text {
    font-size: 8px; font-weight: 800; letter-spacing: 0.2em; text-transform: uppercase;
    writing-mode: vertical-rl; text-orientation: mixed; transform: rotate(180deg);
  }
`;

// ── HTML template ──────────────────────────────────────────────────────────
function buildPanelHTML(): string {
  return `
    <div class="v-panel" id="v-panel">
      <div class="v-topbar">
        <div class="v-brand">
          <div class="v-brand-sparkle">✦</div>
          <span class="v-brand-name">VESTORA</span>
          <span class="v-free-badge">FREE</span>
        </div>
        <div class="v-mode-switch">
          <button class="v-mode-btn active" id="v-btn-camera" type="button">📷 Live</button>
          <button class="v-mode-btn" id="v-btn-photo" type="button">📸 Photo</button>
        </div>
        <div class="v-topbar-actions">
          <button class="v-icon-btn" id="v-btn-flip" title="Flip Camera">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 3h5v5"/><path d="M8 21H3v-5"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/></svg>
          </button>
          <button class="v-icon-btn" id="v-btn-fit" title="Adjust Fit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6"/></svg>
          </button>
          <button class="v-icon-btn" id="v-btn-screenshot" title="Screenshot">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
          <button class="v-icon-btn close-btn" id="v-btn-close" title="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      </div>

      <div class="v-viewport" id="v-viewport">
        <video id="v-video" class="v-camera-video" autoplay playsinline muted></video>
        <canvas id="v-canvas" class="v-garment-canvas"></canvas>
        <div class="v-drop-overlay hidden" id="v-drop-overlay">
          <div class="v-drop-card">
            <div class="v-drop-icon">✨</div>
            <div class="v-drop-title">Drop Garment to Try On</div>
            <div class="v-drop-sub">Drag any clothing photo from the page here</div>
          </div>
        </div>
        <div class="v-detect-ring detecting" id="v-detect-ring">
          <div class="ring-dot"></div>
          <span id="v-detect-label">Starting camera…</span>
        </div>
        <div class="v-camera-blocked hidden" id="v-camera-blocked">
          <div class="v-camera-blocked-icon">📷</div>
          <h3>Camera Access Needed</h3>
          <p id="v-camera-error-msg">Click the padlock icon in your browser bar → allow Camera → press Retry.</p>
          <button class="v-cam-fallback-btn" id="v-btn-retry-cam">↺ Retry Camera</button>
          <button class="v-cam-fallback-btn outline" id="v-btn-use-photo">📸 Use Photo Instead</button>
        </div>
        <div class="v-toast" id="v-toast">
          <span class="v-toast-icon">✦</span>
          <span id="v-toast-text"></span>
        </div>
      </div>

      <div class="v-bottom" id="v-bottom">
        <div class="v-product-strip">
          <img id="v-product-thumb" class="v-product-thumb" src="" alt="Product" style="display:none"/>
          <div class="v-product-info">
            <div id="v-product-name" class="v-product-name">Ready for Try-On</div>
            <div id="v-product-cat" class="v-product-cat">Select any fashion item on the page</div>
          </div>
          <div class="v-strip-actions">
            <button class="v-pill-btn grab" id="v-btn-grab">✦ Grab</button>
            <button class="v-pill-btn sample" id="v-btn-sample">▶ Sample</button>
          </div>
        </div>

        <div class="v-section">
          <div class="v-section-header">
            <div class="v-section-title">
              <span class="v-sparkle">✦</span> Active Outfit
              <span class="v-count-badge" id="v-outfit-count">0</span>
            </div>
            <div class="v-section-actions">
              <button class="v-text-btn add" id="v-btn-add">+ Add</button>
              <button class="v-text-btn" id="v-btn-clear">Clear</button>
            </div>
          </div>
          <div class="v-outfit-list" id="v-outfit-list">
            <div class="v-outfit-empty">No items loaded yet. Try a sample or grab from the page.</div>
          </div>
        </div>

        <div class="v-fit-panel" id="v-fit-panel">
          <div class="v-fit-row">
            <span class="v-fit-label">Scale</span>
            <button class="v-fit-btn" id="v-fit-scale-down">−</button>
            <span class="v-fit-val" id="v-fit-scale-val">100%</span>
            <button class="v-fit-btn" id="v-fit-scale-up">+</button>
            <button class="v-fit-reset" id="v-fit-reset">Reset</button>
          </div>
          <div class="v-fit-row">
            <span class="v-fit-label">Height</span>
            <button class="v-fit-btn" id="v-fit-up">▲</button>
            <button class="v-fit-btn" id="v-fit-down">▼</button>
          </div>
          <div class="v-fit-row">
            <span class="v-fit-label">Opacity</span>
            <input type="range" class="v-opacity-slider" id="v-opacity-slider" min="30" max="100" value="88"/>
          </div>
        </div>

        <div class="v-section">
          <div class="v-section-title" style="margin-bottom:8px">📐 AI Size Recommendation</div>
          <div class="v-meas-grid">
            <div class="v-meas-item"><span class="v-meas-label">Shoulder</span><span class="v-meas-val" id="v-meas-shoulder">--</span></div>
            <div class="v-meas-item"><span class="v-meas-label">Chest</span><span class="v-meas-val" id="v-meas-chest">--</span></div>
            <div class="v-meas-item"><span class="v-meas-label">Waist</span><span class="v-meas-val" id="v-meas-waist">--</span></div>
            <div class="v-meas-item"><span class="v-meas-label">Torso</span><span class="v-meas-val" id="v-meas-torso">--</span></div>
          </div>
          <div class="v-rec-size">
            <span class="v-rec-label">Recommended Size</span>
            <span class="v-rec-val" id="v-rec-size">--</span>
          </div>
          <div class="v-sizes-row" id="v-sizes-row"></div>
        </div>

        <div class="v-hint-strip">💡 Hover any clothing image on this page → click <strong>✦ Try with VESTORA</strong></div>

        <div class="v-footer">
          <span class="v-footer-privacy">🔒 100% On-Device · No Video Upload</span>
          <span class="v-footer-brand">VESTORA</span>
        </div>
      </div>
    </div>

    <button class="v-toggle-tab hidden" id="v-toggle-tab" type="button">
      <span class="v-toggle-sparkle">✦</span>
      <span class="v-toggle-text">VESTORA</span>
    </button>

    <input type="file" id="v-photo-input" accept="image/*" style="display:none"/>
  `;
}

/**
 * Default entry point for "Try with VESTORA".
 *
 * The real try-on runs in the extension's own page (side panel / pop-out window,
 * tryon/tryon.html): there MediaPipe pose tracking, Decart HD Live, and ML garment
 * cutout work on every site. This in-page widget stays as a fallback if the
 * extension page cannot open.
 */
export function openVestoraPanel(product: Product): void {
  try {
    chrome.runtime.sendMessage({ type: "VESTORA_OPEN_SIDEPANEL", payload: product }, (resp?: { success?: boolean }) => {
      if (chrome.runtime.lastError || !resp?.success) openInPagePanel(product);
    });
    return;
  } catch {
    /* extension context unavailable -> fall back to the in-page widget */
  }
  openInPagePanel(product);
}

function openInPagePanel(product: Product): void {
  if (panelHost && shadowRoot) {
    addOutfitItem(product, false);
    showToast(`✦ Added ${product.name.slice(0, 28)}…`);
    return;
  }
  createPanel(product);
}

export function addProductToPanel(product: Product): void {
  if (!panelHost || !shadowRoot) { openVestoraPanel(product); return; }
  addOutfitItem(product, false);
  showToast(`✦ Added ${product.name.slice(0, 28)}…`);
}

// ── Panel creation ─────────────────────────────────────────────────────────

function createPanel(initialProduct?: Product) {
  document.getElementById(PANEL_HOST_ID)?.remove();
  stopCamera();

  panelHost = document.createElement("div");
  panelHost.id = PANEL_HOST_ID;
  // The host itself has no visual — all layout is in Shadow DOM
  panelHost.style.cssText = "position:fixed!important;inset:0!important;pointer-events:none!important;z-index:2147483646!important;";
  document.documentElement.appendChild(panelHost);

  shadowRoot = panelHost.attachShadow({ mode: "open" });

  const styleEl = document.createElement("style");
  styleEl.textContent = PANEL_CSS;
  shadowRoot.appendChild(styleEl);

  const container = document.createElement("div");
  container.innerHTML = buildPanelHTML();
  // Enable pointer events on the actual elements
  shadowRoot.appendChild(container);

  // Make the panel and tab clickable
  const panel = shadowRoot.getElementById("v-panel")!;
  panel.style.pointerEvents = "all";
  const toggleTab = shadowRoot.getElementById("v-toggle-tab")!;
  toggleTab.style.pointerEvents = "all";

  // Gather refs
  videoEl             = shadowRoot.getElementById("v-video")           as HTMLVideoElement;
  canvasEl            = shadowRoot.getElementById("v-canvas")          as HTMLCanvasElement;
  cameraBlockedEl     = shadowRoot.getElementById("v-camera-blocked")!;
  productNameEl       = shadowRoot.getElementById("v-product-name")!;
  productCategoryEl   = shadowRoot.getElementById("v-product-cat")!;
  productThumbEl      = shadowRoot.getElementById("v-product-thumb")   as HTMLImageElement;
  outfitListEl        = shadowRoot.getElementById("v-outfit-list")!;
  outfitCountEl       = shadowRoot.getElementById("v-outfit-count")!;
  measShoulderEl      = shadowRoot.getElementById("v-meas-shoulder")!;
  measChestEl         = shadowRoot.getElementById("v-meas-chest")!;
  measWaistEl         = shadowRoot.getElementById("v-meas-waist")!;
  measTorsoEl         = shadowRoot.getElementById("v-meas-torso")!;
  recSizeEl           = shadowRoot.getElementById("v-rec-size")!;
  sizeOptionsEl       = shadowRoot.getElementById("v-sizes-row")!;
  fitPanelEl          = shadowRoot.getElementById("v-fit-panel")!;
  fitScaleValEl       = shadowRoot.getElementById("v-fit-scale-val")!;
  fitOpacitySliderEl  = shadowRoot.getElementById("v-opacity-slider")  as HTMLInputElement;
  toastEl             = shadowRoot.getElementById("v-toast")!;
  ctx = canvasEl.getContext("2d", { desynchronized: true, alpha: true });

  // Slide in
  requestAnimationFrame(() => requestAnimationFrame(() => {
    panel.classList.add("is-open");
    toggleTab.classList.remove("hidden");
  }));

  wireEvents();
  if (initialProduct) addOutfitItem(initialProduct, true);
  initCamera("user");
}

// ── Event wiring ───────────────────────────────────────────────────────────

function wireEvents() {
  const root = shadowRoot!;
  const panel = root.getElementById("v-panel")!;
  const toggleTab = root.getElementById("v-toggle-tab")!;

  root.getElementById("v-btn-close")!.addEventListener("click", closePanel);

  toggleTab.addEventListener("click", () => {
    panel.classList.add("is-open");
    toggleTab.classList.add("hidden");
    if (!cameraStream) initCamera(currentFacing);
  });

  root.getElementById("v-btn-flip")!.addEventListener("click", () => {
    initCamera(currentFacing === "user" ? "environment" : "user");
  });

  root.getElementById("v-btn-fit")!.addEventListener("click", () => {
    showFitPanel = !showFitPanel;
    fitPanelEl!.classList.toggle("open", showFitPanel);
  });

  root.getElementById("v-btn-screenshot")!.addEventListener("click", takeScreenshot);
  root.getElementById("v-btn-retry-cam")!.addEventListener("click", () => {
    cameraBlockedEl!.classList.add("hidden");
    initCamera(currentFacing);
  });

  root.getElementById("v-btn-use-photo")!.addEventListener("click", () => {
    (root.getElementById("v-photo-input") as HTMLInputElement).click();
  });

  (root.getElementById("v-photo-input") as HTMLInputElement).addEventListener("change", (e) => {
    const file = (e.target as HTMLInputElement).files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        stopCamera();
        if (canvasEl) { canvasEl.width = img.naturalWidth; canvasEl.height = img.naturalHeight; }
        cameraBlockedEl!.classList.add("hidden");
        if (videoEl) videoEl.style.display = "none";
        isBodyDetected = true;
        showToast("✦ Photo loaded — try-on active!");
        startRenderLoop();
      };
      img.src = ev.target!.result as string;
    };
    reader.readAsDataURL(file);
  });

  root.getElementById("v-btn-grab")!.addEventListener("click", () => {
    showToast("Hover any clothing image → click ✦ Try with VESTORA");
  });
  root.getElementById("v-btn-sample")!.addEventListener("click", loadNextSample);
  root.getElementById("v-btn-add")!.addEventListener("click", () => {
    showToast("Hover any clothing image → click ✦ Try with VESTORA");
  });
  root.getElementById("v-btn-clear")!.addEventListener("click", () => {
    activeOutfit = [];
    renderOutfitList();
    showToast("Cleared all items");
  });

  root.getElementById("v-fit-scale-down")!.addEventListener("click", () => {
    fitScale = Math.max(0.5, fitScale - 0.05);
    applyFitToSelected();
    if (fitScaleValEl) fitScaleValEl.textContent = `${Math.round(fitScale * 100)}%`;
  });
  root.getElementById("v-fit-scale-up")!.addEventListener("click", () => {
    fitScale = Math.min(2.5, fitScale + 0.05);
    applyFitToSelected();
    if (fitScaleValEl) fitScaleValEl.textContent = `${Math.round(fitScale * 100)}%`;
  });
  root.getElementById("v-fit-up")!.addEventListener("click", () => { fitOffsetY -= 10; applyFitToSelected(); });
  root.getElementById("v-fit-down")!.addEventListener("click", () => { fitOffsetY += 10; applyFitToSelected(); });
  root.getElementById("v-fit-reset")!.addEventListener("click", () => {
    fitScale = 1.0; fitOffsetY = 0; fitOpacity = 0.88;
    if (fitScaleValEl) fitScaleValEl.textContent = "100%";
    if (fitOpacitySliderEl) fitOpacitySliderEl.value = "88";
    applyFitToSelected();
  });
  fitOpacitySliderEl!.addEventListener("input", (e) => {
    fitOpacity = parseInt((e.target as HTMLInputElement).value) / 100;
    applyFitToSelected();
  });

  root.getElementById("v-btn-camera")!.addEventListener("click", () => {
    root.getElementById("v-btn-camera")!.classList.add("active");
    root.getElementById("v-btn-photo")!.classList.remove("active");
    if (videoEl) videoEl.style.display = "block";
    if (!cameraStream) initCamera(currentFacing);
  });
  root.getElementById("v-btn-photo")!.addEventListener("click", () => {
    root.getElementById("v-btn-photo")!.classList.add("active");
    root.getElementById("v-btn-camera")!.classList.remove("active");
    (root.getElementById("v-photo-input") as HTMLInputElement).click();
  });

  // ── Drag and Drop Clothing Ingestion (Anywear Signature) ──
  const dropOverlay = root.getElementById("v-drop-overlay");
  let dragCounter = 0;

  panel.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    dropOverlay?.classList.remove("hidden");
  });

  panel.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    dropOverlay?.classList.remove("hidden");
  });

  panel.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      dropOverlay?.classList.add("hidden");
    }
  });

  panel.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragCounter = 0;
    dropOverlay?.classList.add("hidden");

    let droppedImageUrl: string | null = null;
    let droppedName = "Dropped Garment";

    // 1. Files drop (e.g. desktop image)
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        droppedName = file.name.replace(/\.[^/.]+$/, "");
        droppedImageUrl = await new Promise((res) => {
          const r = new FileReader();
          r.onload = () => res(r.result as string);
          r.readAsDataURL(file);
        });
      }
    }

    // 2. HTML snippet drop (dragged <img> from shopping site)
    if (!droppedImageUrl && e.dataTransfer) {
      const html = e.dataTransfer.getData("text/html");
      if (html) {
        try {
          const div = document.createElement("div");
          div.innerHTML = html;
          const img = div.querySelector("img");
          if (img) {
            droppedImageUrl = img.currentSrc || img.src || img.getAttribute("data-src") || img.getAttribute("data-zoom-src");
            if (img.alt) droppedName = img.alt.trim();
          }
        } catch {}
      }
    }

    // 3. URI list drop
    if (!droppedImageUrl && e.dataTransfer) {
      const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("URL");
      if (uri && (uri.startsWith("http") || uri.startsWith("data:image/"))) {
        droppedImageUrl = uri.trim().split("\n")[0];
      }
    }

    // 4. Plain text URL fallback
    if (!droppedImageUrl && e.dataTransfer) {
      const text = e.dataTransfer.getData("text/plain");
      if (text && (text.startsWith("http://") || text.startsWith("https://") || text.startsWith("data:image/"))) {
        droppedImageUrl = text.trim();
      }
    }

    if (droppedImageUrl) {
      const product: Product = {
        id: `drop_${Date.now()}`,
        name: droppedName,
        imageUrl: droppedImageUrl,
        category: "Clothing",
        garmentCategory: mapCategory(droppedName, "Clothing"),
        availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
      };
      addOutfitItem(product, true);
      showToast(`✦ Trying on: ${droppedName.slice(0, 24)}…`);
    } else {
      showToast("⚠ Could not detect clothing image from drop");
    }
  });

  // ESC to close
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && panelHost) closePanel();
  });
}

function applyFitToSelected() {
  activeOutfit.filter(l => l.enabled).forEach(l => {
    l.scale = fitScale; l.offsetY = fitOffsetY; l.opacity = fitOpacity;
  });
}

function loadNextSample() {
  const s = SAMPLE_GARMENTS[sampleIndex % SAMPLE_GARMENTS.length];
  sampleIndex++;
  addOutfitItem({
    id: `sample_${Date.now()}`, name: s.name, category: s.category,
    brand: "VESTORA Sample", imageUrl: s.imageUrl, productUrl: "", pageUrl: "",
    isFashion: true, availableSizes: s.availableSizes, outOfStockSizes: [],
    confidence: 1.0, detectionSource: "dom-heuristic",
    garmentCategory: s.garmentCategory,
  } as unknown as Product, false);
}

// ── Close ──────────────────────────────────────────────────────────────────

function closePanel() {
  const panel = shadowRoot?.getElementById("v-panel");
  const toggleTab = shadowRoot?.getElementById("v-toggle-tab");
  if (!panel) return;
  panel.classList.remove("is-open");
  toggleTab?.classList.add("hidden");
  setTimeout(() => {
    stopCamera();
    poseTracker.reset();
    inHouseVton.reset();
    panelHost?.remove();
    panelHost = null;
    shadowRoot = null;
    activeOutfit = [];
    isBodyDetected = false;
  }, 420);
}

// ── Camera ─────────────────────────────────────────────────────────────────

async function initCamera(facingMode: "user" | "environment") {
  stopCamera();
  cameraBlockedEl?.classList.add("hidden");
  setDetectRing(true, "Starting camera…");

  // Use window.navigator explicitly (content script context, not page context)
  const mediaDevices = window.navigator.mediaDevices;
  if (!mediaDevices || !mediaDevices.getUserMedia) {
    console.error("[VESTORA] navigator.mediaDevices not available");
    handleCameraFail("Camera API not available in this browser.");
    return;
  }

  const variants: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: facingMode }, width: { ideal: 1280 }, height: { ideal: 720 } }, audio: false },
    { video: { facingMode: { ideal: facingMode } }, audio: false },
    { video: true, audio: false },
  ];

  let lastErr: unknown;
  for (const c of variants) {
    try {
      cameraStream = await mediaDevices.getUserMedia(c);
      await setupStream(cameraStream, facingMode);
      return;
    } catch (err) {
      lastErr = err;
      console.warn("[VESTORA] getUserMedia variant failed:", err);
    }
  }

  console.error("[VESTORA] All camera variants failed:", lastErr);
  handleCameraFail();
}


async function setupStream(stream: MediaStream, facingMode: "user" | "environment") {
  if (!videoEl) return;
  currentFacing = facingMode;
  videoEl.srcObject = stream;
  videoEl.style.transform = facingMode === "user" ? "scaleX(-1)" : "";
  videoEl.style.display = "block";

  await new Promise<void>((resolve) => {
    videoEl!.onloadedmetadata = () => videoEl!.play().then(resolve).catch(resolve);
  });

  resizeCanvas();
  setTimeout(() => {
    isBodyDetected = true;
    setDetectRing(false, "Body Detected ✓");
    showToast("✦ Camera active — live try-on ready!");
    startRenderLoop();
  }, 1100);
}

function stopCamera() {
  if (animFrameId) { cancelAnimationFrame(animFrameId); animFrameId = null; }
  if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
  isBodyDetected = false;
}

function handleCameraFail(customMsg?: string) {
  setDetectRing(true, "No Camera");
  const errEl = shadowRoot?.getElementById("v-camera-error-msg");
  if (errEl) errEl.textContent = customMsg || "Camera permission was denied or no camera found. Click ↺ Retry after allowing camera in browser settings, or use Photo mode.";
  cameraBlockedEl?.classList.remove("hidden");
}

function setDetectRing(detecting: boolean, label: string) {
  const ring = shadowRoot?.getElementById("v-detect-ring");
  if (!ring) return;
  ring.classList.toggle("detecting", detecting);
  const lbl = ring.querySelector("span");
  if (lbl) lbl.textContent = label;
}

function resizeCanvas() {
  if (!videoEl || !canvasEl) return;
  canvasEl.width = videoEl.videoWidth || 640;
  canvasEl.height = videoEl.videoHeight || 480;
}

// ── Render Loop ────────────────────────────────────────────────────────────

function startRenderLoop() {
  if (animFrameId) cancelAnimationFrame(animFrameId);
  function frame() {
    animFrameId = requestAnimationFrame(frame);
    if (!ctx || !canvasEl) return;
    const w = canvasEl.width, h = canvasEl.height;
    if (!w || !h) return;

    const videoSource = (videoEl && videoEl.videoWidth) ? videoEl : canvasEl;
    const liveTrack = poseTracker.track(videoSource, w, h);
    if (liveTrack.framingStatus === "close_up") {
      setDetectRing(true, "💡 Sit back slightly for full view");
    } else if (liveTrack.isBodyDetected) {
      isBodyDetected = true;
      setDetectRing(false, `✦ Live Tracking (${liveTrack.framingStatus === "far" ? "Full Body" : "Torso"})`);
    } else {
      setDetectRing(true, "Looking for body…");
    }

    const pose = {
      landmarks: liveTrack.landmarks,
    };
    updateMeasurements(pose, w, h);
    ctx.clearRect(0, 0, w, h);
    renderAllLayers(pose, w, h, currentFacing === "user" && !!cameraStream);
  }
  animFrameId = requestAnimationFrame(frame);
}

// ── Garment Rendering ──────────────────────────────────────────────────────

function renderAllLayers(pose: {landmarks:{x:number,y:number}[]}, w: number, h: number, isMirrored: boolean) {
  const order = ["lower_body","full_body","upper_body","belt","necklace","scarf","bag","wristwear","ring","earrings","eyewear","headwear"];
  const layers = activeOutfit.filter(l => l.enabled)
    .sort((a,b) => order.indexOf(a.garmentCategory) - order.indexOf(b.garmentCategory));

  for (const layer of layers) {
    const src = (layer.processedCanvas || layer.imageElement) as CanvasImageSource | null;
    if (!src) continue;
    switch (layer.garmentCategory) {
      case "eyewear":    drawEyewear(pose.landmarks, w, h, layer, src, isMirrored); break;
      case "headwear":   drawHeadwear(pose.landmarks, w, h, layer, src, isMirrored); break;
      case "necklace":   drawNecklace(pose.landmarks, w, h, layer, src, isMirrored); break;
      case "wristwear":  drawWristwear(pose.landmarks, w, h, layer, src, isMirrored); break;
      case "lower_body": drawLowerBody(pose.landmarks, w, h, layer, src, isMirrored); break;
      case "full_body":  drawFullBody(pose.landmarks, w, h, layer, src, isMirrored); break;
      default:           drawUpperBody(pose.landmarks, w, h, layer, src, isMirrored); break;
    }
  }
}

type LM = {x:number,y:number}[];
const P = POSE_LANDMARK;

function drawUpperBody(lm:LM, w:number, h:number, item:OutfitLayer, src:CanvasImageSource, mir:boolean) {
  if (videoEl && videoEl.videoWidth && src) {
    try {
      inHouseVton.renderTryOn(ctx!, videoEl, src, lm, {
        fitScale: item.scale * fitScale,
        fitOffsetY: item.offsetY + fitOffsetY,
        fitOpacity: item.opacity * fitOpacity,
        enableLightingTransfer: true,
        enableArmOcclusion: true,
        isMirrored: mir,
      });
      return;
    } catch (err) {
      console.warn("[VESTORA Panel] Dense mesh error, falling back to rotation:", err);
    }
  }
  const ls=lm[P.LEFT_SHOULDER],rs=lm[P.RIGHT_SHOULDER],lhip=lm[P.LEFT_HIP];
  if(!ls||!rs||!lhip)return;
  const sw=Math.abs(rs.x-ls.x),th=Math.abs(lhip.y-ls.y);
  const gw=sw*2.2*item.scale,gh=th*1.45*item.scale;
  const cx=(ls.x+rs.x)/2,ty=ls.y-gh*0.08+item.offsetY;
  const dx=mir?w-cx-gw/2:cx-gw/2;
  const angle=Math.atan2(rs.y-ls.y,rs.x-ls.x);
  ctx!.save(); ctx!.globalAlpha=item.opacity;
  ctx!.translate(dx+gw/2,ty+gh/2); ctx!.rotate(mir?-angle:angle); ctx!.translate(-(dx+gw/2),-(ty+gh/2));
  ctx!.drawImage(src,dx,ty,gw,gh); ctx!.restore();
}
function drawLowerBody(lm:LM, w:number, h:number, item:OutfitLayer, src:CanvasImageSource, mir:boolean) {
  const lhip=lm[P.LEFT_HIP],rhip=lm[P.RIGHT_HIP],la=lm[P.LEFT_ANKLE];
  if(!lhip||!rhip||!la)return;
  const hw=Math.abs(rhip.x-lhip.x),lh=Math.abs(la.y-lhip.y);
  const gw=hw*1.8*item.scale,gh=lh*1.15*item.scale;
  const cx=(lhip.x+rhip.x)/2,ty=lhip.y-gh*0.05+item.offsetY;
  const dx=mir?w-cx-gw/2:cx-gw/2;
  ctx!.save(); ctx!.globalAlpha=item.opacity; ctx!.drawImage(src,dx,ty,gw,gh); ctx!.restore();
}
function drawFullBody(lm:LM, w:number, h:number, item:OutfitLayer, src:CanvasImageSource, mir:boolean) {
  if (videoEl && videoEl.videoWidth && src) {
    try {
      inHouseVton.renderTryOn(ctx!, videoEl, src, lm, {
        fitScale: item.scale * fitScale * 1.08,
        fitOffsetY: item.offsetY + fitOffsetY,
        fitOpacity: item.opacity * fitOpacity,
        enableLightingTransfer: true,
        enableArmOcclusion: true,
        isMirrored: mir,
      });
      return;
    } catch (err) {
      console.warn("[VESTORA Panel] Dense mesh error, falling back to rotation:", err);
    }
  }
  const ls=lm[5],rs=lm[6],la=lm[15];
  if(!ls||!rs||!la)return;
  const sw=Math.abs(rs.x-ls.x),bh=Math.abs(la.y-ls.y);
  const gw=sw*2.3*item.scale,gh=bh*1.25*item.scale;
  const cx=(ls.x+rs.x)/2,ty=ls.y-gh*0.04+item.offsetY;
  const dx=mir?w-cx-gw/2:cx-gw/2;
  ctx!.save(); ctx!.globalAlpha=item.opacity; ctx!.drawImage(src,dx,ty,gw,gh); ctx!.restore();
}
function drawEyewear(lm:LM, w:number, h:number, item:OutfitLayer, src:CanvasImageSource, mir:boolean) {
  const le=lm[1],re=lm[2];
  if(!le||!re)return;
  const dx2=re.x-le.x,dy2=re.y-le.y;
  const ed=Math.sqrt(dx2*dx2+dy2*dy2),angle=Math.atan2(dy2,dx2);
  const gw=ed*2.35*item.scale,gh=gw*0.44;
  const cx=(le.x+re.x)/2,cy=(le.y+re.y)/2+item.offsetY;
  const dx=mir?w-cx-gw/2:cx-gw/2;
  ctx!.save(); ctx!.globalAlpha=item.opacity;
  ctx!.translate(dx+gw/2,cy); ctx!.rotate(mir?-angle:angle); ctx!.translate(-(dx+gw/2),-cy);
  ctx!.drawImage(src,dx,cy-gh/2,gw,gh); ctx!.restore();
}
function drawHeadwear(lm:LM, w:number, h:number, item:OutfitLayer, src:CanvasImageSource, mir:boolean) {
  const crown=lm[17],ls=lm[5],rs=lm[6];
  if(!crown||!ls||!rs)return;
  const sw=Math.abs(rs.x-ls.x);
  const hw=sw*0.78*item.scale,hh=hw*0.72;
  const cx=crown.x,cy=crown.y-hh*0.38+item.offsetY;
  const dx=mir?w-cx-hw/2:cx-hw/2;
  ctx!.save(); ctx!.globalAlpha=item.opacity;
  ctx!.drawImage(src,dx,cy-hh/2,hw,hh); ctx!.restore();
}
function drawNecklace(lm:LM, w:number, h:number, item:OutfitLayer, src:CanvasImageSource, mir:boolean) {
  const neck=lm[18],ls=lm[5],rs=lm[6];
  if(!neck||!ls||!rs)return;
  const sw=Math.abs(rs.x-ls.x);
  const nw=sw*0.62*item.scale,nh=nw*0.85;
  const cx=neck.x,cy=neck.y+nh*0.15+item.offsetY;
  const dx=mir?w-cx-nw/2:cx-nw/2;
  ctx!.save(); ctx!.globalAlpha=item.opacity; ctx!.drawImage(src,dx,cy-nh/2,nw,nh); ctx!.restore();
}
function drawWristwear(lm:LM, w:number, h:number, item:OutfitLayer, src:CanvasImageSource, mir:boolean) {
  const lw=lm[9],ls=lm[5],rs=lm[6];
  if(!lw||!ls||!rs)return;
  const sw=Math.abs(rs.x-ls.x);
  const ww=sw*0.32*item.scale,wh=ww*1.05;
  const cx=lw.x,cy=lw.y+item.offsetY;
  const dx=mir?w-cx-ww/2:cx-ww/2;
  ctx!.save(); ctx!.globalAlpha=item.opacity; ctx!.drawImage(src,dx,cy-wh/2,ww,wh); ctx!.restore();
}

// ── Garment cutout ─────────────────────────────────────────────────────────

function processCutout(img: HTMLImageElement): HTMLCanvasElement | null {
  try {
    const ow=img.naturalWidth, oh=img.naturalHeight;
    if(!ow||!oh)return null;
    const off=document.createElement("canvas");
    off.width=ow; off.height=oh;
    const octx=off.getContext("2d",{willReadFrequently:true})!;
    octx.drawImage(img,0,0);
    const d=octx.getImageData(0,0,ow,oh), px=d.data;
    const corners=[0,(ow-1)*4,((oh-1)*ow)*4,((oh*ow)-1)*4];
    let r=0,g=0,b=0;
    corners.forEach(i=>{r+=px[i];g+=px[i+1];b+=px[i+2];});
    r/=4;g/=4;b/=4;
    if(r>210&&g>210&&b>210){
      for(let i=0;i<px.length;i+=4){
        const dist=Math.sqrt((px[i]-r)**2+(px[i+1]-g)**2+(px[i+2]-b)**2);
        if(dist<42)px[i+3]=Math.round(px[i+3]*Math.max(0,(dist-14)/28));
      }
      octx.putImageData(d,0,0);
      return off;
    }
    return null;
  } catch { return null; }
}

// ── Outfit management ──────────────────────────────────────────────────────

function mapCategory(name="", cat="") {
  const t=`${name} ${cat}`.toLowerCase();
  if(/sunglass|glasses|eyewear|aviator|shades|spectacle/i.test(t))return "eyewear";
  if(/\bcap\b|hat|beanie|snapback|fedora|visor/i.test(t))return "headwear";
  if(/necklace|chain|pendant|choker|collar/i.test(t))return "necklace";
  if(/earring|stud|jhumka|hoop/i.test(t))return "earrings";
  if(/watch|bracelet|bangle|wristband|kada/i.test(t))return "wristwear";
  if(/bag|handbag|backpack|tote|purse|clutch/i.test(t))return "bag";
  if(/belt|sash/i.test(t))return "belt";
  if(/pant|trouser|jean|skirt|shorts|legging/i.test(t))return "lower_body";
  if(/dress|gown|saree|sari|lehenga|jumpsuit|anarkali/i.test(t))return "full_body";
  return "upper_body";
}
function catLabel(c:string){
  return ({eyewear:"Eyewear",headwear:"Hat",necklace:"Necklace",earrings:"Earrings",wristwear:"Watch",bag:"Bag",belt:"Belt",lower_body:"Bottoms",full_body:"Full Outfit",upper_body:"Top"} as Record<string,string>)[c]||"Top";
}

function addOutfitItem(product: Product & { garmentCategory?: string }, replace: boolean) {
  const cat = product.garmentCategory || mapCategory(product.name, product.category);
  const id = product.id || `layer_${Date.now()}`;
  if (replace) activeOutfit = [];

  const item: OutfitLayer = {
    id, name: product.name||"Fashion Item", category: product.category||"Garment",
    garmentCategory: cat, imageUrl: product.imageUrl, enabled: true,
    scale: 1.0, offsetY: 0, opacity: fitOpacity,
    imageElement: null, processedCanvas: null,
    availableSizes: product.availableSizes || ["XS","S","M","L","XL","XXL"],
  };

  const slotIdx = activeOutfit.findIndex(l => l.garmentCategory === cat);
  if (slotIdx >= 0) activeOutfit[slotIdx] = item;
  else activeOutfit.push(item);

  if (productNameEl) productNameEl.textContent = item.name;
  if (productCategoryEl) productCategoryEl.textContent = `${catLabel(cat)} · ${item.category}`;
  if (productThumbEl) { productThumbEl.style.display = "block"; productThumbEl.src = item.imageUrl; productThumbEl.onerror = () => { productThumbEl!.style.display = "none"; }; }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    item.imageElement = img;
    item.processedCanvas = processCutout(img) || img;
    renderOutfitList();
    renderSizePills(item.availableSizes);
    showToast(`✦ ${item.name.slice(0,26)} ready!`);
  };
  img.onerror = () => {
    const img2 = new Image();
    img2.onload = () => {
      item.imageElement = img2;
      item.processedCanvas = img2;
      renderOutfitList();
      renderSizePills(item.availableSizes);
    };
    img2.src = item.imageUrl;
  };
  img.src = item.imageUrl;

  renderOutfitList(); updateCount();
}

function renderOutfitList() {
  if (!outfitListEl) return;
  outfitListEl.innerHTML = "";
  if (activeOutfit.length === 0) {
    outfitListEl.innerHTML = `<div class="v-outfit-empty">No items loaded yet. Try a sample or grab from the page.</div>`;
    updateCount(); return;
  }
  activeOutfit.forEach(layer => {
    const card = document.createElement("div");
    card.className = `v-layer-card${layer.enabled ? "" : " disabled"}`;

    const thumb = document.createElement("img");
    thumb.className = "v-layer-thumb"; thumb.src = layer.imageUrl; thumb.alt = layer.name;
    thumb.onerror = () => { thumb.style.display = "none"; };

    const info = document.createElement("div");
    info.className = "v-layer-info";
    info.innerHTML = `<div class="v-layer-cat">${catLabel(layer.garmentCategory)}</div><div class="v-layer-name" title="${layer.name}">${layer.name}</div>`;

    const btns = document.createElement("div");
    btns.className = "v-layer-btns";

    const tog = document.createElement("button");
    tog.className = `v-layer-btn ${layer.enabled?"on":""}`;
    tog.textContent = layer.enabled ? "✓" : "○";
    tog.addEventListener("click", (e) => { e.stopPropagation(); layer.enabled=!layer.enabled; renderOutfitList(); });

    const rem = document.createElement("button");
    rem.className = "v-layer-btn remove"; rem.textContent = "×";
    rem.addEventListener("click", (e) => {
      e.stopPropagation();
      activeOutfit = activeOutfit.filter(l => l.id !== layer.id);
      renderOutfitList(); updateCount();
      showToast(`Removed ${layer.name.slice(0,20)}`);
    });

    btns.appendChild(tog); btns.appendChild(rem);
    card.appendChild(thumb); card.appendChild(info); card.appendChild(btns);
    outfitListEl!.appendChild(card);
  });
  updateCount();
}

function updateCount() {
  if (!outfitCountEl) return;
  const n = activeOutfit.filter(l=>l.enabled).length, t = activeOutfit.length;
  outfitCountEl.textContent = t===0?"0":n===t?`${t}`:n===0?"0/"+t:`${n}/${t}`;
}

// ── Measurements ───────────────────────────────────────────────────────────

function updateMeasurements(pose:{landmarks:{x:number,y:number}[]}, fw:number, fh:number) {
  const lm=pose.landmarks;
  const ls=lm[5],rs=lm[6],lhip=lm[11],rhip=lm[12];
  const dist=(a:{x:number,y:number},b:{x:number,y:number})=>Math.sqrt((a.x-b.x)**2+(a.y-b.y)**2);
  const sPx=dist(ls,rs),hPx=dist(lhip,rhip);
  const tPx=dist({x:(ls.x+rs.x)/2,y:(ls.y+rs.y)/2},{x:(lhip.x+rhip.x)/2,y:(lhip.y+rhip.y)/2});
  const ppc=Math.max(1,sPx/44);
  const sh=Math.round(sPx/ppc),ch=Math.round(sPx*2.1/ppc),wa=Math.round(hPx*2.4/ppc),to=Math.round(tPx/ppc);
  if(measShoulderEl)measShoulderEl.textContent=`${sh} cm`;
  if(measChestEl)measChestEl.textContent=`${ch} cm`;
  if(measWaistEl)measWaistEl.textContent=`${wa} cm`;
  if(measTorsoEl)measTorsoEl.textContent=`${to} cm`;
  const rec=recommendSize(sh,ch,wa);
  if(recSizeEl)recSizeEl.textContent=rec;
  updateSizePillHighlight(rec);
}

function recommendSize(s:number,c:number,w:number):string{
  let best="M",score=Infinity;
  for(const[sz,r]of Object.entries(SIZE_CHART)){
    const sc=Math.abs(s-(r.shoulder[0]+r.shoulder[1])/2)*2+Math.abs(c-(r.chest[0]+r.chest[1])/2)+Math.abs(w-(r.waist[0]+r.waist[1])/2);
    if(sc<score){score=sc;best=sz;}
  }
  return best;
}

function renderSizePills(sizes:string[]) {
  if (!sizeOptionsEl) return;
  sizeOptionsEl.innerHTML = "";
  const rec = recSizeEl?.textContent || "M";
  sizes.forEach(s => {
    const btn = document.createElement("button");
    btn.className = `v-size-pill${s===rec?" rec":""}`;
    btn.textContent = s;
    btn.addEventListener("click", () => {
      sizeOptionsEl!.querySelectorAll(".v-size-pill").forEach(p=>p.classList.remove("selected"));
      btn.classList.add("selected");
      showToast(`Selected size: ${s}`);
    });
    sizeOptionsEl!.appendChild(btn);
  });
}

function updateSizePillHighlight(rec:string) {
  sizeOptionsEl?.querySelectorAll(".v-size-pill").forEach(p=>{
    p.classList.toggle("rec",p.textContent===rec);
  });
}

// ── Screenshot ─────────────────────────────────────────────────────────────

function takeScreenshot() {
  if (!videoEl || !canvasEl) return;
  const sc = document.createElement("canvas");
  sc.width = videoEl.videoWidth||640; sc.height = videoEl.videoHeight||480;
  const sctx = sc.getContext("2d")!;
  if (currentFacing==="user") {
    sctx.scale(-1,1); sctx.drawImage(videoEl,-sc.width,0,sc.width,sc.height); sctx.scale(-1,1);
  } else sctx.drawImage(videoEl,0,0);
  sctx.drawImage(canvasEl,0,0);
  sctx.font="bold 14px Inter,sans-serif"; sctx.fillStyle="rgba(255,255,255,0.75)";
  sctx.fillText("✦ VESTORA",12,sc.height-12);
  const a=document.createElement("a");
  a.download=`vestora-${Date.now()}.png`; a.href=sc.toDataURL(); a.click();
  showToast("✦ Screenshot saved!");
}

// ── Toast ──────────────────────────────────────────────────────────────────

let _toastTimer: ReturnType<typeof setTimeout>|null = null;
function showToast(msg:string) {
  const textEl=shadowRoot?.getElementById("v-toast-text");
  if(!toastEl||!textEl)return;
  if(_toastTimer)clearTimeout(_toastTimer);
  textEl.textContent=msg;
  toastEl.classList.add("visible");
  _toastTimer=setTimeout(()=>{ toastEl!.classList.remove("visible"); },2800);
}
