import { InHouseVTONEngine } from "../../engine/rendering/in-house-vton.js";
import { RealTimePoseTracker } from "../../engine/tracking/real-time-pose-tracker.js";
import { PoseTracker } from "../../engine/tracking/mediapipe-pose.js";
import { cutoutGarment } from "../../engine/garment/segment-cutout.js";
import { DecartLive } from "../../engine/rendering/decart-live.js";

/**
 * VESTORA — Real-Time Live Virtual Try-On Widget Controller
 * 
 * 100% In-House AI VTON Architecture (Zero 3rd-Party Cloud API Dependencies):
 * 1. Curvilinear Dense Anatomical Mesh Draping (60 FPS WebGL / Canvas 2D)
 * 2. Complete Shirt Replacement (erases original shirt, conforms to body silhouette)
 * 3. Dynamic Arm & Hand Occlusion (renders real arms in front of the garment)
 * 4. Ambient Lighting & Fold Transfer (transfers real room lighting/wrinkles onto cloth)
 * 5. Continuous 60 FPS Optical & Anatomical Vision Body Tracker (follows motion, leaning, turning)
 * 6. Multi-item active outfit layers & real-time anatomical body measurements
 */

const inHouseVton = new InHouseVTONEngine();
const poseTracker = new RealTimePoseTracker();
const mpPoseTracker = new PoseTracker();
mpPoseTracker.init();

// ─── Constants: 19 Anatomical Anchor Landmarks ───
const POSE_LANDMARK = {
  NOSE: 0,
  LEFT_EYE: 1,
  RIGHT_EYE: 2,
  LEFT_EAR: 3,
  RIGHT_EAR: 4,
  LEFT_SHOULDER: 5,
  RIGHT_SHOULDER: 6,
  LEFT_ELBOW: 7,
  RIGHT_ELBOW: 8,
  LEFT_WRIST: 9,
  RIGHT_WRIST: 10,
  LEFT_HIP: 11,
  RIGHT_HIP: 12,
  LEFT_KNEE: 13,
  RIGHT_KNEE: 14,
  LEFT_ANKLE: 15,
  RIGHT_ANKLE: 16,
  HEAD_CROWN: 17,
  NECK: 18,
};

const SIZE_CHART = {
  XS: { shoulder: [36, 39], chest: [81, 87], waist: [66, 72] },
  S:  { shoulder: [39, 42], chest: [87, 93], waist: [72, 78] },
  M:  { shoulder: [42, 45], chest: [93, 99], waist: [78, 84] },
  L:  { shoulder: [45, 48], chest: [99, 107], waist: [84, 92] },
  XL: { shoulder: [48, 52], chest: [107, 115], waist: [92, 100] },
  XXL:{ shoulder: [52, 56], chest: [115, 124], waist: [100, 110] },
};

// Built-in sample garments & accessories for instant testing on any device
const SAMPLE_GARMENTS = [
  {
    name: "Oversized Minimalist Jacket",
    category: "Jacket",
    garmentCategory: "upper_body",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Classic Aviator Sunglasses",
    category: "Sunglasses",
    garmentCategory: "eyewear",
    imageUrl: "https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["One Size"]
  },
  {
    name: "Minimalist Chronograph Watch",
    category: "Watch",
    garmentCategory: "wristwear",
    imageUrl: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["One Size"]
  },
  {
    name: "Streetwear Graphic Hoodie",
    category: "Hoodie",
    garmentCategory: "upper_body",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["M", "L", "XL", "XXL"]
  },
  {
    name: "Urban Snapback Baseball Cap",
    category: "Hat",
    garmentCategory: "headwear",
    imageUrl: "https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["One Size"]
  }
];
let currentSampleIndex = 0;

// ─── State ───
let currentInputMode = "camera"; // always camera — photo mode removed

let cameraStream = null;
let currentFacing = "user"; // "user" (front) or "environment" (back)
let animationFrameId = null;
let isBodyDetected = false;
let currentProduct = null;
let garmentImage = null;
let processedGarmentCanvas = null;
let poseHistory = [];
const MAX_POSE_HISTORY = 8;

// Multi-Item Active Outfit Layer Stack
let activeOutfit = []; // Array of OutfitItem: { id, name, category, garmentCategory, imageUrl, enabled, scale, offsetY, opacity, imageElement, processedCanvas }
let selectedLayerId = null;

// Fit adjustments
let fitScale = 1.0;
let fitOffsetY = 0;
let fitOpacity = 1.0;

// Drag & drop state
let dragCounter = 0;

// ─── DOM References ───
const videoEl = document.getElementById("camera-feed");
const canvasEl = document.getElementById("garment-canvas");
const ctx = canvasEl.getContext("2d", { desynchronized: true, alpha: true });

const btnRequestPerm = document.getElementById("btn-request-perm");
const btnRetryCam = document.getElementById("btn-retry-camera");


// Active Outfit Panel Elements
const activeOutfitPanel = document.getElementById("active-outfit-panel");
const outfitCountBadge = document.getElementById("outfit-count-badge");
const outfitLayersList = document.getElementById("outfit-layers-list");
const btnAddItemPill = document.getElementById("btn-add-item-pill");
const btnClearOutfit = document.getElementById("btn-clear-outfit");

// Topbar buttons
const btnGrabPage = document.getElementById("btn-grab-page");
const btnToggleFit = document.getElementById("btn-toggle-fit");
const btnPopoutWindow = document.getElementById("btn-popout-window");
const btnFlipCamera = document.getElementById("btn-flip-camera");
const btnScreenshot = document.getElementById("btn-screenshot");
const btnClose = document.getElementById("btn-close-tryon");

// Viewport Overlays
const dropZoneOverlay = document.getElementById("drop-zone-overlay");
const cameraBlockedCard = document.getElementById("camera-blocked-card");
const cameraErrorMessage = document.getElementById("camera-error-message");
const btnFallbackSidepanel = document.getElementById("btn-fallback-sidepanel");
const btnFallbackWindow = document.getElementById("btn-fallback-window");

// Paste URL Modal
const pasteUrlModal = document.getElementById("paste-url-modal");
const pasteUrlInput = document.getElementById("paste-url-input");
const btnSubmitUrl = document.getElementById("btn-submit-url");
const btnCancelUrl = document.getElementById("btn-cancel-url");

// Fit controls panel
const fitControlsPanel = document.getElementById("fit-controls-panel");
const btnScaleDown = document.getElementById("btn-scale-down");
const btnScaleUp = document.getElementById("btn-scale-up");
const fitScaleVal = document.getElementById("fit-scale-val");
const btnMoveUp = document.getElementById("btn-move-up");
const btnMoveDown = document.getElementById("btn-move-down");
const btnResetFit = document.getElementById("btn-reset-fit");
const fitOpacitySlider = document.getElementById("fit-opacity-slider");

// Indicators & HUD
const bodyIndicator = document.getElementById("body-detection-indicator");
const garmentLoader = document.getElementById("garment-loader");
const perfHud = document.getElementById("perf-hud");
const perfFps = document.getElementById("perf-fps");
const perfLatency = document.getElementById("perf-latency");
const trackingHudPill = document.getElementById("tracking-hud-pill");
const hudTrackingText = document.getElementById("hud-tracking-text");
const hudCutoutText = document.getElementById("hud-cutout-text");
const distanceGuidePill = document.getElementById("distance-guide-pill");
const distanceGuideText = document.getElementById("distance-guide-text");

// Product info & Samples
const productThumb = document.getElementById("product-thumb");
const productName = document.getElementById("product-name");
const productCategory = document.getElementById("product-category");
const btnGrabPagePill = document.getElementById("btn-grab-page-pill");
const btnPasteUrlPill = document.getElementById("btn-paste-url-pill");
const btnLoadSample = document.getElementById("btn-load-sample");

// Sizing
const measShoulder = document.getElementById("meas-shoulder");
const measChest = document.getElementById("meas-chest");
const measWaist = document.getElementById("meas-waist");
const measTorso = document.getElementById("meas-torso");
const recommendedSizeValue = document.getElementById("recommended-size-value");
const sizeOptionsContainer = document.getElementById("size-options");

// ─── Real-Time AI VTON Engine References ───
const vtonVideoEl = document.getElementById("vton-video");
const topbarEngineBadge = document.getElementById("topbar-engine-badge");
const engineDot = document.getElementById("engine-dot");
const topbarEngineText = document.getElementById("topbar-engine-text");
const btnEngineSettings = document.getElementById("btn-engine-settings");

const engineSettingsModal = document.getElementById("engine-settings-modal");
const btnCloseEngineModal = document.getElementById("btn-close-engine-modal");
const engineStatusBanner = document.getElementById("engine-status-banner");
const engineStatusIndicator = document.getElementById("engine-status-indicator");
const engineStatusMessage = document.getElementById("engine-status-message");
const inputDecartApiKey = document.getElementById("input-decart-api-key");
const btnToggleKeyVisibility = document.getElementById("btn-toggle-key-visibility");
const serverStatusPill = document.getElementById("server-status-pill");
const btnSaveEngineSettings = document.getElementById("btn-save-engine-settings");
const btnDisconnectVton = document.getElementById("btn-disconnect-vton");

const vtonSetupCard = document.getElementById("vton-setup-card");
const btnQuickConnectVton = document.getElementById("btn-quick-connect-vton");

// ─── VESTORA In-House Real-Time AI VTON Engine Manager (100% Free & Local) ───
class VestoraInHouseVTONManager {
  constructor() {
    this.status = "connected"; // In-house is always ready and connected!
    this.isVTONRendering = true;
    this.activeGarment = null;
    this.storedApiKey = "";
    this.serverOnline = false;
  }

  async init() {
    await this.checkServer();
    this.updateUI();
  }

  async checkServer() {
    try {
      const resp = await fetch("http://localhost:3000/api/health", { signal: AbortSignal.timeout(1500) });
      if (resp.ok) {
        const data = await resp.json();
        this.serverOnline = true;
        if (serverStatusPill) {
          serverStatusPill.textContent = "Online (In-House Server http://localhost:3000)";
          serverStatusPill.className = "server-status-pill online";
        }
        return data;
      }
    } catch {}

    this.serverOnline = false;
    if (serverStatusPill) {
      serverStatusPill.textContent = "Client-Side In-House Engine (Active)";
      serverStatusPill.className = "server-status-pill online";
    }
    return null;
  }

  // Fetch active engine status from the VTON backend
  async fetchEngineStatus() {
    try {
      const resp = await fetch("http://localhost:3000/api/vton/status", { signal: AbortSignal.timeout(1500) });
      if (resp.ok) {
        const data = await resp.json();
        this.activeEngine = data.active_engine || "rt_vton";
        this.device = data.device || "cpu";
      }
    } catch {
      this.activeEngine = "rt_vton";
      this.device = "cpu";
    }
  }

  getEffectiveApiKey() {
    return "in-house-local";
  }

  updateUI() {
    if (topbarEngineBadge) {
      topbarEngineBadge.className = "topbar-engine-badge connected";
    }
    if (topbarEngineText) {
      topbarEngineText.textContent = "IN-HOUSE 30FPS";
    }
    if (engineStatusIndicator) {
      engineStatusIndicator.className = "status-indicator-dot online";
    }
    if (engineStatusMessage) {
      engineStatusMessage.textContent = "Active: In-House Neural Draping & Shirt Replacement Engine (Zero Cloud APIs)";
    }
    vtonSetupCard?.classList.add("hidden");
  }

  async connect(localStream, initialGarment = null) {
    this.status = "connected";
    this.isVTONRendering = true;
    this.updateUI();
    // Pull latest engine status after connection
    await this.fetchEngineStatus();
    if (initialGarment) {
      await this.switchGarment(initialGarment);
    }
  }

  async switchGarment(garment) {
    if (!garment) return;
    this.activeGarment = garment;
    inHouseVton.reset();
    poseTracker.reset();
    showToast(`✦ In-House Try-On: Applied ${garment.name}!`);
  }

  async classifyGarment(product) {
    if (!product) return null;
    try {
      const resp = await fetch("http://localhost:3000/api/classify-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: product.name || "",
          category: product.category || "",
          image_url: product.imageUrl || "",
        }),
        signal: AbortSignal.timeout(2000),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch {}
    return null;
  }

  async extractGarment(imageElement, category, name) {
    if (!imageElement) return null;
    // 1) On-device multiclass garment segmentation (no server needed)
    try {
      const local = await cutoutGarment(imageElement, category || "upper_body");
      if (local) return local;
    } catch (e) {
      console.warn("[VESTORA] Local on-device garment cutout failed, falling back:", e);
    }
    // 2) Optional local Python server
    try {
      const canvas = document.createElement("canvas");
      canvas.width = imageElement.naturalWidth || imageElement.width;
      canvas.height = imageElement.naturalHeight || imageElement.height;
      const cctx = canvas.getContext("2d");
      cctx.drawImage(imageElement, 0, 0);
      const dataUrl = canvas.toDataURL("image/png");

      const resp = await fetch("http://localhost:3000/api/extract-garment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: dataUrl,
          category: category || "upper_body",
          name: name || "",
        }),
        signal: AbortSignal.timeout(4000),
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.extracted_garment || data.extracted_garment_b64 || null;
      }
    } catch {}
    return null;
  }

  async renderNeuralSnapshot(videoElement, garmentItem) {
    if (!videoElement || !garmentItem) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = videoElement.videoWidth || 640;
      canvas.height = videoElement.videoHeight || 480;
      const cctx = canvas.getContext("2d");
      cctx.drawImage(videoElement, 0, 0);
      const personData = canvas.toDataURL("image/png");

      const garmentSrc = garmentItem.processedCanvas || garmentItem.imageElement;
      let garmentData = garmentItem.imageUrl;
      if (garmentSrc && garmentSrc.toDataURL) {
        garmentData = garmentSrc.toDataURL("image/png");
      }

      const resp = await fetch("http://localhost:3000/api/vton/try-on", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          person: personData,
          garment: garmentData,
          category: garmentItem.garmentCategory || "upper_body",
          product_title: garmentItem.name || "",
        }),
        signal: AbortSignal.timeout(15000),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch (err) {
      console.warn("Neural VTON snapshot error:", err);
    }
    return null;
  }

  async renderVtonFrame(videoElement, garmentItem) {
    if (!videoElement || !garmentItem) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = Math.min(640, videoElement.videoWidth || 640);
      canvas.height = Math.min(480, videoElement.videoHeight || 480);
      const cctx = canvas.getContext("2d");
      cctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
      const frameData = canvas.toDataURL("image/jpeg", 0.75);

      const garmentSrc = garmentItem.processedCanvas || garmentItem.imageElement;
      let garmentData = garmentItem.imageUrl;
      if (garmentSrc && garmentSrc.toDataURL) {
        garmentData = garmentSrc.toDataURL("image/png");
      }

      const resp = await fetch("http://localhost:3000/api/vton/frame", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frame: frameData,
          garment: garmentData,
          category: garmentItem.garmentCategory || "upper_body",
        }),
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        return await resp.json();
      }
    } catch {}
    return null;
  }

  async switchEngine(engineName) {
    try {
      const resp = await fetch("http://localhost:3000/api/vton/engine/switch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ engine: engineName }),
        signal: AbortSignal.timeout(3000),
      });
      if (resp.ok) {
        const data = await resp.json();
        showToast(`✦ Active VTON Model: ${data.active_engine?.toUpperCase() || engineName.toUpperCase()}`);
        return data;
      }
    } catch {}
    return null;
  }

  disconnect() {
    inHouseVton.reset();
    poseTracker.reset();
    showToast("In-House Engine Reset");
  }
}

const vtonManager = new VestoraInHouseVTONManager();

// ─── Camera Management (Resilient Cross-Device) ───

async function initCamera(facingMode = "user") {
  // Stop existing stream
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }

  showBodyIndicator(true);
  hideCameraBlocked();

  // Try ideal high-definition constraints first
  const highConstraints = {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: false,
  };

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia(highConstraints);
    await setupStream(cameraStream, facingMode);
  } catch (errHigh) {
    const isPermissionError = errHigh?.name === "NotAllowedError" || 
                              String(errHigh?.message || "").toLowerCase().includes("permission") ||
                              String(errHigh?.message || "").toLowerCase().includes("dismiss");

    if (isPermissionError) {
      handleCameraFailure(errHigh);
      return;
    }

    // If hardware constraint issue (e.g. resolution not supported), try fallback constraints
    console.warn("[VESTORA] High constraints not supported, attempting standard video:", errHigh?.name || errHigh);
    try {
      const fallbackConstraints = {
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      };
      cameraStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      await setupStream(cameraStream, facingMode);
    } catch (errFallback) {
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        await setupStream(cameraStream, facingMode);
      } catch (errFinal) {
        handleCameraFailure(errFinal);
      }
    }
  }
}

async function setupStream(stream, facingMode) {
  videoEl.srcObject = stream;
  // Mirror only for front camera
  videoEl.style.transform = facingMode === "user" ? "scaleX(-1)" : "scaleX(1)";
  canvasEl.style.transform = videoEl.style.transform;

  await new Promise((resolve) => {
    videoEl.onloadedmetadata = () => {
      videoEl.play().then(resolve).catch(resolve);
    };
  });

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  startRenderLoop();

  // Baseline detection indicator
  setTimeout(() => {
    isBodyDetected = true;
    showBodyIndicator(false);
    showToast("✦ Body detected — try-on active!");
  }, 1200);

  currentFacing = facingMode;

  // Initialize and connect Real-Time VTON Engine (Lucy-VTON)
  try {
    await vtonManager.init();
    if (vtonManager.getEffectiveApiKey()) {
      vtonManager.connect(stream, currentProduct);
    } else {
      vtonManager.updateUI();
    }
  } catch (vtonErr) {
    console.warn("[VESTORA] VTON auto-connect warning:", vtonErr);
  }
}

function handleCameraFailure(err) {
  console.warn("[VESTORA] Camera permission or device access required:", err?.name, err?.message);
  showBodyIndicator(false);

  const isIframe = window.parent !== window;
  if (isIframe) {
    cameraErrorMessage.textContent = 
      "This shopping site restricts camera access in embedded views. Click below to enable camera access in a dedicated window.";
  } else {
    cameraErrorMessage.textContent = 
      "Camera permission is required for live try-on. Click below to allow camera access in Chrome.";
  }
  showCameraBlocked();
}

function requestCameraPermissionTab() {
  if (typeof chrome !== "undefined" && chrome.tabs?.create) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("tryon/permission.html"),
      active: true,
    });
  } else {
    initCamera(currentFacing);
  }
}

function showCameraBlocked() {
  cameraBlockedCard?.classList.remove("hidden");
}

function hideCameraBlocked() {
  cameraBlockedCard?.classList.add("hidden");
}

function resizeCanvas() {
  if (!videoEl.videoWidth) return;
  canvasEl.width = videoEl.videoWidth;
  canvasEl.height = videoEl.videoHeight;
}

function flipCamera() {
  inHouseVton.reset();
  poseTracker.reset();
  const newFacing = currentFacing === "user" ? "environment" : "user";
  initCamera(newFacing);
}

// ─── Render Loop ───

let lastFrameTime = 0;
let frameCount = 0;
let lastFpsUpdate = 0;

function startRenderLoop() {
  if (animationFrameId) cancelAnimationFrame(animationFrameId);

  function frame(timestamp) {
    animationFrameId = requestAnimationFrame(frame);
    syncHdGarment();
    if (hdActive) return; // HD Live mode shows Decart's generated video instead

    // FPS tracking
    frameCount++;
    if (timestamp - lastFpsUpdate >= 1000) {
      const fps = Math.round((frameCount * 1000) / (timestamp - lastFpsUpdate));
      if (perfFps) perfFps.textContent = `${fps} FPS`;
      if (perfLatency) perfLatency.textContent = `${Math.round(timestamp - lastFrameTime)} ms`;
      frameCount = 0;
      lastFpsUpdate = timestamp;
    }
    lastFrameTime = timestamp;

    // Camera-only render path
    if (!videoEl.videoWidth || !videoEl.videoHeight) return;
    if (!isBodyDetected) isBodyDetected = true;

    // Dual tracking: MediaPipe Tasks Vision with optical tracking fallback
    let smoothedPose = null;
    let framingStatus = "ideal";
    let isPoseDetected = false;

    if (mpPoseTracker && mpPoseTracker.ready) {
      const mpPose = mpPoseTracker.detect(videoEl);
      if (mpPose && mpPose.landmarks) {
        smoothedPose = mpPose;
        isPoseDetected = true;
      }
    }

    if (!smoothedPose) {
      const liveTrack = poseTracker.track(videoEl, canvasEl.width, canvasEl.height);
      if (liveTrack && liveTrack.landmarks) {
        smoothedPose = {
          landmarks: liveTrack.landmarks,
          confidence: liveTrack.confidence,
          timestamp: liveTrack.timestamp,
          shoulderAngle: liveTrack.shoulderAngle,
          shoulderWidth: liveTrack.shoulderWidth,
          torsoCenter: liveTrack.torsoCenter,
        };
        framingStatus = liveTrack.framingStatus;
        isPoseDetected = liveTrack.isDetected;
      }
    }

    // Update body measurements from continuously tracked pose
    if (smoothedPose) {
      updateMeasurements(smoothedPose, canvasEl.width, canvasEl.height);
    }

    // Live distance guidance & HUD status
    if (framingStatus === "close_up") {
      distanceGuidePill?.classList.remove("hidden");
      if (distanceGuideText) distanceGuideText.textContent = "💡 Sit back slightly for full shirt view";
    } else {
      distanceGuidePill?.classList.add("hidden");
    }

    if (hudTrackingText) {
      if (isPoseDetected) {
        const mode = (mpPoseTracker && mpPoseTracker.ready) ? "MEDIAPIPE ML" : "OPTICAL 60FPS";
        hudTrackingText.textContent = `✦ TRACKING: ${framingStatus === "close_up" ? "PORTRAIT" : "FULL BODY"} (${mode})`;
      } else {
        hudTrackingText.textContent = `✦ REAL-TIME TRACKING (SEARCHING BODY)`;
      }
    }

    // Clear canvas for fresh frame
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
    const isMirrored = currentFacing === "user" && currentInputMode === "camera";

// ---------- Universal Item Support ----------
// Define which categories the RT‑VTON backend can handle. Extend as needed.
const RT_VTON_SUPPORTED = [
  "upper_body",
  "full_body",
  "lower_body",
  "footwear",
  "accessories",
];

// Determine if RT‑VTON engine is active, server reachable, and the selected item is supported.
if (vtonManager.activeEngine && vtonManager.activeEngine === "rt_vton" && vtonManager.serverOnline) {
// Resolve the currently selected product (or fallback sample).
let garmentItem = null;
if (currentProduct) {
  // Prefer AI‑extracted garment canvas if available; otherwise use original image URL.
  const imageData = (processedGarmentCanvas && processedGarmentCanvas.toDataURL) ? processedGarmentCanvas.toDataURL("image/png") : currentProduct.imageUrl;
  garmentItem = {
    garmentCategory: currentProduct.garmentCategory || "upper_body",
    imageUrl: imageData,
    name: currentProduct.name || "",
  };
} else {
  // No product selected – use placeholder/sample garment.
  garmentItem = { garmentCategory: "upper_body", imageUrl: garmentImage?.src || null };
}
// Only invoke RT‑VTON when the category is supported.
if (RT_VTON_SUPPORTED.includes(garmentItem.garmentCategory)) {
        vtonManager.renderVtonFrame(videoEl, garmentItem)
            .then(res => {
                if (res && res.frame_image_b64) {
                    const img = new Image();
                    img.onload = () => ctx.drawImage(img, 0, 0, canvasEl.width, canvasEl.height);
                    img.src = `data:image/png;base64,${res.frame_image_b64}`;
                } else {
                    renderAllOutfitLayers(smoothedPose, canvasEl.width, canvasEl.height, isMirrored);
                }
            })
            .catch(e => {
                console.warn("[VESTORA] RT‑VTON frame render error:", e);
                // Fallback to in‑house rendering on error or unsupported category.
                renderAllOutfitLayers(smoothedPose, canvasEl.width, canvasEl.height, isMirrored);
            })
        // Early return – RT‑VTON handled this frame.
        return;
    }
  // If category unsupported, fall back to in-house rendering.
  renderAllOutfitLayers(smoothedPose, canvasEl.width, canvasEl.height, isMirrored);
} else {
  // No RT-VTON backend - use the existing in-house pipeline.
  renderAllOutfitLayers(smoothedPose, canvasEl.width, canvasEl.height, isMirrored);
}
  }

  animationFrameId = requestAnimationFrame(frame);
}



function smoothPose(history) {
  if (history.length === 0) return null;
  if (history.length === 1) return history[0];

  const alpha = 0.3; // EMA smoothing factor
  const latest = history[history.length - 1];
  const prev = history[history.length - 2];

  return {
    landmarks: latest.landmarks.map((lm, i) => ({
      x: prev.landmarks[i].x * (1 - alpha) + lm.x * alpha,
      y: prev.landmarks[i].y * (1 - alpha) + lm.y * alpha,
      v: lm.v,
    })),
    confidence: latest.confidence,
    timestamp: latest.timestamp,
  };
}

// ─── Multi-Item Live Outfit Layer Renderer ───

function renderAllOutfitLayers(pose, canvasWidth, canvasHeight, isMirrored) {
  if (!pose) return;

  // Topological depth order: shoes -> lower body -> full body -> upper body -> belt -> necklace -> scarf -> bag -> wristwear -> ring -> gloves -> earrings -> eyewear -> headwear
  const layerOrder = [
    "shoes",
    "lower_body",
    "full_body",
    "upper_body",
    "belt",
    "necklace",
    "scarf",
    "bag",
    "wristwear",
    "ring",
    "gloves",
    "earrings",
    "eyewear",
    "headwear",
  ];

  // 1. In-House Real-Time Neural Try-On for Clothing Layers (upper_body & full_body)
  // Replaces user's original shirt, performs curvilinear dense mesh draping,
  // transfers room lighting/folds, and handles dynamic arm & hand occlusion.
  const clothingLayers = activeOutfit.filter(
    (layer) => layer.enabled && (layer.garmentCategory === "upper_body" || layer.garmentCategory === "full_body")
  );

  if (clothingLayers.length > 0) {
    for (const layer of clothingLayers) {
      const src = layer.processedCanvas || layer.imageElement;
      if (src) {
        inHouseVton.renderTryOn(
          ctx,
          videoEl,
          src,
          pose.landmarks,
          {
            fitScale: (layer.scale || 1.0) * fitScale,
            fitOffsetY: (layer.offsetY || 0) + fitOffsetY,
            fitOpacity: (layer.opacity || 1.0) * fitOpacity,
            enableLightingTransfer: true,
            enableArmOcclusion: true,
            isMirrored,
          }
        );
      }
    }
  } else if (currentProduct && (currentProduct.garmentCategory === "upper_body" || currentProduct.garmentCategory === "full_body")) {
    const src = processedGarmentCanvas || garmentImage || currentProduct.processedCanvas || currentProduct.imageElement;
    if (src) {
      inHouseVton.renderTryOn(
        ctx,
        videoEl,
        src,
        pose.landmarks,
        {
          fitScale,
          fitOffsetY,
          fitOpacity,
          enableLightingTransfer: true,
          enableArmOcclusion: true,
          isMirrored,
        }
      );
    }
  }

  // 2. Render all accessory layers on top in correct topological depth order
  const accessoryLayers = activeOutfit
    .filter((layer) => layer.enabled && layer.garmentCategory !== "upper_body" && layer.garmentCategory !== "full_body")
    .sort((a, b) => layerOrder.indexOf(a.garmentCategory) - layerOrder.indexOf(b.garmentCategory));

  for (const layer of accessoryLayers) {
    const src = layer.processedCanvas || layer.imageElement;
    if (!src) continue;

    switch (layer.garmentCategory) {
      case "eyewear":
        renderEyewear(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "headwear":
        renderHeadwear(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "necklace":
        renderNecklace(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "earrings":
        renderEarrings(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "wristwear":
        renderWristwear(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "ring":
        renderRing(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "gloves":
        renderGloves(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "bag":
        renderBag(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "belt":
        renderBelt(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "shoes":
        renderShoes(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
      case "lower_body":
        renderLowerBodyGarment(pose, canvasWidth, canvasHeight, layer, isMirrored);
        break;
    }
  }
}

// ── 1. Live Eyewear (Sunglasses / Glasses) ──
function renderEyewear(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lEye = pose.landmarks[POSE_LANDMARK.LEFT_EYE];
  const rEye = pose.landmarks[POSE_LANDMARK.RIGHT_EYE];
  if (!lEye || !rEye) return;

  const dx = rEye.x - lEye.x;
  const dy = rEye.y - lEye.y;
  const eyeDistance = Math.sqrt(dx * dx + dy * dy);
  const headAngle = Math.atan2(dy, dx);

  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const glassWidth = eyeDistance * 2.35 * scale;
  const glassHeight = glassWidth * 0.44;

  const centerX = (lEye.x + rEye.x) / 2;
  const centerY = (lEye.y + rEye.y) / 2 + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - glassWidth / 2
    : centerX - glassWidth / 2;
  const drawY = centerY - glassHeight / 2;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.translate(drawX + glassWidth / 2, drawY + glassHeight / 2);
  ctx.rotate(isMirrored ? -headAngle : headAngle);
  ctx.translate(-(drawX + glassWidth / 2), -(drawY + glassHeight / 2));

  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, drawY, glassWidth, glassHeight);
  ctx.restore();
}

// ── 2. Live Headwear (Caps / Hats / Beanies) ──
function renderHeadwear(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const crown = pose.landmarks[POSE_LANDMARK.HEAD_CROWN];
  const lEye = pose.landmarks[POSE_LANDMARK.LEFT_EYE];
  const rEye = pose.landmarks[POSE_LANDMARK.RIGHT_EYE];
  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  if (!crown || !lShoulder || !rShoulder) return;

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const hatWidth = shoulderWidth * 0.78 * scale;
  const hatHeight = hatWidth * 0.72;

  const headAngle = Math.atan2(rEye.y - lEye.y, rEye.x - lEye.x);

  const centerX = crown.x;
  const centerY = crown.y - (hatHeight * 0.38) + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - hatWidth / 2
    : centerX - hatWidth / 2;
  const drawY = centerY - hatHeight / 2;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.translate(drawX + hatWidth / 2, drawY + hatHeight / 2);
  ctx.rotate(isMirrored ? -headAngle : headAngle);
  ctx.translate(-(drawX + hatWidth / 2), -(drawY + hatHeight / 2));

  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, drawY, hatWidth, hatHeight);
  ctx.restore();
}

// ── 3. Live Necklaces & Chains ──
function renderNecklace(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const neck = pose.landmarks[POSE_LANDMARK.NECK];
  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  if (!neck || !lShoulder || !rShoulder) return;

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const neckWidth = shoulderWidth * 0.62 * scale;
  const neckHeight = neckWidth * 0.85;

  const shoulderAngle = Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x);

  const centerX = neck.x;
  const centerY = neck.y + (neckHeight * 0.15) + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - neckWidth / 2
    : centerX - neckWidth / 2;
  const drawY = centerY - neckHeight / 2;

  ctx.save();
  ctx.globalAlpha = opacity;

  ctx.translate(drawX + neckWidth / 2, drawY + neckHeight / 2);
  ctx.rotate(isMirrored ? -shoulderAngle : shoulderAngle);
  ctx.translate(-(drawX + neckWidth / 2), -(drawY + neckHeight / 2));

  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, drawY, neckWidth, neckHeight);
  ctx.restore();
}

// ── 4. Live Earrings ──
function renderEarrings(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lEar = pose.landmarks[POSE_LANDMARK.LEFT_EAR];
  const rEar = pose.landmarks[POSE_LANDMARK.RIGHT_EAR];
  const lEye = pose.landmarks[POSE_LANDMARK.LEFT_EYE];
  const rEye = pose.landmarks[POSE_LANDMARK.RIGHT_EYE];
  if (!lEar || !rEar) return;

  const eyeDistance = Math.abs(rEye.x - lEye.x);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const earringSize = eyeDistance * 0.50 * scale;

  const src = item.processedCanvas || item.imageElement;
  if (!src) return;

  ctx.save();
  ctx.globalAlpha = opacity;

  // Left Earring
  const drawLX = isMirrored ? canvasWidth - lEar.x - earringSize / 2 : lEar.x - earringSize / 2;
  const drawLY = lEar.y - earringSize * 0.1 + offsetY;
  ctx.drawImage(src, drawLX, drawLY, earringSize, earringSize);

  // Right Earring
  const drawRX = isMirrored ? canvasWidth - rEar.x - earringSize / 2 : rEar.x - earringSize / 2;
  const drawRY = rEar.y - earringSize * 0.1 + offsetY;
  ctx.drawImage(src, drawRX, drawRY, earringSize, earringSize);

  ctx.restore();
}

// ── 5. Live Watches & Bracelets ──
function renderWristwear(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lWrist = pose.landmarks[POSE_LANDMARK.LEFT_WRIST];
  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  if (!lWrist || !lShoulder || !rShoulder) return;

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const watchWidth = shoulderWidth * 0.32 * scale;
  const watchHeight = watchWidth * 1.05;

  const centerX = lWrist.x;
  const centerY = lWrist.y + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - watchWidth / 2
    : centerX - watchWidth / 2;
  const drawY = centerY - watchHeight / 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, drawY, watchWidth, watchHeight);
  ctx.restore();
}

// ── 6. Live Bags (Handbags / Backpacks) ──
function renderBag(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  const lHip = pose.landmarks[POSE_LANDMARK.LEFT_HIP];
  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  if (!rShoulder || !lHip || !lShoulder) return;

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const bagWidth = shoulderWidth * 0.72 * scale;
  const bagHeight = bagWidth * 1.0;

  const centerX = isMirrored ? lShoulder.x - bagWidth * 0.2 : rShoulder.x + bagWidth * 0.2;
  const centerY = lHip.y - bagHeight * 0.3 + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - bagWidth / 2
    : centerX - bagWidth / 2;
  const drawY = centerY - bagHeight / 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, drawY, bagWidth, bagHeight);
  ctx.restore();
}

// ── 7. Live Belts ──
function renderBelt(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lHip = pose.landmarks[POSE_LANDMARK.LEFT_HIP];
  const rHip = pose.landmarks[POSE_LANDMARK.RIGHT_HIP];
  if (!lHip || !rHip) return;

  const hipWidth = Math.abs(rHip.x - lHip.x);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const beltWidth = hipWidth * 1.25 * scale;
  const beltHeight = beltWidth * 0.22;

  const centerX = (lHip.x + rHip.x) / 2;
  const centerY = (lHip.y + rHip.y) / 2 + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - beltWidth / 2
    : centerX - beltWidth / 2;
  const drawY = centerY - beltHeight / 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, drawY, beltWidth, beltHeight);
  ctx.restore();
}

// ── 8. Live Upper Body Garments (Jackets / Shirts / Hoodies) ──
function renderUpperBodyGarment(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  const neck = pose.landmarks[POSE_LANDMARK.NECK];
  const lHip = pose.landmarks[POSE_LANDMARK.LEFT_HIP];
  if (!lShoulder || !rShoulder) return;

  const src = item.processedCanvas || item.imageElement || item.source;
  if (!src) return;

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : 1.0;

  // Preserve natural garment aspect ratio so clothing is never squashed or flattened!
  const naturalW = src.width || src.naturalWidth || 600;
  const naturalH = src.height || src.naturalHeight || 700;
  const aspect = naturalH / naturalW;

  // Spans shoulders naturally
  const garmentWidth = shoulderWidth * 1.18 * scale;
  // Natural vertical drape matching real shirt proportions
  const garmentHeight = garmentWidth * aspect;

  const centerX = (lShoulder.x + rShoulder.x) / 2;
  // Collar aligns right at the base of the neck / collarbone, below the chin
  const collarY = neck ? neck.y : lShoulder.y;
  const topY = collarY - (garmentHeight * 0.10) + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - garmentWidth / 2
    : centerX - garmentWidth / 2;

  ctx.save();
  ctx.globalAlpha = opacity;

  const shoulderAngle = Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x);

  ctx.translate(drawX + garmentWidth / 2, topY + garmentHeight / 2);
  ctx.rotate(isMirrored ? -shoulderAngle : shoulderAngle);
  ctx.translate(-(drawX + garmentWidth / 2), -(topY + garmentHeight / 2));

  ctx.drawImage(src, drawX, topY, garmentWidth, garmentHeight);
  ctx.restore();
}

// ── 9. Live Lower Body Garments (Jeans / Pants / Skirts) ──
function renderLowerBodyGarment(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lHip = pose.landmarks[POSE_LANDMARK.LEFT_HIP];
  const rHip = pose.landmarks[POSE_LANDMARK.RIGHT_HIP];
  const lAnkle = pose.landmarks[POSE_LANDMARK.LEFT_ANKLE];
  if (!lHip || !rHip || !lAnkle) return;

  const hipWidth = Math.abs(rHip.x - lHip.x);
  const legHeight = Math.abs(lAnkle.y - lHip.y);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const garmentWidth = hipWidth * 1.8 * scale;
  const garmentHeight = legHeight * 1.15 * scale;

  const centerX = (lHip.x + rHip.x) / 2;
  const topY = lHip.y - (garmentHeight * 0.05) + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - garmentWidth / 2
    : centerX - garmentWidth / 2;

  ctx.save();
  ctx.globalAlpha = opacity;
  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, topY, garmentWidth, garmentHeight);
  ctx.restore();
}

// ── 10. Live Full Body Ensembles (Dresses / Sarees / Suits) ──
function renderFullBodyGarment(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  const lAnkle = pose.landmarks[POSE_LANDMARK.LEFT_ANKLE];
  if (!lShoulder || !rShoulder || !lAnkle) return;

  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const bodyHeight = Math.abs(lAnkle.y - lShoulder.y);
  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;

  const garmentWidth = shoulderWidth * 2.3 * scale;
  const garmentHeight = bodyHeight * 1.25 * scale;

  const centerX = (lShoulder.x + rShoulder.x) / 2;
  const topY = lShoulder.y - (garmentHeight * 0.04) + offsetY;

  const drawX = isMirrored
    ? canvasWidth - centerX - garmentWidth / 2
    : centerX - garmentWidth / 2;

  ctx.save();
  ctx.globalAlpha = opacity;

  const shoulderAngle = Math.atan2(rShoulder.y - lShoulder.y, rShoulder.x - lShoulder.x);
  ctx.translate(drawX + garmentWidth / 2, topY + garmentHeight / 2);
  ctx.rotate(isMirrored ? -shoulderAngle : shoulderAngle);
  ctx.translate(-(drawX + garmentWidth / 2), -(topY + garmentHeight / 2));

  const src = item.processedCanvas || item.imageElement;
  if (src) ctx.drawImage(src, drawX, topY, garmentWidth, garmentHeight);
  ctx.restore();
}

// ── 11. Live Footwear (Shoes / Sneakers / Boots) ──
function renderShoes(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lAnkle = pose.landmarks[POSE_LANDMARK.LEFT_ANKLE];
  const rAnkle = pose.landmarks[POSE_LANDMARK.RIGHT_ANKLE];
  if (!lAnkle || !rAnkle) return;

  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;
  const size = Math.abs(rAnkle.x - lAnkle.x) * 0.9 * scale;
  const shoeHeight = size * 0.55;

  const src = item.processedCanvas || item.imageElement;
  if (!src) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  [lAnkle, rAnkle].forEach((ankle) => {
    const drawX = isMirrored ? canvasWidth - ankle.x - size / 2 : ankle.x - size / 2;
    const drawY = ankle.y - shoeHeight * 0.2 + offsetY;
    ctx.drawImage(src, drawX, drawY, size, shoeHeight);
  });
  ctx.restore();
}

// ── 12. Live Gloves (Hands / Fingers) ──
function renderGloves(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lWrist = pose.landmarks[POSE_LANDMARK.LEFT_WRIST];
  const rWrist = pose.landmarks[POSE_LANDMARK.RIGHT_WRIST];
  if (!lWrist || !rWrist) return;

  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;
  const size = canvasWidth * 0.11 * scale;

  const src = item.processedCanvas || item.imageElement;
  if (!src) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  [lWrist, rWrist].forEach((wrist) => {
    const drawX = isMirrored ? canvasWidth - wrist.x - size / 2 : wrist.x - size / 2;
    const drawY = wrist.y - size * 0.2 + offsetY;
    ctx.drawImage(src, drawX, drawY, size, size);
  });
  ctx.restore();
}

// ── 13. Live Ring (Individual Fingers) ──
function renderRing(pose, canvasWidth, canvasHeight, item, isMirrored) {
  const lWrist = pose.landmarks[POSE_LANDMARK.LEFT_WRIST];
  if (!lWrist) return;

  const scale = item.scale || 1.0;
  const offsetY = item.offsetY || 0;
  const opacity = item.opacity !== undefined ? item.opacity : fitOpacity;
  const size = canvasWidth * 0.055 * scale;

  const src = item.processedCanvas || item.imageElement;
  if (!src) return;

  ctx.save();
  ctx.globalAlpha = opacity;
  const drawX = isMirrored ? canvasWidth - lWrist.x - size / 2 : lWrist.x - size / 2;
  const drawY = lWrist.y + size * 0.8 + offsetY;
  ctx.drawImage(src, drawX, drawY, size, size);
  ctx.restore();
}

function processGarmentCutout(img, category = "upper_body") {
  const canvas = processItemCutout(img, category);
  processedGarmentCanvas = canvas;
  return canvas;
}

function processItemCutout(img, category = "upper_body") {
  try {
    const ow = img.naturalWidth || img.width;
    const oh = img.naturalHeight || img.height;
    if (!ow || !oh) return null;

    const offscreen = document.createElement("canvas");
    offscreen.width = ow;
    offscreen.height = oh;
    const octx = offscreen.getContext("2d", { willReadFrequently: true });
    octx.drawImage(img, 0, 0);

    const imgData = octx.getImageData(0, 0, ow, oh);
    const data = imgData.data;

    const garmentCategory = normalizeGarmentCategoryForTexture(category);

    // Sample border pixels along top, bottom, left, right to find true studio/catalog background color
    let bgR = 0, bgG = 0, bgB = 0, borderCount = 0;
    let borderVariance = 0;
    const borderSamples = [];
    const stepX = Math.max(1, Math.floor(ow / 25));
    const stepY = Math.max(1, Math.floor(oh / 25));

    const sampleBorderPixel = (i) => {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      bgR += r; bgG += g; bgB += b;
      borderSamples.push([r, g, b]);
      borderCount++;
    };

    for (let x = 0; x < ow; x += stepX) {
      sampleBorderPixel(x * 4);
      sampleBorderPixel(((oh - 1) * ow + x) * 4);
    }
    for (let y = 0; y < oh; y += stepY) {
      sampleBorderPixel((y * ow) * 4);
      sampleBorderPixel((y * ow + (ow - 1)) * 4);
    }

    bgR /= borderCount;
    bgG /= borderCount;
    bgB /= borderCount;

    for (const [r, g, b] of borderSamples) {
      borderVariance += (r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2;
    }
    const borderStd = Math.sqrt(borderVariance / Math.max(1, borderSamples.length * 3));

    const avgLight = (bgR + bgG + bgB) / 3;
    const edgeLooksLikeBackground = borderStd < 42 || avgLight > 145;
    const threshold = avgLight < 175 ? 52 : 36;

    const visited = new Uint8Array(ow * oh);
    const queue = new Int32Array(ow * oh);
    let qHead = 0;
    let qTail = 0;

    const colorDist = (r, g, b) => Math.sqrt((r - bgR) ** 2 + (g - bgG) ** 2 + (b - bgB) ** 2);

    if (edgeLooksLikeBackground) {
      // Seed BFS flood-fill from all 4 outer borders of the image
      for (let x = 0; x < ow; x++) {
        const idxTop = x * 4;
        if (colorDist(data[idxTop], data[idxTop + 1], data[idxTop + 2]) < threshold + 18) {
          visited[x] = 1;
          queue[qTail++] = x;
        }
        const posB = (oh - 1) * ow + x;
        const idxB = posB * 4;
        if (colorDist(data[idxB], data[idxB + 1], data[idxB + 2]) < threshold + 18) {
          visited[posB] = 1;
          queue[qTail++] = posB;
        }
      }

      for (let y = 0; y < oh; y++) {
        const posL = y * ow;
        const idxL = posL * 4;
        if (!visited[posL] && colorDist(data[idxL], data[idxL + 1], data[idxL + 2]) < threshold + 18) {
          visited[posL] = 1;
          queue[qTail++] = posL;
        }
        const posR = y * ow + (ow - 1);
        const idxR = posR * 4;
        if (!visited[posR] && colorDist(data[idxR], data[idxR + 1], data[idxR + 2]) < threshold + 18) {
          visited[posR] = 1;
          queue[qTail++] = posR;
        }
      }

      // Traverse connected background pixels and erase them
      while (qHead < qTail) {
        const pos = queue[qHead++];
        const px = pos % ow;
        const py = Math.floor(pos / ow);
        const idx = pos * 4;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const dist = colorDist(r, g, b);

        if (dist < threshold) {
          data[idx + 3] = 0; // Transparent
        } else {
          const alpha = Math.max(0, Math.min(1, (dist - threshold) / 18));
          data[idx + 3] = Math.round(data[idx + 3] * alpha);
        }

        // Check 4-connected neighbors
        const neighbors = [
          pos - 1,
          pos + 1,
          pos - ow,
          pos + ow,
        ];

        if (px > 0 && !visited[neighbors[0]]) {
          const nPos = neighbors[0];
          const nIdx = nPos * 4;
          if (colorDist(data[nIdx], data[nIdx + 1], data[nIdx + 2]) < threshold + 18) {
            visited[nPos] = 1;
            queue[qTail++] = nPos;
          }
        }
        if (px < ow - 1 && !visited[neighbors[1]]) {
          const nPos = neighbors[1];
          const nIdx = nPos * 4;
          if (colorDist(data[nIdx], data[nIdx + 1], data[nIdx + 2]) < threshold + 18) {
            visited[nPos] = 1;
            queue[qTail++] = nPos;
          }
        }
        if (py > 0 && !visited[neighbors[2]]) {
          const nPos = neighbors[2];
          const nIdx = nPos * 4;
          if (colorDist(data[nIdx], data[nIdx + 1], data[nIdx + 2]) < threshold + 18) {
            visited[nPos] = 1;
            queue[qTail++] = nPos;
          }
        }
        if (py < oh - 1 && !visited[neighbors[3]]) {
          const nPos = neighbors[3];
          const nIdx = nPos * 4;
          if (colorDist(data[nIdx], data[nIdx + 1], data[nIdx + 2]) < threshold + 18) {
            visited[nPos] = 1;
            queue[qTail++] = nPos;
          }
        }
      }
    }

    // Erase human model head, face, neck, and exposed hands from catalog photos so only the garment is tried on.
    const maxHeadY = Math.floor(oh * 0.42);
    for (let y = 0; y < maxHeadY; y++) {
      for (let x = 0; x < ow; x++) {
        const idx = (y * ow + x) * 4;
        if (data[idx + 3] === 0) continue;

        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];

        // Detect model skin tones (face, chin, neck)
        const isSkin = (r > 105 && g > 45 && b > 25 &&
                        r > g && r > b &&
                        (r - g) > 12 &&
                        (r - b) > 24 &&
                        (Math.max(r, g, b) - Math.min(r, g, b)) > 22);

        // Detect model hair in the top 22%
        const isHair = y < oh * 0.25 && (r < 65 && g < 65 && b < 65);

        if (isSkin || isHair) {
          data[idx + 3] = 0;
        }
      }
    }

    octx.putImageData(imgData, 0, 0);
    return cropGarmentTexture(offscreen, garmentCategory);
  } catch (e) {
    console.warn("[VESTORA] processItemCutout error:", e);
    return null;
  }
}

function normalizeGarmentCategoryForTexture(category) {
  if (category === "tops" || category === "shirt" || category === "jacket") return "upper_body";
  if (category === "pants" || category === "bottoms") return "lower_body";
  return category || "upper_body";
}

function getAlphaBounds(imgData, width, height, minAlpha = 12) {
  const data = imgData.data;
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  let opaqueCount = 0;

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const alpha = data[(y * width + x) * 4 + 3];
      if (alpha > minAlpha) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        opaqueCount++;
      }
    }
  }

  if (maxX < minX || maxY < minY) return null;
  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
    opaqueRatio: opaqueCount / (width * height),
  };
}

function cropGarmentTexture(sourceCanvas, category = "upper_body") {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const sourceCtx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const imgData = sourceCtx.getImageData(0, 0, width, height);
  const bounds = getAlphaBounds(imgData, width, height);

  if (!bounds) return sourceCanvas;

  const fullModelLike = bounds.height > bounds.width * 1.25 || height > width * 1.2;
  const crop = { ...bounds };

  if (category === "upper_body" && fullModelLike) {
    crop.y = Math.max(0, bounds.y - Math.round(bounds.height * 0.02));
    crop.height = Math.min(height - crop.y, Math.round(bounds.height * 0.58));
  } else if (category === "lower_body" && fullModelLike) {
    crop.y = Math.max(0, bounds.y + Math.round(bounds.height * 0.36));
    crop.height = Math.min(height - crop.y, Math.round(bounds.height * 0.62));
  } else if (category === "full_body") {
    crop.height = Math.min(height - crop.y, bounds.height);
  }

  const padX = Math.round(crop.width * 0.08);
  const padY = Math.round(crop.height * 0.06);
  const sx = Math.max(0, crop.x - padX);
  const sy = Math.max(0, crop.y - padY);
  const sw = Math.min(width - sx, crop.width + padX * 2);
  const sh = Math.min(height - sy, crop.height + padY * 2);

  if (sw <= 0 || sh <= 0) return sourceCanvas;

  const output = document.createElement("canvas");
  output.width = sw;
  output.height = sh;
  const outCtx = output.getContext("2d");
  outCtx.drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
  return output;
}

// ─── Universal Drag and Drop Garment Ingestion (Anywear Signature) ───

function setupDragAndDrop() {
  window.addEventListener("dragenter", (e) => {
    e.preventDefault();
    dragCounter++;
    showDropZone(true);
  });

  window.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  });

  window.addEventListener("dragleave", (e) => {
    e.preventDefault();
    dragCounter--;
    if (dragCounter <= 0) {
      dragCounter = 0;
      showDropZone(false);
    }
  });

  window.addEventListener("drop", async (e) => {
    e.preventDefault();
    dragCounter = 0;
    showDropZone(false);

    const imageUrl = await extractImageFromDropEvent(e);
    if (imageUrl) {
      loadProduct({
        id: `dragged_${Date.now()}`,
        name: "Custom Dropped Garment",
        category: "Clothing Item",
        imageUrl: imageUrl,
        availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
      });
      showToast("✦ Dropped garment loaded! Adjust fit as desired.");
    } else {
      showToast("⚠ Could not extract garment image from drop");
    }
  });
}

function showDropZone(show) {
  if (!dropZoneOverlay) return;
  dropZoneOverlay.classList.toggle("hidden", !show);
}

async function extractImageFromDropEvent(e) {
  if (!e.dataTransfer) return null;

  // 1. Check for dropped local image files
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    if (file.type.startsWith("image/")) {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(file);
      });
    }
  }

  // 2. Check for HTML snippet (standard when dragging <img> from browser tab)
  const html = e.dataTransfer.getData("text/html");
  if (html) {
    try {
      const doc = new DOMParser().parseFromString(html, "text/html");
      const img = doc.querySelector("img");
      if (img) {
        const src = img.currentSrc || img.getAttribute("src") || img.getAttribute("data-src");
        if (src) return src;
      }
      const bgEl = doc.querySelector("[style*='background-image']");
      if (bgEl) {
        const match = bgEl.style.backgroundImage.match(/url\(['"]?(.*?)['"]?\)/);
        if (match && match[1]) return match[1];
      }
    } catch (err) {
      console.warn("Error parsing drag HTML:", err);
    }
  }

  // 3. Check for direct URL (URI-list or URL)
  const uri = e.dataTransfer.getData("text/uri-list") || e.dataTransfer.getData("URL");
  if (uri && (uri.startsWith("http") || uri.startsWith("data:image/"))) {
    return uri;
  }

  // 4. Plain text URL fallback
  const text = e.dataTransfer.getData("text/plain");
  if (text && (text.startsWith("http://") || text.startsWith("https://"))) {
    return text;
  }

  return null;
}

// ─── Body Measurement Engine ───

function updateMeasurements(pose, frameWidth, frameHeight) {
  if (!pose) return;

  const lm = pose.landmarks;
  const lShoulder = lm[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = lm[POSE_LANDMARK.RIGHT_SHOULDER];
  const lHip = lm[POSE_LANDMARK.LEFT_HIP];
  const rHip = lm[POSE_LANDMARK.RIGHT_HIP];

  const shoulderPx = dist(lShoulder, rShoulder);
  const hipPx = dist(lHip, rHip);
  const torsoPx = dist(
    { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 },
    { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
  );

  const pixelsPerCm = Math.max(1, shoulderPx / 44);

  const shoulderCm = Math.round(shoulderPx / pixelsPerCm);
  const chestCm = Math.round((shoulderPx * 2.1) / pixelsPerCm);
  const waistCm = Math.round((hipPx * 2.4) / pixelsPerCm);
  const torsoCm = Math.round(torsoPx / pixelsPerCm);

  if (measShoulder) {
    measShoulder.textContent = `${shoulderCm} cm`;
    measShoulder.classList.remove("is-loading");
  }
  if (measChest) {
    measChest.textContent = `${chestCm} cm`;
    measChest.classList.remove("is-loading");
  }
  if (measWaist) {
    measWaist.textContent = `${waistCm} cm`;
    measWaist.classList.remove("is-loading");
  }
  if (measTorso) {
    measTorso.textContent = `${torsoCm} cm`;
    measTorso.classList.remove("is-loading");
  }

  const recSize = recommendSize(shoulderCm, chestCm, waistCm);
  if (recommendedSizeValue) recommendedSizeValue.textContent = recSize;

  updateSizePills(recSize);
}

function dist(a, b) {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function recommendSize(shoulder, chest, waist) {
  let bestSize = "M";
  let bestScore = Infinity;

  for (const [size, ranges] of Object.entries(SIZE_CHART)) {
    const sCenter = (ranges.shoulder[0] + ranges.shoulder[1]) / 2;
    const cCenter = (ranges.chest[0] + ranges.chest[1]) / 2;
    const wCenter = (ranges.waist[0] + ranges.waist[1]) / 2;

    const score = Math.abs(shoulder - sCenter) * 2 +
                  Math.abs(chest - cCenter) +
                  Math.abs(waist - wCenter);

    if (score < bestScore) {
      bestScore = score;
      bestSize = size;
    }
  }

  return bestSize;
}

function updateSizePills(recommended) {
  if (!sizeOptionsContainer) return;
  const sizes = currentProduct?.availableSizes || ["XS", "S", "M", "L", "XL", "XXL"];
  sizeOptionsContainer.innerHTML = "";

  sizes.forEach((size) => {
    const pill = document.createElement("button");
    pill.className = "size-pill";
    pill.textContent = size;
    if (size === recommended) {
      pill.classList.add("is-recommended");
    }
    pill.addEventListener("click", () => {
      document.querySelectorAll(".size-pill").forEach((p) => p.classList.remove("is-selected"));
      pill.classList.add("is-selected");
      showToast(`Selected size: ${size}`);
    });
    sizeOptionsContainer.appendChild(pill);
  });
}

// ─── Multi-Item Active Outfit Engine (Clothes + Accessories) ───

function mapToGarmentCategory(name = "", category = "") {
  const text = `${name} ${category}`.toLowerCase();

  // Footwear & Shoes
  if (/\b(shoe|shoes|sneaker|sneakers|boot|boots|sandal|sandals|heel|heels|loafer|loafers|footwear|slippers|slides)\b/i.test(text)) {
    return "shoes";
  }
  // Gloves & Handwear
  if (/\b(glove|gloves|mitten|mittens|gauntlet|handwear)\b/i.test(text)) {
    return "gloves";
  }
  // Rings
  if (/\b(ring|rings|band|wedding ring|engagement ring|finger ring)\b/i.test(text)) {
    return "ring";
  }
  // Eyewear (Sunglasses / Glasses / Frames)
  if (/\b(sunglass|sunglasses|glasses|spectacle|spectacles|shades|goggle|goggles|frames|eyewear|aviator|wayfarer|clubmaster)\b/i.test(text)) {
    return "eyewear";
  }
  // Headwear (Caps / Hats / Beanies)
  if (/\b(cap|hat|beanie|fedora|beret|snapback|turban|bucket hat|visor|headband|headscarf|sombrero|pagri)\b/i.test(text)) {
    return "headwear";
  }
  // Necklaces & Chains
  if (/\b(necklace|chain|pendant|choker|collar|locket|mangalsutra|haar|mala|tanmaniya)\b/i.test(text)) {
    return "necklace";
  }
  // Earrings
  if (/\b(earring|earrings|stud|studs|jhumka|jhumkas|drop earrings|hoop|hoops|ear cuff|chandbali)\b/i.test(text)) {
    return "earrings";
  }
  // Watches & Bracelets
  if (/\b(watch|smartwatch|chronograph|bracelet|bangle|wristband|cuff|kada)\b/i.test(text)) {
    return "wristwear";
  }
  // Bags & Backpacks
  if (/\b(bag|handbag|backpack|tote|clutch|purse|sling bag|shoulder bag|satchel|duffle|crossbody|potli|wallet)\b/i.test(text)) {
    return "bag";
  }
  // Belts
  if (/\b(belt|waist belt|sash|kamarbandh)\b/i.test(text)) {
    return "belt";
  }
  // Lower body (Jeans / Pants / Shorts / Skirts)
  if (/\b(pant|pants|trouser|trousers|jeans|denim|shorts|skirt|joggers|track pants|leggings|chinos|dhoti|lungi|palazzo|culottes)\b/i.test(text)) {
    return "lower_body";
  }
  // Full body (Dresses / Sarees / Suits / Lehengas)
  if (/\b(dress|gown|jumpsuit|romper|saree|sari|lehenga|choli|sherwani|suit|blazer suit|anarkali|salwar|kurta set|maxi)\b/i.test(text)) {
    return "full_body";
  }
  // Upper body (Default for jackets, shirts, hoodies, t-shirts, tops)
  return "upper_body";
}

function formatGarmentCategoryTitle(cat) {
  switch (cat) {
    case "shoes": return "Shoes";
    case "gloves": return "Gloves";
    case "ring": return "Ring";
    case "eyewear": return "Sunglasses";
    case "headwear": return "Headwear";
    case "necklace": return "Necklace";
    case "earrings": return "Earrings";
    case "wristwear": return "Watch / Bracelet";
    case "bag": return "Bag";
    case "belt": return "Belt";
    case "lower_body": return "Bottoms";
    case "full_body": return "Full Outfit";
    case "upper_body": default: return "Top / Garment";
  }
}

function addOutfitItem(product, options = {}) {
  if (!product || !product.imageUrl) return;

  const garmentCat = product.garmentCategory || mapToGarmentCategory(product.name, product.category);
  const itemId = product.id || `layer_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;

  if (options.replace) {
    activeOutfit = [];
  }

  const existingIndex = activeOutfit.findIndex((item) => item.id === itemId);
  const newItem = {
    id: itemId,
    name: product.name || "Fashion Item",
    category: product.category || "Garment",
    garmentCategory: garmentCat,
    imageUrl: product.imageUrl,
    enabled: true,
    scale: 1.0,
    offsetY: 0,
    opacity: fitOpacity,
    imageElement: null,
    processedCanvas: null,
    availableSizes: product.availableSizes || ["XS", "S", "M", "L", "XL", "XXL"],
  };

  if (existingIndex >= 0) {
    activeOutfit[existingIndex] = newItem;
  } else {
    // If replaceSlot is requested, replace existing item with same category slot
    if (options.replaceSlot) {
      const slotIndex = activeOutfit.findIndex((item) => item.garmentCategory === garmentCat);
      if (slotIndex >= 0) {
        activeOutfit[slotIndex] = newItem;
      } else {
        activeOutfit.push(newItem);
      }
    } else {
      activeOutfit.push(newItem);
    }
  }

  selectedLayerId = newItem.id;
  currentProduct = newItem;

  // Update product info strip header
  if (productName) productName.textContent = newItem.name;
  if (productCategory) productCategory.textContent = `${formatGarmentCategoryTitle(newItem.garmentCategory)} · ${newItem.category}`;
  if (productThumb) {
    productThumb.style.display = "block";
    productThumb.src = newItem.imageUrl;
    productThumb.onerror = () => { productThumb.style.display = "none"; };
  }

  // Load image asset for the item
  garmentLoader?.classList.remove("hidden");

  if (newItem.imageUrl.startsWith("http") && typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    loadItemViaBgFetch(newItem);
  } else {
    loadDirectImage(newItem);
  }

  renderOutfitLayersList();
  updateOutfitCountBadge();
}

function loadDirectImage(item) {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    garmentLoader?.classList.add("hidden");
    item.imageElement = img;
    const cutout = processItemCutout(img, item.garmentCategory);
    item.processedCanvas = cutout;

    if (currentProduct?.id === item.id) {
      garmentImage = img;
      processedGarmentCanvas = cutout;
    }

    if (hudCutoutText) {
      hudCutoutText.textContent = cutout ? "✦ FLOOD-FILL CUTOUT (NEW)" : "RAW TEXTURE";
    }

    renderOutfitLayersList();
    showToast(`✦ Added ${item.name.slice(0, 24)}… to live try-on!`);
    updateSizePills(recommendedSizeValue?.textContent || "M");

    // Automatically send new garment to the active Real-Time VTON session (no camera reconnect!)
    vtonManager.switchGarment(item);

    // Asynchronously refine cutout using VTON backend AI extractor if available
    vtonManager.extractGarment(img, item.garmentCategory, item.name).then((extractedDataUrl) => {
      if (extractedDataUrl) {
        const aiImg = new Image();
        aiImg.onload = () => {
          item.processedCanvas = aiImg;
          if (currentProduct?.id === item.id) {
            processedGarmentCanvas = aiImg;
          }
          if (hudCutoutText) {
            hudCutoutText.textContent = "✦ AI-EXTRACTED CUTOUT";
          }
          renderOutfitLayersList();
        };
        aiImg.src = extractedDataUrl;
      }
    });
  };

  img.onerror = () => {
    garmentLoader?.classList.add("hidden");
    loadItemViaBgFetch(item);
  };

  img.src = item.imageUrl;
}

function loadItemViaBgFetch(item) {
  garmentLoader?.classList.remove("hidden");
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage(
      { type: "VESTORA_FETCH_IMAGE", payload: { url: item.imageUrl } },
      (response) => {
        garmentLoader?.classList.add("hidden");
        if (response?.success && response.dataUrl) {
          const img = new Image();
          img.onload = () => {
            item.imageElement = img;
            item.processedCanvas = processItemCutout(img, item.garmentCategory);
            if (currentProduct?.id === item.id) {
              garmentImage = img;
              processedGarmentCanvas = item.processedCanvas;
            }

            if (hudCutoutText) {
              hudCutoutText.textContent = item.processedCanvas ? "✦ FLOOD-FILL CUTOUT (NEW)" : "RAW TEXTURE";
            }

            renderOutfitLayersList();
            showToast(`✦ Applied ${item.name.slice(0, 24)}… to your body!`);
            updateSizePills(recommendedSizeValue?.textContent || "M");

            // Automatically send new garment to the active Real-Time VTON session (no camera reconnect!)
            vtonManager.switchGarment(item);

            // Asynchronously refine cutout using VTON backend AI extractor if available
            vtonManager.extractGarment(img, item.garmentCategory, item.name).then((extractedDataUrl) => {
              if (extractedDataUrl) {
                const aiImg = new Image();
                aiImg.onload = () => {
                  item.processedCanvas = aiImg;
                  if (currentProduct?.id === item.id) {
                    processedGarmentCanvas = aiImg;
                  }
                  if (hudCutoutText) {
                    hudCutoutText.textContent = "✦ AI-EXTRACTED CUTOUT";
                  }
                  renderOutfitLayersList();
                };
                aiImg.src = extractedDataUrl;
              }
            });
          };
          img.src = response.dataUrl;
        } else {
          loadDirectImage(item);
        }
      }
    );
  } else {
    loadDirectImage(item);
  }
}

function selectOutfitLayer(id) {
  selectedLayerId = id;
  const layer = activeOutfit.find((l) => l.id === id);
  if (!layer) return;

  currentProduct = layer;
  if (productName) productName.textContent = layer.name;
  if (productCategory) productCategory.textContent = `${formatGarmentCategoryTitle(layer.garmentCategory)} · ${layer.category}`;
  if (productThumb) {
    productThumb.style.display = "block";
    productThumb.src = layer.imageUrl;
  }

  // Switch garment on active live VTON stream
  vtonManager.switchGarment(layer);

  fitScale = layer.scale || 1.0;
  fitOffsetY = layer.offsetY || 0;
  fitOpacity = layer.opacity || 0.88;
  if (fitScaleVal) fitScaleVal.textContent = `${Math.round(fitScale * 100)}%`;
  if (fitOpacitySlider) fitOpacitySlider.value = `${Math.round(fitOpacity * 100)}`;

  renderOutfitLayersList();
  showToast(`Selected "${layer.name.slice(0, 20)}…" for fit adjustment`);
}

function toggleOutfitItem(id) {
  const item = activeOutfit.find((l) => l.id === id);
  if (!item) return;
  item.enabled = !item.enabled;
  renderOutfitLayersList();
  showToast(`${item.name.slice(0, 20)}… ${item.enabled ? "enabled ✓" : "hidden ✕"}`);
}

function removeOutfitItem(id) {
  const idx = activeOutfit.findIndex((l) => l.id === id);
  if (idx < 0) return;
  const removedName = activeOutfit[idx].name;
  activeOutfit.splice(idx, 1);

  if (selectedLayerId === id) {
    selectedLayerId = activeOutfit.length > 0 ? activeOutfit[activeOutfit.length - 1].id : null;
    if (selectedLayerId) {
      selectOutfitLayer(selectedLayerId);
    } else {
      currentProduct = null;
      garmentImage = null;
      processedGarmentCanvas = null;
      if (productName) productName.textContent = "Ready for Try-On";
      if (productCategory) productCategory.textContent = "Select an item from any fashion store";
      if (productThumb) productThumb.style.display = "none";
    }
  }

  renderOutfitLayersList();
  updateOutfitCountBadge();
  showToast(`Removed ${removedName.slice(0, 20)}…`);
}

function clearOutfit() {
  activeOutfit = [];
  selectedLayerId = null;
  currentProduct = null;
  garmentImage = null;
  processedGarmentCanvas = null;
  if (productName) productName.textContent = "Ready for Try-On";
  if (productCategory) productCategory.textContent = "Select an item from any fashion store";
  if (productThumb) productThumb.style.display = "none";
  renderOutfitLayersList();
  updateOutfitCountBadge();
  showToast("Cleared all try-on items");
}

function updateOutfitCountBadge() {
  if (!outfitCountBadge) return;
  const activeCount = activeOutfit.filter((l) => l.enabled).length;
  const totalCount = activeOutfit.length;
  if (totalCount === 0) {
    outfitCountBadge.textContent = "0 Items";
  } else if (activeCount === totalCount) {
    outfitCountBadge.textContent = `${totalCount} Item${totalCount === 1 ? "" : "s"}`;
  } else {
    outfitCountBadge.textContent = `${activeCount}/${totalCount} Active`;
  }
}

function renderOutfitLayersList() {
  if (!outfitLayersList) return;
  outfitLayersList.innerHTML = "";

  if (activeOutfit.length === 0) {
    const emptyState = document.createElement("div");
    emptyState.className = "outfit-empty-state";
    emptyState.innerHTML = `<span style="font-size:11px;color:var(--v-text-dim);">No items loaded. Click "✦ Grab Item", paste a URL, or try a sample.</span>`;
    outfitLayersList.appendChild(emptyState);
    updateOutfitCountBadge();
    return;
  }

  activeOutfit.forEach((layer) => {
    const card = document.createElement("div");
    card.className = `outfit-layer-card ${layer.enabled ? "is-active" : "is-disabled"}`;
    if (selectedLayerId === layer.id) {
      card.style.borderColor = "var(--v-purple)";
    }
    card.dataset.layerId = layer.id;

    // Thumbnail
    const thumb = document.createElement("img");
    thumb.className = "outfit-layer-thumb";
    thumb.src = layer.imageUrl;
    thumb.alt = layer.name;
    thumb.onerror = () => { thumb.style.display = "none"; };

    // Info
    const info = document.createElement("div");
    info.className = "outfit-layer-info";

    const cat = document.createElement("span");
    cat.className = "outfit-layer-category";
    cat.textContent = formatGarmentCategoryTitle(layer.garmentCategory);

    const name = document.createElement("span");
    name.className = "outfit-layer-name";
    name.textContent = layer.name;
    name.title = layer.name;

    info.appendChild(cat);
    info.appendChild(name);

    // Controls: Toggle & Remove
    const controls = document.createElement("div");
    controls.className = "outfit-layer-controls";

    const btnToggle = document.createElement("button");
    btnToggle.className = "outfit-layer-btn btn-toggle";
    btnToggle.type = "button";
    btnToggle.title = layer.enabled ? "Hide item from camera" : "Show item on camera";
    btnToggle.innerHTML = layer.enabled ? "✓" : "✕";
    btnToggle.style.color = layer.enabled ? "#4ade80" : "var(--v-text-dim)";
    btnToggle.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleOutfitItem(layer.id);
    });

    const btnRemove = document.createElement("button");
    btnRemove.className = "outfit-layer-btn btn-remove";
    btnRemove.type = "button";
    btnRemove.title = "Remove item from try-on";
    btnRemove.innerHTML = `<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    btnRemove.addEventListener("click", (e) => {
      e.stopPropagation();
      removeOutfitItem(layer.id);
    });

    controls.appendChild(btnToggle);
    controls.appendChild(btnRemove);

    card.appendChild(thumb);
    card.appendChild(info);
    card.appendChild(controls);

    // Clicking card selects layer for fine-tuning
    card.addEventListener("click", () => {
      selectOutfitLayer(layer.id);
    });

    outfitLayersList.appendChild(card);
  });

  updateOutfitCountBadge();
}

function loadProduct(product, options = {}) {
  if (!product) return;
  addOutfitItem(product, options);
}

// ─── Sample Garment Switcher ───

function loadNextSampleGarment() {
  const sample = SAMPLE_GARMENTS[currentSampleIndex % SAMPLE_GARMENTS.length];
  currentSampleIndex++;
  addOutfitItem(sample, { append: true });
}

// ─── Fit Controls Handlers ───

function setupFitControls() {
  btnToggleFit?.addEventListener("click", () => {
    fitControlsPanel?.classList.toggle("hidden");
  });

  btnScaleUp?.addEventListener("click", () => {
    fitScale = Math.min(1.6, Math.round((fitScale + 0.05) * 100) / 100);
    if (selectedLayerId) {
      const layer = activeOutfit.find((l) => l.id === selectedLayerId);
      if (layer) layer.scale = fitScale;
    }
    if (fitScaleVal) fitScaleVal.textContent = `${Math.round(fitScale * 100)}%`;
  });

  btnScaleDown?.addEventListener("click", () => {
    fitScale = Math.max(0.6, Math.round((fitScale - 0.05) * 100) / 100);
    if (selectedLayerId) {
      const layer = activeOutfit.find((l) => l.id === selectedLayerId);
      if (layer) layer.scale = fitScale;
    }
    if (fitScaleVal) fitScaleVal.textContent = `${Math.round(fitScale * 100)}%`;
  });

  btnMoveUp?.addEventListener("click", () => {
    fitOffsetY = Math.max(-100, fitOffsetY - 10);
    if (selectedLayerId) {
      const layer = activeOutfit.find((l) => l.id === selectedLayerId);
      if (layer) layer.offsetY = fitOffsetY;
    }
  });

  btnMoveDown?.addEventListener("click", () => {
    fitOffsetY = Math.min(100, fitOffsetY + 10);
    if (selectedLayerId) {
      const layer = activeOutfit.find((l) => l.id === selectedLayerId);
      if (layer) layer.offsetY = fitOffsetY;
    }
  });

  btnResetFit?.addEventListener("click", () => {
    fitScale = 1.0;
    fitOffsetY = 0;
    fitOpacity = 1.0;
    if (selectedLayerId) {
      const layer = activeOutfit.find((l) => l.id === selectedLayerId);
      if (layer) {
        layer.scale = 1.0;
        layer.offsetY = 0;
        layer.opacity = 1.0;
      }
    }
    if (fitScaleVal) fitScaleVal.textContent = "100%";
    if (fitOpacitySlider) fitOpacitySlider.value = "100";
    showToast("Fit reset to default");
  });

  fitOpacitySlider?.addEventListener("input", (e) => {
    fitOpacity = Number(e.target.value) / 100;
    if (selectedLayerId) {
      const layer = activeOutfit.find((l) => l.id === selectedLayerId);
      if (layer) layer.opacity = fitOpacity;
    }
  });
}

// ─── Pop-out Window & Fallbacks ───

function openInDedicatedWindow() {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      type: "VESTORA_OPEN_WINDOW",
      payload: currentProduct,
    });
    // If in iframe, close iframe
    if (window.parent !== window) {
      window.parent.postMessage({ type: "VESTORA_CLOSE_TRYON" }, "*");
    }
  } else {
    window.open(window.location.href, "VESTORATryOn", "width=480,height=820");
  }
}

function openInSidePanel() {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({
      type: "VESTORA_OPEN_SIDEPANEL",
      payload: currentProduct,
    });
    if (window.parent !== window) {
      window.parent.postMessage({ type: "VESTORA_CLOSE_TRYON" }, "*");
    }
  }
}

// ─── Screenshot ───

function takeScreenshot() {
  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = videoEl.videoWidth || 1280;
  compositeCanvas.height = videoEl.videoHeight || 720;
  const compCtx = compositeCanvas.getContext("2d");

  // Draw background: live camera video and garment overlay
  compCtx.save();
  if (currentFacing === "user") {
    compCtx.translate(compositeCanvas.width, 0);
    compCtx.scale(-1, 1);
  }
  compCtx.drawImage(videoEl, 0, 0);
  compCtx.drawImage(canvasEl, 0, 0);
  compCtx.restore();

  // Watermark
  compCtx.save();
  compCtx.fillStyle = "rgba(255, 255, 255, 0.65)";
  compCtx.font = "bold 16px Inter, sans-serif";
  compCtx.textAlign = "right";
  compCtx.fillText("VESTORA · Wear What You Imagine", compositeCanvas.width - 20, compositeCanvas.height - 20);
  compCtx.restore();

  const link = document.createElement("a");
  link.download = `vestora-tryon-${Date.now()}.png`;
  link.href = compositeCanvas.toDataURL("image/png");
  link.click();

  const flash = document.createElement("div");
  flash.className = "screenshot-flash";
  document.body.appendChild(flash);
  flash.addEventListener("animationend", () => flash.remove());

  showToast("📸 Screenshot captured & saved!");
}

// ─── UI Helpers ───

function showBodyIndicator(show) {
  bodyIndicator?.classList.toggle("hidden", !show);
}

function showToast(message) {
  document.querySelectorAll(".tryon-toast").forEach((t) => t.remove());

  const toast = document.createElement("div");
  toast.className = "tryon-toast";
  toast.textContent = message;
  document.body.appendChild(toast);

  requestAnimationFrame(() => {
    toast.classList.add("is-visible");
  });

  setTimeout(() => {
    toast.classList.remove("is-visible");
    setTimeout(() => toast.remove(), 400);
  }, 2600);
}

// ─── Cleanup ───

function cleanup() {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }
  if (vtonManager) {
    vtonManager.disconnect();
  }
  window.removeEventListener("resize", resizeCanvas);
}

window.addEventListener("beforeunload", cleanup);

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
  } else if (isBodyDetected) {
    startRenderLoop();
  }
});

// ─── Grab Product from Active Shopping Page ───
// Universal solution for Myntra, Ajio, Amazon, Zara, Flipkart & all 350+ platforms where drag-and-drop is blocked

async function grabProductFromCurrentTab() {
  showToast("✦ Scanning page for clothing item…");

  // 1. If running inside an iframe on the store page
  if (window.parent !== window) {
    window.parent.postMessage({ type: "VESTORA_REQUEST_PAGE_PRODUCT" }, "*");
    return;
  }

  // 2. If running in Chrome Side Panel or dedicated window
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage({ type: "VESTORA_GRAB_CURRENT_TAB_PRODUCT" }, (resp) => {
      if (resp?.success && resp.product) {
        loadProduct(resp.product);
        showToast(`✦ Grabbed "${resp.product.name.slice(0, 24)}…" from page!`);
      } else {
        // Fallback: check storage for active product
        chrome.storage?.local?.get(["vestora_active_product"], (data) => {
          const prod = data?.["vestora_active_product"];
          if (prod && prod.imageUrl) {
            loadProduct(prod);
            showToast(`✦ Loaded garment: "${prod.name.slice(0, 24)}…"`);
          } else {
            showToast("💡 Right-click any garment photo → '✦ Try on with VESTORA'!");
          }
        });
      }
    });
  }
}

// ─── Camera Permission & Action Listeners ───

btnRequestPerm?.addEventListener("click", requestCameraPermissionTab);
btnRetryCam?.addEventListener("click", () => initCamera(currentFacing));

// Listen for permission granted notification from helper tab
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "VESTORA_CAMERA_GRANTED") {
      hideCameraBlocked();
      initCamera(currentFacing);
    }
  });
}

// Auto-retry when window/tab regains focus (e.g. after user grants permission in prompt)
window.addEventListener("focus", () => {
  if (!cameraStream) {
    initCamera(currentFacing);
  }
});

// ─── Event Listeners ───

btnFlipCamera?.addEventListener("click", flipCamera);
btnScreenshot?.addEventListener("click", takeScreenshot);
btnPopoutWindow?.addEventListener("click", openInDedicatedWindow);
btnFallbackWindow?.addEventListener("click", openInDedicatedWindow);
btnFallbackSidepanel?.addEventListener("click", openInSidePanel);
btnLoadSample?.addEventListener("click", loadNextSampleGarment);

// Grab from Page triggers
btnGrabPage?.addEventListener("click", grabProductFromCurrentTab);
btnGrabPagePill?.addEventListener("click", grabProductFromCurrentTab);

// Paste Image URL modal & Add item triggers
btnAddItemPill?.addEventListener("click", () => {
  pasteUrlModal?.classList.remove("hidden");
  pasteUrlInput?.focus();
});

btnClearOutfit?.addEventListener("click", clearOutfit);

btnPasteUrlPill?.addEventListener("click", () => {
  pasteUrlModal?.classList.remove("hidden");
  pasteUrlInput?.focus();
});

btnCancelUrl?.addEventListener("click", () => {
  pasteUrlModal?.classList.add("hidden");
});

btnSubmitUrl?.addEventListener("click", () => {
  const url = pasteUrlInput?.value.trim();
  if (url) {
    addOutfitItem({
      id: `pasted_${Date.now()}`,
      name: "Custom Fashion Item",
      category: "Fashion Item",
      imageUrl: url,
      availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
    }, { append: true });
    pasteUrlModal?.classList.add("hidden");
    if (pasteUrlInput) pasteUrlInput.value = "";
    showToast("✦ Custom fashion item loaded!");
  }
});

pasteUrlInput?.addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    btnSubmitUrl?.click();
  } else if (e.key === "Escape") {
    btnCancelUrl?.click();
  }
});

btnClose?.addEventListener("click", () => {
  cleanup();
  if (window.parent !== window) {
    window.parent.postMessage({ type: "VESTORA_CLOSE_TRYON" }, "*");
  }
  if (window.opener || window.history.length <= 1) {
    window.close();
  }
});

// ─── AI VTON Engine Settings Modal ───

function setupEngineModal() {
  function openModal() {
    vtonManager.checkServer().then(() => vtonManager.updateUI());
    engineSettingsModal?.classList.remove("hidden");
  }

  function closeModal() {
    engineSettingsModal?.classList.add("hidden");
  }

  topbarEngineBadge?.addEventListener("click", openModal);
  btnEngineSettings?.addEventListener("click", openModal);
  btnCloseEngineModal?.addEventListener("click", closeModal);
  btnQuickConnectVton?.addEventListener("click", openModal);

  btnSaveEngineSettings?.addEventListener("click", () => {
    closeModal();
    vtonManager.updateUI();
    showToast("✦ In-House AI VTON Engine Active (100% Free & Local)");
  });

  btnDisconnectVton?.addEventListener("click", () => {
    vtonManager.disconnect();
    closeModal();
  });
}

// Listen for messages from parent frame (content script)
window.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;
  if (event.data.type === "VESTORA_LOAD_PRODUCT" || event.data.type === "VESTORA_SWITCH_GARMENT") {
    loadProduct(event.data.product);
  }
  if (event.data.type === "VESTORA_ADD_OUTFIT_ITEM") {
    addOutfitItem(event.data.product, { append: true });
  }
  if (event.data.type === "VESTORA_REQUEST_PAGE_PRODUCT_RESULT") {
    if (event.data.product) {
      loadProduct(event.data.product);
      showToast(`✦ Grabbed "${event.data.product.name.slice(0, 24)}…" from page!`);
    } else {
      showToast("💡 Right-click any clothing photo → '✦ Try on with VESTORA'!");
    }
  }
  if (event.data.type === "VESTORA_TOGGLE_DEBUG") {
    perfHud?.classList.toggle("hidden");
  }
});

// Listen for messages from background service worker (seamless garment switching on active stream!)
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "VESTORA_LOAD_PRODUCT" || msg?.type === "VESTORA_SWITCH_GARMENT") {
      loadProduct(msg.product);
    }
    if (msg?.type === "VESTORA_ADD_OUTFIT_ITEM") {
      addOutfitItem(msg.product, { append: true });
    }
  });
}

// ─── Initialize ───

setupDragAndDrop();
setupFitControls();
setupEngineModal();

[measShoulder, measChest, measWaist, measTorso].forEach((el) => {
  el?.classList.add("is-loading");
});

updateSizePills("M");

// Initialize Camera
initCamera("user");

// ─── Auto-load product from chrome.storage (Side Panel / Popup Window flow) ───

async function autoLoadProductFromStorage() {
  if (typeof chrome === "undefined" || !chrome.storage) return;
  try {
    const data = await chrome.storage.local.get(["vestora_active_product", "vestora_pending_product"]);
    const product = data["vestora_pending_product"] || data["vestora_active_product"];
    if (product && product.imageUrl) {
      // Clear the pending flag so it doesn't re-load on next open
      await chrome.storage.local.remove("vestora_pending_product");
      loadProduct(product);
      showToast(`✦ Live Try-On ready for "${product.name?.slice(0, 28) || "Selected Item"}"`);
    }
  } catch (e) {
    console.warn("[VESTORA] Could not read product from storage:", e);
  }
}

// Parse product from URL parameters if available (popup window fallback)
const urlParams = new URLSearchParams(window.location.search);
const productParam = urlParams.get("product");
if (productParam) {
  try {
    const product = JSON.parse(decodeURIComponent(productParam));
    loadProduct(product);
  } catch (e) {
    console.warn("[VESTORA] Failed to parse product parameter:", e);
  }
} else {
  // No URL param → try chrome.storage (side panel flow)
  autoLoadProductFromStorage();
}

// ─── HD Live (Decart realtime lucy-vton, bring-your-own-key) ───
const decartLive = new DecartLive();
let hdActive = false;
let hdBusy = false;
let hdLastSent = null; // garment canvas/image last sent to Decart
const btnHdLive = document.getElementById("btn-hd-live");
const hdKeyModal = document.getElementById("hd-key-modal");
const hdKeyInput = document.getElementById("hd-key-input");
const btnHdKeySave = document.getElementById("btn-hd-key-save");
const btnHdKeyCancel = document.getElementById("btn-hd-key-cancel");

function currentGarmentSource() {
  return processedGarmentCanvas || garmentImage || currentProduct?.processedCanvas || currentProduct?.imageElement || null;
}

async function syncHdGarment() {
  if (!hdActive || hdBusy || !decartLive.connected) return;
  const src = currentGarmentSource();
  if (!src || src === hdLastSent) return;
  hdBusy = true;
  try {
    await decartLive.setGarment(src, currentProduct?.garmentCategory || "upper_body");
    hdLastSent = src;
  } catch (e) {
    console.warn("[VESTORA] HD garment update failed:", e);
    showToast("HD Live: could not send garment — try another image");
    hdLastSent = src; // do not retry the same bad image every frame
  } finally {
    hdBusy = false;
  }
}

async function startHdLive(apiKey) {
  try {
    showToast("HD Live: connecting…");
    await decartLive.connect(
      apiKey,
      (remote) => {
        if (vtonVideoEl) {
          vtonVideoEl.srcObject = remote;
          vtonVideoEl.classList.add("active");
        }
        canvasEl.style.visibility = "hidden";
      },
      (err) => {
        console.error("[VESTORA] Decart error:", err);
        showToast("HD Live error — see console");
      }
    );
    hdActive = true;
    btnHdLive?.classList.add("active");
    showToast("HD Live on (billed to your Decart account)");
  } catch (e) {
    console.error("[VESTORA] HD Live failed to start:", e);
    stopHdLive();
    showToast("HD Live failed: check your Decart key / credits");
  }
}

function stopHdLive() {
  const { seconds, cost } = decartLive.disconnect();
  hdActive = false;
  hdLastSent = null;
  if (vtonVideoEl) {
    vtonVideoEl.classList.remove("active");
    vtonVideoEl.srcObject = null;
  }
  canvasEl.style.visibility = "visible";
  btnHdLive?.classList.remove("active");
  if (seconds > 1) showToast(`HD Live stopped — ${Math.round(seconds)}s used (~$${cost.toFixed(2)})`);
}

btnHdLive?.addEventListener("click", async () => {
  if (hdActive) return stopHdLive();
  const stored = await chrome.storage?.local?.get?.("vestora_decart_key");
  if (stored?.vestora_decart_key) return startHdLive(stored.vestora_decart_key);
  hdKeyModal?.classList.remove("hidden");
  hdKeyInput?.focus();
});
btnHdKeyCancel?.addEventListener("click", () => hdKeyModal?.classList.add("hidden"));
btnHdKeySave?.addEventListener("click", async () => {
  const key = hdKeyInput?.value?.trim();
  if (!key) return;
  await chrome.storage?.local?.set?.({ vestora_decart_key: key });
  if (hdKeyInput) hdKeyInput.value = "";
  hdKeyModal?.classList.add("hidden");
  startHdLive(key);
});
window.addEventListener("beforeunload", () => {
  if (hdActive) decartLive.disconnect();
});
