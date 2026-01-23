import { useState, useMemo, useEffect, useRef } from 'react';
import { useAppState } from '../../../AppState';
import { useInsightsStore } from '../insightsStore';
import { useDraggable } from './useDraggable';
import { DEFAULT_TOLERANCE_CONFIG } from '../core/toleranceEngine';
import { DEFAULT_DETECTION_CONFIG } from '../core/detectionConfig';
import { exportAllTimelinesToPDF, exportComprehensiveReport } from '../utils/exportPDF';
import { TimelineHeader } from './timeline/TimelineHeader';
import { TimelineFilters } from './timeline/TimelineFilters';
import { TimelineLegend } from './timeline/TimelineLegend';
import { TimelineSettings } from './timeline/TimelineSettings';
import { TimelineView } from './timeline/TimelineView';
import { getEventColor } from '../../../config/visualizationConfig';

/**
 * PanelTimeline
 * Visualizes event timelines for all agents in a compact ASCII-style view
 */
export function PanelTimeline({ embedded = false }) {
  // Insights state from separate store
  const stateManager = useInsightsStore(s => s.stateManager);
  const observers = useInsightsStore(s => s.observers);
  const insightsEnabled = useInsightsStore(s => s.insightsEnabled);
  const selectedEventType = useInsightsStore(s => s.selectedEventType);
  const setSelectedEventType = useInsightsStore(s => s.setSelectedEventType);
  
  // Playback state from global AppState
  const maxTime = useAppState(s => s.playback.maxTime);
  const currentTime = useAppState(s => s.playback.time);
  const rawData = useAppState(s => s.data.raw);
  
  const [collapsed, setCollapsed] = useState(false);
  const [selectedObserver, setSelectedObserver] = useState('all');
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [toleranceConfig, setToleranceConfig] = useState(DEFAULT_TOLERANCE_CONFIG);
  const [detectionConfig, setDetectionConfig] = useState(DEFAULT_DETECTION_CONFIG);
  const barHeight = 15; // Fixed minimum size
  
  // Track stateManager changes for real-time updates
  const stateManagerRefSize = useRef(0);
  const stateManagerRefAgentCount = useRef(0);
  const lastValidTimelineDataRef = useRef<any[]>([]);
  
  const { position, dragHandleProps, isDragging: _isDragging } = useDraggable({ x: 10, y: window.innerHeight - 410 });
  
  // Smart update: Watch for real-time changes in stateManager without constant polling
  useEffect(() => {
    // Don't run the interval if panel is collapsed, embedded but not visible, or insights disabled
    if (!stateManager || collapsed || !insightsEnabled) return;
    
    const checkForUpdates = () => {
      if (collapsed || !insightsEnabled) return; // Early exit if collapsed or insights disabled
      try {
        // Count total events across all agents
        let totalEventCount = 0;
        let agentCount = 0;
        
        for (const [, agentObservers] of stateManager.completedEvents.entries()) {
          agentCount++;
          for (const [, events] of agentObservers.entries()) {
            totalEventCount += (Array.isArray(events) ? events.length : 0);
          }
        }
        
        // If event count or agent count changed, trigger an update
        if (totalEventCount !== stateManagerRefSize.current || agentCount !== stateManagerRefAgentCount.current) {
          stateManagerRefSize.current = totalEventCount;
          stateManagerRefAgentCount.current = agentCount;
          setUpdateTrigger(prev => prev + 1);
        }
      } catch (error) {
        // Silently handle update check errors
      }
    };
    
    // Check for updates every 500ms (reduced from 100ms to improve performance)
    const interval = setInterval(checkForUpdates, 500);
    return () => clearInterval(interval);
  }, [stateManager, insightsEnabled, collapsed]);
  
  // Sync tolerance config from state manager
  useEffect(() => {
    if (stateManager && stateManager.toleranceEngine) {
      setToleranceConfig({ ...stateManager.toleranceEngine.config });
    }
    // Sync detection config from insightsStore
    if (stateManager && (stateManager as any).detectionConfig) {
      setDetectionConfig({ ...(stateManager as any).detectionConfig });
    }
  }, [stateManager]);
  
  // Trigger timeline update when tolerance config changes
  useEffect(() => {
    // Force timeline re-computation by updating trigger
    setUpdateTrigger(prev => prev + 1);
  }, [toleranceConfig]);
  
  // Inject Leva-style slider CSS
  useEffect(() => {
    const styleId = 'leva-slider-style';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        .leva-slider {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 2px;
          background: #2b2d30;
          outline: none;
        }
        
        .leva-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: #007bff;
          cursor: pointer;
        }
        
        .leva-slider::-moz-range-thumb {
          width: 8px;
          height: 8px;
          border-radius: 2px;
          background: #007bff;
          cursor: pointer;
          border: none;
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  // State types available
  const stateTypes = [
    'pause', 'linger', 'rush', 'walk',
    'scan', 'focus', 'look_up', 'look_down',
    'attend', 'occupy',
    'noticed', 'entered'
  ];

  // Get timeline data - skip expensive calculation when collapsed
  const timelineData = useMemo(() => {
    if (!stateManager) {
      // Return cached data if available, empty array otherwise
      return lastValidTimelineDataRef.current;
    }
    
    // Skip calculation when collapsed - return cached data
    if (collapsed && lastValidTimelineDataRef.current.length > 0) {
      return lastValidTimelineDataRef.current;
    }

    const data: any[] = [];
    const agentIds = Array.from(stateManager.completedEvents.keys());

    for (const agentId of agentIds) {
      let observerIds = [];
      
      if (selectedObserver === 'all') {
        // Get all observers for this agent
        const agentObservers = stateManager.completedEvents.get(agentId);
        if (agentObservers) {
          observerIds = Array.from(agentObservers.keys());
        }
      } else {
        observerIds = [selectedObserver];
      }

      for (const observerId of observerIds) {
        const allEvents = stateManager.getProcessedEvents(agentId, observerId, selectedEventType);
        
        if (allEvents && allEvents.length > 0) {
          // Find agent's max time from meta.duration
          let agentMaxTime = maxTime;
          if (rawData && rawData.length > 0) {
            // Extract numeric ID from "agent_X" string format
            const numericId = typeof agentId === 'string' ? parseInt(agentId.split('_')[1]) : agentId;
            const agent = rawData.find(a => a.id === numericId);
            let duration = agent?.meta?.duration;
            if (!duration || isNaN(duration) || duration <= 0) {
              duration = maxTime;
            }
            agentMaxTime = duration;
          }
          
          // Filter events to only show those within agent's recording range
          const events = allEvents.filter(event => {
            const eventStart = event.start_time || event.time || 0;
            return eventStart <= agentMaxTime;
          });
          
          // Only add if there are still events after filtering
          if (events.length > 0) {
            data.push({
              agentId,
              observerId,
              events,
              agentMaxTime
            });
          }
        }
      }
    }

    // Cache valid data only if we have results
    if (data.length > 0) {
      lastValidTimelineDataRef.current = data;
    }
    
    return data;
  }, [stateManager, selectedEventType, selectedObserver, rawData, maxTime, updateTrigger, currentTime]);

  // Get color for state type
  const getStateColor = getEventColor;

  // Get unique observer IDs
  const observerIds = useMemo(() => {
    const ids = new Set(['all']);
    observers.forEach(o => ids.add(o.id));
    if (stateManager) {
      for (const [, agentObservers] of stateManager.completedEvents.entries()) {
        for (const observerId of agentObservers.keys()) {
          ids.add(observerId);
        }
      }
    }
    return Array.from(ids);
  }, [observers, stateManager]);

  return (
    <div 
      className={`
        ${embedded ? 'relative' : 'absolute'} 
        ${embedded ? 'w-full' : 'w-[600px]'} 
        ${embedded ? '' : 'max-h-[400px]'} 
        ${embedded ? 'bg-transparent' : 'bg-bg-overlay'} 
        ${embedded ? 'border-none' : 'border border-border'} 
        ${embedded ? 'rounded-none' : 'rounded-md'} 
        ${embedded ? 'p-0' : 'p-2.5'} 
        text-text-primary font-mono text-sm z-[1000] flex flex-col
      `}
      style={{
        left: embedded ? 'auto' : `${position.x}px`,
        top: embedded ? 'auto' : `${position.y}px`,
      }}
    >
      {/* Header */}
      {!embedded && (
        <TimelineHeader
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
          onExportAll={() => exportAllTimelinesToPDF(stateManager, observers, maxTime, 'SpatialLens')}
          onExportReport={() => exportComprehensiveReport(stateManager, observers, maxTime, 'SpatialLens')}
          dragHandleProps={dragHandleProps}
        />
      )}

      {!collapsed && (
        <>
          {/* Controls */}
          <TimelineFilters
            selectedStateType={selectedEventType}
            selectedObserver={selectedObserver}
            stateTypes={stateTypes}
            observerIds={Array.from(observerIds)}
            onChangeStateType={setSelectedEventType}
            onChangeObserver={setSelectedObserver}
          />

          {/* Legend */}
          <TimelineLegend
            selectedStateType={selectedEventType}
            getStateColor={getStateColor}
          />

          {/* Tolerance Settings - Collapsible */}
          <TimelineSettings
            selectedStateType={selectedEventType}
            detectionConfig={detectionConfig}
            setDetectionConfig={setDetectionConfig}
            toleranceConfig={toleranceConfig}
            setToleranceConfig={setToleranceConfig}
            stateManager={stateManager}
          />

          {/* Timeline Visualization */}
          <TimelineView
            timelineData={timelineData}
            selectedStateType={selectedEventType}
            selectedObserver={selectedObserver}
            maxTime={maxTime}
            currentTime={currentTime}
            barHeight={barHeight}
            getStateColor={getStateColor}
          />
        </>
      )}
    </div>
  );
}
