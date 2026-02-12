import { useGLTF } from '@react-three/drei';
import { Suspense, useMemo, forwardRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const vertexShader = `
  varying vec3 vPosition;
  varying float vShade;
  
  void main() {
    vPosition = position;
    // Pre-calculate shading in vertex shader (cheaper than per-fragment)
    vec3 norm = normalMatrix * normal;
    vShade = 0.7 + 0.3 * dot(norm, vec3(0.5, 1.0, 0.3));
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = `
  varying vec3 vPosition;
  varying float vShade;
  
  void main() {
    // Simple gradient: 0.01 = 1/100 meters
    float t = clamp((vPosition.y + 10.0) * 0.01, 0.0, 1.0);
    float gray = 0.4 + 0.2 * t;
    gl_FragColor = vec4(vec3(gray * vShade), 1.0);
  }
`;

const fragmentShaderBlue = `
  varying vec3 vPosition;
  varying float vShade;
  
  void main() {
    float t = clamp((vPosition.y + 10.0) * 0.0333, 0.0, 1.0);
    vec3 color = mix(vec3(0.3, 0.35, 0.4), vec3(0.7, 0.8, 0.9), t);
    gl_FragColor = vec4(color * vShade, 1.0);
  }
`;

const fragmentShaderOchre = `
  varying vec3 vPosition;
  varying float vShade;
  
  void main() {
    float t = clamp((vPosition.y + 10.0) * 0.0333, 0.0, 1.0);
    vec3 color = mix(vec3(0.4, 0.3, 0.2), vec3(0.9, 0.8, 0.6), t);
    gl_FragColor = vec4(color * vShade, 1.0);
  }
`;

function ModelContent({ url, ref }) {
  const { scene } = useGLTF(url);
  
  // Merge meshes with same materials and preserve original materials
  const optimizedScene = useMemo(() => {
    // Create shader materials
    const shaderMaterial = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      side: THREE.DoubleSide,
    });
    
    const shaderMaterialBlue = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShaderBlue,
      side: THREE.DoubleSide,
    });
    
    const shaderMaterialOchre = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader: fragmentShaderOchre,
      side: THREE.DoubleSide,
    });
    
    const regularGeometries = [];
    const blueGeometries = [];
    const ochreGeometries = [];
    const collisionMeshes = []; // Store collision ramps separately
    
    // Helper to check if material is a collision marker
    const isCollisionMaterial = (material) => {
      if (!material) return false;
      
      // Check material name for "COLLISION" (case insensitive)
      if (material.name && material.name.toUpperCase().includes('COLLISION')) {
        return true;
      }
      
      // Check color for magenta #FF00FF (R=1, G=0, B=1)
      if (material.color) {
        const r = material.color.r || 0;
        const g = material.color.g || 0;
        const b = material.color.b || 0;
        // Magenta: high red, low green, high blue
        if (r > 0.9 && g < 0.1 && b > 0.9) {
          return true;
        }
      }
      
      return false;
    };
    
    // Helper function to analyze if color is blue
    const isBlueish = (color) => {
      if (!color) return false;
      const r = color.r || 0;
      const g = color.g || 0;
      const b = color.b || 0;
      // Blue if blue channel is dominant and greater than red
      return b > r && b > 0.3;
    };
    
    // Helper function to analyze if color is ochre/yellow/warm
    const isOchrish = (color) => {
      if (!color) return false;
      const r = color.r || 0;
      const g = color.g || 0;
      const b = color.b || 0;
      // Ochre if red/yellow tones (r and g higher than b, and r is significant)
      return r > b && g > b && r > 0.3;
    };
    
    // Collect geometries based on material color
    scene.traverse((child) => {
      if (child.isMesh && child.geometry && child.material) {
        // Check if this is a collision mesh first
        if (isCollisionMaterial(child.material)) {
          // Clone mesh and make completely invisible for collision ramps
          const collisionMesh = child.clone();
          collisionMesh.material = new THREE.MeshBasicMaterial({
            visible: false,
            colorWrite: false,
            depthWrite: false,
          });
          collisionMesh.visible = false; // Make mesh invisible
          collisionMesh.updateWorldMatrix(true, false);
          
          // Compute BVH for collision detection
          if (collisionMesh.geometry && !collisionMesh.geometry.boundsTree) {
            collisionMesh.geometry.computeBoundsTree();
          }
          
          collisionMeshes.push(collisionMesh);
          return; // Skip adding to visible geometry
        }
        
        // Clone and apply world transform to geometry for visible meshes
        const geometry = child.geometry.clone();
        child.updateWorldMatrix(true, false);
        geometry.applyMatrix4(child.matrixWorld);
        
        // Check material color
        const color = child.material.color;
        
        if (isBlueish(color)) {
          blueGeometries.push(geometry);
        } else if (isOchrish(color)) {
          ochreGeometries.push(geometry);
        } else {
          regularGeometries.push(geometry);
        }
      }
    });
    
    // Create new scene with merged meshes
    const newScene = new THREE.Group();
    
    // Add regular gray-white gradient meshes
    if (regularGeometries.length > 0) {
      try {
        const mergedGeometry = mergeGeometries(regularGeometries, false);
        if (mergedGeometry) {
          mergedGeometry.computeBoundingSphere();
          mergedGeometry.computeVertexNormals();
          
          const mesh = new THREE.Mesh(mergedGeometry, shaderMaterial);
          mesh.frustumCulled = false;
          newScene.add(mesh);
        }
      } catch (error) {
        console.warn('Could not merge regular geometries:', error);
        regularGeometries.forEach(geo => {
          const mesh = new THREE.Mesh(geo, shaderMaterial);
          mesh.frustumCulled = false;
          newScene.add(mesh);
        });
      }
    }
    
    // Add blue gradient meshes
    if (blueGeometries.length > 0) {
      try {
        const mergedGeometry = mergeGeometries(blueGeometries, false);
        if (mergedGeometry) {
          mergedGeometry.computeBoundingSphere();
          mergedGeometry.computeVertexNormals();
          
          const mesh = new THREE.Mesh(mergedGeometry, shaderMaterialBlue);
          mesh.frustumCulled = false;
          newScene.add(mesh);
        }
      } catch (error) {
        console.warn('Could not merge blue geometries:', error);
        blueGeometries.forEach(geo => {
          const mesh = new THREE.Mesh(geo, shaderMaterialBlue);
          mesh.frustumCulled = false;
          newScene.add(mesh);
        });
      }
    }
    
    // Add ochre gradient meshes
    if (ochreGeometries.length > 0) {
      try {
        const mergedGeometry = mergeGeometries(ochreGeometries, false);
        if (mergedGeometry) {
          mergedGeometry.computeBoundingSphere();
          mergedGeometry.computeVertexNormals();
          
          const mesh = new THREE.Mesh(mergedGeometry, shaderMaterialOchre);
          mesh.frustumCulled = false;
          newScene.add(mesh);
        }
      } catch (error) {
        console.warn('Could not merge ochre geometries:', error);
        ochreGeometries.forEach(geo => {
          const mesh = new THREE.Mesh(geo, shaderMaterialOchre);
          mesh.frustumCulled = false;
          newScene.add(mesh);
        });
      }
    }
    
    // Add invisible collision meshes (for stairs/ramps) if any exist
    if (collisionMeshes.length > 0) {
      console.log(`Found ${collisionMeshes.length} collision ramp(s) in model`);
      collisionMeshes.forEach(mesh => {
        newScene.add(mesh);
      });
    }
    
    return newScene;
  }, [scene, url]);

  return (
    <group ref={ref} scale={[1, 1, 1]}>
      <primitive object={optimizedScene} />
    </group>
  );
}

export const Model = forwardRef((props, ref) => {
  const { url } = props;
  
  if (!url) {
    return null;
  }
  
  return (
    <Suspense fallback={null}>
      <ModelContent ref={ref} url={url} />
    </Suspense>
  );
});





