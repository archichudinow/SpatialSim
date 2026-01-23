/**
 * TimelineFilters
 * Filter controls for event type and observer selection
 */
import React from 'react';
import { useInsightsStore } from '../../insightsStore';

export const TimelineFilters = React.memo(function TimelineFilters({ 
  selectedStateType, 
  selectedObserver, 
  stateTypes, 
  observerIds,
  onChangeStateType,
  onChangeObserver 
}: any) {
  return (
    <div className="mb-section">
      <div className="flex gap-2.5 mb-2">
        {/* State Type */}
        <div className="flex-1">
          <label className="block mb-1 text-xs text-text-secondary">
            State Type:
          </label>
          <select
            value={selectedStateType}
            onChange={(e) => {
              onChangeStateType(e.target.value);
              useInsightsStore.getState().setSelectedEventType(e.target.value);
            }}
            className="w-full bg-[#535760] border-none text-[#8c92a4] px-2 h-6 rounded-sm text-sm font-mono cursor-pointer outline-none"
          >
            {stateTypes.map((type: any) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>

        {/* Observer Filter */}
        <div className="flex-1">
          <label className="block mb-1 text-xs text-text-secondary">
            Observer:
          </label>
          <select
            value={selectedObserver}
            onChange={(e) => onChangeObserver(e.target.value)}
            className="w-full bg-[#535760] border-none text-[#8c92a4] px-2 h-6 rounded-sm text-sm font-mono cursor-pointer outline-none"
          >
            {observerIds.map((id: any) => (
              <option key={id} value={id}>{id === 'all' ? 'All Observers' : id}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
});
