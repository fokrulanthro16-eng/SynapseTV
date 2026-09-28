import { useState, useEffect, useRef, useCallback } from 'react';
import { ProductSpotlightData } from '../components/AmazonShopCard';
import { EmergencyAlertProps } from '../components/EmergencySentinelModal';

export interface ExplainerCard {
  explainer_id: string;
  title: string;
  category: 'Tactical Shift' | 'Plot Clarification' | 'Entity Profile' | 'Trivia' | 'Audio Alert';
  snippet: string;
  bullet_points: string[];
  confidence: number;
  auto_dismiss_sec: number;
  suggested_actions?: string[];
}

export interface SwarmDirective {
  directive_id: string;
  action: 'AUTO_PAUSE' | 'RESUME_PLAYBACK' | 'SMART_BOOKMARK' | 'SHOW_EXPLAINER' | 'HIDE_EXPLAINER' | 'MUTE_TOGGLE' | 'SEEK_RELATIVE' | 'ENHANCE_DIALOGUE' | 'ZOOM_FRAME' | 'PRODUCT_SPOTLIGHT' | 'EMERGENCY_ALERT' | 'NO_ACTION';
  reason: string;
  timestamp: number;
  smart_bookmark?: string | null;
  seek_delta_seconds?: number | null;
  explainer?: ExplainerCard | null;
  product_spotlight?: ProductSpotlightData | null;
  emergency_alert?: EmergencyAlertProps | null;
  consensus_score: number;
  responsible_agent: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface ViewerTelemetry {
  viewer_id: string;
  timestamp: number;
  current_playback_time: number;
  media_title: string;
  gaze_status: 'attentive' | 'distracted' | 'sleeping' | 'away' | 'fallen_unresponsive';
  attention_score: number;
  confusion_score: number;
  detected_gesture: 'none' | 'palm_mute' | 'palm_pause' | 'swipe_forward' | 'swipe_rewind' | 'pinch_zoom' | 'thumbs_up_bookmark' | 'head_nod';
  gesture_confidence: number;
  face_detected: boolean;
  viewer_count: number;
  attentive_viewer_count?: number;
  is_simulated: boolean;
  posture_state?: string;
  privacy_kill_switch?: boolean;
  edge_power_mode?: 'eco' | 'balanced' | 'turbo';
  living_room_policy?: 'single_viewer' | 'family_mode';
  false_positive_suppressed?: boolean;
}

const DEFAULT_WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/stream';
const DEFAULT_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export function useSwarmSocket(initialPlaybackTime = 0) {
  const [isConnected, setIsConnected] = useState(false);
  const [latestDirective, setLatestDirective] = useState<SwarmDirective | null>(null);
  const [activeExplainer, setActiveExplainer] = useState<ExplainerCard | null>(null);
  const [activeProduct, setActiveProduct] = useState<ProductSpotlightData | null>(null);
  const [emergencyAlert, setEmergencyAlert] = useState<EmergencyAlertProps | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [bookmarks, setBookmarks] = useState<Array<{ time: string; reason?: string }>>([]);

  // Production Edge Guardrails & Privacy States
  const [privacyKillSwitch, setPrivacyKillSwitch] = useState(false);
  const [edgePowerMode, setEdgePowerMode] = useState<'eco' | 'balanced' | 'turbo'>('turbo');
  const [livingRoomPolicy, setLivingRoomPolicy] = useState<'single_viewer' | 'family_mode'>('single_viewer');
  const [falsePositiveSuppressed, setFalsePositiveSuppressed] = useState(false);

  const [telemetry, setTelemetry] = useState<ViewerTelemetry>({
    viewer_id: 'viewer_living_room',
    timestamp: Date.now() / 1000,
    current_playback_time: initialPlaybackTime,
    media_title: 'Premier League: Arsenal vs Man City',
    gaze_status: 'attentive',
    attention_score: 0.95,
    confusion_score: 0.08,
    detected_gesture: 'none',
    gesture_confidence: 0,
    face_detected: true,
    viewer_count: 1,
    attentive_viewer_count: 1,
    is_simulated: false,
    posture_state: 'seated',
    privacy_kill_switch: false,
    edge_power_mode: 'turbo',
    living_room_policy: 'single_viewer',
    false_positive_suppressed: false
  });

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const explainerTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Connect to WebSocket
  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(DEFAULT_WS_URL);

      socket.onopen = () => {
        setIsConnected(true);
        console.log('[SynapseTV] Swarm WebSocket connected.');
      };

      socket.onmessage = (event) => {
        try {
          const packet = JSON.parse(event.data);

          if (packet.type === 'SWARM_DIRECTIVE') {
            const directive = packet.payload as SwarmDirective;
            setLatestDirective(directive);

            // Autonomous Adaptation Handlers
            if (directive.action === 'AUTO_PAUSE') {
              // Only pause if privacy kill-switch is not active
              if (!privacyKillSwitch) {
                setIsPaused(true);
                if (directive.smart_bookmark) {
                  setBookmarks((prev) => [
                    { time: directive.smart_bookmark!, reason: directive.reason },
                    ...prev.slice(0, 4)
                  ]);
                }
              }
            } else if (directive.action === 'RESUME_PLAYBACK') {
              setIsPaused(false);
              setEmergencyAlert(null);
            } else if (directive.action === 'MUTE_TOGGLE') {
              if (!privacyKillSwitch) setIsMuted((prev) => !prev);
            } else if (directive.action === 'ZOOM_FRAME') {
              if (!privacyKillSwitch) setZoomLevel((prev) => (prev === 1 ? 1.25 : 1));
            } else if (directive.action === 'SMART_BOOKMARK' && directive.smart_bookmark) {
              setBookmarks((prev) => [
                { time: directive.smart_bookmark!, reason: directive.reason },
                ...prev.slice(0, 4)
              ]);
            } else if (directive.action === 'SHOW_EXPLAINER' && directive.explainer) {
              setActiveExplainer(directive.explainer);
              if (explainerTimerRef.current) clearTimeout(explainerTimerRef.current);
              explainerTimerRef.current = setTimeout(() => {
                setActiveExplainer(null);
              }, (directive.explainer.auto_dismiss_sec || 12) * 1000);
            } else if (directive.action === 'PRODUCT_SPOTLIGHT' && directive.product_spotlight) {
              setActiveProduct(directive.product_spotlight);
            } else if (directive.action === 'EMERGENCY_ALERT' && directive.emergency_alert) {
              if (!falsePositiveSuppressed) {
                setIsPaused(true);
                setEmergencyAlert(directive.emergency_alert);
              }
            }
          }
        } catch (err) {
          console.error('[SynapseTV] Error processing message:', err);
        }
      };

      socket.onclose = () => {
        setIsConnected(false);
        reconnectTimeoutRef.current = setTimeout(connect, 3000);
      };

      socket.onerror = () => {
        setIsConnected(false);
        socket.close();
      };

      wsRef.current = socket;
    } catch {
      setIsConnected(false);
      reconnectTimeoutRef.current = setTimeout(connect, 3000);
    }
  }, [privacyKillSwitch, falsePositiveSuppressed]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (explainerTimerRef.current) clearTimeout(explainerTimerRef.current);
    };
  }, [connect]);

  // Telemetry emitter loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'TELEMETRY',
            payload: {
              ...telemetry,
              timestamp: Date.now() / 1000,
              privacy_kill_switch: privacyKillSwitch,
              edge_power_mode: edgePowerMode,
              living_room_policy: livingRoomPolicy,
              false_positive_suppressed: falsePositiveSuppressed
            }
          })
        );
      }
    }, edgePowerMode === 'eco' ? 2000 : (edgePowerMode === 'balanced' ? 800 : 500));

    return () => clearInterval(interval);
  }, [telemetry, privacyKillSwitch, edgePowerMode, livingRoomPolicy, falsePositiveSuppressed]);

  // Update telemetry helper
  const updateTelemetry = useCallback((partial: Partial<ViewerTelemetry>) => {
    setTelemetry((prev) => ({ ...prev, ...partial }));
  }, []);

  const togglePrivacyKillSwitch = useCallback(() => {
    setPrivacyKillSwitch((prev) => !prev);
  }, []);

  const toggleLivingRoomPolicy = useCallback(() => {
    setLivingRoomPolicy((prev) => {
      const next = prev === 'single_viewer' ? 'family_mode' : 'single_viewer';
      updateTelemetry({
        living_room_policy: next,
        viewer_count: next === 'family_mode' ? 3 : 1,
        attentive_viewer_count: next === 'family_mode' ? 2 : 1
      });
      return next;
    });
  }, [updateTelemetry]);

  const dismissExplainer = useCallback(() => {
    setActiveExplainer(null);
  }, []);

  const dismissProductSpotlight = useCallback(() => {
    setActiveProduct(null);
  }, []);

  const dismissEmergencyAlert = useCallback(async (learnRelax = false) => {
    setEmergencyAlert(null);
    setIsPaused(false);
    if (learnRelax) {
      setFalsePositiveSuppressed(true);
      updateTelemetry({ false_positive_suppressed: true, gaze_status: 'attentive', posture_state: 'seated' });
    }
    try {
      await fetch(`${DEFAULT_API_URL}/api/emergency-dismiss?learn_relax=${learnRelax}`, { method: 'POST' });
    } catch {}
  }, [updateTelemetry]);

  // Quick demo test trigger
  const triggerSimulation = useCallback(async (
    gaze: string,
    gesture = 'none',
    confusion = 0.1,
    attention = 0.95,
    posture = 'seated'
  ) => {
    if (privacyKillSwitch) return;

    updateTelemetry({
      gaze_status: gaze as any,
      detected_gesture: gesture as any,
      confusion_score: confusion,
      attention_score: attention,
      posture_state: posture,
      is_simulated: true,
      gesture_confidence: gesture !== 'none' ? 0.95 : 0
    });

    try {
      await fetch(
        `${DEFAULT_API_URL}/api/simulate-state?gaze=${gaze}&gesture=${gesture}&confusion=${confusion}&attention=${attention}&playback_time=${telemetry.current_playback_time}&posture=${posture}`,
        { method: 'POST' }
      );
    } catch (err) {
      console.warn('Simulation API call fallback:', err);
    }
  }, [telemetry.current_playback_time, updateTelemetry, privacyKillSwitch]);

  const triggerProductSpotlight = useCallback(async (productType = 'ball') => {
    try {
      const res = await fetch(`${DEFAULT_API_URL}/api/spotlight-product?product_type=${productType}`, { method: 'POST' });
      const data = await res.json();
      if (data.product) {
        setActiveProduct(data.product);
      }
    } catch {
      setActiveProduct({
        product_id: 'prod_nike_flight_01',
        asin: 'B0CP91X9MK',
        title: 'Nike Flight Official Premier League Match Ball',
        brand: 'Nike Football',
        price: '$165.00',
        prime_badge: true,
        rating: 4.9,
        review_count: 1840,
        detected_in_frame: 'Official Match Ball (Center Pitch)',
        scene_timestamp: '01:05',
        delivery_promise: 'FREE One-Day Delivery with Prime',
        checkout_url: 'https://www.amazon.com/dp/B0CP91X9MK'
      });
    }
  }, []);

  const triggerEmergencyAlert = useCallback(async () => {
    if (falsePositiveSuppressed) {
      console.log("[SynapseTV] Emergency alert suppressed: Viewer previously indicated 'Just Relaxing'.");
      return;
    }
    setIsPaused(true);
    updateTelemetry({ gaze_status: 'fallen_unresponsive', posture_state: 'fallen_floor' });
    try {
      const res = await fetch(`${DEFAULT_API_URL}/api/emergency-alert`, { method: 'POST' });
      const data = await res.json();
      if (data.emergency) {
        setEmergencyAlert(data.emergency);
      }
    } catch {
      setEmergencyAlert({
        alert_id: 'emer_fallback_01',
        event_type: 'FALL_DETECTED',
        severity: 'CRITICAL',
        timestamp: Date.now() / 1000,
        location: 'Living Room (Fire TV Omni Optical Sensor)',
        auto_dispatch_countdown_sec: 30
      });
    }
  }, [updateTelemetry, falsePositiveSuppressed]);

  return {
    isConnected,
    latestDirective,
    activeExplainer,
    activeProduct,
    emergencyAlert,
    isPaused,
    setIsPaused,
    isMuted,
    setIsMuted,
    zoomLevel,
    setZoomLevel,
    bookmarks,
    telemetry,
    privacyKillSwitch,
    togglePrivacyKillSwitch,
    edgePowerMode,
    setEdgePowerMode,
    livingRoomPolicy,
    toggleLivingRoomPolicy,
    falsePositiveSuppressed,
    updateTelemetry,
    dismissExplainer,
    dismissProductSpotlight,
    dismissEmergencyAlert,
    triggerSimulation,
    triggerProductSpotlight,
    triggerEmergencyAlert
  };
}
