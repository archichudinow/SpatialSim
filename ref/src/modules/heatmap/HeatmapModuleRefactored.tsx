/**
 * Refactored HeatmapModule
 * Simplified component using extracted services and utilities
 */
import { useMemo } from 'react';
import { useAppState } from '../../AppState';
import { usePlaybackState } from '../../hooks/usePlaybackState';
import { useHeatmapModel } from './useHeatmapModel';
import { useHeatmapRenderer } from './useHeatmapRenderer';
import { usePlaneHeatmapModel, calculateModelBounds } from './HeatmapPlane';
import { useHeatmapStore } from './heatmapStore';
import { selectLayerBuffer, shouldUsePlaneGeometry } from './services/bufferSelector';
import { resolveLayerConfig, getLayerDefaults } from './services/configResolver';
import { HEATMAP_RENDERING } from '../../config/heatmapConfig';
import type { AgentData } from '../../types';

interface HeatmapModuleProps {
  agents: AgentData[];
  currentTime: number;
  positionBuffer: Float32Array;
  lookAtBuffer: Float32Array;
  id?: string;
  agentBuffer?: Float32Array | null;
  eventData?: any;
  radius?: number;
  gradientStyle?: string;
  usePlaneGeometry?: boolean;
  targetVertexCount?: number;
}

/**
 * HeatmapModule - Supports both plane and GLB mesh geometry
 * @param {string} id - Heatmap identifier ('position', 'lookat', 'linger', 'scan', 'pause', 'noticed')
 * @param {Float32Array} agentBuffer - Override buffer (optional)
 * @param {Object} eventData - Event data for this layer (from insights store)
 * @param {number} radius - Heat influence radius (optional)
 * @param {string} gradientStyle - Gradient preset name (optional)
 * @param {boolean} usePlaneGeometry - Use plane instead of GLB mesh
 * @param {number} targetVertexCount - Vertex count for plane
 */
export default function HeatmapModuleRefactored({
  agents,
  currentTime,
  positionBuffer,
  lookAtBuffer,
  id = 'position',
  agentBuffer = null,
  eventData = null,
  radius,
  gradientStyle,
  usePlaneGeometry,
  targetVertexCount = HEATMAP_RENDERING.DEFAULT_VERTEX_COUNT
}: HeatmapModuleProps) {
  // Application state
  const glbScene = useAppState((s) => s.data.model);
  const isLoadedModel = useAppState((s) => s.data.isLoadedModel);
  const playback = usePlaybackState();

  // Heatmap store state
  const activeLayer = useHeatmapStore((s) => s.activeLayer);
  const layerConfig = useHeatmapStore((s) => s.layers[id]);

  // Determine geometry type (plane vs GLB)
  const effectiveUsePlaneGeometry = usePlaneGeometry ?? shouldUsePlaneGeometry(id);

  // Get layer defaults
  const defaults = getLayerDefaults(id);

  // Select appropriate buffer for this layer
  const activeBuffer = useMemo(
    () =>
      selectLayerBuffer({
        layerId: id,
        agentBuffer,
        positionBuffer,
        lookAtBuffer,
        eventData,
        agents
      }),
    [id, agentBuffer, positionBuffer, lookAtBuffer, eventData, agents]
  );

  // Calculate model bounds (memoized)
  const bounds = useMemo(
    () => (isLoadedModel ? calculateModelBounds(glbScene) : null),
    [isLoadedModel, glbScene]
  );

  // Get model data (plane or GLB)
  const planeModelData = usePlaneHeatmapModel(
    effectiveUsePlaneGeometry ? bounds : null,
    targetVertexCount
  );
  const glbModelData = useHeatmapModel(
    !effectiveUsePlaneGeometry && isLoadedModel ? glbScene : null
  );
  const modelData = effectiveUsePlaneGeometry ? planeModelData : glbModelData;

  // Resolve effective configuration (store > props > defaults)
  const config = resolveLayerConfig({
    layerConfig,
    activeLayer,
    currentLayerId: id,
    propRadius: radius ?? defaults.radius,
    propGradient: gradientStyle ?? defaults.gradient,
    propMinHeat: defaults.minHeat,
    propMaxHeat: defaults.maxHeat,
    propUseTransparency: defaults.useTransparency
  });

  // Render heatmap
  useHeatmapRenderer(
    modelData,
    activeBuffer,
    playback,
    glbScene,
    config.shouldDisplay,
    config.useTransparency,
    currentTime,
    config.minHeat,
    config.maxHeat,
    config.gradient,
    config.radius,
    effectiveUsePlaneGeometry,
    config.shouldAccumulate
  );

  return null;
}
