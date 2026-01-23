/**
 * Type definitions for heatmap module
 */
import type * as THREE from 'three';
import type { AgentData } from '../../types';

/**
 * Layer configuration stored in heatmap store
 */
export interface LayerConfig {
  enabled: boolean;
  radius?: number;
  gradient?: string;
  minHeat?: number;
  maxHeat?: number;
  useTransparency?: boolean;
  intensity?: number;
  [key: string]: any;
}

/**
 * Heatmap model data (from GLB or plane)
 */
export interface HeatmapModelData {
  meshes: THREE.Mesh[];
  vertexPosTexture: THREE.DataTexture;
  textureSize: number;
  vertexCount?: number;
}

/**
 * Bounds information for plane generation
 */
export interface ModelBounds {
  min: { x: number; y: number; z: number };
  max: { x: number; y: number; z: number };
}

/**
 * Layer configuration with effective values
 */
export interface EffectiveLayerConfig {
  radius: number;
  gradient: string;
  minHeat: number;
  maxHeat: number;
  useTransparency: boolean;
  shouldAccumulate: boolean;
  shouldDisplay: boolean;
}

/**
 * Props for buffer selection
 */
export interface BufferSelectionOptions {
  layerId: string;
  agentBuffer?: Float32Array | null;
  positionBuffer: Float32Array;
  lookAtBuffer: Float32Array;
  eventData?: any;
  agents: AgentData[];
}

/**
 * Render target pair for ping-pong rendering
 */
export interface RenderTargetPair {
  current: THREE.WebGLRenderTarget;
  previous: THREE.WebGLRenderTarget;
}
