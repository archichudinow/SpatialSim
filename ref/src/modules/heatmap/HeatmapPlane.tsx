/**
 * HeatmapPlane
 * Generates a flat plane mesh for heatmap visualization
 * Positioned at y=0.5, fitted to model bounds
 * Target: ~100k vertices for optimal performance
 */
import { useMemo } from 'react';
import * as THREE from 'three';
import { HEATMAP_RENDERING } from '../../config/heatmapConfig';

/**
 * Calculate optimal grid resolution to reach target vertex count
 * @param {number} width - Plane width in world units
 * @param {number} depth - Plane depth in world units
 * @param {number} targetVertexCount - Desired vertex count (~100k)
 * @returns {object} { widthSegments, depthSegments, actualVertexCount }
 */
function calculateGridResolution(width: number, depth: number, targetVertexCount: number = HEATMAP_RENDERING.PLANE_VERTEX_COUNT) {
  // Plane vertices = (widthSegments + 1) * (depthSegments + 1)
  // Maintain aspect ratio: widthSegments / depthSegments ≈ width / depth
  
  const aspectRatio = width / depth;
  
  // Let w = widthSegments, d = depthSegments
  // w / d = aspectRatio
  // (w + 1) * (d + 1) ≈ targetVertexCount
  // w = aspectRatio * d
  // (aspectRatio * d + 1) * (d + 1) ≈ targetVertexCount
  
  const d = Math.sqrt(targetVertexCount / (aspectRatio + 1)) - 1;
  const depthSegments = Math.max(HEATMAP_RENDERING.MIN_SEGMENTS, Math.floor(d));
  const widthSegments = Math.max(HEATMAP_RENDERING.MIN_SEGMENTS, Math.floor(aspectRatio * depthSegments));
  
  const actualVertexCount = (widthSegments + 1) * (depthSegments + 1);
  
  return { widthSegments, depthSegments, actualVertexCount };
}

/**
 * Calculate bounds from GLB scene
 * @param {THREE.Object3D} glbScene - The loaded GLB scene
 * @returns {object} { min: {x,y,z}, max: {x,y,z} }
 */
export function calculateModelBounds(glbScene: any) {
  if (!glbScene) {
    // Default bounds if no model provided
    return {
      min: { x: -50, y: 0, z: -50 },
      max: { x: 50, y: 0, z: 50 }
    };
  }
  
  const box = new THREE.Box3().setFromObject(glbScene);
  
  return {
    min: {
      x: box.min.x,
      y: box.min.y,
      z: box.min.z
    },
    max: {
      x: box.max.x,
      y: box.max.y,
      z: box.max.z
    }
  };
}

/**
 * HeatmapPlane Component
 * Renders a flat plane mesh with heatUV attributes for shader mapping
 */
export default function HeatmapPlane({
  bounds,
  yOffset = 1.5,
  targetVertexCount = HEATMAP_RENDERING.PLANE_VERTEX_COUNT,
  visible = true,
  heatTexture: _heatTexture = null,
  minHeat: _minHeat = 0.0,
  maxHeat: _maxHeat = 50.0,
  useTransparency: _useTransparency = true,
  displayMaterial = null
}: {
  bounds: any;
  yOffset?: number;
  targetVertexCount?: number;
  visible?: boolean;
  heatTexture?: any;
  minHeat?: number;
  maxHeat?: number;
  useTransparency?: boolean;
  displayMaterial?: any;
}) {
  const planeData = useMemo(() => {
    // Calculate plane dimensions from bounds
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.z - bounds.min.z;
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerZ = (bounds.min.z + bounds.max.z) / 2;
    
    // Calculate optimal grid resolution
    const { widthSegments, depthSegments, actualVertexCount } = 
      calculateGridResolution(width, depth, targetVertexCount);
    
    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(
      width,
      depth,
      widthSegments,
      depthSegments
    );
    
    // Rotate to lie flat (XZ plane)
    geometry.rotateX(-Math.PI / 2);
    
    // Create heatUV attribute (maps vertices to heat texture)
    // Each vertex gets UV coords based on its position in the grid
    const positionAttribute = geometry.attributes.position;
    const vertexCount = positionAttribute.count;
    const heatUV = new Float32Array(vertexCount * 2);
    
    for (let i = 0; i < vertexCount; i++) {
      // Map vertex position to [0,1] range for texture lookup
      const x = positionAttribute.getX(i);
      const z = positionAttribute.getZ(i);
      
      // Normalize to bounds
      const u = (x + width / 2) / width;
      const v = (z + depth / 2) / depth;
      
      heatUV[i * 2] = u;
      heatUV[i * 2 + 1] = v;
    }
    
    geometry.setAttribute('heatUV', new THREE.BufferAttribute(heatUV, 2));
    
    return {
      geometry,
      position: [centerX, yOffset, centerZ],
      width,
      depth,
      vertexCount: actualVertexCount
    };
  }, [bounds, yOffset, targetVertexCount]);
  
  // Use custom material if provided, otherwise create default
  const material = displayMaterial || useMemo(() => {
    return new THREE.MeshBasicMaterial({
      color: 0x888888,
      wireframe: true,
      transparent: true,
      opacity: 0.3
    });
  }, []);
  
  if (!visible) {
    return null;
  }
  
  return (
    <mesh
      geometry={planeData.geometry}
      material={material}
      position={planeData.position as [number, number, number]}
    />
  );
}

/**
 * Hook to create vertex position texture and mesh from plane geometry
 * Compatible with useHeatmapModel interface (returns meshes array)
 */
export function usePlaneHeatmapModel(bounds: any, targetVertexCount: number = HEATMAP_RENDERING.DEFAULT_VERTEX_COUNT) {
  return useMemo(() => {
    // Return null if no bounds provided
    if (!bounds) return null;
    
    // Calculate plane dimensions
    const width = bounds.max.x - bounds.min.x;
    const depth = bounds.max.z - bounds.min.z;
    const centerX = (bounds.min.x + bounds.max.x) / 2;
    const centerZ = (bounds.min.z + bounds.max.z) / 2;
    const yOffset = 0.3;
    
    // Calculate grid resolution
    const { widthSegments, depthSegments, actualVertexCount } = 
      calculateGridResolution(width, depth, targetVertexCount);
    
    // Create plane geometry
    const geometry = new THREE.PlaneGeometry(
      width,
      depth,
      widthSegments,
      depthSegments
    );
    geometry.rotateX(-Math.PI / 2);
    
    // Build vertex position texture
    const textureSize = Math.ceil(Math.sqrt(actualVertexCount));
    const vertexPosArray = new Float32Array(textureSize * textureSize * 4);
    
    const positionAttribute = geometry.attributes.position;
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = positionAttribute.getX(i) + centerX;
      const y = yOffset;
      const z = positionAttribute.getZ(i) + centerZ;
      
      vertexPosArray[i * 4] = x;
      vertexPosArray[i * 4 + 1] = y;
      vertexPosArray[i * 4 + 2] = z;
      vertexPosArray[i * 4 + 3] = 1.0;
    }
    
    const vertexPosTexture = new THREE.DataTexture(
      vertexPosArray,
      textureSize,
      textureSize,
      THREE.RGBAFormat,
      THREE.FloatType
    );
    vertexPosTexture.needsUpdate = true;
    
    // Build heatUV attribute
    const heatUVArray = new Float32Array(positionAttribute.count * 2);
    
    for (let i = 0; i < positionAttribute.count; i++) {
      const x = i % textureSize;
      const y = Math.floor(i / textureSize);
      
      heatUVArray[i * 2] = (x + 0.5) / textureSize;
      heatUVArray[i * 2 + 1] = (y + 0.5) / textureSize;
    }
    
    geometry.setAttribute('heatUV', new THREE.BufferAttribute(heatUVArray, 2));
    
    // Create mesh (compatible with GLB approach)
    const mesh = new THREE.Mesh(geometry);
    mesh.position.set(centerX, yOffset, centerZ);
    
    return {
      meshes: [mesh],  // Array for compatibility with GLB approach
      vertexPosTexture,
      textureSize,
      vertexCount: actualVertexCount
    };
  }, [bounds, targetVertexCount]);
}
