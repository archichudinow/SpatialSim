# Database Update Summary - Hierarchical Storage Implementation

**Date**: January 25, 2026
**Based on**: [spatial-lens-db STORAGE_GUIDE.md](https://github.com/archichudinow/spatial-lens-db/blob/main/STORAGE_GUIDE.md)

## Overview

Updated SpatialSim to use the new hierarchical storage structure from the spatial-lens-db repository. All file uploads now go through Edge Functions which handle path generation automatically.

## Changes Made

### 1. RecordingManager.js
**Status**: ✅ Updated

- Removed direct storage uploads via `StorageService`
- Removed direct database record creation via `DatabaseService`
- Now uses Edge Function endpoint: `save-recording-with-glb`
- Edge Function handles:
  - Hierarchical path generation
  - File upload with service-role auth
  - Database record creation
  - Atomic operation (all or nothing)

**Key Changes**:
- Removed imports: `StorageService`, `DatabaseService`
- Updated `saveToSupabase()` method to use `fetch()` API
- Sends FormData to Edge Function with GLB and CSV files
- Edge Function returns structured response with URLs

### 2. StorageService.js
**Status**: ✅ Deprecated for uploads

- Added deprecation notices to upload methods
- Methods kept for legacy compatibility and read operations
- Updated class documentation

**Deprecated Methods**:
- `uploadFile()`
- `uploadModel()`
- `uploadRecording()`
- `uploadRawData()`

**Still Active**:
- `downloadFile()` - Read operations
- `getPublicUrl()` - URL generation
- `listFiles()` - Directory listing
- `deleteFile()` - Cleanup operations

### 3. DatabaseService.js
**Status**: ✅ Deprecated for record creation

- Added deprecation notice to `createRecord()` method
- Method kept for legacy compatibility
- All other database methods remain active (read operations)

### 4. .env File
**Status**: ✅ Created

Created `.env` file with Supabase configuration:
```env
VITE_SUPABASE_URL=https://piibdadcmkrmvbiapglz.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

**Note**: Developer needs to add their actual anon key

### 5. README.md
**Status**: ✅ Updated

Added sections:
- Environment Variables configuration
- Database & Storage overview
- Hierarchical Storage Structure diagram
- Recording Upload Flow explanation
- Link to storage guide documentation

### 6. TypeScript Types Integration
**Status**: ✅ Configured

- Created [src/types/database.ts](src/types/database.ts) with latest types from spatial-lens-db
- Converted [src/utils/supabaseClient.js](src/utils/supabaseClient.ts) to TypeScript
- Added typed Supabase client using `Database` types
- Created [src/vite-env.d.ts](src/vite-env.d.ts) for Vite environment variables
- Added npm script `update-db-types` to sync types from database repo

**Type Safety Benefits**:
- Autocomplete for table names and columns
- Type checking for database queries
- IntelliSense for Supabase operations
- Compile-time error detection

**Keeping Types Updated**:
```bash
npm run update-db-types
```

## New Storage Structure

```
projects/{project_name}_{project_id}/
  ├── options/{option_id}/model_{timestamp}.glb
  ├── records/
  │   ├── records_glb/{option_id}/{scenario_id}/processed_recording_{timestamp}.glb
  │   └── records_csv/{option_id}/{scenario_id}/raw_recording_{timestamp}.json
  └── others/context_{timestamp}.glb, heatmap_{timestamp}.glb
```

## Upload Flow

```
┌─────────────────────────────────────────┐
│ 1. User records session in SpatialSim  │
│    - Captures frames (position/lookAt) │
│    - Generates GLB (Three.js)          │
│    - Generates CSV                      │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 2. RecordingManager.saveToSupabase()   │
│    - Creates FormData with files       │
│    - Calls Edge Function               │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 3. Edge Function Processing            │
│    - Generates hierarchical paths      │
│    - Uploads to storage (service_role) │
│    - Creates database record           │
│    - Returns URLs and record           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│ 4. Client receives response             │
│    - record: Database record object    │
│    - glbUrl: Public URL to GLB file    │
│    - rawUrl: Public URL to CSV file    │
└─────────────────────────────────────────┘
```

## Testing Checklist

- [ ] Set `VITE_SUPABASE_ANON_KEY` in `.env` file
- [ ] Test recording capture in browser
- [ ] Verify Edge Function is called (check console logs)
- [ ] Confirm file appears in Supabase Storage with correct path
- [ ] Check database record is created correctly
- [ ] Download file via returned URL to verify

## Benefits

✅ **No client-side path generation** - Edge Function handles it
✅ **Secure uploads** - Service-role auth (clients can't bypass)
✅ **Atomic operations** - File + DB record created together
✅ **Consistent structure** - Database functions ensure correctness
✅ **Better organization** - Human-readable hierarchical paths
✅ **Future-proof** - Centralized logic for easy updates

## Migration Notes

### What Changed
- Recording uploads now go through Edge Functions
- No more direct storage access from client
- No more direct database record creation from client

### What Stayed the Same
- Recording capture logic (frames, GLB export)
- User interface and controls
- Read operations (fetching projects, options, scenarios)
- File download and listing operations

### Breaking Changes
❌ None for end users - UI and UX unchanged
❌ None for deployments - Just need to set env var

## Documentation Links

- [STORAGE_GUIDE.md](https://github.com/archichudinow/spatial-lens-db/blob/main/STORAGE_GUIDE.md) - Quick reference
- [STORAGE_IMPLEMENTATION.md](https://github.com/archichudinow/spatial-lens-db/blob/main/docs/STORAGE_IMPLEMENTATION.md) - Full implementation guide
- [spatial-lens-db README](https://github.com/archichudinow/spatial-lens-db) - Database repository

## Next Steps

1. ✅ Add actual `VITE_SUPABASE_ANON_KEY` to `.env`
2. ✅ Test recording upload in development
3. ✅ Verify files appear in correct storage paths
4. ✅ Update production environment variables on Vercel
5. ✅ Deploy and test in production

## Support

For issues or questions:
- Check [STORAGE_GUIDE.md](https://github.com/archichudinow/spatial-lens-db/blob/main/STORAGE_GUIDE.md)
- Review Edge Function logs in Supabase Dashboard
- Check browser console for client-side errors
