import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { PerspectiveCamera, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

/**
 * SceneSetup Component
 * Configures the Three.js scene with camera, controls, and background
 */
export default function SceneSetup() {
  const { scene } = useThree();

  useEffect(() => {
    // Background
    scene.background = new THREE.Color('#333333');
  }, [scene]);

  return (
    <>
      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        fov={10}
        near={1}
        far={5000}
        position={[-400, 600, -1000]}
      />

      {/* Controls */}
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        target={[0, 0, -250]}
        minDistance={100}
        maxDistance={4000}
        maxPolarAngle={Math.PI / 2.2}
      />
    </>
  );
}
