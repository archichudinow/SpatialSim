/**
 * Project Configuration
 * Centralized project paths and settings
 * Now supports both static config and dynamic Supabase-loaded config
 */
import { HEATMAP_RENDERING } from './heatmapConfig';
import type { ProjectData } from '../services/projectService';

interface FeatureFlags {
  insights: boolean;
  insightsUI: boolean;
  heatmap: boolean;
  drawing: boolean;
  contextModel: boolean;
  metroModel: boolean;
}

interface HeatmapSettings {
  targetVertexCount: number;
}

interface ProjectConfig {
  // Project metadata
  name: string;
  description: string;
  
  // Data sources (from Supabase)
  recordsUrl: string[];
  heatmapModel: string | null;
  visualizationModels: string[];
  
  // Legacy paths (for backward compatibility)
  projectPath: string;
  recordsPath: string;
  manifestPath: string;
  models?: {
    main: string | null;
    context: string | null;
    lines: string | null;
    metro: string | null;
  };
  
  // Feature flags
  features: FeatureFlags;
  
  // Heatmap settings
  heatmap: HeatmapSettings;
}

// Default/fallback configuration (placeholder - projects should always load from Supabase)
export const DEFAULT_PROJECT_CONFIG: ProjectConfig = {
  // Project metadata
  name: "No Project Selected",
  description: "Please select a project from Supabase",
  
  // Data sources (loaded from Supabase)
  recordsUrl: [],
  heatmapModel: null,
  visualizationModels: [],
  
  // Legacy paths (deprecated - not used with Supabase)
  projectPath: "",
  recordsPath: "",
  manifestPath: "",
  
  // Feature flags - Toggle modules for debugging/performance testing
  features: {
    insights: true,
    insightsUI: true,
    heatmap: true,
    drawing: true,
    contextModel: true,
    metroModel: false
  },
  
  // Heatmap settings
  heatmap: {
    targetVertexCount: HEATMAP_RENDERING.HIGH_QUALITY_VERTEX_COUNT  // 512x512 = 262k vertices
  }
};

// Current active project config (will be updated dynamically)
export let PROJECT_CONFIG: ProjectConfig = { ...DEFAULT_PROJECT_CONFIG };

/**
 * Update the project configuration from Supabase data
 */
export function updateProjectConfig(projectData: ProjectData): void {
  console.log('📦 Updating project config for:', projectData.name);
  console.log('   Models:', {
    context: projectData.models_context ? '✓' : '✗',
    project: projectData.models_project ? '✓' : '✗',
    heatmap: projectData.models_heatmap ? '✓' : '✗'
  });
  console.log('   Records:', projectData.records?.length || 0);
  
  // Build visualization models array from available models
  const visualizationModels: string[] = [];
  
  // models_context and models_project are the same visual style, prefer context
  if (projectData.models_context) {
    console.log('   Using models_context for visualization');
    visualizationModels.push(projectData.models_context);
  } else if (projectData.models_project) {
    console.log('   Using models_project for visualization');
    visualizationModels.push(projectData.models_project);
  } else {
    console.log('   ⚠️  No visualization model available');
  }
  
  // Update the global config
  PROJECT_CONFIG = {
    name: projectData.name,
    description: projectData.description || '',
    recordsUrl: projectData.records || [],
    heatmapModel: projectData.models_heatmap,
    visualizationModels,
    
    // Legacy paths - not used when loading from Supabase
    projectPath: '',
    recordsPath: '',
    manifestPath: '',
    
    // Feature flags based on available data
    features: {
      insights: true,
      insightsUI: true,
      heatmap: !!projectData.models_heatmap,
      drawing: true,
      contextModel: visualizationModels.length > 0,
      metroModel: false
    },
    
    // Heatmap settings
    heatmap: {
      targetVertexCount: HEATMAP_RENDERING.HIGH_QUALITY_VERTEX_COUNT
    }
  };

  console.log('   Feature flags:', PROJECT_CONFIG.features);

  // Update models accessor for backward compatibility
  (PROJECT_CONFIG as any).models = {
    main: projectData.models_heatmap,
    context: projectData.models_context || projectData.models_project,
    lines: null,
    metro: null
  };
  
  console.log('✅ Project config updated');
}

// Backward compatibility: models accessor
export const models = {
  get main() { return PROJECT_CONFIG.heatmapModel; },
  get context() { return PROJECT_CONFIG.visualizationModels[0] || null; },
  get lines() { return PROJECT_CONFIG.visualizationModels[1] || null; },
  get metro() { return null; }
};

// Attach models to PROJECT_CONFIG for backward compatibility
(PROJECT_CONFIG as any).models = models;

