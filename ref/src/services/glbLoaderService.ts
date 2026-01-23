/**
 * GLB Loader Service
 * Pure functions for loading and processing GLB files
 * No React dependencies - only Three.js GLTFLoader logic
 */

import * as THREE from 'three';
// @ts-ignore - Three.js loader types issue
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { calculateAnimationDuration } from '../utils/animationUtils';
import { calculateMaxTime } from '../utils/agentUtils';

// Type import for GLTF
type GLTF = {
  animations: THREE.AnimationClip[];
  scene: THREE.Group;
  scenes: THREE.Group[];
  cameras: THREE.Camera[];
  asset: object;
  parser: any;
  userData: any;
};

interface FileNameMetadata {
  participant: string;
  scenario: string;
}

interface AgentMeta {
  participant: string;
  scenario: string;
  color: string | null;
  length: number;
  duration: number;
  fileName: string;
}

interface AgentNodes {
  position: THREE.Object3D;
  lookAt: THREE.Object3D;
}

export interface ProcessedAgent {
  id: number;
  meta: AgentMeta;
  gltf: GLTF;
  scene: THREE.Group;
  animation: THREE.AnimationClip;
  nodes: AgentNodes;
  mixer: THREE.AnimationMixer;
  action: THREE.AnimationAction;
}

/**
 * Parse participant and scenario from GLB filename
 */
export function parseGLBFileName(fileName: string, fileIndex: number): FileNameMetadata {
  const match = fileName.match(/^(P\d+)_(S\d+[AB]?)\.glb$/);
  return {
    participant: match ? match[1] : `P${fileIndex + 1}`,
    scenario: match ? match[2] : 'S1'
  };
}

/**
 * Process a loaded GLTF into an agent object
 */
export function processGLTFToAgent(gltf: GLTF, fileName: string, fileIndex: number): ProcessedAgent {
  // Extract animation data
  const animation = gltf.animations[0];
  if (!animation) {
    throw new Error(`No animation found in ${fileName}`);
  }

  // Find position and lookAt nodes
  const positionNode = gltf.scene.getObjectByName('position');
  const lookAtNode = gltf.scene.getObjectByName('lookAt');

  if (!positionNode || !lookAtNode) {
    throw new Error(`Missing position or lookAt nodes in ${fileName}`);
  }

  // Create AnimationMixer
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const action = mixer.clipAction(animation);
  action.setLoop(THREE.LoopOnce, 1);
  action.clampWhenFinished = true;
  action.play();

  // Calculate duration
  const duration = calculateAnimationDuration(animation);

  // Parse metadata from filename
  const { participant, scenario } = parseGLBFileName(fileName, fileIndex);

  // Build agent object
  return {
    id: fileIndex,
    meta: {
      participant,
      scenario,
      color: (gltf.userData?.color as string) || null,
      length: Math.floor(duration * 30), // Approximate frame count for compatibility
      duration,
      fileName
    },
    gltf,
    scene: gltf.scene,
    animation,
    nodes: {
      position: positionNode,
      lookAt: lookAtNode
    },
    mixer,
    action
  };
}

/**
 * Load a single GLB file and process it into an agent
 */
export function loadSingleGLB(
  filePath: string,
  fileName: string,
  fileIndex: number,
  loader: GLTFLoader
): Promise<ProcessedAgent> {
  return new Promise((resolve, reject) => {
    loader.load(
      filePath,
      (gltf: GLTF) => {
        try {
          const agent = processGLTFToAgent(gltf, fileName, fileIndex);
          resolve(agent);
        } catch (error) {
          reject(new Error(`Error processing ${fileName}: ${(error as Error).message}`));
        }
      },
      undefined,
      (error: unknown) => {
        reject(new Error(`Failed to load ${fileName}: ${(error as Error).message}`));
      }
    );
  });
}

/**
 * Load multiple GLB files with concurrency control
 */
export async function loadGLBBatch(
  fileNames: string[],
  glbPath: string,
  onProgress?: (loadedCount: number, totalCount: number) => void
): Promise<ProcessedAgent[]> {
  const loader = new GLTFLoader();
  const agents: ProcessedAgent[] = [];
  const totalFiles = fileNames.length;
  let loadedFiles = 0;
  
  const CONCURRENT_LOADS = 4;
  
  for (let i = 0; i < fileNames.length; i += CONCURRENT_LOADS) {
    const batch = fileNames.slice(i, i + CONCURRENT_LOADS);
    
    const batchPromises = batch.map(async (fileName, batchIndex) => {
      const fileIndex = i + batchIndex;
      const filePath = `${glbPath}${fileName}`;
      
      const agent = await loadSingleGLB(filePath, fileName, fileIndex, loader);
      
      loadedFiles++;
      if (onProgress) {
        onProgress(loadedFiles, totalFiles);
      }
      
      return agent;
    });

    // Wait for batch to complete
    const batchResults = await Promise.all(batchPromises);
    agents.push(...batchResults);
  }
  
  return agents;
}

/**
 * Normalize agent durations (ensure all have valid durations)
 */
export function normalizeAgentDurations(agents: ProcessedAgent[]): ProcessedAgent[] {
  const maxTime = calculateMaxTime(agents as any);
  
  agents.forEach(agent => {
    if (!agent.meta.duration || isNaN(agent.meta.duration) || agent.meta.duration <= 0) {
      agent.meta.duration = maxTime;
    }
  });
  
  return agents;
}
