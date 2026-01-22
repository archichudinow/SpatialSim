import { useState, useEffect, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { XR, createXRStore } from '@react-three/xr';
import { Lighting } from './Lighting';
import { Ground } from './Ground';
import { Model } from './Model';
import { Controls } from './Controls';
import { ErrorBoundary } from './ErrorBoundary';
import { Recording, getVisualizationState } from './Recording';
import { RecordingVisualization } from './RecordingVisualization';
import recordingManager from '../utils/RecordingManager';
import * as THREE from 'three';

function FrameCapture({ modelRef }) {
  const { camera, scene } = useThree();
  const raycasterRef = useRef(new THREE.Raycaster());
  const meshesToTestRef = useRef([]);

  // Cache the meshes once when model loads
  useEffect(() => {
    if (modelRef.current) {
      const meshes = [];
      modelRef.current.traverse((obj) => {
        if (obj.isMesh && obj.geometry) {
          meshes.push(obj);
        }
      });
      meshesToTestRef.current = meshes;
    }
  }, [modelRef]);

  useFrame(() => {
    if (!recordingManager.isRecording) return;

    // Position = camera position (gaze origin)
    const position = camera.position.clone();

    // LookAt = where the gaze is hitting
    // Cast a ray from camera in look direction
    const direction = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
    
    // Set up raycaster
    raycasterRef.current.setFromCamera({ x: 0, y: 0 }, camera);
    raycasterRef.current.ray.direction.copy(direction).normalize();

    let lookAt;
    
    // Use cached meshes for raycasting
    if (meshesToTestRef.current.length > 0) {
      const intersects = raycasterRef.current.intersectObjects(meshesToTestRef.current, false);

      if (intersects.length > 0) {
        // Hit something - use the intersection point
        lookAt = intersects[0].point.clone();
      } else {
        // No hit - use far point (100m away in gaze direction)
        const FAR_DISTANCE = 100;
        lookAt = position.clone().add(direction.clone().multiplyScalar(FAR_DISTANCE));
      }
    } else {
      // Fallback if model not loaded yet
      const FAR_DISTANCE = 100;
      lookAt = position.clone().add(direction.clone().multiplyScalar(FAR_DISTANCE));
    }

    recordingManager.recordFrame(position, lookAt);
  });

  return null;
}

function SceneContent() {
  const [showViz, setShowViz] = useState(false);
  const modelRef = useRef(null);

  // Update visualization state
  useEffect(() => {
    const checkViz = setInterval(() => {
      setShowViz(getVisualizationState());
    }, 100);
    return () => clearInterval(checkViz);
  }, []);

  return (
    <>
      <color attach="background" args={['#c3c3c3']} />
      <Lighting />
      <Ground />
      <Model ref={modelRef} />
      <Controls />
      <FrameCapture modelRef={modelRef} />
      <RecordingVisualization showVisualization={showViz} />
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
      <Recording />
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
