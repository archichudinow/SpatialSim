/**
 * Project Selection Page
 * Displays list of available projects when no project is selected in URL
 */
import { useEffect, useState } from 'react';
import { fetchProjectList, ProjectListItem } from '../services/projectService';

export default function ProjectSelectionPage() {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProjects() {
      try {
        setLoading(true);
        const projectList = await fetchProjectList();
        setProjects(projectList);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load projects');
      } finally {
        setLoading(false);
      }
    }

    loadProjects();
  }, []);

  const handleProjectSelect = (projectId: string) => {
    // Navigate to project URL using UUID
    window.location.href = `/${projectId}`;
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
              {projects.map((project) => (
                <button
                  key={project.id}
                  onClick={() => handleProjectSelect(project.id)}
                  className="group bg-bg-secondary/50 hover:bg-bg-tertiary rounded p-6 text-left transition-all duration-200 border border-border-light hover:border-border"
                >
                  <h3 className="text-lg font-normal text-text-primary mb-2">
                    {project.name}
                  </h3>
                  {project.description && (
                    <p className="text-text-muted text-sm line-clamp-2">
                      {project.description}
                    </p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
}
