import { XRButton } from '@react-three/xr';

export function VRInterface({ fps }) {
  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      color: '#333',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 999,
      textAlign: 'right'
    }}>
      <div style={{ marginBottom: '20px', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '4px' }}>
        FPS: {Math.round(fps)}
      </div>
      <XRButton 
        mode="VR" 
        session={{
          requiredFeatures: ['local-floor'],
          optionalFeatures: ['hand-tracking', 'hit-test'],
        }}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '12px 24px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
          fontWeight: 'bold'
        }}
      />
    </div>
  );
}
