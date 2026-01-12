import { useGLTF } from '@react-three/drei';
import { Suspense, useMemo } from 'react';

function ModelContent() {
  const { scene } = useGLTF('/models/map_mid_compressed.glb');
  
  // Apply flat shading and disable frustum culling to prevent mesh disappearing
  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh && child.material) {
        // Apply flat shading for hard edges
        child.material.flatShading = true;
        child.material.needsUpdate = true;
        
        // Disable frustum culling - always render, never cull
        // This prevents parts from disappearing when camera moves
        child.frustumCulled = false;
      }
      
      if (child.geometry) {
        child.geometry.computeBoundingSphere();
      }
    });
  }, [scene]);

  return (
    <primitive object={scene} scale={[1, 1, 1]} />
  );
}

export function Model() {
  return (
    <Suspense fallback={null}>
      <ModelContent />
    </Suspense>
  );
}

// Preload the model
useGLTF.preload('/models/map_mid_compressed.glb');





