# Recording & GLB Export Pipeline - Implementation Guide

## Overview
A complete recording system has been implemented for capturing VR gaze tracking data and exporting it as GLB files matching the existing data format.

## Components Created

### 1. RecordingManager (`src/utils/RecordingManager.js`)
**Purpose**: Captures position and lookAt data in real-time during a recording session

**Key Methods**:
- `startRecording(metadata)` - Begin recording with participant/scenario/color info
- `recordFrame(position, lookAt)` - Add a frame to the recording (called every frame)
- `stopRecording()` - End recording and return captured data
- `getStatus()` - Get current recording state
- `clear()` - Reset recording buffer
- `exportJSON()` - Get raw frame data for export

**Data Structure**:
```javascript
{
  metadata: {
    participant: "P1",
    scenario: "S1",
    color: "#FF5733"
  },
  frames: [
    {
      time: 0.016,
      position: { x, y, z },
      lookAt: { x, y, z }
    },
    // ... more frames
  ],
  length: 5302,
  duration: 85.4
}
```

### 2. GLBExporter (`src/utils/GLBExporter.js`)
**Purpose**: Converts recorded frame data to GLB format matching existing file structure

**Key Methods**:
- `exportToGLB(recordingData)` - Convert recording to GLB (returns Blob)
- `downloadGLB(glbBlob, metadata)` - Save GLB file to disk
- `validateRecording(recordingData)` - Check data integrity before export

**Output Format**:
- Scene structure with "position" and "lookAt" nodes
- Metadata stored in node extras (participant, scenario, color, length)
- Animation clip named "AgentMotion" with 2 tracks:
  - Sampler 0: Time → Position (LINEAR interpolation)
  - Sampler 1: Time → LookAt (LINEAR interpolation)

### 3. Recording UI Component (`src/components/Recording.jsx`)
**Purpose**: User interface for recording control and metadata configuration

**Features**:
- Start/Stop recording buttons
- Metadata configuration (participant, scenario, color)
- Real-time stats (frames, duration)
- GLB export with validation
- Status feedback
- Responsive design for desktop and mobile

**Controls**:
- 🔴 **Start Recording** - Begin capturing position/lookAt data
- ⏹️ **Stop Recording** - End recording session
- 📥 **Export GLB** - Convert and download as GLB file
- 🗑️ **Clear** - Reset recording buffer
- ⚙️ **Settings** - Configure participant/scenario/color

### 4. FrameCapture Hook (in `src/components/Scene.jsx`)
**Purpose**: Captures camera position and gaze direction every frame during recording

**How it works**:
```javascript
// Position = Camera position (gaze origin)
const position = camera.position.clone();

// LookAt = Point 10 units ahead of camera in look direction (gaze focus)
const direction = new THREE.Vector3(0, 0, -1)
  .applyQuaternion(camera.quaternion);
const lookAt = position.clone()
  .add(direction.multiplyScalar(10));

recordingManager.recordFrame(position, lookAt);
```

## Usage Workflow

### Step 1: Configure Settings
1. Click the ⚙️ settings button on the Recording panel
2. Select participant (P1-P10)
3. Select scenario (S1, S1A, S1B, S2, S3, S4)
4. Choose color (10 preset colors matching existing participants)

### Step 2: Record Data
1. Click 🔴 **Start Recording**
2. Move around the scene and look at different points
3. Watch the frame count and duration update in real-time
4. Click ⏹️ **Stop Recording** when done

### Step 3: Export to GLB
1. Click 📥 **Export GLB**
2. System validates recording:
   - Minimum 100 frames recommended
   - Valid metadata (participant, scenario, color)
   - Non-null coordinate data
3. If valid: GLB file downloads automatically
4. Filename format: `{PARTICIPANT}_{SCENARIO}.glb` (e.g., `P1_S1.glb`)

## File Structure

```
src/
├── components/
│   ├── Recording.jsx          # Recording UI component
│   ├── Recording.css          # Styling for Recording UI
│   └── Scene.jsx              # Updated with FrameCapture & Recording integration
├── utils/
│   ├── RecordingManager.js    # Recording state & frame capture
│   └── GLBExporter.js         # GLB export functionality
```

## Integration with Existing System

The recording system integrates seamlessly with existing code:

1. **Recording UI** appears in the same layer as FPS counter and Enter VR button
2. **FrameCapture** runs in the Three.js render loop (useFrame hook)
3. **RecordingManager** uses singleton pattern for easy access across components
4. **GLB Export** uses Three.js GLTFExporter for standards compliance

## Compatibility

### With Existing GLB Files
- Same coordinate system (pre-transformed XYZ)
- Same animation structure (position + lookAt tracks)
- Same metadata format (stored in node.extras)
- Compatible with existing Three.js loader

### Export & Import
```javascript
// Export recorded data
const glbBlob = await GLBExporter.exportToGLB(recordingData);

// Import exported GLB (same as existing files)
const loader = new GLTFLoader();
loader.load('P1_S1.glb', (gltf) => {
  const metadata = gltf.scene.children[2].userData;
  const animation = gltf.animations[0];
  // ... use as normal
});
```

## Validation Rules

Before export, recordings are validated:
- ✅ Minimum 100 frames (warning if less)
- ✅ Valid participant ID (required)
- ✅ Valid scenario (required)
- ✅ Valid color hex (required)
- ✅ All frames have position and lookAt data

## Technical Details

### Frame Capture Timing
- Captures every render frame (synced with display)
- Timestamps stored relative to recording start
- Variable frame rate preserved (matches original data)

### Export Format
- Uses Three.js GLTFExporter for GLB generation
- Binary format for efficient file size
- Gzip-friendly (typical file: 200-500 KB)

### Position & LookAt
- **Position**: Camera position (eye position / gaze origin)
- **LookAt**: Point 10 units ahead in camera direction (gaze focus)
- Both coordinates in Three.js world space
- Can be adjusted based on actual gaze tracking data

## Future Enhancements

Potential improvements for future iterations:
1. **Actual Eye Tracking**: Replace camera direction with real VR eye tracking data
2. **Raycasting**: Hit detection on scene objects to track visual targets
3. **Multi-Track Recording**: Capture hand position, controller data, etc.
4. **Playback Controls**: Play exported GLB with animation preview
5. **Batch Export**: Export multiple recordings at once
6. **Cloud Storage**: Save recordings to cloud service
7. **Data Visualization**: Show gaze path visualization during playback
8. **Frame Interpolation**: Adjust frame rate/interpolation settings

## Testing Checklist

- [x] RecordingManager captures frames correctly
- [x] Frame counts increment during recording
- [x] Duration timer updates smoothly
- [x] Metadata configuration persists
- [x] GLB export generates valid files
- [x] Exported GLB matches existing file structure
- [x] Download works with correct filename
- [x] UI is responsive and user-friendly
- [x] Build succeeds without errors
