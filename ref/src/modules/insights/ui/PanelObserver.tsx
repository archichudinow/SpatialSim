/**
 * ObserverDebugPanel
 * UI for adding/removing observer objects with click-to-place workflow
 * 1. Click Add Region/Radius/Path Observer
 * 2. Click in world to place
 * 3. Name and configure
 * 4. Save
 */
import { useState, useEffect } from 'react';
import { useAppState } from '../../../AppState';
import { useInsightsStore } from '../insightsStore';
import { createBoxObserver, createCylinderObserver } from '../core/observerTypes';
import { SliderControl } from '../../../components/ui/SliderControl';
import { useSliderStyles } from '../../../hooks/useSliderStyles';

export default function ObserverDebugPanel({ embedded = false }) {
  // Insights state from separate store
  const observers = useInsightsStore(s => s.observers);
  const addObserver = useInsightsStore(s => s.addObserver);
  const removeObserver = useInsightsStore(s => s.removeObserver);
  const insightsWindowOpen = useInsightsStore(s => s.insightsWindowOpen);
  const setInsightsWindowOpen = useInsightsStore(s => s.setInsightsWindowOpen);
  
  const placementMode = useInsightsStore(s => s.placement.mode);
  const placementPosition = useInsightsStore(s => s.placement.position);
  const placementIsLocked = useInsightsStore(s => s.placement.isLocked);
  const setPlacementMode = useInsightsStore(s => s.setPlacementMode);
  const setPlacementPosition = useInsightsStore(s => s.setPlacementPosition);
  const lockPlacement = useInsightsStore(s => s.lockPlacement);
  const setPlacementConfig = useInsightsStore(s => s.setPlacementConfig);
  
  // UI state from global AppState
  const setPickMode = useAppState(s => s.actions.ui.setPickMode);
  
  const [config, setConfig] = useState({
    name: '',
    width: 10,
    height: 4,
    depth: 1,
    radius: 5,
    rotation: 0
  });
  
  // Auto-open the insights window when placement is locked
  useEffect(() => {
    if (placementIsLocked && !insightsWindowOpen) {
      setInsightsWindowOpen(true);
    }
  }, [placementIsLocked]);
  
  // Use shared slider styles hook instead of inline CSS injection
  useSliderStyles('leva-slider-style-observer');
  
  // Helper to update config and sync to AppState for real-time preview
  const updateConfig = (updates: any) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    if (placementIsLocked) {
      setPlacementConfig(newConfig);
    }
  };
  
  const handleStartPlacement = (type: any) => {
    const defaultConfig = {
      name: '',
      width: 10,
      height: 4,
      depth: 1,
      radius: 5,
      rotation: 0
    };
    
    setPlacementMode(type);
    setPlacementPosition(null); // Clear previous position
    setConfig(defaultConfig);
    setPlacementConfig(defaultConfig); // Set initial config for preview
    setPickMode(true);
  };
  
  // This will be called from PlacementHandler component - tracks mouse movement
  (window as any).onObserverPlacement = (position: any) => {
    if (placementMode && !placementIsLocked) {
      // Update position while following mouse
      setPlacementPosition(position);
    }
  };
  
  // This will be called when user clicks to lock position
  (window as any).onObserverPlacementLock = (position: any) => {
    if (placementMode && !placementIsLocked) {
      lockPlacement(position);  // Use the new lockPlacement action
      setPickMode(false);         // Stop picking
      
      // Set default name
      const count = observers.length + 1;
      setConfig(prev => ({
        ...prev,
        name: `${placementMode}_${count}`
      }));
    }
  };
  
  const handleSave = () => {
    if (!placementPosition) return;
    
    let observer;
    
    if (placementMode === 'box') {
      observer = createBoxObserver({
        id: config.name || `box_${Date.now()}`,
        width: config.width,
        height: config.height,
        depth: config.depth,
        position: { x: placementPosition.x, y: config.height / 2, z: placementPosition.z },  // Collision at ground
        rotation: { x: 0, y: config.rotation * (Math.PI / 180), z: 0 }
      });
    } else if (placementMode === 'cylinder') {
      observer = createCylinderObserver({
        id: config.name || `cylinder_${Date.now()}`,
        radius: config.radius,
        height: config.height,
        position: { x: placementPosition.x, y: config.height / 2, z: placementPosition.z },  // Collision at ground
        rotation: { x: 0, y: config.rotation * (Math.PI / 180), z: 0 }
      });
    }
    
    if (observer) {
      addObserver(observer as any);
    }
    
    // Reset state
    setPlacementMode(null);
    setPlacementPosition(null);
    setPlacementConfig(null);
    setConfig({
      name: '',
      width: 10,
      height: 4,
      depth: 1,
      radius: 5,
      rotation: 0
    });
    setPickMode(false);
  };
  
  const handleCancel = () => {
    setPlacementMode(null);
    setPlacementPosition(null);
    setPlacementConfig(null);
    setPickMode(false);
  };
  
  const handleRemove = (observerId: any) => {
    removeObserver(observerId);
  };
  
  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      bottom: embedded ? 'auto' : 10,
      right: embedded ? 'auto' : 10,
      width: embedded ? '100%' : 280,
      background: embedded ? 'transparent' : '#181c20',
      color: '#f0f0f0',
      borderRadius: embedded ? 0 : 4,
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      fontSize: 11,
      zIndex: embedded ? 'auto' : 1000,
      boxShadow: embedded ? 'none' : '0 0 0 1px rgba(0,0,0,0.1)'
    }}>
      {!embedded && (
      <div style={{ 
        fontWeight: '500', 
        fontSize: 11,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        color: '#fff',
        letterSpacing: '0.5px'
      }}>
        OBSERVER PANEL
      </div>
      )}
      
      <div>
      
      {!placementIsLocked && !placementMode && (
        <>
          <div style={{ marginBottom: 8, display: 'flex', gap: 6 }}>
            <button
              onClick={() => handleStartPlacement('box')}
              style={{
                flex: 1,
                padding: '6px 10px',
                cursor: 'pointer',
                background: '#007bff',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                fontSize: 11,
                fontWeight: '500'
              }}
            >
              Add Region Observer
            </button>
            <button
              onClick={() => handleStartPlacement('cylinder')}
              style={{
                flex: 1,
                padding: '6px 10px',
                cursor: 'pointer',
                background: '#007bff',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                fontSize: 11,
                fontWeight: '500'
              }}
            >
              Add Radius Observer
            </button>
            <button
              disabled={true}
              style={{
                flex: 1,
                padding: '6px 10px',
                cursor: 'not-allowed',
                background: '#2a2e32',
                border: 'none',
                borderRadius: 4,
                color: 'rgba(255,255,255,0.3)',
                fontSize: 11,
                fontWeight: '500'
              }}
            >
              Add Path Observer
            </button>
          </div>
          
          <div className="insights-scrollable" style={{ marginBottom: 8, maxHeight: 150, overflowY: 'auto' }}>
            <div style={{ fontSize: 10, marginBottom: 6, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Observers ({observers.length})
            </div>
            {observers.map(obs => (
              <div key={obs.id} style={{
                padding: '6px 8px',
                background: 'rgba(255,255,255,0.06)',
                marginBottom: 2,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderLeft: '2px solid #3e9eff'
              }}>
                <span style={{ fontSize: 10 }}>
                  {obs.type}: {obs.id}
                </span>
                <button
                  onClick={() => handleRemove(obs.id)}
                  style={{
                    padding: '2px 6px',
                    cursor: 'pointer',
                    background: 'transparent',
                    border: 'none',
                    color: 'rgba(255,255,255,0.5)',
                    fontSize: 14,
                    lineHeight: 1
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </>
      )}
      
      {placementMode && !placementIsLocked && (
        <div style={{ padding: 10, background: 'rgba(76, 175, 80, 0.2)', borderRadius: 4 }}>
          <div style={{ marginBottom: 8 }}>
            Click in the world to place {placementMode}
          </div>
          <button
            onClick={handleCancel}
            style={{
              padding: '5px 10px',
              cursor: 'pointer',
              background: '#666',
              border: 'none',
              borderRadius: 4,
              color: 'white',
              width: '100%',
              fontSize: 11
            }}
          >
            Cancel
          </button>
        </div>
      )}
      
      {placementIsLocked && (
        <div className="insights-scrollable" style={{ maxHeight: 350, overflowY: 'auto' }}>
          <div style={{ fontSize: 11, marginBottom: 10, opacity: 0.7 }}>
            Configure {placementMode}:
          </div>
          
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>Name:</label>
            <input
              type="text"
              value={config.name}
              onChange={(e) => updateConfig({ name: e.target.value })}
              style={{
                width: '100%',
                padding: '0 8px',
                height: '24px',
                background: '#535760',
                color: '#f0f0f0',
                border: 'none',
                borderRadius: 2,
                fontSize: 11,
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, "Roboto Mono", monospace',
                outline: 'none'
              }}
            />
          </div>
          
          {placementMode === 'box' && (
            <>
              <SliderControl
                label="Width"
                value={config.width}
                min={1}
                max={40}
                step={0.5}
                unit="m"
                onChange={(value) => updateConfig({ width: value })}
              />
              
              <SliderControl
                label="Height"
                value={config.height}
                min={1}
                max={40}
                step={0.5}
                unit="m"
                onChange={(value) => updateConfig({ height: value })}
              />
              
              <SliderControl
                label="Depth"
                  </label>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>
                    {config.depth}m
                  </span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="20"
                  step="0.25"
                  value={config.depth}
                  onChange={(e) => updateConfig({ depth: parseFloat(e.target.value) })}
                  className="leva-slider"
                />
              </div>
            </>
          )}
          
          {placementMode === 'cylinder' && (
            <>
              <SliderControl
                label="Radius"
                value={config.radius}
                min={1}
                max={40}
                step={0.5}
                unit={`m (⌀ ${(config.radius * 2).toFixed(1)}m)`}
                onChange={(value) => updateConfig({ radius: value })}
              />
              
              <SliderControl
                label="Height"
                value={config.height}
                min={1}
                max={40}
                step={0.5}
                unit="m"
                onChange={(value) => updateConfig({ height: value })}
              />
            </>
          )}
          
          <SliderControl
            label="Rotation"
            value={config.rotation}
            min={0}
            max={360}
            step={5}
            unit="°"
            onChange={(value) => updateConfig({ rotation: value })}
          />
          
          <div style={{ display: 'flex', gap: 5 }}>
            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: '6px 10px',
                cursor: 'pointer',
                background: '#007bff',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                fontSize: 11,
                fontWeight: 'bold'
              }}
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '6px 10px',
                cursor: 'pointer',
                background: '#666',
                border: 'none',
                borderRadius: 4,
                color: 'white',
                fontSize: 11
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}      </div>    </div>
  );
}
