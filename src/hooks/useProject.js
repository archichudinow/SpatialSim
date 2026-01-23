import { useState, useEffect } from 'react';
import DatabaseService from '../utils/databaseService';

/**
 * Hook to load and manage project data
 * @param {string|null} projectId - Project UUID from URL, or null to list all projects
 * @returns {Object} Project data, loading state, and utility functions
 */
export function useProject(projectId = null) {
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  const loadProjectData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (projectId) {
        // Load specific project
        const { data, error: fetchError } = await DatabaseService.getProject(projectId);
        
        if (fetchError) {
          throw new Error(`Failed to load project: ${fetchError.message}`);
        }
        
        if (!data) {
          throw new Error('Project not found');
        }
        
        setProject(data);
        setProjects([]);
      } else {
        // Load all projects for list view
        const { data, error: fetchError } = await DatabaseService.getProjects();
        
        if (fetchError) {
          throw new Error(`Failed to load projects: ${fetchError.message}`);
        }
        
        setProjects(data || []);
        setProject(null);
      }
    } catch (err) {
      console.error('Error loading project data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Add a new recording to the current project
   * @param {string} recordUrl - URL of the recording
   */
  const addRecord = async (recordUrl) => {
    if (!projectId) {
      console.error('Cannot add record without a project ID');
      return { success: false, error: 'No project loaded' };
    }

    try {
      const { data, error: updateError } = await DatabaseService.addRecordToProject(
        projectId,
        recordUrl
      );

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setProject(data);
      return { success: true, data };
    } catch (err) {
      console.error('Error adding record:', err);
      return { success: false, error: err.message };
    }
  };

  /**
   * Reload the current project data
   */
  const reload = () => {
    loadProjectData();
  };

  return {
    project,
    projects,
    loading,
    error,
    addRecord,
    reload,
    // Computed properties
    hasContextModel: project?.models_context != null,
    hasProjectModel: project?.models_project != null,
    hasHeatmapModel: project?.models_heatmap != null,
    recordCount: project?.records?.length || 0,
  };
}

export default useProject;
