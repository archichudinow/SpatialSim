/**
 * Agent Utilities
 * Reusable business logic for working with agent data
 */
import type { AgentData } from '../types';

/**
 * Get position track from agent animation
 * @param agent - Agent data object
 * @returns Position track or null if not found
 */
export function getPositionTrack(agent: AgentData) {
  return agent.animation?.tracks?.find(
    (track: any) => track.name.includes('position') && !track.name.includes('quaternion')
  ) || null;
}

/**
 * Get look-at track from agent animation
 * @param agent - Agent data object
 * @returns Look-at track or null if not found
 */
export function getLookAtTrack(agent: AgentData) {
  return agent.animation?.tracks?.find(
    (track: any) => track.name.includes('lookAt') || track.name.includes('lookat')
  ) || null;
}

/**
 * Get agent label (participant_scenario)
 * @param agent - Agent data object
 * @returns Formatted label string
 */
export function getAgentLabel(agent: AgentData): string {
  return `${agent.meta.participant}_${agent.meta.scenario}`;
}

/**
 * Get current position from agent nodes
 * @param agent - Agent data object
 * @returns Position object or null
 */
export function getAgentCurrentPosition(agent: AgentData) {
  return agent.nodes?.position?.position || null;
}

/**
 * Get current look-at from agent nodes
 * @param agent - Agent data object
 * @returns Look-at position object or null
 */
export function getAgentCurrentLookAt(agent: AgentData) {
  return agent.nodes?.lookAt?.position || null;
}

/**
 * Check if agent is active at given time
 * @param agent - Agent data object
 * @param currentTime - Time in seconds
 * @returns true if agent is active
 */
export function isAgentActiveAtTime(agent: AgentData, currentTime: number): boolean {
  return agent.meta.isActiveAt?.(currentTime) ?? true;
}

/**
 * Get agent duration with fallback
 * @param agent - Agent data object
 * @param fallback - Fallback duration if agent duration is invalid
 * @returns Duration in seconds
 */
export function getAgentDuration(agent: AgentData, fallback?: number): number {
  const duration = agent.meta.duration || 0;
  if (isNaN(duration) || duration <= 0) {
    return fallback || 0;
  }
  return duration;
}

/**
 * Get agent start time with fallback
 * @param agent - Agent data object
 * @returns Start time in seconds
 */
export function getAgentStartTime(agent: AgentData): number {
  return (agent.meta as any).startTime || 0;
}

/**
 * Calculate maximum time from agents array
 * @param agents - Array of agent data
 * @returns Maximum duration across all agents
 */
export function calculateMaxTime(agents: AgentData[]): number {
  if (!agents || agents.length === 0) return 0;
  return Math.max(...agents.map(agent => getAgentDuration(agent, 0)));
}

/**
 * Get agent color with fallback
 * @param agent - Agent data object
 * @param fallback - Fallback color (default: '#c6c6c6')
 * @returns Color string
 */
export function getAgentColor(agent: AgentData, fallback: string = '#c6c6c6'): string {
  return agent.meta.color || fallback;
}
