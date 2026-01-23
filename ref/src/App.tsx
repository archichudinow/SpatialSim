import { useEffect, useState } from 'react';
import { useAppState } from './AppState';
import { Canvas } from '@react-three/fiber'
import { PROJECT_CONFIG, updateProjectConfig } from './config/projectConfig';
import { useInsightsStore } from './modules/insights/insightsStore';
import { EVENT_TYPES } from './config/eventTypes';
import { getProjectIdFromURL, fetchProjectById, fetchProjectByName, isUUID } from './services/projectService';

// Error Handling
import { ErrorBoundary } from './components/ErrorBoundary';

// Pages
import ProjectSelectionPage from './components/ProjectSelectionPage';

// Loaders
import LoadingScreen from './components/LoadingScreen';
import LoadAgentData from './components/loaders/LoadAgentData';
import LoadHeatmapModel from './components/loaders/LoadHeatmapModel';
import LoadVisualizationModel from './components/loaders/LoadVisualizationModel';

// Playback
import PlaybackEngine from './components/playback/PlaybackEngine';

// Scene
import SceneSetup from './components/scene/SceneSetup';
import SimulateAgents from './components/scene/SimulateAgents';
import UserInterface from './components/scene/UserInterface';

// Modules
import InsightsModule from './modules/insights/InsightsModule';
import MainWindow from './modules/insights/ui/MainWindow';
import ViewportContextMenu from './modules/insights/components/ViewportContextMenu';
import ObserverSettingsContextMenu from './modules/insights/components/ObserverSettingsContextMenu';
import HeatmapModule from './modules/heatmap/HeatmapModule';
import DrawingModule from './modules/drawing/DrawingModule';

export default function App() {
  const [projectLoaded, setProjectLoaded] = useState(false);
  const [projectError, setProjectError] = useState<string | null>(null);
  const [showProjectSelection, setShowProjectSelection] = useState(false);

  // Load project configuration from URL on mount
  useEffect(() => {
    async function loadProjectConfig() {
      const projectIdentifier = getProjectIdFromURL();
      
      // No project in URL - show selection page
      if (!projectIdentifier) {
        console.log('No project identifier in URL, showing selection page');
        setShowProjectSelection(true);
        return;
      }

      console.log('Loading project:', projectIdentifier);

      try {
        // Try to fetch by UUID first, then by name for backward compatibility
        let projectData = null;
        
        if (isUUID(projectIdentifier)) {
          console.log('Fetching project by UUID');
          projectData = await fetchProjectById(projectIdentifier);
        } else {
          console.log('Fetching project by name (legacy)');
          projectData = await fetchProjectByName(projectIdentifier);
        }
        
        if (!projectData) {
          setProjectError(`Project "${projectIdentifier}" not found`);
          return;
        }

        console.log('Project loaded successfully:', projectData.name);
        // Update the global project configuration
        updateProjectConfig(projectData);
        setProjectLoaded(true);
      } catch (error) {
        console.error('Error loading project:', error);
        setProjectError(error instanceof Error ? error.message : 'Failed to load project');
      }
    }

    loadProjectConfig();
  }, []);

  // Show project selection page if no project in URL
  if (showProjectSelection) {
    return <ProjectSelectionPage />;
  }

  // Show error if project loading failed
  if (projectError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-white text-3xl font-bold mb-4">Project Load Error</h1>
          <p className="text-gray-300 mb-6">{projectError}</p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Back to Projects
          </button>
        </div>
      </div>
    );
  }

  // Wait for project config to load before rendering the app
  if (!projectLoaded) {
    return <LoadingScreen visible={true} />;
  }

  return <ProjectApp />;
}

function ProjectApp() {
  const isLoadedData = useAppState((state) => state.data.isLoadedData);
  const isLoadedModel = useAppState((state) => state.data.isLoadedModel);
  const isLoadedContextModel = useAppState((state) => state.data.isLoadedContextModel);
  const isLoadedMetroModel = useAppState((state) => state.data.isLoadedMetroModel);
  
  // Calculate loading state - only check for models that are expected
  const isLoading = !isLoadedData || 
    (!isLoadedModel && PROJECT_CONFIG.heatmapModel !== null) ||  // Only wait for heatmap if it exists
    (PROJECT_CONFIG.features.contextModel && !isLoadedContextModel) || 
    (PROJECT_CONFIG.features.metroModel && !isLoadedMetroModel);

  console.log('📊 Loading state:', {
    isLoadedData,
    isLoadedModel,
    isLoadedContextModel,
    expectsHeatmap: !!PROJECT_CONFIG.heatmapModel,
    expectsContext: PROJECT_CONFIG.features.contextModel,
    isLoading
  });

  // Get filtered agents and current time for all modules
  const filteredAgents = useAppState((state) => state.simulation.filteredAgents);
  const currentTime = useAppState((state) => state.playback.time);
  const maxTime = useAppState((state) => state.playback.maxTime);
  const positionBuffer = useAppState((state) => state.simulation.positionBuffer);
  const lookAtBuffer = useAppState((state) => state.simulation.lookAtBuffer);
  
  // Get event buffers from insights store to pass to heatmap
  const eventBuffers = useInsightsStore((state) => state.eventBuffers);

  return (
    <>
    <LoadingScreen 
      visible={isLoading}
      projectName={PROJECT_CONFIG.name}
      projectDescription={PROJECT_CONFIG.description}
    />
    <ErrorBoundary moduleName="DataLoader">
      <LoadAgentData />
      {PROJECT_CONFIG.heatmapModel && <LoadHeatmapModel url={PROJECT_CONFIG.heatmapModel} />}
    </ErrorBoundary>

    {PROJECT_CONFIG.features.insightsUI && <MainWindow />}
    {PROJECT_CONFIG.features.insights && <ViewportContextMenu />}
    {PROJECT_CONFIG.features.insights && <ObserverSettingsContextMenu />}

    <Canvas 
      gl={{ 
        antialias: true,
        powerPreference: 'high-performance', // Request discrete GPU (NVIDIA) instead of integrated
        alpha: false // Disable transparency for better performance
      }}
      dpr={[1, 2]} // Limit device pixel ratio to max 2x
    >

      <SceneSetup />
      <PlaybackEngine />
      <UserInterface />
      
      {PROJECT_CONFIG.features.contextModel && PROJECT_CONFIG.visualizationModels[0] && (
        <ErrorBoundary moduleName="LoadVisualizationModel" inCanvas={true}>
          <LoadVisualizationModel url={PROJECT_CONFIG.visualizationModels[0]} useCheapShader={true} />
        </ErrorBoundary>
      )}
      
      <ErrorBoundary moduleName="SimulateAgents">
        <SimulateAgents agents={filteredAgents} />
      </ErrorBoundary>
      
      {PROJECT_CONFIG.features.insights && (
        <ErrorBoundary moduleName="InsightsModule" inCanvas={true}>
          <InsightsModule
            agents={filteredAgents}
            currentTime={currentTime}
            maxTime={maxTime}
            positionBuffer={positionBuffer}
            lookAtBuffer={lookAtBuffer}
          />
        </ErrorBoundary>
      )}
      
      {PROJECT_CONFIG.features.heatmap && (
      <ErrorBoundary moduleName="HeatmapModule" inCanvas={true}>
        {/* Position layer - uses default positionBuffer */}
        <HeatmapModule
          id="position"
          agents={filteredAgents}
          currentTime={currentTime}
          positionBuffer={positionBuffer}
          lookAtBuffer={lookAtBuffer}
          usePlaneGeometry={true}
          gradientStyle="smooth"
          radius={3.0}
          targetVertexCount={PROJECT_CONFIG.heatmap.targetVertexCount}
        />
        
        {/* Look-at layer - uses GLB mesh for vertical surfaces */}
        <HeatmapModule
          id="lookat"
          agents={filteredAgents}
          currentTime={currentTime}
          positionBuffer={positionBuffer}
          lookAtBuffer={lookAtBuffer}
          usePlaneGeometry={false}  // Use GLB mesh
          gradientStyle="smooth"
          radius={3.0}
        />
        
        {/* Event-based layers - dynamically rendered from registry */}
        {Object.values(EVENT_TYPES).map((eventType) => (
          <HeatmapModule
            key={eventType.name}
            id={eventType.name}
            agents={filteredAgents}
            currentTime={currentTime}
            positionBuffer={positionBuffer}
            lookAtBuffer={lookAtBuffer}
            eventData={eventBuffers[eventType.name] as any}
            usePlaneGeometry={true}
            gradientStyle={eventType.defaultConfig.gradient}
            radius={eventType.defaultConfig.radius}
            targetVertexCount={PROJECT_CONFIG.heatmap.targetVertexCount}
          />
        ))}
      </ErrorBoundary>
      )}
      
      {PROJECT_CONFIG.features.drawing && (
      <ErrorBoundary moduleName="DrawingModule" inCanvas={true}>
        <DrawingModule
          agents={filteredAgents}
          currentTime={currentTime}
          positionBuffer={positionBuffer}
          lookAtBuffer={lookAtBuffer}
        />
      </ErrorBoundary>
      )}


    </Canvas>
    </>
  );
}