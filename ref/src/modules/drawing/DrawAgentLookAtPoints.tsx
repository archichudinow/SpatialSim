// DrawAgentLookAtPoints.jsx
// Reveals all viewed points up to current time
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { usePlaybackState } from '../../hooks/usePlaybackState';
import * as THREE from 'three';
import { useVisualizationStore } from './visualizationStore.ts';
import { VISUALIZATION_TIMING, POINT_CLOUD_CONFIG } from '../../config/visualizationConfig';
import type { AgentData } from '../../types';

const { SAMPLE_INTERVAL } = VISUALIZATION_TIMING;
const { MAX_POINTS_PER_AGENT, LOOKAT_POINT_SIZE } = POINT_CLOUD_CONFIG;

interface DrawAgentLookAtPointsProps {
  agents: AgentData[];
  currentTime: number;
}

export default function DrawAgentLookAtPoints({ agents, currentTime }: DrawAgentLookAtPointsProps) {
  const lookAtPoints = useVisualizationStore((s) => s.lookAtPoints);
  const playback = usePlaybackState();

  const pointsRef = useRef(null);
  const geometryRef = useRef<THREE.BufferGeometry | null>(null);
  const historyData = useRef<{ x: number; y: number; z: number; color: number[] }[][]>([]);
  const lastUpdateTime = useRef(-1);
  const needsRebuild = useRef(true);

  // --- Initialize history tracking ---
  useEffect(() => {
    if (!lookAtPoints || !agents) return;

    // Initialize history tracking
    historyData.current = agents.map(() => []);
    lastUpdateTime.current = -1;
    needsRebuild.current = true;
  }, [lookAtPoints, agents]);

  // Reset on reset
  useEffect(() => {
    if (playback.isReset) {
      historyData.current.forEach(history => history.length = 0);
      lastUpdateTime.current = -1;
      needsRebuild.current = true;
    }
  }, [playback.isReset]);

  // --- Update point cloud each frame ---
  useFrame(() => {
    if (!lookAtPoints || !agents || agents.length === 0) return;

    // Sample at fixed intervals
    if (currentTime - lastUpdateTime.current >= SAMPLE_INTERVAL) {
      agents.forEach((agent, agentIdx) => {
        if (!agent.nodes?.lookAt?.position) return;
        const lookAt = agent.nodes.lookAt.position;
        const history = historyData.current[agentIdx];
        
        history.push({ x: lookAt.x, y: lookAt.y, z: lookAt.z, color: [1, 0, 0] });
        
        // Limit history size to prevent unbounded growth
        if (history.length > MAX_POINTS_PER_AGENT) {
          history.shift();
        }
      });
      lastUpdateTime.current = currentTime;
      needsRebuild.current = true;
    }

    // Only rebuild geometry when new points were added
    if (!needsRebuild.current) return;
    needsRebuild.current = false;

    // Calculate total points needed
    let totalPoints = 0;
    historyData.current.forEach((history) => {
      totalPoints += history.length;
    });

    if (totalPoints === 0) {
      if (geometryRef.current) {
        geometryRef.current.setDrawRange(0, 0);
      }
      return;
    }

    // Create or reuse buffers
    if (!geometryRef.current || geometryRef.current.attributes.position.array.length < totalPoints * 3) {
      // Need to create larger geometry
      if (geometryRef.current) {
        geometryRef.current.dispose();
      }
      
      const maxPoints = Math.max(totalPoints, MAX_POINTS_PER_AGENT * agents.length);
      const positions = new Float32Array(maxPoints * 3);
      const colors = new Float32Array(maxPoints * 3);
      
      geometryRef.current = new THREE.BufferGeometry();
      geometryRef.current.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geometryRef.current.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    }

    // Update existing buffers
    const positions = geometryRef.current.attributes.position.array;
    const colors = geometryRef.current.attributes.color.array;

    let pointIdx = 0;
    agents.forEach((_agent, agentIdx) => {
      const history = historyData.current[agentIdx];
      
      history.forEach((point) => {
        positions[pointIdx * 3] = point.x;
        positions[pointIdx * 3 + 1] = point.y;
        positions[pointIdx * 3 + 2] = point.z;

        // Simple white color
        colors[pointIdx * 3] = 1.0;
        colors[pointIdx * 3 + 1] = 1.0;
        colors[pointIdx * 3 + 2] = 1.0;
        
        pointIdx++;
      });
    });

    geometryRef.current.attributes.position.needsUpdate = true;
    geometryRef.current.attributes.color.needsUpdate = true;
    geometryRef.current.setDrawRange(0, totalPoints);
  });

  return lookAtPoints && geometryRef.current ? (
    <points ref={pointsRef} geometry={geometryRef.current}>
      <pointsMaterial size={LOOKAT_POINT_SIZE} vertexColors sizeAttenuation={false} />
    </points>
  ) : null;
}
