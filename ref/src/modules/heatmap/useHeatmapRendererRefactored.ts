/**
 * Refactored Heatmap Renderer Hook
 * Orchestrates initialization, accumulation, and effects
 * Now split into focused, reusable sub-hooks
 */
import { useHeatmapInitialization } from './hooks/useHeatmapInitialization';
import { useHeatmapAccumulation } from './hooks/useHeatmapAccumulation';
import { useHeatmapEffects } from './hooks/useHeatmapEffects';
import type { HeatmapModelData } from './types';

export function useHeatmapRendererRefactored(
  modelData: HeatmapModelData | null,
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
  // Initialize render targets, scenes, and materials
  const refs = useHeatmapInitialization(
    modelData,
    glbScene,
    usePlaneGeometry,
    radius,
    maxHeat,
    minHeat,
    gradientStyle,
    useTransparency
  );

  // Handle frame-by-frame heat accumulation
  useHeatmapAccumulation(
    refs,
    modelData,
    activeBuffer,
    playback,
    shouldAccumulate,
    minHeat,
    maxHeat
  );

  // Handle side effects (visibility, reset, material updates)
  useHeatmapEffects(
    refs,
    modelData,
    glbScene,
    usePlaneGeometry,
    isVisible,
    playback,
    () => {
      // Reset callback - reinitialize on reset
      // This is a no-op since useHeatmapInitialization already handles this
    },
    {
      useTransparency,
      minHeat,
      maxHeat,
      gradientStyle
    }
  );
}
