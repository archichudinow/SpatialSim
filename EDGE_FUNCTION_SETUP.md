# Supabase Edge Function Setup Guide

## Overview

This implementation moves recording uploads from client-side to server-side using Supabase Edge Functions. This provides better security by removing write access for anonymous users.

## Two Approaches Available

### Approach A: `save-recording-with-glb` (Recommended)
- **Client**: Generates GLB using Three.js, sends to Edge Function
- **Edge Function**: Uploads GLB/CSV to storage, creates DB record
- **Pros**: Maintains proper Three.js GLB format
- **Cons**: Larger payload sent to Edge Function

### Approach B: `save-recording`
- **Client**: Sends only frame data JSON
- **Edge Function**: Generates simplified GLB, uploads, creates DB record
- **Pros**: Smaller payload, faster upload
- **Cons**: Simplified GLB format (needs viewer update)

## Setup Instructions

### 1. Run SQL Migrations

Copy and run the SQL from `SQL_MIGRATIONS.sql` in your Supabase SQL Editor:

```sql
-- This will:
-- 1. Remove anon INSERT policy on records table
-- 2. Remove public write access to storage bucket
-- 3. Keep read access for public users
-- 4. Add performance indexes
-- 5. Add validation constraints
```

### 2. Deploy Edge Function

#### Option A: Using Supabase Dashboard (Recommended)

1. Go to Supabase Dashboard → Edge Functions
2. Click "Create a new function"
3. Name it: `save-recording-with-glb` (or `save-recording`)
4. Copy the content from:
   - `supabase/functions/save-recording-with-glb/index.ts` (Approach A), or
   - `supabase/functions/save-recording/index.ts` (Approach B)
5. Click "Deploy"

#### Option B: Using Supabase CLI

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref YOUR_PROJECT_REF

# Deploy the function
supabase functions deploy save-recording-with-glb

# Or for Approach B:
supabase functions deploy save-recording
```

### 3. Update Client Code

#### For Approach A (Client generates GLB):

Replace `src/utils/RecordingManager.js` with `RecordingManager_EdgeFunction.js`:

```bash
mv src/utils/RecordingManager.js src/utils/RecordingManager_OLD.js
mv src/utils/RecordingManager_EdgeFunction.js src/utils/RecordingManager.js
```

The `saveToSupabase()` method will now:
1. Generate GLB/CSV on client
2. Send files to Edge Function via multipart form data
3. Edge Function handles all uploads and DB operations

#### For Approach B (Server generates GLB):

Use the `saveFramesOnly()` method instead of `saveToSupabase()`:

```javascript
// In your component:
const result = await RecordingManager.saveFramesOnly();
```

### 4. Verify Setup

Test the recording flow:

```javascript
// Start recording
RecordingManager.startRecording();

// Record some frames...
RecordingManager.recordFrame(position, lookAt);

// Stop and save
const result = await RecordingManager.saveToSupabase(); // or saveFramesOnly()

if (result.success) {
  console.log('Recording saved:', result.record.id);
  console.log('GLB URL:', result.glbUrl);
} else {
  console.error('Save failed:', result.error);
}
```

## Testing

### Test Edge Function Manually

```bash
# Test with curl
curl -X POST \
  'YOUR_SUPABASE_URL/functions/v1/save-recording-with-glb' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -F 'projectId=PROJECT_UUID' \
  -F 'optionId=OPTION_UUID' \
  -F 'scenarioId=SCENARIO_UUID' \
  -F 'optionName=Option A' \
  -F 'scenarioName=Scenario 1' \
  -F 'deviceType=pc' \
  -F 'durationMs=5000' \
  -F 'glbFile=@path/to/test.glb' \
  -F 'csvFile=@path/to/test.csv'
```

### Monitor Edge Function Logs

In Supabase Dashboard:
1. Go to Edge Functions
2. Select your function
3. Click "Logs" tab
4. Monitor real-time execution

## Security Improvements

✅ **Anonymous users cannot write to storage** - Only Edge Function (with service role) can upload
✅ **Anonymous users cannot write to records table** - Only Edge Function can create records
✅ **Public users can still read** - Recordings are viewable by everyone
✅ **Server-side validation** - Project/option/scenario existence verified before upload
✅ **Atomic operations** - Failed uploads are cleaned up automatically
✅ **Better error handling** - Centralized error responses

## Performance Considerations

- **Client bandwidth**: Approach A uploads GLB (~larger), Approach B uploads JSON (~smaller)
- **Processing time**: Approach A is faster (client does GLB gen), Approach B slower (server does it)
- **Edge Function limits**: 
  - Max execution time: 150 seconds
  - Max memory: 150MB
  - Consider these when recording long sessions

## Rollback

If you need to revert to client-side uploads:

```sql
-- Re-enable anon write access (SQL_MIGRATIONS.sql has instructions)
CREATE POLICY "Public users can create records"
ON records FOR INSERT
TO anon
WITH CHECK (true);
```

Then restore the original `RecordingManager.js`.

## Troubleshooting

### Error: "Project not found"
- Verify UUIDs are correct
- Check that project exists and is not archived

### Error: "Failed to upload GLB file"
- Check Edge Function logs in Supabase Dashboard
- Verify storage bucket `projects` exists
- Check file size (max 50MB for free tier)

### Error: "Database record creation failed"
- Verify foreign key constraints
- Check that option/scenario belong to the project
- Review RLS policies on records table

### CORS errors
- Edge Function has CORS headers enabled
- If issues persist, check browser console for specific CORS error

## Next Steps

1. ✅ Run SQL migrations
2. ✅ Deploy Edge Function
3. ✅ Update client code
4. ✅ Test recording flow
5. ✅ Monitor Edge Function logs
6. ✅ Clean up old files (1.md, 2.md, 3.md, RecordingManager_OLD.js)
