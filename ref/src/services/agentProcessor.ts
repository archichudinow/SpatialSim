/**
 * Agent Processing Service
 * Pure functions for processing agent data and filtering
 * No React or Three.js dependencies - only business logic
 */

import type { AgentData } from '../types';

// Re-export from bufferService for backward compatibility
export { 
  MAX_AGENTS,
  createPositionBuffer,
  createLookAtBuffer
} from './bufferService';

/**
 * Filter agents based on scenario and agent index filters
 */
export function filterAgents(
  agents: AgentData[],
  scenarioFilter: string[] = [],
  agentFilter: number | null = null,
  maxAgents: number = 32
): AgentData[] {
  if (!agents || agents.length === 0) return [];
  
  // If agent filter is set (specific agent index), return only that agent
  if (agentFilter !== null && agentFilter >= 0 && agentFilter < agents.length) {
    return [agents[agentFilter]];
  }
  
  // Otherwise use scenario filter
  const filtered = agents.filter((agent) =>
    scenarioFilter.length === 0
      ? true
      : scenarioFilter.some((f) => agent.meta.scenario.includes(f))
  );
  
  return filtered.slice(0, maxAgents);
}

/**
 * Enhance agent with pre-computed metadata and helper functions
 * Call this during data loading, before storing in AppState
 */
export function enhanceAgentMetadata(agent: any): any {
  const duration = agent.meta.duration || 0;
  const startTime = agent.meta.startTime || 0;
  const endTime = startTime + duration;
  
  // Pre-computed helper functions (closures with captured data)
  const isActiveAt = (time: number): boolean => time >= startTime && time <= endTime;
  const getProgress = (time: number): number => {
    if (time < startTime) return 0;
    if (time > endTime) return 1;
    return (time - startTime) / duration;
  };
  const getFrameIndex = (time: number): number => Math.floor((time - startTime) * 30);
  
  return {
    ...agent,
    meta: {
      ...agent.meta,
      duration,
      startTime,
      endTime,
      frameCount: Math.floor(duration * 30),
      
      // Pre-bound helper functions
      isActiveAt,
      getProgress,
      getFrameIndex
    }
  };
}
