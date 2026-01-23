import { supabase, TABLES } from './supabaseClient';

/**
 * Database service for managing projects and records
 */
export class DatabaseService {
  /**
   * Get all projects
   * @returns {Promise<Array>} List of projects
   */
  static async getProjects() {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single project by ID
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Project data
   */
  static async getProject(projectId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .eq('id', projectId)
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching project:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project information
   * @param {string} projectData.name - Project name
   * @param {string} [projectData.description] - Project description
   * @param {string} [projectData.models_context] - URL to context model
   * @param {string} [projectData.models_project] - URL to project model
   * @param {string} [projectData.models_heatmap] - URL to heatmap model
   * @param {string} [projectData.spatial_lens_url] - SpatialLens URL
   * @param {string} [projectData.spatial_sim_url] - SpatialSim URL
   * @returns {Promise<Object>} Created project
   */
  static async createProject(projectData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .insert([{
          ...projectData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating project:', error);
      return { data: null, error };
    }
  }

  /**
   * Update an existing project
   * @param {string} projectId - Project UUID
   * @param {Object} updates - Fields to update
   * @returns {Promise<Object>} Updated project
   */
  static async updateProject(projectId, updates) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECTS)
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', projectId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error updating project:', error);
      return { data: null, error };
    }
  }

  /**
   * Delete a project
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Deletion result
   */
  static async deleteProject(projectId) {
    try {
      const { error } = await supabase
        .from(TABLES.PROJECTS)
        .delete()
        .eq('id', projectId);

      if (error) throw error;
      return { data: true, error: null };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { data: null, error };
    }
  }

  /**
   * Add a record reference to a project
   * @param {string} projectId - Project UUID
   * @param {string} recordUrl - URL or reference to the recording
   * @returns {Promise<Object>} Updated project
   */
  static async addRecordToProject(projectId, recordUrl) {
    try {
      // First get the current project
      const { data: project, error: fetchError } = await this.getProject(projectId);
      if (fetchError) throw fetchError;

      // Add the new record to the records array
      const currentRecords = project.records || [];
      const updatedRecords = [...currentRecords, recordUrl];

      // Update the project
      return await this.updateProject(projectId, { records: updatedRecords });
    } catch (error) {
      console.error('Error adding record to project:', error);
      return { data: null, error };
    }
  }

  /**
   * Update model URLs for a project
   * @param {string} projectId - Project UUID
   * @param {Object} models - Model URLs
   * @param {string} [models.context] - Context model URL
   * @param {string} [models.project] - Project model URL
   * @param {string} [models.heatmap] - Heatmap model URL
   * @returns {Promise<Object>} Updated project
   */
  static async updateProjectModels(projectId, models) {
    try {
      const updates = {};
      if (models.context) updates.models_context = models.context;
      if (models.project) updates.models_project = models.project;
      if (models.heatmap) updates.models_heatmap = models.heatmap;

      return await this.updateProject(projectId, updates);
    } catch (error) {
      console.error('Error updating project models:', error);
      return { data: null, error };
    }
  }
}

export default DatabaseService;
