/**
 * VESTORA Engine — CatV2TON Video DiT Pipeline Client
 * Connects to local/self-hosted CatV2TON Video Diffusion Transformer server.
 * Implements temporal frame concatenation, garment identity stripping, and dance-proof motion tracking.
 */

export interface CatV2TONFrameOptions {
  frameRate?: number;
  enableTemporalSmoothing?: boolean;
  temporalAlpha?: number;
  category?: string;
}

export interface CatV2TONFrameResponse {
  success: boolean;
  engine: string;
  frame_index?: number;
  temporal_consistency?: boolean;
  frame_image_b64?: string;
  extracted_garment?: string;
}

export class CatV2TONClientEngine {
  private serverUrl: string;
  private isConnected: boolean = false;
  private activeGarmentB64: string | null = null;
  private activeCategory: string = "upper_body";
  private previousFrameData: ImageData | null = null;
  private pendingRequest: boolean = false;

  constructor(serverUrl: string = "http://localhost:3000") {
    this.serverUrl = serverUrl;
  }

  async checkServer(): Promise<boolean> {
    try {
      const resp = await fetch(`${this.serverUrl}/api/vton/status`, {
        signal: AbortSignal.timeout(1200)
      });
      if (resp.ok) {
        this.isConnected = true;
        return true;
      }
    } catch {}
    this.isConnected = false;
    return false;
  }

  get connected(): boolean {
    return this.isConnected;
  }

  /**
   * Sets new garment and runs identity stripper on the server (removes original model's face/hair/skin)
   */
  async setGarment(garmentDataUrl: string, category: string = "upper_body"): Promise<string | null> {
    this.activeGarmentB64 = garmentDataUrl;
    this.activeCategory = category;
    this.previousFrameData = null;

    try {
      const resp = await fetch(`${this.serverUrl}/api/extract-garment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: garmentDataUrl,
          category,
        }),
        signal: AbortSignal.timeout(4000)
      });
      if (resp.ok) {
        const data = await resp.json();
        return data.extracted_garment || garmentDataUrl;
      }
    } catch (err) {
      console.warn("[VESTORA:CatV2TON] setGarment error:", err);
    }
    return garmentDataUrl;
  }

  /**
   * Sends video frame to CatV2TON temporal pipeline with zero-shake motion stabilization
   */
  async processVideoFrame(
    videoEl: HTMLVideoElement,
    canvasEl: HTMLCanvasElement,
    options: CatV2TONFrameOptions = {}
  ): Promise<CatV2TONFrameResponse | null> {
    if (!this.isConnected || this.pendingRequest || !this.activeGarmentB64) {
      return null;
    }

    try {
      this.pendingRequest = true;

      // Capture current video frame into buffer canvas
      const width = Math.min(640, videoEl.videoWidth || 640);
      const height = Math.min(480, videoEl.videoHeight || 480);
      const offscreen = document.createElement("canvas");
      offscreen.width = width;
      offscreen.height = height;
      const octx = offscreen.getContext("2d", { willReadFrequently: true });
      if (!octx) return null;

      octx.drawImage(videoEl, 0, 0, width, height);
      const frameDataUrl = offscreen.toDataURL("image/jpeg", 0.80);

      const resp = await fetch(`${this.serverUrl}/api/tryon/video-frame`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frame: frameDataUrl,
          garment: this.activeGarmentB64,
          category: options.category || this.activeCategory,
          temporal_smoothing: options.enableTemporalSmoothing !== false,
          alpha: options.temporalAlpha || 0.35
        }),
        signal: AbortSignal.timeout(2500)
      });

      if (resp.ok) {
        return (await resp.json()) as CatV2TONFrameResponse;
      }
    } catch (err) {
      console.warn("[VESTORA:CatV2TON] processVideoFrame error:", err);
    } finally {
      this.pendingRequest = false;
    }
    return null;
  }

  reset(): void {
    this.previousFrameData = null;
    this.pendingRequest = false;
  }
}
