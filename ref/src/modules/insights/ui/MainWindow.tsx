/**
 * MainWindow
 * Unified tabbed window for all insights UI components
 */
import React, { useState, useEffect } from 'react';
import { useInsightsStore } from '../insightsStore';
import { useDraggable } from './useDraggable';
import { PanelTimeline } from './PanelTimeline';

export default function MainWindow() {
  const insightsWindowOpen = useInsightsStore(s => s.insightsWindowOpen);
  const setInsightsWindowOpen = useInsightsStore(s => s.setInsightsWindowOpen);
  
  const [activeTab, setActiveTab] = useState('timeline');
  const [windowHeight, setWindowHeight] = useState(600);
  const [isResizing, setIsResizing] = useState(false);
  
  const { position, dragHandleProps, isDragging: _isDragging } = useDraggable({ 
    x: window.innerWidth / 2 - 500, 
    y: 100 
  });

  // Inject CSS to hide scrollbars while maintaining scroll functionality
  useEffect(() => {
    const styleId = 'insights-hide-scrollbars';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        /* Hide scrollbars for Chrome, Safari and Opera */
        .insights-scrollable::-webkit-scrollbar {
          display: none;
        }
        
        /* Hide scrollbars for IE, Edge and Firefox */
        .insights-scrollable {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const tabs = [
    { id: 'timeline', label: 'Timeline', icon: '' },
    { id: 'aggregates', label: 'Aggregates', icon: '' },
    { id: 'insights', label: 'Insights', icon: '' }
  ];

  const handleResizeStart = (e: React.MouseEvent) => {
    setIsResizing(true);
    e.preventDefault();
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing) return;
    const maxHeight = window.innerHeight - position.y - 20; // Leave 20px margin at bottom
    const newHeight = Math.max(300, Math.min(maxHeight, e.clientY - position.y));
    setWindowHeight(newHeight);
  };

  const handleResizeEnd = () => {
    setIsResizing(false);
  };

  // Set up resize listeners
  React.useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleResize);
      document.addEventListener('mouseup', handleResizeEnd);
      return () => {
        document.removeEventListener('mousemove', handleResize);
        document.removeEventListener('mouseup', handleResizeEnd);
      };
    }
  }, [isResizing]);

  if (!insightsWindowOpen) return null;

  return (
    <div 
      onPointerMove={(e) => e.stopPropagation()}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerUp={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
      className="fixed w-[1000px] bg-bg-secondary text-text-primary rounded-md font-sans text-sm z-[2000] flex flex-col shadow-2xl overflow-hidden"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        height: `${windowHeight}px`,
      }}>
      {/* Header with drag handle */}
      <div 
        {...dragHandleProps}
        className="flex justify-between items-center p-3 bg-[#292d39] border-b border-white/10 font-medium tracking-wide text-base"
        style={{ ...(dragHandleProps.style || {}), cursor: 'move', userSelect: 'none' as const }}
      >
        <div>INSIGHTS</div>
        <button
          onClick={() => setInsightsWindowOpen(false)}
          className="bg-transparent border-none text-text-primary cursor-pointer text-lg p-0 px-1 leading-none hover:text-text-accent"
        >
          ×
        </button>
      </div>

      {/* Tab Navigation */}
      <div className="flex border-b border-white/10 bg-black/20">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2.5 px-4 border-none transition-all flex items-center justify-center gap-1.5
              ${activeTab === tab.id
                ? 'bg-white/10 border-b-2 border-text-accent text-text-accent font-semibold'
                : 'bg-transparent border-b-2 border-transparent text-text-secondary hover:text-text-primary'
              }
            `}
          >
            <span>{tab.icon}</span>
            <span>{tab.label.replace(/^[^\s]+ /, '')}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="insights-scrollable flex-1 overflow-auto p-4">
        {activeTab === 'timeline' && <PanelTimeline embedded={true} />}
        {activeTab === 'aggregates' && (
          <div className="flex items-center justify-center h-full text-white/50 text-base">
            Aggregates - Coming Soon
          </div>
        )}
        {activeTab === 'insights' && (
          <div className="flex items-center justify-center h-full text-white/50 text-base">
            Insights - Coming Soon
          </div>
        )}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className={`
          h-2 cursor-ns-resize border-t border-white/10 flex items-center justify-center transition-all
          ${isResizing ? 'bg-accent-blue/30' : 'bg-transparent hover:bg-white/5'}
        `}
      >
        <div className="w-10 h-0.5 bg-white/30 rounded-sm" />
      </div>
    </div>
  );
}
