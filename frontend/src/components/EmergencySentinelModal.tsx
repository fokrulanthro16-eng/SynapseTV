import React, { useEffect, useState, useRef } from 'react';
import { AlertTriangle, ShieldAlert, HeartPulse, PhoneCall, CheckCircle, BellRing, UserCheck, Coffee } from 'lucide-react';
import { SpatialItem } from './SpatialDpadNav';

export interface EmergencyAlertProps {
  alert_id: string;
  event_type: string;
  severity: string;
  timestamp: number;
  location: string;
  auto_dispatch_countdown_sec?: number;
  recipient_channels?: string[];
  vital_estimate?: string;
}

interface EmergencyModalProps {
  alertData: EmergencyAlertProps | null;
  onDismiss: (learnRelax?: boolean) => void;
  onConfirmDispatch: () => void;
}

export const EmergencySentinelModal: React.FC<EmergencyModalProps> = ({
  alertData,
  onDismiss,
  onConfirmDispatch
}) => {
  const [countdown, setCountdown] = useState(30);
  const [isDispatched, setIsDispatched] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);

  // Play a soft recurring emergency chime using Web Audio API
  useEffect(() => {
    if (!alertData) return;
    setCountdown(30);
    setIsDispatched(false);

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        audioCtxRef.current = new AudioCtx();
        const playTone = () => {
          if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') return;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(520, audioCtxRef.current.currentTime);
          osc.frequency.exponentialRampToValueAtTime(880, audioCtxRef.current.currentTime + 0.35);
          gain.gain.setValueAtTime(0.08, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.001, audioCtxRef.current.currentTime + 0.5);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.5);
        };

        playTone();
        const chimeInterval = setInterval(playTone, 3000);
        return () => clearInterval(chimeInterval);
      }
    } catch {
      // Audio autoplay policy fallback
    }

    return () => {
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close().catch(() => {});
      }
    };
  }, [alertData]);

  // Countdown timer
  useEffect(() => {
    if (!alertData || isDispatched) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsDispatched(true);
          onConfirmDispatch();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [alertData, isDispatched, onConfirmDispatch]);

  if (!alertData) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xl flex items-center justify-center p-8 select-none animate-fade-in border-8 border-red-600/80">
      <div className="bg-firetv-card/95 border-2 border-red-500 rounded-3xl p-8 max-w-2xl w-full shadow-[0_0_80px_rgba(239,68,68,0.4)] flex flex-col space-y-5 text-center">
        {/* Animated Emergency Beacon Icon */}
        <div className="flex flex-col items-center">
          <div className="w-18 h-18 rounded-full bg-red-600/20 border-4 border-red-500 flex items-center justify-center mb-2 animate-pulse shadow-glow-ambient">
            <HeartPulse className="w-9 h-9 text-red-500" />
          </div>
          <span className="text-xs font-black uppercase tracking-widest text-red-400 bg-red-950/80 px-4 py-1.5 rounded-full border border-red-800">
            Senior Care &amp; Health Sentinel Active
          </span>
        </div>

        {/* Warning Title */}
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight leading-tight">
            EMERGENCY TELEMETRY: Viewer Fall / Unresponsive State Detected
          </h2>
          <p className="text-xs text-gray-300 mt-1.5 font-medium max-w-lg mx-auto">
            {isDispatched
              ? "Emergency beacon has been dispatched to Amazon One Medical and registered family emergency contacts."
              : "Optical inward sensor detected sudden vertical deceleration followed by zero movement for >30s."}
          </p>
        </div>

        {/* Countdown Box */}
        {!isDispatched ? (
          <div className="bg-red-950/50 border border-red-700/60 rounded-2xl p-3.5 flex items-center justify-center space-x-4">
            <div className="text-3xl font-black font-mono text-red-400 animate-bounce">
              00:{countdown.toString().padStart(2, '0')}
            </div>
            <div className="text-left text-xs text-gray-300 font-semibold leading-relaxed">
              <span>Auto-dispatching alert to <strong className="text-white">Amazon One Medical</strong> &amp; Caregivers via <strong className="text-firetv-amber">AWS SNS/IoT</strong> in {countdown}s.</span>
            </div>
          </div>
        ) : (
          <div className="bg-emerald-950/50 border border-emerald-600 rounded-2xl p-3.5 flex items-center justify-center space-x-3 text-emerald-300">
            <CheckCircle className="w-5 h-5 text-emerald-400" />
            <span className="text-xs font-bold">DISPATCHED: Amazon One Medical Emergency Triage Notified.</span>
          </div>
        )}

        {/* Dispatch Channels Breakdown */}
        <div className="grid grid-cols-3 gap-2 text-left text-xs">
          <div className="bg-firetv-dark/80 p-2.5 rounded-xl border border-gray-800">
            <div className="flex items-center space-x-1.5 text-emerald-400 font-bold mb-0.5">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>One Medical</span>
            </div>
            <span className="text-[10px] text-gray-400">Clinical Triage Desk</span>
          </div>

          <div className="bg-firetv-dark/80 p-2.5 rounded-xl border border-gray-800">
            <div className="flex items-center space-x-1.5 text-firetv-amber font-bold mb-0.5">
              <BellRing className="w-3.5 h-3.5" />
              <span>AWS SNS</span>
            </div>
            <span className="text-[10px] text-gray-400">Family Caregiver SMS</span>
          </div>

          <div className="bg-firetv-dark/80 p-2.5 rounded-xl border border-gray-800">
            <div className="flex items-center space-x-1.5 text-firetv-cyan font-bold mb-0.5">
              <PhoneCall className="w-3.5 h-3.5" />
              <span>AWS IoT Core</span>
            </div>
            <span className="text-[10px] text-gray-400">Living-Room Chime</span>
          </div>
        </div>

        {/* 10-Foot Focusable Action Buttons with False-Positive Guard */}
        <div className="flex flex-col space-y-2 pt-1">
          <div className="flex items-center space-x-3">
            <SpatialItem
              id="btn-emergency-safe"
              right="btn-emergency-relax"
              onSelect={() => onDismiss(false)}
              accent="cyan"
              className="flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-xl"
            >
              <UserCheck className="w-4 h-4 text-black" />
              <span>I'm OK (Dismiss Alert)</span>
            </SpatialItem>

            <SpatialItem
              id="btn-emergency-relax"
              left="btn-emergency-safe"
              right="btn-emergency-dispatch"
              onSelect={() => onDismiss(true)}
              accent="amber"
              className="flex-1 py-3 px-4 bg-firetv-cardBorder hover:bg-gray-700 text-gray-200 border border-firetv-amber/60 font-bold text-xs rounded-xl flex items-center justify-center space-x-2"
            >
              <Coffee className="w-4 h-4 text-firetv-amber" />
              <span>I'm Just Relaxing / Watching</span>
            </SpatialItem>

            <SpatialItem
              id="btn-emergency-dispatch"
              left="btn-emergency-relax"
              onSelect={() => {
                setIsDispatched(true);
                onConfirmDispatch();
              }}
              accent="amber"
              className="py-3 px-4 bg-red-600/30 border border-red-500 hover:bg-red-600 text-red-200 font-bold text-xs rounded-xl flex items-center justify-center space-x-1.5"
            >
              <PhoneCall className="w-3.5 h-3.5 text-red-400" />
              <span>Dispatch Now</span>
            </SpatialItem>
          </div>

          <span className="text-[10px] text-gray-400 italic">
            Selecting "I'm Just Relaxing" learns your posture and suppresses false alarms for the remainder of this stream.
          </span>
        </div>
      </div>
    </div>
  );
};
