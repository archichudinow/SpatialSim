/**
 * ObserverVisualization
 * 3D visualization of observer objects in the scene
 * Shows volumes and faces for all active observers
 */
import React from 'react';
import { useInsightsStore } from '../insightsStore';
import * as THREE from 'three';

export default function ObserverVisualization() {
  const observers = useInsightsStore(s => s.observers);
  const placementMode = useInsightsStore(s => s.placement.mode);
  const placementPosition = useInsightsStore(s => s.placement.position);
  const placementIsLocked = useInsightsStore(s => s.placement.isLocked);
  const showObservers = useInsightsStore(s => s.showObservers);
  
  // Don't render observers if they are hidden
  if (!showObservers) return null;
  
  return (
    <>
      {observers.map(observer => (
        <ObserverObject key={observer.id} observer={observer} />
      ))}
      
      {/* Show blue sphere during initial placement, before position is locked */}
      {placementMode && placementPosition && !placementIsLocked && (
        <PlacementPreviewSphere position={placementPosition} />
      )}
      
      {/* Show full preview after position is locked */}
      {placementMode && placementPosition && placementIsLocked && (
        <PlacementPreview mode={placementMode} position={placementPosition} />
      )}
    </>
  );
}

function PlacementPreviewSphere({ position }: { position: any }) {
  return (
    <group position={[position.x, 0.5, position.z]}>
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color="#4488ff"
          transparent 
          opacity={0.7}
        />
      </mesh>
      {/* Wireframe sphere border */}
      <mesh>
        <sphereGeometry args={[0.5, 32, 32]} />
        <meshBasicMaterial 
          color="#0066ff"
          wireframe
          transparent 
          opacity={1}
        />
      </mesh>
    </group>
  );
}

function PlacementPreview({ mode, position }: { mode: any; position: any }) {
  const config = useInsightsStore(s => s.placement.config) || {
    width: 10,
    height: 4,
    depth: 1,
    radius: 5,
    rotation: 0
  };
  
  // Show a preview with config from AppState (live updates!)
  const previewObserver = mode === 'box' 
    ? {
        type: 'box',
        id: 'preview',
        volume: {
          width: config.width,
          height: config.height,
          depth: config.depth,
          position: { x: position.x, y: config.height / 2, z: position.z },  // Collision at ground
          rotation: { x: 0, y: config.rotation * (Math.PI / 180), z: 0 }
        },
        face: {
          width: config.width,     // Face same size as box (width x height)
          height: config.height,
          offset: { x: 0, y: 0, z: 0 }  // Centered at box center
        }
      }
    : {
        type: 'cylinder',
        id: 'preview',
        volume: {
          radius: config.radius,
          height: config.height,
          position: { x: position.x, y: config.height / 2, z: position.z },  // Collision at ground
          rotation: { x: 0, y: config.rotation * (Math.PI / 180), z: 0 }
        },
        face: {
          width: config.radius * 2,   // Face width = diameter
          height: config.height       // Face height = cylinder height
        }
      };
  
  return (
    <group>
      <ObserverObject observer={previewObserver} isPreview />
    </group>
  );
}

// Memoize observer objects to prevent recreation on every render
const ObserverObject = React.memo(function ObserverObject({ observer, isPreview = false }: { observer: any; isPreview?: boolean }) {
  if (observer.type === 'box') {
    return <BoxObserver observer={observer} isPreview={isPreview} />;
  } else if (observer.type === 'cylinder') {
    return <CylinderObserver observer={observer} isPreview={isPreview} />;
  }
  return null;
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if observer config actually changed
  return prevProps.observer.id === nextProps.observer.id &&
         prevProps.isPreview === nextProps.isPreview &&
         JSON.stringify(prevProps.observer.volume) === JSON.stringify(nextProps.observer.volume) &&
         JSON.stringify(prevProps.observer.face) === JSON.stringify(nextProps.observer.face);
});

const BoxObserver = function BoxObserver({ observer, isPreview }: { observer: any; isPreview: boolean }) {
  const { volume, face } = observer;
  const opacity = isPreview ? 0.5 : 1;
  const toggleObserverPanel = useInsightsStore(s => s.toggleObserverPanel);
  const setObserverContextMenu = useInsightsStore(s => s.setObserverContextMenu);
  
  const handleClick = (e: any) => {
    if (!isPreview && e.button === 0) {
      e.stopPropagation();
      toggleObserverPanel(observer);
    }
  };
  
  const handlePointerDown = (e: any) => {
    if (!isPreview && e.button === 2) {
      e.stopPropagation();
      setObserverContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        observer: observer
      });
    }
  };
  
  return (
    <group
      position={[volume.position.x, volume.position.y + 0.5, volume.position.z]}
      rotation={[volume.rotation.x, volume.rotation.y, volume.rotation.z]}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
    >
      {/* Volume is hidden but still works for collision detection */}
      {/* The volume mesh is commented out but the collision detection still uses the volume data */}
      
      {/* Blue rectangle at the base (ground level) */}
      <mesh 
        position={[0, -volume.height / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[volume.width, volume.depth]} />
        <meshBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          transparent 
          opacity={0.3 * opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Blue rectangle border at the base */}
      <lineSegments 
        position={[0, -volume.height / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(volume.width, volume.depth)]} />
        <lineBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          linewidth={2}
        />
      </lineSegments>
      
      {/* Face plane - centered in box volume - transparent blue */}
      <mesh 
        position={[0, 0, 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[face.width, face.height]} />
        <meshBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          side={THREE.DoubleSide}
          transparent 
          opacity={0.2 * opacity} 
        />
      </mesh>
      
      {/* Face border - blue */}
      <lineSegments 
        position={[0, 0, 0]}
      >
        <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(face.width, face.height)]} />
        <lineBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          linewidth={2}
        />
      </lineSegments>
      
      {!isPreview && (
        <ObserverLabel 
          text={observer.id} 
          position={[0, volume.height / 2 + 0.5, 0]} 
        />
      )}
    </group>
  );
};

function CylinderObserver({ observer, isPreview }: { observer: any; isPreview: boolean }) {
  const { volume, face } = observer;
  const opacity = isPreview ? 0.5 : 1;
  const toggleObserverPanel = useInsightsStore(s => s.toggleObserverPanel);
  const setObserverContextMenu = useInsightsStore(s => s.setObserverContextMenu);
  
  const handleClick = (e: any) => {
    if (!isPreview && e.button === 0) {
      e.stopPropagation();
      toggleObserverPanel(observer);
    }
  };
  
  const handlePointerDown = (e: any) => {
    if (!isPreview && e.button === 2) {
      e.stopPropagation();
      setObserverContextMenu({
        visible: true,
        x: e.clientX,
        y: e.clientY,
        observer: observer
      });
    }
  };
  
  return (
    <group
      position={[volume.position.x, volume.position.y + 0.5, volume.position.z]}
      rotation={[volume.rotation.x, volume.rotation.y, volume.rotation.z]}
      onPointerOver={(e) => { e.stopPropagation(); document.body.style.cursor = 'pointer'; }}
      onPointerOut={(e) => { e.stopPropagation(); document.body.style.cursor = 'default'; }}
    >
      {/* Volume is hidden but still works for collision detection */}
      {/* The volume mesh is commented out but the collision detection still uses the volume data */}
      
      {/* Blue circle at the base (ground level) */}
      <mesh 
        position={[0, -volume.height / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        <circleGeometry args={[volume.radius, 64]} />
        <meshBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          transparent 
          opacity={0.3 * opacity}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Blue circle border at the base */}
      <lineLoop 
        key={`circle-${volume.radius}`}
        position={[0, -volume.height / 2, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            count={65}
            array={new Float32Array(
              Array.from({ length: 65 }, (_, i) => {
                const angle = (i / 64) * Math.PI * 2;
                return [
                  Math.cos(angle) * volume.radius,
                  Math.sin(angle) * volume.radius,
                  0
                ];
              }).flat()
            )}
            itemSize={3}
            args={[new Float32Array(), 3]}
          />
        </bufferGeometry>
        <lineBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          linewidth={2}
        />
      </lineLoop>
      
      {/* Face plane - rectangular, vertical, centered at cylinder center - transparent blue */}
      <mesh 
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        onClick={handleClick}
        onPointerDown={handlePointerDown}
      >
        <planeGeometry args={[face.width, face.height]} />
        <meshBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          side={THREE.DoubleSide}
          transparent 
          opacity={0.2 * opacity} 
        />
      </mesh>
      
      {/* Face border - blue */}
      <lineSegments 
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
      >
        <edgesGeometry attach="geometry" args={[new THREE.PlaneGeometry(face.width, face.height)]} />
        <lineBasicMaterial 
          color={isPreview ? "#4488ff" : "#0066ff"}
          linewidth={2}
        />
      </lineSegments>
      
      {!isPreview && (
        <ObserverLabel 
          text={observer.id} 
          position={[0, volume.height / 2 + 0.5, 0]} 
        />
      )}
    </group>
  );
}

function ObserverLabel({ text: _text, position }: { text: any; position: any }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshBasicMaterial color="#ffffff" />
      {/* TODO: Add text sprite for label */}
    </mesh>
  );
}
