/**
 * Heatmap Module Services
 * Centralized exports for all heatmap services and utilities
 */

// Services
export { selectLayerBuffer, isEventBasedLayer, shouldUsePlaneGeometry } from './bufferSelector';
export { resolveLayerConfig, getLayerDefaults } from './configResolver';
export {
  updateDisplayMaterials,
  updateMaterialUniforms,
  disposeMaterials,
  setMeshVisibility
} from './materialManager';
