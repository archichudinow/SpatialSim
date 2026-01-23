/**
 * DraggablePanel Component
 * Reusable draggable panel container with header and close button
 */
import { ReactNode } from 'react';
import { useDraggable } from '../../modules/insights/ui/useDraggable';

interface DraggablePanelProps {
  title: string;
  children: ReactNode;
  initialPosition?: { x: number; y: number };
  onClose?: () => void;
  visible?: boolean;
  width?: number;
  maxHeight?: string;
  className?: string;
  headerStyle?: React.CSSProperties;
}

export function DraggablePanel({
  title,
  children,
  initialPosition = { x: 100, y: 100 },
  onClose,
  visible = true,
  width = 400,
  maxHeight = '80vh',
  className = '',
  headerStyle = {}
}: DraggablePanelProps) {
  const { position, dragHandleProps, isDragging } = useDraggable(initialPosition);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: `${width}px`,
        maxHeight,
        background: '#1a1d21',
        border: '1px solid #333',
        borderRadius: '8px',
        overflow: 'hidden',
        zIndex: 10000,
        boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
        cursor: isDragging ? 'grabbing' : 'default',
        userSelect: isDragging ? 'none' : 'auto',
      }}
      className={className}
    >
      {/* Header */}
      <div
        {...dragHandleProps}
        style={{
          padding: '10px 12px',
          background: '#252830',
          borderBottom: '1px solid #333',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'grab',
          ...headerStyle
        }}
      >
        <span style={{ 
          fontSize: '13px', 
          fontWeight: 500, 
          color: '#f0f0f0',
          userSelect: 'none'
        }}>
          {title}
        </span>
        {onClose && (
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#aaa',
              cursor: 'pointer',
              fontSize: '18px',
              padding: '0 4px',
              lineHeight: 1,
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#aaa'}
          >
            ×
          </button>
        )}
      </div>

      {/* Content */}
      <div style={{ 
        padding: '12px',
        maxHeight: `calc(${maxHeight} - 50px)`,
        overflow: 'auto'
      }}>
        {children}
      </div>
    </div>
  );
}
