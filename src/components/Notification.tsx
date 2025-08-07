import React from 'react';

export interface NotificationProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

export const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const bgColor = type === 'success' ? 'bg-green-100 border-green-400 text-green-700' 
                 : type === 'error' ? 'bg-red-100 border-red-400 text-red-700'
                 : 'bg-blue-100 border-blue-400 text-blue-700';

  return (
    <div className={`fixed top-4 right-4 border px-4 py-3 rounded-lg shadow-lg z-50 ${bgColor}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{message}</span>
        <button 
          onClick={onClose}
          className="ml-2 text-lg font-bold opacity-70 hover:opacity-100"
        >
          ×
        </button>
      </div>
    </div>
  );
};
