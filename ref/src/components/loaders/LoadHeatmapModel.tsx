import { useEffect } from 'react';
import { useAppState } from '../../AppState';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

/**
 * LoadHeatmapModel Component
 * Loads the high-resolution 3D model used for heatmap generation
 * 
 * @param {Object} props
 * @param {string} props.url - URL to the GLB/GLTF model file
 * @returns {null} This component doesn't render anything
 */
export default function LoadHeatmapModel({ url }: { url: string }) {
  const setModel = useAppState((state) => state.actions.data.setModel);
  const setLoaderMessage = useAppState((state) => state.actions.data.setLoaderMessage);

  useEffect(() => {
    if (!url) return;

    const loader = new GLTFLoader();

    async function loadGLTF() {
      try {
        setLoaderMessage('mainModel', '...loading heatmap model');

        const gltf = await new Promise<any>((resolve, reject) => {
          loader.load(
            url,
            resolve,
            (progress) => {
              if (progress.total > 0) {
                const percent = Math.min(100, Math.round((progress.loaded / progress.total) * 100));
                const loadedMB = (progress.loaded / (1024 * 1024)).toFixed(1);
                const totalMB = (progress.total / (1024 * 1024)).toFixed(1);
                setLoaderMessage('mainModel', `...loading heatmap model (${loadedMB}/${totalMB}MB - ${percent}%)`);
              }
            },
            reject
          );
        });

        setModel(gltf.scene);
        setLoaderMessage('mainModel', null); // Clear message
      } catch (err) {
        setLoaderMessage('mainModel', '...error loading heatmap model');
        // Set a null model so loading screen doesn't hang
        setModel(null);
      }
    }

    loadGLTF();
  }, [url, setModel]);

  return null;
}
