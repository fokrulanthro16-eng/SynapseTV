"""Lightweight Spatial Gesture Recognition Engine for Fire TV Inward Camera / Vision Stream."""
import math
import time
from typing import Dict, Any, List, Optional, Tuple
from app.models.schemas import GestureType


class GestureEngine:
    """Classifies spatial hand gestures (Pinch, Palm, Swipe, Thumbs Up) from landmark coordinates or telemetry."""

    def __init__(self):
        self.history: List[Dict[str, Any]] = []
        self.max_history_len = 10

    def compute_distance(self, p1: Dict[str, float], p2: Dict[str, float]) -> float:
        """Euclidean distance between two 2D/3D normalized points."""
        dx = p1.get("x", 0.0) - p2.get("x", 0.0)
        dy = p1.get("y", 0.0) - p2.get("y", 0.0)
        dz = p1.get("z", 0.0) - p2.get("z", 0.0)
        return math.sqrt(dx * dx + dy * dy + dz * dz)

    def analyze_landmarks(self, landmarks: List[Dict[str, float]]) -> Tuple[GestureType, float]:
        """
        Processes 21 standard MediaPipe hand landmarks:
        0: Wrist
        4: Thumb tip
        8: Index finger tip
        12: Middle finger tip
        16: Ring finger tip
        20: Pinky finger tip
        """
        if not landmarks or len(landmarks) < 21:
            return "none", 0.0

        now = time.time()
        wrist = landmarks[0]
        thumb_tip = landmarks[4]
        index_tip = landmarks[8]
        middle_tip = landmarks[12]
        ring_tip = landmarks[16]
        pinky_tip = landmarks[20]

        # Record wrist motion in history for swipe detection
        self.history.append({"x": wrist.get("x", 0.0), "y": wrist.get("y", 0.0), "time": now})
        if len(self.history) > self.max_history_len:
            self.history.pop(0)

        # 1. Pinch Detection (Thumb tip close to Index tip)
        pinch_dist = self.compute_distance(thumb_tip, index_tip)
        if pinch_dist < 0.06:
            return "pinch_zoom", round(1.0 - (pinch_dist / 0.06) * 0.4, 2)

        # 2. Swipe Detection from horizontal velocity of wrist over last 3-5 frames
        if len(self.history) >= 4:
            dx = self.history[-1]["x"] - self.history[0]["x"]
            dt = self.history[-1]["time"] - self.history[0]["time"]
            if dt > 0.05:
                vx = dx / dt
                if vx > 1.4:
                    return "swipe_forward", min(0.95, abs(vx) / 2.0)
                elif vx < -1.4:
                    return "swipe_rewind", min(0.95, abs(vx) / 2.0)

        # 3. Open Palm Detection (all fingertips extended well above wrist in normalized space)
        all_tips_extended = (
            index_tip.get("y", 0.0) < landmarks[6].get("y", 0.0) and
            middle_tip.get("y", 0.0) < landmarks[10].get("y", 0.0) and
            ring_tip.get("y", 0.0) < landmarks[14].get("y", 0.0) and
            pinky_tip.get("y", 0.0) < landmarks[18].get("y", 0.0)
        )
        if all_tips_extended:
            # Check if thumb is also extended outward
            return "palm_pause", 0.94

        # 4. Thumbs Up Detection (thumb extended upward, other fingers curled)
        thumb_up = thumb_tip.get("y", 0.0) < landmarks[2].get("y", 0.0)
        other_curled = (
            index_tip.get("y", 0.0) > landmarks[6].get("y", 0.0) and
            middle_tip.get("y", 0.0) > landmarks[10].get("y", 0.0) and
            ring_tip.get("y", 0.0) > landmarks[14].get("y", 0.0)
        )
        if thumb_up and other_curled:
            return "thumbs_up_bookmark", 0.91

        return "none", 0.0

    def generate_simulated_gesture(self, gesture_name: str) -> Dict[str, Any]:
        """Provides simulated landmark sets for continuous test harness."""
        if gesture_name == "palm_pause":
            return {"gesture": "palm_pause", "confidence": 0.96, "landmarks_simulated": True}
        elif gesture_name == "pinch_zoom":
            return {"gesture": "pinch_zoom", "confidence": 0.92, "landmarks_simulated": True}
        elif gesture_name == "swipe_forward":
            return {"gesture": "swipe_forward", "confidence": 0.89, "landmarks_simulated": True}
        elif gesture_name == "swipe_rewind":
            return {"gesture": "swipe_rewind", "confidence": 0.88, "landmarks_simulated": True}
        elif gesture_name == "thumbs_up":
            return {"gesture": "thumbs_up_bookmark", "confidence": 0.94, "landmarks_simulated": True}
        return {"gesture": "none", "confidence": 0.0, "landmarks_simulated": False}


_gesture_engine_instance: Optional[GestureEngine] = None

def get_gesture_engine() -> GestureEngine:
    global _gesture_engine_instance
    if _gesture_engine_instance is None:
        _gesture_engine_instance = GestureEngine()
    return _gesture_engine_instance
