/**
 * ObserverContextMenu
 * Right-click context menu for observer type selection and placement start
 */
import { useState, useEffect } from 'react';
import { useAppState } from '../../../AppState';
import { useInsightsStore } from '../insightsStore';

export default function ObserverContextMenu() {
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null); // Main menu {x, y}
  const [config] = useState({
    width: 10,
    height: 4,
    depth: 1,
    radius: 5,
    rotation: 0
  });
  
  const setPickMode = useAppState(s => s.actions.ui.setPickMode);
  const setPlacementMode = useInsightsStore(s => s.setPlacementMode);
  const setPlacementConfig = useInsightsStore(s => s.setPlacementConfig);

  const handleContextMenu = (e: MouseEvent) => {
    e.preventDefault();
    
    // Show main menu
    setMenu({
      x: e.clientX,
      y: e.clientY
    });
  };

  const handleSelectType = (type: string) => {
    // Start placement immediately with default config
    setPlacementMode(type as 'box' | 'cylinder');
    setPlacementConfig(config);
    setPickMode(true);
    setMenu(null);
  };

  const closeMenu = () => {
    setMenu(null);
  };

  useEffect(() => {
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('click', closeMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('click', closeMenu);
    };
  }, []);

  return (
    <>
      {/* Context Menu - shown on double-click */}
      {menu && (
        <div
          style={{
            position: 'fixed',
            left: menu.x,
            top: menu.y,
            background: '#2b2d30',
            border: '1px solid #3e9eff',
            borderRadius: 4,
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.5)',
            zIndex: 10000,
            minWidth: 200
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div
            onClick={() => handleSelectType('box')}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              color: '#f0f0f0',
              cursor: 'pointer',
              userSelect: 'none',
              borderBottom: '1px solid #3e3f42',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(62, 158, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Add Rectangle Observer
          </div>
          <div
            onClick={() => handleSelectType('cylinder')}
            style={{
              padding: '8px 12px',
              fontSize: 12,
              color: '#f0f0f0',
              cursor: 'pointer',
              userSelect: 'none',
              transition: 'background 0.2s'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(62, 158, 255, 0.2)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Add Radius Observer
          </div>
        </div>
      )}
    </>
  );
}
