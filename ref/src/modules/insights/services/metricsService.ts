/**
 * Metrics Service
 * Business logic for calculating observer metrics and statistics
 * Extracted from UI components to maintain separation of concerns
 */

import type { InsightsStateManager } from '../core/InsightsStateManager';
import type { Observer } from '../insightsStore';

export interface ObserverMetrics {
  observerName: string;
  totalAgents: number;
  noticedCount: number;
  noticedEarlyCount: number;
  enteredCount: number;
  attendCount: number;
  avgAttendDuration: number;
  occupyCount: number;
  avgOccupyDuration: number;
  pauseInsideCount: number;
  lingerInsideCount: number;
  avgLingerDuration: number;
  avgTimeToEnter: number;
  maxSimultaneous: number;
  globalPauseCount: number;
  globalLingerCount: number;
  globalMaxLingerDuration: number;
  avgSimulationTime: number;
}

/**
 * Calculate comprehensive metrics for an observer
 * @param observer - Observer object
 * @param stateManager - Insights state manager
 * @returns Observer metrics
 */
export function calculateObserverMetrics(
  observer: Observer,
  stateManager: InsightsStateManager
): ObserverMetrics {
  const observerId = observer.id;
  
  // Get total agent count across all observers
  const allAgentIds = new Set<string>();
  for (const agentId of stateManager.completedEvents.keys()) {
    allAgentIds.add(agentId);
  }
  for (const agentId of stateManager.activeStates.keys()) {
    allAgentIds.add(agentId);
  }
  const totalAgents = allAgentIds.size;
  
  // Get agents who interacted with this specific observer
  const observerAgents = stateManager.getAgentsForObserver(observerId);
  
  // Point events (one-time occurrences)
  const noticedCount = stateManager.getPointEventCount(observerId, 'noticed');
  const enteredCount = stateManager.getPointEventCount(observerId, 'entered');
  
  // Composite metrics (noticed before entered)
  let noticedEarlyCount = 0;
  let totalNoticeToEnterTime = 0;
  let noticeToEnterSamples = 0;
  
  for (const agentId of observerAgents) {
    const hasNoticed = stateManager.hasNoticed(agentId, observerId);
    const hasEntered = stateManager.hasEntered(agentId, observerId);
    
    if (hasNoticed && hasEntered) {
      const timeDiff = stateManager.getNoticeToEnterTime(agentId, observerId);
      if (timeDiff !== null && timeDiff > 0) {
        noticedEarlyCount++;
        totalNoticeToEnterTime += timeDiff;
        noticeToEnterSamples++;
      }
    }
  }
  
  // Duration events (states with start and end times)
  const attendCount = stateManager.getStateCount(observerId, 'attend');
  const avgAttendDuration = stateManager.getAverageDuration(observerId, 'attend');
  const occupyCount = stateManager.getStateCount(observerId, 'occupy');
  const avgOccupyDuration = stateManager.getAverageDuration(observerId, 'occupy');
  const currentOccupyCount = stateManager.getCurrentActiveCount(observerId, 'occupy');
  const pauseInsideCount = stateManager.getStateCount(observerId, 'pause');
  const lingerInsideCount = stateManager.getStateCount(observerId, 'linger');
  const avgLingerDuration = stateManager.getAverageDuration(observerId, 'linger');
  
  // Calculate average time from notice to enter
  const avgTimeToEnter = noticeToEnterSamples > 0
    ? totalNoticeToEnterTime / noticeToEnterSamples
    : 0;
  
  // Maximum simultaneous occupants
  const maxSimultaneous = currentOccupyCount;
  
  // Global context (across all observers)
  const globalPauseCount = stateManager.getGlobalStateCount('pause');
  const globalLingerCount = stateManager.getGlobalStateCount('linger');
  const globalMaxLingerDuration = stateManager.getGlobalMaxDuration('linger');
  const avgSimulationTime = stateManager.getAverageSimulationTime();
  
  return {
    observerName: observer.name || `${observer.type}_${observer.id}`,
    totalAgents,
    noticedCount,
    noticedEarlyCount,
    enteredCount,
    attendCount,
    avgAttendDuration,
    occupyCount,
    avgOccupyDuration,
    pauseInsideCount,
    lingerInsideCount,
    avgLingerDuration,
    avgTimeToEnter,
    maxSimultaneous,
    globalPauseCount,
    globalLingerCount,
    globalMaxLingerDuration,
    avgSimulationTime
  };
}

/**
 * Format duration to human readable string
 * @param seconds - Duration in seconds
 * @returns Formatted string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m${secs.toString().padStart(2, '0')}s`;
}

/**
 * Format count as fraction
 * @param count - Numerator
 * @param total - Denominator
 * @returns Formatted string
 */
export function formatFraction(count: number, total: number): string {
  return `${count}/${total}`;
}

/**
 * Calculate percentage
 * @param count - Numerator
 * @param total - Denominator
 * @returns Percentage (0-100)
 */
export function calculatePercentage(count: number, total: number): number {
  return total > 0 ? (count / total) * 100 : 0;
}

/**
 * Interpolate color from red to green based on percentage
 * @param percentage - Percentage (0-100)
 * @returns RGB color string
 */
export function getProgressColor(percentage: number): string {
  const red = Math.round(255 * (1 - percentage / 100));
  const green = Math.round(255 * (percentage / 100));
  return `rgb(${red}, ${green}, 0)`;
}
