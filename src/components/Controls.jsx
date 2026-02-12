import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

const SPEED = 0.05;
const SPRINT_SPEED = 0.075;
const LOOK_SPEED = 0.002;

export function Controls({ modelRef, contextModelRef }) {
  const { camera, gl } = useThree();
  const { isPresenting } = useXR();
  const keysRef = useRef({});
  const rotationRef = useRef({ x: 0, y: 0 });

  // Initialize camera rotation on mount
  useEffect(() => {
    camera.rotation.order = 'YXZ';
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    // Skip desktop controls setup when in VR mode
    if (isPresenting) return;
    
    const canvas = gl.domElement;

    const handleKeyDown = (e) => {
      keysRef.current[e.key.toLowerCase()] = true;

      // ESC to exit look mode
      if (e.key === 'Escape') {
        if (document.pointerLockElement === canvas) {
          document.exitPointerLock();
        }
      }
    };

    const handleKeyUp = (e) => {
      keysRef.current[e.key.toLowerCase()] = false;
    };

    const handleMouseDown = () => {
      canvas.requestPointerLock =
        canvas.requestPointerLock || canvas.mozRequestPointerLock;
      canvas.requestPointerLock();
    };

    const handleMouseMove = (e) => {
      if (document.pointerLockElement !== canvas) return;

      const deltaX = e.movementX;
      const deltaY = e.movementY;

      rotationRef.current.x -= deltaY * LOOK_SPEED;
      rotationRef.current.y -= deltaX * LOOK_SPEED;

      rotationRef.current.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, rotationRef.current.x));

      camera.rotation.order = 'YXZ';
      camera.rotation.y = rotationRef.current.y;
      camera.rotation.x = rotationRef.current.x;
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    canvas.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      canvas.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);

      if (document.pointerLockElement === canvas) {
        document.exitPointerLock();
      }
    };
  }, [camera, gl, isPresenting]);

  // Use useFrame for smooth camera updates synced with render loop
  useFrame(() => {
    // Skip desktop controls when in VR mode
    if (isPresenting) return;
    
    const currentSpeed = keysRef.current['shift'] ? SPRINT_SPEED : SPEED;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotationRef.current.y
    );
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotationRef.current.y
    );

    // Calculate desired movement
    const movement = new THREE.Vector3(0, 0, 0);
    if (keysRef.current['w']) movement.addScaledVector(forward, currentSpeed);
    if (keysRef.current['s']) movement.addScaledVector(forward, -currentSpeed);
    if (keysRef.current['a']) movement.addScaledVector(right, -currentSpeed);
    if (keysRef.current['d']) movement.addScaledVector(right, currentSpeed);

    // Apply movement directly
    if (movement.lengthSq() > 0) {
      camera.position.add(movement);
    }
  });

  return null;
}
