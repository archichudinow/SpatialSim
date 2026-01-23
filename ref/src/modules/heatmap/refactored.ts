/**
 * Heatmap Module - Refactored Version
 * 
 * This index exports the refactored heatmap module components, services, and hooks.
 * 
 * Usage:
 * ```typescript
 * // Use refactored component
 * import { HeatmapModule } from './modules/heatmap/refactored';
 * 
 * // Use services
 * import { services } from './modules/heatmap/refactored';
 * const buffer = services.selectLayerBuffer({ ... });
 * 
 * // Use hooks
 * import { hooks } from './modules/heatmap/refactored';
 * const refs = hooks.useHeatmapInitialization(...);
 * ```
 */

// Main component
export { default as HeatmapModule } from './HeatmapModuleRefactored';
export { useHeatmapRendererRefactored as useHeatmapRenderer } from './useHeatmapRendererRefactored';

// Services
export * as services from './services';
export {
  selectLayerBuffer,
  isEventBasedLayer,
  shouldUsePlaneGeometry,
  resolveLayerConfig,
  getLayerDefaults,
  updateDisplayMaterials,
  updateMaterialUniforms,
  disposeMaterials,
  setMeshVisibility
} from './services';

// Hooks
export * as hooks from './hooks';
export {
  useHeatmapInitialization,
  useHeatmapAccumulation,
  useHeatmapEffects
} from './hooks';

// Types
export type {
  LayerConfig,
  HeatmapModelData,
  ModelBounds,
  EffectiveLayerConfig,
  BufferSelectionOptions,
  RenderTargetPair
} from './types';

// Store
export { useHeatmapStore } from './heatmapStore';

// Utilities (re-export from original files)
export { useHeatmapModel } from './useHeatmapModel';
export { usePlaneHeatmapModel, calculateModelBounds } from './HeatmapPlane';
export { createRenderTarget, createVertexPositionTexture, createHeatUVs } from './heatmapUtils';
export { createHeatmapComputeMaterial, createHeatmapDisplayMaterial } from './heatmapShaders';
