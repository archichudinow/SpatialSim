import { useRef, useState, useEffect } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import { useXR, useXRInputSourceState } from '@react-three/xr';
import * as THREE from 'three';
import recordingManager from '../utils/RecordingManager';

// Global state to track if menu is open (used to disable locomotion)
let menuOpenState = false;
export function isVRMenuOpen() {
  return menuOpenState;
}

// VR Recording UI Panel - Always visible floating panel in VR
export function VRUI({ project, selectedOption, selectedScenario, onMenuStateChange }) {
  const { camera } = useThree();
  const { isPresenting, session } = useXR();
  const groupRef = useRef();
  
  const [isRecording, setIsRecording] = useState(false);
  const [frameCount, setFrameCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [debugInfo, setDebugInfo] = useState('Waiting for controllers...');
  
  // Get controller states for debugging
  const leftController = useXRInputSourceState('controller', 'left');
  const rightController = useXRInputSourceState('controller', 'right');
  
  // Debug: Log controller state to console and update debug text
  useFrame(() => {
    if (!isPresenting) return;
    
    // Build debug info
    let debug = '';
    
    if (leftController) {
      const gamepad = leftController.gamepad;
      if (gamepad) {
        const buttons = Object.keys(gamepad).filter(k => gamepad[k]?.state);
        debug += `L: ${buttons.join(', ') || 'no buttons'}\n`;
        
        // Log pressed buttons
        buttons.forEach(btn => {
          if (gamepad[btn]?.state === 'pressed') {
            console.log('Left pressed:', btn);
          }
        });
      } else {
        debug += 'L: no gamepad\n';
      }
    } else {
      debug += 'L: no controller\n';
    }
    
    if (rightController) {
      const gamepad = rightController.gamepad;
      if (gamepad) {
        const buttons = Object.keys(gamepad).filter(k => gamepad[k]?.state);
        debug += `R: ${buttons.join(', ') || 'no buttons'}`;
        
        // Log pressed buttons
        buttons.forEach(btn => {
          if (gamepad[btn]?.state === 'pressed') {
            console.log('Right pressed:', btn);
          }
        });
      } else {
        debug += 'R: no gamepad';
      }
    } else {
      debug += 'R: no controller';
    }
    
    setDebugInfo(debug);
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
  
  // Position panel to follow camera (on left side)
  useFrame(() => {
    if (!groupRef.current || !isPresenting) return;
    
    const cameraPosition = new THREE.Vector3();
    const cameraDirection = new THREE.Vector3();
    camera.getWorldPosition(cameraPosition);
    camera.getWorldDirection(cameraDirection);
    
    // Get left direction
    const leftDir = new THREE.Vector3(-cameraDirection.z, 0, cameraDirection.x).normalize();
    
    // Position panel on the left side of view, slightly forward
    const panelPos = cameraPosition.clone()
      .add(cameraDirection.clone().setY(0).normalize().multiplyScalar(0.8))
      .add(leftDir.multiplyScalar(0.4));
    panelPos.y = cameraPosition.y - 0.1;
    
    groupRef.current.position.lerp(panelPos, 0.1);
    groupRef.current.lookAt(cameraPosition);
  });
  
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
  
  // Don't render if not in VR
  if (!isPresenting) return null;
  
  return (
    <group ref={groupRef}>
      {/* Background panel */}
      <mesh position={[0, 0, -0.002]}>
        <planeGeometry args={[0.35, 0.28]} />
        <meshBasicMaterial color="#1a1a2e" transparent opacity={0.95} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Border */}
      <mesh position={[0, 0, -0.003]}>
        <planeGeometry args={[0.36, 0.29]} />
        <meshBasicMaterial color={isRecording ? "#ff3333" : "#3399ff"} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Title */}
      <Text
        position={[0, 0.10, 0]}
        fontSize={0.022}
        color="white"
        anchorX="center"
        anchorY="middle"
      >
        VR Recording
      </Text>
      
      {/* Recording status */}
      <Text
        position={[0, 0.07, 0]}
        fontSize={0.014}
        color={isRecording ? "#ff6666" : "#aaaaaa"}
        anchorX="center"
        anchorY="middle"
      >
        {isRecording ? `● REC ${frameCount} frames (${duration.toFixed(1)}s)` : 
         frameCount > 0 ? `${frameCount} frames recorded` : 'Ready'}
      </Text>
      
      {/* Scenario info */}
      <Text
        position={[0, 0.045, 0]}
        fontSize={0.01}
        color="#888888"
        anchorX="center"
        anchorY="middle"
      >
        {selectedScenario?.name || 'No scenario selected'}
      </Text>
      
      {/* Buttons - using ray pointer interaction */}
      {!isRecording ? (
        <group position={[0, 0.01, 0]} onClick={handleStartRecording}>
          <mesh>
            <boxGeometry args={[0.12, 0.035, 0.008]} />
            <meshBasicMaterial color="#228822" />
          </mesh>
          <Text position={[0, 0, 0.005]} fontSize={0.012} color="white" anchorX="center">
            START
          </Text>
        </group>
      ) : (
        <group position={[0, 0.01, 0]} onClick={handleStopRecording}>
          <mesh>
            <boxGeometry args={[0.12, 0.035, 0.008]} />
            <meshBasicMaterial color="#cc2222" />
          </mesh>
          <Text position={[0, 0, 0.005]} fontSize={0.012} color="white" anchorX="center">
            STOP
          </Text>
        </group>
      )}
      
      {/* Save button */}
      {frameCount > 0 && !isRecording && (
        <group position={[-0.06, -0.035, 0]} onClick={handleSaveToDatabase}>
          <mesh>
            <boxGeometry args={[0.1, 0.03, 0.008]} />
            <meshBasicMaterial color="#2266cc" />
          </mesh>
          <Text position={[0, 0, 0.005]} fontSize={0.01} color="white" anchorX="center">
            SAVE
          </Text>
        </group>
      )}
      
      {/* Clear button */}
      {frameCount > 0 && !isRecording && (
        <group position={[0.06, -0.035, 0]} onClick={handleClear}>
          <mesh>
            <boxGeometry args={[0.1, 0.03, 0.008]} />
            <meshBasicMaterial color="#666666" />
          </mesh>
          <Text position={[0, 0, 0.005]} fontSize={0.01} color="white" anchorX="center">
            CLEAR
          </Text>
        </group>
      )}
      
      {/* Status message */}
      {statusMessage && (
        <Text
          position={[0, -0.07, 0]}
          fontSize={0.012}
          color="#ffcc00"
          anchorX="center"
          anchorY="middle"
        >
          {statusMessage}
        </Text>
      )}
      
      {/* Debug info */}
      <Text
        position={[0, -0.10, 0]}
        fontSize={0.008}
        color="#666666"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.3}
      >
        {debugInfo}
      </Text>
    </group>
  );
}

export default VRUI;
