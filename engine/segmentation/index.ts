/**
 * VESTORA Engine — Person & Garment Segmentation Layer
 * Isolates person, background, arms/hands for natural occlusion (PRD Section 17).
 * Zero cloud dependencies: Runs entirely in-browser / local engine.
 */

export interface SegmentationMask {
  width: number;
  height: number;
  data: Uint8Array;
}

export interface TorsoRegion {
  points: { x: number; y: number }[];
  collarCenter: { x: number; y: number };
  leftShoulder: { x: number; y: number };
  rightShoulder: { x: number; y: number };
  leftHip: { x: number; y: number };
  rightHip: { x: number; y: number };
}

export interface ArmOcclusionRegion {
  isLeftArmOccluding: boolean;
  isRightArmOccluding: boolean;
  leftArmPolygon: { x: number; y: number }[];
  rightArmPolygon: { x: number; y: number }[];
}

export interface SegmentationEngine {
  initialize(): Promise<void>;
  segment(frame: ImageBitmap | HTMLVideoElement): Promise<SegmentationMask>;
  extractTorsoRegion(landmarks: { x: number; y: number }[], width: number, height: number): TorsoRegion;
  detectArmOcclusion(landmarks: { x: number; y: number }[], width: number, height: number): ArmOcclusionRegion;
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

  extractTorsoRegion(landmarks: { x: number; y: number }[], width: number, height: number): TorsoRegion {
    const lShoulder = landmarks[5] || { x: width * 0.35, y: height * 0.55 };
    const rShoulder = landmarks[6] || { x: width * 0.65, y: height * 0.55 };
    const lHip = landmarks[11] || { x: width * 0.38, y: height * 0.95 };
    const rHip = landmarks[12] || { x: width * 0.62, y: height * 0.95 };
    const collar = landmarks[18] || { x: (lShoulder.x + rShoulder.x) / 2, y: (lShoulder.y + rShoulder.y) / 2 - height * 0.05 };

    const points = [
      collar,
      rShoulder,
      { x: rShoulder.x + (rHip.x - rShoulder.x) * 0.5, y: (rShoulder.y + rHip.y) * 0.5 },
      rHip,
      { x: (lHip.x + rHip.x) / 2, y: (lHip.y + rHip.y) / 2 },
      lHip,
      { x: lShoulder.x + (lHip.x - lShoulder.x) * 0.5, y: (lShoulder.y + lHip.y) * 0.5 },
      lShoulder,
    ];

    return {
      points,
      collarCenter: collar,
      leftShoulder: lShoulder,
      rightShoulder: rShoulder,
      leftHip: lHip,
      rightHip: rHip,
    };
  }

  detectArmOcclusion(landmarks: { x: number; y: number }[], width: number, height: number): ArmOcclusionRegion {
    const lShoulder = landmarks[5];
    const rShoulder = landmarks[6];
    const lElbow = landmarks[7];
    const rElbow = landmarks[8];
    const lWrist = landmarks[9];
    const rWrist = landmarks[10];
    const lHip = landmarks[11];
    const rHip = landmarks[12];

    if (!lShoulder || !rShoulder || !lHip || !rHip) {
      return {
        isLeftArmOccluding: false,
        isRightArmOccluding: false,
        leftArmPolygon: [],
        rightArmPolygon: [],
      };
    }

    const minX = Math.min(lShoulder.x, rShoulder.x);
    const maxX = Math.max(lShoulder.x, rShoulder.x);
    const minY = Math.min(lShoulder.y, rShoulder.y);
    const maxY = Math.max(lHip.y, rHip.y);

    const isLeftArmOccluding = Boolean(
      lWrist && lWrist.x >= minX && lWrist.x <= maxX && lWrist.y >= minY && lWrist.y <= maxY
    );
    const isRightArmOccluding = Boolean(
      rWrist && rWrist.x >= minX && rWrist.x <= maxX && rWrist.y >= minY && rWrist.y <= maxY
    );

    return {
      isLeftArmOccluding,
      isRightArmOccluding,
      leftArmPolygon: isLeftArmOccluding && lElbow && lWrist ? [lElbow, lWrist] : [],
      rightArmPolygon: isRightArmOccluding && rElbow && rWrist ? [rElbow, rWrist] : [],
    };
  }

  dispose(): void {
    this.isInitialized = false;
  }
}
