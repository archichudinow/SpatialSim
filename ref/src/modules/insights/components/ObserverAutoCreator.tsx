/**
 * ObserverAutoCreator
 * Automatically creates observer when placement is locked from context menu
 * Uses observerService for business logic
 */
import { useEffect, useState } from 'react';
import { useInsightsStore } from '../insightsStore';
import { useAppState } from '../../../AppState';
import { createObserver, findObserverAtPosition } from '../services/observerService';

export default function ObserverAutoCreator() {
  const placementMode = useInsightsStore(s => s.placement.mode);
  const placementPosition = useInsightsStore(s => s.placement.position);
  const placementIsLocked = useInsightsStore(s => s.placement.isLocked);
  const placementConfig = useInsightsStore(s => s.placement.config);
  const observers = useInsightsStore(s => s.observers);
  
  const addObserver = useInsightsStore(s => s.addObserver);
  const clearPlacement = useInsightsStore(s => s.clearPlacement);
  const toggleObserverPanel = useInsightsStore(s => s.toggleObserverPanel);
  const markObserverAsNew = useInsightsStore(s => s.markObserverAsNew);
  const setPickMode = useAppState(s => s.actions.ui.setPickMode);
  
  const [defaultConfig] = useState({
    name: '',
    width: 10,
    height: 4,
    depth: 1,
    radius: 5,
    rotation: 0
  });

  useEffect(() => {
    // Only auto-create when position is locked and we have placement mode
    if (!placementIsLocked || !placementMode || !placementPosition) return;

    // Check if observer already exists at this position (avoid duplicates)
    const existingObserver = findObserverAtPosition(placementPosition, observers);
    
    if (existingObserver) {
      // Observer already created, just open its panel
      toggleObserverPanel(existingObserver);
      clearPlacement();
      setPickMode(false);
      return;
    }

    // Use config from placement or default
    const finalConfig = placementConfig || defaultConfig;
    
    // Create the observer using service
    const observer = createObserver(
      placementMode,
      placementPosition,
      finalConfig,
      observers
    );
    
    if (observer) {
      // Add observer to store
      addObserver(observer as any);
      
      // Mark as newly created (so it opens with settings tab)
      markObserverAsNew(observer.id);
      
      // Open the viewport panel for this observer
      toggleObserverPanel(observer as any);
      
      // Clear placement state
      clearPlacement();
      setPickMode(false);
    }
  }, [placementIsLocked, placementMode, placementPosition, placementConfig]);

  return null;
}
