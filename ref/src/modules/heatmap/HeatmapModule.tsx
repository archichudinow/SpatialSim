import { useAppState } from '../../AppState';
import { usePlaybackState } from '../../hooks/usePlaybackState';
import { useHeatmapModel } from './useHeatmapModel';
import { useHeatmapRenderer } from './useHeatmapRenderer';
import { usePlaneHeatmapModel, calculateModelBounds } from './HeatmapPlane';
import { useHeatmapStore } from './heatmapStore.ts';
import { eventMapToBuffer, eventSetToBuffer } from '../../services/bufferService';
import { HEATMAP_RENDERING } from '../../config/heatmapConfig';
import { useMemo } from 'react';

/**
 * HeatmapModule - Supports both plane and GLB mesh geometry
 * @param {string} id - Heatmap identifier ('position', 'lookat', 'linger', 'scan', 'pause')
 * @param {Float32Array} agentBuffer - Override buffer (optional, uses positionBuffer/lookAtBuffer by default)
 * @param {Object} eventData - Event data for this layer (from insights store)
 * @param {number} radius - Heat influence radius (optional, default: 3.0)
 * @param {string} gradientStyle - Gradient preset name (optional, default: 'smooth')
 * @param {boolean} usePlaneGeometry - Use plane instead of GLB mesh (default: true for all except 'lookat')
 * @param {number} targetVertexCount - Vertex count for plane (default: 10000)
 */
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

export default function HeatmapModule({
  agents,
  currentTime,
  positionBuffer,
  lookAtBuffer,
  id = 'position',
  agentBuffer = null,
  eventData = null,
  radius = 3.0,
  gradientStyle = 'smooth',
  usePlaneGeometry = id !== 'lookat',
  targetVertexCount = HEATMAP_RENDERING.DEFAULT_VERTEX_COUNT
}: HeatmapModuleProps) {
  const glbScene = useAppState((s) => s.data.model);
  const isLoadedModel = useAppState((s) => s.data.isLoadedModel);
  
  // Heatmap state from dedicated store
  const activeLayer = useHeatmapStore((s) => s.activeLayer);
  const layerConfig = useHeatmapStore((s) => s.layers[id]);
  
  const playback = usePlaybackState();
  
  // Determine visibility: this layer is active AND layer is enabled AND activeLayer is not 'none'
  const isVisible = activeLayer === id && activeLayer !== 'none' && (layerConfig?.enabled !== false);

  // Select buffer based on layer type
  let activeBuffer = agentBuffer;
  if (!activeBuffer) {
    switch (id) {
      case 'position':
        activeBuffer = positionBuffer;
        break;
      case 'lookat':
        activeBuffer = lookAtBuffer;
        break;
      case 'linger':
      case 'pause':
      case 'scan':
        // Duration events (MAP type) passed via props - convert Map to buffer
        activeBuffer = eventData ? eventMapToBuffer(eventData) : new Float32Array(0);
        break;
      case 'noticed':
        // Point events (SET type) passed via props - convert Set to buffer
        activeBuffer = eventData ? eventSetToBuffer(eventData, agents) : new Float32Array(0);
        break;
      default:
        activeBuffer = positionBuffer;
    }
  }

  // Memoize bounds calculation (only recalculate when glbScene changes)
  const bounds = useMemo(() => {
    return isLoadedModel ? calculateModelBounds(glbScene) : null;
  }, [isLoadedModel, glbScene]);
  
  // Always call both hooks (hooks must be called unconditionally)
  // Pass null when we don't need the data
  const planeModelData = usePlaneHeatmapModel(usePlaneGeometry ? bounds : null, targetVertexCount);
  const glbModelData = useHeatmapModel(!usePlaneGeometry && isLoadedModel ? glbScene : null);
  
  // Choose which data to use
  const modelData = usePlaneGeometry ? planeModelData : glbModelData;
  
  // Use layer-specific config from heatmap store (priority), otherwise fall back to props
  // This allows state-driven configuration via UI controls
  const effectiveRadius = layerConfig?.radius !== undefined ? layerConfig.radius : radius;
  const effectiveGradient = layerConfig?.gradient !== undefined ? layerConfig.gradient : gradientStyle;
  const effectiveMinHeat = layerConfig?.minHeat !== undefined ? layerConfig.minHeat : 0.0;
  const effectiveMaxHeat = layerConfig?.maxHeat !== undefined ? layerConfig.maxHeat : 50.0;
  const effectiveTransparency = layerConfig?.useTransparency !== undefined ? layerConfig.useTransparency : true;
  
  // Determine if this layer should accumulate (enabled) and be visible
  const shouldAccumulate = layerConfig?.enabled !== false;
  const shouldDisplay = isVisible;

  useHeatmapRenderer(
    modelData,
    activeBuffer,
    playback,
    glbScene,
    shouldDisplay,  // Display only if globally enabled AND this layer is active
    effectiveTransparency,
    currentTime,
    effectiveMinHeat,
    effectiveMaxHeat,
    effectiveGradient,
    effectiveRadius,
    usePlaneGeometry,
    shouldAccumulate  // Accumulate always (unless explicitly disabled)
  );

  return null;
}
