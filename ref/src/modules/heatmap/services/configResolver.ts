/**
 * Configuration Resolution Service
 * Resolves effective layer configuration by merging store state with props
 */
import type { LayerConfig, EffectiveLayerConfig } from '../types';

export interface ConfigResolutionOptions {
  layerConfig?: LayerConfig;
  activeLayer: string;
  currentLayerId: string;
  propRadius?: number;
  propGradient?: string;
  propMinHeat?: number;
  propMaxHeat?: number;
  propUseTransparency?: boolean;
}

/**
 * Resolve effective configuration for a heatmap layer
 * Priority: Store config > Props > Defaults
 * @param options - Configuration sources and state
 * @returns Effective configuration with computed visibility flags
 */
export function resolveLayerConfig(options: ConfigResolutionOptions): EffectiveLayerConfig {
  const {
    layerConfig,
    activeLayer,
    currentLayerId,
    propRadius = 3.0,
    propGradient = 'smooth',
    propMinHeat = 0.0,
    propMaxHeat = 50.0,
    propUseTransparency = true
  } = options;

  // Determine visibility
  const isActiveLayer = activeLayer === currentLayerId;
  const isLayerEnabled = layerConfig?.enabled !== false;
  const isGloballyActive = activeLayer !== 'none';

  return {
    // Configuration values (store > props > defaults)
    radius: layerConfig?.radius ?? propRadius,
    gradient: layerConfig?.gradient ?? propGradient,
    minHeat: layerConfig?.minHeat ?? propMinHeat,
    maxHeat: layerConfig?.maxHeat ?? propMaxHeat,
    useTransparency: layerConfig?.useTransparency ?? propUseTransparency,

    // Computed visibility flags
    shouldAccumulate: isLayerEnabled, // Accumulate when layer is enabled
    shouldDisplay: isActiveLayer && isGloballyActive && isLayerEnabled // Display when active AND enabled
  };
}

/**
 * Get default configuration for a specific layer type
 * @param layerId - Layer identifier
 * @returns Default configuration object
 */
export function getLayerDefaults(layerId: string): Partial<EffectiveLayerConfig> {
  const defaults: Record<string, Partial<EffectiveLayerConfig>> = {
    position: {
      radius: 3.5,
      gradient: 'smooth',
      minHeat: 10.0,
      maxHeat: 150.0,
      useTransparency: true
    },
    lookat: {
      radius: 2.5,
      gradient: 'thermal',
      minHeat: 10.0,
      maxHeat: 60.0,
      useTransparency: true
    },
    linger: {
      radius: 4.0,
      gradient: 'smooth',
      minHeat: 5.0,
      maxHeat: 100.0,
      useTransparency: true
    },
    pause: {
      radius: 3.0,
      gradient: 'stepped',
      minHeat: 5.0,
      maxHeat: 80.0,
      useTransparency: true
    },
    scan: {
      radius: 5.0,
      gradient: 'smooth',
      minHeat: 5.0,
      maxHeat: 120.0,
      useTransparency: true
    }
  };

  return defaults[layerId] || {
    radius: 3.0,
    gradient: 'smooth',
    minHeat: 0.0,
    maxHeat: 50.0,
    useTransparency: true
  };
}
