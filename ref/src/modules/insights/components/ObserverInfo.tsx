/**
 * ObserverInfo
 * Content component that displays real-time metrics for an observer
 * Uses metricsService for business logic
 */
import { useMemo, useRef } from 'react';
import { useInsightsStore } from '../insightsStore';
import { usePlaybackState } from '../../../hooks/usePlaybackState';
import {
  calculateObserverMetrics,
  formatDuration,
  formatFraction,
  calculatePercentage,
  getProgressColor,
  type ObserverMetrics
} from '../services/metricsService';

/**
 * Progress Bar Component (red to green gradient)
 */
function ProgressBar({ count, total, label }: { count: number; total: number; label: string }) {
  const percentage = calculatePercentage(count, total);
  const color = getProgressColor(percentage);
  
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
          color: 'white',
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
 * Hook to calculate and cache observer metrics
 * Throttled to avoid expensive recalculations on every frame
 */
function useObserverMetrics(
  observer: any,
  stateManager: any,
  lastInsightUpdate: number,
  isPlaying: boolean
): ObserverMetrics | null {
  const cachedMetrics = useRef<ObserverMetrics | null>(null);
  
  // Throttle updates to once per second
  const throttledUpdate = useMemo(() => {
    return Math.floor(lastInsightUpdate / 1000) * 1000;
  }, [lastInsightUpdate]);
  
  return useMemo(() => {
    if (!observer || !stateManager) {
      return cachedMetrics.current;
    }
    
    // Skip expensive calculations when paused - return cached data
    if (!isPlaying && cachedMetrics.current !== null) {
      return cachedMetrics.current;
    }

    // Use metrics service for calculation
    const result = calculateObserverMetrics(observer, stateManager);
    
    cachedMetrics.current = result;
    return result;
  }, [observer, observer?.id, stateManager, throttledUpdate, isPlaying]);
}

/**
 * ObserverInfo Component
 */
export default function ObserverInfo({ observer }: { observer: any }) {
  const stateManager = useInsightsStore(s => s.stateManager);
  const lastInsightUpdate = useInsightsStore(s => s.lastInsightUpdate);
  const setInsightsWindowOpen = useInsightsStore(s => s.setInsightsWindowOpen);
  const playback = usePlaybackState();
  
  const metrics = useObserverMetrics(observer, stateManager, lastInsightUpdate, playback.isPlaying);

  if (!observer || !metrics) {
    return null;
  }

  const hasData = metrics.noticedCount > 0 || metrics.enteredCount > 0;

  return (
    
    <div
      style={{
        background: '#181c20',
        color: 'white',
        padding: '12px 16px',
        borderRadius: '0',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '13px',
        lineHeight: '1.5',
        minWidth: '280px',
        userSelect: 'none'
      }}
    >
        {/* Global Context */}
      <div style={{ 
        fontWeight: 'bold', 
        marginBottom: '8px',
        paddingTop: '4px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255,255,255,0.2)'
      }}>
        Observer · Local
      </div>
      {/* Point Events with Progress Bars */}

      <ProgressBar 
        count={metrics.noticedEarlyCount}
        total={metrics.totalAgents}
        label="Noticed early"
      />
      <ProgressBar 
        count={metrics.noticedCount}
        total={metrics.totalAgents}
        label="Noticed"
      />
      <ProgressBar 
        count={metrics.enteredCount}
        total={metrics.totalAgents}
        label="Entry events"
      />

      <div style={{ marginBottom: '24px' }} />
      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Stops (inside)</span>
        <span>{metrics.pauseInsideCount}</span>
      </div>
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between' }}>
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

      <div style={{ marginBottom: '24px' }} />
      <div style={{ marginBottom: '4px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Longest linger</span>
        <span>{formatDuration(metrics.globalMaxLingerDuration)}</span>
      </div>
      <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
        <span>Avg simulation time</span>
        <span>{formatDuration(metrics.avgSimulationTime)}</span>
      </div>
      <div style={{ marginBottom: '24px' }} />
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
          {hasData ? 'Collecting data…' : 'No interactions recorded yet.'}
        </div>
      )}
    </div>
  );
}
