/**
 * DrawInsights.jsx
 * Visualizes event positions by filtering agent trail points
 * Shows only points where selected event type is active
 */
import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { useAppState } from '../../../AppState';
import { useInsightsStore } from '../insightsStore';
import { VISUALIZATION_TIMING, EVENT_COLORS, getEventColor } from '../../../config/visualizationConfig';
import { getPositionTrack } from '../../../utils/agentUtils';
import { findClosestKeyframe, getPositionAtIndex } from '../../../utils/animationUtils';
import type { AgentData } from '../../../types';

const { SAMPLE_INTERVAL, INSIGHTS_TRAIL_DURATION: TRAIL_DURATION } = VISUALIZATION_TIMING;

interface DrawInsightsProps {
  agents: AgentData[];
  currentTime: number;
}

export default function DrawInsights({ agents, currentTime }: DrawInsightsProps) {
  const stateManager = useInsightsStore(s => s.stateManager);
  const selectedEventType = useInsightsStore(s => s.selectedEventType);
  const observers = useInsightsStore(s => s.observers);
  const showVisualization = useInsightsStore(s => s.showInsightsVisualization);
  const insightsEnabled = useInsightsStore(s => s.insightsEnabled);
  const lastInsightUpdate = useInsightsStore(s => s.lastInsightUpdate);
  
  // Get playback state to check if simulation is at the end
  const playbackTime = useAppState(s => s.playback.time);
  const playbackMaxTime = useAppState(s => s.playback.maxTime);
  const isAtEnd = playbackTime >= playbackMaxTime;
  
  // Store histories per event type: { pause: [...], linger: [...], ... }
  const eventHistories = useRef<Record<string, Record<number, any[]>>>({});
  const pointClouds = useRef<THREE.Points[]>([]);
  const lastRebuildTime = useRef(0);
  const lastToleranceConfig = useRef<string | null>(null);
  const lastCurrentTime = useRef(-1);
  const lastResetTime = useRef(-1);
  const previousEventCount = useRef(0);
  const rebuildThrottle = 0.5; // Rebuild every 0.5 seconds for more responsive updates
  
  // All event types we track
  const allEventTypes = Object.keys(EVENT_COLORS);
  
  // Helper function to clear all visualizations
  const clearAllVisualizations = React.useCallback(() => {
    // Clear all event histories
    Object.keys(eventHistories.current).forEach(eventType => {
      const historyMap = eventHistories.current[eventType as keyof typeof eventHistories.current] as Record<number, any[]>;
      Object.keys(historyMap).forEach((agentId: any) => {
        historyMap[agentId] = [];
      });
    });
    
    // Clear point clouds
    pointClouds.current.forEach((pc: THREE.Points) => {
      if (!pc || !pc.geometry) return;
      const positions = pc.geometry.attributes.position.array;
      for (let i = 0; i < positions.length; i++) {
        positions[i] = 1e6; // Move far away
      }
      pc.geometry.setDrawRange(0, 0);
      pc.geometry.attributes.position.needsUpdate = true;
    });
    previousEventCount.current = 0;
  }, []);
  
  // Initialize trail tracking (like DrawAgentsTrail)
  useEffect(() => {
    if (!agents || agents.length === 0) return;

    // Clear and reinitialize histories for each event type
    // Use agent.id as key instead of array index to handle filtering correctly
    eventHistories.current = {};
    allEventTypes.forEach(eventType => {
      const historyMap: Record<number, any[]> = {};
      agents.forEach(agent => {
        historyMap[agent.id] = [];
      });
      eventHistories.current[eventType] = historyMap;
    });

    // Create circular texture for round points
    const canvas = document.createElement('canvas');
    canvas.width = 32;
    canvas.height = 32;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const gradient = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
      gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 32, 32);
    }
    const circleTexture = new THREE.CanvasTexture(canvas);

    // Create point clouds for each agent
    const pcs = agents.map((_agent: AgentData, _idx: number) => {
      const maxPoints = Math.ceil(TRAIL_DURATION / SAMPLE_INTERVAL);
      const positions = new Float32Array(maxPoints * 3);
      
      // Initialize far away
      for (let i = 0; i < maxPoints * 3; i++) {
        positions[i] = 1e6;
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      geo.setDrawRange(0, 0);

      const color = getEventColor(selectedEventType);
      const mat = new THREE.PointsMaterial({
        size: 6,
        color: color,
        sizeAttenuation: false,
        transparent: true,
        depthTest: true, // Enable depth testing to respect context model
        depthWrite: false,
        map: circleTexture,
        alphaTest: 0.1
      });

      const points = new THREE.Points(geo, mat);
      points.frustumCulled = false; // Never cull these points
      points.renderOrder = 999; // Render last
      
      return points;
    });

    pointClouds.current = pcs;

    return () => {
      circleTexture.dispose();
      pcs.forEach((pc: THREE.Points) => {
        pc.geometry.dispose();
        if (Array.isArray(pc.material)) {
          pc.material.forEach(m => m.dispose());
        } else {
          pc.material.dispose();
        }
      });
    };
  }, [agents]);

  // Function to rebuild visualization from event masks
  const rebuildVisualization = React.useCallback(() => {
    if (!showVisualization) return; // Skip if visualization is hidden
    if (!selectedEventType || !stateManager || !agents) return;
    
    const history = eventHistories.current[selectedEventType] as Record<number, any[]> | undefined;
    if (!history) {
      return;
    }
    
    const globalObserver = { id: 'global' };
    const allObservers = [globalObserver, ...observers];
    
    // Check if this is a point event (noticed, entered)
    const isPointEvent = ['noticed', 'entered'].includes(selectedEventType);
    
    let totalPointsAdded = 0;
    
    // For each agent, get all events and extract positions from animation tracks
    agents.forEach((agent: AgentData, _idx: number) => {
      const agentId = agent.id;
      
      // Get history for this specific agent ID (not filtered index)
      const agentHistory = history[agent.id];
      if (!agentHistory) {
        return;
      }
      
      // Clear existing history
      agentHistory.length = 0;
      
      // Get position track from agent animation
      const positionTrack = getPositionTrack(agent);
      
      if (!positionTrack) {
        return;
      }
      
      const times = positionTrack.times;
      const values = positionTrack.values; // [x, y, z, x, y, z, ...]
      
      // Get all events for this agent across all observers
      const events = [];
      
      for (const observer of allObservers) {
        // For point events, use getRawEvents; for duration events, use getProcessedEvents
        const eventsForObserver = isPointEvent 
          ? stateManager.getRawEvents(agentId, observer.id, selectedEventType)
          : stateManager.getProcessedEvents(agentId, observer.id, selectedEventType);
        
        if (!eventsForObserver || eventsForObserver.length === 0) continue;
        events.push(...eventsForObserver);
      }
      
      if (events.length === 0) {
        return;
      }
      
      if (isPointEvent) {
        // For point events: find the closest position keyframe to each event timestamp
        for (const event of events) {
          const eventTime = event.start_time || event.time || 0;
          
          // Find closest keyframe using utility
          const closestIdx = findClosestKeyframe(times, eventTime);
          
          // Add the closest position
          const pos = getPositionAtIndex(values, closestIdx);
          agentHistory.push({
            time: times[closestIdx],
            x: pos.x,
            y: pos.y,
            z: pos.z
          });
          totalPointsAdded++;
        }
      } else {
        // For duration events: use time windows as masks
        const eventTimeWindows = events.map(event => ({
          start: event.start_time || event.time || 0,
          end: event.end_time || (event.start_time || event.time || 0)
        }));
        
        // Use time windows as masks to filter position keyframes
        for (let i = 0; i < times.length; i++) {
          const time = times[i];
          
          // Check if this time falls within any event window
          const isInEventWindow = eventTimeWindows.some(
            window => time >= window.start && time <= window.end
          );
          
          if (isInEventWindow) {
            agentHistory.push({
              time: time,
              x: values[i * 3],
              y: values[i * 3 + 1],
              z: values[i * 3 + 2]
            });
            totalPointsAdded++;
          }
        }
      }
    });
    
    // Update geometry for each agent after rebuild
    if (selectedEventType && eventHistories.current[selectedEventType]) {
      agents.forEach((agent: AgentData, idx: number) => {
        const pc = pointClouds.current[idx];
        if (!pc) return;

        // Use agent.id to get the correct history
        const agentHistory = (eventHistories.current[selectedEventType] as Record<number, any[]>)[agent.id];
        if (!agentHistory) return;
        
        const positions = pc.geometry.attributes.position.array;
        const visibleCount = Math.min(agentHistory.length, positions.length / 3);
        
        // Copy points from this event type's history
        for (let i = 0; i < visibleCount; i++) {
          const sample = agentHistory[i];
          positions[i * 3] = sample.x;
          positions[i * 3 + 1] = sample.y;
          positions[i * 3 + 2] = sample.z;
        }
        
        // Hide unused points
        for (let i = visibleCount * 3; i < positions.length; i++) {
          positions[i] = 1e6;
        }

        pc.geometry.setDrawRange(0, visibleCount);
        pc.geometry.attributes.position.needsUpdate = true;
      });
    }
  }, [agents, selectedEventType, stateManager, observers]);

  // Detect reset by monitoring event count decrease or time reset to 0
  useEffect(() => {
    if (!stateManager) return;
    
    // Count total events
    let totalEvents = 0;
    for (const [, agentObservers] of (stateManager as any).completedEvents.entries()) {
      for (const [, observerEvents] of agentObservers.entries()) {
        for (const [, events] of observerEvents.entries()) {
          totalEvents += (Array.isArray(events) ? events.length : 0);
        }
      }
    }
    
    // If event count decreased significantly or time reset to 0, clear visualizations
    if ((totalEvents < previousEventCount.current - 10) || (currentTime === 0 && lastResetTime.current > 0.5)) {
      clearAllVisualizations();
      lastRebuildTime.current = 0;
      lastCurrentTime.current = -1;
    }
    // If events went from 0 to > 0, trigger immediate rebuild (first events after reset)
    else if (previousEventCount.current === 0 && totalEvents > 0) {
      rebuildVisualization();
      lastRebuildTime.current = currentTime;
    }
    
    previousEventCount.current = totalEvents;
    lastResetTime.current = currentTime;
  }, [currentTime, stateManager, lastInsightUpdate, clearAllVisualizations, rebuildVisualization]);

  // Rebuild event histories when event type switches or agents change
  useEffect(() => {
    if (!agents || !selectedEventType || !stateManager) return;
    
    const history = eventHistories.current[selectedEventType] as Record<number, any[]> | undefined;
    if (!history) return;
    
    // Rebuild the visualization
    rebuildVisualization();
    lastRebuildTime.current = currentTime;
    
  }, [agents, selectedEventType, stateManager, observers, rebuildVisualization, currentTime]);

  // Rebuild when tolerance changes (triggered by lastInsightUpdate)
  useEffect(() => {
    if (!lastInsightUpdate || lastInsightUpdate === 0) return;
    
    // Check if tolerance config actually changed
    const currentToleranceConfig = (stateManager as any)?.toleranceEngine?.config;
    const toleranceConfigString = JSON.stringify(currentToleranceConfig);
    
    if (lastToleranceConfig.current && lastToleranceConfig.current !== toleranceConfigString) {
      // Tolerance changed - rebuild visualization immediately
      rebuildVisualization();
      lastRebuildTime.current = currentTime;
      lastToleranceConfig.current = toleranceConfigString;
    }
  }, [lastInsightUpdate, stateManager, rebuildVisualization, currentTime]);

  // Update point cloud geometries each frame
  useFrame(() => {
    if (!insightsEnabled || !showVisualization || !selectedEventType) {
      return;
    }
    
    // **KEY CHANGE**: Only draw when simulation is at the end
    if (!isAtEnd) {
      return;
    }
    
    // **CRITICAL OPTIMIZATION**: Skip if time hasn't changed (simulation paused/not started)
    if (currentTime === lastCurrentTime.current) {
      return;
    }
    lastCurrentTime.current = currentTime;

    // Check if tolerance config changed - if so, rebuild immediately
    const currentToleranceConfig = (stateManager as any)?.toleranceEngine?.config;
    const toleranceConfigString = JSON.stringify(currentToleranceConfig);
    
    if (lastToleranceConfig.current !== toleranceConfigString) {
      rebuildVisualization();
      lastToleranceConfig.current = toleranceConfigString;
      lastRebuildTime.current = currentTime;
      return; // Skip regular throttled update this frame
    }

    // Rebuild visualization when at end (only once per tolerance change)
    if (currentTime - lastRebuildTime.current >= rebuildThrottle) {
      rebuildVisualization();
      lastRebuildTime.current = currentTime;
    }
  });
  
  // Update colors when event type changes
  useEffect(() => {
    if (!pointClouds.current || !selectedEventType) return;
    
    const color = getEventColor(selectedEventType);
    
    pointClouds.current.forEach((pc: THREE.Points) => {
      if (pc && pc.material && !Array.isArray(pc.material)) {
        (pc.material as THREE.PointsMaterial).color.set(color);
        (pc.material as THREE.PointsMaterial).needsUpdate = true;
      }
    });
  }, [selectedEventType]);

  return (
    <>
      {showVisualization && selectedEventType && pointClouds.current.length > 0 &&
        pointClouds.current.map((pc, i) => <primitive object={pc} key={i} />)
      }
    </>
  );
}
