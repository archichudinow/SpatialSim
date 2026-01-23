# Heatmap Module - Refactored ✨

> **A cleaner, more maintainable heatmap visualization system with separated concerns and reusable components.**

## Quick Start

### Using Refactored Component (Drop-in Replacement)

```typescript
import HeatmapModule from './modules/heatmap/HeatmapModuleRefactored';

function Scene() {
  return (
    <HeatmapModule
      id="position"
      agents={agents}
      currentTime={currentTime}
      positionBuffer={positionBuffer}
      lookAtBuffer={lookAtBuffer}
    />
  );
}
```

### Using Services Independently

```typescript
import { selectLayerBuffer, resolveLayerConfig } from './modules/heatmap/services';

// Select appropriate buffer
const buffer = selectLayerBuffer({
  layerId: 'position',
  positionBuffer,
  lookAtBuffer,
  agents
});

// Resolve configuration
const config = resolveLayerConfig({
  layerConfig: storeConfig,
  activeLayer: 'position',
  currentLayerId: 'position'
});
```

## What's New?

### 🎯 Separated Business Logic
- **Buffer selection** → Dedicated service
- **Configuration resolution** → Dedicated service  
- **Material management** → Dedicated service

### 🪝 Focused Hooks
- **Initialization** → Setup logic only
- **Accumulation** → Frame rendering only
- **Effects** → Side effects only

### 📦 Reusable Components
- Services can be used independently
- Hooks are composable
- Types are exportable

### 📚 Comprehensive Documentation
- Complete refactoring guide
- Before/after comparison
- Architecture diagrams
- Usage examples

## Structure

```
modules/heatmap/
├── 📄 types.ts                    # Type definitions
│
├── 📁 services/                   # Business logic
│   ├── bufferSelector.ts         # Buffer selection
│   ├── configResolver.ts         # Config resolution
│   ├── materialManager.ts        # Material management
│   └── README.md                 # Service documentation
│
├── 📁 hooks/                      # React hooks
│   ├── useHeatmapInitialization.ts
│   ├── useHeatmapAccumulation.ts
│   └── useHeatmapEffects.ts
│
├── 🎨 HeatmapModuleRefactored.tsx # Main component
├── 🔧 useHeatmapRendererRefactored.ts
├── 📤 refactored.ts               # Public API
└── 📖 examples.tsx                # Usage examples
```

## Features

### Buffer Selection Service
Select the right buffer for each layer type:
- Position layers → position buffer
- Look-at layers → look-at buffer
- Event layers → converted event data

### Configuration Resolver
Merge configuration from multiple sources:
1. Store configuration (highest priority)
2. Component props
3. Layer defaults (lowest priority)

### Material Manager
Efficient material handling:
- Create and update materials
- Dispose properly (no memory leaks)
- Update uniforms efficiently
- Toggle visibility

### Initialization Hook
One-time setup:
- Create render targets
- Setup compute scene
- Initialize materials
- Handle cleanup

### Accumulation Hook
Frame-by-frame rendering:
- Copy agent positions
- Accumulate heat
- Ping-pong render targets
- Update display

### Effects Hook
Side effect management:
- Visibility changes
- Reset handling
- Material updates

## Benefits

### For Developers
- ✅ **Easier to understand** - Smaller, focused files
- ✅ **Easier to test** - Unit testable services
- ✅ **Easier to modify** - Changes localized
- ✅ **Better types** - Full TypeScript support

### For the Codebase
- ✅ **Less duplication** - Reusable services
- ✅ **Better organization** - Clear structure
- ✅ **Lower complexity** - Single responsibility
- ✅ **Easier maintenance** - Isolated changes

### For Performance
- ✅ **Efficient updates** - Smart material updates
- ✅ **Proper cleanup** - No memory leaks
- ✅ **Better memoization** - Strategic caching

## Usage Examples

### 1. Basic Usage
```typescript
<HeatmapModule
  id="position"
  agents={agents}
  currentTime={time}
  positionBuffer={posBuffer}
  lookAtBuffer={lookBuffer}
/>
```

### 2. Buffer Analysis
```typescript
const buffer = selectLayerBuffer({
  layerId: 'linger',
  eventData: lingerEvents,
  agents: agentData
});
console.log(`Buffer size: ${buffer.length / 3} positions`);
```

### 3. Configuration Management
```typescript
const defaults = getLayerDefaults('position');
const config = resolveLayerConfig({
  layerConfig: storeConfig,
  activeLayer: 'position',
  currentLayerId: 'position',
  propRadius: defaults.radius
});
```

### 4. Material Updates
```typescript
// Efficient uniform update
updateMaterialUniforms(modelData, {
  minHeat: 10,
  maxHeat: 100
});

// Full material recreation
updateDisplayMaterials(
  modelData,
  heatTexture,
  maxHeat,
  true,
  minHeat,
  'smooth'
);
```

### 5. Custom Heatmap
```typescript
const refs = useHeatmapInitialization(...);
useHeatmapAccumulation(refs, ...);
useHeatmapEffects(refs, ...);
```

## API Reference

### Services

#### selectLayerBuffer(options)
Select appropriate buffer for a layer.

**Parameters:**
- `layerId: string` - Layer identifier
- `positionBuffer: Float32Array` - Position buffer
- `lookAtBuffer: Float32Array` - Look-at buffer
- `eventData?: any` - Event data (optional)
- `agents: AgentData[]` - Agent data

**Returns:** `Float32Array` - Selected buffer

#### resolveLayerConfig(options)
Resolve effective layer configuration.

**Parameters:**
- `layerConfig?: LayerConfig` - Store config
- `activeLayer: string` - Active layer
- `currentLayerId: string` - Current layer ID
- `propRadius?: number` - Prop radius
- `propGradient?: string` - Prop gradient
- ... (more props)

**Returns:** `EffectiveLayerConfig` - Resolved configuration

#### updateDisplayMaterials(...)
Recreate all display materials.

**Parameters:**
- `modelData: HeatmapModelData` - Model data
- `heatTexture: THREE.Texture` - Heat texture
- `maxHeat: number` - Max heat value
- `useTransparency: boolean` - Use transparency
- `minHeat: number` - Min heat value
- `gradientStyle: string` - Gradient style

### Hooks

#### useHeatmapInitialization(...)
Initialize heatmap rendering pipeline.

**Returns:** Object with refs to render state

#### useHeatmapAccumulation(refs, ...)
Handle frame-by-frame heat accumulation.

#### useHeatmapEffects(refs, ...)
Manage side effects (visibility, reset, materials).

## Documentation

- **[HEATMAP_REFACTORING.md](../../docs/HEATMAP_REFACTORING.md)** - Complete guide
- **[HEATMAP_COMPARISON.md](../../docs/HEATMAP_COMPARISON.md)** - Before/after
- **[HEATMAP_ARCHITECTURE.md](../../docs/HEATMAP_ARCHITECTURE.md)** - Architecture
- **[HEATMAP_REFACTORING_SUMMARY.md](../../docs/HEATMAP_REFACTORING_SUMMARY.md)** - Summary
- **[services/README.md](./services/README.md)** - Service docs
- **[examples.tsx](./examples.tsx)** - Usage examples

## Migration

### Option 1: Gradual (Recommended)
```typescript
// Keep both versions
import HeatmapModule from './HeatmapModule'; // Original
import HeatmapModuleNew from './HeatmapModuleRefactored'; // New
```

### Option 2: Direct Replacement
```typescript
// Update imports
- import HeatmapModule from './modules/heatmap/HeatmapModule';
+ import HeatmapModule from './modules/heatmap/HeatmapModuleRefactored';
```

## Testing

### Unit Tests
```typescript
import { selectLayerBuffer } from './services/bufferSelector';

test('selects position buffer', () => {
  const buffer = selectLayerBuffer({
    layerId: 'position',
    positionBuffer: mockBuffer,
    lookAtBuffer: mockBuffer
  });
  expect(buffer).toBe(mockBuffer);
});
```

### Integration Tests
```typescript
test('renders heatmap', () => {
  render(<HeatmapModuleRefactored {...props} />);
  // Assertions
});
```

## Performance

- **Memoized** buffer selection and bounds calculation
- **Efficient** material uniform updates
- **Proper** cleanup and disposal
- **Strategic** early exits in frame loop

## Extension

### Add New Layer Type
1. Update `bufferSelector.ts`
2. Update `configResolver.ts`
3. Done!

### Add New Gradient
1. Update `heatmapGradients.ts`
2. No other changes needed!

### Custom Visualization
1. Use hooks directly
2. Implement custom logic
3. Reuse services

## FAQ

**Q: Is this a breaking change?**  
A: No! Original files unchanged, fully backward compatible.

**Q: Can I use old and new together?**  
A: Yes! They coexist perfectly.

**Q: What about performance?**  
A: Equal or better, with improved memory management.

**Q: Do I need to update configs?**  
A: No! Configuration format unchanged.

**Q: How do I add a new layer type?**  
A: Update `bufferSelector.ts` and `configResolver.ts` defaults.

## Support

- **Documentation:** See `/docs` folder
- **Examples:** See `examples.tsx`
- **Architecture:** See `HEATMAP_ARCHITECTURE.md`

## Changelog

### v2.0.0 (Refactored - 2026-01-23)
- ✅ Separated business logic into services
- ✅ Split renderer into focused hooks
- ✅ Added comprehensive type definitions
- ✅ Created extensive documentation
- ✅ Improved code organization
- ✅ Enhanced reusability
- ✅ Better performance
- ✅ No breaking changes

### v1.0.0 (Original)
- Initial implementation
- Monolithic component structure

## License

Same as parent project.

---

**Status:** ✅ Ready for use  
**Breaking Changes:** None  
**Migration Required:** Optional  
**Documentation:** Complete  
**Examples:** Included  

🎉 **Happy heatmapping!**
