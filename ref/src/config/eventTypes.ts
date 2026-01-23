/**
 * Event Types Registry
 * Centralized configuration for all event types that can generate heatmap layers
 * 
 * Adding a new event type:
 * 1. Add entry to EVENT_TYPES with type and bufferType
 * 2. InsightsStore will auto-initialize buffer
 * 3. HeatmapStore will auto-configure layer
 * 4. App.jsx will auto-render HeatmapModule
 */
import { STATIC_LAYER_CONFIGS } from './heatmapConfig';

/**
 * Buffer type for event data storage
 */
export const BUFFER_TYPE = {
  MAP: 'map' as const,      // Map<agentId, {position, intensity}> for duration events
  SET: 'set' as const       // Set<agentId> for point/trigger events
};

export type BufferType = typeof BUFFER_TYPE[keyof typeof BUFFER_TYPE];

interface LayerConfig {
  enabled: boolean;
  radius: number;
  gradient: string;
  minHeat: number;
  maxHeat: number;
  useTransparency: boolean;
}

interface EventTypeConfig {
  name: string;
  label: string;
  description: string;
  bufferType: BufferType;
  defaultConfig: LayerConfig;
}

/**
 * Event type definitions
 * Each event can generate a heatmap layer
 */
export const EVENT_TYPES: Record<string, EventTypeConfig> = {
  // Duration-based events (stored as Maps with position + intensity)
  LINGER: {
    name: 'linger',
    label: 'Linger/Dwell',
    description: 'Agents dwelling or lingering in place',
    bufferType: BUFFER_TYPE.MAP,
    defaultConfig: {
      enabled: true,
      radius: 15.0,
      gradient: 'steppedMonochromeOrangeOutlined',
      minHeat: 200.0,
      maxHeat: 600.0,
      useTransparency: true
    }
  },
  
  PAUSE: {
    name: 'pause',
    label: 'Pause/Stop',
    description: 'Agents paused or stopped',
    bufferType: BUFFER_TYPE.MAP,
    defaultConfig: {
      enabled: true,
      radius: 6.0,
      gradient: 'steppedMonochromeRedOutlined',
      minHeat: 10.0,
      maxHeat: 300.0,
      useTransparency: true
    }
  },
  
  SCAN: {
    name: 'scan',
    label: 'Look Around/Scan',
    description: 'Agents rapidly scanning environment',
    bufferType: BUFFER_TYPE.MAP,
    defaultConfig: {
      enabled: true,
      radius: 10.0,
      gradient: 'steppedMonochromeBlueOutlined',
      minHeat: 5.0,
      maxHeat: 70.0,
      useTransparency: true
    }
  },
  
  // Point-based events (stored as Sets of agent IDs)
  NOTICED: {
    name: 'noticed',
    label: 'Noticed/Entered',
    description: 'Agents that triggered observation',
    bufferType: BUFFER_TYPE.SET,
    defaultConfig: {
      enabled: true,
      radius: 3.0,
      gradient: 'smooth',
      minHeat: 300.0,
      maxHeat: 1000.0,
      useTransparency: true
    }
  }
};

/**
 * Get list of all event type names
 */
export function getEventTypeNames(): string[] {
  return Object.values(EVENT_TYPES).map(type => type.name);
}

/**
 * Get event type configuration by name
 */
export function getEventType(name: string): EventTypeConfig | null {
  return Object.values(EVENT_TYPES).find(type => type.name === name) || null;
}

/**
 * Initialize event buffers from registry
 */
export function initializeEventBuffers(): Record<string, Map<number, any> | Set<number>> {
  const buffers: Record<string, Map<number, any> | Set<number>> = {};
  
  for (const eventType of Object.values(EVENT_TYPES)) {
    if (eventType.bufferType === BUFFER_TYPE.MAP) {
      buffers[eventType.name] = new Map();
    } else if (eventType.bufferType === BUFFER_TYPE.SET) {
      buffers[eventType.name] = new Set();
    }
  }
  
  return buffers;
}

/**
 * Initialize heatmap layer configurations from registry
 */
export function initializeLayerConfigs(): Record<string, LayerConfig> {
  const layers: Record<string, LayerConfig> = {
    // Static layers (not event-based) - imported from heatmapConfig
    ...STATIC_LAYER_CONFIGS
  };
  
  // Add event-based layers
  for (const eventType of Object.values(EVENT_TYPES)) {
    layers[eventType.name] = { ...eventType.defaultConfig };
  }
  
  return layers;
}
