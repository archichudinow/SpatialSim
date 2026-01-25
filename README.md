# VR Spatial Scene - Vite + React Three Fiber + WebXR

A WebXR-enabled VR application for exploring 3D scenes with support for both desktop (PC) and VR headsets (Oculus 2 via Browser).

## Features

✅ **Desktop Mode**: WASD movement + mouse look orientation  
✅ **VR Mode**: WebXR support for Oculus 2 Browser  
✅ **Draco Compression**: Optimized model loading  
✅ **Direct & Ambient Lighting**: Proper scene illumination  
✅ **Fullscreen 3D**: Immersive experience  
✅ **Ready for Vercel**: HTTPS-enabled deployment  

## Quick Start

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Desktop Controls

| Key | Action |
|-----|--------|
| **W** | Move forward |
| **A** | Move left |
| **S** | Move backward |
| **D** | Move right |
| **Space** | Move up |
| **Shift** | Move down |
| **Mouse** | Look around (hold right-click) |

### VR Controls

1. Click **"🥽 Enter VR"** button on the UI
2. Follow the browser's WebXR prompt
3. Use your Oculus 2 controllers to navigate
4. Press controller button or ESC to exit

## Building for Production

```bash
npm run build
```

This generates a `dist/` folder ready for deployment.

## Deployment to Vercel

### Option 1: Using Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2: Using GitHub

1. Push your repository to GitHub
2. Visit [vercel.com](https://vercel.com)
3. Connect your repository
4. Vercel auto-detects Vite config and deploys

### Requirements for WebXR on Vercel

✅ **HTTPS** - Vercel provides automatic HTTPS  
✅ **Correct Headers** - Vercel handles CORS for WebXR  
✅ **Browser Support** - Test on Oculus 2 Browser  

## Testing on Oculus 2

### Step 1: Deploy to Vercel
Get your HTTPS URL from Vercel deployment.

### Step 2: Open in Oculus Browser
1. Wear your Oculus 2 headset
2. Open the Oculus Browser app
3. Navigate to your Vercel URL
4. Click "Enter VR" button

### Step 3: Enjoy!
Walk around using your controllers or VR locomotion.

## Project Structure

```
src/
├── components/
│   ├── Scene.jsx        # Main canvas setup
│   ├── Lighting.jsx     # Direct + Ambient lights
│   ├── Ground.jsx       # Walking surface
│   ├── Model.jsx        # GLB model loader (Draco)
│   ├── Controls.jsx     # WASD + Mouse controls
│   └── VRInterface.jsx  # UI & VR entry
├── App.jsx              # Main app component
├── index.css            # Global styles
└── main.jsx             # React entry point

public/
└── models/
    └── map_mid_compressed.glb  # 3D scene asset
```

## Performance Tips

- **Desktop Target**: 60 FPS minimum (120 FPS ideal)
- **VR Target**: 90 FPS minimum (Oculus 2 requirement)

### Optimization Strategies

1. **Draco Compression**: Models are pre-compressed
2. **Lazy Loading**: Models load with Suspense
3. **Shadows**: Optimized shadow maps
4. **Memory**: Unused components are garbage collected

## Troubleshooting

### WebXR not working
- Ensure HTTPS is enabled (Vercel provides this)
- Check browser support: https://caniuse.com/webxr
- Test on actual Oculus 2 Browser (not emulation)

### Model not loading
- Verify `/public/models/map_mid_compressed.glb` exists
- Check browser console for Draco decompression errors
- Ensure proper CORS headers (handled by Vercel)

### Poor performance
- Check FPS in debug UI (top-left corner)
- Reduce shadow map resolution if needed
- Test on different devices

### Camera stuck in VR
- Press ESC to exit VR session
- Check XR session logs in console

## Technologies Used

- **React** - UI Framework
- **Vite** - Build tool
- **Three.js** - 3D rendering
- **React Three Fiber** - React renderer for Three.js
- **@react-three/drei** - Utility library (camera, lights, loaders)
- **@react-three/xr** - WebXR integration
- **Vercel** - Hosting & deployment

## Environment Variables

Create a `.env` file in the project root with your Supabase credentials:

```env
VITE_SUPABASE_URL=https://piibdadcmkrmvbiapglz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

Get your credentials from your Supabase project dashboard.

## Database & Storage

This app uses the [spatial-lens-db](https://github.com/archichudinow/spatial-lens-db) Supabase database.

### TypeScript Types

Database types are automatically synced from the database repository. The Supabase client is fully typed for better developer experience:

```typescript
// Types are imported from src/types/database.ts
import { supabase } from './utils/supabaseClient'

// Type-safe queries with autocomplete
const { data } = await supabase
  .from('projects')  // ← Autocomplete for table names
  .select('*')       // ← Type checking for columns
```

To update types when the database schema changes:
```bash
npm run update-db-types
```

### Hierarchical Storage Structure

All files are stored with a hierarchical organization:
```
projects/{project_name}_{project_id}/
  ├── options/{option_id}/model_{timestamp}.glb
  ├── records/
  │   ├── records_glb/{option_id}/{scenario_id}/processed_recording_{timestamp}.glb
  │   └── records_csv/{option_id}/{scenario_id}/raw_recording_{timestamp}.json
  └── others/context_{timestamp}.glb, heatmap_{timestamp}.glb
```

### Recording Upload Flow

1. **Client**: User records session → GLB/CSV generated
2. **Edge Function**: Handles path generation & secure upload
3. **Database**: Record created with proper file references

All uploads go through Edge Functions (no direct storage access). This ensures:
- ✅ Consistent hierarchical paths
- ✅ Service-role authentication
- ✅ Atomic database record creation
- ✅ Proper validation and error handling

For more details, see the [storage guide](https://github.com/archichudinow/spatial-lens-db/blob/main/STORAGE_GUIDE.md).

## License

MIT

## Resources

- [React Three Fiber Docs](https://docs.pmnd.rs/react-three-fiber/)
- [@react-three/xr GitHub](https://github.com/pmndrs/react-xr)
- [WebXR Specification](https://www.w3.org/TR/webxr/)
- [Oculus Browser Info](https://www.meta.com/en/quest/browser/)
