/**
 * TimelineHeader
 * Header with export buttons and collapse toggle
 */
import React from 'react';

export const TimelineHeader = React.memo(function TimelineHeader({ 
  collapsed, 
  onToggleCollapse, 
  onExportAll, 
  onExportReport,
  dragHandleProps 
}: any) {
  return (
    <div 
      {...dragHandleProps}
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '10px',
        paddingBottom: '8px',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        ...dragHandleProps.style
      }}
    >
      <div style={{ fontWeight: 'bold', fontSize: '13px' }}>
        📈 Timeline View
      </div>
      <div style={{ display: 'flex', gap: '6px' }}>
        <button
          onClick={onExportAll}
          title="Export all timelines to PDF"
          style={{
            background: 'rgba(68, 136, 255, 0.2)',
            border: '1px solid rgba(68, 136, 255, 0.4)',
            color: '#4488ff',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📄 Export All
        </button>
        <button
          onClick={onExportReport}
          title="Export comprehensive report with insights"
          style={{
            background: 'rgba(68, 255, 136, 0.2)',
            border: '1px solid rgba(68, 255, 136, 0.4)',
            color: '#4f4',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          📊 Full Report
        </button>
        <button
          onClick={onToggleCollapse}
          style={{
            background: 'rgba(255, 255, 255, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#fff',
            padding: '4px 8px',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '11px'
          }}
        >
          {collapsed ? '▼ Expand' : '▲ Collapse'}
        </button>
      </div>
    </div>
  );
});
