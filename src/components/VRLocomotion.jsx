import { useRef, useState } from 'react';
import { useXR } from '@react-three/xr';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function VRLocomotion() {
  const { isPresenting } = useXR();
  const { gl } = useThree();
  
  const raycaster = useRef(new THREE.Raycaster());
  const tempMatrix = useRef(new THREE.Matrix4());
  const baseReferenceSpace = useRef(null);
  const markerRef = useRef(null);
  const floorRef = useRef(null);
  const intersection = useRef(null);
  
  const controller1 = useRef(null);
  const controller2 = useRef(null);
  const [debugCubes, setDebugCubes] = useState([]);

  useFrame(() => {
    if (!isPresenting || !gl.xr) return;

    // Get controllers if not already retrieved
    if (!controller1.current) {
      controller1.current = gl.xr.getController(0);
      controller2.current = gl.xr.getController(1);
      
      // Store base reference space on first frame in VR
      if (!baseReferenceSpace.current) {
        baseReferenceSpace.current = gl.xr.getReferenceSpace();
      }
      
      // Add select event listeners (TRIGGER button)
      const onSelectEnd = function() {
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
          
          console.log('Teleported to:', intersection.current);
        }
      };

      const onSelectStart = function() {
        this.userData.isSelecting = true;
        console.log('SELECT START (trigger pressed)');
      };

      const onSelectEndWrapper = function() {
        this.userData.isSelecting = false;
        console.log('SELECT END (trigger released)');
        onSelectEnd.call(this);
      };

      // Add squeeze event listeners (GRIP button) - spawns debug cubes
      const onSqueezeStart = function() {
        console.log('SQUEEZE (grip button pressed)!');
        
        // Get controller position
        const position = new THREE.Vector3();
        position.setFromMatrixPosition(this.matrixWorld);
        
        // Spawn a cube at controller position
        const newCube = {
          id: Date.now() + Math.random(),
          position: position.toArray(),
          color: Math.random() * 0xffffff
        };
        
        setDebugCubes(prev => [...prev, newCube]);
        console.log('Spawned cube at:', position);
      };

      controller1.current.addEventListener('selectstart', onSelectStart);
      controller1.current.addEventListener('selectend', onSelectEndWrapper);
      controller1.current.addEventListener('squeezestart', onSqueezeStart);
      
      controller2.current.addEventListener('selectstart', onSelectStart);
      controller2.current.addEventListener('selectend', onSelectEndWrapper);
      controller2.current.addEventListener('squeezestart', onSqueezeStart);
      
      console.log('VR Controllers initialized!');
      console.log('TRIGGER = teleport | GRIP = spawn debug cube');
    }

    intersection.current = null;

    // Check controller 1 for raycast
    if (controller1.current?.userData.isSelecting && floorRef.current) {
      tempMatrix.current.identity().extractRotation(controller1.current.matrixWorld);
      raycaster.current.ray.origin.setFromMatrixPosition(controller1.current.matrixWorld);
      raycaster.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix.current);

      const intersects = raycaster.current.intersectObject(floorRef.current);
      if (intersects.length > 0) {
        intersection.current = intersects[0].point;
      }
    }
    // Check controller 2 for raycast
    else if (controller2.current?.userData.isSelecting && floorRef.current) {
      tempMatrix.current.identity().extractRotation(controller2.current.matrixWorld);
      raycaster.current.ray.origin.setFromMatrixPosition(controller2.current.matrixWorld);
      raycaster.current.ray.direction.set(0, 0, -1).applyMatrix4(tempMatrix.current);

      const intersects = raycaster.current.intersectObject(floorRef.current);
      if (intersects.length > 0) {
        intersection.current = intersects[0].point;
      }
    }

    // Update marker
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
      {/* Debug cubes spawned by grip button */}
      {debugCubes.map(cube => (
        <mesh key={cube.id} position={cube.position}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color={cube.color} />
        </mesh>
      ))}
      
      {/* Teleport marker */}
      <mesh
        ref={markerRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        visible={false}
      >
        <circleGeometry args={[0.25, 32]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.7} />
      </mesh>
      
      {/* Invisible floor for raycasting */}
      <mesh
        ref={floorRef}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        visible={false}
      >
        <planeGeometry args={[100, 100]} />
        <meshBasicMaterial side={THREE.DoubleSide} />
      </mesh>
    </>
  );
}
