# VR Spatial Scene Project Plan

## Project Overview
A WebXR-enabled VR application built with React, Vite, and React Three Fiber (r3f) that allows users to explore a 3D scene from both desktop (PC) and VR headsets (Oculus 2 via Browser).

---

## Phase 1: Project Setup

### 1.1 Initialize Vite + React Project
- [ ] Create React Vite project (JavaScript, no TypeScript)
- [ ] Install core dependencies:
  - `react`, `react-dom`
  - `three` (3D library)
  - `@react-three/fiber` (React renderer for Three.js)
  - `@react-three/drei` (utility library for r3f)
  - `@react-three/xr` (WebXR support for r3f)

### 1.2 Install WebXR & VR Dependencies
- [ ] `@react-three/xr` - WebXR integration
- [ ] `@react-three/rapier` - Physics (optional, for future collision detection)
- [ ] `three-draco` - Draco compression support
- [ ] `leva` - Debug UI for testing (optional)

### 1.3 Configure Vite
- [ ] Set up dev server with appropriate CORS headers for WebXR
- [ ] Configure build output for Vercel deployment
- [ ] Add environment variables if needed

---

## Phase 2: Scene Architecture

### 2.1 Core Scene Components
- [ ] **Canvas Component** - Main R3F canvas wrapper
- [ ] **Lighting Setup**
  - Direct light (sun-like illumination)
  - Ambient light (global illumination base)
  - Configure shadow mapping for depth
- [ ] **Environment Setup**
  - Ground plane (infinite or large plane as walking surface)
  - Sky background (color or HDR environment map)

### 2.2 3D Model Loading
- [ ] **Model Loader Component**
  - Load "map_mid_compressed.glb" using `useGLTF`
  - Ensure Draco decompression works (`useGLTF.preload()`)
  - Position model properly in scene
  - Add proper scaling and rotation

### 2.3 Camera & Navigation Modes
- [ ] **Desktop Mode (Non-VR)**
  - Use `PerspectiveCamera` with `OrbitControls` or `FirstPersonControls`
  - WASD keyboard controls for movement
  - Mouse orientation (look-around)
  - Implement with `@react-three/drei` controls
  
- [ ] **VR Mode**
  - Use `XR` component from `@react-three/xr`
  - Inherit camera from XR session
  - Hand controller tracking (optional)
  - Teleportation or smooth locomotion

---

## Phase 3: User Interface & Controls

### 3.1 Desktop Interface
- [ ] **HUD/Debug Panel**
  - Display current mode (Desktop / VR Ready)
  - FPS counter
  - Position/orientation debug info
- [ ] **Controls Display**
  - Instructions: "WASD to move, Mouse to look"
  - Optional: Crosshair for raycast interaction
- [ ] **VR Entry Button**
  - "Enter VR" button (requires WebXR device)
  - Auto-detect VR capability
  - Graceful fallback if no headset

### 3.2 VR Interface
- [ ] **VR Entrance Logic**
  - Click button to request XR session
  - Handle session initialization
  - Set up locomotion method (teleport or movement)
- [ ] **In-VR Controls**
  - Hand controller buttons for teleportation
  - Head-based movement if smooth locomotion enabled
  - Exit VR button accessible
- [ ] **Performance Monitoring**
  - Frame rate optimization
  - Lazy loading for heavy assets

---

## Phase 4: Asset Management

### 4.1 Model Assets
- [ ] Place "map_mid_compressed.glb" in `/public/models/`
- [ ] Verify Draco compression is working
- [ ] Test loading time (pre-load in background)
- [ ] Consider LOD (Level of Detail) versions if file is large

### 4.2 Ready VR Assets Strategy
- [ ] Use pre-built UI components from drei/three-stdlib
- [ ] Reuse XR interaction patterns
- [ ] Leverage existing VR controller mappings
- [ ] Don't build custom hand models - use threejs/examples

---

## Phase 5: Deployment

### 5.1 Vercel Configuration
- [ ] Create `vercel.json` config if needed
- [ ] Set up HTTPS (required for WebXR)
- [ ] Configure environment variables
- [ ] Test WebXR on Vercel (not localhost)

### 5.2 Browser Compatibility
- [ ] Test on Oculus 2 Browser (primary target)
- [ ] Test on Chrome (desktop fallback)
- [ ] Verify WebXR feature detection
- [ ] Check for HTTPS requirement warnings

### 5.3 Performance Optimization
- [ ] Implement React.memo for scene components
- [ ] Use Suspense for model loading
- [ ] Optimize texture sizes
- [ ] Consider web workers for heavy computation

---

## Phase 6: Testing & Refinement

### 6.1 Desktop Testing
- [ ] WASD movement works smoothly
- [ ] Mouse look is responsive
- [ ] Model loads and renders correctly
- [ ] FPS stays above 60 (target 90 for VR)
- [ ] Lighting looks correct

### 6.2 VR Testing
- [ ] XR session initialization works
- [ ] Headset tracking is accurate
- [ ] Movement feels natural
- [ ] No nausea-inducing camera issues
- [ ] Performance meets 90 FPS requirement

### 6.3 Cross-Device Testing
- [ ] Desktop (Chrome) - WASD + Mouse
- [ ] Oculus 2 Browser - VR mode
- [ ] Mobile fallback (if needed)
- [ ] Network latency testing on Vercel

---

## Project Structure (Recommended)

```
src/
├── components/
│   ├── Scene.jsx          # Main canvas & scene setup
│   ├── Lighting.jsx       # Direct + Ambient lights
│   ├── Ground.jsx         # Walking plane
│   ├── Model.jsx          # GLB model loader
│   ├── Controls.jsx       # WASD + Mouse controls
│   ├── VRInterface.jsx    # VR mode toggle & HUD
│   └── XRScene.jsx        # XR wrapper component
├── App.jsx                # App entry point
├── index.css
└── main.jsx
public/
├── models/
│   └── map_mid_compressed.glb
└── index.html
```

---

## Key Considerations

### WebXR Safety
- Always run on HTTPS in production
- Test on actual Oculus 2 Browser (not emulation)
- Handle session lost/permission denied gracefully

### Performance Targets
- Desktop: 60 FPS minimum (target 120)
- VR: 90 FPS minimum (Oculus 2 requirement)
- Model load time: < 5 seconds

### User Experience
- Smooth transition between desktop and VR modes
- Clear on-screen instructions
- No motion sickness inducing effects (smooth acceleration)
- Responsive controls with minimal latency

### Draco Compression
- Ensure `three-draco` is set up before loading GLB
- Pre-load decoders on app start
- Monitor decompression time

---

## Implementation Priority

1. **High Priority:** Vite setup, r3f canvas, model loading, desktop controls
2. **Medium Priority:** VR mode integration, lighting, UI
3. **Low Priority:** Performance optimization, analytics, advanced features

---

## Resources & References
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber/
- @react-three/xr: https://github.com/pmndrs/react-xr
- @react-three/drei: https://github.com/pmndrs/drei
- Vercel Deployment: https://vercel.com/docs
- Oculus 2 Browser: https://www.meta.com/en/quest/browser/
