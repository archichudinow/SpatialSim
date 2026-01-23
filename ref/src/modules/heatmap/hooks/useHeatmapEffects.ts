/**
 * Heatmap Effects Hook
 * Manages side effects: visibility, reset, material updates
 */
import { useEffect } from 'react';
import { updateDisplayMaterials } from '../services/materialManager';
import type { HeatmapModelData } from '../types';
import type * as THREE from 'three';

interface EffectsRefs {
  heatRT1: React.MutableRefObject<THREE.WebGLRenderTarget | null>;
  planeMesh: React.MutableRefObject<THREE.Mesh | null>;
}

export function useHeatmapEffects(
  refs: EffectsRefs,
  modelData: HeatmapModelData | null,
  glbScene: any,
  usePlaneGeometry: boolean,
  isVisible: boolean,
  playback: any,
  onReset: () => void,
  materialDeps: {
    useTransparency: boolean;
    minHeat: number;
    maxHeat: number;
    gradientStyle: string;
  }
): void {
  // Handle visibility changes
  useEffect(() => {
    if (!modelData) return;

    if (usePlaneGeometry && refs.planeMesh.current) {
      refs.planeMesh.current.visible = isVisible;
    } else if (glbScene) {
      glbScene.visible = isVisible;
    }
  }, [isVisible, modelData, glbScene, usePlaneGeometry]);

  // Handle reset
  useEffect(() => {
    if (playback.isReset) {
      onReset();
    }
  }, [playback.isReset, onReset]);

  // Update materials when display parameters change
  useEffect(() => {
    if (!modelData || !refs.heatRT1.current) return;

    updateDisplayMaterials(
      modelData,
      refs.heatRT1.current.texture,
      materialDeps.maxHeat,
      materialDeps.useTransparency,
      materialDeps.minHeat,
      materialDeps.gradientStyle
    );
  }, [
    modelData,
    materialDeps.useTransparency,
    materialDeps.minHeat,
    materialDeps.maxHeat,
    materialDeps.gradientStyle
  ]);
}
