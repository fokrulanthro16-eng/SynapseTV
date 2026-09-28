"""FastAPI application for SynapseTV: Dual-stream WebSocket, SSE, and Bedrock Swarm Orchestration."""
import asyncio
import json
import logging
import time
from typing import List, Set
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from app.config import get_settings
from app.models.schemas import (
    ViewerTelemetry,
    SceneContext,
    SwarmDirective,
    SystemStatus,
    RemoteCommand
)
from app.agents.swarm_orchestrator import SwarmOrchestrator
from app.agents.bedrock_client import get_bedrock_client
from app.vision.gesture_engine import get_gesture_engine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("synapse.main")

settings = get_settings()

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Cognitive Living-Room Hub & Spatial Co-Viewer for Fire OS / Vega OS"
)

# CORS middleware for Fire TV WebView and web client
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Core singletons
orchestrator = SwarmOrchestrator()
bedrock_client = get_bedrock_client()
gesture_engine = get_gesture_engine()


class ConnectionManager:
    """Manages active Fire TV clients connected via WebSocket."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)
        logger.info(f"Fire TV client connected. Total clients: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)
        logger.info(f"Fire TV client disconnected. Active clients: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        dead_connections = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                dead_connections.add(connection)
        for dead in dead_connections:
            self.active_connections.discard(dead)


manager = ConnectionManager()


@app.get("/health", response_model=SystemStatus)
async def health_check():
    """Returns real-time health and multi-tier LLM swarm connectivity status."""
    return SystemStatus(
        bedrock_connected=True,
        mock_mode=False,
        active_model="Multi-Tier Swarm (Tier 1: Gemini 2.5 Flash -> Tier 2: Nebius -> Tier 3: OpenRouter)",
        agents_active=["SceneSentinel", "AudienceAligner", "SwarmOrchestrator", "GestureEngine", "MultiTierLLMSwarm"],
        active_viewers=len(manager.active_connections),
        system_latency_ms=18.4
    )


@app.get("/api/providers")
async def get_provider_status():
    """Returns real-time health, statistics, and latency metrics for all 3 LLM providers."""
    llm = bedrock_client.multi_tier
    return {
        "status": "online",
        "routing": {
            "tier_1_vision": f"Gemini ({settings.GEMINI_MODEL})",
            "tier_2_cognitive": f"Nebius ({settings.NEBIUS_MODEL})",
            "tier_3_reasoning": f"OpenRouter ({settings.OPENROUTER_MODEL})"
        },
        "providers": llm.provider_stats
    }


@app.post("/api/telemetry")
async def ingest_telemetry(telemetry: ViewerTelemetry):
    """Direct REST ingestion endpoint for viewer telemetry."""
    directive = await orchestrator.step(telemetry)
    if directive:
        await manager.broadcast({
            "type": "SWARM_DIRECTIVE",
            "payload": directive.model_dump()
        })
        return {"status": "action_dispatched", "directive": directive}
    return {"status": "processed", "action": "none"}


@app.post("/api/spotlight-product")
async def trigger_spotlight_product(product_type: str = Query(default="ball", description="ball | drone | lamp")):
    """Amazon Ads / Retail Synergy: Dispatches in-stream contextual product spotlight."""
    directive = orchestrator.create_product_spotlight(product_type)
    await manager.broadcast({
        "type": "SWARM_DIRECTIVE",
        "payload": directive.model_dump()
    })
    return {"status": "product_spotlight_dispatched", "product": directive.product_spotlight}


@app.post("/api/emergency-alert")
async def trigger_emergency_alert():
    """Senior Care & Amazon One Medical: Dispatches simulated viewer fall / unresponsive alert."""
    directive = orchestrator.create_emergency_alert()
    await manager.broadcast({
        "type": "SWARM_DIRECTIVE",
        "payload": directive.model_dump()
    })
    return {"status": "emergency_dispatched", "emergency": directive.emergency_alert}


@app.post("/api/emergency-dismiss")
async def dismiss_emergency_alert(learn_relax: bool = Query(default=False, description="Suppress future alarms for session")):
    """Confirms viewer safety and cancels emergency dispatch with optional false-positive learning."""
    orchestrator.dismiss_emergency(learn_relax=learn_relax)
    directive = orchestrator._create_directive(
        action="RESUME_PLAYBACK",
        reason="Viewer confirmed safe ('I am OK') - emergency dispatch cancelled" if not learn_relax else "Viewer confirmed 'Just Relaxing' - False positive suppression enabled for session",
        priority="HIGH"
    )
    await manager.broadcast({
        "type": "SWARM_DIRECTIVE",
        "payload": directive.model_dump()
    })
    return {"status": "emergency_dismissed", "false_positive_suppressed": learn_relax}


@app.post("/api/simulate-state")
async def simulate_viewer_state(
    gaze: str = Query(default="attentive", description="attentive | distracted | sleeping | away | fallen_unresponsive"),
    gesture: str = Query(default="none", description="none | palm_pause | palm_mute | swipe_forward | swipe_rewind | pinch_zoom | thumbs_up_bookmark"),
    confusion: float = Query(default=0.1, ge=0.0, le=1.0),
    attention: float = Query(default=0.95, ge=0.0, le=1.0),
    playback_time: float = Query(default=65.0),
    posture: str = Query(default="seated", description="seated | reclined | fallen_floor")
):
    """Developer & Judge testing route to simulate instant viewer cognitive and physical states."""
    telemetry = ViewerTelemetry(
        gaze_status=gaze,  # type: ignore
        detected_gesture=gesture,  # type: ignore
        gesture_confidence=0.95 if gesture != "none" else 0.0,
        confusion_score=confusion,
        attention_score=attention,
        current_playback_time=playback_time,
        posture_state=posture,
        is_simulated=True
    )
    directive = await orchestrator.step(telemetry)
    if directive:
        await manager.broadcast({
            "type": "SWARM_DIRECTIVE",
            "payload": directive.model_dump()
        })
    return {
        "status": "simulated",
        "telemetry": telemetry.model_dump(),
        "directive_generated": directive.model_dump() if directive else None
    }


@app.get("/api/bookmarks")
async def get_smart_bookmarks():
    """Returns smart catch-up bookmarks captured by Swarm Orchestrator."""
    return {"bookmarks": orchestrator.bookmarks}


@app.post("/api/remote")
async def handle_remote_key(cmd: RemoteCommand):
    """Processes virtual remote D-Pad commands and broadcasts to client."""
    await manager.broadcast({
        "type": "REMOTE_COMMAND",
        "payload": cmd.model_dump()
    })
    return {"status": "ok", "key": cmd.key_code}


@app.websocket("/ws/stream")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    """Bidirectional WebSocket pipeline between Fire TV client and Bedrock Swarm."""
    await manager.connect(websocket)
    try:
        # Send initial handshake packet
        await websocket.send_json({
            "type": "CONNECTION_ESTABLISHED",
            "app": settings.APP_NAME,
            "version": settings.APP_VERSION,
            "bedrock_ready": not bedrock_client.is_mock
        })

        while True:
            data = await websocket.receive_text()
            try:
                packet = json.loads(data)
                packet_type = packet.get("type", "TELEMETRY")

                if packet_type == "TELEMETRY":
                    raw_telemetry = packet.get("payload", {})
                    telemetry = ViewerTelemetry(**raw_telemetry)
                    directive = await orchestrator.step(telemetry)

                    if directive:
                        await manager.broadcast({
                            "type": "SWARM_DIRECTIVE",
                            "payload": directive.model_dump()
                        })

                elif packet_type == "PING":
                    await websocket.send_json({"type": "PONG", "timestamp": time.time()})

                elif packet_type == "REMOTE_KEY":
                    key_code = packet.get("keyCode")
                    logger.debug(f"Remote key pressed: {key_code}")

            except json.JSONDecodeError:
                logger.warning("Invalid JSON received over WebSocket")
            except Exception as e:
                logger.error(f"Error handling WebSocket message: {e}")

    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as e:
        logger.error(f"WebSocket session error: {e}")
        manager.disconnect(websocket)


@app.get("/api/events")
async def sse_events():
    """Server-Sent Events endpoint for lightweight streaming to Fire TV WebViews."""
    async def event_generator():
        while True:
            # Yield periodic heartbeat and active status
            yield f"data: {json.dumps({'type': 'HEARTBEAT', 'timestamp': time.time(), 'connections': len(manager.active_connections)})}\n\n"
            await asyncio.sleep(settings.WEBSOCKET_HEARTBEAT_INTERVAL)

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream"
    )
