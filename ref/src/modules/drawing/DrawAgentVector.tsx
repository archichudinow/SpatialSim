// DrawAgentVector.jsx
// Draws a line from current agent position to lookAt position
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useVisualizationStore } from './visualizationStore.ts';
import type { AgentData } from '../../types';

interface DrawAgentVectorProps {
  agents: AgentData[];
  currentTime: number;
}

export default function DrawAgentVector({ agents }: DrawAgentVectorProps) {
  const lookAtLines = useVisualizationStore((s) => s.lookAtLines);

  const lineRef = useRef(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);

  // --- Update geometry each frame ---
  useFrame(() => {
    if (!agents || agents.length === 0 || !lookAtLines) return;

    // Create buffer based on actual agent count
    const bufferData = new Float32Array(agents.length * 2 * 3); // 2 points per agent

    agents.forEach((agent, idx) => {
      if (!agent.nodes?.position?.position || !agent.nodes?.lookAt?.position) return;
      // Read from AnimationMixer-updated nodes (already in world scale)
      const position = agent.nodes.position.position;
      const lookAt = agent.nodes.lookAt.position;

      // Each agent uses 2 points: agent pos, lookAt pos
      const bufferIdx = idx * 2 * 3;
      bufferData[bufferIdx] = position.x;
      bufferData[bufferIdx + 1] = position.y;
      bufferData[bufferIdx + 2] = position.z;

      bufferData[bufferIdx + 3] = lookAt.x;
      bufferData[bufferIdx + 4] = lookAt.y;
      bufferData[bufferIdx + 5] = lookAt.z;
    });

    // Recreate geometry with new data
    if (geometryRef.current) {
      geometryRef.current.dispose();
    }
    
    geometryRef.current = new THREE.BufferGeometry();
    geometryRef.current.setAttribute(
      'position',
      new THREE.BufferAttribute(bufferData, 3)
    );
  });

  return lookAtLines && geometryRef.current ? (
    <lineSegments ref={lineRef} frustumCulled={false}>
      <primitive object={geometryRef.current} attach="geometry" />
      <lineBasicMaterial attach="material" color="#33b8d6" linewidth={1} />
    </lineSegments>
  ) : null;
}
