// utils/heatmapUtils.js
import * as THREE from 'three';

export function createRenderTarget(width: number, height: number): THREE.WebGLRenderTarget {
  return new THREE.WebGLRenderTarget(width, height, {
    format: THREE.RGBAFormat,
    type: THREE.HalfFloatType,
    minFilter: THREE.NearestFilter,
    magFilter: THREE.NearestFilter,
    wrapS: THREE.ClampToEdgeWrapping,
    wrapT: THREE.ClampToEdgeWrapping,
  });
}

export function createVertexPositionTexture(meshes: THREE.Mesh[], textureSize: number): THREE.DataTexture {
  const vertexPosArray = new Float32Array(textureSize * textureSize * 4);
  let vertexOffset = 0;

  meshes.forEach((mesh: THREE.Mesh) => {
    const pos = mesh.geometry.attributes.position;
    const count = pos.count;

    for (let i = 0; i < count; i++) {
      const idx = vertexOffset + i;

      vertexPosArray[idx * 4] = pos.getX(i);
      vertexPosArray[idx * 4 + 1] = pos.getY(i);
      vertexPosArray[idx * 4 + 2] = pos.getZ(i);
      vertexPosArray[idx * 4 + 3] = 1.0;
    }

    vertexOffset += count;
  });

  const texture = new THREE.DataTexture(
    vertexPosArray,
    textureSize,
    textureSize,
    THREE.RGBAFormat,
    THREE.FloatType
  );
  texture.needsUpdate = true;
  return texture;
}

export function createHeatUVs(mesh: THREE.Mesh, textureSize: number, vertexOffset: number): Float32Array {
  const pos = mesh.geometry.attributes.position;
  const count = pos.count;
  const heatUV = new Float32Array(count * 2);

  for (let i = 0; i < count; i++) {
    const idx = vertexOffset + i;
    const x = idx % textureSize;
    const y = Math.floor(idx / textureSize);

    heatUV[i * 2] = (x + 0.5) / textureSize;
    heatUV[i * 2 + 1] = (y + 0.5) / textureSize;
  }

  return heatUV;
}