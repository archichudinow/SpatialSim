import { useState } from 'react';

export function VRInterface({ onEnterVR, isVR, fps }) {
  const [showDebug, setShowDebug] = useState(true);

  // Check if WebXR is supported
  const webXRSupported = () => {
    return navigator.xr !== undefined;
  };

  return (
    <div style={{ position: 'fixed', top: 20, left: 20, color: 'white', fontSize: '14px', fontFamily: 'monospace', zIndex: 100 }}>
      {/* Debug Info */}
      {showDebug && (
        <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          <div>Mode: {isVR ? '🥽 VR' : '💻 Desktop'}</div>
          <div>FPS: {fps.toFixed(0)}</div>
          <div>WebXR: {webXRSupported() ? '✓ Supported' : '✗ Not Supported'}</div>
          <div style={{ fontSize: '12px', marginTop: '5px', color: '#aaa' }}>
            {!isVR && 'WASD: Move | Click: Look | Shift: Sprint'}
          </div>
        </div>
      )}

      {/* VR Entry Button */}
      {!isVR && webXRSupported() && (
        <button
          onClick={onEnterVR}
          style={{
            padding: '12px 20px',
            fontSize: '14px',
            backgroundColor: '#0066ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontWeight: 'bold',
            marginBottom: '10px',
            transition: 'background-color 0.3s',
          }}
          onMouseEnter={(e) => (e.target.style.backgroundColor = '#0052cc')}
          onMouseLeave={(e) => (e.target.style.backgroundColor = '#0066ff')}
        >
          🥽 Enter VR
        </button>
      )}

      {/* Exit VR Button */}
      {isVR && (
        <div style={{ backgroundColor: 'rgba(255, 100, 100, 0.7)', padding: '10px', borderRadius: '4px', marginBottom: '10px' }}>
          VR Mode Active - Press controller button or ESC to exit
        </div>
      )}
    </div>
  );
}
