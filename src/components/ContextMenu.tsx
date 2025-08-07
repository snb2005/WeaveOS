import React, { useEffect, useRef } from 'react';

interface ContextMenuItem {
  id: string;
  label: string;
  icon?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

interface ContextMenuProps {
  items: ContextMenuItem[];
  position: { x: number; y: number };
  onClose: () => void;
  visible: boolean;
}

const ContextMenu: React.FC<ContextMenuProps> = ({ items, position, onClose, visible }) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [visible, onClose]);

  if (!visible) return null;

  // Adjust position to keep menu within viewport
  const adjustedPosition = { ...position };
  if (menuRef.current) {
    const rect = menuRef.current.getBoundingClientRect();
    if (position.x + 200 > window.innerWidth) {
      adjustedPosition.x = window.innerWidth - 200;
    }
    if (position.y + rect.height > window.innerHeight) {
      adjustedPosition.y = window.innerHeight - rect.height;
    }
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        top: adjustedPosition.y,
        left: adjustedPosition.x,
        zIndex: 10000,
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '8px',
        border: '1px solid rgba(0, 0, 0, 0.1)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
        minWidth: '180px',
        padding: '4px',
        fontSize: '13px',
        animation: 'contextMenuFadeIn 0.15s ease-out',
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return (
            <div
              key={`separator-${index}`}
              style={{
                height: '1px',
                backgroundColor: 'rgba(0, 0, 0, 0.1)',
                margin: '4px 8px',
              }}
            />
          );
        }

        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: item.disabled ? 'default' : 'pointer',
              color: item.disabled ? '#999' : '#1d1d1f',
              backgroundColor: 'transparent',
              transition: 'background-color 0.1s ease',
            }}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            onMouseEnter={(e) => {
              if (!item.disabled) {
                e.currentTarget.style.backgroundColor = 'rgba(0, 122, 255, 0.1)';
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
          >
            {item.icon && (
              <span style={{ fontSize: '14px', width: '16px', textAlign: 'center' }}>
                {item.icon}
              </span>
            )}
            <span style={{ flex: 1 }}>{item.label}</span>
          </div>
        );
      })}
      
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes contextMenuFadeIn {
            from {
              opacity: 0;
              transform: scale(0.95) translateY(-4px);
            }
            to {
              opacity: 1;
              transform: scale(1) translateY(0);
            }
          }
        `
      }} />
    </div>
  );
};

export default ContextMenu;
