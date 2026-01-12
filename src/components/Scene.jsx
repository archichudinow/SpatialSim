import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, useXR } from '@react-three/xr';
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

function XRContent() {
  const { session } = useXR();
  
  return (
    <>
      <SceneContent isVR={true} />
    </>
  );
}

export function Scene() {
  const [fps, setFps] = useState(60);
  const [vrStatus, setVrStatus] = useState('');

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

  // Check WebXR support on mount
  useEffect(() => {
    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (supported) {
          setVrStatus('VR ready');
        } else {
          setVrStatus('VR not supported on this device');
        }
      }).catch(err => {
        setVrStatus('XR check failed: ' + err.message);
      });
    } else {
      setVrStatus('WebXR not available');
    }
  }, []);

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
        <XR>
          <SceneContent isVR={false} />
        </XR>
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

      {/* UI Overlay with XRButton */}
      <VRInterface fps={fps} />
    </>
  );
}
