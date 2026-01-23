/**
 * ObserverSetting
 * Settings panel for observer configuration
 * Displays and allows editing of observer properties with same styling as PanelObserver
 */
import { useState, useEffect } from 'react';
import { useInsightsStore } from '../insightsStore';

export default function ObserverSetting({ observer, onBack }: { observer: any; onBack: () => void }) {
  const updateObserver = useInsightsStore(s => s.updateObserver);
  const removeObserver = useInsightsStore(s => s.removeObserver);
  const removeNewlyCreatedObserver = useInsightsStore(s => s.removeNewlyCreatedObserver);
  
  const [settings, setSettings] = useState({
    name: observer.name || observer.id,
    width: observer.volume.width,
    height: observer.volume.height,
    depth: observer.volume.depth,
    radius: observer.volume.radius,
    rotation: (observer.volume.rotation?.y || 0) * (180 / Math.PI)
  });

  // Inject Leva-style slider CSS
  useEffect(() => {
    const styleId = 'leva-slider-style-settings';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .leva-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #2b2d30;
          outline: none;
        }
        
        .leva-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px;
          height: 16px;
          border-radius: 2px;
          background: #007bff;
          cursor: pointer;
        }
        
        .leva-slider::-moz-range-thumb {
          width: 8px;
          height: 16px;
          border-radius: 2px;
          background: #007bff;
          cursor: pointer;
          border: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  if (!observer) {
    return null;
  }

  const isBox = observer.type === 'box';
  const isCylinder = observer.type === 'cylinder';

  const updateConfig = (updates: any) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    // Update the actual observer in real-time for preview
    const updatedObserver = {
      name: newSettings.name,
      volume: {
        ...observer.volume,
        ...(isBox && {
          width: newSettings.width,
          height: newSettings.height,
          depth: newSettings.depth
        }),
        ...(isCylinder && {
          radius: newSettings.radius,
          height: newSettings.height
        }),
        position: {
          x: observer.volume.position.x,
          y: newSettings.height / 2,
          z: observer.volume.position.z
        },
        rotation: {
          x: observer.volume.rotation?.x || 0,
          y: newSettings.rotation * (Math.PI / 180),
          z: observer.volume.rotation?.z || 0
        }
      },
      face: {
        ...observer.face,
        ...(isBox && {
          width: newSettings.width,
          height: newSettings.height
        }),
        ...(isCylinder && {
          width: newSettings.radius * 2,
          height: newSettings.height
        })
      }
    };
    
    // Update observer in real-time
    updateObserver(observer.id, updatedObserver);
  };

  const handleApply = () => {
    // Changes are already applied in real-time via updateConfig
    // Remove from newly created set
    removeNewlyCreatedObserver(observer.id);
    // Just close the panel
    onBack();
  };

  const handleRemove = () => {
    removeObserver(observer.id);
    removeNewlyCreatedObserver(observer.id);
    onBack();
  };

  return (
    <div
      style={{
        background: '#181c20',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        lineHeight: '1.5',
        minWidth: '280px',
        userSelect: 'none',
        maxHeight: '500px',
        overflowY: 'auto'
      }}
    >
      {/* Name */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
          Name:
        </label>
        <input
          type="text"
          value={settings.name}
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
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Volume Settings */}
      {isBox && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
                Width
              </label>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {settings.width.toFixed(1)}m
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={settings.width}
              onChange={(e) => updateConfig({ width: parseFloat(e.target.value) })}
              className="leva-slider"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
                Height
              </label>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {settings.height.toFixed(1)}m
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={settings.height}
              onChange={(e) => updateConfig({ height: parseFloat(e.target.value) })}
              className="leva-slider"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
                Depth
              </label>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {settings.depth.toFixed(2)}m
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="20"
              step="0.25"
              value={settings.depth}
              onChange={(e) => updateConfig({ depth: parseFloat(e.target.value) })}
              className="leva-slider"
            />
          </div>
        </>
      )}

      {isCylinder && (
        <>
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
                Radius
              </label>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {settings.radius.toFixed(1)}m (⌀ {(settings.radius * 2).toFixed(1)}m)
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={settings.radius}
              onChange={(e) => updateConfig({ radius: parseFloat(e.target.value) })}
              className="leva-slider"
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
                Height
              </label>
              <span style={{ fontSize: 10, opacity: 0.7 }}>
                {settings.height.toFixed(1)}m
              </span>
            </div>
            <input
              type="range"
              min="1"
              max="40"
              step="0.5"
              value={settings.height}
              onChange={(e) => updateConfig({ height: parseFloat(e.target.value) })}
              className="leva-slider"
            />
          </div>
        </>
      )}

      {/* Rotation */}
      <div style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
          <label style={{ fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
            Rotation
          </label>
          <span style={{ fontSize: 10, opacity: 0.7 }}>
            {settings.rotation.toFixed(0)}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          step="5"
          value={settings.rotation}
          onChange={(e) => updateConfig({ rotation: parseFloat(e.target.value) })}
          className="leva-slider"
        />
      </div>

      {/* Observer Info */}
      <div style={{
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)'
      }}>
        <div style={{ marginBottom: 4 }}>
          <strong>Type:</strong> {observer.type}
        </div>
        <div>
          <strong>ID:</strong> {observer.id}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 5 }}>
        <button
          onClick={handleApply}
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
          Apply
        </button>
        <button
          onClick={handleRemove}
          style={{
            flex: 1,
            padding: '6px 10px',
            cursor: 'pointer',
            background: '#dc3545',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            fontSize: 11
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}
