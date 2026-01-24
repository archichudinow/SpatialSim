# Supabase Database Usage Guide

## Overview

This guide is for external applications that need to interact with the SpatialLens CMS database. The primary use cases are:
- **Reading project data** (projects, options, scenarios)
- **Writing simulation records** to the database and storage

## Database Schema

### Core Tables

```
projects (root)
├── project_options (Option A, B, C, etc.)
│   └── scenarios (simulation definitions)
│       └── records (simulation outputs)
```

### Schema Diagram

```sql
-- Projects: Root table
projects
  ├── id: UUID (primary key)
  ├── name: TEXT
  ├── description: TEXT
  ├── status: project_status ('development' | 'released' | 'archived')
  ├── models_context: TEXT[] (array of storage URLs)
  ├── models_heatmap: TEXT (storage URL)
  ├── spatial_lens_url: TEXT
  ├── spatial_simulation_url: TEXT
  ├── created_at: TIMESTAMPTZ
  └── updated_at: TIMESTAMPTZ

-- Project Options: Multiple options per project
project_options
  ├── id: UUID (primary key)
  ├── project_id: UUID (foreign key → projects.id)
  ├── name: TEXT (e.g., "Option A")
  ├── description: TEXT
  ├── model_url: TEXT (storage URL)
  ├── is_default: BOOLEAN
  ├── is_archived: BOOLEAN
  ├── created_at: TIMESTAMPTZ
  └── updated_at: TIMESTAMPTZ

-- Scenarios: Simulation configurations
scenarios
  ├── id: UUID (primary key)
  ├── option_id: UUID (foreign key → project_options.id)
  ├── name: TEXT (e.g., "Scenario A")
  ├── description: TEXT
  ├── start_coordinates: JSONB {x, y, z}
  ├── destination_coordinates: JSONB {x, y, z}
  ├── objective: TEXT
  ├── is_archived: BOOLEAN
  ├── created_at: TIMESTAMPTZ
  └── updated_at: TIMESTAMPTZ

-- Records: Simulation outputs
records
  ├── id: UUID (primary key)
  ├── project_id: UUID (foreign key → projects.id)
  ├── option_id: UUID (foreign key → project_options.id)
  ├── scenario_id: UUID (foreign key → scenarios.id)
  ├── record_url: TEXT (storage URL to .glb file, REQUIRED)
  ├── raw_url: TEXT (storage URL to .csv file, optional)
  ├── length_ms: INTEGER (duration in milliseconds)
  ├── device_type: TEXT ('pc' | 'vr')
  ├── is_archived: BOOLEAN
  ├── created_at: TIMESTAMPTZ
  └── updated_at: TIMESTAMPTZ
```

---

## Setup

### 1. Install Supabase Client

```bash
npm install @supabase/supabase-js
```

### 2. Initialize Supabase Client

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'YOUR_SUPABASE_URL'
const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 3. TypeScript Types (Optional but Recommended)

```typescript
export interface Coordinates {
  x: number
  y: number
  z: number
}

export type ProjectStatus = 'development' | 'released' | 'archived'

export interface Project {
  id: string
  name: string
  description: string | null
  status: ProjectStatus
  models_context: string[] | null
  models_heatmap: string | null
  spatial_lens_url: string | null
  spatial_simulation_url: string | null
  created_at: string
  updated_at: string | null
}

export interface ProjectOption {
  id: string
  project_id: string
  name: string
  description: string | null
  model_url: string | null
  is_default: boolean
  is_archived: boolean
  created_at: string
  updated_at: string | null
}

export interface Scenario {
  id: string
  option_id: string
  name: string
  description: string | null
  start_coordinates: Coordinates
  destination_coordinates: Coordinates
  objective: string
  is_archived: boolean
  created_at: string
  updated_at: string | null
}

export interface Record {
  id: string
  project_id: string
  option_id: string
  scenario_id: string
  record_url: string
  raw_url: string | null
  length_ms: number | null
  device_type: string | null
  is_archived: boolean
  created_at: string
  updated_at: string | null
}
```

---

## Reading Project Data

### Get All Projects

```typescript
async function getAllProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

### Get Single Project with All Nested Data

```typescript
async function getProjectFull(projectId: string) {
  // Get project
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single()
  
  if (projectError) throw projectError

  // Get options
  const { data: options, error: optionsError } = await supabase
    .from('project_options')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })
  
  if (optionsError) throw optionsError

  // Get scenarios for each option
  const optionsWithScenarios = await Promise.all(
    options.map(async (option) => {
      const { data: scenarios, error: scenariosError } = await supabase
        .from('scenarios')
        .select('*')
        .eq('option_id', option.id)
        .eq('is_archived', false)
        .order('created_at', { ascending: true })
      
      if (scenariosError) throw scenariosError

      // Get records for each scenario
      const scenariosWithRecords = await Promise.all(
        scenarios.map(async (scenario) => {
          const { data: records, error: recordsError } = await supabase
            .from('records')
            .select('*')
            .eq('scenario_id', scenario.id)
            .order('created_at', { ascending: true })
          
          if (recordsError) throw recordsError

          return { ...scenario, records }
        })
      )

      return { ...option, scenarios: scenariosWithRecords }
    })
  )

  return {
    ...project,
    options: optionsWithScenarios
  }
}
```

### Get Projects by Status

```typescript
async function getProjectsByStatus(status: ProjectStatus) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

### Get Active (Non-Archived) Options for a Project

```typescript
async function getProjectOptions(projectId: string) {
  const { data, error } = await supabase
    .from('project_options')
    .select('*')
    .eq('project_id', projectId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}
```

### Get Scenarios for an Option

```typescript
async function getScenarios(optionId: string) {
  const { data, error } = await supabase
    .from('scenarios')
    .select('*')
    .eq('option_id', optionId)
    .eq('is_archived', false)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}
```

### Get Records for a Scenario

```typescript
async function getRecords(scenarioId: string) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('scenario_id', scenarioId)
    .order('created_at', { ascending: true })
  
  if (error) throw error
  return data
}
```

---

## Writing Simulation Records

### Step 1: Upload Files to Storage

The storage bucket is named `projects` and files are organized as:
```
projects/
  └── {project_id}/
      ├── models/
      │   ├── option_model.glb
      │   └── context_model.glb
      └── records/
          ├── record_123.glb
          └── record_123.csv
```

```typescript
async function uploadRecordFile(
  projectId: string,
  file: File,
  fileName: string
): Promise<string> {
  const filePath = `${projectId}/records/${fileName}`
  
  const { data, error } = await supabase.storage
    .from('projects')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    })

  if (error) throw error

  // Get public URL
  const { data: urlData } = supabase.storage
    .from('projects')
    .getPublicUrl(filePath)

  return urlData.publicUrl
}
```

### Step 2: Create Record in Database

```typescript
async function createRecord({
  projectId,
  optionId,
  scenarioId,
  recordFile,
  rawFile = null,
  deviceType = 'pc',
  lengthMs = null
}: {
  projectId: string
  optionId: string
  scenarioId: string
  recordFile: File
  rawFile?: File | null
  deviceType?: 'pc' | 'vr'
  lengthMs?: number | null
}) {
  // Upload record file (.glb)
  const recordFileName = `record_${Date.now()}.glb`
  const recordUrl = await uploadRecordFile(projectId, recordFile, recordFileName)

  // Upload raw file (.csv) if provided
  let rawUrl = null
  if (rawFile) {
    const rawFileName = `record_${Date.now()}.csv`
    rawUrl = await uploadRecordFile(projectId, rawFile, rawFileName)
  }

  // Create database record
  const { data, error } = await supabase
    .from('records')
    .insert([{
      project_id: projectId,
      option_id: optionId,
      scenario_id: scenarioId,
      record_url: recordUrl,
      raw_url: rawUrl,
      length_ms: lengthMs,
      device_type: deviceType,
      is_archived: false
    }])
    .select()
    .single()

  if (error) throw error
  return data
}
```

### Complete Example: Create Record from Simulation

```typescript
async function saveSimulationRecord(
  projectId: string,
  optionId: string,
  scenarioId: string,
  simulationData: {
    recordBlob: Blob      // .glb file
    rawDataBlob?: Blob    // .csv file (optional)
    durationMs: number    // simulation duration
    deviceType: 'pc' | 'vr'
  }
) {
  try {
    // Convert blobs to files
    const recordFile = new File(
      [simulationData.recordBlob],
      `simulation_${Date.now()}.glb`,
      { type: 'model/gltf-binary' }
    )

    let rawFile = null
    if (simulationData.rawDataBlob) {
      rawFile = new File(
        [simulationData.rawDataBlob],
        `simulation_${Date.now()}.csv`,
        { type: 'text/csv' }
      )
    }

    // Create record
    const record = await createRecord({
      projectId,
      optionId,
      scenarioId,
      recordFile,
      rawFile,
      deviceType: simulationData.deviceType,
      lengthMs: simulationData.durationMs
    })

    console.log('Record created:', record.id)
    return record
  } catch (error) {
    console.error('Failed to save simulation record:', error)
    throw error
  }
}
```

---

## Storage Best Practices

### File Naming

Use timestamps or UUIDs to avoid conflicts:
```typescript
const fileName = `record_${Date.now()}.glb`
// or
const fileName = `record_${crypto.randomUUID()}.glb`
```

### File Size Limits

The current limit is **50MB per file**. For larger files, consider:
- Compressing the data
- Splitting into chunks
- Storing externally and saving URL reference

### File Types

Supported file types:
- **Records**: `.glb` (required), `.csv` (optional for raw data)
- **Models**: `.glb`, `.gltf`
- **Context**: Any model format

---

## Error Handling

```typescript
async function safeCreateRecord(recordData: any) {
  try {
    const record = await createRecord(recordData)
    return { success: true, data: record }
  } catch (error) {
    console.error('Error creating record:', error)
    
    if (error.code === '23503') {
      return { success: false, error: 'Invalid project, option, or scenario ID' }
    }
    
    if (error.code === '23505') {
      return { success: false, error: 'Duplicate record' }
    }
    
    return { success: false, error: error.message }
  }
}
```

---

## Row Level Security (RLS)

The database has RLS enabled. Make sure your app is authenticated:

```typescript
// For authenticated users
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password'
})

// Or use service role key for server-side operations
const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey // Server-side only!
)
```

---

## Common Queries

### Get All Records for a Project

```typescript
async function getAllProjectRecords(projectId: string) {
  const { data, error } = await supabase
    .from('records')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}
```

### Get Records with Related Data

```typescript
async function getRecordsWithDetails(scenarioId: string) {
  const { data, error } = await supabase
    .from('records')
    .select(`
      *,
      project_options (name),
      scenarios (name, objective)
    `)
    .eq('scenario_id', scenarioId)
  
  if (error) throw error
  return data
}
```

### Archive a Record

```typescript
async function archiveRecord(recordId: string) {
  const { data, error } = await supabase
    .from('records')
    .update({ 
      is_archived: true,
      updated_at: new Date().toISOString()
    })
    .eq('id', recordId)
    .select()
    .single()
  
  if (error) throw error
  return data
}
```

---

## Performance Tips

1. **Use indexes**: The database has indexes on foreign keys and commonly queried columns
2. **Limit results**: Use `.limit()` for large datasets
3. **Select specific fields**: Use `.select('id, name')` instead of `.select('*')`
4. **Cache project structure**: Project configurations don't change often
5. **Batch operations**: Use `.insert([...])` for multiple records

---

## Example: Complete Integration

```typescript
import { createClient } from '@supabase/supabase-js'

class SpatialLensAPI {
  private supabase

  constructor(url: string, key: string) {
    this.supabase = createClient(url, key)
  }

  // Get project with all data
  async getProject(projectId: string) {
    return await getProjectFull(projectId)
  }

  // Save simulation result
  async saveSimulation(
    projectId: string,
    optionId: string,
    scenarioId: string,
    data: {
      recordBlob: Blob
      rawDataBlob?: Blob
      durationMs: number
      deviceType: 'pc' | 'vr'
    }
  ) {
    return await saveSimulationRecord(
      projectId,
      optionId,
      scenarioId,
      data
    )
  }

  // Get all records for analysis
  async getProjectRecords(projectId: string) {
    return await getAllProjectRecords(projectId)
  }
}

// Usage
const api = new SpatialLensAPI(
  'YOUR_SUPABASE_URL',
  'YOUR_SUPABASE_KEY'
)

// In your simulation engine
const project = await api.getProject(projectId)
const option = project.options[0]
const scenario = option.scenarios[0]

// Run simulation...
const result = runSimulation(scenario)

// Save result
await api.saveSimulation(
  project.id,
  option.id,
  scenario.id,
  {
    recordBlob: result.glbData,
    rawDataBlob: result.csvData,
    durationMs: result.duration,
    deviceType: 'vr'
  }
)
```

---

## Support

For questions or issues:
1. Check the SQL migration file: `supabase_migration.sql`
2. Review the admin panel code: `src/lib/api.ts` and `src/lib/storage.ts`
3. Contact the CMS admin team

---

## Database Connection Details

```
Supabase Project URL: https://piibdadcmkrmvbiapglz.supabase.co
Database: PostgreSQL 15
Storage Bucket: projects (public read, authenticated write)
```

**Important**: Never commit your Supabase keys to version control!
