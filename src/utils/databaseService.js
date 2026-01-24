import { supabase, TABLES } from './supabaseClient';

/**
 * Database service for managing projects, options, scenarios, and records
 */
export class DatabaseService {
  /**
   * Get all projects (excluding archived) with their options and scenarios
   * @param {boolean} includeArchived - Include archived projects
   * @returns {Promise<Array>} List of projects with nested data
   */
  static async getProjects(includeArchived = false) {
    try {
      let query = supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .order('created_at', { ascending: false });

      if (!includeArchived) {
        // Only show development and released projects
        query = query.in('status', ['development', 'released']);
      }

      const { data: projects, error } = await query;

      if (error) throw error;

      // Load options and scenarios for each project
      const projectsWithData = await Promise.all(
        (projects || []).map(async (project) => {
          const { data: options, error: optionsError } = await supabase
            .from(TABLES.PROJECT_OPTIONS)
            .select('*')
            .eq('project_id', project.id)
            .eq('is_archived', false)
            .order('created_at', { ascending: true });

          if (optionsError) {
            console.error('Error loading options:', optionsError);
            return { ...project, options: [] };
          }

          // Load scenarios for each option
          const optionsWithScenarios = await Promise.all(
            (options || []).map(async (option) => {
              const { data: scenarios, error: scenariosError } = await supabase
                .from(TABLES.SCENARIOS)
                .select('*')
                .eq('option_id', option.id)
                .eq('is_archived', false)
                .order('created_at', { ascending: true });

              if (scenariosError) {
                console.error('Error loading scenarios:', scenariosError);
                return { ...option, scenarios: [] };
              }

              return { ...option, scenarios: scenarios || [] };
            })
          );

          return { ...project, options: optionsWithScenarios };
        })
      );

      return { data: projectsWithData, error: null };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { data: null, error };
    }
  }

  /**
   * Get a single project by ID with all nested data (options, scenarios, records)
   * @param {string} projectId - Project UUID
   * @returns {Promise<Object>} Project data with full hierarchy
   */
  static async getProject(projectId) {
    try {
      const { data: project, error: projectError } = await supabase
        .from(TABLES.PROJECTS)
        .select('*')
        .eq('id', projectId)
        .single();

      if (projectError) throw projectError;

      // Get options (excluding archived)
      const { data: options, error: optionsError } = await supabase
        .from(TABLES.PROJECT_OPTIONS)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });

      if (optionsError) throw optionsError;

      // Get scenarios and records for each option
      const optionsWithScenarios = await Promise.all(
        (options || []).map(async (option) => {
          const { data: scenarios, error: scenariosError } = await supabase
            .from(TABLES.SCENARIOS)
            .select('*')
            .eq('option_id', option.id)
            .eq('is_archived', false)
            .order('created_at', { ascending: true });

          if (scenariosError) throw scenariosError;

          // Get records for each scenario
          const scenariosWithRecords = await Promise.all(
            (scenarios || []).map(async (scenario) => {
              const { data: records, error: recordsError } = await supabase
                .from(TABLES.RECORDS)
                .select('*')
                .eq('scenario_id', scenario.id)
                .order('created_at', { ascending: false });

              if (recordsError) throw recordsError;

              return { ...scenario, records: records || [] };
            })
          );

          return { ...option, scenarios: scenariosWithRecords };
        })
      );

      return { 
        data: {
          ...project,
          options: optionsWithScenarios
        }, 
        error: null 
      };
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
   * Get options for a project
   * @param {string} projectId - Project UUID
   * @returns {Promise<Array>} List of options
   */
  static async getProjectOptions(projectId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.PROJECT_OPTIONS)
        .select('*')
        .eq('project_id', projectId)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching project options:', error);
      return { data: null, error };
    }
  }

  /**
   * Get scenarios for an option
   * @param {string} optionId - Option UUID
   * @returns {Promise<Array>} List of scenarios
   */
  static async getScenarios(optionId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.SCENARIOS)
        .select('*')
        .eq('option_id', optionId)
        .eq('is_archived', false)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      return { data: null, error };
    }
  }

  /**
   * Get records for a scenario
   * @param {string} scenarioId - Scenario UUID
   * @returns {Promise<Array>} List of records
   */
  static async getRecords(scenarioId) {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECORDS)
        .select('*')
        .eq('scenario_id', scenarioId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error fetching records:', error);
      return { data: null, error };
    }
  }

  /**
   * Create a new record
   * @param {Object} recordData - Record information
   * @param {string} recordData.project_id - Project UUID
   * @param {string} recordData.option_id - Option UUID
   * @param {string} recordData.scenario_id - Scenario UUID
   * @param {string} recordData.record_url - URL to GLB file (required)
   * @param {string} [recordData.raw_url] - URL to CSV file (optional)
   * @param {number} [recordData.length_ms] - Duration in milliseconds
   * @param {string} [recordData.device_type] - Device type ('pc' | 'vr')
   * @returns {Promise<Object>} Created record
   */
  static async createRecord(recordData) {
    try {
      const { data, error } = await supabase
        .from(TABLES.RECORDS)
        .insert([{
          project_id: recordData.project_id,
          option_id: recordData.option_id,
          scenario_id: recordData.scenario_id,
          record_url: recordData.record_url,
          raw_url: recordData.raw_url || null,
          length_ms: recordData.length_ms || null,
          device_type: recordData.device_type || 'pc',
          is_archived: false,
        }])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error('Error creating record:', error);
      return { data: null, error };
    }
  }
}

export default DatabaseService;
