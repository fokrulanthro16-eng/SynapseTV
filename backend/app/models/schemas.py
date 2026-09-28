"""Pydantic data models and schemas for SynapseTV telemetry, scene analysis, swarm directives, and B2B verticals."""
from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field
import time


# Telemetry & Viewer States
GazeStatus = Literal["attentive", "distracted", "sleeping", "away", "fallen_unresponsive"]
CognitiveState = Literal["focused", "confused", "bored", "excited", "neutral"]
GestureType = Literal[
    "none",
    "palm_mute",
    "palm_pause",
    "swipe_forward",
    "swipe_rewind",
    "pinch_zoom",
    "thumbs_up_bookmark",
    "head_nod"
]

class ViewerTelemetry(BaseModel):
    """Real-time inward viewer perception telemetry emitted by client/vision."""
    viewer_id: str = "viewer_primary"
    timestamp: float = Field(default_factory=time.time)
    current_playback_time: float = 0.0
    media_title: str = "Premier League Super Sunday: Arsenal vs Man City"
    gaze_status: GazeStatus = "attentive"
    attention_score: float = Field(default=0.95, ge=0.0, le=1.0)
    confusion_score: float = Field(default=0.10, ge=0.0, le=1.0)
    eye_aspect_ratio: Optional[float] = 0.28
    detected_gesture: GestureType = "none"
    gesture_confidence: float = Field(default=0.0, ge=0.0, le=1.0)
    face_detected: bool = True
    viewer_count: int = 1
    attentive_viewer_count: int = 1
    is_simulated: bool = False
    posture_state: str = "seated"  # "seated" | "reclined" | "fallen_floor" | "standing"
    privacy_kill_switch: bool = False
    edge_power_mode: Literal["eco", "balanced", "turbo"] = "turbo"
    living_room_policy: Literal["single_viewer", "family_mode"] = "single_viewer"
    false_positive_suppressed: bool = False


# Outward Scene Perception
class SceneContext(BaseModel):
    """Contextual intelligence extracted from outward video stream / frame."""
    timestamp: float = Field(default_factory=time.time)
    playback_position_sec: float = 0.0
    scene_id: str = "sc_001"
    tags: List[str] = Field(default_factory=lambda: ["tactics", "live_sports", "high_press"])
    parental_rating: str = "TV-G"
    content_flags: List[str] = Field(default_factory=list)
    synopsis: str = "Tactical transition in midfield; Arsenal shifts into a 4-3-3 high-press block."
    active_entities: List[str] = Field(default_factory=lambda: ["Martin Ødegaard", "Pep Guardiola", "Mikel Arteta"])
    audio_dynamics: Literal["dialogue", "crowd_roar", "action", "whisper", "music"] = "crowd_roar"
    complexity_score: float = 0.72


# Vertical 1: Amazon Ads / Retail Synergy
class ProductSpotlight(BaseModel):
    """Contextual in-stream retail product detected by Scene Sentinel & Bedrock."""
    product_id: str = "prod_ball_01"
    asin: str = "B0CP91X9MK"
    title: str = "Official Premier League Nike Flight Match Ball"
    brand: str = "Nike Football"
    price: str = "$165.00"
    prime_badge: bool = True
    rating: float = 4.8
    review_count: int = 2410
    detected_in_frame: str = "Official Match Ball (Center Pitch)"
    scene_timestamp: str = "01:05"
    delivery_promise: str = "FREE One-Day Delivery with Prime"
    checkout_url: str = "https://www.amazon.com/dp/B0CP91X9MK"


# Vertical 2: Senior Care & One Medical Emergency Sentinel
class EmergencyAlertData(BaseModel):
    """Emergency dispatch packet routed to AWS IoT Core & Amazon One Medical."""
    alert_id: str
    event_type: Literal["FALL_DETECTED", "UNRESPONSIVE_VIEWER", "CARDIAC_ANOMALY"]
    severity: Literal["CRITICAL", "HIGH", "MODERATE"]
    timestamp: float = Field(default_factory=time.time)
    location: str = "Living Room (Fire TV Omni 65' Optical Sensor)"
    auto_dispatch_countdown_sec: int = 30
    recipient_channels: List[str] = Field(
        default_factory=lambda: [
            "Amazon One Medical Emergency Triage",
            "Family Caregiver SMS (AWS SNS)",
            "Local Dispatch Beacon (AWS IoT Core)"
        ]
    )
    vital_estimate: str = "No motion detected for 45s following impact vector"


# Autonomous Swarm Actions
ActionType = Literal[
    "AUTO_PAUSE",
    "RESUME_PLAYBACK",
    "SMART_BOOKMARK",
    "SHOW_EXPLAINER",
    "HIDE_EXPLAINER",
    "MUTE_TOGGLE",
    "SEEK_RELATIVE",
    "ENHANCE_DIALOGUE",
    "ZOOM_FRAME",
    "PRODUCT_SPOTLIGHT",
    "EMERGENCY_ALERT",
    "NO_ACTION"
]

class ExplainerCard(BaseModel):
    """Cognitive micro-explainer payload rendered on Fire TV 10-foot UI."""
    explainer_id: str
    title: str
    category: Literal["Tactical Shift", "Plot Clarification", "Entity Profile", "Trivia", "Audio Alert"]
    snippet: str
    bullet_points: List[str] = Field(default_factory=list)
    confidence: float = 0.94
    auto_dismiss_sec: int = 12
    suggested_actions: List[str] = Field(default_factory=lambda: ["Got it", "Tell Me More", "Mute Insights"])


class SwarmDirective(BaseModel):
    """Consensus adaptation directive pushed to Fire TV client."""
    directive_id: str
    action: ActionType
    reason: str
    timestamp: float = Field(default_factory=time.time)
    smart_bookmark: Optional[str] = None
    seek_delta_seconds: Optional[int] = None
    explainer: Optional[ExplainerCard] = None
    product_spotlight: Optional[ProductSpotlight] = None
    emergency_alert: Optional[EmergencyAlertData] = None
    consensus_score: float = 0.95
    responsible_agent: str = "SwarmOrchestrator"
    priority: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] = "MEDIUM"


# Remote Control & Interaction Packets
class RemoteCommand(BaseModel):
    """Fire TV remote physical event mapped from D-Pad."""
    key_code: str  # "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Back"
    timestamp: float = Field(default_factory=time.time)
    focus_target_id: Optional[str] = None


# Enterprise B2B Telemetry & Metrics
class EnterpriseB2BMetrics(BaseModel):
    """Live B2B & Digital Signage Ingestion Metrics."""
    frame_ingestion_fps: float = 59.8
    bedrock_compute_load_percent: float = 38.5
    bedrock_p95_latency_ms: float = 24.2
    audience_dwell_retention_index: float = 94.2
    active_ad_dwell_seconds: float = 14.5
    commercial_venue_mode: bool = False


class SystemStatus(BaseModel):
    """Health and status of the Bedrock Swarm agents and B2B pipelines."""
    bedrock_connected: bool
    mock_mode: bool
    active_model: str
    agents_active: List[str]
    active_viewers: int
    system_latency_ms: float
    enterprise_metrics: EnterpriseB2BMetrics = Field(default_factory=EnterpriseB2BMetrics)
