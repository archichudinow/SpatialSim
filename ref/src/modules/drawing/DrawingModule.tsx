/**
 * DrawingModule - Container for all agent drawing/visualization components
 * Manages the rendering of agent positions, trails, vectors, and stop/dwell events
 */
import DrawAgentPosition from './DrawAgentPosition';
import DrawAgentVector from './DrawAgentVector';
import DrawAgentLookAtPoints from './DrawAgentLookAtPoints';
import DrawAgentsTrail from './DrawAgentsTrail';


import type { AgentData } from '../../types';

interface DrawingModuleProps {
  agents: AgentData[];
  currentTime: number;
  positionBuffer?: Float32Array;
  lookAtBuffer?: Float32Array;
}

export default function DrawingModule({ agents, currentTime }: DrawingModuleProps) {
  return (
    <>
      <DrawAgentsTrail agents={agents} currentTime={currentTime} />
      <DrawAgentPosition agents={agents} currentTime={currentTime} />
      <DrawAgentVector agents={agents} currentTime={currentTime} />
      <DrawAgentLookAtPoints agents={agents} currentTime={currentTime} />
    </>
  );
}
