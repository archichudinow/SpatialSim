/**
 * Heatmap Initialization Hook
 * Handles one-time setup of render targets, scenes, and materials
 */
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useThree } from '@react-three/fiber';
import { createRenderTarget } from '../heatmapUtils';
import { createHeatmapComputeMaterial } from '../heatmapShaders';
import { updateDisplayMaterials } from '../services/materialManager';
import type { HeatmapModelData } from '../types';

interface InitializationRefs {
  heatRT1: React.MutableRefObject<THREE.WebGLRenderTarget | null>;
  heatRT2: React.MutableRefObject<THREE.WebGLRenderTarget | null>;
  heatScene: React.MutableRefObject<THREE.Scene | null>;
  heatCamera: React.MutableRefObject<THREE.OrthographicCamera | null>;
  heatMaterial: React.MutableRefObject<THREE.ShaderMaterial | null>;
  agentsArray: React.MutableRefObject<Float32Array[] | null>;
  planeMesh: React.MutableRefObject<THREE.Mesh | null>;
}

export function useHeatmapInitialization(
  modelData: HeatmapModelData | null,
  glbScene: any,
  usePlaneGeometry: boolean,
  radius: number,
  maxHeat: number,
  minHeat: number,
  gradientStyle: string,
  useTransparency: boolean
): InitializationRefs {
  const { gl, scene } = useThree();

  // Refs for render state
  const heatRT1 = useRef<THREE.WebGLRenderTarget | null>(null);
  const heatRT2 = useRef<THREE.WebGLRenderTarget | null>(null);
  const heatScene = useRef<THREE.Scene | null>(null);
  const heatCamera = useRef<THREE.OrthographicCamera | null>(null);
  const heatMaterial = useRef<THREE.ShaderMaterial | null>(null);
  const agentsArray = useRef<Float32Array[] | null>(null);
  const planeMesh = useRef<THREE.Mesh | null>(null);

  // Initialize heatmap rendering pipeline
  const initializeHeatmap = () => {
    if (!modelData) return;

    const { meshes, vertexPosTexture, textureSize } = modelData;

    // Create render targets for ping-pong rendering
    heatRT1.current = createRenderTarget(textureSize, textureSize);
    heatRT2.current = createRenderTarget(textureSize, textureSize);

    // Create compute scene and camera
    heatScene.current = new THREE.Scene();
    heatCamera.current = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

    // Create compute material
    heatMaterial.current = createHeatmapComputeMaterial(textureSize, radius);
    heatMaterial.current.uniforms.vertexPos.value = vertexPosTexture;

    // Add compute quad to scene
    const computeQuad = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      heatMaterial.current
    );
    heatScene.current.add(computeQuad);

    // Setup display materials
    updateDisplayMaterials(
      modelData,
      heatRT1.current.texture,
      maxHeat,
      useTransparency,
      minHeat,
      gradientStyle
    );

    // Add meshes to scene
    if (glbScene && !usePlaneGeometry) {
      glbScene.position.y = 0.3; // Lift heatmap model
      if (!scene.children.includes(glbScene)) {
        scene.add(glbScene);
      }
    }

    if (usePlaneGeometry && meshes.length > 0) {
      planeMesh.current = meshes[0];
      if (planeMesh.current && !scene.children.includes(planeMesh.current)) {
        scene.add(planeMesh.current);
      }
    }

    // Initialize agents array (max 32 agents)
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

    // Swap render targets
    [heatRT1.current, heatRT2.current] = [heatRT2.current, heatRT1.current];
  };

  // Initialize once when model data is available
  useEffect(() => {
    initializeHeatmap();

    // Cleanup function
    return () => {
      if (heatRT1.current) heatRT1.current.dispose();
      if (heatRT2.current) heatRT2.current.dispose();
      if (heatMaterial.current) heatMaterial.current.dispose();
    };
  }, [modelData]);

  return {
    heatRT1,
    heatRT2,
    heatScene,
    heatCamera,
    heatMaterial,
    agentsArray,
    planeMesh
  };
}
