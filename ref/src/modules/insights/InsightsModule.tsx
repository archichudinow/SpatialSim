/**
 * InsightsModule
 * Independent insights and detection module
 * Uses separate insightsStore, only reads basic data from AppState via props
 */
import { useEffect } from 'react';
import { useInsightsStore } from './insightsStore.ts';
import { InsightsStateManager } from './core/InsightsStateManager';
import InsightsCollector from './InsightsCollector';
import ObserverVisualization from './components/ObserverVisualization';
import ObserverPlacementHandler from './components/ObserverPlacementHandler';
import ObserverViewportPanel from './components/ObserverViewportPanel';
import ViewportDoubleClickHandler from './components/ViewportDoubleClickHandler';
import ObserverAutoCreator from './components/ObserverAutoCreator';
import DrawInsights from './components/DrawInsights';
import type { AgentData } from '../../types';

interface InsightsModuleProps {
  agents: AgentData[];
  currentTime: number;
  maxTime: number;
  positionBuffer?: Float32Array;
  lookAtBuffer?: Float32Array;
  onInsightGenerated?: any;
  onObserverChange?: any;
}

export default function InsightsModule({
  agents,
  currentTime,
  maxTime,
  positionBuffer,
  lookAtBuffer,
  onInsightGenerated = null,
  onObserverChange = null
}: InsightsModuleProps) {
  // Internal state from separate store
  const stateManager = useInsightsStore(s => s.stateManager);
  const setStateManager = useInsightsStore(s => s.setStateManager);
  const observers = useInsightsStore(s => s.observers);
  const openObserverPanels = useInsightsStore(s => s.openObserverPanels);
  const insightsWindowOpen = useInsightsStore(s => s.insightsWindowOpen);
  
  // Initialize state manager once
  useEffect(() => {
    if (!stateManager) {
      const manager = new InsightsStateManager();
      setStateManager(manager);
    }
  }, [stateManager, setStateManager]);
  
  // Notify parent of observer changes (optional integration)
  useEffect(() => {
    if (onObserverChange) {
      onObserverChange(observers);
    }
  }, [observers, onObserverChange]);
  
  return (
    <>
      {/* Detection runs always, even when UI is closed */}
      <InsightsCollector
        agents={agents}
        currentTime={currentTime}
        maxTime={maxTime}
        positionBuffer={positionBuffer}
        lookAtBuffer={lookAtBuffer}
        onInsightGenerated={onInsightGenerated}
      />
      
      {/* Draw insights visualization - only at simulation end */}
      <DrawInsights agents={agents} currentTime={currentTime} />
      
      {/* Observer placement and visualization - always active */}
      <ViewportDoubleClickHandler />
      <ObserverAutoCreator />
      <ObserverPlacementHandler />
      <ObserverVisualization />
      
      {/* Observer viewport panels - render one for each open observer, hide when main window is open */}
      {!insightsWindowOpen && observers.map(observer => (
        openObserverPanels.has(observer.id) && (
          <ObserverViewportPanel 
            key={observer.id}
            observer={observer}
            visible={true}
          />
        )
      ))}
    </>
  );
}
