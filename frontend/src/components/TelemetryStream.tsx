import React from 'react';
import { Eye, EyeOff, AlertCircle, Hand, Sparkles, Activity, Wifi, Check, Zap, Server, BarChart3, Clock, Cpu } from 'lucide-react';
import { ViewerTelemetry } from '../hooks/useSwarmSocket';

interface TelemetryStreamProps {
  telemetry: ViewerTelemetry;
  isConnected: boolean;
  className?: string;
}

export const TelemetryStream: React.FC<TelemetryStreamProps> = ({
  telemetry,
  isConnected,
  className = ''
}) => {
  const getGazeColor = (gaze: string) => {
    switch (gaze) {
      case 'attentive':
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'distracted':
        return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'sleeping':
        return 'text-red-400 bg-red-500/10 border-red-500/30 animate-pulse';
      case 'fallen_unresponsive':
        return 'text-red-500 bg-red-600/20 border-red-600 animate-bounce font-black';
      case 'away':
        return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
      default:
        return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    }
  };

  const getGestureLabel = (gesture: string) => {
    switch (gesture) {
      case 'palm_pause':
        return 'Open Palm (Pause/Play)';
      case 'palm_mute':
        return 'Palm Sign (Mute)';
      case 'swipe_forward':
        return 'Swipe Right (+30s)';
      case 'swipe_rewind':
        return 'Swipe Left (-15s)';
      case 'pinch_zoom':
        return 'Two-Finger Pinch (Zoom)';
      case 'thumbs_up_bookmark':
        return 'Thumbs Up (Smart Bookmark)';
      default:
        return 'Idle (Scanning)';
    }
  };

  return (
    <div className={`bg-firetv-card/90 backdrop-blur-md border border-firetv-cardBorder rounded-2xl p-4 shadow-xl flex flex-col space-y-3.5 ${className}`}>
      {/* Title & Connection Header */}
      <div className="flex items-center justify-between border-b border-gray-800 pb-2.5">
        <div className="flex items-center space-x-2">
          <Activity className="w-4 h-4 text-firetv-cyan animate-pulse" />
          <span className="text-xs font-bold tracking-wider uppercase text-gray-200">
            Inward Perception Stream
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-red-400'}`} />
          <span className="text-[11px] font-mono text-gray-400">
            {isConnected ? 'Swarm Synced' : 'Reconnecting'}
          </span>
        </div>
      </div>

      {/* Gaze & Gesture Indicators */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="bg-firetv-dark/60 p-2.5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Viewer Gaze</span>
          <div className="flex items-center space-x-1.5 mt-1 truncate">
            {telemetry.gaze_status === 'attentive' ? (
              <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            ) : (
              <EyeOff className="w-3.5 h-3.5 text-red-400 shrink-0" />
            )}
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border truncate capitalize ${getGazeColor(telemetry.gaze_status)}`}>
              {telemetry.gaze_status.replace('_', ' ')}
            </span>
          </div>
        </div>

        <div className="bg-firetv-dark/60 p-2.5 rounded-xl border border-gray-800 flex flex-col justify-between">
          <span className="text-[10px] uppercase font-bold text-gray-400 tracking-wider">Active Gesture</span>
          <div className="flex items-center space-x-1.5 mt-1 truncate">
            <Hand className={`w-3.5 h-3.5 shrink-0 ${telemetry.detected_gesture !== 'none' ? 'text-firetv-amber animate-bounce' : 'text-gray-500'}`} />
            <span className={`text-[11px] font-semibold truncate ${telemetry.detected_gesture !== 'none' ? 'text-firetv-amber font-bold' : 'text-gray-400'}`}>
              {getGestureLabel(telemetry.detected_gesture)}
            </span>
          </div>
        </div>
      </div>

      {/* Engagement & Confusion Bars */}
      <div className="space-y-2">
        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-300 mb-1">
            <span>Engagement Index</span>
            <span className="font-mono text-emerald-400">{Math.round(telemetry.attention_score * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-emerald-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${telemetry.attention_score * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between text-[11px] font-semibold text-gray-300 mb-1">
            <span>Cognitive Confusion</span>
            <span className="font-mono text-firetv-amber">{Math.round(telemetry.confusion_score * 100)}%</span>
          </div>
          <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300 ${telemetry.confusion_score > 0.6 ? 'bg-firetv-amber animate-pulse' : 'bg-blue-400'}`}
              style={{ width: `${telemetry.confusion_score * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Enterprise B2B Digital Signage & Ad-Tech Telemetry */}
      <div className="pt-2 border-t border-gray-800/80">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-firetv-cyan flex items-center space-x-1">
            <BarChart3 className="w-3 h-3" />
            <span>Prime Video &amp; B2B Signage Metrics</span>
          </span>
          <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
            LIVE METRICS
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1.5 text-center font-mono">
          <div className="bg-firetv-dark/80 p-1.5 rounded-lg border border-gray-800">
            <span className="text-[9px] text-gray-400 block font-sans">Frame Ingest</span>
            <span className="text-xs font-bold text-white">59.8 FPS</span>
          </div>

          <div className="bg-firetv-dark/80 p-1.5 rounded-lg border border-gray-800">
            <span className="text-[9px] text-gray-400 block font-sans">Bedrock Load</span>
            <span className="text-xs font-bold text-firetv-amber">38.5%</span>
          </div>

          <div className="bg-firetv-dark/80 p-1.5 rounded-lg border border-gray-800">
            <span className="text-[9px] text-gray-400 block font-sans">Gaze Retention</span>
            <span className="text-xs font-bold text-emerald-400">94.2%</span>
          </div>
        </div>
      </div>
    </div>
  );
};
