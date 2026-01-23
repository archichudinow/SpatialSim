/**
 * Export utility functions for capturing and exporting views
 * Extensible design to support multiple export formats
 */

/**
 * Captures the current canvas as a JPEG image with a top-down view
 * @param {THREE.WebGLRenderer} renderer - Three.js WebGL renderer
 * @param {THREE.Scene} scene - The scene to render
 * @param {THREE.Camera} camera - The camera (will be repositioned for top-down view)
 * @param {Object} options - Configuration options
 * @returns {Promise<void>} Resolves when download is complete
 */
import * as THREE from 'three';

export async function exportTopViewJPEG(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: { quality?: number; filename?: string } = {}
): Promise<void> {
  const {
    quality = 0.95,
    filename = `SpatialLens_topview_${Date.now()}.jpg`,
  } = options;

  try {
    // Save original camera state
    const originalPosition = camera.position.clone();
    const originalQuaternion = camera.quaternion.clone();
    const originalZoom = (camera as any).zoom;

    // Position camera for top-down view
    setupTopDownView(camera as THREE.PerspectiveCamera, scene);

    // Render the scene to the current canvas
    renderer.render(scene, camera);

    // Convert canvas to JPEG and trigger download
    const canvas = renderer.domElement;
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            downloadBlob(blob, filename);
          } else {
            reject(new Error('Failed to create blob from canvas'));
            return;
          }

          // Restore original camera state
          camera.position.copy(originalPosition);
          camera.quaternion.copy(originalQuaternion);
          (camera as any).zoom = originalZoom;
          (camera as any).updateProjectionMatrix();

          // Re-render with restored camera
          renderer.render(scene, camera);
          resolve();
        },
        'image/jpeg',
        quality
      );
    });
  } catch (error) {
    throw error;
  }
}

/**
 * Positions camera for top-down orthographic view
 * @param {THREE.Camera} camera - The camera to position
 * @param {THREE.Scene} scene - The scene to determine bounds
 */
function setupTopDownView(camera: THREE.PerspectiveCamera | THREE.OrthographicCamera, scene: THREE.Scene): void {
  // Calculate scene bounding box
  const bbox = new THREE.Box3().setFromObject(scene);
  const center = bbox.getCenter(new THREE.Vector3());
  const size = bbox.getSize(new THREE.Vector3());

  // Calculate distance to frame entire scene
  const maxDim = Math.max(size.x, size.y, size.z);
  const fov = (camera as THREE.PerspectiveCamera).fov * (Math.PI / 180); // Convert to radians
  let distance = Math.abs(maxDim / 2 / Math.tan(fov / 2));

  // Add padding
  distance *= 1.2;

  // Position camera above scene center, looking down
  camera.position.set(center.x, center.z + distance, center.y);
  camera.lookAt(center);
  (camera as any).updateProjectionMatrix();
}

/**
 * Triggers browser download of a blob
 * @param {Blob} blob - The data blob to download
 * @param {string} filename - The filename for the download
 */
function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Registry of available export types
 * Extensible for adding new export formats
 */
export const EXPORT_TYPES = {
  TOP_VIEW_JPEG: 'TOP_VIEW_JPEG',
  // Future exports can be added here:
  // PERSPECTIVE_VIEW_JPEG: 'PERSPECTIVE_VIEW_JPEG',
  // HEATMAP_VIEW_JPEG: 'HEATMAP_VIEW_JPEG',
  // ANIMATED_GIF: 'ANIMATED_GIF',
  // etc.
};

/**
 * Main export function that handles different export types
 * @param {string} exportType - Type of export from EXPORT_TYPES
 * @param {THREE.WebGLRenderer} renderer - Three.js renderer
 * @param {THREE.Scene} scene - The scene to export
 * @param {THREE.Camera} camera - The camera
 * @param {Object} options - Additional options
 * @returns {Promise<void>}
 */
export async function performExport(
  exportType: string,
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  options: Record<string, any> = {}
): Promise<void> {
  switch (exportType) {
    case EXPORT_TYPES.TOP_VIEW_JPEG:
      return exportTopViewJPEG(renderer, scene, camera, options);
    
    default:
      throw new Error(`Unknown export type: ${exportType}`);
  }
}
