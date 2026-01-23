/**
 * Heatmap Accumulation Hook
 * Handles frame-by-frame heat accumulation during playback
 */
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { updateMaterialUniforms } from '../services/materialManager';
import type { HeatmapModelData } from '../types';

interface AccumulationRefs {
  heatRT1: React.MutableRefObject<THREE.WebGLRenderTarget | null>;
  heatRT2: React.MutableRefObject<THREE.WebGLRenderTarget | null>;
  heatScene: React.MutableRefObject<THREE.Scene | null>;
  heatCamera: React.MutableRefObject<THREE.OrthographicCamera | null>;
  heatMaterial: React.MutableRefObject<THREE.ShaderMaterial | null>;
  agentsArray: React.MutableRefObject<Float32Array[] | null>;
}

export function useHeatmapAccumulation(
  refs: AccumulationRefs,
  modelData: HeatmapModelData | null,
  activeBuffer: Float32Array | null,
  playback: any,
  shouldAccumulate: boolean,
  minHeat: number,
  maxHeat: number
): void {
  const { gl } = useThree();

  // Accumulation timing
  const accumulatedDelta = useRef(0);
  const minAccumulationDelta = 1.0 / 30.0; // Accumulate at ~30fps intervals

  useFrame((_, delta) => {
    // Early exit if conditions not met
    if (!modelData || !activeBuffer || !shouldAccumulate) return;
    if (!playback.isPlaying || playback.isPaused) return;
    if (!refs.heatMaterial.current || !refs.agentsArray.current) return;

    const agents = refs.agentsArray.current[0];
    if (!agents) return;

    // Copy agent positions to buffer (max 32 agents)
    const numAgents = Math.min(activeBuffer.length / 3, 32);
    for (let i = 0; i < 32; i++) {
      if (i < numAgents) {
        agents[i * 3] = activeBuffer[i * 3];
        agents[i * 3 + 1] = activeBuffer[i * 3 + 1];
        agents[i * 3 + 2] = activeBuffer[i * 3 + 2];
      } else {
        // Push invalid agents far away
        agents[i * 3] = 1e6;
        agents[i * 3 + 1] = 1e6;
        agents[i * 3 + 2] = 1e6;
      }
    }

    // Accumulate simulation time (accounts for playback speed)
    const simulationDelta = delta * playback.speed;
    accumulatedDelta.current += simulationDelta;

    // Only render when accumulated time exceeds threshold
    if (accumulatedDelta.current < minAccumulationDelta) return;

    // Update compute material uniforms
    const material = refs.heatMaterial.current;
    material.uniforms.agentsPos.value = agents;
    material.uniforms.numAgents.value = numAgents;
    material.uniforms.playing.value = true;
    material.uniforms.speedFactor.value = 1.0;

    // Render heat accumulation
    if (refs.heatRT1.current && refs.heatRT2.current && refs.heatScene.current && refs.heatCamera.current) {
      material.uniforms.prevHeat.value = refs.heatRT1.current.texture;
      gl.setRenderTarget(refs.heatRT2.current);
      gl.render(refs.heatScene.current, refs.heatCamera.current);
      gl.setRenderTarget(null);

      // Swap render targets (ping-pong)
      [refs.heatRT1.current, refs.heatRT2.current] = [refs.heatRT2.current, refs.heatRT1.current];

      // Update display materials with new heat texture
      updateMaterialUniforms(modelData, {
        heatTex: refs.heatRT1.current.texture,
        minHeat,
        maxHeat
      });
    }

    // Reset accumulator
    accumulatedDelta.current = 0;
  });
}
