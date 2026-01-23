/**
 * ViewportContextMenu
 * Context menu for adding observers via double-click in the viewport
 */
import { useEffect } from 'react';
import { useInsightsStore } from '../insightsStore';
import { useAppState } from '../../../AppState';

export default function ViewportContextMenu() {
  const contextMenu = useInsightsStore(s => s.contextMenu);
  const setContextMenu = useInsightsStore(s => s.setContextMenu);
  const setPlacementMode = useInsightsStore(s => s.setPlacementMode);
  const setPickMode = useAppState(s => s.actions.ui.setPickMode);

  useEffect(() => {
    const handleClick = () => {
      if (contextMenu.visible) {
        setContextMenu({ visible: false, x: 0, y: 0 });
      }
    };

    if (contextMenu.visible) {
      document.addEventListener('click', handleClick);
      return () => document.removeEventListener('click', handleClick);
    }
  }, [contextMenu.visible]);

  if (!contextMenu.visible) return null;

  const handleAddBox = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlacementMode('box');
    setPickMode(true);
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  const handleAddCylinder = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlacementMode('cylinder');
    setPickMode(true);
    setContextMenu({ visible: false, x: 0, y: 0 });
  };

  return (
    <div
      style={{
        position: 'fixed',
        left: `${contextMenu.x}px`,
        top: `${contextMenu.y}px`,
        background: '#181c20',
        border: '1px solid rgba(255,255,255,0.2)',
        borderRadius: '4px',
        zIndex: 1500,
        minWidth: '200px',
        overflow: 'hidden',
        fontFamily: 'system-ui, sans-serif',
        fontSize: '13px',
        color: '#8c92a4'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleAddBox}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          border: 'none',
          color: '#8c92a4',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => (e.target as HTMLElement).style.background = 'transparent'}
      >
        <span>Add Rectangle Observer</span>
      </button>
      <button
        onClick={handleAddCylinder}
        style={{
          width: '100%',
          padding: '10px 16px',
          background: 'transparent',
          border: 'none',
          color: '#8c92a4',
          textAlign: 'left',
          cursor: 'pointer',
          fontSize: '13px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}
        onMouseEnter={(e) => (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.1)'}
        onMouseLeave={(e) => (e.target as HTMLElement).style.background = 'transparent'}
      >
        <span>Add Radius Observer</span>
      </button>
    </div>
  );
}
