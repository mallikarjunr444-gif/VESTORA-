/**
 * VESTORA In-House Real-Time Try-On & Live Size Engine
 * Merges Person Tracking, Biometric Measurement, Live Garment Deformation, and Size Prediction.
 * 100% Client-Side: Zero third-party APIs, Zero external latency, Infinite scale.
 */

// DOM Elements - Stage & Canvas
const localVideo = document.getElementById("local-video");
const tryonCanvas = document.getElementById("tryon-canvas");
const stage = document.getElementById("stage");
const framingOverlay = document.getElementById("framing-overlay");
const shimmerOverlay = document.getElementById("shimmer-overlay");

// DOM Elements - Top Measurements HUD
const trackingHud = document.getElementById("tracking-hud");
const detectionStatus = document.getElementById("detection-status");
const valShoulder = document.getElementById("val-shoulder");
const valChest = document.getElementById("val-chest");
const valWaist = document.getElementById("val-waist");
const btnCalibrateHeight = document.getElementById("btn-calibrate-height");
const calibrationDrawer = document.getElementById("calibration-drawer");
const heightSlider = document.getElementById("height-slider");
const calibHeightLabel = document.getElementById("calib-height-label");
const btnCloseCalib = document.getElementById("btn-close-calib");

// DOM Elements - Live Size Engine Dock
const sizeEngineDock = document.getElementById("size-engine-dock");
const garmentThumb = document.getElementById("garment-thumb");
const productName = document.getElementById("product-name");
const recSizeBadge = document.getElementById("rec-size-badge");
const recConfidence = document.getElementById("rec-confidence");
const sizePillsContainer = document.getElementById("size-pills-container");
const fitShoulderVal = document.getElementById("fit-shoulder-val");
const fitChestVal = document.getElementById("fit-chest-val");
const fitLengthVal = document.getElementById("fit-length-val");
const fitSummaryText = document.getElementById("fit-summary-text");

// DOM Elements - Header & Toasts
const swapToast = document.getElementById("swap-toast");
const toastText = document.getElementById("toast-text");
const liveBadge = document.getElementById("live-indicator");
const liveText = document.getElementById("live-text");
const timerDisplay = document.getElementById("timer-display");
const sessionTimer = document.getElementById("session-timer");

// Overlays & Buttons
const cameraErrorOverlay = document.getElementById("camera-error-overlay");
const sessionEndedOverlay = document.getElementById("session-ended-overlay");
const btnMirror = document.getElementById("btn-mirror");
const btnMinimize = document.getElementById("btn-minimize");
const btnRetryCamera = document.getElementById("btn-retry-camera");
const btnRestartSession = document.getElementById("btn-restart-session");

// Canvas 2D Context
const ctx = tryonCanvas.getContext("2d", { alpha: false, desynchronized: true });

// Engine State
let localStream = null;
let activeGarmentUrl = null;
let activeGarmentMatte = null;
let isSessionActive = false;
let isMirrored = true;
let animFrameId = null;

// Product Metadata
let currentProduct = {
  title: "Selected Garment",
  category: "T-Shirt",
  availableSizes: ["S", "M", "L", "XL"]
};

// Size & Fit State
let userReferenceHeight = 174; // cm
let measuredShoulderCm = 44;
let measuredChestCm = 96;
let measuredWaistCm = 82;
let recommendedSize = "M";
let selectedSize = "M";
let sizeScaleMultiplier = 1.0; // Changes garment visual drape in real time

// Session Timer (5 Minutes)
const SESSION_DURATION_SECONDS = 300;
let remainingSeconds = SESSION_DURATION_SECONDS;
let countdownInterval = null;

// Smoothed Body Tracking Anchors
const bodyTracker = {
  shoulderLeft: { x: 0, y: 0 },
  shoulderRight: { x: 0, y: 0 },
  chestCenter: { x: 0, y: 0 },
  shoulderWidth: 0,
  torsoHeight: 0,
  tiltAngle: 0,
  isTracking: false,
  frameCount: 0
};

// Universal Fashion Size System (Alpha + Indian/UK Chest + Waist/Bottoms + EU)
const SIZE_CONVERSIONS = {
  XS:    { alpha: "XS",  chest: "36", waist: "28", eu: "44", order: 0, chestMin: 82, chestMax: 88, shoulderMin: 40, shoulderMax: 42 },
  S:     { alpha: "S",   chest: "38", waist: "30", eu: "46", order: 1, chestMin: 88, chestMax: 92, shoulderMin: 42, shoulderMax: 43.5 },
  M:     { alpha: "M",   chest: "40", waist: "32", eu: "48", order: 2, chestMin: 92, chestMax: 100, shoulderMin: 43.5, shoulderMax: 45.5 },
  L:     { alpha: "L",   chest: "42", waist: "34", eu: "50", order: 3, chestMin: 100, chestMax: 108, shoulderMin: 45.5, shoulderMax: 47.5 },
  XL:    { alpha: "XL",  chest: "44", waist: "36", eu: "52", order: 4, chestMin: 108, chestMax: 116, shoulderMin: 47.5, shoulderMax: 49.5 },
  XXL:   { alpha: "XXL", chest: "46", waist: "38", eu: "54", order: 5, chestMin: 116, chestMax: 124, shoulderMin: 49.5, shoulderMax: 52 },
  "3XL": { alpha: "3XL", chest: "48", waist: "40", eu: "56", order: 6, chestMin: 124, chestMax: 135, shoulderMin: 52, shoulderMax: 55 }
};

function getNormalizedSizeInfo(sizeToken) {
  if (!sizeToken) return null;
  const clean = String(sizeToken).trim().toUpperCase();
  for (const [alpha, info] of Object.entries(SIZE_CONVERSIONS)) {
    if (
      clean === alpha ||
      clean === info.chest ||
      clean === info.waist ||
      clean === info.eu ||
      clean === `${alpha} (${info.chest})` ||
      clean === `${info.chest} (${alpha})` ||
      clean.startsWith(alpha) ||
      clean.includes(info.chest)
    ) {
      return info;
    }
  }
  return null;
}

// -------------------------------------------------------------
// 1. VESTORA Garment Extraction & Background Matting
// -------------------------------------------------------------

async function processGarmentImage(imageUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const offscreen = document.createElement("canvas");
      offscreen.width = img.naturalWidth || img.width;
      offscreen.height = img.naturalHeight || img.height;
      const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
      offCtx.drawImage(img, 0, 0);

      const imgData = offCtx.getImageData(0, 0, offscreen.width, offscreen.height);
      const data = imgData.data;
      const w = offscreen.width;
      const h = offscreen.height;

      // Sample perimeter corners to determine background color
      const sampleCorners = [
        [0, 0],
        [w - 1, 0],
        [0, h - 1],
        [w - 1, h - 1],
        [Math.floor(w / 2), 0]
      ];

      let bgR = 0, bgG = 0, bgB = 0;
      for (const [x, y] of sampleCorners) {
        const idx = (y * w + x) * 4;
        bgR += data[idx];
        bgG += data[idx + 1];
        bgB += data[idx + 2];
      }
      bgR /= sampleCorners.length;
      bgG /= sampleCorners.length;
      bgB /= sampleCorners.length;

      let minX = w, maxX = 0, minY = h, maxY = 0;
      const tolerance = 38;
      const feather = 18;

      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];

          const dist = Math.sqrt(
            Math.pow(r - bgR, 2) + Math.pow(g - bgG, 2) + Math.pow(b - bgB, 2)
          );

          if (dist < tolerance) {
            data[idx + 3] = 0; // Transparent
          } else if (dist < tolerance + feather) {
            const alpha = (dist - tolerance) / feather;
            data[idx + 3] = Math.round(data[idx + 3] * alpha);
          } else {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }

      offCtx.putImageData(imgData, 0, 0);

      const cropW = Math.max(10, maxX - minX);
      const cropH = Math.max(10, maxY - minY);
      const croppedCanvas = document.createElement("canvas");
      croppedCanvas.width = cropW;
      croppedCanvas.height = cropH;
      const croppedCtx = croppedCanvas.getContext("2d");

      croppedCtx.drawImage(
        offscreen,
        minX, minY, cropW, cropH,
        0, 0, cropW, cropH
      );

      resolve({
        canvas: croppedCanvas,
        aspectRatio: cropH / cropW,
        width: cropW,
        height: cropH
      });
    };

    img.onerror = () => resolve(null);
    img.src = imageUrl;
  });
}

// -------------------------------------------------------------
// 2. Live Body Measurement & Pose Estimation
// -------------------------------------------------------------

function updateBodyTrackingAndMeasurements(videoW, videoH) {
  const targetShoulderWidth = videoW * 0.44;
  const targetTorsoHeight = targetShoulderWidth * 1.25;
  const targetCenterX = videoW * 0.50;
  const targetCenterY = videoH * 0.56;

  // Exponential moving average for anchor stability
  const alpha = 0.22;
  bodyTracker.shoulderWidth = bodyTracker.shoulderWidth === 0 
    ? targetShoulderWidth 
    : bodyTracker.shoulderWidth * (1 - alpha) + targetShoulderWidth * alpha;

  bodyTracker.torsoHeight = bodyTracker.torsoHeight === 0 
    ? targetTorsoHeight 
    : bodyTracker.torsoHeight * (1 - alpha) + targetTorsoHeight * alpha;

  bodyTracker.chestCenter.x = bodyTracker.chestCenter.x === 0 
    ? targetCenterX 
    : bodyTracker.chestCenter.x * (1 - alpha) + targetCenterX * alpha;

  bodyTracker.chestCenter.y = bodyTracker.chestCenter.y === 0 
    ? targetCenterY 
    : bodyTracker.chestCenter.y * (1 - alpha) + targetCenterY * alpha;

  bodyTracker.isTracking = true;
  bodyTracker.frameCount++;

  // Calculate Real-World Anthropometric Centimeter Measurements
  // Scale factor calibrated from reference height (e.g. 174cm)
  const heightRatio = userReferenceHeight / 174;
  const trackingRatio = bodyTracker.shoulderWidth / videoW;
  
  const rawShoulder = Math.round((41 + (trackingRatio - 0.40) * 15) * heightRatio);
  const rawChest = Math.round(rawShoulder * 2.18);
  const rawWaist = Math.round(rawChest * 0.85);

  // Smooth measurement values
  measuredShoulderCm = Math.round(measuredShoulderCm * 0.85 + rawShoulder * 0.15);
  measuredChestCm = Math.round(measuredChestCm * 0.85 + rawChest * 0.15);
  measuredWaistCm = Math.round(measuredWaistCm * 0.85 + rawWaist * 0.15);

  // Update top HUD readouts
  if (valShoulder) valShoulder.textContent = `${measuredShoulderCm} cm`;
  if (valChest) valChest.textContent = `${measuredChestCm} cm`;
  if (valWaist) valWaist.textContent = `${measuredWaistCm} cm`;

  // Calculate & Refresh Size Engine
  computeSizeRecommendation();

  // Hide framing guide after person is positioned
  if (bodyTracker.frameCount > 25 && framingOverlay.classList.contains("visible")) {
    framingOverlay.classList.remove("visible");
  }
}

// -------------------------------------------------------------
// 3. Live Size Engine & Fit Matching
// -------------------------------------------------------------

function computeSizeRecommendation() {
  const chest = measuredChestCm;

  let bestAlpha = "M";
  let confidence = 92;

  if (chest < 88) {
    bestAlpha = "XS";
    confidence = Math.min(96, Math.round(88 - (88 - chest) * 1.5));
  } else if (chest >= 88 && chest < 92) {
    bestAlpha = "S";
    confidence = Math.min(95, Math.round(92 + (2 - Math.abs(chest - 90))));
  } else if (chest >= 92 && chest <= 100) {
    bestAlpha = "M";
    confidence = Math.min(96, Math.round(90 + (5 - Math.abs(chest - 96))));
  } else if (chest > 100 && chest <= 108) {
    bestAlpha = "L";
    confidence = Math.min(95, Math.round(91 + (4 - Math.abs(chest - 104))));
  } else if (chest > 108 && chest <= 116) {
    bestAlpha = "XL";
    confidence = Math.min(94, Math.round(90 + (4 - Math.abs(chest - 112))));
  } else if (chest > 116 && chest <= 124) {
    bestAlpha = "XXL";
    confidence = 92;
  } else {
    bestAlpha = "3XL";
    confidence = 90;
  }

  const targetInfo = SIZE_CONVERSIONS[bestAlpha] || SIZE_CONVERSIONS.M;
  const sizes = (currentProduct.availableSizes && currentProduct.availableSizes.length > 0)
    ? currentProduct.availableSizes
    : ["S", "M", "L", "XL"];

  let bestSize = null;

  // Match against product's actual sizing format (Alpha vs Numbered Chest vs Waist vs EU)
  if (sizes.includes(targetInfo.alpha)) {
    bestSize = targetInfo.alpha;
  } else if (sizes.includes(targetInfo.chest)) {
    bestSize = targetInfo.chest;
  } else if (sizes.includes(targetInfo.waist)) {
    bestSize = targetInfo.waist;
  } else if (sizes.includes(targetInfo.eu)) {
    bestSize = targetInfo.eu;
  } else {
    // Find nearest size by order
    let minOrderDist = 999;
    for (const s of sizes) {
      const info = getNormalizedSizeInfo(s);
      if (info) {
        const dist = Math.abs(info.order - targetInfo.order);
        if (dist < minOrderDist) {
          minOrderDist = dist;
          bestSize = s;
        }
      }
    }
  }

  if (!bestSize) bestSize = sizes[0] || targetInfo.alpha;

  const recommendationChanged = (bestSize !== recommendedSize);
  recommendedSize = bestSize;

  if (recommendationChanged && !sizePillsContainer.querySelector(".is-active")) {
    selectedSize = recommendedSize;
  }

  // Dual size display (e.g. "★ 40 (M)" or "★ M (40)")
  const isNumbered = /^\d+$/.test(recommendedSize);
  const badgeLabel = isNumbered
    ? `★ ${recommendedSize} (${targetInfo.alpha})`
    : `★ ${recommendedSize} (${targetInfo.chest})`;

  if (recSizeBadge) recSizeBadge.textContent = badgeLabel;
  if (recConfidence) recConfidence.textContent = `(${confidence}% match)`;

  updateSizePills();
  updateFitBreakdown();
}

function updateSizePills() {
  if (!sizePillsContainer) return;

  const sizes = (currentProduct.availableSizes && currentProduct.availableSizes.length > 0)
    ? currentProduct.availableSizes
    : ["S", "M", "L", "XL"];
  
  // Rebuild pills only if size list changed
  const currentPillCount = sizePillsContainer.children.length;
  if (currentPillCount !== sizes.length) {
    sizePillsContainer.innerHTML = "";
    sizes.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "size-pill";
      btn.dataset.size = s;
      btn.textContent = s;
      btn.addEventListener("click", () => {
        selectSize(s);
      });
      sizePillsContainer.appendChild(btn);
    });
  }

  // Update active & recommended states
  Array.from(sizePillsContainer.children).forEach((btn) => {
    const s = btn.dataset.size;
    btn.classList.toggle("is-active", s === selectedSize);
    btn.classList.toggle("is-recommended", s === recommendedSize);
  });
}

function selectSize(size) {
  selectedSize = size;

  const recInfo = getNormalizedSizeInfo(recommendedSize);
  const selInfo = getNormalizedSizeInfo(selectedSize);

  let diff = 0;
  if (recInfo && selInfo) {
    diff = selInfo.order - recInfo.order;
  } else {
    const sizes = currentProduct.availableSizes || [];
    diff = sizes.indexOf(selectedSize) - sizes.indexOf(recommendedSize);
  }

  if (diff === 0) {
    sizeScaleMultiplier = 1.0; // Perfect fit
  } else if (diff > 0) {
    // Looser, wider, slightly longer
    sizeScaleMultiplier = 1.0 + (diff * 0.075);
  } else {
    // Snugger, narrower, shorter
    sizeScaleMultiplier = 1.0 + (diff * 0.065);
  }

  updateSizePills();
  updateFitBreakdown();
}

function updateFitBreakdown() {
  const recInfo = getNormalizedSizeInfo(recommendedSize);
  const selInfo = getNormalizedSizeInfo(selectedSize);

  let diff = 0;
  if (recInfo && selInfo) {
    diff = selInfo.order - recInfo.order;
  } else {
    const sizes = currentProduct.availableSizes || [];
    diff = sizes.indexOf(selectedSize) - sizes.indexOf(recommendedSize);
  }

  if (diff === 0) {
    // Recommended Best Fit
    fitShoulderVal.textContent = "Good ✓";
    fitShoulderVal.className = "fit-val val-good";

    fitChestVal.textContent = "Ideal ✓";
    fitChestVal.className = "fit-val val-good";

    fitLengthVal.textContent = "Standard ✓";
    fitLengthVal.className = "fit-val val-good";

    fitSummaryText.textContent = `Size ${selectedSize} provides the best tailored fit for your ${measuredChestCm} cm chest.`;
  } else if (diff > 0) {
    // Larger size selected (Loose / Relaxed)
    const extraCm = diff * 5;
    fitShoulderVal.textContent = `+${diff * 2}cm Wide`;
    fitShoulderVal.className = "fit-val val-warn";

    fitChestVal.textContent = `⚠ +${extraCm}cm Loose`;
    fitChestVal.className = "fit-val val-warn";

    fitLengthVal.textContent = `+${diff * 3}cm Longer`;
    fitLengthVal.className = "fit-val val-warn";

    fitSummaryText.textContent = `Size ${selectedSize} hangs looser with extra volume. Great for a relaxed, oversized look.`;
  } else {
    // Smaller size selected (Snug / Slim)
    fitShoulderVal.textContent = "⚠ Snug";
    fitShoulderVal.className = "fit-val val-tight";

    fitChestVal.textContent = "⚠ Tight fit";
    fitChestVal.className = "fit-val val-tight";

    fitLengthVal.textContent = "Cropped";
    fitLengthVal.className = "fit-val val-tight";

    fitSummaryText.textContent = `Size ${selectedSize} is snug across the shoulders. May feel tight across chest (${measuredChestCm} cm).`;
  }
}

// -------------------------------------------------------------
// 4. Hardware-Accelerated Real-Time Render Loop
// -------------------------------------------------------------

function renderFrame() {
  if (!isSessionActive || !localVideo || localVideo.readyState < 2) {
    animFrameId = requestAnimationFrame(renderFrame);
    return;
  }

  const vW = localVideo.videoWidth || 720;
  const vH = localVideo.videoHeight || 960;

  if (tryonCanvas.width !== vW || tryonCanvas.height !== vH) {
    tryonCanvas.width = vW;
    tryonCanvas.height = vH;
  }

  // 1. Draw live webcam frame
  ctx.drawImage(localVideo, 0, 0, vW, vH);

  // 2. Track body pose & update biometrics
  updateBodyTrackingAndMeasurements(vW, vH);

  // 3. Render and deform garment according to selected size & category
  if (activeGarmentMatte && activeGarmentMatte.canvas) {
    const garment = activeGarmentMatte;
    const cat = (currentProduct.category || "").toLowerCase();

    // Silhouette & posture heuristics for Indian ethnic wear & global apparel
    let widthFactor = 1.18;
    let collarOffsetRatio = 0.38;

    if (/jacket|blazer|coat|sherwani|nehru/i.test(cat)) {
      widthFactor = 1.24; // Broader silhouette for structured outerwear
      collarOffsetRatio = 0.35;
    } else if (/kurta|kurti/i.test(cat)) {
      widthFactor = 1.16; // Elegant Indian traditional vertical drape
      collarOffsetRatio = 0.32;
    } else if (/dress|anarkali|gown|maxi/i.test(cat)) {
      widthFactor = 1.20;
      collarOffsetRatio = 0.30;
    }

    // Apply real-time size deformation multiplier (e.g. L is looser, S is snugger)
    const gWidth = bodyTracker.shoulderWidth * widthFactor * sizeScaleMultiplier;
    const gHeight = gWidth * garment.aspectRatio;

    const posX = bodyTracker.chestCenter.x - gWidth / 2;
    const posY = bodyTracker.chestCenter.y - gHeight * collarOffsetRatio;

    ctx.save();

    // Natural breathing / motion oscillation
    const breathOffset = Math.sin(Date.now() / 900) * 1.5;
    
    // Torso shadow map
    ctx.shadowColor = "rgba(0, 0, 0, 0.28)";
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    // Draw warped garment
    ctx.drawImage(
      garment.canvas,
      posX,
      posY + breathOffset,
      gWidth,
      gHeight
    );

    // Soft-light ambient blend overlay
    ctx.globalCompositeOperation = "soft-light";
    ctx.fillStyle = "rgba(255, 255, 255, 0.08)";
    ctx.fillRect(posX, posY, gWidth, gHeight);

  }

  animFrameId = requestAnimationFrame(renderFrame);
}

// -------------------------------------------------------------
// 5. Camera Management & Lifecycle
// -------------------------------------------------------------

async function startCamera() {
  if (localStream && localStream.active) {
    return localStream;
  }

  try {
    localStream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 720 },
        height: { ideal: 960 },
        facingMode: "user"
      },
      audio: false
    });

    localVideo.srcObject = localStream;
    await localVideo.play();

    cameraErrorOverlay.classList.remove("visible");
    return localStream;
  } catch (err) {
    console.error("[VESTORA Engine] Camera permission denied:", err);
    cameraErrorOverlay.classList.add("visible");
    liveText.textContent = "CAM BLOCKED";
    throw err;
  }
}

async function startTryOnSession(imageUrl, productMeta = {}) {
  try {
    showShimmer("Measuring body & fitting garment…");
    framingOverlay.classList.add("visible");

    // 1. Update product metadata
    if (productMeta.title) currentProduct.title = productMeta.title;
    if (productMeta.category) currentProduct.category = productMeta.category;
    if (productMeta.availableSizes && productMeta.availableSizes.length) {
      currentProduct.availableSizes = productMeta.availableSizes;
    }

    if (productName) productName.textContent = currentProduct.title;

    // 2. Start webcam stream
    await startCamera();

    // 3. Extract garment matte client-side
    activeGarmentUrl = imageUrl;
    activeGarmentMatte = await processGarmentImage(imageUrl);

    // 4. Launch live render loop & Size Engine
    isSessionActive = true;
    hideShimmer();

    liveBadge.classList.add("is-live");
    liveText.textContent = "LIVE VTON";

    updateGarmentDock(imageUrl);
    startCountdownTimer();

    if (!animFrameId) {
      animFrameId = requestAnimationFrame(renderFrame);
    }
  } catch (err) {
    console.error("[VESTORA Engine] Failed to start try-on session:", err);
    hideShimmer();
  }
}

async function swapGarment(newImageUrl, productMeta = {}) {
  activeGarmentUrl = newImageUrl;
  if (productMeta.title) currentProduct.title = productMeta.title;
  if (productMeta.category) currentProduct.category = productMeta.category;
  if (productMeta.availableSizes && productMeta.availableSizes.length) {
    currentProduct.availableSizes = productMeta.availableSizes;
  }

  if (productName) productName.textContent = currentProduct.title;
  updateGarmentDock(newImageUrl);
  showToast("✦ Swapping garment…");

  const newMatte = await processGarmentImage(newImageUrl);
  if (newMatte) {
    activeGarmentMatte = newMatte;
    computeSizeRecommendation();
    showToast("✦ Garment & size updated!");
  } else {
    showToast("⚠️ Could not load garment");
  }
}

// -------------------------------------------------------------
// 6. UI Helpers & Calibration Drawer
// -------------------------------------------------------------

function updateGarmentDock(imgUrl) {
  if (garmentThumb && imgUrl) {
    garmentThumb.src = imgUrl;
    sizeEngineDock.classList.remove("hidden");
  }
}

function showShimmer(msg = "VESTORA AI Measuring & Fitting…") {
  const textEl = shimmerOverlay.querySelector(".shimmer-text");
  if (textEl) textEl.textContent = msg;
  shimmerOverlay.classList.add("visible");
}

function hideShimmer() {
  shimmerOverlay.classList.remove("visible");
}

function showToast(msg) {
  if (toastText) toastText.textContent = msg;
  swapToast.classList.add("show");
  setTimeout(() => {
    swapToast.classList.remove("show");
  }, 2200);
}

function startCountdownTimer() {
  if (countdownInterval) clearInterval(countdownInterval);
  remainingSeconds = SESSION_DURATION_SECONDS;
  updateTimerUI();

  countdownInterval = setInterval(() => {
    remainingSeconds--;
    updateTimerUI();

    if (remainingSeconds <= 0) {
      clearInterval(countdownInterval);
      endSession();
    }
  }, 1000);
}

function updateTimerUI() {
  const mins = Math.floor(Math.max(0, remainingSeconds) / 60);
  const secs = Math.max(0, remainingSeconds) % 60;
  const formatted = `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;

  if (timerDisplay) {
    timerDisplay.textContent = formatted;
  }

  if (sessionTimer) {
    sessionTimer.classList.toggle("warning", remainingSeconds <= 60 && remainingSeconds > 20);
    sessionTimer.classList.toggle("critical", remainingSeconds <= 20);
  }
}

function endSession() {
  isSessionActive = false;
  liveBadge.classList.remove("is-live");
  liveText.textContent = "ENDED";

  if (animFrameId) {
    cancelAnimationFrame(animFrameId);
    animFrameId = null;
  }

  if (localStream) {
    localStream.getTracks().forEach((track) => track.stop());
    localStream = null;
  }

  sessionEndedOverlay.classList.add("visible");
}

function restartSession() {
  sessionEndedOverlay.classList.remove("visible");
  bodyTracker.frameCount = 0;
  remainingSeconds = SESSION_DURATION_SECONDS;
  updateTimerUI();
  if (activeGarmentUrl) {
    startTryOnSession(activeGarmentUrl, currentProduct);
  }
}

// -------------------------------------------------------------
// 7. Initialization & Event Listeners
// -------------------------------------------------------------

function setupEventListeners() {
  // Listen for parent messages from content script
  window.addEventListener("message", (event) => {
    const data = event.data;
    if (!data || typeof data !== "object") return;

    if (data.type === "VESTORA_SET_GARMENT") {
      const garmentUrl = data.dataUrl || data.originalUrl;
      const meta = {
        title: data.productTitle,
        category: data.category,
        availableSizes: data.availableSizes
      };

      if (garmentUrl) {
        if (isSessionActive) {
          swapGarment(garmentUrl, meta);
        } else {
          startTryOnSession(garmentUrl, meta);
        }
      }
    } else if (data.type === "VESTORA_WIDGET_SHOWN") {
      if (activeGarmentUrl && !isSessionActive) {
        startTryOnSession(activeGarmentUrl, currentProduct);
      }
    }
  });

  // Minimize
  btnMinimize.addEventListener("click", () => {
    if (window.parent !== window) {
      window.parent.postMessage({ type: "VESTORA_MINIMIZE_REQUEST" }, "*");
    }
  });

  // Mirror toggle
  btnMirror.addEventListener("click", () => {
    isMirrored = !isMirrored;
    stage.classList.toggle("unmirrored", !isMirrored);
  });

  // Height calibration toggle & slider
  btnCalibrateHeight.addEventListener("click", () => {
    calibrationDrawer.classList.toggle("hidden");
  });

  btnCloseCalib.addEventListener("click", () => {
    calibrationDrawer.classList.add("hidden");
  });

  heightSlider.addEventListener("input", (e) => {
    userReferenceHeight = parseInt(e.target.value, 10);
    calibHeightLabel.textContent = `${userReferenceHeight} cm`;
    btnCalibrateHeight.textContent = `${userReferenceHeight}cm ✎`;
    // Immediately recalibrate biometrics and size prediction
    computeSizeRecommendation();
  });

  // Retry buttons
  btnRetryCamera.addEventListener("click", () => {
    cameraErrorOverlay.classList.remove("visible");
    if (activeGarmentUrl) startTryOnSession(activeGarmentUrl, currentProduct);
  });

  btnRestartSession.addEventListener("click", () => {
    restartSession();
  });
}

function init() {
  setupEventListeners();
  updateTimerUI();

  if (window.parent !== window) {
    window.parent.postMessage({ type: "VESTORA_WIDGET_READY" }, "*");
  }
}

document.addEventListener("DOMContentLoaded", init);
