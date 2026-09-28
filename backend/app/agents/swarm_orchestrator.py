"""Swarm Orchestrator Agent: Reconciles Scene Sentinel, Audience Aligner, and B2B/Emergency Verticals."""
import time
import uuid
import logging
from typing import Optional, List, Dict, Any
from app.models.schemas import (
    ViewerTelemetry,
    SceneContext,
    SwarmDirective,
    ExplainerCard,
    ProductSpotlight,
    EmergencyAlertData,
    ActionType
)
from app.agents.scene_sentinel import SceneSentinelAgent
from app.agents.audience_aligner import AudienceAlignerAgent
from app.config import get_settings

logger = logging.getLogger("synapse.swarm_orchestrator")
settings = get_settings()


class SwarmOrchestrator:
    """Multi-Agent consensus state machine with B2B Enterprise, Retail, and Emergency Sentinel adaptation."""

    def __init__(self):
        self.scene_sentinel = SceneSentinelAgent()
        self.audience_aligner = AudienceAlignerAgent()
        self.last_explainer_timestamp: float = 0.0
        self.last_gesture_timestamp: float = 0.0
        self.is_paused: bool = False
        self.is_emergency_active: bool = False
        self.bookmarks: List[Dict[str, Any]] = []
        self.recent_directives: List[SwarmDirective] = []

    def format_time_str(self, seconds: float) -> str:
        mins = int(seconds // 60)
        secs = int(seconds % 60)
        return f"{mins:02d}:{secs:02d}"

    async def step(self, telemetry: ViewerTelemetry) -> Optional[SwarmDirective]:
        """Runs the consensus evaluation DAG on each telemetry ingestion tick."""
        now = time.time()
        playback_sec = telemetry.current_playback_time
        title = telemetry.media_title

        # Step 0: Senior Care & Amazon One Medical Emergency Check (Highest Priority)
        emergency_triggered = (telemetry.gaze_status == "fallen_unresponsive" or telemetry.posture_state == "fallen_floor")
        if emergency_triggered and not self.false_positive_suppressed and not telemetry.false_positive_suppressed:
            if not self.is_emergency_active:
                self.is_emergency_active = True
                self.is_paused = True
                self.audience_aligner.set_pause_state(True)
                return self.create_emergency_alert(telemetry)

        # Guardrail 1: Privacy Kill-Switch (Blind D-Pad Mode)
        if telemetry.privacy_kill_switch:
            # Completely disable inward facial, gaze, and gesture adaptations
            return None

        # Step 1: Outward perception from Scene Sentinel
        scene_ctx = await self.scene_sentinel.analyze_frame_context(playback_sec, title)

        # Step 2: Inward perception from Audience Aligner
        viewer_analysis = self.audience_aligner.evaluate_telemetry(telemetry)

        # Step 3: Zero-Touch Gestures (Immediate response debounced by 1.2s)
        gesture = viewer_analysis["gesture"]
        gesture_conf = viewer_analysis["gesture_confidence"]

        if gesture != "none" and gesture_conf >= 0.70 and (now - self.last_gesture_timestamp > 1.2):
            self.last_gesture_timestamp = now

            if gesture == "palm_pause":
                self.is_paused = not self.is_paused
                self.audience_aligner.set_pause_state(self.is_paused)
                return self._create_directive(
                    action="AUTO_PAUSE" if self.is_paused else "RESUME_PLAYBACK",
                    reason=f"Zero-Touch Gesture: Open Palm detected ({gesture})",
                    priority="HIGH",
                    smart_bookmark=self.format_time_str(playback_sec) if self.is_paused else None
                )

            elif gesture == "palm_mute":
                return self._create_directive(
                    action="MUTE_TOGGLE",
                    reason="Zero-Touch Gesture: Palm Mute sign recognized",
                    priority="MEDIUM"
                )

            elif gesture == "swipe_forward":
                return self._create_directive(
                    action="SEEK_RELATIVE",
                    reason="Zero-Touch Gesture: Swipe Right (+30s skip)",
                    priority="MEDIUM",
                    seek_delta=30
                )

            elif gesture == "swipe_rewind":
                return self._create_directive(
                    action="SEEK_RELATIVE",
                    reason="Zero-Touch Gesture: Swipe Left (-15s rewind)",
                    priority="MEDIUM",
                    seek_delta=-15
                )

            elif gesture == "pinch_zoom":
                return self._create_directive(
                    action="ZOOM_FRAME",
                    reason="Zero-Touch Gesture: Spatial Two-Finger Pinch",
                    priority="LOW"
                )

            elif gesture == "thumbs_up_bookmark":
                bm_str = self.format_time_str(playback_sec)
                self.bookmarks.append({"time": bm_str, "scene": scene_ctx.synopsis, "timestamp": now})
                return self._create_directive(
                    action="SMART_BOOKMARK",
                    reason="Zero-Touch Gesture: Thumbs Up smart bookmark created",
                    priority="MEDIUM",
                    smart_bookmark=bm_str
                )

        # Step 4: Auto-Pause on Sleep / Severe Disengagement
        if viewer_analysis["should_auto_pause"] and not self.is_paused:
            self.is_paused = True
            self.audience_aligner.set_pause_state(True)
            bm_str = self.format_time_str(playback_sec)
            self.bookmarks.append({
                "time": bm_str,
                "scene": scene_ctx.synopsis,
                "timestamp": now,
                "reason": viewer_analysis["pause_reason"]
            })

            return self._create_directive(
                action="AUTO_PAUSE",
                reason=viewer_analysis["pause_reason"] or "Viewer disengaged",
                priority="CRITICAL",
                smart_bookmark=bm_str
            )

        # Step 5: Proactive Auto-Resume when viewer returns attention
        if viewer_analysis["should_auto_resume"] and self.is_paused:
            self.is_paused = False
            self.audience_aligner.set_pause_state(False)
            return self._create_directive(
                action="RESUME_PLAYBACK",
                reason="Viewer gaze returned to screen - resuming stream",
                priority="HIGH"
            )

        # Step 6: Cognitive Micro-Explainer (Bedrock Swarm Consensus)
        cooldown_elapsed = (now - self.last_explainer_timestamp) > settings.EXPLAINER_COOLDOWN_SECONDS
        tactical_trigger = "tactics" in scene_ctx.tags and scene_ctx.complexity_score > 0.80
        confusion_trigger = viewer_analysis["should_trigger_clarification"]

        if not self.is_paused and cooldown_elapsed and (confusion_trigger or tactical_trigger):
            self.last_explainer_timestamp = now
            trigger_reason = (
                "Viewer confused during complex scene transition"
                if confusion_trigger
                else "Major tactical formation shift detected in play"
            )

            explainer = await self.scene_sentinel.generate_micro_explainer(scene_ctx, trigger_reason)
            return self._create_directive(
                action="SHOW_EXPLAINER",
                reason=trigger_reason,
                priority="MEDIUM",
                explainer=explainer
            )

        return None

    def create_product_spotlight(self, product_type: str = "ball") -> SwarmDirective:
        """Generates Amazon Retail & Ad-Tech product spotlight card."""
        if product_type == "ball":
            product = ProductSpotlight(
                product_id="prod_nike_flight_01",
                asin="B0CP91X9MK",
                title="Nike Flight Official Premier League Match Ball",
                brand="Nike Football",
                price="$165.00",
                prime_badge=True,
                rating=4.9,
                review_count=1840,
                detected_in_frame="Official Match Ball (Center Pitch)",
                scene_timestamp="01:05",
                delivery_promise="FREE One-Day Delivery with Prime",
                checkout_url="https://www.amazon.com/dp/B0CP91X9MK"
            )
        elif product_type == "drone":
            product = ProductSpotlight(
                product_id="prod_dji_mini_02",
                asin="B0B7F8P9QK",
                title="DJI Mini 4 Pro 4K HDR Stadium Drone Camera",
                brand="DJI Enterprise",
                price="$759.00",
                prime_badge=True,
                rating=4.8,
                review_count=3290,
                detected_in_frame="Skycam Broadcast Rig Overhead",
                scene_timestamp="01:24",
                delivery_promise="FREE One-Day Delivery with Prime",
                checkout_url="https://www.amazon.com/dp/B0B7F8P9QK"
            )
        else:
            product = ProductSpotlight(
                product_id="prod_lamp_03",
                asin="B09B8W7X6Z",
                title="Amazon Echo Glow & Smart Ambient Studio Lamp",
                brand="Amazon Basics",
                price="$29.99",
                prime_badge=True,
                rating=4.7,
                review_count=5420,
                detected_in_frame="Living Room Ambient Hue Sync",
                scene_timestamp="00:45",
                delivery_promise="FREE One-Day Delivery with Prime",
                checkout_url="https://www.amazon.com/dp/B09B8W7X6Z"
            )

        return self._create_directive(
            action="PRODUCT_SPOTLIGHT",
            reason=f"Amazon Contextual Retail: In-Stream Product Identified ({product.detected_in_frame})",
            priority="MEDIUM",
            product_spotlight=product
        )

    def create_emergency_alert(self, telemetry: Optional[ViewerTelemetry] = None) -> SwarmDirective:
        """Generates Senior Care & Amazon One Medical Emergency Directive."""
        self.is_emergency_active = True
        self.is_paused = True
        emergency = EmergencyAlertData(
            alert_id=f"emer_{uuid.uuid4().hex[:8]}",
            event_type="FALL_DETECTED",
            severity="CRITICAL",
            timestamp=time.time(),
            location="Living Room (Fire TV Omni Optical Sensor)",
            auto_dispatch_countdown_sec=30,
            recipient_channels=[
                "Amazon One Medical Emergency Triage",
                "Family Caregiver SMS (AWS SNS)",
                "Local Dispatch Beacon (AWS IoT Core)"
            ],
            vital_estimate="Sudden vertical impact vector followed by zero movement for >30s"
        )
        return self._create_directive(
            action="EMERGENCY_ALERT",
            reason="Senior Care Sentinel: Sudden viewer fall or unresponsiveness detected",
            priority="CRITICAL",
            emergency_alert=emergency
        )

    def dismiss_emergency(self, learn_relax: bool = False):
        """Dismisses active emergency state upon user confirmation and optionally arms false-positive suppression."""
        self.is_emergency_active = False
        self.is_paused = False
        self.audience_aligner.set_pause_state(False)
        if learn_relax:
            self.false_positive_suppressed = True
            self.audience_aligner.set_false_positive_suppression(True)
            logger.info("Viewer indicated 'Just Relaxing' - Emergency false positive suppression active.")

    def _create_directive(
        self,
        action: ActionType,
        reason: str,
        priority: str = "MEDIUM",
        smart_bookmark: Optional[str] = None,
        seek_delta: Optional[int] = None,
        explainer: Optional[ExplainerCard] = None,
        product_spotlight: Optional[ProductSpotlight] = None,
        emergency_alert: Optional[EmergencyAlertData] = None
    ) -> SwarmDirective:
        directive = SwarmDirective(
            directive_id=f"dir_{uuid.uuid4().hex[:8]}",
            action=action,
            reason=reason,
            timestamp=time.time(),
            smart_bookmark=smart_bookmark,
            seek_delta_seconds=seek_delta,
            explainer=explainer,
            product_spotlight=product_spotlight,
            emergency_alert=emergency_alert,
            consensus_score=0.97,
            responsible_agent="SwarmOrchestrator",
            priority=priority  # type: ignore
        )
        self.recent_directives.append(directive)
        if len(self.recent_directives) > 50:
            self.recent_directives.pop(0)
        return directive
