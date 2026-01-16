import { useEffect, useRef } from 'react';
import { useXR, useController } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function VRLocomotion() {
  const { isPresenting, player } = useXR();
  const { camera } = useThree();
  const leftController = useController('left');
  const rightController = useController('right');
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  
  useFrame((state, delta) => {
    if (!isPresenting || !player) return;

    // Get left controller thumbstick for movement (x and y axes)
    const leftGamepad = leftController?.inputSource?.gamepad;
    const rightGamepad = rightController?.inputSource?.gamepad;
    
    if (leftGamepad && leftGamepad.axes.length >= 4) {
      // Axes 2 and 3 are typically the thumbstick on Oculus Quest
      const moveX = leftGamepad.axes[2];
      const moveZ = leftGamepad.axes[3];
      
      // Only move if thumbstick is pressed beyond dead zone
      const deadZone = 0.2;
      if (Math.abs(moveX) > deadZone || Math.abs(moveZ) > deadZone) {
        // Get camera direction (where user is looking)
        camera.getWorldDirection(direction.current);
        direction.current.y = 0; // Keep movement horizontal
        direction.current.normalize();
        
        // Calculate right vector for strafing
        const right = new THREE.Vector3();
        right.crossVectors(camera.up, direction.current).normalize();
        
        // Movement speed
        const speed = 3.0; // units per second
        
        // Calculate movement vector
        velocity.current.set(0, 0, 0);
        velocity.current.addScaledVector(direction.current, -moveZ * speed * delta);
        velocity.current.addScaledVector(right, moveX * speed * delta);
        
        // Move the player
        player.position.add(velocity.current);
      }
    }
    
    // Optional: Right thumbstick for snap turning
    if (rightGamepad && rightGamepad.axes.length >= 4) {
      const turnX = rightGamepad.axes[2];
      const snapTurnDeadZone = 0.7;
      
      // Snap turning (could enhance this with smooth turning)
      if (Math.abs(turnX) > snapTurnDeadZone) {
        // Simple snap turn by 45 degrees
        const turnAmount = turnX > 0 ? -Math.PI / 4 : Math.PI / 4;
        player.rotation.y += turnAmount;
      }
    }
  });

  return null;
}
