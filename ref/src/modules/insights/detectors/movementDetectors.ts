/**
 * Movement Detectors
 * Detects movement-based states: pause, linger, moving fast (rush), moving slow (walk)
 * Uses position and velocity analysis
 */

/**
 * Calculate agent velocity from position history
 * @param {Object} currentPosition - Current position {x, y, z}
 * @param {Object} previousPosition - Previous position {x, y, z}
 * @param {number} deltaTime - Time between measurements in seconds
 * @returns {number} Velocity in m/s
 */
export function calculateVelocity(currentPosition: any, previousPosition: any, deltaTime = 0.033) {
  if (!previousPosition || deltaTime === 0) {
    return 0;
  }
  
  const dx = currentPosition.x - previousPosition.x;
  const dy = currentPosition.y - previousPosition.y;
  const dz = currentPosition.z - previousPosition.z;
  
  const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const velocity = distance / deltaTime;
  
  return velocity;
}

/**
 * Calculate position change within a radius over position history
 * @param {Array} positionHistory - Array of recent positions [{x,y,z}, ...]
 * @returns {number} Maximum distance from center point
 */
export function calculateMovementRadius(positionHistory: any[]) {
  if (!positionHistory || positionHistory.length < 2) {
    return Infinity; // Not enough history
  }
  
  // Calculate center point
  const center = {
    x: positionHistory.reduce((sum: number, p: any) => sum + p.x, 0) / positionHistory.length,
    y: positionHistory.reduce((sum: number, p: any) => sum + p.y, 0) / positionHistory.length,
    z: positionHistory.reduce((sum: number, p: any) => sum + p.z, 0) / positionHistory.length
  };
  
  // Find maximum distance from center
  let maxDistance = 0;
  for (const pos of positionHistory) {
    const dx = pos.x - center.x;
    const dy = pos.y - center.y;
    const dz = pos.z - center.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    maxDistance = Math.max(maxDistance, distance);
  }
  
  return maxDistance;
}

/**
 * Detect PAUSE state
 * Moving very slowly in a small area (radius 2m)
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if agent is in PAUSE state
 */
export function detectPauseState(params: any) {
  const {
    currentPosition,
    previousPosition,
    positionHistory,
    deltaTime = 0.033
  } = params;
  
  const PAUSE_VELOCITY_THRESHOLD = 0.3; // m/s
  const PAUSE_RADIUS_THRESHOLD = 2.0;   // meters
  
  const velocity = calculateVelocity(currentPosition, previousPosition, deltaTime);
  const radius = calculateMovementRadius(positionHistory);
  
  return velocity < PAUSE_VELOCITY_THRESHOLD && radius < PAUSE_RADIUS_THRESHOLD;
}

/**
 * Detect LINGER state
 * Moving slowly in a larger area (radius 4m)
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if agent is in LINGER state
 */
export function detectLingerState(params: any) {
  const {
    currentPosition,
    previousPosition,
    positionHistory,
    deltaTime = 0.033
  } = params;
  
  const LINGER_VELOCITY_THRESHOLD = 0.8; // m/s
  const LINGER_RADIUS_THRESHOLD = 4.0;   // meters
  
  const velocity = calculateVelocity(currentPosition, previousPosition, deltaTime);
  const radius = calculateMovementRadius(positionHistory);
  
  return velocity < LINGER_VELOCITY_THRESHOLD && radius < LINGER_RADIUS_THRESHOLD;
}

/**
 * Detect RUSH state
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if agent is rushing
 */
export function detectRushState(params: any) {
  const {
    currentPosition,
    previousPosition,
    deltaTime = 0.033
  } = params;
  
  const RUSH_VELOCITY_THRESHOLD = 2.5; // m/s
  
  const velocity = calculateVelocity(currentPosition, previousPosition, deltaTime);
  
  return velocity > RUSH_VELOCITY_THRESHOLD;
}

/**
 * Detect WALK state
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if agent is walking (but not paused/lingering)
 */
export function detectWalkState(params: any) {
  const {
    currentPosition,
    previousPosition,
    deltaTime = 0.033
  } = params;
  
  const WALK_VELOCITY_MIN = 0.8;  // m/s (above linger)
  const WALK_VELOCITY_MAX = 2.5;  // m/s (below rush)
  
  const velocity = calculateVelocity(currentPosition, previousPosition, deltaTime);
  
  return velocity >= WALK_VELOCITY_MIN && velocity <= WALK_VELOCITY_MAX;
}

/**
 * Get current agent position
 * @param {Float32Array} positionBuffer - Position buffer (current frame only, all agents)
 * @param {number} agentIndex - Agent index
 * @returns {Object} Position {x, y, z}
 */
export function getAgentPosition(positionBuffer: any, agentIndex: number) {
  const offset = agentIndex * 3;
  return {
    x: positionBuffer[offset],
    y: positionBuffer[offset + 1],
    z: positionBuffer[offset + 2]
  };
}
