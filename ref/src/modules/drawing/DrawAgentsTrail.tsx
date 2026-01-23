// DrawAgentsTrail.jsx
// Time-based trail visualization - samples agent path at fixed intervals
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useVisualizationStore } from './visualizationStore.ts';
import { usePlaybackState } from '../../hooks/usePlaybackState';
import { VISUALIZATION_TIMING, POINT_CLOUD_CONFIG } from '../../config/visualizationConfig';
import type { AgentData } from '../../types';

const { SAMPLE_INTERVAL, TRAIL_DURATION } = VISUALIZATION_TIMING;
const { TRAIL_POINT_SIZE } = POINT_CLOUD_CONFIG;

interface DrawAgentsTrailProps {
  agents: AgentData[];
  currentTime: number;
}

interface TrailPoint {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  time?: number; // deprecated alias for timestamp
}

export default function DrawAgentsTrail({ agents, currentTime }: DrawAgentsTrailProps) {
  const showTrail = useVisualizationStore((s) => s.showTrail);
  const playback = usePlaybackState();
  
  const trailHistories = useRef<TrailPoint[][]>([]);
  const pointClouds = useRef<THREE.Points[]>([]);
  const lastSampleTime = useRef(-1);

  // --- Initialize trail tracking ---
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    // Initialize history for each agent
    trailHistories.current = agents.map(() => []);
    lastSampleTime.current = -1;

    // Create point clouds
    const pcs = agents.map((agent) => {
      const maxPoints = Math.ceil(TRAIL_DURATION / SAMPLE_INTERVAL);
      const positions = new Float32Array(maxPoints * 3);
      
      // Initialize far away
      for (let i = 0; i < maxPoints * 3; i++) {
        positions[i] = 1e6;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setDrawRange(0, 0);

      const mat = new THREE.PointsMaterial({
        size: TRAIL_POINT_SIZE,
        color: agent.meta.color || '#c6c6c6',
        sizeAttenuation: false,
      });

      return new THREE.Points(geo, mat);
    });

    pointClouds.current = pcs;

    return () => {
      pcs.forEach((pc) => {
        pc.geometry.dispose();
        pc.material.dispose();
      });
    };
  }, [agents]);

  // Reset trails on reset
  useEffect(() => {
    if (playback.isReset) {
      trailHistories.current.forEach((history) => history.length = 0);
      lastSampleTime.current = -1;
    }
  }, [playback.isReset]);

  // --- Update trails each frame ---
  useFrame(() => {
    if (!showTrail || !agents || agents.length === 0) return;

    // Sample at fixed intervals
    if (currentTime - lastSampleTime.current >= SAMPLE_INTERVAL || lastSampleTime.current < 0) {
      agents.forEach((agent, idx) => {
        if (!agent.nodes?.position?.position) return;
        const history = trailHistories.current[idx];
        if (!history) return; // Skip if history not initialized
        const position = agent.nodes.position.position;

        // Add new sample with timestamp
        history.push({
          timestamp: currentTime,
          time: currentTime,
          x: position.x,
          y: position.y,
          z: position.z
        });

        // Cull old samples beyond TRAIL_DURATION to prevent memory buildup
        const cutoffTime = currentTime - TRAIL_DURATION;
        while (history.length > 0 && (history[0].timestamp || history[0].time || 0) < cutoffTime) {
          history.shift();
        }
      });

      lastSampleTime.current = currentTime;
    }

    // Update point cloud geometries - render all points (100%)
    agents.forEach((_agent, idx) => {
      const pc = pointClouds.current[idx];
      if (!pc) return;

      const history = trailHistories.current[idx];
      if (!history) return; // Skip if history not initialized
      const positions = pc.geometry.attributes.position.array;
      
      // Render all trail points
      history.forEach((sample, i) => {
        if (i * 3 + 2 < positions.length) {
          positions[i * 3] = sample.x;
          positions[i * 3 + 1] = sample.y;
          positions[i * 3 + 2] = sample.z;
        }
      });

      // Hide unused points
      for (let i = history.length * 3; i < positions.length; i++) {
        positions[i] = 1e6;
      }

      pc.geometry.setDrawRange(0, history.length);
      pc.geometry.attributes.position.needsUpdate = true;
    });
  });

  return (
    <>
      {showTrail && pointClouds.current.map((pc, i) => (
        <primitive object={pc} key={i} />
      ))}
    </>
  );
}
