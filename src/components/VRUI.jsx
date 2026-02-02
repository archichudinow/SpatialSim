import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';
import recordingManager from '../utils/RecordingManager';

// Global state to track if menu is open (used to disable locomotion)
let menuOpenState = false;
export function isVRMenuOpen() {
  return menuOpenState;
}

// Interactive button component for VR
function VRButton({ position, label, onActivate, color = "#333333", width = 0.15, height = 0.045 }) {
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  
  const handlePointerDown = useCallback((e) => {
    e.stopPropagation();
    setPressed(true);
    console.log('VR Button pressed:', label);
  }, [label]);
  
  const handlePointerUp = useCallback((e) => {
    e.stopPropagation();
    if (pressed) {
      console.log('VR Button activated:', label);
      onActivate?.();
    }
    setPressed(false);
  }, [pressed, label, onActivate]);
  
  const handlePointerOver = useCallback((e) => {
    e.stopPropagation();
    setHovered(true);
  }, []);
  
  const handlePointerOut = useCallback((e) => {
    e.stopPropagation();
    setHovered(false);
    setPressed(false);
  }, []);
  
  const currentColor = pressed ? "#ffffff" : hovered ? "#aaaaaa" : color;
  
  return (
    <group position={position}>
      <mesh
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[width, height, 0.01]} />
        <meshBasicMaterial color={currentColor} />
      </mesh>
      <Text 
        position={[0, 0, 0.006]} 
        fontSize={height * 0.4} 
        color={pressed ? "#000000" : "white"} 
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// VR Recording UI Panel - Fixed position panel in VR
export function VRUI({ project, selectedOption, selectedScenario, onMenuStateChange }) {
  const { isPresenting } = useXR();
  const { camera } = useThree();
  const groupRef = useRef();
  
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Update recording status from the manager
  useEffect(() => {
    const interval = setInterval(() => {
      const status = recordingManager.getStatus();
      setIsRecording(status.isRecording);
      setFrameCount(status.frameCount);
      setDuration(status.duration);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  // Position panel in front of user (follows camera in VR)
  useFrame(() => {
    if (!groupRef.current || !isPresenting) return;
    
    const cameraPos = new THREE.Vector3();
    const cameraDir = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);
    camera.getWorldDirection(cameraDir);
    
    // Position 1.5m in front, at eye level
    const targetPos = cameraPos.clone()
      .add(new THREE.Vector3(cameraDir.x, 0, cameraDir.z).normalize().multiplyScalar(1.5));
    targetPos.y = cameraPos.y - 0.2;
    
    // Smoothly move to target position
    groupRef.current.position.lerp(targetPos, 0.05);
    
    // Face the camera
    groupRef.current.lookAt(cameraPos);
  });
  
  const handleStartRecording = useCallback(() => {
    console.log('START clicked, scenario:', selectedScenario);
    if (!selectedScenario) {
      setStatusMessage('No scenario!');
      return;
    }
    recordingManager.startRecording();
    setStatusMessage('Recording...');
  }, [selectedScenario]);
  
  const handleStopRecording = useCallback(() => {
    console.log('STOP clicked');
    recordingManager.stopRecording();
    setStatusMessage('Stopped');
  }, []);
  
  const handleSaveToDatabase = useCallback(async () => {
    console.log('SAVE clicked, frames:', frameCount);
    if (frameCount === 0) {
      setStatusMessage('No frames!');
      return;
    }
    
    setStatusMessage('Saving...');
    
    try {
      const result = await recordingManager.saveToSupabase();
      if (result.success) {
        setStatusMessage('Saved!');
        setTimeout(() => {
          recordingManager.clear();
          setStatusMessage('');
        }, 2000);
      } else {
        setStatusMessage('Failed!');
      }
    } catch (error) {
      setStatusMessage('Error!');
      console.error('Save error:', error);
    }
  }, [frameCount]);
  
  const handleClear = useCallback(() => {
    console.log('CLEAR clicked');
    recordingManager.clear();
    setStatusMessage('Cleared');
  }, []);
  
  // Fixed position for desktop, following for VR
  const initialPosition = isPresenting ? [0, 1.5, -1.5] : [0, 1.5, -2];
  
  return (
    <group ref={groupRef} position={initialPosition}>
      {/* Background panel - no pointer events */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[0.55, 0.4]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.006]}>
        <planeGeometry args={[0.57, 0.42]} />
        <meshBasicMaterial color={isRecording ? "#ff3333" : "#3399ff"} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Title */}
      <Text
        position={[0, 0.14, 0]}
        fontSize={0.035}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        Recording Controls
      </Text>
      
      {/* Recording status */}
      <Text
        position={[0, 0.095, 0]}
        fontSize={0.022}
        color={isRecording ? "#ff6666" : "#aaaaaa"}
        anchorX="center"
        anchorY="middle"
      >
        {isRecording ? `● RECORDING ${frameCount} frames (${duration.toFixed(1)}s)` : 
         frameCount > 0 ? `${frameCount} frames recorded` : 'Ready to record'}
      </Text>
      
      {/* Scenario info */}
      <Text
        position={[0, 0.055, 0]}
        fontSize={0.016}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        {selectedScenario?.name || 'No scenario selected'}
      </Text>
      
      {/* Main action button - START or STOP */}
      {!isRecording ? (
        <VRButton 
          position={[0, 0, 0]} 
          label="START" 
          onActivate={handleStartRecording}
          color="#228822"
          width={0.2}
          height={0.055}
        />
      ) : (
        <VRButton 
          position={[0, 0, 0]} 
          label="STOP" 
          onActivate={handleStopRecording}
          color="#cc2222"
          width={0.2}
          height={0.055}
        />
      )}
      
      {/* Save and Clear buttons - only when there are frames and not recording */}
      {frameCount > 0 && !isRecording && (
        <>
          <VRButton 
            position={[-0.1, -0.07, 0]} 
            label="SAVE" 
            onActivate={handleSaveToDatabase}
            color="#2266cc"
            width={0.15}
            height={0.045}
          />
          <VRButton 
            position={[0.1, -0.07, 0]} 
            label="CLEAR" 
            onActivate={handleClear}
            color="#666666"
            width={0.15}
            height={0.045}
          />
        </>
      )}
      
      {/* Status message */}
      {statusMessage && (
        <Text
          position={[0, -0.13, 0]}
          fontSize={0.018}
          color={statusMessage.includes('Saved') || statusMessage.includes('Recording') ? '#33ff33' : 
                 statusMessage.includes('Failed') || statusMessage.includes('Error') ? '#ff3333' : '#ffcc00'}
          anchorX="center"
          anchorY="middle"
        >
          {statusMessage}
        </Text>
      )}
      
      {/* Instructions */}
      <Text
        position={[0, -0.165, 0]}
        fontSize={0.012}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        Point and click to interact
      </Text>
    </group>
  );
}

export default VRUI;
