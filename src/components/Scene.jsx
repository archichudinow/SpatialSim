import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { Model } from './Model';
import { Controls } from './Controls';
import { ErrorBoundary } from './ErrorBoundary';
import { VRButton } from 'three/examples/jsm/webxr/VRButton.js';
import { useThree } from '@react-three/fiber';

// Component that sets up VR (no rendering, just setup)
function VRSetup() {
  const { gl } = useThree();
  
  useEffect(() => {
    if (!gl) return;

    if (navigator.xr) {
      navigator.xr.isSessionSupported('immersive-vr').then(supported => {
        if (supported) {
          document.body.appendChild(VRButton.createButton(gl));
        }
      }).catch(() => {});
    }

    return () => {
      const vrButton = document.querySelector('button.xr-button');
      if (vrButton) {
        vrButton.remove();
      }
    };
  }, [gl]);

  return null; // No visual rendering
}

function SceneContent({ isVR, fps }) {
  return (
    <>
      <color attach="background" args={['#bfd4dc']} />
      <Lighting />
      <Ground />
      <Model />
      <Controls isVR={isVR} />
      <VRSetup />
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
          gl={{ 
            antialias: true, 
            alpha: false
          }}
          onCreated={({ gl }) => {
            // Enable XR as per instruction.md
            gl.xr.enabled = true;
            gl.xr.setReferenceSpaceType('local');
          }}
          frameloop="always"
        >
          <SceneContent isVR={false} fps={fps} />
        </Canvas>
      </ErrorBoundary>

      {/* FPS Counter UI - outside Canvas */}
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
