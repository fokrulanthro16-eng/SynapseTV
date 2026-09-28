import React, { useRef, useState, useEffect } from 'react';
import {
  Camera, Video, Sparkles, User, RefreshCw, Hand, EyeOff, HelpCircle,
  FastForward, ShoppingBag, HeartPulse, ShieldCheck, ShieldOff, Gauge, Users, Sliders
} from 'lucide-react';
import { SpatialItem } from './SpatialDpadNav';
import { ViewerTelemetry } from '../hooks/useSwarmSocket';

interface LiveCameraHUDProps {
  telemetry: ViewerTelemetry;
  onSimulate: (gaze: string, gesture?: string, confusion?: number, attention?: number, posture?: string) => void;
  onSpotlightProduct?: () => void;
  onSimulateFall?: () => void;
  privacyKillSwitch: boolean;
  onTogglePrivacy: () => void;
  edgePowerMode: 'eco' | 'balanced' | 'turbo';
  onSetPowerMode: (mode: 'eco' | 'balanced' | 'turbo') => void;
  livingRoomPolicy: 'single_viewer' | 'family_mode';
  onToggleLivingRoomPolicy: () => void;
  className?: string;
}

export const LiveCameraHUD: React.FC<LiveCameraHUDProps> = ({
  telemetry,
  onSimulate,
  onSpotlightProduct,
  onSimulateFall,
  privacyKillSwitch,
  onTogglePrivacy,
  edgePowerMode,
  onSetPowerMode,
  livingRoomPolicy,
  onToggleLivingRoomPolicy,
  className = ''
}) => {
  const [useWebcam, setUseWebcam] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Attempt real webcam if toggled (disabled if privacy kill-switch is active)
  useEffect(() => {
    let stream: MediaStream | null = null;
    if (useWebcam && !privacyKillSwitch) {
      navigator.mediaDevices?.getUserMedia({ video: { width: 320, height: 240 } })
        .then((s) => {
          stream = s;
          if (videoRef.current) videoRef.current.srcObject = s;
        })
        .catch(() => {
          setUseWebcam(false);
        });
    } else {
      if (videoRef.current && videoRef.current.srcObject) {
        const s = videoRef.current.srcObject as MediaStream;
        s.getTracks().forEach((t) => t.stop());
        videoRef.current.srcObject = null;
      }
    }
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [useWebcam, privacyKillSwitch]);

  // Synthetic face & gaze animation on canvas with adaptive frame throttle
  useEffect(() => {
    if (useWebcam || privacyKillSwitch) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let angle = 0;
    let lastRenderTime = 0;

    // Target FPS based on edge power mode
    const targetFps = edgePowerMode === 'eco' ? 2 : (edgePowerMode === 'balanced' ? 15 : 60);
    const frameInterval = 1000 / targetFps;

    const render = (currentTime: number) => {
      animId = requestAnimationFrame(render);

      if (currentTime - lastRenderTime < frameInterval) {
        return;
      }
      lastRenderTime = currentTime;

      angle += 0.08;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Background ambient scanner
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid overlay
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 20) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 20) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;

      // Handle Fall / Unresponsive Visualizer
      if (telemetry.gaze_status === 'fallen_unresponsive') {
        ctx.strokeStyle = '#EF4444';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + 30, 48, 22, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = '#EF4444';
        ctx.font = 'bold 10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('FALL IMPACT DETECTED', centerX, centerY - 10);
        return;
      }

      // Normal face silhouette oval
      ctx.strokeStyle = telemetry.gaze_status === 'sleeping' ? '#EF4444' : (telemetry.gaze_status === 'attentive' ? '#10B981' : '#F59E0B');
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(centerX, centerY - 5, 42, 54, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Eye Landmarks
      const eyeOffset = 18;
      const eyeY = centerY - 14;

      if (telemetry.gaze_status === 'sleeping') {
        ctx.beginPath();
        ctx.moveTo(centerX - eyeOffset - 10, eyeY);
        ctx.lineTo(centerX - eyeOffset + 10, eyeY);
        ctx.moveTo(centerX + eyeOffset - 10, eyeY);
        ctx.lineTo(centerX + eyeOffset + 10, eyeY);
        ctx.stroke();
      } else {
        const gazeShiftX = telemetry.gaze_status === 'distracted' ? 12 : Math.sin(angle) * 2;
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset, eyeY, 6, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffset, eyeY, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#0284C7';
        ctx.beginPath();
        ctx.arc(centerX - eyeOffset + gazeShiftX, eyeY, 3, 0, Math.PI * 2);
        ctx.arc(centerX + eyeOffset + gazeShiftX, eyeY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Gesture indicator box if active
      if (telemetry.detected_gesture !== 'none') {
        ctx.fillStyle = 'rgba(255, 153, 0, 0.25)';
        ctx.strokeStyle = '#FF9900';
        ctx.lineWidth = 2;
        ctx.fillRect(centerX - 35, centerY + 24, 70, 24);
        ctx.strokeRect(centerX - 35, centerY + 24, 70, 24);

        ctx.fillStyle = '#FF9900';
        ctx.font = 'bold 9px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(telemetry.detected_gesture.toUpperCase(), centerX, centerY + 39);
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [useWebcam, telemetry, privacyKillSwitch, edgePowerMode]);

  return (
    <div className={`bg-firetv-card/90 backdrop-blur-md border border-firetv-cardBorder rounded-2xl p-4 shadow-xl flex flex-col space-y-3 ${className}`}>
      {/* Privacy Guard Indicator & Hardware Kill-Switch */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <div className="flex items-center space-x-1.5">
          {privacyKillSwitch ? (
            <ShieldOff className="w-4 h-4 text-red-400" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          )}
          <span className="text-xs font-bold tracking-wider uppercase text-gray-200">
            Privacy Guard: Local Edge Only
          </span>
        </div>

        <button
          onClick={onTogglePrivacy}
          className={`text-[10px] px-2.5 py-1 rounded-md font-bold transition flex items-center space-x-1 ${
            privacyKillSwitch
              ? 'bg-red-900/60 text-red-300 border border-red-500'
              : 'bg-firetv-cardBorder text-gray-300 hover:bg-gray-700'
          }`}
        >
          <span>{privacyKillSwitch ? 'Camera Killed' : 'Kill-Switch'}</span>
        </button>
      </div>

      {/* Explicit On-Device Privacy Guarantee Banner */}
      <div className="bg-emerald-950/40 border border-emerald-800/40 px-2.5 py-1.5 rounded-lg text-[10px] text-emerald-300 flex items-center justify-between">
        <span className="truncate">Zero video frames uploaded to cloud; 100% on-device inference.</span>
        <span className="font-mono text-[9px] uppercase font-bold text-emerald-400 shrink-0 ml-1">On-Device</span>
      </div>

      {/* Video / Canvas Viewport or Privacy Disabled Screen */}
      <div className="relative w-full h-36 bg-black rounded-xl overflow-hidden border border-gray-800 flex items-center justify-center">
        {privacyKillSwitch ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <ShieldOff className="w-8 h-8 text-red-500 mb-1.5 animate-pulse" />
            <span className="text-xs font-bold text-red-400 uppercase tracking-wide">
              Camera Sensor Disabled
            </span>
            <span className="text-[10px] text-gray-400 mt-1">
              Operating in Blind D-Pad Remote Mode
            </span>
          </div>
        ) : useWebcam ? (
          <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform -scale-x-100" />
        ) : (
          <canvas ref={canvasRef} width={260} height={144} className="w-full h-full" />
        )}

        {!privacyKillSwitch && (
          <div className="absolute bottom-2 left-2 bg-black/75 px-2 py-0.5 rounded text-[10px] font-mono text-emerald-400">
            {edgePowerMode === 'eco' ? '2 FPS (Eco Mode)' : (edgePowerMode === 'balanced' ? '15 FPS (Balanced)' : '60 FPS (Turbo)')}
          </div>
        )}
      </div>

      {/* Adaptive Compute & Multi-Viewer Policy Controls */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Adaptive Compute / Thermal Throttle */}
        <div className="bg-firetv-dark/60 p-2 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center space-x-1 text-[10px] text-gray-400 uppercase font-bold mb-1">
            <Gauge className="w-3 h-3 text-firetv-cyan" />
            <span>Compute Mode</span>
          </div>
          <div className="flex items-center space-x-1 font-mono text-[10px]">
            <button
              onClick={() => onSetPowerMode('eco')}
              className={`flex-1 py-0.5 rounded font-bold ${edgePowerMode === 'eco' ? 'bg-firetv-cyan text-black' : 'text-gray-400 bg-gray-800'}`}
            >
              Eco (2F)
            </button>
            <button
              onClick={() => onSetPowerMode('balanced')}
              className={`flex-1 py-0.5 rounded font-bold ${edgePowerMode === 'balanced' ? 'bg-firetv-cyan text-black' : 'text-gray-400 bg-gray-800'}`}
            >
              15F
            </button>
            <button
              onClick={() => onSetPowerMode('turbo')}
              className={`flex-1 py-0.5 rounded font-bold ${edgePowerMode === 'turbo' ? 'bg-firetv-cyan text-black' : 'text-gray-400 bg-gray-800'}`}
            >
              60F
            </button>
          </div>
        </div>

        {/* Multi-Viewer Living Room Policy */}
        <div className="bg-firetv-dark/60 p-2 rounded-xl border border-gray-800 flex flex-col justify-between">
          <div className="flex items-center justify-between text-[10px] text-gray-400 uppercase font-bold mb-1">
            <div className="flex items-center space-x-1">
              <Users className="w-3 h-3 text-firetv-amber" />
              <span>Living Room</span>
            </div>
          </div>
          <button
            onClick={onToggleLivingRoomPolicy}
            className={`w-full py-1 rounded text-[10px] font-bold transition ${
              livingRoomPolicy === 'family_mode'
                ? 'bg-firetv-amber/20 border border-firetv-amber text-firetv-amber'
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            {livingRoomPolicy === 'family_mode' ? 'Family Mode (Majority)' : 'Single Viewer'}
          </button>
        </div>
      </div>

      {/* Judge & Developer Quick Simulation Suite */}
      <div>
        <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400 block mb-1.5">
          Judge Live Trigger Suite:
        </span>
        <div className="grid grid-cols-2 gap-1.5">
          <SpatialItem
            id="btn-sim-spotlight"
            onSelect={() => onSpotlightProduct?.()}
            accent="amber"
            className="p-1.5 bg-amber-500/20 border border-firetv-amber rounded-lg text-left flex items-center space-x-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30 shadow-md"
          >
            <ShoppingBag className="w-3.5 h-3.5 text-firetv-amber shrink-0" />
            <span className="truncate">Spotlight Product</span>
          </SpatialItem>

          <SpatialItem
            id="btn-sim-fall"
            onSelect={() => onSimulateFall ? onSimulateFall() : onSimulate('fallen_unresponsive', 'none', 0.0, 0.0, 'fallen_floor')}
            accent="amber"
            className="p-1.5 bg-red-900/40 border border-red-600 rounded-lg text-left flex items-center space-x-1.5 text-xs font-black text-red-300 hover:bg-red-800/50 shadow-md"
          >
            <HeartPulse className="w-3.5 h-3.5 text-red-400 shrink-0 animate-pulse" />
            <span className="truncate">Simulate Fall</span>
          </SpatialItem>

          <SpatialItem
            id="btn-sim-sleep"
            onSelect={() => onSimulate('sleeping', 'none', 0.1, 0.05)}
            className="p-1.5 bg-red-950/40 border border-red-800/60 rounded-lg text-left flex items-center space-x-1.5 text-xs font-bold text-red-300 hover:bg-red-900/50"
          >
            <EyeOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
            <span className="truncate">Sleep (Pause)</span>
          </SpatialItem>

          <SpatialItem
            id="btn-sim-confuse"
            onSelect={() => onSimulate('attentive', 'none', 0.85, 0.90)}
            className="p-1.5 bg-firetv-amber/15 border border-firetv-amber/40 rounded-lg text-left flex items-center space-x-1.5 text-xs font-bold text-amber-300 hover:bg-firetv-amber/25"
          >
            <HelpCircle className="w-3.5 h-3.5 text-firetv-amber shrink-0" />
            <span className="truncate">Confused (Explain)</span>
          </SpatialItem>

          <SpatialItem
            id="btn-sim-palm"
            onSelect={() => onSimulate('attentive', 'palm_pause', 0.1, 0.95)}
            className="p-1.5 bg-firetv-cyan/15 border border-firetv-cyan/40 rounded-lg text-left flex items-center space-x-1.5 text-xs font-bold text-firetv-cyan hover:bg-firetv-cyan/25"
          >
            <Hand className="w-3.5 h-3.5 text-firetv-cyan shrink-0" />
            <span className="truncate">Palm (Zero-Touch)</span>
          </SpatialItem>

          <SpatialItem
            id="btn-sim-reset"
            onSelect={() => onSimulate('attentive', 'none', 0.08, 0.95, 'seated')}
            className="p-1.5 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-left flex items-center space-x-1.5 text-xs font-bold text-emerald-300 hover:bg-emerald-900/50"
          >
            <RefreshCw className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Reset / Attentive</span>
          </SpatialItem>
        </div>
      </div>
    </div>
  );
};
