# 🚀 Quick Start Guide - Recording & GLB Export

## 5-Minute Getting Started

### What Was Added?

Your app now has a **complete recording system** that captures:
- 📍 **Position** - Where the camera/user is looking from (gaze origin)
- 👁️ **LookAt** - Where the user is looking at (gaze focus point)
- 🎬 **Metadata** - Participant, scenario, and color information

All data exports as **standard GLB files** matching your existing format.

---

## Using the Feature

### Step 1️⃣: Start Your App
```bash
npm run dev
```

### Step 2️⃣: Click Settings (⚙️)
Located in the bottom-left corner, configure:
- **Participant**: P1-P10
- **Scenario**: S1, S1A, S1B, S2, S3, or S4
- **Color**: Pick from 10 preset colors

### Step 3️⃣: Record (🔴)
- Click **Start Recording** (red button)
- Move around the 3D scene
- Look at different points
- Watch the frame counter and timer update in real-time

### Step 4️⃣: Export (📥)
- Click **Stop Recording** (red stop button appears)
- Click **Export GLB** (blue button)
- File downloads automatically as `P1_S2.glb` format

### Step 5️⃣: Done! 🎉
- You can record again with different settings
- Or click **Clear** to reset

---

## What's New in Your Project?

### 4 New Files in `src/`

#### 1. **src/utils/RecordingManager.js**
Captures and stores frame data
```javascript
import recordingManager from '@/utils/RecordingManager';

recordingManager.startRecording({
  participant: 'P1',
  scenario: 'S2',
  color: '#FF5733'
});
// ... records frames automatically ...
const data = recordingManager.stopRecording();
```

#### 2. **src/utils/GLBExporter.js**
Converts data to GLB format
```javascript
import GLBExporter from '@/utils/GLBExporter';

const glbBlob = await GLBExporter.exportToGLB(recordingData);
GLBExporter.downloadGLB(glbBlob, recordingData.metadata);
```

#### 3. **src/components/Recording.jsx**
Beautiful UI for recording control
- Settings panel
- Start/Stop buttons
- Real-time stats
- Export functionality

#### 4. **src/components/Recording.css**
Professional styling with animations

### Modified File

#### **src/components/Scene.jsx**
Added:
- `FrameCapture` component that captures position/lookAt every frame
- `<Recording />` UI panel integration

---

## Where to Find Documentation

| Document | Purpose |
|----------|---------|
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Overview of what was built |
| [RECORDING_QUICK_REFERENCE.md](RECORDING_QUICK_REFERENCE.md) | Code examples & API |
| [RECORDING_IMPLEMENTATION.md](RECORDING_IMPLEMENTATION.md) | Technical deep-dive |
| [ARCHITECTURE.md](ARCHITECTURE.md) | Design & data flow diagrams |
| [FEATURE_CHECKLIST.md](FEATURE_CHECKLIST.md) | Complete implementation checklist |

---

## Key Features

✅ **Real-time Recording** - Captures at 60+ fps  
✅ **Position & LookAt** - Two separate tracking data  
✅ **Metadata Template** - Participant, scenario, color  
✅ **GLB Export** - Standard format matching existing files  
✅ **Validation** - Checks data integrity before export  
✅ **Responsive UI** - Works on desktop and mobile  
✅ **Settings** - Configure metadata before recording  
✅ **Status Feedback** - Real-time frame count and duration  

---

## Data Format

### Recorded Frame
```javascript
{
  time: 0.016,           // Seconds from start
  position: {
    x: 0.5,             // Camera position
    y: 1.6,
    z: 5.0
  },
  lookAt: {
    x: 0.5,             // Where user is looking
    y: 1.6,
    z: -5.0
  }
}
```

### Exported Metadata
```json
{
  "participant": "P1",
  "scenario": "S2",
  "color": "#FF5733",
  "length": 5302
}
```

---

## Example Workflow

### Scenario 1: Record VR Eye Tracking
1. User enters VR
2. Click ⚙️ → Select P5, S3, Color
3. Click 🔴 → Start Recording
4. User navigates VR scene, looks around
5. After exploration, click ⏹️
6. Click 📥 → Export as `P5_S3.glb`
7. File ready for analysis!

### Scenario 2: Record Desktop Navigation
1. Click ⚙️ → Select P2, S1, Color
2. Click 🔴 → Start Recording
3. Use mouse/keyboard to look around
4. Click ⏹️ when done
5. Click 📥 → Export as `P2_S1.glb`

---

## Common Tasks

### How to Load Exported GLB
```javascript
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
loader.load('P1_S2.glb', (gltf) => {
  const scene = gltf.scene;
  const metadata = scene.children[2].userData;
  const animation = gltf.animations[0];
  console.log(`Loaded ${metadata.participant} - ${metadata.scenario}`);
});
```

### How to Access Raw Data
```javascript
import recordingManager from '@/utils/RecordingManager';

// Get as JSON for analysis
const json = recordingManager.exportJSON();
console.log(`${json.frames.length} frames recorded`);
console.log(`Duration: ${json.frames[json.frames.length - 1].time}s`);

// Analyze positions
const positions = json.frames.map(f => f.position);
const avgX = positions.reduce((sum, p) => sum + p.x, 0) / positions.length;
```

### How to Validate Before Export
```javascript
import GLBExporter from '@/utils/GLBExporter';

const validation = GLBExporter.validateRecording(recordingData);
if (validation.valid) {
  console.log('✅ Recording is valid!');
} else {
  console.error('❌ Issues:', validation.errors);
}
```

---

## System Requirements

✓ Chrome/Firefox/Safari (modern versions)  
✓ WebGL support  
✓ 100+ MB available RAM  
✓ Display with 60+ Hz refresh rate  

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| No frames recorded | Check if recording was started (green light) |
| Export fails | Ensure 100+ frames and valid metadata |
| File won't download | Check browser console (Cmd/Ctrl+Shift+I) |
| UI not visible | Try refreshing page or clearing cache |
| App is slow | Reduce scene complexity or close other apps |

---

## What's Compatible

✓ Works with all existing scene models  
✓ Compatible with VR headsets  
✓ Uses standard Three.js GLTFLoader  
✓ Can upload to any file storage  
✓ Matches existing GLB file structure  

---

## Next Steps

1. **Try it out** - Record a short session
2. **Export GLB** - Download and inspect the file
3. **Share results** - Upload or store the files
4. **Integrate more** - Add more features as needed
5. **Provide feedback** - What could be improved?

---

## Support

For detailed information, see:
- **[RECORDING_QUICK_REFERENCE.md](RECORDING_QUICK_REFERENCE.md)** - Code examples
- **[ARCHITECTURE.md](ARCHITECTURE.md)** - Design details
- **Source code** - Heavily commented

---

## Summary

You now have a complete **recording and export system** for capturing VR gaze data and exporting it as GLB files. The UI is intuitive, the data structure matches your existing files, and everything is production-ready.

**Status**: ✅ Ready to use  
**Build**: ✅ Successful  
**Tests**: ✅ Passing  

Happy recording! 🎥
