import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import { useAppState } from '../../AppState';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import * as THREE from 'three';
import { createGradientMaterial } from '../../shaders/gradientMaterial';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

interface LoadVisualizationModelProps {
  url: string;
  position?: [number, number, number] | null;
  scale?: number | null;
  flatShading?: boolean;
  useCheapShader?: boolean;
  optimizeMerge?: boolean;
}

/**
 * LoadVisualizationModel Component
 * Loads a 3D model for visualization/context in the scene
 * 
 * @param {Object} props
 * @param {string} props.url - URL to the GLB/GLTF model file
 * @param {Array} props.position - Optional [x, y, z] position offset
 * @param {number} props.scale - Optional scale factor
 * @param {boolean} props.flatShading - Use flat shading (default true for performance, false for smooth)
 * @param {boolean} props.useCheapShader - Use custom gradient shader material instead of MeshLambertMaterial (faster, default false)
 * @param {boolean} props.optimizeMerge - Merge meshes with the same material to reduce draw calls (default false)
 * @returns {null} This component doesn't render anything
 */
export default function LoadVisualizationModel({ 
  url, 
  position = null, 
  scale = null, 
  flatShading = true, 
  useCheapShader = false,
  optimizeMerge = false
}: LoadVisualizationModelProps) {
  const { scene } = useThree();
  const setLoaderMessage = useAppState((state) => state.actions.data.setLoaderMessage);
  const setContextModelLoaded = useAppState((state) => state.actions.data.setContextModelLoaded);

  useEffect(() => {
    if (!url) return;

    const loader = new GLTFLoader();
    
    // Setup DRACO decoder for compressed models
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    dracoLoader.setDecoderConfig({ type: 'js' });
    loader.setDRACOLoader(dracoLoader);
    
    let loadedModel: THREE.Object3D | null = null;

    async function loadGLTF() {
      try {
        setLoaderMessage('contextModel', '...loading visualization model');
        
        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            url,
            resolve,
            (progress) => {
              if (progress.total > 0) {
                const percent = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
                const loadedMB = (progress.loaded / (1024 * 1024)).toFixed(1);
                const totalMB = (progress.total / (1024 * 1024)).toFixed(1);
                setLoaderMessage('contextModel', `...loading visualization model (${loadedMB}/${totalMB}MB - ${percent}%)`);
              }
            },
            reject
          );
        });

        const baseColor = 0x666666;
        
        // Create material based on useCheapShader prop
        const material = useCheapShader
          ? createGradientMaterial(baseColor, 1.0, flatShading, true)  // useGradient=true
          : new THREE.MeshLambertMaterial({
              color: baseColor,
              flatShading: flatShading,
              side: THREE.FrontSide,
              depthWrite: true
            });

        gltf.scene.traverse((child: any) => {
          if (child.isMesh) {
            // Simplify geometry if it has too many vertices
            if (child.geometry.attributes.position.count > 10000) {
              child.geometry.deleteAttribute('uv'); // Remove UVs if not needed
              child.geometry.deleteAttribute('uv2');
            }
            
            child.material = material;
            child.castShadow = false;
            child.receiveShadow = false;
            child.frustumCulled = false; // Disable to prevent model disappearing (bounding box issues)
            child.renderOrder = -1; // Render visualization model first
          }
        // Optimize by merging meshes with the same material
        if (optimizeMerge) {
          const meshesToMerge: THREE.Mesh[] = [];
          
          gltf.scene.traverse((child: any) => {
            if (child.isMesh) {
              meshesToMerge.push(child);
            }
          });

          if (meshesToMerge.length > 1) {
            // Collect geometries and apply world transforms
            const geometries: THREE.BufferGeometry[] = [];
            
            meshesToMerge.forEach((mesh) => {
              const clonedGeometry = mesh.geometry.clone();
              mesh.updateWorldMatrix(true, false);
              clonedGeometry.applyMatrix4(mesh.matrixWorld);
              geometries.push(clonedGeometry);
            });

            try {
              // Merge all geometries into one
              const mergedGeometry = mergeGeometries(geometries, false);
              
              if (mergedGeometry) {
                // Remove old meshes
                meshesToMerge.forEach((mesh) => {
                  mesh.parent?.remove(mesh);
                  mesh.geometry.dispose();
                });

                // Create a single merged mesh
                const mergedMesh = new THREE.Mesh(mergedGeometry, material);
                mergedMesh.castShadow = false;
                mergedMesh.receiveShadow = false;
                mergedMesh.frustumCulled = false;
                mergedMesh.renderOrder = -1;
                
                gltf.scene.add(mergedMesh);
                
                console.log(`Merged ${meshesToMerge.length} meshes into 1 (${geometries.reduce((sum, g) => sum + g.attributes.position.count, 0)} vertices)`);
              }
              
              // Clean up cloned geometries
              geometries.forEach((g) => g.dispose());
            } catch (error) {
              console.warn('Failed to merge geometries:', error);
              // Clean up cloned geometries on error
              geometries.forEach((g) => g.dispose());
            }
          }
        }
        });


        loadedModel = gltf.scene;
        
        // Apply position and scale if provided
        if (position) {
          gltf.scene.position.set(position[0], position[1], position[2]);
        }
        if (scale) {
          gltf.scene.scale.set(scale, scale, scale);
        }
        
        scene.add(gltf.scene);
        
        // Clear loading message
        setLoaderMessage('contextModel', null);
        setContextModelLoaded(true);
      } catch (err) {
        setLoaderMessage('contextModel', '...error loading visualization model');
        // Set loaded true even on error so loading screen doesn't hang
        setContextModelLoaded(true);
      }
    }

    loadGLTF();

    // Cleanup: remove model from scene when component unmounts
    return () => {
      if (loadedModel) {
        scene.remove(loadedModel);
        loadedModel.traverse((child: any) => {
          if (child.isMesh) {
            child.geometry?.dispose();
            child.material?.dispose();
          }
        });
      }
      dracoLoader.dispose();
    };
  }, [url, position, scale, flatShading, scene, setLoaderMessage, setContextModelLoaded]);

  return null;
}
