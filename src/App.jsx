import { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { ProjectList } from './components/ProjectList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useProjectId, useUrlParams } from './hooks/useNavigation';
import { useProject } from './hooks/useProject';
import './App.css';

function App() {
  const [projectId, setProjectId] = useState(useProjectId());
  const urlParams = useUrlParams();

  // Listen for navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      setProjectId(useProjectId());
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Load project data with URL parameters
  const { 
    project, 
    projects, 
    selectedOption, 
    selectedScenario, 
    loading, 
    error, 
    selectOption,
    selectScenario,
    reload 
  } = useProject(projectId, urlParams.optionId, urlParams.scenarioId);

  // If projectId exists, show Scene with loaded project
  if (projectId) {
    return (
      <ErrorBoundary>
        <Scene 
          project={project} 
          selectedOption={selectedOption}
          selectedScenario={selectedScenario}
          loading={loading} 
          error={error}
          onOptionChange={selectOption}
          onScenarioChange={selectScenario}
          onReload={reload}
        />
      </ErrorBoundary>
    );
  }

  // Otherwise, show project list
  return (
    <ErrorBoundary>
      <ProjectList 
        projects={projects} 
        loading={loading} 
        error={error} 
      />
    </ErrorBoundary>
  );
}

export default App;
