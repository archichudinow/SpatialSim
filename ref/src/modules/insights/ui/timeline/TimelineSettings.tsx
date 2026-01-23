import React, { useState } from 'react';

export const TimelineSettings = React.memo(function TimelineSettings({
  selectedStateType,
  detectionConfig,
  setDetectionConfig,
  toleranceConfig,
  setToleranceConfig,
  stateManager
}: any) {
  const [toleranceExpanded, setToleranceExpanded] = useState(false);

  return (
    <div style={{
      marginBottom: '8px',
      padding: '4px 6px',
      background: 'rgba(255, 255, 255, 0.03)',
      borderRadius: '4px',
      fontSize: '10px'
    }}>
      <div
        onClick={() => setToleranceExpanded(!toleranceExpanded)}
        style={{
          color: '#aaa',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '2px 0',
          userSelect: 'none'
        }}
      >
        <span style={{ fontSize: '11px' }}>{toleranceExpanded ? '▼' : '▶'}</span>
        <strong>Tolerance:</strong>
        <span style={{ fontSize: '9px', color: '#666' }}>
          {selectedStateType}
        </span>
      </div>

      {toleranceExpanded && (
        <div style={{
          marginTop: '6px',
          paddingLeft: '2px',
          paddingBottom: '8px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Detection Settings Section */}
          {detectionConfig[selectedStateType] && Object.keys(detectionConfig[selectedStateType]).length > 0 && (
            <div style={{ 
              paddingBottom: '8px', 
              borderBottom: '1px solid rgba(255, 255, 255, 0.05)'
            }}>
              <div style={{ 
                fontSize: '9px', 
                color: '#8c92a4', 
                textTransform: 'uppercase',
                marginBottom: '8px',
                fontWeight: '600'
              }}>
                Detection
              </div>
              
              {/* Velocity Threshold */}
              {detectionConfig[selectedStateType]?.velocity_threshold !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <label style={{ color: '#aaa' }}>Velocity Threshold</label>
                    <span style={{ color: '#666' }}>
                      {(detectionConfig[selectedStateType]?.velocity_threshold || 0).toFixed(1)} m/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={detectionConfig[selectedStateType]?.velocity_threshold || 0}
                    onChange={(e) => {
                      const newConfig = { ...detectionConfig };
                      if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                      newConfig[selectedStateType].velocity_threshold = parseFloat(e.target.value);
                      setDetectionConfig(newConfig);
                      if (stateManager) {
                        stateManager.detectionConfig = newConfig;
                      }
                    }}
                    className="leva-slider"
                    style={{ width: '100%', height: '8px', margin: '0' }}
                  />
                </div>
              )}
              
              {/* Radius Threshold */}
              {detectionConfig[selectedStateType]?.radius_threshold !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <label style={{ color: '#aaa' }}>Radius Threshold</label>
                    <span style={{ color: '#666' }}>
                      {(detectionConfig[selectedStateType]?.radius_threshold || 0).toFixed(1)} m
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="10"
                    step="0.5"
                    value={detectionConfig[selectedStateType]?.radius_threshold || 0}
                    onChange={(e) => {
                      const newConfig = { ...detectionConfig };
                      if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                      newConfig[selectedStateType].radius_threshold = parseFloat(e.target.value);
                      setDetectionConfig(newConfig);
                      if (stateManager) {
                        stateManager.detectionConfig = newConfig;
                      }
                    }}
                    className="leva-slider"
                    style={{ width: '100%', height: '8px', margin: '0' }}
                  />
                </div>
              )}
              
              {/* Angular Velocity Threshold */}
              {detectionConfig[selectedStateType]?.angular_velocity_threshold !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <label style={{ color: '#aaa' }}>Angular Velocity</label>
                    <span style={{ color: '#666' }}>
                      {(detectionConfig[selectedStateType]?.angular_velocity_threshold || 0).toFixed(0)}°/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={detectionConfig[selectedStateType]?.angular_velocity_threshold || 0}
                    onChange={(e) => {
                      const newConfig = { ...detectionConfig };
                      if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                      newConfig[selectedStateType].angular_velocity_threshold = parseFloat(e.target.value);
                      setDetectionConfig(newConfig);
                      if (stateManager) {
                        stateManager.detectionConfig = newConfig;
                      }
                    }}
                    className="leva-slider"
                    style={{ width: '100%', height: '8px', margin: '0' }}
                  />
                </div>
              )}
              
              {/* Angle Min */}
              {detectionConfig[selectedStateType]?.angle_min !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <label style={{ color: '#aaa' }}>Angle Min</label>
                    <span style={{ color: '#666' }}>
                      {(detectionConfig[selectedStateType]?.angle_min || 0).toFixed(0)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="1"
                    value={detectionConfig[selectedStateType]?.angle_min || 0}
                    onChange={(e) => {
                      const newConfig = { ...detectionConfig };
                      if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                      newConfig[selectedStateType].angle_min = parseFloat(e.target.value);
                      setDetectionConfig(newConfig);
                      if (stateManager) {
                        stateManager.detectionConfig = newConfig;
                      }
                    }}
                    className="leva-slider"
                    style={{ width: '100%', height: '8px', margin: '0' }}
                  />
                </div>
              )}
              
              {/* Angle Max */}
              {detectionConfig[selectedStateType]?.angle_max !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <label style={{ color: '#aaa' }}>Angle Max</label>
                    <span style={{ color: '#666' }}>
                      {(detectionConfig[selectedStateType]?.angle_max || 0).toFixed(0)}°
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="180"
                    step="1"
                    value={detectionConfig[selectedStateType]?.angle_max || 0}
                    onChange={(e) => {
                      const newConfig = { ...detectionConfig };
                      if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                      newConfig[selectedStateType].angle_max = parseFloat(e.target.value);
                      setDetectionConfig(newConfig);
                      if (stateManager) {
                        stateManager.detectionConfig = newConfig;
                      }
                    }}
                    className="leva-slider"
                    style={{ width: '100%', height: '8px', margin: '0' }}
                  />
                </div>
              )}
              
              {/* Velocity Min/Max for walk */}
              {detectionConfig[selectedStateType]?.velocity_min !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <label style={{ color: '#aaa' }}>Velocity Min</label>
                    <span style={{ color: '#666' }}>
                      {(detectionConfig[selectedStateType]?.velocity_min || 0).toFixed(1)} m/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="5"
                    step="0.1"
                    value={detectionConfig[selectedStateType]?.velocity_min || 0}
                    onChange={(e) => {
                      const newConfig = { ...detectionConfig };
                      if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                      newConfig[selectedStateType].velocity_min = parseFloat(e.target.value);
                      setDetectionConfig(newConfig);
                      if (stateManager) {
                        stateManager.detectionConfig = newConfig;
                      }
                    }}
                    className="leva-slider"
                    style={{ width: '100%', height: '8px', margin: '0' }}
                  />
                </div>
              )}
              
              {detectionConfig[selectedStateType]?.velocity_max !== undefined && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                    <label style={{ color: '#aaa' }}>Velocity Max</label>
                    <span style={{ color: '#666' }}>
                      {(detectionConfig[selectedStateType]?.velocity_max || 0).toFixed(1)} m/s
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="10"
                    step="0.1"
                    value={detectionConfig[selectedStateType]?.velocity_max || 0}
                    onChange={(e) => {
                      const newConfig = { ...detectionConfig };
                      if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                      newConfig[selectedStateType].velocity_max = parseFloat(e.target.value);
                      setDetectionConfig(newConfig);
                      if (stateManager) {
                        stateManager.detectionConfig = newConfig;
                      }
                    }}
                    className="leva-slider"
                    style={{ width: '100%', height: '8px', margin: '0' }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Tolerance Settings Section */}
          <div>
            <div style={{ 
              fontSize: '9px', 
              color: '#8c92a4', 
              textTransform: 'uppercase',
              marginBottom: '6px',
              fontWeight: '600'
            }}>
              Tolerance (Cleanup)
            </div>
            
            {/* Min Duration */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <label style={{ color: '#aaa' }}>Min Duration</label>
                <span style={{ color: '#666' }}>
                  {(toleranceConfig[selectedStateType]?.min_duration || 0).toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="10"
                step="0.1"
                value={toleranceConfig[selectedStateType]?.min_duration || 0}
                onChange={(e) => {
                  const newConfig = { ...toleranceConfig };
                  if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                  newConfig[selectedStateType].min_duration = parseFloat(e.target.value);
                  setToleranceConfig(newConfig);
                  if (stateManager && stateManager.toleranceEngine) {
                    stateManager.toleranceEngine.updateConfig(selectedStateType, newConfig[selectedStateType]);
                  }
                }}
                className="leva-slider"
                style={{ width: '100%', height: '8px', margin: '0' }}
              />
            </div>

            {/* Merge Gap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '9px' }}>
                <label style={{ color: '#aaa' }}>Merge Gap</label>
                <span style={{ color: '#666' }}>
                  {(toleranceConfig[selectedStateType]?.merge_window || 0).toFixed(2)}s
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="30"
                step="0.1"
                value={toleranceConfig[selectedStateType]?.merge_window || 0}
                onChange={(e) => {
                  const newConfig = { ...toleranceConfig };
                  if (!newConfig[selectedStateType]) newConfig[selectedStateType] = {};
                  newConfig[selectedStateType].merge_window = parseFloat(e.target.value);
                  setToleranceConfig(newConfig);
                  if (stateManager && stateManager.toleranceEngine) {
                    stateManager.toleranceEngine.updateConfig(selectedStateType, newConfig[selectedStateType]);
                  }
                }}
                className="leva-slider"
                style={{ width: '100%', height: '8px', margin: '0' }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
