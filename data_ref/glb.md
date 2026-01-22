# GLB File Structure Documentation

## Overview
These GLB files contain VR gaze tracking animation data exported from CSV recordings. Each file represents one participant's session with position and lookAt (gaze focus) tracks.

## File Naming Convention
- Format: `P{participant}_{scenario}.glb`
- Examples: `P1_S2.glb`, `P3_S1A.glb`, `P10_S4.glb`
- Participants: P1-P10
- Scenarios: S1A, S1B, S2, S3, S4

## GLB Structure

### 1. Scene Hierarchy
```
Root Node (agent_id: "P{N}_{S}")
├── Node 0: "position" (gaze_origin)
└── Node 1: "lookAt" (gaze_focus_origin)
```

### 2. Metadata (Root Node Extras)
Located in `gltf.nodes[2].extras`:
```json
{
  "scenario": "S2",
  "participant": "P1",
  "color": "#FF5733",
  "length": 5302
}
```

**Participant Colors:**
- P1: #FF5733, P2: #33FF57, P3: #3357FF, P4: #FF33F5, P5: #F5FF33
- P6: #33FFF5, P7: #FF8C33, P8: #8C33FF, P9: #33FF8C, P10: #FF3333

### 3. Buffer Layout
Single binary buffer with three sequential sections:

```
[Time Data] [Position Data] [LookAt Data]
```

#### Buffer Views (3 total):
- **BufferView 0**: Time keyframes (SCALAR, FLOAT)
  - Offset: 0
  - Type: Relative time in seconds from recording start
  - Size: `n_frames * 4 bytes`

- **BufferView 1**: Position track (VEC3, FLOAT)
  - Offset: After time data
  - Type: XYZ coordinates of gaze origin
  - Size: `n_frames * 12 bytes` (3 floats per frame)

- **BufferView 2**: LookAt track (VEC3, FLOAT)
  - Offset: After position data
  - Type: XYZ coordinates of gaze focus point
  - Size: `n_frames * 12 bytes`

### 4. Accessors (3 total)
- **Accessor 0**: Time input (SCALAR)
  - bufferView: 0
  - count: n_frames
  - min/max: Duration bounds in seconds

- **Accessor 1**: Position output (VEC3)
  - bufferView: 1
  - count: n_frames
  - min/max: Spatial bounds of gaze origin

- **Accessor 2**: LookAt output (VEC3)
  - bufferView: 2
  - count: n_frames
  - min/max: Spatial bounds of gaze focus

### 5. Animation Structure
Single animation: `"AgentMotion"`

**Samplers (2):**
- Sampler 0: Time (accessor 0) → Position (accessor 1), LINEAR interpolation
- Sampler 1: Time (accessor 0) → LookAt (accessor 2), LINEAR interpolation

**Channels (2):**
- Channel 0: Sampler 0 → Node 0 (`position`) → `translation` path
- Channel 1: Sampler 1 → Node 1 (`lookAt`) → `translation` path

## Coordinate System

### Original CSV Format
- Columns: `gaze_origin`, `gaze_focus_origin`
- Format: String `"X=1.234 Y=5.678 Z=9.012"`

### Transformations Applied (Baked into GLB)
1. **Parse XYZ** from string format
2. **Axis Swap**: Y ↔ Z (for Three.js compatibility)
   - GLB_X = CSV_X
   - GLB_Y = CSV_Z
   - GLB_Z = CSV_Y
3. **Scale**: Multiply all coordinates by 0.01 (world scale factor)

### Final GLB Coordinates
```
position[X] = gaze_origin_X * 0.01
position[Y] = gaze_origin_Z * 0.01  ← SWAPPED
position[Z] = gaze_origin_Y * 0.01  ← SWAPPED

lookAt[X] = gaze_focus_origin_X * 0.01
lookAt[Y] = gaze_focus_origin_Z * 0.01  ← SWAPPED
lookAt[Z] = gaze_focus_origin_Y * 0.01  ← SWAPPED
```

**Important**: These transformations are pre-applied. No runtime transformation needed in Three.js.

## Timing Information

### Time Construction
Original CSV has separate columns:
- `time_unix`: Unix timestamp in seconds
- `time_milisecond`: Millisecond component (0-999)

Full timestamp: `time_unix * 1000 + time_milisecond` (in milliseconds)

### GLB Time Track
- **Relative time**: Converted to seconds from recording start
- **Variable frame rate**: Original intervals preserved (typically 17-20ms)
- **No interpolation needed**: Use LINEAR interpolation as specified in sampler

### Typical Durations
- Range: 143-541 seconds (2.4-9 minutes)
- Frame counts: 5,302-19,566 frames
- Frame rate: ~17-20ms intervals (not constant)

## Reading GLB Data

### Python Example (pygltflib)
```python
from pygltflib import GLTF2
import numpy as np

# Load GLB
gltf = GLTF2.load('P1_S2.glb')

# Get metadata
root_node = gltf.nodes[2]
metadata = root_node.extras
print(f"Participant: {metadata['participant']}")
print(f"Scenario: {metadata['scenario']}")
print(f"Frame count: {metadata['length']}")

# Get binary data
blob = gltf.binary_blob()

# Parse time data
time_accessor = gltf.accessors[0]
n_frames = time_accessor.count
time_offset = gltf.bufferViews[0].byteOffset
time_bytes = blob[time_offset:time_offset + n_frames * 4]
times = np.frombuffer(time_bytes, dtype=np.float32)

# Parse position data
position_offset = gltf.bufferViews[1].byteOffset
position_bytes = blob[position_offset:position_offset + n_frames * 12]
positions = np.frombuffer(position_bytes, dtype=np.float32).reshape(n_frames, 3)

# Parse lookAt data
lookat_offset = gltf.bufferViews[2].byteOffset
lookat_bytes = blob[lookat_offset:lookat_offset + n_frames * 12]
lookats = np.frombuffer(lookat_bytes, dtype=np.float32).reshape(n_frames, 3)
```

### JavaScript/Three.js Example
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('P1_S2.glb', (gltf) => {
  const scene = gltf.scene;
  const rootNode = scene.children[0];
  
  // Access metadata
  const metadata = rootNode.userData;
  console.log(`Participant: ${metadata.participant}`);
  console.log(`Scenario: ${metadata.scenario}`);
  console.log(`Color: ${metadata.color}`);
  console.log(`Frames: ${metadata.length}`);
  
  // Get animation
  const animation = gltf.animations[0]; // "AgentMotion"
  const mixer = new THREE.AnimationMixer(scene);
  const action = mixer.clipAction(animation);
  
  // Play animation
  action.play();
  
  // In render loop
  function animate(time) {
    mixer.update(deltaTime);
    
    // Access current positions
    const positionNode = scene.getObjectByName('position');
    const lookAtNode = scene.getObjectByName('lookAt');
    
    const currentPosition = positionNode.position;
    const currentLookAt = lookAtNode.position;
    
    // Use for agent visualization
    agent.position.copy(currentPosition);
    agent.lookAt(currentLookAt);
  }
});
```

## Data Validation

Files are validated to ensure:
- ✅ Minimum 100 frames
- ✅ No empty datasets
- ✅ Valid coordinate data (>50% non-null values)
- ✅ Valid timestamps (no all-null time columns)
- ✅ No duplicate timestamps (removed during processing)

## Output Manifest
`manifest.json` contains sorted list of all generated GLB files:
```json
[
  "P1_S2.glb",
  "P1_S4.glb",
  "P2_S1A.glb",
  ...
]
```

## Notes for Other Agents

1. **Coordinate system is pre-transformed**: Y/Z swap and 0.01 scale already applied
2. **Use LINEAR interpolation**: Specified in animation samplers
3. **Time is relative**: Starts at 0.0 for each recording
4. **Frame rate varies**: Use actual time values, not frame numbers
5. **Metadata access**: Check `node.extras` (Python) or `node.userData` (Three.js)
6. **Two tracks**: Separate position and lookAt for smooth gaze representation

## Source Data
- Original CSVs: `/workspaces/uns_utx_data/VRCollectedData/P{N}/S{X}/P{N}_S{X}_MAIN.csv`
- Processing notebook: `create_threejs_glb_data_utx.ipynb`
- Output directory: `/workspaces/uns_utx_data/participantsGLB_UTX/`
