import React, { useState, useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';

interface WindowManagerProps {
  children: React.ReactNode;
}

const WindowManager: React.FC<WindowManagerProps> = ({ children }) => {
  const { windows } = useWindowStore();
  const [isOverviewMode, setIsOverviewMode] = useState(false);

  // Mission Control style overview mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F3 or Ctrl+Up Arrow for Mission Control
      if (e.key === 'F3' || (e.ctrlKey && e.key === 'ArrowUp')) {
        e.preventDefault();
        setIsOverviewMode(!isOverviewMode);
      }
      // Escape to exit overview mode
      if (e.key === 'Escape' && isOverviewMode) {
        setIsOverviewMode(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOverviewMode]);

  // Hot corners detection
  useEffect(() => {
    const hotCornersEnabled = localStorage.getItem('weave-hot-corners') === 'true';
    if (!hotCornersEnabled) return;

    let cornerTimer: NodeJS.Timeout;
    
    const handleMouseMove = (e: MouseEvent) => {
      const threshold = 5;
      const isTopLeft = e.clientX <= threshold && e.clientY <= threshold;
      const isTopRight = e.clientX >= window.innerWidth - threshold && e.clientY <= threshold;

      if (isTopLeft || isTopRight) {
        clearTimeout(cornerTimer);
        cornerTimer = setTimeout(() => {
          setIsOverviewMode(true);
        }, 500);
      } else {
        clearTimeout(cornerTimer);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(cornerTimer);
    };
  }, []);

  if (isOverviewMode) {
    const visibleWindows = windows.filter(w => w.isVisible && !w.isMinimized);
    
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          zIndex: 10000,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '20px',
          padding: '60px 40px',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
        onClick={() => setIsOverviewMode(false)}
      >
        <div style={{
          position: 'absolute',
          top: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: 'white',
          fontSize: '24px',
          fontWeight: '600',
          textAlign: 'center',
        }}>
          Mission Control
          <div style={{ fontSize: '14px', fontWeight: '400', marginTop: '8px', opacity: 0.7 }}>
            Click a window to focus, press Escape to exit
          </div>
        </div>
        
        {visibleWindows.map((window) => (
          <div
            key={window.id}
            style={{
              width: '280px',
              height: '200px',
              backgroundColor: 'white',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              transform: 'scale(1)',
              boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'scale(1.05)';
              e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'scale(1)';
              e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.3)';
            }}
            onClick={(e) => {
              e.stopPropagation();
              setIsOverviewMode(false);
              // Focus the window
              const { focusWindow } = useWindowStore.getState();
              focusWindow(window.id);
            }}
          >
            {/* Mini title bar */}
            <div style={{
              height: '30px',
              backgroundColor: 'rgba(245, 245, 247, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: '500',
              color: '#1d1d1f',
              borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
            }}>
              {window.title}
            </div>
            
            {/* Mini window content */}
            <div style={{
              height: '170px',
              backgroundColor: '#f8f9fa',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '40px',
              opacity: 0.6,
            }}>
              {window.app === 'Files' && '📁'}
              {window.app === 'Terminal' && '💻'}
              {window.app === 'Settings' && '⚙️'}
              {window.app === 'Calculator' && '🧮'}
              {window.app === 'Text Editor' && '📝'}
              {!['Files', 'Terminal', 'Settings', 'Calculator', 'Text Editor'].includes(window.app) && '📱'}
            </div>
          </div>
        ))}
        
        {visibleWindows.length === 0 && (
          <div style={{
            color: 'white',
            fontSize: '18px',
            opacity: 0.7,
            textAlign: 'center',
          }}>
            No open windows
          </div>
        )}
      </div>
    );
  }

  return <>{children}</>;
};

export default WindowManager;
