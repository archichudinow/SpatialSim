/**
 * ObserverPlacementHandler
 * Handles click detection in 3D world for observer placement
 * Uses raycastUtils for business logic
 */
import { useThree, useFrame } from '@react-three/fiber';
import { useAppState } from '../../../AppState';
import { useInsightsStore } from '../insightsStore';
import { useEffect } from 'react';
import { raycastToGroundPlane, raycastMouseToGround } from '../utils/raycastUtils';

export default function ObserverPlacementHandler() {
  const { camera, scene: _scene, pointer } = useThree();
  const pickMode = useAppState((state) => state.ui.pickMode);
  const model = useAppState((state) => state.data.model);
  
  const setPlacementPosition = useInsightsStore(s => s.setPlacementPosition);
  const lockPlacement = useInsightsStore(s => s.lockPlacement);
  const placementIsLocked = useInsightsStore(s => s.placement.isLocked);
  
  // Track mouse position every frame while in pick mode
  useFrame(() => {
    // Early return before any processing
    if (!pickMode || !model || placementIsLocked) return;
    
    // Use raycast utility to find ground intersection
    const position = raycastToGroundPlane(pointer, camera);
    
    if (position) {
      // Update placement position continuously with mouse
      setPlacementPosition(position);
    }
  });
  
  // Handle click events to lock position
  const handleClick = (event: MouseEvent) => {
    if (!pickMode || !model || placementIsLocked) return;
    
    // Use raycast utility to find ground intersection from mouse event
    const position = raycastMouseToGround(event, camera);
    
    if (position) {
      // Lock the placement position
      lockPlacement(position);
    }
  };
  
  // Attach click listener when in pick mode using useEffect
  useEffect(() => {
    if (!pickMode) return;
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.style.cursor = 'none';
      canvas.addEventListener('click', handleClick);
      
      // Cleanup
      return () => {
        canvas.style.cursor = 'default';
        canvas.removeEventListener('click', handleClick);
      };
    }
  }, [pickMode]);
  
  // Restore cursor when placement is locked
  useEffect(() => {
    if (placementIsLocked) {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        canvas.style.cursor = 'default';
      }
    }
  }, [placementIsLocked]);
  
  return null;
}
