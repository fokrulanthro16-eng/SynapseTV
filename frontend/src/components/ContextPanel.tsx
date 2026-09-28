import React from 'react';
import { Sparkles, Brain, CheckCircle, ChevronRight, X, Layers } from 'lucide-react';
import { ExplainerCard } from '../hooks/useSwarmSocket';
import { SpatialItem } from './SpatialDpadNav';

interface ContextPanelProps {
  explainer: ExplainerCard | null;
  onDismiss: () => void;
  onDeepDive?: () => void;
}

export const ContextPanel: React.FC<ContextPanelProps> = ({
  explainer,
  onDismiss,
  onDeepDive
}) => {
  if (!explainer) return null;

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Tactical Shift':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'Plot Clarification':
        return 'bg-firetv-amber/20 text-firetv-amber border-firetv-amber/40';
      case 'Entity Profile':
        return 'bg-firetv-cyan/20 text-firetv-cyan border-firetv-cyan/40';
      default:
        return 'bg-purple-500/20 text-purple-400 border-purple-500/40';
    }
  };

  return (
    <div className="absolute top-20 right-8 w-[450px] z-30 animate-slide-in-right">
      <div className="bg-firetv-card/95 backdrop-blur-xl border-2 border-firetv-cyan/50 rounded-2xl p-6 shadow-2xl flex flex-col space-y-4">
        {/* Header with Swarm & Category Badge */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-lg bg-firetv-cyan/20 text-firetv-cyan">
              <Brain className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-firetv-cyan flex items-center space-x-1">
                <span>Bedrock Swarm Consensus</span>
              </span>
              <p className="text-[10px] text-gray-400 font-mono">Confidence: {Math.round(explainer.confidence * 100)}%</p>
            </div>
          </div>

          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${getCategoryColor(explainer.category)}`}>
            {explainer.category}
          </span>
        </div>

        {/* Title & Core Snippet */}
        <div className="border-t border-b border-gray-800 py-3">
          <h3 className="text-xl font-bold text-white tracking-tight mb-2">
            {explainer.title}
          </h3>
          <p className="text-sm text-gray-300 leading-relaxed font-normal">
            {explainer.snippet}
          </p>
        </div>

        {/* Bullet Points */}
        {explainer.bullet_points && explainer.bullet_points.length > 0 && (
          <div className="space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Tactical Breakdown:
            </span>
            <ul className="space-y-1.5">
              {explainer.bullet_points.map((point, idx) => (
                <li key={idx} className="flex items-start space-x-2 text-xs text-gray-200">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-firetv-amber shrink-0" />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 10-foot D-pad Action Buttons */}
        <div className="flex items-center space-x-3 pt-2">
          <SpatialItem
            id="btn-explainer-dismiss"
            right="btn-explainer-more"
            onSelect={onDismiss}
            accent="amber"
            className="flex-1 py-2.5 px-4 bg-firetv-cardBorder/80 border border-gray-700 text-center font-bold text-sm text-gray-200 flex items-center justify-center space-x-1.5"
          >
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>Got it (Back)</span>
          </SpatialItem>

          <SpatialItem
            id="btn-explainer-more"
            left="btn-explainer-dismiss"
            onSelect={() => onDeepDive?.()}
            accent="cyan"
            className="flex-1 py-2.5 px-4 bg-firetv-cyan/20 border border-firetv-cyan text-center font-bold text-sm text-firetv-cyan flex items-center justify-center space-x-1.5"
          >
            <span>Deep Dive</span>
            <ChevronRight className="w-4 h-4" />
          </SpatialItem>
        </div>
      </div>
    </div>
  );
};
