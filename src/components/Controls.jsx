import { useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { useXR } from '@react-three/xr';
import * as THREE from 'three';

const SPEED = 0.15;
const SPRINT_SPEED = 0.3;
const LOOK_SPEED = 0.002;

export function Controls() {
  const { camera, gl } = useThree();
  const { isPresenting } = useXR();
  const keysRef = useRef({});
  const rotationRef = useRef({ x: 0, y: 0 });

  // Only enable desktop controls if NOT in VR
  if (isPresenting) return null;

  useEffect(() => {
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

    const handleMouseDown = (e) => {
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
  }, [camera, gl]);

  // Use useFrame for smooth camera updates synced with render loop
  useFrame(() => {
    const currentSpeed = keysRef.current['shift'] ? SPRINT_SPEED : SPEED;

    const forward = new THREE.Vector3(0, 0, -1).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotationRef.current.y
    );
    const right = new THREE.Vector3(1, 0, 0).applyAxisAngle(
      new THREE.Vector3(0, 1, 0),
      rotationRef.current.y
    );

    if (keysRef.current['w']) camera.position.addScaledVector(forward, currentSpeed);
    if (keysRef.current['s']) camera.position.addScaledVector(forward, -currentSpeed);
    if (keysRef.current['a']) camera.position.addScaledVector(right, -currentSpeed);
    if (keysRef.current['d']) camera.position.addScaledVector(right, currentSpeed);
  });

  return null;
}
