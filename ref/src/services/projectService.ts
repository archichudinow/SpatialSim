/**
 * Project Service
 * Handles fetching project data from Supabase
 */
import { supabase } from './supabaseClient';

export interface ProjectData {
  id: string;
  name: string;
  description: string | null;
  models_context: string | null;
  models_project: string | null;
  models_heatmap: string | null;
  records: string[] | null;
  created_at?: string;
  updated_at?: string;
}

export interface ProjectListItem {
  id: string;
  name: string;
  description: string | null;
}

/**
 * Fetch all projects (id, name and description) for listing
 */
export async function fetchProjectList(): Promise<ProjectListItem[]> {
  console.log('Fetching project list from Supabase...');
  
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description')
    .order('name', { ascending: true });

  if (error) {
    console.error('Error fetching project list:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));
    throw new Error(`Database error: ${error.message || 'Unknown error'}`);
  }

  console.log(`Fetched ${data?.length || 0} projects:`, data);
  return data || [];
}

/**
 * Fetch a single project by UUID
 */
export async function fetchProjectById(projectId: string): Promise<ProjectData | null> {
  console.log(`Fetching project by ID: ${projectId}`);
  
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, models_context, models_project, models_heatmap, records')
    .eq('id', projectId)
    .single();

  if (error) {
    console.error(`Error fetching project "${projectId}":`, error);
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Database error: ${error.message}`);
  }

  console.log('Project data:', data);
  return data;
}

/**
 * Fetch a single project by name (legacy support)
 */
export async function fetchProjectByName(projectName: string): Promise<ProjectData | null> {
  console.log(`Fetching project by name: ${projectName}`);
  
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, description, models_context, models_project, models_heatmap, records')
    .eq('name', projectName)
    .single();

  if (error) {
    console.error(`Error fetching project "${projectName}":`, error);
    if (error.code === 'PGRST116') {
      return null; // Not found
    }
    throw new Error(`Database error: ${error.message}`);
  }

  console.log('Project data:', data);
  return data;
}

/**
 * Get the project ID from the current URL
 * Example: https://spatial-lens-dashboard.vercel.app/abc-123-def -> "abc-123-def"
 * Supports both UUID and name formats for backward compatibility
 */
export function getProjectIdFromURL(): string | null {
  const pathname = window.location.pathname;
  const projectId = pathname.split('/').filter(Boolean)[0]; // Get first path segment
  console.log('Extracted project ID from URL:', projectId);
  return projectId || null;
}

/**
 * Check if a string is a valid UUID format
 */
export function isUUID(str: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
