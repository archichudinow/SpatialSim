import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Custom hook for making elements draggable
 * @param {Object} initialPosition - Initial position {x, y}
 * @returns {Object} - {position, dragHandleProps, isDragging}
 */
export function useDraggable(initialPosition = { x: 0, y: 0 }) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const elementStart = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: any) => {
    // Only drag on left mouse button
    if (e.button !== 0) return;
    
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    elementStart.current = { ...position };
    
    e.preventDefault();
    e.stopPropagation();
  }, [position]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.current.x;
    const deltaY = e.clientY - dragStart.current.y;

    setPosition({
      x: elementStart.current.x + deltaX,
      y: elementStart.current.y + deltaY
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Set up global mouse event listeners when dragging
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Props to spread on the drag handle element
  const dragHandleProps = {
    onMouseDown: handleMouseDown,
    style: {
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none'
    }
  };

  return {
    position,
    dragHandleProps,
    isDragging
  };
}
