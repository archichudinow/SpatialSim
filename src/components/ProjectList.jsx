import { useState } from 'react';
import { useNavigate } from '../hooks/useNavigation';

/**
 * Component to display list of all available projects
 * Shows option and scenario selectors when project has multiple options/scenarios
 */
export function ProjectList({ projects, loading, error }) {
  const navigate = useNavigate();
  const [projectSelections, setProjectSelections] = useState({});

  const handleProjectSelect = (projectId) => {
    navigate(`/${projectId}`);
  };

  const handleOptionChange = (projectId, optionId) => {
    setProjectSelections(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        optionId,
        scenarioId: null, // Reset scenario when option changes
      }
    }));
  };

  const handleScenarioChange = (projectId, scenarioId) => {
    setProjectSelections(prev => ({
      ...prev,
      [projectId]: {
        ...prev[projectId],
        scenarioId,
      }
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t border-b border-border mb-4"></div>
          <p className="text-text-secondary text-sm">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <h1 className="text-text-primary text-xl font-normal mb-3">Error Loading Projects</h1>
          <p className="text-text-secondary text-sm mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-transparent hover:bg-bg-hover text-text-primary text-sm border border-border-light rounded transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-normal text-text-primary mb-8">Select Project</h1>
        </div>

        {/* Projects Grid */}
        <div className="max-w-6xl mx-auto">
          {projects.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-text-muted text-base">No projects available</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project) => <ProjectCard 
                key={project.id} 
                project={project}
                selection={projectSelections[project.id]}
                onOptionChange={handleOptionChange}
                onScenarioChange={handleScenarioChange}
                onSelect={handleProjectSelect}
              />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project, selection, onOptionChange, onScenarioChange, onSelect }) {
  // Get active (non-archived) options
  const activeOptions = project.options?.filter(opt => !opt.is_archived) || [];
  
  // Determine selected option (or default)
  const selectedOptionId = selection?.optionId || 
    activeOptions.find(opt => opt.is_default)?.id || 
    activeOptions[0]?.id;
  
  const selectedOption = activeOptions.find(opt => opt.id === selectedOptionId);
  
  // Get active scenarios for selected option
  const activeScenarios = selectedOption?.scenarios?.filter(sc => !sc.is_archived) || [];
  
  // Determine selected scenario
  const selectedScenarioId = selection?.scenarioId || activeScenarios[0]?.id;
  
  const needsOptionSelector = activeOptions.length > 1;
  const needsScenarioSelector = activeScenarios.length > 1;
  const canRun = activeOptions.length > 0 && activeScenarios.length > 0;

  const handleSelectClick = (e) => {
    e.preventDefault();
    if (canRun) {
      // Store selection in sessionStorage for Scene to use
      sessionStorage.setItem(`project_${project.id}_selection`, JSON.stringify({
        optionId: selectedOptionId,
        scenarioId: selectedScenarioId,
      }));
      onSelect(project.id);
    }
  };

  return (
    <div className="group bg-bg-secondary/50 hover:bg-bg-tertiary rounded p-6 border border-border-light hover:border-border transition-all duration-200">
      <h3 className="text-lg font-normal text-text-primary mb-2">
        {project.name}
      </h3>
      {project.description && (
        <p className="text-text-muted text-sm line-clamp-2 mb-3">
          {project.description}
        </p>
      )}
      
      {/* Status Badge */}
      <div className="mb-3">
        <span className={`inline-block text-xs px-2 py-1 rounded ${
          project.status === 'released' 
            ? 'bg-green-500/10 text-green-500' 
            : 'bg-yellow-500/10 text-yellow-500'
        }`}>
          {project.status}
        </span>
      </div>

      {/* Models Status */}
      <div className="mb-3 flex gap-2 text-xs">
        {project.models_context && project.models_context.length > 0 && (
          <span className="text-text-muted">Context</span>
        )}
        {selectedOption?.model_url && (
          <span className="text-text-muted">Model</span>
        )}
        {project.models_heatmap && (
          <span className="text-text-muted">Heatmap</span>
        )}
      </div>

      {/* Option Selector */}
      {needsOptionSelector && (
        <div className="mb-3">
          <label className="block text-xs text-text-muted mb-1">Option:</label>
          <select
            value={selectedOptionId || ''}
            onChange={(e) => onOptionChange(project.id, e.target.value)}
            className="w-full px-2 py-1 text-sm bg-bg-primary border border-border-light rounded text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {activeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Scenario Selector */}
      {needsScenarioSelector && selectedOption && (
        <div className="mb-3">
          <label className="block text-xs text-text-muted mb-1">Scenario:</label>
          <select
            value={selectedScenarioId || ''}
            onChange={(e) => onScenarioChange(project.id, e.target.value)}
            className="w-full px-2 py-1 text-sm bg-bg-primary border border-border-light rounded text-text-primary"
            onClick={(e) => e.stopPropagation()}
          >
            {activeScenarios.map((scenario) => (
              <option key={scenario.id} value={scenario.id}>
                {scenario.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Info Text */}
      {!needsOptionSelector && !needsScenarioSelector && canRun && (
        <p className="text-xs text-text-muted mb-3">
          1 option, 1 scenario
        </p>
      )}

      {/* Start Button */}
      <button
        onClick={handleSelectClick}
        disabled={!canRun}
        className={`w-full px-4 py-2 text-sm rounded transition-colors ${
          canRun
            ? 'bg-transparent hover:bg-bg-hover text-text-primary border border-border-light hover:border-border'
            : 'bg-bg-secondary text-text-muted border border-border-light cursor-not-allowed'
        }`}
      >
        {canRun ? 'Start Project' : 'No options/scenarios available'}
      </button>
    </div>
  );
}

export default ProjectList;
