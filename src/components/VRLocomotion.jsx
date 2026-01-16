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
  const lastTurnTime = useRef(0);
  const debugLogged = useRef(false);
  
  useFrame((state, delta) => {
    if (!isPresenting || !player) return;

    // Get controller gamepads
    const leftGamepad = leftController?.inputSource?.gamepad;
    const rightGamepad = rightController?.inputSource?.gamepad;
    
    // Debug logging - log once when controllers are detected
    if (!debugLogged.current && (leftGamepad || rightGamepad)) {
      console.log('VR Controllers detected!');
      if (leftGamepad) {
        console.log('Left controller axes:', leftGamepad.axes.length);
        console.log('Left controller buttons:', leftGamepad.buttons.length);
      }
      if (rightGamepad) {
        console.log('Right controller axes:', rightGamepad.axes.length);
        console.log('Right controller buttons:', rightGamepad.buttons.length);
      }
      debugLogged.current = true;
    }
    
    // LEFT CONTROLLER - Movement (try both axis pairs)
    if (leftGamepad && leftGamepad.axes.length >= 2) {
      // Try axes 2,3 first (common for Oculus Quest)
      let moveX = leftGamepad.axes.length >= 4 ? leftGamepad.axes[2] : leftGamepad.axes[0];
      let moveZ = leftGamepad.axes.length >= 4 ? leftGamepad.axes[3] : leftGamepad.axes[1];
      
      const deadZone = 0.15;
      
      // Log thumbstick values when moved (throttled)
      if ((Math.abs(moveX) > deadZone || Math.abs(moveZ) > deadZone) && Math.random() < 0.01) {
        console.log('Left thumbstick:', moveX.toFixed(2), moveZ.toFixed(2));
      }
      
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
    
    // RIGHT CONTROLLER - Snap turning
    if (rightGamepad && rightGamepad.axes.length >= 2) {
      let turnX = rightGamepad.axes.length >= 4 ? rightGamepad.axes[2] : rightGamepad.axes[0];
      
      const snapTurnDeadZone = 0.7;
      const currentTime = state.clock.elapsedTime;
      
      // Snap turning with cooldown to prevent multiple turns
      if (Math.abs(turnX) > snapTurnDeadZone && (currentTime - lastTurnTime.current) > 0.3) {
        const turnAmount = turnX > 0 ? -Math.PI / 4 : Math.PI / 4;
        player.rotation.y += turnAmount;
        lastTurnTime.current = currentTime;
        console.log('Snap turn:', (turnAmount * 180 / Math.PI).toFixed(0), 'degrees');
      }
    }
  });

  return null;
}
