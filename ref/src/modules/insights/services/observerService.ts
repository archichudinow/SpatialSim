/**
 * Observer Service
 * Business logic for observer creation, validation, and management
 * Extracted from UI components to maintain separation of concerns
 */

import { createBoxObserver, createCylinderObserver } from '../core/observerTypes';
import type { Observer } from '../insightsStore';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

interface ObserverConfig {
  name?: string;
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  rotation?: number;
}

/**
 * Check if an observer already exists at a given position
 * @param position - Position to check
 * @param observers - Existing observers
 * @param tolerance - Position tolerance in meters (default: 0.01)
 * @returns Existing observer at that position, or null
 */
export function findObserverAtPosition(
  position: Vector3,
  observers: Observer[],
  tolerance: number = 0.01
): Observer | null {
  return observers.find(obs => {
    const dx = Math.abs(obs.volume.position.x - position.x);
    const dz = Math.abs(obs.volume.position.z - position.z);
    return dx < tolerance && dz < tolerance;
  }) || null;
}

/**
 * Generate a unique observer name
 * @param type - Observer type ('box' or 'cylinder')
 * @param existingObservers - List of existing observers
 * @param customName - Optional custom name
 * @returns Unique observer name
 */
export function generateObserverName(
  type: 'box' | 'cylinder',
  existingObservers: Observer[],
  customName?: string
): string {
  if (customName && customName.trim()) {
    return customName.trim();
  }
  
  const count = existingObservers.length + 1;
  return `${type}_${count}`;
}

/**
 * Create a box observer with validation
 * @param position - World position
 * @param config - Observer configuration
 * @param existingObservers - List of existing observers for name generation
 * @returns Created box observer
 */
export function createBoxObserverFromConfig(
  position: Vector3,
  config: ObserverConfig,
  existingObservers: Observer[]
): Observer {
  const name = generateObserverName('box', existingObservers, config.name);
  const id = name;
  
  const observer = createBoxObserver({
    id,
    width: config.width ?? 10,
    height: config.height ?? 4,
    depth: config.depth ?? 1,
    position: {
      x: position.x,
      y: (config.height ?? 4) / 2,
      z: position.z
    },
    rotation: {
      x: 0,
      y: (config.rotation ?? 0) * (Math.PI / 180),
      z: 0
    }
  });
  
  return {
    ...observer,
    name,
    position: {
      x: position.x,
      y: (config.height ?? 4) / 2,
      z: position.z
    }
  } as Observer;
}

/**
 * Create a cylinder observer with validation
 * @param position - World position
 * @param config - Observer configuration
 * @param existingObservers - List of existing observers for name generation
 * @returns Created cylinder observer
 */
export function createCylinderObserverFromConfig(
  position: Vector3,
  config: ObserverConfig,
  existingObservers: Observer[]
): Observer {
  const name = generateObserverName('cylinder', existingObservers, config.name);
  const id = name;
  
  const observer = createCylinderObserver({
    id,
    radius: config.radius ?? 5,
    height: config.height ?? 4,
    position: {
      x: position.x,
      y: (config.height ?? 4) / 2,
      z: position.z
    },
    rotation: {
      x: 0,
      y: (config.rotation ?? 0) * (Math.PI / 180),
      z: 0
    }
  });
  
  return {
    ...observer,
    name,
    position: {
      x: position.x,
      y: (config.height ?? 4) / 2,
      z: position.z
    }
  } as Observer;
}

/**
 * Create an observer based on type
 * @param type - Observer type ('box' or 'cylinder')
 * @param position - World position
 * @param config - Observer configuration
 * @param existingObservers - List of existing observers
 * @returns Created observer or null if type is invalid
 */
export function createObserver(
  type: 'box' | 'cylinder',
  position: Vector3,
  config: ObserverConfig,
  existingObservers: Observer[]
): Observer | null {
  switch (type) {
    case 'box':
      return createBoxObserverFromConfig(position, config, existingObservers);
    case 'cylinder':
      return createCylinderObserverFromConfig(position, config, existingObservers);
    default:
      return null;
  }
}

/**
 * Validate observer configuration
 * @param type - Observer type
 * @param config - Observer configuration
 * @returns Validation result
 */
export function validateObserverConfig(
  type: 'box' | 'cylinder',
  config: ObserverConfig
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (type === 'box') {
    if (config.width !== undefined && config.width <= 0) {
      errors.push('Width must be greater than 0');
    }
    if (config.height !== undefined && config.height <= 0) {
      errors.push('Height must be greater than 0');
    }
    if (config.depth !== undefined && config.depth <= 0) {
      errors.push('Depth must be greater than 0');
    }
  } else if (type === 'cylinder') {
    if (config.radius !== undefined && config.radius <= 0) {
      errors.push('Radius must be greater than 0');
    }
    if (config.height !== undefined && config.height <= 0) {
      errors.push('Height must be greater than 0');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
