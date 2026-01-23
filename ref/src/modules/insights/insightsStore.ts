import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { initializeEventBuffers } from '../../config/eventTypes';
import type { InsightsStateManager } from './core/InsightsStateManager';

interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Observer {
  id: string;
  type: 'box' | 'cylinder';
  position: Vector3;
  name: string;
  [key: string]: any;
}

interface PlacementState {
  mode: 'box' | 'cylinder' | null;
  position: Vector3 | null;
  config: any | null;
  isLocked: boolean;
}

interface ContextMenuState {
  visible: boolean;
  x: number;
  y: number;
}

interface ObserverContextMenuState {
  visible: boolean;
  x: number;
  y: number;
  observer: Observer | null;
}

interface DetectionConfig {
  velocityThreshold: {
    stopped: number;
    slow: number;
    fast: number;
  };
  dwellTimeThreshold: number;
  lookAroundAngleThreshold: number;
  lookAroundTimeWindow: number;
  lookFocusedAngleThreshold: number;
  lookFocusedTimeWindow: number;
  lookUpAngleThreshold: number;
  lookDownAngleThreshold: number;
  lookAtAngleThreshold: number;
  insideObjectPadding: number;
}

interface EventPosition {
  position: Vector3;
  intensity: number;
}

type EventBuffers = Record<string, Map<number, EventPosition> | Set<number>>;

interface InsightsState {
  // State
  observers: Observer[];
  stateManager: InsightsStateManager | null;
  logsWindowOpen: boolean;
  insightsWindowOpen: boolean;
  selectedEventType: string;
  selectedObserverId: string | null;
  showInsightsVisualization: boolean;
  showObservers: boolean;
  insightsEnabled: boolean;
  lastInsightUpdate: number;
  openObserverPanels: Set<string>;
  newlyCreatedObservers: Set<string>;
  placement: PlacementState;
  contextMenu: ContextMenuState;
  observerContextMenu: ObserverContextMenuState;
  detectionConfig: DetectionConfig;
  eventBuffers: EventBuffers;
  activeEventTypes: Set<string>;
  
  // Actions
  addObserver: (observer: Observer) => void;
  removeObserver: (observerId: string) => void;
  updateObserver: (observerId: string, updates: Partial<Observer>) => void;
  setStateManager: (manager: InsightsStateManager) => void;
  setLogsWindowOpen: (value: boolean) => void;
  setInsightsWindowOpen: (value: boolean) => void;
  setSelectedEventType: (eventType: string) => void;
  setSelectedObserver: (observerId: string | null) => void;
  setShowInsightsVisualization: (value: boolean) => void;
  setShowObservers: (value: boolean) => void;
  setInsightsEnabled: (value: boolean) => void;
  triggerInsightUpdate: () => void;
  toggleObserverPanel: (observer: Observer) => void;
  closeObserverPanel: (observerId: string) => void;
  closeAllObserverPanels: () => void;
  markObserverAsNew: (observerId: string) => void;
  removeNewlyCreatedObserver: (observerId: string) => void;
  setPlacementMode: (mode: 'box' | 'cylinder' | null) => void;
  setPlacementPosition: (position: Vector3 | null) => void;
  setPlacementConfig: (config: any) => void;
  lockPlacement: (position: Vector3) => void;
  clearPlacement: () => void;
  setContextMenu: (contextMenu: ContextMenuState) => void;
  setObserverContextMenu: (observerContextMenu: ObserverContextMenuState) => void;
  setDetectionConfig: (config: DetectionConfig) => void;
  updateDetectionConfig: (updates: Partial<DetectionConfig>) => void;
  updateEventBuffer: (layerName: string, agentId: number, position: Vector3, intensity?: number) => void;
  removeFromEventBuffer: (layerName: string, agentId: number) => void;
  recordPointEvent: (layerName: string, agentId: number) => void;
  clearEventBuffer: (layerName: string) => void;
  clearAllEventBuffers: () => void;
  activateEventType: (typeName: string) => void;
  deactivateEventType: (typeName: string) => void;
  setActiveEventTypes: (typeNames: string[]) => void;
  reset: () => void;
}

/**
 * Separate Zustand store for Insights module
 * Completely independent from global AppState
 */
export const useInsightsStore = create<InsightsState>()(
  devtools(
    persist(
      (set) => ({
        // ==========================================
        // STATE
        // ==========================================
        
        // Observers - 3D objects for spatial detection
        observers: [],
        
        // State manager instance
        stateManager: null,
        
        // UI State
        logsWindowOpen: false,
        insightsWindowOpen: false,
        selectedEventType: 'pause', // Default to 'pause' event type
        selectedObserverId: null,
        showInsightsVisualization: true, // Enabled by default
        showObservers: true, // Show observer 3D objects by default
        insightsEnabled: true, // Enabled by default
        lastInsightUpdate: 0, // Timestamp of last insight update for reactivity
        
        // Observer Info Panel state
        openObserverPanels: new Set(), // Set of observer IDs with open panels
        newlyCreatedObservers: new Set(), // Set of observer IDs that were just created (show settings first)
        
        // Placement state (for ObserverPlacementHandler)
        placement: {
          mode: null,              // 'box' | 'cylinder' | null
          position: null,          // {x, y, z} or null
          config: null,            // Observer config during placement
          isLocked: false          // Is position locked and ready for configuration
        },
        
        // Context menu state
        contextMenu: {
          visible: false,
          x: 0,
          y: 0
        },
        
        // Observer context menu state (for right-click on observer)
        observerContextMenu: {
          visible: false,
          x: 0,
          y: 0,
          observer: null
        },
        
        // Detection configuration
        detectionConfig: {
          // Movement thresholds
          velocityThreshold: {
            stopped: 0.05,
            slow: 0.5,
            fast: 2.0
          },
          dwellTimeThreshold: 60,
          
          // Orientation thresholds
          lookAroundAngleThreshold: 45,
          lookAroundTimeWindow: 30,
          lookFocusedAngleThreshold: 15,
          lookFocusedTimeWindow: 60,
          lookUpAngleThreshold: 30,
          lookDownAngleThreshold: -30,
          
          // Object detection
          lookAtAngleThreshold: 30,
          insideObjectPadding: 0.5
        },
        
        // Event buffers for heatmap layers
        eventBuffers: initializeEventBuffers() as EventBuffers,
        
        // Active event types
        activeEventTypes: new Set(['linger', 'pause', 'noticed', 'scan']),
        
        // ==========================================
        // ACTIONS
        // ==========================================
        
        // Observer management
        addObserver: (observer) => set((state) => ({
          observers: [...state.observers, observer]
        })),
        
        removeObserver: (observerId) => set((state) => ({
          observers: state.observers.filter(o => o.id !== observerId)
        })),
        
        updateObserver: (observerId, updates) => set((state) => ({
          observers: state.observers.map(o => 
            o.id === observerId ? { ...o, ...updates } : o
          )
        })),
        
        // State manager
        setStateManager: (manager) => set({ stateManager: manager }),
        
        // UI windows
        setLogsWindowOpen: (value) => set({ logsWindowOpen: value }),
        
        setInsightsWindowOpen: (value) => set({ insightsWindowOpen: value }),
        
        setSelectedEventType: (eventType) => set({ selectedEventType: eventType }),
        
        setSelectedObserver: (observerId) => set({ selectedObserverId: observerId }),
        
        setShowInsightsVisualization: (value) => set({ showInsightsVisualization: value }),
        
        setShowObservers: (value) => set({ showObservers: value }),
        
        setInsightsEnabled: (value) => set({ insightsEnabled: value }),
        
        triggerInsightUpdate: () => set({ lastInsightUpdate: Date.now() }),
        
        // Observer panel
        toggleObserverPanel: (observer) => set((state) => {
          const newSet = new Set(state.openObserverPanels);
          if (newSet.has(observer.id)) {
            newSet.delete(observer.id);
          } else {
            newSet.add(observer.id);
          }
          return { openObserverPanels: newSet };
        }),
        
        closeObserverPanel: (observerId) => set((state) => {
          const newSet = new Set(state.openObserverPanels);
          newSet.delete(observerId);
          return { openObserverPanels: newSet };
        }),
        
        closeAllObserverPanels: () => set({ openObserverPanels: new Set() }),
        
        // Newly created observers tracking
        markObserverAsNew: (observerId) => set((state) => {
          const newSet = new Set(state.newlyCreatedObservers);
          newSet.add(observerId);
          return { newlyCreatedObservers: newSet };
        }),
        
        removeNewlyCreatedObserver: (observerId) => set((state) => {
          const newSet = new Set(state.newlyCreatedObservers);
          newSet.delete(observerId);
          return { newlyCreatedObservers: newSet };
        }),
        
        // Placement
        setPlacementMode: (mode) => set((state) => ({
          placement: { ...state.placement, mode, isLocked: false }
        })),
        
        setPlacementPosition: (position) => set((state) => ({
          placement: { ...state.placement, position }
        })),
        
        setPlacementConfig: (config) => set((state) => ({
          placement: { ...state.placement, config }
        })),
        
        lockPlacement: (position) => set((state) => ({
          placement: { ...state.placement, position, isLocked: true }
        })),
        
        clearPlacement: () => set({
          placement: {
            mode: null,
            position: null,
            config: null,
            isLocked: false
          }
        }),
        
        // Context menu
        setContextMenu: (contextMenu) => set({ contextMenu }),
        
        // Observer context menu
        setObserverContextMenu: (observerContextMenu) => set({ observerContextMenu }),
        
        // Detection config
        setDetectionConfig: (config) => set({ detectionConfig: config }),
        
        updateDetectionConfig: (updates) => set((state) => ({
          detectionConfig: { ...state.detectionConfig, ...updates }
        })),
        
        // Event buffer actions
        updateEventBuffer: (layerName, agentId, position, intensity = 1.0) => set((state) => {
          const newBuffers = { ...state.eventBuffers };
          const buffer = new Map(newBuffers[layerName] as Map<number, EventPosition>);
          buffer.set(agentId, { position, intensity });
          newBuffers[layerName] = buffer;
          return { eventBuffers: newBuffers };
        }),
        
        removeFromEventBuffer: (layerName, agentId) => set((state) => {
          const newBuffers = { ...state.eventBuffers };
          const buffer = new Map(newBuffers[layerName] as Map<number, EventPosition>);
          buffer.delete(agentId);
          newBuffers[layerName] = buffer;
          return { eventBuffers: newBuffers };
        }),
        
        recordPointEvent: (layerName, agentId) => set((state) => {
          const newBuffers = { ...state.eventBuffers };
          const eventSet = new Set(newBuffers[layerName] as Set<number>);
          eventSet.add(agentId);
          newBuffers[layerName] = eventSet;
          return { eventBuffers: newBuffers };
        }),
        
        clearEventBuffer: (layerName) => set((state) => {
          const newBuffers = { ...state.eventBuffers };
          if (newBuffers[layerName] instanceof Map) {
            newBuffers[layerName] = new Map();
          } else if (newBuffers[layerName] instanceof Set) {
            newBuffers[layerName] = new Set();
          }
          return { eventBuffers: newBuffers };
        }),
        
        clearAllEventBuffers: () => set({
          eventBuffers: initializeEventBuffers() as EventBuffers
        }),
        
        // Event type activation management
        activateEventType: (typeName) => set((state) => {
          const newActive = new Set(state.activeEventTypes);
          newActive.add(typeName);
          return { activeEventTypes: newActive };
        }),
        
        deactivateEventType: (typeName) => set((state) => {
          const newActive = new Set(state.activeEventTypes);
          newActive.delete(typeName);
          return { activeEventTypes: newActive };
        }),
        
        setActiveEventTypes: (typeNames) => set({
          activeEventTypes: new Set(typeNames)
        }),
        
        // Reset all state
        reset: () => set((state) => {
          // Reset stateManager data if it exists
          if (state.stateManager) {
            state.stateManager.reset();
          }
          
          return {
            observers: [],
            selectedEventType: 'pause',
            selectedObserverId: null,
            showInsightsVisualization: false,
            lastInsightUpdate: Date.now(),
            placement: {
              mode: null,
              position: null,
              config: null,
              isLocked: false
            },
            eventBuffers: initializeEventBuffers() as EventBuffers,
            activeEventTypes: new Set(['linger', 'pause', 'noticed', 'scan'])
          };
        })
      }),
      {
        name: 'insights-storage',
        partialize: (state) => ({
          observers: state.observers,
          detectionConfig: state.detectionConfig
        })
      }
    ),
    { name: 'InsightsModule' }
  )
);
