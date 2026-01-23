/**
 * ObserverViewportPanel
 * Wrapper component that renders in 3D viewport above observer
 * Contains ObserverInfo content
 */
import { useThree } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import ObserverInfo from './ObserverInfo';

export default function ObserverViewportPanel({ observer, visible }: { observer: any; visible: boolean }) {
  const { camera: _camera } = useThree();
  
  if (!visible || !observer) {
    return null;
  }

  // Calculate position relative to observer ground origin (bottom), not center
  // This way the panel stays fixed when height changes
  const groundY = observer.volume.position.y - observer.volume.height / 2;
  const position = [
    observer.volume.position.x,
    groundY + 150,
    observer.volume.position.z
  ];

  // Simple distance-based scaling for perspective camera
  const distanceFactor = 120;

  const observerName = observer.name || `${observer.type}_${observer.id}`;

  const handlePointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    e.stopPropagation();
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <Html
      position={position as [number, number, number]}
      center={false}
      distanceFactor={distanceFactor}
      style={{ pointerEvents: 'auto' }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onWheel={handleWheel}
    >
      <div
        style={{
          background: '#181c20',
          color: '#8c92a4',
          borderRadius: '4px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontSize: '13px',
          lineHeight: '1.5',
          minWidth: '280px',
          userSelect: 'none',
          overflow: 'hidden',
          transform: 'translateX(-50%)',
          position: 'relative',
          bottom: 0
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            background: '#292d39'
          }}
        >
          {/* Observer Name */}
          <div
            style={{
              fontWeight: 'bold',
              fontSize: '12px',
              flex: 1,
              textAlign: 'left',
              padding: '0 8px'
            }}
          >
            {observerName}
          </div>
        </div>

        {/* Content */}
        <ObserverInfo observer={observer} />
      </div>
    </Html>
  );
}
