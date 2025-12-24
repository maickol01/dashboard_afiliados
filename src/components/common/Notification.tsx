import React, { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, X } from 'lucide-react';

export type NotificationType = 'success' | 'error' | 'info';

interface NotificationProps {
  message: string;
  type: NotificationType;
  onClose: () => void;
}

const Notification: React.FC<NotificationProps> = ({ message, type, onClose }) => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(true);
    const timer = setTimeout(() => {
      handleClose();
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [message, type]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 300); // Allow fade-out animation
  };

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-6 w-6 text-white" />;
      case 'error':
        return <XCircle className="h-6 w-6 text-white" />;
      case 'info':
        return <Info className="h-6 w-6 text-white" />;
    }
  };

  const getBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
        return 'bg-blue-500';
    }
  };

  if (!message) return null;

  return (
    <div 
      className={`fixed top-5 right-5 z-50 flex items-center justify-between max-w-sm p-4 text-white rounded-lg shadow-lg transition-all duration-300 transform ${visible ? 'translate-x-0 opacity-100' : 'translate-x-10 opacity-0'} ${getBackgroundColor()}`}>
      <div className="flex items-center">
        <div className="mr-3">
          {getIcon()}
        </div>
        <p className="font-medium">{message}</p>
      </div>
      <button onClick={handleClose} className="ml-4 p-1 rounded-md hover:bg-white/20">
        <X className="h-5 w-5" />
      </button>
    </div>
  );
};

export default Notification;
