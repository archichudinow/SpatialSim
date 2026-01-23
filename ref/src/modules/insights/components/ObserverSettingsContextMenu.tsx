/**
 * ObserverSettingsContextMenu
 * Right-click context menu for observer settings
 * Shows when user right-clicks on an observer
 */
import { useState, useEffect } from 'react';
import { useInsightsStore } from '../insightsStore';
import { useDraggable } from '../ui/useDraggable';
import { SliderControl } from '../../../components/ui/SliderControl';
import { useSliderStyles } from '../../../hooks/useSliderStyles';

export default function ObserverSettingsContextMenu() {
  const observerContextMenu = useInsightsStore(s => s.observerContextMenu);
  const setObserverContextMenu = useInsightsStore(s => s.setObserverContextMenu);
  const updateObserver = useInsightsStore(s => s.updateObserver);
  const removeObserver = useInsightsStore(s => s.removeObserver);
  const removeNewlyCreatedObserver = useInsightsStore(s => s.removeNewlyCreatedObserver);
  
  const [settings, setSettings] = useState<any>(null);
  
  // Initialize draggable position when menu opens
  const { position, dragHandleProps, isDragging } = useDraggable({
    x: observerContextMenu.x,
    y: observerContextMenu.y
  });
  
  // Update draggable position when menu position changes
  useEffect(() => {
    if (observerContextMenu.visible && !isDragging) {
      // Reset position when menu opens
      position.x = observerContextMenu.x;
      position.y = observerContextMenu.y;
    }
  }, [observerContextMenu.visible, observerContextMenu.x, observerContextMenu.y]);
  
  // Initialize settings when observer changes
  useEffect(() => {
    if (observerContextMenu.observer) {
      const observer = observerContextMenu.observer;
      setSettings({
        name: observer?.name || observer?.id || '',
        width: observer?.volume?.width || 10,
        height: observer?.volume?.height || 4,
        depth: observer?.volume?.depth || 1,
        radius: observer?.volume?.radius || 5,
        rotation: (observer?.volume?.rotation?.y || 0) * (180 / Math.PI)
      });
    }
  }, [observerContextMenu.observer]);

  // Use shared slider styles hook instead of inline CSS injection
  useSliderStyles('leva-slider-style-context', 'leva-slider-context');

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (observerContextMenu.visible && e.button === 0) {
        // Only close on left click, check if click is outside the menu
        const menu = document.getElementById('observer-settings-context-menu');
        if (menu && e.target && !menu.contains(e.target as Node)) {
          closeMenu();
        }
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      // Always prevent default right-click menu when our menu is open
      if (observerContextMenu.visible) {
        e.preventDefault();
        // Don't close the menu on right-click, just prevent default browser menu
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && observerContextMenu.visible) {
        closeMenu();
      }
    };

    if (observerContextMenu.visible) {
      // Use mousedown instead of click to check button type
      document.addEventListener('mousedown', handleClick);
      document.addEventListener('contextmenu', handleContextMenu);
      document.addEventListener('keydown', handleEscape);
      return () => {
        document.removeEventListener('mousedown', handleClick);
        document.removeEventListener('contextmenu', handleContextMenu);
        document.removeEventListener('keydown', handleEscape);
      };
    }
  }, [observerContextMenu.visible]);

  if (!observerContextMenu.visible || !observerContextMenu.observer || !settings) {
    return null;
  }

  const observer = observerContextMenu.observer;
  const isBox = observer.type === 'box';
  const isCylinder = observer.type === 'cylinder';

  const closeMenu = () => {
    setObserverContextMenu({ visible: false, x: 0, y: 0, observer: null });
  };

  const updateConfig = (updates: any) => {
    if (!settings) return;
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    
    // Update the actual observer in real-time for preview
    const updatedObserver = {
      name: newSettings.name,
      volume: {
        ...observer.volume,
        ...(isBox && {
          width: newSettings.width,
          height: newSettings.height,
          depth: newSettings.depth
        }),
        ...(isCylinder && {
          radius: newSettings.radius,
          height: newSettings.height
        }),
        position: {
          x: observer.volume.position.x,
          y: newSettings.height / 2,
          z: observer.volume.position.z
        },
        rotation: {
          x: observer.volume.rotation?.x || 0,
          y: newSettings.rotation * (Math.PI / 180),
          z: observer.volume.rotation?.z || 0
        }
      },
      face: {
        ...observer.face,
        ...(isBox && {
          width: newSettings.width,
          height: newSettings.height
        }),
        ...(isCylinder && {
          width: newSettings.radius * 2,
          height: newSettings.height
        })
      }
    };
    
    // Update observer in real-time
    updateObserver(observer.id, updatedObserver);
  };

  const handleApply = () => {
    // Changes are already applied in real-time via updateConfig
    // Remove from newly created set
    removeNewlyCreatedObserver(observer.id);
    // Close the menu
    closeMenu();
  };

  const handleRemove = () => {
    removeObserver(observer.id);
    removeNewlyCreatedObserver(observer.id);
    closeMenu();
  };

  return (
    <div
      id="observer-settings-context-menu"
      style={{
        position: 'fixed',
        left: `${position.x}px`,
        top: `${position.y}px`,
        background: '#181c20',
        color: 'white',
        padding: '0',
        borderRadius: '4px',
        border: '1px solid rgba(255,255,255,0.2)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: '11px',
        lineHeight: '1.5',
        minWidth: '280px',
        maxWidth: '320px',
        userSelect: 'none',
        maxHeight: '600px',
        overflowY: 'auto',
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Draggable Header */}
      <div
        {...dragHandleProps}
        style={{
          ...(dragHandleProps.style || {}),
          padding: '8px 12px',
          background: '#292d39',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '4px 4px 0 0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'move',
          userSelect: 'none' as const
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: '12px' }}>
          Observer Settings
        </span>
        <span style={{ fontSize: '10px', opacity: 0.5 }}>
          {observer.id}
        </span>
      </div>
      
      {/* Content */}
      <div style={{ padding: '12px 16px' }}>
      {/* Name */}
      <div style={{ marginBottom: 12 }}>
        <label style={{ display: 'block', marginBottom: 4, fontSize: 10, fontWeight: '500', color: '#f0f0f0' }}>
          Name:
        </label>
        <input
          type="text"
          value={settings.name}
          onChange={(e) => updateConfig({ name: e.target.value })}
          style={{
            width: '100%',
            padding: '0 8px',
            height: '24px',
            background: '#535760',
            color: '#f0f0f0',
            border: 'none',
            borderRadius: 2,
            fontSize: 11,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, "Roboto Mono", monospace',
            outline: 'none',
            boxSizing: 'border-box'
          }}
        />
      </div>

      {/* Volume Settings */}
      {isBox && (
        <>
          <SliderControl
            label="Width"
            value={settings.width}
            min={1}
            max={40}
            step={0.5}
            unit="m"
            onChange={(value) => updateConfig({ width: value })}
            className="leva-slider-context"
          />

          <SliderControl
            label="Height"
            value={settings.height}
            min={1}
            max={40}
            step={0.5}
            unit="m"
            onChange={(value) => updateConfig({ height: value })}
            className="leva-slider-context"
          />

          <SliderControl
            label="Depth"
            value={settings.depth}
            min={0.5}
            max={20}
            step={0.25}
            unit="m"
            onChange={(value) => updateConfig({ depth: value })}
            className="leva-slider-context"
          />
        </>
      )}

      {isCylinder && (
        <>
          <SliderControl
            label="Radius"
            value={settings.radius}
            min={1}
            max={40}
            step={0.5}
            unit={`m (⌀ ${(settings.radius * 2).toFixed(1)}m)`}
            onChange={(value) => updateConfig({ radius: value })}
            className="leva-slider-context"
          />

          <SliderControl
            label="Height"
            value={settings.height}
            min={1}
            max={40}
            step={0.5}
            unit="m"
            onChange={(value) => updateConfig({ height: value })}
            className="leva-slider-context"
          />
        </>
      )}

      {/* Rotation */}
      <SliderControl
        label="Rotation"
        value={settings.rotation}
        min={0}
        max={360}
        step={5}
        unit="°"
        onChange={(value) => updateConfig({ rotation: value })}
        className="leva-slider-context"
      />

      {/* Observer Info */}
      <div style={{
        marginBottom: 12,
        paddingBottom: 12,
        borderBottom: '1px solid rgba(255,255,255,0.1)',
        fontSize: 10,
        color: 'rgba(255,255,255,0.7)'
      }}>
        <div style={{ marginBottom: 4 }}>
          <strong>Type:</strong> {observer.type}
        </div>
        <div>
          <strong>ID:</strong> {observer.id}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: 5 }}>
        <button
          onClick={handleApply}
          style={{
            flex: 1,
            padding: '6px 10px',
            cursor: 'pointer',
            background: '#007bff',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            fontSize: 11,
            fontWeight: 'bold'
          }}
        >
          Apply
        </button>
        <button
          onClick={handleRemove}
          style={{
            flex: 1,
            padding: '6px 10px',
            cursor: 'pointer',
            background: '#dc3545',
            border: 'none',
            borderRadius: 4,
            color: 'white',
            fontSize: 11
          }}
        >
          Remove
        </button>
      </div>
      </div>
    </div>
  );
}
