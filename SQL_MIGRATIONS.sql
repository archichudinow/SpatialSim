-- ================================================
-- SQL MIGRATIONS FOR EDGE FUNCTION IMPLEMENTATION
-- ================================================

-- -----------------------------------------------
-- 1. REMOVE ANON WRITE ACCESS TO RECORDS TABLE
-- -----------------------------------------------

-- Drop the policy that allows anonymous users to insert records
DROP POLICY IF EXISTS "Public users can create records" ON records;

-- Keep read access for anon users (if needed)
-- The policy "Public users can view records" remains active

-- Verify remaining policies
-- SELECT * FROM pg_policies WHERE tablename = 'records';


-- -----------------------------------------------
-- 2. UPDATE STORAGE BUCKET POLICIES (if needed)
-- -----------------------------------------------

-- Check current storage policies
-- SELECT * FROM storage.policies WHERE bucket_id = 'projects';

-- Remove any public INSERT/UPDATE policies on storage bucket
-- This ensures only service role (edge function) can upload
DROP POLICY IF EXISTS "Public can upload to projects bucket" ON storage.objects;
DROP POLICY IF EXISTS "Anon can upload to projects bucket" ON storage.objects;

-- Ensure authenticated users can still READ from storage
-- Drop and recreate to avoid conflicts
DROP POLICY IF EXISTS "Authenticated users can read from projects bucket" ON storage.objects;
CREATE POLICY "Authenticated users can read from projects bucket"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'projects');

-- Ensure public/anon users can READ from storage (for viewing recordings)
DROP POLICY IF EXISTS "Public can read from projects bucket" ON storage.objects;
CREATE POLICY "Public can read from projects bucket"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'projects');


-- -----------------------------------------------
-- 3. ADD INDEX FOR BETTER QUERY PERFORMANCE
-- -----------------------------------------------

-- Add indexes on foreign keys if they don't exist
CREATE INDEX IF NOT EXISTS idx_records_project_id ON records(project_id);
CREATE INDEX IF NOT EXISTS idx_records_option_id ON records(option_id);
CREATE INDEX IF NOT EXISTS idx_records_scenario_id ON records(scenario_id);
CREATE INDEX IF NOT EXISTS idx_records_created_at ON records(created_at DESC);


-- -----------------------------------------------
-- 4. OPTIONAL: ADD VALIDATION CONSTRAINTS
-- -----------------------------------------------

-- Ensure device_type is valid
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'records_device_type_check'
  ) THEN
    ALTER TABLE records 
    ADD CONSTRAINT records_device_type_check 
    CHECK (device_type IN ('pc', 'vr'));
  END IF;
END $$;

-- Ensure record_url is not null (it's required)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'records' 
    AND column_name = 'record_url' 
    AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE records 
    ALTER COLUMN record_url SET NOT NULL;
  END IF;
END $$;

-- Ensure length_ms is positive
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'records_length_ms_check'
  ) THEN
    ALTER TABLE records 
    ADD CONSTRAINT records_length_ms_check 
    CHECK (length_ms IS NULL OR length_ms > 0);
  END IF;
END $$;


-- -----------------------------------------------
-- 5. VERIFY FINAL STATE
-- -----------------------------------------------

-- Verify RLS policies on records table
-- SELECT policyname, roles, cmd FROM pg_policies WHERE tablename = 'records';

-- Verify storage policies
-- SELECT name, definition FROM storage.policies WHERE bucket_id = 'projects';

-- Verify table constraints
-- SELECT constraint_name, constraint_type FROM information_schema.table_constraints WHERE table_name = 'records';


-- ================================================
-- ROLLBACK INSTRUCTIONS (if needed)
-- ================================================

-- To restore anon write access (NOT RECOMMENDED):
-- CREATE POLICY "Public users can create records"
-- ON records FOR INSERT
-- TO anon
-- WITH CHECK (true);
