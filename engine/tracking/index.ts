/**
 * VESTORA Engine — Pose & Body Tracking Layer
 * Interface abstraction for open-source / on-device pose estimation.
 */

import type { PoseEngine, PoseResult } from "../../shared/types/index.js";
import { Logger } from "../../shared/utilities/logger.js";
import { RealTimePoseTracker, LivePoseTrackResult, TrackedLandmark, BodyMeasurements } from "./real-time-pose-tracker.js";

const logger = new Logger("PoseEngine");

export { RealTimePoseTracker };
export type { LivePoseTrackResult, TrackedLandmark, BodyMeasurements };

export class BaselinePoseEngine implements PoseEngine {
  private isInitialized = false;
  private tracker: RealTimePoseTracker | null = null;

  async initialize(): Promise<void> {
    logger.info("Initializing real-time continuous pose tracking engine…");
    this.tracker = new RealTimePoseTracker();
    this.isInitialized = true;
  }

  async processFrame(frame: ImageBitmap | HTMLVideoElement): Promise<PoseResult> {
    if (!this.isInitialized || !this.tracker) {
      throw new Error("BaselinePoseEngine is not initialized.");
    }

    const width = frame instanceof ImageBitmap ? frame.width : frame.videoWidth;
    const height = frame instanceof ImageBitmap ? frame.height : frame.videoHeight;

    const res = this.tracker.track(frame, width, height);

    return {
      landmarks: res.landmarks.map((l) => ({
        x: l.x,
        y: l.y,
        visibility: l.v ?? 0.95,
      })),
      confidence: res.confidence,
      timestamp: res.timestamp,
    };
  }

  dispose(): void {
    if (this.tracker) {
      this.tracker.reset();
      this.tracker = null;
    }
    this.isInitialized = false;
    logger.info("Pose tracking engine disposed.");
  }
}
