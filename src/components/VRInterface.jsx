import { useState, useEffect } from 'react';

export function VRInterface({ fps }) {
  const [vrSupported, setVrSupported] = useState(false);
  const [isVRActive, setIsVRActive] = useState(false);

  useEffect(() => {
    // Check if WebXR is supported
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        setVrSupported(supported);
      }).catch(() => setVrSupported(false));
    }
  }, []);

  const handleEnterVR = async () => {
    try {
      if (!navigator.xr) {
        console.error('WebXR not available');
        return;
      }

      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking'],
      });

      setIsVRActive(true);

      // Listen for session end
      session.addEventListener('end', () => {
        setIsVRActive(false);
      });
    } catch (err) {
      console.error('VR Error:', err);
    }
  };

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
      {vrSupported && (
        <button 
          onClick={handleEnterVR}
          disabled={isVRActive}
          style={{
            backgroundColor: isVRActive ? '#666' : '#007bff',
            color: 'white',
            padding: '12px 24px',
            border: 'none',
            borderRadius: '4px',
            cursor: isVRActive ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          {isVRActive ? 'VR Active' : 'Enter VR'}
        </button>
      )}
    </div>
  );
}
