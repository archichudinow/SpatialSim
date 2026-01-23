/**
 * Raycast Utilities
 * Business logic for 3D raycasting and position calculations
 * Extracted from UI components to maintain separation of concerns
 */

import * as THREE from 'three';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Raycast from camera to ground plane (y = 0)
 * @param pointer - Normalized device coordinates (-1 to 1)
 * @param camera - Three.js camera
 * @returns Intersection point or null
 */
export function raycastToGroundPlane(
  pointer: THREE.Vector2,
  camera: THREE.Camera
): Vector3 | null {
  const raycaster = new THREE.Raycaster();
  raycaster.setFromCamera(pointer, camera);
  
  // Ground plane at y = 0
  const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
  const intersectPoint = new THREE.Vector3();
  
  const hasIntersection = raycaster.ray.intersectPlane(groundPlane, intersectPoint);
  
  if (!hasIntersection) {
    return null;
  }
  
  return {
    x: intersectPoint.x,
    y: 0,
    z: intersectPoint.z
  };
}

/**
 * Convert mouse event coordinates to normalized device coordinates
 * @param event - Mouse event
 * @param canvas - Canvas element
 * @returns Normalized device coordinates (-1 to 1)
 */
export function mouseEventToNDC(
  event: MouseEvent,
  canvas: HTMLElement
): THREE.Vector2 {
  const rect = canvas.getBoundingClientRect();
  const x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  const y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  
  return new THREE.Vector2(x, y);
}

/**
 * Raycast from mouse event to ground plane
 * @param event - Mouse event
 * @param camera - Three.js camera
 * @param canvas - Canvas element (optional, will be retrieved if not provided)
 * @returns Intersection point or null
 */
export function raycastMouseToGround(
  event: MouseEvent,
  camera: THREE.Camera,
  canvas?: HTMLElement
): Vector3 | null {
  const targetCanvas = canvas || (event.target as HTMLElement);
  if (!targetCanvas) {
    return null;
  }
  
  const ndc = mouseEventToNDC(event, targetCanvas);
  return raycastToGroundPlane(ndc, camera);
}

/**
 * Check if a point is within a rectangular area
 * @param point - Point to check
 * @param center - Center of rectangle
 * @param width - Width of rectangle
 * @param depth - Depth of rectangle
 * @param rotation - Rotation in radians (around Y axis)
 * @returns True if point is inside rectangle
 */
export function isPointInRectangle(
  point: Vector3,
  center: Vector3,
  width: number,
  depth: number,
  rotation: number = 0
): boolean {
  // Translate point to rectangle's local space
  const dx = point.x - center.x;
  const dz = point.z - center.z;
  
  // Rotate point by -rotation to align with rectangle's axes
  const cos = Math.cos(-rotation);
  const sin = Math.sin(-rotation);
  const localX = dx * cos - dz * sin;
  const localZ = dx * sin + dz * cos;
  
  // Check if point is within bounds
  return Math.abs(localX) <= width / 2 && Math.abs(localZ) <= depth / 2;
}

/**
 * Check if a point is within a cylindrical area
 * @param point - Point to check
 * @param center - Center of cylinder
 * @param radius - Radius of cylinder
 * @returns True if point is inside cylinder
 */
export function isPointInCylinder(
  point: Vector3,
  center: Vector3,
  radius: number
): boolean {
  const dx = point.x - center.x;
  const dz = point.z - center.z;
  const distance = Math.sqrt(dx * dx + dz * dz);
  
  return distance <= radius;
}

/**
 * Calculate distance between two points (2D, ignoring Y)
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance in meters
 */
export function distance2D(point1: Vector3, point2: Vector3): number {
  const dx = point1.x - point2.x;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Calculate 3D distance between two points
 * @param point1 - First point
 * @param point2 - Second point
 * @returns Distance in meters
 */
export function distance3D(point1: Vector3, point2: Vector3): number {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  const dz = point1.z - point2.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
