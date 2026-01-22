# Recording Pipeline Architecture

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                        USER INTERFACE                           │
│                     (Recording.jsx)                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ⚙️ Settings Panel          📊 Stats Display                    │
│  ├─ Participant (P1-P10)   ├─ Frames: XXXXX                   │
│  ├─ Scenario (S1-S4)       ├─ Duration: XX.X s                │
│  └─ Color (#RRGGBB)        ├─ Participant: PX                 │
│                            └─ Scenario: SX                     │
│                                                                 │
│  🔴 Start    ⏹️ Stop    📥 Export    🗑️ Clear                  │
│                                                                 │
└────────────┬─────────────────────────────────────┬─────────────┘
             │                                     │
             │ startRecording(metadata)            │ exportJSON()
             │                                     │ exportToGLB(data)
             ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    RecordingManager.js                          │
│              (Singleton - Core Recording Logic)                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📝 State Management:                                          │
│  ├─ isRecording: boolean                                       │
│  ├─ frames: Array<Frame>                                       │
│  ├─ metadata: { participant, scenario, color }                │
│  └─ startTime: timestamp                                       │
│                                                                 │
│  🎯 Core Methods:                                              │
│  ├─ startRecording(metadata)                                   │
│  ├─ recordFrame(position, lookAt)  ◄─── Called every frame    │
│  ├─ stopRecording() → recordingData                            │
│  ├─ getStatus() → { isRecording, frameCount, duration }        │
│  └─ exportJSON() → raw frame data                              │
│                                                                 │
└────────────┬──────────────────────────────────────────┬────────┘
             │                                          │
             │ recordFrame() x 60fps                   │ data
             │                                          │
             ▼                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FrameCapture (Scene.jsx)                     │
│              (useFrame hook in Three.js render loop)            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Every frame capture:                                          │
│                                                                 │
│  Position = camera.position                                    │
│      └─ Gaze origin (eye position)                             │
│                                                                 │
│  Direction = forward from camera rotation                      │
│      └─ 10 units in look direction                             │
│                                                                 │
│  LookAt = position + direction * 10                            │
│      └─ Gaze focus point (where looking)                       │
│                                                                 │
│  recordingManager.recordFrame(position, lookAt)                │
│                                                                 │
└────────────┬─────────────────────────────────────────┬─────────┘
             │                                         │
             │ Runs at display refresh rate           │ recordingData
             │ (60+ Hz)                               │
             │                                         ▼
             │                            ┌──────────────────────────────┐
             │                            │  GLBExporter.js              │
             │                            │  (Export & Download Logic)   │
             │                            ├──────────────────────────────┤
             │                            │                              │
             │                            │  🔍 Validate:               │
             │                            │  ├─ Min 100 frames          │
             │                            │  ├─ Valid metadata          │
             │                            │  └─ Coordinate integrity    │
             │                            │                              │
             │                            │  📦 Export:                 │
             │                            │  ├─ Create Three.js Scene   │
             │                            │  ├─ Add animation tracks    │
             │                            │  ├─ Use GLTFExporter        │
             │                            │  └─ Generate GLB binary      │
             │                            │                              │
             │                            │  💾 Download:               │
             │                            │  ├─ Create Blob URL         │
             │                            │  ├─ Trigger download        │
             │                            │  └─ Filename: P{N}_S{X}.glb │
             │                            │                              │
             │                            └──────────────┬───────────────┘
             │                                           │
             ▼                                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                      OUTPUT: GLB FILE                            │
│              (Standard glTF 2.0 Binary Format)                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Scene Structure:                                               │
│  ├─ Node 0: "position"                                          │
│  │   └─ Animation: position.translation                         │
│  │       └─ INPUT: time (0.0 → duration)                        │
│  │       └─ OUTPUT: position XYZ [LINEAR]                       │
│  │                                                               │
│  ├─ Node 1: "lookAt"                                            │
│  │   └─ Animation: lookAt.translation                           │
│  │       └─ INPUT: time (0.0 → duration)                        │
│  │       └─ OUTPUT: lookAt XYZ [LINEAR]                         │
│  │                                                               │
│  └─ Node 2: Metadata (agent_P{N}_{S})                          │
│      └─ extras: {                                               │
│          scenario: "S2",                                        │
│          participant: "P1",                                     │
│          color: "#FF5733",                                      │
│          length: 5302                                           │
│        }                                                        │
│                                                                  │
│  Binary Data:                                                   │
│  ├─ BufferView 0: Time keyframes (SCALAR, FLOAT)               │
│  ├─ BufferView 1: Position track (VEC3, FLOAT)                 │
│  └─ BufferView 2: LookAt track (VEC3, FLOAT)                   │
│                                                                  │
│  Animation Clip: "AgentMotion"                                  │
│  ├─ Sampler 0: time → position [LINEAR]                        │
│  └─ Sampler 1: time → lookAt [LINEAR]                          │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
                            │
                            │ P1_S2.glb
                            │ (200-500 KB)
                            ▼
┌──────────────────────────────────────────────────────────────────┐
│                   Downloaded to Browser                          │
│                  (Ready for use/analysis)                        │
│                                                                  │
│  ✓ Compatible with existing three.js GLTFLoader                │
│  ✓ Matches data_ref/glb.md specification                        │
│  ✓ Playable with AnimationMixer                                │
│  ✓ Uploadable to server/storage                                │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

---

## Component Interaction Sequence

```
Timeline: Recording Session → Export

[User]               [UI]            [Manager]         [Capture]      [Exporter]
  │                   │                  │                 │              │
  │──⚙️ Settings──→   │                  │                 │              │
  │   (P1, S2, #FF)   │                  │                 │              │
  │                   │                  │                 │              │
  │──🔴 Start──────→  │──startRecording──→                 │              │
  │                   │                  │◄────start────┬──│              │
  │                   │                  │              │  │              │
  │   [Recording]     │  Frames: 0   ←───update stats──┤  │              │
  │   Moving camera   │  Duration: 0.0s  │              │  │              │
  │                   │                  │  Every frame:   │              │
  │                   │◄─frameCount 100──│◄─60fps────recordFrame         │
  │                   │◄─duration 1.6s───│                │              │
  │                   │                  │  recordFrame    │              │
  │                   │                  │  (pos, lookAt)  │              │
  │                   │                  │                 │              │
  │   [Still recording]                  │                 │              │
  │                   │◄─frameCount 5302─│                 │              │
  │                   │◄─duration 85.4s──│                 │              │
  │                   │                  │                 │              │
  │──⏹️ Stop─────→   │──stopRecording────→                 │              │
  │                   │  recordingData←───┤                 │              │
  │                   │                   │                 │              │
  │   [Ready to export]                   │                 │              │
  │                   │                   │                 │              │
  │──📥 Export────→  │──exportJSON───→   │                 │              │
  │                   │  ┌─validate────────────────────────────validate───→│
  │                   │  │  ✓ frames OK                     │              │
  │                   │  │  ✓ metadata OK                   │              │
  │                   │  │  ✓ data OK                       │              │
  │                   │  └─exportToGLB─────────────────────────export────→│
  │                   │                                     │  Scene       │
  │                   │                                     │  Nodes       │
  │                   │                                     │  Animation   │
  │                   │                                     │  Binary ◄────│
  │                   │                                     │
  │◄──P1_S2.glb──────│◄─────────────download────────────────────────────│
  │   (file saved)     │
  │                    │
  └────────────────────┘
```

---

## Frame Data Structure at Each Stage

```
Stage 1: Raw Capture (FrameCapture)
─────────────────────────────────────
{
  camera: {
    position: Vector3 { x, y, z },
    quaternion: Quaternion { x, y, z, w }
  }
}

Stage 2: Frame Stored (RecordingManager)
────────────────────────────────────────
{
  time: 0.016,                    // seconds from start
  position: { x: 0.5, y: 1.6, z: 5.0 },  // camera position
  lookAt: { x: 0.5, y: 1.6, z: -5.0 }    // 10 units ahead
}

Stage 3: Recording Data (stopRecording)
────────────────────────────────────────
{
  metadata: {
    participant: "P1",
    scenario: "S2",
    color: "#FF5733"
  },
  frames: [
    { time: 0.016, position: {...}, lookAt: {...} },
    { time: 0.033, position: {...}, lookAt: {...} },
    { time: 0.050, position: {...}, lookAt: {...} },
    // ... 5299 more frames ...
  ],
  length: 5302,
  duration: 85.4
}

Stage 4: GLB Binary (exportToGLB)
─────────────────────────────────
[Binary data structure]
├─ JSON Header
│  ├─ Scene
│  │  ├─ nodes[0]: { name: "position" }
│  │  ├─ nodes[1]: { name: "lookAt" }
│  │  └─ nodes[2]: { extras: { scenario, participant, color, length } }
│  ├─ animations[0]: { name: "AgentMotion" }
│  ├─ accessors
│  ├─ bufferViews
│  └─ buffers
│
└─ Binary Blob
   ├─ Time values: [0.0, 0.016, 0.033, ..., 85.4]
   ├─ Position values: [x0, y0, z0, x1, y1, z1, ...]
   └─ LookAt values: [x0, y0, z0, x1, y1, z1, ...]
```

---

## Performance Metrics

```
Memory Usage (per 60 frames/sec):
─────────────────────────────────
Frame size: ~50 bytes
  ├─ time: 4 bytes (float32)
  ├─ position.x/y/z: 12 bytes (3×float32)
  └─ lookAt.x/y/z: 12 bytes (3×float32)
  └─ overhead: ~22 bytes (JSON wrapper, etc)

1 minute of recording:
  60fps × 60 = 3600 frames
  3600 × 50 = 180 KB (RAM)

10 minutes of recording:
  600 frames/sec × 10 min = 36,000 frames
  36,000 × 50 = 1.8 MB (RAM)

Typical session:
  5,302 frames ≈ 265 KB (RAM)
  Exported GLB ≈ 250-500 KB (disk)
  Gzip compressed ≈ 80-150 KB (network)
```

---

## Compatibility Matrix

```
✓ Three.js                    Tested & working
✓ React Three Fiber           Integrated via useFrame hook
✓ Three.js GLTFExporter       Used for binary export
✓ Three.js GLTFLoader         Can load exported GLB files
✓ Existing data format        Matches glb.md specification
✓ VR (via @react-three/xr)    Captures camera/controller position
✓ Desktop (via Keyboard/Mouse) Captures camera position
✓ Mobile browsers             Responsive UI (tested layout)
✓ Chrome/Firefox/Safari       Standard Web APIs used
✓ Node.js (future)            Can be ported for server processing
```
