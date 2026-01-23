/**
 * Insights State Manager
 * Centralized management of all insights states and events
 * Handles active states, completed events, and tolerance application
 */

import { ToleranceEngine, DEFAULT_TOLERANCE_CONFIG } from './toleranceEngine.js';

/**
 * InsightsStateManager Class
 * Core state management for the insights system
 */
export class InsightsStateManager {
  activeStates: Map<any, Map<any, Map<any, any>>>;
  completedEvents: Map<any, Map<any, Map<any, any[]>>>;
  toleranceEngine: ToleranceEngine;
  _avgSimTimeCache: any;
  _avgSimTimeCacheTime: number;

  constructor(toleranceConfig = DEFAULT_TOLERANCE_CONFIG) {
    // Active states currently being tracked
    // Structure: Map<agentId, Map<observerId, Map<stateType, ActiveState>>>
    this.activeStates = new Map();
    
    // Completed events (raw, before tolerance)
    // Structure: Map<agentId, Map<observerId, Map<eventType, Event[]>>>
    this.completedEvents = new Map();
    
    // Tolerance engine for post-processing
    this.toleranceEngine = new ToleranceEngine(toleranceConfig);
    
    // Cache for expensive calculations
    this._avgSimTimeCache = null;
    this._avgSimTimeCacheTime = 0;
  }

  /**
   * Start a new state for an agent-observer pair
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state (stop, dwell, etc.)
   * @param {number} time - Starting time in seconds
   * @param {Object} data - Additional state data (position, etc.)
   */
  startState(agentId: any, observerId: any, stateType: any, time: any, data: any = {}) {
    // Ensure nested maps exist
    if (!this.activeStates.has(agentId)) {
      this.activeStates.set(agentId, new Map());
    }
    if (!this.activeStates.get(agentId)!.has(observerId)) {
      this.activeStates.get(agentId)!.set(observerId, new Map());
    }
    
    // Create active state
    const activeState = {
      start_time: time,
      current_time: time,
      data
    };
    
    this.activeStates.get(agentId)!.get(observerId)!.set(stateType, activeState);
  }

  /**
   * Update an active state
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @param {number} time - Current time in seconds
   * @param {Object} data - Updated state data
   */
  updateState(agentId: any, observerId: any, stateType: any, time: any, data: any = {}) {
    const activeState = this.activeStates.get(agentId)?.get(observerId)?.get(stateType);
    
    if (activeState) {
      activeState.current_time = time;
      activeState.data = { ...activeState.data, ...data };
    }
  }

  /**
   * End an active state and move it to completed events
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @param {number} time - Ending time in seconds
   */
  endState(agentId: any, observerId: any, stateType: any, time: any) {
    const activeState = this.activeStates.get(agentId)?.get(observerId)?.get(stateType);
    
    if (!activeState) {
      return; // No active state to end
    }
    
    // Create completed event
    const event = {
      start_time: activeState.start_time,
      end_time: time,
      duration: time - activeState.start_time,
      ...activeState.data
    };
    
    // Store in completed events
    if (!this.completedEvents.has(agentId)) {
      this.completedEvents.set(agentId, new Map());
    }
    if (!this.completedEvents.get(agentId)!.has(observerId)) {
      this.completedEvents.get(agentId)!.set(observerId, new Map());
    }
    if (!this.completedEvents.get(agentId)!.get(observerId)!.has(stateType)) {
      this.completedEvents.get(agentId)!.get(observerId)!.set(stateType, []);
    }
    
    this.completedEvents.get(agentId)!.get(observerId)!.get(stateType)!.push(event);
    
    // Remove from active states
    this.activeStates.get(agentId)!.get(observerId)!.delete(stateType);
  }

  /**
   * Check if a state is currently active
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @returns {boolean} True if state is active
   */
  isStateActive(agentId: any, observerId: any, stateType: any) {
    return this.activeStates.get(agentId)?.get(observerId)?.has(stateType) || false;
  }

  /**
   * Get raw completed events (before tolerance)
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @returns {Array} Raw events
   */
  getRawEvents(agentId: any, observerId: any, stateType: any) {
    return this.completedEvents.get(agentId)?.get(observerId)?.get(stateType) || [];
  }

  /**
   * Get processed events (after tolerance application)
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @returns {Array} Processed events
   */
  getProcessedEvents(agentId: any, observerId: any, stateType: any) {
    const rawEvents = this.getRawEvents(agentId, observerId, stateType);
    return this.toleranceEngine.clampAndMerge(stateType, rawEvents);
  }

  /**
   * Get aggregates (statistics) for an agent-observer-state combination
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @returns {Object} Aggregates
   */
  getAggregates(agentId: any, observerId: any, stateType: any) {
    const events = this.getProcessedEvents(agentId, observerId, stateType);
    
    if (events.length === 0) {
      return {
        durations: [],
        amount: 0,
        time_total: 0,
        time_longest: 0,
        time_shortest: 0,
        time_average: 0
      };
    }
    
    const durations = events.map(e => ({
      start_time: e.start_time,
      end_time: e.end_time,
      duration: e.duration
    }));
    
    const lengths = events.map(e => e.duration || (e.end_time - e.start_time));
    const timeTotal = lengths.reduce((sum, len) => sum + len, 0);
    
    return {
      durations,
      amount: events.length,
      time_total: timeTotal,
      time_longest: Math.max(...lengths),
      time_shortest: Math.min(...lengths),
      time_average: timeTotal / events.length
    };
  }

  /**
   * Get timeline data for visualization
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @returns {Object} Timeline data for all state types
   */
  getAgentTimeline(agentId: any, observerId: any) {
    const timeline: any = {};
    const observerEvents = this.completedEvents.get(agentId)?.get(observerId);
    
    if (observerEvents) {
      for (const [stateType, _events] of observerEvents.entries()) {
        timeline[stateType] = this.getProcessedEvents(agentId, observerId, stateType);
      }
    }
    
    return timeline;
  }

  /**
   * Export all data for analysis
   * @returns {Object} Complete state dump
   */
  exportAllData() {
    const data: any = {
      agents: {}
    };
    
    for (const [agentId, observerMap] of this.completedEvents.entries()) {
      data.agents[agentId] = {};
      
      for (const [observerId, stateMap] of observerMap.entries()) {
        data.agents[agentId][observerId] = {};
        
        for (const [stateType, _events] of stateMap.entries()) {
          data.agents[agentId][observerId][stateType] = {
            raw: this.getRawEvents(agentId, observerId, stateType),
            processed: this.getProcessedEvents(agentId, observerId, stateType),
            aggregates: this.getAggregates(agentId, observerId, stateType)
          };
        }
      }
    }
    
    return data;
  }

  /**
   * Reset all data (for simulation reset)
   * Only clears active states - preserves completed events
   */
  reset() {
    this.activeStates.clear();
    // Note: Do NOT clear completedEvents - those are historical data that should be preserved
    // even when the playback time resets/jumps backwards
  }

  /**
   * Clear all data including completed events (for full reset to time 0)
   */
  clearAll() {
    this.activeStates.clear();
    this.completedEvents.clear();
  }

  /**
   * Get tolerance configuration
   * @returns {Object} Current tolerance config
   */
  getToleranceConfig() {
    return this.toleranceEngine.config;
  }

  /**
   * Update tolerance configuration
   * @param {string} stateType - State type
   * @param {Object} newConfig - New tolerance settings
   */
  updateToleranceConfig(stateType: any, newConfig: any) {
    this.toleranceEngine.updateConfig(stateType, newConfig);
  }

  // ==========================================
  // Observer Panel Aggregation Queries
  // ==========================================

  /**
   * Get total count of completed events for a specific observer and state type
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @returns {number} Total count across all agents
   */
  getStateCount(observerId: any, stateType: any) {
    let count = 0;
    for (const [_agentId, observerMap] of this.completedEvents.entries()) {
      const events = observerMap.get(observerId)?.get(stateType) || [];
      count += events.length;
    }
    return count;
  }

  /**
   * Get average duration for a specific observer and state type
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @returns {number} Average duration in seconds
   */
  getAverageDuration(observerId: any, stateType: any) {
    let totalDuration = 0;
    let count = 0;
    
    for (const [agentId, _observerMap] of this.completedEvents.entries()) {
      const events = this.getProcessedEvents(agentId, observerId, stateType);
      for (const event of events) {
        totalDuration += event.duration || (event.end_time - event.start_time);
        count++;
      }
    }
    
    return count > 0 ? totalDuration / count : 0;
  }

  /**
   * Get current count of active states for a specific observer and state type
   * @param {string} observerId - Observer identifier
   * @param {string} stateType - Type of state
   * @returns {number} Current active count
   */
  getCurrentActiveCount(observerId: any, stateType: any) {
    let count = 0;
    for (const [_agentId, observerMap] of this.activeStates.entries()) {
      if (observerMap.get(observerId)?.has(stateType)) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get point event count (events that start and end immediately)
   * @param {string} observerId - Observer identifier
   * @param {string} eventType - Type of event (noticed, entered)
   * @returns {number} Total count across all agents
   */
  getPointEventCount(observerId: any, eventType: any) {
    return this.getStateCount(observerId, eventType);
  }

  /**
   * Get all point event timestamps for an observer
   * @param {string} observerId - Observer identifier
   * @param {string} eventType - Type of event
   * @returns {Array} Array of {agentId, timestamp} objects
   */
  getPointEventTimestamps(observerId: any, eventType: any) {
    const timestamps = [];
    for (const [agentId, observerMap] of this.completedEvents.entries()) {
      const events = observerMap.get(observerId)?.get(eventType) || [];
      for (const event of events) {
        timestamps.push({
          agentId,
          timestamp: event.start_time
        });
      }
    }
    return timestamps;
  }

  /**
   * Get global state count across all observers
   * @param {string} stateType - Type of state
   * @returns {number} Total count across all agents and observers
   */
  getGlobalStateCount(stateType: any) {
    let count = 0;
    for (const [_agentId, observerMap] of this.completedEvents.entries()) {
      for (const [_observerId, stateMap] of observerMap.entries()) {
        const events = stateMap.get(stateType) || [];
        count += events.length;
      }
    }
    return count;
  }

  /**
   * Get global maximum duration for a state type
   * @param {string} stateType - Type of state
   * @returns {number} Maximum duration in seconds
   */
  getGlobalMaxDuration(stateType: any) {
    let maxDuration = 0;
    
    for (const [agentId, observerMap] of this.completedEvents.entries()) {
      for (const [observerId, _stateMap] of observerMap.entries()) {
        const events = this.getProcessedEvents(agentId, observerId, stateType);
        for (const event of events) {
          const duration = event.duration || (event.end_time - event.start_time);
          maxDuration = Math.max(maxDuration, duration);
        }
      }
    }
    
    return maxDuration;
  }

  /**
   * Get global total duration for a state type
   * @param {string} stateType - Type of state
   * @returns {number} Total accumulated duration in seconds
   */
  getGlobalTotalDuration(stateType: any) {
    let totalDuration = 0;
    
    for (const [agentId, observerMap] of this.completedEvents.entries()) {
      for (const [observerId, _stateMap] of observerMap.entries()) {
        const events = this.getProcessedEvents(agentId, observerId, stateType);
        for (const event of events) {
          totalDuration += event.duration || (event.end_time - event.start_time);
        }
      }
    }
    
    return totalDuration;
  }

  /**
   * Check if an agent has ever noticed an observer
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @returns {boolean} True if noticed event exists
   */
  hasNoticed(agentId: any, observerId: any) {
    const events = this.completedEvents.get(agentId)?.get(observerId)?.get('noticed') || [];
    return events.length > 0;
  }

  /**
   * Check if an agent has ever entered an observer
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @returns {boolean} True if entered event exists
   */
  hasEntered(agentId: any, observerId: any) {
    const events = this.completedEvents.get(agentId)?.get(observerId)?.get('entered') || [];
    return events.length > 0;
  }

  /**
   * Get time difference between noticed and entered events
   * @param {string} agentId - Agent identifier
   * @param {string} observerId - Observer identifier
   * @returns {number|null} Time difference in seconds, or null if either event missing
   */
  getNoticeToEnterTime(agentId: any, observerId: any) {
    const noticedEvents = this.completedEvents.get(agentId)?.get(observerId)?.get('noticed') || [];
    const enteredEvents = this.completedEvents.get(agentId)?.get(observerId)?.get('entered') || [];
    
    if (noticedEvents.length === 0 || enteredEvents.length === 0) {
      return null;
    }
    
    const noticedTime = noticedEvents[0].start_time;
    const enteredTime = enteredEvents[0].start_time;
    
    return enteredTime - noticedTime;
  }

  /**
   * Get all unique agents who have interacted with an observer
   * @param {string} observerId - Observer identifier
   * @returns {Set} Set of agent IDs
   */
  getAgentsForObserver(observerId: any) {
    const agents = new Set();
    
    for (const [agentId, observerMap] of this.completedEvents.entries()) {
      if (observerMap.has(observerId)) {
        agents.add(agentId);
      }
    }
    
    // Also check active states
    for (const [agentId, observerMap] of this.activeStates.entries()) {
      if (observerMap.has(observerId)) {
        agents.add(agentId);
      }
    }
    
    return agents;
  }

  /**
   * Get average simulation time across all agents (cached for performance)
   * Cache expires after 1 second to reduce expensive recalculations
   * @returns {number} Average simulation time in seconds
   */
  getAverageSimulationTime() {
    const now = Date.now();
    
    // Return cached value if less than 1 second old
    if (this._avgSimTimeCache !== null && (now - this._avgSimTimeCacheTime) < 1000) {
      return this._avgSimTimeCache;
    }
    
    // Recalculate
    const completedAgentIds = Array.from(this.completedEvents.keys());
    let totalSimTime = 0;
    let agentCount = 0;
    
    for (const agentId of completedAgentIds) {
      const agentData = this.completedEvents.get(agentId);
      if (agentData) {
        // Get max end_time across all events for this agent
        let maxTime = 0;
        for (const [_obsId, stateMap] of agentData.entries()) {
          for (const [_stateType, events] of stateMap.entries()) {
            for (const event of events) {
              maxTime = Math.max(maxTime, event.end_time || 0);
            }
          }
        }
        if (maxTime > 0) {
          totalSimTime += maxTime;
          agentCount++;
        }
      }
    }
    
    const result = agentCount > 0 ? totalSimTime / agentCount : 0;
    
    // Cache the result
    this._avgSimTimeCache = result;
    this._avgSimTimeCacheTime = now;
    
    return result;
  }
}
