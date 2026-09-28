"""Audience Aligner Agent: Inward perception evaluation, privacy safeguards, and multi-viewer living room policy."""
import time
import logging
from typing import Dict, Any, Tuple
from app.models.schemas import ViewerTelemetry

logger = logging.getLogger("synapse.audience_aligner")


class AudienceAlignerAgent:
    """Evaluates viewer state, computes distraction/sleep duration, and enforces privacy & multi-viewer policies."""

    def __init__(self):
        self.last_attentive_timestamp: float = time.time()
        self.disengagement_start_timestamp: float = 0.0
        self.last_confusion_timestamp: float = 0.0
        self.current_state: str = "attentive"
        self.consecutive_disengaged_frames: int = 0
        self.consecutive_confused_frames: int = 0
        self.is_paused_by_agent: bool = False
        self.false_positive_suppressed: bool = False

    def evaluate_telemetry(self, telemetry: ViewerTelemetry) -> Dict[str, Any]:
        """Analyzes incoming telemetry packet and determines viewer state signals."""
        now = time.time()

        # Guardrail 1: Privacy Kill-Switch Check
        if telemetry.privacy_kill_switch:
            return {
                "gaze": "privacy_disabled",
                "attention_score": 1.0,
                "disengaged_duration": 0.0,
                "should_auto_pause": False,
                "pause_reason": None,
                "should_auto_resume": False,
                "should_trigger_clarification": False,
                "gesture": "none",
                "gesture_confidence": 0.0,
                "viewer_count": 1,
                "privacy_active": True
            }

        gaze = telemetry.gaze_status
        gesture = telemetry.detected_gesture

        # Gaze & Attention Analysis
        is_disengaged = gaze in ("distracted", "sleeping", "away") or telemetry.attention_score < 0.35

        if is_disengaged:
            if self.disengagement_start_timestamp == 0.0:
                self.disengagement_start_timestamp = now
            disengaged_duration = now - self.disengagement_start_timestamp
            self.consecutive_disengaged_frames += 1
        else:
            self.last_attentive_timestamp = now
            self.disengagement_start_timestamp = 0.0
            self.consecutive_disengaged_frames = 0
            disengaged_duration = 0.0

        # Confusion Analysis
        is_confused = telemetry.confusion_score > 0.65
        if is_confused:
            self.consecutive_confused_frames += 1
            self.last_confusion_timestamp = now
        else:
            self.consecutive_confused_frames = 0

        # Baseline single viewer pause conditions
        should_pause_sleep = gaze == "sleeping" and disengaged_duration >= 2.0
        should_pause_distracted = (gaze in ("distracted", "away") or telemetry.attention_score < 0.25) and disengaged_duration >= 3.5
        should_auto_pause = should_pause_sleep or should_pause_distracted

        # Guardrail 5: Living Room / Family Mode Majority Attention Rule
        if telemetry.living_room_policy == "family_mode" and telemetry.viewer_count > 1:
            # If at least one family member is attentive, DO NOT interrupt the broadcast
            if telemetry.attentive_viewer_count > 0:
                should_auto_pause = False
                pause_reason = None
            else:
                pause_reason = f"All {telemetry.viewer_count} family viewers are asleep or stepped away"
        else:
            pause_reason = "Viewer fell asleep" if should_pause_sleep else ("Viewer disengaged / walked away" if should_pause_distracted else None)

        should_auto_resume = (
            self.is_paused_by_agent
            and not is_disengaged
            and telemetry.attention_score >= 0.70
            and gaze == "attentive"
        )

        should_trigger_clarification = (
            is_confused
            and self.consecutive_confused_frames >= 2
            and not is_disengaged
        )

        result = {
            "gaze": gaze,
            "attention_score": telemetry.attention_score,
            "disengaged_duration": round(disengaged_duration, 2),
            "should_auto_pause": should_auto_pause,
            "pause_reason": pause_reason,
            "should_auto_resume": should_auto_resume,
            "should_trigger_clarification": should_trigger_clarification,
            "gesture": gesture,
            "gesture_confidence": telemetry.gesture_confidence,
            "viewer_count": telemetry.viewer_count,
            "privacy_active": False,
            "living_room_policy": telemetry.living_room_policy
        }

        return result

    def set_pause_state(self, is_paused: bool):
        self.is_paused_by_agent = is_paused

    def set_false_positive_suppression(self, suppressed: bool):
        self.false_positive_suppressed = suppressed
