import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { Model } from './Model';
import { Controls } from './Controls';
import { VRInterface } from './VRInterface';

export function Scene() {
  const [isVR, setIsVR] = useState(false);
  const [fps, setFps] = useState(60);
  const [vrStatus, setVrStatus] = useState(''); // For debugging

  // Simple FPS counter using requestAnimationFrame
  useEffect(() => {
    let frameCount = 0;
    let lastTime = Date.now();
    let animationId;

    const countFrame = () => {
      frameCount++;
      const now = Date.now();
      const deltaTime = (now - lastTime) / 1000;

      if (deltaTime >= 1) {
        setFps(frameCount / deltaTime);
        frameCount = 0;
        lastTime = now;
      }

      animationId = requestAnimationFrame(countFrame);
    };

    animationId = requestAnimationFrame(countFrame);

    return () => cancelAnimationFrame(animationId);
  }, []);

  const handleEnterVR = async () => {
    try {
      if (!navigator.xr) {
        setVrStatus('WebXR not supported');
        alert('WebXR is not supported on this browser.');
        return;
      }

      setVrStatus('Checking VR support...');

      // Check if immersive-vr is supported
      const isSessionSupported = await navigator.xr.isSessionSupported('immersive-vr');
      if (!isSessionSupported) {
        setVrStatus('immersive-vr not supported');
        alert('immersive-vr mode is not supported on this device.');
        return;
      }

      setVrStatus('Requesting VR session...');

      // Simplified VR request without domOverlay
      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking'],
      });

      setVrStatus('VR session active');
      setIsVR(true);

      // Handle session end
      session.addEventListener('end', () => {
        setIsVR(false);
        setVrStatus('VR session ended');
      });
    } catch (err) {
      setVrStatus(`Error: ${err.message}`);
      console.error('VR Error:', err);
      alert(`VR Error: ${err.message}`);
    }
  };

  return (
    <>
      <Canvas
        camera={{ 
          position: [0, 1.6, 5], 
          fov: 75,
          near: 0.01,
          far: 5000
        }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#bfd4dc']} />
        <Lighting />
        <Ground />
        <Model />
        <Controls isVR={isVR} />
      </Canvas>

      {/* Debug VR Status */}
      {vrStatus && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          backgroundColor: 'rgba(255, 100, 100, 0.8)',
          color: 'white',
          padding: '10px 15px',
          borderRadius: '4px',
          fontSize: '12px',
          fontFamily: 'monospace',
          zIndex: 1000
        }}>
          VR Status: {vrStatus}
        </div>
      )}

      {/* UI Overlay */}
      <VRInterface onEnterVR={handleEnterVR} isVR={isVR} fps={fps} />
    </>
  );
}
