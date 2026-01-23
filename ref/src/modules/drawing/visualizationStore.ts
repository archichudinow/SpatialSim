/**
 * Visualization Store
 * Module-specific state for drawing/visualization toggles
 */

import { create } from 'zustand';

interface VisualizationState {
  // Drawing toggles
  lookAtLines: boolean;
  lookAtPoints: boolean;
  showTrail: boolean;
  
  // Actions
  setLookAtLines: (value: boolean) => void;
  setLookAtPoints: (value: boolean) => void;
  setShowTrail: (value: boolean) => void;
}

export const useVisualizationStore = create<VisualizationState>((set) => ({
  // Drawing toggles
  lookAtLines: false,
  lookAtPoints: false,
  showTrail: true,
  
  // Actions
  setLookAtLines: (value) => set({ lookAtLines: value }),
  setLookAtPoints: (value) => set({ lookAtPoints: value }),
  setShowTrail: (value) => set({ showTrail: value })
}));
