import { useRef, useState, useEffect, useCallback } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useXR, useXRInputSourceState, useXRControllerButtonEvent } from '@react-three/xr';
import * as THREE from 'three';
import recordingManager from '../utils/RecordingManager';

// Global state to track if menu is open (used to disable locomotion)
let menuOpenState = false;
export function isVRMenuOpen() {
  return menuOpenState;
}

// Simple 3D button component for VR
function VRButton({ position, label, onClick, color = '#333333', hoverColor = '#555555', activeColor = '#007bff', isActive = false, disabled = false, width = 0.18 }) {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  
  const currentColor = disabled ? '#666666' : isActive ? activeColor : hovered ? hoverColor : color;
  
  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onPointerOver={() => !disabled && setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => !disabled && onClick?.()}
      >
        <boxGeometry args={[width, 0.06, 0.01]} />
        <meshStandardMaterial color={currentColor} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.018}
        color={disabled ? '#999999' : 'white'}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// Floating indicator that follows user when menu is closed
function MenuIndicator({ camera, isRecording, frameCount, onClick }) {
  const groupRef = useRef();
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    // Position indicator on the left side of user's view
    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraDirection);
    
    // Get left direction (perpendicular to camera direction)
    const leftDir = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x).normalize();
    
    // Position to the left and slightly forward
    const position = cameraPosition.clone()
      .add(cameraDirection.multiplyScalar(0.6))
      .add(leftDir.multiplyScalar(0.3));
    position.y = cameraPosition.y - 0.15;
    
    groupRef.current.position.copy(position);
    
    // Face the camera
    groupRef.current.lookAt(cameraPosition);
  });
  
  return (
    <group ref={groupRef} onClick={onClick}>
      {/* Small floating panel */}
      <mesh>
        <planeGeometry args={[0.15, 0.08]} />
        <meshStandardMaterial color="#1a1a2e" transparent opacity={0.9} />
      </mesh>
      
      {/* Recording indicator or menu hint */}
      {isRecording ? (
        <>
          <mesh position={[-0.045, 0.015, 0.001]}>
            <circleGeometry args={[0.008, 16]} />
            <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={1} />
          </mesh>
          <Text position={[0.02, 0.015, 0.001]} fontSize={0.012} color="#ff3333" anchorX="center">
            REC {frameCount}
          </Text>
        </>
      ) : frameCount > 0 ? (
        <Text position={[0, 0.015, 0.001]} fontSize={0.012} color="#3399ff" anchorX="center">
          {frameCount} frames
        </Text>
      ) : (
        <Text position={[0, 0.015, 0.001]} fontSize={0.012} color="#ffffff" anchorX="center">
          Menu
        </Text>
      )}
      
      <Text position={[0, -0.02, 0.001]} fontSize={0.008} color="#888888" anchorX="center">
        Grip both to open
      </Text>
    </group>
  );
}

// VR Recording UI Panel
export function VRUI({ project, selectedOption, selectedScenario, onMenuStateChange }) {
  const { camera } = useThree();
  const { isPresenting } = useXR();
  const groupRef = useRef();
  const menuPositionRef = useRef(new THREE.Vector3(0, 1.5, -1.5));
  const menuRotationRef = useRef(new THREE.Euler(0, 0, 0));
  
  const [menuOpen, setMenuOpen] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Track grip button states for toggle detection (using squeeze/grip buttons)
  const lastGripStateRef = useRef({ left: false, right: false });
  
  // Get controller states
  const leftController = useXRInputSourceState('controller', 'left');
  const rightController = useXRInputSourceState('controller', 'right');
  
  // Position menu in front of user
  const positionMenuInFrontOfUser = useCallback(() => {
    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraDirection);
    
    // Only use horizontal direction (ignore vertical look)
    cameraDirection.y = 0;
    cameraDirection.normalize();
    
    // Position 1.2m in front of user at eye level
    const uiPosition = cameraPosition.clone()
      .add(cameraDirection.multiplyScalar(1.2));
    uiPosition.y = cameraPosition.y - 0.1; // Slightly below eye level
    
    menuPositionRef.current.copy(uiPosition);
    
    // Calculate rotation to face user
    const angle = Math.atan2(
      cameraPosition.x - uiPosition.x,
      cameraPosition.z - uiPosition.z
    );
    menuRotationRef.current.set(0, angle, 0);
  }, [camera]);
  
  // Toggle menu function
  const toggleMenu = useCallback(() => {
    setMenuOpen(prev => {
      const newState = !prev;
      menuOpenState = newState;
      onMenuStateChange?.(newState);
      if (newState) {
        positionMenuInFrontOfUser();
      }
      return newState;
    });
  }, [onMenuStateChange, positionMenuInFrontOfUser]);
  
  // Close menu function
  const closeMenu = useCallback(() => {
    setMenuOpen(false);
    menuOpenState = false;
    onMenuStateChange?.(false);
  }, [onMenuStateChange]);
  
  // Check for GRIP/SQUEEZE buttons pressed together to toggle menu
  // (Grip buttons are separate from trigger, so they don't interfere with teleport)
  useFrame(() => {
    if (!isPresenting) return;
    
    // Check left controller grip/squeeze button
    const leftGrip = leftController?.gamepad?.['xr-standard-squeeze'];
    const leftPressed = leftGrip?.state === 'pressed';
    
    // Check right controller grip/squeeze button
    const rightGrip = rightController?.gamepad?.['xr-standard-squeeze'];
    const rightPressed = rightGrip?.state === 'pressed';
    
    // Both grips were pressed and now at least one is released = toggle menu
    const wasPressed = lastGripStateRef.current.left && lastGripStateRef.current.right;
    const isPressed = leftPressed && rightPressed;
    
    if (wasPressed && !isPressed) {
      toggleMenu();
    }
    
    lastGripStateRef.current.left = leftPressed;
    lastGripStateRef.current.right = rightPressed;
  });
  
  // Update recording status
  useEffect(() => {
    if (!isPresenting) return;
    
    const interval = setInterval(() => {
      const status = recordingManager.getStatus();
      setIsRecording(status.isRecording);
      setFrameCount(status.frameCount);
      setDuration(status.duration);
    }, 100);
    
    return () => clearInterval(interval);
  }, [isPresenting]);
  
  // Reset menu state when exiting VR
  useEffect(() => {
    if (!isPresenting) {
      setMenuOpen(false);
      menuOpenState = false;
    }
  }, [isPresenting]);
  
  // Apply position/rotation to menu group
  useFrame(() => {
    if (!groupRef.current || !menuOpen) return;
    groupRef.current.position.copy(menuPositionRef.current);
    groupRef.current.rotation.copy(menuRotationRef.current);
  });
  
  const handleStartRecording = () => {
    if (!selectedScenario) {
      setStatusMessage('No scenario selected');
      return;
    }
    recordingManager.startRecording();
    setIsRecording(true);
    setFrameCount(0);
    setDuration(0);
    setStatusMessage('Recording...');
    closeMenu(); // Close menu after starting
  };
  
  const handleStopRecording = () => {
    recordingManager.stopRecording();
    setIsRecording(false);
    setStatusMessage('Recording stopped');
  };
  
  const handleSaveToDatabase = async () => {
    if (frameCount === 0) {
      setStatusMessage('No frames to save');
      return;
    }
    
    setIsSaving(true);
    setStatusMessage('Saving...');
    
    try {
      const result = await recordingManager.saveToSupabase();
      
      if (result.success) {
        setStatusMessage('Saved!');
        // Clear recording after successful save
        setTimeout(() => {
          recordingManager.clear();
          setFrameCount(0);
          setDuration(0);
          setStatusMessage('');
          closeMenu();
        }, 1500);
      } else {
        setStatusMessage('Save failed');
      }
    } catch (error) {
      setStatusMessage('Error saving');
      console.error('VR Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  const handleClear = () => {
    recordingManager.clear();
    setFrameCount(0);
    setDuration(0);
    setStatusMessage('Cleared');
    setTimeout(() => closeMenu(), 500);
  };
  
  const handleClose = () => {
    closeMenu();
  };
  
  // Don't render anything if not in VR
  if (!isPresenting) return null;
  
  // Show indicator when menu is closed
  if (!menuOpen) {
    return (
      <MenuIndicator 
        camera={camera} 
        isRecording={isRecording} 
        frameCount={frameCount} 
        onClick={toggleMenu}
      />
    );
  }
  
  // Show full menu when open
  return (
    <group ref={groupRef}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[0.55, 0.4]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.95} />
      </mesh>
      
      {/* Border/frame */}
      <mesh position={[0, 0, -0.006]}>
        <planeGeometry args={[0.56, 0.41]} />
        <meshStandardMaterial color="#3399ff" />
      </mesh>
      
      {/* Title */}
      <Text
        position={[0, 0.15, 0]}
        fontSize={0.028}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {project?.name || 'Recording Control'}
      </Text>
      
      {/* Project/Option info */}
      <Text
        position={[0, 0.11, 0]}
        fontSize={0.016}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        {selectedOption?.name || 'No option'} • {selectedScenario?.name || 'No scenario'}
      </Text>
      
      {/* Stats */}
      <Text
        position={[-0.15, 0.065, 0]}
        fontSize={0.02}
        color="#3399ff"
        anchorX="left"
        anchorY="middle"
      >
        Frames: {frameCount}
      </Text>
      
      <Text
        position={[0.05, 0.065, 0]}
        fontSize={0.02}
        color="#3399ff"
        anchorX="left"
        anchorY="middle"
      >
        Time: {duration.toFixed(1)}s
      </Text>
      
      {/* Recording indicator */}
      {isRecording && (
        <>
          <mesh position={[0.22, 0.15, 0]}>
            <circleGeometry args={[0.015, 16]} />
            <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.8} />
          </mesh>
          <Text
            position={[0.22, 0.11, 0]}
            fontSize={0.012}
            color="#ff3333"
            anchorX="center"
            anchorY="middle"
          >
            REC
          </Text>
        </>
      )}
      
      {/* Main action button */}
      {!isRecording ? (
        <VRButton
          position={[0, 0.01, 0]}
          label="Start Recording"
          onClick={handleStartRecording}
          color="#006600"
          hoverColor="#008800"
          disabled={!selectedScenario}
          width={0.28}
        />
      ) : (
        <VRButton
          position={[0, 0.01, 0]}
          label="Stop Recording"
          onClick={handleStopRecording}
          color="#cc0000"
          hoverColor="#ee0000"
          width={0.28}
        />
      )}
      
      {/* Save and Clear buttons - only show when there are frames and not recording */}
      {frameCount > 0 && !isRecording && (
        <>
          <VRButton
            position={[-0.1, -0.06, 0]}
            label="Save to DB"
            onClick={handleSaveToDatabase}
            color="#0066cc"
            hoverColor="#0088ee"
            disabled={isSaving}
            width={0.16}
          />
          <VRButton
            position={[0.1, -0.06, 0]}
            label="Clear"
            onClick={handleClear}
            color="#666666"
            hoverColor="#888888"
            disabled={isSaving}
            width={0.16}
          />
        </>
      )}
      
      {/* Close button */}
      <VRButton
        position={[0, -0.13, 0]}
        label="Close Menu"
        onClick={handleClose}
        color="#444444"
        hoverColor="#666666"
        width={0.22}
      />
      
      {/* Status message */}
      {statusMessage && (
        <Text
          position={[0, -0.175, 0]}
          fontSize={0.016}
          color={statusMessage.includes('Saved') || statusMessage.includes('Recording') ? '#33cc33' : 
                 statusMessage.includes('failed') || statusMessage.includes('Error') ? '#ff3333' : '#ffcc00'}
          anchorX="center"
          anchorY="middle"
        >
          {statusMessage}
        </Text>
      )}
      
      {/* Instructions */}
      <Text
        position={[0, -0.19, 0]}
        fontSize={0.012}
        color="#666666"
        anchorX="center"
        anchorY="middle"
      >
        Squeeze both grips to close
      </Text>
    </group>
  );
}

export default VRUI;
