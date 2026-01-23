/**
 * TimelineLegend
 * Color legend showing event types and timeline markers
 */
import React from 'react';

export const TimelineLegend = React.memo(function TimelineLegend({ selectedStateType, getStateColor }: any) {
  return (
    <div className="mb-2 p-1.5 bg-white/[0.03] rounded-sm text-xs text-text-secondary flex items-center gap-4">
      <strong className="text-text-primary">Legend:</strong>
      
      <div className="flex items-center gap-1">
        <div className="w-[30px] h-3 rounded-sm opacity-80" style={{ background: getStateColor(selectedStateType) }} />
        <span>duration</span>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-2 h-3 rounded-sm opacity-80" style={{ background: getStateColor(selectedStateType) }} />
        <span>point</span>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-0.5 h-3 bg-white" />
        <span>playhead</span>
      </div>
      
      <div className="flex items-center gap-1">
        <div className="w-0.5 h-3 bg-text-muted opacity-70 shadow-sm" />
        <span>end frame</span>
      </div>
    </div>
  );
});
