import { useState, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';

export function VRInterface({ fps }) {
  const { gl } = useThree();
  const [vrSupported, setVrSupported] = useState(false);

  useEffect(() => {
    if (!gl) return;

    // Check if WebXR is supported
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        setVrSupported(supported);
        if (supported) {
          // Add VRButton to page (it will create the button in the DOM)
          document.body.appendChild(VRButton.createButton(gl));
        }
      }).catch(() => setVrSupported(false));
    }

    return () => {
      // Cleanup VR button if needed
      const vrButton = document.querySelector('button.xr-button');
      if (vrButton) {
        vrButton.remove();
      }
    };
  }, [gl]);

  return (
    <div style={{
      position: 'fixed',
      top: 20,
      right: 20,
      color: '#333',
      fontFamily: 'monospace',
      fontSize: '14px',
      zIndex: 998,
      textAlign: 'right'
    }}>
      <div style={{ marginBottom: '20px', backgroundColor: 'rgba(255, 255, 255, 0.8)', padding: '10px', borderRadius: '4px' }}>
        FPS: {Math.round(fps)}
      </div>
      {!vrSupported && (
        <div style={{ color: '#999', fontSize: '12px' }}>
          VR not available
        </div>
      )}
    </div>
  );
}
