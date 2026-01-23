import { useFrame } from '@react-three/fiber';
import { useAppState } from '../../AppState';
import { useRef } from 'react';

/**
 * PlaybackEngine Component
 * Manages time progression during playback
 * Updates time state based on playback speed and delta time
 * Supports time clamping and looping
 * 
 * @returns {null} This component doesn't render anything
 */
export default function PlaybackEngine() {
  const hasReachedEnd = useRef(false);
  
  useFrame((_, delta) => {
    const store = useAppState.getState();
    const { playback, actions } = store;
    const { isPlaying, time = 0, speed = 1.0, maxTime = 0, clampStartTime = 0, clampEndTime = null, loop = false } = playback;

    // Calculate effective end time (use clampEndTime if set, otherwise maxTime)
    const effectiveEndTime = clampEndTime !== null ? clampEndTime : maxTime;
    
    // Reset flag if we're below effectiveEndTime (user seeked or reset)
    if (time < effectiveEndTime - 1.0) {
      hasReachedEnd.current = false;
    }

    // Don't advance time if not playing OR if we've reached the end (and not looping)
    if (!isPlaying) {
      return;
    }
    
    if (hasReachedEnd.current && !loop) {
      // Extra safety: if somehow playing resumed after reaching end, force pause
      actions.playback.pause();
      return;
    }

    // Advance time using delta time (seconds) multiplied by speed
    const nextTime = time + speed * delta;
    
    // Stop playback 100 frames (at 60fps = ~1.67 seconds) before effectiveEndTime
    const stopThreshold = effectiveEndTime - 1.67;
    if (nextTime >= stopThreshold && effectiveEndTime > 0) {
      if (loop) {
        // Loop back to clampStartTime
        actions.playback.setTime(clampStartTime);
        hasReachedEnd.current = false;
      } else {
        // Stop at end
        actions.playback.setTime(effectiveEndTime);
        actions.playback.pause();
        hasReachedEnd.current = true;
      }
    } else {
      actions.playback.setTime(nextTime);
    }
  });

  return null;
}
