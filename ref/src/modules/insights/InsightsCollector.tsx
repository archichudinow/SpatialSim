/**
 * InsightsCollector
 * Time-based detection engine
 * Uses insightsStore for state, receives agents/time via props
 */
import { useEffect, useRef } from 'react';
import { useInsightsStore } from './insightsStore.ts';
import { usePlaybackState } from '../../hooks/usePlaybackState';
import type { AgentData } from '../../types';

// Import detectors
import {
  detectPauseState,
  detectLingerState,
  detectRushState,
  detectWalkState
} from './detectors/movementDetectors';

import {
  detectScanState,
  detectLookFocusedState,
  detectLookUpState,
  detectLookDownState
} from './detectors/orientationDetectors';

import {
  detectLookAtObjectState,
  detectInsideObjectState
} from './detectors/objectDetectors';
import { VISUALIZATION_TIMING } from '../../config/visualizationConfig';

const { HISTORY_DURATION, DETECTION_INTERVAL } = VISUALIZATION_TIMING;

/**
 * Helper to cull old history entries
 */
function cullOldHistory(historyArray: any[], cutoffTime: number) {
  while (historyArray.length > 0 && historyArray[0].time < cutoffTime) {
    historyArray.shift();
  }
}

interface InsightsCollectorProps {
  agents: AgentData[];
  currentTime: number;
  maxTime?: number;
  positionBuffer?: Float32Array;
  lookAtBuffer?: Float32Array;
  onInsightGenerated?: any;
}

export default function InsightsCollector({
  agents,
  currentTime,
  maxTime: _maxTime,
  positionBuffer: _positionBuffer,
  lookAtBuffer: _lookAtBuffer,
  onInsightGenerated: _onInsightGenerated
}: InsightsCollectorProps) {
  const stateManager = useInsightsStore(s => s.stateManager);
  const observers = useInsightsStore(s => s.observers);
  const insightsEnabled = useInsightsStore(s => s.insightsEnabled);
  const triggerInsightUpdate = useInsightsStore(s => s.triggerInsightUpdate);
  
  // Event buffer actions
  const updateEventBuffer = useInsightsStore(s => s.updateEventBuffer);
  const removeFromEventBuffer = useInsightsStore(s => s.removeFromEventBuffer);
  const recordPointEvent = useInsightsStore(s => s.recordPointEvent);
  
  // Get centralized playback state
  const playback = usePlaybackState();
  
  // Tracking refs
  const previousPositions = useRef(new Map());
  const positionHistory = useRef(new Map()); // Simple arrays
  const previousLookAts = useRef(new Map());
  const lookAtHistory = useRef(new Map()); // Simple arrays
  const previousStates = useRef(new Map());
  const lastDetectionTime = useRef(0);
  const justReset = useRef(false);
  
  // Permanent tracking for first-time events (never reset)
  const everSeenFlags = useRef(new Map());
  const everEnteredFlags = useRef(new Map());
  
  // Reset detection using centralized playback state
  useEffect(() => {
    if (playback.isReset) {
      // Full reset - clear everything
      previousPositions.current.clear();
      previousLookAts.current.clear();
      positionHistory.current.clear();
      lookAtHistory.current.clear();
      previousStates.current.clear();
      everSeenFlags.current.clear();
      everEnteredFlags.current.clear();
      
      lastDetectionTime.current = 0;
      
      if (stateManager) {
        stateManager.clearAll();
      }
      
      justReset.current = true;
      triggerInsightUpdate();
    }
  }, [playback.isReset, stateManager, triggerInsightUpdate]);
  
  // Main detection loop
  useEffect(() => {
    // Skip if simulation is paused/stopped
    if (!playback.isPlaying) {
      return;
    }
    
    if (!insightsEnabled || !agents || !stateManager) {
      return;
    }
    
    // Need agents to process, but observers are optional (movement/orientation states don't need observers)
    if (agents.length === 0) {
      return;
    }
    
    // Throttle detection
    const simulationTimeSinceLastDetection = currentTime - lastDetectionTime.current;
    if (simulationTimeSinceLastDetection < DETECTION_INTERVAL && lastDetectionTime.current > 0) {
      return;
    }
    
    lastDetectionTime.current = currentTime;
    
    // Use centralized deltaTime from playback state
    const deltaTime = playback.deltaTime;
    
    if (deltaTime <= 0) {
      return;
    }
    
    // Skip detection on first frame after reset
    if (justReset.current) {
      // Initialize position/lookAt data
      for (let agentIndex = 0; agentIndex < agents.length; agentIndex++) {
        const agent = agents[agentIndex];
        const agentId = agent.id;
        
        const position = agent.nodes?.position?.position;
        const lookAt = agent.nodes?.lookAt?.position;
        
        if (!position || !lookAt) continue;
        
        previousPositions.current.set(agentId, { x: position.x, y: position.y, z: position.z });
        previousLookAts.current.set(agentId, { x: lookAt.x, y: lookAt.y, z: lookAt.z });
        
        // Initialize history with simple arrays
        positionHistory.current.set(agentId, [{ time: currentTime, x: position.x, y: position.y, z: position.z }]);
        lookAtHistory.current.set(agentId, [{ time: currentTime, x: lookAt.x, y: lookAt.y, z: lookAt.z }]);
      }
      
      justReset.current = false;
      return;
    }
    
    // Process each agent
    for (let agentIndex = 0; agentIndex < agents.length; agentIndex++) {
      const agent = agents[agentIndex];
      const agentId = agent.id;
      
      const position = agent.nodes?.position?.position;
      const lookAt = agent.nodes?.lookAt?.position;
      
      if (!position || !lookAt) continue;
      
      const previousPosition = previousPositions.current.get(agentId);
      const previousLookAt = previousLookAts.current.get(agentId);
      
      // Update position history
      if (!positionHistory.current.has(agentId)) {
        positionHistory.current.set(agentId, []);
      }
      const history = positionHistory.current.get(agentId);
      history.push({ time: currentTime, x: position.x, y: position.y, z: position.z });
      
      // Cull old history
      const cutoffTime = currentTime - HISTORY_DURATION;
      cullOldHistory(history, cutoffTime);
      
      // Update lookAt history
      if (!lookAtHistory.current.has(agentId)) {
        lookAtHistory.current.set(agentId, []);
      }
      const lookHistory = lookAtHistory.current.get(agentId);
      lookHistory.push({ time: currentTime, x: lookAt.x, y: lookAt.y, z: lookAt.z });
      cullOldHistory(lookHistory, cutoffTime);
      
      // Process movement states
      processMovementStates(stateManager, agentId, {
        currentPosition: { x: position.x, y: position.y, z: position.z },
        previousPosition,
        positionHistory: history,
        deltaTime,
        currentTime
      }, { updateEventBuffer, removeFromEventBuffer, recordPointEvent });
      
      // Process orientation states
      const lookAtDirection = {
        x: lookAt.x - position.x,
        y: lookAt.y - position.y,
        z: lookAt.z - position.z
      };
      
      processOrientationStates(stateManager, agentId, {
        currentLookAt: lookAtDirection,
        previousLookAt: previousLookAt && previousPosition ? {
          x: previousLookAt.x - previousPosition.x,
          y: previousLookAt.y - previousPosition.y,
          z: previousLookAt.z - previousPosition.z
        } : null,
        lookAtHistory: lookHistory,
        deltaTime,
        currentTime,
        currentPosition: { x: position.x, y: position.y, z: position.z }
      }, { updateEventBuffer, removeFromEventBuffer, recordPointEvent });
      
      // Process object states for each observer (only if observers exist)
      if (observers && observers.length > 0) {
        for (const observer of observers) {
          processObjectDetection(stateManager, agentId, observer, {
            position: { x: position.x, y: position.y, z: position.z },
            lookAt: { x: lookAt.x, y: lookAt.y, z: lookAt.z },
            currentTime
          }, previousStates.current, everSeenFlags.current, everEnteredFlags.current, {
            currentPosition: { x: position.x, y: position.y, z: position.z },
            previousPosition,
            positionHistory: positionHistory.current.get(agentId),
            deltaTime,
            currentTime
          }, { updateEventBuffer, removeFromEventBuffer, recordPointEvent });
        }
      }
      
      // Store current position and lookAt for next frame
      previousPositions.current.set(agentId, { x: position.x, y: position.y, z: position.z });
      previousLookAts.current.set(agentId, { x: lookAt.x, y: lookAt.y, z: lookAt.z });
    }
    
    triggerInsightUpdate();
  }, [agents, stateManager, observers, currentTime, insightsEnabled, triggerInsightUpdate, playback.deltaTime, playback.isReset]);
  
  return null;
}

/**
 * Process movement-based states
 */
function processMovementStates(stateManager: any, agentId: number, params: any, eventBufferActions: any) {
  const observerId = 'global';
  const { currentTime, currentPosition, positionHistory } = params;
  
  const states = {
    pause: detectPauseState({ ...params, positionHistory }),
    linger: detectLingerState({ ...params, positionHistory }),
    rush: detectRushState(params),
    walk: detectWalkState(params)
  };
  
  for (const [stateType, isActive] of Object.entries(states)) {
    const wasActive = stateManager.isStateActive(agentId, observerId, stateType);
    
    if (isActive && !wasActive) {
      stateManager.startState(agentId, observerId, stateType, currentTime, { position: currentPosition });
    } else if (isActive && wasActive) {
      stateManager.updateState(agentId, observerId, stateType, currentTime, { position: currentPosition });
    } else if (!isActive && wasActive) {
      stateManager.endState(agentId, observerId, stateType, currentTime);
    }
    
    // Update event buffers for heatmap layers
    // Duration events: pause and linger
    if ((stateType === 'pause' || stateType === 'linger') && isActive) {
      eventBufferActions.updateEventBuffer(stateType, agentId, currentPosition, 1.0);
    } else if ((stateType === 'pause' || stateType === 'linger') && !isActive) {
      eventBufferActions.removeFromEventBuffer(stateType, agentId);
    }
  }
}

/**
 * Process orientation-based states
 */
function processOrientationStates(stateManager: any, agentId: number, params: any, eventBufferActions: any) {
  const observerId = 'global';
  const { currentTime, currentLookAt, currentPosition } = params;
  
  const states = {
    scan: detectScanState(params),
    focus: detectLookFocusedState(params),
    look_up: detectLookUpState(params),
    look_down: detectLookDownState(params)
  };
  
  for (const [stateType, isActive] of Object.entries(states)) {
    const wasActive = stateManager.isStateActive(agentId, observerId, stateType);
    
    if (isActive && !wasActive) {
      stateManager.startState(agentId, observerId, stateType, currentTime, { lookAt: currentLookAt });
    } else if (isActive && wasActive) {
      stateManager.updateState(agentId, observerId, stateType, currentTime, { lookAt: currentLookAt });
    } else if (!isActive && wasActive) {
      stateManager.endState(agentId, observerId, stateType, currentTime);
    }
    
    // Update event buffers for heatmap layers - scan is a duration event
    if (stateType === 'scan' && isActive) {
      eventBufferActions.updateEventBuffer(stateType, agentId, currentPosition, 1.0);
    } else if (stateType === 'scan' && !isActive) {
      eventBufferActions.removeFromEventBuffer(stateType, agentId);
    }
  }
}

/**
 * Process object-related states
 */
function processObjectDetection(
  stateManager: any,
  agentId: number,
  observer: any,
  params: any,
  previousStates: any,
  everSeenFlags: any,
  everEnteredFlags: any,
  movementParams: any,
  eventBufferActions: any
) {
  const { position, lookAt, currentTime } = params;
  const observerId = observer.id;
  
  const stateKey = `${agentId}_${observerId}`;
  
  const hasEverSeen = everSeenFlags.get(stateKey) || false;
  const hasEverEntered = everEnteredFlags.get(stateKey) || false;
  
  // Look at object detection
  const lookAtHit = detectLookAtObjectState({ position, lookAt, observer });
  const isLookingAt = lookAtHit !== null;
  
  if (isLookingAt && !stateManager.isStateActive(agentId, observerId, 'attend')) {
    stateManager.startState(agentId, observerId, 'attend', currentTime, {
      distance: lookAtHit.distance,
      hitPoint: lookAtHit.point
    });
  } else if (isLookingAt && stateManager.isStateActive(agentId, observerId, 'attend')) {
    stateManager.updateState(agentId, observerId, 'attend', currentTime, {
      distance: lookAtHit.distance,
      hitPoint: lookAtHit.point
    });
  } else if (!isLookingAt && stateManager.isStateActive(agentId, observerId, 'attend')) {
    stateManager.endState(agentId, observerId, 'attend', currentTime);
  }
  
  // First seen (point event)
  if (isLookingAt && !hasEverSeen) {
    stateManager.startState(agentId, observerId, 'noticed', currentTime, {
      distance: lookAtHit.distance
    });
    stateManager.endState(agentId, observerId, 'noticed', currentTime);
    everSeenFlags.set(stateKey, true);
  }
  
  // Inside object detection
  const isInside = detectInsideObjectState({ position, observer });
  
  if (isInside && !stateManager.isStateActive(agentId, observerId, 'occupy')) {
    stateManager.startState(agentId, observerId, 'occupy', currentTime, { position });
  } else if (isInside && stateManager.isStateActive(agentId, observerId, 'occupy')) {
    stateManager.updateState(agentId, observerId, 'occupy', currentTime, { position });
  } else if (!isInside && stateManager.isStateActive(agentId, observerId, 'occupy')) {
    stateManager.endState(agentId, observerId, 'occupy', currentTime);
  }
  
  // First entered (point event)
  if (isInside && !hasEverEntered) {
    stateManager.startState(agentId, observerId, 'entered', currentTime, {});
    stateManager.endState(agentId, observerId, 'entered', currentTime);
    everEnteredFlags.set(stateKey, true);
    
    // Record point event for 'noticed' heatmap layer
    // Point events are recorded once per agent and accumulate forever
    if (eventBufferActions) {
      eventBufferActions.recordPointEvent('noticed', agentId);
    }
  }
  
  // Track pause and linger states when inside observer
  if (isInside && movementParams) {
    const isPausing = detectPauseState(movementParams);
    const isLingering = detectLingerState(movementParams);
    
    // Pause inside
    if (isPausing && !stateManager.isStateActive(agentId, observerId, 'pause')) {
      stateManager.startState(agentId, observerId, 'pause', currentTime, { position });
    } else if (isPausing && stateManager.isStateActive(agentId, observerId, 'pause')) {
      stateManager.updateState(agentId, observerId, 'pause', currentTime, { position });
    } else if (!isPausing && stateManager.isStateActive(agentId, observerId, 'pause')) {
      stateManager.endState(agentId, observerId, 'pause', currentTime);
    }
    
    // Linger inside
    if (isLingering && !stateManager.isStateActive(agentId, observerId, 'linger')) {
      stateManager.startState(agentId, observerId, 'linger', currentTime, { position });
    } else if (isLingering && stateManager.isStateActive(agentId, observerId, 'linger')) {
      stateManager.updateState(agentId, observerId, 'linger', currentTime, { position });
    } else if (!isLingering && stateManager.isStateActive(agentId, observerId, 'linger')) {
      stateManager.endState(agentId, observerId, 'linger', currentTime);
    }
  }
  
  // Update previous state
  previousStates.set(stateKey, {
    wasSeen: isLookingAt,
    wasInside: isInside
  });
}
