import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { createRenderTarget } from './heatmapUtils';
import { createHeatmapComputeMaterial, createHeatmapDisplayMaterial } from './heatmapShaders';

export function useHeatmapRenderer(
  modelData: any,
  activeBuffer: Float32Array | null,
  playback: any,
  glbScene: any,
  isVisible = true,
  useTransparency = true,
  _currentTime = 0,
  minHeat = 0.0,
  maxHeat = 50.0,
  gradientStyle = 'smooth',
  radius = 3.0,
  usePlaneGeometry = false,
  shouldAccumulate = true
) {
  const { gl, scene } = useThree();
  const heatRT1 = useRef<THREE.WebGLRenderTarget | null>(null);
  const heatRT2 = useRef<THREE.WebGLRenderTarget | null>(null);
  const heatScene = useRef<THREE.Scene | null>(null);
  const heatCamera = useRef<THREE.OrthographicCamera | null>(null);
  const heatMaterial = useRef<THREE.ShaderMaterial | null>(null);
  const agentsArray = useRef<any[] | null>(null);
  const accumulatedDelta = useRef(0);
  const minAccumulationDelta = useRef(1.0 / 30.0); // Only accumulate every ~30fps worth of time
  const planeMeshRef = useRef<THREE.Mesh | null>(null); // Store plane mesh reference

  // Initialize or reset heatmap buffers
  const initializeHeatmap = () => {
    if (!modelData) return;

    const { meshes, vertexPosTexture, textureSize } = modelData;

    heatRT1.current = createRenderTarget(textureSize, textureSize);
    heatRT2.current = createRenderTarget(textureSize, textureSize);

    heatScene.current = new THREE.Scene();
    heatCamera.current = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    heatMaterial.current = createHeatmapComputeMaterial(textureSize, radius);
    heatMaterial.current.uniforms.vertexPos.value = vertexPosTexture;

    heatScene.current.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), heatMaterial.current));

    meshes.forEach((mesh: THREE.Mesh) => {
      if (heatRT1.current) {
        mesh.material = createHeatmapDisplayMaterial(heatRT1.current.texture, maxHeat, useTransparency, minHeat, gradientStyle);
      }
    });

    if (glbScene && !usePlaneGeometry) {
      glbScene.position.y = 0.3; // Lift heatmap model by 0.3
      if (!scene.children.includes(glbScene)) scene.add(glbScene);
    }
    
    // If using plane geometry, add the plane mesh to scene
    if (usePlaneGeometry && meshes.length > 0) {
      planeMeshRef.current = meshes[0] as THREE.Mesh;
      if (planeMeshRef.current && !scene.children.includes(planeMeshRef.current)) {
        scene.add(planeMeshRef.current);
      }
    }

    // Initialize agents array
    agentsArray.current = [new Float32Array(32 * 3)];
    if (heatMaterial.current) {
      heatMaterial.current.uniforms.agentsPos.value = agentsArray.current[0];
      heatMaterial.current.uniforms.numAgents.value = 0;

      // Initialize with zero heat
      if (heatRT1.current && heatRT2.current && heatScene.current && heatCamera.current) {
        heatMaterial.current.uniforms.prevHeat.value = heatRT1.current.texture;
        gl.setRenderTarget(heatRT2.current);
        gl.render(heatScene.current, heatCamera.current);
      }
    }
    gl.setRenderTarget(null);
    [heatRT1.current, heatRT2.current] = [heatRT2.current, heatRT1.current];
  };

  // Initialize once
  useEffect(() => {
    initializeHeatmap();
  }, [modelData]);

  // Reset heatmap on reset
  useEffect(() => {
    if (playback.isReset) {
      initializeHeatmap();
      accumulatedDelta.current = 0;
    }
  }, [playback.isReset]);

  // Control visibility of heatmap
  useEffect(() => {
    if (modelData && glbScene && !usePlaneGeometry) {
      glbScene.visible = isVisible;
    }
    if (usePlaneGeometry && planeMeshRef.current) {
      planeMeshRef.current.visible = isVisible;
    }
  }, [isVisible, modelData, glbScene, usePlaneGeometry]);

  // Update materials when transparency, gradient, or range changes
  useEffect(() => {
    if (modelData && heatRT1.current) {
      modelData.meshes.forEach((mesh: THREE.Mesh) => {
        if (heatRT1.current) {
          mesh.material = createHeatmapDisplayMaterial(heatRT1.current.texture, maxHeat, useTransparency, minHeat, gradientStyle);
        }
      });
    }
  }, [useTransparency, modelData, minHeat, maxHeat, gradientStyle]);

  // Frame loop
  useFrame((_, delta) => {
    // Always accumulate heat when playing (regardless of visibility)
    if (!modelData || !activeBuffer || !playback.isPlaying || playback.isPaused || !shouldAccumulate) return;
    if (!heatMaterial.current || !agentsArray.current) return;

    // Copy current positions to agentsArray
    const agents = agentsArray.current?.[0];
    if (!agents) return;
    
    for (let i = 0; i < 32; i++) {
      if (i < activeBuffer.length / 3) {
        agents[i * 3] = activeBuffer[i * 3];
        agents[i * 3 + 1] = activeBuffer[i * 3 + 1];
        agents[i * 3 + 2] = activeBuffer[i * 3 + 2];
      } else {
        agents[i * 3] = 1e6;
        agents[i * 3 + 1] = 1e6;
        agents[i * 3 + 2] = 1e6;
      }
    }

    // Accumulate SIMULATION TIME (not real time) to decide when to render
    // This ensures both x1 and x8 speeds accumulate at the same simulation intervals
    // At 1x speed: simulationDelta = delta * 1.0
    // At 8x speed: simulationDelta = delta * 8.0 (8x more simulation time per frame)
    // Accumulating simulation time means we render at the same sim-time intervals regardless of speed
    const simulationDelta = delta * playback.speed;
    accumulatedDelta.current += simulationDelta;
    
    // Only render when accumulated simulation time exceeds threshold
    // This ensures agents accumulate heat at the same spatial intervals regardless of speed
    if (accumulatedDelta.current >= minAccumulationDelta.current && heatMaterial.current) {
      heatMaterial.current.uniforms.agentsPos.value = agents;
      heatMaterial.current.uniforms.numAgents.value = Math.min(activeBuffer.length / 3, 32);
      heatMaterial.current.uniforms.playing.value = true;
      heatMaterial.current.uniforms.speedFactor.value = 1.0; // No longer need speed factor

      if (heatRT1.current && heatRT2.current && heatScene.current && heatCamera.current) {
        heatMaterial.current.uniforms.prevHeat.value = heatRT1.current.texture;
        gl.setRenderTarget(heatRT2.current);
        gl.render(heatScene.current, heatCamera.current);
        gl.setRenderTarget(null);
        [heatRT1.current, heatRT2.current] = [heatRT2.current, heatRT1.current];

        // Update display meshes
        modelData.meshes.forEach((mesh: THREE.Mesh) => {
          if (mesh.material && (mesh.material as any).uniforms) {
            (mesh.material as any).uniforms.heatTex.value = heatRT1.current?.texture;
            (mesh.material as any).uniforms.minHeat.value = minHeat;
            (mesh.material as any).uniforms.maxHeat.value = maxHeat;
          }
        });
      }

      // Reset accumulator
      accumulatedDelta.current = 0;
    }
  });
}
