# Heatmap Module Architecture

## Visual Structure

```
┌─────────────────────────────────────────────────────────────┐
│                    HeatmapModuleRefactored                   │
│                     (Component Layer)                        │
│                                                              │
│  • Receives props                                           │
│  • Orchestrates data flow                                   │
│  • Delegates to services & hooks                            │
└─────────────────────────┬───────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Services   │  │    Hooks     │  │    Store     │
│              │  │              │  │              │
│ • Buffer     │  │ • Init       │  │ • State      │
│   Selector   │  │ • Accum      │  │ • Actions    │
│              │  │ • Effects    │  │              │
│ • Config     │  │              │  │              │
│   Resolver   │  │              │  │              │
│              │  │              │  │              │
│ • Material   │  │              │  │              │
│   Manager    │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
```

## Data Flow

```
Input Data
   │
   ├─→ AgentData ────────┐
   ├─→ Buffers ──────────┤
   ├─→ EventData ────────┤
   └─→ Config ───────────┤
                         │
                         ▼
              ┌─────────────────────┐
              │   Buffer Selector   │
              │                     │
              │  Selects correct    │
              │  buffer based on    │
              │  layer type         │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │   Config Resolver   │
              │                     │
              │  Merges configs:    │
              │  Store > Props >    │
              │  Defaults           │
              └──────────┬──────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │  Initialization     │
              │                     │
              │  • Render targets   │
              │  • Compute scene    │
              │  • Materials        │
              └──────────┬──────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
   ┌────────────────┐       ┌────────────────┐
   │  Accumulation  │       │    Effects     │
   │                │       │                │
   │  Frame loop:   │       │  • Visibility  │
   │  • Copy agents │       │  • Reset       │
   │  • Render heat │       │  • Materials   │
   │  • Ping-pong   │       │                │
   └────────────────┘       └────────────────┘
            │                         │
            └────────────┬────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   Display    │
                  │              │
                  │  Rendered    │
                  │  heatmap     │
                  └──────────────┘
```

## Service Interactions

```
┌─────────────────────────────────────────────────────────────┐
│                        Component                             │
└───────────┬──────────────┬──────────────┬───────────────────┘
            │              │              │
            ▼              ▼              ▼
     ┌──────────┐   ┌──────────┐  ┌──────────┐
     │  Buffer  │   │  Config  │  │Material  │
     │ Selector │   │ Resolver │  │ Manager  │
     └─────┬────┘   └─────┬────┘  └────┬─────┘
           │              │             │
           │    Selected  │  Effective  │  Updated
           │    Buffer    │  Config     │  Materials
           │              │             │
           └──────────────┴─────────────┘
                         │
                         ▼
                   Render Pipeline
```

## Hook Lifecycle

```
Component Mount
      │
      ▼
┌─────────────────────┐
│  Initialization     │
│                     │
│  1. Create render   │
│     targets         │
│  2. Setup compute   │
│     scene           │
│  3. Create          │
│     materials       │
│  4. Initialize      │
│     agents array    │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Frame Loop         │ ◄──── Continuous
│  (Accumulation)     │
│                     │
│  1. Check play      │
│     state           │
│  2. Copy agent      │
│     positions       │
│  3. Accumulate      │
│     simulation      │
│     time            │
│  4. Render heat     │
│  5. Swap targets    │
│  6. Update display  │
└──────────┬──────────┘
           │
           ├────────────────┐
           │                │
           ▼                ▼
┌─────────────────┐  ┌─────────────────┐
│  Effects        │  │  Effects        │
│  (Visibility)   │  │  (Materials)    │
│                 │  │                 │
│  Toggle mesh    │  │  Update when    │
│  visibility     │  │  config changes │
└─────────────────┘  └─────────────────┘
           │                │
           └────────┬───────┘
                    │
                    ▼
              Component Unmount
                    │
                    ▼
           ┌────────────────┐
           │    Cleanup     │
           │                │
           │  • Dispose RTs │
           │  • Dispose     │
           │    materials   │
           │  • Remove from │
           │    scene       │
           └────────────────┘
```

## Responsibility Matrix

| Component/Service | Responsibility | Input | Output |
|------------------|----------------|-------|--------|
| **HeatmapModule** | Orchestration | Props, Store | null |
| **bufferSelector** | Buffer selection | Layer ID, buffers | Float32Array |
| **configResolver** | Config merging | Layer config, props | Effective config |
| **materialManager** | Material ops | Model data, params | Updated materials |
| **useInitialization** | Setup | Model, config | Refs |
| **useAccumulation** | Heat rendering | Refs, buffer, playback | null (side effect) |
| **useEffects** | Side effects | Refs, visibility, reset | null (side effect) |

## State Management

```
┌─────────────────────────────────────────────────────────────┐
│                      Heatmap Store (Zustand)                 │
│                                                              │
│  State:                                                      │
│  • activeLayer: string                                       │
│  • layers: Record<string, LayerConfig>                       │
│                                                              │
│  Actions:                                                    │
│  • setActiveLayer(layerName)                                │
│  • setLayerConfig(layerName, config)                        │
│  • toggleLayerEnabled(layerName)                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Subscribe
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    HeatmapModule                             │
│                                                              │
│  const activeLayer = useHeatmapStore(s => s.activeLayer)   │
│  const layerConfig = useHeatmapStore(s => s.layers[id])    │
└─────────────────────────────────────────────────────────────┘
```

## Performance Considerations

```
┌────────────────────────────────────────────────────────────┐
│                    Performance Strategy                     │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Memoization:                                               │
│  • useMemo for buffer selection (recalc on deps change)    │
│  • useMemo for bounds calculation (recalc on model change) │
│  • useMemo for model data (recalc on geometry change)      │
│                                                             │
│  Efficient Updates:                                         │
│  • updateMaterialUniforms() for frequent changes           │
│  • updateDisplayMaterials() for complete recreation        │
│  • Early exits in frame loop                               │
│                                                             │
│  Memory Management:                                         │
│  • Dispose materials on update                             │
│  • Dispose render targets on unmount                       │
│  • Clear refs on cleanup                                   │
│                                                             │
│  Accumulation Strategy:                                     │
│  • Accumulate simulation time (not wall time)              │
│  • Threshold-based rendering (~30fps intervals)            │
│  • Ping-pong render targets                                │
└────────────────────────────────────────────────────────────┘
```

## Testing Strategy

```
Unit Tests
   │
   ├─→ bufferSelector
   │   • Test each layer type
   │   • Test event conversion
   │   • Test fallbacks
   │
   ├─→ configResolver
   │   • Test priority system
   │   • Test defaults
   │   • Test visibility logic
   │
   └─→ materialManager
       • Test material creation
       • Test uniform updates
       • Test disposal

Integration Tests
   │
   ├─→ HeatmapModule
   │   • Test with different layers
   │   • Test config changes
   │   • Test visibility toggle
   │
   └─→ Hooks
       • Test initialization
       • Test accumulation
       • Test effects

E2E Tests
   │
   └─→ Full heatmap workflow
       • Load model
       • Play simulation
       • Switch layers
       • Verify rendering
```

## File Organization

```
modules/heatmap/
├── types.ts                          # Type definitions
│
├── services/                          # Business logic
│   ├── index.ts
│   ├── README.md
│   ├── bufferSelector.ts
│   ├── configResolver.ts
│   └── materialManager.ts
│
├── hooks/                             # React hooks
│   ├── index.ts
│   ├── useHeatmapInitialization.ts
│   ├── useHeatmapAccumulation.ts
│   └── useHeatmapEffects.ts
│
├── HeatmapModuleRefactored.tsx       # Main component
├── useHeatmapRendererRefactored.ts   # Orchestrator hook
├── refactored.ts                      # Public API
├── examples.tsx                       # Usage examples
│
├── [Original files unchanged]
│   ├── HeatmapModule.tsx
│   ├── useHeatmapRenderer.ts
│   ├── heatmapStore.ts
│   ├── heatmapUtils.ts
│   ├── heatmapShaders.ts
│   ├── heatmapGradients.ts
│   ├── HeatmapPlane.tsx
│   └── useHeatmapModel.ts
│
└── docs/
    ├── HEATMAP_REFACTORING.md
    ├── HEATMAP_COMPARISON.md
    └── HEATMAP_REFACTORING_SUMMARY.md
```

## Extension Points

```
┌────────────────────────────────────────────────────────────┐
│                 How to Extend                               │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  Add New Layer Type:                                        │
│  1. Update bufferSelector.ts (add case in switch)          │
│  2. Update configResolver.ts (add to defaults)             │
│  3. Update eventTypes config (if event-based)              │
│                                                             │
│  Add New Gradient:                                          │
│  1. Update heatmapGradients.ts (add generator)             │
│  2. No other changes needed                                │
│                                                             │
│  Add New Material Effect:                                   │
│  1. Update heatmapShaders.ts (modify fragment shader)      │
│  2. Update materialManager.ts (add uniform handling)       │
│                                                             │
│  Custom Visualization:                                      │
│  1. Use hooks directly (useHeatmapInitialization, etc.)    │
│  2. Implement custom rendering logic                       │
│  3. Reuse services for data processing                     │
└────────────────────────────────────────────────────────────┘
```
