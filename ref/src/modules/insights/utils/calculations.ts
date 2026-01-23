/**
 * Calculation utilities for Aggregates and Insights
 * Pure functions for computing metrics from measurement data
 */

// Constants (now in seconds instead of frames)
const EARLY_THRESHOLD = 0.25; // 25% of scenario duration
const MIN_ENTRY_DURATION = 3.0; // 3 seconds
const LONG_STOP_THRESHOLD = 3.0; // 3 seconds

/**
 * Get basic aggregates for one agent-observer pair
 * @param {Object} stateManager - InsightsStateManager instance
 * @param {string} agentId - Agent identifier
 * @param {string} observerId - Observer identifier
 * @param {number} maxTime - Total scenario duration in seconds
 * @returns {Object} Agent aggregates
 */
export function getAgentAggregates(stateManager: any, agentId: any, observerId: any, maxTime: number) {
  // Perception aggregates
  const firstSeenEvents = stateManager.getRawEvents(agentId, observerId, 'noticed');
  const seen = firstSeenEvents.length > 0;
  const firstSeenTime = firstSeenEvents[0]?.start_time || null;
  const firstSeenNormalized = firstSeenTime && maxTime > 0 ? firstSeenTime / maxTime : null;
  const earlySeen = firstSeenNormalized ? firstSeenNormalized < EARLY_THRESHOLD : false;
  
  // Approach aggregates
  const firstEnteredEvents = stateManager.getRawEvents(agentId, observerId, 'entered');
  const entered = firstEnteredEvents.length > 0;
  
  // Occupation aggregates
  const insideEvents = stateManager.getProcessedEvents(agentId, observerId, 'occupy');
  const timeInside = insideEvents.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
  const timeInsideNormalized = maxTime > 0 ? timeInside / maxTime : 0;
  
  // Entry count - each discrete occupy event represents one entry
  const entryCount = insideEvents.length;
  
  // For comfort calculations: use time from first entry to end as baseline
  // This measures "how long did they stay relative to opportunity to stay"
  const firstEntryTime = insideEvents.length > 0 ? insideEvents[0].start_time : null;
  const activeTimeAfterEntry = firstEntryTime !== null ? maxTime - firstEntryTime : maxTime;
  const timeInsideComfortNormalized = activeTimeAfterEntry > 0 ? timeInside / activeTimeAfterEntry : 0;
  
  // For comfort metric: use longest continuous occupation (dwell time inside volume)
  // This better captures "comfortable staying" than linger events which are often outside
  const occupyDurations = insideEvents.map((e: any) => e.duration || 0);
  const longestDwell = occupyDurations.length > 0 ? Math.max(...occupyDurations) : 0;
  const longestDwellNormalized = maxTime > 0 ? longestDwell / maxTime : 0;
  const longestDwellComfortNormalized = activeTimeAfterEntry > 0 ? longestDwell / activeTimeAfterEntry : 0;
  
  // Retreat calculation - entered but first visit was very short
  // Note: This captures "failed first engagement" (immediate rejection), not total rejection
  const retreat = entered && insideEvents.length > 0 && (insideEvents[0].duration || 0) < MIN_ENTRY_DURATION;
  
  // Passed without entering
  const passedWithoutEntering = seen && !entered;
  
  // Hesitation aggregates - fetch from 'global' since movement/orientation states are tracked globally
  // Then filter to events that occurred while inside or near the observer
  const globalPauseEvents = stateManager.getProcessedEvents(agentId, 'global', 'pause');
  const globalScanEvents = stateManager.getProcessedEvents(agentId, 'global', 'scan');
  
  // Filter pauses that overlap with occupy periods (approximate "near target")
  const pauseEvents = globalPauseEvents.filter((pause: any) => 
    insideEvents.some((inside: any) => 
      pause.start_time <= inside.end_time && pause.end_time >= inside.start_time
    )
  );
  
  const pauseCount = pauseEvents.length;
  const longPauseCount = pauseEvents.filter((e: any) => (e.duration || 0) > LONG_STOP_THRESHOLD).length;
  const longPauseRatio = pauseCount > 0 ? longPauseCount / pauseCount : 0;
  
  // Filter scan events that overlap with occupy
  const scanEvents = globalScanEvents.filter((scan: any) => 
    insideEvents.some((inside: any) => 
      scan.start_time <= inside.end_time && scan.end_time >= inside.start_time
    )
  );
  const scanDuration = scanEvents.reduce((sum: number, e: any) => sum + (e.duration || 0), 0);
  
  // Time near target is time inside volume (best approximation we have)
  const timeNearTarget = timeInside > 0 ? timeInside : (pauseCount > 0 || scanEvents.length > 0 ? maxTime : 1);
  const scanRatio = timeNearTarget > 1 ? scanDuration / timeNearTarget : 0;
  // Pause frequency with safety guard to prevent division by very small timeInside values
  const pauseFrequency = timeNearTarget > 1 ? pauseCount / Math.max(timeNearTarget, 1.0) : 0;
  
  return {
    // Perception
    seen,
    firstSeenTime,
    firstSeenNormalized,
    earlySeen,
    
    // Approach
    entered,
    entryCount,
    passedWithoutEntering,
    retreat,
    
    // Occupation
    timeInside,
    timeInsideNormalized,
    timeInsideComfortNormalized,
    longestDwell,
    longestDwellNormalized,
    longestDwellComfortNormalized,
    repeatVisits: entryCount > 1,
    
    // Hesitation
    pauseCount,
    longPauseCount,
    longPauseRatio,
    pauseFrequency,
    scanDuration,
    scanRatio,
    timeNearTarget
  };
}

/**
 * Get population-level ratios across all agents for one observer
 * @param {Object} stateManager - InsightsStateManager instance
 * @param {string} observerId - Observer identifier
 * @param {Array} agentIds - Array of agent identifiers
 * @param {number} maxTime - Total scenario duration in seconds
 * @returns {Object} Population ratios and averages
 */
export function getPopulationRatios(stateManager: any, observerId: any, agentIds: any, maxTime: any) {
  if (agentIds.length === 0) {
    return {
      seenRatio: 0,
      earlySeenRatio: 0,
      proximityRatio: 0,
      passedWithoutEnteringRatio: 0,
      retreatRatio: 0,
      repeatVisitRatio: 0,
      avgFirstSeenNormalized: 0,
      avgTimeSpentNormalized: 0,
      avgLongestLingerNormalized: 0,
      avgPauseFrequency: 0,
      avgLongPauseRatio: 0,
      avgScanRatio: 0
    };
  }
  
  const aggregates = agentIds.map((id: any) => getAgentAggregates(stateManager, id, observerId, maxTime));
  
  const seenCount = aggregates.filter((a: any) => a.seen).length;
  const earlySeenCount = aggregates.filter((a: any) => a.earlySeen).length;
  const proximityCount = aggregates.filter((a: any) => a.entered).length;
  const passedWithoutEnteringCount = aggregates.filter((a: any) => a.passedWithoutEntering).length;
  const repeatVisitCount = aggregates.filter((a: any) => a.repeatVisits).length;
  
  // Retreat ratio is calculated from those who entered
  const retreatCount = aggregates.filter((a: any) => a.retreat).length;
  const retreatRatio = proximityCount > 0 ? retreatCount / proximityCount : 0;
  
  // Averages (only from agents who have the relevant data)
  const seenAgents = aggregates.filter((a: any) => a.seen && a.firstSeenNormalized !== null);
  const avgFirstSeenNormalized = seenAgents.length > 0
    ? seenAgents.reduce((sum: number, a: any) => sum + a.firstSeenNormalized, 0) / seenAgents.length
    : 0;
  
  const enteredAgents = aggregates.filter((a: any) => a.entered);
  const avgTimeSpentNormalized = enteredAgents.length > 0
    ? enteredAgents.reduce((sum: number, a: any) => sum + a.timeInsideNormalized, 0) / enteredAgents.length
    : 0;
  
  const avgLongestDwellNormalized = enteredAgents.length > 0
    ? enteredAgents.reduce((sum: number, a: any) => sum + a.longestDwellNormalized, 0) / enteredAgents.length
    : 0;
  
  // Comfort-specific normalized values using active time after entry baseline
  const avgTimeSpentComfortNormalized = enteredAgents.length > 0
    ? enteredAgents.reduce((sum: number, a: any) => sum + a.timeInsideComfortNormalized, 0) / enteredAgents.length
    : 0;
  
  const avgLongestDwellComfortNormalized = enteredAgents.length > 0
    ? enteredAgents.reduce((sum: number, a: any) => sum + a.longestDwellComfortNormalized, 0) / enteredAgents.length
    : 0;
  
  // Average hesitation metrics with proper guards
  const agentsWithTimeNearTarget = aggregates.filter((a: any) => a.timeNearTarget > 1);
  const avgPauseFrequency = agentsWithTimeNearTarget.length > 0
    ? agentsWithTimeNearTarget.reduce((sum: number, a: any) => sum + a.pauseFrequency, 0) / agentsWithTimeNearTarget.length
    : 0;
  
  const agentsWithPauses = aggregates.filter((a: any) => a.pauseCount > 0);
  const avgLongPauseRatio = agentsWithPauses.length > 0
    ? agentsWithPauses.reduce((sum: number, a: any) => sum + a.longPauseRatio, 0) / agentsWithPauses.length
    : 0;
  
  const agentsWithScan = enteredAgents.filter((a: any) => a.timeNearTarget > 1);
  const avgScanRatio = agentsWithScan.length > 0
    ? agentsWithScan.reduce((sum: number, a: any) => sum + a.scanRatio, 0) / agentsWithScan.length
    : 0;
  
  return {
    seenRatio: seenCount / agentIds.length,
    earlySeenRatio: earlySeenCount / agentIds.length,
    proximityRatio: proximityCount / agentIds.length,
    passedWithoutEnteringRatio: passedWithoutEnteringCount / agentIds.length,
    retreatRatio,
    repeatVisitRatio: repeatVisitCount / agentIds.length,
    repeatVisitRatioComfort: proximityCount > 0 ? repeatVisitCount / proximityCount : 0, // For comfort: ratio of entered agents
    avgFirstSeenNormalized,
    avgTimeSpentNormalized,
    avgTimeSpentComfortNormalized,
    avgLongestDwellNormalized,
    avgLongestDwellComfortNormalized,
    avgPauseFrequency,
    avgStopFrequency: avgPauseFrequency, // Alias for clarity calc
    avgLongPauseRatio,
    avgLongStopRatio: avgLongPauseRatio, // Alias for clarity calc
    avgScanRatio,
    avgLookAroundRatio: avgScanRatio, // Alias for clarity calc
    totalAgents: agentIds.length,
    seenCount,
    earlySeenCount,
    proximityCount,
    retreatCount
  };
}

/**
 * Calculate architectural quality scores from population ratios
 * @param {Object} popRatios - Population ratios from getPopulationRatios
 * @returns {Object} Quality scores (0-1)
 */
export function calculateQualityScores(popRatios: any) {
  // 1. Visibility - is it perceived?
  const visibility = 
    0.5 * popRatios.seenRatio +
    0.3 * popRatios.earlySeenRatio +
    0.2 * (1 - popRatios.avgFirstSeenNormalized);
  
  // 2. Legibility - is meaning understood early?
  // Note: Legibility is inferred understanding (approach behavior), not confirmed cognition.
  // Approach ≠ understanding, but at population level in combination with clarity, misreadings self-correct.
  const legibility =
    0.4 * popRatios.earlySeenRatio +
    0.3 * popRatios.seenRatio +
    0.3 * popRatios.proximityRatio;
  
  // 3. Attraction - does it pull people in?
  const attraction =
    0.5 * popRatios.proximityRatio +
    0.3 * popRatios.avgTimeSpentNormalized +
    0.2 * (1 - popRatios.retreatRatio);
  
  // 4. Clarity - is interaction obvious?
  // All components normalized to 0-1 range for consistent weighting
  // Note: Scaling factors (×100, etc.) are calibration parameters based on empirical data, not semantic constants.
  const normalizedStopFreq = Math.min(1, popRatios.avgPauseFrequency * 100); // Normalize to 0-1
  const normalizedLookAround = Math.min(1, popRatios.avgScanRatio);
  
  const clarity = Math.max(0, 1 - (
    0.3 * normalizedStopFreq +
    0.3 * popRatios.avgLongPauseRatio +
    0.2 * normalizedLookAround +
    0.2 * popRatios.retreatRatio
  ));
  
  // 5. Comfort - does it support staying?
  // Uses active time after entry as baseline (not total scenario duration)
  // and repeat ratio from entered agents only
  const comfort =
    0.4 * popRatios.avgTimeSpentComfortNormalized +
    0.4 * popRatios.avgLongestDwellComfortNormalized +
    0.2 * popRatios.repeatVisitRatioComfort;
  
  return {
    visibility: Math.min(1, Math.max(0, visibility)),
    legibility: Math.min(1, Math.max(0, legibility)),
    attraction: Math.min(1, Math.max(0, attraction)),
    clarity: Math.min(1, Math.max(0, clarity)),
    comfort: Math.min(1, Math.max(0, comfort))
  };
}

/**
 * Get score band and color for a quality score
 * @param {number} score - Score value (0-1)
 * @returns {Object} Band name and color
 */
export function getScoreBand(score: any) {
  if (score === null || score === undefined || isNaN(score)) {
    return { band: 'N/A', color: '#666' };
  }
  
  if (score >= 0.8) return { band: 'Excellent', color: '#4caf50' };
  if (score >= 0.6) return { band: 'Good', color: '#2196f3' };
  if (score >= 0.4) return { band: 'Moderate', color: '#ff9800' };
  if (score >= 0.2) return { band: 'Poor', color: '#ff5722' };
  return { band: 'Critical', color: '#f44336' };
}

/**
 * Generate evidence strings for a quality score
 * @param {string} qualityType - Type of quality (visibility, attraction, etc.)
 * @param {Object} popRatios - Population ratios
 * @param {string} observerName - Name of the observer
 * @returns {Array<string>} Evidence strings
 */
export function generateEvidence(qualityType: any, popRatios: any, observerName: any) {
  const evidence = [];
  const total = popRatios.totalAgents || 0;
  
  switch (qualityType) {
    case 'visibility':
      evidence.push(`${popRatios.seenCount} of ${total} participants noticed ${observerName}`);
      if (popRatios.earlySeenCount > 0) {
        evidence.push(`${popRatios.earlySeenCount} participants noticed it early in their journey`);
      }
      if (popRatios.avgFirstSeenNormalized > 0) {
        evidence.push(`Average first sight: ${(popRatios.avgFirstSeenNormalized * 100).toFixed(0)}% into scenario`);
      }
      break;
      
    case 'legibility':
      evidence.push(`${popRatios.earlySeenCount} participants noticed ${observerName} early`);
      evidence.push(`${popRatios.proximityCount} participants approached after noticing`);
      break;
      
    case 'attraction':
      evidence.push(`${popRatios.proximityCount} of ${total} participants approached ${observerName}`);
      if (popRatios.retreatCount > 0) {
        evidence.push(`${popRatios.retreatCount} participants retreated shortly after approach`);
      }
      if (popRatios.avgTimeSpentNormalized > 0) {
        evidence.push(`Average time spent: ${(popRatios.avgTimeSpentNormalized * 100).toFixed(1)}% of scenario`);
      }
      break;
      
    case 'clarity':
      if (popRatios.avgPauseFrequency > 0) {
        evidence.push(`Pause frequency: ${(popRatios.avgPauseFrequency * 1000).toFixed(2)} per 1000 frames`);
      }
      if (popRatios.avgLongPauseRatio > 0) {
        evidence.push(`${(popRatios.avgLongPauseRatio * 100).toFixed(0)}% of pauses were prolonged (>3s)`);
      }
      if (popRatios.avgScanRatio > 0) {
        evidence.push(`Scanning: ${(popRatios.avgScanRatio * 100).toFixed(0)}% of time near target`);
      }
      break;
      
    case 'comfort':
      if (popRatios.avgTimeSpentComfortNormalized > 0) {
        evidence.push(`Average time spent: ${(popRatios.avgTimeSpentComfortNormalized * 100).toFixed(1)}% of available time`);
      }
      if (popRatios.avgLongestDwellComfortNormalized > 0) {
        evidence.push(`Longest stay: ${(popRatios.avgLongestDwellComfortNormalized * 100).toFixed(1)}% of available time`);
      }
      const enteredCount = Math.round(popRatios.proximityRatio * total);
      const repeatCount = Math.round(popRatios.repeatVisitRatioComfort * enteredCount);
      if (repeatCount > 0 && enteredCount > 0) {
        evidence.push(`${repeatCount} of ${enteredCount} visitors returned`);
      }
      break;
  }
  
  return evidence;
}
