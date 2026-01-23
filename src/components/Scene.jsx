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
import { LoadingScreen } from './LoadingScreen';
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

function SceneContent({ project }) {
  const [showViz, setShowViz] = useState(false);
  const modelRef = useRef(null);

  // Update visualization state
  useEffect(() => {
    const checkViz = setInterval(() => {
      setShowViz(getVisualizationState());
    }, 100);
    return () => clearInterval(checkViz);
  }, []);

  // Determine which model to use: prefer project model, fallback to context
  const modelUrl = project?.models_project || project?.models_context || null;

  return (
    <>
      <color attach="background" args={['#c3c3c3']} />
      <Lighting />
      <Ground />
      {modelUrl && <Model ref={modelRef} url={modelUrl} />}
      <Controls />
      <FrameCapture modelRef={modelRef} />
      <RecordingVisualization showVisualization={showViz} />
    </>
  );
}

const store = createXRStore();

export function Scene({ project, loading, error, onAddRecord }) {
  const [fps, setFps] = useState(60);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);

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

  // Hide loading screen when project loads
  useEffect(() => {
    if (!loading && project) {
      // Small delay to ensure models start loading
      const timer = setTimeout(() => {
        setShowLoadingScreen(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, project]);

  // Show loading screen while loading
  if (loading || showLoadingScreen) {
    return (
      <LoadingScreen
        visible={true}
        projectName={project?.name || 'Loading...'}
        projectDescription={project?.description}
        onOpen={() => setShowLoadingScreen(false)}
      />
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-text-primary text-xl font-normal mb-3">Error Loading Project</h1>
          <p className="text-text-secondary text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-transparent hover:bg-bg-hover text-text-primary text-sm border border-border-light rounded transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Show message if no project models
  if (!project?.models_project && !project?.models_context) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-text-primary text-xl font-normal mb-3">{project?.name || 'Project'}</h1>
          <p className="text-text-secondary text-sm mb-6">No models available for this project</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-4 py-2 bg-transparent hover:bg-bg-hover text-text-primary text-sm border border-border-light rounded transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => store.enterVR()}
        className="fixed bottom-5 left-1/2 -translate-x-1/2 px-6 py-3 text-sm font-normal bg-transparent text-text-primary border border-border-light rounded hover:bg-bg-hover transition-all duration-200 z-[999]"
      >
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
            <SceneContent project={project} />
          </XR>
        </Canvas>
      </ErrorBoundary>
      <Recording project={project} onAddRecord={onAddRecord} />
      <div className="fixed top-5 right-5 text-text-primary font-mono text-sm z-[998] bg-bg-secondary/80 px-3 py-2 rounded border border-border-light">
        FPS: {Math.round(fps)}
      </div>
    </>
  );
}
