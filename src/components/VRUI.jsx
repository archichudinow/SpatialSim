import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';
import recordingManager from '../utils/RecordingManager';

// Global state to track if menu is open (used to disable locomotion)
let menuOpenState = false;
export function isVRMenuOpen() {
  return menuOpenState;
}

// VR Recording UI Panel - Fixed position panel in VR for debugging
export function VRUI({ project, selectedOption, selectedScenario, onMenuStateChange }) {
  const { isPresenting } = useXR();
  
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  
  // Update recording status
  useEffect(() => {
    const interval = setInterval(() => {
      const status = recordingManager.getStatus();
      setIsRecording(status.isRecording);
      setFrameCount(status.frameCount);
      setDuration(status.duration);
    }, 100);
    
    return () => clearInterval(interval);
  }, []);
  
  const handleStartRecording = () => {
    if (!selectedScenario) {
      setStatusMessage('No scenario!');
      return;
    }
    recordingManager.startRecording();
    setIsRecording(true);
    setFrameCount(0);
    setStatusMessage('Recording...');
  };
  
  const handleStopRecording = () => {
    recordingManager.stopRecording();
    setIsRecording(false);
    setStatusMessage('Stopped');
  };
  
  const handleSaveToDatabase = async () => {
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
          setFrameCount(0);
          setStatusMessage('');
        }, 2000);
      } else {
        setStatusMessage('Failed!');
      }
    } catch (error) {
      setStatusMessage('Error!');
      console.error('Save error:', error);
    }
  };
  
  const handleClear = () => {
    recordingManager.clear();
    setFrameCount(0);
    setDuration(0);
    setStatusMessage('Cleared');
  };
  
  // ALWAYS render - both in VR and desktop for testing
  // Position at fixed world coordinates: in front and slightly to the left at eye level
  return (
    <group position={[0, 1.5, -2]}>
      {/* Debug: Large visible cube to confirm rendering */}
      <mesh position={[0, 0.3, 0]}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color={isPresenting ? "#00ff00" : "#ff0000"} />
      </mesh>
      
      {/* Background panel */}
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[0.5, 0.35]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[0.52, 0.37]} />
        <meshBasicMaterial color={isRecording ? "#ff3333" : "#3399ff"} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Title */}
      <Text
        position={[0, 0.12, 0]}
        fontSize={0.03}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        {isPresenting ? "VR MODE" : "DESKTOP MODE"}
      </Text>
      
      {/* Recording status */}
      <Text
        position={[0, 0.08, 0]}
        fontSize={0.02}
        color={isRecording ? "#ff6666" : "#aaaaaa"}
        anchorX="center"
        anchorY="middle"
      >
        {isRecording ? `REC ${frameCount} frames` : 
         frameCount > 0 ? `${frameCount} frames recorded` : 'Ready to record'}
      </Text>
      
      {/* Scenario info */}
      <Text
        position={[0, 0.045, 0]}
        fontSize={0.015}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        {selectedScenario?.name || 'No scenario selected'}
      </Text>
      
      {/* Buttons - using ray pointer interaction */}
      {!isRecording ? (
        <group position={[0, 0, 0]} onClick={handleStartRecording}>
          <mesh>
            <boxGeometry args={[0.15, 0.045, 0.01]} />
            <meshBasicMaterial color="#228822" />
          </mesh>
          <Text position={[0, 0, 0.006]} fontSize={0.018} color="white" anchorX="center">
            START
          </Text>
        </group>
      ) : (
        <group position={[0, 0, 0]} onClick={handleStopRecording}>
          <mesh>
            <boxGeometry args={[0.15, 0.045, 0.01]} />
            <meshBasicMaterial color="#cc2222" />
          </mesh>
          <Text position={[0, 0, 0.006]} fontSize={0.018} color="white" anchorX="center">
            STOP
          </Text>
        </group>
      )}
      
      {/* Save button */}
      {frameCount > 0 && !isRecording && (
        <group position={[-0.08, -0.06, 0]} onClick={handleSaveToDatabase}>
          <mesh>
            <boxGeometry args={[0.12, 0.04, 0.01]} />
            <meshBasicMaterial color="#2266cc" />
          </mesh>
          <Text position={[0, 0, 0.006]} fontSize={0.014} color="white" anchorX="center">
            SAVE
          </Text>
        </group>
      )}
      
      {/* Clear button */}
      {frameCount > 0 && !isRecording && (
        <group position={[0.08, -0.06, 0]} onClick={handleClear}>
          <mesh>
            <boxGeometry args={[0.12, 0.04, 0.01]} />
            <meshBasicMaterial color="#666666" />
          </mesh>
          <Text position={[0, 0, 0.006]} fontSize={0.014} color="white" anchorX="center">
            CLEAR
          </Text>
        </group>
      )}
      
      {/* Status message */}
      {statusMessage && (
        <Text
          position={[0, -0.11, 0]}
          fontSize={0.016}
          color="#ffcc00"
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
