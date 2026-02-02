import { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';
import recordingManager from '../utils/RecordingManager';

// Simple 3D button component for VR
function VRButton({ position, label, onClick, color = '#333333', hoverColor = '#555555', activeColor = '#007bff', isActive = false, disabled = false }) {
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
        <boxGeometry args={[0.18, 0.06, 0.01]} />
        <meshStandardMaterial color={currentColor} />
      </mesh>
      <Text
        position={[0, 0, 0.01]}
        fontSize={0.02}
        color={disabled ? '#999999' : 'white'}
        anchorX="center"
        anchorY="middle"
      >
        {label}
      </Text>
    </group>
  );
}

// VR Recording UI Panel
export function VRUI({ project, selectedOption, selectedScenario }) {
  const { camera } = useThree();
  const { isPresenting } = useXR();
  const groupRef = useRef();
  
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');
  
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
  
  // Position UI in front of user
  useFrame(() => {
    if (!groupRef.current || !isPresenting) return;
    
    // Get camera world position and direction
    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraDirection);
    
    // Position UI 1.5m in front of user, slightly below eye level
    const uiPosition = cameraPosition.clone()
      .add(cameraDirection.multiplyScalar(1.5));
    uiPosition.y = cameraPosition.y - 0.3; // Slightly below eye level
    
    groupRef.current.position.copy(uiPosition);
    
    // Make UI face the camera
    groupRef.current.lookAt(cameraPosition);
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
        }, 2000);
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
  };
  
  // Only render in VR mode
  if (!isPresenting) return null;
  
  return (
    <group ref={groupRef}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.005]}>
        <planeGeometry args={[0.5, 0.35]} />
        <meshStandardMaterial color="#1a1a1a" transparent opacity={0.9} />
      </mesh>
      
      {/* Title */}
      <Text
        position={[0, 0.13, 0]}
        fontSize={0.025}
        color="white"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {project?.name || 'Recording Control'}
      </Text>
      
      {/* Project/Option info */}
      <Text
        position={[0, 0.095, 0]}
        fontSize={0.015}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
      >
        {selectedOption?.name || 'No option'} • {selectedScenario?.name || 'No scenario'}
      </Text>
      
      {/* Stats */}
      <Text
        position={[-0.12, 0.055, 0]}
        fontSize={0.018}
        color="#3399ff"
        anchorX="left"
        anchorY="middle"
      >
        Frames: {frameCount}
      </Text>
      
      <Text
        position={[0.05, 0.055, 0]}
        fontSize={0.018}
        color="#3399ff"
        anchorX="left"
        anchorY="middle"
      >
        Time: {duration.toFixed(1)}s
      </Text>
      
      {/* Recording indicator */}
      {isRecording && (
        <mesh position={[0.18, 0.13, 0]}>
          <circleGeometry args={[0.012, 16]} />
          <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={0.5} />
        </mesh>
      )}
      
      {/* Buttons */}
      {!isRecording ? (
        <VRButton
          position={[0, 0, 0]}
          label="Start Recording"
          onClick={handleStartRecording}
          color="#006600"
          hoverColor="#008800"
          disabled={!selectedScenario}
        />
      ) : (
        <VRButton
          position={[0, 0, 0]}
          label="Stop Recording"
          onClick={handleStopRecording}
          color="#cc0000"
          hoverColor="#ee0000"
        />
      )}
      
      {/* Save and Clear buttons - only show when there are frames */}
      {frameCount > 0 && !isRecording && (
        <>
          <VRButton
            position={[-0.1, -0.07, 0]}
            label="Save to DB"
            onClick={handleSaveToDatabase}
            color="#0066cc"
            hoverColor="#0088ee"
            disabled={isSaving}
          />
          <VRButton
            position={[0.1, -0.07, 0]}
            label="Clear"
            onClick={handleClear}
            color="#666666"
            hoverColor="#888888"
            disabled={isSaving}
          />
        </>
      )}
      
      {/* Status message */}
      {statusMessage && (
        <Text
          position={[0, -0.13, 0]}
          fontSize={0.016}
          color={statusMessage.includes('Saved') || statusMessage.includes('Recording') ? '#33cc33' : 
                 statusMessage.includes('failed') || statusMessage.includes('Error') ? '#ff3333' : '#ffcc00'}
          anchorX="center"
          anchorY="middle"
        >
          {statusMessage}
        </Text>
      )}
    </group>
  );
}

export default VRUI;
