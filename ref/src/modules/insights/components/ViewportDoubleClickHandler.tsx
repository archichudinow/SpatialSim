/**
 * ViewportDoubleClickHandler
 * Handles double-click events in the viewport to show context menu
 */
import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { useInsightsStore } from '../insightsStore';

export default function ViewportDoubleClickHandler() {
  const { gl } = useThree();
  const setContextMenu = useInsightsStore(s => s.setContextMenu);
  const placementMode = useInsightsStore(s => s.placement.mode);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleDoubleClick = (event: MouseEvent) => {
      // Don't show context menu if in placement mode
      if (placementMode) return;

      // Get click position relative to viewport
      const x = event.clientX;
      const y = event.clientY;

      // Show context menu at click position
      setContextMenu({
        visible: true,
        x,
        y
      });
    };

    canvas.addEventListener('dblclick', handleDoubleClick);

    return () => {
      canvas.removeEventListener('dblclick', handleDoubleClick);
    };
  }, [gl, placementMode, setContextMenu]);

  return null;
}
