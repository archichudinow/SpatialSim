// AppState.ts
// Zustand store with organized namespaces for better maintainability

import { create } from 'zustand';
import { filterAgents, MAX_AGENTS } from './services/agentProcessor';
import type { AgentData } from './types';

interface DataState {
  raw: AgentData[] | null;
  meta: any | null;
  model: any | null;
  isLoading: boolean;
  isLoadedData: boolean;
  isLoadedModel: boolean;
  isLoadedContextModel: boolean;
  isLoadedMetroModel: boolean;
  loadingMessage: string;
  loadingMessages: Record<string, string>;
  error: Error | null;
}

interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  time: number;
  speed: number;
  maxTime: number;
  clampStartTime: number;
  clampEndTime: number | null;
  loop: boolean;
}

interface SimulationState {
  positionBuffer: Float32Array;
  lookAtBuffer: Float32Array;
  filter: string[];
  agentFilter: number | null;
  filteredAgents: AgentData[];
}

interface UIState {
  showStopDwell: boolean;
  showHeatmap: boolean;
  pickMode: boolean;
}

interface ExportState {
  exportFunction: ((type: string, options?: Record<string, any>) => Promise<void>) | null;
}

interface ModulesState {
  export: ExportState;
}

interface DataActions {
  setRawData: (data: AgentData[]) => void;
  setModel: (model: any) => void;
  setContextModelLoaded: (loaded: boolean) => void;
  setMetroModelLoaded: (loaded: boolean) => void;
  setLoadingMessage: (message: string) => void;
  setLoaderMessage: (loaderId: string, message: string | null) => void;
  setError: (error: Error | null) => void;
  clearError: () => void;
}

interface PlaybackActions {
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  setTime: (time: number) => void;
  setSpeed: (speed: number) => void;
  setMaxTime: (maxTime: number) => void;
  setClampStartTime: (time: number) => void;
  setClampEndTime: (time: number | null) => void;
  setLoop: (loop: boolean) => void;
}

interface SimulationActions {
  setPositionBuffer: (buffer: Float32Array) => void;
  setLookAtBuffer: (buffer: Float32Array) => void;
  setFilter: (filter: string[]) => void;
  setAgentFilter: (agentFilter: number | null) => void;
}

interface UIActions {
  setShowStopDwell: (value: boolean) => void;
  setShowHeatmap: (value: boolean) => void;
  setPickMode: (value: boolean) => void;
}

interface ExportActions {
  setExportFunction: (fn: (type: string, options?: Record<string, any>) => Promise<void>) => void;
}

interface ModuleActions {
  // Module-specific actions
}

interface Actions {
  data: DataActions;
  playback: PlaybackActions;
  simulation: SimulationActions;
  ui: UIActions;
  export: ExportActions;
  modules: ModuleActions;
}

export interface AppState {
  data: DataState;
  playback: PlaybackState;
  simulation: SimulationState;
  ui: UIState;
  modules: ModulesState;
  export: ExportState;
  actions: Actions;
}

/**
 * Global application state using Zustand
 * Organized into namespaces: data, playback, simulation, ui, modules, actions
 */
export const useAppState = create<AppState>((set) => ({
  // ============================================
  // DATA LAYER - Raw loaded data
  // ============================================
  data: {
    raw: null,
    meta: null,
    model: null,
    isLoading: false,
    isLoadedData: false,
    isLoadedModel: false,
    isLoadedContextModel: false,
    isLoadedMetroModel: false,
    loadingMessage: '...init scene',
    loadingMessages: {},
    error: null
  },

  // ============================================
  // PLAYBACK LAYER - Timeline control
  // ============================================
  playback: {
    isPlaying: false,
    isPaused: false,
    time: 0,
    speed: 1.0,
    maxTime: 0,
    clampStartTime: 0,
    clampEndTime: null,
    loop: false
  },

  // ============================================
  // SIMULATION LAYER - Agent buffers & filters
  // ============================================
  simulation: {
    positionBuffer: new Float32Array(0),
    lookAtBuffer: new Float32Array(0),
    filter: [],
    agentFilter: null,
    filteredAgents: []
  },

  // ============================================
  // UI LAYER - Display toggles
  // ============================================
  ui: {
    showStopDwell: false,
    showHeatmap: false,
    pickMode: false
  },

  // ============================================
  // EXPORT LAYER - Export functionality
  // ============================================
  export: {
    exportFunction: null
  },

  // ============================================
  // MODULES - Feature-specific state
  // ============================================
  modules: {
    export: { exportFunction: null }
  },

  // ============================================
  // ACTIONS - State update methods
  // ============================================
  actions: {
    // Data actions
    data: {
      setRawData: (data) => set((state) => {
        const filteredAgents = filterAgents(
          data,
          state.simulation.filter,
          state.simulation.agentFilter,
          MAX_AGENTS
        );
        return {
          data: { ...state.data, raw: data, isLoadedData: true },
          simulation: { ...state.simulation, filteredAgents }
        };
      }),
      setModel: (model) => set((state) => ({
        data: { ...state.data, model: model, isLoadedModel: true }
      })),      
      setContextModelLoaded: (loaded) => set((state) => ({
        data: { ...state.data, isLoadedContextModel: loaded }
      })),
      setMetroModelLoaded: (loaded) => set((state) => ({
        data: { ...state.data, isLoadedMetroModel: loaded }
      })),
      setLoadingMessage: (message) => set((state) => ({
        data: { ...state.data, loadingMessage: message }
      })),
      setLoaderMessage: (loaderId, message) => set((state) => {
        const newMessages = { ...state.data.loadingMessages };
        if (message === null) {
          delete newMessages[loaderId];
        } else {
          newMessages[loaderId] = message;
        }
        // Priority order: GLB data > main model > context model
        const priority = ['glbData', 'mainModel', 'contextModel', 'metroModel'];
        let displayMessage = '...init scene';
        for (const id of priority) {
          if (newMessages[id]) {
            displayMessage = newMessages[id];
            break;
          }
        }
        return {
          data: { ...state.data, loadingMessages: newMessages, loadingMessage: displayMessage }
        };
      }),
      setError: (error) => set((state) => ({
        data: { ...state.data, error }
      })),
      clearError: () => set((state) => ({
        data: { ...state.data, error: null }
      }))
    },

    // Playback actions
    playback: {
      togglePlay: () => set((state) => ({
        playback: { ...state.playback, isPlaying: !state.playback.isPlaying, isPaused: false }
      })),
      pause: () => set((state) => ({
        playback: { ...state.playback, isPlaying: false, isPaused: true }
      })),
      resume: () => set((state) => ({
        playback: { ...state.playback, isPlaying: true, isPaused: false }
      })),
      setTime: (time) => set((state) => ({
        playback: { ...state.playback, time: Math.max(0, time) }
      })),
      setSpeed: (speed) => set((state) => ({
        playback: { ...state.playback, speed: Math.max(0, speed) }
      })),
      setMaxTime: (maxTime) => set((state) => ({
        playback: { ...state.playback, maxTime }
      })),
      setClampStartTime: (time) => set((state) => ({
        playback: { ...state.playback, clampStartTime: Math.max(0, time) }
      })),
      setClampEndTime: (time) => set((state) => ({
        playback: { ...state.playback, clampEndTime: time }
      })),
      setLoop: (loop) => set((state) => ({
        playback: { ...state.playback, loop }
      }))
    },

    // Simulation actions
    simulation: {
      setPositionBuffer: (buffer) => set((state) => ({
        simulation: { ...state.simulation, positionBuffer: buffer }
      })),
      setLookAtBuffer: (buffer) => set((state) => ({
        simulation: { ...state.simulation, lookAtBuffer: buffer }
      })),
      setFilter: (filter) => set((state) => {
        const filteredAgents = filterAgents(
          state.data.raw || [],
          filter,
          state.simulation.agentFilter,
          MAX_AGENTS
        );
        return {
          simulation: { ...state.simulation, filter, filteredAgents }
        };
      }),
      setAgentFilter: (agentFilter) => set((state) => {
        const filteredAgents = filterAgents(
          state.data.raw || [],
          state.simulation.filter,
          agentFilter,
          MAX_AGENTS
        );
        return {
          simulation: { ...state.simulation, agentFilter, filteredAgents }
        };
      })
    },

    // UI actions
    ui: {
      setShowStopDwell: (value) => set((state) => ({
        ui: { ...state.ui, showStopDwell: value }
      })),
      setShowHeatmap: (value) => set((state) => ({
        ui: { ...state.ui, showHeatmap: value }
      })),
      setPickMode: (value) => set((state) => ({
        ui: { ...state.ui, pickMode: value }
      }))
    },

    // Export actions
    export: {
      setExportFunction: (fn) => set((state) => ({
        export: { ...state.export, exportFunction: fn },
        modules: { ...state.modules, export: { exportFunction: fn } }
      }))
    },

    // Module actions (empty - modules have their own stores)
    modules: {}
  }
}));
