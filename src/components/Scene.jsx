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
        alert('WebXR is not supported on this browser.');
        return;
      }

      const session = await navigator.xr.requestSession('immersive-vr', {
        requiredFeatures: ['local-floor'],
        optionalFeatures: ['dom-overlay'],
        domOverlay: { root: document.body },
      });

      setIsVR(true);
      console.log('VR session started:', session);

      // Handle session end
      session.addEventListener('end', () => {
        setIsVR(false);
        console.log('VR session ended');
      });
    } catch (err) {
      console.error('Failed to enter VR:', err);
      alert('Could not start VR session:\n' + err.message);
    }
  };

  return (
    <>
      <Canvas
        camera={{ position: [0, 1.6, 5], fov: 75 }}
        gl={{ antialias: true, alpha: false }}
      >
        <color attach="background" args={['#87ceeb']} />
        <Lighting />
        <Ground />
        <Model />
        <Controls isVR={isVR} />
      </Canvas>

      {/* UI Overlay */}
      <VRInterface onEnterVR={handleEnterVR} isVR={isVR} fps={fps} />
    </>
  );
}
