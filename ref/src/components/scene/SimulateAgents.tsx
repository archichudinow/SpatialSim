import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useAppState } from '../../AppState';
import { MAX_AGENTS } from '../../services/agentProcessor';
import type { AgentData } from '../../types';
import { 
  createPositionBuffer,
  createLookAtBuffer,
  hideAgentInBuffers,
  writeAgentToBuffers
} from '../../services/bufferService';
import { updateAgentAnimation } from '../../services/animationService';

export { MAX_AGENTS };

/**
 * SimulateAgents Component
 * Updates AnimationMixers and reads agent positions/lookAt from Three.js nodes
 * Buffers are populated from AnimationMixer-updated nodes
 * 
 * Performance Optimizations:
 * - Selective updates: Only updates mixers when playing or time changes
 * - Automatic updates: Three.js AnimationMixer handles interpolation
 * - Performance monitoring: Tracks execution time
 * 
 * @param {Array} agents - Pre-filtered agents from AppState (GLB format)
 * @returns {null} This component doesn't render anything
 */
export default function SimulateAgents({ agents }: { agents: AgentData[] }) {
  const isPlaying = useAppState((s) => s.playback.isPlaying);
  const setCurrentPositionBuffer = useAppState((s) => s.actions.simulation.setPositionBuffer);
  const setCurrentLookAtBuffer = useAppState((s) => s.actions.simulation.setLookAtBuffer);

  const currentPositionBuffer = useRef<Float32Array | null>(null);
  const currentLookAtBuffer = useRef<Float32Array | null>(null);
  const lastProcessedTime = useRef(-1);
  const agentsRef = useRef<AgentData[] | null>(null); // Track if agents actually changed

  // --- Initialize buffers ONCE on first mount ---
  useEffect(() => {
    if (currentPositionBuffer.current) return; // Already initialized

    currentPositionBuffer.current = createPositionBuffer(MAX_AGENTS);
    setCurrentPositionBuffer(currentPositionBuffer.current);

    currentLookAtBuffer.current = createLookAtBuffer(MAX_AGENTS);
    setCurrentLookAtBuffer(currentLookAtBuffer.current);

    lastProcessedTime.current = -1;
  }, []); // Empty dependency - only run once on mount

  // --- Update agent references (but don't reset on every change) ---
  useEffect(() => {
    agentsRef.current = agents;
  }, [agents]);

  // --- Update AnimationMixers and read positions each frame ---
  useFrame(() => {
    const agentsToProcess = agentsRef.current;
    if (!agentsToProcess || !currentPositionBuffer.current || !currentLookAtBuffer.current) return;

    // Read current time from AppState (updated by PlaybackEngine)
    const currentTime = useAppState.getState().playback.time;

    // Skip if time hasn't changed (paused state)
    if (!isPlaying && lastProcessedTime.current === currentTime) {
      return;
    }
    
    lastProcessedTime.current = currentTime;

    // Update buffers
    const posBuffer = currentPositionBuffer.current;
    const lookAtBuffer = currentLookAtBuffer.current;

    for (let i = 0; i < agentsToProcess.length && i < MAX_AGENTS; i++) {
        const agent = agentsToProcess[i];
        
        // Use pre-computed helper function to check if agent is active
        const isAgentActive = agent.meta.isActiveAt?.(currentTime) ?? true;
        
        // Update AnimationMixer to current time
        updateAgentAnimation(agent, currentTime);

        // Write to buffers or hide inactive agents
        if (!isAgentActive) {
          // Hide inactive agents
          hideAgentInBuffers(posBuffer, lookAtBuffer, i);
        } else {
          // Agent is active - write to buffers
          writeAgentToBuffers(agent as any, posBuffer, lookAtBuffer, i);
        }
      }
  });

  // No rendering - null component
  return null;
}
