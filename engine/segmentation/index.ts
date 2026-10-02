/**
 * VESTORA Engine — Person & Garment Segmentation Layer
 * Isolates person, background, arms/hands for natural occlusion (PRD Section 17).
 */

export interface SegmentationMask {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface SegmentationEngine {
  initialize(): Promise<void>;
  segment(frame: ImageBitmap | HTMLVideoElement): Promise<SegmentationMask>;
  dispose(): void;
}

export class BaselineSegmentationEngine implements SegmentationEngine {
  private isInitialized = false;

  async initialize(): Promise<void> {
    this.isInitialized = true;
  }

  async segment(frame: ImageBitmap | HTMLVideoElement): Promise<SegmentationMask> {
    const width = frame instanceof ImageBitmap ? frame.width : frame.videoWidth;
    const height = frame instanceof ImageBitmap ? frame.height : frame.videoHeight;
    return {
      width,
      height,
      data: new Uint8Array(width * height).fill(255),
    };
  }

  dispose(): void {
    this.isInitialized = false;
  }
}
