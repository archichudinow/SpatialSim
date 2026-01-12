import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR } from '@react-three/xr';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { Model } from './Model';
import { Controls } from './Controls';
import { VRInterface } from './VRInterface';
import { ErrorBoundary } from './ErrorBoundary';

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
  return (
    <>
      <SceneContent isVR={true} />
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
            far: 5000
          }}
          gl={{ antialias: true, alpha: false }}
        >
          <XR>
            <SceneContent isVR={false} />
          </XR>
        </Canvas>
      </ErrorBoundary>

      {/* UI Overlay */}
      <VRInterface fps={fps} />
    </>
  );
}
