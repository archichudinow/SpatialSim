import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, XRButton } from '@react-three/xr';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { Model } from './Model';
import { Controls } from './Controls';
import { VRInterface } from './VRInterface';

function SceneContent({ isVR }) {
  return (
    <>
      <color attach="background" args={['#bfd4dc']} />
      <Lighting />
      <Ground />
      <Model />
      <Controls isVR={isVR} />
    </>
  );
}

export function Scene() {
  const [isVR, setIsVR] = useState(false);
  const [fps, setFps] = useState(60);
  const [vrStatus, setVrStatus] = useState('');
  const canvasRef = useRef(null);

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
        setVrStatus('WebXR not available');
        return;
      }

      setVrStatus('Checking immersive-vr support...');

      // Check support
      const supported = await navigator.xr.isSessionSupported('immersive-vr');
      if (!supported) {
        setVrStatus('immersive-vr not supported on this device');
        return;
      }

      setVrStatus('Requesting VR session...');

      // Request session
      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['hand-tracking'],
      });

      setVrStatus('VR session started!');
      setIsVR(true);

      // Listen for session end
      session.addEventListener('end', () => {
        setIsVR(false);
        setVrStatus('VR session ended');
      });
    } catch (err) {
      setVrStatus(`VR Error: ${err.message}`);
      console.error('WebXR Error:', err);
    }
  };

  const handleExitVR = () => {
    setIsVR(false);
  };

  return (
    <>
      <Canvas
        ref={canvasRef}
        camera={{ 
          position: [0, 1.6, 5], 
          fov: 75,
          near: 0.01,
          far: 5000
        }}
        gl={{ antialias: true, alpha: false }}
      >
        {isVR ? (
          <XR>
            <SceneContent isVR={true} />
          </XR>
        ) : (
          <SceneContent isVR={false} />
        )}
      </Canvas>

      {/* Debug VR Status */}
      {vrStatus && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          backgroundColor: 'rgba(255, 100, 100, 0.9)',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '4px',
          fontSize: '13px',
          fontFamily: 'monospace',
          zIndex: 1000,
          maxWidth: '300px',
          wordWrap: 'break-word'
        }}>
          {vrStatus}
        </div>
      )}

      {/* UI Overlay */}
      <VRInterface onEnterVR={handleEnterVR} isVR={isVR} fps={fps} />
    </>
  );
}
