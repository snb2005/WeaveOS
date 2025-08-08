import React, { useState, useCallback, useEffect, useRef } from 'react';
import { UbuntuIcon } from './UbuntuIcon';

interface WindowProps {
  id: string;
  title: string;
  children: React.ReactNode;
  initialTop?: number;
  initialLeft?: number;
  width?: number;
  height?: number;
  zIndex?: number;
  onClose: (id: string) => void;
  onFocus: (id: string) => void;
  onMinimize: (id: string) => void;
  isMinimized?: boolean;
  isFullscreen?: boolean;
  onToggleFullscreen: (id: string) => void;
}

const Window: React.FC<WindowProps> = ({
  id,
  title,
  children,
  initialTop = 100,
  initialLeft = 100,
  width = 600,
  height = 400,
  zIndex = 1,
  onClose,
  onFocus,
  onMinimize,
  isMinimized = false,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  const windowRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ top: initialTop, left: initialLeft });
  const [size, setSize] = useState({ width, height });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [resizeDirection, setResizeDirection] = useState<string>('');

  // Handle viewport resize for responsiveness
  useEffect(() => {
    const handleViewportResize = () => {
      if (isFullscreen) return;

      const maxWidth = window.innerWidth;
      const maxHeight = window.innerHeight - 32; // Account for top bar

      // Adjust position if window is out of bounds
      const newLeft = Math.max(0, Math.min(position.left, maxWidth - size.width));
      const newTop = Math.max(32, Math.min(position.top, maxHeight - size.height));

      if (newLeft !== position.left || newTop !== position.top) {
        setPosition({ top: newTop, left: newLeft });
      }

      // Adjust size if window is too large
      const newWidth = Math.min(size.width, maxWidth);
      const newHeight = Math.min(size.height, maxHeight);

      if (newWidth !== size.width || newHeight !== size.height) {
        setSize({ width: newWidth, height: newHeight });
      }
    };

    window.addEventListener('resize', handleViewportResize);
    return () => window.removeEventListener('resize', handleViewportResize);
  }, [position, size, isFullscreen]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle shortcuts when this window is focused (highest z-index)
      if (windowRef.current && document.activeElement && windowRef.current.contains(document.activeElement)) {
        // Cmd/Ctrl + M to minimize
        if ((e.metaKey || e.ctrlKey) && e.key === 'm') {
          e.preventDefault();
          onMinimize(id);
        }
        // Cmd/Ctrl + W to close
        if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
          e.preventDefault();
          onClose(id);
        }
        // F11 or Cmd/Ctrl + Enter to toggle fullscreen
        if (e.key === 'F11' || ((e.metaKey || e.ctrlKey) && e.key === 'Enter')) {
          e.preventDefault();
          onToggleFullscreen(id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [id, onMinimize, onClose, onToggleFullscreen]);

  // Dispatch resize events when window size or fullscreen state changes
  useEffect(() => {
    if (windowRef.current) {
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);
    }
  }, [size, isFullscreen]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.window-controls')) {
      return;
    }

    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.left,
      y: e.clientY - position.top,
    });
    onFocus(id);
    e.preventDefault();
  }, [position, id, onFocus]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging && !isFullscreen) {
      const newLeft = Math.max(0, Math.min(window.innerWidth - size.width, e.clientX - dragStart.x));
      const newTop = Math.max(32, Math.min(window.innerHeight - size.height, e.clientY - dragStart.y));
      setPosition({ top: newTop, left: newLeft });
    }

    if (isResizing) {
      const deltaX = e.clientX - resizeStart.x;
      const deltaY = e.clientY - resizeStart.y;

      let newWidth = resizeStart.width;
      let newHeight = resizeStart.height;
      let newLeft = position.left;
      let newTop = position.top;

      if (resizeDirection.includes('right')) {
        newWidth = Math.max(200, Math.min(window.innerWidth - position.left, resizeStart.width + deltaX));
      }
      if (resizeDirection.includes('left')) {
        newWidth = Math.max(200, resizeStart.width - deltaX);
        newLeft = Math.max(0, position.left + (resizeStart.width - newWidth));
      }
      if (resizeDirection.includes('bottom')) {
        newHeight = Math.max(150, Math.min(window.innerHeight - position.top, resizeStart.height + deltaY));
      }
      if (resizeDirection.includes('top')) {
        newHeight = Math.max(150, resizeStart.height - deltaY);
        newTop = Math.max(32, position.top + (resizeStart.height - newHeight));
      }

      setSize({ width: newWidth, height: newHeight });
      setPosition({ top: newTop, left: newLeft });
    }
  }, [isDragging, isResizing, dragStart, resizeStart, resizeDirection, position, size, isFullscreen]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeDirection('');
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  const handleResizeStart = useCallback((e: React.MouseEvent, direction: string) => {
    e.stopPropagation();
    setIsResizing(true);
    setResizeDirection(direction);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
    onFocus(id);
  }, [size, id, onFocus]);

  if (isMinimized) {
    console.log(`🪟 Window ${id} is minimized, not rendering`);
    return null;
  }

  const windowStyle = isFullscreen ? {
    top: 32,
    left: 0,
    width: window.innerWidth,
    height: window.innerHeight - 32,
    zIndex
  } : {
    top: position.top,
    left: position.left,
    width: size.width,
    height: size.height,
    zIndex
  };

  // Debug logging
  console.log(`🪟 Window ${id} rendering at:`, windowStyle);
  console.log(`🪟 Window ${id} props:`, { isMinimized, isFullscreen, title, zIndex });

  return (
    <div
      ref={windowRef}
      style={{
        position: 'fixed',
        top: isFullscreen ? 32 : position.top, // Account for top bar when fullscreen
        left: isFullscreen ? 0 : position.left,
        width: isFullscreen ? window.innerWidth : size.width,
        height: isFullscreen ? (window.innerHeight - 32 - 80) : size.height, // Account for top bar and dock
        zIndex: zIndex,
        boxShadow: isFullscreen ? 'none' : '0 20px 50px rgba(0, 0, 0, 0.25)',
        borderRadius: isFullscreen ? '0px' : '12px',
        overflow: 'hidden',
        backgroundColor: 'var(--bg-primary)',
        border: isFullscreen ? 'none' : '1px solid var(--border-color)',
        transition: isFullscreen ? 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' : 'box-shadow 0.2s ease',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)'
      }}
      onClick={() => onFocus(id)}
    >
      {/* Title Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 16px',
          backgroundColor: 'var(--bg-secondary)',
          borderBottom: '1px solid var(--border-color)',
          fontSize: '14px',
          cursor: isFullscreen ? 'default' : 'move',
          userSelect: 'none',
          height: '44px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          position: 'relative',
          zIndex: 1000, // Ensure title bar is always on top
        }}
        onMouseDown={isFullscreen ? undefined : handleMouseDown}
      >
        {/* Ubuntu-style Window Controls */}
        <div style={{ display: 'flex', gap: '4px', alignItems: 'center', position: 'relative', zIndex: 1001 }}>
          {/* Minimize */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMinimize(id);
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: 'rgba(226, 221, 221, 0.94)', // brighter by default
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1002
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(226, 221, 221, 0.94)';
            }}
            title="Minimize"
          >
            <UbuntuIcon name="minimize" size="w-4 h-4" className="text-white" />
          </button>

          {/* Maximize/Restore */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFullscreen(id);
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: 'rgba(226, 221, 221, 0.94)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1002
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.35)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(226, 221, 221, 0.94)';
            }}
            title={isFullscreen ? "Restore" : "Maximize"}
          >
            <UbuntuIcon name="maximize" size="w-4 h-4" className="text-white" />
          </button>

          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose(id);
            }}
            style={{
              width: '20px',
              height: '20px',
              borderRadius: '4px',
              backgroundColor: 'rgba(255, 0, 0, 0.85)',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative',
              zIndex: 1002
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.85)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.)';
            }}
            title="Close"
          >
            <UbuntuIcon name="close" size="w-4 h-4" className="text-white" />
          </button>
        </div>


        {/* Window Title */}
        <div
          style={{
            fontWeight: '500',
            color: 'var(--text-primary)',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '13px',
            pointerEvents: 'none' // Allow clicks to pass through to drag handler
          }}
        >
          {title}
        </div>

        {/* Right side placeholder for symmetry */}
        <div style={{ width: '60px' }} />
      </div>

      {/* Window Body */}
      <div
        style={{
          width: '100%',
          height: `${(isFullscreen ? (window.innerHeight - 32 - 80) : size.height) - 44}px`,
          backgroundColor: 'var(--bg-primary)',
          overflow: 'auto'
        }}
      >
        {children}
      </div>

      {/* Resize Handles - Only show when not fullscreen */}
      {!isFullscreen && (
        <>
          {/* Corner handles */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '12px',
              height: '12px',
              cursor: 'nw-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'top-left')}
          />
          <div
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '12px',
              height: '12px',
              cursor: 'ne-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'top-right')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: '12px',
              height: '12px',
              cursor: 'sw-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom-left')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: '12px',
              height: '12px',
              cursor: 'se-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom-right')}
          />

          {/* Edge handles */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: '12px',
              right: '12px',
              height: '6px',
              cursor: 'n-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'top')}
          />
          <div
            style={{
              position: 'absolute',
              bottom: 0,
              left: '12px',
              right: '12px',
              height: '6px',
              cursor: 's-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'bottom')}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              top: '12px',
              bottom: '12px',
              width: '6px',
              cursor: 'w-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'left')}
          />
          <div
            style={{
              position: 'absolute',
              right: 0,
              top: '12px',
              bottom: '12px',
              width: '6px',
              cursor: 'e-resize',
              zIndex: 10
            }}
            onMouseDown={(e) => handleResizeStart(e, 'right')}
          />
        </>
      )}
    </div>
  );
};

export default Window;
