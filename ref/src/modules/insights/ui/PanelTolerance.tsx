/**
 * ToleranceTuningPanel
 * UI controls for adjusting tolerance parameters in real-time
 */
import { useState, useEffect, useMemo } from 'react';
import { useInsightsStore } from '../insightsStore';
import { DEFAULT_TOLERANCE_CONFIG, ToleranceEngine } from '../core/toleranceEngine';
import { DEFAULT_DETECTION_CONFIG } from '../core/detectionConfig';
import { useDraggable } from './useDraggable';
import { generateSampleEvents } from '../utils/toleranceSamples';
import { SliderControl } from '../../../components/ui/SliderControl';
import { useSliderStyles } from '../../../hooks/useSliderStyles';

// Removed generateSampleEvents - now imported from toleranceSamples.ts

function generateSampleEventsDeprecated(_maxTime = 30) {
  const events = [];
  let time = 0;
  
  // Pattern 1: Short noise events (should be filtered out)
  time = 1.5;
  for (let i = 0; i < 5; i++) {
    const noiseDuration = [0.033, 0.067, 0.1][i % 3]; // Vary between 33ms, 67ms, 100ms
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.167;
  }
  
  // More noise scattered at the beginning
  time = 0.3;
  for (let i = 0; i < 8; i++) {
    const noiseDuration = (i % 3) * 0.033; // 0, 33ms, 67ms durations
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.1;
  }
  
  // Pattern 2: Long duration event (should stay)
  time = 4.5;
  events.push({ start_time: time, end_time: time + 4.0 }); // 4 seconds
  
  // Noise during long event (overlapping)
  time = 5.4;
  for (let i = 0; i < 6; i++) {
    const noiseDuration = 0.033 + (i % 2) * 0.067; // 33ms or 100ms
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.267;
  }
  
  // Pattern 3: Flickering (should merge into one)
  time = 9;
  for (let i = 0; i < 8; i++) {
    events.push({ start_time: time, end_time: time + 0.167 });
    time += 0.233; // Small gaps that should merge
  }
  
  // Pattern 4: Medium duration events with good spacing (should stay separate)
  time = 12;
  events.push({ start_time: time, end_time: time + 1.0 });
  time += 2.0;
  events.push({ start_time: time, end_time: time + 0.83 });
  time += 2.33;
  events.push({ start_time: time, end_time: time + 1.33 });
  
  // Pattern 5: Very short noise spikes (instant, should be filtered)
  time = 19.5;
  for (let i = 0; i < 10; i++) {
    events.push({ start_time: time, end_time: time });
    time += 0.1;
  }
  
  // More scattered noise
  time = 18;
  for (let i = 0; i < 12; i++) {
    const noiseDuration = [0.033, 0.067, 0.1][i % 3]; // Cycle through 33ms, 67ms, 100ms
    events.push({ start_time: time, end_time: time + noiseDuration });
    time += 0.133;
  }
  
  // Pattern 6: High frequency short events (some should filter, some should merge)
  time = 21;
  for (let i = 0; i < 6; i++) {
    events.push({ start_time: time, end_time: time + 0.1 });
    time += 0.133; // Very close together
  }
  
  // More noise near the end
  time = 23.1;
  for (let i = 0; i < 15; i++) {
    events.push({ start_time: time, end_time: time + Math.random() * 0.067 });
    time += 0.067 + Math.random() * 0.1;
  }
  
  // Pattern 7: Long event at the end
  time = 25.5;
  events.push({ start_time: time, end_time: time + 3.33 });
  
  // Final noise burst
  time = 28.8;
  for (let i = 0; i < 8; i++) {
    events.push({ start_time: time, end_time: time });
    time += 0.067;
  }
  
  return events.sort((a, b) => a.start_time - b.start_time);
}

export default function ToleranceTuningPanel({ embedded = false }) {
  const stateManager = useInsightsStore(s => s.stateManager);
  const detectionConfigFromStore = useInsightsStore(s => s.detectionConfig);
  const setDetectionConfigToStore = useInsightsStore(s => s.setDetectionConfig);
  const triggerInsightUpdate = useInsightsStore(s => s.triggerInsightUpdate);
  
  const [expanded, setExpanded] = useState(embedded ? true : false);
  const [selectedState, setSelectedState] = useState('pause');
  const [showPreview, setShowPreview] = useState(true);
  
  const { position, dragHandleProps, isDragging: _isDragging } = useDraggable({ x: 520, y: window.innerHeight - 20 });
  
  // Get current tolerance config from state manager
  const [config, setConfig] = useState(DEFAULT_TOLERANCE_CONFIG);
  
  // Detection config (separate from tolerance) - sync with insightsStore
  const [detectionConfig, setDetectionConfig] = useState(detectionConfigFromStore || DEFAULT_DETECTION_CONFIG);
  
  // Use shared slider styles hook instead of inline CSS injection
  useSliderStyles();
  
  // Sync detection config from insightsStore
  useEffect(() => {
    if (detectionConfigFromStore) {
      setDetectionConfig(detectionConfigFromStore);
    }
  }, [detectionConfigFromStore]);
  
  // Generate sample events for preview
  const sampleEvents = useMemo(() => generateSampleEvents(1000), []);
  
  // Process sample events with current tolerance settings
  const processedSampleEvents = useMemo(() => {
    const engine = new ToleranceEngine(config);
    return engine.clampAndMerge(selectedState, sampleEvents);
  }, [sampleEvents, config, selectedState]);
  
  // Removed Leva-style slider CSS injection - now handled by useSliderStyles hook
  
  useEffect(() => {
    if (stateManager && stateManager.toleranceEngine) {
      setConfig({ ...stateManager.toleranceEngine.config });
    }
  }, [stateManager]);
  
  const stateTypes = [
    { id: 'pause', label: 'Pause', icon: '⏸' },
    { id: 'linger', label: 'Linger', icon: '⏱' },
    { id: 'rush', label: 'Rush', icon: '⚡' },
    { id: 'walk', label: 'Walk', icon: '🐌' },
    { id: 'scan', label: 'Scan', icon: '👀' },
    { id: 'focus', label: 'Focus', icon: '🎯' },
    { id: 'look_up', label: 'Look Up', icon: '⬆️' },
    { id: 'look_down', label: 'Look Down', icon: '⬇️' },
    { id: 'attend', label: 'Attend', icon: '👁' },
    { id: 'occupy', label: 'Occupy', icon: '📦' }
  ];
  
  const updateTolerance = (stateType: any, param: any, value: any) => {
    const newConfig: any = {
      ...config,
      [stateType]: {
        ...(config as any)[stateType],
        [param]: value
      }
    };
    
    setConfig(newConfig);
    
    // Update state manager's tolerance engine
    if (stateManager && stateManager.toleranceEngine) {
      stateManager.toleranceEngine.config = newConfig;
    }
    
    // Trigger update to refresh visualizations immediately
    triggerInsightUpdate();
  };
  
  const updateDetection = (stateType: any, param: any, value: any) => {
    const newConfig: any = {
      ...detectionConfig,
      [stateType]: {
        ...(detectionConfig as any)[stateType],
        [param]: value
      }
    };
    
    setDetectionConfig(newConfig);
    setDetectionConfigToStore(newConfig); // Persist to insightsStore
  };
  
  const resetToDefaults = () => {
    setConfig(DEFAULT_TOLERANCE_CONFIG);
    setDetectionConfig(DEFAULT_DETECTION_CONFIG as any);
    setDetectionConfigToStore(DEFAULT_DETECTION_CONFIG as any); // Reset in insightsStore too
    if (stateManager && stateManager.toleranceEngine) {
      stateManager.toleranceEngine.config = DEFAULT_TOLERANCE_CONFIG;
    }
  };
  
  const currentConfig = (config as any)[selectedState] || {};
  const currentDetectionConfig = (detectionConfig as any)[selectedState] || {};
  
  // Helper to render detection-specific controls
  const renderDetectionControls = () => {
    switch(selectedState) {
      case 'pause':
      case 'linger':
        return (
          <>
            <SliderControl
              label="Velocity Threshold"
              value={currentDetectionConfig.velocity_threshold || 0.3}
              min={0.1}
              max={5}
              step={0.1}
              unit=" m/s"
              onChange={(value) => updateDetection(selectedState, 'velocity_threshold', value)}
            />
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '-8px', marginBottom: '16px' }}>
              Maximum velocity to be considered {selectedState}
            </div>
            
            <SliderControl
              label="Radius Threshold"
              value={currentDetectionConfig.radius_threshold || 2}
              min={0.5}
              max={10}
              step={0.5}
              unit=" m"
              onChange={(value) => updateDetection(selectedState, 'radius_threshold', value)}
            />
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '-8px', marginBottom: '16px' }}>
              Maximum movement radius in meters
            </div>
          </>
        );
        
      case 'scan':
      case 'focus':
        return (
          <>
            <SliderControl
              label="Angular Velocity Threshold"
              value={currentDetectionConfig.angular_velocity_threshold || 110}
              min={10}
              max={300}
              step={5}
              unit=" °/s"
              onChange={(value) => updateDetection(selectedState, 'angular_velocity_threshold', value)}
            />
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '-8px', marginBottom: '16px' }}>
              {selectedState === 'scan' ? 'Above = scanning' : 'Below = focused'}
            </div>
          </>
        );
        
      case 'look_up':
      case 'look_down':
        return (
          <>
            <SliderControl
              label="Angle Min"
              value={currentDetectionConfig.angle_min || 70}
              min={0}
              max={180}
              step={1}
              unit="°"
              onChange={(value) => updateDetection(selectedState, 'angle_min', value)}
            />
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '-8px', marginBottom: '16px' }}>
              Minimum vertical angle (90° = horizontal)
            </div>
            
            <SliderControl
              label="Angle Max"
              value={currentDetectionConfig.angle_max || 120}
              min={0}
              max={180}
              step={1}
              unit="°"
              onChange={(value) => updateDetection(selectedState, 'angle_max', value)}
            />
            <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '-8px', marginBottom: '16px' }}>
              Maximum vertical angle
            </div>
          </>
        );
        
      default:
        return null;
    }
  };
  
  if (!expanded && !embedded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          padding: '8px 12px',
          backgroundColor: '#181c20',
          color: '#f0f0f0',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '11px',
          zIndex: 999
        }}
      >
        ⚙️ Tolerance Tuning
      </button>
    );
  };
  
  return (
    <div style={{
      position: embedded ? 'relative' : 'fixed',
      left: embedded ? 'auto' : `${position.x}px`,
      top: embedded ? 'auto' : `${position.y}px`,
      width: embedded ? '100%' : '320px',
      backgroundColor: embedded ? 'transparent' : '#181c20',
      color: '#f0f0f0',
      borderRadius: embedded ? '0' : '4px',
      fontFamily: 'ui-monospace, SFMono-Regular, Menlo, "Roboto Mono", monospace',
      fontSize: '11px',
      zIndex: 999,
      boxShadow: embedded ? 'none' : '0 4px 12px rgba(0,0,0,0.3)'
    }}>
      {/* Header */}
      {!embedded && (
      <div 
        {...dragHandleProps}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          fontWeight: '500',
          letterSpacing: '0.5px',
          ...(dragHandleProps.style as any)
        }}>
        <div>⚙️ TOLERANCE TUNING</div>
        <button
          onClick={() => setExpanded(false)}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#f0f0f0',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '0 4px'
          }}
        >
          ×
        </button>
      </div>
      )}
      
      {/* State Type Selector */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '10px', opacity: 0.7 }}>
          State Type:
        </label>
        <select
          value={selectedState}
          onChange={(e) => setSelectedState(e.target.value)}
          style={{
            width: '100%',
            padding: '0 8px',
            height: '24px',
            backgroundColor: '#535760',
            color: '#8c92a4',
            border: 'none',
            borderRadius: '2px',
            fontSize: '11px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, "Roboto Mono", monospace',
            cursor: 'pointer',
            outline: 'none'
          }}
        >
          {stateTypes.map(type => (
            <option key={type.id} value={type.id}>
              {type.icon} {type.label}
            </option>
          ))}
        </select>
      </div>
      
      {/* Parameter Controls */}
      <div className="insights-scrollable" style={{ padding: '12px', maxHeight: '400px', overflowY: 'auto' }}>
        {/* Detection Parameters Section */}
        {renderDetectionControls() && (
          <>
            <div style={{ 
              fontSize: '10px', 
              fontWeight: '600', 
              marginBottom: '12px',
              paddingBottom: '6px',
              borderBottom: '1px solid rgba(255,255,255,0.1)',
              color: '#8c92a4',
              textTransform: 'uppercase',
              letterSpacing: '0.5px'
            }}>
              🎯 Detection Settings
            </div>
            {renderDetectionControls()}
          </>
        )}
        
        {/* Tolerance Parameters Section */}
        <div style={{ 
          fontSize: '10px', 
          fontWeight: '600', 
          marginBottom: '12px',
          paddingBottom: '6px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          color: '#8c92a4',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginTop: renderDetectionControls() ? '16px' : '0'
        }}>
          🧹 Tolerance (Cleanup)
        </div>
        
        {/* Min Duration */}
        <SliderControl
          label="Min Duration"
          value={currentConfig.min_duration || 0.15}
          min={0.01}
          max={1.0}
          step={0.01}
          unit="s"
          onChange={(value) => updateTolerance(selectedState, 'min_duration', value)}
        />
        <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '-8px', marginBottom: '16px' }}>
          Minimum duration in seconds to register as an event
        </div>
        
        {/* Merge Window */}
        <SliderControl
          label="Merge Window"
          value={currentConfig.merge_window || 0.1}
          min={0}
          max={0.5}
          step={0.01}
          unit="s"
          onChange={(value) => updateTolerance(selectedState, 'merge_window', value)}
        />
        <div style={{ fontSize: '9px', opacity: 0.5, marginTop: '-8px', marginBottom: '16px' }}>
          Merge events within this many seconds of each other
        </div>
      </div>
      
      {/* Preview Section */}
      <div style={{
        padding: '12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        backgroundColor: 'rgba(0, 0, 0, 0.2)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <label style={{ fontSize: '10px', fontWeight: '500' }}>
            📊 Preview
          </label>
          <button
            onClick={() => setShowPreview(!showPreview)}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#8c92a4',
              cursor: 'pointer',
              fontSize: '10px',
              padding: '0'
            }}
          >
            {showPreview ? '▼' : '▶'}
          </button>
        </div>
        
        {showPreview && (
          <div>
            {/* Stats */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '8px',
              fontSize: '9px',
              color: '#8c92a4'
            }}>
              <div>Raw: {sampleEvents.length} events</div>
              <div>→</div>
              <div style={{ color: '#4488ff' }}>Processed: {processedSampleEvents.length} events</div>
            </div>
            
            {/* Raw Events Timeline */}
            <div style={{ marginBottom: '10px' }}>
              <div style={{ fontSize: '9px', marginBottom: '3px', color: '#8c92a4' }}>
                Before (Raw):
              </div>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '20px',
                background: 'rgba(100, 100, 100, 0.2)',
                borderRadius: '2px'
              }}>
                {sampleEvents.map((event, i) => {
                  const left = (event.start_time / 30) * 100;
                  const width = Math.max(0.5, ((event.end_time - event.start_time) / 30) * 100);
                  return (
                    <div
                      key={`raw-${i}`}
                      title={`${event.start_time.toFixed(2)}s-${event.end_time.toFixed(2)}s (${(event.end_time - event.start_time).toFixed(3)}s)`}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        height: '100%',
                        background: '#888',
                        borderRadius: '1px',
                        opacity: 0.6
                      }}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Processed Events Timeline */}
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '9px', marginBottom: '3px', color: '#4488ff' }}>
                After (Cleaned):
              </div>
              <div style={{
                position: 'relative',
                width: '100%',
                height: '20px',
                background: 'rgba(100, 100, 100, 0.2)',
                borderRadius: '2px'
              }}>
                {processedSampleEvents.map((event, i) => {
                  const left = (event.start_time / 30) * 100;
                  const width = Math.max(0.5, ((event.end_time - event.start_time) / 30) * 100);
                  return (
                    <div
                      key={`processed-${i}`}
                      title={`${event.start_time.toFixed(2)}s-${event.end_time.toFixed(2)}s (${(event.end_time - event.start_time).toFixed(3)}s)`}
                      style={{
                        position: 'absolute',
                        left: `${left}%`,
                        width: `${width}%`,
                        height: '100%',
                        background: '#4488ff',
                        borderRadius: '1px',
                        opacity: 0.8
                      }}
                    />
                  );
                })}
              </div>
            </div>
            
            {/* Legend */}
            <div style={{
              marginTop: '8px',
              fontSize: '8px',
              color: '#8c92a4',
              opacity: 0.7
            }}>
              Shows: noise filtering, gap merging, min duration
            </div>
          </div>
        )}
      </div>
      
      {/* Actions */}
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
        display: 'flex',
        gap: '8px'
      }}>
        <button
          onClick={resetToDefaults}
          style={{
            flex: 1,
            padding: '6px',
            backgroundColor: '#2d3135',
            color: '#f0f0f0',
            border: '1px solid #3d4148',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '10px'
          }}
        >
          Reset to Defaults
        </button>
      </div>
    </div>
  );
}
