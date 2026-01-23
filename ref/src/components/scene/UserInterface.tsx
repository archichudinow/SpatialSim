import { useAppState } from '../../AppState';
import { useInsightsStore } from '../../modules/insights/insightsStore';
import { useHeatmapStore } from '../../modules/heatmap/heatmapStore';
import { useVisualizationStore } from '../../modules/drawing/visualizationStore';
import { useControls, button, buttonGroup } from 'leva';
import { useMemo } from 'react';

export default function UserInterface() {
  const togglePlay = useAppState((s) => s.actions.playback.togglePlay);
  const pause = useAppState((s) => s.actions.playback.pause);
  const setTime = useAppState((s) => s.actions.playback.setTime);
  const speed = useAppState((s) => s.playback.speed);
  const setSpeed = useAppState((s) => s.actions.playback.setSpeed);

  const filter = useAppState((s) => s.simulation.filter);
  const setFilter = useAppState((s) => s.actions.simulation.setFilter);

  const agentFilter = useAppState((s) => s.simulation.agentFilter);
  const setAgentFilter = useAppState((s) => s.actions.simulation.setAgentFilter);

  const rawData = useAppState((s) => s.data.raw);
  
  // Heatmap state from dedicated store
  const activeLayer = useHeatmapStore((s) => s.activeLayer);
  const setActiveLayer = useHeatmapStore((s) => s.setActiveLayer);

  // Visualization state from dedicated store
  const lookAtLines = useVisualizationStore((s) => s.lookAtLines);
  const setLookAtLines = useVisualizationStore((s) => s.setLookAtLines);

  const lookAtPoints = useVisualizationStore((s) => s.lookAtPoints);
  const setLookAtPoints = useVisualizationStore((s) => s.setLookAtPoints);

  const showTrail = useVisualizationStore((s) => s.showTrail);
  const setShowTrail = useVisualizationStore((s) => s.setShowTrail);

  const currentTime = useAppState((s) => s.playback.time);
  const maxTime = useAppState((s) => s.playback.maxTime);

  // Insights window from separate store
  const setInsightsWindowOpen = useInsightsStore(s => s.setInsightsWindowOpen);
  const showInsightsVisualization = useInsightsStore(s => s.showInsightsVisualization);
  const setShowInsightsVisualization = useInsightsStore(s => s.setShowInsightsVisualization);
  const showObservers = useInsightsStore(s => s.showObservers);
  const setShowObservers = useInsightsStore(s => s.setShowObservers);

  const scenarioOptions = {
    ALL: 'ALL',
    S1A: 'S1A',
    S1B: 'S1B',
    S2: 'S2',
    S3: 'S3',
    S4: 'S4',
  };

  // Dynamically generate agent options from loaded data
  const agentOptions = useMemo(() => {
    if (!rawData || rawData.length === 0) {
      return { ALL: 'ALL' } as Record<string, string>;
    }
    
    const options: Record<string, string> = { ALL: 'ALL' };
    rawData.forEach((agent) => {
      const label = `${agent.meta.participant}_${agent.meta.scenario}`;
      options[label] = label;
    });
    
    return options;
  }, [rawData]);

  // Check if simulation has finished
  const isSimulationFinished = useMemo(() => {
    return maxTime > 0 && currentTime >= maxTime * 0.99;
  }, [currentTime, maxTime]);

  useControls(() => ({
    "Run / Pause": button(() => {
      togglePlay();
    }, { disabled: isSimulationFinished }),
    "Reset Simulation": button(() => {
      pause(); // Stop playback
      setTime(0); // Time jump to 0 triggers automatic reset detection in modules
    }),
    "Insights": button(() => {
      setInsightsWindowOpen(true);
    }),
    "Speed": buttonGroup({
      '1.0x': () => {
        setSpeed(1.0);
      },
      '2.0x': () => {
        setSpeed(2.0);
      },
      '4.0x': () => {
        setSpeed(4.0);
      },
      '8.0x': () => {
        setSpeed(10.0);
      },
    }),
    Agent: {
      value: agentFilter === null ? 'ALL' : (rawData?.[agentFilter] ? `${rawData[agentFilter].meta.participant}_${rawData[agentFilter].meta.scenario}` : 'ALL'),
      options: agentOptions,
      onChange: (v) => {
        if (!rawData) return;
        const currentValue = agentFilter === null ? 'ALL' : (rawData[agentFilter] ? `${rawData[agentFilter].meta.participant}_${rawData[agentFilter].meta.scenario}` : 'ALL');
        
        // Only reset time if user actually changed the selection
        if (v === currentValue) {
          return; // No actual change, just a re-render
        }
        
        if (v === 'ALL') {
          setAgentFilter(null);
        } else {
          // Find the agent index by label
          const index = rawData.findIndex(agent => 
            `${agent.meta.participant}_${agent.meta.scenario}` === v
          );
          setAgentFilter(index >= 0 ? index : null);
        }
      },
    },
    Scenario: {
      value: filter.length === 0 ? 'ALL' : filter[0],
      options: scenarioOptions,
      onChange: (v) => {
        const currentValue = filter.length === 0 ? 'ALL' : filter[0];
        
        // Only update if value actually changed
        if (v === currentValue) {
          return; // No actual change, just a re-render
        }
        
        setFilter(v === 'ALL' ? [] : [v]);
      },
    },
    "Heatmap Layer": {
      value: activeLayer,
      options: {
        'None': 'none',
        'Position': 'position',
        'Look-At': 'lookat',
        'Linger': 'linger',
        'Scan': 'scan',
        'Pause': 'pause'
      },
      onChange: (v) => {
        if (v === activeLayer) return;
        setActiveLayer(v);
      },
    },
    "Show Vectors": {
      value: lookAtLines,
      onChange: (v) => setLookAtLines(v),
    },
    "Show Points": {
      value: lookAtPoints,
      onChange: (v) => setLookAtPoints(v),
    },
    "Show Trail": {
      value: showTrail,
      onChange: (v) => setShowTrail(v),
    },
    "Show Insights": {
      value: showInsightsVisualization,
      onChange: (v) => setShowInsightsVisualization(v),
    },
    "Show Observers": {
      value: showObservers,
      onChange: (v) => setShowObservers(v),
    },
  }), [speed, filter, agentFilter, agentOptions, rawData, activeLayer, showObservers, isSimulationFinished]);

  return null;
}
