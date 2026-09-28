import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useFireTVRemote, RemoteDirection } from '../hooks/useFireTVRemote';

export interface SpatialNode {
  id: string;
  ref: HTMLElement | null;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  onSelect?: () => void;
  priority?: number;
}

interface SpatialFocusContextType {
  focusedId: string | null;
  setFocusedId: (id: string) => void;
  registerNode: (node: SpatialNode) => void;
  unregisterNode: (id: string) => void;
}

const SpatialFocusContext = createContext<SpatialFocusContextType>({
  focusedId: null,
  setFocusedId: () => {},
  registerNode: () => {},
  unregisterNode: () => {},
});

export const useSpatialFocus = () => useContext(SpatialFocusContext);

export const SpatialFocusProvider: React.FC<{ children: React.ReactNode; defaultFocusId?: string }> = ({
  children,
  defaultFocusId
}) => {
  const [focusedId, setFocusedId] = useState<string | null>(defaultFocusId || null);
  const nodesRef = useRef<Map<string, SpatialNode>>(new Map());

  const registerNode = useCallback((node: SpatialNode) => {
    nodesRef.current.set(node.id, node);
    // If no node is focused yet, auto-focus first registered or default
    setFocusedId((current) => current || node.id);
  }, []);

  const unregisterNode = useCallback((id: string) => {
    nodesRef.current.delete(id);
    setFocusedId((current) => (current === id ? null : current));
  }, []);

  // Geometric spatial navigation fallback if direct links are not configured
  const findGeometricNeighbor = (
    currentId: string,
    direction: 'UP' | 'DOWN' | 'LEFT' | 'RIGHT'
  ): string | null => {
    const current = nodesRef.current.get(currentId);
    if (!current || !current.ref) return null;

    const currentRect = current.ref.getBoundingClientRect();
    const currentCenter = {
      x: currentRect.left + currentRect.width / 2,
      y: currentRect.top + currentRect.height / 2
    };

    let bestCandidate: string | null = null;
    let minDistance = Infinity;

    nodesRef.current.forEach((candidate, id) => {
      if (id === currentId || !candidate.ref) return;

      const candRect = candidate.ref.getBoundingClientRect();
      const candCenter = {
        x: candRect.left + candRect.width / 2,
        y: candRect.top + candRect.height / 2
      };

      const dx = candCenter.x - currentCenter.x;
      const dy = candCenter.y - currentCenter.y;

      let isCandidateInDirection = false;
      let primaryDist = 0;
      let secondaryDist = 0;

      switch (direction) {
        case 'UP':
          isCandidateInDirection = dy < -10;
          primaryDist = -dy;
          secondaryDist = Math.abs(dx);
          break;
        case 'DOWN':
          isCandidateInDirection = dy > 10;
          primaryDist = dy;
          secondaryDist = Math.abs(dx);
          break;
        case 'LEFT':
          isCandidateInDirection = dx < -10;
          primaryDist = -dx;
          secondaryDist = Math.abs(dy);
          break;
        case 'RIGHT':
          isCandidateInDirection = dx > 10;
          primaryDist = dx;
          secondaryDist = Math.abs(dy);
          break;
      }

      if (isCandidateInDirection) {
        // Weighted distance penalizes perpendicular deviation heavily for natural 10-foot feel
        const weightedDist = primaryDist + secondaryDist * 2.2;
        if (weightedDist < minDistance) {
          minDistance = weightedDist;
          bestCandidate = id;
        }
      }
    });

    return bestCandidate;
  };

  const handleRemoteNavigate = useCallback((direction: RemoteDirection) => {
    if (!focusedId) {
      const first = nodesRef.current.keys().next().value;
      if (first) setFocusedId(first);
      return;
    }

    const currentNode = nodesRef.current.get(focusedId);
    if (!currentNode) return;

    if (direction === 'SELECT') {
      currentNode.onSelect?.();
      return;
    }

    let nextTargetId: string | null = null;

    if (direction === 'UP') {
      nextTargetId = currentNode.up || findGeometricNeighbor(focusedId, 'UP');
    } else if (direction === 'DOWN') {
      nextTargetId = currentNode.down || findGeometricNeighbor(focusedId, 'DOWN');
    } else if (direction === 'LEFT') {
      nextTargetId = currentNode.left || findGeometricNeighbor(focusedId, 'LEFT');
    } else if (direction === 'RIGHT') {
      nextTargetId = currentNode.right || findGeometricNeighbor(focusedId, 'RIGHT');
    }

    if (nextTargetId && nodesRef.current.has(nextTargetId)) {
      setFocusedId(nextTargetId);
      const nextNode = nodesRef.current.get(nextTargetId);
      nextNode?.ref?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    }
  }, [focusedId]);

  useFireTVRemote({
    onNavigate: handleRemoteNavigate,
    onSelect: () => {
      if (focusedId) {
        nodesRef.current.get(focusedId)?.onSelect?.();
      }
    }
  });

  return (
    <SpatialFocusContext.Provider
      value={{
        focusedId,
        setFocusedId,
        registerNode,
        unregisterNode
      }}
    >
      {children}
    </SpatialFocusContext.Provider>
  );
};

// Spatial focusable element wrapper
interface SpatialItemProps extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  up?: string;
  down?: string;
  left?: string;
  right?: string;
  onSelect?: () => void;
  accent?: 'amber' | 'cyan';
  className?: string;
  children: React.ReactNode;
}

export const SpatialItem: React.FC<SpatialItemProps> = ({
  id,
  up,
  down,
  left,
  right,
  onSelect,
  accent = 'amber',
  className = '',
  children,
  ...rest
}) => {
  const { focusedId, setFocusedId, registerNode, unregisterNode } = useSpatialFocus();
  const elementRef = useRef<HTMLDivElement>(null);
  const isFocused = focusedId === id;

  useEffect(() => {
    registerNode({
      id,
      ref: elementRef.current,
      up,
      down,
      left,
      right,
      onSelect
    });
    return () => unregisterNode(id);
  }, [id, up, down, left, right, onSelect, registerNode, unregisterNode]);

  const focusClass = isFocused
    ? accent === 'cyan'
      ? 'dpad-focused-cyan'
      : 'dpad-focused'
    : 'border-transparent';

  return (
    <div
      ref={elementRef}
      id={id}
      tabIndex={-1}
      onClick={() => {
        setFocusedId(id);
        onSelect?.();
      }}
      className={`dpad-focusable cursor-pointer outline-none rounded-xl transition-all duration-150 ${focusClass} ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
};
