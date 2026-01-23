# Heatmap Services

This directory contains reusable services for the heatmap module, extracted to improve code organization, testability, and reusability.

## Services Overview

### 1. Buffer Selector (`bufferSelector.ts`)

Handles selection and conversion of different buffer types for heatmap layers.

**Key Functions:**
- `selectLayerBuffer(options)` - Select appropriate buffer based on layer type
- `isEventBasedLayer(layerId)` - Check if layer uses event data
- `shouldUsePlaneGeometry(layerId)` - Determine default geometry type

**Usage:**
```typescript
import { selectLayerBuffer } from './bufferSelector';

const buffer = selectLayerBuffer({
  layerId: 'position',
  positionBuffer: positions,
  lookAtBuffer: lookAts,
  agents: agentData
});
```

### 2. Config Resolver (`configResolver.ts`)

Resolves effective layer configuration by merging store state with props.

**Key Functions:**
- `resolveLayerConfig(options)` - Merge configuration sources with priority
- `getLayerDefaults(layerId)` - Get default configuration for layer type

**Priority System:**
1. Store configuration (highest)
2. Component props
3. Layer defaults (lowest)

**Usage:**
```typescript
import { resolveLayerConfig, getLayerDefaults } from './configResolver';

const defaults = getLayerDefaults('position');
const config = resolveLayerConfig({
  layerConfig: storeConfig,
  activeLayer: 'position',
  currentLayerId: 'position',
  propRadius: defaults.radius,
  propGradient: defaults.gradient
});
```

### 3. Material Manager (`materialManager.ts`)

Handles creation, updating, and disposal of Three.js materials.

**Key Functions:**
- `updateDisplayMaterials(...)` - Recreate all materials with new parameters
- `updateMaterialUniforms(...)` - Update uniforms efficiently (no recreation)
- `disposeMaterials(modelData)` - Clean up materials to prevent memory leaks
- `setMeshVisibility(modelData, visible)` - Toggle mesh visibility

**Usage:**
```typescript
import { 
  updateDisplayMaterials, 
  updateMaterialUniforms,
  disposeMaterials 
} from './materialManager';

// Full update (recreates materials)
updateDisplayMaterials(
  modelData, 
  heatTexture, 
  maxHeat, 
  true, 
  minHeat, 
  'smooth'
);

// Efficient update (only uniforms)
updateMaterialUniforms(modelData, {
  minHeat: 10,
  maxHeat: 100
});

// Cleanup
useEffect(() => {
  return () => disposeMaterials(modelData);
}, [modelData]);
```

## Design Principles

1. **Single Responsibility:** Each service handles one concern
2. **Pure Functions:** Services are stateless and side-effect free (where possible)
3. **Type Safety:** Full TypeScript support with comprehensive types
4. **Testability:** Easy to unit test in isolation
5. **Documentation:** Every function documented with JSDoc

## Testing

All services are designed to be easily unit tested:

```typescript
// Example test
import { selectLayerBuffer } from './bufferSelector';

describe('selectLayerBuffer', () => {
  it('selects position buffer for position layer', () => {
    const posBuffer = new Float32Array([1, 2, 3]);
    const result = selectLayerBuffer({
      layerId: 'position',
      positionBuffer: posBuffer,
      lookAtBuffer: new Float32Array()
    });
    expect(result).toBe(posBuffer);
  });
});
```

## Adding New Layer Types

To add a new layer type, update these services:

### 1. Buffer Selector
```typescript
// bufferSelector.ts
export function selectLayerBuffer(options: BufferSelectionOptions): Float32Array {
  switch (layerId) {
    case 'newLayerType':
      return eventData ? convertNewFormat(eventData) : new Float32Array(0);
    // ...
  }
}
```

### 2. Config Resolver
```typescript
// configResolver.ts
export function getLayerDefaults(layerId: string): Partial<EffectiveLayerConfig> {
  const defaults = {
    newLayerType: {
      radius: 4.0,
      gradient: 'thermal',
      minHeat: 5.0,
      maxHeat: 100.0,
      useTransparency: true
    },
    // ...
  };
}
```

## Performance Considerations

### Material Updates

- **Frequent updates:** Use `updateMaterialUniforms()` (fast)
- **Infrequent updates:** Use `updateDisplayMaterials()` (complete)
- **Always:** Call `disposeMaterials()` on cleanup

### Buffer Selection

- Results are memoized at the component level
- No caching in service (keep services pure)
- Let React handle memoization

## Future Enhancements

Potential improvements for these services:

1. **Caching Layer:** Add optional caching for expensive operations
2. **Validation:** Add runtime validation for buffer formats
3. **Metrics:** Add performance metrics collection
4. **Pooling:** Object pooling for frequently created objects
5. **WebGL State:** Better WebGL state management

## Related Documentation

- [HEATMAP_REFACTORING.md](../../docs/HEATMAP_REFACTORING.md) - Full refactoring overview
- [HEATMAP_COMPARISON.md](../../docs/HEATMAP_COMPARISON.md) - Before/after comparison
- [../types.ts](../types.ts) - Type definitions

## Questions?

If you have questions about these services or suggestions for improvements, please refer to the main refactoring documentation or open an issue.
