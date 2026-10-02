/**
 * VESTORA Engine — Temporal Stabilization Layer
 * Eliminates jitter, flickering, and garment jumping across frames (PRD Section 6 & 21).
 */

import type { TemporalState, GarmentTransform } from "../../shared/types/index.js";

export class TemporalStabilizer {
  private state: TemporalState = {};

  smoothTransform(current: GarmentTransform, alpha = 0.22): GarmentTransform {
    const prev = this.state.previousGarmentTransform;
    if (!prev) {
      this.state.previousGarmentTransform = current;
      return current;
    }

    const smoothed: GarmentTransform = {
      x: prev.x * (1 - alpha) + current.x * alpha,
      y: prev.y * (1 - alpha) + current.y * alpha,
      scaleX: prev.scaleX * (1 - alpha) + current.scaleX * alpha,
      scaleY: prev.scaleY * (1 - alpha) + current.scaleY * alpha,
      rotation: prev.rotation * (1 - alpha) + current.rotation * alpha,
    };

    this.state.previousGarmentTransform = smoothed;
    return smoothed;
  }

  reset(): void {
    this.state = {};
  }
}
