import { useEffect, useCallback } from 'react';

export type RemoteDirection = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'SELECT' | 'BACK' | 'PLAY_PAUSE' | 'FAST_FORWARD' | 'REWIND' | 'MENU';

interface RemoteKeyHandlerProps {
  onNavigate?: (direction: RemoteDirection, event: KeyboardEvent) => void;
  onSelect?: () => void;
  onBack?: () => void;
  onPlayPause?: () => void;
  enabled?: boolean;
}

export const FIRE_TV_KEY_CODES = {
  // Fire OS & Android TV KeyCode mappings
  UP: [38, 19],
  DOWN: [40, 20],
  LEFT: [37, 21],
  RIGHT: [39, 22],
  SELECT: [13, 23, 66],
  BACK: [27, 8, 4],
  PLAY_PAUSE: [179, 85],
  FAST_FORWARD: [228, 90],
  REWIND: [227, 89],
  MENU: [82]
};

export function useFireTVRemote({
  onNavigate,
  onSelect,
  onBack,
  onPlayPause,
  enabled = true
}: RemoteKeyHandlerProps) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const { key, keyCode } = event;

    // Check mapping
    if (FIRE_TV_KEY_CODES.UP.includes(keyCode) || key === 'ArrowUp') {
      event.preventDefault();
      onNavigate?.('UP', event);
    } else if (FIRE_TV_KEY_CODES.DOWN.includes(keyCode) || key === 'ArrowDown') {
      event.preventDefault();
      onNavigate?.('DOWN', event);
    } else if (FIRE_TV_KEY_CODES.LEFT.includes(keyCode) || key === 'ArrowLeft') {
      event.preventDefault();
      onNavigate?.('LEFT', event);
    } else if (FIRE_TV_KEY_CODES.RIGHT.includes(keyCode) || key === 'ArrowRight') {
      event.preventDefault();
      onNavigate?.('RIGHT', event);
    } else if (FIRE_TV_KEY_CODES.SELECT.includes(keyCode) || key === 'Enter') {
      event.preventDefault();
      onSelect ? onSelect() : onNavigate?.('SELECT', event);
    } else if (FIRE_TV_KEY_CODES.BACK.includes(keyCode) || key === 'Escape' || key === 'Backspace') {
      event.preventDefault();
      onBack ? onBack() : onNavigate?.('BACK', event);
    } else if (FIRE_TV_KEY_CODES.PLAY_PAUSE.includes(keyCode) || key === 'MediaPlayPause') {
      event.preventDefault();
      onPlayPause ? onPlayPause() : onNavigate?.('PLAY_PAUSE', event);
    } else if (FIRE_TV_KEY_CODES.FAST_FORWARD.includes(keyCode)) {
      event.preventDefault();
      onNavigate?.('FAST_FORWARD', event);
    } else if (FIRE_TV_KEY_CODES.REWIND.includes(keyCode)) {
      event.preventDefault();
      onNavigate?.('REWIND', event);
    } else if (FIRE_TV_KEY_CODES.MENU.includes(keyCode)) {
      event.preventDefault();
      onNavigate?.('MENU', event);
    }
  }, [enabled, onNavigate, onSelect, onBack, onPlayPause]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
