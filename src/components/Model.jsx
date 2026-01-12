import { useGLTF } from '@react-three/drei';
import { Suspense } from 'react';
import * as THREE from 'three';

function ModelContent() {
  const { scene } = useGLTF('/models/map_mid_compressed.glb');
  
  // Remove smoothing groups and flatten normals for hard edges
  scene.traverse((child) => {
    if (child.isMesh && child.geometry) {
      // Remove smooth shading
      child.geometry.computeVertexNormals();
      
      // Flatten normals for hard edges (no smoothing between faces)
      if (child.geometry.groups && child.geometry.groups.length > 0) {
        // For geometries with groups, we need to break the groups
        const positionAttr = child.geometry.getAttribute('position');
        const normalAttr = child.geometry.getAttribute('normal');
        
        if (normalAttr) {
          // Recompute normals per face (hard edges)
          const geometry = new THREE.BufferGeometry();
          geometry.setAttribute('position', positionAttr);
          geometry.computeVertexNormals();
          child.geometry = geometry;
        }
      }
      
      // Force flat shading
      child.material.flatShading = true;
      child.material.needsUpdate = true;
    }
  });

  return (
    <primitive object={scene} />
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


