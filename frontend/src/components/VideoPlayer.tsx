import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, Volume2, VolumeX, Bookmark, Sparkles, FastForward, Rewind, EyeOff, Radio, RefreshCw } from 'lucide-react';
import { SpatialItem } from './SpatialDpadNav';
import { SwarmDirective } from '../hooks/useSwarmSocket';

interface VideoPlayerProps {
  isPaused: boolean;
  isMuted: boolean;
  zoomLevel: number;
  latestDirective: SwarmDirective | null;
  onTogglePlay: () => void;
  onToggleMute: () => void;
  onSeek: (seconds: number) => void;
  onTimeUpdate?: (currentTime: number) => void;
}

// Reliable video stream options (local bundle + ultra-reliable CDNs)
const STREAM_SOURCES = [
  { id: 'local', title: 'Local 1080p Stream (Cached)', src: '/videos/sample.mp4' },
  { id: 'oceans', title: 'Oceans 4K HDR (VideoJS CDN)', src: 'https://vjs.zencdn.net/v/oceans.mp4' },
  { id: 'sintel', title: 'Sintel Cinematic (W3C CDN)', src: 'https://media.w3.org/2010/05/sintel/trailer_hd.mp4' },
  { id: 'mdn', title: 'MDN Public Media Stream', src: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' }
];

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  isPaused,
  isMuted,
  zoomLevel,
  latestDirective,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onTimeUpdate
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasFallbackRef = useRef<HTMLCanvasElement | null>(null);
  const [sourceIndex, setSourceIndex] = useState(0);
  const [videoError, setVideoError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(!isPaused);
  const [currentTime, setCurrentTime] = useState(65);
  const [duration, setDuration] = useState(180);
  const [gestureFeedback, setGestureFeedback] = useState<string | null>(null);

  const currentStream = STREAM_SOURCES[sourceIndex];

  // Attempt autoplay with browser-defensive unmuting strategy
  const startPlayback = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    video.muted = isMuted;
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setVideoError(false);
        })
        .catch(() => {
          // If browser blocked autoplay due to audio policy, mute and retry
          video.muted = true;
          video.play()
            .then(() => {
              setIsPlaying(true);
              setVideoError(false);
            })
            .catch(() => {
              setIsPlaying(false);
            });
        });
    }
  }, [isMuted]);

  useEffect(() => {
    startPlayback();
  }, [startPlayback, sourceIndex]);

  // React to pause state changes from Swarm Orchestrator
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (isPaused) {
      video.pause();
      setIsPlaying(false);
    } else {
      startPlayback();
    }
  }, [isPaused, startPlayback]);

  // React to mute state changes
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted]);

  // Handle gesture feedback banner
  useEffect(() => {
    if (latestDirective && latestDirective.reason.includes('Gesture')) {
      setGestureFeedback(latestDirective.reason);
      const timer = setTimeout(() => setGestureFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [latestDirective]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      onTimeUpdate?.(time);
    }
  };

  const handleVideoError = () => {
    console.warn(`[SynapseTV] Video source ${currentStream.src} failed, cycling to next stream.`);
    if (sourceIndex < STREAM_SOURCES.length - 1) {
      setSourceIndex((prev) => prev + 1);
    } else {
      setVideoError(true);
    }
  };

  const cycleStreamSource = () => {
    setSourceIndex((prev) => (prev + 1) % STREAM_SOURCES.length);
    setVideoError(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Canvas animated tactical football pitch fallback if video fails completely
  useEffect(() => {
    if (!videoError) return;
    const canvas = canvasFallbackRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let t = 0;

    const renderPitch = () => {
      t += 0.03;
      ctx.fillStyle = '#064e3b'; // Deep emerald pitch
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Pitch lines
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2;
      ctx.strokeRect(30, 20, canvas.width - 60, canvas.height - 40);
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2, 20);
      ctx.lineTo(canvas.width / 2, canvas.height - 20);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 50, 0, Math.PI * 2);
      ctx.stroke();

      // Moving tactical dots (Home = Red, Away = Blue)
      for (let i = 0; i < 5; i++) {
        const hx = canvas.width / 2 - 120 + Math.sin(t + i) * 30;
        const hy = 80 + i * 45;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(hx, hy, 9, 0, Math.PI * 2);
        ctx.fill();

        const ax = canvas.width / 2 + 120 + Math.cos(t + i) * 30;
        const ay = 80 + i * 45;
        ctx.fillStyle = '#0284c7';
        ctx.beginPath();
        ctx.arc(ax, ay, 9, 0, Math.PI * 2);
        ctx.fill();
      }

      // Ball
      const bx = canvas.width / 2 + Math.sin(t * 1.5) * 80;
      const by = canvas.height / 2 + Math.cos(t * 1.5) * 40;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(bx, by, 6, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(renderPitch);
    };

    renderPitch();
    return () => cancelAnimationFrame(animId);
  }, [videoError]);

  return (
    <div className="relative w-full h-full bg-black overflow-hidden flex items-center justify-center select-none">
      {/* Video Viewport with smooth zoom & hardware acceleration */}
      <div
        className="w-full h-full transition-transform duration-500 flex items-center justify-center transform-gpu"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {!videoError ? (
          <video
            ref={videoRef}
            key={currentStream.src}
            autoPlay
            loop
            playsInline
            muted={isMuted}
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onError={handleVideoError}
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration || 180);
              startPlayback();
            }}
            className="w-full h-full object-cover"
          >
            <source src={currentStream.src} type="video/mp4" />
          </video>
        ) : (
          <canvas
            ref={canvasFallbackRef}
            width={960}
            height={540}
            className="w-full h-full object-cover"
          />
        )}
      </div>

      {/* Ambient Gradient Overlays for 10-foot legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-black/60 pointer-events-none" />

      {/* Top TV Channel & Tactical Match Badges */}
      <div className="absolute top-6 left-8 right-8 flex items-center justify-between z-20">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-firetv-card/90 backdrop-blur-md px-4 py-2 rounded-xl border border-firetv-cardBorder shadow-lg">
            <Radio className="w-5 h-5 text-red-500 animate-pulse" />
            <span className="text-sm font-bold tracking-widest text-white uppercase">LIVE 4K HDR</span>
          </div>

          <div className="bg-firetv-card/90 backdrop-blur-md px-4 py-2 rounded-xl border border-firetv-cardBorder text-xs font-semibold text-gray-300">
            TV-G • {currentStream.title}
          </div>

          <div className="bg-firetv-cyan/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-firetv-cyan/40 text-xs font-bold text-firetv-cyan flex items-center space-x-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Swarm Cognitive Co-Viewer Active</span>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {latestDirective && latestDirective.smart_bookmark && (
            <div className="flex items-center space-x-2 bg-firetv-amber/20 border border-firetv-amber/50 px-3.5 py-1.5 rounded-xl text-firetv-amber font-mono text-xs font-bold animate-pulse">
              <Bookmark className="w-4 h-4" />
              <span>Smart Bookmark: {latestDirective.smart_bookmark}</span>
            </div>
          )}

          <div className="bg-firetv-card/90 px-3.5 py-2 rounded-xl border border-firetv-cardBorder text-xs text-gray-400 font-mono">
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>
      </div>

      {/* Zero-Touch Gesture Banner Feedback */}
      {gestureFeedback && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <div className="bg-gradient-to-r from-firetv-amber to-amber-600 text-black font-extrabold px-6 py-2.5 rounded-full shadow-2xl flex items-center space-x-2.5 text-base border-2 border-white/50">
            <Sparkles className="w-5 h-5 text-black" />
            <span>{gestureFeedback}</span>
          </div>
        </div>
      )}

      {/* Autonomous Sleep / Disengagement Pause Banner */}
      {isPaused && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-md flex flex-col items-center justify-center z-25 p-8 text-center animate-fade-in">
          <div className="w-20 h-20 rounded-full bg-firetv-amber/20 border-2 border-firetv-amber flex items-center justify-center mb-6 shadow-glow-ambient">
            <EyeOff className="w-10 h-10 text-firetv-amber" />
          </div>
          <h2 className="text-3xl font-extrabold text-white mb-2 tracking-tight">
            Autonomous Co-Viewer Paused Playback
          </h2>
          <p className="text-lg text-gray-300 max-w-xl mb-6 font-medium">
            {latestDirective?.reason || "Audience Aligner detected eyes closed or viewer looking away."}
          </p>
          <div className="flex items-center space-x-4 bg-firetv-card px-6 py-3 rounded-2xl border border-firetv-amber/40 shadow-xl">
            <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-sm font-semibold text-gray-200">
              Look back at the screen or press <span className="text-firetv-amber font-bold">SELECT</span> to resume
            </span>
          </div>
        </div>
      )}

      {/* 10-Foot Focusable Bottom Control Deck */}
      <div className="absolute bottom-8 left-10 right-10 z-20 flex flex-col space-y-4">
        {/* Progress scrub bar */}
        <div className="w-full bg-gray-700/60 h-2 rounded-full overflow-hidden backdrop-blur-sm cursor-pointer">
          <div
            className="bg-firetv-amber h-full transition-all duration-200"
            style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
          />
        </div>

        {/* Spatial Focus Control Bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <SpatialItem
              id="btn-play-pause"
              right="btn-rewind"
              onSelect={onTogglePlay}
              className="px-5 py-3 bg-firetv-card/90 border border-firetv-cardBorder flex items-center space-x-2 text-white font-bold"
            >
              {isPaused ? <Play className="w-5 h-5 text-firetv-amber" /> : <Pause className="w-5 h-5 text-firetv-cyan" />}
              <span>{isPaused ? "Play (Enter)" : "Pause (Enter)"}</span>
            </SpatialItem>

            <SpatialItem
              id="btn-rewind"
              left="btn-play-pause"
              right="btn-forward"
              onSelect={() => onSeek(-15)}
              className="px-4 py-3 bg-firetv-card/90 border border-firetv-cardBorder flex items-center space-x-1.5 text-gray-200"
            >
              <Rewind className="w-5 h-5" />
              <span className="text-sm">-15s</span>
            </SpatialItem>

            <SpatialItem
              id="btn-forward"
              left="btn-rewind"
              right="btn-mute"
              onSelect={() => onSeek(30)}
              className="px-4 py-3 bg-firetv-card/90 border border-firetv-cardBorder flex items-center space-x-1.5 text-gray-200"
            >
              <FastForward className="w-5 h-5" />
              <span className="text-sm">+30s</span>
            </SpatialItem>

            <SpatialItem
              id="btn-mute"
              left="btn-forward"
              right="btn-cycle-stream"
              onSelect={onToggleMute}
              className="px-4 py-3 bg-firetv-card/90 border border-firetv-cardBorder flex items-center space-x-2 text-gray-200"
            >
              {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5 text-emerald-400" />}
              <span className="text-sm">{isMuted ? "Unmute" : "Mute"}</span>
            </SpatialItem>

            <SpatialItem
              id="btn-cycle-stream"
              left="btn-mute"
              onSelect={cycleStreamSource}
              className="px-4 py-3 bg-firetv-card/90 border border-firetv-cardBorder flex items-center space-x-2 text-gray-200"
            >
              <RefreshCw className="w-4 h-4 text-firetv-cyan" />
              <span className="text-sm">Switch Stream</span>
            </SpatialItem>
          </div>

          <div className="flex items-center space-x-4 text-xs font-semibold text-gray-400">
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span>Audio Dialogue: Enhanced</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-firetv-cyan"></span>
              <span>Spatial D-Pad: Ready</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
