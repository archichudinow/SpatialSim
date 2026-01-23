// hooks/useHeatmapModel.js
import { useMemo } from 'react';
import * as THREE from 'three';
import { createVertexPositionTexture, createHeatUVs } from './heatmapUtils';

export function useHeatmapModel(glbScene: any) {
  return useMemo(() => {
    if (!glbScene) return null;

    let totalVertexCount = 0;
    const meshes: THREE.Mesh[] = [];

    glbScene.traverse((o: any) => {
      if (o.isMesh) {
        totalVertexCount += o.geometry.attributes.position.count;
        meshes.push(o);
      }
    });

    const textureSize = Math.ceil(Math.sqrt(totalVertexCount));
    const vertexPosTexture = createVertexPositionTexture(meshes, textureSize);

    let vertexOffset = 0;
    meshes.forEach((mesh) => {
      const heatUV = createHeatUVs(mesh, textureSize, vertexOffset);
      mesh.geometry.setAttribute('heatUV', new THREE.BufferAttribute(heatUV, 2));
      vertexOffset += mesh.geometry.attributes.position.count;
    });

    return {
      meshes,
      vertexPosTexture,
      textureSize,
    };
  }, [glbScene]);
}