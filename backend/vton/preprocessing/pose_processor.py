"""
VESTORA Pose & Landmark Preprocessor
Handles:
1. 19-keypoint anatomical landmarks tracking
2. Temporal smoothing (EMA) across camera frames to prevent shaking/flickering
3. Wrist, elbow, shoulder, hip, ankle anchor coordinates
4. Arm foreground occlusion calculations
"""

from typing import Dict, Any, Optional, List
from ..pose import PoseTracker

class PoseProcessor:
    def __init__(self):
        self.tracker = PoseTracker()
        self.prev_landmarks: Optional[List[Dict[str, float]]] = None
        self.smooth_alpha = 0.70  # Temporal exponential smoothing factor

    def process(
        self,
        width: int,
        height: int,
        raw_landmarks: Optional[List[Dict[str, float]]] = None
    ) -> Dict[str, Any]:
        """
        Estimates and temporally smooths pose landmarks.
        """
        if raw_landmarks:
            landmarks = raw_landmarks
        else:
            pose_data = self.tracker.estimate_pose(width, height)
            landmarks = pose_data["landmarks"]

        # Temporal smoothing across frames
        stabilized = self._smooth_landmarks(landmarks)

        # Compute anatomical metrics safely
        ls = stabilized[5] if len(stabilized) > 5 else {"x": width * 0.35, "y": height * 0.45}
        rs = stabilized[6] if len(stabilized) > 6 else {"x": width * 0.65, "y": height * 0.45}
        import math
        shoulder_dist = math.hypot(rs["x"] - ls["x"], rs["y"] - ls["y"])
        
        left_wrist = stabilized[9] if len(stabilized) > 9 else {"x": width * 0.25, "y": height * 0.85}
        right_wrist = stabilized[10] if len(stabilized) > 10 else {"x": width * 0.75, "y": height * 0.85}

        return {
            "landmarks": stabilized,
            "shoulder_distance": shoulder_dist,
            "torso_center": {
                "x": (ls["x"] + rs["x"]) / 2.0,
                "y": (ls["y"] + rs["y"]) / 2.0 + (height * 0.15)
            },
            "left_wrist": left_wrist,
            "right_wrist": right_wrist
        }

    def _smooth_landmarks(self, current: List[Dict[str, float]]) -> List[Dict[str, float]]:
        if not current:
            return current
        if self.prev_landmarks is None or len(self.prev_landmarks) != len(current):
            self.prev_landmarks = current
            return current

        smooth = []
        for c, p in zip(current, self.prev_landmarks):
            smooth.append({
                "x": c["x"] * self.smooth_alpha + p["x"] * (1 - self.smooth_alpha),
                "y": c["y"] * self.smooth_alpha + p["y"] * (1 - self.smooth_alpha),
                "visibility": c.get("visibility", 1.0)
            })
        self.prev_landmarks = smooth
        return smooth

    def reset(self):
        self.prev_landmarks = None
