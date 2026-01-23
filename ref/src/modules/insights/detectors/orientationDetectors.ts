/**
 * Orientation Detectors
 * Detects orientation-based states: looking around, focused, looking up/down
 * Uses lookAt vector analysis
 */

/**
 * Calculate angular velocity (how fast head is turning)
 * @param {Object} currentLookAt - Current lookAt vector {x, y, z}
 * @param {Object} previousLookAt - Previous lookAt vector {x, y, z}
 * @param {number} deltaTime - Time between measurements in seconds
 * @returns {number} Angular velocity in degrees per second
 */
export function calculateAngularVelocity(currentLookAt: any, previousLookAt: any, deltaTime = 0.033) {
  if (!previousLookAt || deltaTime === 0) {
    return 0;
  }
  
  // Calculate angle between vectors using dot product
  const dot = currentLookAt.x * previousLookAt.x + currentLookAt.y * previousLookAt.y + currentLookAt.z * previousLookAt.z;
  const magCurrent = Math.sqrt(currentLookAt.x ** 2 + currentLookAt.y ** 2 + currentLookAt.z ** 2);
  const magPrevious = Math.sqrt(previousLookAt.x ** 2 + previousLookAt.y ** 2 + previousLookAt.z ** 2);
  
  if (magCurrent === 0 || magPrevious === 0) {
    return 0;
  }
  
  const cosAngle = dot / (magCurrent * magPrevious);
  const angleRadians = Math.acos(Math.max(-1, Math.min(1, cosAngle)));
  const angleDegrees = angleRadians * (180 / Math.PI);
  
  // Convert to degrees per second using actual delta time
  const angularVelocity = angleDegrees / deltaTime;
  
  return angularVelocity;
}

/**
 * Calculate vertical angle of lookAt vector
 * @param {Object} lookAt - LookAt vector {x, y, z}
 * @returns {number} Vertical angle in degrees (0 = down, 90 = horizontal, 180 = up)
 */
export function calculateVerticalAngle(lookAt: any) {
  if (!lookAt) return 90; // Default to horizontal
  
  const { x, y, z } = lookAt;
  
  // Calculate angle from horizontal plane
  const horizontalMag = Math.sqrt(x ** 2 + z ** 2);
  const angleRadians = Math.atan2(y, horizontalMag);
  const angleDegrees = angleRadians * (180 / Math.PI);
  
  // Convert to 0-180 range (0 = down, 90 = horizontal, 180 = up)
  return 90 + angleDegrees;
}

/**
 * Calculate angular variance over time (how much the view direction changes)
 * @param {Array} lookAtHistory - Array of recent lookAt vectors with timestamps [{time, x, y, z}, ...]
 * @returns {number} Angular variance in degrees
 */
export function calculateAngularVariance(lookAtHistory: any[]) {
  if (!lookAtHistory || lookAtHistory.length < 2) {
    return 0;
  }
  
  const angles = [];
  
  for (let i = 1; i < lookAtHistory.length; i++) {
    const deltaTime = lookAtHistory[i].time - lookAtHistory[i-1].time;
    if (deltaTime > 0) {
      const angularVel = calculateAngularVelocity(lookAtHistory[i], lookAtHistory[i-1], deltaTime);
      angles.push(angularVel);
    }
  }
  
  if (angles.length === 0) return 0;
  
  const mean = angles.reduce((sum, val) => sum + val, 0) / angles.length;
  const variance = angles.reduce((sum, val) => sum + (val - mean) ** 2, 0) / angles.length;
  
  return Math.sqrt(variance);
}

/**
 * Detect SCAN state
 * Moving head constantly with wide angle changes
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if scanning
 */
export function detectScanState(params: any) {
  const {
    currentLookAt,
    previousLookAt,
    deltaTime = 0.033
  } = params;
  
  const SCAN_THRESHOLD = 110; // degrees per second (active looking around)
  
  const angularVelocity = calculateAngularVelocity(currentLookAt, previousLookAt, deltaTime);
  
  return angularVelocity > SCAN_THRESHOLD;
}

/**
 * Detect LOOK FOCUSED state
 * Moving head in limited angle range (focused attention, stable gaze)
 * Note: Between 15°/s and 110°/s represents normal head adjustment (neither focused nor scanning)
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if looking focused
 */
export function detectLookFocusedState(params: any) {
  const {
    currentLookAt,
    previousLookAt,
    lookAtHistory: _lookAtHistory,
    deltaTime = 0.033
  } = params;
  
  const FOCUS_THRESHOLD = 15; // degrees per second (below = very stable gaze)
  
  const angularVelocity = calculateAngularVelocity(currentLookAt, previousLookAt, deltaTime);
  
  return angularVelocity < FOCUS_THRESHOLD;
}

/**
 * Detect LOOK UP state
 * Looking significantly upward from horizontal (91-120 degrees)
 * Note: 90° is horizontal, >90° is upward
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if looking up
 */
export function detectLookUpState(params: any) {
  const { currentLookAt } = params;
  
  const MIN_ANGLE = 91; // degrees (just above horizontal)
  const MAX_ANGLE = 120; // degrees (significantly up)
  
  const verticalAngle = calculateVerticalAngle(currentLookAt);
  
  return verticalAngle >= MIN_ANGLE && verticalAngle <= MAX_ANGLE;
}

/**
 * Detect LOOK DOWN state
 * Looking slightly downward from horizontal (70-89 degrees)
 * Note: 90° is horizontal, <90° is downward
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if looking down
 */
export function detectLookDownState(params: any) {
  const { currentLookAt } = params;
  
  const MIN_ANGLE = 70;  // degrees (slightly down)
  const MAX_ANGLE = 89; // degrees (just below horizontal)
  
  const verticalAngle = calculateVerticalAngle(currentLookAt);
  
  return verticalAngle >= MIN_ANGLE && verticalAngle <= MAX_ANGLE;
}

/**
 * Get current lookAt vector
 * @param {Float32Array} lookAtBuffer - LookAt buffer (current frame only, all agents)
 * @param {number} agentIndex - Agent index
 * @returns {Object} LookAt vector {x, y, z}
 */
export function getAgentLookAt(lookAtBuffer: any, agentIndex: number) {
  const offset = agentIndex * 3;
  return {
    x: lookAtBuffer[offset],
    y: lookAtBuffer[offset + 1],
    z: lookAtBuffer[offset + 2]
  };
}
