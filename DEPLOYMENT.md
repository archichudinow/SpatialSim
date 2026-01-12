# 🚀 Deployment Guide - VR Spatial Scene

## Deploy to Vercel in 3 Steps

### Step 1: Build Locally (Verify It Works)
```bash
npm run build
npm run preview  # Test the production build
```

✅ Your app should run at `http://localhost:4173`
✅ Check: WASD works, Model loads, FPS shows 60+

### Step 2: Deploy via Vercel CLI (Easiest)

#### Option A: Vercel CLI
```bash
# Install Vercel CLI globally (first time only)
npm i -g vercel

# From project directory
cd /workspaces/SpatialSim
vercel

# Follow prompts:
# - Link to existing project? → No (first deploy)
# - Set project name? → Press Enter (uses folder name)
# - Set production directory? → Press Enter (it's /dist)
# - Auto-detect settings? → Yes
```

**You'll get your HTTPS URL!** 🎉

#### Option B: GitHub + Vercel Web
```bash
# 1. Push to GitHub
git add .
git commit -m "VR scene ready for deployment"
git push origin main

# 2. Visit https://vercel.com
# 3. Click "New Project"
# 4. Connect your GitHub repo
# 5. Vercel auto-detects Vite config
# 6. Click "Deploy"
# 7. Get HTTPS URL in ~1 minute
```

### Step 3: Test on Oculus 2 Browser

1. **Wear your Oculus 2 headset**
2. **Open Oculus Browser** (usually in Oculus Home)
3. **Navigate to your Vercel URL** (looks like: `https://your-project.vercel.app`)
4. **See the 3D scene load** - sky blue background with model
5. **Click "🥽 Enter VR" button** in top-left
6. **Allow browser permission** when prompted
7. **Enjoy VR!** - Walk around using your controllers

---

## Environment Variables (Optional)

If you need custom settings, create `.env`:

```env
VITE_APP_TITLE=VR Spatial Scene
VITE_MODEL_URL=/models/map_mid_compressed.glb
```

Then use in components:
```jsx
const modelUrl = import.meta.env.VITE_MODEL_URL;
```

---

## Vercel Config Explained

Your `vercel.json`:
```json
{
  "buildCommand": "npm run build",        // How to build
  "outputDirectory": "dist",              // Where built files go
  "devCommand": "npm run dev",            // Local dev command
  "env": {
    "VITE_APP_TITLE": "VR Spatial Scene"  // Optional env vars
  }
}
```

Vercel uses this to:
- ✅ Run `npm run build` after each git push
- ✅ Serve files from `dist/` folder
- ✅ Set environment variables automatically
- ✅ Enable HTTPS automatically (required for WebXR!)

---

## After Deployment

### Update Code & Re-Deploy

```bash
# Edit files...

# Push changes
git add .
git commit -m "Updated controls speed"
git push origin main

# Vercel auto-deploys! ✨
# Check deployment status at vercel.com
```

### Monitor Performance

1. Visit your Vercel dashboard
2. Click your project
3. See:
   - ✅ Build logs
   - ✅ Deployment status
   - ✅ Page speed insights
   - ✅ Real user analytics

---

## WebXR on Vercel - What's Handled Automatically

✅ **HTTPS** - Vercel provides free SSL/TLS  
✅ **CORS Headers** - Vercel sets correct headers for WebXR  
✅ **Feature Detection** - Your code checks for WebXR support  
✅ **Browser Compatibility** - Works on Oculus 2, Chrome, Edge  

**Nothing extra needed!** The code works as-is.

---

## Troubleshooting Deployment

### Build Fails
```bash
# Check build locally first
npm run build

# If error, check:
# 1. Node version: node --version (should be 18+)
# 2. Dependencies: npm list
# 3. Fix and try again: npm run build
```

### WebXR Not Available
- ✅ Vercel URL is HTTPS? (check the domain)
- ✅ Using Oculus Browser? (Chrome on desktop doesn't have immersive-vr)
- ✅ Headset paired? (power on & pair first)
- ✅ Browser updated? (try clearing cache)

### Model Doesn't Load
```bash
# Check file exists
ls -la public/models/map_mid_compressed.glb

# Check URL in Model.jsx
# Should be: /models/map_mid_compressed.glb
# NOT: ./models/ or public/models/
```

### Slow Performance
- Check FPS in debug UI
- If < 60 FPS on desktop:
  - Reduce shadow map size
  - Simplify model LOD
  - Profile in DevTools

- If < 90 FPS in VR:
  - Use VR on faster device
  - Reduce lighting complexity
  - Lower canvas resolution (in Scene.jsx)

---

## Custom Domain (Optional)

### Connect Custom Domain to Vercel
1. Buy domain (Namecheap, GoDaddy, etc.)
2. Go to Vercel Project Settings
3. Click "Domains"
4. Enter your domain name
5. Update DNS to Vercel nameservers
6. Done! Your domain now serves VR app

---

## CI/CD Pipeline (Git Auto-Deploy)

Currently set up:
```
You push → GitHub → Vercel detects → Build & Deploy → Live! 🚀
```

No extra setup needed! Works automatically.

---

## Rollback to Previous Version

If something breaks:
1. Visit vercel.com
2. Go to Deployments tab
3. Find good version
4. Click "..."
5. Select "Promote to Production"

Instant rollback! ✨

---

## Analytics & Monitoring

On Vercel Dashboard:
- View build times
- See web vitals (CLS, LCP, FID)
- Check error rates
- Monitor bandwidth usage

---

## Scale & Limits (Free Tier)

✅ **Free Vercel includes:**
- Unlimited deployments
- Unlimited bandwidth
- HTTPS always
- Edge network worldwide
- Environment variables
- Deployment previews for PRs

No credit card needed!

---

## Advanced: Preview URLs

For testing before merging to main:
```bash
# Create a PR on GitHub
# Vercel auto-creates preview URL
# Test in VR: https://your-project-pr-123.vercel.app
# Click merge → Goes to production
```

---

## Your Deployment Checklist

- [ ] `npm run build` succeeds locally
- [ ] `npm run preview` works at localhost:4173
- [ ] WASD + Mouse controls work
- [ ] Model loads without errors
- [ ] FPS counter shows 60+
- [ ] Vercel CLI installed: `npm i -g vercel`
- [ ] Logged in to Vercel: `vercel login`
- [ ] Run `vercel` command from project folder
- [ ] Got HTTPS URL from Vercel
- [ ] Tested on desktop browser (https URL)
- [ ] Wore Oculus 2 headset
- [ ] Opened Oculus Browser
- [ ] Navigated to HTTPS URL
- [ ] Clicked "Enter VR" button
- [ ] Saw VR scene
- [ ] Walked around using controllers
- [ ] Clicked back to exit VR
- [ ] Celebrated! 🎉

---

## Support

- Vercel Docs: https://vercel.com/docs
- WebXR Docs: https://www.w3.org/TR/webxr/
- React Three Fiber: https://docs.pmnd.rs/react-three-fiber/
- GitHub Issues: Create an issue in your repo

---

**You're all set! Deploy with confidence!** 🚀✨
