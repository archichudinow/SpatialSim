/**
 * Detection Configuration
 * Parameters that control how events are detected (thresholds, ranges, etc.)
 * These are separate from tolerance (which handles post-processing)
 */

/**
 * Movement states follow a conceptual hierarchy (stricter to looser):
 * PAUSE > LINGER > WALK > RUSH
 * Though detected independently, tolerance processing will merge adjacent events of same type.
 */
export const DEFAULT_DETECTION_CONFIG = {
  pause: {
    velocity_threshold: 0.3,  // m/s - max velocity to be considered stopped
    radius_threshold: 2.0      // meters - max movement radius
  },
  linger: {
    velocity_threshold: 0.8,  // m/s
    radius_threshold: 4.0      // meters
  },
  rush: {
    velocity_threshold: 2.5   // m/s - minimum velocity
  },
  walk: {
    velocity_min: 0.8,        // m/s
    velocity_max: 2.5         // m/s
  },
  scan: {
    angular_velocity_threshold: 110  // degrees per second
  },
  focus: {
    angular_velocity_threshold: 15  // degrees per second (below = focused, stable gaze)
  },
  look_up: {
    angle_min: 91,   // degrees from horizontal (90 = horizontal, >90 = up)
    angle_max: 120   // degrees
  },
  look_down: {
    angle_min: 70,   // degrees
    angle_max: 89    // degrees (90 = horizontal, <90 = down)
  },
  attend: {
    // No configurable params yet (uses raycasting)
  },
  occupy: {
    // No configurable params (uses bounding box)
  }
};

/**
 * Detection Config Manager
 */
export class DetectionConfig {
  config: any;

  constructor(config = DEFAULT_DETECTION_CONFIG) {
    this.config = config;
  }

  /**
   * Get detection config for a specific state type
   */
  getConfig(stateType: any) {
    return this.config[stateType] || {};
  }

  /**
   * Update detection config for a state type
   */
  updateConfig(stateType: any, newConfig: any) {
    this.config[stateType] = { ...this.config[stateType], ...newConfig };
  }

  /**
   * Get all config
   */
  getAllConfig() {
    return this.config;
  }
}
