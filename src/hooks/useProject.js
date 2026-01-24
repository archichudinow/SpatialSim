import { useState, useEffect } from 'react';
import DatabaseService from '../utils/databaseService';

/**
 * Hook to load and manage project data with full hierarchy (options, scenarios, records)
 * @param {string|null} projectId - Project UUID from URL, or null to list all projects
 * @param {string|null} urlOptionId - Option ID from URL query params
 * @param {string|null} urlScenarioId - Scenario ID from URL query params
 * @returns {Object} Project data, loading state, and utility functions
 */
export function useProject(projectId = null, urlOptionId = null, urlScenarioId = null) {
  const [project, setProject] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadProjectData();
  }, [projectId]);

  // Auto-select option and scenario when project loads
  useEffect(() => {
    if (project && project.options && project.options.length > 0) {
      // Priority: URL param > default option > first option
      let targetOption;
      if (urlOptionId) {
        targetOption = project.options.find(opt => opt.id === urlOptionId);
      }
      if (!targetOption) {
        targetOption = project.options.find(opt => opt.is_default) || project.options[0];
      }
      setSelectedOption(targetOption);

      // Select scenario: URL param > first scenario
      if (targetOption.scenarios && targetOption.scenarios.length > 0) {
        let targetScenario;
        if (urlScenarioId) {
          targetScenario = targetOption.scenarios.find(sc => sc.id === urlScenarioId);
        }
        if (!targetScenario) {
          targetScenario = targetOption.scenarios[0];
        }
        setSelectedScenario(targetScenario);
      } else {
        setSelectedScenario(null);
      }
    } else {
      setSelectedOption(null);
      setSelectedScenario(null);
    }
  }, [project, urlOptionId, urlScenarioId]);

  const loadProjectData = async () => {
    setLoading(true);
    setError(null);

    try {
      if (projectId) {
        // Load specific project with full hierarchy
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
        // Load all projects for list view (excluding archived)
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
   * Select a specific option
   * @param {Object} option - Option object
   */
  const selectOption = (option) => {
    setSelectedOption(option);
    // Auto-select first scenario of new option
    if (option.scenarios && option.scenarios.length > 0) {
      setSelectedScenario(option.scenarios[0]);
    } else {
      setSelectedScenario(null);
    }
  };

  /**
   * Select a specific scenario
   * @param {Object} scenario - Scenario object
   */
  const selectScenario = (scenario) => {
    setSelectedScenario(scenario);
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
    selectedOption,
    selectedScenario,
    loading,
    error,
    selectOption,
    selectScenario,
    reload,
    // Computed properties
    hasContextModel: project?.models_context != null && project.models_context.length > 0,
    hasHeatmapModel: project?.models_heatmap != null,
    hasOptions: project?.options && project.options.length > 0,
    optionCount: project?.options?.length || 0,
    scenarioCount: selectedOption?.scenarios?.length || 0,
    recordCount: selectedScenario?.records?.length || 0,
  };
}

export default useProject;
