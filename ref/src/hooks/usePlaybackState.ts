/**
 * usePlaybackState Hook
 * Centralized playback state interface for all modules
 * 
 * Provides:
 * - Playback flags (isPlaying, isPaused, isReset)
 * - Time values (currentTime, previousTime, deltaTime)
 * - Derived states (isAtStart, isAtEnd, progress)
 * 
 * Eliminates:
 * - Duplicate reset detection across modules
 * - Manual deltaTime calculations
 * - lastTime ref management
 */

import { useRef, useEffect } from 'react';
import { useAppState } from '../AppState';

export interface PlaybackStateReturn {
  // Flags
  isPlaying: boolean;
  isPaused: boolean;
  isReset: boolean;
  
  // Time
  currentTime: number;
  previousTime: number;
  deltaTime: number;
  maxTime: number;
  speed: number;
  
  // Derived states
  isAtStart: boolean;
  isAtEnd: boolean;
  progress: number;
}

/**
 * Custom hook for centralized playback state
 */
export function usePlaybackState(): PlaybackStateReturn {
  // Subscribe to playback state
  const currentTime = useAppState(s => s.playback.time);
  const isPlaying = useAppState(s => s.playback.isPlaying);
  const isPaused = useAppState(s => s.playback.isPaused);
  const maxTime = useAppState(s => s.playback.maxTime);
  const speed = useAppState(s => s.playback.speed);
  
  // Track previous time for calculations
  const previousTimeRef = useRef(currentTime);
  
  // Detect reset (only non-linear operation in our playback system)
  // Reset occurs when time jumps back to 0 from a positive value
  const isReset = currentTime === 0 && previousTimeRef.current > 0;
  
  // Calculate deltaTime (time since last frame)
  // Capped at 0.5s to prevent huge deltas after pauses or tabs going inactive
  const rawDelta = currentTime - previousTimeRef.current;
  const deltaTime = Math.min(Math.abs(rawDelta), 0.5);
  
  // Store previous time for return value (before updating ref)
  const previousTime = previousTimeRef.current;
  
  // Update ref for next frame
  useEffect(() => {
    previousTimeRef.current = currentTime;
  }, [currentTime]);
  
  // Return complete playback interface
  return {
    // Flags
    isPlaying,
    isPaused,
    isReset,
    
    // Time
    currentTime,
    previousTime,
    deltaTime,
    maxTime,
    speed,
    
    // Derived states
    isAtStart: currentTime === 0,
    isAtEnd: currentTime >= maxTime,
    progress: maxTime > 0 ? currentTime / maxTime : 0
  };
}
