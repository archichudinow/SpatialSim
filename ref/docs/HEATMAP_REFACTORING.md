# Heatmap Module Refactoring

## Overview

This document describes the refactored heatmap module architecture, focusing on improved separation of concerns, reusability, and maintainability.

## Goals Achieved

1. ✅ **Separated Business Logic** - Logic split into focused services
2. ✅ **Improved Readability** - Smaller, single-purpose functions
3. ✅ **Enhanced Reusability** - Services can be used independently
4. ✅ **Better Type Safety** - Comprehensive TypeScript types
5. ✅ **Clearer Responsibilities** - Each file has a single concern

## New Architecture

### Directory Structure

```
modules/heatmap/
├── types.ts                          # Type definitions
├── services/
│   ├── index.ts                      # Service exports
│   ├── bufferSelector.ts             # Buffer selection logic
│   ├── configResolver.ts             # Configuration resolution
│   └── materialManager.ts            # Material management
├── hooks/
│   ├── index.ts                      # Hook exports
│   ├── useHeatmapInitialization.ts   # Setup logic
│   ├── useHeatmapAccumulation.ts     # Frame accumulation
│   └── useHeatmapEffects.ts          # Side effects
├── HeatmapModuleRefactored.tsx       # New simplified component
├── useHeatmapRendererRefactored.ts   # New orchestrator hook
└── [original files remain unchanged]
```

## Services

### 1. Buffer Selector (`bufferSelector.ts`)

**Purpose:** Handles selection and conversion of buffers for different layer types

**Functions:**
- `selectLayerBuffer(options)` - Select appropriate buffer for a layer
- `isEventBasedLayer(layerId)` - Check if layer uses event data
- `shouldUsePlaneGeometry(layerId)` - Check default geometry type

**Benefits:**
- Centralized buffer logic
- Easy to add new layer types
- Testable in isolation

**Example:**
```typescript
const buffer = selectLayerBuffer({
  layerId: 'position',
  positionBuffer,
  lookAtBuffer,
  agents
});
```

### 2. Config Resolver (`configResolver.ts`)

**Purpose:** Resolves effective configuration by merging store state with props

**Functions:**
- `resolveLayerConfig(options)` - Merge config sources (store > props > defaults)
- `getLayerDefaults(layerId)` - Get default config for layer type

**Benefits:**
- Clear priority system
- Centralized default values
- Easier configuration management

**Example:**
```typescript
const config = resolveLayerConfig({
  layerConfig: storeConfig,
  activeLayer: 'position',
  currentLayerId: 'position',
  propRadius: 3.0
});
// Returns: { radius, gradient, minHeat, maxHeat, useTransparency, shouldAccumulate, shouldDisplay }
```

### 3. Material Manager (`materialManager.ts`)

**Purpose:** Handles creation and updating of Three.js materials

**Functions:**
- `updateDisplayMaterials(...)` - Recreate all materials
- `updateMaterialUniforms(...)` - Update uniforms (more efficient)
- `disposeMaterials(...)` - Clean up materials
- `setMeshVisibility(...)` - Toggle mesh visibility

**Benefits:**
- Prevents memory leaks
- Performance optimization
- Reusable across components

**Example:**
```typescript
updateDisplayMaterials(modelData, heatTexture, maxHeat, true, minHeat, 'smooth');
```

## Hooks

### 1. Initialization Hook (`useHeatmapInitialization.ts`)

**Purpose:** One-time setup of render targets, scenes, and materials

**Returns:** Refs object with render state

**Benefits:**
- Isolated initialization logic
- Clear lifecycle management
- Automatic cleanup

### 2. Accumulation Hook (`useHeatmapAccumulation.ts`)

**Purpose:** Frame-by-frame heat accumulation during playback

**Parameters:** Refs, modelData, buffer, playback state, config

**Benefits:**
- Focused on accumulation logic only
- Easy to optimize independently
- Testable timing logic

### 3. Effects Hook (`useHeatmapEffects.ts`)

**Purpose:** Manages side effects (visibility, reset, material updates)

**Parameters:** Refs, modelData, scene, visibility, playback, material deps

**Benefits:**
- Centralized side effects
- Clear dependency tracking
- Predictable updates

## Refactored Components

### HeatmapModuleRefactored.tsx

**Changes:**
- ✅ Removed inline buffer selection logic → uses `selectLayerBuffer()`
- ✅ Removed configuration merging logic → uses `resolveLayerConfig()`
- ✅ Simplified to ~120 lines (from ~140)
- ✅ Clear, readable flow

**Structure:**
1. Get state from stores
2. Determine geometry type
3. Select buffer
4. Calculate bounds
5. Get model data
6. Resolve configuration
7. Render

### useHeatmapRendererRefactored.ts

**Changes:**
- ✅ Removed ~180 lines of logic
- ✅ Now orchestrates sub-hooks
- ✅ Clear separation of concerns

**Structure:**
1. Initialize (via `useHeatmapInitialization`)
2. Accumulate (via `useHeatmapAccumulation`)
3. Handle effects (via `useHeatmapEffects`)

## Type Safety

### New Types (`types.ts`)

```typescript
LayerConfig           # Store configuration
HeatmapModelData      # Model data structure
ModelBounds           # Bounds information
EffectiveLayerConfig  # Resolved configuration
BufferSelectionOptions # Buffer selector params
RenderTargetPair      # Render target pair
```

## Migration Guide

### Option 1: Gradual Migration (Recommended)

Keep original files, use refactored versions for new features:

```typescript
// For existing code
import HeatmapModule from './HeatmapModule';

// For new code
import HeatmapModuleRefactored from './HeatmapModuleRefactored';
```

### Option 2: Direct Replacement

Replace imports across codebase:

```typescript
// Before
import HeatmapModule from './modules/heatmap/HeatmapModule';

// After
import HeatmapModule from './modules/heatmap/HeatmapModuleRefactored';
```

## Benefits Summary

### Readability
- **Before:** 140-line component with mixed concerns
- **After:** 120-line component with clear flow + reusable services

### Maintainability
- **Before:** Changes require understanding entire component
- **After:** Changes isolated to specific service/hook

### Reusability
- **Before:** Logic tied to component
- **After:** Services usable anywhere

### Testability
- **Before:** Difficult to test logic in isolation
- **After:** Each service/hook testable independently

### Performance
- **Before:** Material recreation on every update
- **After:** Efficient uniform updates via `updateMaterialUniforms()`

## Usage Examples

### Using Services Directly

```typescript
// In another component or utility
import { selectLayerBuffer, resolveLayerConfig } from './services';

const buffer = selectLayerBuffer({ ... });
const config = resolveLayerConfig({ ... });
```

### Using Hooks Directly

```typescript
// In a custom heatmap component
import { useHeatmapInitialization, useHeatmapAccumulation } from './hooks';

const refs = useHeatmapInitialization(...);
useHeatmapAccumulation(refs, ...);
```

### Using Material Manager

```typescript
// In any component managing Three.js materials
import { updateDisplayMaterials, disposeMaterials } from './services';

updateDisplayMaterials(modelData, texture, maxHeat, true, minHeat, 'smooth');

// Cleanup
useEffect(() => {
  return () => disposeMaterials(modelData);
}, []);
```

## Testing Strategy

### Unit Tests

```typescript
// services/bufferSelector.test.ts
describe('selectLayerBuffer', () => {
  it('selects position buffer for position layer', () => {
    const buffer = selectLayerBuffer({
      layerId: 'position',
      positionBuffer: mockPositionBuffer,
      lookAtBuffer: mockLookAtBuffer
    });
    expect(buffer).toBe(mockPositionBuffer);
  });
});
```

### Integration Tests

```typescript
// HeatmapModuleRefactored.test.tsx
describe('HeatmapModuleRefactored', () => {
  it('renders with position layer', () => {
    render(<HeatmapModuleRefactored id="position" ... />);
    // Assertions
  });
});
```

## Performance Considerations

1. **Memoization:** Buffer selection and bounds calculation are memoized
2. **Efficient Updates:** Use `updateMaterialUniforms()` instead of recreating materials
3. **Cleanup:** Automatic disposal via cleanup functions
4. **Conditional Logic:** Early exits prevent unnecessary work

## Future Improvements

1. **Caching Layer:** Add caching for expensive operations
2. **Worker Threads:** Move heavy calculations to web workers
3. **LOD System:** Level-of-detail for large models
4. **Custom Shaders:** Plugin system for custom gradient shaders
5. **Snapshot System:** Save/restore heatmap state

## Questions & Answers

**Q: Can I use the old and new versions together?**
A: Yes! They're fully compatible. Use refactored versions incrementally.

**Q: What about performance?**
A: Performance is equal or better due to efficient uniform updates and better memoization.

**Q: Do I need to update config files?**
A: No! Configuration format remains unchanged.

**Q: Can I add new layer types?**
A: Yes! Add to `bufferSelector.ts` and `configResolver.ts` defaults.

## Conclusion

The refactored heatmap module provides:
- ✅ Better separation of concerns
- ✅ Improved code organization
- ✅ Enhanced reusability
- ✅ Easier testing
- ✅ Better performance
- ✅ Maintainable codebase

All while maintaining backward compatibility with existing code.
