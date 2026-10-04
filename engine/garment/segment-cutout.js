/**
 * Garment cutout from a product photo that shows a MODEL wearing the item
 * (Myntra, Ajio, H&M ...). Keeps only the "clothes" pixels: no head, skin,
 * hair or studio background. Returns a PNG data URL, or null when the photo has
 * no person (flat-lay) so the caller can fall back to the colour-key cutout.
 */
import { ImageSegmenter, PoseLandmarker } from "@mediapipe/tasks-vision";
import { getFileset, assetUrl } from "../vision/runtime.js";

const CLOTHES = 4; // selfie_multiclass: 0 bg, 1 hair, 2 body-skin, 3 face-skin, 4 clothes, 5 others
const MAX_SIDE = 1024;

let segPromise = null;
let posePromise = null;

function getSegmenter() {
  if (!segPromise) {
    segPromise = (async () => {
      const fileset = await getFileset();
      const make = (delegate) => ImageSegmenter.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: assetUrl("models/selfie_multiclass_256x256.tflite"), delegate },
        runningMode: "IMAGE",
        outputConfidenceMasks: true,
        outputCategoryMask: false,
      });
      try { return await make("GPU"); } catch { return await make("CPU"); }
    })();
  }
  return segPromise;
}

function getImagePose() {
  if (!posePromise) {
    posePromise = (async () => {
      const fileset = await getFileset();
      return PoseLandmarker.createFromOptions(fileset, {
        baseOptions: { modelAssetPath: assetUrl("models/pose_landmarker_lite.task") },
        runningMode: "IMAGE",
        numPoses: 1,
      });
    })();
  }
  return posePromise;
}

const smoothstep = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export async function cutoutGarment(img, category = "upper_body") {
  const ow = img.naturalWidth || img.width;
  const oh = img.naturalHeight || img.height;
  if (!ow || !oh) return null;

  const scale = Math.min(1, MAX_SIDE / Math.max(ow, oh));
  const W = Math.round(ow * scale), H = Math.round(oh * scale);
  const src = document.createElement("canvas");
  src.width = W; src.height = H;
  src.getContext("2d").drawImage(img, 0, 0, W, H);

  // 1. "clothes" probability mask
  const segmenter = await getSegmenter();
  const result = segmenter.segment(src);
  const conf = result.confidenceMasks?.[CLOTHES];
  if (!conf) { result.close(); return null; }
  const mw = conf.width, mh = conf.height;
  const probs = new Float32Array(conf.getAsFloat32Array());
  result.close();

  let clothesPx = 0;
  for (let i = 0; i < probs.length; i++) if (probs[i] > 0.5) clothesPx++;
  if (clothesPx / probs.length < 0.04) return null; // no wearer in the photo -> fallback

  // 2. mask -> soft alpha, scaled up smoothly to the image size
  const m = document.createElement("canvas");
  m.width = mw; m.height = mh;
  const mctx = m.getContext("2d");
  const md = mctx.createImageData(mw, mh);
  for (let i = 0; i < probs.length; i++) {
    md.data[i * 4 + 3] = Math.round(smoothstep(0.35, 0.65, probs[i]) * 255);
  }
  mctx.putImageData(md, 0, 0);

  const out = document.createElement("canvas");
  out.width = W; out.height = H;
  const octx = out.getContext("2d", { willReadFrequently: true });
  octx.drawImage(src, 0, 0);
  octx.globalCompositeOperation = "destination-in";
  octx.imageSmoothingEnabled = true;
  octx.imageSmoothingQuality = "high";
  octx.drawImage(m, 0, 0, W, H);
  octx.globalCompositeOperation = "source-over";

  // 3. Strict Identity Removal: Wipe model's head, face, neck, and hair completely
  const data = octx.getImageData(0, 0, W, H);
  let poseLm = null;
  try {
    const poseResult = (await getImagePose()).detect(src);
    poseLm = poseResult.landmarks?.[0] || null;
  } catch (e) {
    console.warn("[VESTORA] pose on product photo failed:", e);
  }

  if (poseLm && poseLm[11] && poseLm[12] && poseLm[11].visibility > 0.3 && poseLm[12].visibility > 0.3) {
    const shY = ((poseLm[11].y + poseLm[12].y) / 2) * H;
    const shMidX = ((poseLm[11].x + poseLm[12].x) / 2) * W;
    const shDist = Math.max(20, Math.abs(poseLm[12].x - poseLm[11].x) * W);
    const headLeft = Math.max(0, Math.floor(shMidX - shDist * 0.55));
    const headRight = Math.min(W - 1, Math.floor(shMidX + shDist * 0.55));
    const collarTop = Math.max(0, Math.floor(shY - 6));

    // Zero out any head, neck, face, or hair pixels above collar
    for (let y = 0; y <= collarTop; y++) {
      for (let x = headLeft; x <= headRight; x++) {
        data.data[(y * W + x) * 4 + 3] = 0;
      }
    }

    if (category === "upper_body") {
      let cutY = null;
      if (poseLm[23] && poseLm[24] && poseLm[23].visibility > 0.3 && poseLm[24].visibility > 0.3) {
        const hipY = ((poseLm[23].y + poseLm[24].y) / 2) * H;
        cutY = hipY + (hipY - shY) * 0.30; // untucked hems sit slightly below hips
      }
      if (cutY === null) {
        let top = H, bottom = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (data.data[(y * W + x) * 4 + 3] > 128) {
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
        }
        cutY = top + (bottom - top) * 0.62;
      }
      for (let y = Math.max(0, Math.floor(cutY)); y < H; y++) {
        for (let x = 0; x < W; x++) data.data[(y * W + x) * 4 + 3] = 0;
      }
    } else if (category === "lower_body") {
      let cutTopY = null;
      if (poseLm[23] && poseLm[24] && poseLm[23].visibility > 0.3 && poseLm[24].visibility > 0.3) {
        const hipY = ((poseLm[23].y + poseLm[24].y) / 2) * H;
        cutTopY = hipY - 12; // keep pants from waist down
      }
      if (cutTopY === null) {
        let top = H, bottom = 0;
        for (let y = 0; y < H; y++) {
          for (let x = 0; x < W; x++) {
            if (data.data[(y * W + x) * 4 + 3] > 128) {
              top = Math.min(top, y);
              bottom = Math.max(bottom, y);
            }
          }
        }
        cutTopY = top + (bottom - top) * 0.38;
      }
      for (let y = 0; y <= Math.min(H - 1, Math.floor(cutTopY)); y++) {
        for (let x = 0; x < W; x++) data.data[(y * W + x) * 4 + 3] = 0;
      }
    }
  } else {
    // Fallback if pose wasn't detectable: wipe upper center head zone on portrait photos
    if (H > W * 1.15) {
      const headHeight = Math.floor(H * 0.24);
      const headLeft = Math.floor(W * 0.24);
      const headRight = Math.floor(W * 0.76);
      for (let y = 0; y < headHeight; y++) {
        for (let x = headLeft; x <= headRight; x++) {
          data.data[(y * W + x) * 4 + 3] = 0;
        }
      }
    }

    if (category === "upper_body") {
      let top = H, bottom = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (data.data[(y * W + x) * 4 + 3] > 128) {
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
      const cutY = top + (bottom - top) * 0.62;
      for (let y = Math.max(0, Math.floor(cutY)); y < H; y++) {
        for (let x = 0; x < W; x++) data.data[(y * W + x) * 4 + 3] = 0;
      }
    } else if (category === "lower_body") {
      let top = H, bottom = 0;
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          if (data.data[(y * W + x) * 4 + 3] > 128) {
            top = Math.min(top, y);
            bottom = Math.max(bottom, y);
          }
        }
      }
      const cutTopY = top + (bottom - top) * 0.38;
      for (let y = 0; y <= Math.min(H - 1, Math.floor(cutTopY)); y++) {
        for (let x = 0; x < W; x++) data.data[(y * W + x) * 4 + 3] = 0;
      }
    }
  }

  octx.putImageData(data, 0, 0);

  // 4. Crop tightly to remaining garment bounding box
  let minX = W, minY = H, maxX = 0, maxY = 0;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (data.data[(y * W + x) * 4 + 3] > 24) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX - minX < 20 || maxY - minY < 20) return null;
  const crop = document.createElement("canvas");
  crop.width = maxX - minX + 1;
  crop.height = maxY - minY + 1;
  crop.getContext("2d").drawImage(out, minX, minY, crop.width, crop.height, 0, 0, crop.width, crop.height);
  return crop.toDataURL("image/png");
}
