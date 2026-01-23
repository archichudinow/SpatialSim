/**
 * Heatmap Module Store
 * Separate store for heatmap-specific state
 * Layer configurations auto-initialized from eventTypes registry
 */
import { create } from 'zustand';
import { initializeLayerConfigs } from '../../config/eventTypes';

interface LayerConfig {
  enabled: boolean;
  intensity: number;
  radius: number;
  [key: string]: any;
}

interface HeatmapState {
  activeLayer: string;
  layers: Record<string, LayerConfig>;
  setActiveLayer: (layerName: string) => void;
  setLayerConfig: (layerName: string, config: Partial<LayerConfig>) => void;
  toggleLayerEnabled: (layerName: string) => void;
}

export const useHeatmapStore = create<HeatmapState>((set) => ({
  // Active layer
  activeLayer: 'none', // 'none' | event type name from registry
  
  // Layer configurations (auto-initialized from registry)
  layers: initializeLayerConfigs() as unknown as Record<string, LayerConfig>,
  
  // Actions
  setActiveLayer: (layerName) => set({ activeLayer: layerName }),
  
  setLayerConfig: (layerName, config) => set((state) => ({
    layers: {
      ...state.layers,
      [layerName]: { ...state.layers[layerName], ...config }
    }
  })),
  
  toggleLayerEnabled: (layerName) => set((state) => ({
    layers: {
      ...state.layers,
      [layerName]: {
        ...state.layers[layerName],
        enabled: !state.layers[layerName].enabled
      }
    }
  }))
}));
