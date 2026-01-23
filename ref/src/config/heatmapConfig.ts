/**
 * Heatmap Configuration
 * Centralized constants for heatmap rendering and visualization
 */

/**
 * Heatmap rendering settings
 */
export const HEATMAP_RENDERING = {
  // Vertex counts for different quality levels
  DEFAULT_VERTEX_COUNT: 10000, // Used by HeatmapModule
  PLANE_VERTEX_COUNT: 100000, // Used by HeatmapPlane (~100k for optimal performance)
  HIGH_QUALITY_VERTEX_COUNT: 262144, // 512x512 from projectConfig
  
  // Plane positioning
  DEFAULT_Y_OFFSET: 0.5, // Default height for heatmap plane
  
  // Rendering parameters
  MIN_SEGMENTS: 10, // Minimum grid segments for plane generation
  
  // Optimization settings
  ENABLE_OPTIMIZATION: true, // Enable vertex filtering optimization
  OPTIMIZATION_PADDING: undefined, // Padding beyond affected region (undefined = use radius)
  OPTIMIZATION_MIN_TEXTURE_SIZE: 128, // Minimum texture size for optimization
  OPTIMIZATION_MAX_TEXTURE_SIZE: 2048, // Maximum texture size for optimization
} as const;

/**
 * Heatmap intensity and radius defaults
 * Used for layer configurations when not specified
 */
export const HEATMAP_DEFAULTS = {
  // Default intensity values
  DEFAULT_MIN_HEAT: 10.0,
  DEFAULT_MAX_HEAT: 100.0,
  
  // Default radius values
  DEFAULT_RADIUS: 5.0,
  
  // Default gradient
  DEFAULT_GRADIENT: 'smooth',
} as const;

/**
 * Static heatmap layers (not event-based)
 * These visualize agent position and look-at points directly
 */
export const STATIC_LAYER_CONFIGS = {
  position: {
    enabled: true,
    radius: 3.5,
    gradient: 'smooth',
    minHeat: 10.0,
    maxHeat: 150.0,
    useTransparency: true
  },
  lookat: {
    enabled: true,
    radius: 2.5,
    gradient: 'thermal',
    minHeat: 10.0,
    maxHeat: 60.0,
    useTransparency: true
  }
} as const;

/**
 * WebGL texture settings for heatmap
 */
export const HEATMAP_TEXTURE = {
  // Texture formats
  POSITION_FORMAT: 'RGBAFormat', // For vertex position texture
  HEAT_FORMAT: 'RGBAFormat', // For heat accumulation texture
  
  // Texture types
  POSITION_TYPE: 'FloatType',
  HEAT_TYPE: 'HalfFloatType',
  
  // Filtering
  MIN_FILTER: 'NearestFilter',
  MAG_FILTER: 'NearestFilter',
  
  // Wrapping
  WRAP_MODE: 'ClampToEdgeWrapping',
} as const;
