/**
 * Geometry Utilities  
 * Reusable business logic for THREE.js geometry operations
 */
import * as THREE from 'three';

/**
 * Create point cloud geometry with positions
 * @param maxPoints - Maximum number of points
 * @param initializeFarAway - Whether to initialize positions far away (default: true)
 * @returns BufferGeometry
 */
export function createPointCloudGeometry(maxPoints: number, initializeFarAway: boolean = true): THREE.BufferGeometry {
  const positions = new Float32Array(maxPoints * 3);
  
  if (initializeFarAway) {
    // Initialize far away to hide unused points
    for (let i = 0; i < maxPoints * 3; i++) {
      positions[i] = 1e6;
    }
  }
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setDrawRange(0, 0);
  
  return geometry;
}

/**
 * Create point cloud geometry with positions and colors
 * @param maxPoints - Maximum number of points
 * @returns BufferGeometry with position and color attributes
 */
export function createColoredPointCloudGeometry(maxPoints: number): THREE.BufferGeometry {
  const positions = new Float32Array(maxPoints * 3);
  const colors = new Float32Array(maxPoints * 3);
  
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setDrawRange(0, 0);
  
  return geometry;
}

/**
 * Update point cloud positions from history data
 * @param geometry - BufferGeometry to update
 * @param history - Array of position history {x, y, z}
 */
export function updatePointCloudPositions(
  geometry: THREE.BufferGeometry,
  history: Array<{x: number; y: number; z: number}>
): void {
  const positions = geometry.attributes.position.array as Float32Array;
  
  // Update with history data
  history.forEach((sample, i) => {
    if (i * 3 + 2 < positions.length) {
      positions[i * 3] = sample.x;
      positions[i * 3 + 1] = sample.y;
      positions[i * 3 + 2] = sample.z;
    }
  });
  
  // Hide unused points
  for (let i = history.length * 3; i < positions.length; i++) {
    positions[i] = 1e6;
  }
  
  geometry.setDrawRange(0, history.length);
  geometry.attributes.position.needsUpdate = true;
}

/**
 * Dispose point cloud resources (geometry and material)
 * @param pointCloud - THREE.Points object
 */
export function disposePointCloud(pointCloud: THREE.Points): void {
  if (pointCloud.geometry) {
    pointCloud.geometry.dispose();
  }
  if (pointCloud.material) {
    if (Array.isArray(pointCloud.material)) {
      pointCloud.material.forEach(mat => mat.dispose());
    } else {
      pointCloud.material.dispose();
    }
  }
}

/**
 * Calculate distance squared between two 3D points (faster than distance)
 * @param p1 - First point {x, y, z}
 * @param p2 - Second point {x, y, z}
 * @returns Distance squared
 */
export function distanceSquared(
  p1: {x: number; y: number; z: number},
  p2: {x: number; y: number; z: number}
): number {
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const dz = p2.z - p1.z;
  return dx * dx + dy * dy + dz * dz;
}

/**
 * Calculate distance between two 3D points
 * @param p1 - First point {x, y, z}
 * @param p2 - Second point {x, y, z}
 * @returns Distance
 */
export function distance(
  p1: {x: number; y: number; z: number},
  p2: {x: number; y: number; z: number}
): number {
  return Math.sqrt(distanceSquared(p1, p2));
}
