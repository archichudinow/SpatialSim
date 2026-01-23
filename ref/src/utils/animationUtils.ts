/**
 * Animation Utilities
 * Reusable business logic for working with animation tracks and keyframes
 */
import * as THREE from 'three';

/**
 * Find closest keyframe index to a given time
 * @param times - Array of keyframe times
 * @param targetTime - Target time to find closest keyframe for
 * @returns Index of closest keyframe
 */
export function findClosestKeyframe(times: Float32Array | number[], targetTime: number): number {
  if (!times || times.length === 0) return 0;
  
  let closestIdx = 0;
  let closestDiff = Math.abs(times[0] - targetTime);
  
  for (let i = 1; i < times.length; i++) {
    const diff = Math.abs(times[i] - targetTime);
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  }
  
  return closestIdx;
}

/**
 * Get position at keyframe index
 * @param values - Position values array [x,y,z,x,y,z,...]
 * @param index - Keyframe index
 * @returns Position object {x, y, z}
 */
export function getPositionAtIndex(values: Float32Array | number[], index: number) {
  const offset = index * 3;
  return {
    x: values[offset],
    y: values[offset + 1],
    z: values[offset + 2]
  };
}

/**
 * Get position at specific time (finds closest keyframe)
 * @param track - Animation track with times and values
 * @param time - Target time
 * @returns Position object {x, y, z} or null
 */
export function getPositionAtTime(track: any, time: number) {
  if (!track || !track.times || !track.values) return null;
  
  const index = findClosestKeyframe(track.times, time);
  return getPositionAtIndex(track.values, index);
}

/**
 * Calculate animation duration from position track
 * @param animation - THREE.AnimationClip
 * @returns Duration in seconds
 */
export function calculateAnimationDuration(animation: THREE.AnimationClip): number {
  // Try to get actual duration from position track
  const positionTrack = animation.tracks.find(
    track => track.name.includes('position') && !track.name.includes('quaternion')
  );
  
  if (positionTrack && positionTrack.times && positionTrack.times.length > 0) {
    return positionTrack.times[positionTrack.times.length - 1];
  }
  
  // Fallback to animation clip duration
  return animation.duration;
}

/**
 * Check if time falls within any time window
 * @param time - Time to check
 * @param windows - Array of {start, end} time windows
 * @returns true if time is within any window
 */
export function isTimeInWindows(time: number, windows: Array<{start: number; end: number}>): boolean {
  return windows.some(window => time >= window.start && time <= window.end);
}

/**
 * Filter keyframes that fall within time windows
 * @param times - Array of keyframe times
 * @param values - Array of keyframe values
 * @param windows - Array of {start, end} time windows
 * @returns Filtered keyframes as {time, values} pairs
 */
export function filterKeyframesByTimeWindows(
  times: Float32Array | number[],
  values: Float32Array | number[],
  windows: Array<{start: number; end: number}>,
  valuesPerKeyframe: number = 3
): Array<{time: number; values: number[]}> {
  const filtered: Array<{time: number; values: number[]}> = [];
  
  for (let i = 0; i < times.length; i++) {
    const time = times[i];
    
    if (isTimeInWindows(time, windows)) {
      const offset = i * valuesPerKeyframe;
      const keyframeValues = [];
      for (let j = 0; j < valuesPerKeyframe; j++) {
        keyframeValues.push(values[offset + j]);
      }
      filtered.push({ time, values: keyframeValues });
    }
  }
  
  return filtered;
}
