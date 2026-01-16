import { useEffect, useRef, useState } from 'react';
import { useXR } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function VRLocomotion() {
  const { isPresenting, player } = useXR();
  const { gl, scene, camera } = useThree();
  
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const raycaster = useRef(new THREE.Raycaster());
  const tempMatrix = useRef(new THREE.Matrix4());
  const baseReferenceSpace = useRef(null);
  
  const controller1Ref = useRef(null);
  const controller2Ref = useRef(null);
  const markerRef = useRef(null);
  const floorRef = useRef(null);
  const intersection = useRef(null);

  // Setup controllers and event listeners
  useEffect(() => {
    if (!gl.xr) return;

    // Store base reference space
    const onSessionStart = () => {
      baseReferenceSpace.current = gl.xr.getReferenceSpace();
    };
    gl.xr.addEventListener('sessionstart', onSessionStart);

    // Get controllers
    controller1Ref.current = gl.xr.getController(0);
    controller2Ref.current = gl.xr.getController(1);

    // Teleport handlers
    const onSelectStart = function() {
      this.userData.isSelecting = true;
    };

    const onSelectEnd = function() {
      this.userData.isSelecting = false;

      if (intersection.current && baseReferenceSpace.current) {
        const offsetPosition = {
          x: -intersection.current.x,
          y: -intersection.current.y,
          z: -intersection.current.z,
          w: 1
        };
        const offsetRotation = new THREE.Quaternion();
        const transform = new XRRigidTransform(offsetPosition, offsetRotation);
        const teleportSpaceOffset = baseReferenceSpace.current.getOffsetReferenceSpace(transform);

        gl.xr.setReferenceSpace(teleportSpaceOffset);
      }
    };

    // Add event listeners
    controller1Ref.current.addEventListener('selectstart', onSelectStart);
    controller1Ref.current.addEventListener('selectend', onSelectEnd);
    controller2Ref.current.addEventListener('selectstart', onSelectStart);
    controller2Ref.current.addEventListener('selectend', onSelectEnd);

    // Add controllers to scene
    scene.add(controller1Ref.current);
    scene.add(controller2Ref.current);

    // Build controller ray lines
    const buildControllerLine = () => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0, 0, -1], 3));
      geometry.setAttribute('color', new THREE.Float32BufferAttribute([0.5, 0.5, 0.5, 0, 0, 0], 3));
      const material = new THREE.LineBasicMaterial({ 
        vertexColors: true, 
        blending: THREE.AdditiveBlending 
      });
      return new THREE.Line(geometry, material);
    };

    controller1Ref.current.add(buildControllerLine());
    controller2Ref.current.add(buildControllerLine());

    return () => {
      gl.xr.removeEventListener('sessionstart', onSessionStart);
      if (controller1Ref.current) {
        scene.remove(controller1Ref.current);
      }
      if (controller2Ref.current) {
        scene.remove(controller2Ref.current);
      }
    };
  }, [gl, scene]);

  useFrame((state, delta) => {
    if (!isPresenting) return;

    intersection.current = undefined;

    // Check controller 1 for teleport ray
    if (controller1Ref.current?.userData.isSelecting) {
      tempMatrix.current.identity().extractRotation(controller1Ref.current.matrixWorld);
      
      raycaster.current.ray.origin.setFromMatrixPosition(controller1Ref.current.matrixWorld);
      raycaster.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix.current);

      if (floorRef.current) {
        const intersects = raycaster.current.intersectObject(floorRef.current);
        if (intersects.length > 0) {
          intersection.current = intersects[0].point;
        }
      }
    }
    // Check controller 2 for teleport ray
    else if (controller2Ref.current?.userData.isSelecting) {
      tempMatrix.current.identity().extractRotation(controller2Ref.current.matrixWorld);
      
      raycaster.current.ray.origin.setFromMatrixPosition(controller2Ref.current.matrixWorld);
      raycaster.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix.current);

      if (floorRef.current) {
        const intersects = raycaster.current.intersectObject(floorRef.current);
        if (intersects.length > 0) {
          intersection.current = intersects[0].point;
        }
      }
    }

    // Update marker position
    if (markerRef.current) {
      if (intersection.current) {
        markerRef.current.position.copy(intersection.current);
        markerRef.current.visible = true;
      } else {
        markerRef.current.visible = false;
      }
    }
  });

  return (
    <>
      {/* Teleport marker */}
      <mesh
        ref={markerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        visible={false}
      >
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.6} />
      </mesh>
      
      {/* Invisible floor plane for raycasting */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial />
      </mesh>
    </>
  );
}
