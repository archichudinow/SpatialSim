/**
 * Animation Service
 * Pure functions for animation updates
 * No React dependencies - only Three.js animation logic
 */

import type * as THREE from 'three';
import type { AgentMeta } from '../types';

interface AgentWithAnimation {
  mixer?: THREE.AnimationMixer;
  action?: THREE.AnimationAction;
  meta: AgentMeta & { duration: number };
}

/**
 * Update agent animation mixer to specific time
 * Handles pausing at end and time clamping
 */
export function updateAgentAnimation(agent: AgentWithAnimation, currentTime: number): void {
  const { mixer, action, meta } = agent;
  
  if (!mixer || !action) return;
  
  const { duration } = meta;
  
  if (currentTime >= duration) {
    // Beyond duration - pause at end position
    mixer.setTime(duration);
    action.time = duration;
    action.paused = true;
    action.enabled = true;
    // Force update to evaluate animation at this time
    mixer.update(0);
  } else {
    // Within duration - unpause if needed and update normally
    if (action.paused) {
      action.paused = false;
    }
    mixer.setTime(currentTime);
    action.time = currentTime;
    // Force update to evaluate animation at this time
    mixer.update(0);
  }
}

/**
 * Update all agents' animations for current time
 */
export function updateAllAgentAnimations(agents: AgentWithAnimation[], currentTime: number): void {
  for (const agent of agents) {
    updateAgentAnimation(agent, currentTime);
  }
}
