/**
 * Buffer Service
 * Centralized buffer creation and manipulation
 */

import type { Vector3 } from '../types';

export const MAX_AGENTS = 32;

interface EventWithPosition {
  position: Vector3;
  intensity?: number;
}

interface AgentNode {
  position: {
    x: number;
    y: number;
    z: number;
  };
}

interface Agent {
  id: number;
  nodes?: {
    position?: AgentNode;
    lookAt?: AgentNode;
  };
}

/**
 * Create empty position buffer
 */
export function createPositionBuffer(maxAgents: number = MAX_AGENTS): Float32Array {
  const buffer = new Float32Array(maxAgents * 3);
  // Initialize with large values to hide unused agents
  for (let i = 0; i < maxAgents * 3; i++) {
    buffer[i] = 1e6;
  }
  return buffer;
}

/**
 * Create empty look-at buffer (2 points per agent: position + lookAt)
 */
export function createLookAtBuffer(maxAgents: number = MAX_AGENTS): Float32Array {
  const buffer = new Float32Array(maxAgents * 2 * 3);
  // Initialize with large values to hide unused lines
  for (let i = 0; i < maxAgents * 2 * 3; i++) {
    buffer[i] = 1e6;
  }
  return buffer;
}

/**
 * Convert event Map to Float32Array buffer
 * Map format: agentId -> { position: {x,y,z}, intensity }
 */
export function eventMapToBuffer(eventMap: Map<any, EventWithPosition>): Float32Array {
  if (!eventMap || eventMap.size === 0) {
    return new Float32Array(0);
  }
  
  const buffer = new Float32Array(eventMap.size * 3);
  let i = 0;
  for (const event of eventMap.values()) {
    buffer[i++] = event.position.x;
    buffer[i++] = event.position.y;
    buffer[i++] = event.position.z;
  }
  return buffer;
}

/**
 * Convert point event Set to Float32Array buffer
 * Set contains agentIds - need to look up current positions from agents array
 */
export function eventSetToBuffer(eventSet: Set<any>, agents: Agent[]): Float32Array {
  if (!eventSet || eventSet.size === 0 || !agents) {
    return new Float32Array(0);
  }
  
  const buffer = new Float32Array(eventSet.size * 3);
  let i = 0;
  for (const agentId of eventSet) {
    const agent = agents.find(a => a.id === agentId);
    if (agent && agent.nodes?.position) {
      const pos = agent.nodes.position.position;
      buffer[i++] = pos.x;
      buffer[i++] = pos.y;
      buffer[i++] = pos.z;
    }
  }
  return buffer;
}

/**
 * Hide agent from buffers by setting position to large value
 */
export function hideAgentInBuffers(
  positionBuffer: Float32Array,
  lookAtBuffer: Float32Array,
  index: number
): void {
  const posIndex = index * 3;
  positionBuffer[posIndex] = 1e6;
  positionBuffer[posIndex + 1] = 1e6;
  positionBuffer[posIndex + 2] = 1e6;
  
  const lookAtIndex = index * 6;
  lookAtBuffer[lookAtIndex] = 1e6;
  lookAtBuffer[lookAtIndex + 1] = 1e6;
  lookAtBuffer[lookAtIndex + 2] = 1e6;
  lookAtBuffer[lookAtIndex + 3] = 1e6;
  lookAtBuffer[lookAtIndex + 4] = 1e6;
  lookAtBuffer[lookAtIndex + 5] = 1e6;
}

/**
 * Write agent position and look-at data to buffers
 */
export function writeAgentToBuffers(
  agent: Agent,
  positionBuffer: Float32Array,
  lookAtBuffer: Float32Array,
  index: number
): void {
  const position = agent.nodes!.position!.position;
  const lookAt = agent.nodes!.lookAt!.position;
  
  const posIndex = index * 3;
  positionBuffer[posIndex] = position.x;
  positionBuffer[posIndex + 1] = position.y;
  positionBuffer[posIndex + 2] = position.z;
  
  const lookAtIndex = index * 6;
  lookAtBuffer[lookAtIndex] = position.x;
  lookAtBuffer[lookAtIndex + 1] = position.y;
  lookAtBuffer[lookAtIndex + 2] = position.z;
  lookAtBuffer[lookAtIndex + 3] = lookAt.x;
  lookAtBuffer[lookAtIndex + 4] = lookAt.y;
  lookAtBuffer[lookAtIndex + 5] = lookAt.z;
}
