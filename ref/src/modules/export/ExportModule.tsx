import React from 'react';
import { useThree } from '@react-three/fiber';
import { useAppState } from '../../AppState';
import { performExport } from './exportUtils';

/**
 * ExportModule - Handles all export functionality for the application
 * 
 * Features:
 * - Top-down JPEG export of the 3D scene
 * - Extensible design for future export formats
 * 
 * Usage: Add to Canvas in App.jsx
 */
export default function ExportModule() {
  const { gl, scene, camera } = useThree();

  // Store export state globally for access from UI
  const setExportFunction = useAppState((s) => s.actions.export.setExportFunction);

  // Register the export function on mount
  React.useEffect(() => {
    const handleExport = async (exportType: string, options: Record<string, any> = {}) => {
      try {
        await performExport(exportType, gl, scene, camera, options);
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        alert('Export failed: ' + message);
      }
    };

    setExportFunction(handleExport);
  }, [gl, scene, camera, setExportFunction]);

  return null;
}
