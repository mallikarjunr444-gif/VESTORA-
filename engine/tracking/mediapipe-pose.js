/**
 * Real body tracking for the live try-on (replaces the hard-coded
 * estimateBasePose()). Outputs VESTORA's 19-landmark layout in *video pixels*.
 *
 * Left/right are intentionally swapped vs MediaPipe: the renderer's mesh expects
 * "L" = smaller x on the (selfie-mirrored) screen, which is MediaPipe's RIGHT.
 */
import { PoseLandmarker } from "@mediapipe/tasks-vision";
import { getFileset, assetUrl } from "../vision/runtime.js";

// VESTORA index -> MediaPipe index
const MAP = {
  0: 0, 1: 5, 2: 2, 3: 8, 4: 7, 5: 12, 6: 11, 7: 14, 8: 13, 9: 16, 10: 15,
  11: 24, 12: 23, 13: 26, 14: 25, 15: 28, 16: 27,
};
const MIN_VIS = 0.5;

export function mapLandmarks(mp, width, height) {
  const pt = (i) => ({ x: mp[i].x * width, y: mp[i].y * height, v: mp[i].visibility ?? 1 });
  const lm = [];
  for (let i = 0; i <= 16; i++) lm[i] = pt(MAP[i]);

  const sh = { l: lm[5], r: lm[6] };
  if (Math.min(sh.l.v, sh.r.v) < MIN_VIS) return null; // can't see shoulders -> no body

  const midX = (sh.l.x + sh.r.x) / 2;
  const midY = (sh.l.y + sh.r.y) / 2;
  const shoulderDist = Math.hypot(sh.r.x - sh.l.x, sh.r.y - sh.l.y);
  const tilt = Math.atan2(sh.r.y - sh.l.y, sh.r.x - sh.l.x);
  // "down the spine" unit vector, perpendicular to the shoulder line
  const down = { x: -Math.sin(tilt), y: Math.cos(tilt) };

  // Desk webcams usually cut the frame at the chest: hips/elbows/wrists have
  // low visibility and MediaPipe invents positions. Synthesise sane ones.
  const torso = shoulderDist * 1.3;
  for (const [i, side] of [[11, sh.l], [12, sh.r]]) {
    if (lm[i].v < MIN_VIS) {
      lm[i] = { x: side.x * 0.85 + midX * 0.15 + down.x * torso, y: side.y + down.y * torso, v: 0.6 };
    }
  }
  for (const [e, w, s] of [[7, 9, sh.l], [8, 10, sh.r]]) {
    if (lm[e].v < MIN_VIS) lm[e] = { x: s.x + down.x * torso * 0.5, y: s.y + down.y * torso * 0.5, v: 0.6 };
    if (lm[w].v < MIN_VIS) lm[w] = { x: s.x + down.x * torso * 0.95, y: s.y + down.y * torso * 0.95, v: 0.6 };
  }

  const nose = lm[0];
  lm[17] = { x: nose.x + (nose.x - midX) * 0.9, y: nose.y + (nose.y - midY) * 0.9, v: nose.v }; // crown
  lm[18] = { x: midX, y: midY, v: 1 };                                                         // neck
  return { landmarks: lm, confidence: Math.min(sh.l.v, sh.r.v), timestamp: performance.now() };
}

export class PoseTracker {
  constructor() {
    this.landmarker = null;
    this.ready = false;
    this.failed = false;
    this.lastVideoTime = -1;
    this.lastPose = null;
    this.missCount = 0;
  }

  async init() {
    try {
      const fileset = await getFileset();
      const opts = (delegate) => ({
        baseOptions: { modelAssetPath: assetUrl("models/pose_landmarker_lite.task"), delegate },
        runningMode: "VIDEO",
        numPoses: 1,
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      try {
        this.landmarker = await PoseLandmarker.createFromOptions(fileset, opts("GPU"));
      } catch {
        this.landmarker = await PoseLandmarker.createFromOptions(fileset, opts("CPU"));
      }
      this.ready = true;
    } catch (err) {
      console.error("[VESTORA] Pose model failed to load (did you run `npm run models`?)", err);
      this.failed = true;
    }
  }

  /** Returns a pose, or null when nobody is in frame. */
  detect(video) {
    if (!this.ready || video.readyState < 2) return this.lastPose;
    if (video.currentTime === this.lastVideoTime) return this.lastPose; // same frame
    this.lastVideoTime = video.currentTime;
    const res = this.landmarker.detectForVideo(video, performance.now());
    const mp = res.landmarks?.[0];
    const pose = mp ? mapLandmarks(mp, video.videoWidth, video.videoHeight) : null;
    if (pose) { this.lastPose = pose; this.missCount = 0; }
    else if (++this.missCount > 10) this.lastPose = null; // lost for ~10 frames
    return this.lastPose;
  }
}
