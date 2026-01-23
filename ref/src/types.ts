/**
 * Type definitions for SpatialLens application
 * TypeScript types for type safety and better developer experience
 */

export interface AgentMeta {
  scenario: string;
  participant: string;
  color: string;
  length: number;
  duration: number;
  isActiveAt?: (time: number) => boolean;
}

export interface AgentTracks {
  position: Float32Array;
  lookAt: Float32Array;
  focus?: Float32Array;
}

export interface AgentData {
  id: number;
  meta: AgentMeta;
  tracks: AgentTracks;
  animation?: {
    tracks?: any[];
  };
  nodes?: {
    position?: {
      position: { x: number; y: number; z: number };
    };
    lookAt?: {
      position: { x: number; y: number; z: number };
    };
  };
  mixer?: any; // THREE.AnimationMixer
  action?: any; // THREE.AnimationAction
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface MeasurementData {
  firstSeen: number;
  lastSeen: number;
  totalSeen: number;
  reachedProximity: number;
  timeSpent: number;
}

export interface Measurements {
  byAgent?: Record<number, MeasurementData>;
  stopDwell?: any[];
  dwellEvents?: any[];
  stopEvents?: any[];
  firstSeen?: any[];
  lastSeen?: any[];
  totalSeen?: any[];
  reachedProximity?: any[];
  timeSpent?: any[];
  longStops?: any[];
}

export type EventType = 'MOVING' | 'DWELL' | 'STOP';

export interface StopDwellEvent {
  type: EventType;
  startFrame: number;
  endFrame: number;
  measurements: Measurements;
  radius: number;
}

export interface ProbeTarget {
  object: any; // THREE.Object3D
  name: string;
  perception?: any[];
}

export interface ObservationProbe {
  intent: string;
  target: ProbeTarget;
  measurements: Measurements;
}

export interface DataState {
  raw: AgentData[] | null;
  meta: any | null;
  model: any | null;
  isLoading: boolean;
  isLoadedData: boolean;
  isLoadedModel: boolean;
  isLoadedContextModel?: boolean;
  isLoadedMetroModel?: boolean;
  loadingMessage: string;
  loadingMessages?: Record<string, string>;
  loadingProgress?: number;
  error: Error | null;
}

export interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  time: number;
  speed: number;
  maxTime: number;
  clampStartTime?: number;
  clampEndTime?: number | null;
  loop?: boolean;
}

export interface SimulationState {
  positionBuffer: Float32Array;
  lookAtBuffer: Float32Array;
  filter: string[];
  agentFilter?: string[];
  filteredAgents?: any[];
  reset: boolean;
}

export interface UIState {
  lookAtLines: boolean;
  lookAtPoints: boolean;
  showStopDwell: boolean;
  showHeatmap: boolean;
  showInsights: boolean;
  pickMode: boolean;
}

export interface ObservationModule {
  probe: ObservationProbe | null;
  isolateMode: boolean;
}

export interface HeatmapModule {
  mode: 'currentPositionBuffer' | 'currentLookAtBuffer';
  intensity: number;
  radius: number;
}

export interface ModulesState {
  observation: ObservationModule;
  heatmap: HeatmapModule;
}

export interface PlaybackActions {
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  setTime: (time: number) => void;
  setSpeed: (speed: number) => void;
  setClampRange: (start: number, end: number | null) => void;
  setLoop: (loop: boolean) => void;
}

export interface SimulationActions {
  setFilter: (filter: string[]) => void;
  setAgentFilter: (filter: string[]) => void;
  updateBuffers: (positionBuffer: Float32Array, lookAtBuffer: Float32Array) => void;
  triggerReset: () => void;
}

export interface DataActions {
  setData: (data: AgentData[]) => void;
  setModel: (model: any) => void;
  setLoading: (isLoading: boolean, message?: string) => void;
  setLoadingMessage: (loaderId: string, message: string) => void;
  setError: (error: Error | null) => void;
}

export interface UIActions {
  toggleLookAtLines: () => void;
  toggleLookAtPoints: () => void;
  toggleStopDwell: () => void;
  toggleHeatmap: () => void;
  toggleInsights: () => void;
  togglePickMode: () => void;
}

export interface AppActions {
  playback: PlaybackActions;
  simulation: SimulationActions;
  data: DataActions;
  ui: UIActions;
}

export interface AppState {
  data: DataState;
  playback: PlaybackState;
  simulation: SimulationState;
  ui: UIState;
  modules: ModulesState;
  actions: AppActions;
}
