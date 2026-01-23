/**
 * Material Manager Service
 * Handles creation and updating of heatmap materials
 */
import * as THREE from 'three';
import { createHeatmapDisplayMaterial } from '../heatmapShaders';
import type { HeatmapModelData } from '../types';

/**
 * Update display materials for all meshes in a heatmap model
 * @param modelData - Heatmap model with meshes
 * @param heatTexture - Heat accumulation texture
 * @param maxHeat - Maximum heat value for normalization
 * @param useTransparency - Enable transparency
 * @param minHeat - Minimum heat value for normalization
 * @param gradientStyle - Gradient style name
 */
export function updateDisplayMaterials(
  modelData: HeatmapModelData,
  heatTexture: THREE.Texture,
  maxHeat: number,
  useTransparency: boolean,
  minHeat: number,
  gradientStyle: string
): void {
  if (!modelData?.meshes) return;

  modelData.meshes.forEach((mesh) => {
    // Dispose old material to prevent memory leaks
    if (mesh.material && (mesh.material as THREE.Material).dispose) {
      (mesh.material as THREE.Material).dispose();
    }

    // Create new material with updated parameters
    mesh.material = createHeatmapDisplayMaterial(
      heatTexture,
      maxHeat,
      useTransparency,
      minHeat,
      gradientStyle
    );
  });
}

/**
 * Update material uniforms without recreating materials
 * More efficient than full material recreation
 * @param modelData - Heatmap model with meshes
 * @param uniforms - Uniforms to update
 */
export function updateMaterialUniforms(
  modelData: HeatmapModelData,
  uniforms: {
    heatTex?: THREE.Texture;
    minHeat?: number;
    maxHeat?: number;
  }
): void {
  if (!modelData?.meshes) return;

  modelData.meshes.forEach((mesh) => {
    const material = mesh.material as THREE.ShaderMaterial;
    if (!material.uniforms) return;

    if (uniforms.heatTex !== undefined) {
      material.uniforms.heatTex.value = uniforms.heatTex;
    }
    if (uniforms.minHeat !== undefined) {
      material.uniforms.minHeat.value = uniforms.minHeat;
    }
    if (uniforms.maxHeat !== undefined) {
      material.uniforms.maxHeat.value = uniforms.maxHeat;
    }
  });
}

/**
 * Dispose all materials in a heatmap model
 * Call this during cleanup to prevent memory leaks
 * @param modelData - Heatmap model with meshes
 */
export function disposeMaterials(modelData: HeatmapModelData | null): void {
  if (!modelData?.meshes) return;

  modelData.meshes.forEach((mesh) => {
    if (mesh.material && (mesh.material as THREE.Material).dispose) {
      (mesh.material as THREE.Material).dispose();
    }
  });
}

/**
 * Set visibility for all meshes in a heatmap model
 * @param modelData - Heatmap model with meshes
 * @param visible - Target visibility state
 */
export function setMeshVisibility(
  modelData: HeatmapModelData | null,
  visible: boolean
): void {
  if (!modelData?.meshes) return;

  modelData.meshes.forEach((mesh) => {
    mesh.visible = visible;
  });
}
