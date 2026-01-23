/**
 * TimelineView
 * Displays the main timeline visualization grid with agent rows
 */
import React from 'react';

export const TimelineView = React.memo(function TimelineView({
  timelineData,
  selectedStateType,
  selectedObserver,
  maxTime,
  currentTime,
  barHeight,
  getStateColor
}: any) {
  // Point event types
  const pointEventTypes = ['noticed', 'entered'];
  
  // Render a timeline bar for one agent
  const renderTimelineBar = (agentId: any, observerId: any, events: any, agentMaxTime: any) => {
    const isPointEvent = pointEventTypes.includes(selectedStateType);
    const endTime = (!agentMaxTime || isNaN(agentMaxTime) || agentMaxTime <= 0) ? maxTime : agentMaxTime;
    const segments = [];
    const markers = [];

    for (let i = 0; i < events.length; i++) {
      const event = events[i];
      if (isPointEvent) {
        // Point event - shorter vertical marker
        const time = event.start_time || event.time || 0;
        const pos = maxTime > 0 ? (time / maxTime) * 100 : 0;
        markers.push({
          id: `${agentId}-${observerId}-${i}`,
          position: pos,
          time: time,
          type: 'point'
        });
      } else {
        // Duration state - colored segment
        const clippedEndTime = Math.min(event.end_time || 0, endTime);
        const startPos = maxTime > 0 ? ((event.start_time || 0) / maxTime) * 100 : 0;
        const endPos = maxTime > 0 ? (clippedEndTime / maxTime) * 100 : 0;
        const width = endPos - startPos;
        segments.push({
          id: `${agentId}-${observerId}-${i}`,
          left: startPos,
          width: width,
          startTime: event.start_time || 0,
          endTime: clippedEndTime
        });
      }
    }

    // Current playback marker (green)
    const currentPos = maxTime > 0 ? (currentTime / maxTime) * 100 : 0;
    // End record marker (red) - where this agent's recording ends
    const endRecordPos = (maxTime > 0 && endTime) ? (endTime / maxTime) * 100 : 100;

    return (
      <div className="relative w-full rounded-sm overflow-visible" style={{ height: `${barHeight}px`, background: 'rgba(100, 100, 100, 0.2)' }}>
        {/* Duration segments */}
        {segments.map(segment => (
          <div
            key={segment.id}
            className="absolute h-full rounded-sm opacity-80"
            style={{
              left: `${segment.left}%`,
              width: `${segment.width}%`,
              background: getStateColor(selectedStateType),
            }}
          />
        ))}
        {/* Point event markers */}
        {markers.map(marker => (
          <div
            key={marker.id}
            className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-full rounded-sm opacity-80 z-[2]"
            style={{
              left: `${marker.position}%`,
              background: getStateColor(selectedStateType),
            }}
          />
        ))}
        {/* Current playback position (white) */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_4px_#fff] z-[3]"
          style={{ left: `${currentPos}%` }}
        />
        {/* End record marker (gray) with time label */}
        <div 
          className="absolute top-0 bottom-0 w-0.5 bg-text-muted shadow-sm z-[3] opacity-70"
          style={{ left: `${endRecordPos}%` }}
          title={`Agent recording ends at ${endTime?.toFixed(2) || 'N/A'}s`}
        >
          {/* Time label */}
          <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-xxs text-text-muted whitespace-nowrap font-mono pointer-events-none opacity-80">
            {endTime?.toFixed(1) || 'N/A'}s
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {/* Global Timeline Scale */}
      <div className="mb-2 p-1.5 bg-white/[0.03] rounded-sm">
        <div className="text-xs text-text-secondary mb-1">
          Global Timeline (0 - {(maxTime || 0).toFixed(2)}s)
        </div>
        <div className="flex justify-between text-xxs text-text-muted mb-0.5">
          <span>0</span>
          <span>{((maxTime || 0) * 0.25).toFixed(1)}s</span>
          <span>{((maxTime || 0) * 0.5).toFixed(1)}s</span>
          <span>{((maxTime || 0) * 0.75).toFixed(1)}s</span>
          <span>{(maxTime || 0).toFixed(1)}s</span>
        </div>
        <div className="h-2 bg-gray-600/20 rounded-sm relative">
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-white"
            style={{ left: `${maxTime > 0 ? ((currentTime || 0) / maxTime) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Timeline Display */}
      <div className="insights-scrollable flex-1 overflow-y-auto bg-white/[0.03] rounded-sm p-2">
        {timelineData.length === 0 ? (
          <div className="text-text-muted text-center py-5">
            No events for {selectedStateType}
            {selectedObserver !== 'all' && ` (${selectedObserver})`}
          </div>
        ) : (
          <div>
            {timelineData.map((item: any, index: any) => (
              <div
                key={`${item.agentId}-${item.observerId}-${index}`}
                className="mb-3"
              >
                {/* Label */}
                <div className="text-xs text-text-secondary mb-1 flex justify-between items-center">
                  <div>
                    <span className="text-text-accent">{item.agentId}</span>
                    {selectedObserver === 'all' && (
                      <>
                        {' → '}
                        <span className="text-text-warning">{item.observerId}</span>
                      </>
                    )}
                  </div>
                  <span className="text-text-muted text-xxs">
                    {item.events.length} event{item.events.length !== 1 ? 's' : ''}
                  </span>
                </div>

                {/* Timeline Bar */}
                {renderTimelineBar(item.agentId, item.observerId, item.events, item.agentMaxTime)}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-2 pt-2 border-t border-white/10 text-xs text-text-secondary text-center">
        Showing {timelineData.length} agent{timelineData.length !== 1 ? 's' : ''}
        {' with '}
        {timelineData.reduce((sum: number, item: any) => sum + item.events.length, 0)} event{timelineData.reduce((sum: number, item: any) => sum + item.events.length, 0) !== 1 ? 's' : ''}
      </div>
    </>
  );
});
