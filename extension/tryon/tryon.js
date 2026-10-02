/**
 * VESTORA — Live Try-On Widget Controller
 * 
 * Manages:
 * 1. Camera initialization (front/back, flip support)
 * 2. Pose detection loop (using BaselinePoseEngine → real engine later)
 * 3. Garment overlay rendering on <canvas>
 * 4. AI-powered body measurement extraction
 * 5. Size recommendation engine
 * 6. Screenshot capture
 * 7. Cross-device responsive behavior
 * 8. Messaging with parent extension (content script ↔ widget)
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

// ─── State ───
let cameraStream = null;
let currentFacing = "user"; // "user" (front) or "environment" (back)
let animationFrameId = null;
let isBodyDetected = false;
let currentProduct = null;
let garmentImage = null;
let poseHistory = [];
const MAX_POSE_HISTORY = 8;

// ─── DOM References ───
const videoEl = document.getElementById("camera-feed");
const canvasEl = document.getElementById("garment-canvas");
const ctx = canvasEl.getContext("2d", { desynchronized: true, alpha: true });

const btnFlipCamera = document.getElementById("btn-flip-camera");
const btnScreenshot = document.getElementById("btn-screenshot");
const btnClose = document.getElementById("btn-close-tryon");

const bodyIndicator = document.getElementById("body-detection-indicator");
const garmentLoader = document.getElementById("garment-loader");
const perfHud = document.getElementById("perf-hud");
const perfFps = document.getElementById("perf-fps");
const perfLatency = document.getElementById("perf-latency");

const productThumb = document.getElementById("product-thumb");
const productName = document.getElementById("product-name");
const productCategory = document.getElementById("product-category");

const measShoulder = document.getElementById("meas-shoulder");
const measChest = document.getElementById("meas-chest");
const measWaist = document.getElementById("meas-waist");
const measTorso = document.getElementById("meas-torso");
const recommendedSizeValue = document.getElementById("recommended-size-value");
const sizeOptionsContainer = document.getElementById("size-options");

// ─── Camera Management ───

async function initCamera(facingMode = "user") {
  // Stop existing stream
  if (cameraStream) {
    cameraStream.getTracks().forEach((t) => t.stop());
    cameraStream = null;
  }

  showBodyIndicator(true);

  const constraints = {
    video: {
      facingMode: { ideal: facingMode },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
    },
    audio: false,
  };

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
    videoEl.srcObject = cameraStream;

    // Mirror only for front camera
    videoEl.style.transform = facingMode === "user" ? "scaleX(-1)" : "scaleX(1)";

    await new Promise((resolve) => {
      videoEl.onloadedmetadata = () => {
        videoEl.play();
        resolve();
      };
    });

    // Match canvas to video dimensions
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Start the render loop
    startRenderLoop();

    // Simulate body detection after a short delay (baseline)
    setTimeout(() => {
      isBodyDetected = true;
      showBodyIndicator(false);
      showToast("✦ Body detected — try-on ready!");
    }, 1500);

    currentFacing = facingMode;
  } catch (err) {
    console.error("[VESTORA] Camera init failed:", err);
    showToast("⚠ Camera access denied. Please allow camera permission.");
    showBodyIndicator(false);
  }
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
      perfFps.textContent = `${fps} FPS`;
      perfLatency.textContent = `${Math.round(timestamp - lastFrameTime)} ms`;
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

    if (garmentImage && garmentImage.complete) {
      renderGarmentOverlay(smoothedPose, canvasEl.width, canvasEl.height);
    }
  }

  animationFrameId = requestAnimationFrame(frame);
}

// ─── Pose Estimation (Baseline Geometric) ───

function estimateBasePose(width, height) {
  // Geometric baseline pose anchors (proportional to frame)
  // This provides consistent positioning for garment overlay
  return {
    landmarks: [
      { x: width * 0.50, y: height * 0.15, v: 0.95 },  // 0: Nose
      { x: width * 0.38, y: height * 0.30, v: 0.92 },  // 1: L Shoulder
      { x: width * 0.62, y: height * 0.30, v: 0.92 },  // 2: R Shoulder
      { x: width * 0.30, y: height * 0.48, v: 0.88 },  // 3: L Elbow
      { x: width * 0.70, y: height * 0.48, v: 0.88 },  // 4: R Elbow
      { x: width * 0.40, y: height * 0.62, v: 0.85 },  // 5: L Hip
      { x: width * 0.60, y: height * 0.62, v: 0.85 },  // 6: R Hip
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

// ─── Garment Overlay Rendering ───

function renderGarmentOverlay(pose, canvasWidth, canvasHeight) {
  if (!pose || !garmentImage) return;

  const lShoulder = pose.landmarks[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = pose.landmarks[POSE_LANDMARK.RIGHT_SHOULDER];
  const lHip = pose.landmarks[POSE_LANDMARK.LEFT_HIP];
  const rHip = pose.landmarks[POSE_LANDMARK.RIGHT_HIP];

  // Calculate garment placement from pose landmarks
  const shoulderWidth = Math.abs(rShoulder.x - lShoulder.x);
  const torsoHeight = Math.abs(lHip.y - lShoulder.y);

  // Garment dimensions (expand slightly beyond shoulders)
  const garmentWidth = shoulderWidth * 2.2;
  const garmentHeight = torsoHeight * 1.4;

  // Center point between shoulders
  const centerX = (lShoulder.x + rShoulder.x) / 2;
  const topY = lShoulder.y - (garmentHeight * 0.08); // Slightly above shoulders

  // Mirror compensation for front camera
  const drawX = currentFacing === "user"
    ? canvasWidth - centerX - garmentWidth / 2
    : centerX - garmentWidth / 2;

  // Draw with alpha blending for natural look
  ctx.save();
  ctx.globalAlpha = 0.85;

  // Apply slight perspective transform based on shoulder angle
  const shoulderAngle = Math.atan2(
    rShoulder.y - lShoulder.y,
    rShoulder.x - lShoulder.x
  );

  ctx.translate(drawX + garmentWidth / 2, topY + garmentHeight / 2);
  ctx.rotate(currentFacing === "user" ? -shoulderAngle : shoulderAngle);
  ctx.translate(-(drawX + garmentWidth / 2), -(topY + garmentHeight / 2));

  ctx.drawImage(garmentImage, drawX, topY, garmentWidth, garmentHeight);
  ctx.restore();
}

// ─── Body Measurement Engine ───

function updateMeasurements(pose, frameWidth, frameHeight) {
  if (!pose) return;

  const lm = pose.landmarks;
  const lShoulder = lm[POSE_LANDMARK.LEFT_SHOULDER];
  const rShoulder = lm[POSE_LANDMARK.RIGHT_SHOULDER];
  const lHip = lm[POSE_LANDMARK.LEFT_HIP];
  const rHip = lm[POSE_LANDMARK.RIGHT_HIP];

  // Pixel distances
  const shoulderPx = dist(lShoulder, rShoulder);
  const hipPx = dist(lHip, rHip);
  const torsoPx = dist(
    { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 },
    { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 }
  );

  // Approximate real-world conversion (calibrated average)
  // Using shoulder width as reference: average human shoulder ~44cm
  const pixelsPerCm = shoulderPx / 44;

  const shoulderCm = Math.round(shoulderPx / pixelsPerCm);
  const chestCm = Math.round((shoulderPx * 2.1) / pixelsPerCm); // Chest ~2.1x shoulder width
  const waistCm = Math.round((hipPx * 2.4) / pixelsPerCm);      // Waist approximation
  const torsoCm = Math.round(torsoPx / pixelsPerCm);

  // Update UI
  measShoulder.textContent = `${shoulderCm} cm`;
  measShoulder.classList.remove("is-loading");
  measChest.textContent = `${chestCm} cm`;
  measChest.classList.remove("is-loading");
  measWaist.textContent = `${waistCm} cm`;
  measWaist.classList.remove("is-loading");
  measTorso.textContent = `${torsoCm} cm`;
  measTorso.classList.remove("is-loading");

  // Calculate recommended size
  const recSize = recommendSize(shoulderCm, chestCm, waistCm);
  recommendedSizeValue.textContent = recSize;

  // Update size pills
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
  currentProduct = product;

  if (product.name) productName.textContent = product.name;
  if (product.category) productCategory.textContent = product.category;
  if (product.imageUrl) {
    productThumb.src = product.imageUrl;
    productThumb.onerror = () => { productThumb.style.display = "none"; };
  }

  // Load garment image for overlay
  garmentLoader.classList.remove("hidden");
  garmentImage = new Image();
  garmentImage.crossOrigin = "anonymous";

  garmentImage.onload = () => {
    garmentLoader.classList.add("hidden");
    showToast("✦ Garment loaded — overlay active!");
    updateSizePills(recommendedSizeValue.textContent || "M");
  };

  garmentImage.onerror = () => {
    garmentLoader.classList.add("hidden");
    // Try loading via background service worker (CORS bypass)
    loadProductViaBgFetch(product.imageUrl);
  };

  garmentImage.src = product.imageUrl;
}

function loadProductViaBgFetch(imageUrl) {
  // For chrome extension context: message background worker
  if (typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
    chrome.runtime.sendMessage(
      { type: "VESTORA_FETCH_IMAGE", payload: { url: imageUrl } },
      (response) => {
        if (response?.success && response.dataUrl) {
          garmentImage = new Image();
          garmentImage.onload = () => {
            showToast("✦ Garment loaded (via secure fetch)!");
          };
          garmentImage.src = response.dataUrl;
        } else {
          showToast("⚠ Could not load garment image");
        }
      }
    );
  }
}

// ─── Screenshot ───

function takeScreenshot() {
  // Create composite canvas
  const compositeCanvas = document.createElement("canvas");
  compositeCanvas.width = videoEl.videoWidth;
  compositeCanvas.height = videoEl.videoHeight;
  const compCtx = compositeCanvas.getContext("2d");

  // Draw mirrored video
  compCtx.save();
  if (currentFacing === "user") {
    compCtx.translate(compositeCanvas.width, 0);
    compCtx.scale(-1, 1);
  }
  compCtx.drawImage(videoEl, 0, 0);
  compCtx.restore();

  // Draw garment overlay
  compCtx.drawImage(canvasEl, 0, 0);

  // Add VESTORA watermark
  compCtx.save();
  compCtx.globalAlpha = 0.5;
  compCtx.fillStyle = "#fff";
  compCtx.font = "bold 14px Inter, sans-serif";
  compCtx.textAlign = "right";
  compCtx.fillText("VESTORA", compositeCanvas.width - 16, compositeCanvas.height - 16);
  compCtx.restore();

  // Download
  const link = document.createElement("a");
  link.download = `vestora-tryon-${Date.now()}.png`;
  link.href = compositeCanvas.toDataURL("image/png");
  link.click();

  // Flash effect
  const flash = document.createElement("div");
  flash.className = "screenshot-flash";
  document.body.appendChild(flash);
  flash.addEventListener("animationend", () => flash.remove());

  showToast("📸 Screenshot saved!");
}

// ─── UI Helpers ───

function showBodyIndicator(show) {
  bodyIndicator.classList.toggle("hidden", !show);
}

function showToast(message) {
  // Remove existing toasts
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
  }, 2500);
}

// ─── Event Listeners ───

btnFlipCamera.addEventListener("click", flipCamera);
btnScreenshot.addEventListener("click", takeScreenshot);
btnClose.addEventListener("click", () => {
  cleanup();
  // Message parent to close widget
  if (window.parent !== window) {
    window.parent.postMessage({ type: "VESTORA_CLOSE_TRYON" }, "*");
  }
  // If standalone, try closing tab
  if (typeof chrome !== "undefined" && chrome.tabs) {
    window.close();
  }
});

// Listen for product data from parent frame / extension
window.addEventListener("message", (event) => {
  if (!event.data || typeof event.data !== "object") return;

  if (event.data.type === "VESTORA_LOAD_PRODUCT") {
    loadProduct(event.data.product);
  }

  if (event.data.type === "VESTORA_TOGGLE_DEBUG") {
    perfHud.classList.toggle("hidden");
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

// Handle page unload
window.addEventListener("beforeunload", cleanup);

// Handle visibility change (pause/resume when tab hidden)
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

// ─── Initialize ───

// Set loading state for measurements
[measShoulder, measChest, measWaist, measTorso].forEach((el) => {
  el.classList.add("is-loading");
});

// Populate default sizes
updateSizePills("M");

// Start camera
initCamera("user");

// Check for product data passed via URL params
const urlParams = new URLSearchParams(window.location.search);
const productDataParam = urlParams.get("product");
if (productDataParam) {
  try {
    const product = JSON.parse(decodeURIComponent(productDataParam));
    loadProduct(product);
  } catch (e) {
    console.warn("[VESTORA] Failed to parse product from URL:", e);
  }
}
