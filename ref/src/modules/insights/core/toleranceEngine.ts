/**
 * Tolerance Engine
 * Handles clamping, filtering, and merging of raw event data
 * Eliminates flickering and noise from continuous detection
 */

/**
 * Default tolerance configuration per state type
 * All durations are in SECONDS (not frames)
 */
export const DEFAULT_TOLERANCE_CONFIG = {
  pause: {
    min_duration: 0.15,      // Minimum 150ms to be considered a pause
    merge_window: 0.10,      // Merge pauses within 100ms of each other
    entry_hysteresis: 0.10,  // Need 100ms consecutive to start pause
    exit_hysteresis: 0.067   // Need 67ms consecutive to end pause
  },
  linger: {
    min_duration: 0.30,      // Lingers are longer behaviors (300ms)
    merge_window: 0.15,
    entry_hysteresis: 0.13,
    exit_hysteresis: 0.10
  },
  rush: {
    min_duration: 0.10,
    merge_window: 0.067,
    entry_hysteresis: 0.067,
    exit_hysteresis: 0.067
  },
  walk: {
    min_duration: 0.10,
    merge_window: 0.067,
    entry_hysteresis: 0.067,
    exit_hysteresis: 0.067
  },
  scan: {
    min_duration: 0.067,     // Quick scanning behavior (67ms)
    merge_window: 0.067,
    entry_hysteresis: 0.067,
    exit_hysteresis: 0.033
  },
  focus: {
    min_duration: 0.15,
    merge_window: 0.10,
    entry_hysteresis: 0.10,
    exit_hysteresis: 0.067
  },
  look_up: {
    min_duration: 0.10,
    merge_window: 0.067,
    entry_hysteresis: 0.067,
    exit_hysteresis: 0.067
  },
  look_down: {
    min_duration: 0.10,
    merge_window: 0.067,
    entry_hysteresis: 0.067,
    exit_hysteresis: 0.067
  },
  attend: {
    min_duration: 0.10,
    merge_window: 0.10,      // Head moves while maintaining gaze
    entry_hysteresis: 0.10,
    exit_hysteresis: 0.067
  },
  occupy: {
    min_duration: 0.067,
    merge_window: 0.067,
    entry_hysteresis: 0.067,
    exit_hysteresis: 0.067
  }
};

/**
 * Tolerance Engine Class
 */
export class ToleranceEngine {
  config: any;

  constructor(config = DEFAULT_TOLERANCE_CONFIG) {
    this.config = config;
  }

  /**
   * Filter events by minimum duration
   * Point events (0 duration) are always keptime, end_time, duration} objects
   * @param {number} minDuration - Minimum duration in seconds
   * @returns {Array} Filtered events
   */
  filterByMinDuration(events: any, minDuration: any) {
    return events.filter((event: any) => {
      const duration = event.duration || (event.end_time - event.start_time);
      // Point events (instant, 0 duration) are always kept
      return duration === 0 || duration >= minDuration;
    });
  }

  /**
   * Merge events that are separated by gaps smaller than merge window
   * @param {Array} events - Array of {start_time, end_time, duration} objects (must be sorted)
   * @param {number} mergeWindow - Maximum gap in seconds to merge
   * @returns {Array} Merged events
   */
  mergeNearbyEvents(events: any, mergeWindow: any) {
    if (events.length === 0) return [];
    
    // Sort by start time
    const sorted = [...events].sort((a, b) => a.start_time - b.start_time);
    const merged = [];
    let current = { ...sorted[0] };
    
    for (let i = 1; i < sorted.length; i++) {
      const gap = sorted[i].start_time - current.end_time;
      
      if (gap <= mergeWindow) {
        // Merge: extend current event to include this one
        current.end_time = Math.max(current.end_time, sorted[i].end_time);
        current.duration = current.end_time - current.start_time;
      } else {
        // Gap too large: save current and start new
        merged.push(current);
        current = { ...sorted[i] };
      }
    }
    
    // Don't forget the last event
    merged.push(current);
    
    return merged;
  }

  /**
   * Apply full tolerance pipeline to raw events
   * @param {string} stateType - Type of state (pause, linger, etc.)
   * @param {Array} rawEvents - Raw events from detection
   * @returns {Array} Cleaned events after tolerance application
   */
  clampAndMerge(stateType: any, rawEvents: any) {
    const tolerance = this.config[stateType] || this.config.pause;
    
    if (!rawEvents || rawEvents.length === 0) {
      return [];
    }
    
    // Step 1: Merge nearby events
    let processed = this.mergeNearbyEvents(rawEvents, tolerance.merge_window);
    
    // Step 2: Filter by minimum duration
    processed = this.filterByMinDuration(processed, tolerance.min_duration);
    
    return processed;
  }

  /**
   * Get tolerance config for a specific state type
   * @param {string} stateType - State type
   * @returns {Object} Tolerance configuration
   */
  getConfig(stateType: any) {
    return this.config[stateType] || this.config.pause;
  }

  /**
   * Update tolerance config for a state type
   * @param {string} stateType - State type
   * @param {Object} newConfig - New tolerance settings
   */
  updateConfig(stateType: any, newConfig: any) {
    this.config[stateType] = { ...this.config[stateType], ...newConfig };
  }
}
