/**
 * Buffer Selection Service
 * Handles selection and conversion of different buffer types for heatmap layers
 */
import { eventMapToBuffer, eventSetToBuffer } from '../../../services/bufferService';
import type { BufferSelectionOptions } from '../types';

/**
 * Select and prepare the appropriate buffer for a heatmap layer
 * @param options - Buffer selection configuration
 * @returns Float32Array buffer for the specified layer
 */
export function selectLayerBuffer(options: BufferSelectionOptions): Float32Array {
  const {
    layerId,
    agentBuffer,
    positionBuffer,
    lookAtBuffer,
    eventData,
    agents
  } = options;

  // Use explicit buffer if provided
  if (agentBuffer) {
    return agentBuffer;
  }

  // Select buffer based on layer type
  switch (layerId) {
    case 'position':
      return positionBuffer;

    case 'lookat':
      return lookAtBuffer;

    case 'linger':
    case 'pause':
    case 'scan':
      // Duration events (MAP type) - convert Map to buffer
      return eventData ? eventMapToBuffer(eventData) : new Float32Array(0);

    case 'noticed':
      // Point events (SET type) - convert Set to buffer
      return eventData ? eventSetToBuffer(eventData, agents) : new Float32Array(0);

    default:
      // Fallback to position buffer for unknown types
      return positionBuffer;
  }
}

/**
 * Check if a layer uses event data (instead of continuous position/lookat)
 * @param layerId - Layer identifier
 * @returns true if layer is event-based
 */
export function isEventBasedLayer(layerId: string): boolean {
  return ['linger', 'pause', 'scan', 'noticed'].includes(layerId);
}

/**
 * Check if a layer typically uses plane geometry
 * @param layerId - Layer identifier
 * @returns true if layer should default to plane geometry
 */
export function shouldUsePlaneGeometry(layerId: string): boolean {
  // lookat uses GLB mesh by default, all others use plane
  return layerId !== 'lookat';
}
