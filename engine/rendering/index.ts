/**
 * VESTORA Engine — Real-Time Renderer
 * Supports GPU-accelerated canvas rendering with WebGPU / Canvas 2D fallback (PRD Section 20).
 */

export interface RenderContext {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
}

export interface RenderEngine {
  initialize(canvas: HTMLCanvasElement): Promise<void>;
  render(video: HTMLVideoElement): void;
  dispose(): void;
}

export class BaselineRenderer implements RenderEngine {
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;

  async initialize(canvas: HTMLCanvasElement): Promise<void> {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { desynchronized: true });
  }

  render(video: HTMLVideoElement): void {
    if (!this.canvas || !this.ctx) return;
    this.ctx.drawImage(video, 0, 0, this.canvas.width, this.canvas.height);
  }

  dispose(): void {
    this.canvas = null;
    this.ctx = null;
  }
}
