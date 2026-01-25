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
import StorageService from '../utils/storageService';
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

function SceneContent({ project, selectedOption }) {
  const [showViz, setShowViz] = useState(false);
  const modelRef = useRef(null);
  const contextModelRef = useRef(null);

  // Update visualization state
  useEffect(() => {
    const checkViz = setInterval(() => {
      setShowViz(getVisualizationState());
    }, 100);
    return () => clearInterval(checkViz);
  }, []);

  // Helper to convert storage path to public URL
  const getModelUrl = (path) => {
    if (!path) return null;
    if (path.startsWith('http')) return path;
    
    // Remove 'projects/' prefix if it exists (to avoid duplication)
    const cleanPath = path.startsWith('projects/') ? path.substring('projects/'.length) : path;
    return StorageService.getPublicUrl(cleanPath);
  };

  // Get context models (array) and convert storage paths to public URLs
  const contextModels = project?.models_context || [];
  const contextModelUrls = contextModels.map(getModelUrl).filter(Boolean);
  
  // Get option model URL from selected option and convert if needed
  const optionModelUrl = getModelUrl(selectedOption?.model_url);

  return (
    <>
      <color attach="background" args={['#c3c3c3']} />
      <Lighting />
      <Ground />
      
      {/* Load context models if they exist */}
      {contextModelUrls.length > 0 && contextModelUrls.map((url, index) => (
        <Model key={`context-${index}`} ref={index === 0 ? contextModelRef : null} url={url} />
      ))}
      
      {/* Load option model if it exists */}
      {optionModelUrl && <Model ref={modelRef} url={optionModelUrl} />}
      
      <Controls />
      <FrameCapture modelRef={modelRef} />
      <RecordingVisualization showVisualization={showViz} />
    </>
  );
}

const store = createXRStore();

export function Scene({ project, selectedOption, selectedScenario, loading, error, onReload }) {
  const [fps, setFps] = useState(60);
  const [showLoadingScreen, setShowLoadingScreen] = useState(true);
  const [isVRMode, setIsVRMode] = useState(false);

  // Monitor XR session state
  useEffect(() => {
    const checkVRMode = () => {
      setIsVRMode(store.isPresenting);
    };

    // Check immediately
    checkVRMode();

    // Check periodically
    const interval = setInterval(checkVRMode, 500);
    return () => clearInterval(interval);
  }, []);

  // Update RecordingManager with device type
  useEffect(() => {
    recordingManager.setDeviceType(isVRMode ? 'vr' : 'pc');
  }, [isVRMode]);

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

  // Check if we have any models to display
  const hasContextModels = project?.models_context && project.models_context.length > 0;
  const hasOptionModel = selectedOption?.model_url != null;

  // Show message if no models available
  if (!hasContextModels && !hasOptionModel) {
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
            <SceneContent project={project} selectedOption={selectedOption} />
          </XR>
        </Canvas>
      </ErrorBoundary>
      <Recording 
        project={project} 
        selectedOption={selectedOption}
        selectedScenario={selectedScenario}
        onReload={onReload}
        isVRMode={isVRMode}
      />
      <div className="fixed top-5 right-5 text-text-primary font-mono text-sm z-[998] bg-bg-secondary/80 px-3 py-2 rounded border border-border-light">
        FPS: {Math.round(fps)}
      </div>
    </>
  );
}
