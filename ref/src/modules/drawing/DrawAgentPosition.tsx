// DrawAgentPosition.jsx
// Draws current position for each agent
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { MAX_AGENTS } from '../../services/agentProcessor';
import type { AgentData } from '../../types';

interface DrawAgentPositionProps {
  agents: AgentData[];
  currentTime: number;
}

export default function DrawAgentPosition({ agents }: DrawAgentPositionProps) {
  const markerMesh = useRef<THREE.InstancedMesh | null>(null);
  const dummy = useRef(new THREE.Object3D());

  // --- Initialize instanced mesh for agent markers ---
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    const markerGeo = new THREE.SphereGeometry(1.5, 16, 16);
    const markerMat = new THREE.MeshBasicMaterial({ color: '#000000' });
    markerMesh.current = new THREE.InstancedMesh(markerGeo, markerMat, MAX_AGENTS);
    markerMesh.current.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    markerMesh.current.frustumCulled = false;
    
    // Initialize all instances as hidden
    const dummyInit = new THREE.Object3D();
    for (let i = 0; i < MAX_AGENTS; i++) {
      dummyInit.position.set(0, -10000, 0);
      dummyInit.scale.set(0, 0, 0);
      dummyInit.updateMatrix();
      markerMesh.current.setMatrixAt(i, dummyInit.matrix);
    }
    markerMesh.current.instanceMatrix.needsUpdate = true;

    return () => {
      markerGeo.dispose();
      markerMat.dispose();
    };
  }, [agents]);

  // --- Update marker positions each frame ---
  useFrame(() => {
    if (!agents || !markerMesh.current) return;

    agents.forEach((agent, idx) => {
      if (idx >= MAX_AGENTS) return;
      if (!agent.nodes?.position?.position) return;

      // Read position from AnimationMixer-updated node (already in world scale)
      const position = agent.nodes.position.position;

      dummy.current.position.copy(position);
      dummy.current.scale.set(1, 1, 1); // Ensure scale is always 1 for active agents
      dummy.current.updateMatrix();
      if (markerMesh.current) {
        markerMesh.current.setMatrixAt(idx, dummy.current.matrix);
      }
    });

    // Hide unused instances by moving them far away
    for (let i = agents.length; i < MAX_AGENTS; i++) {
      dummy.current.position.set(0, -10000, 0); // Move far below ground
      dummy.current.scale.set(0, 0, 0); // Make invisible
      dummy.current.updateMatrix();
      markerMesh.current.setMatrixAt(i, dummy.current.matrix);
    }

    markerMesh.current.instanceMatrix.needsUpdate = true;
  });

  return markerMesh.current ? <primitive object={markerMesh.current} /> : null;
}
