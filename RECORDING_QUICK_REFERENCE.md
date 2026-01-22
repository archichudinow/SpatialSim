# Quick Reference: Recording & GLB Export

## Using the Recording Manager Programmatically

```javascript
import recordingManager from '@/utils/RecordingManager';

// Start recording
recordingManager.startRecording({
  participant: 'P1',
  scenario: 'S2',
  color: '#FF5733'
});

// ... your app runs and captures frames ...

// Stop and get data
const recordingData = recordingManager.stopRecording();
console.log(`Recorded ${recordingData.length} frames in ${recordingData.duration}s`);
```

## Exporting to GLB

```javascript
import GLBExporter from '@/utils/GLBExporter';

// Validate recording
const validation = GLBExporter.validateRecording(recordingData);
if (!validation.valid) {
  console.error('Validation errors:', validation.errors);
  return;
}

// Export to GLB
try {
  const glbBlob = await GLBExporter.exportToGLB(recordingData);
  
  // Download file
  GLBExporter.downloadGLB(glbBlob, recordingData.metadata);
  
  // Or send to server
  const formData = new FormData();
  formData.append('glb', glbBlob, `${recordingData.metadata.participant}_${recordingData.metadata.scenario}.glb`);
  await fetch('/api/upload', { method: 'POST', body: formData });
} catch (error) {
  console.error('Export failed:', error);
}
```

## Accessing Recording Status

```javascript
const status = recordingManager.getStatus();

console.log(status.isRecording);      // boolean
console.log(status.frameCount);       // number
console.log(status.duration);         // seconds
console.log(status.metadata);         // { participant, scenario, color }
```

## Integrating with Custom Frame Capture

If you have actual eye tracking data or custom gaze vectors:

```javascript
import recordingManager from '@/utils/RecordingManager';
import * as THREE from 'three';

// In your tracking data handler:
const eyePosition = new THREE.Vector3(x, y, z);      // Eye position
const gazeDirection = new THREE.Vector3(dx, dy, dz); // Gaze direction

// Normalize direction and scale
gazeDirection.normalize();
const gazeTarget = eyePosition.clone().add(gazeDirection.multiplyScalar(distance));

recordingManager.recordFrame(eyePosition, gazeTarget);
```

## Metadata Template

Participant colors follow existing convention:
```javascript
const PARTICIPANT_COLORS = {
  'P1': '#FF5733',   // Red/Orange
  'P2': '#33FF57',   // Green
  'P3': '#3357FF',   // Blue
  'P4': '#FF33F5',   // Magenta
  'P5': '#F5FF33',   // Yellow
  'P6': '#33FFF5',   // Cyan
  'P7': '#FF8C33',   // Orange
  'P8': '#8C33FF',   // Purple
  'P9': '#33FF8C',   // Light Green
  'P10': '#FF3333'   // Red
};
```

## Exported GLB Structure

```
Scene: "{PARTICIPANT}_{SCENARIO}"
├── Node 0: "position"
│   └── Animation: position.translation (TIME → VEC3)
├── Node 1: "lookAt"
│   └── Animation: lookAt.translation (TIME → VEC3)
└── Node 2: Metadata (extras = { scenario, participant, color, length })

Animation Clip: "AgentMotion"
├── Track 0: Sampler(Time) → position.translation [LINEAR]
└── Track 1: Sampler(Time) → lookAt.translation [LINEAR]
```

## Common Scenarios

### Recording Session in VR
```javascript
// User starts recording in VR
// FrameCapture component runs automatically in render loop
// Camera position = eye position
// LookAt direction from controller/head rotation
recordingManager.recordFrame(camera.position, gazeTarget);
```

### Loading Existing GLB
```javascript
const loader = new GLTFLoader();
loader.load('P1_S2.glb', (gltf) => {
  // Get metadata
  const metadata = gltf.scene.children[2].userData;
  
  // Get animation
  const mixer = new THREE.AnimationMixer(gltf.scene);
  const animation = gltf.animations[0]; // "AgentMotion"
  
  // Play recording
  mixer.clipAction(animation).play();
});
```

### Comparing Recordings
```javascript
// Export as JSON for analysis
const json1 = recordingManager.exportJSON();

// Analyze frame data
const avgX = json1.frames.reduce((sum, f) => sum + f.position.x, 0) / json1.frames.length;
const avgY = json1.frames.reduce((sum, f) => sum + f.position.y, 0) / json1.frames.length;
const avgZ = json1.frames.reduce((sum, f) => sum + f.position.z, 0) / json1.frames.length;

console.log(`Average gaze origin: [${avgX}, ${avgY}, ${avgZ}]`);
```

## Error Handling

```javascript
try {
  recordingManager.startRecording(metadata);
  // ... recording runs ...
  const data = recordingManager.stopRecording();
  
  if (!data) {
    console.warn('No data recorded');
    return;
  }
  
  const glb = await GLBExporter.exportToGLB(data);
  GLBExporter.downloadGLB(glb, data.metadata);
} catch (error) {
  console.error('Recording pipeline error:', error.message);
}
```

## Performance Tips

1. **Frame Rate**: Recording runs at display refresh rate (60+ Hz recommended)
2. **Memory**: Each frame uses ~50 bytes, so 10 min @ 60fps ≈ 1.8 MB RAM
3. **Export Time**: GLB export typically takes 0.5-2 seconds depending on frame count
4. **File Size**: Typical GLB files are 200-500 KB (gzip-friendly)

## Debugging

```javascript
// Check recording state
console.log(recordingManager.getStatus());

// Export as JSON for inspection
const json = recordingManager.exportJSON();
console.log('Frames:', json.frames.length);
console.log('Duration:', json.frames[json.frames.length - 1].time);
console.log('First frame:', json.frames[0]);
console.log('Last frame:', json.frames[json.frames.length - 1]);

// Validate before export
const validation = GLBExporter.validateRecording(json);
if (!validation.valid) {
  validation.errors.forEach(err => console.error('- ' + err));
}
```
