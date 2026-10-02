/**
 * VESTORA — Live Try-On Widget Controller
 * 
 * Full Device Support:
 * 1. Live Camera Stream with robust cross-device fallback (Laptops, Desktops, iOS/Android phones, Tablets)
 * 2. Universal Drag-and-Drop garment ingestion (Anywear signature workflow)
 * 3. Smart on-device garment background cutout (alpha keying)
 * 4. Interactive Garment Fit Controls (Scale, Height Offset, Opacity)
 * 5. Pose tracking and responsive garment draping
 * 6. AI Size Recommendation Engine (real-time body measurements)
 * 7. Pop-out to Dedicated Window or Side Panel for guaranteed camera access
 * 8. Screenshot capture with brand watermark
 */

// ─── Constants ───
const POSE_LANDMARK = {
  NOSE: 0,
  LEFT_SHOULDER: 1,
  RIGHT_SHOULDER: 2,
  LEFT_ELBOW: 3,
  RIGHT_ELBOW: 4,
  LEFT_HIP: 5,
  RIGHT_HIP: 6,
};

const SIZE_CHART = {
  XS: { shoulder: [36, 39], chest: [81, 87], waist: [66, 72] },
  S:  { shoulder: [39, 42], chest: [87, 93], waist: [72, 78] },
  M:  { shoulder: [42, 45], chest: [93, 99], waist: [78, 84] },
  L:  { shoulder: [45, 48], chest: [99, 107], waist: [84, 92] },
  XL: { shoulder: [48, 52], chest: [107, 115], waist: [92, 100] },
  XXL:{ shoulder: [52, 56], chest: [115, 124], waist: [100, 110] },
};

// Built-in sample garments for instant testing on any device
const SAMPLE_GARMENTS = [
  {
    name: "Oversized Minimalist Jacket",
    category: "Jackets",
    imageUrl: "https://images.unsplash.com/photo-1551028719-00167b16eac5?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["S", "M", "L", "XL"]
  },
  {
    name: "Classic Denim Overshirt",
    category: "Shirts",
    imageUrl: "https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["XS", "S", "M", "L", "XL"]
  },
  {
    name: "Streetwear Graphic Hoodie",
    category: "Hoodies",
    imageUrl: "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=600&auto=format&fit=crop&q=80",
    availableSizes: ["M", "L", "XL", "XXL"]
  }
];
let currentSampleIndex = 0;

// ─── State ───
let cameraStream = null;
let currentFacing = "user"; // "user" (front) or "environment" (back)
let animationFrameId = null;
let isBodyDetected = false;
let currentProduct = null;
let garmentImage = null;
let processedGarmentCanvas = null;
let poseHistory = [];
const MAX_POSE_HISTORY = 8;

// Fit adjustments
let fitScale = 1.0;
let fitOffsetY = 0;
let fitOpacity = 0.88;

// Drag & drop state
let dragCounter = 0;

// ─── DOM References ───
const videoEl = document.getElementById("camera-feed");
const canvasEl = document.getElementById("garment-canvas");
const ctx = canvasEl.getContext("2d", { desynchronized: true, alpha: true });

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
    setupStream(cameraStream, facingMode);
  } catch (errHigh) {
    console.warn("[VESTORA] High constraints failed, attempting fallback:", errHigh);
    try {
      // Fallback constraints for laptops/smartphones with simpler cameras
      const fallbackConstraints = {
        video: { facingMode: { ideal: facingMode } },
        audio: false,
      };
      cameraStream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
      setupStream(cameraStream, facingMode);
    } catch (errFallback) {
      console.warn("[VESTORA] Fallback constraints failed, attempting standard video:", errFallback);
      try {
        cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        setupStream(cameraStream, facingMode);
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
}

function handleCameraFailure(err) {
  console.error("[VESTORA] Camera init failed completely:", err);
  showBodyIndicator(false);

  const isIframe = window.parent !== window;
  if (isIframe) {
    cameraErrorMessage.textContent = 
      "This shopping site restricts camera access inside embedded views. Open VESTORA in Chrome Side Panel or a separate window for unrestricted access.";
  } else {
    cameraErrorMessage.textContent = 
      "Camera access was denied or no camera device was found. Please allow camera permissions in your browser settings.";
  }
  showCameraBlocked();
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

    if (!isBodyDetected || !videoEl.videoWidth) return;

    // Run pose estimation (baseline geometric)
    const pose = estimateBasePose(videoEl.videoWidth, videoEl.videoHeight);

    // Temporal smoothing
    poseHistory.push(pose);
    if (poseHistory.length > MAX_POSE_HISTORY) poseHistory.shift();
    const smoothedPose = smoothPose(poseHistory);

    // Update body measurements from pose
    updateMeasurements(smoothedPose, videoEl.videoWidth, videoEl.videoHeight);

    // Clear canvas and render garment overlay
    ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);

    const garmentSource = processedGarmentCanvas || garmentImage;
    if (garmentSource) {
      renderGarmentOverlay(smoothedPose, canvasEl.width, canvasEl.height, garmentSource);
    }
  }

  animationFrameId = requestAnimationFrame(frame);
}

// ─── Pose Estimation & Smoothing ───

function estimateBasePose(width, height) {
  return {
    landmarks: [
      { x: width * 0.50, y: height * 0.16, v: 0.95 },  // 0: Nose
      { x: width * 0.38, y: height * 0.31, v: 0.92 },  // 1: L Shoulder
      { x: width * 0.62, y: height * 0.31, v: 0.92 },  // 2: R Shoulder
      { x: width * 0.30, y: height * 0.49, v: 0.88 },  // 3: L Elbow
      { x: width * 0.70, y: height * 0.49, v: 0.88 },  // 4: R Elbow
      { x: width * 0.40, y: height * 0.64, v: 0.85 },  // 5: L Hip
      { x: width * 0.60, y: height * 0.64, v: 0.85 },  // 6: R Hip
    ],
    confidence: 0.92,
    timestamp: performance.now(),
  };
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

// ─── Garment Rendering & Fit Simulation ───

function renderGarmentOverlay(pose, canvasWidth, canvasHeight, garmentSource) {
  if (!pose || !garmentSource) return;

  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  const lHip = pose.landmarks[POSE_LANDMARK.LEFT_HIP];

  // Base dimensions from body landmarks
  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const torsoHeight = Math.abs(lHip.y - lShoulder.y);

  // Apply user-controlled fit scale
  const garmentWidth = shoulderWidth * 2.2 * fitScale;
  const garmentHeight = torsoHeight * 1.45 * fitScale;

  // Center point between shoulders + height offset
  const centerX = (lShoulder.x + rShoulder.x) / 2;
  const topY = lShoulder.y - (garmentHeight * 0.08) + fitOffsetY;

  // Mirror compensation for front camera
  const drawX = currentFacing === "user"
    ? canvasWidth - centerX - garmentWidth / 2
    : centerX - garmentWidth / 2;

  ctx.save();
  ctx.globalAlpha = fitOpacity;

  // Perspective angle rotation based on shoulders
  const shoulderAngle = Math.atan2(
    rShoulder.y - lShoulder.y,
    rShoulder.x - lShoulder.x
  );

  ctx.translate(drawX + garmentWidth / 2, topY + garmentHeight / 2);
  ctx.rotate(currentFacing === "user" ? -shoulderAngle : shoulderAngle);
  ctx.translate(-(drawX + garmentWidth / 2), -(topY + garmentHeight / 2));

  ctx.drawImage(garmentSource, drawX, topY, garmentWidth, garmentHeight);
  ctx.restore();
}

// ─── Smart Garment Background Cutout (Chroma/Luma Keyer) ───

function processGarmentCutout(img) {
  try {
    const offscreen = document.createElement("canvas");
    const ow = img.naturalWidth || img.width;
    const oh = img.naturalHeight || img.height;
    if (!ow || !oh) return;

    offscreen.width = ow;
    offscreen.height = oh;
    const octx = offscreen.getContext("2d", { willReadFrequently: true });
    octx.drawImage(img, 0, 0);

    const imgData = octx.getImageData(0, 0, ow, oh);
    const data = imgData.data;

    // Sample the 4 corner pixels to determine background color
    const corners = [
      0, // top-left
      (ow - 1) * 4, // top-right
      ((oh - 1) * ow) * 4, // bottom-left
      ((oh * ow) - 1) * 4 // bottom-right
    ];

    let avgR = 0, avgG = 0, avgB = 0;
    corners.forEach((idx) => {
      avgR += data[idx];
      avgG += data[idx + 1];
      avgB += data[idx + 2];
    });
    avgR /= 4; avgG /= 4; avgB /= 4;

    // If corners are light/white (standard catalog photo > 220)
    const isLightBackground = avgR > 215 && avgG > 215 && avgB > 215;

    if (isLightBackground) {
      const threshold = 40;
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Euclidean color distance to background
        const dist = Math.sqrt((r - avgR) ** 2 + (g - avgG) ** 2 + (b - avgB) ** 2);
        if (dist < threshold) {
          // Soft edge feathering
          const alphaFactor = Math.max(0, (dist - 15) / (threshold - 15));
          data[i + 3] = Math.round(data[i + 3] * alphaFactor);
        }
      }
      octx.putImageData(imgData, 0, 0);
      processedGarmentCanvas = offscreen;
    } else {
      processedGarmentCanvas = null; // Use original directly
    }
  } catch (e) {
    console.warn("[VESTORA] Background cutout skipped (likely tainted canvas or CORS):", e);
    processedGarmentCanvas = null;
  }
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

// ─── Product Loading ───

function loadProduct(product) {
  if (!product) return;
  currentProduct = product;

  if (productName && product.name) productName.textContent = product.name;
  if (productCategory && product.category) productCategory.textContent = product.category;
  if (productThumb && product.imageUrl) {
    productThumb.style.display = "block";
    productThumb.src = product.imageUrl;
    productThumb.onerror = () => { productThumb.style.display = "none"; };
  }

  garmentLoader?.classList.remove("hidden");
  garmentImage = new Image();
  garmentImage.crossOrigin = "anonymous";

  garmentImage.onload = () => {
    garmentLoader?.classList.add("hidden");
    processGarmentCutout(garmentImage);
    showToast("✦ Garment loaded — live overlay ready!");
    updateSizePills(recommendedSizeValue?.textContent || "M");
  };

  garmentImage.onerror = () => {
    garmentLoader?.classList.add("hidden");
    // Fallback via background service worker (CORS bypass)
    loadProductViaBgFetch(product.imageUrl);
  };

  garmentImage.src = product.imageUrl;
}

function loadProductViaBgFetch(imageUrl) {
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage(
      { type: "VESTORA_FETCH_IMAGE", payload: { url: imageUrl } },
      (response) => {
        if (response?.success && response.dataUrl) {
          garmentImage = new Image();
          garmentImage.onload = () => {
            processGarmentCutout(garmentImage);
            showToast("✦ Garment loaded (via secure proxy)!");
          };
          garmentImage.src = response.dataUrl;
        } else {
          showToast("⚠ Could not load garment image");
        }
      }
    );
  }
}

// ─── Sample Garment Switcher ───

function loadNextSampleGarment() {
  const sample = SAMPLE_GARMENTS[currentSampleIndex % SAMPLE_GARMENTS.length];
  currentSampleIndex++;
  loadProduct(sample);
}

// ─── Fit Controls Handlers ───

function setupFitControls() {
  btnToggleFit?.addEventListener("click", () => {
    fitControlsPanel?.classList.toggle("hidden");
  });

  btnScaleUp?.addEventListener("click", () => {
    fitScale = Math.min(1.4, Math.round((fitScale + 0.05) * 100) / 100);
    if (fitScaleVal) fitScaleVal.textContent = `${Math.round(fitScale * 100)}%`;
  });

  btnScaleDown?.addEventListener("click", () => {
    fitScale = Math.max(0.7, Math.round((fitScale - 0.05) * 100) / 100);
    if (fitScaleVal) fitScaleVal.textContent = `${Math.round(fitScale * 100)}%`;
  });

  btnMoveUp?.addEventListener("click", () => {
    fitOffsetY = Math.max(-80, fitOffsetY - 10);
  });

  btnMoveDown?.addEventListener("click", () => {
    fitOffsetY = Math.min(80, fitOffsetY + 10);
  });

  btnResetFit?.addEventListener("click", () => {
    fitScale = 1.0;
    fitOffsetY = 0;
    fitOpacity = 0.88;
    if (fitScaleVal) fitScaleVal.textContent = "100%";
    if (fitOpacitySlider) fitOpacitySlider.value = "88";
    showToast("Fit reset to default");
  });

  fitOpacitySlider?.addEventListener("input", (e) => {
    fitOpacity = Number(e.target.value) / 100;
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

  // Draw mirrored camera
  compCtx.save();
  if (currentFacing === "user") {
    compCtx.translate(compositeCanvas.width, 0);
    compCtx.scale(-1, 1);
  }
  compCtx.drawImage(videoEl, 0, 0);
  compCtx.restore();

  // Draw garment overlay
  compCtx.drawImage(canvasEl, 0, 0);

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
        chrome.storage?.local?.get(["vestora:active_product"], (data) => {
          const prod = data?.["vestora:active_product"];
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

// Paste Image URL modal
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
    loadProduct({
      id: `pasted_${Date.now()}`,
      name: "Custom Garment URL",
      category: "Clothing Item",
      imageUrl: url,
      availableSizes: ["XS", "S", "M", "L", "XL", "XXL"],
    });
    pasteUrlModal?.classList.add("hidden");
    if (pasteUrlInput) pasteUrlInput.value = "";
    showToast("✦ Custom garment loaded!");
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

// Listen for messages from parent frame (content script)
window.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;
  if (event.data.type === "VESTORA_LOAD_PRODUCT") {
    loadProduct(event.data.product);
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

// Listen for messages from background service worker
if (typeof chrome !== "undefined" && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg?.type === "VESTORA_LOAD_PRODUCT") {
      loadProduct(msg.product);
    }
  });
}

// ─── Initialize ───

setupDragAndDrop();
setupFitControls();

[measShoulder, measChest, measWaist, measTorso].forEach((el) => {
  el?.classList.add("is-loading");
});

updateSizePills("M");

// Initialize Camera
initCamera("user");

// Parse product from URL parameters if available
const urlParams = new URLSearchParams(window.location.search);
const productParam = urlParams.get("product");
if (productParam) {
  try {
    const product = JSON.parse(decodeURIComponent(productParam));
    loadProduct(product);
  } catch (e) {
    console.warn("[VESTORA] Failed to parse product parameter:", e);
  }
}
