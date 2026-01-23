# SpatialLens

**Navigation & Wayfinding Performance Review**

SpatialLens evaluates how people perceive, understand, and navigate spaces through advanced 3D visualization and behavioral analysis.

---

## 🏗️ Architecture Overview

SpatialLens is a React-based 3D visualization platform built on **React Three Fiber** (R3F) and **Three.js**. It loads GLB-encoded agent movement data, simulates temporal playback, and provides modular analysis capabilities through three independent feature modules.

### Technology Stack

- **React 19** - UI framework
- **React Three Fiber** - Declarative Three.js wrapper
- **Three.js** - 3D rendering engine
- **Zustand** - State management (multiple stores)
- **Vite** - Build tool and dev server
- **Leva** - UI controls/panels
- **PapaParse** - CSV parsing (manifest files)

---

## 📐 System Architecture

### State Management (Zustand)

The application uses **two separate Zustand stores** for clear separation of concerns:

#### 1. **AppState** (`src/AppState.js`) - Global Application State

Organized into five namespaces:

```javascript
{
  data: {
    raw: [],                    // Loaded agent data with animation tracks
    model: null,                // Loaded GLB scene (3D environment)
    isLoadedData: false,
    isLoadedModel: false,
    loadingMessage: string
  },
  
  playback: {
    isPlaying: false,
    time: 0,                    // Current simulation time (seconds)
    speed: 1.0,                 // Playback speed multiplier
    maxTime: 0                  // Total simulation duration
  },
  
  simulation: {
    positionBuffer: Float32Array,  // Current agent positions [x,y,z,...]
    lookAtBuffer: Float32Array,    // Current agent look-at vectors
    filter: [],                    // Scenario filter ["S1", "S2", ...]
    agentFilter: null,             // Single agent filter (null = all)
    filteredAgents: []             // Pre-filtered agent array
  },
  
  ui: {
    lookAtLines: false,
    lookAtPoints: false,
    showTrail: true,
    showHeatmap: false,
    pickMode: false
  },
  
  modules: {
    heatmap: {
      mode: 'currentPositionBuffer',  // or 'currentLookAtBuffer'
      intensity: 50.0,
      radius: 3.0,
      useTransparency: true
    }
  }
}
```

#### 2. **insightsStore** (`src/modules/insights/insightsStore.js`) - Insights Module State

Completely independent from AppState:

```javascript
{
  observers: [],                    // 3D spatial detection volumes
  stateManager: null,               // Insights state manager instance
  insightsEnabled: true,
  showInsightsVisualization: true,
  selectedEventType: 'pause',
  qualityPanelObserverIds: [],
  detectionConfig: { ... },         // Detection thresholds
  lastInsightUpdate: 0              // Timestamp for reactivity
}
```

---

## 🗂️ Directory Structure

```
src/
├── App.jsx                      # Root component with Canvas setup
├── index.jsx                    # React DOM entry point
├── AppState.js                  # Global Zustand store
├── styles.css                   # Global styles
├── types.js                     # TypeScript type definitions (JSDoc)
│
├── components/                  # Core React components
│   ├── ErrorBoundary.jsx        # Error handling wrapper
│   ├── LoadingScreen.jsx        # Loading UI with progress
│   ├── LoadGLBData.jsx          # GLB agent data loader
│   ├── LoadModel.jsx            # 3D environment model loader
│   ├── LoadModelContext.jsx     # Context model loader
│   ├── LoadModelLines.jsx       # Line geometry loader
│   ├── Playback.jsx             # Time progression manager (useFrame)
│   ├── SimulateAgents.jsx       # AnimationMixer updates + buffer population
│   ├── UserInterface.jsx        # Leva controls panel
│   └── SceneSetting.jsx         # Three.js scene configuration
│
├── modules/                     # Feature modules (pluggable)
│   ├── insights/                # Behavioral insights & detection
│   │   ├── InsightsModule.jsx   # Module entry point
│   │   ├── InsightsCollector.jsx # Detection loop (useEffect)
│   │   ├── DrawInsights.jsx     # 3D visualization of events
│   │   ├── insightsStore.js     # Module-specific state
│   │   ├── core/                # Core detection logic
│   │   │   ├── InsightsStateManager.js  # Event lifecycle manager
│   │   │   ├── RaycastPool.js           # Raycasting optimization
│   │   │   ├── observerTypes.js         # Observer definitions
│   │   │   ├── detectionConfig.js       # Detection thresholds
│   │   │   └── toleranceEngine.js       # Tolerance calculations
│   │   ├── detectors/           # Detection algorithms
│   │   │   ├── movementDetectors.js     # pause, linger, rush, walk
│   │   │   ├── orientationDetectors.js  # scan, focus, look up/down
│   │   │   └── objectDetectors.js       # look-at, inside-object
│   │   ├── components/          # 3D components
│   │   │   ├── ObserverVisualization.jsx   # Observer volume rendering
│   │   │   └── ObserverPlacementHandler.jsx # Interactive placement
│   │   └── ui/                  # UI components
│   │       ├── MainWindow.jsx           # Insights window container
│   │       ├── quality/                 # Quality panels
│   │       │   ├── ObserverQualityPanel.jsx
│   │       │   └── QualityMetric.jsx
│   │       └── aggregates/              # Data aggregation views
│   │
│   ├── heatmap/                 # Heatmap visualization
│   │   ├── HeatmapModule.jsx    # Module entry point
│   │   ├── useHeatmapModel.js   # Model processing hook
│   │   ├── useHeatmapRenderer.js # GPU heatmap rendering
│   │   ├── heatmapShaders.js    # Custom GLSL shaders
│   │   └── heatmapUtils.js      # Utility functions
│   │
│   └── drawing/                 # Agent visualization
│       ├── DrawingModule.jsx    # Module entry point
│       ├── DrawAgentPosition.jsx    # Agent sphere instances
│       ├── DrawAgentVector.jsx      # Look-at arrows
│       ├── DrawAgentsTrail.jsx      # Movement trails
│       └── DrawAgentLookAtPoints.jsx # Look-at points
│
├── services/                    # Business logic (pure functions)
│   ├── agentProcessor.js        # Agent filtering & buffer creation
│   └── agentProcessor.test.js   # Unit tests
│
└── utils/                       # Utility functions
    ├── CircularBuffer.js        # Ring buffer for history
    ├── performance.js           # Performance monitoring
    ├── performanceDebug.js      # Debug logging
    ├── performanceInit.js       # Performance initialization
    └── timeFormat.js            # Time formatting
```

---

## 🔄 Data Flow

### 1. **Data Loading Phase**

```
User loads page
    ↓
LoadGLBData component fetches manifest.json
    ↓
Parallel load of agent GLB files (with animation tracks)
    ↓
LoadModel component loads 3D environment GLB
    ↓
Data stored in AppState.data.raw and AppState.data.model
    ↓
Loading screen displays progress → "OPEN DEMO" button
```

### 2. **Simulation Phase**

```
User clicks Play
    ↓
Playback component (useFrame)
    - Updates AppState.playback.time each frame
    - time += speed * deltaTime
    ↓
SimulateAgents component (useFrame)
    - Updates Three.js AnimationMixers to current time
    - Reads agent positions/lookAt from Three.js nodes
    - Populates positionBuffer and lookAtBuffer (Float32Array)
    - Stores buffers in AppState.simulation
    ↓
Modules read current time + buffers
    - DrawingModule: Renders agents + trails
    - HeatmapModule: Renders GPU-based heatmap
    - InsightsModule: Detects behavioral events
```

### 3. **Detection Phase (InsightsModule)**

```
InsightsCollector (useEffect on currentTime)
    ↓
For each agent:
    - Check position change
    - Calculate velocity, direction
    - Maintain 2-second history (CircularBuffer)
    ↓
For each observer:
    - Detect states (pause, linger, rush, walk, scan, focus, etc.)
    - Track state transitions (start, update, end)
    - Store events in InsightsStateManager
    ↓
DrawInsights component
    - Reads processed events
    - Renders point clouds at event locations
    - Color-coded by event type
    ↓
Quality panels
    - Display metrics per observer (confidence, coverage)
    - Update every 200ms (throttled)
```

---

## 🎯 Core Components

### Playback (`src/components/Playback.jsx`)

- Runs in `useFrame` loop (60fps)
- Advances `AppState.playback.time` based on speed
- Stops at `maxTime - 1.67s` (100 frames before end)
- Handles play/pause/reset states

### SimulateAgents (`src/components/SimulateAgents.jsx`)

- Updates Three.js `AnimationMixer` for each agent
- Reads updated positions from Three.js node transforms
- Populates `Float32Array` buffers for efficient access
- Skips updates when paused (if time unchanged)

### InsightsCollector (`src/modules/insights/InsightsCollector.jsx`)

- Runs detection on `currentTime` change (useEffect)
- Throttled to 33ms simulation time (~30fps sampling)
- When tab hidden: samples every 100ms (reduced frequency)
- Caps deltaTime to 0.5s (handles tab switching)
- Uses CircularBuffer for position/lookAt history
- Detects 12+ behavioral states per agent

---

## 🎨 Feature Modules

### Insights Module

**Purpose:** Detect and visualize behavioral patterns

**Key Features:**
- **Observers:** 3D spatial detection volumes (box/cylinder)
- **State Detection:** pause, linger, rush, walk, scan, focus, look-up, look-down
- **Object Detection:** look-at-object, inside-object
- **Quality Metrics:** Confidence scores, coverage analysis
- **Tolerance Engine:** Dynamic thresholds based on observer context
- **Real-time Updates:** Detects even when browser tab is hidden

**Architecture:**
- Self-contained state (insightsStore)
- Event-driven updates (lastInsightUpdate timestamp)
- Separate detection loop (useEffect)
- 3D visualizations (point clouds)
- Floating quality panels (HTML overlay)

### Heatmap Module

**Purpose:** GPU-accelerated heatmap rendering

**Key Features:**
- Position-based or look-at-based heatmaps
- Real-time GPU computation (custom GLSL shaders)
- Adjustable intensity, radius, transparency
- Accumulates during playback
- Projects onto 3D environment geometry

**Architecture:**
- Custom vertex/fragment shaders
- Render target ping-pong (accumulation)
- Material manipulation via Three.js
- Reads from position/lookAt buffers

### Drawing Module

**Purpose:** Agent visualization and trails

**Key Features:**
- Instanced spheres for agent positions
- Animated arrows for look-at vectors
- Movement trails (fading over time)
- Color-coded by agent/scenario
- Toggle visibility per element

---

## ⚡ Performance Optimizations

### Agent Processing
- **Max 32 agents** (configurable constant)
- **Float32Array buffers** for position/lookAt (efficient memory)
- **Instanced rendering** for agent spheres (single draw call)
- **Spatial culling** in insights (skip distant agents)
- **Movement caching** in insights (reuse calculations if not moved)

### Detection
- **Throttled sampling:** 33ms intervals (not every frame)
- **Batch updates:** Collect state changes, apply once
- **CircularBuffer:** O(1) history operations
- **RaycastPool:** Reuse raycaster instances
- **Tab visibility handling:** Reduced frequency when hidden

### Rendering
- **GPU heatmaps:** All computation on GPU (GLSL)
- **Instanced meshes:** Minimal draw calls
- **Frustum culling:** Three.js automatic
- **LOD models:** Context models at lower detail
- **Device pixel ratio limit:** Max 2x (prevents 4K+ overhead)

---

## 🧪 Testing

- **Framework:** Vitest
- **Coverage:** Agent processing, filtering, buffer creation
- **Location:** `src/services/agentProcessor.test.js`
- **Commands:**
  - `npm test` - Run tests in watch mode
  - `npm run test:ui` - Visual test UI
  - `npm run test:run` - Single run
  - `npm run test:coverage` - Coverage report

---

## 🚀 Getting Started

### Development

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

### Production Build

```bash
npm run build
```

Outputs to `dist/` directory

---

## 📦 Project Structure

All project data (3D models, agent records, and configurations) is now loaded dynamically from Supabase. The application no longer requires local project files in the public directory.

### GLB Agent Data Format

Each agent GLB contains:
- **Position track:** Keyframe animation on a "position" node
- **LookAt track:** Keyframe animation on a "lookAt" node
- **Metadata:** Participant ID, scenario, color (in GLB extras)
- **Preprocessed:** Y/Z swap and 0.01 scale already applied

---

## 🎛️ Configuration

### Feature Flags (`src/App.jsx`)

```javascript
const ENABLE_INSIGHTS_MODULE = true;
const ENABLE_HEATMAP_MODULE = true;
const ENABLE_DRAWING_MODULE = true;
const ENABLE_CONTEXT_MODEL = true;
const ENABLE_METRO_MODEL = false;
```

### Performance Constants (`src/services/agentProcessor.js`)

```javascript
export const MAX_AGENTS = 32;  // Maximum simultaneous agents
```

### Detection Intervals (`src/modules/insights/InsightsCollector.jsx`)

```javascript
const DETECTION_INTERVAL_SIMULATION = 0.033;  // 30fps when visible
const DETECTION_INTERVAL_HIDDEN = 0.1;        // 10fps when tab hidden
```

---

## 🎨 UI Components

### Loading Screen
- Title: "Navigation & Wayfinding Performance Review"
- Subtitle: "Spatial Lens" with animated gradient (blue to pink)
- Loading status at bottom
- "OPEN DEMO" button when ready

### Leva Controls (UserInterface.jsx)
- Play/Pause/Reset buttons
- Time slider
- Speed control (0.5x - 3x)
- Scenario filter dropdown
- Agent filter dropdown
- Heatmap controls
- Module toggles

### Insights Window (MainWindow.jsx)
- Aggregates view (statistics)
- Timeline view (events over time)
- Insights list (detected events)
- Observer configuration
- Tolerance adjustment

---

## 🔍 Key Concepts

### Observers
3D spatial volumes that detect agent behavior within their bounds. Two types:
- **Box:** Rectangular prism (width, height, depth)
- **Cylinder:** Circular with height

### States vs Events
- **State:** Ongoing condition (e.g., "agent is paused")
- **Event:** Completed state with duration (e.g., "pause from 10s to 15s")

### Tolerance Engine
Dynamically adjusts detection thresholds based on:
- Observer volume size
- Agent density
- Environmental complexity

### CircularBuffer
Ring buffer for efficient history management:
- Fixed capacity (120 frames = 2 seconds @ 60fps)
- O(1) push/pop operations
- Automatic old data culling

---

## 🛠️ Development Tips

### Adding a New Module

1. Create directory in `src/modules/yourModule/`
2. Create `YourModule.jsx` entry point
3. Add to `App.jsx` with feature flag
4. Use props for external data (agents, time, buffers)
5. Use separate Zustand store if needed

### Adding a New Detection Type

1. Add detector function in `src/modules/insights/detectors/`
2. Register in `InsightsCollector.jsx`
3. Add event type to `observerTypes.js`
4. Update UI filters in `TimelineFilters.jsx`

### Performance Debugging

Enable performance logging:
```javascript
// src/utils/performanceDebug.js
const ENABLE_LOGGING = true;
```

Check console for frame times and component render counts.

---

## 📄 License

See [LICENSE](LICENSE) file for details.

---

## 🤝 Contributing

This is a research/demonstration platform. For questions or collaboration:
- Review the architecture documentation above
- Check existing issues in the codebase
- Follow the established patterns for state management and module structure

---

**Built with React Three Fiber & Three.js**

*Advancing wayfinding research through immersive 3D visualization*
