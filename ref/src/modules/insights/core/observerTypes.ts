/**
 * Observer Object Type Definitions
 * Defines BOX and CYLINDER observer geometries with face and volume properties
 */

/**
 * Observer type constants
 */
export const OBSERVER_TYPES = {
  BOX: 'box',
  CYLINDER: 'cylinder',
  PATH: 'path' // Future implementation
};

/**
 * Face detection mode constants
 */
export const FACE_MODE = {
  TWO_SIDED: 'two-sided'  // Default - detects from both sides
};

/**
 * Create a BOX observer object
 * @param {Object} config - Box configuration
 * @param {string} config.id - Unique observer identifier
 * @param {number} config.width - Width (X-axis) in meters
 * @param {number} config.height - Height (Y-axis) in meters
 * @param {number} config.depth - Depth (Z-axis) in meters
 * @param {Object} config.position - World position {x, y, z}
 * @param {Object} config.rotation - Euler rotation {x, y, z} in radians
 * @returns {Object} Box observer object
 */
export function createBoxObserver(config: any) {
  const {
    id,
    width,
    height,
    depth,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 }
  } = config;

  return {
    id,
    type: OBSERVER_TYPES.BOX,
    
    // Volume properties (3D bounds)
    volume: {
      width,
      height,
      depth,
      position,
      rotation
    },
    
    // Face properties (detection plane)
    face: {
      width,
      height,
      // Face centered at box center (no offset)
      offset: { x: 0, y: 0, z: 0 },
      mode: FACE_MODE.TWO_SIDED
    }
  };
}

/**
 * Create a CYLINDER observer object
 * @param {Object} config - Cylinder configuration
 * @param {string} config.id - Unique observer identifier
 * @param {number} config.radius - Cylinder radius in meters
 * @param {number} config.height - Cylinder height (Y-axis) in meters
 * @param {Object} config.position - World position {x, y, z}
 * @param {Object} config.rotation - Euler rotation {x, y, z} in radians
 * @returns {Object} Cylinder observer object
 */
export function createCylinderObserver(config: any) {
  const {
    id,
    radius,
    height,
    position = { x: 0, y: 0, z: 0 },
    rotation = { x: 0, y: 0, z: 0 }
  } = config;

  return {
    id,
    type: OBSERVER_TYPES.CYLINDER,
    
    // Volume properties (cylindrical bounds)
    volume: {
      radius,
      height,
      position,
      rotation
    },
    
    // Face properties (rectangular detection plane)
    face: {
      width: radius * 2,  // Face width = diameter
      height: height,      // Face height = cylinder height
      // Face centered at cylinder center
      offset: { x: 0, y: 0, z: 0 },
      mode: FACE_MODE.TWO_SIDED
    }
  };
}

/**
 * Validate observer object structure
 * @param {Object} observer - Observer object to validate
 * @returns {boolean} True if valid
 */
export function isValidObserver(observer: any) {
  if (!observer || !observer.id || !observer.type) {
    return false;
  }
  
  if (!Object.values(OBSERVER_TYPES).includes(observer.type)) {
    return false;
  }
  
  // Check volume and face properties exist
  if (!observer.volume || !observer.face) {
    return false;
  }
  
  return true;
}
