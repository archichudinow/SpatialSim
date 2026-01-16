import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, Controllers, Hands, VRButton as XRVRButton } from '@react-three/xr';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { Model } from './Model';
import { Controls } from './Controls';
import { ErrorBoundary } from './ErrorBoundary';

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#bfd4dc']} />
      <Lighting />
      <Ground />
      <Model />
      <Controls />
      <Controllers />
      <Hands />
    </>
  );
}

export function Scene() {
  const [fps, setFps] = useState(60);

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

  return (
    <>
      <ErrorBoundary>
        <Canvas
          camera={{ 
            position: [0, 1.6, 5], 
            fov: 75,
            near: 0.01,
       XRVRButton />
      <ErrorBoundary>
        <Canvas
          camera={{ 
            position: [0, 1.6, 5], 
            fov: 75,
            near: 0.01,
            far: 5000
          }}
        >
          <XR referenceSpace="local-floor">
            <SceneContent
        position: 'fixed',
        top: 20,
        right: 20,
        color: '#333',
        fontFamily: 'monospace',
        fontSize: '14px',
        zIndex: 998,
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        padding: '10px',
        borderRadius: '4px'
      }}>
        FPS: {Math.round(fps)}
      </div>
    </>
  );
}
