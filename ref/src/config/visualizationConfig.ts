/**
 * Visualization Configuration
 * Centralized constants for drawing, trails, and visual effects
 */

/**
 * Sampling and timing constants
 */
export const VISUALIZATION_TIMING = {
  // Trail and position sampling
  SAMPLE_INTERVAL: 0.05, // Sample every 50ms (20fps)
  TRAIL_DURATION: 600.0, // Keep 10 minutes of trail data (DrawAgentsTrail)
  INSIGHTS_TRAIL_DURATION: 3600.0, // Keep 60 minutes for insights visualization
  
  // Detection and processing
  DETECTION_INTERVAL: 0.033, // Run detection every 33ms (~30fps)
  HISTORY_DURATION: 2.0, // Keep 2 seconds of history for detectors
  
  // Frame time deltas (for velocity calculations)
  DEFAULT_DELTA_TIME: 0.033, // Default 33ms frame time for calculations
} as const;

/**
 * Point cloud rendering constants
 */
export const POINT_CLOUD_CONFIG = {
  // DrawAgentLookAtPoints
  MAX_POINTS_PER_AGENT: 12000, // 10 minutes at 50ms = 12000 points
  
  // Point sizes
  TRAIL_POINT_SIZE: 0.8,
  LOOKAT_POINT_SIZE: 0.3,
} as const;

/**
 * Event/State Colors
 * Used for timeline visualization and insights
 */
export const EVENT_COLORS = {
  pause: '#ff4444',
  linger: '#ff8844',
  rush: '#44ff44',
  walk: '#88ff44',
  scan: '#44ccff',
  focus: '#4488ff',
  look_up: '#ff44ff',
  look_down: '#ff88ff',
  attend: '#ffff44',
  occupy: '#44ffff',
  noticed: '#ffffff',
  entered: '#cccccc',
  default: '#888888'
} as const;

/**
 * Get color for an event/state type
 */
export function getEventColor(eventType: string): string {
  return EVENT_COLORS[eventType as keyof typeof EVENT_COLORS] || EVENT_COLORS.default;
}

/**
 * Get all event types that have colors defined
 */
export function getColoredEventTypes(): string[] {
  return Object.keys(EVENT_COLORS).filter(key => key !== 'default');
}
