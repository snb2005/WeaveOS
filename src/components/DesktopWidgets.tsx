import React, { useState, useEffect } from 'react';
import { useWindowStore } from '../store/windowStore';
import Files from '../apps/Files';
import Terminal from '../apps/Terminal';
import Settings from '../apps/Settings';

interface WidgetProps {
  title: string;
  children: React.ReactNode;
  width?: number;
  height?: number;
  position: { x: number; y: number };
}

const Widget: React.FC<WidgetProps> = ({ title, children, width = 250, height = 150, position }) => {
  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        backgroundColor: 'rgba(20, 20, 20, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '12px',
        border: '2px solid rgba(255, 255, 255, 0.3)',
        padding: '16px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5)',
        color: 'white',
        overflow: 'hidden',
        userSelect: 'none',
        zIndex: 10,
        pointerEvents: 'auto',
        fontFamily: 'Ubuntu, sans-serif',
      }}
    >
      <h3 style={{ 
        margin: '0 0 12px 0', 
        fontSize: '14px', 
        fontWeight: '600',
        color: 'white',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        paddingBottom: '8px'
      }}>
        {title}
      </h3>
      <div style={{ height: 'calc(100% - 32px)', overflow: 'hidden' }}>
        {children}
      </div>
    </div>
  );
};

const ClockWidget: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

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
      second: '2-digit',
      hour12: false 
    });
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric',
      month: 'long', 
      day: 'numeric' 
    });
  };

  return (
    <div style={{ textAlign: 'center', padding: '8px' }}>
      <div style={{ 
        fontSize: '28px', 
        fontWeight: '300', 
        fontFamily: 'monospace',
        marginBottom: '12px',
        color: '#00ff88',
        textShadow: '0 0 10px rgba(0, 255, 136, 0.3)'
      }}>
        {formatTime(currentTime)}
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255, 255, 255, 0.7)',
        lineHeight: '1.4'
      }}>
        {formatDate(currentTime)}
      </div>
    </div>
  );
};

const SystemInfoWidget: React.FC = () => {
  const [cpuUsage] = useState(Math.floor(Math.random() * 40) + 10);
  const [ramUsage] = useState(Math.floor(Math.random() * 60) + 20);
  const [uptime, setUptime] = useState(0);

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      setUptime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const ProgressBar = ({ label, value, color }: { label: string; value: number; color: string }) => (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        marginBottom: '4px',
        fontSize: '11px',
        color: 'rgba(255, 255, 255, 0.7)'
      }}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div style={{ 
        width: '100%', 
        height: '4px', 
        backgroundColor: 'rgba(255, 255, 255, 0.2)', 
        borderRadius: '2px',
        overflow: 'hidden'
      }}>
        <div style={{ 
          width: `${value}%`, 
          height: '100%', 
          backgroundColor: color,
          transition: 'width 0.3s ease'
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: '8px' }}>
      <ProgressBar label="CPU" value={cpuUsage} color="#3b82f6" />
      <ProgressBar label="Memory" value={ramUsage} color="#10b981" />
      <div style={{ 
        fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.7)',
        marginTop: '12px',
        textAlign: 'center'
      }}>
        Uptime: {formatUptime(uptime)}
      </div>
    </div>
  );
};

const WeatherWidget: React.FC = () => {
  const [weather] = useState({
    location: 'San Francisco',
    temperature: 22,
    condition: 'Partly Cloudy',
    icon: '⛅'
  });

  return (
    <div style={{ padding: '12px', textAlign: 'center' }}>
      <div style={{ fontSize: '36px', marginBottom: '12px' }}>
        {weather.icon}
      </div>
      <div style={{ 
        fontSize: '20px', 
        fontWeight: '500',
        marginBottom: '6px',
        color: 'white'
      }}>
        {weather.temperature}°C
      </div>
      <div style={{ 
        fontSize: '12px', 
        color: 'rgba(255, 255, 255, 0.7)',
        marginBottom: '6px',
        lineHeight: '1.2'
      }}>
        {weather.condition}
      </div>
      <div style={{ 
        fontSize: '11px', 
        color: 'rgba(255, 255, 255, 0.5)'
      }}>
        {weather.location}
      </div>
    </div>
  );
};

const QuickActionsWidget: React.FC = () => {
  const { openWindow } = useWindowStore();

  const handleOpenApp = (appName: string) => {
    const apps = {
      'Files': () => openWindow('files', { 
        title: 'Files', 
        content: <Files />, 
        top: 100, 
        left: 100, 
        width: 1000, 
        height: 700 
      }),
      'Terminal': () => openWindow('terminal', { 
        title: 'Terminal', 
        content: <Terminal />, 
        top: 120, 
        left: 120, 
        width: 800, 
        height: 500 
      }),
      'Settings': () => openWindow('settings', { 
        title: 'Settings', 
        content: <Settings />, 
        top: 80, 
        left: 80, 
        width: 900, 
        height: 600 
      }),
    };
    
    if (apps[appName as keyof typeof apps]) {
      apps[appName as keyof typeof apps]();
    }
  };

  const ActionButton = ({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) => (
    <button
      style={{
        width: '100%',
        padding: '12px',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        border: 'none',
        borderRadius: '8px',
        cursor: 'pointer',
        fontSize: '12px',
        textAlign: 'center',
        color: 'white',
        transition: 'all 0.2s ease',
        marginBottom: '8px',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
        e.currentTarget.style.transform = 'scale(1.02)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        e.currentTarget.style.transform = 'scale(1)';
      }}
      onClick={onClick}
    >
      <div style={{ fontSize: '18px', marginBottom: '4px' }}>{icon}</div>
      <div>{label}</div>
    </button>
  );

  return (
    <div style={{ padding: '8px' }}>
      <ActionButton 
        icon="📁" 
        label="Files" 
        onClick={() => handleOpenApp('Files')} 
      />
      <ActionButton 
        icon="💻" 
        label="Terminal" 
        onClick={() => handleOpenApp('Terminal')} 
      />
      <ActionButton 
        icon="⚙️" 
        label="Settings" 
        onClick={() => handleOpenApp('Settings')} 
      />
    </div>
  );
};


const NotesWidget: React.FC = () => {
  const [notes, setNotes] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setNotes(value);
    localStorage.setItem('weave-notes', value);
  };

  useEffect(() => {
    const savedNotes = localStorage.getItem('weave-notes');
    if (savedNotes) {
      setNotes(savedNotes);
    }
  }, []);

  return (
    <div style={{ padding: '8px', height: '100%' }}>
      {isEditing ? (
        <textarea
          value={notes}
          onChange={handleNotesChange}
          onBlur={() => setIsEditing(false)}
          autoFocus
          placeholder="Click to add notes..."
          style={{
            width: '100%',
            height: '90%',
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '11px',
            color: 'white',
            resize: 'none',
            fontFamily: 'inherit'
          }}
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          style={{
            width: '100%',
            height: '90%',
            fontSize: '11px',
            color: notes ? 'rgba(255, 255, 255, 0.7)' : 'rgba(255, 255, 255, 0.4)',
            cursor: 'text',
            lineHeight: '1.4',
            overflow: 'hidden',
            fontStyle: notes ? 'normal' : 'italic'
          }}
        >
          {notes || 'Click to add notes...'}
        </div>
      )}
    </div>
  );
};

const DesktopWidgets: React.FC = () => {
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      pointerEvents: 'none', 
      zIndex: 10,
      background: 'transparent'
    }}>
      <Widget title="🕐 Clock" position={{ x: 50, y: 160 }} width={240} height={130}>
        <ClockWidget />
      </Widget>

      <Widget title="📊 System" position={{ x: 310, y: 160 }} width={260} height={180}>
        <SystemInfoWidget />
      </Widget>

      <Widget title="🌤️ Weather" position={{ x: 50, y: 310 }} width={200} height={150}>
        <WeatherWidget />
      </Widget>

      <Widget title="🚀 Quick Actions" position={{ x: 270, y: 360 }} width={160} height={330}>
        <QuickActionsWidget />
      </Widget>

      <Widget title="📝 Notes" position={{ x: 450, y: 360 }} width={240} height={180}>
        <NotesWidget />
      </Widget>
    </div>
  );
};

export default DesktopWidgets;
