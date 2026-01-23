import { useState, useEffect } from 'react';
import { Scene } from './components/Scene';
import { ProjectList } from './components/ProjectList';
import { ErrorBoundary } from './components/ErrorBoundary';
import { useProjectId } from './hooks/useNavigation';
import { useProject } from './hooks/useProject';
import './App.css';

function App() {
  const [projectId, setProjectId] = useState(useProjectId());

  // Listen for navigation changes
  useEffect(() => {
    const handleNavigation = () => {
      setProjectId(useProjectId());
    };

    window.addEventListener('popstate', handleNavigation);
    return () => window.removeEventListener('popstate', handleNavigation);
  }, []);

  // Load project data
  const { project, projects, loading, error, addRecord } = useProject(projectId);

  // If projectId exists, show Scene with loaded project
  if (projectId) {
    return (
      <ErrorBoundary>
        <Scene 
          project={project} 
          loading={loading} 
          error={error}
          onAddRecord={addRecord}
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
