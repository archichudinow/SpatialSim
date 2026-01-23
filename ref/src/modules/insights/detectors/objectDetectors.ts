/**
 * Object Detectors
 * Detects interactions with observer objects: look at face, inside volume
 * Uses raycasting for face detection and bounds checking for volume
 */

import * as THREE from 'three';

/**
 * Check if agent position is inside BOX volume
 * @param {Object} position - Agent position {x, y, z}
 * @param {Object} observer - Box observer object
 * @returns {boolean} True if inside volume
 */
export function isInsideBoxVolume(position: any, observer: any) {
  const { volume } = observer;
  
  // Create transformation matrix
  const matrix = new THREE.Matrix4();
  matrix.makeRotationFromEuler(
    new THREE.Euler(volume.rotation.x, volume.rotation.y, volume.rotation.z)
  );
  matrix.setPosition(volume.position.x, volume.position.y, volume.position.z);
  
  // Transform agent position to local space
  const localPos = new THREE.Vector3(position.x, position.y, position.z);
  const inverseMatrix = matrix.clone().invert();
  localPos.applyMatrix4(inverseMatrix);
  
  // Check bounds
  const halfWidth = volume.width / 2;
  const halfHeight = volume.height / 2;
  const halfDepth = volume.depth / 2;
  
  const isInside = (
    Math.abs(localPos.x) <= halfWidth &&
    Math.abs(localPos.y) <= halfHeight &&
    Math.abs(localPos.z) <= halfDepth
  );
  
  return isInside;
}

/**
 * Check if agent position is inside CYLINDER volume
 * @param {Object} position - Agent position {x, y, z}
 * @param {Object} observer - Cylinder observer object
 * @returns {boolean} True if inside volume
 */
export function isInsideCylinderVolume(position: any, observer: any) {
  const { volume } = observer;
  
  // Create transformation matrix
  const matrix = new THREE.Matrix4();
  matrix.makeRotationFromEuler(
    new THREE.Euler(volume.rotation.x, volume.rotation.y, volume.rotation.z)
  );
  matrix.setPosition(volume.position.x, volume.position.y, volume.position.z);
  
  // Transform agent position to local space
  const localPos = new THREE.Vector3(position.x, position.y, position.z);
  const inverseMatrix = matrix.clone().invert();
  localPos.applyMatrix4(inverseMatrix);
  
  // Check cylinder bounds
  const distanceFromAxis = Math.sqrt(localPos.x ** 2 + localPos.z ** 2);
  const halfHeight = volume.height / 2;
  
  const isInside = (
    distanceFromAxis <= volume.radius &&
    Math.abs(localPos.y) <= halfHeight
  );
  
  return isInside;
}

/**
 * Check if agent is inside observer volume (works for any observer type)
 * @param {Object} position - Agent position {x, y, z}
 * @param {Object} observer - Observer object
 * @returns {boolean} True if inside volume
 */
export function isInsideVolume(position: any, observer: any) {
  if (!position || !observer || !observer.volume) {
    // Silently return false - no logging in hot path
    return false;
  }
  
  if (observer.type === 'box') {
    return isInsideBoxVolume(position, observer);
  } else if (observer.type === 'cylinder') {
    return isInsideCylinderVolume(position, observer);
  }
  
  // Unknown type - silently return false
  return false;
}

/**
 * Raycast from agent lookAt to observer face
 * @param {Object} agentPosition - Agent position {x, y, z}
 * @param {Object} lookAtVector - LookAt point {x, y, z}
 * @param {Object} observer - Observer object
 * @returns {Object|null} Hit result {distance, point} or null
 */
export function raycastToFace(agentPosition: any, lookAtVector: any, observer: any) {
  if (!observer || !observer.face || !observer.volume) {
    return null;
  }
  
  const { face, volume } = observer;
  
  // Create plane geometry
  const geometry = new THREE.PlaneGeometry(face.width, face.height);
  const material = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide });
  const mesh = new THREE.Mesh(geometry, material);
  
  // Apply transformation
  const matrix = new THREE.Matrix4();
  matrix.makeRotationFromEuler(
    new THREE.Euler(volume.rotation.x, volume.rotation.y, volume.rotation.z)
  );
  matrix.setPosition(
    volume.position.x + (face.offset?.x || 0),
    volume.position.y + (face.offset?.y || 0),
    volume.position.z + (face.offset?.z || 0)
  );
  mesh.applyMatrix4(matrix);
  mesh.updateMatrixWorld(true);
  
  // Perform raycast
  const raycaster = new THREE.Raycaster();
  const origin = new THREE.Vector3(agentPosition.x, agentPosition.y, agentPosition.z);
  const direction = new THREE.Vector3(
    lookAtVector.x - agentPosition.x,
    lookAtVector.y - agentPosition.y,
    lookAtVector.z - agentPosition.z
  ).normalize();
  
  raycaster.set(origin, direction);
  const intersections = raycaster.intersectObject(mesh);
  
  // Clean up
  geometry.dispose();
  material.dispose();
  
  if (intersections.length > 0) {
    return {
      distance: intersections[0].distance,
      point: intersections[0].point
    };
  }
  
  return null;
}

/**
 * Detect LOOK AT OBJECT state
 * Agent's lookAt vector intersects observer face
 * @param {Object} params - Detection parameters
 * @returns {Object|null} Hit info or null
 */
export function detectLookAtObjectState(params: any) {
  const { position, lookAt, observer } = params;
  return raycastToFace(position, lookAt, observer);
}

/**
 * Detect INSIDE OBJECT state
 * Agent position is within observer volume
 * @param {Object} params - Detection parameters
 * @returns {boolean} True if inside
 */
export function detectInsideObjectState(params: any) {
  const {
    position,
    observer
  } = params;
  
  return isInsideVolume(position, observer);
}

/**
 * Detect FIRST SEEN OBJECT (point event)
 * First frame when lookAt intersects face
 * @param {Object} params - Detection parameters
 * @param {boolean} wasSeenBefore - Was seen in previous frame
 * @returns {boolean} True if this is first time seeing
 */
export function detectFirstSeenObject(params: any, wasSeenBefore: any) {
  const hit = detectLookAtObjectState(params);
  return hit !== null && !wasSeenBefore;
}

/**
 * Detect FIRST ENTERED OBJECT (point event)
 * First frame when agent enters volume
 * @param {Object} params - Detection parameters
 * @param {boolean} wasInsideBefore - Was inside in previous frame
 * @returns {boolean} True if this is first time entering
 */
export function detectFirstEnteredObject(params: any, wasInsideBefore: any) {
  const isInside = detectInsideObjectState(params);
  return isInside && !wasInsideBefore;
}
