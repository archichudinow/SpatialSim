import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useXR, useXRInputSourceState } from '@react-three/xr';
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
  }, []);
  
  const handlePointerUp = useCallback((e) => {
    e.stopPropagation();
    if (pressed) {
      onActivate?.();
    }
    setPressed(false);
  }, [pressed, onActivate]);
  
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

// VR Recording UI Panel - Toggle with grip button
export function VRUI({ project, selectedOption, selectedScenario, onMenuStateChange }) {
  const { isPresenting } = useXR();
  const { camera } = useThree();
  const groupRef = useRef();
  const menuPositionRef = useRef(new THREE.Vector3(0, 1.5, -1.5));
  
  const [menuVisible, setMenuVisible] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Track grip button state for toggle
  const lastGripRef = useRef(false);
  
  // Get controller states
  const leftController = useXRInputSourceState('controller', 'left');
  const rightController = useXRInputSourceState('controller', 'right');
  
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
  
  // Reset menu when exiting VR
  useEffect(() => {
    if (!isPresenting) {
      setMenuVisible(false);
      menuOpenState = false;
    }
  }, [isPresenting]);
  
  // Position menu in front of user when shown
  const positionMenuInFront = useCallback(() => {
    const cameraPos = new THREE.Vector3();
    const cameraDir = new THREE.Vector3();
    camera.getWorldPosition(cameraPos);
    camera.getWorldDirection(cameraDir);
    
    // Position 1.2m in front, at eye level
    const pos = cameraPos.clone()
      .add(new THREE.Vector3(cameraDir.x, 0, cameraDir.z).normalize().multiplyScalar(1.2));
    pos.y = cameraPos.y - 0.1;
    
    menuPositionRef.current.copy(pos);
  }, [camera]);
  
  // Toggle menu visibility
  const toggleMenu = useCallback(() => {
    setMenuVisible(prev => {
      const newState = !prev;
      menuOpenState = newState;
      if (newState) {
        positionMenuInFront();
      }
      return newState;
    });
  }, [positionMenuInFront]);
  
  // Check for button press to toggle menu
  // Supports: Grip buttons (squeeze) OR Y button (left) OR B button (right)
  useFrame(() => {
    if (!isPresenting) return;
    
    // Check grip buttons
    const leftGrip = leftController?.gamepad?.['xr-standard-squeeze'];
    const rightGrip = rightController?.gamepad?.['xr-standard-squeeze'];
    const leftGripPressed = leftGrip?.state === 'pressed';
    const rightGripPressed = rightGrip?.state === 'pressed';
    
    // Check face buttons (Y on left, B on right)
    const yButton = leftController?.gamepad?.['y-button'];
    const bButton = rightController?.gamepad?.['b-button'];
    const yPressed = yButton?.state === 'pressed';
    const bPressed = bButton?.state === 'pressed';
    
    // Any of these buttons can toggle the menu
    const anyPressed = leftGripPressed || rightGripPressed || yPressed || bPressed;
    
    // Toggle on release (after press)
    if (lastGripRef.current && !anyPressed) {
      toggleMenu();
    }
    
    lastGripRef.current = anyPressed;
    
    // Update menu position and rotation
    if (groupRef.current && menuVisible) {
      groupRef.current.position.copy(menuPositionRef.current);
      
      // Face the camera
      const cameraPos = new THREE.Vector3();
      camera.getWorldPosition(cameraPos);
      groupRef.current.lookAt(cameraPos);
    }
  });
  
  const handleStartRecording = useCallback(() => {
    if (!selectedScenario) {
      setStatusMessage('No scenario!');
      return;
    }
    recordingManager.startRecording();
    setStatusMessage('Recording...');
    // Close menu after starting
    setMenuVisible(false);
    menuOpenState = false;
  }, [selectedScenario]);
  
  const handleStopRecording = useCallback(() => {
    recordingManager.stopRecording();
    setStatusMessage('Stopped');
  }, []);
  
  const handleSaveToDatabase = useCallback(async () => {
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
          // Close menu after saving
          setMenuVisible(false);
          menuOpenState = false;
        }, 1500);
      } else {
        setStatusMessage('Failed!');
      }
    } catch (error) {
      setStatusMessage('Error!');
      console.error('Save error:', error);
    }
  }, [frameCount]);
  
  const handleClear = useCallback(() => {
    recordingManager.clear();
    setStatusMessage('Cleared');
  }, []);
  
  // Don't render if not in VR or menu is hidden
  if (!isPresenting || !menuVisible) return null;
  
  return (
    <group ref={groupRef} position={[0, 1.5, -1.5]}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[0.55, 0.45]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.006]}>
        <planeGeometry args={[0.57, 0.47]} />
        <meshBasicMaterial color={isRecording ? "#ff3333" : "#3399ff"} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Title */}
      <Text
        position={[0, 0.16, 0]}
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
        position={[0, 0.115, 0]}
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
        position={[0, 0.075, 0]}
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
          position={[0, 0.02, 0]} 
          label="START RECORDING" 
          onActivate={handleStartRecording}
          color="#228822"
          width={0.28}
          height={0.055}
        />
      ) : (
        <VRButton 
          position={[0, 0.02, 0]} 
          label="STOP RECORDING" 
          onActivate={handleStopRecording}
          color="#cc2222"
          width={0.28}
          height={0.055}
        />
      )}
      
      {/* Save and Clear buttons - only when there are frames and not recording */}
      {frameCount > 0 && !isRecording && (
        <>
          <VRButton 
            position={[-0.1, -0.05, 0]} 
            label="SAVE TO DB" 
            onActivate={handleSaveToDatabase}
            color="#2266cc"
            width={0.17}
            height={0.045}
          />
          <VRButton 
            position={[0.1, -0.05, 0]} 
            label="CLEAR" 
            onActivate={handleClear}
            color="#666666"
            width={0.17}
            height={0.045}
          />
        </>
      )}
      
      {/* Status message */}
      {statusMessage && (
        <Text
          position={[0, -0.11, 0]}
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
        position={[0, -0.16, 0]}
        fontSize={0.014}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        Press GRIP or Y/B button to close
      </Text>
      
      {/* Movement frozen indicator */}
      <Text
        position={[0, -0.19, 0]}
        fontSize={0.012}
        color="#ffaa00"
        anchorX="center"
        anchorY="middle"
      >
        Movement paused while menu is open
      </Text>
    </group>
  );
}

export default VRUI;
