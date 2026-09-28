import React, { useState, useEffect } from 'react';
import { SpatialFocusProvider, SpatialItem } from '../components/SpatialDpadNav';
import { VideoPlayer } from '../components/VideoPlayer';
import { ContextPanel } from '../components/ContextPanel';
import { AmazonShopCard } from '../components/AmazonShopCard';
import { EmergencySentinelModal } from '../components/EmergencySentinelModal';
import { TelemetryStream } from '../components/TelemetryStream';
import { LiveCameraHUD } from '../components/LiveCameraHUD';
import { useSwarmSocket } from '../hooks/useSwarmSocket';
import { Sparkles, Bookmark, Tv, ShieldCheck, ChevronRight, Info, Layers, Cpu, CheckCircle, Eye, EyeOff, Maximize, Minimize } from 'lucide-react';

export default function SynapseTVDashboard() {
  const [currentTime, setCurrentTime] = useState(65);
  const [cartToast, setCartToast] = useState<string | null>(null);
  const [distractionFreeMode, setDistractionFreeMode] = useState(false);

  const {
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
  } = useSwarmSocket(currentTime);

  const handleTogglePlay = () => setIsPaused(!isPaused);
  const handleToggleMute = () => setIsMuted(!isMuted);
  const handleSeek = (delta: number) => {
    setCurrentTime((prev) => Math.max(0, prev + delta));
  };

  // Keyboard shortcut 'D' to toggle distraction-free mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'd' || e.key === 'D') {
        setDistractionFreeMode((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleAddToCart = (asin: string) => {
    setCartToast(`Item added to your Prime Cart (${asin})! Proceed on Fire TV or Mobile.`);
    setTimeout(() => setCartToast(null), 4000);
  };

  return (
    <SpatialFocusProvider defaultFocusId="btn-play-pause">
      <main className="relative w-screen h-screen bg-firetv-dark text-white overflow-hidden flex flex-row">
        {/* Main TV Video Canvas */}
        <section className="relative flex-1 h-full overflow-hidden transition-all duration-300">
          <VideoPlayer
            isPaused={isPaused}
            isMuted={isMuted}
            zoomLevel={zoomLevel}
            latestDirective={latestDirective}
            onTogglePlay={handleTogglePlay}
            onToggleMute={handleToggleMute}
            onSeek={handleSeek}
            onTimeUpdate={(t) => {
              setCurrentTime(t);
              updateTelemetry({ current_playback_time: t });
            }}
          />

          {/* Distraction-Free Immersion Floating Control Pill */}
          <div className="absolute top-6 right-8 z-25 flex items-center space-x-2.5">
            <SpatialItem
              id="btn-distraction-free"
              onSelect={() => setDistractionFreeMode(!distractionFreeMode)}
              accent="cyan"
              className="bg-firetv-card/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-firetv-cardBorder text-xs font-bold text-gray-200 flex items-center space-x-1.5 shadow-lg"
            >
              {distractionFreeMode ? <Minimize className="w-4 h-4 text-firetv-cyan" /> : <Maximize className="w-4 h-4 text-firetv-amber" />}
              <span>{distractionFreeMode ? "Restore TV HUD (D)" : "Distraction-Free Mode (D)"}</span>
            </SpatialItem>
          </div>

          {/* Amazon Retail & Contextual Ad-Tech Overlay Card */}
          <AmazonShopCard
            product={activeProduct}
            onDismiss={dismissProductSpotlight}
            onAddToCart={handleAddToCart}
          />

          {/* Senior Care & Emergency Sentinel Modal (One Medical) */}
          <EmergencySentinelModal
            alertData={emergencyAlert}
            onDismiss={(learnRelax) => dismissEmergencyAlert(learnRelax)}
            onConfirmDispatch={() => {
              console.log("[SynapseTV] Emergency dispatch confirmed by user.");
            }}
          />

          {/* Cognitive Micro-Explainer Popover */}
          <ContextPanel
            explainer={activeExplainer}
            onDismiss={dismissExplainer}
            onDeepDive={() => {
              alert(`Deep Dive on: ${activeExplainer?.title}`);
            }}
          />

          {/* Cart Notification Toast */}
          {cartToast && (
            <div className="absolute top-24 left-10 z-45 animate-bounce">
              <div className="bg-emerald-500 text-black font-extrabold px-5 py-2.5 rounded-full shadow-2xl flex items-center space-x-2 text-sm border-2 border-white/60">
                <CheckCircle className="w-5 h-5 text-black" />
                <span>{cartToast}</span>
              </div>
            </div>
          )}
        </section>

        {/* Right Cognitive Co-Viewer & Enterprise HUD Sidebar (Collapsible in Distraction-Free Mode) */}
        {!distractionFreeMode && (
          <aside className="w-[430px] h-full bg-firetv-dark/95 border-l border-firetv-cardBorder flex flex-col p-6 space-y-4 overflow-y-auto z-30 shadow-2xl animate-slide-in-right">
            {/* Header & Branding */}
            <div className="flex items-center justify-between border-b border-gray-800 pb-3">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-firetv-amber to-amber-600 flex items-center justify-center shadow-lg">
                  <Tv className="w-5 h-5 text-black" />
                </div>
                <div>
                  <h1 className="text-lg font-black tracking-tight text-white flex items-center space-x-1.5">
                    <span>SynapseTV</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-firetv-amber/20 text-firetv-amber font-mono">v2.1</span>
                  </h1>
                  <p className="text-[11px] text-gray-400 font-medium">AWS Bedrock Enterprise Co-Viewer</p>
                </div>
              </div>

              <div className="flex items-center space-x-1 bg-firetv-cyan/15 px-2.5 py-1 rounded-lg border border-firetv-cyan/30 text-firetv-cyan text-xs font-bold">
                <Cpu className="w-3.5 h-3.5" />
                <span>Multi-Agent Swarm</span>
              </div>
            </div>

            {/* Inward Live Camera & Edge Guardrails HUD */}
            <LiveCameraHUD
              telemetry={telemetry}
              onSimulate={(gaze, gesture, confusion, attention, posture) => {
                triggerSimulation(gaze, gesture, confusion, attention, posture);
              }}
              onSpotlightProduct={() => triggerProductSpotlight('ball')}
              onSimulateFall={triggerEmergencyAlert}
              privacyKillSwitch={privacyKillSwitch}
              onTogglePrivacy={togglePrivacyKillSwitch}
              edgePowerMode={edgePowerMode}
              onSetPowerMode={setEdgePowerMode}
              livingRoomPolicy={livingRoomPolicy}
              onToggleLivingRoomPolicy={toggleLivingRoomPolicy}
            />

            {/* Real-time Telemetry & B2B Digital Signage Metrics */}
            <TelemetryStream
              telemetry={telemetry}
              isConnected={isConnected}
            />

            {/* Smart Bookmarks Captured by Autonomous Sleep/Disengagement */}
            <div className="bg-firetv-card/90 border border-firetv-cardBorder rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between mb-3 border-b border-gray-800 pb-2">
                <div className="flex items-center space-x-2">
                  <Bookmark className="w-4 h-4 text-firetv-amber" />
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-200">
                    Smart Catch-Up Bookmarks
                  </span>
                </div>
                <span className="text-[10px] font-mono text-gray-400">
                  {bookmarks.length} saved
                </span>
              </div>

              {bookmarks.length === 0 ? (
                <p className="text-xs text-gray-500 italic py-1.5 text-center">
                  No interruptions yet. Fall asleep, drop gaze, or raise thumb to test!
                </p>
              ) : (
                <div className="space-y-2">
                  {bookmarks.map((bm, idx) => (
                    <SpatialItem
                      key={idx}
                      id={`bookmark-item-${idx}`}
                      onSelect={() => alert(`Jump to bookmark: ${bm.time}`)}
                      className="p-2.5 bg-firetv-dark/60 rounded-xl border border-gray-800 flex items-center justify-between text-xs hover:border-firetv-amber/60"
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-mono font-bold text-firetv-amber bg-firetv-amber/10 px-2 py-0.5 rounded">
                          {bm.time}
                        </span>
                        <span className="text-gray-300 truncate max-w-[200px]">
                          {bm.reason || 'Auto-Pause Bookmark'}
                        </span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-500" />
                    </SpatialItem>
                  ))}
                </div>
              )}
            </div>

            {/* Remote D-Pad Navigation Legend */}
            <div className="bg-firetv-dark/40 border border-gray-800/80 rounded-xl p-3 text-[11px] text-gray-400">
              <div className="font-bold text-gray-300 mb-1.5 flex items-center space-x-1.5">
                <span>🎮 10-Foot Remote Control Keys:</span>
              </div>
              <div className="grid grid-cols-2 gap-y-1 font-mono text-[10px]">
                <div><span className="text-firetv-amber">▲ ▼ ◄ ►</span> : Spatial Navigate</div>
                <div><span className="text-firetv-amber">ENTER</span> : Select Focus</div>
                <div><span className="text-firetv-cyan">ESC / BACK</span> : Dismiss Modal</div>
                <div><span className="text-firetv-cyan">D</span> : Clean HUD Toggle</div>
              </div>
            </div>
          </aside>
        )}
      </main>
    </SpatialFocusProvider>
  );
}
