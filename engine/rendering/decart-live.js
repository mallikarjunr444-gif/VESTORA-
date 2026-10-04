/**
 * "HD Live" mode: real generative live try-on through Decart's realtime
 * lucy-vton model (WebRTC). Implemented from Decart's public docs:
 *   https://docs.platform.decart.ai/models/realtime/virtual-try-on
 *
 * Uses the USER'S OWN Decart API key (bring-your-own-key), so VESTORA pays nothing.
 * Billing is per second of active generation on the user's Decart account.
 */
import { createDecartClient, models } from "@decartai/sdk";

const MODEL_ID = "lucy-vton-latest";
export const DECART_PRICE_PER_SEC = 0.02; // USD, 720p standard mode (see Decart pricing page)

const PROMPTS = {
  upper_body: "Substitute the current top with the garment from the reference image, matching its exact color, pattern, logo, material and fit",
  full_body: "Substitute the current outfit with the garment from the reference image, matching its exact color, pattern, material and fit",
  lower_body: "Substitute the current pants with the garment from the reference image, matching its exact color, material and fit",
  accessories: "Add the accessory from the reference image to the person, matching its exact color and shape",
};

/** Decart recommends a clean garment on a plain white background, >= 512px. */
export async function garmentToWhitePng(source, minSide = 768) {
  const w = source.naturalWidth || source.width;
  const h = source.naturalHeight || source.height;
  const k = Math.max(1, minSide / Math.min(w, h));
  const c = document.createElement("canvas");
  c.width = Math.round(w * k);
  c.height = Math.round(h * k);
  const ctx = c.getContext("2d");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, c.width, c.height);
  return new Promise((res, rej) => c.toBlob((b) => (b ? res(b) : rej(new Error("PNG export failed"))), "image/png"));
}

export class DecartLive {
  constructor() {
    this.client = null;
    this.stream = null;
    this.startedAt = 0;
    this.connected = false;
  }

  /** @param {string} apiKey user's Decart key  @param {(s: MediaStream) => void} onRemoteStream */
  async connect(apiKey, onRemoteStream, onError) {
    const model = models.realtime(MODEL_ID);

    // Decart wants the camera opened with the model's own fps/size constraints.
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { facingMode: "user", frameRate: model.fps, width: model.width, height: model.height },
    });

    // Prefer a short-lived client token over the permanent key for the WebRTC session.
    let sessionKey = apiKey;
    try {
      const token = await createDecartClient({ apiKey }).tokens.create();
      if (token?.apiKey) sessionKey = token.apiKey;
    } catch (e) {
      console.warn("[VESTORA] client-token creation failed, using key directly:", e);
    }

    this.client = createDecartClient({ apiKey: sessionKey });
    this.realtime = await this.client.realtime.connect(this.stream, {
      model,
      mirror: "auto",
      onRemoteStream,
    });
    if (typeof this.realtime.on === "function") {
      this.realtime.on("error", (e) => onError?.(e));
    }
    this.startedAt = performance.now();
    this.connected = true;
  }

  /** Change garment without reconnecting (set() replaces the whole state). */
  async setGarment(imageSource, category = "upper_body") {
    if (!this.connected) return;
    const image = await garmentToWhitePng(imageSource);
    await this.realtime.set({ prompt: PROMPTS[category] || PROMPTS.upper_body, image, enhance: false });
  }

  disconnect() {
    const seconds = this.connected ? (performance.now() - this.startedAt) / 1000 : 0;
    try { this.realtime?.disconnect(); } catch {}
    this.stream?.getTracks().forEach((t) => t.stop());
    this.realtime = null; this.client = null; this.stream = null; this.connected = false;
    return { seconds, cost: seconds * DECART_PRICE_PER_SEC };
  }
}
