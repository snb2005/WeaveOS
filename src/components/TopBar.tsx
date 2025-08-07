import React, { useState, useEffect } from 'react';

interface TopBarProps {}

const TopBar: React.FC<TopBarProps> = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);
  const [showControlCenter, setShowControlCenter] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '32px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        fontSize: '13px',
        fontWeight: '500',
        color: 'white',
        userSelect: 'none',
      }}
    >
      {/* Left side - Apple menu and app menu */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button 
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '16px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          title="Apple Menu"
        >
          
        </button>
        
        <span style={{ fontWeight: '600' }}>Weave OS</span>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            File
          </button>
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            Edit
          </button>
          <button 
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '13px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            View
          </button>
        </div>
      </div>

      {/* Right side - System indicators */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        {/* Control Center */}
        <button 
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => setShowControlCenter(!showControlCenter)}
          title="Control Center"
        >
          ⚙️
        </button>

        {/* Battery */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
          <span>🔋</span>
          <span>87%</span>
        </div>

        {/* Wi-Fi */}
        <span style={{ fontSize: '14px' }} title="Wi-Fi">📶</span>

        {/* Sound */}
        <span style={{ fontSize: '14px' }} title="Volume">🔊</span>

        {/* Date and Time */}
        <button 
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '13px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
            textAlign: 'right',
            lineHeight: '1.2',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => setShowNotificationCenter(!showNotificationCenter)}
          title="Notification Center"
        >
          <div>{formatDate(currentTime)}</div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>{formatTime(currentTime)}</div>
        </button>

        {/* Notification Center Icon */}
        <button 
          style={{
            background: 'none',
            border: 'none',
            color: 'white',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '4px 6px',
            borderRadius: '4px',
            transition: 'all 0.2s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => setShowNotificationCenter(!showNotificationCenter)}
          title="Notification Center"
        >
          📱
        </button>
      </div>

      {/* Notification Center Panel */}
      {showNotificationCenter && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            right: '16px',
            width: '320px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#333',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Notifications</h3>
          <div style={{ color: '#666', textAlign: 'center', padding: '20px 0' }}>
            No new notifications
          </div>
        </div>
      )}

      {/* Control Center Panel */}
      {showControlCenter && (
        <div 
          style={{
            position: 'absolute',
            top: '100%',
            right: '120px',
            width: '280px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '12px',
            padding: '16px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            color: '#333',
          }}
        >
          <h3 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600' }}>Control Center</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button style={{
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              🔆 Brightness
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              🔊 Volume
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              📶 Wi-Fi
            </button>
            <button style={{
              padding: '12px',
              backgroundColor: 'rgba(0, 0, 0, 0.1)',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              textAlign: 'center',
            }}>
              🌙 Do Not Disturb
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopBar;
