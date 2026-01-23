/**
 * Practical Examples for Heatmap Module Refactoring
 * 
 * This file demonstrates various usage patterns for the refactored heatmap module.
 */

import { useEffect, useRef } from 'react';
import HeatmapModule from './HeatmapModuleRefactored';
import { selectLayerBuffer, isEventBasedLayer, shouldUsePlaneGeometry } from './services/bufferSelector';
import { resolveLayerConfig, getLayerDefaults } from './services/configResolver';
import { updateDisplayMaterials, updateMaterialUniforms, disposeMaterials } from './services/materialManager';
import { useHeatmapInitialization, useHeatmapAccumulation, useHeatmapEffects } from './hooks';
import { useHeatmapStore } from './heatmapStore';
import type { AgentData } from '../../types';

// ============================================================================
// Example 1: Basic Usage - Drop-in Replacement
// ============================================================================

function BasicExample({ agents, time, posBuffer, lookBuffer }: any) {
  return (
    <HeatmapModule
      agents={agents}
      currentTime={time}
      positionBuffer={posBuffer}
      lookAtBuffer={lookBuffer}
      id="position"
    />
  );
}

// ============================================================================
// Example 2: Using Buffer Selector Independently
// ============================================================================

function BufferAnalyzer({ layerId, buffers, eventData, agents }: any) {
  // Select appropriate buffer for layer
  const buffer = selectLayerBuffer({
    layerId,
    agentBuffer: null,
    positionBuffer: buffers.position,
    lookAtBuffer: buffers.lookAt,
    eventData,
    agents
  });

  // Check if layer uses events
  const usesEvents = isEventBasedLayer(layerId);

  console.log(`Layer ${layerId}:`);
  console.log(`  Buffer length: ${buffer.length}`);
  console.log(`  Uses events: ${usesEvents}`);

  return null;
}

// ============================================================================
// Example 3: Using Config Resolver for Dynamic UI
// ============================================================================

function LayerConfigDisplay({ layerId }: { layerId: string }) {
  const activeLayer = useHeatmapStore(s => s.activeLayer);
  const layerConfig = useHeatmapStore(s => s.layers[layerId]);
  
  // Get defaults
  const defaults = getLayerDefaults(layerId);
  
  // Resolve effective config
  const config = resolveLayerConfig({
    layerConfig,
    activeLayer,
    currentLayerId: layerId,
    propRadius: defaults.radius,
    propGradient: defaults.gradient,
    propMinHeat: defaults.minHeat,
    propMaxHeat: defaults.maxHeat,
    propUseTransparency: defaults.useTransparency
  });

  return (
    <div className="layer-config">
      <h3>{layerId}</h3>
      <p>Radius: {config.radius}</p>
      <p>Gradient: {config.gradient}</p>
      <p>Range: {config.minHeat} - {config.maxHeat}</p>
      <p>Visible: {config.shouldDisplay ? 'Yes' : 'No'}</p>
      <p>Accumulating: {config.shouldAccumulate ? 'Yes' : 'No'}</p>
    </div>
  );
}

// ============================================================================
// Example 4: Using Material Manager for Custom Visualization
// ============================================================================

function CustomHeatmapVisualizer({ modelData, heatTexture, settings }: any) {

  // Update materials when settings change
  useEffect(() => {
    if (!modelData || !heatTexture) return;

    updateDisplayMaterials(
      modelData,
      heatTexture,
      settings.maxHeat,
      settings.useTransparency,
      settings.minHeat,
      settings.gradient
    );
  }, [modelData, heatTexture, settings]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (modelData) {
        disposeMaterials(modelData);
      }
    };
  }, [modelData]);

  return null;
}

// ============================================================================
// Example 5: Custom Heatmap Component Using Hooks
// ============================================================================

function CustomHeatmap({
  modelData,
  buffer,
  playback,
  scene,
  config
}: any) {
  // Initialize heatmap rendering
  const refs = useHeatmapInitialization(
    modelData,
    scene,
    config.usePlaneGeometry,
    config.radius,
    config.maxHeat,
    config.minHeat,
    config.gradient,
    config.useTransparency
  );

  // Handle accumulation
  useHeatmapAccumulation(
    refs,
    modelData,
    buffer,
    playback,
    config.shouldAccumulate,
    config.minHeat,
    config.maxHeat
  );

  // Handle side effects
  useHeatmapEffects(
    refs,
    modelData,
    scene,
    config.usePlaneGeometry,
    config.isVisible,
    playback,
    () => {
      console.log('Heatmap reset');
    },
    {
      useTransparency: config.useTransparency,
      minHeat: config.minHeat,
      maxHeat: config.maxHeat,
      gradientStyle: config.gradient
    }
  );

  return null;
}

// ============================================================================
// Example 6: Layer Switcher Component
// ============================================================================

function LayerSwitcher({ layers }: { layers: string[] }) {
  const { setActiveLayer } = useHeatmapStore();

  return (
    <div className="layer-switcher">
      {layers.map(layerId => {
        const usesPlane = shouldUsePlaneGeometry(layerId);
        return (
          <button
            key={layerId}
            onClick={() => setActiveLayer(layerId)}
          >
            {layerId}
            <span className="geometry-badge">
              {usesPlane ? 'Plane' : 'Mesh'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// Example 7: Testing Utility Function
// ============================================================================

/**
 * Utility to validate buffer data for a layer
 * Exported for use in other components
 */
export function validateLayerBuffer(
  layerId: string,
  buffers: any,
  agents: AgentData[]
): { valid: boolean; message: string } {
  try {
    const buffer = selectLayerBuffer({
      layerId,
      agentBuffer: null,
      positionBuffer: buffers.position,
      lookAtBuffer: buffers.lookAt,
      eventData: buffers.events?.[layerId],
      agents
    });

    if (buffer.length === 0) {
      return { valid: false, message: 'Buffer is empty' };
    }

    if (buffer.length % 3 !== 0) {
      return { valid: false, message: 'Buffer length not divisible by 3' };
    }

    return { valid: true, message: 'Buffer valid' };
  } catch (error) {
    return { valid: false, message: `Error: ${error}` };
  }
}

// ============================================================================
// Example 8: Performance Monitoring
// ============================================================================

function PerformanceOptimizedHeatmap({
  modelData,
  minHeat,
  maxHeat,
  heatTexture
}: any) {
  const lastUpdateRef = useRef({ minHeat: 0, maxHeat: 0 });

  useEffect(() => {
    if (!modelData) return;

    const last = lastUpdateRef.current;
    
    // Only update if values actually changed
    if (last.minHeat === minHeat && last.maxHeat === maxHeat) {
      return;
    }

    const startTime = performance.now();

    // Use efficient uniform update
    updateMaterialUniforms(modelData, {
      heatTex: heatTexture,
      minHeat,
      maxHeat
    });

    const duration = performance.now() - startTime;
    console.log(`Material update took ${duration.toFixed(2)}ms`);

    lastUpdateRef.current = { minHeat, maxHeat };
  }, [modelData, minHeat, maxHeat, heatTexture]);

  return null;
}

// ============================================================================
// Example 9: Multi-Layer Manager
// ============================================================================

function MultiLayerHeatmapManager({
  layers,
  agents,
  currentTime,
  buffers
}: any) {
  return (
    <>
      {layers.map((layerId: string) => (
        <HeatmapModule
          key={layerId}
          id={layerId}
          agents={agents}
          currentTime={currentTime}
          positionBuffer={buffers.position}
          lookAtBuffer={buffers.lookAt}
          eventData={buffers.events?.[layerId]}
        />
      ))}
    </>
  );
}

// ============================================================================
// Example 10: Debug Component
// ============================================================================

function HeatmapDebugPanel({ layerId }: { layerId: string }) {
  const layerConfig = useHeatmapStore(s => s.layers[layerId]);
  const activeLayer = useHeatmapStore(s => s.activeLayer);
  const defaults = getLayerDefaults(layerId);

  return (
    <div className="debug-panel">
      <h4>Layer: {layerId}</h4>
      <table>
        <tbody>
          <tr>
            <td>Type:</td>
            <td>{isEventBasedLayer(layerId) ? 'Event-based' : 'Continuous'}</td>
          </tr>
          <tr>
            <td>Active:</td>
            <td>{activeLayer === layerId ? 'Yes' : 'No'}</td>
          </tr>
          <tr>
            <td>Enabled:</td>
            <td>{layerConfig?.enabled ? 'Yes' : 'No'}</td>
          </tr>
          <tr>
            <td>Radius:</td>
            <td>{layerConfig?.radius ?? defaults.radius}</td>
          </tr>
          <tr>
            <td>Gradient:</td>
            <td>{layerConfig?.gradient ?? defaults.gradient}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// Export examples and utilities
export {
  BasicExample,
  BufferAnalyzer,
  LayerConfigDisplay,
  CustomHeatmapVisualizer,
  CustomHeatmap,
  LayerSwitcher,
  PerformanceOptimizedHeatmap,
  MultiLayerHeatmapManager,
  HeatmapDebugPanel
};
