/**
 * ObserverInfoPanel
 * Displays real-time metrics for a selected observer
 * Appears in 3D space above the observer object
 */
import { useMemo, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import { useInsightsStore } from '../insightsStore';
import { usePlaybackState } from '../../../hooks/usePlaybackState';

/**
 * Format time duration to human readable string
 */
function formatDuration(seconds: number) {
  if (seconds < 60) {
    return `${Math.round(seconds)}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${minutes}m${secs.toString().padStart(2, '0')}s`;
}

/**
 * Format count as fraction
 */
function formatFraction(count: number, total: number) {
  return `${count}/${total}`;
}

/**
 * Progress Bar Component (red to green gradient)
 */
function ProgressBar({ count, total, label }: { count: number; total: number; label: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  // Interpolate from red (0%) to green (100%)
  const red = Math.round(255 * (1 - percentage / 100));
  const green = Math.round(255 * (percentage / 100));
  const color = `rgb(${red}, ${green}, 0)`;
  
  return (
    <div style={{ marginBottom: '8px' }}>
      <div style={{ fontSize: '11px', marginBottom: '4px', color: 'rgba(255,255,255,0.8)' }}>
        {label}
      </div>
      <div style={{ 
        position: 'relative',
        width: '100%',
        height: '24px',
        background: 'rgba(255,255,255,0.1)',
        borderRadius: '3px',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          height: '100%',
          width: `${percentage}%`,
          background: color,
          transition: 'width 0.3s ease, background 0.3s ease'
        }} />
        <div style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '12px',
          fontWeight: 'bold',
          color: '#8c92a4',
          textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          zIndex: 1
        }}>
          {formatFraction(count, total)}
        </div>
      </div>
    </div>
  );
}

/**
 * Calculate composite metrics for observer panel
 * Throttled to avoid expensive recalculations on every frame
 * Skips calculations when paused to improve performance
 */
function useObserverMetrics(observer: any, stateManager: any, lastInsightUpdate: number, isPlaying: boolean) {
  const cachedMetrics = useRef<any>(null);
  
  // Throttle updates to once per second
  const throttledUpdate = useMemo(() => {
    return Math.floor(lastInsightUpdate / 1000) * 1000;
  }, [lastInsightUpdate]);
  
  return useMemo(() => {
    if (!observer || !stateManager) {
      return cachedMetrics.current;
    }
    
    // Skip expensive calculations when paused - return cached data
    // BUT calculate at least once if no cache exists
    if (!isPlaying && cachedMetrics.current !== null) {
      return cachedMetrics.current;
    }

    const observerId = observer.id;
    
    // Get total agent count from all agents in simulation
    const allAgentIds = new Set();
    // From completed events
    for (const agentId of stateManager.completedEvents.keys()) {
      allAgentIds.add(agentId);
    }
    // From active states
    for (const agentId of stateManager.activeStates.keys()) {
      allAgentIds.add(agentId);
    }
    const totalAgents = allAgentIds.size;
    
    // Get agents who interacted with this specific observer
    const observerAgents = stateManager.getAgentsForObserver(observerId);

    // Point events
    const noticedCount = stateManager.getPointEventCount(observerId, 'noticed');
    const enteredCount = stateManager.getPointEventCount(observerId, 'entered');

    // Calculate composite metrics
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

    // Duration events - attend (look-at)
    const attendCount = stateManager.getStateCount(observerId, 'attend');
    const avgAttendDuration = stateManager.getAverageDuration(observerId, 'attend');

    // Duration events - occupy (inside)
    const occupyCount = stateManager.getStateCount(observerId, 'occupy');
    const avgOccupyDuration = stateManager.getAverageDuration(observerId, 'occupy');
    const currentOccupyCount = stateManager.getCurrentActiveCount(observerId, 'occupy');

    // Combined states - pause inside
    const pauseInsideCount = stateManager.getStateCount(observerId, 'pause');
    
    // Combined states - linger inside
    const lingerInsideCount = stateManager.getStateCount(observerId, 'linger');
    const avgLingerDuration = stateManager.getAverageDuration(observerId, 'linger');

    // Average time to enter
    const avgTimeToEnter = noticeToEnterSamples > 0
      ? totalNoticeToEnterTime / noticeToEnterSamples
      : 0;

    // Max simultaneous - track peak occupy count (approximation from current)
    // Note: For accurate max, we'd need historical tracking - using current as proxy
    const maxSimultaneous = currentOccupyCount;

    // Global context
    const globalPauseCount = stateManager.getGlobalStateCount('pause');
    const globalLingerCount = stateManager.getGlobalStateCount('linger');
    const globalMaxLingerDuration = stateManager.getGlobalMaxDuration('linger');
    
    // Use cached average simulation time calculation
    const avgSimulationTime = stateManager.getAverageSimulationTime();

    return {
      // Meta
      observerName: observer.name || `${observer.type}_${observer.id}`,
      totalAgents,
      
      // Point events
      noticedCount,
      noticedEarlyCount,
      enteredCount,
      
      // Duration events
      attendCount,
      avgAttendDuration,
      occupyCount,
      avgOccupyDuration,
      pauseInsideCount,
      lingerInsideCount,
      avgLingerDuration,
      avgTimeToEnter,
      maxSimultaneous,
      
      // Global context
      globalPauseCount,
      globalLingerCount,
      globalMaxLingerDuration,
      avgSimulationTime
    };
    
    // Cache the result
    const result = {
      observerName: observer.name || observer.id,
      totalAgents,
      noticedCount,
      noticedEarlyCount,
      enteredCount,
      attendCount,
      avgAttendDuration,
      occupyCount,
      avgOccupyDuration,
      avgDwellDuration: avgOccupyDuration,
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
    cachedMetrics.current = result;
    return result;
  }, [observer, observer?.id, stateManager, throttledUpdate, isPlaying]);
}

/**
 * ObserverInfoPanel Component
 */
export default function ObserverInfoPanel({ observer, visible }: { observer: any; visible: boolean }) {
  const { camera: _camera } = useThree();
  const stateManager = useInsightsStore(s => s.stateManager);
  const lastInsightUpdate = useInsightsStore(s => s.lastInsightUpdate);
  const setInsightsWindowOpen = useInsightsStore(s => s.setInsightsWindowOpen);
  const playback = usePlaybackState();
  
  const metrics = useObserverMetrics(observer, stateManager, lastInsightUpdate, playback.isPlaying);

  if (!visible || !observer || !metrics) {
    return null;
  }

  // Calculate position relative to observer ground origin (bottom), not center
  const groundY = observer.volume.position.y - observer.volume.height / 2;
  const position: [number, number, number] = [
    observer.volume.position.x,
    groundY + 150,
    observer.volume.position.z
  ];

  const hasData = metrics.noticedCount > 0 || metrics.enteredCount > 0;

  return (
    <Html
      position={position}
      center
      distanceFactor={1}
      scale={0.2}
      style={{ pointerEvents: 'none' }}
    >
      <div
        style={{
          background: '#181c20',
          color: '#8c92a4',
          padding: '12px 16px',
          borderRadius: '4px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          lineHeight: '1.5',
          minWidth: '280px',
          userSelect: 'none',
          pointerEvents: 'auto'
        }}
      >
        {/* Header */}
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          {metrics.observerName} · Local
        </div>

        {/* Point Events with Progress Bars */}
        <ProgressBar 
          count={metrics.noticedCount}
          total={metrics.totalAgents}
          label="Noticed"
        />
        <ProgressBar 
          count={metrics.noticedEarlyCount}
          total={metrics.totalAgents}
          label="Noticed early"
        />
        <ProgressBar 
          count={metrics.enteredCount}
          total={metrics.totalAgents}
          label="Entry events"
        />

        <div style={{ marginBottom: '12px' }} />
        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Stops (inside)</span>
          <span>{metrics.pauseInsideCount}</span>
        </div>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Linger (inside)</span>
          <span>{metrics.lingerInsideCount}</span>
        </div>

        {/* Averages */}
        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Avg look-at duration</span>
          <span>{formatDuration(metrics.avgAttendDuration)}</span>
        </div>
        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Avg linger (inside)</span>
          <span>{formatDuration(metrics.avgLingerDuration)}</span>
        </div>
        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Avg time to enter</span>
          <span>{formatDuration(metrics.avgTimeToEnter)}</span>
        </div>
        <div style={{ 
          marginBottom: '12px',
          paddingBottom: '12px',
          borderBottom: '1px solid rgba(255,255,255,0.2)',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Max simultaneous inside</span>
          <span>{metrics.maxSimultaneous}</span>
        </div>

        {/* Global Context */}
        <div style={{ 
          fontWeight: 'bold', 
          marginBottom: '8px',
          paddingBottom: '8px',
          borderBottom: '1px solid rgba(255,255,255,0.2)'
        }}>
          Context · Global
        </div>

        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Total stops (all)</span>
          <span>{metrics.globalPauseCount}</span>
        </div>
        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Total linger (all)</span>
          <span>{metrics.globalLingerCount}</span>
        </div>
        <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Longest linger</span>
          <span>{formatDuration(metrics.globalMaxLingerDuration)}</span>
        </div>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
          <span>Avg simulation time</span>
          <span>{formatDuration(metrics.avgSimulationTime)}</span>
        </div>

        {/* Status / Action Button */}
        {playback.isAtEnd ? (
          <button
            onClick={() => setInsightsWindowOpen(true)}
            style={{
              width: '100%',
              padding: '8px',
              marginTop: '8px',
              background: '#0066ff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              pointerEvents: 'auto'
            }}
            onMouseEnter={(e) => (e.target as HTMLElement).style.background = '#0052cc'}
            onMouseLeave={(e) => (e.target as HTMLElement).style.background = '#0066ff'}
          >
            INSIGHTS
          </button>
        ) : (
          <div style={{
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.2)',
            fontSize: '12px',
            color: 'rgba(255,255,255,0.6)',
            fontStyle: 'italic'
          }}>
            {hasData ? 'Collecting data…' : 'No activity yet'}
          </div>
        )}
      </div>
    </Html>
  );
}
