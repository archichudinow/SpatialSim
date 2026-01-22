import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { Model } from './Model';
import { Controls } from './Controls';
import { ErrorBoundary } from './ErrorBoundary';

function SceneContent() {
  return (
    <>
      <color attach="background" args={['#c3c3c3']} />
      <Lighting />
      <Ground />
      <Model />
      <Controls />
    </>
  );
}

const store = createXRStore();

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
      <button onClick={() => store.enterVR()} style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '12px 24px',
        fontSize: '16px',
        backgroundColor: '#394047',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        zIndex: 999
      }}>
        Enter VR
      </button>
      <ErrorBoundary>
        <Canvas
          camera={{ 
            position: [0, 1.6, 5], 
            fov: 75,
            near: 0.01,
            far: 5000
          }}
        >
          <XR store={store}>
            <SceneContent />
          </XR>
        </Canvas>
      </ErrorBoundary>
      <div style={{
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
